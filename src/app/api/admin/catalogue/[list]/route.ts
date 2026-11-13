import type { NextRequest } from 'next/server';
import { AppErrorCode, BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as catalogueApi from '@/features/catalogue/server/catalogue-api';
import { isCatalogueList, isEditableList, type AddBody } from '@/features/catalogue/types';

/**
 * GET and POST /api/admin/catalogue/{list}: read a catalogue list, or add to it
 * (area-3a-catalogue.md).
 */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ list: string }> };

const LIST_QUERY_NAMES = ['isActive', 'q', 'page', 'limit'];

export async function GET(request: NextRequest, { params }: Context) {
  const { list } = await params;
  if (!isCatalogueList(list)) return fail(AppErrorCode.NotFound, HttpStatus.NotFound);
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => catalogueApi.listCatalogue(token, list, query));
}

export async function POST(request: NextRequest, { params }: Context) {
  const { list } = await params;
  if (!isEditableList(list)) return fail(AppErrorCode.NotFound, HttpStatus.NotFound);
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => catalogueApi.addCatalogueItem(token, list, body as AddBody<typeof list>),
    { change: true },
  );
}
