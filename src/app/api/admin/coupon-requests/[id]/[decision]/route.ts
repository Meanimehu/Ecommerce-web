import type { NextRequest } from 'next/server';
import { AppErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as requestApi from '@/features/coupon/server/coupon-request-api';
import { isRequestDecision, type ApproveCouponRequestBody } from '@/features/coupon/types';

/**
 * POST /api/admin/coupon-requests/{id}/{approve|request-changes|reject}: a staff decision on a
 * submitted request (admin and marketing). Any other word is not one of ours.
 */
type Context = { params: Promise<{ id: string; decision: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id, decision } = await params;
  if (!isRequestDecision(decision)) return fail(AppErrorCode.NotFound, HttpStatus.NotFound);
  const body = (await jsonObject(request)) ?? {};
  // Passed on as the browser sent it; the backend checks the code and the note.
  return answerAsUser(
    request,
    (token) =>
      requestApi.decideCouponRequest(token, id, decision, body as ApproveCouponRequestBody),
    { change: true },
  );
}
