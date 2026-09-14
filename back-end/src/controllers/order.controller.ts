import type { Request, Response } from 'express'
import { listOrdersQuerySchema, UserUpdateOrderStatusSchema } from '../schemas/order.schema.js'
import { OrderServiceItems } from '../services/orderServices/order.service.js'

// POST /orders — RF-32/33, US-05
export const orderController = {
  createOrder: async (req: Request, res: Response) => {
    const userId = req.user!['id'] as string
    // (!req.user) é chamado de Operador de Asserção de Não-Nulo (Non-null Assertion Operator) do TypeScript. Ele serve para dizer explicitamente ao compilador do TypeScript que a variável req.user não é null nem undefined naquele momento do código.
    if (!req.user) {
      res.status(401).json({ message: 'Usuário não autenticado' })
      return
    }

    const order = await OrderServiceItems.createOrder(userId)
    res.status(201).json(order)
  },
  // GET /orders — RF-36 (usuário comum) ou RF-35 (admin, com ?status=)
  listOrders: async (req: Request, res: Response) => {
    if (req.user!['admin']) {
      const { status } = listOrdersQuerySchema.parse(req.query)
      const orders = await OrderServiceItems.listAllOrders(status)
      return res.status(200).json(orders)
    }
    const orders = await OrderServiceItems.listMyorders(req.user!['id'] as string)
    return res.status(200).json(orders)
  },
  // GET /orders/:id — RN-ORDER-06 (ownership/IDOR)
  getOrderById: async (req: Request, res: Response) => {
    const orderId = req.params['id']
    if (typeof orderId !== 'string') {
      res.status(400).json({ message: 'ID do pedido inválido' })
      return
    }

    const order = await OrderServiceItems.getOrderForRequester(orderId, {
      id: req.user!['id'] as string,
      admin: req.user!['admin'] as boolean,
    })
    res.status(200).json(order)
  },
  // PATCH /orders/:id/status — RF-35/38 (admin-only, ver rota)
  updateOrderStatus: async (req: Request, res: Response) => {
    const { status } = UserUpdateOrderStatusSchema.parse(req.body)
    const orderId = req.params['id']
    if (typeof orderId !== 'string') {
      res.status(400).json({ message: 'ID do pedido inválido' })
      return
    }
    const order = await OrderServiceItems.updateStatus(orderId, status, {
      id: req.user!['id'] as string,
      admin: req.user!['id'] as boolean,
    })
    return res.status(200).json(order)
  },
  // POST /orders/:id/cancel — RF-40
  cancelOrder: async (req: Request, res: Response) => {
    const orderId = req.params['id']
    if (typeof orderId !== 'string') {
      res.status(400).json({ message: 'ID do pedido inválido' })
      return
    }
    const order = await OrderServiceItems.cancelOrder(orderId, {
      id: req.user!['id'] as string,
      admin: req.user!['admin'] as boolean,
    })
    return res.status(200).json(order)
  },
}
