// orderStateMachine.service candidata a teste unitário do projeto por causa da lógica crítica, fácil de quebrar sem perceber, e fácil de testar isolada.

import { describe, expect, it } from 'vitest'

import type { OrderStatus } from '../../../generated/prisma/index.js'
import {
  InvalidOrderTransitionError,
  OrderService,
} from '../../services/orderStateMachine.service.js'

describe('orderStateMachine — RN-ORDER-05', () => {
  it.each<[OrderStatus, OrderStatus, boolean]>([
    ['PENDING', 'PREPARING', true],
    ['PENDING', 'CANCELLED', true],
    ['PREPARING', 'READY', true],
    ['PREPARING', 'CANCELLED', true],
    ['READY', 'DELIVERED', true],
  ])('permite %s → %s', (from, to, expected) => {
    expect(OrderService.isValidTransition(from, to)).toBe(expected)
  })

  it.each<[OrderStatus, OrderStatus]>([
    ['DELIVERED', 'PENDING'],
    ['CANCELLED', 'PREPARING'],
    ['PENDING', 'READY'], // não pode pular etapa
    ['PENDING', 'DELIVERED'],
    ['READY', 'PREPARING'], // não pode voltar
  ])('rejeita %s → %s', (from, to) => {
    expect(OrderService.isValidTransition(from, to)).toBe(false)
  })

  it('rejeita transição para o mesmo status (no-op) explícito', () => {
    expect(OrderService.isValidTransition('PENDING', 'PENDING')).toBe(false)
  })

  it('assertValidTransition lança um InvalidOrderTransitionError (422) em transição inválida', () => {
    expect(() => OrderService.assertValidTransition('READY', 'PREPARING')).toThrow(
      InvalidOrderTransitionError,
    )
  })
  describe('canCustomerCancel - RF-40 (janela de cancelamento)', () => {
    it('permite cancelamento pelo cliente apenas em PENDING', () => {
      const statuses: [OrderStatus, OrderStatus, OrderStatus, OrderStatus, OrderStatus] = [
        'PENDING',
        'PREPARING',
        'READY',
        'DELIVERED',
        'CANCELLED',
      ]
      expect(OrderService.canCustomerCancel(statuses[0])).toBe(true)
      expect(OrderService.canCustomerCancel(statuses[1])).toBe(false)
      expect(OrderService.canCustomerCancel(statuses[2])).toBe(false)
      expect(OrderService.canCustomerCancel(statuses[3])).toBe(false)
      expect(OrderService.canCustomerCancel(statuses[4])).toBe(false)
    })
  })
})
