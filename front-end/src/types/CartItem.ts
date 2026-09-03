// tipos somente para CartItem - correspondente ao DTO do backend (toCartItemDTO)

import { type ProductsInterface } from "./Products";

export type CartItemType = {
  id: string;
  productId: string;
  quantity: number;
  product: ProductsInterface;
};
