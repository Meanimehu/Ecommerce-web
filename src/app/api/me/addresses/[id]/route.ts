import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as accountApi from '@/features/account/server/account-api';
import type { UpdateAddressBody } from '@/features/account/types';

/** PATCH and DELETE /api/me/addresses/{id}: change or delete one saved address. */
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => accountApi.updateAddress(token, id, body as UpdateAddressBody),
    { change: true },
  );
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => accountApi.removeAddress(token, id), { change: true });
}
