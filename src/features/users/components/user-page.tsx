'use client';

import { useId, type ReactNode } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ReasonDialog } from '@/components/common/reason-dialog';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { fill, messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminUsersPath } from '@/lib/routes';
import { formatDate, formatPhone, formatTime } from '@/utils/format';
import { VENDOR_OWNER_ROLE } from '@/features/auth/types';
import { useUserActions } from '@/features/users/hooks/use-user-actions';
import { useUser } from '@/features/users/hooks/use-users';
import {
  BLOCK_REASON_MAX_LENGTH,
  isStaffRole,
  rolesToAdd,
  UserStatus,
  type AdminUser,
  type StaffRole,
} from '@/features/users/types';
import { roleNames } from './role-names';
import { UserStatusChip } from './user-status-chip';

/**
 * One person, for an admin (Document 5, section 8.3; Document 8, Slice 5 notes): their details,
 * their roles (staff roles can be removed, and one added at a time; "customer" and "vendor owner"
 * are shown but not changed here), and blocking or unblocking the account. What each change does
 * is in `features/users/hooks/use-user-actions.ts`.
 */
type UserActions = ReturnType<typeof useUserActions>;

const ADD_ROLE_FIELD_IDS = { role: 'add-role' };

export function UserPage({ lang, id }: { lang: Locale; id: string }) {
  const messages = useMessages();
  const user = useUser(id);
  return (
    <div className="grid max-w-[960px] gap-5">
      <Breadcrumbs
        label={messages.nav.breadcrumbs}
        items={[
          { label: messages.users.title, href: adminUsersPath(lang) },
          { label: user.data ? formatPhone(user.data.phone) : messages.users.user },
        ]}
      />
      <UserPageContent lang={lang} user={user} />
    </div>
  );
}

