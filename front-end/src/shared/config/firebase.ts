// firebase.ts — inicialização do Firebase Authentication no cliente.
// Só é usado para a ETAPA de login com Google (GoogleAuthProvider); o
// resto da aplicação (produtos, carrinho, pedidos) nunca importa daqui.
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
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
const googleProvider = new GoogleAuthProvider();

/**
 * Abre o popup do Google, autentica, e retorna o Firebase ID Token —
 * é esse token (não o usuário do Firebase) que vai para o backend em
 * POST /auth/google (RF-52). O backend nunca vê o objeto de usuário do
 * Firebase diretamente, só o token assinado que ele mesmo verifica.
 */
export const signInWithGooglePopup = async (): Promise<string> => {
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user.getIdToken();
};
