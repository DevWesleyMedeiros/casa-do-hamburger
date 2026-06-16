// consumir api de pelo ending point produtos aqui

import { type ProductsInterface } from "../../../../types/Products";
import { Api } from "../ApiConfig";

export const getProductsDate = {
  getProducts: async (): Promise<ProductsInterface[] | null> => {
    try {
      const response = await Api().get("/auth/products");
      return response.data ?? null;
    } catch {
      return null;
    }
  },
};
