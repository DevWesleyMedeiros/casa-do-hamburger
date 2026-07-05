import type { NextFunction, Request, Response } from 'express'
import * as jose from 'jose'
import { getJwtSecret } from '../config/jwt'
import { AppError } from '../errors/AppError'

// função que requiredAuth que será usada como middleware para o decodificar token do usuário
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  // lê o cookie — só existe graças ao cookie-parser no index.ts
  const token = req.cookies?.user_section // vem do parser

  if (!token) {
    return res.status(401).json({ message: 'Usuário não autentificado' })
  }

  // verifica e decodifica o token jwt, passando minha Unit8Array como chave
  try {
    const { payload } = await jose.jwtVerify(token, getJwtSecret())
    // payload = token decodificado contendo todas as propriedades do usuário logado
    // regra que decodifica o token vindo do cookie do frontend com o payload abaixo (GET)
    // 4. injeta os dados do usuário na requisição para o controller usar
    // req['user'] = user - nome da propriedade crida da interface (um objeto) de tipos do Request
    // populando o user com as propriedades de user
    req['user'] = {
      id: payload['id'],
      name: payload['name'],
      email: payload['email'],
      cep: payload['cep'],
      admin: payload['admin'],
    }

    next() // libera o req['user'] para o controller
    return
  } catch (error: unknown) {
    // jose lança automaticamente se expirado ou adulterado. Jose.errors.JOSEError é a classe base de todos os erros do jose — funciona como um catch-all para qualquer problema de verificação JWT sem precisar listar cada subclasse individualmente.
    if (error instanceof jose.errors.JWTExpired) {
      const errors = new AppError(401, 'Token expirado')
      return res.status(401).json({ status: errors.status, message: errors.message })
    }
    if (error instanceof jose.errors.JWEInvalid) {
      const errors = new AppError(401, 'Token inválido')
      return res.status(401).json({ status: errors.status, message: errors.message })
    }
    // mais erros do token aqui personalizado com a classe AppError ou Jose.errors.JOSEError
  }
}
