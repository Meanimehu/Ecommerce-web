import { ADMIN_ROLE, MODERATOR_ROLE } from '@/features/auth/types';

/**
 * Which admin screens each staff role may use (Document 5, section 8.3; approved Stage 5). A
 * page-access rule, so it belongs to `auth` (Document 7, 20.4): the Admin menu and the Admin home
 * show it, and the backend still checks every call.
 */
export enum AdminScreen {
  Vendors = 'vendors',
  Catalogue = 'catalogue',
  Moderation = 'moderation',
}

const ROLES_BY_SCREEN: Record<AdminScreen, readonly string[]> = {
  [AdminScreen.Vendors]: [ADMIN_ROLE],
  [AdminScreen.Catalogue]: [ADMIN_ROLE],
  [AdminScreen.Moderation]: [MODERATOR_ROLE, ADMIN_ROLE],
};

/** The admin screens these roles may use, in menu order. */
export function adminScreensFor(roles: readonly string[]): AdminScreen[] {
  return Object.values(AdminScreen).filter((screen) =>
    ROLES_BY_SCREEN[screen].some((role) => roles.includes(role)),
  );
}
