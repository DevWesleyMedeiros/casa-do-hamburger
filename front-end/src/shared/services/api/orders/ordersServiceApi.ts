import type { Order, OrderStatus } from "../../../../types/Order";
import { api } from "../ApiConfig";

export const orderSeriviceApi = {
  createOrder: async (): Promise<Order> => {
    const { data } = await api.post<Order>("/orders");
    return data;
  },
  /** RF-36 (usuário comum) — o backend decide o escopo (próprio vs. admin) pelo JWT */
  getMyOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>("/orders");
    return data;
  },
  /** RF-35 — admin pode filtrar por status */
  getAllOrder: async (status?: OrderStatus): Promise<Order[]> => {
    const { data } = await api.get<Order[]>("/orders", {
      params: status ? { status } : undefined,
    });
    return data;
  },
  getOrderById: async (orderId: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${orderId}`);
    return data;
  },
  /** RF-35/38 — admin-only; o backend já rejeita com 403 caso contrário */
  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> => {
    const { data } = await api.patch<Order>(`/orders/${orderId}/status`, {
      status,
    });
    return data;
  },
  /** RF-40 cancelamento da ordem*/
  cancelOrder: async (orderId: string): Promise<Order> => {
    const { data } = await api.post<Order>(`/orders/${orderId}/cancel`);
    return data;
  },
};
