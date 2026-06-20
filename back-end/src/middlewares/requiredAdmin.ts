// meu usuário admin poderá executar ações com os produtos que outros usuário não poderão executar. Logo, esse middleware aqui será responsável por essa verificação
// quando for para cadastrar produtos com admin
// Error status 403 Forbidden: O cliente não tem direitos de acesso ao conteúdo; ou seja, não é autorizado, portanto o servidor está se recusando a fornecer o recurso solicitado. Ao contrário do 401 Unauthorized, a identidade do cliente é conhecida pelo servidor.

import type { NextFunction, Request, Response } from 'express'

export const requiredAdmin = (req: Request, res: Response, next: NextFunction): Response | void => {
  const user = req['user'] as { admin: boolean } | undefined // preciso só da propriedade admin do meu user

  // eu posso ter a permissão ou não (undefined)
  if (!user?.admin) {
    return res.status(403).json({ message: 'Acesso restrito aos administradores' })
  }
  next()
}
