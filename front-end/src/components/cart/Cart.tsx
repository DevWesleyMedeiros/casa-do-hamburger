import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../constant/queryKeys";
import { useMe } from "../../hook/useMe";
import { getCartItemsList } from "../../shared/services/api/cartItems/getCartItems";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";
import { Button } from "../button/Button";
import { CartItem } from "../cartItem/CartItem";
import { useCartUIStore } from "../../shared/stores";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";

export const Cart = () => {
  const { data: user } = useMe();
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: queryKeys.cartItems,
    queryFn: () => getCartItemsList.getCartItemsProduct(),
    enabled: Boolean(user),
    retry: false,
    staleTime: 30_000,
  });

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const isOpenCart = useCartUIStore((state) => state.isCartOpen);
  const closeCart = useCartUIStore((state) => state.closeCart);

  return (
    <Sheet open={isOpenCart} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        className="bg-brand-amber flex w-73.75 flex-col border-none"
      >
        <SheetHeader className="text-brand-dark flex-row items-center justify-between font-bold uppercase">
          <SheetTitle>Meu carrinho</SheetTitle>
        </SheetHeader>

        <div className="mx-3 flex flex-1 flex-col gap-2.5">
          {isLoading ? (
            <p className="text-brand-dark animate-pulse text-center text-sm">
              Carregando...
            </p>
          ) : (
            cartItems.map((item) => (
              <CartItem
                key={item.id}
                id={item.id}
                productId={item.productId}
                name={item.product.name}
                price={item.product.price}
                img={item.product.img}
                quantity={item.quantity}
              />
            ))
          )}
        </div>

        <div className="border-brand-dark/20 mx-5 my-3 flex items-center justify-between border-t pt-3">
          <p className="text-brand-dark font-bold uppercase">Total</p>
          <p className="text-brand-dark font-bold">
            {brazilinaCurrencyFormat(totalPrice)}
          </p>
        </div>

        <Button
          title="Finalizar pedido"
          type="button"
          colorVariation="bgRedVariation"
        />
      </SheetContent>
    </Sheet>
  );
};
