import { NextResponse, type NextRequest } from 'next/server';
import * as productApi from '@/features/product/server/product-api';
import { UPLOAD_RULES } from '@/lib/uploads';
import { uploadFrom } from '@/middleware/endpoint';
import { guardChange } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/** POST /api/vendors/me/products/{id}/images: upload one photo, streamed to the backend and sent once only. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refused = guardChange(request);
  if (refused) return refused;
  const { id } = await params;
  const upload = uploadFrom(request, UPLOAD_RULES.photo.maxBytes);
  if (upload instanceof NextResponse) return upload;
  return answerAsUser(request, (token) => productApi.uploadPhoto(token, id, upload), { once: true });
}
