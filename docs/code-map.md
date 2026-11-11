# Code map

A plain guide to the frontend code: which file does what, and how a request travels through them. The rules behind it
are in Documents 1 to 8; folder names are fixed in Document 7, section 16. Update this page when a file is added,
moved or removed.

## The big picture

```
WHAT THE BROWSER RUNS                          WHAT ONLY OUR SERVER RUNS
─────────────────────                          ─────────────────────────
src/app/[lang]/…     the pages                 src/app/api/…            our endpoints (/api/…)
   │                                              │
src/features/…       screens (login form…)      src/server/auth/…        cookies, login, staying logged in
   │                                              │
src/components/…     building blocks            src/server/api-layer/…   the ONLY code that calls the backend
   │                 (inputs, buttons)            │
src/lib/client/api.ts ── fetch /api/… ──────────► └──────────────────────►  Backend /api/v1
```

- The browser never calls the backend. It calls our own `/api/…` endpoints, and only our server talks to the backend
  (Document 3, D3-03). Public photos are the one exception (D3-04).
- Pages rendered on the server get their data from `src/server/api-layer/` directly.

## Logging in, step by step

1. `/en/login`: `src/app/[lang]/login/page.tsx` shows `LoginForm` from `src/features/auth/login-form.tsx`.
2. The phone number is checked in the browser by `src/schemas/forms/login.ts` (only the shape; the backend decides the rest).
3. "Send code": `send()` in `src/lib/client/api.ts` posts to `/api/auth/code` with our fixed forgery header.
4. `src/app/api/auth/code/route.ts` checks the request comes from our site (`guardChange` in `src/server/auth/http.ts`),
   then calls `requestLoginCode` in `src/server/api-layer/accounts.ts`, which uses `callBackend` in `client.ts`.
5. The code is entered: `/api/auth/verify` gets the tokens from the backend and puts them in cookies
   (`setSessionCookies` in `http.ts`; names in `src/server/auth/cookies.ts`).
6. Every later page that needs login calls `requireUser` (`src/features/auth/require-user.tsx`), which asks `getViewer`
   in `src/server/auth/session.ts` who the person is.
7. When the access token has expired, the browser asks `/api/session`, and `refreshSession` in `session.ts` gets new
   tokens from the backend and sets the cookies. Two requests at once share one refresh; tabs and servers at once are
   covered by the backend's 10 seconds (Document 4, D4-11).
8. If the backend says the session is over, the answer clears the cookies, and `endSession` in
   `src/lib/client/session.ts` takes the person to the login page with "Please log in again".

## Every file, by folder

### `src/app/` — pages and endpoints (Next.js decides these names)

| File | What it does |
| --- | --- |
| `[lang]/layout.tsx`, `providers.tsx` | The page frame for `/en` and `/hi`; the TanStack Query setup, and ending a session from any screen |
| `[lang]/page.tsx` | Home (a placeholder until Slice 3) |
| `[lang]/login/page.tsx` | The login page |
| `[lang]/account/page.tsx` | Account: log out, log out everywhere, the areas this person may open |
| `[lang]/admin/…`, `[lang]/vendor/…` | Admin and Vendor areas (placeholders; the layout checks the role) |
| `[lang]/error.tsx`, `forbidden.tsx`, `global-error.tsx` | Error page, "no access" page (real 403), last-resort error page |
| `api/auth/code`, `api/auth/verify` | Ask for a login code; check it and log in |
| `api/auth/logout`, `api/auth/logout-all` | Log out here; log out everywhere |
| `api/session` | Who is logged in; renews the login when needed |
| `api/language` | Remembers the language choice |
| `api/health` | Health check for the hosting |
| `globals.css` | Colours and base styles (Document 6 tokens) |

### `src/features/` — screens

| File | What it does |
| --- | --- |
| `auth/login-form.tsx` | The phone and code steps |
| `auth/require-user.tsx` | Guard for pages that need login or a role |
| `auth/session-check.tsx` | Shown while the browser renews an expired login |
| `auth/logout-buttons.tsx` | "Log out" and "Log out everywhere" |
| `auth/area-shell.tsx` | Frame of the Admin and Vendor areas |
| `common/language-switch.tsx`, `error-message.tsx`, `needs-script.tsx` | Language switch, an error with its reference number, the no-script notice |

### `src/components/` — building blocks

| File | What it does |
| --- | --- |
| `form/form.ts` | `useAppForm` (React Hook Form with Zod), `applyServerError` (backend errors under the right field), message keys |
| `form/text-field.tsx`, `form/error-summary.tsx` | A labelled input with its error; the summary at the top that takes focus |
| `ui/…` | Components copied in by the shadcn/ui tool (D7-14) |

### `src/lib/` — shared helpers

| File | What it does |
| --- | --- |
| `i18n.ts` | The two languages, choosing one, and `getMessages` for the English and Hindi text |
| `errors.ts` | `AppError`, and `messageFor`: our own message for any error |
| `format.ts` | Dates and times in IST, rupees, phone numbers |
| `client/api.ts` | Browser calls to our endpoints: time limits, the forgery header, errors |
| `client/session.ts` | Who is logged in (`useSession`), and ending a session in the browser |
| `message-checks.ts` | What `npm run check:messages` checks (not used by the site) |
| `utils.ts` | `cn`, used by the shadcn/ui components |

### `src/server/` — runs only on our server

| File | What it does |
| --- | --- |
| `api-layer/client.ts` | `callBackend`: the one place that calls the backend. Time limits, retries for reads only, checks every answer against its schema, passes on the customer's address |
| `api-layer/accounts.ts` | The login and session calls of backend Area 1 |
| `auth/cookies.ts` | Cookie names, lifetimes and settings; the signed after-login cookie |
| `auth/http.ts` | Answers and errors of our endpoints; setting and clearing cookies; the forgery check |
| `auth/session.ts` | Who a request is, renewing the login, logout, where to go after login |
| `config.ts` | Settings read from the environment (`.env.local`) |

### Other folders

| Folder | What it holds |
| --- | --- |
| `src/schemas/` | Zod schemas: the shape of each backend answer (`accounts.ts`, `error.ts`) and of each form (`forms/`) |
| `src/messages/` | `en.json` and `hi.json`: every text on screen |
| `src/generated/` | Made by tools, never edited: request types and the backend's OpenAPI and error-code lists |
| `src/proxy.ts` | Sends a visit with no `/en` or `/hi` to the right language; keeps the after-login page |
| `scripts/` | `gen-types`, `gen-error-codes`, `check-messages`, and copying files after a build |
| `tests/unit/` | Fast tests of the helpers (Vitest) |
| `tests/e2e/` | Browser tests against the real backend (Playwright) |

## To change something, look here

| I want to change… | File |
| --- | --- |
| A text on screen, in English or Hindi | `src/messages/en.json` and `hi.json` (both) |
| What a backend error says to the person | `errors.codes` in the same two files |
| A form's checks | Its schema in `src/schemas/forms/` |
| How a backend call behaves (timeouts, retries) | `src/server/api-layer/client.ts` |
| Add a backend call | `src/server/api-layer/<area>.ts`, with its answer schema in `src/schemas/<area>.ts` |
| A cookie's lifetime | `src/server/auth/cookies.ts` |
| Who may open a page | The page's layout, using `requireUser` |
| Where people go after login | `defaultDestination` in `src/server/auth/session.ts` |
