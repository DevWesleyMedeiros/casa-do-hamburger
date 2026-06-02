// camada que irá conversar com o banco de dados, utilizando o Prisma Client para realizar as operações de CRUD (Create, Read, Update, Delete) relacionadas aos usuários.
// Aqui eu defino as funções para procurar um registro no banco de dados pelo email ou criar um novo usuário.

import { prisma } from '../db'

export const userRepository = {
  findByEmail: async (email: string) => {
    return prisma.user.findFirst({
      where: { email: email },
    })
  },
  create: async (data: { name: string; email: string; password: string; cep: string }) => {
    return prisma.user.create({ data })
  },
}
