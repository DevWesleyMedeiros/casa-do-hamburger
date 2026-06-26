// rota get que irá buscar item do carrinho - CartItem
import { Api } from "../ApiConfig";
import { type CartItemType } from "../../../../types/CartItem";

export const getCartItemsList = {
  getCartItemsProduct: async (): Promise<CartItemType[] | null> => {
    try {
      const response = await Api().get("/auth/get-cart-items");
      return response.data ?? null;
    } catch {
      return null;
    }
  },
};
