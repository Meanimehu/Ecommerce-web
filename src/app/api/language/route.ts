import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { LOCALES } from '@/lib/i18n';
import { COOKIE, cookieOptions, LIFETIME_SECONDS } from '@/middleware/cookies';
import { fail, guardChange, ok, readJson } from '@/middleware/responses';

/**
 * POST /api/language: remembers the person's language choice (Document 4, section 6). Only when
 * they use the switch (`layout`'s language switch).
 */
const LanguageChoiceSchema = z.object({ lang: z.enum(LOCALES) });

export async function POST(request: NextRequest) {
  const refusedByForgeryCheck = guardChange(request);
  if (refusedByForgeryCheck) return refusedByForgeryCheck;
  const body = LanguageChoiceSchema.safeParse(await readJson(request));
  if (!body.success) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  const response = ok({ lang: body.data.lang });
  response.cookies.set(COOKIE.language, body.data.lang, cookieOptions(LIFETIME_SECONDS.language));
  return response;
}
