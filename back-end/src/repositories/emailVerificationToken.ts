import { prisma } from '../db.js'

// criando token de verificação
// aqui eu vou criar um token de verificação para o usuário passando o userId, token e expiresAt
export const emailVerificationTokenRepository = {
  async create(userId: string, token: string, expiresAt: Date) {
    return prisma.emailVerificationToken.create({
      data: { userId, token, expiresAt },
    })
  },

  // aqui eu vou encontrar um token de verificação pelo token
  async findByToken(token: string) {
    return prisma.emailVerificationToken.findUnique({
      where: { token, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    })
  },
  // aqui eu vou usar um token de verificação
  async useToken(token: string) {
    return prisma.emailVerificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    })
  },

  // aqui eu vou marcar um token de verificação como usado
  async markAsUsed(id: string) {
    return prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    })
  },
}
