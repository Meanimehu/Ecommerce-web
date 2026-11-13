import type { NextRequest } from 'next/server';
import * as vendorApi from '@/features/vendor/server/vendor-api';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/** POST /api/admin/vendors/{id}/approve, reject, suspend or unsuspend (area-2-vendors.md, section 2). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; decision: string }> }) {
  const { id, decision } = await params;
  if (!(vendorApi.VENDOR_DECISIONS as readonly string[]).includes(decision)) return fail('NOT_FOUND', 404);
  const body = (await jsonObject(request)) ?? {};
  return answerAsUser(request, (token) => vendorApi.decideVendor(token, id, decision as vendorApi.VendorDecision, body), { change: true });
}
