import type { NextFunction, Request, Response } from 'express'

// Centraliza as configurações do cookie para reuso em login e logout
// Garante que os atributos sejam sempre os mesmos, evitando que clearCookie falhe
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: process.env['NODE_ENV'] === 'production' ? 'none' : 'lax',
} as const

export const clearAuthCookie = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  res.clearCookie('user_section', COOKIE_OPTIONS)
  next()
}
