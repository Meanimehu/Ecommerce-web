/** npm run store:migrate: applies the store's migrations to the frontend-only database in STORE_DATABASE_URL. */
import { storeUrl, withStore } from './store-db';
import { migrateStore } from './store-migrations';

try {
  const applied = await withStore(storeUrl(), migrateStore);
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'The store is up to date.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
