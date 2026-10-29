import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '../constant/queryKeys';
import { deleteCartItem } from '../shared/services/api/delete/DeleteCartItemById';
import { updateCartItemQuantity } from '../shared/services/api/update/updateCartItemService';
import type { CartItemType } from '../types/CartItem';
import { useMe } from './useMe';
import { sessionRequests } from '../shared/services/sessionRequests';

type MutationKind = 'increment' | 'decrement' | 'delete';

const ERROR_MESSAGE: Record<MutationKind, string> = {
  increment: 'Erro ao atualizar quantidade',
  decrement: 'Erro ao atualizar quantidade',
  delete: 'Erro ao remover item',
};

export const useCartItemMutations = (id: string, quantity: number) => {
  const queryClient = useQueryClient();
  const { data: user } = useMe();
  const cartKey = queryKeys.cartFor(user?.id);
  const generation = sessionRequests.generation();

  const withOptimisticUpdate = (
    kind: MutationKind,
    updater: (old: CartItemType[]) => CartItemType[],
  ) => ({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      if (generation !== sessionRequests.generation()) return { generation };
      const snapshot = queryClient.getQueryData<CartItemType[]>(cartKey);
      queryClient.setQueryData<CartItemType[]>(cartKey, (old = []) => updater(old));
      return { snapshot, generation };
    },
    onError: (
      _err: unknown,
      _vars: unknown,
      context?: { snapshot?: CartItemType[]; generation: number },
    ) => {
      if (context?.generation !== sessionRequests.generation()) return;
      queryClient.setQueryData(cartKey, context?.snapshot);
      toast.error(ERROR_MESSAGE[kind]);
    },
    onSettled: (
      _data: unknown,
      _err: unknown,
      _vars: unknown,
      context?: { generation: number },
    ) => {
      if (context?.generation !== sessionRequests.generation()) return;
      queryClient.invalidateQueries({ queryKey: cartKey });
    },
  });

  const increment = useMutation({
    mutationFn: () => {
      sessionRequests.assertCurrent(generation);
      return updateCartItemQuantity.update(id, quantity + 1);
    },
    ...withOptimisticUpdate('increment', (old) =>
      old.map((item) => (item.id === id ? { ...item, quantity: quantity + 1 } : item)),
    ),
  });

  const decrement = useMutation({
    mutationFn: () => {
      sessionRequests.assertCurrent(generation);
      return updateCartItemQuantity.update(id, quantity - 1);
    },
    ...withOptimisticUpdate('decrement', (old) =>
      old.map((item) => (item.id === id ? { ...item, quantity: quantity - 1 } : item)),
    ),
  });

  const deleteItem = useMutation({
    mutationFn: () => {
      sessionRequests.assertCurrent(generation);
      return deleteCartItem.deleteCartItemById(id);
    },
    ...withOptimisticUpdate('delete', (old) => old.filter((item) => item.id !== id)),
    onSuccess: () => {
      if (generation === sessionRequests.generation()) toast.success('Item removido');
    },
  });

  return { increment, decrement, deleteItem };
};
