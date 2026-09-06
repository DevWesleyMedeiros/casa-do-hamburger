// firebase.ts — inicialização lazy do Firebase Authentication no cliente.
// Só é carregado quando necessário (apenas na página de login), reduzindo
// o bundle size do frontend que não precisa do SDK em outras rotas.
//
// IMPORTANTE: este arquivo não pode ter NENHUM import estático de VALOR de
// "firebase/app" ou "firebase/auth" — apenas `import type`. Um único import
// estático de valor faz o bundler considerar o módulo "alcançável" desde o
// carregamento inicial, e todos os `await import()` abaixo deixam de gerar
// um chunk lazy de verdade.
import type {
  User,
  Auth,
  GoogleAuthProvider,
  UserCredential,
} from "firebase/auth";

// Configurações do Firebase (carregadas antes da importação dinâmica)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

// Cache para evitar recarregar o SDK múltiplas vezes
let firebaseInitialized: boolean = false;
let firebaseAuth: Auth;
let googleRedirectProvider: GoogleAuthProvider;

// Função privada que inicializa o Firebase apenas uma vez
async function initializeFirebase() {
  if (firebaseInitialized) return;

  // Importa o SDK do Firebase dinamicamente - só carrega quando necessário
  const { initializeApp } = await import("firebase/app");
  const { getAuth, GoogleAuthProvider } = await import("firebase/auth");

  const firebaseApp = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);

  googleRedirectProvider = new GoogleAuthProvider();
  googleRedirectProvider.setCustomParameters({ prompt: "select_account" });

  firebaseInitialized = true;
}

/**
 * Abre o popup do Google, autentica o Firebase com o Firebase ID token
 * é esse token (não o usuário do Firebase) que vai para o backend em POST /auth/google (RF-52); O backend nunca vê o objeto de usuário do Firebase diretamente, só o token assinado que ele mesmo verifica.
 * Resolve o problema de COOP bloqueador window.closed usando o fluxo do popup.
 *
 * Chama initializeFirebase() internamente — não depende de nenhuma outra
 * função ter rodado antes. Pode ser chamada isoladamente com segurança.
 */
export const signInWithGooglePopup = async (): Promise<
  string | UserCredential
> => {
  await initializeFirebase();
  const { signInWithPopup } = await import("firebase/auth");

  const result = await signInWithPopup(firebaseAuth, googleRedirectProvider);
  return (await result.user?.getIdToken()) || result;
};

/**
 * Redireciona o usuário para a página de login do Google.
 * A página atual é descartada nessa chamada — quem chama não deve esperar
 * nada de volta aqui. O resultado só chega depois, via
 * getGoogleRedirectResult(), no próximo mount da página (ver useEffect em
 * Login.tsx).
 */
export const signInWithGoogleRedirect = async (): Promise<void> => {
  await initializeFirebase();
  const { signInWithRedirect } = await import("firebase/auth");
  await signInWithRedirect(firebaseAuth, googleRedirectProvider);
};

/**
 * Assina mudanças no estado de autenticação do Firebase. Ao contrário de
 * getGoogleRedirectResult(), que só funciona se chamado no exato instante
 * certo, este listener dispara assim que o Firebase termina de consolidar
 * o estado — seja de um redirect recém-concluído, seja de uma sessão já
 * persistida no IndexedDB. Resolve a corrida entre o mount da página e a
 * restauração assíncrona da sessão.
 *
 * Retorna uma Promise da função de "unsubscribe" (e não a função direto),
 * porque `onAuthStateChanged` só pode ser importado dinamicamente — e um
 * dynamic import é sempre assíncrono. Isso mantém o code-splitting 100%
 * intacto, sem exceções. O useEffect que consome esta função precisa
 * tratar o cleanup como assíncrono (ver Login.tsx).
 */
export const onGoogleAuthStateChanged = async (
  callback: (user: User | null) => void,
): Promise<() => void> => {
  await initializeFirebase();
  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(firebaseAuth, callback);
};

/**
 * Deve ser chamada no mount da página de login (useEffect), sempre.
 * Se o usuário acabou de voltar do redirect do Google, retorna o Firebase
 * ID Token pra mandar em POST /auth/google (RF-52). Se não há redirect
 * pendente (visita normal da página), retorna null — chamada é barata
 * nesse caso, não precisa de guarda extra pra evitar rodar.
 */
export const getGoogleRedirectResult = async (): Promise<string | null> => {
  await initializeFirebase();
  const { getRedirectResult } = await import("firebase/auth");
  const result = await getRedirectResult(firebaseAuth);
  if (!result) return null;
  return result.user.getIdToken();
};

// função signOut do firebase
export const firebaseAuthSignOut = async (): Promise<void> => {
  await initializeFirebase();
  const { signOut } = await import("firebase/auth");
  await signOut(firebaseAuth);
};

// Exporta função de inicialização para ser chamada explicitamente se necessário
export { initializeFirebase };
