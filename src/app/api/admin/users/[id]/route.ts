import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as usersApi from '@/features/users/server/users-api';

/** GET /api/admin/users/{id}: one user with their roles and block details. */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return answerAsUser(request, (token) => usersApi.getUser(token, id));
}
