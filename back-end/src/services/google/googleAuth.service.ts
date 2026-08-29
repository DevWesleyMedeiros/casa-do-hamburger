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
import { toJwtPayloadDTO } from '../../dtos/toJwtPayloadDTO.js'
import { AppError } from '../../errors/AppError.js'
import { userRepository } from '../../repositories/user.repository.js'

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
      // Chama uma função do Firebase Admin SDK, verifyIdToken, para verifica o token do usuário é valido.
    } catch {
      // Token expirado, assinatura inválida, revogado, ou malformado — todos os casos viram a mesma resposta genérica pro cliente (não vale a pena diferenciar: não é dado sensível de conta, é sempre "tenta de novo o login com Google").
      throw new AppError(401, 'Autenticação com Google inválida ou expirada')
    }

    if (!decoded.email) {
      // Contas Google sem e-mail associado existem (raro, mas existem) —
      // o sistema depende de e-mail como identificador único (User.email), então não há como prosseguir.
      throw new AppError(400, 'Conta Google sem e-mail associado')
    }

    // Já existe usuário vinculado a esse firebaseUid? → login direto,
    // não passa pelo RN-AUTH-11 de novo (o vínculo já foi decidido antes).
    const byFirebaseUid = await userRepository.findByFirebaseUid(decoded.uid)
    if (byFirebaseUid) {
      return { user: byFirebaseUid, token: await signSessionJwt(byFirebaseUid) }
    }

    // Primeira vez desse firebaseUid — procura por e-mail para decidir
    // entre "criar conta nova" (RF-53) e "vincular a existente" (RF-54).
    const byEmail = await userRepository.findByEmail(decoded.email)

    if (!byEmail) {
      const newUser = await userRepository.createFromGoogle({
        name: decoded['name'] ?? decoded.email.split('@')[0] ?? 'Usuário Google',
        email: decoded.email,
        firebaseUid: decoded.uid,
        emailVerified: decoded.email_verified ?? false,
      })
      return { user: newUser, token: await signSessionJwt(newUser) }
    }

    // Já existe conta LOCAL com esse e-mail — RN-AUTH-11: só vincula automaticamente se o Google confirmar que o e-mail é verificado.
    // Sem esse gate, alguém poderia criar uma conta Google com um e-mail que não controla e sequestrar a conta local existente (account takeover) — é exatamente o achado da auditoria de arquitetura no Miro (frame "8. Auditoria de Arquitetura").
    if (decoded.email_verified !== true) {
      throw new AppError(
        409,
        'Já existe uma conta com este e-mail. Faça login pela senha local ' +
          'ou verifique seu e-mail no Google antes de tentar novamente.',
      )
    }

    const linkedUser = await userRepository.linkGoogleIdentity(byEmail.id, decoded.uid)
    return { user: linkedUser, token: await signSessionJwt(linkedUser) }
  },
}

// Extraído porque os 3 branches acima (login direto, criação, vínculo) terminam do mesmo jeito: assinar o MESMO formato de JWT que o login local usa (RF-55) — repetir esse bloco 3x seria a violação de DRY que o que desrespeitaria o Clean Code da skill de arquitetura pede pra evitar.
async function signSessionJwt(user: User): Promise<string> {
  return new jose.SignJWT(toJwtPayloadDTO(user))
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret())
}
