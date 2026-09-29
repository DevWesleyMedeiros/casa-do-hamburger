// Espelha OrderResponseDTO do backend (backend/src/dtos/order.dto.ts)
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'SIMULATED' | 'PENDING' | 'PAID' | 'FAILED';

// para toOrderItemDTO
export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

// para OrderResponseDTO
export interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[]; // lista de itens do pedido, inclui o quantidade do produto no carrinho
  payment: OrderPayment | null;
  createdAt: string;
  updatedAt: string;
}

// para toPaymentDTO
export interface OrderPayment {
  status: PaymentStatus;
  gatewayProvider: string | null;
}

// Rótulos em Português-BR para exibição — mantém tradução fora do componente
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};
