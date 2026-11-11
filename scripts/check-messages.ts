/** Fails when the English and Hindi message files differ in keys, or hold empty or non-text values (Document 4, section 6). */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BACKEND_CODES_IN_USE, compareCatalogues, FRAMEWORK_CODES_WITH_MESSAGES, FRONTEND_CODES_WITH_MESSAGES } from '../src/lib/message-checks';

const dir = fileURLToPath(new URL('../src/messages/', import.meta.url));
const [en, hi] = await Promise.all(['en.json', 'hi.json'].map(async (f) => JSON.parse(await readFile(dir + f, 'utf8')) as unknown));
const problems = compareCatalogues(['en.json', 'hi.json'], en, hi);

// Document 7, D7-15: every backend code a built screen can show has a message, and is a real backend code.
const backend = JSON.parse(await readFile(fileURLToPath(new URL('../src/generated/backend-error-codes.json', import.meta.url)), 'utf8')) as {
  codes: { code: string }[];
};
const known = new Set(backend.codes.map((c) => c.code));
const codes = (en as { errors?: { codes?: Record<string, string> } }).errors?.codes ?? {};
for (const code of BACKEND_CODES_IN_USE) {
  if (!known.has(code)) problems.push({ key: `errors.codes.${code}`, problem: 'not in the backend error catalogue' });
  if (!codes[code]) problems.push({ key: `errors.codes.${code}`, problem: 'in use but has no message' });
}
for (const code of [...FRONTEND_CODES_WITH_MESSAGES, ...FRAMEWORK_CODES_WITH_MESSAGES]) if (!codes[code]) problems.push({ key: `errors.codes.${code}`, problem: 'has no message' });
const covered = [...known].filter((code) => codes[code]).length;
if (problems.length) {
  for (const p of problems) console.error(`${p.key}: ${p.problem}`);
  process.exit(1);
}
console.log(`Message catalogues match. Backend error codes with a message: ${covered} of ${known.size} (the rest arrive with their slices, D7-15).`);
