import { CalendarDays, ChevronDown, Clock, Timer, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

import { ICON_CONFIG } from '../../constant/iconConfig';
import { brazilinaCurrencyFormat } from '../../shared/utils/Utils';
import type { Order, OrderStatus } from '../../types/Order';
import { ORDER_STATUS_LABELS } from '../../types/Order';

type CardPedidosProps = {
  order: Order;
  isAdmin?: boolean;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
};

/* ------------------------------------------------------------------ */
/* Constantes e helpers                                                */
/* ------------------------------------------------------------------ */

// Intl.DateTimeFormat é caro de instanciar: criamos UMA vez no módulo,
// e não a cada render de cada card.
const dateFormatter = new Intl.DateTimeFormat('pt-BR');
const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

const EMPTY_VALUE = '—';

// Record<OrderStatus, ...> obriga o TypeScript a reclamar se um novo status
// for criado no enum e esquecermos de dar uma cor para ele.
const STATUS_DOT: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-500',
  PREPARING: 'bg-blue-600',
  READY: 'bg-green-600',
  DELIVERED: 'bg-slate-500',
  CANCELLED: 'bg-red-600',
};

const PILL_BASE =
  'inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-bold ring-1 ring-[#32343E]/25';

const getOrderTotal = (order: Order) => {
  return order.items.reduce((total, item) => total + item.subtotal, 0);
};

const formatOrderDate = (date: string) => dateFormatter.format(new Date(date));
const formatOrderTime = (date: string) => timeFormatter.format(new Date(date));

/* ------------------------------------------------------------------ */
/* Subcomponentes (só usados aqui, por isso ficam no mesmo arquivo)    */
/* ------------------------------------------------------------------ */

const StatusDot = ({ status }: { status: OrderStatus }) => (
  <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
);

// Visão do cliente: só leitura.
const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span className={PILL_BASE}>
    <StatusDot status={status} />
    {ORDER_STATUS_LABELS[status]}
  </span>
);

// Visão do admin: mesmo visual da badge, mas com <select> nativo por baixo
// (mantém teclado, leitor de tela e mobile funcionando de graça).
type StatusSelectProps = {
  orderId: string;
  status: OrderStatus;
  onChange?: (orderId: string, status: OrderStatus) => void;
};

const StatusSelect = ({ orderId, status, onChange }: StatusSelectProps) => (
  <div className={`${PILL_BASE} relative focus-within:ring-2 focus-within:ring-[#32343E]`}>
    <StatusDot status={status} />

    <select
      value={status}
      onChange={(event) => onChange?.(orderId, event.target.value as OrderStatus)}
      aria-label="Status do pedido"
      className="cursor-pointer appearance-none bg-transparent pr-5 font-bold focus:outline-none"
    >
      {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>

    <ChevronDown
      size={14}
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2"
    />
  </div>
);

type MetaItemProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

// Ícone + texto alinhados. O <sr-only> diz ao leitor de tela o que o ícone significa.
const MetaItem = ({ icon, label, children }: MetaItemProps) => (
  <div className="flex items-center gap-1.5">
    {icon}
    <span className="sr-only">{label}:</span>
    <span>{children}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

export const CardPedidos = ({ order, isAdmin = false, onStatusChange }: CardPedidosProps) => {
  const total = getOrderTotal(order);

  return (
    <article className="bg-brand-amber flex h-full w-full flex-col gap-3 rounded-xl p-4 text-[#32343E] shadow-md ring-1 ring-black/5">
      {/* 1) Quem pediu + em que pé está */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
          <UserRound size={ICON_CONFIG.mnSize} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{order.customerName}</span>
        </div>

        <div className="shrink-0">
          {isAdmin ? (
            <StatusSelect orderId={order.id} status={order.status} onChange={onStatusChange} />
          ) : (
            <StatusBadge status={order.status} />
          )}
        </div>
      </header>

      {/* 2) O que foi pedido: uma linha por item, em vez de "A & B & C" */}
      <ul className="list-disc space-y-1 pl-5 text-base leading-snug font-bold marker:text-[#32343E]/40">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.productName} ({item.quantity})
          </li>
        ))}
      </ul>

      {/* 3) Quando: data, hora e tempo de preparo numa única linha (quebra sozinha se faltar espaço) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#32343E]/85">
        <MetaItem
          label="Data do pedido"
          icon={<CalendarDays size={ICON_CONFIG.mnSize} aria-hidden="true" />}
        >
          <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
        </MetaItem>

        <MetaItem
          label="Horário do pedido"
          icon={<Clock size={ICON_CONFIG.mnSize} aria-hidden="true" />}
        >
          <time dateTime={order.createdAt}>{formatOrderTime(order.createdAt)}</time>
        </MetaItem>

        <MetaItem
          label="Tempo de preparo"
          icon={<Timer size={ICON_CONFIG.mnSize} aria-hidden="true" />}
        >
          {EMPTY_VALUE}
        </MetaItem>
      </div>

      {/* 4) Quanto: sempre colado no rodapé (mt-auto), mesmo com cards de alturas diferentes */}
      <footer className="mt-auto flex items-baseline justify-between border-t border-[#32343E]/25 pt-3">
        <span className="text-xs font-semibold tracking-wide text-[#32343E]/85 uppercase">
          Total
        </span>
        <span className="text-xl font-extrabold tabular-nums">
          {brazilinaCurrencyFormat(total)}
        </span>
      </footer>
    </article>
  );
};
