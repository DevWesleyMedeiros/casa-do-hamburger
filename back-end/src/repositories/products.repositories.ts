import { prisma } from '../db.js'
import { CreateProductInput } from '../schemas/products.schemas.js'

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
}
