// identificações de nossas chaves no cache. Serão responsáveis por identificar os dados no cache.
import { sessionRequests } from '../shared/services/sessionRequests';

export const queryKeys = {
  private: ['private'] as const,
  products: ['products'] as const,
  cartItems: ['private', 'cartItems'] as const,
  cartFor: (id?: string) => ['private', 'cartItems', id, sessionRequests.generation()] as const,
  me: ['private', 'me'] as const,
  orders: ['private', 'orders'] as const,
  ordersFor: (id?: string, admin = false) =>
    ['private', 'orders', id, admin, sessionRequests.generation()] as const,
};
