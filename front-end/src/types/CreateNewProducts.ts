// src/shared/types/Product.ts
export interface CreateProductInput {
  name: string;
  description: string;
  category: string;
  price: number; // inteiro em centavos
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
