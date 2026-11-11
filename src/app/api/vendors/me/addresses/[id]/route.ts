import type { NextRequest } from 'next/server';
import * as vendorApi from '@/api/vendor';
import { answerAsUser, jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';

/** PATCH and DELETE /api/vendors/me/addresses/{id}: change or remove one address. */
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => vendorApi.updateVendorAddress(token, id, body), { change: true });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => vendorApi.removeVendorAddress(token, id), { change: true });
}
