import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const passwordPolicy = z
  .string()
  .min(9, "Mínimo 9 caracteres")
  .regex(/\d+/, "A senha deve conter ao menos um número") // era /d+/
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "A senha deve conter ao menos um caractere especial",
  )
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula");

// Schema do FORMULÁRIO (o que o usuário digita na tela).
// Sem "token" — ele vem da URL, não de um input.
export const resetPasswordFormSchema = z
  .object({
    newPassword: passwordPolicy,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  });

// Schema do PAYLOAD enviado à API.
export const resetPasswordSchema = z.object({
  token: z.string().min(32, "Link inválido ou expirado"),
  newPassword: passwordPolicy,
});

export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
