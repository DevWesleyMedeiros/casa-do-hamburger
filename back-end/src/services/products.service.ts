import { productsRepository } from '../repositories/products.repositories.js'
import { uploadImageToCloudinary } from './uploads/cloudinaryServices.js'
import { AppError } from '../errors/AppError.js'
import { CreateProductInput } from '../schemas/products.schemas.js'

export const productService = {
  async createProduct(data: CreateProductInput, file?: Express.Multer.File) {
    if (!file) throw new AppError(400, 'Imagem do produto obrigatório')
    const image = await uploadImageToCloudinary(file)
    return productsRepository.createWithImage({ data, image })
  },
}
