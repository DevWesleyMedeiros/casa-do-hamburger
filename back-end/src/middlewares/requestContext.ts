import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/** Nunca usa identificador fornecido pelo cliente para correlacionar auditoria. */
export const requestContext: RequestHandler = (_req, res, next) => {
  const requestId = randomUUID();
  res.locals['requestId'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
