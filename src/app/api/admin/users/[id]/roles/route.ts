import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as usersApi from '@/features/users/server/users-api';
import type { GrantRoleBody } from '@/features/users/types';

/** POST /api/admin/users/{id}/roles: give a staff role (area-1-accounts.md, section 4). */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks the role and refuses unknown fields.
  return answerAsUser(
    request,
    (token) => usersApi.grantRole(token, id, body as Partial<GrantRoleBody>),
    { change: true },
  );
}
