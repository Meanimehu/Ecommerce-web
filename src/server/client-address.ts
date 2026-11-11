import 'server-only';
import { headers } from 'next/headers';
import { isIP } from 'node:net';
import { serverConfig } from './config';

/**
 * The customer's network address, so the backend's per-address limits (120 requests a minute, 20 login codes an hour)
 * count each customer, not our server (Document 3, section 3; Document 4, section 4).
 *
 * Read only from the header the hosting's front door adds (CLIENT_ADDRESS_HEADER), and only its last entry, the one the
 * host itself wrote. Anything the browser put earlier in that header is ignored, so nobody can pretend to be someone
 * else. Only a real IP address is accepted. Not set locally, so locally nothing is forwarded.
 */
export function pickClientAddress(headerValue: string | null | undefined): string | undefined {
  const last = (headerValue ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
  return last && isIP(last) ? last : undefined;
}

export async function clientAddress(): Promise<string | undefined> {
  const name = serverConfig.clientAddressHeader;
  if (!name) return undefined;
  try {
    return pickClientAddress((await headers()).get(name));
  } catch {
    // Outside a request (tests, scripts): nothing to forward.
    return undefined;
  }
}
