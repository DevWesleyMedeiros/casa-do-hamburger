import { prisma } from '../db.js'
import { CreateProductInput } from '../schemas/products.schemas.js'
import { handlePrismaError } from '../utils/handlePrismaError.js'

interface CreateProductWithImageParams {
  data: CreateProductInput
  image: {
    url: string
    key: string
    mimeType: string
    size: number
  }
}

export const productsRepository = {
  async createWithImage({ data, image }: CreateProductWithImageParams) {
    return await prisma.products.create({
      data: {
        ...data,
        images: { create: image },
      },
      include: { images: true },
    })
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
}
