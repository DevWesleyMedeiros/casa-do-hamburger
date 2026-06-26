// camada que irá conversar com o banco de dados, utilizando o Prisma Client para realizar as operações de CRUD (Create, Read, Update, Delete) relacionadas aos usuários.
// Aqui eu defino as funções para procurar um registro no banco de dados pelo email ou criar um novo usuário.
// como se fosse um estoquista: conhece cada ingrediente, vai ao banco de dados e busca o que precisa
// Queries no banco via Prisma. Só conhece o PRISMA

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { Prisma } from '../../generated/prisma/client'
import { prisma } from '../db'

// procura no banco de dados um usuário pelo email, utilizando o método findFirst do Prisma Client. Se encontrar um usuário com o email fornecido, ele retorna os dados desse usuário; caso contrário, retorna null.
// findfirst() - encontra o primeiro email correspondente ao passado como parâmetro
// findUnique() - encontra o único email, já que passamos essa constraint @unic no nosso model. Aqui é mais performática
export const userRepository = {
  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email: email },
    })
  },

  // cria um novo usuário no banco de dados, utilizando o método create do Prisma Client. Ele recebe um objeto data contendo as informações do usuário (nome, email, senha e cep) e os insere esses dados na tabela de usuários do banco de dados. O resultado é o registro do usuário recém-criado.
  create: async (data: { name: string; email: string; password: string; cep: string }) => {
    return await prisma.user.create({ data })
  },

  // função que irá buscar os produtos cadastrados no banco de dados
  findManyProducts: async () => {
    // return await prisma.products.findMany({
    // se fosse com o método select: { id: true, name: true, Description: true, price: true }
    // comando select do Postgresql no prisma para retornar alguns atributos apenas, daqueles que forma cadastrados. true garante o retorno
    return await prisma.products.findMany()
  },

  // função que buscará por um produto específico identificado pelo id e fazer a deleção. O retorno aqui é do id do produto deletado (usamos ele para aplicar um filtro e atualizar no lista display no frontend)
  findProductAndDelete: async (id: string) => {
    try {
      return await prisma.products.delete({
        where: { id: id },
      })
    } catch (error) {
      // P2025 = "Record to delete does not exist" — código oficial do Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null // ← converte a exceção do Prisma em um retorno previsível. A partir da daí, eu já posso manipular um retorno com status personalizado caso id não encontrado, no arquivo authServices
      }
      throw error // qualquer outro erro (conexão, etc.) continua subindo normalmente
    }
  },

  // função para buscar os CartItems no meu banco de dados. O parâmetro include foi dado, uma vez que dentro da minha tabela CartItem possui um atributo product e ele é um chave estrangeira que faz referência ao produto cadastrado na tabela Products. Sendo assim, eu consigo pegar as informações desse produto como nome, descrição etc. O mesmo eu poderia fazer com o meu user
  findDbCartItemProduct: async (userId: string) => {
    try {
      return await prisma.cartItem.findMany({
        where: { userId: userId },
        include: { user: true, product: true },
        // product: true,
      })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return null
      }
      throw error
    }
  },
}
