import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as importApi from '@/features/product/server/import-api';

/** GET /api/vendors/me/imports/{id}: one import with its products and rows. */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => importApi.getMyImport(token, id));
}
