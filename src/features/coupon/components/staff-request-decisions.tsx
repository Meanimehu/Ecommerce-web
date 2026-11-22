'use client';

import { useState } from 'react';
import { ReasonDialog } from '@/components/common/reason-dialog';
import { ErrorSummary } from '@/components/form/error-summary';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';
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
import { useMessages } from '@/lib/messages-context';
import { useApproveForm, useRequestDecision } from '@/features/coupon/hooks/use-request-decision';
import { REQUEST_NOTE_MAX_LENGTH, type CouponRequest } from '@/features/coupon/types';

/**
 * The three decisions on a submitted request: Approve (with the final code and a note), Ask for
 * changes and Reject (each with a note the vendor reads). Loaded only for the roles that decide, so
 * the others do not carry the forms (Document 6, section 14). What happens on a press is in
 * `use-request-decision.ts`.
 */
export function StaffRequestDecisions({ request }: { request: CouponRequest }) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staffRequests;
  const decision = useRequestDecision(request.id);
  return (
    <div className="flex flex-wrap gap-3">
      <ApproveRequest request={request} />
      <ReasonDialog
        messages={messages}
        trigger={
          <Button type="button" variant="secondary" loading={decision.isDeciding}>
            {staffMessages.requestChanges}
          </Button>
        }
        title={staffMessages.requestChangesTitle}
        body={staffMessages.requestChangesBody}
        label={staffMessages.changesNote}
        confirmLabel={staffMessages.requestChanges}
        maxLength={REQUEST_NOTE_MAX_LENGTH}
        onConfirm={decision.requestChanges}
      />
      <ReasonDialog
        messages={messages}
        trigger={
          <Button type="button" variant="destructive" loading={decision.isDeciding}>
            {staffMessages.reject}
          </Button>
        }
        title={staffMessages.rejectTitle}
        body={staffMessages.rejectBody}
        label={staffMessages.rejectNote}
        confirmLabel={staffMessages.reject}
        maxLength={REQUEST_NOTE_MAX_LENGTH}
        onConfirm={decision.reject}
      />
    </div>
  );
}

function ApproveRequest({ request }: { request: CouponRequest }) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staffRequests;
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button">{staffMessages.approve}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {isOpen ? <ApproveForm request={request} onClose={() => setIsOpen(false)} /> : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** New each time the dialog opens, so each opening starts empty. */
function ApproveForm({ request, onClose }: { request: CouponRequest; onClose: () => void }) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staffRequests;
  const approveForm = useApproveForm({ id: request.id, onClose });
  const { form } = approveForm;
  return (
    <form className="grid gap-4" noValidate onSubmit={(event) => void approveForm.submit(event)}>
      <AlertDialogHeader>
        <AlertDialogTitle>{staffMessages.approveTitle}</AlertDialogTitle>
        <AlertDialogDescription>{staffMessages.approveBody}</AlertDialogDescription>
      </AlertDialogHeader>
      <ErrorSummary
        form={form}
        fieldIds={{ code: 'approve-code', note: 'approve-note' }}
        messages={messages}
        requestId={approveForm.requestId}
        focusSignal={approveForm.focusSignal}
      />
      <TextField
        form={form}
        name="code"
        id="approve-code"
        label={staffMessages.finalCode}
        description={staffMessages.finalCodeHelp}
        optional
        messages={messages}
        inputProps={{
          autoComplete: 'off',
          spellCheck: false,
          maxLength: 20,
          placeholder: request.proposedCode ?? undefined,
          className: 'uppercase',
        }}
      />
      <TextareaField
        form={form}
        name="note"
        id="approve-note"
        label={staffMessages.approveNote}
        optional
        maxLength={REQUEST_NOTE_MAX_LENGTH}
        messages={messages}
      />
      <AlertDialogFooter>
        <AlertDialogCancel disabled={approveForm.isSending}>
          {messages.common.cancel}
        </AlertDialogCancel>
        <Button type="submit" loading={approveForm.isSending}>
          {staffMessages.approve}
        </Button>
      </AlertDialogFooter>
    </form>
  );
}
