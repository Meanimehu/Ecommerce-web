# Code map

A plain guide to the frontend code: which file does what, and how a request travels through them. The rules behind it
are in Documents 1 to 8; the folders are fixed in Document 7, section 16. Update this page when a file is added,
moved or removed.

## The folders

| Folder | What goes in it | Runs in |
| --- | --- | --- |
| `app/` | Routing and layouts: pages in `[lang]/`, our own endpoints in `api/` | Both |
| `components/` | Reusable UI: `ui/` (shadcn), `form/`, `common/`, and one folder per area (`auth/`) | Browser and server pages |
| `hooks/` | Reusable logic: TanStack Query hooks (our "slices") and the form hook | Browser |
| `api/` | Backend handlers: the calls from our server to the backend | **Server only** |
| `middleware/` | Login and request handling: who the person is, renewing the login, cookies, endpoint answers | **Server only** |
| `lib/` | Configs and integrations: settings, the browser's call helper, languages and text, errors | Both |
| `utils/` | Helper functions: money, dates, phone numbers | Both |
| `types/` | Types and the Zod shapes they come from; `generated/` for tool-made files | Both |
| `messages/` | `en.json` and `hi.json`: every text on screen | Both |
| `proxy.ts` | The page middleware: language redirect, keeping the after-login page | Server |

The same area name is used in every folder: everything about login is `components/auth/`, `hooks/use-login.ts`,
`api/auth.ts`, `types/auth.ts`. A cart would be `components/cart/`, `hooks/use-cart.ts`, `api/cart.ts`, `types/cart.ts`.

## How a request travels

```
BROWSER                                        OUR SERVER                                   BACKEND
───────                                        ──────────                                   ───────
components/auth/login-form.tsx
   │ uses
hooks/use-login.ts   (useVerify)
   │ calls
lib/http.ts   send('/api/auth/verify') ───►  app/api/auth/verify/route.ts
              (time limit, forgery label)        │ checks the request    middleware/responses.ts
                                                  │ calls
                                               api/auth.ts  verifyLoginCode()
                                                  │ through
                                               api/client.ts  callBackend() ──────────────►  /api/v1/auth/otp/verify
                                                  │ answer checked against types/auth.ts
                                               sets the login cookies (middleware/responses.ts)
```

- The browser never calls the backend; only `api/` does, on our server (Document 3, D3-03). Public photos are the one
  exception (D3-04).
- `lib/http.ts` is the browser's "interceptor" and `api/client.ts` is the server's: every call goes through them.
- `app/[lang]/providers.tsx` holds the one `QueryClient` (the "store"). Its error handler ends the session from any
  screen when the backend says it is over.

## Logging in, step by step

1. `/en/login`: `app/[lang]/login/page.tsx` shows `LoginForm` from `components/auth/login-form.tsx`.
2. The phone number is checked in the browser by `PhoneSchema` in `types/auth.ts` (only its shape; the backend decides the rest).
3. "Send code": `useRequestCode` in `hooks/use-login.ts` calls `/api/auth/code` through `lib/http.ts`.
4. `app/api/auth/code/route.ts` checks the request comes from our site (`guardChange` in `middleware/responses.ts`),
   then calls `requestLoginCode` in `api/auth.ts`.
5. The code: `useVerify` calls `/api/auth/verify`, which gets the tokens from the backend and puts them in cookies.
6. Every page that needs login calls `requireUser` (`components/auth/require-user.tsx`), which asks `getViewer` in
   `middleware/session.ts` who the person is.
7. When the access token has expired, `useSession` (`hooks/use-session.ts`) asks `/api/session`, and `refreshSession`
   in `middleware/session.ts` gets new tokens. Two requests at once share one refresh; tabs and servers at once are
   covered by the backend's 10 seconds (Document 4, D4-11).
8. If the backend says the session is over, that answer clears the cookies, and `endSession` in
   `hooks/use-session.ts` takes the person to the login page with "Please log in again".

## Every file

### `app/` — pages and endpoints (Next.js decides these names)

| File | What it does |
| --- | --- |
| `[lang]/layout.tsx`, `providers.tsx` | The page frame for `/en` and `/hi`; the QueryClient and its session-end handler |
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

