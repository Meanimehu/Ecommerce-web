import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as moderationApi from '@/features/product/server/moderation-api';

/** GET /api/moderation/products/{id}: a product for review. */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => moderationApi.getProductForReview(token, id));
}
