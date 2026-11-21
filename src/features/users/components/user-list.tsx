'use client';

import { Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminUserPath, adminUsersPath } from '@/lib/routes';
import { formatDate, formatPhone } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { useUserList } from '@/features/users/hooks/use-users';
import {
  ALL_ROLES,
  isAnyRole,
  isUserStatus,
  USER_STATUSES,
  type AdminUser,
} from '@/features/users/types';
import { roleNames } from './role-names';
import { UserStatusChip } from './user-status-chip';

/**
 * Users and roles (Document 5, section 8.3; Document 8, Slice 5 notes): find people by part of
 * their phone number, a role or a status, all kept in the address so a link can be shared and the
 * back button works, with only the filters that are set; numbered pages; the phone number opens the
 * person's page. An unknown role or status in the address is left out, not sent.
 */
const PAGE_SIZE = 20;
const PHONE_MAX_LENGTH = 20;

export function UserList({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const usersMessages = messages.users;
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';
  const roleParam = searchParams.get('role') ?? '';
  const role = isAnyRole(roleParam) ? roleParam : '';
  const statusParam = searchParams.get('status') ?? '';
  const status = isUserStatus(statusParam) ? statusParam : '';
  const page = pageNumber(searchParams.get('page'));
  const userList = useUserList({ phone, role, status, page, limit: PAGE_SIZE });
  const listPage = adminUsersPath(lang);
  const hasFilters = Boolean(phone || role || status);
  const hrefFor = (pageToShow: number) =>
    withQuery(listPage, { phone, role, status, page: pageToShow === 1 ? undefined : pageToShow });

  /** With scripts, only the filters that are set go into the address; without, the form still works. */
  function showResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = new FormData(event.currentTarget);
    const valueOf = (name: string) => String(chosen.get(name) ?? '').trim();
    router.push(
      withQuery(listPage, {
        phone: valueOf('phone'),
        role: valueOf('role'),
        status: valueOf('status'),
      }),
    );
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'phone',
      header: usersMessages.columns.phone,
      lead: true,
      cell: (user) => (
        <a
          href={adminUserPath(lang, user.id)}
          className="inline-flex min-h-11 items-center font-medium whitespace-nowrap tabular-nums underline underline-offset-4"
        >
          {formatPhone(user.phone)}
        </a>
      ),
    },
    {
      key: 'status',
      header: usersMessages.columns.status,
      lead: true,
      cell: (user) => <UserStatusChip status={user.status} messages={messages} />,
    },
    {
      key: 'name',
      header: usersMessages.columns.name,
      cell: (user) => user.name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'roles',
      header: usersMessages.columns.roles,
      cell: (user) => roleNames(user.roles, messages),
    },
    {
      key: 'lastLogin',
      header: usersMessages.columns.lastLogin,
      cell: (user) => (
        <span className="whitespace-nowrap">
          {user.lastLoginAt ? formatDate(user.lastLoginAt, lang) : usersMessages.never}
        </span>
      ),
    },
  ];

  return (
    <div className="grid gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{usersMessages.title}</h1>
      <form
        method="get"
        action={listPage}
        onSubmit={showResults}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_200px_auto] lg:items-start"
      >
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{usersMessages.filters.phone}</span>
          <Input
            type="search"
            name="phone"
            inputMode="tel"
            defaultValue={phone}
            maxLength={PHONE_MAX_LENGTH}
            aria-describedby="user-phone-help"
          />
          <span id="user-phone-help" className="type-small text-muted-foreground">
            {usersMessages.filters.phoneHelp}
          </span>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{usersMessages.filters.role}</span>
          <Select name="role" defaultValue={role}>
            <option value="">{usersMessages.filters.allRoles}</option>
            {ALL_ROLES.map((anyRole) => (
              <option key={anyRole} value={anyRole}>
                {usersMessages.roleNames[anyRole]}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{usersMessages.filters.status}</span>
          <Select name="status" defaultValue={status}>
            <option value="">{usersMessages.filters.allStatuses}</option>
            {USER_STATUSES.map((userStatus) => (
              <option key={userStatus} value={userStatus}>
                {usersMessages.statuses[userStatus]}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex gap-2 lg:mt-[26px]">
          <Button type="submit" variant="secondary">
            {usersMessages.filters.show}
          </Button>
          {hasFilters ? (
            <Button asChild variant="quiet">
              <a href={listPage}>{usersMessages.filters.clear}</a>
            </Button>
          ) : null}
        </div>
      </form>
      <UserListResults userList={userList} columns={columns} page={page} hrefFor={hrefFor} />
    </div>
  );
}

/** The list itself: loading, failed, empty, or the table with its pages. */
function UserListResults({
  userList,
  columns,
  page,
  hrefFor,
}: {
  userList: ReturnType<typeof useUserList>;
  columns: Column<AdminUser>[];
  page: number;
  hrefFor: (pageToShow: number) => string;
}) {
  const messages = useMessages();
  const usersMessages = messages.users;

  if (userList.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (userList.isError) {
    return (
      <PartError
        error={userList.error}
        onRetry={() => void userList.refetch()}
        messages={messages}
      />
    );
  }
  if (userList.data.items.length === 0) {
    return (
      <StateBlock
        icon={Users}
        title={usersMessages.empty}
        text={usersMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={userList.data.items}
        columns={columns}
        rowKey={(user) => user.id}
        caption={usersMessages.title}
      />
      <Pagination
        page={page}
        limit={userList.data.limit}
        total={userList.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
