import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as accountApi from '@/features/account/server/account-api';
import type { UpdateProfileBody } from '@/features/account/types';

/** PATCH /api/me: change one's own name and email. */
export async function PATCH(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => accountApi.updateProfile(token, body as UpdateProfileBody),
    {
      change: true,
    },
  );
}
