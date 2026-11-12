import type { AppError } from '@/lib/errors';

// Every call from the browser goes through lib/http.ts, which only ever rejects with an AppError
// (Document 7, section 20.6), so query and mutation errors are typed as one.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: AppError;
  }
}
