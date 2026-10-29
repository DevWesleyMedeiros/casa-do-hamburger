import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../constant/queryKeys';
import { getAdminAnalytics } from '../shared/services/api/analytics/adminAnalyticsApi';
import type { AnalyticsPeriod } from '../types/AdminAnalytics';
import { useMe } from './useMe';

export function useAdminAnalytics(period: AnalyticsPeriod) {
  const { data: user } = useMe();
  return useQuery({
    queryKey: queryKeys.analyticsFor(user?.id, user?.admin ?? false, period.from, period.to),
    queryFn: ({ signal }) => getAdminAnalytics(period, signal),
    enabled: user?.admin === true,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: false,
  });
}
