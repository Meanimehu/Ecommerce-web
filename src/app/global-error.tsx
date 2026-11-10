'use client';

import en from '@/messages/en.json';

/**
 * Last resort when even the page frame fails (D-12): a plain message instead of a blank page. The language is not known
 * here, so it is English, from the message catalogue.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '36rem', margin: '0 auto' }}>
        <h1>{en.errorPage.title}</h1>
        <p>{en.errorPage.body}</p>
        <button type="button" onClick={reset}>
          {en.errors.tryAgain}
        </button>
      </body>
    </html>
  );
}
