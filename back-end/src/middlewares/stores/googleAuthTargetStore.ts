import { MemoryStore } from 'express-rate-limit'

// Store compartilhado para o rate limiter direcionado por UID do Google
// Extraído para evitar referência circular entre rateLimiter.ts e googleAuth.service.ts
export const googleAuthTargetedStore = new MemoryStore()
