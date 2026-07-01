// rota get que irá buscar item do carrinho - CartItem
import { type CartItemType } from "../../../../types/CartItem";
import { api } from "../ApiConfig";

export const getCartItemsList = {
  getCartItemsProduct: async (): Promise<CartItemType[] | null> => {
    try {
      const response = await api().get(
        `${import.meta.env.VITE_API_URL}/get-cart-items`,
      );
      return response.data ?? null;
    } catch {
      return null;
    }
  },
};
