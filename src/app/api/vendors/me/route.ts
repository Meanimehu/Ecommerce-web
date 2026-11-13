import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/features/vendor/server/vendor-api';
import type { UpdateVendorBody } from '@/features/vendor/types';

/** GET and PATCH /api/vendors/me: the person's own application (area-2-vendors.md, section 1). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return answerAsUser(request, (token) => vendorApi.getMyVendor(token));
}

export async function PATCH(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => vendorApi.updateMyVendor(token, body as UpdateVendorBody),
    { change: true },
  );
}
