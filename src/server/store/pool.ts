import 'server-only';
import pg from 'pg';
import { serverConfig } from '../config';

/** One connection pool per server process, kept across hot reloads in development. */
const holder = globalThis as unknown as { __dhaagaStorePool?: pg.Pool };

export function storePool(): pg.Pool | null {
  const url = serverConfig.storeDatabaseUrl;
  if (!url) return null;
  holder.__dhaagaStorePool ??= new pg.Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
  return holder.__dhaagaStorePool;
}
