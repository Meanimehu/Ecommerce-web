/** npm run store:check: runs the Document 4 checklist against the store and prints the result. Exit code 1 when not ok. */
import { checkStore } from '../src/server/store/check';
import { storeUrl, withStore } from './store-db';

try {
  const result = await withStore(storeUrl(), (client) => checkStore(client));
  if (result.ok) console.log(`Store ok. Generation ${result.generationId}.`);
  else {
    console.error('Store NOT ok. Refreshing would stay blocked:');
    for (const problem of result.problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
