import { useQuery } from "@tanstack/react-query";
import { OctagonX } from "lucide-react";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { queryKeys } from "../../constant/queryKeys";
import { useMe } from "../../hook/useMe";
import { getCartItemsList } from "../../shared/services/api/cartItems/getCartItems";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";
import { Button } from "../button/Button";
import { CartItem } from "../cartItem/CartItem";

type CartProps = {
  setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
  showCart: boolean;
};

export const Cart = ({ showCart, setShowCart }: CartProps) => {
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

  return (
    <div className="conteiner-cart bg-brand-amber transforme absolute right-0 z-10 flex h-208.25 w-73.75 flex-col transition-transform duration-500 ease-in-out">
      <div className="cart-title_and_X text-brand-dark mx-5 my-5 flex flex-row-reverse items-center justify-between px-0.5 py-1 font-bold uppercase">
        <p>Meu carrinho</p>
        <OctagonX
          size={ICON_CONFIG.mxSize}
          className="cursor-pointer"
          onClick={() => setShowCart(!showCart)}
        />
      </div>

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

      {/* total calculado de produtos */}
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
      ></Button>
      {/* criar um spinner ao invés de um skeleton para ações pontuais */}
    </div>
  );
};
