import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { Header } from './Header';
import { queryKeys } from '../../constant/queryKeys';

vi.mock('../cart/Cart', () => ({ Cart: () => null }));
vi.mock('../AvatarUpload', () => ({ AvatarUpload: () => null }));
vi.mock('../newProductModal/NewProductModal', () => ({ NewProductModal: () => null }));
afterEach(cleanup);
it.each([true, false, null])(
  'controles administrativos exigem administrador autenticado (%s)',
  (admin) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(
      queryKeys.me,
      admin === null ? null : { id: 'u', name: 'Pessoa', admin, provider: 'LOCAL' },
    );
    client.setQueryData(queryKeys.cartFor('u'), []);
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/admin/analytics']}>
          <Header />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    if (admin) {
      expect(screen.getByRole('link', { name: 'Métricas' })).toHaveAttribute(
        'href',
        '/admin/analytics',
      );
      expect(screen.getByRole('link', { name: 'Métricas' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByRole('button', { name: 'Abrir administração' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Adicionar produto' })).toBeInTheDocument();
    } else {
      expect(screen.queryByRole('link', { name: 'Métricas' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Abrir administração' })).not.toBeInTheDocument();
    }
    client.clear();
  },
);
