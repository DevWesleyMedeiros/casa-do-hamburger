# ADR-0001 — Rate Limiting Robusto em Rotas de Autenticação (Redis + Persistência Auditável)

| Campo | Valor |
|---|---|
| **Status** | 🔵 Proposto (evolução futura — não implementado na versão atual) |
| **Data** | 2026-07-20 |
| **Autor** | Wesley Medeiros |
| **Refs** | RF-12, RNF-06, OWASP A07, OWASP A09 |
| **Supersede** | Nenhum (primeira ADR do projeto) |

---

## Contexto

A versão inicial da feature de rate limiting em autenticação (RF-12 / RNF-06) foi implementada com `express-rate-limit` usando o `MemoryStore` padrão — contador mantido em memória do processo Node, por chave IP+email (login) ou IP (registro).

Essa solução resolve o requisito funcional imediato (bloquear tentativas excessivas), mas tem duas limitações conhecidas, aceitas conscientemente no momento da implementação inicial:

1. **Não é distribuída.** O `MemoryStore` guarda o contador na memória de *uma única instância* do processo. Se o backend rodar em mais de uma instância simultânea (Railway escalando horizontalmente, por exemplo), cada instância mantém seu próprio contador — um atacante distribuído entre requisições que caem em instâncias diferentes nunca acumula o limite real, e o rate limit perde eficácia.
2. **Não é auditável.** O contador existe só para decidir bloquear ou não; ele não persiste histórico. Não há como, hoje, consultar "quais foram as últimas tentativas de login falhas para este e-mail" ou "quais IPs mais tentaram login sem sucesso nas últimas 24h" — informação relevante tanto para investigar incidentes quanto para detectar padrões de abuso (credential stuffing distribuído, por exemplo, se manifesta como muitos IPs diferentes tentando o mesmo e-mail).

Esta ADR documenta a evolução proposta para resolver as duas limitações, a ser implementada quando o projeto justificar o custo adicional (ver seção "Quando implementar").

---

## Decisão

Adotar duas mudanças complementares e independentes, que podem ser implementadas em momentos distintos:

### 1. Store distribuído com Redis

Substituir o `MemoryStore` por um store baseado em Redis, mantendo a mesma API do `express-rate-limit` (menor esforço de migração):

```typescript
// middlewares/rateLimiter.ts
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase?.() ?? 'unknown';
    return `${ipKeyGenerator(req)}:${email}`;
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:login:',
  }),
});
```

**Alternativa avaliada:** `rate-limiter-flexible` com driver Redis nativo. Foi descartada por ora em favor de manter a API do `express-rate-limit` já em uso — reduz a superfície de mudança. Se no futuro o projeto precisar de recursos mais avançados (rate limit hierárquico, penalidades progressivas, bloqueio manual de chaves), reavaliar a migração para `rate-limiter-flexible`.

**Infraestrutura necessária:** uma instância Redis. Railway oferece Redis como add-on gerenciado — mantém a stack de deploy consistente com o restante do projeto (Vercel + Railway + Neon).

### 2. Persistência auditável de tentativas (tabela `LoginAttempt`)

Criar uma tabela dedicada, populada por um listener no fluxo de autenticação (não pelo middleware de rate limit — são responsabilidades diferentes: o middleware decide *bloquear*, o registro de auditoria apenas *documenta*):

```prisma
model LoginAttempt {
  id        String   @id @default(uuid())
  email     String
  ipAddress String
  userAgent String?
  success   Boolean
  createdAt DateTime @default(now())

  @@index([email, createdAt])
  @@index([ipAddress, createdAt])
}
```

Regras de gravação propostas:
- Gravar em **toda** tentativa de login (sucesso e falha), não só nas bloqueadas pelo rate limit — é isso que permite reconstruir o padrão de um ataque depois.
- Nunca gravar a senha (mesmo hasheada) nem qualquer campo sensível além dos listados.
- Retenção limitada (ex.: purgar registros com mais de 90 dias via job agendado) — evita que a tabela vire um repositório de dados pessoais sem prazo de expiração.

