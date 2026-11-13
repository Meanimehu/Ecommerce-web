import type { NextRequest } from 'next/server';
import { fileAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/features/vendor/server/vendor-api';

/** GET /api/admin/vendors/{id}/documents/{docId}/file: a vendor's document for review, streamed (the backend logs it). */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string; docId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id, docId: documentId } = await params;
  return fileAsUser(request, (token) => vendorApi.openVendorDocument(token, id, documentId));
}
