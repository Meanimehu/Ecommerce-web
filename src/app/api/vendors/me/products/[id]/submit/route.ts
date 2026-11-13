import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';

/** POST /api/vendors/me/products/{id}/submit: send the product for review. */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => productApi.submitProduct(token, id), { change: true });
}
