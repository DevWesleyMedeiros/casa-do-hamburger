import { type ReactNode, useState } from "react";
import { type UserDate } from "../../types/Payload";
import { UserContext } from "../context/UserContext";

type propsChildren = {
  children: ReactNode;
};

export const UserProvider = ({ children }: propsChildren) => {
  const [user, setUser] = useState<UserDate | null>(null);

  return (
    // UserProvider será o que encapsulará os demais componentes
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
    // O children permite o encapsulamento de outros componente dentro do privider e que, quem estiver dentro do provider poderá usar os values passados, que, nesse caso, são os user e setUser
  );
};
