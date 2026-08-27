import { prisma } from '../db.js'

// responsável pelo CRUD de tokens de redefinição de senha, ou seja, aqui ele irá criar, tokens de redefinição de senha
export const passwordResetTokenRepository = {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.passwordResetToken.create({
      data,
    })
  },

  // responsável pelo buscar um token válido por seu hash; se for um token válido, ele irá retornar o usuário associado a ele. A condição "where" aqui determina que o token deve ser válido (usedAt: null) e não expirado (expiresAt: { gt: new Date() })
  // a condição "include" aqui determina que ele irá retornar o usuário associado ao token
  // gt é um operador que determina que a data de expiração do token deve ser maior que a data atual
  async findValidByHash(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: { user: true },
    })
  },
  // aqui, vai marcar o token como usado (usedAt: new Date()) onde o id passado com parâmetro for igual ao id do token
  async markAsUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    })
  },

  /**
   * RN-AUTH-14: ao emitir um novo token, invalida qualquer token anterior ainda válido do mesmo usuário — evita múltiplos links de reset ativos
   * simultaneamente (reduz superfície de uso indevido de um link antigo).
   */
  async invalidateActiveTokensForUser(userId: string) {
    return prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })
  },
}
