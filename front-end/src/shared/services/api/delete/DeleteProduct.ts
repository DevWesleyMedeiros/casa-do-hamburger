import { Api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";
import axios from "axios";

// Consumir a rota de delete de um produto
export const deleteProductById = {
  deleteProduct: async (
    id: string,
  ): Promise<{ message: string } | ApiError> => {
    try {
      // id vem como params
      const response = await Api().delete(`/auth/products/${id}`);
      // já tenho o date do produto, portanto só o retorno
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // typeguard de para me garantir de que o erro gerado pelo próprio axios
        // Aqui o seu editor sabe que 'erro' tem a propriedade 'response'
        const message = error.response?.data?.message ?? "Erro desconhecido";
        const statusCode = error.response?.status ?? 0;
        return new ApiError(message, statusCode);
      }
      // damais erros que eventualmente podem acontecer: sintaxe, variáveis inexistentes etc.
      return new ApiError("Erro inesperado", 0);
    }
  },
};
// A função axios.isAxiosError() é um utilitário do Axios usado para verificar se um erro capturado foi gerado pelo próprio Axios.Ela serve como um "guarda de tipo" (Type Guard) no JavaScript e TypeScript, garantindo que o objeto de erro possui as propriedades específicas do Axios (como response ou request).
