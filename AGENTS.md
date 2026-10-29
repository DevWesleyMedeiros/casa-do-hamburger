# Diretrizes para agentes — Casa do Hambúrguer

Estas instruções compartilhadas orientam implementação e revisão em todo o repositório,
independentemente do fornecedor do agente. Instruções específicas de revisão aplicam-se
à atividade de revisão; não impedem uma implementação expressamente autorizada.

## Contexto e mapa do projeto

Aplicação de pedidos para uma hamburgueria de loja única: autenticação, catálogo,
carrinho e pedidos. O pagamento atual é simulado, sem cobrança financeira real.

- `front-end/`: React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form e Zod.
- TanStack Query administra dados e cache do servidor; Zustand destina-se ao estado de interface.
- `front-end/src/`: páginas e componentes em `pages/` e `components/`; hooks em `hook/`;
  rotas, schemas, serviços HTTP e stores em `shared/`; contratos em `types/`.
- `back-end/`: API Express com TypeScript, Prisma e PostgreSQL; módulos em `src/`.
- `back-end/src/`: `routes/`, `controllers/`, `services/`, `repositories/`, `schemas/`,
  `dtos/`, `middlewares/` e `config/`; composição HTTP em `app.ts`.
- Firebase verifica identidade no login Google; usuários da aplicação ficam no PostgreSQL,
  e a sessão própria usa JWT via `jose` em cookie `httpOnly`.
- Cloudinary armazena/serve imagens; Resend envia e-mails transacionais.
- `back-end/prisma/schema.prisma` e `back-end/prisma/migrations/`: modelo e migrations.
  Confirme nomes reais no schema: hoje há `User.admin` booleano e `User.password` opcional.
- Consulte `package.json` e `bun.lock` da raiz e de cada pacote para dependências e versões;
  os pacotes têm scripts e lockfiles próprios. A raiz possui `check:tooling` para
  compatibilidade das dependências da CLI, sem substituir as validações dos pacotes.

## Procedimento inicial e fontes de referência

1. Leia os `AGENTS.md` e eventuais `AGENTS.override.md` aplicáveis ao diretório de trabalho.
2. Entenda o pedido e delimite arquivos, comportamentos, contratos e riscos envolvidos.
3. Leia `README.md` e os RF/RN/RNF pertinentes em `docs/architecture/REGRAS_DE_NEGOCIO.md`.
   Consulte também as seções 14 (testes e Definition of Done) e 15 (governança).
4. Consulte os ADRs pertinentes em `docs/architecture/adr/`, verificando status e revisões:
   `0001-rate-limiting-robusto-redis-auditoria.md` e `0002-rag-assistente-documentacao.md`
   são propostas; em `0003-login-google-oauth.md`, vale a decisão revisada para Firebase.
5. Examine scripts, hooks, configurações e workflow aplicáveis antes de executar validações.
6. Preserve alterações preexistentes e instruções úteis; evite refatorações fora do escopo.

Requisitos e ADRs descrevem o comportamento pretendido. Código, testes e verificações
demonstram o comportamento existente, dentro do que efetivamente foi inspecionado/executado.
Comentários, selos de conclusão, exemplos e relatórios antigos não comprovam funcionamento.
Sinalize divergências e resolva-as somente dentro do escopo autorizado. Nunca altere
silenciosamente uma regra de negócio para justificar o código atual.

Existe um hook versionado em `.githooks/pre-commit`, que executa `scripts/quality-gate.mjs`.
Sua execução automática depende da ativação local pelo mantenedor; a presença do arquivo
não comprova ativação. Leia `docs/development/automation.md` e execute o script compartilhado
antes de concluir alterações às quais lint/formatação se apliquem, selecionando o escopo pertinente.
Tarefas exclusivamente analíticas não exigem verificações da aplicação. A conclusão de uma
resposta do agente não aciona o hook do Git. Hook e script não substituem testes, build,
revisão de negócio ou CI; a precaução temporária com testes destrutivos de integração
permanece válida. `pretest` existe nos dois pacotes e chama lint.

## Arquitetura e padrões técnicos

Preserve esta separação nas alterações novas; desvios existentes não exigem refatoração ampla:

| Camada       | Responsabilidade                                                                |
| ------------ | ------------------------------------------------------------------------------- |
| Routes       | Endpoints e composição de middlewares de autenticação, autorização e validação. |
| Controllers  | Entrada e saída HTTP; delegação aos services.                                   |
| Services     | Regras de negócio e orquestração das operações.                                 |
| Repositories | Persistência e acesso ao Prisma, incluindo operações transacionais.             |
| Schemas      | Validação explícita da entrada.                                                 |
| DTOs/mappers | Contratos explícitos de saída e seleção dos campos expostos.                    |

