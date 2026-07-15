import { Router } from 'express'
import { authController } from '../controllers/authControllers.js'
import { productsController } from '../controllers/products.controller.js'
import { requireAuth } from '../middlewares/authMiddlewares.js'
import { clearAuthCookie } from '../middlewares/clearAuthCookie.js'
import { requiredAdmin } from '../middlewares/requiredAdmin.js'
import { validateBody } from '../middlewares/validateBody.js'
import { loginSchema, registerSchema } from '../schemas/authSchemas.js'
import { createProductsSchema } from '../schemas/products.schemas.js'
import { cartItemSchema } from '../schemas/cartItemSchema.js'
import { uploadProductImage, validateImageMagicBytes } from '../middlewares/upload.js'

const router = Router()

router.post('/login', validateBody(loginSchema), authController.login)
router.post('/register', validateBody(registerSchema), authController.register)
router.get('/me', requireAuth, authController.userAuth)
router.post('/logout', requireAuth, clearAuthCookie, authController.logout)
router.get('/products', authController.getProducts)
router.delete('/products/:id', requireAuth, requiredAdmin, authController.deleteProduct)
router.delete('/cart-item/:cartItemId', requireAuth, authController.deleteCartItemById)
router.get('/get-cart-items', requireAuth, authController.productFindInCartItem)
router.post('/create-cart-item', requireAuth, authController.createCartItem)
router.patch(
  '/cart-item/:cartItemId',
  requireAuth,
  validateBody(cartItemSchema),
  authController.updateCartItemQuantity,
)
router.post(
  '/products',
  requireAuth,
  requiredAdmin,
  uploadProductImage,
  validateImageMagicBytes,
  validateBody(createProductsSchema),
  productsController.create,
)

export default router
