// rota post para consumir o carrinho criado pelo id
import axios from "axios";
import { type CartItemType } from "../../../../types/CartItem";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

interface CreateCartItemPayload {
  productId: string;
}

export const NewCartItem = {
  newCartItem: async (
    payload: CreateCartItemPayload,
  ): Promise<CartItemType | ApiError> => {
    try {
      const { data } = await api().post(
        `${import.meta.env.VITE_API_URL}/create-cart-item`,
        payload,
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ?? "Erro desconhecido ao fazer login";
        const statusCode = error.response?.status ?? 0;
        return new ApiError(message, statusCode);
      }
      return new ApiError("Erro de conexão com o servidor", 0);
    }
  },
};
