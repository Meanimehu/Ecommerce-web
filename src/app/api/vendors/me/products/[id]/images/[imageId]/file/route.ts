import type { NextRequest } from 'next/server';
import { fileAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';
import { photoSizeOf } from '@/features/product/types';

/**
 * GET /api/vendors/me/products/{id}/images/{imageId}/file?size=: a private photo, streamed through
 * our server (D3-04).
 */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string; imageId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id, imageId } = await params;
  const size = photoSizeOf(request.nextUrl.searchParams.get('size'));
  return fileAsUser(request, (token) => productApi.openMyPhoto(token, id, imageId, size));
}
