// camada responsável por lidar com as requisições relacionadas à autenticação (login e registro)
// 👨‍🍳 CONTROLLER — ponte entre HTTP e o Service
// Só lida com req, res e repassa para o Service
// vai receber do front, processar e retornar, mas não cria a lógica das regras de negócio. As regras de negócio são importada aqui no authService

import type { Request, Response } from 'express'
import { authService } from '../services/authService'

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({ message: 'Email e Senha são obrigatórios' })
        return
      }

      const user = await authService.login(email, password)
      res.status(200).json(user)
    } catch (err: any) {
      const status = err?.status ?? 500
      const message = err?.message ?? 'Erro no servidor'
      res.status(status).json({ message })
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password, cep } = req.body

      if (!name || !email || !password || !cep) {
        res.status(400).json({ message: 'Todas as informações são obrigatórias' })
        return
      }

      const user = await authService.register(name, email, password, cep)
      res.status(201).json(user)
    } catch (err: any) {
      const status = err?.status ?? 500
      const message = err?.message ?? 'Erro no servidor'
      res.status(status).json({ message })
    }
  },
}
