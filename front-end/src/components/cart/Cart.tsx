import { useMe } from '../../hook/useMe';
import { getCartItemsList } from '../../shared/services/api/cartItems/getCartItems';
import { useCartUIStore } from '../../shared/stores';
import { brazilinaCurrencyFormat } from '../../shared/utils/Utils';
import { Button } from '../button/Button';
import { CartItem } from '../cartItem/CartItem';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';
import { queryKeys } from '../../constant/queryKeys.js';
import { ApiError } from '../../shared/services/api/ApiExceptions.js';
import { orderSeriviceApi } from '../../shared/services/api/orders/ordersServiceApi';
import { resolveApiErrorMessage } from '../../shared/utils/apiErrorMessage.js';

export const Cart = () => {
  const { data: user } = useMe();

  const queryClient = useQueryClient();

  const isOpenCart = useCartUIStore((state) => state.isCartOpen);

  const closeCart = useCartUIStore((state) => state.closeCart);

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: queryKeys.cartItems,
    queryFn: getCartItemsList.getCartItemsProduct,
    enabled: Boolean(user),
    retry: false,
    staleTime: 30_000,
  });

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const createOrderMutation = useMutation({
    mutationFn: orderSeriviceApi.createOrder,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.cartItems,
      });

      toast.success(`Pedido criado com sucesso`);

      closeCart();
    },

    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(resolveApiErrorMessage(err, 'Não foi possível finalizar o pedido'));

        return;
      }

      toast.error('Não foi possível finalizar o pedido');
    },
  });

  const handleCreateOrder = () => {
    if (cartItems.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    if (createOrderMutation.isPending) {
      return;
    }

    createOrderMutation.mutate();
  };

  return (
    <Sheet
      open={isOpenCart}
      onOpenChange={(open) => {
        if (!open) {
          closeCart();
        }
      }}
    >
      <SheetContent side="right" className="bg-brand-amber flex w-73.75 flex-col border-none">
        <SheetHeader className="text-brand-dark flex-row items-center justify-between font-bold uppercase">
          <SheetTitle>Meu carrinho</SheetTitle>
        </SheetHeader>

        <div className="mx-3 flex flex-1 flex-col gap-2.5">
          {isLoading ? (
            <p className="text-brand-dark animate-pulse text-center text-sm">Carregando...</p>
          ) : cartItems.length === 0 ? (
            <p className="text-brand-dark text-center text-sm">Seu carrinho está vazio.</p>
          ) : (
            cartItems.map((item) => (
              <CartItem
                key={item.id}
                id={item.id}
                productId={item.productId}
                name={item.product.name}
                price={item.product.price}
                images={item.product.images ?? null}
                quantity={item.quantity}
              />
            ))
          )}
        </div>

        <div className="border-brand-dark/20 mx-5 my-3 flex items-center justify-between border-t pt-3">
          <p className="text-brand-dark font-bold uppercase">Total</p>

          <p className="text-brand-dark font-bold">{brazilinaCurrencyFormat(totalPrice)}</p>
        </div>

        <Button
          title={createOrderMutation.isPending ? 'Finalizando...' : 'Finalizar pedido'}
          type="button"
          colorVariation="bgRedVariation"
          disabled={isLoading || cartItems.length === 0 || createOrderMutation.isPending}
          onClick={handleCreateOrder}
        />
      </SheetContent>
    </Sheet>
  );
};
