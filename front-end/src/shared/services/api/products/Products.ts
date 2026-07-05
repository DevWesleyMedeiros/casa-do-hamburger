// consumir api de pelo ending point produtos aqui

import { type ProductsInterface } from "../../../../types/Products";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";

export const getProductsData = {
  getProducts: async (): Promise<ProductsInterface[] | null | ApiError> => {
    try {
      // GET para /auth/products (caminho relativo)
      const response = await api().get(
        "/auth/products",
      );
      return response.data ?? null;
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return new ApiError(404, "Produtos não encontrados");
      }
    }
    return new ApiError(500, "Erro no servidor")
  },
};
