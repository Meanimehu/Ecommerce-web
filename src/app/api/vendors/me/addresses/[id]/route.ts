import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/features/vendor/server/vendor-api';
import type { UpdateVendorAddressBody } from '@/features/vendor/types';

/** PATCH and DELETE /api/vendors/me/addresses/{id}: change or remove one address. */
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => vendorApi.updateVendorAddress(token, id, body as UpdateVendorAddressBody),
    { change: true },
  );
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => vendorApi.removeVendorAddress(token, id), {
    change: true,
  });
}
