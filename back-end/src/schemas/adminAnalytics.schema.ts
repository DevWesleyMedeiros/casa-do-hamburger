import { z } from 'zod';

export const ANALYTICS_TIME_ZONE = 'America/Sao_Paulo';
export const MAX_ANALYTICS_DAYS = 366;
const day = z.iso.date().refine((value) => value >= '2000-01-01' && value <= '2100-12-31', {
  message: 'Use uma data entre 2000 e 2100',
});

export const adminAnalyticsQuerySchema = z
  .strictObject({ from: day, to: day })
  .superRefine(({ from, to }, context) => {
    const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
    if (!(days > 0 && days <= MAX_ANALYTICS_DAYS)) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'O fim deve ser posterior ao início, com intervalo de até 366 dias',
      });
    }
  });

export type AnalyticsPeriod = z.infer<typeof adminAnalyticsQuerySchema>;
