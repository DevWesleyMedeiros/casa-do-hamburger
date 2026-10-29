import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Header } from '../../components/header/Header';
import { queryKeys } from '../../constant/queryKeys';
import type { UserLogin } from '../../types/Payload';
import { api } from './api/ApiConfig';
import { updateCartItemQuantity } from './api/update/updateCartItemService';
import { deleteCartItem } from './api/delete/DeleteCartItemById';
import { clearPrivateSession, establishSession, logoutSession } from './session';
import { sessionRequests } from './sessionRequests';
import { useCartItemMutations } from '../../hook/useCartItemMutation';
import type { CartItemType } from '../../types/CartItem';
import type { ReactNode } from 'react';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../components/cart/Cart', () => ({ Cart: () => null }));
vi.mock('../../components/newProductModal/NewProductModal', () => ({
  NewProductModal: () => null,
}));
vi.mock('../../components/AvatarUpload', () => ({ AvatarUpload: () => null }));

const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
function client() {
  const result = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(result);
  return result;
}
function user(id: string): UserLogin {
  return {
    id,
    name: `Conta ${id}`,
    email: `${id}@example.invalid`,
    provider: 'LOCAL',
    admin: false,
    avatarUrl: null,
  };
}
function LocationProbe() {
  return <output aria-label="Caminho">{useLocation().pathname}</output>;
}
afterEach(() => {
  cleanup();
  for (const instance of clients) instance.clear();
  clients.length = 0;
  sessionRequests.cancel();
  api.defaults.adapter = originalAdapter;
  vi.clearAllMocks();
});

describe('isolamento do ciclo da sessão', () => {
  it('conta A → logout → conta B limpa pedidos/carrinho/perfil e conserva catálogo público', async () => {
    const instance = client();
    await establishSession(instance, user('A'));
    const aCartKey = queryKeys.cartFor('A');
    const aOrderKey = queryKeys.ordersFor('A');
    instance.setQueryData(aCartKey, ['cart-A']);
    instance.setQueryData(aOrderKey, ['order-A']);
    instance.setQueryData(queryKeys.products, ['public']);
    api.defaults.adapter = async (config) => ({
      config,
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
    });
    await logoutSession(instance);
    expect(instance.getQueryData(queryKeys.me)).toBeNull();
    await establishSession(instance, user('B'));
    expect(instance.getQueryData(aCartKey)).toBeUndefined();
    expect(instance.getQueryData(aOrderKey)).toBeUndefined();
    expect(instance.getQueryData(queryKeys.cartFor('B'))).toBeUndefined();
    expect(instance.getQueryData(queryKeys.ordersFor('B'))).toBeUndefined();
    expect(instance.getQueryData(queryKeys.me)).toEqual(user('B'));
    expect(instance.getQueryData(queryKeys.products)).toEqual(['public']);
  });

  it('aborta resposta antiga e impede repopular pedidos depois da troca de conta', async () => {
    const instance = client();
    await establishSession(instance, user('A'));
    let release!: () => void;
    let started!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    let signal: AbortSignal | undefined;
    api.defaults.adapter = async (config) => {
      signal = config.signal as AbortSignal;
      started();
      await pending; // simula servidor respondendo mesmo após o abort local
      return { config, data: ['order-A'], status: 200, statusText: 'OK', headers: {} };
    };
    const key = queryKeys.ordersFor('A');
    const oldRequest = instance
      .fetchQuery({
        queryKey: key,
        queryFn: async ({ signal }) => (await api.get('/orders', { signal })).data,
      })
      .catch(() => undefined);
    await ready;
    await establishSession(instance, user('B'));
    expect(signal?.aborted).toBe(true);
    release();
    await oldRequest;
    expect(instance.getQueryData(key)).toBeUndefined();
    expect(instance.getQueryData(queryKeys.ordersFor('B'))).toBeUndefined();
  });

  it('expiração 401 limpa também pedidos e perfil', async () => {
    const instance = client();
    await establishSession(instance, user('A'));
    instance.setQueryData(queryKeys.ordersFor('A'), ['order-A']);
    sessionRequests.onExpired(() => {
      void clearPrivateSession(instance);
    });
    api.defaults.adapter = async (config) => {
      throw new AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
        config,
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
      });
    };
    await expect(api.get('/orders')).rejects.toBeDefined();
    expect(instance.getQueryData(queryKeys.me)).toBeNull();
    expect(instance.getQueryCache().findAll({ queryKey: queryKeys.orders })).toHaveLength(0);
  });

  it('falha de logout mantém a sessão, mostra erro e não anuncia sucesso nem navega', async () => {
    const instance = client();
    await establishSession(instance, user('A'));
    instance.setQueryData(queryKeys.cartFor('A'), []);
    api.defaults.adapter = async () => {
      throw new Error('network unavailable');
    };
    render(
      <QueryClientProvider client={instance}>
        <MemoryRouter initialEntries={['/home']}>
          <Header />
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao sair. Tente novamente.'));
    expect(toast.success).not.toHaveBeenCalled();
    expect(instance.getQueryData(queryKeys.me)).toEqual(user('A'));
    expect(screen.getByRole('button', { name: 'Sair' })).toBeDefined();
    expect(screen.getByLabelText('Caminho').textContent).toBe('/home');
  });

  it('falhas das mutations rejeitam a Promise para permitir rollback', async () => {
    api.defaults.adapter = async () => {
      throw new Error('network unavailable');
    };
    await expect(updateCartItemQuantity.update('item-A', 2)).rejects.toBeDefined();
    await expect(deleteCartItem.deleteCartItemById('item-A')).rejects.toBeDefined();
  });

  it('rollback tardio da conta A não recria cache privado após login da conta B', async () => {
    const instance = client();
    await establishSession(instance, user('A'));
    const key = queryKeys.cartFor('A');
    instance.setQueryData(key, [{ id: 'item-A', quantity: 1 }]);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    api.defaults.adapter = async (config) => {
      await pending;
      throw new AxiosError('late failure', 'ERR_NETWORK', config);
    };
    const { result } = renderHook(() => useCartItemMutations('item-A', 1), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={instance}>{children}</QueryClientProvider>
      ),
    });
    let mutation!: Promise<unknown>;
    act(() => {
      mutation = result.current.increment.mutateAsync('item-A').catch(() => undefined);
    });
    await waitFor(() => expect(instance.getQueryData<CartItemType[]>(key)?.[0]?.quantity).toBe(2));
    await act(async () => {
      await establishSession(instance, user('B'));
    });
    release();
    await act(async () => {
      await mutation;
    });
    expect(instance.getQueryData(key)).toBeUndefined();
    expect(instance.getQueryData(queryKeys.cartFor('B'))).toBeUndefined();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
