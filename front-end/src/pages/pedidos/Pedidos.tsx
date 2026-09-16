import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CardPedidos } from "../../components/cardPedidos/CardPedidos";
import { getItemSelectedClass } from "../../shared/utils/Utils";
import { orderSeriviceApi } from "../../shared/services/api/orders/ordersServiceApi";
import type { Order, OrderStatus } from "../../types/Order";
import { resolveApiErrorMessage } from "../../shared/utils/apiErrorMessage.js";
import { useMe } from "../../hook/useMe";
import { queryKeys } from "../../constant/queryKeys.js";
import { ApiError } from "../../shared/services/api/ApiExceptions.js";

const FILTER_ITEMS = [
  "Pendentes",
  "Preparando",
  "Pronto",
  "Cancelados",
  "Entregue",
] as const;

type FilterItem = (typeof FILTER_ITEMS)[number];

const FILTER_STATUS_MAP: Record<FilterItem, OrderStatus | null> = {
  Pendentes: "PENDING",
  Preparando: "PREPARING",
  Pronto: "READY",
  Cancelados: "CANCELLED",
  Entregue: "DELIVERED",
};

export const Pedidos = () => {
  const [selectedItemClass, setSelectedItemClass] =
    useState<FilterItem>("Pendentes");

  const queryClient = useQueryClient();

  const { data: user } = useMe();
  const isAdmin = user?.admin ?? false;

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: orderSeriviceApi.getMyOrders,
  });

  // mutation para atualizar status do order
  const statusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => {
      return orderSeriviceApi.updateOrderStatus(orderId, status);
    },

    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(
        queryKeys.orders,
        (currentOrders: Order[] = []) => {
          return currentOrders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order,
          );
        },
      );

      toast.success("Status atualizado com sucesso");
    },

    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(resolveApiErrorMessage(err, "Status não atualizado"));
      }
    },
  });

  // mutation para cancelar order
  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => {
      return orderSeriviceApi.cancelOrder(orderId);
    },

    onSuccess: (cancelledOrder) => {
      queryClient.setQueryData(queryKeys.orders, (currentOrders: Order[]) => {
        return currentOrders.map((order) =>
          order.id === cancelledOrder.id ? cancelledOrder : order,
        );
      });

      toast.success("Pedido cancelado com sucesso");
    },

    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(resolveApiErrorMessage(err, "Pedido não cancelado"));
      }
    },
  });

  const filteredOrders = orders.filter((order) => {
    const selectedStatus = FILTER_STATUS_MAP[selectedItemClass];

    if (!selectedStatus) {
      return true;
    }

    return order.status === selectedStatus;
  });

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    statusMutation.mutate({
      orderId,
      status,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">Carregando...</div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center">
        Erro ao carregar pedidos.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-2 px-3 text-white md:w-184.25 md:px-0">
      <div className="my-1 mb-3 flex gap-2 md:my-3">
        {FILTER_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className={getItemSelectedClass(item, selectedItemClass)}
            onClick={() => setSelectedItemClass(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filteredOrders.length === 0 ? (
          <div className="justify-ccenter flex items-center">
            Nenhum pedido encontrado.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <CardPedidos
              key={order.id}
              order={order}
              isAdmin={isAdmin}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};
