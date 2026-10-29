# Correções de segurança e proteção de dados — 28/10/2026

Escopo: pedido anexado para `fix/security-and-data-protection`, examinado na árvore
local atual. Não foram executados comandos Git; branch e relação com o commit
`82e811f` não foram verificadas. Não houve acesso a banco, criação de infraestrutura,
migration, alteração de workflow, segredo, permissão, commit, PR ou deploy.

## Evidências e correções

| Achado comprovado no código inicial                                                                              | Local da correção                                                                                        | Resultado e referência                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integração usava `DATABASE_URL` e executava limpezas amplas sem guarda                                           | `back-end/src/shared/utils/testDatabaseSafety.ts:12`                                                     | Falha antes de construir adapter/Prisma sem destino exclusivo e autorização temporária. RF/RNF de testabilidade, seções 14/15                                                     |
| Senha e consumo do token executavam em `Promise.all`, sem atomicidade nem disputa condicional                    | `back-end/src/repositories/passwordResetToken.repository.ts:15`                                          | Lock por usuário, consumo condicional e senha na mesma transação; emissão concorrente também serializada. RF-09/56/57, RN-AUTH-13–16                                              |
| Pedidos não eram removidos no logout; queries privadas tinham chaves globais; respostas antigas podiam persistir | `front-end/src/shared/services/session.ts:9`                                                             | Prefixo privado, chave por conta/geração, abort e rejeição de respostas antigas, limpeza de mutations e modais. RF-05/06/36, RNF-10                                               |
| Header exibia sucesso e navegava mesmo após falhar logout                                                        | `front-end/src/components/header/Header.tsx:37`                                                          | Erro mantém a interface autenticada; sucesso depende da confirmação do servidor. Logout no backend também funciona para cookie expirado                                           |
| Serviços de atualização/exclusão de carrinho resolviam `ApiError` como sucesso                                   | `front-end/src/shared/services/api/update/updateCartItemService.ts:7`                                    | Promises rejeitam; rollback usa snapshot, cancelamento de query e geração da sessão. RF-26, RN-CART-04                                                                            |
| Autorização confiava em `admin` do JWT e não verificava existência/desativação                                   | `back-end/src/middlewares/authMiddlewares.ts:31`                                                         | HS256 e claims obrigatórias; consulta a `User.admin/deletedAt` por requisição. Login local também rejeita usuário desativado e conta somente Google. RN-AUTH-07, RN-RBAC-02/03/05 |
| Leitura do carrinho ocorria antes da transação de checkout                                                       | `back-end/src/repositories/order.respository.ts:48`                                                      | Leitura/snapshot/pedido/pagamento/limpeza sob lock compartilhado com todas as escritas do carrinho. RF-25/30/31/32/33, RN-CART-02/06, RN-ORDER-01/04                              |
| Escritas de status eram incondicionais depois de validar uma leitura anterior                                    | `back-end/src/repositories/order.respository.ts:104`                                                     | Compara estado esperado na escrita; conflito 409 sem sobrescrever vencedor. Máquina de estados e posse preservadas. RF-38/40, RN-ORDER-05/06                                      |
| Login aceitava provedor Firebase não Google e podia substituir UID por e-mail verificado                         | `back-end/src/repositories/googleIdentity.repository.ts:12`                                              | Exige Google/e-mail verificado; vínculo existente não muda de UID; conta local associada preserva método local. RF-52/53/54/55, RN-AUTH-08/11                                     |
| Ambiente validava só Cloudinary; nome era interpolado diretamente no HTML de reset                               | `back-end/src/config/runtimeEnvironment.ts:48` e `back-end/src/services/email/resendEmail.service.ts:29` | Validação de variáveis antes de conectar/escutar, erros por nome sem valores; escape de texto/atributos nos e-mails. RNF-02/21/24/27, RN-SEC-02                                   |

