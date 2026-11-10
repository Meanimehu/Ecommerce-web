/** Fails when the English and Hindi message files differ in keys, or hold empty or non-text values (Document 4, section 6). */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compareCatalogues } from '../src/lib/message-keys';

const dir = fileURLToPath(new URL('../src/messages/', import.meta.url));
const [en, hi] = await Promise.all(['en.json', 'hi.json'].map(async (f) => JSON.parse(await readFile(dir + f, 'utf8')) as unknown));
const problems = compareCatalogues(['en.json', 'hi.json'], en, hi);
if (problems.length) {
  for (const p of problems) console.error(`${p.key}: ${p.problem}`);
  process.exit(1);
}
console.log('Message catalogues match: same keys in English and Hindi.');
