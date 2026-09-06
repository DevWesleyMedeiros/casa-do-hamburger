import type { Request } from 'express'
import { ipKeyGenerator, MemoryStore, rateLimit } from 'express-rate-limit'

// Chave "ampla": identifica só a origem da requisição (IP)
function broadKey(req: Request): string {
  return ipKeyGenerator(req.ip as string, 56)
  // O número 56 indica o tamanho do prefixo de rede (máscara /56) usado para agrupar endereços IPv6. Em vez de limitar cada IP final individualmente, ele agrupa todos os dispositivos de uma mesma rede ou provedor que compartilham os primeiros 56 bits, evitando que redes domésticas ou corporativas esgotem o limite
}
// Chave "focada": identifica origem + alvo específico (email normalizado)
function targetedKey(req: Request): string {
  const email = req.body?.email?.toLowerCase?.().trim?.() ?? 'unknown'
  return `${ipKeyGenerator(req.ip as string, 56)}:${email}`
}
// rate-limiter único para cada e-mail
function emailKey(req: Request): string {
  const email = req.body?.email?.toLowerCase?.().trim?.() ?? 'unknown'
  return email
}
// MemoryStore - (ou armazenamento em memória) em bibliotecas de rate limiting para Node.js (como express-rate-limit ou conceitos similares em rate-limiter-flexible) é o mecanismo padrão que guarda a contagem de requisições de cada usuário diretamente na memória RAM do processo do servidor Node.js
// FUNCIONAMENTO: Armazenamento interno: Utiliza estruturas nativas do JavaScript (como objetos ou mapas Map) para associar um identificador (geralmente o endereço IP do cliente) à quantidade de acessos feitos.
// Controle de tempo: Mantém o registro do tempo limite (windowMs ou duration) para zerar as contagens assim que o período expirar.
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

export const forgotPasswordBroadLimiterStore = new MemoryStore()
export const forgotPasswordBroadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  store: forgotPasswordBroadLimiterStore,
  keyGenerator: broadKey,
  standardHeaders: true,
  legacyHeaders: false,
})

export const forgotPasswordEmailLimiterStore = new MemoryStore()
export const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  store: forgotPasswordEmailLimiterStore,
  keyGenerator: emailKey,
  standardHeaders: true,
  legacyHeaders: false,
})

export const resetPasswordBroadLimiterStore = new MemoryStore()
export const resetPasswordBroadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  store: resetPasswordBroadLimiterStore,
  keyGenerator: broadKey,
  standardHeaders: true,
  legacyHeaders: false,
})

// rate-limiter para google auth RN-AUTH-12: Camada broad (por IP) aplicada no middleware
// A camada targeted (por UID) é aplicada no serviço, após verificar o token (pois email/UID só estão disponíveis depois da decodificação)
export const googleAuthBroadLimiterStore = new MemoryStore()
export const googleAuthBroadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  store: googleAuthBroadLimiterStore,
  keyGenerator: broadKey,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de login com Google detectadas nesta origem. Aguarde 15 minutos",
  },
  statusCode: 429,
  standardHeaders: 'draft-8',
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      message: (options.message as { error: string }).error,
      status: options.statusCode,
    })
  }
})

// Store compartilhado para o rate limiter direcionado por UID do Google
export const googleAuthTargetedStore = new MemoryStore()
export const googleAuthTargetedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Mesmo limite direcionado das outras rotas de login
  store: googleAuthTargetedStore,
  legacyHeaders: false,
  standardHeaders: 'draft-8'
})