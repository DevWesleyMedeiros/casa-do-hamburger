import {
  CircleChevronLeft,
  CircleChevronRight,
  OctagonX,
  Trash2,
} from "lucide-react";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { Button } from "../button/Button";

export const Cart = () => {
  return (
    <div className="conteiner-cart bg-brand-amber absolute right-0 flex h-208.25 w-93.75 flex-col">
      <div className="cart-title_and_X text-brand-dark mx-5 my-5 flex flex-row-reverse items-center justify-between px-0.5 py-1 font-bold uppercase">
        <p>Meu carrinho</p>
        <OctagonX size={ICON_CONFIG.mxSize} className="cursor-pointer" />
      </div>

      <div className="conteiner-item-cart mx-5 flex-1 bg-red-500">
        {/* flex-1 seta o conteiner item-cart para main e joga o botão para baixo */}
        <div className="product-selected-card flex items-center justify-between bg-green-500">
          <div className="img">
            <img src="./duplo-da-casa-mobile.png" alt="#" />
          </div>
          <div className="texto mx-3 flex flex-col bg-amber-950">
            <p className="title">Duplo da casa</p>
            <p className="price">R$28,90</p>
            <div className="chevrons flex items-center justify-center gap-2">
              <CircleChevronLeft /> 1 <CircleChevronRight />
            </div>
          </div>
          <div className="trash-icon">
            <Trash2 />
          </div>
        </div>
      </div>

      {/* botão finalizar pedido */}
      <Button
        title="Finalizar pedido"
        type="button"
        className="bg-brand-red"
      ></Button>
    </div>
  );
};
