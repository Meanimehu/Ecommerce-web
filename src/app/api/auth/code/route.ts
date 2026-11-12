import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { fail, fromAppError, guardChange, ok, readJson } from '@/middleware/responses';
import * as authApi from '@/api/auth';

/** POST /api/auth/code: asks the backend to send a login code (POST /auth/otp/request). */
const RequestCodeBody = z.object({ phone: z.string().trim().min(1).max(20) });

export async function POST(request: NextRequest) {
  const refusedByForgeryCheck = guardChange(request);
  if (refusedByForgeryCheck) return refusedByForgeryCheck;

  const body = RequestCodeBody.safeParse(await readJson(request));
  if (!body.success) return fail(BackendErrorCode.PhoneInvalid, HttpStatus.BadRequest);

  try {
    const { data } = await authApi.requestLoginCode({ phone: body.data.phone });
    return ok(data);
  } catch (error) {
    return fromAppError(error);
  }
}
