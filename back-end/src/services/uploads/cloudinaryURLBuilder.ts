// src/services/uploads/cloudinaryUrlBuilder.ts
import { envs } from '../../config/env.js'

const CLOUD_NAME = envs['CLOUDINARY_CLOUD_NAME']

export type ImageVariant = 'thumbnail' | 'card' | 'detail'

// w_/h_ = dimensões | c_fill = corta mantendo proporção | g_auto = foco automático no ponto de interesse do corte
// q_auto = qualidade automática | f_auto = formato automático (webp/avif quando o navegador suporta)
const VARIANT_PRESETS: Record<ImageVariant, string> = {
  thumbnail: 'w_80,h_80,c_fill,g_auto,q_auto,f_auto', // CartItem
  card: 'w_320,h_320,c_fill,g_auto,q_auto,f_auto', // Product na Home
  detail: 'w_800,h_800,c_fill,g_auto,q_auto,f_auto', // página de detalhe, se existir
}

/**
 * publicId = o campo `key` salvo em ProductsImage
 * (ex: "casa-do-hamburguer/products/hamburguer-triplo-da-casa-mobile_kxs0bm")
 *
 * Sem extensão fixa e sem versão de propósito:
 *   extensão: com f_auto, o Cloudinary escolhe o melhor formato por conta própria.
 *   Fixar ".png" anularia esse ganho para uploads em jpeg/webp.
 *   versão (v1784236635): só serve pra cache-busting manual; sem ela, o Cloudinary sempre resolve pra versão mais recente do asset.
 */
export function buildImageUrl(publicId: string, variant: ImageVariant): string {
  const preset = VARIANT_PRESETS[variant]
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${preset}/${publicId}`
}

export function buildImageVariants(publicId: string) {
  return {
    thumbnail: buildImageUrl(publicId, 'thumbnail'),
    card: buildImageUrl(publicId, 'card'),
    detail: buildImageUrl(publicId, 'detail'),
  }
}
