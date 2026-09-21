# Relatório de Auditoria de Segurança — Casa do Hambúrguer

- Data: 18/09/2026
- Escopo auditado: Stack detectada: Node.js + Express + Bun, Prisma ORM + PostgreSQL, JWT via jose em cookie httpOnly, React + Vite + TypeScript, Firebase Auth no frontend e Firebase Admin no backend.
- Nota metodológica: Mapeamento por categoria: (1) tenant isolation: N/A em app single-tenant; (2) permissão no navegador: validada no servidor; (3) IDOR: checagens de posse por userId; (4) segredos: validação de env e ausência de segredos hardcoded; (5) XSS: busca por sinks perigosos sem resultados.

## Resumo executivo

| Severidade | Quantidade |
| --- | ---: |
| Crítica | 0 |
| Alta | 0 |
| Média | 0 |
| Baixa | 0 |
| Ponto forte | 3 |

### Pontos fortes
- `back-end/src/routes/order.routes.ts` e `back-end/src/services/orderServices/order.service.ts` defendem posse do pedido e acesso administrativo em nível do servidor.
- `back-end/src/repositories/cart.repository.ts` filtra consultas por `userId` ao atualizar/deletar itens do carrinho.
- `back-end/src/config/env.ts` exige variáveis sensíveis no bootstrap, e o Git não registra segredos reais no histórico.

### Pontos fracos
- Nenhum achado acionável de severidade crítica/alta foi verificado no código atual; a stack é single-tenant e não implementa RLS/tenant isolation como requisito.
- O único valor sensível exposto no cliente é a Firebase API key pública, que é pública por desenho do SDK do Firebase e não constitui segredo de assinatura.

## Tabela de achados detalhados
| Severidade | Arquivo:linha | Descrição |
| --- | --- | --- |
| Sem achado | — | Não houve evidência verificável de vulnerabilidades em banco sem tranca, permissões no navegador, IDOR, secrets hardcoded ou XSS no código atual. |

## Recomendações priorizadas
- P1: manter validação server-side em todos os endpoints sensíveis e limitar alterações a `userId` autenticado; continuar usando `requiredAdmin` e `where: { userId }`.
- P2: continuar usando `helmet()` e `cors` restritivo em `back-end/src/app.ts`; revisar tokens expiração e monitoramento de infraestrutura.
- P3: manter `.env` fora do Git e validar `FIREBASE_PRIVATE_KEY`/`JWT_SECRET` no bootstrap; reduzir risco de drift entre ambiente local e produção.

## ISSUES PARA O GITHUB

Nenhuma issue de segurança acionável com evidência verificável foi encontrada no código atual para a stack detectada. Contudo, seguem recomendações de hardening que podem ser trackadas como tarefas operacionais:

--- ISSUE 0 ---
**Título:** [Segurança] Hardening contínuo de autenticação e segredo por ambiente
**Labels sugeridas:** security + baixa
**Descrição do problema:** A aplicação está corretamente validação do bootstrap e da autorização server-side, mas o ambiente de produção deve ser monitorado para garantir que variáveis sensíveis como `JWT_SECRET`, `FIREBASE_PRIVATE_KEY` e `RESEND_API_KEY` sempre venham do ambiente e nunca do Git.
**Evidência:** `back-end/src/config/env.ts:3-10`, `back-end/src/config/firebaseAdmin.ts:21-38`, `back-end/src/config/jwt.ts:3-8`.
**Impacto:** Reduz risco de regressão de configuração em deploys e evita vazamento acidental em repositórios ou logs.
**Sugestão de correção:** manter validação de startup, secret scanning no CI e `.env` fora do Git; usar secret manager da plataforma de deploy.
**Critérios de aceite:** checklist de segredos no CI; validação de env no boot; ausência de `.env` no histórico.
--- FIM ISSUE 0 ---