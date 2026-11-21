import type { NextRequest } from 'next/server';
import { AppErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as usersApi from '@/features/users/server/users-api';
import { isUserAction, type BlockBody } from '@/features/users/types';

/** POST /api/admin/users/{id}/block or unblock (area-1-accounts.md, section 4). */
type Context = { params: Promise<{ id: string; action: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id, action } = await params;
  if (!isUserAction(action)) return fail(AppErrorCode.NotFound, HttpStatus.NotFound);
  const body = (await jsonObject(request)) ?? {};
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => usersApi.changeUser(token, id, action, body as Partial<BlockBody>),
    { change: true },
  );
}
