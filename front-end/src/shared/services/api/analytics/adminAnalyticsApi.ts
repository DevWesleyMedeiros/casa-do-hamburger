import {
  adminAnalyticsSchema,
  type AnalyticsPeriod,
  type AdminAnalytics,
} from '../../../../types/AdminAnalytics';
import { api } from '../ApiConfig';

export async function getAdminAnalytics(
  period: AnalyticsPeriod,
  signal?: AbortSignal,
): Promise<AdminAnalytics> {
  const { data } = await api.get<unknown>('/admin/analytics/summary', { params: period, signal });
  return adminAnalyticsSchema.parse(data);
}
