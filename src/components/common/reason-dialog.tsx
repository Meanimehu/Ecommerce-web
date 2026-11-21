'use client';

import { lazy, Suspense, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ConfirmWithReason } from '@/hooks/use-reason-dialog';
import type { Messages } from '@/lib/i18n';

/** What a reason dialog says and does. */
export interface ReasonDialogText {
  title: string;
  body: string;
  label: string;
  confirmLabel: string;
  maxLength: number;
  onConfirm: ConfirmWithReason;
  messages: Messages;
}

/**
 * The form inside, loaded the first time a reason dialog opens: it brings the form code, which a
 * list page that only might ask for a reason should not carry (Document 6, section 14).
 */
const ReasonDialogForm = lazy(() =>
  import('./reason-dialog-form').then((module) => ({ default: module.ReasonDialogForm })),
);

/**
 * A confirmation that asks for a reason the other person will read (Document 6, 8.10): it names the thing and what
 * will happen, has "Cancel" and the verb, and stays open with the error in its summary when the backend refuses.
 * It only draws; the sending is in `hooks/use-reason-dialog.ts`, and the decision in the feature's hook. Each
 * opening starts with an empty reason.
 */
export function ReasonDialog({ trigger, ...text }: ReasonDialogText & { trigger: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        {isOpen ? (
          <Suspense
            fallback={
              <AlertDialogHeader>
                <AlertDialogTitle>{text.title}</AlertDialogTitle>
                <AlertDialogDescription>{text.body}</AlertDialogDescription>
              </AlertDialogHeader>
            }
          >
            <ReasonDialogForm text={text} onClose={() => setIsOpen(false)} />
          </Suspense>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
