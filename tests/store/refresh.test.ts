/**
 * Refresh across server instances (Document 4, section 9; D4-05, D4-06) against a real PostgreSQL.
 * Two separate connection pools stand for two frontend servers. The backend is replaced by a counter.
 */
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrateStore } from '../../scripts/store-migrations';
import { AppError } from '@/lib/errors';
import { refreshSession, type RefreshDeps, type RefreshKeys } from '@/server/auth/refresh';

const adminUrl = process.env.STORE_TEST_ADMIN_URL;
const name = `dhaaga_web_refresh_test_${randomBytes(4).toString('hex')}`;
let serverA: pg.Pool;
let serverB: pg.Pool;
let generation: string;

const keys: RefreshKeys = { marker: [randomBytes(32)], result: randomBytes(32), handle: randomBytes(32) };
const urlFor = (db: string): string => {
  const url = new URL(adminUrl ?? 'postgres://localhost/postgres');
  url.pathname = `/${db}`;
  return url.toString();
};
const fast = { pollMs: 10, waitMs: 2000, lockMs: 3000, resultMs: 5000 };

function backend(delayMs = 50) {
  const calls: string[] = [];
  let n = 0;
  return {
    calls,
    refresh: async (token: string) => {
      calls.push(token);
      await new Promise((r) => setTimeout(r, delayMs));
      n += 1;
      return { accessToken: `access-${n}`, refreshToken: `refresh-${n}`, expiresIn: 86400 };
    },
  };
}

const deps = (db: pg.Pool, holder: string, refresh: RefreshDeps['backendRefresh'], storeOk = true): RefreshDeps => ({
  db,
  storeOk: () => storeOk,
  backendRefresh: refresh,
  keys,
  holder,
  timings: fast,
});

