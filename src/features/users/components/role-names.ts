import type { Messages } from '@/lib/i18n';
import { isAnyRole } from '@/features/users/types';

/** A person's roles in words, joined by commas; a role the frontend does not know yet keeps its own name. */
export function roleNames(roles: readonly string[], messages: Messages): string {
  return roles.map((role) => (isAnyRole(role) ? messages.users.roleNames[role] : role)).join(', ');
}
