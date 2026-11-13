import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as moderationApi from '@/features/product/server/moderation-api';

/** GET /api/moderation/products: the review queue (moderator, admin). */
export const dynamic = 'force-dynamic';

const QUEUE_QUERY_NAMES = ['queue', 'vendorId', 'categoryId', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, QUEUE_QUERY_NAMES);
  return answerAsUser(request, (token) => moderationApi.listReviewQueue(token, query));
}