function UserPageContent({ lang, user }: { lang: Locale; user: ReturnType<typeof useUser> }) {
  const messages = useMessages();
  if (user.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (user.isError) {
    return <PartError error={user.error} onRetry={() => void user.refetch()} messages={messages} />;
  }
  return <UserDetails lang={lang} user={user.data} />;
}

function UserDetails({ lang, user }: { lang: Locale; user: AdminUser }) {
  const messages = useMessages();
  const usersMessages = messages.users;
  const actions = useUserActions(user);
  const notGiven = <span className="text-muted-foreground">{usersMessages.notGiven}</span>;
  const when = (time: string) => `${formatDate(time, lang)}, ${formatTime(time, lang)}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink tabular-nums">{formatPhone(user.phone)}</h1>
        <UserStatusChip status={user.status} messages={messages} />
      </div>
      {actions.actionError ? (
        <ErrorMessage
          text={messageFor(actions.actionError, messages)}
          requestId={actions.actionError.requestId}
          messages={messages}
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={usersMessages.details}>
          <dl className="grid gap-2">
            <Row label={usersMessages.name}>{user.name ?? notGiven}</Row>
            <Row label={usersMessages.email}>{user.email ?? notGiven}</Row>
            <Row label={usersMessages.createdAt}>{when(user.createdAt)}</Row>
            <Row label={usersMessages.lastLoginAt}>
              {user.lastLoginAt ? when(user.lastLoginAt) : usersMessages.never}
            </Row>
            {user.blockedAt ? (
              <Row label={usersMessages.blockedAt}>{when(user.blockedAt)}</Row>
            ) : null}
            {user.blockReason ? (
              <Row label={usersMessages.blockReason}>
                <span className="whitespace-pre-line">{user.blockReason}</span>
              </Row>
            ) : null}
          </dl>
        </Card>
        <Card title={usersMessages.rolesTitle}>
          <p className="type-small text-ink-2">{usersMessages.rolesHelp}</p>
          <RoleList user={user} actions={actions} />
          <AddRole user={user} actions={actions} />
        </Card>
      </div>

      <Card title={usersMessages.access}>
        <AccessControl user={user} actions={actions} />
      </Card>
    </>
  );
}

/** Each role the person holds; only staff roles have "Remove", which asks first. */
function RoleList({ user, actions }: { user: AdminUser; actions: UserActions }) {
  const messages = useMessages();
  const usersMessages = messages.users;
  return (
    <ul className="grid divide-y divide-line">
      {user.roles.map((role) => (
        <li key={role} className="flex min-h-12 flex-wrap items-center justify-between gap-3 py-2">
          <div className="grid gap-0.5">
            <p className="font-medium text-ink">{roleNames([role], messages)}</p>
            {isStaffRole(role) ? null : (
              <p className="type-small text-ink-2">
                {role === VENDOR_OWNER_ROLE ? usersMessages.fromVendor : usersMessages.automatic}
              </p>
            )}
          </div>
          {isStaffRole(role) ? (
            <RemoveRole
              role={role}
              name={roleNames([role], messages)}
              isBusy={actions.removingRole === role}
              onRemove={actions.takeAwayRole}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function RemoveRole({
  role,
  name,
  isBusy,
  onRemove,
}: {
  role: StaffRole;
  name: string;
  isBusy: boolean;
  onRemove: (role: StaffRole) => void;
}) {
  const usersMessages = useMessages().users;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="secondary" size="small" loading={isBusy}>
          {usersMessages.remove}
          <span className="sr-only">: {name}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{fill(usersMessages.removeTitle, { role: name })}</AlertDialogTitle>
          <AlertDialogDescription>{usersMessages.removeBody}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{usersMessages.keep}</AlertDialogCancel>
          <AlertDialogAction variant="destructiveConfirm" onClick={() => onRemove(role)}>
            {usersMessages.remove}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** "Add role": a choice of the staff roles the person does not hold yet. */
function AddRole({ user, actions }: { user: AdminUser; actions: UserActions }) {
  const messages = useMessages();
  const usersMessages = messages.users;
  const choices = rolesToAdd(user.roles);
  if (choices.length === 0) {
    return <p className="type-small text-ink-2">{usersMessages.allRolesHeld}</p>;
  }
  const form = actions.addRoleForm;
  return (
    <Form
      className="grid gap-3"
      onSubmit={form.handleSubmit(actions.addRole, actions.showAddRoleCheck)}
    >
      <ErrorSummary
        form={form}
        fieldIds={ADD_ROLE_FIELD_IDS}
        messages={messages}
        requestId={actions.addRoleRequestId}
        focusSignal={actions.addRoleFocusSignal}
      />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 grow">
          <SelectField
            form={form}
            name="role"
            id={ADD_ROLE_FIELD_IDS.role}
            label={usersMessages.role}
            placeholder={messages.form.choose}
            options={choices.map((role) => ({ value: role, label: usersMessages.roleNames[role] }))}
            messages={messages}
          />
        </div>
        <Button type="submit" variant="secondary" loading={actions.isAddingRole}>
          {usersMessages.addRole}
        </Button>
      </div>
    </Form>
  );
}

/** Block (with a reason) while active, unblock while blocked. */
function AccessControl({ user, actions }: { user: AdminUser; actions: UserActions }) {
  const messages = useMessages();
  const usersMessages = messages.users;
  if (user.status === UserStatus.Blocked) {
    return (
      <div className="grid gap-3">
        <p className="text-ink-2">{usersMessages.unblockText}</p>
        <div>
          <Button
            type="button"
            variant="secondary"
            loading={actions.isUnblocking}
            onClick={actions.unblockUser}
          >
            {usersMessages.unblock}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      <p className="text-ink-2">{usersMessages.blockText}</p>
      <div>
        <ReasonDialog
          messages={messages}
          trigger={
            <Button type="button" variant="destructive">
              {usersMessages.block}
            </Button>
          }
          title={fill(usersMessages.blockTitle, { phone: formatPhone(user.phone) })}
          body={usersMessages.blockBody}
          label={usersMessages.reasonLabel}
          confirmLabel={usersMessages.blockConfirm}
          maxLength={BLOCK_REASON_MAX_LENGTH}
          onConfirm={actions.blockUser}
        />
      </div>
    </div>
  );
}

/** A titled part of the page, named by its heading so screen readers can move between parts. */
function Card({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="grid content-start gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id={headingId} className="type-h3 text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
      <dt className="type-small text-ink-2">{label}</dt>
      <dd className="text-ink break-words">{children}</dd>
    </div>
  );
}
