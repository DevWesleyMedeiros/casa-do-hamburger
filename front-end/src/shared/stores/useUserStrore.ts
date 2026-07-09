// // minha store "useUserStore" será minha nova pasta de estado global

// import { create } from "zustand";
// import { devtools } from "zustand/middleware";
// // imports para o provider
// import { type UserDate } from "../../types/Payload";
// import { userLogOut } from "../services/api/logout/Logout";
// import { getAuth } from "../services/api/me/Me";

// // Interface do store (equivale ao antigo UserContextTypes)
// interface UserStore {
//   user: UserDate | null;
//   isLoading: boolean;

//   // Actions (aqui antes eram funções dentro do Provider)
//   setUser: (user: UserDate | null) => void;
//   logout: () => Promise<void>;
//   fetchUser: () => Promise<void>; // substitui o useEffect do Provider
// }

// // create<T> com devtools para aparecer no Redux DevTools Extension nos Browsers
// // Criamos e exportamos o store
// export const useUserStore = create<UserStore>()(
//   devtools(
//     (set) => ({
//       user: null,
//       isLoading: true,

//       setUser: (user) => set({ user }, false, "setUser"),

//       // Equivalente ao logout do useCallback
//       logout: async () => {
//         await userLogOut?.();
//         set({ user: null }, false, "logout");
//       },
//       fetchUser: async () => {
//         try {
//           const data = await getAuth.getMe();
//           // Verifica se o retorno é um usuário válido (não é ApiError)
//           if (data && !(data instanceof Error)) {
//             set({ user: data }, false, "fetch/success");
//           }
//         } catch {
//           // usuário não autenticado é estado válido
//         } finally {
//           set({ isLoading: false }, false, "fetch/done");
//         }
//       },
//     }),
//     { name: "UserStore" }, // -> nome que vai aparecer no DevTools
//   ),
// );
