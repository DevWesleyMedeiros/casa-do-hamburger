import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getCartItemsList } from "../../shared/services/api/cartItems/getCartItems";
import { toast } from "sonner";
import { updateCartItemQuantity } from "../../shared/services/api/update/updateCartItemService";
import { type CartItemType } from "../../types/CartItem";

// Interface do Store do Carrinho
interface CartStore {
  items: CartItemType[]; // lista de CartItems
  isLoading: boolean;

  addItem: (product: CartItemType) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setCartItems: (items: CartItemType[]) => void;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  fetchCartItems: () => Promise<void>;
  incrementItem: (cartItemId: string) => Promise<void>;
  decrementItem: (cartItemId: string) => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  devtools(
    (set, get) => ({
      items: [],
      isLoading: true,

      setCartItems: (items) => {
        set({ items }, false, "cart/setItems");
      },
      addItem: (product) => {
        set(
          (state) => {
            const existingItem = state.items.find(
              (item) => item.id === product.id,
            );

            if (existingItem) {
              return {
                items: state.items.map((item) =>
                  item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
                ),
              };
            }

            return { items: [...state.items, product] };
          },
          false,
          "cart/addItem",
        );
      },

      removeItem: (cartItemId: string) => {
        set(
          (state) => ({
            items: state.items.filter((item) => item.id !== cartItemId),
          }),
          false,
          "cart/removeItem",
        );
      },

      updateCartItemQuantity: (cartItemId, quantity) => {
        set(
          (state) => ({
            items: state.items.map((item) =>
              item.id === cartItemId ? { ...item, quantity } : item,
            ),
          }),
          false,
          "cart/updateItemQuantity",
        );
      },

      incrementItem: async (cartItemId) => {
        const currentItem = get().items.find((item) => item.id === cartItemId);
        if (!currentItem) return;

        const newQuantity = currentItem.quantity + 1;

        // Atualiza UI imediatamente (otimista)
        get().updateCartItemQuantity(cartItemId, newQuantity);

        try {
          // Persiste no banco em background
          await updateCartItemQuantity.update(cartItemId, newQuantity);
        } catch {
          // 3. Rollback se falhar
          get().updateCartItemQuantity(cartItemId, currentItem.quantity);
          toast.error("Erro ao atualizar quantidade");
        }
      },

      decrementItem: async (cartItemId) => {
        const currentItem = get().items.find((item) => item.id === cartItemId);
        if (!currentItem) return;

        // quantity === 1: decremento vira deleção — o componente cuida disso
        if (currentItem.quantity <= 1) return;

        const newQuantity = currentItem.quantity - 1;

        // Atualiza UI imediatamente (otimista)
        get().updateCartItemQuantity(cartItemId, newQuantity);

        try {
          // 2. Persiste no banco em background
          await updateCartItemQuantity.update(cartItemId, newQuantity);
        } catch {
          // 3. Rollback se falhar
          get().updateCartItemQuantity(cartItemId, currentItem.quantity);
          toast.error("Erro ao atualizar quantidade");
        }
      },

      clearCart: () => {
        set({ items: [] }, false, "cart/clearCart");
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0,
        );
      },

      fetchCartItems: async () => {
        try {
          const data = await getCartItemsList.getCartItemsProduct();
          if (Array.isArray(data) && !(data instanceof Error))
            set({ items: data }, false, "fetch/success");
        } catch {
          // produtos não encontrados
        } finally {
          set({ isLoading: false }, false, "fetch/done");
        }
      },
    }),
    { name: "CartStore" },
  ),
);
