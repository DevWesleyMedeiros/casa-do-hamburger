// src/dto/cartItem.dto.ts
import { CartItem, Products, ProductsImage } from '../../generated/prisma/index.js'
import { toProductDTO } from './product.dto.js'

type CartItemWithProduct = CartItem & {
  product: Products & { images: ProductsImage[] }
}

export function toCartItemDTO(cartItem: CartItemWithProduct) {
  return {
    id: cartItem.id,
    productId: cartItem.productId,
    quantity: cartItem.quantity,
    product: toProductDTO(cartItem.product),
  }
}
