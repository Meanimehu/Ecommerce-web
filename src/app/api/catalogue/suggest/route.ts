import { NextResponse, type NextRequest } from 'next/server';
import { answerPublic } from '@/middleware/endpoint';
import { readSearchText } from '@/features/storefront/product-list/rules';
import * as searchApi from '@/features/storefront/search/server/search-api';

/**
 * GET /api/catalogue/suggest?q=…: suggestions while typing (area-3a-catalogue.md); fresh for 10
 * seconds (Document 7, section 12). With no text there is nothing to suggest, and the backend is
 * not asked.
 */
export const dynamic = 'force-dynamic';

const FRESH_SECONDS = 10;

export function GET(request: NextRequest) {
  const text = readSearchText(request.nextUrl.searchParams.get('q') ?? undefined);
  if (!text) return NextResponse.json({ products: [], categories: [], brands: [] });
  return answerPublic(() => searchApi.suggest(text), FRESH_SECONDS);
}
