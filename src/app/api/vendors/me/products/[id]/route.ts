import type { NextRequest } from 'next/server';
import * as productApi from '@/api/product';
import { answerAsUser, jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';

/** GET, PATCH and DELETE /api/vendors/me/products/{id}: one product in full, a change, or deleting a draft. */
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => productApi.getMyProduct(token, id));
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => productApi.changeProduct(token, id, body), { change: true });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => productApi.deleteProduct(token, id), { change: true });
}
