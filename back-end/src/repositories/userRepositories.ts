// camada que irá conversar com o banco de dados, utilizando o Prisma Client para realizar as operações de CRUD (Create, Read, Update, Delete) relacionadas aos usuários.
// Aqui eu defino as funções para procurar um registro no banco de dados pelo email ou criar um novo usuário.
// como se fosse um estoquista: conhece cada ingrediente, vai ao banco de dados e busca o que precisa
// Queries no banco via Prisma. Só conhece o PRISMA

import { prisma } from '../db'

// procura no banco de dados um usuário pelo email, utilizando o método findFirst do Prisma Client. Se encontrar um usuário com o email fornecido, ele retorna os dados desse usuário; caso contrário, retorna null.
export const userRepository = {
  findByEmail: async (email: string) => {
    return prisma.user.findFirst({
      where: { email: email },
    })
  },

  // cria um novo usuário no banco de dados, utilizando o método create do Prisma Client. Ele recebe um objeto data contendo as informações do usuário (nome, email, senha e cep) e insere esses dados na tabela de usuários do banco de dados. O resultado é o registro do usuário recém-criado.
  create: async (data: { name: string; email: string; password: string; cep: string }) => {
    return prisma.user.create({ data })
  },
}
