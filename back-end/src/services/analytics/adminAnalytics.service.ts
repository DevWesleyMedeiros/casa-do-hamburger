import type { AdminAnalyticsDTO, AnalyticsAggregate } from '../../dtos/adminAnalytics.dto.js';
import { AppError } from '../../errors/AppError.js';
import { adminAnalyticsRepository } from '../../repositories/adminAnalytics.repository.js';
import {
  ANALYTICS_TIME_ZONE,
  adminAnalyticsQuerySchema,
  type AnalyticsPeriod,
} from '../../schemas/adminAnalytics.schema.js';

function safeInteger(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new AppError(500, 'Métrica fora do limite suportado');
  }
  return Number(value);
}

export function toAdminAnalyticsDTO(
  period: AnalyticsPeriod,
  aggregates: AnalyticsAggregate[],
): AdminAnalyticsDTO {
  const byStatus = { PENDING: 0, PREPARING: 0, READY: 0, DELIVERED: 0, CANCELLED: 0 };
  const daily = new Map<string, { count: bigint; value: bigint }>();
  let count = 0n;
  let cancelled = 0n;
  let value = 0n;
  for (const row of aggregates) {
    byStatus[row.status] = safeInteger(BigInt(byStatus[row.status]) + row.count);
    count += row.count;
    if (row.status === 'CANCELLED') cancelled += row.count;
    // Defesa adicional: cancelados nunca compõem valores, mesmo com adapter alternativo.
    const includedValue = row.status === 'CANCELLED' ? 0n : row.value;
    value += includedValue;
    const previous = daily.get(row.date) ?? { count: 0n, value: 0n };
    daily.set(row.date, {
      count: previous.count + row.count,
      value: previous.value + includedValue,
    });
  }
  const nonCancelled = count - cancelled;
  const average = nonCancelled === 0n ? 0n : (value * 2n + nonCancelled) / (2n * nonCancelled);
  const series: AdminAnalyticsDTO['series'] = [];
  for (let date = Date.parse(period.from); date < Date.parse(period.to); date += 86_400_000) {
    const label = new Date(date).toISOString().slice(0, 10);
    const row = daily.get(label);
    series.push({
      date: label,
      orders: safeInteger(row?.count ?? 0n),
      orderValueInCents: safeInteger(row?.value ?? 0n),
    });
  }
  return {
    period: { ...period, timeZone: ANALYTICS_TIME_ZONE },
    orders: { total: safeInteger(count), byStatus, nonCancelled: safeInteger(nonCancelled) },
    amounts: { orderValueInCents: safeInteger(value), averageTicketInCents: safeInteger(average) },
    series,
  };
}

export function createAdminAnalyticsService(repository: {
  aggregate: (period: AnalyticsPeriod) => Promise<AnalyticsAggregate[]>;
}) {
  return {
    summary: async (input: unknown): Promise<AdminAnalyticsDTO> => {
      const period = adminAnalyticsQuerySchema.parse(input);
      return toAdminAnalyticsDTO(period, await repository.aggregate(period));
    },
  };
}

export const adminAnalyticsService = createAdminAnalyticsService(adminAnalyticsRepository);
