import type { NextRequest } from 'next/server';
import * as vendorApi from '@/api/vendor';
import { fileAsUser } from '@/middleware/endpoint';

/** GET /api/vendors/me/documents/{id}/file: the person's own document, streamed through our server (D3-04). */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return fileAsUser(request, (token) => vendorApi.openMyVendorDocument(token, id));
}
