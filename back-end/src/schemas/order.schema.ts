import { z } from 'zod';

export const UserUpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
});
// RF-35 — filtro opcional de status na listagem admin (GET /orders?status=...)
export const listOrdersQuerySchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
});
