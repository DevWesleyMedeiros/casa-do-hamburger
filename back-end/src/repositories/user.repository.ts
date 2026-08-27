import { prisma } from '../db.js'

export const userRepository = {
  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email: email },
    })
  },

  findById: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
    })
  },

  create: async (data: { name: string; email: string; password: string; cep: string }) => {
    return await prisma.user.create({
      data: {
        ...data,
        provider: 'local',
      },
    })
  },
  async markEmailAsVerified(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })
  },
  async updatePasswordHash(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
  },
}
