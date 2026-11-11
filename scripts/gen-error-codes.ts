/**
 * npm run gen:error-codes -- --from ../Ecommerce/docs/api/api-contract.md
 *
 * Stores the backend's error-code catalogue (api-contract.md, section 11) as src/types/generated/backend-error-codes.json, so
 * the message check (Document 7, D7-15) can tell which codes exist. Run it again when the backend catalogue changes.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const at = process.argv.indexOf('--from');
const from = at >= 0 ? process.argv[at + 1] : undefined;
if (!from) {
  console.error('Say where the backend contract is: npm run gen:error-codes -- --from <path>/docs/api/api-contract.md');
  process.exit(1);
}
const text = await readFile(from, 'utf8');
const start = text.indexOf('## 11. Error catalogue');
const end = text.indexOf('\n## 12.', start);
if (start < 0 || end < 0) throw new Error('Section 11 (Error catalogue) not found');
const codes = [...text.slice(start, end).matchAll(/^\| `([A-Z][A-Z0-9_]+)` \| (\d{3}) \|/gm)].map((m) => ({ code: m[1], status: Number(m[2]) }));
const out = fileURLToPath(new URL('../src/types/generated/backend-error-codes.json', import.meta.url));
await writeFile(out, `${JSON.stringify({ source: 'docs/api/api-contract.md, section 11', codes }, null, 2)}\n`);
console.log(`Stored ${codes.length} backend error codes.`);
