import type { AuditFilters } from '../types/AuditLog';
// identificações de nossas chaves no cache. Serão responsáveis por identificar os dados no cache.
import { sessionRequests } from '../shared/services/sessionRequests';

export const queryKeys = {
  private: ['private'] as const,
  products: ['products'] as const,
  cartItems: ['private', 'cartItems'] as const,
  cartFor: (id?: string) => ['private', 'cartItems', id, sessionRequests.generation()] as const,
  me: ['private', 'me'] as const,
  orders: ['private', 'orders'] as const,
  analytics: ['private', 'analytics'] as const,
  audit: ['private', 'audit'] as const,
  auditFor: (id: string | undefined, admin: boolean, filters: AuditFilters) =>
    ['private', 'audit', id, admin, sessionRequests.generation(), filters] as const,
  analyticsFor: (id: string | undefined, admin: boolean, from: string, to: string) =>
    ['private', 'analytics', id, admin, sessionRequests.generation(), from, to] as const,
  ordersFor: (id?: string, admin = false) =>
    ['private', 'orders', id, admin, sessionRequests.generation()] as const,
};
