import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ação no meu Cart.tsx
interface NewProductModalUIStore {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}
export const useNewProductUIModalStore = create<NewProductModalUIStore>()(
  devtools(
    (set) => ({
      isModalOpen: false,
      openModal: () => set({ isModalOpen: true }, false, "modal/open"),
      closeModal: () => set({ isModalOpen: false }, false, "modal/close"),
    }),
    { name: "NewProductModalUIStore" },
  ),
);
