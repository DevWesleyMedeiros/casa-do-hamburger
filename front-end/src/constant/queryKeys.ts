// identificações de nossas chaves no cache. Serão responsáveis por identificar os dados no cache.
export const queryKeys = {
  products: ['products'] as const,
  cartItems: ['cartItems'] as const,
  me: ['me'] as const,
  orders: ['orders'] as const,
};
