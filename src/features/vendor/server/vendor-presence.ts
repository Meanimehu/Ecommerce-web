import 'server-only';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { getMyVendor } from './vendor-api';

/** Whether the logged-in person has a vendor, in any status (GET /vendors/me: 404 means none). */
export enum VendorPresence {
  Exists = 'exists',
  None = 'none',
  /** The backend could not be asked: show neither "Vendor area" nor "Become a vendor". */
  Unknown = 'unknown',
}

export async function findVendorPresence(token: string): Promise<VendorPresence> {
  try {
    await getMyVendor(token);
    return VendorPresence.Exists;
  } catch (caughtError) {
    const noVendor =
      caughtError instanceof AppError && caughtError.code === BackendErrorCode.VendorNotFound;
    return noVendor ? VendorPresence.None : VendorPresence.Unknown;
  }
}
