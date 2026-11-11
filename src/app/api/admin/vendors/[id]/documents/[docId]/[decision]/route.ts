import type { NextRequest } from 'next/server';
import * as vendorApi from '@/api/vendor';
import { answerAsUser, jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';

/** POST /api/admin/vendors/{id}/documents/{docId}/approve or reject (with a reason). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; docId: string; decision: string }> }) {
  const { id, docId, decision } = await params;
  if (decision !== 'approve' && decision !== 'reject') return fail('NOT_FOUND', 404);
  const body = (await jsonObject(request)) ?? {};
  return answerAsUser(request, (token) => vendorApi.reviewVendorDocument(token, id, docId, decision, body), { change: true });
}
