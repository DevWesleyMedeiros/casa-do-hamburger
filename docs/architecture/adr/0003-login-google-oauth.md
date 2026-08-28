# 0003: Login via Google OAuth 2.0 como Alternativa ao Login Local

| Campo | Valor |
|---|---|
| **Status** | 🟡 Aceita — revisada em 27/08/2026 (mudança de decisão: Opção D substitui Opção A, ver "Revisão 27/08/2026" abaixo) |
| **Data** | 25/07/2026 (revisada em 27/08/2026) |
| **Decisores** | Wesley (mantenedor) |
| **Relacionado a** | `REGRAS_DE_NEGOCIO.md` v1.8.0 — RF-51 a RF-55, RNF-23 a RNF-25, US-11, RN-AUTH-08 a RN-AUTH-12, RN-CRYPT-05 |

> ## ⚠️ Revisão 27/08/2026 — decisão alterada para Firebase Authentication
>
> Esta ADR originalmente escolheu a **Opção A** (OAuth 2.0 direto com
> `google-auth-library`) e rejeitou explicitamente a **Opção D** (Firebase
> Auth). Em 27/08/2026, ao desenhar o fluxo de login no board de arquitetura a decisão foi revista: **a Opção D (Firebase Authentication) passa a ser a escolhida**, substituindo a Opção A.

> O restante deste documento abaixo (Contexto, Opções Consideradas, seção
> "Decisão" original) é mantido como **registro histórico** de por que a
> Opção A foi cogitada primeiro — não apague essa análise, ela continua
> valendo como referência de trade-off caso o projeto precise reavaliar no futuro. A seção **"Decisão revisada (27/08/2026)"**, logo após "Decisão", é a que vale a partir de agora.

> ⚠️ Numeração provisória: esta ADR assume o próximo número disponível após a
> ADR-0002 (RAG). Se outra ADR for commitada antes desta, renumerar antes do
> merge para manter a sequência sem furos.

---

## Contexto

Hoje o sistema autentica apenas via e-mail e senha (RF-01 a RF-08), com JWT
(`jose`) emitido em cookie `httpOnly` (RF-04). Queremos oferecer **login via
Google** como opção adicional — não como substituição —, reduzindo fricção de
cadastro e oferecendo um método de autenticação que carrega verificação de
identidade já feita por um provedor confiável.

O ponto de maior risco arquitetural não é "chamar a API do Google", e sim
**decidir o que acontece depois que a identidade é confirmada**: como gerar a
sessão da aplicação, como tratar contas com o mesmo e-mail em provedores
diferentes, e como não deixar o mecanismo de sessão existente (cookie JWT
`httpOnly`) divergir entre os dois fluxos de login.

## Decision Drivers

- Não duplicar o mecanismo de sessão — login local e login Google devem
  convergir para o **mesmo** cookie/JWT de sessão
- Nunca confiar em dados de identidade vindos do frontend sem verificação
  server-side
- Minimizar risco de *account takeover* por e-mails não verificados
- Manter compatibilidade com RBAC (`USER`/`ADMIN`) e com os middlewares
  `requireAuth`/`requiredAdmin` já existentes, sem exigir mudanças neles

## Opções Consideradas

| Opção | Descrição | Prós | Contras |
|---|---|---|---|
| **A. OAuth 2.0 direto (Authorization Code + PKCE) com `google-auth-library`** *(escolhida em 25/07/2026, substituída em 27/08/2026 — ver "Decisão revisada")* | Backend implementa o fluxo e verifica o `id_token` manualmente | Controle total do fluxo; sem dependência de framework de auth; reaproveita 100% do mecanismo de sessão já existente (`jose`) | Mais código para escrever e manter do que uma lib pronta |
| **B. NextAuth.js / Auth.js** | Biblioteca de autenticação completa com providers prontos | Rápido de configurar, comunidade grande | Acoplado fortemente ao ecossistema Next.js; o projeto atual é Express puro no backend — adotar essa lib forçaria mudança de arquitetura de sessão (ela tem seu próprio modelo de sessão/cookie), conflitando com RN-AUTH-02/03 já estabelecidas |
| **C. Passport.js (`passport-google-oauth20`)** | Middleware de autenticação genérico para Express, com strategy para Google | Integra bem com Express, comunidade madura | Mais uma dependência para um fluxo que, no fundo, é: trocar `code` por `id_token`, verificar, e emitir o JWT que já temos — Passport adiciona uma camada de abstração (strategies, sessions próprias) maior do que o necessário aqui |
| **D. Firebase Authentication (subconjunto de "serviço de auth gerenciado")** *(escolhida em 27/08/2026 — ver "Decisão revisada")* | Terceiriza a **verificação de identidade Google** via Firebase Authentication + Firebase Admin SDK; `User`/sessão continuam 100% no Postgres/Prisma + `jose` | Menos código de segurança sensível para manter (PKCE, `state`, JWKS do Google) | Nova dependência externa (Firebase) na etapa de login social; ver "Decisão revisada" para o trade-off aceito explicitamente |

