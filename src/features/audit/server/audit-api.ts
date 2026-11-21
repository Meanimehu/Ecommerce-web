import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import { AuditPageSchema } from '@/features/audit/types';

/** Backend Area 1, the audit log (area-1-accounts.md, section 5): admin only, read only. */
export const listAuditLog = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: '/admin/audit-log',
    query,
    kind: 'view',
    token,
    schema: AuditPageSchema,
  });
