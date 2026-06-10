// arquivo de configuração que trata da variável de ambiente com a chave token

export const getJwtSecret = (): Uint8Array => {
  const jwtSecretEnv = process.env['JWT_SECRET']
  if (!jwtSecretEnv) {
    throw new Error('Variável de ambiente JWT_SECRET ainda não foi configurada')
  }
  return new TextEncoder().encode(jwtSecretEnv)
}
