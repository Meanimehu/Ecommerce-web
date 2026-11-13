import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/api/vendor';

/** GET /api/admin/vendors/{id}: one vendor with its addresses and documents. */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return answerAsUser(request, (token) => vendorApi.getVendor(token, id));
}