describe.skipIf(!adminUrl)('refresh across server instances', () => {
  beforeAll(async () => {
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${name}`);
    await admin.end();
    const client = new pg.Client({ connectionString: urlFor(name) });
    await client.connect();
    await migrateStore(client);
    generation = (await client.query<{ generation_id: string }>('SELECT generation_id FROM web_store.store_generation')).rows[0]!.generation_id;
    await client.end();
    serverA = new pg.Pool({ connectionString: urlFor(name), max: 4 });
    serverB = new pg.Pool({ connectionString: urlFor(name), max: 4 });
  });

  afterAll(async () => {
    await serverA?.end();
    await serverB?.end();
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end();
  });

  const cookie = (token: string) => ({ t: token, g: generation, l: 'login-1' });

  it('two servers and several tabs at the same moment: the backend is asked exactly once', async () => {
    const b = backend(150);
    const token = `rt-${randomBytes(8).toString('hex')}`;
    const results = await Promise.all([
      refreshSession(cookie(token), deps(serverA, 'A1', b.refresh)),
      refreshSession(cookie(token), deps(serverB, 'B1', b.refresh)),
      refreshSession(cookie(token), deps(serverA, 'A2', b.refresh)),
      refreshSession(cookie(token), deps(serverB, 'B2', b.refresh)),
    ]);
    expect(b.calls).toEqual([token]);
    const kinds = results.map((r) => r.kind).sort();
    expect(kinds).toEqual(['refreshed', 'reused', 'reused', 'reused']);
    const refreshed = results.find((r) => r.kind === 'refreshed');
    for (const r of results) if (r.kind === 'reused' && refreshed?.kind === 'refreshed') expect(r.accessToken).toBe(refreshed.accessToken);
  });

  it('a used token arriving later never reaches the backend again', async () => {
    const b = backend();
    const token = `rt-${randomBytes(8).toString('hex')}`;
    expect((await refreshSession(cookie(token), deps(serverA, 'A', b.refresh))).kind).toBe('refreshed');
    const later = await refreshSession(cookie(token), deps(serverB, 'B', b.refresh));
    expect(later.kind).toBe('reused');
    expect(b.calls).toHaveLength(1);
  });

  it('after the short-lived result is gone, a used token gets the stale answer, still without a backend call', async () => {
    const b = backend();
    const token = `rt-${randomBytes(8).toString('hex')}`;
    await refreshSession(cookie(token), deps(serverA, 'A', b.refresh));
    await serverA.query('DELETE FROM web_store.refresh_results');
    const later = await refreshSession(cookie(token), deps(serverB, 'B', b.refresh));
    expect(later.kind).toBe('stale');
    expect(b.calls).toHaveLength(1);
  });

  it('an unknown outcome (timeout) stores nothing, keeps the token consumed, and never resends it', async () => {
    const calls: string[] = [];
    const timeout = async (t: string) => {
      calls.push(t);
      throw new AppError({ code: 'TIMEOUT', status: 0, outcomeUnknown: true });
    };
    const token = `rt-${randomBytes(8).toString('hex')}`;
    expect((await refreshSession(cookie(token), deps(serverA, 'A', timeout))).kind).toBe('stale');
    expect((await refreshSession(cookie(token), deps(serverB, 'B', timeout))).kind).toBe('stale');
    expect(calls).toHaveLength(1);
  });

  it('a confirmed rejection ends the session, and is remembered for other requests', async () => {
    const calls: string[] = [];
    const reject = async (t: string) => {
      calls.push(t);
      throw new AppError({ code: 'TOKEN_REUSED', status: 401 });
    };
    const token = `rt-${randomBytes(8).toString('hex')}`;
    const first = await refreshSession(cookie(token), deps(serverA, 'A', reject));
    expect(first).toMatchObject({ kind: 'ended', reason: 'session' });
    expect(await refreshSession(cookie(token), deps(serverB, 'B', reject))).toMatchObject({ kind: 'ended' });
    expect(calls).toHaveLength(1);
  });

  it('a blocked account is reported as blocked', async () => {
    const blocked = async () => {
      throw new AppError({ code: 'USER_BLOCKED', status: 403 });
    };
    const out = await refreshSession(cookie(`rt-${randomBytes(8).toString('hex')}`), deps(serverA, 'A', blocked));
    expect(out).toMatchObject({ kind: 'ended', reason: 'blocked' });
  });

  it('when the store is not confirmed, nothing is sent to the backend (temporary answer)', async () => {
    const b = backend();
    const out = await refreshSession(cookie(`rt-${randomBytes(8).toString('hex')}`), deps(serverA, 'A', b.refresh, false));
    expect(out.kind).toBe('temporary');
    expect(b.calls).toHaveLength(0);
  });

  it('a cookie from an earlier store generation gets the stale answer without a backend call', async () => {
    const b = backend();
    const out = await refreshSession({ t: `rt-${randomBytes(8).toString('hex')}`, g: 'an-older-generation', l: 'x' }, deps(serverA, 'A', b.refresh));
    expect(out.kind).toBe('stale');
    expect(b.calls).toHaveLength(0);
  });

  it('a missing generation id blocks refreshing (temporary answer)', async () => {
    const b = backend();
    await serverA.query('DELETE FROM web_store.store_generation');
    try {
      const out = await refreshSession(cookie(`rt-${randomBytes(8).toString('hex')}`), deps(serverA, 'A', b.refresh));
      expect(out.kind).toBe('temporary');
      expect(b.calls).toHaveLength(0);
    } finally {
      await serverA.query(`INSERT INTO web_store.store_generation (generation_id, reason) VALUES ($1, 'test restore')`, [generation]);
    }
  });

  it('the marker is written before the backend is called', async () => {
    const token = `rt-${randomBytes(8).toString('hex')}`;
    let markerSeenByBackend = false;
    const check = async () => {
      const { rows } = await serverB.query('SELECT count(*)::int AS n FROM web_store.consumed_markers WHERE generation_id = $1', [generation]);
      markerSeenByBackend = (rows[0] as { n: number }).n > 0;
      return { accessToken: 'a', refreshToken: 'r', expiresIn: 60 };
    };
    await serverA.query('DELETE FROM web_store.consumed_markers');
    await refreshSession(cookie(token), deps(serverA, 'A', check));
    expect(markerSeenByBackend).toBe(true);
  });
});
