import { useState } from "react";
import { Products } from "../../components/products/Products";
import { getItemSelectedClass } from "../../shared/utils/Utils";

export const Home = () => {
  const FILTER_PRODUCTS = ["Hamburguer", "Bebidas", "Porções"] as const;
  type FilterProducts = (typeof FILTER_PRODUCTS)[number];

  const [selectedItemClass, setSelectedItemClass] =
    useState<FilterProducts>("Hamburguer");

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
        <Products />
        <Products />
        <Products />
      </div>
    </div>
  );
};
