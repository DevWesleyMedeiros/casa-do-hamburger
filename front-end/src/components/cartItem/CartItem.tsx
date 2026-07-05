// item do carrinho - CartItem -, componente que vai dentro do Cart

import { CircleChevronLeft, CircleChevronRight, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { deleteCartItem } from "../../shared/services/api/delete/DeleteCartItemById";
import { useCartStore } from "../../shared/stores";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";

// types somente para o CardItem, por isso o Props no final
// CartItems é o child do Cart, por tanto para cada prop do CartItem, que é o componente chamado dentrodo Cart, eu passo os valores que vem da minha API
type CartItemProps = {
  id: string;
  productId: string;
  name: string;
  price: number;
  img: string;
  quantity: number;
};
export const CartItem = ({
  id, // CartItem id
  productId, // productId é o id do produto que está no CartItem com referência ao id do produto na tabela Products
  name,
  price,
  img,
  quantity,
}: CartItemProps) => {
  const incrementQuantity = useCartStore((state) => state.incrementItem);
  const decrementQuantity = useCartStore((state) => state.decrementItem);
  const removeCartItem = useCartStore((state) => state.removeItem);
  const subtotal = price * quantity;

  // deletar cartItem pelo id
  const handleDeleteCartItemById = useCallback(
    async (id: string) => {
      if (!id) {
        toast.error("CartItem não foi encontrado ou já foi deletado");
        return;
      }
      const response = await deleteCartItem.deleteCartItemById(id);

      if (response instanceof ApiError) {
        if (response.statusCode === 404) {
          toast.error("CartItem não foi encontrado ou já foi deletado");
        } else if (response.statusCode === 403) {
          toast.error("Acesso restrito aos administradores");
        } else if (response.statusCode === 401) {
          toast.error("Você precisa estar logado");
          return;
        } else {
          toast.error(response.message);
        }

        return;
      }
      toast.success("CartItem deletado com sucesso");
      removeCartItem(id); // vem do cartStore e remove item pelo cartItem e atualiza
    },
    [removeCartItem],
  );

  // Se quantity chegar a 1 e o usuário decrementar, vira deleção
  const handleDecrementQuantity = useCallback(async () => {
    if (quantity === 1) {
      return await handleDeleteCartItemById(id);
    }
    await decrementQuantity(id);
  }, [quantity, id, handleDeleteCartItemById, decrementQuantity]);

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
            onClick={handleDecrementQuantity}
          />
          <p className="text-brand-dark mx-1.5 text-sm font-bold">{quantity}</p>
          <CircleChevronRight
            color="white"
            className="bg-brand-red cursor-pointer rounded-md"
            onClick={() => incrementQuantity(id)}
          />
        </div>
      </div>
      <div className="inset-0 cursor-pointer">
        <Trash2
          size={ICON_CONFIG.mxSize}
          onClick={() => handleDeleteCartItemById(id)}
        />
        {/* id do CartItem para deleção do produto */}
      </div>
    </div>
  );
};
