import type { NextRequest } from 'next/server';
import * as productApi from '@/api/product';
import { answerAsUser, jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';

/** POST /api/vendors/me/products/{id}/variants: add a variant (one per size and colour). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => productApi.addVariant(token, id, body), { change: true });
}
