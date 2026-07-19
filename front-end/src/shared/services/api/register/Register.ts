import axios from "axios";
import { type RegisterPayloadInterface } from "../../../../types/Payload";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

export const RegisterDate = {
  create: async (payload: RegisterPayloadInterface) => {
    try {
      const { data } = await api().post("/auth/register", payload);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ??
          "Erro desconhecido ao fazer registro";
        const statusCode = error.response?.status ?? 0;
        throw new ApiError(statusCode, message);
      }
      throw new ApiError(500, "Erro de conexão com o servidor");
    }
  },
};
