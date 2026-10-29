# Integração da branch de segurança — 29/10/2026

Origem: `fix/security-and-data-protection`. Destino: `develop`.

## Auditoria local

- O levantamento inicial apresentou 191 entradas no status. Havia 41 arquivos
  com diferenças de conteúdo, 21 arquivos novos e uma exclusão já staged.
  As demais entradas eram diferenças de finais de linha sem mudança de conteúdo
  após a normalização do Git. Não representam 191 mudanças funcionais.
- A origem e o destino remoto estavam no mesmo commit inicial (`28dda06`).
- A exclusão preexistente de `.codex/agents/code-review-agent.toml` foi
  preservada e separada das alterações da aplicação.
- Foram inspecionados diffs, scripts, hooks, configurações, requisitos, ADRs,
  template de PR, contratos e testes afetados.
- Uma busca por padrões de chaves privadas, tokens e URLs de banco não encontrou
  novos segredos nos arquivos candidatos. As correspondências encontradas estavam
  em placeholders de `back-end/.env.example`. Essa busca não equivale a um scanner
  especializado sobre todo o histórico. Builds, dependências, credenciais locais
  e arquivos de autorização temporária não pertencem aos commits.

## Pré-commit

O hook ativo é `.githooks/pre-commit`, configurado por `core.hooksPath`.
Ele executa `node scripts/quality-gate.mjs --scope all` contra a árvore de trabalho.

O erro antigo de 55/73 arquivos não se reproduziu: os dois pacotes passaram em
lint e Prettier. A execução atual falhou nos três arquivos compartilhados devido
a CRLF. Foram formatados com as regras existentes, e `.gitattributes` passou a
preservar LF nos arquivos de texto. A validação do shell também foi repetida fora
do sandbox, que impedia sua inicialização. O gate completo passou com código zero.

Os commits devem manter hooks ativos. Como o hook verifica a árvore de trabalho,
seu resultado isolado não comprova que cada snapshot parcial está completo;
o staging foi inspecionado por responsabilidade e a CI valida o resultado publicado.

## Validações executadas

| Verificação                                                                                         | Resultado local                                        |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Gate compartilhado: lint, Prettier dos dois pacotes, três arquivos compartilhados e sintaxe do hook | Aprovado                                               |
| Backend: `bun --no-env-file --no-install run test src/tests/unit`                                   | 6 arquivos, 39 testes aprovados                        |
| Frontend: `bun --no-env-file --no-install run test:run`                                             | 2 arquivos, 9 testes aprovados                         |
| Backend: `bun --no-env-file --no-install run build`                                                 | Aprovado; inclui compilação TypeScript                 |
| Frontend: `bun --no-env-file --no-install run build`                                                | Aprovado; inclui TypeScript e Vite                     |
| `git diff --check`                                                                                  | Aprovado antes dos commits                             |
| Integração local com PostgreSQL                                                                     | Não executada: não há banco descartável local atestado |
| E2E em navegador real                                                                               | Não executado: não há suíte ativa no projeto           |
| Auditoria de dependências                                                                           | Reprovada; detalhes abaixo                             |

As primeiras execuções de Vitest no sandbox falharam por permissões em arquivos
temporários e inicialização de workers. A execução fora do sandbox passou.
O build frontend mantém um aviso sobre chunk JavaScript acima de 500 kB.

O workflow foi alinhado à guarda existente: o PostgreSQL criado e descartado pelo
job recebe a identidade exclusiva esperada, `TEST_DATABASE_URL` explícita e uma
autorização de uma hora vinculada ao hash da conexão. A autorização é removida
com `if: always()` e ignorada pelo Git. Nenhum banco existente foi modificado.
O resultado remoto deve ser consultado nos checks da PR; este relatório registra
as evidências locais anteriores à publicação.

## Dependências preexistentes

`bun audit --json` retornou código 1 nos dois pacotes. Os manifests e lockfiles
não foram alterados nesta integração. A consulta retornou:

| Pacote   | Pacotes com alertas | Ocorrências por severidade retornadas pelo registro |
| -------- | ------------------- | --------------------------------------------------- |
| Backend  | 22                  | 2 críticas, 19 altas, 27 moderadas e 12 baixas      |
| Frontend | 29                  | 1 crítica, 57 altas, 76 moderadas e 14 baixas       |

As contagens incluem dependências transitivas e de desenvolvimento; não são uma
afirmação de explorabilidade de cada ocorrência na aplicação. Não foi realizada
uma análise completa de alcançabilidade de todos os advisories.

`bun audit fix --dry-run` foi executado sem alterar dependências. A simulação
propôs corrigir 50 ocorrências no backend e 135 no frontend, mas deixou 10 e 13
respectivamente bloqueadas por faixas de dependentes. Entre os bloqueios estão
Firebase/`@grpc/grpc-js`, Prisma/`deepmerge-ts` e `mysql2`, Mermaid/KaTeX,
Vitest/`@vitest/mocker`, além de versões transitivas de Zod e UUID.

Não foram aplicados overrides, ignorados advisories ou forçadas atualizações
incompatíveis. É necessário tratar essa atualização de dependências e validar
seu impacto antes de considerar a auditoria de segurança aprovada. A aprovação
da CI da aplicação não transforma essa auditoria reprovada em aprovação.

## Proteções e limites

A leitura autenticada da proteção de `develop` confirmou: zero aprovações
obrigatórias, lista vazia de status checks obrigatórios, ausência de exigência
de assinatura e histórico linear, e force push/exclusão desabilitados.
Não há regras adicionais aplicáveis retornadas pelo endpoint de regras da branch.
Nenhuma política foi alterada. Mesmo sem checks configurados como obrigatórios,
os jobs backend/frontend devem passar conforme o pedido do mantenedor.

Permanecem os limites da ADR-0005: JWT de sete dias e ausência de revogação das
sessões existentes após reset de senha. Mudanças nessa política e migrations
não fazem parte desta integração. A branch de origem deve ser preservada.
