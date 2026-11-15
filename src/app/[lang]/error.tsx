'use client';

import { CircleAlert } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { isLocale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { homePath } from '@/lib/routes';

/**
 * When a page fails: what failed, "Try again", and a way on, never a blank page (D-12; Document 6, section 10).
 * The error itself goes to the console only; no details are shown to the person.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ lang: string }>();
  const lang = isLocale(params.lang) ? params.lang : 'en';
  const messages = useMessages();
  useEffect(() => console.error(error), [error]);
  return (
    <main className="mx-auto grid w-full max-w-[640px] px-4 py-12">
      <StateBlock
        icon={CircleAlert}
        title={messages.errorPage.title}
        text={messages.errorPage.body}
      >
        <Button type="button" onClick={reset}>
          {messages.errors.tryAgain}
        </Button>
        <Button asChild variant="secondary">
          <a href={homePath(lang)} className="no-underline">
            {messages.errorPage.home}
          </a>
        </Button>
      </StateBlock>
    </main>
  );
}
