import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { CardPedidos } from './CardPedidos';
import type { Order } from '../../types/Order';

afterEach(cleanup);
it('exibe snapshots de clientes e todos os produtos por pedido, usando o total da API', () => {
  const order: Order = {
    id: 'a',
    customerName: 'Cliente Ana',
    status: 'PENDING',
    total: 4500,
    createdAt: '2026-10-29T12:00:00Z',
    updatedAt: '2026-10-29T12:00:00Z',
    payment: null,
    items: [
      {
        id: '1',
        productId: null,
        productName: 'Hambúrguer histórico',
        productImageUrl: null,
        unitPrice: 2000,
        quantity: 2,
        subtotal: 4000,
      },
      {
        id: '2',
        productId: null,
        productName: 'Suco histórico',
        productImageUrl: null,
        unitPrice: 500,
        quantity: 1,
        subtotal: 500,
      },
    ],
  };
  render(
    <>
      <CardPedidos order={order} isAdmin />
      <CardPedidos
        order={{
          ...order,
          id: 'b',
          customerName: 'Cliente Bruno',
          items: [order.items[1]],
          total: 500,
        }}
        isAdmin
      />
    </>,
  );
  expect(screen.getByText('Cliente Ana')).toBeInTheDocument();
  expect(screen.getByText('Cliente Bruno')).toBeInTheDocument();
  expect(screen.getByText('Hambúrguer histórico (2)')).toBeInTheDocument();
  expect(screen.getAllByText('Suco histórico (1)')).toHaveLength(2);
  expect(screen.getByText(/45,00/)).toBeInTheDocument();
});
