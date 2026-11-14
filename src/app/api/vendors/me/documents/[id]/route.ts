import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as vendorApi from '@/features/vendor/server/vendor-api';

/** DELETE /api/vendors/me/documents/{id}: delete a document nobody has reviewed yet. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return answerAsUser(request, (token) => vendorApi.removeVendorDocument(token, id), {
    change: true,
  });
}
