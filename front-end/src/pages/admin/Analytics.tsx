import axios from 'axios';
import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AnalyticsEvolution } from '../../components/analytics/AnalyticsEvolution';
import { useAdminAnalytics } from '../../hook/useAdminAnalytics';
import { useMe } from '../../hook/useMe';
import { Seo } from '../../shared/components/SEO';
import {
  analyticsCurrency,
  analyticsDate,
  analyticsPeriodSchema,
  recentAnalyticsPeriod,
} from '../../shared/utils/analyticsPeriod';

const fieldClass =
  'rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-blue-400';
const statusLabels = {
  PENDING: 'Pendentes',
  PREPARING: 'Preparando',
  READY: 'Prontos',
  DELIVERED: 'Entregues',
  CANCELLED: 'Cancelados',
} as const;

export function Analytics() {
  const {
    data: user,
    isPending: sessionPending,
    isError: sessionError,
    refetch: retrySession,
  } = useMe();
  const [period, setPeriod] = useState(() => recentAnalyticsPeriod(7));
  const [draft, setDraft] = useState(period);
  const [preset, setPreset] = useState('7');
  const [validation, setValidation] = useState('');
  const query = useAdminAnalytics(period);

  if (sessionPending) return <output className="block p-6 text-white">Verificando sessão…</output>;
  if (sessionError)
    return (
      <output className="block p-6 text-white">
        Não foi possível verificar a sessão.{' '}
        <button onClick={() => void retrySession()}>Tentar novamente</button>
      </output>
    );
  if (!user) return <Navigate to="/login" replace />;
  const forbidden = axios.isAxiosError(query.error) && query.error.response?.status === 403;
  if (!user.admin || forbidden)
    return (
      <main className="min-h-screen p-6 text-white">
        <h1 className="text-2xl">Acesso restrito aos administradores</h1>
        <Link to="/home" className="underline">
          Voltar ao catálogo
        </Link>
      </main>
    );

  const apply = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = analyticsPeriodSchema.safeParse(draft);
    if (!parsed.success) {
      setValidation(parsed.error.issues[0].message);
      return;
    }
    setValidation('');
    setPeriod(parsed.data);
  };
  const data = query.isError ? undefined : query.data;
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-8 px-4 py-8 text-slate-100 sm:px-6">
      <Seo
        title="Analytics administrativo"
        description="Métricas operacionais dos pedidos simulados"
        canonicalPath="/admin/analytics"
        noIndex
      />
      <header className="space-y-3">
        <p className="text-sm font-medium tracking-widest text-blue-300 uppercase">
          Visão da operação
        </p>
        <h1 className="text-3xl font-bold">Métricas administrativas</h1>
        <p className="max-w-3xl text-slate-300">
          Acompanhe os pedidos criados no período e seus status atuais. Os valores são simulados e
          não representam receita recebida.
        </p>
        <Link to="/pedidos" className="inline-block text-blue-200 underline underline-offset-4">
          Gerenciar pedidos
        </Link>
      </header>
      <form
        onSubmit={apply}
        className="space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-4"
        aria-label="Filtrar período"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="analytics-preset">Período</label>
            <select
              id="analytics-preset"
              className={fieldClass}
              value={preset}
              onChange={(event) => {
                const value = event.target.value;
                setPreset(value);
                setValidation('');
                if (value === '7' || value === '30') {
                  const next = recentAnalyticsPeriod(Number(value) as 7 | 30);
                  setDraft(next);
                  setPeriod(next);
                }
              }}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          {preset === 'custom' && (
            <>
              <label htmlFor="analytics-from" className="flex min-w-0 flex-col gap-2">
                <span>Início inclusivo</span>
                <input
                  id="analytics-from"
                  className={fieldClass}
                  type="date"
                  min="2000-01-01"
                  max="2100-12-31"
                  required
                  value={draft.from}
                  aria-describedby="period-help period-error"
                  onChange={(event) => setDraft({ ...draft, from: event.target.value })}
                />
              </label>
              <label htmlFor="analytics-to" className="flex min-w-0 flex-col gap-2">
                <span>Fim exclusivo</span>
                <input
                  id="analytics-to"
                  className={fieldClass}
                  type="date"
                  min="2000-01-01"
                  max="2100-12-31"
                  required
                  value={draft.to}
                  aria-describedby="period-help period-error"
                  onChange={(event) => setDraft({ ...draft, to: event.target.value })}
                />
              </label>
              <button type="submit" className={`${fieldClass} cursor-pointer bg-blue-700`}>
                Aplicar período
              </button>
            </>
          )}
          <button
            type="button"
            className={`${fieldClass} cursor-pointer disabled:opacity-50`}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Atualizar dados
          </button>
        </div>
        <p id="period-help" className="text-sm text-slate-300">
          America/Sao_Paulo · Até 366 dias. O dia do fim não é incluído.
        </p>
        <p
          id="period-error"
          role={validation ? 'alert' : undefined}
          className="text-sm text-red-300"
        >
          {validation}
        </p>
      </form>
      <p className="text-sm text-slate-300" aria-live="polite">
        De {analyticsDate(period.from)} até {analyticsDate(period.to)} (exclusivo)
        {query.isFetching && data ? ' · Atualizando…' : ''}
      </p>
      {query.isPending && (
        <section aria-label="Carregando analytics" className="grid gap-4 sm:grid-cols-3">
          <span className="sr-only">Carregando analytics…</span>
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-28 rounded-xl bg-slate-800 motion-safe:animate-pulse" />
          ))}
        </section>
      )}
      {query.isError && (
        <div role="alert" className="rounded-xl border border-red-800 bg-slate-900 p-5">
          <p>Não foi possível carregar as métricas.</p>
          <button
            type="button"
            className={`${fieldClass} mt-3`}
            onClick={() => void query.refetch()}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {data && (
        <>
          <section aria-label="Indicadores do período" className="grid gap-4 sm:grid-cols-3">
            {[
              ['Total de pedidos', data.orders.total],
              [
                'Valor dos pedidos não cancelados',
                analyticsCurrency(data.amounts.orderValueInCents),
              ],
              ['Ticket médio simulado', analyticsCurrency(data.amounts.averageTicketInCents)],
            ].map(([label, value]) => (
              <article
                key={label}
                aria-label={String(label)}
                className="rounded-xl border border-slate-700 bg-slate-900 p-5"
              >
                <h2 className="text-sm text-slate-300">{label}</h2>
                <p className="mt-3 text-3xl font-semibold text-blue-200 tabular-nums">{value}</p>
              </article>
            ))}
          </section>
          {data.orders.total === 0 && (
            <output className="block rounded-xl border border-slate-700 p-5">
              Nenhum pedido neste período. Selecione outro intervalo.
            </output>
          )}
          <section
            aria-label="Distribuição por status"
            className="rounded-xl border border-slate-700 bg-slate-900 p-5"
          >
            <h2 className="mb-4 text-xl font-semibold">Distribuição por status</h2>
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-5">
              {(Object.keys(statusLabels) as (keyof typeof statusLabels)[]).map((status) => (
                <div key={status}>
                  <dt className="text-sm text-slate-300">{statusLabels[status]}</dt>
                  <dd className="mt-1 text-2xl font-semibold">{data.orders.byStatus[status]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-slate-300">
              {data.orders.nonCancelled} pedidos não cancelados compõem o valor e o ticket médio.
            </p>
          </section>
          <AnalyticsEvolution series={data.series} />
        </>
      )}
    </main>
  );
}
