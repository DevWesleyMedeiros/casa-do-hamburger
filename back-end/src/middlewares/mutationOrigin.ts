import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export function mutationOrigin(allowedOrigins: readonly string[]): RequestHandler {
  return (req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (origin) {
      return allowedOrigins.includes(origin)
        ? next()
        : next(new AppError(403, 'Origem não permitida'));
    }
    // Browsers podem omitir Origin em alguns contextos; não aceitamos cross-site
    // sem origem. Clientes sem contexto de navegador continuam compatíveis.
    if (req.get('sec-fetch-site') === 'cross-site')
      return next(new AppError(403, 'Origem não permitida'));
    const referer = req.get('referer');
    if (referer) {
      try {
        if (allowedOrigins.includes(new URL(referer).origin)) return next();
      } catch {
        /* Referer inválido é rejeitado abaixo. */
      }
      return next(new AppError(403, 'Origem não permitida'));
    }
    // Um navegador que informa Fetch Metadata deve comprovar a origem mutável.
    if (req.get('sec-fetch-site')) return next(new AppError(403, 'Origem obrigatória'));
    return next();
  };
}
