// consumir api de pelo ending point produtos aqui

import { type ProductsInterface } from "../../../../types/Products";
import { api } from "../ApiConfig";

export const getProductsDate = {
  getProducts: async (): Promise<ProductsInterface[] | null> => {
    try {
      const response = await api().get(
        `${import.meta.env.VITE_API_URL}/products`,
      );
      return response.data ?? null;
    } catch {
      return null;
    }
  },
};
