'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { endSession, endsSession } from '@/lib/client/session-end';
import { AppError } from '@/lib/errors';

/**
 * The browser data layer (Document 1, D-02). One cache per browser tab, cleared on logout or a change of person
 * (Document 3, section 9). Reads to our own server are retried only after a network failure; changes never are.
 * Any call that learns the session is over ends it the same way, on every screen (Document 2, section 4).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const onError = (error: unknown) => {
      if (endsSession(error)) void endSession(error as AppError);
    };
    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          retry: (count, error) => count < 2 && error instanceof AppError && error.code === 'NETWORK',
          retryDelay: (attempt) => [500, 1500][attempt] ?? 1500,
        },
        mutations: { retry: false },
      },
    });
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
