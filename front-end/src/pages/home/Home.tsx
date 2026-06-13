import { useState } from "react";

export const Home = () => {
  const [selectedItemClass, setSelectedItemClass] = useState("");

  const selectedItem = (newItem: string) => {
    setSelectedItemClass(newItem);
  };

  const getItemSelectedClass = (itemClass: string) => {
    const selectedItem =
      "bg-brand-amber text-brand-dark md:text-md border-brand-amber flex h-7 w-24 cursor-pointer items-center justify-center rounded-md border text-sm font-bold md:h-9 md:w-32";
    const unselectedItem =
      "bg-brand-dark text-brand-amber md:text-md border-brand-amber hover:bg-brand-amber hover:text-brand-dark flex h-7 w-24 cursor-pointer items-center justify-center rounded-md border text-sm font-bold transition-all duration-200 ease-in md:h-9 md:w-32";

    return itemClass === selectedItemClass ? selectedItem : unselectedItem;
  };

  return (
    <div className="mx-auto flex w-full gap-2 px-3 text-white md:w-184.25 md:px-0">
      <div className="my-2 flex gap-2 md:my-3">
        {/* Adicionado gap para separar os botões */}
        {/* Item 1: Hamburguer */}
        <div
          // chamadas dentro de eventos: () => {} - quando não retorno nada
          // chamadas dentro de eventos: só o nome da função significa - quando temos retorno
          className={getItemSelectedClass("Hamburguer")}
          onClick={() => selectedItem("Hamburguer")}
        >
          Hamburguer
        </div>
        {/* Item 2: Bebidas */}
        <div
          className={getItemSelectedClass("Bebidas")}
          onClick={() => selectedItem("Bebidas")}
        >
          Bebidas
        </div>
        {/* Item 3: Porções */}
        <div
          className={getItemSelectedClass("Porções")}
          onClick={() => selectedItem("Porções")}
        >
          Porções
        </div>
      </div>
    </div>
  );
};
