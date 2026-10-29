// arquivo de configuração que trata da variável de ambiente com a chave token

export const getJwtSecret = (): Uint8Array => {
  const jwtSecretEnv = process.env['JWT_SECRET'];
  if (!jwtSecretEnv || new TextEncoder().encode(jwtSecretEnv).length < 32) {
    throw new Error('JWT_SECRET deve conter ao menos 32 bytes');
  }
  return new TextEncoder().encode(jwtSecretEnv); // valor do tipo Unit8Array, ou seja, 8 bit separados por pontos
};
