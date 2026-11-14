/** Fails when the English and Hindi message files differ in keys, or hold empty or non-text values (Document 4, section 6). */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { AppErrorCode } from '../src/lib/error-codes';
import {
  BACKEND_CODES_IN_USE,
  compareCatalogues,
  FRAMEWORK_CODES_WITH_MESSAGES,
  FRONTEND_CODES_WITH_MESSAGES,
} from './message-checks';
import { enumSource } from './gen-error-codes';

const dir = fileURLToPath(new URL('../src/messages/', import.meta.url));
const [en, hi] = await Promise.all(
  ['en.json', 'hi.json'].map(
    async (file) => JSON.parse(await readFile(dir + file, 'utf8')) as unknown,
  ),
);
const problems = compareCatalogues(['en.json', 'hi.json'], en, hi);

// Document 7, D7-15: every backend code a built screen can show has a message, and is a real backend code.
const backend = JSON.parse(
  await readFile(
    fileURLToPath(new URL('../src/types/generated/backend-error-codes.json', import.meta.url)),
    'utf8',
  ),
) as {
  codes: { code: string }[];
};
const known = new Set(backend.codes.map((entry) => entry.code));
const codes = (en as { errors?: { codes?: Record<string, string> } }).errors?.codes ?? {};
for (const code of BACKEND_CODES_IN_USE) {
  if (!known.has(code))
    problems.push({ key: `errors.codes.${code}`, problem: 'not in the backend error catalogue' });
  if (!codes[code])
    problems.push({ key: `errors.codes.${code}`, problem: 'in use but has no message' });
}
for (const code of [...FRONTEND_CODES_WITH_MESSAGES, ...FRAMEWORK_CODES_WITH_MESSAGES])
  if (!codes[code]) problems.push({ key: `errors.codes.${code}`, problem: 'has no message' });

// Document 7, section 20.7: the enum is the stored catalogue exactly, and our own codes are never backend codes.
const enumFile = fileURLToPath(
  new URL('../src/types/generated/backend-error-codes.ts', import.meta.url),
);
const storedEnumSource = await readFile(enumFile, 'utf8');
if (storedEnumSource !== enumSource(backend.codes as { code: string; status: number }[])) {
  problems.push({
    key: 'src/types/generated/backend-error-codes.ts',
    problem: 'differs from backend-error-codes.json; run npm run gen:error-codes',
  });
}
for (const appCode of Object.values(AppErrorCode)) {
  if (known.has(appCode)) {
    problems.push({
      key: `AppErrorCode.${appCode}`,
      problem: 'is a backend code; use BackendErrorCode',
    });
  }
}

const covered = [...known].filter((code) => codes[code]).length;
if (problems.length) {
  for (const problem of problems) console.error(`${problem.key}: ${problem.problem}`);
  process.exit(1);
}
console.log(
  `Message catalogues match. Backend error codes with a message: ${covered} of ${known.size} (the rest arrive with their slices, D7-15).`,
);
