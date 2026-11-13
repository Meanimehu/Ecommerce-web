import type { NextRequest } from 'next/server';
import * as productApi from '@/features/product/server/product-api';
import { photoSize } from '@/lib/uploads';
import { fileAsUser } from '@/features/auth/server/answer-as-user';

/** GET /api/vendors/me/products/{id}/images/{imageId}/file?size=: a private photo, streamed through our server (D3-04). */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  return fileAsUser(request, (token) => productApi.openMyPhoto(token, id, imageId, photoSize(request.nextUrl.searchParams.get('size'))));
}
