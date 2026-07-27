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
})

/**
 * Camada focada: trava tentativas repetidas contra UMA conta específica,
 * vindas da mesma origem. Protege o usuário-alvo de brute force direcionado.
 */
export const loginLimiterTargetedStore = new MemoryStore()
export const loginLimiterTargeted = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5, // Seis requisições vindos do mesmo email independentemente do ip devem cair no 429 de target
  store: loginLimiterTargetedStore,
  message: { error: 'Muitas tentativas de login para este e-mail. Aguarde 15 minutos.' },
  statusCode: 429,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: targetedKey,
})

// Aplique as duas camadas em sequência (broad primeiro
export const Loginlimiter = [loginLimiterBroad, loginLimiterTargeted]

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
})

export const registerLimiter = [registerLimiterBroad, registerLimiterTargeted]
