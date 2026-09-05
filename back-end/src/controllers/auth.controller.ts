/**
 * Controller HTTP de autenticação — única camada que conhece Request/Response.
 *
 * Responsabilidades:
 * - login: delega a validação de credenciais ao authService, seta o JWT
 *   (só dado de sessão) no cookie httpOnly, e responde com o PERFIL do
 *   usuário (toUserDTO) — nunca o token nem o User completo do Prisma.
 *
 * - register: cria o usuário via authService e responde com o perfil
 *   (toUserDTO) — nunca o User cru, que ainda carrega o hash da senha.
 * - userAuth (rota /me): NÃO confia em req.user para montar a resposta —
 *   req.user é só o payload de sessão (id + admin) decodificado do token
 *   pelo requireAuth. Busca o User completo no banco (userRepository.findById)
 *   e só então aplica toUserDTO. É assim que perfil (nome/email) fica sempre
 *   atualizado, mesmo que o usuário edite o perfil sem precisar logar de novo.
 * - logout: limpa o cookie de sessão, sem tocar em banco.
 */

import type { Request, Response } from 'express'
import { toUserDTO } from '../dtos/user.dto.js'
import { userRepository } from '../repositories/user.repository.js'
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
    // na response, eu seto o cookie de sessão com o token
    // user_section é o nome da sessão e token vem do authService
    const isProduction = process.env['NODE_ENV'] === 'production'
    res.cookie('user_section', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })
    res.status(200).json({ user: toUserDTO(user) })
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, cep } = req.body
    const user = await authService.register(name, email, password, cep)
    res.status(201).json({ user: toUserDTO(user) })
  }),

  // quando acesso a rota "/me" o payload jwt separado do perfil
  userAuth: asyncHandler(async (req: Request, res: Response) => {
    const jwtPayload = req.user as { id: string; admin: boolean } // vem do token: só { id, admin }

    if (!jwtPayload || typeof jwtPayload !== 'object' || !('id' in jwtPayload)) {
      res.status(401).json({ message: 'Usuário não autenticado' })
      return
    }
    const user = await userRepository.findById(String(jwtPayload['id']))
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' })
      return
    }
    res.status(200).json({ user: toUserDTO(user) })
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('user_section')
    res.status(200).json({ message: 'Logout realizado com sucesso' })
  }),
}