Essa tabela **não substitui** o Redis: o Redis decide em tempo real "bloqueio ou não bloqueio" (precisa ser rápido); a tabela serve para auditoria e análise posterior (pode ser mais lenta, é gravação assíncrona/best-effort).

---

## Consequências

**Positivas**
- Rate limit passa a funcionar corretamente mesmo com múltiplas instâncias do backend.
- Fecha o RF-12 em sua leitura mais estrita ("registrar tentativas falhas"), hoje coberto apenas pela interpretação operacional (contador em memória).
- Cria uma fonte de dados para, no futuro, alimentar alertas de segurança (ex.: notificar se um e-mail específico sofrer 50 tentativas falhas em 1h vindas de IPs diferentes — sinal de credential stuffing que o rate limit por IP+email sozinho não pega).

**Negativas / custos**
- Nova dependência de infraestrutura (Redis) — mais um serviço para provisionar, monitorar e manter disponível. Se o Redis cair, é preciso decidir o comportamento padrão: **fail-open** (deixa passar sem rate limit) ou **fail-closed** (bloqueia tudo). Recomendação: fail-open para rotas de autenticação, já que fail-closed causaria um DoS acidental do seu próprio login em caso de instabilidade do Redis — a decisão exata deve virar uma regra explícita na implementação.
- Tabela `LoginAttempt` armazena IPs, que são dados pessoais sob LGPD/GDPR — reforça a necessidade da política de retenção mencionada acima.
- Mais uma tabela para migrar e manter (`prisma migrate dev`), mais um índice para monitorar em volume de escrita alto.

---

## Quando implementar

Esta ADR **não é uma pendência imediata**. Critérios sugeridos para disparar a implementação:

1. **Redis:** quando o backend passar a rodar em mais de uma instância simultânea (autoscaling no Railway ou mudança de plano).
2. **Persistência auditável:** quando houver necessidade real de investigar um incidente de autenticação, ou quando o projeto ganhar um painel administrativo de segurança (ligado ao RNF-19 de observabilidade, ainda 🔵 proposto).

Até lá, a implementação atual (memória + RNF-06 funcional) é suficiente e é a opção mais simples que atende ao requisito — trocar antes da hora seria complexidade prematura.

---

## Impacto no documento de regras de negócio

Sugestão de atualização do `REGRAS_DE_NEGOCIO.md` para refletir esta decisão:

### Novo RNF (Seção 4 — Requisitos Não Funcionais)

| ID | Categoria | Requisito | Status |
|---|---|---|---|
| RNF-23 | Segurança | O armazenamento de rate limiting deve ser distribuído (Redis) quando o backend operar em múltiplas instâncias — ver ADR-0001 | 🔵 |
| RNF-24 | Segurança / Observabilidade | Tentativas de autenticação (sucesso e falha) devem ser persistidas de forma auditável, com política de retenção definida — ver ADR-0001 | 🔵 |

### Atualização da Seção 11 — Checklist OWASP

| Risco OWASP Top 10 | Mitigação no projeto | Status |
|---|---|---|
| A07 — Identification/Auth Failures | Mensagens de erro genéricas no login; rate limiting (store distribuído proposto em ADR-0001) | 🟡 |
| A09 — Logging & Monitoring Failures | Logs estruturados de erro de API; persistência auditável de tentativas de login proposta em ADR-0001 | 🔵 |

### Registro em /docs/architecture/adr/

Salvar este arquivo como `docs/architecture/adr/0001-rate-limiting-robusto-redis-auditoria.md`, conforme convenção definida na Seção 15.2 do próprio `REGRAS_DE_NEGOCIO.md` ("se mudou uma decisão arquitetural relevante, foi criado um ADR").
