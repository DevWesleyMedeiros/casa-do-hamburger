import type { NextFunction, Request, Response } from 'express'
import * as jose from 'jose'
import { getJwtSecret } from '../config/jwt.js'
import { AppError } from '../errors/AppError.js'

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const token = req.cookies?.user_section

  if (!token) {
    return res.status(401).json({ message: 'Usuário não autentificado' })
  }

  try {
    const { payload } = await jose.jwtVerify(token, getJwtSecret())

    req['user'] = {
      id: payload['id'],
      name: payload['name'],
      email: payload['email'],
      cep: payload['cep'],
      admin: payload['admin'],
    }

    next()
    return
  } catch (error: unknown) {
    if (error instanceof jose.errors.JWTExpired) {
      const errors = new AppError(401, 'Token expirado')
      return res.status(401).json({ status: errors.status, message: errors.message })
    }
    if (error instanceof jose.errors.JWEInvalid) {
      const errors = new AppError(401, 'Token inválido')
      return res.status(401).json({ status: errors.status, message: errors.message })
    }
  }
}
