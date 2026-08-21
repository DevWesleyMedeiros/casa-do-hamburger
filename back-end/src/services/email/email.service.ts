/**
 * Contrato desacoplado de provedor de e-mail (RNF-27).
 * Qualquer implementação (Resend, SES, etc.) deve satisfazer esta interface,
 * para que trocar de provedor no futuro não exija mudar chamadores.
 */

// responsável por enviar e-mails de redefinição de senha; to = destinatário; name = nome do usuário; resetUrl = url de redefinição de senha
export interface EmailService {
  sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string }): Promise<void>
}
