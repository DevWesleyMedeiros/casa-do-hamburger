import { Router } from 'express'
import { orderController } from '../controllers/order.controller.js'
import { requireAuth } from '../middlewares/authMiddlewares.js'
import { requiredAdmin } from '../middlewares/requiredAdmin.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Padrão REST: todas as rotas de pedidos seguem o namespace /orders
// Cria um novo pedido
router.post('/orders', requireAuth, asyncHandler(orderController.createOrder))

// Lista pedidos (comum: só as próprias; admin: todas, com ?status= opcional)
router.get('/orders', requireAuth, asyncHandler(orderController.listOrders))

// Busca um pedido específico por ID
router.get('/orders/:id', requireAuth, asyncHandler(orderController.getOrderById))

// Atualiza o status de um pedido — admin-only (RF-35/38)
router.patch(
  '/orders/:id/status',
  requireAuth,
  requiredAdmin,
  asyncHandler(orderController.updateOrderStatus),
)

// Cancela um pedido
router.post('/orders/:id/cancel', requireAuth, asyncHandler(orderController.cancelOrder))

export default router
