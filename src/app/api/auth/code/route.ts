import type { NextRequest } from 'next/server';
import { z } from 'zod';
import * as authApi from '@/api/auth';
import { fail, fromAppError, guardChange, ok, readJson } from '@/middleware/responses';

/** POST /api/auth/code: asks the backend to send a login code (area-1-accounts.md, POST /auth/otp/request). */
const Body = z.object({ phone: z.string().trim().min(1).max(20) });

export async function POST(request: NextRequest) {
  const refused = guardChange(request);
  if (refused) return refused;
  const body = Body.safeParse(await readJson(request));
  if (!body.success) return fail('PHONE_INVALID', 400);
  try {
    const { data } = await authApi.requestLoginCode({ phone: body.data.phone });
    return ok(data);
  } catch (error) {
    return fromAppError(error);
  }
}
