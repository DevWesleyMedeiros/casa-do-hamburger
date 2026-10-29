import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../constant/queryKeys';
import { getAuditLogs } from '../shared/services/api/audit/auditApi';
import type { AuditFilters } from '../types/AuditLog';
import { useMe } from './useMe';

export function useAuditLogs(filters: AuditFilters) {
  const { data: user } = useMe();
  return useQuery({
    queryKey: queryKeys.auditFor(user?.id, user?.admin ?? false, filters),
    queryFn: ({ signal }) => getAuditLogs(filters, signal),
    enabled: user?.admin === true,
    staleTime: 10_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
