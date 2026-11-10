'use client';

import { useQuery } from '@tanstack/react-query';
import { getSession } from './api';

/** Who is logged in, and this page's anti-forgery token (D-02; Document 4, section 9). Never cached across people. */
export const SESSION_QUERY_KEY = ['session'] as const;

export function useSession() {
  return useQuery({ queryKey: SESSION_QUERY_KEY, queryFn: getSession, staleTime: 60_000, retry: false });
}
