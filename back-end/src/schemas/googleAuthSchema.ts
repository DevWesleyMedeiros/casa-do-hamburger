// schema para POST /auth/google — segue o mesmo padrão de authSchemas.ts
// e passwordReset.schema.ts (validateBody roda isso antes do controller)
import { z } from 'zod'

export const googleAuthSchema = z.object({
  // O Firebase ID Token é um JWT — eu não valido a estrutura aqui (isso é responsabilidade do firebase-admin em verifyFirebaseIdToken). Eu só garanto aqui que veio uma string não vazia. Validar "parece um JWT"
  idToken: z.string().nonempty().min(1, 'Token do Google é obrigatório').trim(),
})
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>
