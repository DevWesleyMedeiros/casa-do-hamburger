import { z } from 'zod';
import type { AnalyticsPeriod } from '../../types/AdminAnalytics';

export const analyticsPeriodSchema = z
  .object({ from: z.iso.date(), to: z.iso.date() })
  .refine(
    ({ from, to }) =>
      from >= '2000-01-01' &&
      to <= '2100-12-31' &&
      to > from &&
      (Date.parse(to) - Date.parse(from)) / 86_400_000 <= 366,
    { message: 'Informe início e fim exclusivo válidos, entre 2000 e 2100, com até 366 dias.' },
  );

export function recentAnalyticsPeriod(days: 7 | 30, now = new Date()): AnalyticsPeriod {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  const today = Date.parse(`${part('year')}-${part('month')}-${part('day')}`);
  return {
    from: new Date(today - (days - 1) * 86_400_000).toISOString().slice(0, 10),
    to: new Date(today + 86_400_000).toISOString().slice(0, 10),
  };
}

export { formatCurrency as analyticsCurrency } from './currency';
export const analyticsDate = (date: string): string => date.split('-').reverse().join('/');
