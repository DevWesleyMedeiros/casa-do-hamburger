export type ImageVariant = "thumbnail" | "card" | "detail";

export type ProductImage = {
  id: string;
  isPrimary: boolean;
  variants: Record<ImageVariant, string>;
};
