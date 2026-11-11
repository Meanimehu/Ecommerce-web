# Dhaaga web frontend

One Next.js application for the storefront, the Vendor area and the Admin area of the Dhaaga marketplace. The backend is
[`Meanimehu/Ecommerce`](https://github.com/Meanimehu/Ecommerce). The decisions behind everything here are in
[`docs/`](docs/README.md) (Documents 1 to 8).

**Status: Slice 1 (Foundations), part 1: login and sessions.** Login by phone code, cookies, staying logged in,
logout and "log out everywhere", the no-access page, English and Hindi messages. Design tokens and the Stage 4
components follow in part 2 (Document 8).

## Running it

You need **Node.js 22** and the **backend running** (its own Docker setup). Nothing else is installed: the frontend has
no database of its own.

**First time**

```bash
# 1. Backend folder (Ecommerce): start it
docker compose up -d --build

# 2. This folder (Ecommerce-web)
npm ci
cp .env.example .env.local
npm run dev                     # https://localhost:3001
```

**Every later day**: start the backend (`docker compose up -d` in its folder), then `npm run dev` here.

- `npm run dev` serves **https://localhost:3001** (Document 7, section 17.1). The first time, Next.js sets up a local
  certificate with mkcert by itself; your Mac may ask for your password once to trust it.
- **Login codes**: the backend's SMS is a mock; the code is in its log: `docker compose logs api | grep "MOCK SMS"` in
  the backend folder.
- Set up before 11 Nov 2026? The `dhaaga_web_store` database and the `STORE_*` and `CSRF_SECRET` lines in `.env.local`
  are no longer used and can be deleted.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3001 |
| `npm run build` / `npm start` | Production build and server (`PORT`, default 3001; `BIND_HOST`, default 127.0.0.1) |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) over HTTPS on Chromium, Firefox and WebKit at phone and desktop sizes. A regression safety net only: real browsers and devices are checked by hand (Document 7, D7-11). Login tests run when `E2E_BACKEND_LOG` points at the local backend's log |
| `npm run gen:types` | Fetches the backend's OpenAPI description, stores it in `src/types/generated/` and regenerates the request types |
| `npm run check:types` | Fails if the generated request types differ from the stored description (CI) |
| `npm run check:types:live` | Fails if the backend's description changed since it was stored |
| `npm run check:messages` | Fails if English and Hindi messages differ in keys or have empty text, or a backend error code the built screens can show has no message (D7-15) |
| `npm run gen:error-codes -- --from <backend>/docs/api/api-contract.md` | Stores the backend's error-code list in `src/types/generated/` |
| `npm run check` | Lint, types, messages, generated types and unit tests together |

## Layout

**[`docs/code-map.md`](docs/code-map.md)** explains which file does what, and how a login travels through them. The
folder names are in Document 7, section 16.
