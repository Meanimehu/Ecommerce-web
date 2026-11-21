'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type { AuditRow } from '@/features/audit/types';

/**
 * The audit log's one call, to our own /api/admin/audit-log endpoint, never to the backend
 * (D3-03). Nothing is cached for long: the log is read as it is now. Not asked while a filter has
 * the wrong shape.
 */
export const auditKeys = {
  list: (query: Query) => ['audit', 'list', query] as const,
};

export function useAuditLog(query: Query, enabled: boolean) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: () => get<Page<AuditRow>>(withQuery('/api/admin/audit-log', query)),
    staleTime: 0,
    enabled,
  });
}
