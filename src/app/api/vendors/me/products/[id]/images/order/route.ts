import type { NextRequest } from 'next/server';
import * as productApi from '@/api/product';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/** PUT /api/vendors/me/products/{id}/images/order: every photo id once; the first becomes the cover. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => productApi.orderPhotos(token, id, body), { change: true });
}
