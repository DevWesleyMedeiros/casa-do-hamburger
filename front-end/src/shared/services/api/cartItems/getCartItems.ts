// rota get que irá buscar item do carrinho - CartItem
import { type CartItemType } from "../../../../types/CartItem";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

export const getCartItemsList = {
  getCartItemsProduct: async (): Promise<CartItemType[]> => {
    try {
      // GET para /auth/get-cart-items (caminho relativo)
      const response = await api().get("/auth/get-cart-items");
      return response.data ?? [];
    } catch (error: unknown) {
      // Tratamento de erro correto: usar axios.isAxiosError
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Erro ao buscar CartItems");
    }
  },
};
