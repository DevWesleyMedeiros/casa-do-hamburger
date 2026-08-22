import axios from "axios";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";
import { type RecoveryPassResponse } from "../../../../types/recoveryPass";

export const resetPassword = {
  reset: async (payload: { token: string; newPassword: string }) => {
    try {
      // POST para /auth/reset-password (caminho relativo)
      const { data } = await api.post<RecoveryPassResponse>(
        "/auth/reset-password",
        payload,
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ?? "Erro desconhecido ao resetar senha";
        const statusCode = error.response?.status ?? 0;
        return new ApiError(statusCode, message);
      }
      return new ApiError(500, "Erro de conexão com o servidor");
    }
  },
};
