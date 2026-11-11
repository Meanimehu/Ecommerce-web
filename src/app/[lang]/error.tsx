'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getMessages, isLocale } from '@/lib/i18n';

/**
 * When a page fails, a clear message and a way on, never a blank page (D-12; Document 6, section 10).
 * The error itself goes to the console only; no details are shown to the person.
 */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ lang: string }>();
  const lang = isLocale(params.lang) ? params.lang : 'en';
  const t = getMessages(lang);
  useEffect(() => console.error(error), [error]);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">{t.errorPage.title}</h1>
      <p>{t.errorPage.body}</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          {t.errors.tryAgain}
        </Button>
        <Button asChild variant="outline">
          <a href={`/${lang}`}>{t.errorPage.home}</a>
        </Button>
      </div>
    </main>
  );
}
