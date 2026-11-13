import type { NextRequest } from 'next/server';
import * as catalogueApi from '@/api/catalogue';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import { isEditableList } from '@/types/catalogue';

/** PATCH /api/admin/catalogue/{list}/{id}: change one entry, or switch it off or on (isActive). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ list: string; id: string }> }) {
  const { list, id } = await params;
  if (!isEditableList(list)) return fail('NOT_FOUND', 404);
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => catalogueApi.changeCatalogueItem(token, list, id, body), { change: true });
}
