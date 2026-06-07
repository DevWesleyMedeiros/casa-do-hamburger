// componente de contexto

import { createContext } from "react";
import { type UserContextTypes } from "../../types/Payload";

// Permite você criar um contexto que os componentes podem prover algo ou lê-los
// UserContext é o que será consumido. Ele será consumido pelo hook useContexto do react, no componente que eu for utilizá-lo
export const UserContext = createContext<UserContextTypes>({
  user: null,
  setUser: () => {},
});
