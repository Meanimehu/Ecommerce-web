import { NextResponse, type NextRequest } from 'next/server';
import { UPLOAD_RULES } from '@/lib/uploads';
import { uploadFrom } from '@/middleware/endpoint';
import { guardChange } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';

/**
 * POST /api/vendors/me/products/{id}/revision/images: propose one new photo, streamed to the
 * backend and sent once only. It stays private until the revision is approved.
 */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const refused = guardChange(request);
  if (refused) return refused;
  const { id } = await params;
  const upload = uploadFrom(request, UPLOAD_RULES.photo.maxBytes);
  if (upload instanceof NextResponse) return upload;
  return answerAsUser(request, (token) => productApi.uploadRevisionPhoto(token, id, upload), {
    once: true,
  });
}
