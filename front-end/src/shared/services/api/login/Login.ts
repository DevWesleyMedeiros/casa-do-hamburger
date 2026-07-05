// Login.ts (serviço)
import axios from "axios";
import { api } from "../ApiConfig";
import { type LoginPayloadInterface } from "../../../../types/Payload";
import { ApiError } from "../ApiExceptions";

// put, delete, post, get ... somente para a rota login
export const LoginDate = {
  create: async (payload: LoginPayloadInterface) => {
    try {
      // POST para /auth/login (caminho relativo)
      const { data } = await api().post(
        "/auth/login",
        payload,
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ?? "Erro desconhecido ao fazer login";
        const statusCode = error.response?.status ?? 0;
        return new ApiError(statusCode, message);
      }
      return new ApiError(0, "Erro de conexão com o servidor");
    }
  },
};
