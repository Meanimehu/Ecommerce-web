import {
  ADMIN_ROLE,
  FINANCE_ROLE,
  MARKETING_ROLE,
  MODERATOR_ROLE,
  SUPPORT_ROLE,
} from '@/features/auth/types';

/**
 * Which admin screens each staff role may use (Document 5, section 8.3; Document 8, Slice 5 notes).
 * A page-access rule, so it belongs to `auth` (Document 7, 20.4): every admin page, the Admin menu
 * and the Admin home read it here, and the backend still checks every call. The roles and what they
 * may do are fixed by the backend; this only mirrors them so that nobody is offered a screen the
 * backend would refuse. Each part adds its screen when it builds it (the held items add Coupons).
 */
export enum AdminScreen {
  Users = 'users',
  AuditLog = 'audit-log',
  Vendors = 'vendors',
  Catalogue = 'catalogue',
  Moderation = 'moderation',
  Sales = 'sales',
  Coupons = 'coupons',
  CouponRequests = 'coupon-requests',
}

const ROLES_BY_SCREEN: Record<AdminScreen, readonly string[]> = {
  [AdminScreen.Users]: [ADMIN_ROLE],
  [AdminScreen.AuditLog]: [ADMIN_ROLE],
  [AdminScreen.Vendors]: [ADMIN_ROLE],
  [AdminScreen.Catalogue]: [ADMIN_ROLE],
  [AdminScreen.Moderation]: [MODERATOR_ROLE, ADMIN_ROLE],
  [AdminScreen.Sales]: [ADMIN_ROLE, MODERATOR_ROLE, MARKETING_ROLE, FINANCE_ROLE, SUPPORT_ROLE],
  [AdminScreen.Coupons]: [ADMIN_ROLE, MARKETING_ROLE, FINANCE_ROLE, SUPPORT_ROLE],
  [AdminScreen.CouponRequests]: [ADMIN_ROLE, MARKETING_ROLE, FINANCE_ROLE, SUPPORT_ROLE],
};

/**
 * Who may create, change, disable and enable coupons, and decide coupon requests; finance and
 * support read both, with "View only".
 */
const COUPON_CHANGE_ROLES: readonly string[] = [ADMIN_ROLE, MARKETING_ROLE];

export const canChangeCoupons = (roles: readonly string[]) =>
  COUPON_CHANGE_ROLES.some((role) => roles.includes(role));

/** Who may cancel a sale: the other Sales roles read it, with "View only". */
const SALE_CANCEL_ROLES: readonly string[] = [ADMIN_ROLE, MODERATOR_ROLE];

/** Who may read any variant's stock history; it has no menu entry, only links from Sales and Moderation. */
const STOCK_HISTORY_ROLES: readonly string[] = [ADMIN_ROLE, MODERATOR_ROLE, SUPPORT_ROLE];

export const canCancelSales = (roles: readonly string[]) =>
  SALE_CANCEL_ROLES.some((role) => roles.includes(role));

export const canReadStockHistory = (roles: readonly string[]) =>
  STOCK_HISTORY_ROLES.some((role) => roles.includes(role));

/** Whether these roles may open this admin screen: any one role that allows it is enough. */
export function canUseAdminScreen(roles: readonly string[], screen: AdminScreen): boolean {
  return ROLES_BY_SCREEN[screen].some((role) => roles.includes(role));
}

/** The admin screens these roles may use, in menu order. */
export function adminScreensFor(roles: readonly string[]): AdminScreen[] {
  return Object.values(AdminScreen).filter((screen) => canUseAdminScreen(roles, screen));
}
