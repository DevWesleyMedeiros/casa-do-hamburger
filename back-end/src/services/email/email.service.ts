/**
 * Contrato desacoplado de provedor de e-mail (RNF-27).
 * Qualquer implementação (Resend, SES, etc.) deve satisfazer esta interface,
 * para que trocar de provedor no futuro não exija mudar chamadores.
 */

export interface EmailService {
  // Envia e-mail de redefinição de senha
  sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string }): Promise<void>;
  // Envia e-mail genérico (usado para notificações de pedido)
  sendGenericEmail(params: { to: string; subject: string; html: string }): Promise<void>;
}
