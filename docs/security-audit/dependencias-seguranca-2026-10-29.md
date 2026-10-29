# Correções de dependências — 29/10/2026

O mantenedor ampliou expressamente a integração de segurança para corrigir também
as dependências preexistentes. Este registro complementa a fotografia inicial em
`integracao-seguranca-2026-10-29.md`. A conclusão foi limitada aos commits, conforme
o pedido final do mantenedor. Nenhuma migration ou configuração externa foi alterada.

## Backend

- Prisma CLI, Client e adapter PostgreSQL foram alinhados ao patch estável 7.10.1,
  que atualiza dependências vulneráveis e corrige problemas transacionais. Não foi
  adotado o Prisma 8 prerelease apresentado pelo registro como tag `latest`.
- Firebase Admin passou a 14.5.0; Vitest 4.1.12, Multer 2.5.0 e Zod 4.6.6 fixam
  pisos corrigidos. Os demais patches compatíveis foram gravados no lockfile.
- O SDK Firebase de cliente foi removido do backend: seus imports reais usam
  exclusivamente `firebase-admin/app` e `firebase-admin/auth`. O SDK do navegador
  continua no frontend.
- `prisma-erd-generator` passou a 3.2.1. O schema já gera `ERD.md`, formato que não
  precisa de Chromium. Mermaid CLI e Puppeteer foram removidos, preservando a
  geração automática do ERD Markdown e retirando a cadeia vulnerável de KaTeX.
- A geração dos dois Prisma Clients 7.10.1, do ERD Markdown e a validação do schema
  foram executadas com uma URL fictícia sem conexão. A auditoria do backend retornou
  código zero após essas alterações.

## Frontend

- Foram atualizados Axios, React Router, Vite, Vitest e Zod para faixas corrigidas.
  O Firebase passou a 13.1.0; as mudanças incompatíveis documentadas no major 13
  são de AI Logic, que não é usado pelo projeto. A aplicação continua usando
  `firebase/app` e `firebase/auth`.
- O override explícito `@grpc/grpc-js=1.14.5` corrige a versão Node transitiva do
  Firestore incluída pelo pacote Firebase. Mantém o major 1; Firestore não é
  importado pela aplicação. Não há supressão de advisory nem exclusão de pacotes
  de desenvolvimento na auditoria.
- A CLI `shadcn` foi retirada da instalação automática. Ela não é importada pela
  aplicação nem usada nos scripts de lint/teste/build. Os componentes gerados,
  suas dependências de runtime e `components.json` foram preservados. Adicionar
  componentes por essa CLI exige reavaliar uma versão corrigida no futuro.
- O downgrade de `deepmerge` para 4.1.2 sugerido pela auditoria foi rejeitado:
  embora o scanner retornasse zero, um ensaio com `__proto__` produziu um objeto
  com propriedade herdada controlada. O override inseguro não foi mantido.
  A retirada da CLI elimina essa cadeia do lockfile; não se declara segura uma
  versão apenas porque o scanner deixou de reportá-la.

## Ferramentas da raiz

A CLI Firebase foi preservada porque há `firebase.json` e `.firebaserc` no projeto.
Sua faixa foi atualizada para 15.34.2. Os advisories restantes nos dependentes
exigiram overrides explícitos, que não alteram flags do scanner:

| Override                    | Consumidor e verificação necessária                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@opentelemetry/core=2.8.0` | PubSub 5 usa `W3CTraceContextPropagator`; o script de compatibilidade exercita injeção/extração do contexto real e criação/fechamento de cliente local sem RPC |
| `uuid=11.1.1`               | Gaxios 6 usa a API CommonJS `v4()` para o boundary de multipart; essa chamada é exercitada pelo script                                                         |
| `qs=6.16.1`                 | Express 4 ainda limita uma faixa vulnerável; o script confere parsing de objetos e arrays pelo módulo resolvido a partir do Express da CLI                     |

A atualização da CLI eliminou `basic-ftp` do lockfile. Seu override provisório foi
removido por não ser mais necessário; não se mantém uma substituição sem consumidor.

`bun run check:tooling` executa as verificações locais de compatibilidade. Elas não
fazem login, deploy, acesso a banco nem chamadas PubSub. A inicialização da CLI é
verificada separadamente com `firebase --version`. Isso não equivale a testar
todos os comandos externos e emuladores da ferramenta.

## Validação e prevenção de regressões

A ampliação opcional do workflow foi retirada a pedido do mantenedor. Permanecem
os jobs existentes de backend/frontend e a guarda do PostgreSQL temporário já
integrada. Auditorias da raiz e compatibilidade da CLI foram verificadas localmente.

No Windows, as instalações simultâneas inicialmente colidiram no cache. Foram
concluídas em sequência. A compilação nativa de `re2` da CLI disputa recursos com
workers e imports dos testes; timeouts observados durante a instalação não foram
resolvidos relaxando configurações nem removendo testes. As suítes devem ser
repetidas com a instalação encerrada. No Windows, o artefato oficial de re2 1.26.1
para `win32-x64-137` foi conferido contra o SHA-256 publicado no pacote; seu teste
`verify-build.js` passou. A instalação normal foi então concluída sem ignorar scripts.

| Verificação final local                       | Resultado                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Instalação frozen na raiz, backend e frontend | Aprovada nos três lockfiles                                                |
| `bun audit` sem filtros                       | Zero alertas nos três lockfiles                                            |
| Backend: testes unitários                     | 39 aprovados em 6 arquivos                                                 |
| Frontend: testes com um worker                | 9 aprovados em 2 arquivos; nenhum teste removido                           |
| TypeScript e builds dos dois pacotes          | Aprovados; permanece o aviso de chunk acima de 500 kB                      |
| Prisma generate e validate                    | Aprovados, sem conexão a banco                                             |
| Compatibilidade da CLI e `firebase --version` | Aprovadas; CLI 15.34.2                                                     |
| Integração local e E2E real                   | Não executados: sem banco local descartável atestado e sem suíte E2E ativa |

A correção de capitalização do e-mail passou na CI da PR #29 (83 testes do backend
e 9 do frontend). Essa execução antecede os commits finais de dependências e não
é apresentada como validação remota desses commits. Não foi realizado merge nesta
conclusão limitada aos commits.

## Fontes primárias

- [Prisma 7.10.1: correções e dependências](https://github.com/prisma/orm/releases/tag/7.10.1)
- [Gerador ERD 3: saída textual sem Chromium](https://github.com/keonik/prisma-erd-generator#upgrading-to-3x)
- [Firebase JavaScript: notas do major 13 e 13.1](https://firebase.google.com/support/release-notes/js)
- [Advisory deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
- [Advisory gRPC](https://github.com/advisories/GHSA-m9gg-hp2v-232j)
- [Advisory OpenTelemetry](https://github.com/advisories/GHSA-8988-4f7v-96qf)
- [Advisory basic-ftp](https://github.com/advisories/GHSA-c475-qrg2-pj4r)
- [Advisory UUID](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
