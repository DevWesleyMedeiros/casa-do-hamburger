// componente que serve somente para disparar o useEffect que busca um usuário na api
// O useEffect que antes ficava dentro do UserProvider agora disparado por aqui. Este componente não vai renderizar nada — só vai disparar a inicialização uma vez.

import { useEffect } from "react";
import { useUserStore } from "../stores";

export const FetchUser = () => {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // roda uma única vez na montagem, igual ao seu useEffect anterior

  return null; // componente invisível
};
