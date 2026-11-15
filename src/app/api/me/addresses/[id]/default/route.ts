import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as accountApi from '@/features/account/server/account-api';

/** POST /api/me/addresses/{id}/default: make this saved address the default. */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => accountApi.makeDefaultAddress(token, id), {
    change: true,
  });
}
