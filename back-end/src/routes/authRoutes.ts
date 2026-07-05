import { Router } from 'express'
import { authController } from '../controllers/authControllers'
import { requireAuth } from '../middlewares/authMiddlewares'
import { clearAuthCookie } from '../middlewares/clearAuthCookie'
import { requiredAdmin } from '../middlewares/requiredAdmin'
import { validateBody } from '../middlewares/validateBody'
import { loginSchema, registerSchema } from '../schemas/authSchemas'
import { cartItemSchema } from '../schemas/cartItemSchema'

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

export default router
