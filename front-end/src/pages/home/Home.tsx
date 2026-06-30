import { useCallback, useEffect, useState } from "react";
import { Products } from "../../components/products/Products";
import { getProductsDate } from "../../shared/services/api/products/Products";
import {
  getItemSelectedClass,
  toUpperCaseDate,
} from "../../shared/utils/Utils";
import { type ProductsInterface } from "../../types/Products";

export const Home = () => {
  // defini FILTER_PRODUCTS = Hamburguer, Bebidas e Porções como readonly - evita typos
  const FILTER_PRODUCTS = toUpperCaseDate([
    "Hamburguer",
    "Bebidas",
    "Porções",
  ] as const);
  type FilterProducts = (typeof FILTER_PRODUCTS)[number];

  // filtro de itens
  const [category, setCategory] = useState<FilterProducts>("HAMBURGUER");

  // products inicia com array vazio até ser configurado novo valor
  const [products, setProducts] = useState<ProductsInterface[]>([]);
  // buscar produtos (GET)
  const productsDate = useCallback(async () => {
    try {
      await getProductsDate.getProducts().then((data) => {
        if (data) setProducts(data);
      });
    } catch (error: unknown) {
      console.log(`Erro: ${error}`);
    }
  }, []);

  useEffect(() => {
    productsDate();
  }, [productsDate]);

  // filtar produtos pela sua categoria usando um filter: vamos iterar no array product (recebe os produtos pelo setProducts que vem do meu banco de dados) e verificar se o produto filtrado product.category === category (array de estado). Se for, monte um novo array como a condição
  const filteredProductsByCategory = products.filter((product) => {
    return product.category === category;
  });

  return (
    <div className="mx-auto flex w-full flex-col gap-2 px-3 text-white md:w-184.25 md:px-0">
      <div className="my-2 flex gap-2 md:my-3">
        {/* Adicionado gap para separar os botões */}
        {/* Item 1: Hamburguer */}
        {/* chamadas dentro de eventos: () => {} - quando não retorno nada
           chamadas dentro de eventos: só o nome da função significa - quando temos retorno */}
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
            productId={product.productId}
            category={product.category}
            name={product.name}
            description={product.description}
            img={product.img}
            price={product.price}
            key={product.productId}
            setProducts={setProducts}
          />
        ))}
        {/* caso eu não tenha nada inserido naquela categoria, eu retrono um elemento com mensagem */}
        {filteredProductsByCategory.length === 0 && (
          <p>Não existem produtos nessa categoria</p>
        )}
      </div>
    </div>
  );
};
