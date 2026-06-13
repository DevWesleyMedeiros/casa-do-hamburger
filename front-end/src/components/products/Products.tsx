import { ShoppingCart } from "lucide-react";

export const Products = () => {
  return (
    <div>
      <div className="container-products relative flex gap-2">
        <img
          src="./duplo-da-casa.png"
          alt="imagem burguer duplo da casa"
          className="h-20.75 w-25 shrink-0 object-cover md:h-41.5 md:w-50"
        />

        <div className="product-title-description flex flex-col justify-between">
          <div>
            <p className="my-0.5 text-sm font-bold uppercase md:text-lg">
              Duplo da casa
            </p>
            <p className="md:text-md flex-1 text-xs text-[#848484]">
              Dois suculentos hambúrgueres de 120g, queijo cheddar derretido,
              maionese da casa e picles no pão brioche tostado.
            </p>
          </div>

          <div className="mt-2 flex items-center justify-end">
            <p className="text-brand-amber text-md mx-3 md:text-lg">R$28,90</p>
            <ShoppingCart size={18} className="mx-0.5 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};
