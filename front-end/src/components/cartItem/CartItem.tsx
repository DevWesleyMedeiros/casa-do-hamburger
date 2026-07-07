// item do carrinho - CartItem -, componente que vai dentro do Cart

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleChevronLeft, CircleChevronRight, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { queryKeys } from "../../constant/queryKeys";
import { deleteCartItem } from "../../shared/services/api/delete/DeleteCartItemById";
import { updateCartItemQuantity } from "../../shared/services/api/update/updateCartItemService";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";

type CartItemProps = {
  id: string;
  productId: string;
  name: string;
  price: number;
  img: string;
  quantity: number;
};
export const CartItem = ({
  id,
  productId,
  name,
  price,
  img,
  quantity,
}: CartItemProps) => {
  const queryClient = useQueryClient();

  // atualizar o cache localmente
  const updateCacheQuantity = (cartItemId: string, newQty: number) => {
    queryClient.setQueryData<CartItemProps[]>(queryKeys.cartItems, (old = []) =>
      old.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const { mutate: increment } = useMutation({
    // Mutação: Dispara a chamada assíncrona (POST, PUT, DELETE) em segundo plano
    mutationFn: () => updateCartItemQuantity.update(id, quantity + 1),
    onMutate: () => {
      const snapshot = queryClient.getQueryData<CartItemProps[]>(
        queryKeys.cartItems,
      );
      // optmistic update:
      updateCacheQuantity(id, quantity + 1);
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      // Rollback se a API falhar
      queryClient.setQueryData(queryKeys.cartItems, context?.snapshot);
      toast.error("Erro ao atualizar quantidade");
    },
    // sincroniza definitivamente a interface com o estado real do servidor.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cartItems });
    },
  });

  // função mutate para decrementar
  const { mutate: decrement } = useMutation({
    mutationFn: () => updateCartItemQuantity.update(id, quantity - 1),
    onMutate: () => {
      const snapshot = queryClient.getQueryData<CartItemProps[]>(
        queryKeys.cartItems,
      );
      updateCacheQuantity(id, quantity - 1);
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.cartItems, context?.snapshot);
      toast.error("Erro ao atualizar quantidade");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cartItems });
    },
  });

  // função mutate para deletar CartItem pelo Id
  const { mutate: deleteItem } = useMutation({
    mutationFn: () => deleteCartItem.deleteCartItemById(id),
    onMutate: () => {
      const snapshot = queryClient.getQueryData<CartItemProps[]>(
        queryKeys.cartItems,
      );
      queryClient.setQueryData<CartItemProps[]>(
        queryKeys.cartItems,
        (old = []) => {
          old.filter((item) => item.id !== id);
        },
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.cartItems, context?.snapshot);
      toast.error("Erro ao remover item");
    },
    onSuccess: () => toast.success("Item removido"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cartItems });
    },
  });

  // deletar quando CartItem for menor de 1
  const handleDecrementOrDelete = useCallback(() => {
    if (quantity === 1) return deleteItem();
    decrement();
  }, [quantity, decrement, deleteItem]);

  const subtotal = price * quantity;

  return (
    <div className="my-component-card flex items-center justify-between">
      <div className="img">
        <img src={`./${img}`} alt={name || "imagem do item"} />
      </div>
      {/* flex-1 seta o conteiner item-cart para main e joga o botão para baixo */}
      <div className="texto mx-2 flex flex-1 flex-col gap-0.5 py-1.5">
        <p className="title text-brand-dark text-sm font-bold uppercase">
          {name}
        </p>
        <p className="price text-sm text-[#848484]">
          {brazilinaCurrencyFormat(subtotal)}
        </p>
        <div className="chevrons mt-1 flex h-4.75 w-22.75 items-center gap-2">
          <CircleChevronLeft
            color="white"
            className="bg-brand-red cursor-pointer rounded-md"
            onClick={handleDecrementOrDelete}
          />
          <p className="text-brand-dark mx-1.5 text-sm font-bold">{quantity}</p>
          <CircleChevronRight
            color="white"
            className="bg-brand-red cursor-pointer rounded-md"
            onClick={() => increment()}
          />
        </div>
      </div>
      <div className="inset-0 cursor-pointer">
        <Trash2 size={ICON_CONFIG.mxSize} onClick={() => deleteItem()} />
      </div>
    </div>
  );
};
