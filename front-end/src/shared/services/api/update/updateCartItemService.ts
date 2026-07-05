import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";
import axios from "axios";
import { type CartItemType } from "../../../../types/CartItem";

export const updateCartItemQuantity = {
  update: async (
    cartItemId: string,
    quantity: number,
  ): Promise<CartItemType | ApiError> => {
    try {
      const { data } = await api().patch(`/auth/cart-item/${cartItemId}`, {
        quantity,
      });
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ?? "Erro desconhecido";
        const statusCode = error.response?.status ?? 500;
        return new ApiError(statusCode, message);
      }
      if (error instanceof Error) {
        return new ApiError(500, error.message);
      }
    }
    return new ApiError(500, "Erro no servidor");
  },
};
