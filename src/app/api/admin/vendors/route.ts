import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/api/vendor';
import { pick } from '@/utils/url';

/** GET /api/admin/vendors: the vendor list for review (area-2-vendors.md, GET /admin/vendors). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, ['status', 'q', 'hasPendingDocuments', 'page', 'limit']);
  return answerAsUser(request, (token) => vendorApi.listVendors(token, query));
}
