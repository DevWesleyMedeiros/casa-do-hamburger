import type { OrderStatus } from '../../generated/prisma/index.js'

/**
 * O "mapa oficial" da máquina de estados.
 * Chave = status atual. Valor = lista de status para onde é permitido ir a partir dali.
 * TypeScript exige que TODAS as chaves do enum OrderStatus existam aqui — se um novo
 * status for adicionado ao enum e você esquecer de mapeá-lo, o compilador vai reclamar.
 * RN-ORDER-05 + Seção 8 (diagrama de estados) da REGRAS_DE_NEGOCIO.md
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PREPARING', 'CANCELLED'], // pedido novo: pode entrar em preparo ou ser cancelado
  PREPARING: ['READY', 'CANCELLED'], // em preparo: pode ficar pronto ou ser cancelado (só ADMIN)
  READY: ['DELIVERED'], // pronto: só pode ser entregue, nada mais
  DELIVERED: [], // estado terminal = "não existe transição válida a partir daqui"
  CANCELLED: [], // outro estado terminal — mesma lógica
}

/**
 * Erro de domínio específico para transição de status inválida.
 * Carrega o statusCode HTTP já pronto (422 Unprocessable Entity) para o controller
 * só repassar na resposta, sem precisar traduzir o tipo de erro manualmente.
 */
export class InvalidOrderTransitionError extends Error {
  readonly statusCode = 422 // Unprocessable Entity (entendido como os estados), conforme RN-ORDER-05

  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Transição inválida de status de pedido: ${from} -> ${to}`)
    this.name = 'InvalidOrderTransitionError' // facilita checar o tipo do erro em catch()
  }
}

export const OrderService = {
  /**
   * A "pergunta" central: essa transição é permitida?
   * Função PURA — mesmo from/to sempre devolve o mesmo boolean, sem lançar erro
   * e sem efeito colateral. Pode ser testada sem try/catch.
   */
  isValidTransition: (from: OrderStatus, to: OrderStatus): boolean => {
    if (from === to) return false
    // ficar no mesmo status não é uma transição — é um no-op, e é rejeitado explicitamente
    return ALLOWED_TRANSITIONS[from].includes(to)
  },

  /**
   * A "guarda": usa isValidTransition por dentro, mas transforma o resultado
   * em uma decisão de fluxo (fail-fast). Função IMPURA — pode lançar exceção,
   * então é testada com expect(() => ...).toThrow(...).
   */
  assertValidTransition: (from: OrderStatus, to: OrderStatus): void => {
    if (!OrderService.isValidTransition(from, to)) {
      throw new InvalidOrderTransitionError(from, to)
    }
  },

  /**
   * RF-40 — janela de cancelamento pelo próprio cliente.
   * Cliente comum só pode cancelar enquanto o pedido ainda não entrou em preparo ("PREPARING").
   * Cancelamento em PREPARING é "excepcional" e reservado a ADMIN
   * (ver Seção 8 da doc e cancelOrder em order.service.ts).
   *
   * Nota: essa função responde "o estado permite isso?" — ela NÃO checa
   * se quem está pedindo é de fato o cliente dono do pedido. Isso é
   * responsabilidade de autorização, feita em outra camada.
   */
  canCostumerCancel: (orderStatus: OrderStatus): boolean => {
    return orderStatus === 'PENDING'
  },
}