## Decisão

Implementar o fluxo **diretamente com `google-auth-library`** (Opção A),
seguindo Authorization Code Flow + PKCE. O backend é o único responsável por:

1. Trocar o `code` recebido do frontend pelo `id_token` do Google
   (`CLIENT_SECRET` nunca sai do backend)
2. Verificar `id_token` (assinatura, `aud`, `iss`, `exp`)
3. Fazer *find-or-create* do `User` no Prisma (`provider=GOOGLE`)
4. Emitir o **mesmo JWT de sessão** (`jose`) já usado no login local, no
   mesmo cookie `httpOnly`/`secure`/`sameSite`

Ou seja: a decisão arquitetural central é que **login via Google é apenas uma
segunda forma de provar identidade — a geração e o formato da sessão não
mudam em nada**. Isso é o que preserva compatibilidade total com
`requireAuth`, `requiredAdmin` e o restante do RBAC sem tocar em nenhum
desses middlewares.

### Mudanças de schema necessárias

| Campo | Mudança |
|---|---|
| `User.password` | Passa a ser opcional (nullable) |
| `User.provider` | Novo enum `LOCAL \| GOOGLE` |
| `User.providerId` | Novo campo opcional — armazena o `sub` do Google |
| `User.emailVerified` | Novo campo booleano |

### Regra de vinculação de conta

Se já existir uma conta `LOCAL` com o mesmo e-mail do login Google, o vínculo
automático **só ocorre se** o Google reportar `email_verified: true`. Caso
contrário, o sistema não vincula automaticamente (ver RN-AUTH-11) — evita que
alguém com um e-mail não verificado assuma uma conta local já existente.

## Decisão revisada (27/08/2026) — Firebase Authentication (Opção D)

> Esta seção **substitui** a seção "Decisão" acima na prática — mantida
> separada por transparência histórica (ver aviso no topo do documento).

Usar **Firebase Authentication** no frontend, com `GoogleAuthProvider` e
`signInWithPopup` (ou fluxo equivalente), e **Firebase Admin SDK** no
backend para verificar o `Firebase ID Token`. O ponto central da decisão
original é preservado: **login via Google continua sendo só uma segunda
forma de provar identidade** — a sessão da aplicação segue sendo o mesmo
JWT (`jose`) em cookie `httpOnly`, e o Postgres/Prisma continua a única
fonte de verdade para o `User` da aplicação (Firebase não substitui a
tabela `User`, só substitui a etapa de verificação de identidade Google).

1. Frontend autentica com o Firebase Authentication SDK
   (`GoogleAuthProvider` + `signInWithPopup`) — nenhum `CLIENT_SECRET` do
   Google trafega pelo app; o Firebase SDK cuida da troca OAuth
   internamente
2. Frontend envia o `Firebase ID Token` retornado para
   `POST /auth/google`
3. Backend verifica o token com `firebase-admin` (`getAuth().verifyIdToken`)
   — valida assinatura, `iss`, `aud` (Firebase project ID) e `exp`
4. Backend faz *find-or-create* do `User` no Prisma (`provider=GOOGLE`)
   usando o `uid` (`sub`) do Firebase como identidade externa
