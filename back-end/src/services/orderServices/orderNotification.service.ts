// src/services/orders/orderNotification.service.ts

import type { OrderStatus } from '../../../generated/prisma/index.js';
import type { EmailService } from '../email/email.service.js';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'recebido',
  PREPARING: 'em preparo',
  READY: 'pronto para retirada/entrega',
  DELIVERED: 'entregue',
  CANCELLED: 'cancelado',
};

interface NotifyParams {
  to: string;
  orderId: string;
  status: OrderStatus;
}

/**
 * Envio "best-effort": uma falha no envio de e-mail NUNCA deve derrubar a
 * atualização de status do pedido (efeito colateral, não parte da transação).
 *
 * Recebe o EmailService por injeção (DIP) — o chamador passa a MESMA
 * instância já usada na RF-09, sem criar um novo client Resend aqui.
 */
export async function notifyOrderStatusChanged(
  emailService: EmailService,
  { to, orderId, status }: NotifyParams,
): Promise<void> {
  const label = STATUS_LABEL[status];
  const shortId = orderId.slice(0, 8);

  try {
    await emailService.sendGenericEmail({
      to,
      subject: `Pedido #${shortId} atualizado: ${label}`,
      html: `<p>Olá! Seu pedido <strong>#${shortId}</strong> agora está: <strong>${label}</strong>.</p>
             <p>Agradecemos pela preferência!</p>`,
    });
    console.log(`Notificação de status enviada com sucesso para pedido #${shortId}`);
  } catch (error) {
    console.error(`Falha ao enviar notificação para pedido #${shortId}:`, error);
  }
}
