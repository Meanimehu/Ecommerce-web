import type { NextRequest } from 'next/server';
import * as productApi from '@/api/product';
import { answerAsUser } from '@/middleware/endpoint';

/** POST /api/vendors/me/products/{id}/submit: send the product for review. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return answerAsUser(request, (token) => productApi.submitProduct(token, id), { change: true });
}
