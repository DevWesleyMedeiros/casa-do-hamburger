import type { Request, Response } from 'express'
import { passwordResetService } from '../services/passwordReset.service.js'
import type { ForgotPasswordInput, ResetPasswordInput } from '../schemas/passwordReset.schema.js'

// req.body já chega validado pelo middleware validateBody(schema) aplicado na rota

const GENERIC_MESSAGE = `Se o e-mail informado estiver cadastrado, você receberá um link de redefinição em instantes.`

// controller responsável por receber do body o e-mail (quando eu clicar no link forgot-password, eu passo um email num input e o envio por uma requisição. Esse email é capiturado aqui) e envia um email com o link de redefinição de senha
export const passwordResetController = {
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body as ForgotPasswordInput
    await passwordResetService.requestPasswordReset(email)
    // RN-AUTH-15: resposta idêntica sempre — e-mail existindo ou não
    return res.status(200).json({ message: GENERIC_MESSAGE })
  },

  // controller responsável por receber do body o token e a nova senha (quando eu clicar no link reset-password, eu passo um token
  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body as ResetPasswordInput

    const result = await passwordResetService.resetPassword(token, newPassword)

    if (result === 'invalid_token') {
      return res
        .status(400)
        .json({ message: 'Token inválido ou expirado. Solicite uma nova redefinição.' })
    }
    return res
      .status(200)
      .json({ message: 'Senha redefinida com sucesso. Faça login com a nova senha' })
  },
}
