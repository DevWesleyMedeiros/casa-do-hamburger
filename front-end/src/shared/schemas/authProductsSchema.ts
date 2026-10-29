import { reaisToCents } from '../utils/currency';
// --- Validação (mesma filosofia do backend: nunca confiar no dado bruto) ---
import { z } from 'zod';

export const newProductSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter ao menos 3 caracteres').max(80, 'Nome muito longo'),
  description: z
    .string()
    .trim()
    .min(10, 'Descrição deve ter ao menos 10 caracteres')
    .max(300, 'Descrição muito longa'),
  category: z.string().min(1, 'Selecione uma categoria'),
  price: z
    .string()
    .regex(/^\d+([.,]\d{1,2})?$/, 'Informe o preço em reais (ex.: 29,90)')
    .refine((value) => {
      try {
        reaisToCents(value);
        return true;
      } catch {
        return false;
      }
    }, 'Preço fora do limite suportado'),
});

export type NewProductFormData = z.infer<typeof newProductSchema>;
