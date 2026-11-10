import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { safeEqual } from '@/server/auth/crypto';
import { clearSessionCookies, fail, guardChange, ok, readJson } from '@/server/auth/http';
import { handleOf, readAuth } from '@/server/auth/session';

/**
 * POST /api/session/clear: compare-and-clear (Document 4, section 9). Clears the cookies only if the browser is still
 * sending the session the handle belongs to; if it now holds a newer session, nothing changes.
 */
const Body = z.object({ handle: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  const refused = guardChange(request, 'session-or-pre-login');
  if (refused) return refused;
  const body = Body.safeParse(await readJson(request));
  if (!body.success) return fail('VALIDATION_FAILED', 400);
  const current = handleOf(readAuth(request));
  if (!current || !safeEqual(current, body.data.handle)) return ok({ cleared: false });
  const response = ok({ cleared: true });
  clearSessionCookies(response);
  return response;
}
