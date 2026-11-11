import 'server-only';
import { cookies } from 'next/headers';
import { AppError } from '@/lib/errors';
import type { User } from '@/schemas/accounts';
import * as authApi from '../api-layer/accounts';
import { COOKIE } from './cookie-basics';

/**
 * Who is looking at a server-rendered page. A page render cannot set cookies, so it never refreshes: when the access
 * token is missing or expired it answers "needs-refresh", and the page lets the browser call GET /api/session, which
 * refreshes safely and sets the new cookies (Document 4, section 9).
 */
export type Viewer = { state: 'anonymous' } | { state: 'needs-refresh' } | { state: 'user'; user: User } | { state: 'unavailable' };

export async function getViewer(): Promise<Viewer> {
  const jar = await cookies();
  const access = jar.get(COOKIE.access)?.value;
  const refresh = jar.get(COOKIE.refresh)?.value;
  if (!access) return refresh ? { state: 'needs-refresh' } : { state: 'anonymous' };
  try {
    const { data } = await authApi.getMe(access);
    return { state: 'user', user: data };
  } catch (error) {
    if (error instanceof AppError && error.status === 401) return { state: 'needs-refresh' };
    if (error instanceof AppError && error.code === 'USER_BLOCKED') return { state: 'needs-refresh' };
    return { state: 'unavailable' };
  }
}
