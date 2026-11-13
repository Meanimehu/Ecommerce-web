import { NextResponse, type NextRequest } from 'next/server';
import * as vendorApi from '@/api/vendor';
import { UPLOAD_RULES } from '@/lib/uploads';
import { uploadFrom } from '@/middleware/endpoint';
import { guardChange } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/**
 * POST /api/vendors/me/documents: upload one KYC document, passed on to the backend as it arrives (Document 3,
 * section 10). Sent once only: it is never repeated, so the login is renewed first when it is about to expire.
 */
export async function POST(request: NextRequest) {
  const refused = guardChange(request);
  if (refused) return refused;
  const upload = uploadFrom(request, UPLOAD_RULES.document.maxBytes);
  if (upload instanceof NextResponse) return upload;
  return answerAsUser(request, (token) => vendorApi.uploadVendorDocument(token, upload), { once: true });
}
