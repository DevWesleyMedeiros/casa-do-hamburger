import axios from "axios";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";
import { type ForgotPasswordResponse } from "../../../../types/ForgotPassResponse";

// DTO de resposta pública — nunca a entidade interna (ForgotPassResponse
// tem tokenHash/userId, que jamais devem sair do backend)

export const forgotPassword = {
  create: async (payload: {
    email: string;
  }): Promise<ForgotPasswordResponse> => {
    try {
      const { data } = await api.post<ForgotPasswordResponse>(
        "/auth/forgot-password",
        payload,
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ??
          "Erro desconhecido ao solicitar recuperação de senha";
        const statusCode = error.response?.status ?? 0;
        throw new ApiError(statusCode, message);
      }
      throw new ApiError(500, "Erro de conexão com o servidor");
    }
  },
};
