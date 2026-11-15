'use client';

import { Lock } from 'lucide-react';
import { useParams } from 'next/navigation';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { isLocale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { homePath } from '@/lib/routes';

/**
 * The "you don't have access" page, sent with a real 403 (Document 2, section 4; Document 4, section 5): a lock icon,
 * what the person cannot open, and a way back (Document 6, section 10).
 */
export default function Forbidden() {
  const params = useParams<{ lang: string }>();
  const lang = isLocale(params.lang) ? params.lang : 'en';
  const messages = useMessages();
  return (
    <main className="mx-auto grid w-full max-w-[640px] px-4 py-12">
      <StateBlock icon={Lock} title={messages.noAccess.title} text={messages.noAccess.body}>
        <Button asChild>
          <a href={homePath(lang)} className="no-underline">
            {messages.noAccess.home}
          </a>
        </Button>
      </StateBlock>
    </main>
  );
}
