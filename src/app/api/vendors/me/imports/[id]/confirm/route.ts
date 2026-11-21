import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as importApi from '@/features/product/server/import-api';

/** POST /api/vendors/me/imports/{id}/confirm: create the valid products as drafts, once. */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => importApi.confirmImport(token, id), { change: true });
}
