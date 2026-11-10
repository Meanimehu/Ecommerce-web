// After `next build`, the standalone server needs the static files next to it (Next.js output: 'standalone').
import { cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';

await cp('.next/static', '.next/standalone/.next/static', { recursive: true });
if (existsSync('public')) await cp('public', '.next/standalone/public', { recursive: true });
console.log('Copied static files into .next/standalone.');
