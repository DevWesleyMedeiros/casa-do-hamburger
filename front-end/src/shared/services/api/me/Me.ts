import { Api } from "../ApiConfig";
import { type UserLogin } from "../../../../types/Payload";

// bate na rota auth/me e onde estão os dados do usuário com o token decodificado
export const getAuth = {
  getMe: async (): Promise<UserLogin | null> => {
    try {
      const response = await Api().get("/auth/me");
      return response.data.user ?? null;
      // retorno do dado de verdade. Se não existir, nada é retornado
    } catch {
      return null;
    }
  },
};
