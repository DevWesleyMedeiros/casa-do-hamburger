// src/express.d.ts

// Arquivo de declaração de tipos globais (declaration file — .d.ts)
// Lido pelo compilador TypeScript, não pelo Express em runtime
// Serve para estender, declarar ou criar tipos sem gerar código JavaScript
// Aqui acessamos o namespace do Express para adicionar campos ao tipo Request

import type { JWTPayload } from 'jose'

declare global {
  namespace Express {
    interface Request {
      user?: jose.JWTPayload
    }
  }
}
