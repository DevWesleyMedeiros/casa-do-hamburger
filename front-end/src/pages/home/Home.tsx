import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Products } from "../../components/products/Products";
import { queryKeys } from "../../constant/queryKeys";
import { getProductsData } from "../../shared/services/api/products/Products";
import {
  getItemSelectedClass,
  toUpperCaseDate,
} from "../../shared/utils/Utils";
import { NonBackendResources } from "../../components/NonBackendResources";

const FILTER_PRODUCTS = toUpperCaseDate([
  "Hamburguer",
  "Bebidas",
  "Porções",
] as const);
type FilterProducts = (typeof FILTER_PRODUCTS)[number];
export const Home = () => {
  const [category, setCategory] = useState<FilterProducts>("HAMBURGUER");
  const {
    data: products = [],
    isLoading,
    isError,
    // isPlaceholderData,
  } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => getProductsData.getProducts(),
    staleTime: 1000 * 5 * 60,
    // placeholderData:
    // Impede a execução da query até que a página esteja pronta
    retry: 1,
  });

  if (isLoading) {
    return (
      <p className="text-brand-amber animate-pulse p-6 text-center">
        Carregando produtos...
      </p>
    );
  }

  // Erro de rede/servidor (ex: backend ainda não deployado) → fallback 404 dedicado
  if (isError) {
    return <NonBackendResources />;
  }

  const filteredProductsByCategory = products.filter((product) => {
    return product.category === category;
  });

  return (
    <div className="mx-auto flex w-full flex-col gap-2 px-3 text-white md:w-184.25 md:px-0">
      <div className="my-2 flex gap-2 md:my-3">
        {FILTER_PRODUCTS.map((item) => (
          <button
            key={item}
            className={getItemSelectedClass(item, category)}
            onClick={() => setCategory(item)} // ← seta o clicado
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <p className="text-brand-amber mb-2 font-bold uppercase">{category}</p>
      <div className="flex flex-col gap-3 md:gap-3">
        {filteredProductsByCategory.length > 0 ? (
          filteredProductsByCategory.map((product) => (
            <Products
              id={product.id}
              category={product.category}
              name={product.name}
              description={product.description}
              images={product.images}
              price={product.price}
              key={product.id}
            />
          ))
        ) : (
          <p className="text-brand-amber/70 text-center">
            Nenhum produto disponível nesta categoria no momento.
          </p>
        )}
      </div>
    </div>
  );
};
