import type { NextRequest } from 'next/server';
import * as moderationApi from '@/api/moderation';
import { fileAsUser } from '@/middleware/endpoint';
import { photoSize } from '@/lib/uploads';

/** GET /api/moderation/products/{id}/images/{imageId}/file?size=: a photo under review, streamed (D3-04). */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  return fileAsUser(request, (token) => moderationApi.openReviewPhoto(token, id, imageId, photoSize(request.nextUrl.searchParams.get('size'))));
}
