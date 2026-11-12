import type { NextRequest } from 'next/server';
import * as vendorApi from '@/api/vendor';
import { answerAsUser, jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';

/** POST /api/vendors/me/addresses: add a pickup or return address. */
export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => vendorApi.addVendorAddress(token, body), { change: true });
}
