import axios from "axios";
import { type RegisterPayloadInterface } from "../../../../types/Payload";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

// put, delete, post, get ... somente para a rota register
export const RegisterDate = {
  create: async (payload: RegisterPayloadInterface) => {
    try {
      const { data } = await api().post(
        `${import.meta.env.VITE_API_URL}/register`,
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
