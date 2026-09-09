import type { Order, OrderItem, Payment } from '../../generated/prisma/index.js'

// export o DTO para os itens de OrderItem
export interface OrderItemDTO {
  id: string
  // orderId não retorna, pois não é necessário para o front-end, pois o front-end já sabe que esses itens pertencem a um pedido específico
  productId: string | null
  productName: string
  productImageUrl: string | null
  unitPrice: number // vem em centavos (RN-ORDER-04)
  quantity: number
  subtotal: number // vem em centavos também
}

// export o DTO para o pagamento (Payment)
export interface PaymentDTO {
  status: Payment['status'] // enum de stutus
  gatewayProvider: string | null
  // id da order não retorna
  // orderId é campo de ralacionamento, por isso não retorna também
  // gatewayId não retorna, pois não é necessário para o front-end, pois o front-end já sabe que esse é o id do pagamento no gateway de pagamento
}

// export o DTO para os pedidos (Order)
export interface OrderResponseDTO {
  id: string
  status: Order['status']
  total: number // centavos
  items: OrderItemDTO[]
  payment: PaymentDTO | null
  createdAt: Date
  updatedAt: Date
}
// export o DTO para os pedidos (Order) com relações
// OrderWithRelation exporta minha Order com suas propriedade de Order e adiciana também um OrderItem, na propriedade Items com suas propriedades de OrderItem e Payment com suas propriedades de payment
type OrderWithRelation = Order & {
  items: OrderItem[]
  payment: Payment | null
}

export const toOrderDTO = (order: OrderWithRelation): OrderResponseDTO => {
  return {
    id: order.id,
    status: order.status,
    total: order.total,
    // para cada pedido gereado OrderItem, eu vou tirar o id da ordem, o id do produto, nome do produto, url da imagem do produto, preço unitário, quantidade, subtotal
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    payment: order.payment
      ? {
          status: order.payment.status,
          gatewayProvider: order.payment.gatewayProvider,
        }
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export const toOrderItemDTO = (item: OrderItem): OrderItemDTO => {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productImageUrl: item.productImageUrl,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }
}
