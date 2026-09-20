import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { InvalidOrderTransitionError } from '../services/orderServices/orderStateMachine.service.js';

// Middleware de erro do Express precisa ter 4 parâmetros (err, req, res, next) — é assim que o Express o reconhece como um manipulador de erros global, e não como um middleware de rota comum. Precisa ser registrado por ÚLTIMO nos app.use() em app.ts.
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Se headers já foram enviados (ex: streaming), delegar para o próximo error handler
  if (res.headersSent) {
    return _next(err);
  }

  // Erro de validação (Zod .parse() falhou) — sempre usar 400, e nunca 500.
  // É o cliente mandando um dado no formato errado (query string, body, params),
  // não uma falha do servidor. err.issues traz o detalhe de qual campo falhou.
  if (err instanceof ZodError) {
    const flattened = err.flatten();
    return res.status(400).json({
      message: 'Dados inválidos na requisição',
      errors: flattened.fieldErrors,
      issues: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof InvalidOrderTransitionError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err); // alterar logger estruturado quando RNF-19 (observabilidade) entrar

  return res.status(500).json({ message: 'Erro interno do servidor' });
};
