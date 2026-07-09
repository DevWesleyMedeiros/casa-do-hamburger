import { api } from "../ApiConfig";
import { type UserLogin } from "../../../../types/Payload";

// bate na rota auth/me e onde estão os dados do usuário com o token decodificado
// Deixa o Axios estourar o erro naturalmente (AxiosError).
// O TanStack Query captura isso sozinho e popula isError/error.
// tanktack já lida com try e catch nas requisições
export const getAuth = {
  getMe: async (): Promise<UserLogin | undefined> => {
    const response = await api().get("/auth/me");
    return response.data.user ?? [];
  },
};