- Use TypeScript com tipos explícitos nas fronteiras; não introduza `any` injustificado.
- Valide entradas no backend, incluindo body, params e query conforme a operação;
  validação no frontend não substitui a do servidor.
- Reutilize os padrões existentes de erros (`AppError`, `asyncHandler`, `errorHandler`),
  mantendo status e respostas consistentes, sem expor detalhes internos ou stack traces.
- Corpos de resposta devem usar contratos explícitos, sem senhas, hashes, tokens ou credenciais.
  A sessão é entregue pelo cookie; não retorne o objeto bruto do Prisma como perfil.
- Reutilize scripts, componentes e padrões existentes. Dependências novas somente quando
  necessárias e autorizadas pelo escopo da tarefa.
- Consulte `tsconfig.json` da raiz e os `tsconfig*.json` de cada pacote; respeite os padrões
  locais de imports, nomes e organização sem relaxar regras para acomodar a alteração.

## Invariantes de negócio e segurança

As regras abaixo são obrigações a preservar/verificar, não certificação de conformidade
da implementação atual. Defeitos encontrados não se tornam padrões aprovados.

- Valide autorização administrativa e posse dos recursos no backend; proteções de UI
  são apenas experiência do usuário. Isole dados privados entre usuários.
- Senhas locais usam hash bcrypt (implementação atual: `bcrypt-ts`), conforme política dos requisitos.
- Mantenha sessão em cookie `httpOnly`, com `secure`/`sameSite` coerentes com o ambiente;
  não mova tokens de sessão para `localStorage`, `sessionStorage` ou stores acessíveis ao JavaScript.
- Verifique a identidade Google no servidor antes de emitir sessão própria; preserve
  a regra de vínculo de contas com e-mail verificado e a separação entre identidade e sessão.
- Valide tamanho e tipo real dos uploads por assinatura binária, além do MIME declarado,
  antes de enviar imagens ao Cloudinary.
- Preserve unicidade lógica por usuário/produto no carrinho e incremento de quantidade,
  conforme RN-CART; não duplique linhas para representar o mesmo item.
- Calcule total e subtotais do pedido no backend a partir dos dados confiáveis do catálogo/carrinho.
- Preserve snapshots imutáveis dos dados históricos: cliente, produto, preço, imagem e quantidade.
- Respeite a máquina de estados e as regras de cancelamento: cliente somente em `PENDING`;
  administrador em `PENDING` ou `PREPARING`. Consulte a seção 8 dos requisitos.
- Garanta atomicidade e controle de concorrência nas operações relacionadas, incluindo
  checkout, limpeza do carrinho e transições de status; uma transação, isoladamente,
  não comprova proteção contra leituras/alterações concorrentes.
- Preserve contrato monetário consistente em inteiros de centavos entre entrada, persistência,
  DTOs e frontend. Confira conversões existentes; não normalize inconsistências como regra válida.

## Frontend e experiência do usuário

- Mantenha TanStack Query como fonte do estado do servidor, incluindo sessão/perfil,
  catálogo, carrinho e pedidos; reserve Zustand para interface, como drawers e modais.
- Falhas de serviços usados por mutations devem rejeitar/propagar erro corretamente
  para `onError` e rollback; retornar um objeto de erro como sucesso pode impedir a reversão.
- Em atualizações otimistas, preserve snapshot, rollback e revalidação coerentes.
- Considere cancelamento de consultas e limpeza dos caches privados no logout/troca de sessão,
  evitando que outro usuário veja dados da sessão anterior.
- Trate loading, erro, estado vazio e sucesso; preserve feedback das ações e formulários.
- Preserve identidade visual, responsividade, semântica HTML, navegação por teclado,
  foco visível, rótulos e acessibilidade. Consulte estilos e componentes existentes.
- Evite duplicar componentes, contratos e regras; mantenha frontend e DTOs da API alinhados.

## Testes, lint, Prettier, CI e CD

Execute os comandos no diretório indicado. Confira novamente os scripts antes de usá-los.

| Finalidade          | Em `back-end/`                | Em `front-end/`                          |
| ------------------- | ----------------------------- | ---------------------------------------- |
| Lint                | `bun run lint`                | `bun run lint`                           |
| Conferir formatação | `bun run format:check`        | `bun run format:check`                   |
| Aplicar formatação  | `bun run format`              | `bun run format`                         |
| Testes              | `bun run test` (`vitest run`) | `bun run test` (`vitest`, interativo)    |
| Testes sem watch    | `bun run test`                | `bun run test:run`                       |
| Build               | `bun run build` (`tsc`)       | `bun run build` (`tsc -b && vite build`) |

