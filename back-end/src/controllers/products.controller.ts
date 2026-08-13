// back-end/src/controllers/products.controller.ts
import type { Request, Response } from 'express'
import { toProductDTO } from '../dtos/product.dto.js'
import { productService } from '../services/products.service.js'
import { AppError } from '../errors/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const productsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body, req.file)
    return res.status(201).json(toProductDTO(product))
  }),

  getProducts: asyncHandler(async (_req: Request, res: Response) => {
    const products = await productService.products()
    res.status(200).json(products.map(toProductDTO))
  }),

  deleteProduct: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id || Array.isArray(id)) {
      throw new AppError(400, 'ID do produto inválido')
    }

    await productService.deleteById(id)
    return res.status(200).json({ message: 'Produto deletado com sucesso' })
  }),
}
