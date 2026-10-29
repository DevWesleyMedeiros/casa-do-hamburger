# ADR-0006 — Dashboard administrativo de analytics

Data: 29/10/2026. Status: aceito para implementação; validação integral pendente.

## Contexto, problema e requisitos

RF-44 precisa de métricas operacionais de loja única, sem cobrança real (RF-46).
O schema usa `Order.total Int` em centavos, `createdAt DateTime` UTC e cinco status.
ADR-0004 exige autorização atual no banco e isolamento do cache por sessão.
Transferir pedidos completos repetiria PII e regras monetárias no navegador.

## Alternativas e decisão

Preservar monólito modular: route/middlewares/controller/service/repository/Prisma.
Frontend: página/componentes/hook TanStack Query/serviço HTTP. Sem dependência de
gráficos, microserviço, cache distribuído ou nova persistência.

Alternativas: cálculo no frontend transfere todos os pedidos e perde consistência;
`groupBy` Prisma funciona para status, mas não agrupa por expressão de dia IANA.
Adotar uma única consulta SQL parametrizada via Prisma `$queryRaw`, agrupada por
dia e status. PostgreSQL conta e soma; serviço preenche dias/status vazios e calcula
ticket com BigInt. Até 366 dias × 5 status, sem N+1 e sem pedidos individuais em JS.
Uma única instrução fornece snapshot consistente mesmo durante transições concorrentes.

## DTO, dinheiro e tempo

DTO explícito: `period {from,to,timeZone}`, `orders {total,byStatus,nonCancelled}`,
`amounts {orderValueInCents,averageTicketInCents}`, `series [{date,orders,orderValueInCents}]`.
Contagens e somas são validadas antes de converter BigInt a inteiros seguros JSON.
Ticket arredonda meio centavo para cima usando apenas inteiros. Cancelados contam,
mas não compõem soma nem denominador. Soft delete não retira pedidos históricos.
Nunca denominar a soma como receita confirmada; pagamento continua simulado.

Datas civis ISO obrigatórias entre 2000 e 2100, `[from,to)`, 1–366 dias.
PostgreSQL converte meias-noites IANA `America/Sao_Paulo` para UTC e agrupa no mesmo
fuso, respeitando horário de verão histórico. `DateTime` Prisma usa timestamp sem
timezone contendo UTC: a consulta explicita essa conversão. Série enumera rótulos
civis em UTC sem interpretar esses rótulos como instantes de negócio.

## Segurança, performance e cache

`requireAuth` consulta conta atual antes de `requiredAdmin`. Validar filtros com Zod
depois da autorização; SQL usa parâmetros, não concatenação. DTO não contém PII.
`Cache-Control: private, no-store` também nas falhas deste router. Nenhuma escrita.
Índices existentes de usuário/status são preservados; não há índice de createdAt.
Medir volume sintético, EXPLAIN, latência e tamanho antes de propor migration.
Intervalo máximo limita retorno, mas não a quantidade de pedidos dentro do período;
reavaliar índice/timeout e pré-agregação se medições justificarem.

TanStack Query é fonte única: chave privada inclui usuário, privilégio, geração e
filtros. Reusar Axios/sessionRequests para abort e rejeição de respostas obsoletas.
Stale time 30s evita consultas repetidas na navegação sem esconder mudanças locais:
criação, cancelamento e transição invalidam analytics. Refoco revalida dados stale.
Sem polling; mudanças de outro dispositivo aparecem por refoco ou atualização manual.
Logout/troca/expiração limpam prefixo privado. 403 oculta dados mesmo havendo cache.

## Testes, consequências e revisão futura

Vitest: datas, limites, zero, status, ticket e serialização; RTL: filtros, estados e
isolamento do hook. Supertest/PostgreSQL descartável: RBAC, agregação, fronteiras
de fuso, dados históricos e mudanças de status. Playwright/Chromium: oito jornadas
reais, usuário admin/comum, logout e viewport mobile; CI com PostgreSQL temporário.
Fixtures e launcher ficam fora do runtime de produção, sem endpoint de seed/bypass.
Guarda existente vincula autorização temporária ao hash da conexão descartável.

Limites: status atual não reconstrói histórico de transições; métricas não são
contabilidade. Sem recebimentos financeiros, comparação com períodos ou tempo real.
Rever quando houver pagamento real, roles adicionais, outro fuso, mudança na política
de soft delete ou medições que mostrem consultas caras. RF-44 permanece em andamento
até comprovar DoD, CI e merge. Evidências ficam no relatório técnico da feature.

Fontes: [Prisma 7: raw queries](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries),
[Playwright: webServer](https://playwright.dev/docs/test-webserver).
