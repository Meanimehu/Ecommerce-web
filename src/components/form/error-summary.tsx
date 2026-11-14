'use client';

import { CircleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { get, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { Reference } from '@/components/common/error-message';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { resolveMessage } from '@/hooks/use-app-form';

/**
 * The error summary at the top of a form (Document 5, section 10; Document 6, section 9). It lists every error after a
 * failed submit: field errors as links that move focus to their field, and errors with no field (or for a field the
 * screen does not have) as plain entries. It is a labelled region that takes focus and is announced. The reference
 * number shows with a Copy button only when it reached the browser (D5-14; T7-4).
 */
export function ErrorSummary<TValues extends FieldValues>({
  form,
  fieldIds,
  messages,
  requestId,
  focusSignal,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  /** Form field name (nested ones as "attributes.0.key") -> the id of its input, in the order the fields appear. */
  fieldIds: Partial<Record<keyof TValues & string, string>> | Record<string, string>;
  messages: Messages;
  requestId?: string;
  /** Changes each time the summary must take focus (after a failed submit). */
  focusSignal: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const { errors, submitCount } = form.formState;

  const fieldEntries = Object.entries(fieldIds)
    .filter(([name]) => get(errors, name))
    .map(([name, id]) => ({
      id: id as string,
      text: resolveMessage(
        (get(errors, name) as { message?: string } | undefined)?.message,
        messages,
      ),
    }));
  const rootEntries = Object.values(errors.root ?? {})
    .filter(
      (entry): entry is { message: string } =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { message?: unknown }).message === 'string',
    )
    .map((entry) => entry.message);
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
  const heading =
    count === 1 ? messages.form.summaryOne : fill(messages.form.summaryMany, { count });
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-heading"
      className="flex items-start gap-3 rounded-1 border border-error-edge bg-error-fill px-4 py-3.5"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error" />
      <div className="grid min-w-0 flex-1 gap-1">
        <h2 id="error-summary-heading" className="font-medium text-error">
          {heading}
        </h2>
        <ul className="list-disc space-y-1 ps-5 type-small text-ink">
          {fieldEntries.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className="text-madder underline underline-offset-4 hover:text-madder-hover"
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
          <Reference
            requestId={requestId}
            copied={copiedFor === requestId}
            onCopy={() => setCopiedFor(requestId)}
            messages={messages}
          />
        ) : null}
      </div>
    </div>
  );
}
