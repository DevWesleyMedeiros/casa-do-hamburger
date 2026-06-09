// buscar os dados do usuário na rota de logout
import { Api } from "../ApiConfig";

export const userLogOut: () => Promise<void> = async () => {
  await Api().post("/auth/logout");
};
