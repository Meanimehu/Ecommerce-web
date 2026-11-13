import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';
import type { ChangeVariantBody } from '@/features/product/types';

/** PATCH and DELETE /api/vendors/me/products/{id}/variants/{variantId}. */
type Context = { params: Promise<{ id: string; variantId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id, variantId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => productApi.changeVariant(token, id, variantId, body as ChangeVariantBody),
    { change: true },
  );
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id, variantId } = await params;
  return answerAsUser(request, (token) => productApi.deleteVariant(token, id, variantId), {
    change: true,
  });
}
