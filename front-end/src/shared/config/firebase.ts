// firebase.ts — inicialização do Firebase Authentication no cliente.
// Só é usado para a ETAPA de login com Google (GoogleAuthProvider); o
// resto da aplicação (produtos, carrinho, pedidos) nunca importa daqui.
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  // signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { onAuthStateChanged, type User } from "firebase/auth"; // ← adiciona ao import já existente do "firebase/auth"

// GoogleAuthProvider - pega as credenciais do Google para fazer o login.
// getAuth - função que pega o objeto de autenticação do Firebase
// signInWithPopup - função que abre o popup do Google e faz o login.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
// const googleProvider = new GoogleAuthProvider(); // cria uma instância do provedor de autenticação do Google para ser usada no sistema de login do Firebase.

/**
 * Abre o popup do Google, autentica, e retorna o Firebase ID Token —
 * é esse token (não o usuário do Firebase) que vai para o backend em
 * POST /auth/google (RF-52). O backend nunca vê o objeto de usuário do
 * Firebase diretamente, só o token assinado que ele mesmo verifica.
 */
// export const signInWithGooglePopup = async (): Promise<string> => {
//   const result = await signInWithPopup(firebaseAuth, googleProvider);
//   return result.user.getIdToken();
// };

/**
 * Redireciona o usuário para a página de login do Google.
 * Esta função encerra a execução do app na página atual.
 */
// export const signInWithGoogleRedirect = async (): Promise<void> => {
//   return await signInWithRedirect(firebaseAuth, googleProvider);
// };

/**
 * Captura o resultado do redirecionamento após o retorno do Google.
 * Retorna o Firebase ID Token necessário para o seu backend.
 */

// --- Fluxo ativo por ora: signInWithRedirect ---
// Provider próprio pro redirect, separado do `googleProvider` comentado acima
// (esse continua reservado pro dia em que o signInWithPopup for reativado).
const googleRedirectProvider = new GoogleAuthProvider();

/**
 * Redireciona o usuário para a página de login do Google.
 * A página atual é descartada nessa chamada — quem chama não deve esperar
 * nada de volta aqui. O resultado só chega depois, via
 * getGoogleRedirectResult(), no próximo mount da página (ver useEffect em
 * Login.tsx).
 */
export const signInWithGoogleRedirect = async (): Promise<void> => {
  await signInWithRedirect(firebaseAuth, googleRedirectProvider);
};

/**
 * Assina mudanças no estado de autenticação do Firebase. Ao contrário de
 * getGoogleRedirectResult(), que só funciona se chamado no exato instante
 * certo, este listener dispara assim que o Firebase termina de consolidar
 * o estado — seja de um redirect recém-concluído, seja de uma sessão já
 * persistida no IndexedDB. Resolve a corrida entre o mount da página e a
 * restauração assíncrona da sessão. Retorna a função de "unsubscribe";
 * chame no cleanup do useEffect.
 */
export const onGoogleAuthStateChanged = (
  callback: (user: User | null) => void,
): (() => void) => {
  return onAuthStateChanged(firebaseAuth, callback);
};

/**
 * Deve ser chamada no mount da página de login (useEffect), sempre.
 * Se o usuário acabou de voltar do redirect do Google, retorna o Firebase
 * ID Token pra mandar em POST /auth/google (RF-52). Se não há redirect pendente (visita normal da página), retorna null — chamada é barata
 * nesse caso, não precisa de guarda extra pra evitar rodar.
 */
export const getGoogleRedirectResult = async (): Promise<string | null> => {
  const result = await getRedirectResult(firebaseAuth);
  if (!result) return null;
  return result.user.getIdToken();
};
