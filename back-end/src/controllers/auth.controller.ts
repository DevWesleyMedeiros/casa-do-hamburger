import type { Request, Response } from 'express'
import { authService } from '../services/auth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ message: 'Email e Senha são obrigatórios' })
      return
    }
    const { token, user } = await authService.login(email, password)
    res.cookie('user_section', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.status(200).json({ user })
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, cep } = req.body
    const user = await authService.register(name, email, password, cep)
    res.status(201).json(user)
  }),

  userAuth: async (req: Request, res: Response) => {
    const user = req.user
    res.status(200).json({ user })
  },
  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('user_section')
    res.status(200).json({ message: 'Logout realizado com sucesso' })
  }),
}
