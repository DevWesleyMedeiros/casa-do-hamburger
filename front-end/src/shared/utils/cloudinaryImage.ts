import { envs } from "../../config/envs";

const CLOUD_NAME = envs["CLOUDINARY_CLOUD_NAME"];

type ImageVariant = "thumbnail" | "card" | "detail";

const VARIANTES_PRESENTS: Record<ImageVariant, string> = {
  // // w_/h_ = dimensões | c_fill = corta mantendo proporção | q_auto = qualidade automática | f_auto = formato automático (webp/avif quando suportado)

  thumbnail: "w_80,h_80,c_fill,g_auto,q_auto,f_auto", // CartItem
  card: "w_320,h_320,c_fill,g_auto,q_auto,f_auto", // Product na Home
  detail: "w_800,h_800,c_fill,g_auto,q_auto,f_auto", // página de detalhe, se existir
};
export function getImageURLFromCloudinary(
  variant: ImageVariant,
  productName: string,
  publicId: string = "v1784235322",
): string {
  const preset = VARIANTES_PRESENTS[variant];
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${preset}/${publicId}/${productName}.png`;
}
