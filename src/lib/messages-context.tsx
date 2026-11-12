'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Messages } from './i18n';

/**
 * The page's text in the browser (Document 4, section 6). The language layout gives the text every page uses; the
 * Vendor and Admin layouts add their own sections, so a storefront page never carries them (lib/messages.ts).
 */
const MessagesContext = createContext<Partial<Messages>>({});

export function MessagesProvider({ messages, children }: { messages: Partial<Messages>; children: ReactNode }) {
  const parent = useContext(MessagesContext);
  return <MessagesContext.Provider value={{ ...parent, ...messages }}>{children}</MessagesContext.Provider>;
}

/** The text for this page's language. Area-only sections exist only inside the Vendor and Admin areas. */
export function useMessages(): Messages {
  return useContext(MessagesContext) as Messages;
}
