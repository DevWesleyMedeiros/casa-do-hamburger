import type { OrderStatus } from './Order';

export const AUDIT_ACTION_LABELS = {
  PRODUCT_CREATED: 'Produto criado',
  PRODUCT_DELETED: 'Produto excluído',
  ORDER_STATUS_CHANGED: 'Status do pedido alterado',
  ORDER_CANCELLED: 'Pedido cancelado',
} as const;
export type AuditAction = keyof typeof AUDIT_ACTION_LABELS;
interface ProductFields {
  name: string;
  category: string;
  price: number;
}
interface OrderFields {
  status: OrderStatus;
}
export type AuditLog = {
  id: string;
  actorId: string;
  entityId: string;
  requestId: string;
  createdAt: string;
} & (
  | { action: 'PRODUCT_CREATED'; entityType: 'PRODUCT'; before: null; after: ProductFields }
  | { action: 'PRODUCT_DELETED'; entityType: 'PRODUCT'; before: ProductFields; after: null }
  | {
      action: 'ORDER_STATUS_CHANGED' | 'ORDER_CANCELLED';
      entityType: 'ORDER';
      before: OrderFields;
      after: OrderFields;
    }
);
export interface AuditFilters {
  action?: AuditAction;
  entityType?: 'PRODUCT' | 'ORDER';
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}
export interface AuditPage {
  items: AuditLog[];
  nextCursor: string | null;
}
