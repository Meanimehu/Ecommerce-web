'use client';

import { Globe } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { HEADER_LINK_CLASS } from '@/features/layout/header-link';
import { useLanguageSwitch } from '@/features/layout/hooks/use-language-switch';

/**
 * Switches language and stays on the same page (Document 4, section 6). A text button with a globe
 * icon showing the other language's name in its own script, with a 44 px hit area (Document 6,
 * 7.3). It only draws; the switch is in `use-language-switch.ts`.
 */
export function LanguageSwitch({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const languageSwitch = useLanguageSwitch(lang);
  return (
    <a
      href={languageSwitch.otherPath}
      lang={languageSwitch.otherLang}
      className={HEADER_LINK_CLASS}
      onClick={languageSwitch.switchLanguage}
    >
      <Globe aria-hidden="true" className="size-5" />
      {messages.languageNames[languageSwitch.otherLang]}
    </a>
  );
}
