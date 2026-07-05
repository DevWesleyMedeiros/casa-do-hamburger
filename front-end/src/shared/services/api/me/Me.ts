import axios from "axios";
import { api } from "../ApiConfig";
import { type UserLogin } from "../../../../types/Payload";
import { ApiError } from "../ApiExceptions";

// bate na rota auth/me e onde estão os dados do usuário com o token decodificado
export const getAuth = {
  getMe: async (): Promise<UserLogin | ApiError> => {
    try {
      const response = await api().get("/auth/me");
      return response.data.user ?? null;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status ?? 500;
        const message =
          error.response?.data?.message ?? error.message ?? "Erro desconhecido";
        return new ApiError(statusCode, message);
      }
      if (error instanceof Error) {
        return new ApiError(500, error.message);
      }
    }
    return new ApiError(500, "Erro no servidor");
  },
};
