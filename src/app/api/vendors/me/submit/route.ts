import type { NextRequest } from 'next/server';
import * as vendorApi from '@/api/vendor';
import { answerAsUser, jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';

/** POST /api/vendors/me/submit: submit the application with the terms version the person accepted. */
export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => vendorApi.submitMyVendor(token, body), { change: true });
}
