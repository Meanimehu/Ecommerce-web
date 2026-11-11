import type { NextRequest } from 'next/server';
import * as moderationApi from '@/api/moderation';
import { answerAsUser } from '@/middleware/endpoint';

/** GET /api/moderation/products/{id}: a product for review. */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return answerAsUser(request, (token) => moderationApi.getForReview(token, id));
}
