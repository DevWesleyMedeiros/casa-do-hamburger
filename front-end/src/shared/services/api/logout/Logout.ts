// buscar os dados do usuário na rota de logout
import { api } from "../ApiConfig";

export const userLogOut: () => Promise<void> = async () => {
  await api().post("/auth/logout");
};
