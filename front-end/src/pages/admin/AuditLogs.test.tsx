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
import type { InternalAxiosRequestConfig } from 'axios';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { AuditLogs } from './AuditLogs';
import { useAuditLogs } from '../../hook/useAuditLogs';
import { queryKeys } from '../../constant/queryKeys';
import { api } from '../../shared/services/api/ApiConfig';
import { establishSession, logoutSession } from '../../shared/services/session';
import { sessionRequests } from '../../shared/services/sessionRequests';
import type { AuditLog, AuditPage } from '../../types/AuditLog';
import type { UserLogin } from '../../types/Payload';

const admin: UserLogin = {
  id: 'admin-a',
  admin: true,
  name: 'Admin A',
  email: 'a@example.invalid',
  provider: 'LOCAL',
  avatarUrl: null,
};
const event: AuditLog = {
  id: 'event-a',
  actorId: 'responsible-admin',
  requestId: 'request-a',
  entityId: 'product-a',
  createdAt: '2026-10-29T12:00:00Z',
  action: 'PRODUCT_CREATED',
  entityType: 'PRODUCT',
  before: null,
  after: { name: 'Produto histórico', category: 'HAMBURGUER', price: 2990 },
};
const dto: AuditPage = { items: [event], nextCursor: null };
const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
const response = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({
  config,
  data,
  status,
  statusText: 'OK',
  headers: {},
});
function setup(account: UserLogin | null = admin) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(queryKeys.me, account);
  clients.push(client);
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

it('mostra loading, ação, responsável e resumo permitido em centavos', async () => {
  let complete!: () => void;
  api.defaults.adapter = async (config) => {
    await new Promise<void>((resolve) => {
      complete = resolve;
    });
    return response(config, dto);
  };
  render(<AuditLogs />, { wrapper: setup().wrapper });
  expect(screen.getByText('Carregando auditoria…')).toBeInTheDocument();
  await waitFor(() => expect(complete).toBeDefined());
  act(() => complete());
  await screen.findByText('Produto histórico · HAMBURGUER · R$ 29,90', {
    exact: false,
    normalizer: (text) => text.replace(/\s/g, ' '),
  });
  expect(screen.getByText('responsible-admin')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Produto criado' })).toBeInTheDocument();
});

it('consulta páginas, volta e aplica filtros com reset do cursor e limites UTC explícitos', async () => {
  const requests: InternalAxiosRequestConfig[] = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return response(
      config,
      config.params?.cursor
        ? {
            items: [
              { ...event, id: 'event-b', after: { ...event.after, name: 'Segundo produto' } },
            ],
            nextCursor: null,
          }
        : { ...dto, nextCursor: 'next-cursor' },
    );
  };
  render(<AuditLogs />, { wrapper: setup().wrapper });
  await screen.findByText('responsible-admin');
  fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
  await screen.findByText(/Segundo produto/);
  expect(requests.at(-1)?.params.cursor).toBe('next-cursor');
  fireEvent.change(screen.getByLabelText('Início inclusivo (UTC)'), {
    target: { value: '2026-10-01' },
  });
  fireEvent.change(screen.getByLabelText('Fim exclusivo (UTC)'), {
    target: { value: '2026-11-01' },
  });
  fireEvent.change(screen.getByLabelText('Tipo da ação'), { target: { value: 'PRODUCT_CREATED' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Entidade' }), {
    target: { value: 'PRODUCT' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  await waitFor(() => expect(requests.at(-1)?.params.from).toBe('2026-10-01T00:00:00.000Z'));
  expect(requests.at(-1)?.params).toMatchObject({
    action: 'PRODUCT_CREATED',
    entityType: 'PRODUCT',
    to: '2026-11-01T00:00:00.000Z',
    limit: 20,
  });
  expect(requests.at(-1)?.params.cursor).toBeUndefined();
  expect(screen.getByText('Página 1')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Fim exclusivo (UTC)'), {
    target: { value: '2026-09-01' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Informe início');
});

it('mostra vazio e erro com tentativa, sem continuar expondo dados do cache', async () => {
  api.defaults.adapter = async (config) => response(config, dto);
  render(<AuditLogs />, { wrapper: setup().wrapper });
  await screen.findByText('responsible-admin');
  api.defaults.adapter = async (config) => {
    throw new AxiosError(
      'unavailable',
      'ERR_BAD_RESPONSE',
      config,
      undefined,
      response(config, {}, 500),
    );
  };
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar auditoria' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('responsible-admin')).not.toBeInTheDocument();
  api.defaults.adapter = async (config) => response(config, { items: [], nextCursor: null });
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText('Nenhum evento encontrado.');
});

it('usuário comum não consulta e 403 oculta dados previamente carregados', async () => {
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => response(config, dto));
  api.defaults.adapter = adapter;
  const { client, wrapper } = setup({ ...admin, admin: false });
  render(<AuditLogs />, { wrapper });
  expect(screen.getByText('Acesso restrito aos administradores')).toBeInTheDocument();
  expect(adapter).not.toHaveBeenCalled();
  await act(async () => {
    client.setQueryData(queryKeys.me, admin);
  });
  await screen.findByText('responsible-admin');
  api.defaults.adapter = async (config) => {
    throw new AxiosError(
      'forbidden',
      'ERR_BAD_REQUEST',
      config,
      undefined,
      response(config, {}, 403),
    );
  };
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar auditoria' }));
  await screen.findByText('Acesso restrito aos administradores');
  expect(screen.queryByText('responsible-admin')).not.toBeInTheDocument();
});

it('logout remove auditoria e resposta tardia não recria dados após trocar de sessão', async () => {
  let release!: () => void;
  const { client, wrapper } = setup();
  const previousKey = queryKeys.auditFor(admin.id, true, {});
  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/logout') return response(config, {});
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return response(config, dto);
  };
  const { result } = renderHook(() => useAuditLogs({}), { wrapper });
  await waitFor(() => expect(release).toBeDefined());
  await act(async () => {
    await logoutSession(client);
    await establishSession(client, { ...admin, id: 'user-b', admin: false });
  });
  await act(async () => release());
  expect(client.getQueryData(previousKey)).toBeUndefined();
  expect(result.current.data).toBeUndefined();
  expect(
    client.getQueriesData({ queryKey: queryKeys.audit }).every(([, value]) => value === undefined),
  ).toBe(true);
});
