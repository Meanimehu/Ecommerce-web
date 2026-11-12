import type { NextRequest } from 'next/server';
import * as moderationApi from '@/api/moderation';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/** POST /api/moderation/products/{id}/approve or reject. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; decision: string }> }) {
  const { id, decision } = await params;
  if (decision !== 'approve' && decision !== 'reject') return fail('NOT_FOUND', 404);
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => moderationApi.decide(token, id, decision, body), { change: true });
}
