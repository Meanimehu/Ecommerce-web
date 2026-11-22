import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { fileAsUser } from '@/features/auth/server/answer-as-user';
import * as importApi from '@/features/product/server/import-api';

/**
 * GET /api/vendors/me/imports/template: the example CSV, streamed through our server with the
 * backend's file name. It is a blank example to fill in, not an export (D5-11).
 */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, ['categoryId']);
  return fileAsUser(request, (token) => importApi.openImportTemplate(token, query));
}
