import { CalendarDays, Clock, Timer, UserRound } from "lucide-react";
import { ICON_CONFIG } from "../../constant/iconConfig";

type CardOrdersTypes = {
  id: number;
  name: string;
  orderTime: string;
  orderDate: string;
  deliverAt?: string;
  price: number;
};

export const CardPedidos = ({
  id,
  name,
  orderDate,
  orderTime,
  deliverAt,
  price = 128.74,
}: CardOrdersTypes) => {
  return (
    <div className="card bg-brand-amber my-2 flex h-40 flex-col rounded-md text-[#32343E]">
      <div className="mt mt-1 flex justify-between">
        <p className="ml-3 font-bold">#{id}</p>
        <select
          name="orders"
          id="orders"
          aria-label="Status do pedido"
          className="mr-3 font-bold"
        >
          <option defaultChecked disabled value="Pendente">
            Pendente
          </option>
          <option value="Retirado">Retirado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      <div className="date mt-2 ml-3 flex flex-col">
        <div className="my-0.5 flex items-center gap-1">
          <UserRound size={ICON_CONFIG.mnSize} />
          <span className="text-sm">{name}</span>
        </div>
        <div className="my-1 flex items-center gap-1">
          <CalendarDays size={ICON_CONFIG.mnSize} />
          <span className="text-sm">{orderDate}</span>
        </div>
        <div className="my-1 flex items-center gap-1">
          <Clock size={ICON_CONFIG.mnSize} />
          <span className="text-sm">{orderTime}</span>
          <span className="ml-12">
            <Timer size={ICON_CONFIG.mnSize} />
          </span>
          <span> {deliverAt ? orderTime : "-"} </span>
        </div>
      </div>
      <div className="mx-auto mt-1 h-0 w-49.75 justify-center border text-[#32343E]"></div>
      <p className="mx-4 my-1 text-right text-lg font-bold text-[#32343E]">
        R${price}
      </p>
    </div>
  );
};
