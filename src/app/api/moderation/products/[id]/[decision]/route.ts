import type { NextRequest } from 'next/server';
import { AppErrorCode, BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as moderationApi from '@/features/product/server/moderation-api';
import {
  isProductDecision,
  type ApproveProductBody,
  type RejectProductBody,
} from '@/features/product/types';

/** POST /api/moderation/products/{id}/approve or reject. */
type Context = { params: Promise<{ id: string; decision: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id, decision } = await params;
  if (!isProductDecision(decision)) return fail(AppErrorCode.NotFound, HttpStatus.NotFound);
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) =>
      moderationApi.decideProduct(
        token,
        id,
        decision,
        body as ApproveProductBody | RejectProductBody,
      ),
    { change: true },
  );
}
