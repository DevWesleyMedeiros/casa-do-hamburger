# 0003: Login via Google OAuth 2.0 como Alternativa ao Login Local

| Campo | Valor |
|---|---|
| **Status** | 🔵 Proposta (rascunho. Implementar a regra de negócio primeiro) |
| **Data** | 25/07/2026 |
| **Decisores** | Wesley (mantenedor) |
| **Relacionado a** | `REGRAS_DE_NEGOCIO.md` v1.2.0 — RF-51 a RF-55, RNF-23 a RNF-25, US-11, RN-AUTH-08 a RN-AUTH-12, RN-CRYPT-05 |

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
| **A. OAuth 2.0 direto (Authorization Code + PKCE) com `google-auth-library`** *(escolhida)* | Backend implementa o fluxo e verifica o `id_token` manualmente | Controle total do fluxo; sem dependência de framework de auth; reaproveita 100% do mecanismo de sessão já existente (`jose`) | Mais código para escrever e manter do que uma lib pronta |
| **B. NextAuth.js / Auth.js** | Biblioteca de autenticação completa com providers prontos | Rápido de configurar, comunidade grande | Acoplado fortemente ao ecossistema Next.js; o projeto atual é Express puro no backend — adotar essa lib forçaria mudança de arquitetura de sessão (ela tem seu próprio modelo de sessão/cookie), conflitando com RN-AUTH-02/03 já estabelecidas |
| **C. Passport.js (`passport-google-oauth20`)** | Middleware de autenticação genérico para Express, com strategy para Google | Integra bem com Express, comunidade madura | Mais uma dependência para um fluxo que, no fundo, é: trocar `code` por `id_token`, verificar, e emitir o JWT que já temos — Passport adiciona uma camada de abstração (strategies, sessions próprias) maior do que o necessário aqui |
| **D. Serviço de auth gerenciado (Firebase Auth / Auth0 / Clerk)** | Terceiriza toda a autenticação, incluindo Google | Menos código, MFA e outros provedores "de graça" | Migraria a fonte de verdade de identidade para fora do próprio banco (`User` no Postgres), quebrando RN-DATA-01 (Prisma sobre Postgres como ORM único) e RN-AUTH-02 (sessão própria via `jose`); overkill e desalinhado com a proposta de boilerplate reutilizável e auto-contido do projeto |

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
