import { ADMIN_ROLE, MODERATOR_ROLE } from '@/features/auth/types';

/**
 * Which admin screens each staff role may use (Document 5, section 8.3; Document 8, Slice 5 notes).
 * A page-access rule, so it belongs to `auth` (Document 7, 20.4): every admin page, the Admin menu
 * and the Admin home read it here, and the backend still checks every call. The roles and what they
 * may do are fixed by the backend; this only mirrors them so that nobody is offered a screen the
 * backend would refuse. Each Slice 5 part adds its screen when it builds it.
 */
export enum AdminScreen {
  Users = 'users',
  AuditLog = 'audit-log',
  Vendors = 'vendors',
  Catalogue = 'catalogue',
  Moderation = 'moderation',
}

const ROLES_BY_SCREEN: Record<AdminScreen, readonly string[]> = {
  [AdminScreen.Users]: [ADMIN_ROLE],
  [AdminScreen.AuditLog]: [ADMIN_ROLE],
  [AdminScreen.Vendors]: [ADMIN_ROLE],
  [AdminScreen.Catalogue]: [ADMIN_ROLE],
  [AdminScreen.Moderation]: [MODERATOR_ROLE, ADMIN_ROLE],
};

/** Whether these roles may open this admin screen: any one role that allows it is enough. */
export function canUseAdminScreen(roles: readonly string[], screen: AdminScreen): boolean {
  return ROLES_BY_SCREEN[screen].some((role) => roles.includes(role));
}

/** The admin screens these roles may use, in menu order. */
export function adminScreensFor(roles: readonly string[]): AdminScreen[] {
  return Object.values(AdminScreen).filter((screen) => canUseAdminScreen(roles, screen));
}
