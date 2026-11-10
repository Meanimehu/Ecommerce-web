# Dhaaga web frontend

One Next.js application for the storefront, the Vendor area and the Admin area of the Dhaaga marketplace. The backend is
[`Meanimehu/Ecommerce`](https://github.com/Meanimehu/Ecommerce). The decisions behind everything here are in
[`docs/`](docs/README.md) (Documents 1 to 8).

**Status: Slice 0 (Setup).** A blank page in English and Hindi, a health check, the shared store and the automatic
checks. No screens yet (Document 8).

## What you need

- Node.js 22 (`.nvmrc`) and npm
- PostgreSQL for the shared store: `docker compose up -d store` (port 5433), or any PostgreSQL 16 or newer
- For generating request types only: the backend running locally (its README), with its API docs at `/api/docs-json`

## First run

```bash
npm ci
cp .env.example .env.local          # then adjust if your setup differs
docker compose up -d store          # the frontend's own database, never the backend's
npm run store:migrate
npm run store:check                 # must say "Store ok"
npm run dev                         # http://localhost:3001 (the backend uses 3000)
```

`npm run build && npm start` runs the production server (a plain, self-contained Node.js server, Document 4, D4-03).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3001 |
| `npm run build` / `npm start` | Production build and server (`PORT`, default 3001; `BIND_HOST`, default 127.0.0.1) |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:store` | Store tests against a real PostgreSQL. Needs `STORE_TEST_ADMIN_URL` (a role that may create databases); each run uses a throwaway database |
| `npm run test:e2e` | End-to-end tests (Playwright) on Chromium, Firefox and WebKit at phone and desktop sizes. A regression safety net only: real browsers and devices are checked by hand (Document 7, D7-11) |
| `npm run gen:types` | Fetches the backend's OpenAPI description, stores it in `src/generated/` and regenerates the request types |
| `npm run check:types` | Fails if the generated request types differ from the stored description (CI) |
| `npm run check:types:live` | Fails if the backend's description changed since it was stored |
| `npm run check:messages` | Fails if English and Hindi messages differ in keys or have empty text |
| `npm run store:migrate` / `store:check` | Applies the store's migrations; runs the store checklist (Document 4, section 4) |
| `npm run store:new-generation -- --reason "..."` | Starts a new store generation. See below |
| `npm run check` | Lint, types, messages, generated types and unit tests together |

## The shared store (Document 4, D4-10)

PostgreSQL, in a database used only by the frontend. It holds the "already used" markers that stop a refresh token, or a
pending add to cart, from ever being used twice. Every server checks it at start-up and every
`STORE_CHECK_INTERVAL_SECONDS`: durable commits (`fsync`, `synchronous_commit`, `full_page_writes`), a writable primary,
no asynchronous standbys, durable tables, the generation id, and a real write. The migration and the check refuse the
backend's database. If the check fails, pages still work; logging in again stays possible, but refreshing a session
stops (fails closed, from Slice 1).

**After a restore from backup, a failover that may have lost writes, or any deletion of store data: run
`npm run store:new-generation -- --reason "..."` before the site serves traffic again.** Everyone logged in before it is
asked to log in again. Nothing else is needed.

## Layout

See Document 7, section 16 for the folder names. In short: pages in `src/app/[lang]`, our own endpoints in
`src/app/api`, server-only code in `src/server`, messages in `src/messages`, generated request types in `src/generated`
(never edited by hand), store migrations in `store/migrations`.
