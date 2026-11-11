import { NextResponse, type NextRequest } from 'next/server';
import * as productApi from '@/api/product';
import { UPLOAD_RULES } from '@/lib/uploads';
import { answerAsUser, uploadFrom } from '@/middleware/endpoint';
import { guardChange } from '@/middleware/responses';

/** POST /api/vendors/me/products/{id}/images: upload one photo, streamed to the backend and sent once only. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refused = guardChange(request);
  if (refused) return refused;
  const { id } = await params;
  const upload = uploadFrom(request, UPLOAD_RULES.photo.maxBytes);
  if (upload instanceof NextResponse) return upload;
  return answerAsUser(request, (token) => productApi.uploadPhoto(token, id, upload), { once: true });
}
