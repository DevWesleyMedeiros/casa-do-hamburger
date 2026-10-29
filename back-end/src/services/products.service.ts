import { auditService, type AuditActor } from './audit.service.js';
import { productsRepository } from '../repositories/products.repositories.js';
import { uploadImageToCloudinary } from './uploads/cloudinary.service.js';
import { AppError } from '../errors/AppError.js';
import type { CreateProductInput } from '../schemas/products.schemas.js';

const PRODUCTS_CLOUDINARY_FOLDER = 'casa-do-hamburguer/products';
export const productService = {
  async createProduct(
    data: CreateProductInput,
    file: Express.Multer.File | undefined,
    actor: AuditActor,
  ) {
    if (!actor.admin) throw new AppError(403, 'Acesso administrativo necessário');
    if (!file) throw new AppError(400, 'Imagem do produto obrigatório');
    const image = await uploadImageToCloudinary(file, PRODUCTS_CLOUDINARY_FOLDER);
    return productsRepository.createWithImage({ data, image }, (tx, product) =>
      auditService.record(tx, actor, {
        action: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: product.id,
        before: null,
        after: product,
      }),
    );
  },

  list: async () => {
    const products = await productsRepository.findManyProducts();
    if (products.length === 0) {
      throw new AppError(404, 'Nenhum produto cadastrado no sistema');
    }
    return products;
  },

  // delete product pelo id dele
  deleteById: async (id: string, actor: AuditActor) => {
    if (!actor.admin) throw new AppError(403, 'Acesso administrativo necessário');
    return productsRepository.findProductAndDelete(id, (tx, product) =>
      auditService.record(tx, actor, {
        action: 'PRODUCT_DELETED',
        entityType: 'PRODUCT',
        entityId: product.id,
        before: product,
        after: null,
      }),
    );
  },
  products: async () => {
    const productsDate = await productsRepository.findManyProducts();
    if (productsDate.length === 0) {
      throw new AppError(404, 'Nenhum produto cadastrado no sistema');
    }
    return productsDate;
  },
};
