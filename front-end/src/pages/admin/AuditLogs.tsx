import axios from 'axios';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMe } from '../../hook/useMe';
import { useAuditLogs } from '../../hook/useAuditLogs';
import { Seo } from '../../shared/components/SEO';
import { analyticsPeriodSchema } from '../../shared/utils/analyticsPeriod';
import { formatCurrency } from '../../shared/utils/currency';
import { AUDIT_ACTION_LABELS } from '../../types/AuditLog';
import type { AuditAction, AuditFilters, AuditLog } from '../../types/AuditLog';
import { ORDER_STATUS_LABELS } from '../../types/Order';

const fieldClass =
  'min-h-11 min-w-0 rounded-md border border-brand-amber/50 bg-brand-dark px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-brand-amber';
const buttonClass =
  'min-h-11 rounded-md border border-brand-amber px-4 py-2 text-brand-amber hover:bg-brand-amber/15 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50';
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'UTC',
});
const initialDraft = { action: '', entityType: '', from: '', to: '' };

function EventSummary({ event }: { event: AuditLog }) {
  if (event.entityType === 'ORDER')
    return (
      <p>
        {ORDER_STATUS_LABELS[event.before.status]} → {ORDER_STATUS_LABELS[event.after.status]}
      </p>
    );
  const product = event.after ?? event.before;
  return (
    <p>
      {product.name} · {product.category} · {formatCurrency(product.price)}
    </p>
  );
}

export function AuditLogs() {
  const { data: user, isPending, isError, refetch } = useMe();
  const [draft, setDraft] = useState(initialDraft);
  const [filters, setFilters] = useState<AuditFilters>({ limit: 20 });
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const [validation, setValidation] = useState('');
  const query = useAuditLogs({ ...filters, cursor: cursors[pageIndex] });
  if (isPending)
    return (
      <p role="status" className="p-6 text-white">
        Verificando sessão…
      </p>
    );
  if (isError)
    return (
      <div role="alert" className="p-6 text-white">
        Não foi possível verificar a sessão.{' '}
        <button className={buttonClass} onClick={() => void refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  const forbidden = axios.isAxiosError(query.error) && query.error.response?.status === 403;
  if (!user.admin || forbidden)
    return (
      <main className="p-6 text-white">
        <h1>Acesso restrito aos administradores</h1>
        <Link to="/home" className="underline">
          Voltar ao catálogo
        </Link>
      </main>
    );

  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (
      (draft.from || draft.to) &&
      !analyticsPeriodSchema.safeParse({ from: draft.from, to: draft.to }).success
    ) {
      setValidation('Informe início e fim exclusivo válidos, com até 366 dias.');
      return;
    }
    setValidation('');
    setFilters({
      limit: 20,
      action: (draft.action || undefined) as AuditAction | undefined,
      entityType: (draft.entityType || undefined) as AuditFilters['entityType'],
      from: draft.from ? `${draft.from}T00:00:00.000Z` : undefined,
      to: draft.to ? `${draft.to}T00:00:00.000Z` : undefined,
    });
    setCursors([undefined]);
    setPageIndex(0);
  };
  const data = query.isError ? undefined : query.data;
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-5 p-4 text-white md:p-6">
      <Seo
        title="Auditoria administrativa"
        description="Histórico de ações administrativas"
        canonicalPath="/admin/audit-logs"
        noIndex
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-brand-amber text-2xl font-bold">Auditoria administrativa</h1>
        <button
          className={buttonClass}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Atualizar auditoria
        </button>
      </div>
      <p className="text-sm text-slate-300">
        Ações administrativas registradas. Datas e limites do período em UTC; o fim é exclusivo.
      </p>
      <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="audit-action">Tipo da ação</label>
          <select
            id="audit-action"
            className={fieldClass}
            value={draft.action}
            onChange={(event) => setDraft({ ...draft, action: event.target.value })}
          >
            <option value="">Todas as ações</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="audit-entity">Entidade</label>
          <select
            id="audit-entity"
            className={fieldClass}
            value={draft.entityType}
            onChange={(event) => setDraft({ ...draft, entityType: event.target.value })}
          >
            <option value="">Todas as entidades</option>
            <option value="PRODUCT">Produto</option>
            <option value="ORDER">Pedido</option>
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="audit-from">Início inclusivo (UTC)</label>
          <input
            id="audit-from"
            type="date"
            className={fieldClass}
            value={draft.from}
            onChange={(event) => setDraft({ ...draft, from: event.target.value })}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="audit-to">Fim exclusivo (UTC)</label>
          <input
            id="audit-to"
            type="date"
            className={fieldClass}
            value={draft.to}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          />
        </div>
        <button className={`${buttonClass} self-end`} type="submit">
          Aplicar filtros
        </button>
      </form>
      {validation && <p role="alert">{validation}</p>}
      {query.isPending && <p role="status">Carregando auditoria…</p>}
      {query.isError && (
        <div role="alert">
          Não foi possível carregar a auditoria.{' '}
          <button className={buttonClass} onClick={() => void query.refetch()}>
            Tentar novamente
          </button>
        </div>
      )}
      {data?.items.length === 0 && <p role="status">Nenhum evento encontrado.</p>}
      {data && (
        <ol aria-label="Eventos de auditoria" className="grid gap-3 md:grid-cols-2">
          {data.items.map((event) => (
            <li
              key={event.id}
              className="border-brand-amber/30 bg-brand-dark min-w-0 space-y-2 rounded-xl border p-4 wrap-anywhere"
            >
              <h2 className="text-brand-amber font-semibold">
                {AUDIT_ACTION_LABELS[event.action]}
              </h2>
              <time dateTime={event.createdAt}>
                {dateFormatter.format(new Date(event.createdAt))} UTC
              </time>
              <p className="text-sm">
                Administrador responsável: <span>{event.actorId}</span>
              </p>
              <p className="text-sm">
                {event.entityType === 'PRODUCT' ? 'Produto' : 'Pedido'}: {event.entityId}
              </p>
              <EventSummary event={event} />
            </li>
          ))}
        </ol>
      )}
      <nav aria-label="Paginação da auditoria" className="flex flex-wrap items-center gap-3">
        <button
          className={buttonClass}
          disabled={pageIndex === 0 || query.isFetching}
          onClick={() => setPageIndex((value) => value - 1)}
        >
          Página anterior
        </button>
        <span aria-live="polite">Página {pageIndex + 1}</span>
        <button
          className={buttonClass}
          disabled={!data?.nextCursor || query.isFetching}
          onClick={() => {
            if (!data?.nextCursor) return;
            setCursors([...cursors.slice(0, pageIndex + 1), data.nextCursor]);
            setPageIndex(pageIndex + 1);
          }}
        >
          Próxima página
        </button>
      </nav>
    </main>
  );
}
