import type { NextRequest } from 'next/server';
import { jsonObject } from '@/middleware/endpoint';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as salesApi from '@/features/sales/server/sales-api';
import type { CancelSaleBody } from '@/features/sales/types';

/** POST /api/vendors/me/sales/{id}/cancel: stop an upcoming or active sale at once. */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  // The reason is optional; the backend gives a default one.
  const body = (await jsonObject(request)) ?? {};
  return answerAsUser(request, (token) => salesApi.cancelSale(token, id, body as CancelSaleBody), {
    change: true,
  });
}
