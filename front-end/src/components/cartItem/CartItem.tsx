// item do carrinho - CartItem -, componente que vai dentro do Cart

import { CircleChevronLeft, CircleChevronRight, Trash2 } from "lucide-react";
import { ICON_CONFIG } from "../../constant/iconConfig";

export const CartItem = () => {
  return (
    <div className="my-component-card flex items-center justify-between">
      <div className="img">
        <img src="./duplo-da-casa-mobile.png" alt="#" />
      </div>
      {/* flex-1 seta o conteiner item-cart para main e joga o botão para baixo */}
      <div className="texto mx-2 flex flex-1 flex-col gap-0.5 py-1.5">
        <p className="title text-brand-dark text-sm font-bold uppercase">
          Duplo da casa
        </p>
        <p className="price text-[#848484]">R$28,90</p>
        <div className="chevrons mt-1 flex h-4.75 w-22.75 items-center gap-2">
          <CircleChevronLeft
            color="white"
            className="bg-brand-red cursor-pointer rounded-md"
          />
          <p className="text-brand-dark mx-1.5 text-sm font-bold">1</p>
          <CircleChevronRight
            color="white"
            className="bg-brand-red cursor-pointer rounded-md"
          />
        </div>
      </div>
      <div className="inset-0 cursor-pointer">
        <Trash2 size={ICON_CONFIG.mxSize} />
      </div>
    </div>
  );
};
