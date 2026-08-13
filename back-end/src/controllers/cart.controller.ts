// back-end/src/controllers/cart.controller.ts
import type { Request, Response } from 'express'
import { toCartItemDTO } from '../dtos/cartItem.dto.js'
import { AppError } from '../errors/AppError.js'
import { cartService } from '../services/cart.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const cartController = {
  createCartItem: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user?.id as string
    const { productId } = req.body
    if (!productId) {
      throw new AppError(400, 'produto é obrigatório')
    }
    const cartItem = await cartService.addToCart(productId, user)
    if (cartItem === null) {
      throw new AppError(404, 'Produto não encontrado')
    }
    return res.status(200).json(toCartItemDTO(cartItem))
  }),

  updateCartItemQuantity: asyncHandler(async (req: Request, res: Response) => {
    const { cartItemId } = req.params
    const userId = req.user?.id as string
    const { quantity } = req.body

    if (!cartItemId || Array.isArray(cartItemId)) {
      throw new AppError(400, 'ID inválido')
    }
    const updated = await cartService.updateCartItemQuantity(cartItemId, userId, quantity)
    return res.status(200).json(toCartItemDTO(updated))
  }),

  productFindInCartItem: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user?.id as string
    if (!user) {
      throw new AppError(404, 'Usuário não encontrado')
    }
    const cartItems = await cartService.findProductInCartItem(user)
    return res.status(200).json(cartItems.map(toCartItemDTO))
  }),

  deleteCartItemById: asyncHandler(async (req: Request, res: Response) => {
    const { cartItemId } = req.params
    const userId = req.user?.id as string
    if (!cartItemId || Array.isArray(cartItemId)) {
      throw new AppError(400, 'ID inválido')
    }

    await cartService.deleteCartItemById(cartItemId, userId)

    return res.status(200).json({ message: 'Item do carrinho deletado com sucesso' })
  }),
}
