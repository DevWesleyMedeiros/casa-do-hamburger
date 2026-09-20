import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

// RN-CRYPT-04 — mesma política do cadastro: 9+ caracteres, 1 número, 1 caractere especial, 1 maiúscula e 1 minúscula
const passwordPolicy = z
  .string()
  .min(9, 'Mínimo 9 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minúscula')
  .regex(/\d+/, 'A senha deve conter ao menos um número')
  .regex(/[^a-zA-Z0-9]/, 'A senha deve conter ao menos um caractere especial');

export const resetPasswordSchema = z.object({
  token: z.string().min(32, 'token inválido'),
  newPassword: passwordPolicy,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
