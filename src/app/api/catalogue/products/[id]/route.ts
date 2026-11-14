import type { NextRequest } from 'next/server';
import * as catalogueApi from '@/features/storefront/server/storefront-api';
import { answerPublic } from '@/middleware/endpoint';

/**
 * GET /api/catalogue/products/{id}: one product as it is now. The product page asks again before adding to the cart,
 * so prices and stock are never older than that moment (Document 3, section 9; Document 4, section 7).
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return answerPublic(() => catalogueApi.getProduct(id), 0);
}
