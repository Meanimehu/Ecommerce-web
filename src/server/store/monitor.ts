import 'server-only';
import { serverConfig } from '../config';
import { checkStore, type StoreCheckResult } from './check';
import { storePool } from './pool';
import { cleanupExpired } from './refresh-store';

/**
 * Checks the store at start-up and regularly (Document 4, section 4). The last result is what later slices read before
 * any refresh: when it is not ok, refreshing stops and the person gets the temporary "try again" answer (fails closed).
 * A failed check never stops the site from serving pages.
 */
const state = globalThis as unknown as { __dhaagaStore?: { last: StoreCheckResult; timer?: ReturnType<typeof setInterval> } };

const notChecked: StoreCheckResult = { ok: false, generationId: null, problems: ['not checked yet'], checkedAt: new Date(0).toISOString() };

export function storeStatus(): StoreCheckResult {
  return state.__dhaagaStore?.last ?? notChecked;
}

export async function runStoreCheck(): Promise<StoreCheckResult> {
  const pool = storePool();
  const result: StoreCheckResult = pool
    ? await checkStore(pool)
    : { ok: false, generationId: null, problems: ['STORE_DATABASE_URL is not set'], checkedAt: new Date().toISOString() };
  const previous = state.__dhaagaStore?.last;
  state.__dhaagaStore = { ...state.__dhaagaStore, last: result };
  if (!previous || previous.ok !== result.ok || previous.problems.join('|') !== result.problems.join('|')) {
    if (result.ok) console.info(JSON.stringify({ event: 'store_check', ok: true, generationId: result.generationId }));
    else console.error(JSON.stringify({ event: 'store_check', ok: false, problems: result.problems }));
  }
  // Entries whose own expiry has passed are removed at most once an hour (Document 7, section 17.3).
  if (pool && result.ok && Date.now() - lastCleanup > 3600_000) {
    lastCleanup = Date.now();
    await cleanupExpired(pool).catch((error: unknown) => console.error(JSON.stringify({ event: 'store_cleanup_failed', message: String(error) })));
  }
  return result;
}

let lastCleanup = 0;

export function startStoreMonitor(): void {
  if (state.__dhaagaStore?.timer) return;
  void runStoreCheck();
  const timer = setInterval(() => void runStoreCheck(), serverConfig.storeCheckIntervalMs);
  timer.unref?.();
  state.__dhaagaStore = { last: storeStatus(), timer };
}
