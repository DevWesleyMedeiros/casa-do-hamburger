/**
 * Entidade de domínio / linha da tabela RecoveryPass no banco (Prisma).
 * Uso: exclusivamente no backend (service/repository).
 *
 * NUNCA importar este tipo no frontend como resposta de API — ele expõe
 * tokenHash e userId, dados sensíveis que não devem trafegar até o navegador.
 */
export interface RecoveryPassResponse {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

/**
 * DTO público de resposta para /auth/forgot-password e /auth/reset-password.
 * É o único shape que o frontend deve conhecer para essas rotas.
 */
export interface AuthMessageResponse {
  message: string;
}
