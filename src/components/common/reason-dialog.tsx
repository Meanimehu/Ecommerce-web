'use client';

import type { ReactNode } from 'react';
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
import { useReasonDialog, type ConfirmWithReason } from '@/hooks/use-reason-dialog';
import type { Messages } from '@/lib/i18n';

/**
 * A confirmation that asks for a reason the other person will read (Document 6, 8.10): it names the thing and what
 * will happen, has "Cancel" and the verb, and stays open with the error in its summary when the backend refuses.
 * It only draws; the sending is in `hooks/use-reason-dialog.ts`, and the decision in the feature's hook.
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
  onConfirm: ConfirmWithReason;
  messages: Messages;
}) {
  const reasonDialog = useReasonDialog({ onConfirm, messages });
  const { form } = reasonDialog;
  return (
    <AlertDialog open={reasonDialog.isOpen} onOpenChange={reasonDialog.changeOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <form
          className="grid gap-4"
          noValidate
          onSubmit={(event) => void reasonDialog.submit(event)}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{body}</AlertDialogDescription>
          </AlertDialogHeader>
          <ErrorSummary
            form={form}
            fieldIds={{ reason: 'reason-dialog-reason' }}
            messages={messages}
            focusSignal={reasonDialog.focusSignal}
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
            <AlertDialogCancel disabled={reasonDialog.isSending}>
              {messages.common.cancel}
            </AlertDialogCancel>
            <Button type="submit" variant="destructiveConfirm" loading={reasonDialog.isSending}>
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
