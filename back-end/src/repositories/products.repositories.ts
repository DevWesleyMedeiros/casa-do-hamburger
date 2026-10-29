import type { Prisma, Products } from '../../generated/prisma/index.js';
import { prisma } from '../db.js';
import type { CreateProductInput } from '../schemas/products.schemas.js';
import { handlePrismaError } from '../utils/handlePrismaError.js';

interface CreateProductWithImageParams {
  data: CreateProductInput;
  image: {
    url: string;
    key: string;
    mimeType: string;
    size: number;
  };
}

export const productsRepository = {
  async createWithImage(
    { data, image }: CreateProductWithImageParams,
    onCreated: (tx: Prisma.TransactionClient, product: Products) => Promise<void>,
  ) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.products.create({
        data: {
          ...data,
          images: { create: image },
        },
        include: { images: true },
      });
      await onCreated(tx, product);
      return product;
    });
  },
  findManyProducts: async () => {
    return await prisma.products.findMany({ include: { images: true } });
  },

  // deletar produto pelo id do produto passado. Se der certo, ele me retorna o id deletado
  findProductAndDelete: async (
    id: string,
    onDeleted: (tx: Prisma.TransactionClient, product: Products) => Promise<void>,
  ) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const product = await tx.products.findUniqueOrThrow({ where: { id } });
        await tx.products.delete({ where: { id } });
        await onDeleted(tx, product);
        return product;
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },
};
