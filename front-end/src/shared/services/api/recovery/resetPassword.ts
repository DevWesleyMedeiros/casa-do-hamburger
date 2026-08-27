import axios from "axios";
import { type AuthMessageResponse } from "../../../../types/recoveryPass";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

export const resetPassword = {
  reset: async (payload: {
    token: string;
    newPassword: string;
  }): Promise<AuthMessageResponse> => {
    try {
      const { data } = await api.post<AuthMessageResponse>(
        "/auth/reset-password",
        payload,
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ??
          "Erro desconhecido ao redefinir a senha";
        const statusCode = error.response?.status ?? 0;
        throw new ApiError(statusCode, message);
      }
      throw new ApiError(500, "Erro de conexão com o servidor");
    }
  },
};
