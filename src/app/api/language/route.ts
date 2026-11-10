import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { COOKIE, cookieOptions, LIFETIME_SECONDS } from '@/server/auth/cookies';
import { fail, guardChange, ok, readJson } from '@/server/auth/http';

/** POST /api/language: remembers the person's language choice (Document 4, section 6). Only when they use the switcher. */
const Body = z.object({ lang: z.enum(['en', 'hi']) });

export async function POST(request: NextRequest) {
  const refused = guardChange(request, 'session-or-pre-login');
  if (refused) return refused;
  const body = Body.safeParse(await readJson(request));
  if (!body.success) return fail('VALIDATION_FAILED', 400);
  const response = ok({ lang: body.data.lang });
  response.cookies.set(COOKIE.language, body.data.lang, cookieOptions(LIFETIME_SECONDS.language));
  return response;
}
