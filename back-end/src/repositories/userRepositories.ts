import { prisma } from '../db.js'
import { handlePrismaError } from '../utils/handlePrismaError.js'

export const userRepository = {
  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email: email },
    })
  },

  create: async (data: { name: string; email: string; password: string; cep: string }) => {
    return await prisma.user.create({ data })
  },

  findManyProducts: async () => {
    return await prisma.products.findMany({ include: { images: true } })
  },
  findProductAndDelete: async (id: string) => {
    try {
      return await prisma.products.delete({
        where: { id: id },
      })
    } catch (error) {
      return handlePrismaError(error)
    }
  },

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
