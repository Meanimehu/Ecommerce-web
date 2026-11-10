import type pg from 'pg';

/** Store access for refreshing (Document 4, section 9). All keys are keyed hashes of the refresh token, never the token. */
export type Db = Pick<pg.Pool, 'query' | 'connect'>;

export interface StoredResult {
  outcome: 'success' | 'rejected';
  accessTokenEnc: Buffer | null;
  expiresIn: number | null;
  reason: string | null;
}

export async function currentGeneration(db: Db): Promise<string | null> {
  const { rows } = await db.query<{ generation_id: string }>('SELECT generation_id FROM web_store.store_generation');
  return rows.length === 1 && rows[0] ? rows[0].generation_id : null;
}

export async function findMarker(db: Db, hashes: Buffer[]): Promise<Buffer | null> {
  const { rows } = await db.query<{ key_hash: Buffer }>(
    'SELECT key_hash FROM web_store.consumed_markers WHERE key_hash = ANY($1::bytea[]) AND expires_at > now() LIMIT 1',
    [hashes],
  );
  return rows[0]?.key_hash ?? null;
}

/**
 * Creates the consumed marker with an atomic "create only if absent", committed durably (synchronous_commit on) before
 * returning. True only when this call created it.
 */
export async function createMarker(db: Db, hash: Buffer, generationId: string, keepMs: number): Promise<boolean> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL synchronous_commit TO on');
    const { rowCount } = await client.query(
      `INSERT INTO web_store.consumed_markers (key_hash, generation_id, expires_at)
       VALUES ($1, $2, now() + make_interval(secs => $3)) ON CONFLICT (key_hash) DO NOTHING`,
      [hash, generationId, keepMs / 1000],
    );
    await client.query('COMMIT');
    return rowCount === 1;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function tryLock(db: Db, hash: Buffer, holder: string, lockMs: number): Promise<boolean> {
  const { rowCount } = await db.query(
    `INSERT INTO web_store.refresh_locks (key_hash, holder, expires_at) VALUES ($1, $2, now() + make_interval(secs => $3))
     ON CONFLICT (key_hash) DO UPDATE SET holder = EXCLUDED.holder, expires_at = EXCLUDED.expires_at
     WHERE web_store.refresh_locks.expires_at <= now()`,
    [hash, holder, lockMs / 1000],
  );
  return rowCount === 1;
}

export async function lockHeld(db: Db, hash: Buffer): Promise<boolean> {
  const { rows } = await db.query('SELECT 1 FROM web_store.refresh_locks WHERE key_hash = $1 AND expires_at > now()', [hash]);
  return rows.length > 0;
}

export async function releaseLock(db: Db, hash: Buffer, holder: string): Promise<void> {
  await db.query('DELETE FROM web_store.refresh_locks WHERE key_hash = $1 AND holder = $2', [hash, holder]);
}

export async function putResult(db: Db, hash: Buffer, result: StoredResult, keepMs: number): Promise<void> {
  await db.query(
    `INSERT INTO web_store.refresh_results (key_hash, outcome, access_token_enc, expires_in, reason, expires_at)
     VALUES ($1, $2, $3, $4, $5, now() + make_interval(secs => $6))
     ON CONFLICT (key_hash) DO UPDATE SET outcome = EXCLUDED.outcome, access_token_enc = EXCLUDED.access_token_enc,
       expires_in = EXCLUDED.expires_in, reason = EXCLUDED.reason, expires_at = EXCLUDED.expires_at`,
    [hash, result.outcome, result.accessTokenEnc, result.expiresIn, result.reason, keepMs / 1000],
  );
}

export async function getResult(db: Db, hash: Buffer): Promise<StoredResult | null> {
  const { rows } = await db.query<{ outcome: 'success' | 'rejected'; access_token_enc: Buffer | null; expires_in: number | null; reason: string | null }>(
    'SELECT outcome, access_token_enc, expires_in, reason FROM web_store.refresh_results WHERE key_hash = $1 AND expires_at > now()',
    [hash],
  );
  const row = rows[0];
  return row ? { outcome: row.outcome, accessTokenEnc: row.access_token_enc, expiresIn: row.expires_in, reason: row.reason } : null;
}

/** Removes entries whose own expiry has passed. Nothing is removed before its expiry (Document 4, section 4). */
export async function cleanupExpired(db: Db): Promise<void> {
  await db.query('DELETE FROM web_store.consumed_markers WHERE expires_at <= now()');
  await db.query('DELETE FROM web_store.pending_add_marks WHERE expires_at <= now()');
  await db.query('DELETE FROM web_store.refresh_results WHERE expires_at <= now()');
  await db.query('DELETE FROM web_store.refresh_locks WHERE expires_at <= now()');
}
