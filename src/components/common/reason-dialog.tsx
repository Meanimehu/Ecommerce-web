'use client';

import { useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/form/error-summary';
import { TextareaField } from '@/components/form/textarea-field';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { toAppError } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { ReasonSchema, type ReasonInput } from '@/types/common';

/**
 * A confirmation that asks for a reason the other person will read (Document 6, 8.10): it names the thing and what
 * will happen, has "Cancel" and the verb, and stays open with the error in its summary when the backend refuses.
 */
export function ReasonDialog({
  trigger,
  title,
  body,
  label,
  confirmLabel,
  maxLength,
  onConfirm,
  messages,
}: {
  trigger: ReactNode;
  title: string;
  body: string;
  label: string;
  confirmLabel: string;
  maxLength: number;
  onConfirm: (reason: string) => Promise<unknown>;
  messages: Messages;
}) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const form = useAppForm<ReasonInput, { reason: string }>(ReasonSchema, { reason: '' });
  const submit = form.handleSubmit(
    async (values) => {
      try {
        await onConfirm(values.reason);
        form.reset();
        setOpen(false);
      } catch (error) {
        applyServerError(form, toAppError(error), messages);
        setFocus((n) => n + 1);
      }
    },
    () => setFocus((n) => n + 1),
  );
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <form className="grid gap-4" noValidate onSubmit={(event) => void submit(event)}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{body}</AlertDialogDescription>
          </AlertDialogHeader>
          <ErrorSummary
            form={form}
            fieldIds={{ reason: 'reason-dialog-reason' }}
            messages={messages}
            focusSignal={focus}
          />
          <TextareaField
            form={form}
            name="reason"
            id="reason-dialog-reason"
            label={label}
            maxLength={maxLength}
            messages={messages}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={form.formState.isSubmitting}>
              {messages.common.cancel}
            </AlertDialogCancel>
            <Button
              type="submit"
              variant="destructiveConfirm"
              loading={form.formState.isSubmitting}
            >
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
