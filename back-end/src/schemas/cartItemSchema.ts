import { z } from 'zod'

export const cartItemSchema = z.object({
  quantity: z
    .number('Quantidade obrigatória')
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1'),
})

export const createCartItemSchema = z.object({
  productId: z.string('ID do produto obrigatório').min(1, 'ID do produto não pode estar vazio'),
})

export type RegisterCartItem = z.infer<typeof cartItemSchema>
export type CreateCartItem = z.infer<typeof createCartItemSchema>
