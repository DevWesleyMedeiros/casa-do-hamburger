import { describe, expect, it, vi } from 'vitest';
import { adminAnalyticsQuerySchema } from '../../schemas/adminAnalytics.schema.js';
import {
  createAdminAnalyticsService,
  toAdminAnalyticsDTO,
} from '../../services/analytics/adminAnalytics.service.js';
import type { AnalyticsAggregate } from '../../dtos/adminAnalytics.dto.js';

vi.mock('../../repositories/adminAnalytics.repository.js', () => ({
  adminAnalyticsRepository: {},
}));
const period = { from: '2026-01-01', to: '2026-01-04' };
const rows: AnalyticsAggregate[] = [
  { date: '2026-01-01', status: 'PENDING', count: 2n, value: 101n },
  { date: '2026-01-01', status: 'CANCELLED', count: 3n, value: 9000n },
  { date: '2026-01-03', status: 'DELIVERED', count: 1n, value: 200n },
];

describe('RF-44 regras e DTO', () => {
  it('conta cancelados, exclui seu valor e arredonda ticket em centavos com inteiros', () => {
    const dto = toAdminAnalyticsDTO(period, rows);
    expect(dto.orders).toEqual({
      total: 6,
      nonCancelled: 3,
      byStatus: { PENDING: 2, PREPARING: 0, READY: 0, CANCELLED: 3, DELIVERED: 1 },
    });
    expect(dto.amounts).toEqual({ orderValueInCents: 301, averageTicketInCents: 100 });
    expect(toAdminAnalyticsDTO(period, rows.slice(0, 1)).amounts.averageTicketInCents).toBe(51);
    expect(dto.series).toEqual([
      { date: '2026-01-01', orders: 5, orderValueInCents: 101 },
      { date: '2026-01-02', orders: 0, orderValueInCents: 0 },
      { date: '2026-01-03', orders: 1, orderValueInCents: 200 },
    ]);
    expect(JSON.parse(JSON.stringify(dto))).toEqual(dto);
    expect(Object.keys(dto)).toEqual(['period', 'orders', 'amounts', 'series']);
  });
  it('retorna zeros sem pedidos ou somente com cancelados', () => {
    for (const data of [[], [rows[1]!]]) {
      const dto = toAdminAnalyticsDTO(period, data);
      expect(dto.amounts).toEqual({ orderValueInCents: 0, averageTicketInCents: 0 });
      expect(dto.orders.nonCancelled).toBe(0);
      expect(dto.series).toHaveLength(3);
    }
  });
  it('não perde precisão acima de int32 e rejeita saída insegura', () => {
    const row = { ...rows[0]!, value: 4_000_000_001n };
    expect(toAdminAnalyticsDTO(period, [row]).amounts.averageTicketInCents).toBe(2_000_000_001);
    expect(() =>
      toAdminAnalyticsDTO(period, [{ ...row, value: BigInt(Number.MAX_SAFE_INTEGER) + 1n }]),
    ).toThrow('Métrica fora do limite suportado');
  });
  it.each([
    {},
    { from: '2026-02-30', to: '2026-03-02' },
    { from: '2026-01-01T00:00:00Z', to: period.to },
    { from: period.to, to: period.from },
    { from: period.from, to: period.from },
    { from: ['2026-01-01'], to: period.to },
    { from: '2025-01-01', to: '2026-01-03' },
    { from: '1999-12-31', to: period.to },
    { ...period, admin: 'true' },
  ])('rejeita filtros inválidos %j', async (input) => {
    const aggregate = vi.fn();
    await expect(createAdminAnalyticsService({ aggregate }).summary(input)).rejects.toThrow();
    expect(aggregate).not.toHaveBeenCalled();
  });
  it('aceita ano bissexto e limite de 366 dias com fim exclusivo', () => {
    expect(adminAnalyticsQuerySchema.parse({ from: '2024-01-01', to: '2025-01-01' })).toEqual({
      from: '2024-01-01',
      to: '2025-01-01',
    });
    expect(
      toAdminAnalyticsDTO({ from: '2024-02-28', to: '2024-03-01' }, []).series.map(
        (row) => row.date,
      ),
    ).toEqual(['2024-02-28', '2024-02-29']);
  });
});
