import type { NextRequest } from 'next/server';
import * as productApi from '@/features/product/server/product-api';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/** PATCH (alt text) and DELETE /api/vendors/me/products/{id}/images/{imageId}. */
type Context = { params: Promise<{ id: string; imageId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id, imageId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => productApi.changePhoto(token, id, imageId, body), { change: true });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id, imageId } = await params;
  return answerAsUser(request, (token) => productApi.deletePhoto(token, id, imageId), { change: true });
}
