import type { Order, OrderItem, Payment } from '../../generated/prisma/index.js'

/**
 * DTO do item de pedido (OrderItem).
 *
 * Por que existe: o front precisa exibir cada item do pedido (nome, foto,
 * preço, quantidade) sem carregar campos irrelevantes ou sensíveis do banco.
 *
 * Campos INTENCIONALMENTE OMITIDOS:
 * - orderId: é FK de relacionamento. Este DTO só é consumido aninhado dentro
 *   de OrderResponseDTO.items[], então o front já sabe a qual pedido pertence.
 *   Devolvê-lo de novo seria dado redundante inflando o payload sem uso real
 */
export interface OrderItemDTO {
  id: string
  productId: string | null
  productName: string
  productImageUrl: string | null
  unitPrice: number // em CENTAVOS (inteiro) — RN-ORDER-04, evita erro de arredondamento de float
  quantity: number
  subtotal: number // também em centavos, mesma regra do unitPrice
}

/**
 * DTO de pagamento (Payment).
 *
 * Por que existe: o front só precisa saber "como está o pagamento desse
 * pedido" (status) e, opcionalmente, por qual meio (gatewayProvider) —
 * o suficiente pra renderizar um badge/label na UI.
 *
 * Campos INTENCIONALMENTE OMITIDOS (aqui por SEGURANÇA, não só limpeza):
 * - gatewayId: é o identificador do pagamento dentro do gateway EXTERNO
 *   (ex.: Stripe). Expor esse ID no browser cria uma superfície de
 *   correlação/enumeração que não tem nenhum uso legítimo no front hoje
 *   (OWASP API3:2023 — Excessive Data Exposure). Nunca deve sair da API.
 * - id / orderId: FKs de relacionamento — mesmo raciocínio do OrderItemDTO,
 *   redundantes porque este DTO só existe aninhado dentro do pedido.
 */
export interface PaymentDTO {
  status: Payment['status']
  gatewayProvider: string | null
}

/**
 * DTO de resposta do pedido (Order) — o "envelope" final que o controller
 * devolve ao front. Combina Order + items[] + payment num único payload,
 * evitando 3 requisições separadas (Composite DTO Pattern).
 */
export interface OrderResponseDTO {
  id: string
  status: Order['status']
  total: number // centavos — mesma regra de unitPrice/subtotal
  items: OrderItemDTO[]
  payment: PaymentDTO | null // null quando o pagamento ainda não foi gerado
  createdAt: Date // Em runtime, após JSON.stringify (res.json), chega ao front como STRING ISO 8601, não como Date. Ver nota de serialização na explicação acima do código.
  updatedAt: Date
}

/**
 * Tipo auxiliar apenas para o input de toOrderDTO: representa a Order do
 * Prisma já acompanhada de suas relações carregadas via `include`
 * (items e payment). Não é exportado como DTO — é um tipo de transporte
 * interno entre a camada de repository e a de serialização.
 */
type OrderWithRelation = Order & {
  items: OrderItem[]
  payment: Payment | null
}

/**
 * Serializa um único OrderItem do Prisma para OrderItemDTO.
 * Extraída como função própria para ser reaproveitada tanto isoladamente
 * (ex.: endpoint que retorna um item específico) quanto dentro de
 * toOrderDTO — mantendo uma ÚNICA fonte de verdade para esse mapeamento (DRY).
 */
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

/**
 * Serializa um único Payment do Prisma para PaymentDTO.
 * Extraída por simetria com toOrderItemDTO — mesmo motivo: evitar duplicar
 * a lógica de "quais campos do Payment saem" em mais de um lugar do código.
 */
export const toPaymentDTO = (payment: Payment): PaymentDTO => {
  return {
    status: payment.status,
    gatewayProvider: payment.gatewayProvider,
  }
}

/**
 * Ponto de entrada principal: transforma uma Order (com relações carregadas
 * pelo repository via `include: { items: true, payment: true }`) no DTO
 * final que o controller devolve na resposta HTTP.
 *
 * Reaproveita toOrderItemDTO/toPaymentDTO em vez de remapear os campos
 * manualmente — se um campo mudar em qualquer um dos DTOs, muda em um
 * único lugar.
 */
export const toOrderDTO = (order: OrderWithRelation): OrderResponseDTO => {
  return {
    id: order.id,
    status: order.status,
    total: order.total,
    items: order.items.map(toOrderItemDTO),
    payment: order.payment ? toPaymentDTO(order.payment) : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}
