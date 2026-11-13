import type { NextRequest } from 'next/server';
import * as vendorApi from '@/features/vendor/server/vendor-api';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/** POST /api/vendors/apply: start a vendor application (area-2-vendors.md, POST /vendors/apply). */
export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => vendorApi.applyAsVendor(token, body), { change: true });
}
