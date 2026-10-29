import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Analytics } from './Analytics';
import { useAdminAnalytics } from '../../hook/useAdminAnalytics';
import { queryKeys } from '../../constant/queryKeys';
import { api } from '../../shared/services/api/ApiConfig';
import { establishSession } from '../../shared/services/session';
import { sessionRequests } from '../../shared/services/sessionRequests';
import {
  analyticsCurrency,
  analyticsDate,
  analyticsPeriodSchema,
  recentAnalyticsPeriod,
} from '../../shared/utils/analyticsPeriod';
import type { UserLogin } from '../../types/Payload';
import type { AdminAnalytics } from '../../types/AdminAnalytics';

const period = { from: '2026-01-01', to: '2026-01-03' };
const dto: AdminAnalytics = {
  period: { ...period, timeZone: 'America/Sao_Paulo' },
  orders: {
    total: 2,
    nonCancelled: 1,
    byStatus: { PENDING: 1, PREPARING: 0, READY: 0, DELIVERED: 0, CANCELLED: 1 },
  },
  amounts: { orderValueInCents: 1250, averageTicketInCents: 1250 },
  series: [{ date: period.from, orders: 2, orderValueInCents: 1250 }],
};
const user: UserLogin = {
  id: 'admin-a',
  admin: true,
  name: 'Admin',
  email: 'admin@example.invalid',
  avatarUrl: null,
  provider: 'LOCAL',
};
const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
function setup(account: UserLogin | null = user) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  client.setQueryData(queryKeys.me, account);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return { client, wrapper };
}
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  api.defaults.adapter = originalAdapter;
  sessionRequests.cancel();
  vi.restoreAllMocks();
});

describe('RF-44 apresentação e fronteira privada', () => {
  it('normaliza presets no fuso de negócio e valida intervalos sem drift', () => {
    expect(recentAnalyticsPeriod(7, new Date('2026-01-01T02:00:00Z'))).toEqual({
      from: '2025-12-25',
      to: '2026-01-01',
    });
    expect(analyticsPeriodSchema.safeParse({ from: '2026-02-30', to: '2026-03-01' }).success).toBe(
      false,
    );
    expect(analyticsPeriodSchema.safeParse({ from: '2024-01-01', to: '2025-01-01' }).success).toBe(
      true,
    );
    expect(analyticsPeriodSchema.safeParse({ from: period.to, to: period.from }).success).toBe(
      false,
    );
    expect(analyticsDate('2026-01-01')).toBe('01/01/2026');
    expect(analyticsCurrency(1250)).toMatch(/12,50/);
  });
  it('mostra loading, KPIs, gráfico e dados tabulares com rótulos', async () => {
    let complete!: () => void;
    api.defaults.adapter = (config) =>
      new Promise((resolve) => {
        complete = () => resolve({ data: dto, status: 200, statusText: 'OK', headers: {}, config });
      });
    render(<Analytics />, { wrapper: setup().wrapper });
    expect(screen.getByRole('status', { name: 'Carregando analytics' })).toBeInTheDocument();
    await waitFor(() => expect(complete).toBeTypeOf('function'));
    act(complete);
    expect(await screen.findByRole('article', { name: 'Total de pedidos' })).toHaveTextContent('2');
    expect(screen.getByRole('img', { name: /Quantidade de pedidos/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver dados diários em tabela'));
    expect(screen.getByRole('table')).toHaveTextContent('01/01/2026');
  });
  it('erro permite nova tentativa e vazio mantém métricas zeradas', async () => {
    let fail = true;
    api.defaults.adapter = async (config) => {
      if (fail) throw new Error('OFFLINE');
      return {
        data: {
          ...dto,
          orders: { ...dto.orders, total: 0 },
          amounts: { orderValueInCents: 0, averageTicketInCents: 0 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    render(<Analytics />, { wrapper: setup().wrapper });
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText(/Nenhum pedido neste período/)).toBeInTheDocument();
  });
  it('aplica filtros personalizados somente se válidos', async () => {
    const filters: unknown[] = [];
    api.defaults.adapter = async (config) => {
      filters.push(config.params);
      return { data: dto, status: 200, statusText: 'OK', headers: {}, config };
    };
    render(<Analytics />, { wrapper: setup().wrapper });
    await screen.findByRole('article', { name: 'Total de pedidos' });
    fireEvent.change(screen.getByLabelText('Período'), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('Início inclusivo'), {
      target: { value: '2026-01-03' },
    });
    fireEvent.change(screen.getByLabelText('Fim exclusivo'), { target: { value: '2026-01-01' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Filtrar período' }));
    expect(screen.getByRole('alert')).toHaveTextContent('até 366 dias');
    expect(filters).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Início inclusivo'), {
      target: { value: '2001-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Fim exclusivo'), { target: { value: '2001-01-02' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Filtrar período' }));
    await waitFor(() => expect(filters).toContainEqual({ from: '2001-01-01', to: '2001-01-02' }));
  });
  it('não consulta para usuário comum, isola geração e cancela respostas de sessão antiga', async () => {
    const { client, wrapper } = setup();
    let oldSignal: AbortSignal | undefined;
    let finish!: () => void;
    api.defaults.adapter = (config) => {
      oldSignal = config.signal as AbortSignal;
      return new Promise((resolve) => {
        finish = () => resolve({ data: dto, status: 200, statusText: 'OK', headers: {}, config });
      });
    };
    const { result } = renderHook(() => useAdminAnalytics(period), { wrapper });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    const oldKey = queryKeys.analyticsFor(user.id, true, period.from, period.to);
    await act(async () => {
      await establishSession(client, { ...user, id: 'common-b', admin: false });
    });
    expect(oldSignal?.aborted).toBe(true);
    act(finish);
    await waitFor(() => expect(result.current.data).toBeUndefined());
    expect(client.getQueryData(oldKey)).toBeUndefined();
    expect(queryKeys.analyticsFor(user.id, true, period.from, period.to)).not.toEqual(oldKey);
  });
  it('nega usuário comum sem disparar request administrativo', () => {
    const adapter = vi.fn();
    api.defaults.adapter = adapter;
    render(<Analytics />, { wrapper: setup({ ...user, admin: false }).wrapper });
    expect(
      screen.getByRole('heading', { name: 'Acesso restrito aos administradores' }),
    ).toBeInTheDocument();
    expect(adapter).not.toHaveBeenCalled();
  });
});
