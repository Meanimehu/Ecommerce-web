import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as usersApi from '@/features/users/server/users-api';

/** GET /api/admin/users: find users (area-1-accounts.md, GET /admin/users). */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['phone', 'role', 'status', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => usersApi.listUsers(token, query));
}
