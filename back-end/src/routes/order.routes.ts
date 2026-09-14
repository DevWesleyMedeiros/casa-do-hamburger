import { Router } from 'express'
import { requireAuth } from '../middlewares/authMiddlewares.js'
import { requiredAdmin } from '../middlewares/requiredAdmin.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { orderController } from '../controllers/order.controller.js'

const router = Router()

// rota que cria uma ordem
router.post('/', requireAuth, asyncHandler(orderController.createOrder))
// rota que lista todas as ordens seja elas minha ou não
router.get('/', requiredAdmin, asyncHandler(orderController.listOrders))
// rota que lista uma ordem por id
router.get('/:id', requireAuth, asyncHandler(orderController.getOrderById))
// rota que atualiza o status de uma ordem
router.patch('/:id', requireAuth, asyncHandler(orderController.updateOrderStatus))
// rota que atualiza o status de uma ordem por admin
router.patch(
  '/:id/status',
  requireAuth,
  requiredAdmin,
  asyncHandler(orderController.updateOrderStatus),
)
// rota que cancela uma ordem
router.post('/:id/cancel', requireAuth, asyncHandler(orderController.cancelOrder))

export default router
