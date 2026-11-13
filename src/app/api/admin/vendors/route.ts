import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/features/vendor/server/vendor-api';

/** GET /api/admin/vendors: the vendor list for review (area-2-vendors.md, GET /admin/vendors). */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'q', 'hasPendingDocuments', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => vendorApi.listVendors(token, query));
}
