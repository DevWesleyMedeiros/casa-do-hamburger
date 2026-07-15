// seta retorno personalizado para erros previsíveis do Prisma, como o P2025 (registro não encontrado), P2002 (registro já existe) e P2003 (referência inválida). Para outros erros, retorna um status 500 (erro no servidor).
// P2025 = "Record to delete does not exist" — código oficial do Prisma

import { Prisma } from '../../generated/prisma/index.js'
import { AppError } from '../errors/AppError.js'

const ERROR_PRISMA_MAP: Record<string, { status: number; message: string }> = {
  // Record<string = chave qualquer texto com código de erro do tipo PrismaClient; ex.: ["P2025"]>
  // Valor { status; message }: Obriga cada entrada a ter um número de status HTTP e uma mensagem de texto.
  P2025: { status: 404, message: 'Registro não encontrado' },
  P2002: { status: 409, message: 'Registro já existe' },
  P2003: { status: 400, message: 'Referência inválida' },
}

// começando pelo erro PrismaClient do tipo knowRequestError
export const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = ERROR_PRISMA_MAP[error.code]
    if (mapped) throw new AppError(mapped.status, mapped.message)
  }
  throw new AppError(500, 'Erro no servidor')
}
