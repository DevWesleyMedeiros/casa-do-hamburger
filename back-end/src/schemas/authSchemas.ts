// segue o mesmo schema do frontend para este backend
import { z } from 'zod'

// schema para register
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .trim(),

  email: z.string().min(1, 'Email é obrigatório').email('Formato de email inválido').trim(),

  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/d/, 'Deve conter pelo menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial'),

  // confirm password é um validate de UX e não backend
  cep: z
    .string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido — formato: 00000-000'),
})

// schema para login
export const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de email inválido').trim(),
  password: z.string().min(1, 'Senha é obrigatória').trim(),
  // aqui não colocamos regra de força de senha, pois já temos ela ao registrar
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
