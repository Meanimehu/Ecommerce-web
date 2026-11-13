import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as moderationApi from '@/api/moderation';
import { pick } from '@/utils/url';

/** GET /api/moderation/products: the review queue (moderator, admin). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, ['queue', 'vendorId', 'categoryId', 'page', 'limit']);
  return answerAsUser(request, (token) => moderationApi.listQueue(token, query));
}
