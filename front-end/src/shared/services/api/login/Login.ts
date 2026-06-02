// Login.ts (serviço)
import axios from "axios";
import { Api } from "../ApiConfig";
import { type LoginPayload } from "../../../../types/Payload";
import { ApiError } from "../ApiExceptions";

// put, delete, post, get ... somente para a rota login
export const LoginDate = {
  create: async (payload: LoginPayload) => {
    try {
      const { data } = await Api().post(
        "http://localhost:3000/auth/login",
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
