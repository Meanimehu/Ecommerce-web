'use client';

import { CircleAlert } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { getMessages, isLocale } from '@/lib/i18n';

/**
 * When a page fails: what failed, "Try again", and a way on, never a blank page (D-12; Document 6, section 10).
 * The error itself goes to the console only; no details are shown to the person.
 */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ lang: string }>();
  const lang = isLocale(params.lang) ? params.lang : 'en';
  const t = getMessages(lang);
  useEffect(() => console.error(error), [error]);
  return (
    <main className="mx-auto grid w-full max-w-[640px] px-4 py-12">
      <StateBlock icon={CircleAlert} title={t.errorPage.title} text={t.errorPage.body}>
        <Button type="button" onClick={reset}>
          {t.errors.tryAgain}
        </Button>
        <Button asChild variant="secondary">
          <a href={`/${lang}`} className="no-underline">
            {t.errorPage.home}
          </a>
        </Button>
      </StateBlock>
    </main>
  );
}