5. Backend emite o **mesmo JWT de sessão** (`jose`) já usado no login
   local, no mesmo cookie `httpOnly`/`secure`/`sameSite`

### Por que a mudança (registro do trade-off aceito)

Os contras já documentados na Opção D original continuam **reais e
aceitos conscientemente**, não desapareceram:

- O projeto passa a depender de um serviço externo (Firebase) para a
  etapa de verificação de identidade Google — deixa de ser 100%
  auto-contido nesse ponto específico
- `firebase-admin` e `firebase` (client SDK) entram como novas
  dependências

O motivo da mudança foi **pragmático, não técnico**: menos código de
segurança sensível para escrever e manter à mão (troca de `code`,
validação manual de PKCE/state, refresh do JWKS do Google) em troca de um
SDK mantido pelo próprio Google/Firebase — aceitável porque a tabela
`User` no Postgres continua sendo a fonte de verdade de identidade da
aplicação (RN-DATA-01 preservado: Firebase só prova "esse é o dono desse
e-mail no Google", nunca vira sessão nem armazena dado de negócio) e a
sessão nunca deixa de ser o JWT próprio (RN-AUTH-02 preservado).

### Mudanças de schema necessárias (revisado)

| Campo | Mudança |
|---|---|
| `User.password` | Passa a ser opcional (nullable) — contas `provider=GOOGLE` não têm senha local |
| `User.provider` | Novo enum `LOCAL \| GOOGLE` (era `String` livre) |
| `User.firebaseUid` | Novo campo opcional, único — armazena o `uid`/`sub` do Firebase (substitui o `providerId` genérico da versão OAuth-direto) |
| `User.emailVerified` | Novo campo booleano — espelha o `email_verified` do Firebase ID Token no momento do login/vínculo |

### RNF-23/24/25 — status sob Firebase Authentication

RNF-23 (Authorization Code Flow + PKCE) e RNF-25 (parâmetro `state`
contra CSRF) tornam-se **implementação interna do SDK do Firebase** — a
aplicação não implementa PKCE nem `state` manualmente, o `GoogleAuthProvider`
cuida disso. RNF-24 (`CLIENT_SECRET` nunca no frontend) deixa de se
aplicar da forma original: não existe troca manual de `code` por
`id_token` no backend; o que precisa ficar só no backend agora é a
**Service Account do Firebase Admin** (`FIREBASE_SERVICE_ACCOUNT_*`),
nunca exposta ao frontend — mesma diretriz de segredo, mecanismo
diferente. Ver Changelog v1.8.0 do `REGRAS_DE_NEGOCIO.md` para a reescrita
formal desses três itens.

## Consequências

**Positivas**
- Sessão da aplicação continua 100% sob controle do próprio backend — nenhuma
  dependência externa vira ponto único de falha para autenticação
- Nenhuma mudança nos middlewares de autorização já testados/em uso
- Schema evolui de forma aditiva (campos novos, nenhum campo removido)

**Negativas / Custos assumidos**
- Mais código para escrever e manter em comparação com uma lib "tudo em um"
  (Opções B/C/D) — trade-off aceito em favor de controle e alinhamento
  arquitetural
- Necessário decidir e documentar explicitamente a regra de vinculação de
  contas (RN-AUTH-11) para não abrir brecha de segurança
- `password` nullable exige atenção em todo código existente que hoje
  assume `password` sempre presente (validações, testes futuros)

## Fora de escopo (explicitamente)

- Outros provedores OAuth (GitHub, Facebook, etc.) — desenho preparado para
  ser extensível (`provider` como enum), mas não implementado agora
- Refresh token / rotação de sessão (RN-AUTH-05) — já é um item 🔵 separado,
  não faz parte desta decisão
- Migração para serviço de auth gerenciado — descartada nesta ADR (Opção D)

## Referências

- `REGRAS_DE_NEGOCIO.md` v1.2.0 — Seções 3.1, 4, 5, 6.1, 6.2, 7, 9.3
- RN-AUTH-02/03 — mecanismo de sessão que esta decisão preserva
- ADR-0001 — Rate Limiting (rota `/auth/google` deve reaproveitar o mesmo
  limiter, ver RN-AUTH-12)
