import type { NextFunction, Request, Response } from 'express'
import { toProductDTO } from '../dtos/product.dto.js'
import { productService } from '../services/products.service.js'

export const productsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body, req.file)
      return res.status(201).json(toProductDTO(product))
    } catch (error) {
      return next(error) // AppError / handlePrismaError cuidam do restante
    }
  },
}
