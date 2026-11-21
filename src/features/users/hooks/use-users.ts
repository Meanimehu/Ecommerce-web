'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, remove, send } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type { AdminUser, StaffRole, UserAction } from '@/features/users/types';

/**
 * The calls of `users`, one hook per call, to our own /api/admin/users endpoints, never to the
 * backend (D3-03). After any change the person and the lists are read again, so the screen shows
 * what the backend now holds (Document 5, section 3).
 */
const userPath = (id: string) => `/api/admin/users/${encodeURIComponent(id)}`;

export const userKeys = {
  /** Every read: the lists and each person. */
  all: ['users'] as const,
  list: (query: Query) => ['users', 'list', query] as const,
  one: (id: string) => ['users', id] as const,
};

export function useUserList(query: Query) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => get<Page<AdminUser>>(withQuery('/api/admin/users', query)),
    staleTime: 30_000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.one(id),
    queryFn: () => get<AdminUser>(userPath(id)),
    staleTime: 0,
  });
}

function useReloadUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: userKeys.all });
}

export interface UserActionInput {
  action: UserAction;
  reason?: string;
}

export function useChangeUser(id: string) {
  const reloadUsers = useReloadUsers();
  return useMutation({
    mutationFn: ({ action, reason }: UserActionInput) =>
      send<AdminUser>(`${userPath(id)}/${action}`, reason === undefined ? {} : { reason }),
    onSettled: reloadUsers,
  });
}

export function useGrantRole(id: string) {
  const reloadUsers = useReloadUsers();
  return useMutation({
    mutationFn: (role: StaffRole) => send<AdminUser>(`${userPath(id)}/roles`, { role }),
    onSettled: reloadUsers,
  });
}

export function useRemoveRole(id: string) {
  const reloadUsers = useReloadUsers();
  return useMutation({
    mutationFn: (role: StaffRole) => remove(`${userPath(id)}/roles/${encodeURIComponent(role)}`),
    onSettled: reloadUsers,
  });
}
