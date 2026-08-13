import { cartRepository } from '../repositories/cart.repository.js'

export const cartService = {
  findProductInCartItem: async (userId: string) => {
    const productsFound = await cartRepository.findCartItemProduct(userId)
    return productsFound
  },
  addToCart: async (productId: string, userId: string) => {
    const cartItems = await cartRepository.createCartItem(productId, userId)
    return cartItems
  },
  deleteCartItemById: async (cartItemId: string, userId: string) => {
    const deleted = await cartRepository.deleteCartItemById(cartItemId, userId)
    return deleted
  },
  updateCartItemQuantity: async (cartItemId: string, userId: string, quantity: number) => {
    const updated = await cartRepository.updateCartItemQuantity(cartItemId, userId, quantity)
    return updated
  },
}
