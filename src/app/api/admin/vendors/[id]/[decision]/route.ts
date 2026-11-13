import type { NextRequest } from 'next/server';
import { AppErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/features/vendor/server/vendor-api';
import { isVendorDecision, type ReasonBody } from '@/features/vendor/types';

/** POST /api/admin/vendors/{id}/approve, reject, suspend or unsuspend (area-2-vendors.md, section 2). */
type Context = { params: Promise<{ id: string; decision: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id, decision } = await params;
  if (!isVendorDecision(decision)) return fail(AppErrorCode.NotFound, HttpStatus.NotFound);
  const body = (await jsonObject(request)) ?? {};
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => vendorApi.decideVendor(token, id, decision, body as Partial<ReasonBody>),
    { change: true },
  );
}
