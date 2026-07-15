import { toast } from "sonner";
import { createProduct } from "../shared/services/api/products/CreateNewProductsWithImages";
import { type CreateProductInput } from "../types/CreateNewProducts";
import { queryKeys } from "../constant/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      toast.success("Produto adicionado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao adicionar produto. Tente novamente.");
    },
  });
};
