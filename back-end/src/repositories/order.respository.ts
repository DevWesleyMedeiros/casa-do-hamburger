import { prisma } from '../db.js'
import type { OrderStatus } from '../../generated/prisma/index.js'

// snapshot de order
interface SnapshotItemInput {
  productId: string
  productName: string
  productImageUrl: string | null
  unitPrice: number
  quantity: number
  subtotal: number
}

/**
 * ORDER_INCLUDE é uma constante que instrui o Prisma a fazer os "JOINs" necessários no banco de dados para trazer o pacote completo do pedido
 * No Prisma, por padrão, quando você busca ou atualiza um registro (como um Order), ele traz apenas os dados daquela tabela específica (id, total, status, datas, etc.). Ele não traz os dados das tabelas relacionadas de forma automática (relacionamentos do tipo 1 para muitos, ou 1 para 1).
 */
const ORDER_INCLUDE = {
  items: true,
  payment: true,
  // Necessário para notificar o DONO do pedido (RF-39), não quem está fazendo a chamada (que pode ser um admin alterando o status de outra pessoa) — ver uso em order.service.ts.
  user: { select: { email: true } },
} as const

export const OrderRepository = {
  /**
   * Cria o Order + OrderItems (snapshot) + Payment simulado + esvazia o carrinho, tudo em uma única transação atômica ($transaction) - (RN-ORDER-01, RN-CART-06,
   * US-05). Se qualquer etapa falhar, nada é persistido.
   */
  async createOrderWithItems(params: {
    userId: string
    total: number
    items: SnapshotItemInput[]
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: params.userId,
          total: params.total,
          status: 'PENDING',
          items: { createMany: { data: params.items } },
          payment: { create: { status: 'SIMULATED' } },
        },
        include: ORDER_INCLUDE,
      })
      // após envio do pedido, vamos deletar o cartItem associado a ele no carrinho. Basicamente, zeramos o carrinho
      await tx.cartItem.deleteMany({ where: { userId: params.userId } })

      return order
    })
  },
  // retornar uma order atrelada a um id de ordem
  async findOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    })
  },
  // retornar uma order atrelada ao id do usuário
  async findOrdersByUser(userId: string) {
    return prisma.order.findMany({
      where: { userId: userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
  },
  /** RF-35 — listagem administrativa, com filtro opcional de status */
  async findAllOrders(filter?: { status?: OrderStatus }) {
    return prisma.order.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
  },

  async updateOrderStatus(orderId: string, orderStatus: OrderStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus },
      include: ORDER_INCLUDE,
    })
  },
  /** Busca os CartItems do usuário já com o produto e a imagem primária (para snapshot) */
  async findCartItemsForCheckout(userId: string) {
    return prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
      },
    })
  },
}
