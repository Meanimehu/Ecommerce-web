import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/features/vendor/server/vendor-api';
import type { SubmitVendorBody } from '@/features/vendor/types';

/** POST /api/vendors/me/submit: submit the application with the terms version the person accepted. */
export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => vendorApi.submitMyVendor(token, body as SubmitVendorBody),
    { change: true },
  );
}
