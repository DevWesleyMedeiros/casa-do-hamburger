import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ação no meu Cart.tsx
interface CartUIStore {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartUIStore = create<CartUIStore>()(
  devtools(
    (set) => ({
      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }, false, "cart/open"),
      closeCart: () => set({ isCartOpen: false }, false, "cart/close"),
      toggleCart: () =>
        set(
          (state) => ({ isCartOpen: !state.isCartOpen }),
          false,
          "cart/toggle",
        ),
    }),
    { name: "CartUIStore" },
  ),
);
