import type { Request } from 'express'
import { ipKeyGenerator, MemoryStore, rateLimit } from 'express-rate-limit'

// Chave "ampla": identifica só a origem da requisição (IP)
function broadKey(req: Request): string {
  return ipKeyGenerator(req.ip as string, 56)
}

// Chave "focada": identifica origem + alvo específico (email normalizado)
function targetedKey(req: Request): string {
  const email = req.body?.email?.toLowerCase?.().trim?.() ?? 'unknown'
  return `${ipKeyGenerator(req.ip as string, 56)}:${email}`
}

/**
 * Camada ampla: trava volume total de tentativas de login vindas de UMA origem,
 * não importa qual conta esteja sendo alvo. Cobre credential stuffing
 * (bot testando várias contas a partir do mesmo IP/rede).
 */
export const loginLimiterBroadStore = new MemoryStore()
export const loginLimiterBroad = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20, // mais permissivo — cobre várias pessoas atrás do mesmo NAT. Uma requisições com e-mails diferentes do mesmo IP devem cair no 429 do broad, mesmo sem repetir nenhum e-mail.
  store: loginLimiterBroadStore,
  message: { error: 'Muitas tentativas de login detectadas nesta origem. Aguarde 15 minutos.' },
  statusCode: 429,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: broadKey,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      message: (options.message as { error: string }).error,
      status: options.statusCode,
    })
  },
})

/**
 * Camada focada: trava tentativas repetidas contra UMA conta específica,
 * vindas da MESMA origem. Protege o usuário-alvo de brute force direcionado.
 *
 * Observação: a chave é `IP + email` (não email global). Se 6 IPs diferentes
 * tentarem o mesmo e-mail, este limite NÃO estoura. Isso é um trade-off
 * conhecido e documentado na ADR-0001 — camada Broad cobre IP variado
 * (credential stuffing) e a auditoria por LoginAttempt (futura) cobre padrão
 * "muitos IPs → mesmo email".
 */
export const loginLimiterTargetedStore = new MemoryStore()
export const loginLimiterTargeted = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5,
  store: loginLimiterTargetedStore,
  message: { error: 'Muitas tentativas de login para este e-mail. Aguarde 15 minutos.' },
  statusCode: 429,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: targetedKey,
  // Padroniza formato de erro com o resto da aplicação ({ message, status })
  // em vez do padrão { error } do express-rate-limit. AxiosInterceptor do
  // frontend já trata `message`; manter a mesma forma evita bug de UX.
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      message: (options.message as { error: string }).error,
      status: options.statusCode,
    })
  },
})

// Aplica as duas camadas em sequência (broad primeiro, depois targeted)
export const loginLimiter = [loginLimiterBroad, loginLimiterTargeted]

/**
 * Camada ampla: trava volume total de registros vindos de UMA origem.
 * Cobre bots criando contas em massa.
 */
export const registerLimiterBroadStore = new MemoryStore()
export const registerLimiterBroad = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  store: registerLimiterBroadStore,
  message: {
    error: 'Muitas tentativas de registro detectadas nesta origem. Tente novamente mais tarde.',
  },
  statusCode: 429,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: broadKey,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      message: (options.message as { error: string }).error,
      status: options.statusCode,
    })
  },
})

/**
 * Camada focada: trava tentativas repetidas de registro para O MESMO e-mail
 * vindo da mesma origem. Protege contra email bombing (spam de verificação)
 * e retries acidentais/deliberados mirando um alvo específico.
 */
export const registerLimiterTargetedStore = new MemoryStore()
export const registerLimiterTargeted = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  store: registerLimiterTargetedStore,
  message: { error: 'Muitas tentativas de registro para este e-mail. Tente novamente mais tarde.' },
  statusCode: 429,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: targetedKey,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      message: (options.message as { error: string }).error,
      status: options.statusCode,
    })
  },
})

export const registerLimiter = [registerLimiterBroad, registerLimiterTargeted]
