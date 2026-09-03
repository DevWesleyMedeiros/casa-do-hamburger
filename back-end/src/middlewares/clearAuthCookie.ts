import type { NextFunction, Request, Response } from 'express'
// funçõa requiredAuth vai verficar se existem os cookies e este middleware clearAuthCookie vai ser o responsável pelo retorno res do cookies limpos

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
    // deploy no railway e no vercel não funcionará com sameSite: lax e security no valor de produção
    // secure: true,
    // sameSite: 'none', // permite o envio do cookie em qualquer requisição entre sites diferentes (inclusive em requisições em segundo plano como fetch ou iframe
    // Comportamento: O navegador envia o cookie em solicitações cruzadas (cross-site) sem restrições de origem.
    // Exigência obrigatória: Precisa obrigatoriamente estar acompanhado do atributo Secure (exigindo conexão HTTPS), caso contrário será rejeitado pelos navegadores.
  })
  // passa para o controller
  next()
}
