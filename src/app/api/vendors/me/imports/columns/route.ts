import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as importApi from '@/features/product/server/import-api';

/** GET /api/vendors/me/imports/columns: the columns of the import file, for a category or none. */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, ['categoryId']);
  return answerAsUser(request, (token) => importApi.getImportColumns(token, query));
}
