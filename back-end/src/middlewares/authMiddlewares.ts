import type { Request, Response, NextFunction } from 'express'
import * as jose from 'jose'
import { getJwtSecret } from '../config/jwt'

// função que requiredAuth que será usada como middleware para o decodificar token do usuário
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  
  // 1. lê o cookie — só existe graças ao cookie-parser no index.ts
  const token = req.cookies?.user_section

  if (!token) {
    return res.status(401).json({ message: 'Usuário não autentificado' })
  }

  // verifica e decodifica o jwt
  try {
    const { payload } = await jose.jwtVerify(token, getJwtSecret())

    // 4. injeta os dados do usuário na requisição para o controller usar
    // req['user'] = user - nome da propriedade crida da interface (um objeto) de tipos do Request
    req['user'] = {
      id: payload['id'],
      name: payload['name'],
      email: payload['email'],
      cep: payload['cep'],
    }

    next() // libera para o controller
    return
  } catch (error) {
    // jose lança automaticamente se expirado ou adulterado
    return res.status(401).json({ message: 'Token inválido ou expirado' })
  }
}
