import { useState } from "react";
import { CardPedidos } from "../../components/cardPedidos/CardPedidos";
import { getItemSelectedClass } from "../../shared/utils/Utils";

// nomes dos itens como constante — evita typos (nomes incorretos, mas que o typescript não retorna erro em execução, pois escrito errado ou não, são todos strings)
// FILTER_ITENS é array do tipo readonly: as const
const FILTER_ITEMS = ["Pendentes", "Retirados", "Cancelados"] as const;
type FilterItem = (typeof FILTER_ITEMS)[number];
// FilterItem = 'Pendentes' | 'Retirados' | 'Cancelados' union types de um array (FILTER_ITEMS)

export const Pedidos = () => {
  const [selectedItemClass, setSelectedItemClass] =
    useState<FilterItem>("Pendentes");

  return (
    <div className="mx-auto flex w-full flex-col gap-2 px-3 text-white md:w-184.25 md:px-0">
      <div className="my-1 mb-3 flex gap-2 md:my-3">
        {FILTER_ITEMS.map((item) => (
          <div
            key={item}
            className={getItemSelectedClass(item, selectedItemClass)}
            onClick={() => setSelectedItemClass(item)} // ← seta o clicado
          >
            {item}
          </div>
        ))}
      </div>

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
          price={250.25}
        />
      </div>
    </div>
  );
};
