import { CalendarDays, Clock, Timer, UserRound } from "lucide-react";

import { ICON_CONFIG } from "../../constant/iconConfig";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";
import type { Order, OrderStatus } from "../../types/Order";
import { ORDER_STATUS_LABELS } from "../../types/Order";

type CardPedidosProps = {
  order: Order;
  isAdmin?: boolean;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
};

const getOrderTotal = (order: Order) => {
  return order.items.reduce((total, item) => {
    return total + item.subtotal;
  }, 0);
};

const formatOrderDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

const formatOrderTime = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const CardPedidos = ({
  order,
  isAdmin = false,
  onStatusChange,
}: CardPedidosProps) => {
  const total = getOrderTotal(order);

  return (
    <div className="card bg-brand-amber my-2 flex flex-col rounded-md text-[#32343E]">
      <div className="mt-1 flex justify-between">
        <p className="ml-3 font-bold">#{order.id}</p>

        {isAdmin ? (
          <select
            value={order.status}
            onChange={(event) =>
              onStatusChange?.(order.id, event.target.value as OrderStatus)
            }
            aria-label="Status do pedido"
            className="mr-3 font-bold"
          >
            {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <span className="mr-3 font-bold">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        )}
      </div>

      <div className="mt-2 ml-3 flex flex-col">
        <div className="my-0.5 flex items-center gap-1">
          <UserRound size={ICON_CONFIG.mnSize} />
          <span className="text-sm">
            {order.items[0]?.productName ?? "Pedido"}
          </span>
        </div>

        <div className="my-1 flex items-center gap-1">
          <CalendarDays size={ICON_CONFIG.mnSize} />
          <span className="text-sm">{formatOrderDate(order.createdAt)}</span>
        </div>

        <div className="my-1 flex items-center gap-1">
          <Clock size={ICON_CONFIG.mnSize} />
          <span className="text-sm">{formatOrderTime(order.createdAt)}</span>

          <span className="ml-12">
            <Timer size={ICON_CONFIG.mnSize} />
          </span>

          <span>-</span>
        </div>
      </div>

      <div className="mx-auto mt-1 h-0 w-49.75 border text-[#32343E]" />

      <p className="mx-4 my-1 text-right text-lg font-bold text-[#32343E]">
        {brazilinaCurrencyFormat(total)}
      </p>
    </div>
  );
};
