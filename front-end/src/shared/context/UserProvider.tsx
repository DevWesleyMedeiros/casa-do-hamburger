//  componente provedor do contexto. Tudo que tiver envelopado por ele poderá usar o user e setUSer
// vai no App.tsx com children AppRoutes que contém as demais páginas que usarão contexto

import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { type UserDate } from "../../types/Payload";
import { UserContext } from "../context/UserContext";
import { userLogOut } from "../services/api/logout/Logout";
import { getAuth } from "../services/api/me/Me";

type propsChildren = {
  children: ReactNode;
};

export const UserProvider = ({ children }: propsChildren) => {
  const [user, setUser] = useState<UserDate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // A forma correta de saber se o usuário está logado no frontend. Como o JavaScript não lê cookies httpOnly, o padrão é perguntar ao backend. Isso já é implementado — é exatamente o GET /me do seu UserProvider:
  // espere o componete carregar para só depois executá-lo
  useEffect(() => {
    getAuth
      .getMe() // resolva o getMe route e retorne o valor no .then data
      .then((data) => {
        if (data) setUser(data);
      })
      .finally(() => setIsLoading(false)); // só false quando me respondeu
  }, []);

  const logout = useCallback(async () => {
    await userLogOut?.();
    setUser(null);
  }, []);

  const values = useMemo(
    () => ({
      user,
      setUser,
      logout,
      isLoading,
    }),
    [user, setUser, logout, isLoading],
  );

  return (
    // UserProvider será o que encapsulará os demais componentes
    <UserContext.Provider value={values}>{children}</UserContext.Provider>
    // O children permite o encapsulamento de outros componente dentro do provider e que, quem estiver dentro do provider, poderá usar os values passados, que, nesse caso, são os user e setUser
  );
};

// setUser -> no Login.tsx pois me retorna informações do usuário cadastrado {id, name, email, ... cep}
// user -> uma vez que eu tenho o setUser com os dados de usuário, eu posso usá-los em qualquer lugar com user.
