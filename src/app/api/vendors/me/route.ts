import type { NextRequest } from 'next/server';
import * as vendorApi from '@/api/vendor';
import { answerAsUser, jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';

/** GET and PATCH /api/vendors/me: the person's own application (area-2-vendors.md, section 1). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return answerAsUser(request, (token) => vendorApi.getMyVendor(token));
}

export async function PATCH(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => vendorApi.updateMyVendor(token, body), { change: true });
}
