# Dhaaga web frontend

One Next.js application for the storefront, the Vendor area and the Admin area of the Dhaaga marketplace. The backend is
[`Meanimehu/Ecommerce`](https://github.com/Meanimehu/Ecommerce). The decisions behind everything here are in
[`docs/`](docs/README.md) (Documents 1 to 8).

**Status: Slice 1 (Foundations), part 1: login and sessions.** Login by phone code, cookies, safe refresh across
servers, logout and "log out everywhere", the no-access page, English and Hindi messages. Design tokens and the Stage 4
components follow in part 2 (Document 8).

## Running it (Docker only)

Only Docker is needed on your machine: no Node.js, no PostgreSQL, no mkcert. Same approach as the backend.

```bash
# 1. Start the backend with its own docker compose (backend README). Its API answers on http://localhost:3000.
# 2. Then, in this folder:
docker compose up --build            # store database + its migrations + the web app
# open https://localhost:3001
```

- **The first time, your browser warns about the certificate.** It is made inside the container for `localhost` only.
  Choose to continue, or trust `certificates/localhost.pem` once in your system to stop the warning.
- **Saved changes reload at once**: your project folder is mounted into the container.
- **Secrets**: inside Docker the placeholder values in `.env.example` are used; they are fine on your own machine only.
- **Login codes**: the backend's SMS is a mock, the code is in its log: `docker compose logs -f api` in the backend folder.
- **After changing `package.json`**: `docker compose build web` (dependencies live inside the image).
- **Stop**: `docker compose down` (keeps data). **Start clean**: `docker compose down -v` (deletes the store data).

**Running a command** (tests, checks) inside Docker:

```bash
docker compose run --rm web npm test
docker compose run --rm web npm run check
docker compose run --rm -e STORE_TEST_ADMIN_URL=postgres://dhaaga_web:dhaaga_web_pass@store:5432/postgres web npm run test:store
docker compose run --rm web npm run gen:types       # needs the backend running
```

**Production image** (for hosting later, D4-03): `docker build --target runtime -t dhaaga-web .` It is the plain
Node.js server on port 3001; the host provides HTTPS in front of it.

## Commands

Run these with `docker compose run --rm web <command>`, or directly if you have Node.js 22.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3001 |
| `npm run build` / `npm start` | Production build and server (`PORT`, default 3001; `BIND_HOST`, default 127.0.0.1) |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:store` | Store tests against a real PostgreSQL. Needs `STORE_TEST_ADMIN_URL` (a role that may create databases); each run uses a throwaway database |
| `npm run test:e2e` | End-to-end tests (Playwright) over HTTPS on Chromium, Firefox and WebKit at phone and desktop sizes. A regression safety net only: real browsers and devices are checked by hand (Document 7, D7-11). Login tests run when `E2E_BACKEND_LOG` points at the local backend's log |
| `npm run gen:types` | Fetches the backend's OpenAPI description, stores it in `src/generated/` and regenerates the request types |
| `npm run check:types` | Fails if the generated request types differ from the stored description (CI) |
| `npm run check:types:live` | Fails if the backend's description changed since it was stored |
| `npm run check:messages` | Fails if English and Hindi messages differ in keys or have empty text, or a backend error code the built screens can show has no message (D7-15) |
| `npm run gen:error-codes -- --from <backend>/docs/api/api-contract.md` | Stores the backend's error-code list in `src/generated/` |
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
