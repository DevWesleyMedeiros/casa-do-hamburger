import { useCallback, useEffect, useState } from "react";
import { Products } from "../../components/products/Products";
import { getItemSelectedClass } from "../../shared/utils/Utils";
import { getProductsDate } from "../../shared/services/api/products/Products";
import { type ProductsInterface } from "../../types/Products";

export const Home = () => {
  // defini FILTER_PRODUCTS = Hamburguer, Bebidas e Porções como readonly - evita typos
  const FILTER_PRODUCTS = ["Hamburguer", "Bebidas", "Porções"] as const;
  type FilterProducts = (typeof FILTER_PRODUCTS)[number];

  const [selectedItemClass, setSelectedItemClass] =
    useState<FilterProducts>("Hamburguer");

  // products inicia com array vazio até ser configurado novo valor
  const [products, setProducts] = useState<ProductsInterface[]>([]);
  // buscar produtos (GET)
  const productsDate = useCallback(async () => {
    try {
      getProductsDate.getProducts().then((data) => {
        if (data) setProducts(data);
      });
    } catch (error: unknown) {
      console.log(`Erro: ${error}`);
    }
  }, []);

  useEffect(() => {
    productsDate();
  }, [productsDate]);

  return (
    <div className="mx-auto flex w-full flex-col gap-2 px-3 text-white md:w-184.25 md:px-0">
      <div className="my-2 flex gap-2 md:my-3">
        {/* Adicionado gap para separar os botões */}
        {/* Item 1: Hamburguer */}
        {/* chamadas dentro de eventos: () => {} - quando não retorno nada
           chamadas dentro de eventos: só o nome da função significa - quando temos retorno */}
        {FILTER_PRODUCTS.map((item) => (
          <div
            key={item}
            className={getItemSelectedClass(item, selectedItemClass)}
            onClick={() => setSelectedItemClass(item)} // ← seta o clicado
          >
            {item}
          </div>
        ))}
      </div>

      <p className="text-brand-amber mb-2 font-bold uppercase">
        {selectedItemClass}
      </p>
      <div className="flex flex-col gap-3 md:gap-3">
        {products.map((product) => (
          <Products
            id={product.id}
            name={product.name}
            description={product.description}
            img={product.img}
            price={product.price}
            key={product.id}
          />
        ))}
      </div>
    </div>
  );
};