### `components/` — UI

| File | What it does |
| --- | --- |
| `auth/login-form.tsx` | The phone and code steps |
| `auth/require-user.tsx` | Guard for pages that need login or a role |
| `auth/session-check.tsx` | Shown while the browser renews an expired login |
| `auth/logout-buttons.tsx` | "Log out" and "Log out everywhere" |
| `auth/area-shell.tsx` | Frame of the Admin and Vendor areas |
| `form/text-field.tsx`, `form/error-summary.tsx` | A labelled input with its error; the summary at the top that takes focus |
| `common/language-switch.tsx`, `error-message.tsx`, `needs-script.tsx` | Language switch, an error with its reference number, the no-script notice |
| `ui/…` | Components copied in by the shadcn/ui tool (D7-14) |

### `hooks/` — logic for the screens

| File | What it does |
| --- | --- |
| `use-session.ts` | `useSession` (who is logged in), `reloadSession`, `endSession`, the "Please log in again" notice |
| `use-login.ts` | `useRequestCode`, `useVerify` |
| `use-logout.ts` | `useLogout` |
| `use-app-form.ts` | `useAppForm` (React Hook Form with Zod), `applyServerError` (backend errors under the right field), message keys |

### `api/` — calls to the backend (server only)

| File | What it does |
| --- | --- |
| `client.ts` | `callBackend`: time limits, retries for reads only, every answer checked against its shape, the customer's address passed on |
| `auth.ts` | The login and session calls of backend Area 1 |

### `middleware/` — login and request handling (server only)

| File | What it does |
| --- | --- |
| `session.ts` | Who a request is (`asUser`, `getViewer`), renewing the login (`refreshSession`), logout, where to go after login |
| `responses.ts` | Answers and errors of our endpoints, setting and clearing cookies, the forgery check |
| `cookies.ts` | Cookie names, lifetimes and settings, and the signed after-login cookie. Also used by `proxy.ts` |

### `lib/`, `utils/`, `types/`

| File | What it does |
| --- | --- |
| `lib/config.ts` | Settings read from the environment (`.env.local`), server only |
| `lib/http.ts` | Browser calls to our endpoints: `get` and `send`, with the time limit, the forgery label and one error shape |
| `lib/i18n.ts` | The two languages, choosing one, and `getMessages` for the English and Hindi text |
| `lib/errors.ts` | `AppError`, and `messageFor`: our own message for any error |
| `utils/format.ts` | Dates and times in IST, rupees, phone numbers |
| `utils/cn.ts` | The class-name helper the shadcn/ui tool expects |
| `utils/message-checks.ts` | What `npm run check:messages` checks (not used by the site) |
| `types/auth.ts` | User, login and session answers, the phone and code forms |
| `types/error.ts` | The backend's error answer |
| `types/generated/` | Request types, the OpenAPI description and the error-code list, made by `npm run gen:types` and `gen:error-codes`; never edited |

### Outside `src/`

| Folder | What it holds |
| --- | --- |
| `scripts/` | `gen-types`, `gen-error-codes`, `check-messages`, and copying files after a build |
| `tests/unit/` | Fast tests of the helpers (Vitest) |
| `tests/e2e/` | Browser tests against the real backend (Playwright) |

## To change something, look here

| I want to… | Files |
| --- | --- |
| Change a text on screen | `messages/en.json` and `hi.json` (both) |
| Change what a backend error says | `errors.codes` in the same two files |
| Change a form's checks | Its schema in `types/<area>.ts` |
| Add a backend call | `api/<area>.ts`, with its answer shape in `types/<area>.ts` |
| Add an endpoint for the browser | `app/api/<area>/…/route.ts`, using `asUser` and `responses.ts` from `middleware/` |
| Use it on a screen | A hook in `hooks/use-<area>.ts`, then the component in `components/<area>/` |
| Change how backend calls behave (timeouts, retries) | `api/client.ts` |
| Change a cookie's lifetime | `middleware/cookies.ts` |
| Change who may open a page | The page's layout, using `requireUser` |
| Change where people go after login | `defaultDestination` in `middleware/session.ts` |
