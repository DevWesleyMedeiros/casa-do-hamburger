// item do carrinho - CartItem -, componente que vai dentro do Cart

import { CircleChevronLeft, CircleChevronRight, Trash2 } from "lucide-react";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";

// types somente para o CardItem, por isso o Props no final
// CartItems é o child do Cart, por tanto para cada prop do CartItem, que é o componente chamado dentrodo Cart, eu passo os valores que vem da minha API
type CartItemProps = {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  img: string;
  quantity?: number;
};
export const CartItem = ({
  cartItemId,
  productId,
  // productId é o id do produto que está no CartItem com referência ao id do produto na tabela Products
  name,
  price,
  img,
  quantity = 1,
}: CartItemProps) => {
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
          {brazilinaCurrencyFormat(price)}
        </p>
        <div className="chevrons mt-1 flex h-4.75 w-22.75 items-center gap-2">
          <CircleChevronLeft
            color="white"
            className="bg-brand-red cursor-pointer rounded-md"
          />
          <p className="text-brand-dark mx-1.5 text-sm font-bold">{quantity}</p>
          <CircleChevronRight
            color="white"
            className="bg-brand-red cursor-pointer rounded-md"
          />
        </div>
      </div>
      <div className="inset-0 cursor-pointer">
        <Trash2 size={ICON_CONFIG.mxSize} onClick={() => alert(productId)} />
      </div>
    </div>
  );
};
