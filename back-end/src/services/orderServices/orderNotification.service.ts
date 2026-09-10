// Arquivo NOVO — backend/src/services/orderNotification.service.ts
//
// RF-39: notifica o cliente por e-mail em toda mudança de status.
// Reaproveita o EmailService (Resend) já criado na feature RF-09
// (RNF-27) — NÃO cria um novo client Resend aqui.
//
// ⚠️ Ajuste o import abaixo para o caminho real do EmailService da RF-09
// no seu repositório (ex.: "./email.service.ts" ou "../shared/email/...").
import type { OrderStatus } from '../../../generated/prisma/index.js'
import { EmailService } from '../email.service.js'

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'recebido',
  PREPARING: 'em preparo',
  READY: 'pronto para retirada/entrega',
  DELIVERED: 'entregue',
  CANCELLED: 'cancelado',
}

interface NotifyParams {
  to: string
  orderId: string
  status: OrderStatus
}

/**
 * Envio "best-effort": uma falha no envio de e-mail NUNCA deve derrubar a
 * atualização de status do pedido em si (o e-mail é um efeito colateral,
 * não parte da transação de negócio). Por isso o service de Order chama
 * esta função fora da transação do Prisma e apenas loga a falha.
 */
export async function notifyOrderStatusChanged({
  to,
  orderId,
  status,
}: NotifyParams): Promise<void> {
  const label = STATUS_LABEL[status]

  await EmailService.send({
    to,
    subject: `Seu pedido está ${label}`,
    html: `<p>Seu pedido <strong>#${orderId.slice(0, 8)}</strong> agora está: <strong>${label}</strong>.</p>`,
  })
}
