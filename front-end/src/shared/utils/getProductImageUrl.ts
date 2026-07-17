import type { ProductImage, ImageVariant } from "../../types/ProductImage";

const FALLBACK_IMAGE = "../../../public//assetsImages/"; // asset local, sem depender de rede

export function getProductImageUrl(
  images: ProductImage[] | undefined,
  variant: ImageVariant,
): string {
  // identificar se é a primeira imagem ou as demais
  const image = images?.find((img) => img.isPrimary) ?? images?.[0];
  return image?.variants?.[variant] ?? FALLBACK_IMAGE;
}
