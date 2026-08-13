import type { NextFunction, Request, RequestHandler, Response } from 'express'

// Envolve um controller assíncrono e encaminha qualquer erro (rejeição de Promise) para o next(),
// Faz com que o try/catch manual repetido em cada método do controller.
// ele é especificamente um wrapper de rota Express ((req, res, next)), não faz sentido em service.

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
