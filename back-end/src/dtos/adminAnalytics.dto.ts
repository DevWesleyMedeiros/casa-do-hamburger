import type { OrderStatus } from '../../generated/prisma/index.js';

export interface AdminAnalyticsDTO {
  period: { from: string; to: string; timeZone: 'America/Sao_Paulo' };
  orders: { total: number; byStatus: Record<OrderStatus, number>; nonCancelled: number };
  amounts: { orderValueInCents: number; averageTicketInCents: number };
  series: { date: string; orders: number; orderValueInCents: number }[];
}

export interface AnalyticsAggregate {
  date: string;
  status: OrderStatus;
  count: bigint;
  value: bigint;
}
