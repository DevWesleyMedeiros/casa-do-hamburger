//  componente provedor do contexto. Tudo que tiver envelopado por ele poderá usar o user e setUSer

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

  useEffect(() => {
    getAuth.getMe().then((date) => {
      if (date) {
        setUser(date);
      }
    });
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
    }),
    [user, setUser, logout],
  );

  return (
    // UserProvider será o que encapsulará os demais componentes
    <UserContext.Provider value={values}>{children}</UserContext.Provider>
    // O children permite o encapsulamento de outros componente dentro do privider e que, quem estiver dentro do provider poderá usar os values passados, que, nesse caso, são os user e setUser
  );
};
