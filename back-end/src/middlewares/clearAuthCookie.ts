import type { Request, Response, NextFunction } from 'express'
import * as jose from 'jose'
import { getJwtSecret } from '../config/jwt'

export const clearAuthCookie = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const token = req.cookies?.user_section

  // Se o cookie existe, limpa ele preventivamente
  if (token) {
    res.clearCookie('user_section', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
    })
  }

  // Tenta decodificar para garantir que o usuário saiba que foi desconectado com sucesso
  try {
    if (token) {
      await jose.jwtVerify(token, getJwtSecret())
    }
    next()
  } catch (error) {
    // Se o token era inválido ou expirado, o cookie já foi limpo acima. Segue em frente.
    next()
  }
}
