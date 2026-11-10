import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { looksLikeBackendDatabase } from '../src/server/store/check';

const dir = fileURLToPath(new URL('../store/migrations/', import.meta.url));

/** Applies every migration not yet applied, each in its own transaction, in file-name order. Returns the applied names. */
export async function migrateStore(client: pg.Client): Promise<string[]> {
  if (await looksLikeBackendDatabase(client)) {
    throw new Error("Refusing to migrate: this is the backend's database. The store must be a database used only by the frontend (D4-10).");
  }
  await client.query('CREATE SCHEMA IF NOT EXISTS web_store');
  await client.query('CREATE TABLE IF NOT EXISTS web_store.schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const done = new Set((await client.query<{ version: string }>('SELECT version FROM web_store.schema_migrations')).rows.map((r) => r.version));
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(dir + file, 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO web_store.schema_migrations (version) VALUES ($1)', [file]);
      await client.query('COMMIT');
      applied.push(file);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return applied;
}
