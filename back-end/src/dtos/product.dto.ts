import { Products, ProductsImage } from '../../generated/prisma/index.js'
import { buildImageVariants } from '../services/uploads/cloudinaryURLBuilder.js'

type ProductWithImages = Products & { images: ProductsImage[] }

export const toProductDTO = (product: ProductWithImages) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  category: product.category,
  images: product.images.map((img) => ({
    id: img.id,
    isPrimary: img.isPrimary,
    variants: buildImageVariants(img.key),
  })),
})

