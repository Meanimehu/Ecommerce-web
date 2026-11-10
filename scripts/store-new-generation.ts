/**
 * npm run store:new-generation -- --reason "restored from backup of 12 Nov"
 *
 * Starts a new store generation (Document 4, section 9; D4-10). Run it FIRST after anything that may have lost
 * security-critical entries: a restore from backup, a failover that may have dropped acknowledged writes, a manual
 * deletion. Every login cookie issued before it then gets the stale-session answer and the person logs in again; no
 * used refresh token can be sent twice. It creates the generation row if it is missing.
 */
import { storeUrl, withStore } from './store-db';

const at = process.argv.indexOf('--reason');
const reason = at >= 0 ? process.argv[at + 1]?.trim() : undefined;
if (!reason) {
  console.error('Say why: npm run store:new-generation -- --reason "restored from backup"');
  process.exit(1);
}

try {
  const id = await withStore(storeUrl(), async (client) => {
    const { rows } = await client.query<{ generation_id: string }>(
      `INSERT INTO web_store.store_generation (singleton, generation_id, reason) VALUES (true, gen_random_uuid(), $1)
       ON CONFLICT (singleton) DO UPDATE SET generation_id = EXCLUDED.generation_id, started_at = now(), reason = EXCLUDED.reason
       RETURNING generation_id`,
      [reason],
    );
    return rows[0]?.generation_id;
  });
  console.log(`New generation started: ${id}. Earlier login cookies will ask people to log in again.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
