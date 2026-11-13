import type { NextRequest } from 'next/server';
import { fileAsUser } from '@/features/auth/server/answer-as-user';
import * as moderationApi from '@/features/product/server/moderation-api';
import { photoSizeOf } from '@/features/product/types';

/**
 * GET /api/moderation/products/{id}/images/{imageId}/file?size=: a photo under review, streamed
 * (D3-04).
 */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string; imageId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id, imageId } = await params;
  const size = photoSizeOf(request.nextUrl.searchParams.get('size'));
  return fileAsUser(request, (token) => moderationApi.openReviewPhoto(token, id, imageId, size));
}
