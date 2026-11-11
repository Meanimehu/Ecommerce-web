'use client';

import { Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { send } from '@/lib/http';
import { getMessages, type Locale } from '@/lib/i18n';

/**
 * Switches language and stays on the same page (Document 4, section 6). A text button with a globe icon showing the
 * other language's name in its own script, with a 44 px hit area (Document 6, 7.3). The choice is remembered only when
 * the person uses this. Without scripts it is still a plain link to the same page in the other language.
 */
export function LanguageSwitch({ lang }: { lang: Locale }) {
  const pathname = usePathname();
  const other: Locale = lang === 'en' ? 'hi' : 'en';
  const target = pathname.replace(/^\/(en|hi)(?=\/|$)/, `/${other}`);
  return (
    <a
      href={target}
      lang={other}
      className="inline-flex h-11 items-center gap-2 rounded-2 px-2 type-label text-ink no-underline transition-colors duration-100 hover:bg-sunken"
      onClick={(event) => {
        event.preventDefault();
        void send('/api/language', { lang: other })
          .catch(() => undefined)
          .finally(() => window.location.assign(target));
      }}
    >
      <Globe aria-hidden="true" className="size-5" />
      {getMessages(lang).languageNames[other]}
    </a>
  );
}
