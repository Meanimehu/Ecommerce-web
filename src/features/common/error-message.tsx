'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Messages } from '@/lib/messages';

/**
 * An error message with the request id and a "Copy" button, shown only when the id actually reached the browser
 * (Document 5, D5-14; Document 7, T7-4).
 */
export function ErrorMessage({ text, requestId, t }: { text: string; requestId?: string; t: Messages }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="alert" className="space-y-1 text-sm">
      <p>{text}</p>
      {requestId ? (
        <p className="flex flex-wrap items-center gap-2 text-xs">
          <span>
            {t.errors.requestId}: <span className="font-mono">{requestId}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(requestId).then(() => setCopied(true));
            }}
          >
            {copied ? t.errors.copied : t.errors.copy}
          </Button>
        </p>
      ) : null}
    </div>
  );
}
