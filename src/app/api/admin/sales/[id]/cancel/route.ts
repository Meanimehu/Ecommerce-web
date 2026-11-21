import type { NextRequest } from 'next/server';
import { jsonObject } from '@/middleware/endpoint';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as salesApi from '@/features/sales/server/sales-api';
import type { StaffCancelSaleBody } from '@/features/sales/types';

/** POST /api/admin/sales/{id}/cancel: an admin or moderator cancels a sale, with a reason. */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = (await jsonObject(request)) ?? {};
  // Passed on as the browser sent it; the backend checks the reason and refuses unknown fields.
  return answerAsUser(
    request,
    (token) => salesApi.staffCancelSale(token, id, body as Partial<StaffCancelSaleBody>),
    { change: true },
  );
}
