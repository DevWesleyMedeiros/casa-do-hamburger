// minha store "useUserStore" será minha nova pasta de estado global

import { create } from "zustand";
import { devtools } from "zustand/middleware";
// imports para o provider
import { type UserDate } from "../../types/Payload";
import { userLogOut } from "../services/api/logout/Logout";
import { getAuth } from "../services/api/me/Me";

// Interface do store (equivale ao antigo UserContextTypes)
interface UserStore {
  user: UserDate | null;
  isLoading: boolean;

  // Actions (aqui antes eram funções dentro do Provider)
  setUser: (user: UserDate | null) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>; // substitui o useEffect do Provider
}

// create<T> com devtools para aparecer no Redux DevTools Extension nos Browsers
// Criamos e exportamos o store
export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      // o set ó responsável por alterar valores do meu useUseStore
      // Estado inicial
      user: null,
      isLoading: true,

      // Equivalente ao setUser do useState
      // atualizar o meu user com a função set do zustand com os dados vindo do fetch passando via setUser
      setUser: (user) => set({ user }, false, "setUser"),

      // Equivalente ao logout do useCallback
      logout: async () => {
        await userLogOut?.();
        set({ user: null }, false, "logout");
      },

      // Equivalente ao useEffect + getMe do UserProvider
      // lógica encapsulada a lógica do useEffect agora numa função fetchUser. Chamamos-a num função useEffect onde iremos consumir o store
      fetchUser: async () => {
        try {
          const data = await getAuth.getMe();
          if (data) set({ user: data }, false, "fetch/success");
        } catch {
          // usuário não autenticado é estado válido
        } finally {
          set({ isLoading: false }, false, "fetch/done");
          // Independentemente de dar erro no backend, limpamos o front e user volta ao seu estodo atual
        }
      },
    }),
    { name: "UserStore" }, // -> nome que vai aparecer no DevTools
  ),
);
