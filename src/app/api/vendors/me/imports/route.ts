import { NextResponse, type NextRequest } from 'next/server';
import { UPLOAD_RULES } from '@/lib/uploads';
import { uploadFrom } from '@/middleware/endpoint';
import { guardChange } from '@/middleware/responses';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as importApi from '@/features/product/server/import-api';

/**
 * GET and POST /api/vendors/me/imports: the vendor's imports, and a CSV file to check. The upload
 * is streamed to the backend, sent once only, and never kept here.
 */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => importApi.listMyImports(token, query));
}

export function POST(request: NextRequest) {
  const refused = guardChange(request);
  if (refused) return refused;
  const upload = uploadFrom(request, UPLOAD_RULES.csv.maxBytes);
  if (upload instanceof NextResponse) return upload;
  return answerAsUser(request, (token) => importApi.uploadImport(token, upload), { once: true });
}
