import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  AdminUserPageSchema,
  AdminUserSchema,
  UserAction,
  type BlockBody,
  type GrantRoleBody,
} from '@/features/users/types';

/**
 * Backend Area 1, user and role management (area-1-accounts.md, section 4): admin only. One
 * function per backend operation. Bodies are passed on as the browser sent them; the backend checks
 * every field and refuses unknown ones.
 */
const userPath = (id: string) => `/admin/users/${encodeURIComponent(id)}`;

export const listUsers = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: '/admin/users',
    query,
    kind: 'view',
    token,
    schema: AdminUserPageSchema,
  });

export const getUser = (token: string, id: string) =>
  callBackend({ method: 'GET', path: userPath(id), kind: 'view', token, schema: AdminUserSchema });

/** Block (with a reason) or unblock (no body). */
export const changeUser = (
  token: string,
  id: string,
  action: UserAction,
  body: Partial<BlockBody>,
) =>
  callBackend({
    method: 'POST',
    path: `${userPath(id)}/${action}`,
    kind: 'save',
    token,
    body: action === UserAction.Block ? body : undefined,
    schema: AdminUserSchema,
  });

export const grantRole = (token: string, id: string, body: Partial<GrantRoleBody>) =>
  callBackend({
    method: 'POST',
    path: `${userPath(id)}/roles`,
    kind: 'save',
    token,
    body,
    schema: AdminUserSchema,
  });

export const removeRole = (token: string, id: string, role: string) =>
  callBackend({
    method: 'DELETE',
    path: `${userPath(id)}/roles/${encodeURIComponent(role)}`,
    kind: 'save',
    token,
    schema: null,
  });
