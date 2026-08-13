import { productsRepository } from '../repositories/products.repositories.js'
import { uploadImageToCloudinary } from './uploads/cloudinary.service.js'
import { AppError } from '../errors/AppError.js'
import { CreateProductInput } from '../schemas/products.schemas.js'

export const productService = {
  async createProduct(data: CreateProductInput, file?: Express.Multer.File) {
    if (!file) throw new AppError(400, 'Imagem do produto obrigatório')
    const image = await uploadImageToCloudinary(file)
    return productsRepository.createWithImage({ data, image })
  },

  list: async () => {
    const products = await productsRepository.findManyProducts()
    if (products.length === 0) {
      throw new AppError(404, 'Nenhum produto cadastrado no sistema')
    }
    return products
  },

  deleteById: async (id: string) => {
    return productsRepository.findProductAndDelete(id)
  },
  products: async () => {
    const productsDate = await productsRepository.findManyProducts()
    if (productsDate.length === 0) {
      throw new AppError(404, 'Nenhum produto cadastrado no sistema')
    }
    return productsDate
  },
}
