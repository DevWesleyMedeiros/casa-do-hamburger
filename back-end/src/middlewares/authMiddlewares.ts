/**
 * Middleware de autenticação (guarda de rota).
 *
 * Responsabilidades:
 * - Lê o cookie httpOnly `user_section`, verifica a assinatura do JWT
 *   (jose.jwtVerify) e consulta a conta ativa no banco. Preenche req.user
 *   com id e privilégio atual, sem confiar no admin histórico do token.
 * - Bloqueia a request com 401 se o cookie não existir, o token estiver
 *   expirado, ou a assinatura/formato for inválido — nunca deixa a request
 *   seguir sem resposta em nenhum desses casos.
 *
 * Importante: req.user aqui é só o payload de SESSÃO (id + admin), não o
 * perfil completo do usuário. Se uma rota downstream precisar de nome/email,
 * ela deve buscar o User completo no banco via userRepository.findById(req.user.id)
 * e passar por toUserDTO — nunca tentar ler name/email direto de req.user
 * (ver auth.controller.ts → userAuth para o exemplo desse padrão).
 */
import type { NextFunction, Request, Response } from 'express';
import * as jose from 'jose';
import { getJwtSecret } from '../config/jwt.js';
import { AppError } from '../errors/AppError.js';
import { userRepository } from '../repositories/user.repository.js';

/**
 * @description middleware de autenticação (guarda de rota)
 * @param req requisição
 * @param res resposta
 * @param next próxima função de middleware
 * @returns um objeto cookie user_section decodificado
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const token = req.cookies?.['user_section'];

  if (!token) {
    console.error('[requireAuth] Cookie user_section não encontrado na requisição');
    return res.status(401).json({ message: 'Usuário não autentificado' });
  }

  let userId: string;
  const secret = getJwtSecret();
  try {
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
      requiredClaims: ['exp', 'iat'],
    });
    if (typeof payload['id'] !== 'string' || !payload['id']) throw new Error('Invalid session');
    userId = payload['id'];
  } catch (error: unknown) {
    if (error instanceof jose.errors.JWTExpired) {
      const err = new AppError(401, 'Token expirado');
      return res.status(401).json({ status: err.status, message: err.message });
    }
    // Catch-all: assinatura inválida (JWSSignatureVerificationFailed), token malformado (JWSInvalid) ou qualquer outro erro de verificação.
    // Sem isso, erros fora do JWTExpired deixavam a request sem resposta.
    const err = new AppError(401, 'Token inválido');
    return res.status(401).json({ status: err.status, message: err.message });
  }
  try {
    const user = await userRepository.findSessionUser(userId);
    if (!user || user.deletedAt)
      return res.status(401).json({ message: 'Usuário não autenticado' });
    // O privilégio do JWT pode estar desatualizado; a fonte atual é o banco.
    req.user = { id: user.id, admin: user.admin };
    next();
  } catch (error) {
    next(error);
  }
};
