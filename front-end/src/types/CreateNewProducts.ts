// src/shared/types/Product.ts
export interface CreateProductInput {
  name: string;
  description: string;
  category: string;
  price: string; // ainda cru, ex: "10,90" — a conversão pra centavos é no backend ficando 1090
  image: File;
}

export interface ProductResponseDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string | null;
}
