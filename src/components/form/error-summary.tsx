'use client';

import { CircleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/messages';
import { resolveMessage } from './messages';

/**
 * The error summary at the top of a form (Document 5, section 10; Document 6, section 9). It lists every error after a
 * failed submit: field errors as links that move focus to their field, and errors with no field (or for a field the
 * screen does not have) as plain entries. It is a labelled region that takes focus and is announced. The reference
 * number shows with a Copy button only when it reached the browser (D5-14; T7-4).
 */
export function ErrorSummary<TValues extends FieldValues>({
  form,
  fieldIds,
  t,
  requestId,
  focusSignal,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  /** Form field name -> the id of its input, in the order the fields appear. */
  fieldIds: Partial<Record<keyof TValues & string, string>>;
  t: Messages;
  requestId?: string;
  /** Changes each time the summary must take focus (after a failed submit). */
  focusSignal: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const { errors, submitCount } = form.formState;

  const fieldEntries = Object.entries(fieldIds)
    .filter(([name]) => errors[name])
    .map(([name, id]) => ({ id: id as string, text: resolveMessage(errors[name]?.message as string | undefined, t) }));
  const rootEntries = Object.values(errors.root ?? {})
    .filter((e): e is { message: string } => typeof e === 'object' && e !== null && typeof (e as { message?: unknown }).message === 'string')
    .map((e) => e.message);
  const count = fieldEntries.length + rootEntries.length;
  const visible = count > 0 && (submitCount > 0 || rootEntries.length > 0);


  // React Hook Form marks the submit after the form's callbacks run, so the summary may appear one render after the
  // signal. Focus it once it is on screen, once per signal.
  const handled = useRef(0);
  useEffect(() => {
    if (visible && focusSignal > handled.current && ref.current) {
      handled.current = focusSignal;
      ref.current.focus();
    }
  });

  if (!visible) return null;
  const heading = count === 1 ? t.form.summaryOne : fill(t.form.summaryMany, { count });
  return (
    <div ref={ref} tabIndex={-1} role="alert" aria-labelledby="error-summary-heading" className="space-y-2 rounded-md border-2 border-destructive p-3 outline-none focus-visible:ring-2">
      <h2 id="error-summary-heading" className="flex items-center gap-2 font-semibold">
        <CircleAlert aria-hidden="true" className="size-4" />
        {heading}
      </h2>
      <ul className="list-disc space-y-1 ps-6 text-sm">
        {fieldEntries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className="underline underline-offset-4"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(entry.id)?.focus();
              }}
            >
              {entry.text}
            </a>
          </li>
        ))}
        {rootEntries.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
      {requestId && rootEntries.length > 0 ? (
        <p className="flex flex-wrap items-center gap-2 text-xs">
          <span>
            {t.errors.requestId}: <span className="font-mono">{requestId}</span>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void navigator.clipboard?.writeText(requestId).then(() => setCopiedFor(requestId))}>
            {copiedFor === requestId ? t.errors.copied : t.errors.copy}
          </Button>
        </p>
      ) : null}
    </div>
  );
}
