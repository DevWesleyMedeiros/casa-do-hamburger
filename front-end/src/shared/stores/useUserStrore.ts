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
          // isLoading: false or true para gerenciar o clico de vida da chamada inicial da API
        }
      },
    }),
    { name: "UserStore" }, // -> nome que vai aparecer no DevTools
  ),
);

// O que é o false? A assinatura oficial da função set do Zustand recebe três parâmetros: set(estadoNovo, replace?, nomeDaAcao?)
// O segundo parâmetro é um booleano chamado replace (substituir).
// Se for false (que já é o comportamento padrão), o Zustand faz um Merge (mescla) do estado atual com o estado novo. Ele só altera o que você mandou alterar.
// Se for true, o Zustand faz um Replace (substituição). Ele apaga tudo o estado global daquela store e coloca apenas o objeto que você passou.
// false já é o padrão, mas, Por causa do terceiro parâmetro ("setUser", "logout", etc.). Em JavaScript, os parâmetros seguem uma ordem de posições. Se você quer nomear a sua ação para que ela apareça no Redux DevTools (que é o terceiro parâmetro), você é obrigado a preencher o segundo parâmetro para "pular" para o terceiro.

// ERRADO: O Zustand vai achar que "setUser" é o parâmetro `replace`
// set({ user }, "setUser");

// CORRETO: Preenchemos o 2º com o valor padrão (false) para podermos usar o 3º
// set({ user }, false, "setUser");

// O que é o set do Zustand? basicamente é ela que avisa ao react o que foi mudado e deve ser renderizado. Você só usa o set para alterar dados puros (strings, arrays, booleanos, objetos e números), ou seja, aquilo que impacta a Interface do Usuário (UI).
