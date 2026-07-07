// consumir api de pelo ending point produtos aqui
// rota consumida pelo React Query

import { type ProductsInterface } from "../../../../types/Products";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

export const getProductsData = {
  // retorna APENAS os dados ou LANÇA o erro — nunca os dois
  getProducts: async (): Promise<ProductsInterface[]> => {
    try {
      // GET para /auth/products (caminho relativo)
      const response = await api().get("/auth/products");
      return response.data ?? [];
      // [] garante array vazio se a API retornar null/undefined
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        // lança o erro para o TanStack Query capturar via isError
        throw error
      }
      throw new ApiError(500, "Erro inesperado ao buscar produtos");
    }
  },
};
