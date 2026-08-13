import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'

// Middleware de erro do Express precisa ter 4 parâmetros (err, req, res, next) — é assim que o Express o reconhece como um manipulador de erros global, e não como um middleware de rota comum. Precisa ser registrado por ÚLTIMO nos app.use() em app.ts.
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Se headers já foram enviados (ex: streaming), delegar para o próximo error handler
  if (res.headersSent) {
    return _next(err)
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message })
  }

  console.error(err) // trocar por logger estruturado quando RNF-19 (observabilidade) entrar

  return res.status(500).json({ message: 'Erro interno do servidor' })
}
