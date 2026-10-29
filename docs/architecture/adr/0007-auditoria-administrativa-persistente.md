# ADR-0007 — Auditoria administrativa persistente

Data: 29/10/2026. Status: implementada e validada localmente; evidências e situação da CI no relatório RF-45.
Referências: RF-45, RF-19/35/38/40/41/42, RN-RBAC, RNF-14/15/16/20 e ADR-0004/0006.

## Contexto e decisão

A loja precisa rastrear ações administrativas que alteram catálogo e pedidos.
Registrar no console perde histórico e não garante vínculo com o commit da operação.
Adotar tabela PostgreSQL `AuditLog`, Prisma e serviço reutilizável, sem Redis,
broker, captura genérica de requisições ou cópia de objetos completos.

Preservar routes → controllers → services → repositories → Prisma. O service
constrói eventos permitidos; o repository executa a alteração e recebe uma função
para gravar o evento no mesmo `TransactionClient`. Nenhuma transação aninhada.
Falha no INSERT da auditoria aborta a alteração de banco e responde erro genérico.

Cobertura inicial: `PRODUCT_CREATED`, `PRODUCT_DELETED`, `ORDER_STATUS_CHANGED`
e `ORDER_CANCELLED`. Cancelamento por qualquer endpoint administrativo gera
somente `ORDER_CANCELLED`. Cancelamento pelo cliente não é evento administrativo.
Edição de produtos continua ausente: não se cria evento operacional fictício.
O contrato discriminado permite acrescentar ações em evolução versionada futura.

## Modelo, acesso e minimização

`id` UUID, `actorId` obrigatório, `action`/`entityType` enums, `entityId`, JSONs
`before`/`after` opcionais, `requestId` UUID do servidor e `createdAt` do banco.
Índices: data/id, ator/data/id, ação/data/id e entidade/id/data/id.
O ator vem da sessão validada; o cliente não escolhe ator, timestamp ou requestId.

`actorId` é identificação histórica estável, sem FK e sem nome/e-mail copiados.
Assim exclusão/desativação do usuário não remove nem muda a identificação do ator.
Não se expõe perfil atual ao consultar eventos. Produto guarda somente nome,
categoria e preço em centavos; pedido guarda somente status anterior/posterior.
IDs das entidades não são FKs: o registro sobrevive à exclusão da entidade.
Senha, hash, JWT, cookies, credenciais, tokens, endereços e dados de clientes
não pertencem à lista de campos auditáveis. O mapper de saída reaplica a seleção.

`GET /admin/audit-logs` exige sessão e admin atual no banco, com `private, no-store`
inclusive nas falhas. DTO mínimo sem perfil ou payload HTTP. Filtros estritos por
ação, tipo/ID de entidade, ator e intervalo `[from,to)` de instantes ISO UTC, até
366 dias quando informado. UI identifica os limites como datas UTC.
Paginação por cursor `(createdAt,id)` descendente, limite padrão 20 e máximo 100,
sem contagem global. Cursor não concede acesso nem substitui filtros/autorização.
Não há rotas públicas de criação, alteração ou exclusão de eventos.

## Atomicidade e concorrência

Status mantém compare-and-set do estado esperado, conforme ADR-0004. Só a atualização
vencedora insere evento; conflito ou repetição inválida não gera evento de sucesso.
Exclusão concorrente de produto tem somente uma exclusão e um evento vencedores.
Criação repetida de produto continua criando entidades distintas: esta versão não
introduz chave de idempotência para operações que hoje criam novos produtos.

Upload ao Cloudinary ocorre antes da transação PostgreSQL. Não há rollback distribuído:
uma falha posterior pode deixar imagem órfã; revisão/limpeza externa exige operação
específica. Exclusão de produto mantém o comportamento atual de não remover a imagem
remota. Não se promete atomicidade com Cloudinary nem com e-mails. Notificações de
pedido continuam best-effort depois do commit; falha nelas não desfaz auditoria.

## Retenção, integridade e observabilidade

Política inicial: retenção operacional de 365 dias. Não há expurgo automático;
remoção após esse prazo é tarefa operacional separada, autorizada e documentada,
incluindo a política de backups. Sem execução dessa tarefa, registros podem exceder
o prazo; monitorar volume e formalizar a rotina antes de uso operacional prolongado.

Fluxos comuns são append-only. A API e o repository não oferecem UPDATE/DELETE.
Isso não produz imutabilidade absoluta: credenciais privilegiadas, SQL direto e
restauração de backups podem alterar registros. Permissões específicas de banco,
assinatura criptográfica e armazenamento WORM são evoluções, não garantias desta versão.

`X-Request-Id` gerado pelo servidor permite correlação sem guardar headers ou IP.
Falhas de escrita emitem código fixo e requestId, sem erro bruto/payload/segredos.
Disponibilidade da auditoria passa a ser necessária para mutações administrativas.
Avaliar latência de inserção, falhas e volume antes de propor indexação adicional,
observabilidade externa ou fila. Nada disso exige mudança externa nesta entrega.

## Testes e limites

Vitest: ações, metadados permitidos, DTO, paginação, filtros e rejeições.
Supertest/PostgreSQL exclusivamente descartável: RBAC atual, persistência,
concorrência, repetição, rollback real, ausência de dados privados e paginação
com empate de timestamps. Playwright: login real, criação com upload sintético,
transição/cancelamento, consulta/filtros/páginas, mobile e troca de sessão.
Somente provedores externos são substituídos; não há endpoint de bypass no runtime.
CI mantém instalação congelada, migrations em serviço descartável e seus guards.
Não há CD ativo nem autorização para migrar banco persistente nesta tarefa.

Fontes: [transações Prisma ORM 7](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions)
e [diálogo Base UI](https://base-ui.com/react/components/dialog).