O campo `User.password` e os testes correspondentes já estavam corrigidos em relação
à análise antiga. Express 5 já encaminha rejeições de handlers assíncronos; não foi
repetida a alegação antiga de requisição travada por ausência do wrapper. O controller
agora também usa `asyncHandler`, e falhas operacionais no forgot-password preservam
a resposta genérica. Não se atribuiu CVE a dependências.

## Avaliação de CSRF

O callback do CORS existente **já enviava um erro ao Express para Origin não permitido**,
interrompendo a requisição antes das rotas. Portanto não era apenas omissão do header
de resposta e não se comprovou CSRF pela ausência de token. Cookies de produção usam
`SameSite=None; Secure`; desenvolvimento usa `Lax`. As rotas de escrita são mutáveis
via POST/PATCH/DELETE, inclusive upload multipart e logout.

A defesa adicional em `middlewares/mutationOrigin.ts` exige Origin autorizado quando
presente, rejeita Origin `null`/hostil, verifica Referer quando Origin está ausente e
rejeita contextos Fetch Metadata sem comprovação ou cross-site sem Origin. Clientes
sem headers de navegador continuam compatíveis. Isso não protege contra XSS nem uma
origem autorizada comprometida. Testes locais da política não substituem verificação
no navegador/deploy real e revisão de eventual proxy que remova headers.

## Como liberar a integração — somente pelo mantenedor

Nenhum destino descartável foi comprovado nesta execução. Não foi criado arquivo de
autorização nem preenchido `TEST_DATABASE_URL`. Não se tentou outro banco como alternativa.

1. Provisionar e comprovar uma instância PostgreSQL descartável **exclusiva desta tarefa**,
   sem dados reais, sem volumes compartilhados e sem túnel/proxy para bancos existentes.
   Usar banco e usuário exatos `casa_security_20261028`, acessíveis só por loopback.
   Registrar a evidência de provisionamento e destruição ao encerrar. Nome e flags
   isoladamente não comprovam isolamento.
2. Revisar/aplicar as migrations existentes somente nessa nova instância. Inspecionar
   o destino efetivo do comando Prisma: ele ainda usa `DATABASE_URL`; apontar essa
   variável explicitamente para a instância descartável, sem copiar a configuração
   de desenvolvimento. Não executar os comandos contra um ambiente existente.
3. Para executar os testes, disponibilizar `NODE_ENV=test` e `TEST_DATABASE_URL` com
   a conexão exata descartável. A guarda rejeita hosts remotos, outros nomes/usuários,
   fragmentos e parâmetros além de `schema=public`; não usa `DATABASE_URL` como fallback.
4. Após comprovar o destino, criar **localmente**, dentro de `back-end/`, o arquivo
   `.test-database-authorization.json` com este formato (substituir os marcadores):

   ```json
   {
     "task": "security-and-data-protection",
     "disposable": true,
     "connectionSha256": "SHA256_DA_STRING_EXATA_DE_TEST_DATABASE_URL_EM_HEXADECIMAL",
     "expiresAt": "DATA_UTC_FUTURA_EM_ISO_8601"
   }
   ```

   A autorização vale no máximo 24 horas. Ela atesta a revisão humana do destino;
   o hash impede reutilização acidental com outra conexão. Não é uma prova remota
   sobre a instância PostgreSQL e não deve ser fabricada sem as verificações acima.
   O arquivo não contém senha, mas é local e temporário; não deve ser versionado.
   Nenhuma regra de ignore foi alterada nesta entrega.

   Exemplo para calcular **somente o hash**, sem imprimir a conexão:

   ```sh
   node --input-type=module -e "import {createHash} from 'node:crypto'; const value=process.env.TEST_DATABASE_URL; if(!value) process.exit(1); console.log(createHash('sha256').update(value).digest('hex'));"
   ```

