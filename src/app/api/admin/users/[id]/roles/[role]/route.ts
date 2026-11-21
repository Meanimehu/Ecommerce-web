import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as usersApi from '@/features/users/server/users-api';

/** DELETE /api/admin/users/{id}/roles/{role}: remove a staff role (area-1-accounts.md, section 4). */
type Context = { params: Promise<{ id: string; role: string }> };

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id, role } = await params;
  return answerAsUser(request, (token) => usersApi.removeRole(token, id, role), { change: true });
}
