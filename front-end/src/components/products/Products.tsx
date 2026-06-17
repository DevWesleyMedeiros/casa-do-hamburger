import { ShoppingCart } from "lucide-react";
import { brazilinaCurrencyFormat } from "../../shared/utils/Utils";
import { type ProductsInterface } from "../../types/Products";

export const Products = ({
  id,
  category,
  name,
  description,
  price,
  img,
}: ProductsInterface) => {
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
            <p className="my-0.5 text-sm font-bold uppercase md:text-lg">
              {name}
            </p>
            <p className="md:text-md flex-1 text-xs text-[#848484]">
              {description}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-end">
            <p className="text-brand-amber text-md mx-3 md:text-lg">
              {brazilinaCurrencyFormat(price)}
            </p>
            <ShoppingCart size={18} className="mx-0.5 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};
