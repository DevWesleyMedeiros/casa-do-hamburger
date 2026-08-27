import { Resend } from 'resend'
import type { EmailService } from './email.service.ts'

// RNF-27: chave de API só em variável de ambiente, nunca hardcoded
const resend = new Resend(process.env['RESEND_API_KEY'])

const FROM_EMAIL =
  process.env['RESEND_FROM_EMAIL'] ?? 'Casa do Hambúrguer <no-reply@casadohamburguer.com>'

export const resendEmailService: EmailService = {
  async sendPasswordResetEmail({ to, name, resetUrl }) {
    const { error } = await resend.emails.send(
      {
        from: FROM_EMAIL,
        to: [to],
        subject: 'Redefinição de senha — Casa do Hambúrguer',
        html: `
          <p>Olá, ${name}.</p>
          <p>Recebemos uma solicitação para redefinir sua senha. O link abaixo expira em
          30 minutos e só pode ser usado uma vez.</p>
          <p><a href="${resetUrl}">Redefinir minha senha</a></p>
          <p>Se você não solicitou isso, ignore este e-mail — sua senha continua a mesma.</p>
        `,
      },
      // idempotencyKey evita reenvio duplicado em caso de retry de rede
      { idempotencyKey: `password-reset/${to}/${Date.now()}` },
    )

    if (error) {
      // Nunca propagar o erro cru para o controller: a resposta ao cliente continua genérica (RN-AUTH-15) independentemente de o envio falhar.
      console.error('[EmailService] Falha ao enviar e-mail de redefinição de senha', error)
      throw new Error('EMAIL_SEND_FAILED')
    }
  },
}
