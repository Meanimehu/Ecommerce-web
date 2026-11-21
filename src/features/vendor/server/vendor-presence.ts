import 'server-only';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import type { VendorStatus } from '@/features/vendor/types';
import { getMyVendor } from './vendor-api';

/** Whether the logged-in person has a vendor, in any status (GET /vendors/me: 404 means none). */
export enum VendorPresence {
  Exists = 'exists',
  None = 'none',
  /** The backend could not be asked: show neither "Vendor area" nor "Become a vendor". */
  Unknown = 'unknown',
}

/** The person's vendor, as the Vendor area's frame needs it: whether there is one, and its status. */
export type VendorLookup =
  | { presence: VendorPresence.Exists; status: VendorStatus }
  | { presence: VendorPresence.None | VendorPresence.Unknown; status: null };

export async function lookUpVendor(token: string): Promise<VendorLookup> {
  try {
    const vendor = (await getMyVendor(token)).data;
    return { presence: VendorPresence.Exists, status: vendor.status };
  } catch (caughtError) {
    const noVendor =
      caughtError instanceof AppError && caughtError.code === BackendErrorCode.VendorNotFound;
    return { presence: noVendor ? VendorPresence.None : VendorPresence.Unknown, status: null };
  }
}

export async function findVendorPresence(token: string): Promise<VendorPresence> {
  return (await lookUpVendor(token)).presence;
}
