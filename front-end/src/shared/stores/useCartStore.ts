import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type CartItemType } from "../../types/CartItem";

// Interface do Store do Carrinho
interface CartStore {
  items: CartItemType[]; // lista de CartItems selecionados

  // ações no carrinho
  addItem: (product: CartItemType) => void;
  removeItem: (product: string) => void;
  clearCart: () => void;
  setCartItems: (items: CartItemType[]) => void; // função que irá preencher meus CartItems com os CartsItem colocados no carrinho

  // Estado derivado para contagem total
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  devtools(
    (set, get) => ({
      items: [],

      setCartItems: (items) => {
        set({ items }, false, "cart/setItems");
      },

      addItem: (product) => {
        set(
          (state) => {
            // Verifica se o item já existe no carrinho
            const existingItem = state.items.find(
              (item) => item.id === product.id,
            );

            if (existingItem) {
              // Se existe, apenas aumenta a quantidade (Evita itens duplicados na lista)
              return {
                items: state.items.map((item) =>
                  item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
                ),
              };
            }

            // Se não existe, adiciona com quantidade 1 (ou a quantidade passada)
            return { items: [...state.items, product] };
          },
          false,
          "cart/addItem",
        );
      },

      removeItem: (productId) => {
        set(
          (state) => ({
            items: state.items.filter((item) => item.id !== productId),
          }),
          false,
          "cart/removeItem",
        );
      },

      clearCart: () => {
        set({ items: [] }, false, "cart/clearCart");
      },

      // Funções utilitárias (Getters) para usar no Header (ícone) e no Checkout
      getTotalItems: () => {
        const { items } = get(); // get() acessa o estado atual sem precisar de hook
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0,
        );
      },
    }),
    { name: "CartStore" },
  ),
);
