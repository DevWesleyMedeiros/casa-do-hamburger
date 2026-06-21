// segue o mesmo schema do frontend
import { z } from 'zod'

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
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial'),

  cep: z
    .string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido — formato: 00000-000'),
})

export type RegisterInput = z.infer<typeof registerSchema>
// confirm password é um validate de UX e não backend
