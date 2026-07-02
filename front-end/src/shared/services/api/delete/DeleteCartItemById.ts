import axios from "axios";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

// Consumir a rota de delete de um cartItem pelo seu id
export const deleteCartItem = {
  deleteCartItemById: async (
    cartItemId: string,
  ): Promise<{ message: string } | ApiError> => {
    try {
      const response = await api().delete(
        `${import.meta.env.VITE_API_URL}/cart-item/${cartItemId}`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ?? "Erro desconhecido";
        const statusCode = error.response?.status ?? 0;
        return new ApiError(message, statusCode);
      }
      return new ApiError("Erro inesperado", 0);
    }
  },
};
