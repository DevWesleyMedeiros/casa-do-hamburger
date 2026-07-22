// tipos somente para CartItem

import { type ProductsInterface } from "./Products";
import { type ProductImage } from "./ProductImage";

export type CartItemType = {
  id: string;
  userId: string;
  productId: string;
  product: Pick<ProductsInterface, "name"> &
    Pick<ProductsInterface, "price"> & {
      images: ProductImage[];
    };
  // criamos o objeto "product" aninhado! que puxa as propriedades do produto cadastrado pelo user
  quantity: number;
};
