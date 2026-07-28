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

export const loginLimiterBroadStore = new MemoryStore()
export const loginLimiterBroad = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
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

export const loginLimiterTargetedStore = new MemoryStore()
export const loginLimiterTargeted = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  store: loginLimiterTargetedStore,
  message: { error: 'Muitas tentativas de login para este e-mail. Aguarde 15 minutos.' },
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
export const loginLimiter = [loginLimiterBroad, loginLimiterTargeted]

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
