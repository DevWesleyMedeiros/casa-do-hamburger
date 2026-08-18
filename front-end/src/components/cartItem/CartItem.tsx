// item do carrinho - CartItem -, componente que vai dentro do Cart

import { CircleChevronLeft, CircleChevronRight, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";
import { getProductImageUrl } from "../../shared/utils/getProductImageUrl";
import { type ProductImage } from "../../types/ProductImage";
import { useCartItemMutations } from "../../hook/useCartItemMutation";

type CartItemProps = {
  id: string;
  productId?: string;
  name: string;
  price: number;
  images: ProductImage[];
  quantity: number;
};
export const CartItem = ({
  id,
  name,
  price,
  images,
  quantity,
}: CartItemProps) => {
  const subtotal = price * quantity;
  const { increment, decrement, deleteItem } = useCartItemMutations(
    id,
    quantity,
  );
  const handleDecrementOrDelete = useCallback(() => {
    if (quantity === 1) return deleteItem.mutate(id);
    decrement.mutate(id);
  }, [quantity, decrement, deleteItem, id]);

  return (
    <div className="my-component-card flex items-center justify-between">
      <div className="img">
        <img
          src={getProductImageUrl(images, "thumbnail")}
          alt={name || "imagem do item"}
        />
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
            onClick={() => increment.mutate(id)}
          />
        </div>
      </div>
      <div className="inset-0 cursor-pointer">
        <Trash2
          size={ICON_CONFIG.mxSize}
          onClick={() => deleteItem.mutate(id)}
        />
      </div>
    </div>
  );
};
