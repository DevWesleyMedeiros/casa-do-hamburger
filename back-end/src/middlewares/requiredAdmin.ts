import type { NextFunction, Request, Response } from 'express'

export const requiredAdmin = (req: Request, res: Response, next: NextFunction): Response | void => {
  const user = req.user as { admin: boolean } | undefined // preciso só da propriedade admin do meu user

  // eu posso ter a permissão ou não (undefined)
  if (!user?.admin) {
    return res.status(403).json({ message: 'Acesso restrito aos administradores' })
    // return aqui impede de eu passar se caso não exista a permissão
  }
  next()
}
