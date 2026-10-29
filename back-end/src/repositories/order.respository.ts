import type { OrderStatus, Prisma } from '../../generated/prisma/index.js';
import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { withUserLock } from './userLock.js';

const CHECKOUT_INCLUDE = {
  product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
  user: { select: { name: true } },
} as const;

export type CheckoutCartItem = Prisma.CartItemGetPayload<{ include: typeof CHECKOUT_INCLUDE }>;

// snapshot de order
interface SnapshotItemInput {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
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
} as const;

export const OrderRepository = {
  /**
   * Cria o Order + OrderItems (snapshot) + Payment simulado + esvazia o carrinho, tudo em uma única transação atômica ($transaction) - (RN-ORDER-01, RN-CART-06,
   * US-05). Se qualquer etapa falhar, nada é persistido.
   */

  /**
   * @description Cria um pedido com seus itens, pagamentos e carrinho zerado.
   * @param userId id do usuário.
   * @param customerName Nome do cliente.
   * @param total Total do pedido.
   * @param items Os itens do pedido.
   * @returns O pedido criado.
   */
  async createOrderFromCart(
    userId: string,
    buildSnapshot: (items: CheckoutCartItem[]) => {
      customerName: string;
      total: number;
      items: SnapshotItemInput[];
    },
  ) {
    return withUserLock(userId, async (tx) => {
      // Leitura e snapshot só depois de adquirir o mesmo lock usado nas mutações do carrinho.
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: CHECKOUT_INCLUDE,
      });
      const params = buildSnapshot(cartItems);
      const order = await tx.order.create({
        data: {
          userId,
          customerName: params.customerName,
          total: params.total,
          status: 'PENDING',
          items: { createMany: { data: params.items } },
          payment: { create: { status: 'SIMULATED' } },
        },
        include: ORDER_INCLUDE,
      });
      // após envio do pedido, vamos deletar o cartItem associado a ele no carrinho
      await tx.cartItem.deleteMany({ where: { userId } });

      return order;
    });
  },
  // retornar uma order atrelada a um id de ordem
  async findOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
  },
  // retornar uma order atrelada ao id do usuário
  async findOrdersByUser(userId: string) {
    return prisma.order.findMany({
      where: { userId: userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  },
  /** RF-35 — listagem administrativa, com filtro opcional de status */
  async findAllOrders(filter?: { status?: OrderStatus }) {
    return prisma.order.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateOrderStatus(
    orderId: string,
    expectedStatus: OrderStatus,
    orderStatus: OrderStatus,
    onUpdated?: (tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: expectedStatus },
        data: { status: orderStatus },
      });
      if (updated.count !== 1)
        throw new AppError(
          409,
          'Pedido alterado por outra requisição. Atualize e tente novamente.',
        );
      await onUpdated?.(tx);
      return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
    });
  },
};
