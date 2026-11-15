'use client';

import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/lib/messages-context';
import { formatPhone } from '@/utils/format';
import { useProfileForm } from '@/features/account/hooks/use-profile-form';
import type { User } from '@/features/auth/types';

const FIELD_IDS = { name: 'profile-name', email: 'profile-email' } as const;

/**
 * The profile (Document 5, section 6.5; approved Stage 5 screens): the mobile number, shown but
 * not changed here, and the name and email, both optional (D5-04). It only draws; what happens on
 * save is in `use-profile-form.ts`.
 */
export function ProfileForm({ user }: { user: User }) {
  const messages = useMessages();
  const accountMessages = messages.account;
  const profileForm = useProfileForm({ user });
  const { form, saveProfile, showValidationErrors } = profileForm;

  return (
    <Form
      className="grid max-w-[480px] gap-5"
      onSubmit={form.handleSubmit(saveProfile, showValidationErrors)}
    >
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={profileForm.requestId}
        focusSignal={profileForm.focusSignal}
      />
      <div className="grid gap-1">
        <p className="type-label text-ink">{accountMessages.phone}</p>
        <p className="text-ink tabular-nums">{formatPhone(user.phone)}</p>
        <p className="type-small text-muted-foreground">{accountMessages.phoneHelp}</p>
      </div>
      <TextField
        form={form}
        name="name"
        id={FIELD_IDS.name}
        label={accountMessages.name}
        optional
        messages={messages}
        inputProps={{ autoComplete: 'name', maxLength: 100 }}
      />
      <TextField
        form={form}
        name="email"
        id={FIELD_IDS.email}
        label={accountMessages.email}
        optional
        messages={messages}
        inputProps={{ type: 'email', autoComplete: 'email', maxLength: 255 }}
      />
      <div>
        <Button type="submit" loading={profileForm.isSaving}>
          {accountMessages.saveProfile}
        </Button>
      </div>
    </Form>
  );
}
