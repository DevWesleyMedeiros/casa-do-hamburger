import { z } from "zod";

export const googleAuthTokenSchema = z.object({
  // O Firebase ID Token do usuário do Google
  idToken: z.string().nonempty().min(1, "Token do Google é obrigatório").trim(),
});
export type GoogleAuthRequest = z.infer<typeof googleAuthTokenSchema>;
