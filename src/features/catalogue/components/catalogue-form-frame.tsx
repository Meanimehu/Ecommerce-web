'use client';

import type { FormEventHandler, ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/lib/messages-context';

/**
 * The frame every catalogue form shares: a heading that takes focus when the form opens, the error
 * summary, the fields, and Save and Cancel.
 */
export function CatalogueFormFrame<TValues extends FieldValues>({
  title,
  form,
  fieldIds,
  requestId,
  focusSignal,
  isSaving,
  onSubmit,
  onCancel,
  children,
}: {
  title: string;
  form: UseFormReturn<TValues, unknown, FieldValues>;
  fieldIds: Record<string, string>;
  requestId?: string;
  focusSignal: number;
  isSaving: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  children: ReactNode;
}) {
  const messages = useMessages();
  return (
    <Form
      className="grid max-w-[720px] gap-4 rounded-1 border border-control bg-surface p-5 sm:p-6"
      onSubmit={onSubmit}
    >
      <h2 tabIndex={-1} className="type-h3 text-ink outline-none">
        {title}
      </h2>
      <ErrorSummary
        form={form}
        fieldIds={fieldIds}
        messages={messages}
        requestId={requestId}
        focusSignal={focusSignal}
      />
      {children}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="quiet" busy={isSaving} onClick={onCancel}>
          {messages.common.cancel}
        </Button>
        <Button type="submit" loading={isSaving}>
          {messages.catalogue.save}
        </Button>
      </div>
    </Form>
  );
}
