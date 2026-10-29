import { expect, it } from 'vitest';
import { createProductsSchema } from '../../schemas/products.schemas.js';

const product = {
  name: 'Produto teste',
  description: 'Descrição de teste',
  category: 'HAMBURGUER',
};
it.each([1, 100, 2990, 1000000])('preserva %i centavos sem multiplicação', (price) => {
  expect(createProductsSchema.parse({ ...product, price: String(price) }).price).toBe(price);
});
it.each([0, -1, 29.9, '29,90', 2147483648, Infinity])('rejeita preço inválido %s', (price) => {
  expect(createProductsSchema.safeParse({ ...product, price }).success).toBe(false);
});
