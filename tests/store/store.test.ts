/**
 * The store checklist (Document 4, section 4; D4-10) against a real PostgreSQL server. Each run creates its own
 * throwaway database from STORE_TEST_ADMIN_URL (a role that may create databases) and drops it afterwards.
 */
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { migrateStore } from '../../scripts/store-migrations';
import { checkStore } from '@/server/store/check';

const adminUrl = process.env.STORE_TEST_ADMIN_URL;
const name = `dhaaga_web_store_test_${randomBytes(4).toString('hex')}`;
let client: pg.Client;

const urlFor = (database: string): string => {
  const url = new URL(adminUrl ?? 'postgres://localhost/postgres');
  url.pathname = `/${database}`;
  return url.toString();
};

describe.skipIf(!adminUrl)('shared store', () => {
  beforeAll(async () => {
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${name}`);
    await admin.end();
    client = new pg.Client({ connectionString: urlFor(name) });
    await client.connect();
    await migrateStore(client);
  });

  afterAll(async () => {
    await client?.end();
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end();
  });

  beforeEach(async () => {
    await client.query('RESET synchronous_commit');
  });

  it('passes the checklist after migration, with a generation id', async () => {
    const result = await checkStore(client);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.generationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('migrating again changes nothing', async () => {
    expect(await migrateStore(client)).toEqual([]);
  });

  it('"create only if absent" lets exactly one of two writers create a marker', async () => {
    const key = randomBytes(32);
    const insert = (): Promise<pg.QueryResult> =>
      client.query(
        `INSERT INTO web_store.consumed_markers (key_hash, generation_id, expires_at)
         SELECT $1, generation_id, now() + interval '30 days' FROM web_store.store_generation
         ON CONFLICT (key_hash) DO NOTHING RETURNING key_hash`,
        [key],
      );
    const [first, second] = [await insert(), await insert()];
    expect(first.rowCount).toBe(1);
    expect(second.rowCount).toBe(0);
  });

  it('fails when acknowledged commits could be lost (synchronous_commit off)', async () => {
    await client.query('SET synchronous_commit = off');
    const result = await checkStore(client);
    expect(result.ok).toBe(false);
    expect(result.problems.join(' ')).toContain('synchronous_commit');
  });

  it('fails when a security-critical table is not durable', async () => {
    await client.query('ALTER TABLE web_store.pending_add_marks SET UNLOGGED');
    try {
      const result = await checkStore(client);
      expect(result.ok).toBe(false);
      expect(result.problems.join(' ')).toContain('pending_add_marks is not durable');
    } finally {
      await client.query('ALTER TABLE web_store.pending_add_marks SET LOGGED');
    }
  });

  it('fails when the generation id is missing, and a new generation restores it with a different id', async () => {
    const before = (await checkStore(client)).generationId;
    await client.query('DELETE FROM web_store.store_generation');
    const missing = await checkStore(client);
    expect(missing.ok).toBe(false);
    expect(missing.problems.join(' ')).toContain('generation id is missing');
    await client.query(
      `INSERT INTO web_store.store_generation (singleton, generation_id, reason) VALUES (true, gen_random_uuid(), 'test')
       ON CONFLICT (singleton) DO UPDATE SET generation_id = EXCLUDED.generation_id`,
    );
    const after = await checkStore(client);
    expect(after.ok).toBe(true);
    expect(after.generationId).not.toBe(before);
  });

  it("refuses the backend's database", async () => {
    await client.query('CREATE TABLE public.migrations (id int); CREATE TABLE public.users (id int)');
    try {
      await expect(migrateStore(client)).rejects.toThrow("backend's database");
      const result = await checkStore(client);
      expect(result.ok).toBe(false);
      expect(result.problems.join(' ')).toContain("backend's database");
    } finally {
      await client.query('DROP TABLE public.migrations; DROP TABLE public.users');
    }
  });
});
