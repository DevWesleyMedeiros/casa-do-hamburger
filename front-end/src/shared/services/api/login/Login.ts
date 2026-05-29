import { type UserTypes } from "../../../../types/UserTypes";
import { Api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

// Alterado para receber um objeto, combinando com o componente anterior
const create = async ({
  email,
  password,
}: UserTypes): Promise<UserTypes | ApiError> => {
  try {
    // O Axios recebe a rota primeiro (login), e o objeto com os dados (body) {email, password} depois
    const { data } = await Api().post("/login", { email, password });
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      return new ApiError(err.message || "Erro desconhecido");
    }
    return new ApiError("Erro ao fazer login");
  }
};

// agrupador de métodos para buscar dados da api
export const LoginDate = {
  create,
};
