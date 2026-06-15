import type { Request, Response, NextFunction } from 'express'
// funçõa requiredAuth vai verficar se existem os cookies e este middleware clearAuthCookie vai ser o responsál pelo retorno res do cookies limpos

export const clearAuthCookie = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  // só limpa o cookie e passa para o controller de logout
  // a verificação de autenticidade já foi feita pelo requireAuth antes desse middleware
  res.clearCookie('user_section', {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
  })
  // passa para o controller
  next()
}
