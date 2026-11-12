import type { NextRequest } from 'next/server';
import * as moderationApi from '@/api/moderation';
import { answerAsUser } from '@/middleware/endpoint';
import { pick } from '@/utils/url';

/** GET /api/moderation/products: the review queue (moderator, admin). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, ['queue', 'vendorId', 'categoryId', 'page', 'limit']);
  return answerAsUser(request, (token) => moderationApi.listQueue(token, query));
}
