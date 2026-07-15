import { z } from 'zod'

const envSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME é obrigatório'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY é obrigatório'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET é obrigatório'),
})

export const envs = envSchema.parse(process.env)
