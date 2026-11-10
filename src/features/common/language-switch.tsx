'use client';

import { usePathname } from 'next/navigation';
import { send } from '@/lib/client/api';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/**
 * Switches language and stays on the same page (Document 4, section 6). The other language's name in its own script
 * (Document 6, section 16), from the message catalogue (D-08). The choice is remembered only when the person uses this.
 */
export function LanguageSwitch({ lang }: { lang: Locale }) {
  const pathname = usePathname();
  const other: Locale = lang === 'en' ? 'hi' : 'en';
  const target = pathname.replace(/^\/(en|hi)(?=\/|$)/, `/${other}`);
  return (
    <a
      href={target}
      lang={other}
      className="text-sm underline underline-offset-4"
      onClick={(event) => {
        event.preventDefault();
        void send('/api/language', { lang: other })
          .catch(() => undefined)
          .finally(() => window.location.assign(target));
      }}
    >
      {getMessages(lang).languageNames[other]}
    </a>
  );
}
