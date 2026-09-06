/**
 * Configuração do Firebase Admin SDK — usado exclusivamente para verificar
 * o Firebase ID Token enviado pelo frontend após o login com Google
 * (RF-52, RN-AUTH-08).
 *
 * lê variáveis de ambiente, valida se estão presentes, nunca expõe a service account fora deste módulo.
 *
 * RNF-24 (revisado v1.8.0): sob Firebase Authentication não existe
 * CLIENT_SECRET de OAuth manuseado pelo projeto — a credencial sensível
 * aqui é a Service Account do Firebase Admin. Ela nunca deve ir para o frontend nem ser commitada — só existe como variável de ambiente do backend (Railway).
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
let firebaseApp: App

export const getFirebaseApp = (): App => {
  if (firebaseApp) return firebaseApp

  // já inicializado (ex.: hot-reload em dev com tsx --watch)
  const existing = getApps()
  if (existing.length > 0) {
    firebaseApp = existing[0] as App
    return firebaseApp
  }

  const projectId = process.env['FIREBASE_PROJECT_ID']
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL']
  // no .env a chave vem com \n escapado — precisa converter para quebra de linha real
  const privateKey = process.env['FIREBASE_PRIVATE_KEY']?.replaceAll(String.raw`\n`, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Variáveis de ambiente do Firebase Admin ainda não foram configuradas ' +
        '(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)',
    )
  }

  firebaseApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })

  return firebaseApp
}

// Wrapper fino — quem consome (googleAuth.service.ts). Ele não precisa saber como o Firebase Admin foi inicializado, só chama verifyIdToken.
export const verifyFirebaseIdToken = async (idToken: string) => {
  const auth = getAuth(getFirebaseApp())
  // checkRevoked=true consulta o Firebase se o token foi revogado
  // (ex.: usuário deslogado de todos os dispositivos) — mais uma chamada de rede, mas fecha uma janela de reuso de token roubado
  return auth.verifyIdToken(idToken, true)
  // varifyIdToken - Verifica um token de ID do Firebase (JWT). Se o token for válido, a promise é resolvida com as claims decodificadas do token; caso contrário, a promise é rejeitada.
}
