/**
 * Camada de regra de negócio do login social via Google (RF-51 a RF-55).
 *
 * Responsabilidades (mesmo espírito de auth.service.ts):
 * - Verificar o Firebase ID Token recebido do frontend (nunca confiar em dado de identidade cru vindo do corpo da requisição — RF-52).
 * - Fazer find-or-create do usuário (RF-53).
 * - Aplicar o gate de segurança RN-AUTH-11 antes de vincular automaticamente uma conta Google a uma conta LOCAL já existente com o mesmo e-mail.
 * - Emitir exatamente o mesmo JWT de sessão (jose) que o login local emite (RF-55) — este service reaproveita toJwtPayloadDTO, a mesma função
 usada em auth.service.ts, para garantir que os dois fluxos nunca divirjam no formato do payload de sessão.
 
 */
import * as jose from 'jose'
import type { User } from '../../../generated/prisma/index.js'
import { verifyFirebaseIdToken } from '../../config/firebaseAdmin.js'
import { getJwtSecret } from '../../config/jwt.js'
import { prisma } from '../../db.js'
import { toJwtPayloadDTO } from '../../dtos/toJwtPayloadDTO.js'
import { AppError } from '../../errors/AppError.js'
import { googleAuthTargetedStore } from '../../middlewares/stores/googleAuthTargetStore.js'
import { userRepository } from '../../repositories/user.repository.js'

// Aplica rate limiting direcionado por UID do Google após decodificar o token
async function checkGoogleTargetedRateLimit(uid: string): Promise<void> {
  const key = uid
  const { totalHits, resetTime } = await googleAuthTargetedStore.increment(key)

  if (totalHits > 5) {
    const retryAfter = Math.ceil((resetTime?.getTime() || 0 - Date.now()) / 1000)
    throw new AppError(
      429,
      `Muitas tentativas de login para esta conta. Tente novamente em ${retryAfter} segundos.`,
    )
  }
}

export const googleAuthService = {
  loginWithGoogle: async (idToken: string) => {
    // RF-52 / RN-AUTH-08: verificação server-side obrigatória — assinatura,
    // iss, aud e exp são checados dentro de verifyFirebaseIdToken (delegado
    // iss, aud e exp, essas três siglas são reivindicações (claims) padrão de um JWT (JSON Web Token). No Firebase, elas servem para garantir a segurança e a validade da autenticação.
    // Aqui está o significado direto de cada uma:
    // iss (Issuer / Emissor): Identifica quem gerou o token. No Firebase, o valor sempre aponta para o servidor do Google (ex: https://google.com).
    // aud (Audience / Público-alvo): Identifica para quem o token foi emitido. O valor deve ser exatamente o ID do seu projeto Firebase, garantindo que o token não seja usado em outro aplicativo.
    // exp (Expiration Time / Tempo de Expiração): Define o momento exato em que o token deixa de ser válido. No Firebase, os tokens de ID duram exatamente 1 hora após a sua criação.
    // ao firebase-admin, nunca reimplementado à mão aqui).
    let decoded: Awaited<ReturnType<typeof verifyFirebaseIdToken>>
    // typeof verifyFirebaseIdToken: Pega a assinatura/tipo da função em si.
    // ReturnType<...>: Extrai o tipo de retorno que essa função entrega. Como a função é assíncrona, o retorno dela é uma Promise<DadosDoUsuario>.
    // Awaited<...>: Desembrulha a Promise. Se o retorno era Promise<DadosDoUsuario>, o Awaited transforma isso apenas em DadosDoUsuario (o valor real que sobra após o await).
    // O código valida o token do usuário e salva o resultado na variável decoded. Graças à tipagem utilizada, se você digitar decoded. no seu editor de código, o autocomplete mostrará exatamente as propriedades que existem dentro do token (como uid, email, name, etc.), mantendo seu código seguro e livre de erros de digitação.
    try {
      decoded = await verifyFirebaseIdToken(idToken)
      console.log('[GoogleAuth] Token Firebase verificado com sucesso')

      // Aplica rate limiting direcionado por UID (RN-AUTH-12)
      await checkGoogleTargetedRateLimit(decoded.uid)
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('[GoogleAuth] Erro ao verificar token Firebase')
      throw new AppError(401, 'Autenticação com Google inválida ou expirada')
    }

    if (!decoded.email) {
      throw new AppError(400, 'Conta Google sem e-mail associado')
    }

    // Verifica se usuário já tem vínculo com esse Firebase UID
    const byFirebaseUid = await userRepository.findByFirebaseUid(decoded.uid)
    if (byFirebaseUid) {
      console.log('[GoogleAuth] Login realizado para usuário vinculado existente')
      return { user: byFirebaseUid, token: await signSessionJwt(byFirebaseUid) }
    }

    // Usa upsert atômico para evitar condições de corrida na criação/vinculação de contas, uma vez que nesse repositório, eu atualizo ou crio novo user.
    // O fluxo findByEmail + create pode causar duplicatas se duas requisições chegarem ao mesmo tempo
    const user = await prisma.user.upsert({
      where: { email: decoded.email },
      update: {
        // Se já existir a conta (local), vincula o firebaseUid apenas se o e-mail estiver verificado
        ...(decoded.email_verified === true ? { firebaseUid: decoded.uid } : {}),
      },
      create: {
        // Se não existir, cria a conta Google diretamente
        name: decoded['name'] ?? decoded.email.split('@')[0] ?? 'Usuário Google',
        email: decoded.email,
        firebaseUid: decoded.uid,
        emailVerified: decoded.email_verified ?? false,
        emailVerifiedAt: decoded.email_verified ? new Date() : null,
        provider: 'GOOGLE',
        cep: '',
      },
    })

    // Se a conta já existia e tentamos vincular sem que o e-mail estivesse verificado
    if (user.firebaseUid !== decoded.uid && decoded.email_verified !== true) {
      throw new AppError(
        409,
        'Já existe uma conta com este e-mail. Faça login pela senha local ' +
          'ou verifique seu e-mail no Google antes de tentar novamente.',
      )
    }

    console.log('[GoogleAuth] Autenticação Google processada com sucesso')
    return { user, token: await signSessionJwt(user) }
  },
}

// Extraído porque os 3 branches acima (login direto, criação, vínculo) terminam do mesmo jeito: assinar o MESMO formato de JWT que o login local usa (RF-55) — repetir esse bloco 3x seria a violação de DRY que o que desrespeitaria o Clean Code da skill de arquitetura pede pra evitar
async function signSessionJwt(user: User): Promise<string> {
  return new jose.SignJWT(toJwtPayloadDTO(user))
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret())
}
