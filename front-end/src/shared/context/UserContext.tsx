// componente de contexto

import { createContext, useState, type ReactNode } from "react";
import { type UserContextTypes, type UserDate } from "../../types/Payload";

// Permite você criar um contexto que os componentes podem prover algo ou lê-los
// UserContext é o que será consumido. Ele será consumido pelo hook useContexto do react, no componente que eu for utilizá-lo
export const UserContext = createContext<UserContextTypes>({
  user: null,
  setUser: () => {},
});

type propsChildren = {
  children: ReactNode;
};

// UserProvider será o que encapsulará os demais componentes
export const UserProvider = ({ children }: propsChildren) => {
  const [user, setUser] = useState<UserDate | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
// O children permite o encapsulamento de outros componente dentro do privider e que, quem estiver dentro do provider poderá usar os values passados, que, nesse caso, são os user e setUser
