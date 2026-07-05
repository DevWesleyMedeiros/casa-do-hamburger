import { z } from 'zod'

export const cartItemSchema = z.object({
  quantity: z
    .number('Quantidade obrigatória')
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1'),
})

export type RegisterCartItem = z.infer<typeof cartItemSchema>
