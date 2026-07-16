// --- Validação (mesma filosofia do backend: nunca confiar no dado bruto) ---
import { z } from 'zod'

export const createProductsSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter ao menos 3 caracteres').max(80, 'Nome muito longo'),
  description: z
    .string()
    .trim()
    .min(10, 'Descrição deve ter ao menos 10 caracteres')
    .max(300, 'Descrição muito longa'),
  category: z.enum(['HAMBURGUER', 'BEBIDAS', 'PORÇÕES'], { message: 'Categoria inválida' }),
  price: z.coerce
    .number({ error: 'Preço inválido' })
    .positive('Preço dever ser positivo')
    .transform((value) => Math.round(value * 10000)),
})

export type CreateProductInput = z.infer<typeof createProductsSchema>
