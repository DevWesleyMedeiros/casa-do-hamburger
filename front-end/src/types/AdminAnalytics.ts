import { z } from 'zod';

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const adminAnalyticsSchema = z.object({
  period: z.object({
    from: z.iso.date(),
    to: z.iso.date(),
    timeZone: z.literal('America/Sao_Paulo'),
  }),
  orders: z.object({
    total: integer,
    byStatus: z.object({
      PENDING: integer,
      PREPARING: integer,
      READY: integer,
      DELIVERED: integer,
      CANCELLED: integer,
    }),
    nonCancelled: integer,
  }),
  amounts: z.object({ orderValueInCents: integer, averageTicketInCents: integer }),
  series: z
    .array(z.object({ date: z.iso.date(), orders: integer, orderValueInCents: integer }))
    .max(366),
});
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;
export interface AnalyticsPeriod {
  from: string;
  to: string;
}
