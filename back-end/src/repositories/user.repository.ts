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
        provider: 'LOCAL',
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
  // parte no repositório resposável por criar um usuário com informações do google

  // encontrar um usuário do google pelo uid
  async findByFirebaseUid(firebaseUid: string) {
    return prisma.user.findUnique({
      where: { firebaseUid },
    })
  },
  // RF-53: cria usuário novo vindo do Google — provider=GOOGLE, password=null.
  // name/email/emailVerified vêm do Firebase ID Token já verificado (nunca do corpo cru da requisição - ver googleAuth.service.ts
  async createFromGoogle(data: {
    name: string
    email: string
    firebaseUid: string
    emailVerified: boolean
  }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        firebaseUid: data.firebaseUid,
        emailVerifiedAt: data.emailVerified ? new Date() : null,
        provider: 'GOOGLE',
        // password fica null (RN-AUTH-10) — cep também não existe para contas Google; ver nota no README sobre esse campo.
        cep: '',
      },
    })
  },
  // RF-54 + RN-AUTH-11: vincula uma conta LOCAL existente a uma identidade Google, SEM criar usuário novo. Só deve ser chamado depois que service já confirmou email_verified=true (o gate de segurança fica no service, não aqui — este método só persiste).
  async linkGoogleIdentity(userId: string, firebaseUid: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        firebaseUid,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })
  },
}
