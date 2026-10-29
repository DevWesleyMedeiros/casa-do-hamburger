import { Prisma } from '../../generated/prisma/index.js';
import { prisma } from '../db.js';
import type { AnalyticsAggregate } from '../dtos/adminAnalytics.dto.js';
import { ANALYTICS_TIME_ZONE, type AnalyticsPeriod } from '../schemas/adminAnalytics.schema.js';

// Uma instrução: snapshot consistente, somas bigint e no máximo 5 × 366 grupos.
// Prisma DateTime é timestamp sem fuso, armazenado em UTC.
export function analyticsAggregationQuery({ from, to }: AnalyticsPeriod): Prisma.Sql {
  return Prisma.sql`
    SELECT to_char("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${ANALYTICS_TIME_ZONE},
                   'YYYY-MM-DD') AS "date",
           "status",
           COUNT(*)::bigint AS "count",
           COALESCE(SUM("total") FILTER (WHERE "status" <> 'CANCELLED'), 0)::bigint AS "value"
    FROM "Order"
    WHERE "createdAt" >= (${from}::date::timestamp AT TIME ZONE ${ANALYTICS_TIME_ZONE}) AT TIME ZONE 'UTC'
      AND "createdAt" < (${to}::date::timestamp AT TIME ZONE ${ANALYTICS_TIME_ZONE}) AT TIME ZONE 'UTC'
    GROUP BY 1, "status"
    ORDER BY 1, "status"
  `;
}

export const adminAnalyticsRepository = {
  aggregate: (period: AnalyticsPeriod): Promise<AnalyticsAggregate[]> =>
    prisma.$queryRaw<AnalyticsAggregate[]>(analyticsAggregationQuery(period)),
};
