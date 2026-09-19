import type { OrderStatus } from '../../../generated/prisma/index.js'
import { toOrderDTO, type OrderResponseDTO } from '../../dtos/order.dto.js'
import { AppError } from '../../errors/AppError.js'
import { OrderRepository } from '../../repositories/order.respository.js'
import { resendEmailService } from '../email/resendEmail.service.js'
import { notifyOrderStatusChanged } from '../orderServices/orderNotification.service.js'
import { OrderServiceMachine } from './orderStateMachine.service.js'

// Note: só id/admin são necessários aqui — o e-mail de notificação (RF-39) vem sempre de order.user.email (o DONO do pedido), nunca de quem chama.
interface RequesterContext {
  id: string
  admin: boolean
}

export const OrderServiceItems = {
  /**
   * RF-32/33 + US-05 — converte o carrinho do usuário em um Order. Todo o cálculo de total acontece aqui, no backend (RN-CART-06)
   * O valor enviado pelo cliente (se algum) é sempre ignorado
   */
  createOrder: async (userId: string): Promise<OrderResponseDTO> => {
    const cartItems = await OrderRepository.findCartItemsForCheckout(userId)

    if (cartItems.length === 0) {
      throw new AppError(400, 'Carrinho vazio - adicione itens para finalizar o pedido')
    }
    const snapshotItems = cartItems.map((item) => {
      const subtotal = item.product.price * item.quantity
      return {
        productId: item.productId,
        productName: item.product.name, // snapshot — RN-ORDER-01
        productImageUrl: item.product.images[0]?.url ?? null, // snapshot — RF-33
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: subtotal,
      }
    })
    const total = snapshotItems.reduce((sum, item) => sum + item.subtotal, 0)
    const order = await OrderRepository.createOrderWithItems({
      userId,
      total,
      items: snapshotItems,
    })
    return toOrderDTO({
      ...order,
      payment: order.payment[0] ?? null,
    })
  },
  /** RF-36 — histórico do próprio usuário */
  listMyOrders: async (userId: string): Promise<OrderResponseDTO[]> => {
    const orders = await OrderRepository.findOrdersByUser(userId)
    return orders.map((order) =>
      toOrderDTO({
        ...order,
        payment: order.payment[0] ?? null,
      }),
    )
  },
  /** RF-35 — listagem administrativa (todos os pedidos, com filtro opcional) */
  listAllOrders: async (status?: OrderStatus): Promise<OrderResponseDTO[]> => {
    const orders = await OrderRepository.findAllOrders({ status })
    return orders.map((order) =>
      toOrderDTO({
        ...order,
        payment: order.payment[0] ?? null,
      }),
    )
  },

  /**
   * RN-ORDER-06 — mitigação de IDOR (OWASP A01). A checagem de posse nasce
   * aqui, na mesma função que expõe GET /orders/:id, por exigência explícita
   * da doc (não é um ajuste "depois").
   */
  getOrderForRequester: async (
    orderId: string,
    requester: RequesterContext,
  ): Promise<OrderResponseDTO> => {
    const order = await OrderRepository.findOrderById(orderId)
    if (!order) {
      throw new AppError(404, 'Pedido não encontrado')
    }
    if (!requester.admin && order.userId !== requester.id) {
      // 404, não 403 — não revela a um usuário que o ID existe e pertence a outra pessoa
      throw new AppError(404, 'Pedido não encontrado')
    }
    return toOrderDTO({
      ...order,
      payment: order.payment[0] ?? null,
    })
  },
  /**
   * RF-35/38 — transição de status pelo admin (hoje só ADMIN existe; a checagem de papel↔transição de RN-ORDER-07 fica pronta para plugar
   * ATTEND/DELIVER no futuro sem reescrever esta função)
   */
  updateStatus: async (
    orderId: string,
    nextStatus: OrderStatus,
    requester: RequesterContext,
  ): Promise<OrderResponseDTO> => {
    const order = await OrderRepository.findOrderById(orderId)
    if (!order) {
      throw new AppError(404, 'Pedido não encontrado')
    }

    // requiredAdmin já barra não-admins na rota; esta linha é defesa em
    // profundidade caso a função um dia seja chamada de outro lugar.
    if (!requester.admin) {
      throw new AppError(403, 'Apenas administradores podem alterar o status do pedido')
    }

    OrderServiceMachine.assertValidTransition(order.status, nextStatus) // RN-ORDER-05 — lança 422 se inválida

    const updated = await OrderRepository.updateOrderStatus(orderId, nextStatus)

    // RF-39 — best-effort, nunca derruba a resposta principal em caso de falha.
    // Notifica o DONO do pedido (order.user.email), NÃO o requester — quem
    // está chamando esta função é o admin fazendo a alteração, não o cliente.
    await notifyOrderStatusChanged(resendEmailService, {
      to: order.user.email,
      orderId,
      status: nextStatus,
    }).catch((err) => {
      console.error(
        `[order.service] Falha ao notificar mudança de status do pedido ${orderId}:`,
        err,
      )
    })

    return toOrderDTO({
      ...updated,
      payment: updated.payment[0] ?? null,
    })
  },

  /**
   * RF-40 — cancelamento. Cliente comum só pode cancelar em PENDING
   * (RN-ORDER-06 + regra de janela). Admin pode cancelar também em
   * PREPARING (cancelamento excepcional, Seção 8 da doc).
   */
  cancelOrder: async (orderId: string, requester: RequesterContext): Promise<OrderResponseDTO> => {
    const order = await OrderRepository.findOrderById(orderId)
    if (!order) {
      throw new AppError(404, 'Pedido não encontrado')
    }
    if (!requester.admin && order.userId !== requester.id) {
      throw new AppError(404, 'Pedido não encontrado') // RN-ORDER-06 — mesmo tratamento de IDOR
    }
    const canCancel = requester.admin
      ? order.status === 'PENDING' || order.status === 'PREPARING'
      : OrderServiceMachine.canCustomerCancel(order.status)

    if (!canCancel) {
      throw new AppError(422, `Pedido no status ${order.status} não pode ser cancelado`)
    }

    const update = await OrderRepository.updateOrderStatus(orderId, 'CANCELLED')
    // Mesma observação: notifica o dono do pedido, não quem chamou a função
    // (relevante quando é o admin cancelando em nome do cliente).
    await notifyOrderStatusChanged(resendEmailService, {
      to: order.user.email,
      orderId,
      status: 'CANCELLED',
    }).catch((err) => {
      console.error(`[order.service] falha ao notificar cancelamento do pedido ${orderId}, ${err})`)
    })
    return toOrderDTO({
      ...update,
      payment: update.payment[0] ?? null,
    })
  },
}
