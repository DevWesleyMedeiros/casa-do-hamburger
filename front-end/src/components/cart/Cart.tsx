import { OctagonX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { getCartItemsList } from "../../shared/services/api/cartItems/getCartItems";
import { type CartItemType } from "../../types/CartItem";
import { Button } from "../button/Button";
import { CartItem } from "../cartItem/CartItem";

type CartProps = {
  setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
  showCart: boolean;
};

// showCart e setShowCart são funções para mostrar e esconder o Cart
export const Cart = ({ showCart, setShowCart }: CartProps) => {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]); // plural é melhor para arrays

  // Fetch limpo usando apenas async/await (sem .then)
  const fetchCartItems = useCallback(async () => {
    try {
      const data = await getCartItemsList.getCartItemsProduct();

      // Se houver data, atualiza o estado
      if (data) {
        // O queueMicrotask ou um setTimeout de 0ms joga a atualização para a próxima "fila de tarefas" do navegador, evitando o ciclo síncrono ao executar o useEffect.
        // queueMicrotask vai funcionar como um setTimeout gerando uma leve latência no meu componente de forma que o react não interprete a requisição como síncrona
        queueMicrotask(() => {
          setCartItems(data);
        });
      }
    } catch (error) {
      console.error("Erro ao buscar itens do carrinho:", error);
    }
  }, []); // useCallback sem dependências, pois não usa nada externo, somente chama uma função fetch

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]); // Boa prática: colocar a função no array de dependências

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
        {/* Renderização da lista limpa e tipada! */}
        {cartItems.map((item) => (
          <CartItem
            key={item.id} // Usando o id real do CartItem (conforme Prisma schema)
            cartItemId={item.id}
            productId={item.productId}
            name={item.product.name}
            price={item.product.price}
            img={item.product.img}
          />
        ))}
      </div>
      <Button
        title="Finalizar pedido"
        type="button"
        colorVariation="bgRedVariation"
      ></Button>
    </div>
  );
};
