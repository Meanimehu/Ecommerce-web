'use client';

import {
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/form/error-summary';
import { TextareaField } from '@/components/form/textarea-field';
import { useReasonDialog } from '@/hooks/use-reason-dialog';
import type { ReasonDialogText } from './reason-dialog';

/**
 * The inside of an open reason dialog: the reason box with its check, and the two buttons. It is
 * loaded the first time a reason dialog opens, so a page that only might ask for a reason does not
 * carry the form code (Document 6, section 14). It only draws; the sending is in
 * `hooks/use-reason-dialog.ts`.
 */
export function ReasonDialogForm({
  text,
  onClose,
}: {
  text: ReasonDialogText;
  onClose: () => void;
}) {
  const { messages } = text;
  const reasonDialog = useReasonDialog({ onConfirm: text.onConfirm, messages, onClose });
  const { form } = reasonDialog;
  return (
    <form className="grid gap-4" noValidate onSubmit={(event) => void reasonDialog.submit(event)}>
      <AlertDialogHeader>
        <AlertDialogTitle>{text.title}</AlertDialogTitle>
        <AlertDialogDescription>{text.body}</AlertDialogDescription>
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
        label={text.label}
        maxLength={text.maxLength}
        messages={messages}
      />
      <AlertDialogFooter>
        <AlertDialogCancel disabled={reasonDialog.isSending}>
          {messages.common.cancel}
        </AlertDialogCancel>
        <Button type="submit" variant="destructiveConfirm" loading={reasonDialog.isSending}>
          {text.confirmLabel}
        </Button>
      </AlertDialogFooter>
    </form>
  );
}
