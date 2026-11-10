import type { Messages } from '@/lib/messages';

/**
 * Schema rules carry a message key such as "validation.phoneRequired", never text, so the same schema serves English
 * and Hindi (D-08). Anything else (a server message already in the person's language) is shown as it is.
 */
export function resolveMessage(message: string | undefined, t: Messages): string {
  if (!message) return '';
  if (message.startsWith('validation.')) {
    const text = (t.validation as Record<string, string>)[message.slice('validation.'.length)];
    if (text) return text;
  }
  return message;
}