Backend também possui `bun run test:watch`, `bun run test:coverage` e
`bun run test:integration`. Este último usa `vitest run tests/integration`, mas os arquivos
estão em `back-end/src/tests/integration/`; confirme a seleção efetiva antes de afirmar cobertura.
Nos dois pacotes, `lint:fix` aplica correções e `format` usa `prettier --write .`;
restrinja ferramentas de escrita aos arquivos autorizados, evitando reformatação alheia.
Use os scripts de Vitest; não os substitua por `bun test`, inclusive em revisão.

- Releia antes de concluir: seções 14/15 dos requisitos, scripts, `eslint.config.*`,
  `.prettierrc` e `.prettierignore` de cada pacote, `back-end/vitest.config.ts`,
  `back-end/tsconfig.vitest.json`, `front-end/vite.config.ts` e `.github/workflows/ci.yml`.
- Acrescente/atualize testes que comprovem o comportamento alterado no nível adequado:
  unitários para regras isoladas, integração para API/persistência e E2E para jornadas críticas.
- Execute verificações proporcionais à mudança e à DoD. Para documentação isolada,
  confira conteúdo, caminhos e Markdown com ferramenta disponível, sem instalar dependências.
- Não desative testes, reduza regras ou altere configurações para esconder falhas.
  Diferencie falhas preexistentes das introduzidas; não declare verificações não executadas como aprovadas.
- **Precaução temporária com o banco:** suítes de integração existentes fazem limpezas amplas.
  Só execute testes com essas limpezas após comprovar banco descartável e proteção contra
  conexão indevida, verificando destino efetivo, configuração carregada e guardas de execução.
  `NODE_ENV=test` ou nome contendo “test”, isoladamente, não comprovam isolamento.
  Isso também limita `test` e `test:coverage` do backend, que podem incluir essas suítes.
- Se faltar configuração ou comprovação de isolamento, informe o impedimento e prossiga
  nas partes independentes. Não crie infraestrutura nem altere banco existente por iniciativa própria.

O workflow atual é CI em PRs para `develop`/`main`, com jobs de backend e frontend.
Ambos instalam com `bun install --frozen-lockfile`, executam lint, `bunx prettier --check .`,
testes e build; frontend usa `bun run test:run` e backend usa `bun run test`.
O backend provisiona PostgreSQL temporário no job, gera/valida Prisma Client/schema e aplica
migrations nesse banco do CI. Isso não autoriza repetir migrations em bancos existentes.
Jobs E2E/revisão estão comentados; não há job ativo de deploy nesse workflow.
Não execute workflows de deploy nem altere configurações externas sem autorização.

## Documentação e revisão

- Mudanças autorizadas de comportamento devem atualizar os requisitos afetados;
  registre decisões arquiteturais relevantes em ADR em `docs/architecture/adr/`.
  Se a tarefa restringir arquivos e a atualização necessária ficar fora do escopo, sinalize a pendência.
- Em revisão, consulte os requisitos e os RF/RN/RNF afetados antes de concluir;
  priorize negócio, segurança, testes, performance, contrato de API e arquitetura.
  Deixe estilo automatizável para lint e Prettier; apresente achados acionáveis com evidências.
- As instruções em `.codex/agents/code-review-agent.toml` e
  `.claude/agents/code-review-agent.md` restringem o revisor a comentários, sem modificar arquivos.
  Essa restrição pertence à revisão e não bloqueia tarefas autorizadas de implementação.
  Exemplos antigos nesses arquivos não autorizam Git nem substituem scripts/configurações atuais.

## Autonomia, limites e conclusão

- Conclua o trabalho autorizado sem pedir confirmação para cada decisão rotineira.
  Proponha separadamente mudanças fora do escopo.
- Comandos Git e configurações externas pertencem ao mantenedor: não execute comandos Git,
  inclusive consultas, nem altere sua configuração. Não crie/troque branches por iniciativa própria.
- Configurações versionadas só podem mudar quando a tarefa autorizar. Não altere bancos
  existentes, credenciais, infraestrutura ou deploys por iniciativa própria.
- Segredos nunca devem aparecer em respostas, logs ou exemplos; não exponha arquivos de credenciais.
- Ao concluir, informe o que mudou e por quê, arquivos relevantes, validações executadas
  e resultados, verificações não executadas com motivos, pendências e decisões do mantenedor.
