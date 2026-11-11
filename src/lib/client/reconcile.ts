'use client';

import type { QueryClient } from '@tanstack/react-query';
import { getSession, type SessionAnswer } from './api';
import { SESSION_QUERY_KEY } from './session';

/**
 * A change whose outcome is unknown (timeout, lost connection): reload the affected data once, then report what is
 * actually there (Document 3, section 6; D7-10). It never claims the change worked or failed unless the reload shows it.
 * For login and logout, the affected data is the session. Returns null when even the reload cannot be done.
 */
export async function reloadSession(queryClient: QueryClient): Promise<SessionAnswer | null> {
  try {
    return await queryClient.fetchQuery({ queryKey: SESSION_QUERY_KEY, queryFn: getSession, staleTime: 0 });
  } catch {
    return null;
  }
}
