import type { ReactNode } from 'react';
import { isLocale } from '@/lib/i18n';
import { sectionMessages, type AreaSection } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';

/**
 * One Admin screen's own text, given to the browser by that screen's folder layout (lib/messages.ts,
 * ADMIN_SCREEN_SECTIONS), so an admin page never carries another screen's text (Document 6, section 14). An address
 * with an unknown language is left to its page, which answers "not found".
 */
export function ScreenText({
  langParam,
  sections,
  children,
}: {
  langParam: string;
  sections: readonly AreaSection[];
  children: ReactNode;
}) {
  if (!isLocale(langParam)) return children;
  return (
    <MessagesProvider messages={sectionMessages(langParam, sections)}>{children}</MessagesProvider>
  );
}
