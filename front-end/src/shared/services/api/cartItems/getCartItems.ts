// rota get que irá buscar item do carrinho - CartItem
import axios from "axios";
import { type CartItemType } from "../../../../types/CartItem";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

export const getCartItemsList = {
  getCartItemsProduct: async (): Promise<CartItemType[] | null | ApiError> => {
    try {
      // GET para /auth/get-cart-items (caminho relativo)
      const response = await api().get("/auth/get-cart-items");
      return response.data ?? null;
    } catch (error: unknown) {
      // ✅ Tratamento de erro correto: usar axios.isAxiosError
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status ?? 500;
        const message =
          error.response?.data?.message ?? error.message ?? "Erro desconhecido";
        return new ApiError(statusCode, message);
      }
      if (error instanceof ApiError) {
        return error;
      }
    }
    return new ApiError(500, "Erro no servidor");
  },
};
