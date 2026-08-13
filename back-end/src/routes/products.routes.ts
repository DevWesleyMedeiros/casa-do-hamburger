import { Router } from 'express'
import { productsController } from '../controllers/products.controller.js'
import { requireAuth } from '../middlewares/authMiddlewares.js'
import { requiredAdmin } from '../middlewares/requiredAdmin.js'
import { uploadProductImage, validateImageMagicBytes } from '../middlewares/upload.js'
import { validateBody } from '../middlewares/validateBody.js'
import { createProductsSchema } from '../schemas/products.schemas.js'

const router = Router()

router.get('/products', productsController.getProducts)
router.post(
  '/products',
  requireAuth,
  requiredAdmin,
  uploadProductImage,
  validateImageMagicBytes,
  validateBody(createProductsSchema),
  productsController.create,
)
router.delete('/products/:id', requireAuth, requiredAdmin, productsController.deleteProduct)

export default router
