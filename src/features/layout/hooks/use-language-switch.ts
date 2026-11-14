'use client';

import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { otherLocale, type Locale } from '@/lib/i18n';
import { samePageIn } from '@/lib/routes';
import { useRememberLanguage } from './use-layout';

/**
 * The language switch (Document 4, section 6): the same page in the other language. Using it
 * remembers the choice, then opens that page, whether or not remembering worked. Without scripts
 * it is still a plain link. The screen, `language-switch.tsx`, only draws.
 */
export function useLanguageSwitch(lang: Locale) {
  const pathname = usePathname();
  const rememberLanguage = useRememberLanguage();
  const otherLang = otherLocale(lang);
  const otherPath = samePageIn(pathname, otherLang);

  function goToOtherPage() {
    window.location.assign(otherPath);
  }

  function switchLanguage(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    rememberLanguage.mutate(otherLang, { onSettled: goToOtherPage });
  }

  return { otherLang, otherPath, switchLanguage };
}
