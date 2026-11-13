import type { NextRequest } from 'next/server';
import { fileAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/api/vendor';

/** GET /api/admin/vendors/{id}/documents/{docId}/file: a vendor's document for review, streamed (the backend logs it). */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  return fileAsUser(request, (token) => vendorApi.openVendorDocument(token, id, docId));
}
