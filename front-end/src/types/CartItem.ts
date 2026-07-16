// tipos somente para CartItem

import { type ProductsInterface } from "./Products";

// Type no lugar de interface para permitir o uso do "&"" e do "Pick"
export type CartItemType = {
  id: string;
  // id do cartItem
  userId: string; // id do usuário (referenciado por chave estrangeira)
  productId: string; // id do produto (referenciado por chave estrangeira)
  product: Pick<ProductsInterface, "name" | "price" | "images">;
  // criamos o objeto "product" aninhado! que puxa as propriedades do produto cadastrado pelo user
  quantity: number;
};
