import { OctagonX } from "lucide-react";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { Button } from "../button/Button";
import { CartItem } from "../cartItem/CartItem";

type CartProps = {
  setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
  showCart: boolean;
};

export const Cart = ({ showCart, setShowCart }: CartProps) => {
  return (
    <div className="conteiner-cart bg-brand-amber transforme absolute right-0 z-10 flex h-208.25 w-73.75 flex-col transition-transform duration-500 ease-in-out">
      <div className="cart-title_and_X text-brand-dark mx-5 my-5 flex flex-row-reverse items-center justify-between px-0.5 py-1 font-bold uppercase">
        <p>Meu carrinho</p>
        <OctagonX
          size={ICON_CONFIG.mxSize}
          className="cursor-pointer"
          onClick={() => setShowCart(!showCart)}
          // setShowCart definida no header vem com uma prop do tipo dispatch e me permite alterar o valor da janela Cart
        />
      </div>

      <div className="mx-3 flex flex-1 flex-col gap-2.5">
        <CartItem></CartItem>
        <CartItem></CartItem>
      </div>
      <Button
        title="Finalizar pedido"
        type="button"
        colorVariation="bgRedVariation"
      ></Button>
    </div>
  );
};
