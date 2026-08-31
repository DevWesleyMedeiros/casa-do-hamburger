// GoogleLogin.ts (serviço) — mesmo padrão de Login.ts, só troca o payload
// e o endpoint. Mantido como arquivo separado (não mistura com Login.ts)
// porque o payload e as regras de erro são diferentes o suficiente
// (RF-54/RN-AUTH-11 pode devolver 409, que o login local nunca devolve).

import axios from "axios";
import { api } from "../ApiConfig";
import type { GoogleLoginPayloadInterface } from "../../../../types/Payload";
import { ApiError } from "../ApiExceptions";

export const GoogleLoginDate = {
  create: async (payload: GoogleLoginPayloadInterface) => {
    try {
      const { data } = await api.post("/auth/google", payload);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ?? "Erro ao fazer login com Google";
        const statusCode = error.response?.status ?? 500;
        return new ApiError(statusCode, message);
      }
    }
    return new ApiError(500, "Erro de conexão com servidor");
  },
};
