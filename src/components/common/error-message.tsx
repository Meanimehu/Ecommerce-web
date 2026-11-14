'use client';

import { useState } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import type { Messages } from '@/lib/i18n';

/**
 * An error with no field (an error banner, Document 6, 8.10) and, only when a real one reached the browser, its reference
 * number with a quiet "Copy" button (Document 5, D5-14; Document 7, T7-4).
 */
export function ErrorMessage({
  text,
  requestId,
  messages,
}: {
  text: string;
  requestId?: string;
  messages: Messages;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Banner tone="error" role="alert">
      <p>{text}</p>
      {requestId ? (
        <Reference
          requestId={requestId}
          copied={copied}
          onCopy={() => setCopied(true)}
          messages={messages}
        />
      ) : null}
    </Banner>
  );
}

export function Reference({
  requestId,
  copied,
  onCopy,
  messages,
}: {
  requestId: string;
  copied: boolean;
  onCopy: () => void;
  messages: Messages;
}) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 type-small text-ink-2">
      <span>
        {messages.errors.requestId}: <span className="tabular-nums">{requestId}</span>
      </span>
      <Button
        type="button"
        variant="quiet"
        size="small"
        onClick={() => void navigator.clipboard?.writeText(requestId).then(onCopy)}
      >
        {copied ? messages.errors.copied : messages.errors.copy}
      </Button>
    </p>
  );
}
