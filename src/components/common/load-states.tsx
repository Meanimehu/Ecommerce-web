'use client';

import { useState } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { messageFor, toAppError } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { Reference } from './error-message';

/**
 * Loading and error states of one part of a screen (Document 5, section 3; Document 6, section 10). Loading is a still
 * skeleton shaped like the content, announced as "Loading". An error says what failed and offers "Try again" inside
 * that part only, with the reference number when a real one reached the browser (D5-14).
 */
export function LoadingBlock({ messages, lines = 4 }: { messages: Messages; lines?: number }) {
  return (
    <div role="status" className="grid gap-3">
      <span className="sr-only">{messages.states.loading}</span>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={i === 0 ? 'h-8 w-1/2' : 'h-12 w-full'} />
      ))}
    </div>
  );
}

export function PartError({ error, onRetry, messages, title }: { error: unknown; onRetry: () => void; messages: Messages; title?: string }) {
  const [copied, setCopied] = useState(false);
  const appError = toAppError(error);
  return (
    <Banner
      tone="error"
      role="alert"
      title={title ?? messages.states.loadFailed}
      action={
        <Button type="button" variant="secondary" size="small" onClick={onRetry}>
          {messages.errors.tryAgain}
        </Button>
      }
    >
      <p>{messageFor(appError, messages)}</p>
      {appError.requestId ? <Reference requestId={appError.requestId} copied={copied} onCopy={() => setCopied(true)} messages={messages} /> : null}
    </Banner>
  );
}
