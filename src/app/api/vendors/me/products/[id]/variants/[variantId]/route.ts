import type { NextRequest } from 'next/server';
import * as productApi from '@/api/product';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/** PATCH and DELETE /api/vendors/me/products/{id}/variants/{variantId}. */
type Context = { params: Promise<{ id: string; variantId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id, variantId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => productApi.changeVariant(token, id, variantId, body), { change: true });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id, variantId } = await params;
  return answerAsUser(request, (token) => productApi.deleteVariant(token, id, variantId), { change: true });
}
