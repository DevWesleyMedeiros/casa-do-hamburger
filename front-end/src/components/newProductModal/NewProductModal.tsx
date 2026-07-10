// src/components/NewProductModal.tsx
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type NewProductFormData,
  newProductSchema,
} from "../../shared/schemas/authProductsSchema";
import { OctagonX, Upload } from "lucide-react";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { useNewProductUIModalStore } from "../../shared/stores/useNewProductUIModal";
import { Button } from "../button/Button";

// Ajuste as categorias reais do seu domínio de Products aqui
const CATEGORIES = [
  { value: "burger", label: "Hambúrguer" },
  { value: "drink", label: "Bebida" },
  { value: "side", label: "Porções" },
];

const MAX_IMAGE_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const NewProductModal = () => {
  const closeModal = useNewProductUIModalStore((state) => state.closeModal);

  // estados de UI local (usar o useReducer)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewProductFormData>({
    resolver: zodResolver(newProductSchema),
  });

  // Fecha com Esc e trava o scroll do body enquanto a modal está aberta
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [closeModal]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Formato inválido. Use PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImageError(`Imagem muito grande. Máximo ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: NewProductFormData) => {
    if (!imageFile) {
      setImageError("Selecione uma imagem para o produto.");
      return;
    }

    // Backend deve revalidar tudo (tipo, tamanho, magic bytes) — nunca confiar só no client
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("price", data.price.replace(",", "."));
    formData.append("image", imageFile);

    // TODO: plugar aqui seu useMutation (TanStack Query) de criação de produto
    // await createProductMutation.mutateAsync(formData);
    // Ex.: onSuccess -> queryClient.invalidateQueries({ queryKey: ['products'] }); closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={closeModal}
      role="presentation"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          closeModal();
        }
      }}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center rounded-lg bg-[#24201A] p-6 shadow-xl sm:max-w-xl sm:p-8"
        onClick={(e) => e.stopPropagation()} // impede que o fechamento da modal se espalhe para dentro dela
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-product-title"
      >
        <h2
          id="new-product-title"
          className="mb-4 text-xl font-bold text-[#9D9D94]"
        >
          Adicionar Produto
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-4"
          noValidate
        >
          <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Upload de imagem */}
            <div className="flex w-full flex-col items-center gap-1 sm:w-40 sm:shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square w-40 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-[#9D9D94]/40 bg-black/20 transition hover:border-[#C41E00] sm:w-full"
                aria-label="Selecionar imagem do produto"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Pré-visualização do produto"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Upload
                    size={ICON_CONFIG.mxSize}
                    className="text-[#9D9D94]"
                  />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleImageChange}
                className="hidden"
              />
              {imageError && (
                <span className="max-w-40 text-center text-xs text-[#C41E00]">
                  {imageError}
                </span>
              )}
            </div>

            {/* Inputs de texto */}
            <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="sr-only">
                  Nome do Produto
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nome do Produto"
                  className="h-9 w-full rounded-md border border-[#9D9D94]/40 bg-transparent px-3 text-sm text-[#9D9D94] outline-none focus:border-[#C41E00]"
                  {...register("name")}
                />
                {errors.name && (
                  <span className="text-xs text-[#C41E00]">
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="description" className="sr-only">
                  Descrição
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder="Descrição"
                  className="h-9 w-full rounded-md border border-[#9D9D94]/40 bg-transparent px-3 text-sm text-[#9D9D94] outline-none focus:border-[#C41E00]"
                  {...register("description")}
                />
                {errors.description && (
                  <span className="text-xs text-[#C41E00]">
                    {errors.description.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="category" className="sr-only">
                  Categoria
                </label>
                <select
                  id="category"
                  defaultValue=""
                  className="h-9 w-full rounded-md border border-[#9D9D94]/40 bg-[#24201A] px-3 text-sm text-[#9D9D94] outline-none focus:border-[#C41E00]"
                  {...register("category")}
                >
                  <option value="" disabled>
                    Categoria
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <span className="text-xs text-[#C41E00]">
                    {errors.category.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="price" className="sr-only">
                  Preço
                </label>
                <input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="Preço"
                  className="h-9 w-full rounded-md border border-[#9D9D94]/40 bg-transparent px-3 text-sm text-[#9D9D94] outline-none focus:border-[#C41E00]"
                  {...register("price")}
                />
                {errors.price && (
                  <span className="text-xs text-[#C41E00]">
                    {errors.price.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            title={isSubmitting ? "Adicionando..." : "Adicionar Produto"}
            colorVariation="bgRedVariation"
            type="submit"
          />
        </form>

        <button
          type="button"
          onClick={closeModal}
          aria-label="Fechar modal"
          className="absolute top-2 right-3 text-[#9D9D94] transition hover:text-[#C41E00]"
        >
          <OctagonX size={ICON_CONFIG.mxSize} />
        </button>
      </div>
    </div>
  );
};
