import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as auditApi from '@/features/audit/server/audit-api';

/** GET /api/admin/audit-log: the audit log (area-1-accounts.md, GET /admin/audit-log). */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = [
  'actorId',
  'action',
  'entityType',
  'entityId',
  'from',
  'to',
  'page',
  'limit',
];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => auditApi.listAuditLog(token, query));
}
