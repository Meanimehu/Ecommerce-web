import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';

/** POST /api/vendors/me/products/{id}/revision/images/{imageId}/restore: keep a photo marked for removal. */
type Context = { params: Promise<{ id: string; imageId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id, imageId } = await params;
  return answerAsUser(request, (token) => productApi.restoreRevisionPhoto(token, id, imageId), {
    change: true,
  });
}
