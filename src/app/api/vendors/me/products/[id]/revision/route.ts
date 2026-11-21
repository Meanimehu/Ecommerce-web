import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';
import type { ChangeProductBody } from '@/features/product/types';

/**
 * GET, PATCH and DELETE /api/vendors/me/products/{id}/revision: the revision of an approved
 * product, a proposed change (which starts one), or discarding it.
 */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => productApi.getRevision(token, id));
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => productApi.changeRevision(token, id, body as ChangeProductBody),
    { change: true },
  );
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => productApi.discardRevision(token, id), { change: true });
}
