import { useEffect } from "react";
import { useCartStore } from "../stores/useCartStore";

export const FetchCartItems = () => {
  const fetCartItem = useCartStore((state) => state.fetchCartItems);

  useEffect(() => {
    fetCartItem();
  }, [fetCartItem]); // roda uma única vez na montagem, igual ao seu useEffect anterior

  return null; // componente invisível
};
