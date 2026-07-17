import type { Request, Response } from 'express'
import type { AppError } from '../errors/AppError.js'
import { authService } from '../services/authService.js'
import { toProductDTO } from '../dtos/product.dto.js'
import { toCartItemDTO } from '../dtos/cartItem.dto.js'

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({ message: 'Email e Senha são obrigatórios' })
        return
      }
      const { token, user } = await authService.login(email, password)
      res.cookie('user_section', token, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      res.status(200).json({ user })
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as AppError
        const status = err?.status ?? 500
        const message = err?.message ?? 'Erro no servidor'
        res.status(status).json({ message })
      }
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password, cep } = req.body
      const user = await authService.register(name, email, password, cep)
      res.status(201).json(user)
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as AppError
        const status = err?.status ?? 500
        const message = err?.message ?? 'Erro no servidor'
        res.status(status).json({ message, status })
      }
    }
  },
  userAuth: async (req: Request, res: Response) => {
    const user = req.user
    res.status(200).json({ user })
  },
  logout: async (_req: Request, res: Response) => {
    res.clearCookie('user_section')
    res.status(200).json({ message: 'Logout realizado com sucesso' })
  },

  getProducts: async (_req: Request, res: Response) => {
    try {
      const products = await authService.products()
      res.status(200).json(products.map(toProductDTO))
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as AppError
        res.status(err?.status ?? 500).json({ message: err?.message })
      }
    }
  },
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: 'ID do produto inválido' })
      }

      await authService.deleteProduct(id)
      return res.status(200).json({ message: 'Produto deletado com sucesso' })
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as AppError
        return res.status(err?.status ?? 500).json({ message: err?.message ?? 'Erro no servidor' })
      }
    }
    return res.status(500).json({ message: 'Erro no servidor' })
  },
  productFindInCartItem: async (req: Request, res: Response) => {
    try {
      const user = req.user?.id as string
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' })
      }
      const cartItems = await authService.findProductInCartItem(user)
      return res.status(200).json(cartItems.map(toCartItemDTO))
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as AppError
        return res.status(err?.status ?? 500).json({ message: err?.message })
      }
    }
    return res.status(500).json({ message: 'Erro no servidor' })
  },
  createCartItem: async (req: Request, res: Response) => {
    try {
      const user = req.user?.id as string
      const { productId } = req.body
      if (!productId) {
        return res.status(400).json({ message: 'produto é obrigatório' })
      }
      const cartItem = await authService.addToCart(productId, user)
      if (cartItem === null) {
        return res.status(404).json({ message: 'Produto não encontrado' })
      }
      return res.status(200).json(toCartItemDTO(cartItem)) // ✅ singular, não array
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as AppError
        return res.status(err?.status ?? 500).json({ message: err?.message ?? 'Erro no servidor' })
      }
    }
    return res.status(500).json({ message: 'Erro no servidor' })
  },
  deleteCartItemById: async (req: Request, res: Response) => {
    try {
      const { cartItemId } = req.params
      const userId = req.user?.id as string
      if (!cartItemId || Array.isArray(cartItemId)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      await authService.deleteCartItemById(cartItemId, userId)

      return res.status(200).json({ message: 'Item do carrinho deletado com sucesso' })
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as AppError
        return res.status(err?.status ?? 500).json({ message: err?.message ?? 'Erro no servidor' })
      }
    }
    return res.status(500).json({ message: 'Erro no servidor' })
  },
  updateCartItemQuantity: async (req: Request, res: Response) => {
    try {
      const { cartItemId } = req.params
      const userId = req.user?.id as string
      const { quantity } = req.body

      if (!cartItemId || Array.isArray(cartItemId)) {
        return res.status(400).json({ message: 'ID inválido' })
      }
      const updated = await authService.updateCartItemQuantity(cartItemId, userId, quantity)
      return res.status(200).json(toCartItemDTO(updated))
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as AppError
        return res.status(err?.status ?? 500).json({ message: err?.message ?? 'Erro no servidor' })
      }
    }
    return res.status(500).json({ message: 'Erro no servidor' })
  },
}
