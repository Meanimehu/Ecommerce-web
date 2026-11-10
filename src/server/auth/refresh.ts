import { AppError } from '@/lib/errors';
import type { RefreshCookie } from './cookies';
import { b64url, decrypt, encrypt, hmac } from './crypto';
import * as store from '../store/refresh-store';

/**
 * Refreshing a session safely across every server instance (Document 4, section 9; D4-05, D4-06).
 * Rules that never change: a refresh token that has been, or may have been, replaced is never sent again; the refresh
 * token never leaves the cookie and this process; only the holder of the lock refreshes. Every unclear case fails closed.
 * None of the answers sets or clears a cookie by itself; the caller sets new cookies only for `refreshed`.
 */
export type RefreshOutcome =
  /** This request refreshed: set the new access and refresh cookies in this response only. */
  | { kind: 'refreshed'; accessToken: string; refreshToken: string; expiresIn: number; generationId: string }
  /** Another request already refreshed: use this access token for this request only, set no cookies. */
  | { kind: 'reused'; accessToken: string; expiresIn: number }
  /** A problem on our side (store unavailable or unconfirmed): "try again shortly", nobody is logged out. */
  | { kind: 'temporary' }
  /** This refresh token is already used or cannot be trusted: "your session changed". */
  | { kind: 'stale'; handle: string }
  /** The backend confirmed the session is over (or the account is blocked). */
  | { kind: 'ended'; reason: 'session' | 'blocked'; handle: string };

export interface RefreshKeys {
  /** Marker hash keys: the current one first, then the previous one while its markers may still exist. */
  marker: Buffer[];
  result: Buffer;
  handle: Buffer;
}

export interface RefreshDeps {
  db: store.Db;
  /** Whether the last store check confirmed every guarantee (Document 4, section 4). */
  storeOk: () => boolean;
  /** Calls the backend's POST /auth/refresh. Throws AppError on failure. */
  backendRefresh: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string; expiresIn: number }>;
  keys: RefreshKeys;
  holder: string;
  timings?: Partial<RefreshTimings>;
  sleep?: (ms: number) => Promise<void>;
}

/** Document 7, section 17.3 (provisional). */
export interface RefreshTimings {
  lockMs: number;
  waitMs: number;
  pollMs: number;
  resultMs: number;
  markerMs: number;
}
export const DEFAULT_TIMINGS: RefreshTimings = { lockMs: 10_000, waitMs: 9_000, pollMs: 100, resultMs: 10_000, markerMs: 31 * 24 * 3600 * 1000 };

/** Backend answers to a refresh that confirm the session is over (area-1-accounts.md, POST /auth/refresh). */
const ENDED_CODES = new Set(['SESSION_ENDED', 'TOKEN_REUSED']);

export const markerHashes = (keys: RefreshKeys, refreshToken: string): Buffer[] => keys.marker.map((k) => hmac(k, `refresh:${refreshToken}`));

/** Non-secret handle for compare-and-clear, derived from the marker key (never the token). */
export const sessionHandle = (keys: RefreshKeys, refreshToken: string): string => {
  const [current] = markerHashes(keys, refreshToken);
  return b64url(hmac(keys.handle, current ?? Buffer.alloc(0)));
};

