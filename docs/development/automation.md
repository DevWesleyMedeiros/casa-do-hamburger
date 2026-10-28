# Automação de qualidade

O mesmo verificador atende desenvolvedores e agentes de qualquer fornecedor. O hook
versionado foi criado em `.githooks/pre-commit`; sua ativação local cabe ao mantenedor
e não foi realizada nem verificada nesta entrega. Obter ou criar `.githooks/` não
ativa automaticamente os hooks.

## Responsabilidades

| Arquivo ou mecanismo       | Responsabilidade                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                | Orientar agentes sobre escopo, regras, validações e limites de autorização. Encerrar uma resposta não dispara hooks do Git. |
| `scripts/quality-gate.mjs` | Executar as verificações locais compartilhadas, com os mesmos comandos para humanos e agentes.                              |
| `.githooks/pre-commit`     | Após ativação, chamar o script com `--scope all` e devolver seu resultado ao Git.                                           |
| `.github/workflows/ci.yml` | Validar o conteúdo submetido nos PRs para `develop` e `main`, com lint, formatação, testes e build.                         |

Hook e script não substituem revisão de negócio, testes, build ou CI. A precaução
temporária do `AGENTS.md` com testes de integração que fazem limpezas amplas no banco
permanece válida. Esta automação não muda regras funcionais da aplicação, a estratégia
de testes ou a Definition of Done das seções 14 e 15 dos requisitos.

## Execução manual

Na raiz:

```sh
node scripts/quality-gate.mjs
node scripts/quality-gate.mjs --scope all
node scripts/quality-gate.mjs --scope front-end
node scripts/quality-gate.mjs --scope back-end
node scripts/quality-gate.mjs --help
```

Em um subdiretório, ajuste somente o caminho de entrada. Por exemplo, em `front-end/`:

```sh
node ../scripts/quality-gate.mjs --scope front-end
```

A raiz é resolvida pela localização do próprio script, sem comandos Git. Caminhos
com espaços são passados como argumentos delimitados. Somente as formas acima são
aceitas: opções desconhecidas, escopo ausente/inválido, repetição de opções ou argumentos
extras retornam código 2 sem executar verificações. `--help` também não exige dependências.

## Pré-requisitos e cobertura

- Node.js compatível com as ferramentas instaladas; esta entrega foi validada com Node 24.
- Bun nativo (`bun` no Linux, `bun.exe` no Windows) disponível no `PATH`, com suporte a
  `--no-env-file` e `--no-install` (validado com Bun 1.4.2).
- Dependências de desenvolvimento já instaladas nos pacotes selecionados, incluindo
  ESLint, seus plugins e Prettier. O verificador não instala nem atualiza dependências.
- Mesmo em `--scope front-end`, é necessária a instalação local de Prettier do backend,
  pois todos os escopos incluem os arquivos compartilhados.
- Shell POSIX `sh`. No Windows, pode ser o shell do Git for Windows/Git Bash: o script
  procura `sh.exe` no `PATH` e nas instalações usuais `Git/bin` em `ProgramFiles`,
  `ProgramFiles(x86)` e `LOCALAPPDATA/Programs`. Instalações portáteis ou em outro local
  devem disponibilizar `sh.exe` no `PATH`. Wrappers `.cmd`/`.bat` de Bun não são usados.
- O ambiente de uma IDE que executa commits também precisa encontrar Node e Bun.

Antes de iniciar comandos, o script confere manifests, scripts exigidos, arquivos,
entradas locais de ESLint/Prettier e executáveis. Uma instalação parcial ainda pode
falhar ao carregar plugins ou dependências transitivas; isso nunca representa aprovação.

Em cada pacote selecionado, no diretório daquele pacote, executa sequencialmente:

```sh
bun --no-env-file --no-install run lint
bun --no-env-file --no-install run format:check
```

São os scripts existentes `bun run lint` e `bun run format:check`, com as proteções
do Bun contra carregamento automático de `.env` e instalação automática. As regras
permanecem nos arquivos de configuração do projeto. `lint` usa `eslint . --max-warnings=0`;
`format:check` usa `prettier --check .`, respeitando os respectivos ignores.

