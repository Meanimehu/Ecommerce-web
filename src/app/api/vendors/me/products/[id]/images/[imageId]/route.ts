import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';
import type { ChangePhotoBody } from '@/features/product/types';

/** PATCH (alt text) and DELETE /api/vendors/me/products/{id}/images/{imageId}. */
type Context = { params: Promise<{ id: string; imageId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id, imageId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => productApi.changePhoto(token, id, imageId, body as ChangePhotoBody),
    { change: true },
  );
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id, imageId } = await params;
  return answerAsUser(request, (token) => productApi.deletePhoto(token, id, imageId), {
    change: true,
  });
}
