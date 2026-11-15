import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as accountApi from '@/features/account/server/account-api';
import type { AddAddressBody } from '@/features/account/types';

/** GET and POST /api/me/addresses: one's saved addresses, and adding one. */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return answerAsUser(request, (token) => accountApi.listAddresses(token));
}

export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(request, (token) => accountApi.addAddress(token, body as AddAddressBody), {
    change: true,
  });
}