O pedido inicial citava `bun run format`, mas esse script é `prettier --write .` nos
dois pacotes. Foi usado `format:check` para cumprir a exigência de não alterar arquivos.
O verificador não chama `lint:fix`, `format` ou `--write`.

Todos os escopos incluem também, a partir da raiz, **somente estes três arquivos**:

```sh
node back-end/node_modules/prettier/bin/prettier.cjs --check --config back-end/.prettierrc --ignore-path front-end/.prettierignore AGENTS.md scripts/quality-gate.mjs docs/development/automation.md
```

A instalação do backend e sua `.prettierrc` não exigem plugins de frontend. O ignore
do frontend é usado explicitamente porque o do backend exclui `docs/`, o que omitiria
esta documentação. Não há descoberta de outros documentos nem varredura da documentação
antiga nessa etapa. Não é usado Prettier global, `bunx` ou `npx`.

O hook é validado separadamente com `sh -n .githooks/pre-commit`; nenhum plugin de shell
do Prettier é presumido. O verificador executa essa análise sintática, sem executar o
próprio hook (o que causaria recursão).

Não são executados testes da aplicação, build, Prisma, migrations, serviços, chamadas
ao banco, deploys, comandos Git ou correções automáticas. Nenhuma credencial é necessária.
Os scripts/configurações de lint e formatação são código confiável do projeto: alterações
futuras nesses scripts, inclusive `prelint`/`postlint` e equivalentes de formatação,
precisam de revisão para preservar esse escopo.

## Resultados e interrupções

Cada etapa informa o pacote, o comando, o resultado e o código de saída. Falhas de
comandos não impedem a execução das outras etapas; o resultado final preserva o
primeiro código não zero. Uma falha na preparação impede o início das verificações.

| Resultado                   | Interpretação                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Código 0 / `APROVADO` final | Todas as verificações selecionadas e compartilhadas passaram.                                                                                                                          |
| `FALHA` / `REPROVADO`       | Algum comando retornou erro. Leia sua saída para distinguir violações de regras e problemas de configuração/dependências.                                                              |
| Código 1 / `IMPEDIMENTO`    | Falta de executável, script, arquivo ou dependência local, manifesto inválido ou impossibilidade de iniciar um processo. Resolva o ambiente antes de considerar a validação concluída. |
| Código 2 sem verificações   | Argumentos inválidos. Um comando de verificação também pode devolver 2; nesse caso haverá identificação da etapa.                                                                      |
| `INTERROMPIDO`              | A execução foi interrompida; as próximas etapas não são iniciadas. Nunca equivale a aprovação.                                                                                         |

`SIGINT` e `SIGTERM` são encaminhados ao processo ativo e resultam em 130/143. Outros
sinais de término dos filhos também resultam em código não zero. No POSIX, o sinal
é enviado ao grupo do processo para alcançar os descendentes. No Windows, Node encerra
o filho diretamente; não há garantia de encerramento de todos os seus descendentes.
Não se deve interpretar uma interrupção como execução completa.

O hook usa `exec node`, preservando o código de saída do script e evitando uma camada
de shell aguardando o resultado. O script chama processos com `shell: false`; `sh` é
usado exclusivamente para verificar a sintaxe do arquivo fixo do hook.
Para resolver a raiz, o hook tenta `pwd -W` (caminho nativo no Git Bash) e recorre a
`pwd -P` nos shells POSIX. Assim, a chamada ao Node no Windows não depende da conversão
automática de caminhos como `/tmp/` pelo Git Bash.

## Revisão e ativação pelo mantenedor

Os comandos Git desta seção são exemplos para execução **manual pelo mantenedor**.
Nenhum deles foi executado pelo agente. Na raiz, antes de alterar configurações:

1. Revise os quatro arquivos desta entrega e execute o verificador manualmente.
2. Verifique as configurações existentes e sua origem:

   ```sh
   git config --show-origin --show-scope --get-all core.hooksPath
   ```

   Ausência de saída pode indicar configuração não definida. Inspecione também os
   hooks locais no diretório Git efetivo (que pode diferir de `.git/` em worktrees)
   e qualquer diretório de hooks já configurado. Um caminho de consulta possível é:

   ```sh
   git rev-parse --git-path hooks
   ```

