import { Router } from 'express'
import { cartController } from '../controllers/cart.controller.js'
import { requireAuth } from '../middlewares/authMiddlewares.js'
import { validateBody } from '../middlewares/validateBody.js'
import { cartItemSchema, createCartItemSchema } from '../schemas/cartItemSchema.js'

const router = Router()
router.use(requireAuth) // toda rota de carrinho exige usuário autenticado

router.delete('/cart-item/:cartItemId', cartController.deleteCartItemById)
router.get('/get-cart-items', cartController.productFindInCartItem)
router.post('/create-cart-item', validateBody(createCartItemSchema), cartController.createCartItem)
router.patch(
  '/cart-item/:cartItemId',
  validateBody(cartItemSchema),
  cartController.updateCartItemQuantity,
)

export default router