5. Executar em `back-end/`: `bun run test src/tests/integration`. A seleção efetiva é
   `src/tests/integration`; o script atual `test:integration` aponta a outro caminho.
   Depois, `bun run test` para a suíte completa. Os testes importam `safety.ts` e
   simulam Resend, verificação Firebase e upload Cloudinary; não precisam de credenciais
   reais desses serviços. Valores fictícios de Cloudinary podem ser necessários para
   a geração de URLs nos DTOs, nunca para chamadas externas.
6. Remover a autorização local e destruir a instância descartável ao terminar.

## Proposta exata de ajuste da CI

O workflow **não foi modificado**. A CI atual fornece apenas `DATABASE_URL` e, por isso,
passará a falhar na guarda antes da integração. Isso é intencional: não se mantém uma
exceção implícita que permitiria limpezas em uma conexão não atestada.

Proposta para revisão do mantenedor em `.github/workflows/ci.yml`:

- No serviço PostgreSQL efêmero do job backend, trocar `POSTGRES_USER` e `POSTGRES_DB`
  para `casa_security_20261028`; atualizar o usuário do healthcheck.
- Manter a senha exclusivamente descartável desse container; disponibilizar uma URL
  correspondente em `DATABASE_URL` para migrations e em `TEST_DATABASE_URL` para testes.
- Adicionar `NODE_ENV: test` ao ambiente do job.
- Antes dos testes, gerar a autorização com `task/disposable`, o SHA-256 de
  `TEST_DATABASE_URL` e `expiresAt` de `Date.now()+3600000`, usando Node e `writeFileSync`.
  Executar a geração dentro de `back-end/`, depois de verificar que o serviço temporário
  correto está em execução; nunca usar a mesma autorização em outro ambiente.
- Preservar instalação frozen, geração/validação Prisma, migrations exclusivamente no
  serviço efêmero, lint, formatação, testes e build. Não adicionar deploy a esta tarefa.

Passo proposto para gerar o arquivo, após a revisão do serviço efêmero (não executado):

```yaml
- name: Autorizar banco descartável do job
  run: |
    node --input-type=module <<'NODE'
    import { createHash } from 'node:crypto';
    import { writeFileSync } from 'node:fs';
    const connection = process.env.TEST_DATABASE_URL;
    if (!connection) throw new Error('TEST_DATABASE_URL ausente');
    writeFileSync('.test-database-authorization.json', JSON.stringify({
      task: 'security-and-data-protection',
      disposable: true,
      connectionSha256: createHash('sha256').update(connection).digest('hex'),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    }));
    NODE
```

## Sessões — pendência de política/schema

JWTs anteriores ao reset **ainda podem autenticar por até sete dias**, desde que o
usuário continue ativo. A consulta do privilégio atual reduz o problema de autorização,
mas não revoga esses tokens. A [ADR-0005](../architecture/adr/0005-proposta-revogacao-sessoes-apos-reset.md)
contém a proposta exata de `sessionVersion`, SQL da migration e pontos de alteração.
Não se alterou schema nem se executou migration. É uma pendência relevante antes de
considerar o ciclo de sessão completo. A [ADR-0004](../architecture/adr/0004-concorrencia-dados-e-fronteiras-de-sessao.md)
registra as decisões já implementadas e seus limites de concorrência.

## Verificações

| Verificação executada                                                                   | Resultado                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend: `bun --no-env-file --no-install run test src/tests/unit` (inclui pretest/lint) | **39 testes aprovados**, seis arquivos, sem conexão ao banco                                                                                                                                                        |
| Frontend: `bun --no-env-file --no-install run test:run`                                 | **9 testes aprovados**, dois arquivos; inclui logout com falha, troca A/B, resposta antiga abortada, expiração e rollback tardio                                                                                    |
| Backend: `bun --no-env-file --no-install run build`                                     | Aprovado                                                                                                                                                                                                            |
| Frontend: `bun --no-env-file --no-install run build`                                    | Aprovado; avisos de tempo de plugins e bundle principal de aproximadamente 607 kB (>500 kB), sem alteração dos limites/configurações                                                                                |
| TypeScript adicional dos 11 arquivos de teste backend                                   | Zero diagnósticos; config lida por API TypeScript, inclusão temporária de testes e `src/express.d.ts`, sem editar configuração nem executar testes de banco                                                         |
| `node scripts/quality-gate.mjs --scope all`                                             | **Reprovado**: lint dos dois pacotes aprovado; formatação global falhou em 55 arquivos backend, 73 frontend e três compartilhados **não alterados nesta tarefa**. Nenhum arquivo alterado foi listado nesses avisos |

