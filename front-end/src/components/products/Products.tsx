import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { queryKeys } from "../../constant/queryKeys";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { resolveApiErrorMessage } from "../../shared/utils/apiErrorMessage";
import { useMe } from "../../hook/useMe";
import { NewCartItem } from "../../shared/services/api/cartItems/createCartItems";
import { deleteProductById } from "../../shared/services/api/delete/DeleteProduct";
import { getProductImageUrl } from "../../shared/utils/getProductImageUrl";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";
import { type ProductsInterface } from "../../types/Products";

export const Products = ({
  id, // id vindo da tabela Products
  name,
  description,
  price,
  images,
}: ProductsInterface) => {
  const { data: user } = useMe();
  const queryClient = useQueryClient();

  // função que irá deletar um produto pelo id
  const handleCreateCartItem = useCallback(
    async (productId: string) => {
      if (!productId) return;
      try {
        const response = await NewCartItem.newCartItem({ productId });
        if (response instanceof ApiError) {
          toast.error(
            resolveApiErrorMessage(response, { 404: "Produto não encontrado" }),
          );
          return;
        }
        // TanStack rebusca → Cart.tsx recebe o novo item automaticamente
        await queryClient.invalidateQueries({ queryKey: queryKeys.cartItems });
        toast.success("Adicionado ao carrinho");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao adicionar ao carrinho");
      }
    },
    [queryClient],
  );

  // deletar produto pelo id
  const handleDeleteProductById = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        const response = await deleteProductById.deleteProduct(id);
        if (response instanceof ApiError) {
          toast.error(
            resolveApiErrorMessage(response, {
              404: "Produto não foi encontrado ou já foi deletado",
            }),
          );
          return;
        }
        toast.success("Produto deletado com sucesso");
        await queryClient.invalidateQueries({ queryKey: queryKeys.products });
      } catch (err) {
        console.error(err);
        toast.error("Erro ao deletar produto");
      }
    },
    [queryClient],
  );

  return (
    <div>
      <div className="container-products relative flex gap-2">
        <img
          src={getProductImageUrl(images, "card")}
          alt={name ?? "imagem do produto"}
          className="h-20.75 w-25 shrink-0 object-cover md:h-41.5 md:w-50"
        />

        <div className="flex w-full flex-col justify-between">
          <div>
            <div className="flex justify-between">
              <p className="my-0.5 text-sm font-bold uppercase md:text-lg">
                {name}
              </p>
              {user?.admin && (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-brand-red flex cursor-pointer items-center rounded-md border px-1 text-sm"
                    onClick={() => handleDeleteProductById(id)}
                  >
                    Deletar
                  </button>
                </div>
              )}
            </div>

            <p className="md:text-md flex-1 text-xs text-[#848484]">
              {description}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-end">
            <p className="text-brand-amber text-md mx-3 md:text-lg">
              {brazilinaCurrencyFormat(price)}
            </p>
            <ShoppingCart
              size={18}
              className="mx-0.5 cursor-pointer"
              onClick={() => handleCreateCartItem(id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
