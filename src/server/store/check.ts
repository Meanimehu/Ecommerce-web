/**
 * The store checklist from Document 4, section 4 (D4-10), read against a live PostgreSQL connection. It never changes
 * anything except the single probe row. Pure: it takes a client, so the same code runs in the server, the command line
 * and the tests.
 */
export interface Queryable {
  query<R extends Record<string, unknown> = Record<string, unknown>>(text: string, values?: unknown[]): Promise<{ rows: R[] }>;
}

export interface StoreCheckResult {
  ok: boolean;
  generationId: string | null;
  problems: string[];
  checkedAt: string;
}

/** The tables of the security-critical class. Each must be an ordinary logged table (not unlogged, not temporary). */
export const SECURITY_CRITICAL_TABLES = ['consumed_markers', 'pending_add_marks', 'store_generation'] as const;

/** Tables that only the backend's database has. Seeing them means the store points at the wrong database. */
const BACKEND_TABLES = ['public.migrations', 'public.users'] as const;

export async function looksLikeBackendDatabase(db: Queryable): Promise<boolean> {
  const { rows } = await db.query<{ found: number }>(
    `SELECT count(*)::int AS found FROM unnest($1::text[]) AS t(name) WHERE to_regclass(t.name) IS NOT NULL`,
    [BACKEND_TABLES],
  );
  return (rows[0]?.found ?? 0) === BACKEND_TABLES.length;
}

export async function checkStore(db: Queryable, now: () => Date = () => new Date()): Promise<StoreCheckResult> {
  const problems: string[] = [];
  let generationId: string | null = null;
  const done = (): StoreCheckResult => ({ ok: problems.length === 0, generationId, problems, checkedAt: now().toISOString() });

  try {
    if (await looksLikeBackendDatabase(db)) {
      problems.push("the store points at the backend's database; it must be a database used only by the frontend (D4-10)");
      return done();
    }

    // Persistence: an acknowledged commit must be on disk. synchronous_commit "off" may lose acknowledged writes.
    const { rows: settings } = await db.query<{ name: string; setting: string }>(
      `SELECT name, setting FROM pg_settings WHERE name IN ('fsync', 'synchronous_commit', 'full_page_writes')`,
    );
    const setting = (name: string): string | undefined => settings.find((s) => s.name === name)?.setting;
    if (setting('fsync') !== 'on') problems.push(`fsync is "${setting('fsync') ?? 'unknown'}", must be on`);
    if (setting('full_page_writes') !== 'on') problems.push(`full_page_writes is "${setting('full_page_writes') ?? 'unknown'}", must be on`);
    const syncCommit = setting('synchronous_commit');
    if (syncCommit === undefined || syncCommit === 'off') problems.push(`synchronous_commit is "${syncCommit ?? 'unknown'}", must not be off`);

    // Writable primary: a standby or a read-only database cannot take the "create only if absent" write.
    const { rows: role } = await db.query<{ in_recovery: boolean; read_only: string }>(
      `SELECT pg_is_in_recovery() AS in_recovery, current_setting('transaction_read_only') AS read_only`,
    );
    if (role[0]?.in_recovery) problems.push('connected to a standby; the store must be the primary');
    if (role[0]?.read_only === 'on') problems.push('the connection is read-only');

    // Failover: with asynchronous standbys, a failover could drop acknowledged writes (Document 4, section 4, loss detection).
    const { rows: replication } = await db.query<{ standbys: number; sync_names: string }>(
      `SELECT (SELECT count(*)::int FROM pg_stat_replication) AS standbys, current_setting('synchronous_standby_names') AS sync_names`,
    );
    if ((replication[0]?.standbys ?? 0) > 0 && (replication[0]?.sync_names ?? '') === '') {
      problems.push('standbys replicate asynchronously; a failover could lose acknowledged writes (set synchronous replication)');
    }

    // Tables of the security-critical class exist and are durable.
    const { rows: tables } = await db.query<{ relname: string; relpersistence: string }>(
      `SELECT c.relname, c.relpersistence FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'web_store' AND c.relkind = 'r' AND c.relname = ANY($1::text[])`,
      [SECURITY_CRITICAL_TABLES],
    );
    for (const name of SECURITY_CRITICAL_TABLES) {
      const table = tables.find((t) => t.relname === name);
      if (!table) problems.push(`table web_store.${name} is missing (run npm run store:migrate)`);
      else if (table.relpersistence !== 'p') problems.push(`table web_store.${name} is not durable (unlogged or temporary)`);
    }
    if (problems.length) return done();

    // The permanent generation id.
    const { rows: generation } = await db.query<{ generation_id: string }>(`SELECT generation_id FROM web_store.store_generation`);
    if (generation.length !== 1 || !generation[0]?.generation_id) problems.push('the generation id is missing; refreshing stays blocked until a new generation is started');
    else generationId = generation[0].generation_id;

    // A real durable write, right now.
    await db.query(
      `INSERT INTO web_store.store_probe (id, written_at) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET written_at = EXCLUDED.written_at`,
      [now().toISOString()],
    );
  } catch (error) {
    problems.push(`the store could not be checked: ${error instanceof Error ? error.message : String(error)}`);
  }
  return done();
}
