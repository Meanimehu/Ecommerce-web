'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AppError } from '@/lib/errors';

/**
 * The browser data layer (Document 1, D-02). One cache per browser tab, cleared on logout or a change of person
 * (Document 3, section 9). Reads to our own server are retried only after a network failure; changes never are.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: (count, error) => count < 2 && error instanceof AppError && error.code === 'NETWORK',
            retryDelay: (attempt) => [500, 1500][attempt] ?? 1500,
          },
          mutations: { retry: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
