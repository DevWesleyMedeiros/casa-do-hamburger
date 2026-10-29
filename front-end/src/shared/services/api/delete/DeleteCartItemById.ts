import axios from 'axios';
import { api } from '../ApiConfig';
import { ApiError } from '../ApiExceptions';

// Consumir a rota de delete de um cartItem pelo seu id
export const deleteCartItem = {
  deleteCartItemById: async (cartItemId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/auth/cart-item/${cartItemId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ?? 'Erro desconhecido';
        const statusCode = error.response?.status ?? 0;
        throw new ApiError(statusCode, message);
      }
      throw new ApiError(0, 'Erro inesperado');
    }
  },
};