Prettier foi aplicado somente aos arquivos autorizados, com a configuração de cada
pacote. A conferência final **passou em todos os arquivos de código alterados** e nos
três documentos novos. As cercas Markdown, links locais e referências arquivo/linha
dos quatro documentos afetados também foram conferidos, sem problemas. O documento
de regras preservou a formatação histórica, com revisão estrutural em vez de
reformatação global. Não foi executado `format` indiscriminado, pois seu script escreve no pacote
inteiro. Os scripts `format:check` foram executados pelo gate. A divergência global
de formatação permanece para decisão do mantenedor, inclusive em arquivos de
configuração que esta tarefa proíbe alterar.

A primeira execução de Vitest no sandbox falhou ao renomear arquivos temporários.
Usou-se TEMP/TMP somente no processo apontando para `node_modules/.cache/security-vitest`.
Supertest precisou de execução autorizada fora do sandbox para portas efêmeras de
loopback; nenhum desses testes unitários importa conexão real com banco. O hook não
foi executado: o gate tentou apenas `sh -n`, mas o shell falhou ao iniciar no sandbox
(código Windows 3221225794). A repetição isolada de `sh -n .githooks/pre-commit` fora
do sandbox foi **aprovada (código 0)**. Isso não muda a reprovação global por formatação.

Integração e E2E contra banco/deploy não foram executados por falta de comprovação de
ambiente descartável. Os novos testes de PostgreSQL são código revisável, não resultados
de execução. A suíte testa consumo simultâneo, emissão concorrente, rollback parcial,
checkout simultâneo, adição/quantidade concorrente, rollback de checkout e disputa de
status com barreira determinística entre leituras.

## Outras pendências do mantenedor

- Disponibilizar a branch indicada e conferir as alterações preexistentes/staging;
  não foi consultado nem alterado o Git.
- Revisar os requisitos de ambiente antes de publicar: segredo JWT com pelo menos 32
  bytes, URLs/protocolos válidos, FRONTEND_URL como origem HTTPS em produção, credenciais
  de Firebase/Cloudinary e remetente/chave Resend configurados. Valores não foram exibidos.
- Revisar contas legadas `GOOGLE` com senha residual; não houve atualização em massa.
- Executar secret scanning sobre a árvore e **todo o histórico** em ambiente autorizado.
  Não foi feita análise do histórico, e esta entrega não atesta ausência de segredos.
- Se o scanner ou evidência de exposição apontar credenciais comprometidas, planejar
  revogação/rotação com os respectivos provedores. Não houve rotação nesta execução.
- Validar cookies, CORS, Fetch Metadata e fluxos de duas contas em navegador no deploy
  autorizado. Cancelar uma requisição no cliente não desfaz uma mutação que já fez
  commit no servidor; os endpoints continuam responsáveis por posse e autorização.

Instruções encontradas: `AGENTS.md` da raiz, `.codex/agents/code-review-agent.toml` e
`.githooks/pre-commit`. Não foram encontrados AGENTS aninhados/override nem
`.claude/agents/code-review-agent.md`. Não se criaram instruções/hook nem se verificou
a ativação local do hook. `.git/hooks/` continha somente arquivos `.sample`, sem
hook ativo nesse diretório. A única CI encontrada foi `.github/workflows/ci.yml`, sem
job ativo de deploy. Esta entrega não certifica o sistema como “seguro”.
