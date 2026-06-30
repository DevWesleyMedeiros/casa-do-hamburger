import { ShoppingCart } from "lucide-react";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";
import { type ProductsInterface } from "../../types/Products";
import { useUserStore, useCartStore } from "../../shared/stores";
import { useCallback } from "react";
import { deleteProductById } from "../../shared/services/api/delete/DeleteProduct";
import { toast } from "sonner";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { NewCartItem } from "../../shared/services/api/cartItems/createCartItems";

export const Products = ({
  productId,
  category,
  name,
  description,
  price,
  img,
}: ProductsInterface) => {
  const user = useUserStore((state) => state.user);
  const addItems = useCartStore((state) => state.addItem);

  // função que irá deletar um produto pelo id
  const handleCreateCartItem = useCallback(
    async (productId: string) => {
      // id já disponível no componente, por isso não precisa ser acessado na função de fetch
      if (!productId) return;
      try {
        const response = await NewCartItem.newCartItem({ productId });
        if (response instanceof ApiError) {
          if (response.statusCode === 401) {
            toast.error("Você precisa estar logado");
          } else if (response.statusCode === 404) {
            toast.error("Produto não encontrado");
          } else {
            toast.error(response.message);
          }
          return;
        }
        addItems(response);
        toast.success("Adicionado ao carrinho");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao adicionar ao carrinho");
      }
    },
    [addItems],
  );

  const handleDeleteProdutcById = useCallback(async (id: string) => {
    if (!id) return;

    const result = await deleteProductById.deleteProduct(id);

    if (result instanceof ApiError) {
      if (result.statusCode === 404) {
        toast.error("Produto não foi encontrado ou já foi deletado");
      } else if (result.statusCode === 403) {
        toast.error("Acesso restrito aos administradores");
      } else if (result.statusCode === 401) {
        toast.error("Você precisa estar logado");
        return;
      } else {
        toast.error(result.message);
      }

      return;
    }
    // se não caiu em nenhuma das excessões, então o produto foi deletado
    toast.success("Produto deletado com sucesso");

    // após eu ter deletado um produto, eu preciso atualizar a lista de produto local sem o produto deletado. A lista de produtos é preenchida no Home.tsx
    // setProducts((prev: ProductsInterface[]) =>
    //   prev.filter((product) => product.id !== id),
    // );
  }, []);

  return (
    <div>
      <div className="container-products relative flex gap-2">
        <img
          src={`./${img}`}
          alt="imagem burguer duplo da casa"
          className="h-20.75 w-25 shrink-0 object-cover md:h-41.5 md:w-50"
        />

        <div className="flex w-full flex-col justify-between">
          <div>
            {/* conteianer título / nome do produto e button del product*/}
            {/* ? (optional chain) - indica que, ou tenho um usuário, ou ele é null (estado inicial do user) */}
            {user?.admin && (
              <div className="flex items-center justify-between">
                <p className="my-0.5 text-sm font-bold uppercase md:text-lg">
                  {name}
                </p>
                <button
                  type="button"
                  className="text-brand-red flex cursor-pointer items-center rounded-md border px-1 text-sm"
                  onClick={() => handleDeleteProdutcById(productId)}
                >
                  Deletar
                </button>
              </div>
            )}

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
              onClick={() => handleCreateCartItem(productId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
