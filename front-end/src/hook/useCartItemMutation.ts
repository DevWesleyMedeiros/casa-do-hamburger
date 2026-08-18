import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "../constant/queryKeys";
import { deleteCartItem } from "../shared/services/api/delete/DeleteCartItemById";
import { updateCartItemQuantity } from "../shared/services/api/update/updateCartItemService";
import type { CartItemType } from "../types/CartItem";

type MutationKind = "increment" | "decrement" | "delete";

const ERROR_MESSAGE: Record<MutationKind, string> = {
  increment: "Erro ao atualizar quantidade",
  decrement: "Erro ao atualizar quantidade",
  delete: "Erro ao remover item",
};

export const useCartItemMutations = (id: string, quantity: number) => {
  const queryClient = useQueryClient();

  const withOptimisticUpdate = (
    kind: MutationKind,
    updater: (old: CartItemType[]) => CartItemType[],
  ) => ({
    onMutate: () => {
      const snapshot = queryClient.getQueryData<CartItemType[]>(
        queryKeys.cartItems,
      );
      queryClient.setQueryData<CartItemType[]>(
        queryKeys.cartItems,
        (old = []) => updater(old),
      );
      return { snapshot };
    },
    onError: (
      _err: unknown,
      _vars: unknown,
      context?: { snapshot?: CartItemType[] },
    ) => {
      queryClient.setQueryData(queryKeys.cartItems, context?.snapshot);
      toast.error(ERROR_MESSAGE[kind]);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cartItems });
    },
  });

  const increment = useMutation({
    mutationFn: () => updateCartItemQuantity.update(id, quantity + 1),
    ...withOptimisticUpdate("increment", (old) =>
      old.map((item) =>
        item.id === id ? { ...item, quantity: quantity + 1 } : item,
      ),
    ),
  });

  const decrement = useMutation({
    mutationFn: () => updateCartItemQuantity.update(id, quantity - 1),
    ...withOptimisticUpdate("decrement", (old) =>
      old.map((item) =>
        item.id === id ? { ...item, quantity: quantity - 1 } : item,
      ),
    ),
  });

  const deleteItem = useMutation({
    mutationFn: () => deleteCartItem.deleteCartItemById(id),
    ...withOptimisticUpdate("delete", (old) =>
      old.filter((item) => item.id !== id),
    ),
    onSuccess: () => toast.success("Item removido"),
  });

  return { increment, decrement, deleteItem };
};