export async function refreshSession(cookie: RefreshCookie, deps: RefreshDeps): Promise<RefreshOutcome> {
  const t: RefreshTimings = { ...DEFAULT_TIMINGS, ...deps.timings };
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const hashes = markerHashes(deps.keys, cookie.t);
  const hash = hashes[0];
  const handle = sessionHandle(deps.keys, cookie.t);
  if (!hash) return { kind: 'temporary' };

  try {
    // 1. Store guarantees confirmed?
    if (!deps.storeOk()) return { kind: 'temporary' };
    // 2. Generation unchanged since this cookie was issued?
    const generation = await store.currentGeneration(deps.db);
    if (!generation) return { kind: 'temporary' };
    if (generation !== cookie.g) return { kind: 'stale', handle };

    for (;;) {
      // 3. Already consumed?
      const existing = await store.findMarker(deps.db, hashes);
      if (existing) return await awaitResult(existing, deps, t, sleep, handle);

      // 4. Take the lock; if another instance holds it, wait for its result.
      if (!(await store.tryLock(deps.db, hash, deps.holder, t.lockMs))) {
        const waited = await waitWhileLocked(hash, hashes, deps, t, sleep);
        if (waited === 'retry') continue;
        return waited === 'none' ? { kind: 'stale', handle } : waited;
      }

      try {
        // 5. Durable "create only if absent" marker BEFORE the backend call.
        let created: boolean;
        try {
          created = await store.createMarker(deps.db, hash, generation, t.markerMs);
        } catch {
          return { kind: 'temporary' };
        }
        if (!created) continue; // someone consumed it in between: handled as step 3

        // 6. Only now call the backend.
        let fresh: { accessToken: string; refreshToken: string; expiresIn: number };
        try {
          fresh = await deps.backendRefresh(cookie.t);
        } catch (error) {
          if (error instanceof AppError && (ENDED_CODES.has(error.code) || error.code === 'USER_BLOCKED')) {
            const reason = error.code === 'USER_BLOCKED' ? 'blocked' : 'session';
            await store.putResult(deps.db, hash, { outcome: 'rejected', accessTokenEnc: null, expiresIn: null, reason }, t.resultMs).catch(() => undefined);
            return { kind: 'ended', reason, handle };
          }
          // Unknown outcome (timeout, lost answer, server error): nothing stored, the token stays consumed.
          return { kind: 'stale', handle };
        }
        await store
          .putResult(deps.db, hash, { outcome: 'success', accessTokenEnc: encrypt(deps.keys.result, fresh.accessToken), expiresIn: fresh.expiresIn, reason: null }, t.resultMs)
          .catch(() => undefined);
        return { kind: 'refreshed', ...fresh, generationId: generation };
      } finally {
        await store.releaseLock(deps.db, hash, deps.holder).catch(() => undefined);
      }
    }
  } catch {
    return { kind: 'temporary' };
  }
}

/** Step 3: a marker exists. Use its result, or wait for a running refresh, or give the stale answer. */
async function awaitResult(markerHash: Buffer, deps: RefreshDeps, t: RefreshTimings, sleep: (ms: number) => Promise<void>, handle: string): Promise<RefreshOutcome> {
  const deadline = Date.now() + t.waitMs;
  for (;;) {
    const result = await store.getResult(deps.db, markerHash);
    if (result) return fromResult(result, deps, handle);
    if (!(await store.lockHeld(deps.db, markerHash)) || Date.now() >= deadline) {
      const last = await store.getResult(deps.db, markerHash);
      return last ? fromResult(last, deps, handle) : { kind: 'stale', handle };
    }
    await sleep(t.pollMs);
  }
}

/** Step 4: another instance holds the lock. Wait until it finishes or the wait limit passes, then go back to step 3. */
async function waitWhileLocked(
  hash: Buffer,
  hashes: Buffer[],
  deps: RefreshDeps,
  t: RefreshTimings,
  sleep: (ms: number) => Promise<void>,
): Promise<RefreshOutcome | 'retry' | 'none'> {
  const deadline = Date.now() + t.waitMs;
  while (Date.now() < deadline) {
    await sleep(t.pollMs);
    if (await store.findMarker(deps.db, hashes)) return 'retry';
    if (!(await store.lockHeld(deps.db, hash))) return 'retry';
  }
  return 'none';
}

function fromResult(result: store.StoredResult, deps: RefreshDeps, handle: string): RefreshOutcome {
  if (result.outcome === 'rejected') return { kind: 'ended', reason: result.reason === 'blocked' ? 'blocked' : 'session', handle };
  try {
    return { kind: 'reused', accessToken: decrypt(deps.keys.result, result.accessTokenEnc ?? Buffer.alloc(0)), expiresIn: result.expiresIn ?? 0 };
  } catch {
    return { kind: 'stale', handle };
  }
}
