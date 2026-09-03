import type { ProductImage } from "./ProductImage";

// Tipo exato correspondente ao DTO do backend (toProductDTO)
export interface ProductsInterface {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: ProductImage[];
}

export type ProductCategory = "hamburguer" | "bebidas" | "porções";
