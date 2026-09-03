/**
 * Middleware de autenticação (guarda de rota).
 *
 * Responsabilidades:
 * - Lê o cookie httpOnly `user_section`, verifica a assinatura do JWT
 *   (jose.jwtVerify) e, se válido, decodifica o payload de SESSÃO
 *   (id + admin — o mesmo shape gerado por toJwtPayloadDTO) em req.user.
 * - Bloqueia a request com 401 se o cookie não existir, o token estiver
 *   expirado, ou a assinatura/formato for inválido — nunca deixa a request
 *   seguir sem resposta em nenhum desses casos.
 *
 * Importante: req.user aqui é só o payload de SESSÃO (id + admin), não o
 * perfil completo do usuário. Se uma rota downstream precisar de nome/email,
 * ela deve buscar o User completo no banco via userRepository.findById(req.user.id)
 * e passar por toUserDTO — nunca tentar ler name/email direto de req.user
 * (ver auth.controller.ts → userAuth para o exemplo desse padrão).
 */
import type { NextFunction, Request, Response } from 'express'
import * as jose from 'jose'
import { getJwtSecret } from '../config/jwt.js'
import type { JwtPayloadDTO } from '../dtos/toJwtPayloadDTO.js'
import { AppError } from '../errors/AppError.js'

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const token = req.cookies?.['user_section']
  console.log(
    '[requireAuth] Rota acessada:',
    req.path,
    'Cookies recebidos:',
    Object.keys(req.cookies || {}),
    'Token presente:',
    !!token,
  )

  if (!token) {
    console.error('[requireAuth] Cookie user_section não encontrado na requisição')
    return res.status(401).json({ message: 'Usuário não autentificado' })
  }

  try {
    console.log('[requireAuth] Verificando assinatura do JWT...')
    const { payload } = await jose.jwtVerify(token, getJwtSecret())
    console.log(
      '[requireAuth] JWT verificado com sucesso. User ID:',
      payload['id'],
      'Admin:',
      payload['admin'],
    )

    req['user'] = {
      id: payload['id'],
      admin: payload['admin'],
    } as JwtPayloadDTO

    next()
    return
  } catch (error: unknown) {
    console.error('[requireAuth] Erro ao verificar JWT:', error)
    if (error instanceof jose.errors.JWTExpired) {
      const err = new AppError(401, 'Token expirado')
      return res.status(401).json({ status: err.status, message: err.message })
    }
    // Catch-all: assinatura inválida (JWSSignatureVerificationFailed), token malformado (JWSInvalid) ou qualquer outro erro de verificação.
    // Sem isso, erros fora do JWTExpired deixavam a request sem resposta.
    const err = new AppError(401, 'Token inválido')
    return res.status(401).json({ status: err.status, message: err.message })
  }
}
