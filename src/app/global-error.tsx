'use client';

import { GLOBAL_ERROR_TEXT } from '@/lib/global-error-text';

/**
 * Last resort when even the page frame fails (D-12): a plain message instead of a blank page. The language is not known
 * here, so it is English: the catalogue's words, kept in `lib/global-error-text.ts` so the whole catalogue does not
 * reach every page's browser files.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          maxWidth: '36rem',
          margin: '0 auto',
        }}
      >
        <h1>{GLOBAL_ERROR_TEXT.title}</h1>
        <p>{GLOBAL_ERROR_TEXT.body}</p>
        <button type="button" onClick={reset}>
          {GLOBAL_ERROR_TEXT.tryAgain}
        </button>
      </body>
    </html>
  );
}
