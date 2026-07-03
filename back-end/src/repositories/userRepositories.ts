// camada que irá conversar com o banco de dados, utilizando o Prisma Client para realizar as operações de CRUD (Create, Read, Update, Delete) relacionadas aos usuários.
// Aqui eu defino as funções para procurar um registro no banco de dados pelo email ou criar um novo usuário.
// como se fosse um estoquista: conhece cada ingrediente, vai ao banco de dados e busca o que precisa
// Queries no banco via Prisma. Só conhece o PRISMA


import { handlePrismaError } from '../utils/handlePrismaError'
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
      return handlePrismaError(error)
      // return aqui garante que meu catch error acaba nesse lançamento
    }
  },

  // função para buscar os CartItems no meu banco de dados. O parâmetro include foi dado, uma vez que dentro da minha tabela CartItem possui um atributo product e ele é um chave estrangeira que faz referência ao produto cadastrado na tabela Products. Sendo assim, eu consigo pegar as informações desse produto como nome, descrição etc. O mesmo eu poderia fazer com o meu user
  findCartItemProduct: async (userId: string) => {
    try {
      return await prisma.cartItem.findMany({
        where: { userId: userId },
        include: { user: true, product: true },
        // product: true,
      })
    } catch (error) {
      return handlePrismaError(error)
    }
  },

  // aumentar a quantidade do produto cadastrado
  createCartItem: async (productId: string, userId: string) => {
    // productId: vem da body da requisição quando eu clicar no ícone do cart
    // userId virá do requisição que possui um user.id

    // validação para verificar se o productId que vem do frontend é igual ao id do produto que está atrelado a um usuário na minha tabela CartItem. Se for, eu só vou a atualizar o quantity relacionado aquele produto

    // repository com upsert — substitui o findFirst + update/create (fazem duas queries no banco de dados). Com upserts evitam race condition (outros registros do mesmo poderiam ser criados do mesmo entre eles) (único where), pois o prisma faz tudo em uma única operação atômica
    try {
      return await prisma.cartItem.upsert({
        where: {
          userId_productId: { userId, productId },
          // Prisma gera o nome do compound key unindo os campos com _ Visible em: generated/prisma/index.d.ts → CartItemWhereUniqueInput
        },
        // caso eu o usuário (identificado pelo userId )atual já tenha aquele produto em products (identificado pelo productId desse produto), então eu incremento 1
        update: {
          quantity: { increment: 1 }, // se já existe → incrementa
        },
        // caso eu não tenha o produto, eu o adiciono na tabela CartItem pagando o id do produto (vem da req com o userId do usuário atual)
        create: {
          product: { connect: { id: productId } },
          user: { connect: { id: userId } },
          // quantity começa em 1 pelo @default(1) do schema
        },
      })
    } catch (error) {
      return handlePrismaError(error)
      // handlePrismaError são do tipo never, ou seja, nunca retorna, mas lançam algo. Nesse caso, excessões
    }
  },
  deleteCartItemById: async (cartItemId: string, userId: string) => {
    try {
      return await prisma.cartItem.delete({
        where: { id: cartItemId, userId },
      })
    } catch (error) {
      return handlePrismaError(error)
    }
  },
}
