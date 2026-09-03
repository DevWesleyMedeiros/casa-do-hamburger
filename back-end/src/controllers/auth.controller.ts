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
    res.cookie('user_section', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      // secure: true, A propriedade Secure de um cookie é responsável por garantir que o cookie seja transmitido apenas através de conexões criptografadas (HTTPS). Mantê-la desativada até colocarmos o projeto em produção, já que não funcionaria em localhost
      sameSite: 'lax', // sameSite aqui, com valor lax, define que o cookie só será enviado em solicitações de primeira partidade (não em solicitações de rede interna), ou seja, apenas quando o usuário estiver na mesma origem do site. É o padrão moderno dos navegadores quando o atributo não é declarado. O cookie é restrito, mas é enviado em navegações de nível superior (top-level navigation) que utilizam métodos seguros — por exemplo, quando o usuário clica em um link que direciona para o outro site usando o método GET
      // sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
