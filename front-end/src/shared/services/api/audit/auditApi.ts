import type { AuditFilters, AuditPage } from '../../../../types/AuditLog';
import { api } from '../ApiConfig';

export async function getAuditLogs(params: AuditFilters, signal?: AbortSignal): Promise<AuditPage> {
  const { data } = await api.get<AuditPage>('/admin/audit-logs', { params, signal });
  return data;
}
