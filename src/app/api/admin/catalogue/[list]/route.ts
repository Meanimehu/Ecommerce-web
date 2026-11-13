import type { NextRequest } from 'next/server';
import * as catalogueApi from '@/api/catalogue';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import { isCatalogueList, isEditableList } from '@/types/catalogue';
import { pick } from '@/utils/url';

/** GET and POST /api/admin/catalogue/{list}: read a catalogue list, or add to it (area-3a-catalogue.md). */
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ list: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { list } = await params;
  if (!isCatalogueList(list)) return fail('NOT_FOUND', 404);
  const query = pick(request.nextUrl.searchParams, ['isActive', 'q', 'page', 'limit']);
  return answerAsUser(request, (token) => catalogueApi.listCatalogue(token, list, query));
}

export async function POST(request: NextRequest, { params }: Context) {
  const { list } = await params;
  if (!isEditableList(list)) return fail('NOT_FOUND', 404);
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => catalogueApi.addCatalogueItem(token, list, body), { change: true });
}
