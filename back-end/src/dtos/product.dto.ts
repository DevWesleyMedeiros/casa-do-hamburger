import { Products, ProductsImage } from '../../generated/prisma/index.js'

type ProductWithImages = Products & { images: ProductsImage[] }

export const toProductDTO = (product: ProductWithImages) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  category: product.category,
  images: product.images?.map((i) => i.url) ?? [],
})
