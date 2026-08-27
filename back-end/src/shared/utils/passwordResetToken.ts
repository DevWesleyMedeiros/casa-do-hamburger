import { createHash, randomBytes } from 'node:crypto'

// Token de redefinição de senha é opaco (token não revela dados internos, como IDs de usuários ou datas de validade) gerado com crypto.randomBytes(32) (256 bits de entropia, ou seja, identificador aleatório sem significado legível, protegido por 256 bits de aleatoriedade pura); apenas seu hash SHA-256 é persistido no banco — o valor em texto puro nunca é armazenado, só existe no e-mail enviado uma única vez
const RESET_TOKEN_BYTES = 32
// RN-AUTH-13: 32 bytes = 256 bits de entropia, padrão para tokens de sessão/reset

export const RESET_TOKEN_TTL_MINUTES = 30
// RN-AUTH-14: janela curta reduz a superfície de ataque se o e-mail vazar Token de redefinição expira em 30 minutos e é de uso único (usedAt marcado no momento do consumo); expirado ou já usado, o token é rejeitado e uma nova solicitação é obrigatória. Emitir um novo token invalida qualquer token anterior ainda válido do mesmo usuário

/**
 * Gera o par (token cru, hash). O token cru só existe em memória durante
 * esta requisição — vai para o e-mail e nunca é persistido. O hash é o
 * único valor salvo no banco (RN-AUTH-13).
 */
export function generateResetToken(): { rawToken: string; tokenHash: string } {
  // gerar valores aleatórios hexealos
  const rawToken = randomBytes(RESET_TOKEN_BYTES).toString('hex')

  // criar o hash com algorítmo sha256 e atualizar com o valores 32 Bytes gerados e convertido hex
  // const tokenHash = createHash('sha256') // Usa o algoritmo SHA-256
  //   .update(rawToken) // Adiciona o token bruto para ser processado
  //   .digest('hex') // Retorna o resultado final em formato hexadecimal
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  return { rawToken, tokenHash }
}
// função que irá resetar um novo token
export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

// resetar token ao expirar o prazo de validade de 30 minutos
export function resetTokenExpiresAt(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000) // tempo em milesegundos
}
