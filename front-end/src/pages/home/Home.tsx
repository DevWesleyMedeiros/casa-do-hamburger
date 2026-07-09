import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Products } from "../../components/products/Products";
import { queryKeys } from "../../constant/queryKeys";
import { getProductsData } from "../../shared/services/api/products/Products";
import {
  getItemSelectedClass,
  toUpperCaseDate,
} from "../../shared/utils/Utils";

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
  } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => getProductsData.getProducts(),
    staleTime: 1000 * 5 * 60,
  });

  if (isLoading) {
    return (
      <p className="text-brand-amber animate-pulse p-6 text-center">
        Carregando produtos...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="p-6 text-center text-red-400">
        Erro ao carregar produtos. Tente novamente.
      </p>
    );
  }

  const filteredProductsByCategory = products.filter((product) => {
    return product.category === category;
  });

  return (
    <div className="mx-auto flex h-screen w-full flex-col gap-2 px-3 text-white md:w-184.25 md:px-0">
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
        {filteredProductsByCategory.map((product) => (
          <Products
            id={product.id}
            category={product.category}
            name={product.name}
            description={product.description}
            img={product.img}
            price={product.price}
            key={product.id}
          />
        ))}
        {filteredProductsByCategory.length === 0 && (
          <p>Não existem produtos nessa categoria</p>
        )}
      </div>
    </div>
  );
};
