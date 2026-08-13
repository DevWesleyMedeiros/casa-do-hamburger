import { prisma } from '../db.js'
import { handlePrismaError } from '../utils/handlePrismaError.js'

export const cartRepository = {
  findCartItemProduct: async (userId: string) => {
    try {
      return await prisma.cartItem.findMany({
        where: { userId },
        include: { product: { include: { images: true } } },
      })
    } catch (error) {
      return handlePrismaError(error)
    }
  },

  createCartItem: async (productId: string, userId: string) => {
    try {
      return await prisma.cartItem.upsert({
        where: {
          userId_productId: { userId, productId },
        },
        update: {
          quantity: { increment: 1 },
        },

        create: {
          product: { connect: { id: productId } },
          user: { connect: { id: userId } },
        },
        include: { product: { include: { images: true } } },
      })
    } catch (error) {
      return handlePrismaError(error)
    }
  },
  deleteCartItemById: async (cartItemId: string, userId: string) => {
    try {
      return await prisma.cartItem.delete({
        where: { id: cartItemId, userId },
      })
    } catch (error) {
      return handlePrismaError(error)
    }
  },
  updateCartItemQuantity: async (cartItemId: string, userId: string, quantity: number) => {
    try {
      return await prisma.cartItem.update({
        where: { id: cartItemId, userId },
        data: { quantity },
        include: { product: { include: { images: true } } },
      })
    } catch (error) {
      return handlePrismaError(error)
    }
  },
}
