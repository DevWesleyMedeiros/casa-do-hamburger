/**
 * Controller HTTP do login social via Google — único responsável por
 * Reaproveita literalmente as mesmas opções de cookie do login local
 * (httpOnly, secure condicional a NODE_ENV, sameSite, maxAge de 7 dias) — é assim que RF-55 fica garantido no código, não só na regra de negócio.
 */
import type { Request, Response } from 'express'
import { toUserDTO } from '../dtos/user.dto.js'
import { googleAuthService } from '../services/google/googleAuth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const googleAuthController = {
  loginWithGoogle: asyncHandler(async (req: Request, res: Response) => {
    // no frontend, quando eu clicar no botão de cadastrar com Google, eu registro no app do Firebase e retorno um credential e um tokenJWT. No Firebase Auth, o objeto UserCredential é o resultado retornado após um login ou cadastro bem-sucedido. Ele serve como um contêiner que agrupa os dados do usuário, o token de acesso e informações do provedor de autenticação.Para obter o Firebase ID Token (o token JWT necessário para enviar ao seu servidor), você precisa chamar o método getIdToken() a partir do objeto de usuário contido nesse UserCredential.
    const { idToken } = req.body

    // verifica o token do Firebase ID Token
    if (!idToken) {
      throw new Error('idToken não enviado')
    }
    const { token, user } = await googleAuthService.loginWithGoogle(idToken)

    // gerar um cookie de sessão após decodificarmos o JWT vindo do Firebase
    res.cookie('user_section', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 1000,
    })
    res.json({ token, user: toUserDTO(user) })
  }),
}
