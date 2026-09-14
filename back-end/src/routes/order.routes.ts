import { Router } from 'express'
import { orderController } from '../controllers/order.controller.js'
import { requireAuth } from '../middlewares/authMiddlewares.js'
import { requiredAdmin } from '../middlewares/requiredAdmin.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// rota que cria uma ordem
router.post('/create-order', requireAuth, asyncHandler(orderController.createOrder))
// rota que lista todas as ordens seja elas minha ou não
router.get('/list-order', requireAuth, asyncHandler(orderController.listOrders))
// rota que lista uma ordem por id
router.get('/get-order/:id', requireAuth, asyncHandler(orderController.getOrderById))
// rota que atualiza o status de uma ordem
router.patch('/update-order/:id', requireAuth, asyncHandler(orderController.updateOrderStatus))
// rota que atualiza o status de uma ordem por admin
router.patch(
  '/update-order/:id/status',
  requireAuth,
  requiredAdmin,
  asyncHandler(orderController.updateOrderStatus),
)
// rota que cancela uma ordem
router.post('/cancel-order/:id/cancel', requireAuth, asyncHandler(orderController.cancelOrder))

export default router