3. Se já houver hooks úteis, decida como integrá-los antes de trocar `core.hooksPath`.
   Não sobrescreva configurações ou arquivos existentes. Este hook pressupõe sua
   localização em `.githooks/` junto à raiz; copiá-lo para outro diretório sem adaptação
   quebra essa resolução. Registre a configuração anterior para eventual restauração.
4. Confirme que `.githooks/pre-commit` está com **LF**, sem BOM, e tem permissão executável.
   Em Linux ou Git Bash, conforme o sistema de arquivos:

   ```sh
   chmod +x .githooks/pre-commit
   sh -n .githooks/pre-commit
   ```

   A permissão executável também deve ser preservada ao versionar no POSIX; o mantenedor
   deve conferir o modo do arquivo antes de distribuí-lo. Evite conversão para CRLF
   por editores ou regras locais. Nenhuma configuração de finais de linha foi alterada.

5. Somente se a revisão anterior permitir adotar esse diretório, ative localmente:

   ```sh
   git config --local core.hooksPath .githooks
   git config --show-origin --show-scope --get-all core.hooksPath
   ```

   Revise o resultado efetivo, incluindo eventual configuração de worktree. Não é
   necessário fazer commit ou push de teste. É possível testar a chamada diretamente
   com `sh .githooks/pre-commit`; isso executa o gate completo, sem criar commit.

## Árvore de trabalho, CI e limites

O verificador examina a **árvore de trabalho**, sem consultar o Git, sem alterar staging
e sem criar cópia isolada do conteúdo staged. Em commits parciais, o conteúdo verificado
pode diferir do commit. Cabe ao mantenedor conferir essa diferença; a CI continua
validando o conteúdo submetido. Hooks locais podem estar inativos ou ser ignorados e
não devem ser tratados como imposição central de qualidade.

A CI existente não foi modificada: ela valida os pacotes, mas ainda não chama este
script nem inclui os três arquivos compartilhados na sua checagem de formatação.
Testes e build continuam fora deste hook inicial e seguem a DoD e os cuidados do
`AGENTS.md`, inclusive a exigência de comprovar isolamento antes de testes destrutivos.

Compatibilidade verificada nesta entrega: Windows com PowerShell, Node 24.21.0,
Bun 1.4.2 e `sh` do Git for Windows. A lógica POSIX foi preparada para Linux, mas uma
execução nativa Linux ainda precisa ser validada. A ativação automática pelo Git,
configurações locais existentes e permissões POSIX não foram verificadas pelo agente.

Na validação inicial de 28/10/2026, cenários isolados em diretórios temporários cobriram
ajuda, argumentos inválidos, todos os escopos, diretório inicial diferente, espaços e
caracteres especiais, falhas, impedimentos, interrupções e retorno do hook. Comandos
de lint/formatação foram simulados por processos Node; eventos de sinal foram simulados
para conferir o encaminhamento ao filho e os códigos 130/143 no Windows. O hook foi
chamado diretamente pelo shell nesses cenários, sem commit. As fixtures foram removidas;
nenhum teste da aplicação foi executado ou alterado.

Nas verificações reais, lint passou nos dois pacotes e a formatação dos três arquivos
compartilhados passou. `format:check` apontou pendências preexistentes em 79 arquivos
do backend e 89 do frontend; esses arquivos não foram corrigidos. Portanto, o gate
completo retorna falha até essas pendências serem tratadas separadamente. O shell do
Git falhou ao inicializar no sandbox do agente; sua validação sintática e os cenários
do hook foram executados com sucesso fora do sandbox.

Referências técnicas: [hooks do Git](https://git-scm.com/docs/githooks),
[processos filhos no Node](https://nodejs.org/api/child_process.html),
[variáveis de ambiente do Bun](https://bun.sh/docs/runtime/environment-variables) e
[instalação automática do Bun](https://bun.sh/docs/runtime/auto-install).
