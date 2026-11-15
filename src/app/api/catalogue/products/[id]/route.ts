import type { NextRequest } from 'next/server';
import { answerPublic } from '@/middleware/endpoint';
import * as productPageApi from '@/features/storefront/product-page/server/product-page-api';

/**
 * GET /api/catalogue/products/{id}: one product as it is now. The product page asks again before
 * adding to the cart, so prices and stock are never older than that moment (Document 3, section 9;
 * Document 4, section 7).
 */
export const dynamic = 'force-dynamic';

/** Never kept: always the backend's answer of this moment. */
const FRESH_SECONDS = 0;

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerPublic(() => productPageApi.getProduct(id), FRESH_SECONDS);
}
