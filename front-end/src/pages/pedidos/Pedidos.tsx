import { useState } from "react";
import { CardPedidos } from "../../components/cardPedidos/CardPedidos";

export const Pedidos = () => {
  const [selectedItemClass, setSelectedItemClass] = useState("Pendentes");

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
    <div className="mx-auto flex w-full flex-col gap-2 px-3 text-white md:w-184.25 md:px-0">
      {/* category */}
      <div className="my-1 mb-3 flex gap-2 md:my-3">
        {/* Pendentes */}
        <div
          className={getItemSelectedClass("Pendentes")}
          onClick={() => selectedItem("Pendentes")}
        >
          Pendentes
        </div>
        {/* Retirados */}
        <div
          className={getItemSelectedClass("Retirados")}
          onClick={() => selectedItem("Retirados")}
        >
          Retirados
        </div>
        {/* Cancelados */}
        <div
          className={getItemSelectedClass("Cancelados")}
          onClick={() => selectedItem("Cancelados")}
        >
          Cancelados
        </div>
      </div>

      {/* cardápio */}
      <div className="grid grid-cols-3 gap-3">
        <CardPedidos
          id={1}
          name="Wesley"
          orderDate="13/06/2026"
          orderTime="22:00"
          deliverAt="23:10"
          price={128.74}
        />
        <CardPedidos
          id={2}
          name="Clenir"
          orderDate="14/06/2026"
          orderTime="21:00"
          deliverAt=""
          price={128.74}
        />
      </div>
    </div>
  );
};
