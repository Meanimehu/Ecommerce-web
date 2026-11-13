import type { NextRequest } from 'next/server';
import { AppErrorCode, BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as catalogueApi from '@/features/catalogue/server/catalogue-api';
import { isEditableList, type ChangeBody } from '@/features/catalogue/types';

/** PATCH /api/admin/catalogue/{list}/{id}: change one entry, or switch it off or on (isActive). */
type Context = { params: Promise<{ list: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { list, id } = await params;
  if (!isEditableList(list)) return fail(AppErrorCode.NotFound, HttpStatus.NotFound);
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => catalogueApi.changeCatalogueItem(token, list, id, body as ChangeBody<typeof list>),
    { change: true },
  );
}
