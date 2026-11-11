# Code map

A plain guide to the frontend code: which file does what, and how a request travels through them. The rules behind it
are in Documents 1 to 8; the folders are fixed in Document 7, section 16. Update this page when a file is added,
moved or removed.

## The folders

| Folder | What goes in it | Runs in |
| --- | --- | --- |
| `app/` | Routing and layouts: pages in `[lang]/`, our own endpoints in `api/` | Both |
| `components/` | Reusable UI: `ui/` (shadcn), `form/`, `common/`, and one folder per area (`auth/`, `vendor/`, `admin/`) | Browser and server pages |
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
| `[lang]/admin/layout.tsx`, `page.tsx` | Admin area frame (any staff role) and its home with the screens this person's roles can use |
| `[lang]/admin/vendors/…` | Vendor review: the list, and one application (admin only) |
| `[lang]/admin/catalogue/[list]` | Catalogue lists: categories, HSN codes, brands, sizes, colours (admin only) |
| `[lang]/admin/moderation/…` | Product moderation: the queue and one product (moderator, admin) |
| `[lang]/vendor/layout.tsx` | Vendor area: never indexed, always rendered for the person |
| `[lang]/vendor/apply/page.tsx` | Become a vendor: open to anyone logged in |
| `[lang]/vendor/(app)/…` | Every other vendor page: needs a vendor in any status (the `(app)` folder groups them, it is not in the address) |
| `[lang]/vendor/(app)/products/…` | My products, add a product, one product |
| `[lang]/error.tsx`, `forbidden.tsx`, `global-error.tsx` | Error page, "no access" page (real 403), last-resort error page |
| `global-not-found.tsx` | "Not found" with a real 404, in English and Hindi together (the pages sit under a language segment, so Next.js uses one global page) |
| `api/auth/code`, `api/auth/verify` | Ask for a login code; check it and log in |
| `api/auth/logout`, `api/auth/logout-all` | Log out here; log out everywhere |
| `api/session` | Who is logged in; renews the login when needed |
| `api/vendors/…` | The person's own vendor application: details, addresses, documents (upload and view), submit |
| `api/admin/vendors/…` | Vendor review: list, one vendor, its documents, and the decisions |
| `api/admin/catalogue/[list]/…` | The catalogue lists: read, add, change (and switch off or on) |
| `api/catalogue/dictionaries` | What the product form offers |
| `api/catalogue/categories` | The public category tree |
| `api/vendors/me/products/…` | The vendor's products: details, variants, photos (upload, order, description, private view), submit |
| `api/moderation/products/…` | Moderation: queue, one product, its photos, approve or reject |
| `api/language` | Remembers the language choice |
| `api/health` | Health check for the hosting |
| `globals.css` | The Document 6 design tokens: colours, type scale (with the Hindi rules), radius, focus ring, reduced motion, hover only where a device can hover |

### `components/` — UI

| File | What it does |
| --- | --- |
| `auth/login-form.tsx` | The phone and code steps |
| `auth/require-user.tsx` | Guard for pages that need login or a role |
| `auth/session-check.tsx` | Shown while the browser renews an expired login |
| `auth/logout-buttons.tsx` | "Log out" and "Log out everywhere" |
| `auth/area-shell.tsx` | The frame of the Admin and Vendor areas: top bar (wordmark, area label, language, account) and the side menu |
| `auth/area-nav.tsx` | The side menu, and the menu button with its drawer below 1024 px |
| `auth/area-menus.ts` | What each side menu lists, by role (Admin) or by having a vendor (Vendor) |
| `vendor/vendor-area.tsx` | Who may open which vendor page; the application page is open to anyone logged in |
| `vendor/apply-screen.tsx` | Become a vendor: the status card and the four steps |
| `vendor/apply-steps.ts` | The step names and which step fixes each missing item |
| `vendor/apply-details.tsx`, `apply-address.tsx`, `apply-documents.tsx`, `apply-review.tsx` | The four steps: details, addresses, documents (upload with progress), review with the terms and submit |
| `vendor/vendor-status.tsx` | The vendor status chip, and which statuses can be changed |
| `admin/vendor-list.tsx` | Vendor review list with its filters and pages |
| `admin/vendor-review.tsx` | One application: details, addresses, documents and the decisions |
| `admin/catalogue-screen.tsx` | Catalogue lists: the list tabs and one table pattern (status, Edit, Switch off or on, Add) |
| `admin/catalogue-forms.tsx` | The add and change forms of HSN codes, brands, sizes and colours, and the frame they share |
| `admin/category-form.tsx` | The category form with its attributes |
| `admin/moderation-queue.tsx`, `moderation-review.tsx` | The moderation queue, and one product with the decision |
| `product/product-list.tsx` | My products: filters, table, numbered pages |
| `product/product-editor.tsx` | One product: the five steps while it can change, otherwise its summary |
| `product/product-basics.tsx`, `product-attributes.tsx`, `product-variants.tsx`, `product-photos.tsx`, `product-review.tsx` | The five steps |
| `product/product-summary.tsx` | A product the vendor cannot change right now, read-only |
| `product/product-status.tsx`, `product-steps.ts` | The product status chip; the step names and which step fixes each missing item |
| `product/photo-frame.tsx` | A product photo in its 4:5 frame, or "Photo unavailable" |
| `form/field-frame.tsx` | What every field shares: label, "(optional)", the error under it, help text |
| `form/text-field.tsx`, `select-field.tsx`, `textarea-field.tsx` | A labelled input, select and text area with their errors |
| `form/error-summary.tsx` | The summary at the top of a form that takes focus |
| `common/site-header.tsx`, `wordmark.tsx` | The storefront header (wordmark and language switch for now) and the Dhaaga wordmark |
| `common/language-switch.tsx` | The other language's name with a globe icon |
| `common/error-message.tsx` | An error banner with its reference number and Copy, when a real one exists |
| `common/state-block.tsx` | Whole-screen states: error, no access, not found |
| `common/needs-script.tsx` | The "needs JavaScript" notice |
| `common/status-chip.tsx` | A status chip: icon, words and a tone |
| `common/steps.tsx` | The steps of a long form |
| `common/data-table.tsx`, `pagination.tsx` | Staff tables (stacked blocks on phones) and numbered pages |
| `common/breadcrumbs.tsx` | Breadcrumbs (only the parent on phones) |
| `common/load-states.tsx` | Loading and "could not be loaded, Try again" for one part of a screen |
| `common/reason-dialog.tsx` | A confirmation that asks for a reason (reject, suspend) |
| `common/toast.tsx` | The success toast ("Saved") |
| `ui/button.tsx` | Primary, secondary, quiet, destructive and destructive-confirm buttons; large, default and small; loading state |
| `ui/input.tsx`, `select.tsx`, `textarea.tsx`, `checkbox.tsx` | The text input, select, text area and checkbox |
| `ui/alert-dialog.tsx` | The confirmation dialog |
| `ui/banner.tsx` | Information, success, warning and error banners |
| `ui/skeleton.tsx` | Static loading shapes |

### `hooks/` — logic for the screens

| File | What it does |
| --- | --- |
| `use-session.ts` | `useSession` (who is logged in), `reloadSession`, `endSession`, the "Please log in again" notice |
| `use-login.ts` | `useRequestCode`, `useVerify` |
| `use-logout.ts` | `useLogout` |
| `use-app-form.ts` | `useAppForm` (React Hook Form with Zod), `applyServerError` (backend errors under the right field), message keys |
| `use-product.ts` | The vendor's products: the form guide, list, one product and every change to it |
| `use-moderation.ts` | The moderation queue, one product, the decision, the public category tree |
| `use-catalogue.ts` | The catalogue lists: `useCatalogueList`, `useSaveCatalogueItem`, active GST rates and HSN codes |
| `use-vendor.ts` | The own application (`useMyVendor` and its changes, document upload) and the admin review (`useVendorList`, `useVendor`, `useVendorDecision`) |

### `api/` — calls to the backend (server only)

| File | What it does |
| --- | --- |
| `client.ts` | `callBackend`: time limits, retries for reads only, every answer checked against its shape, the customer's address passed on; streamed uploads; `openBackendFile` for private files |
| `auth.ts` | The login and session calls of backend Area 1 |
| `vendor.ts` | Backend Area 2: the vendor application and the admin review |
| `catalogue.ts` | Backend Area 3a: the admin catalogue lists, and the public category tree |
| `product.ts` | Backend Area 3b: the vendor's products, variants and photos |
| `moderation.ts` | Backend Area 3b: moderation |

### `middleware/` — login and request handling (server only)

| File | What it does |
| --- | --- |
| `session.ts` | Who a request is (`asUser`, `getViewer`), renewing the login (`refreshSession`), logout, where to go after login |
| `responses.ts` | Answers and errors of our endpoints, setting and clearing cookies, the forgery check |
| `cookies.ts` | Cookie names, lifetimes and settings, and the signed after-login cookie. Also used by `proxy.ts` |
| `endpoint.ts` | What every endpoint for the browser does: `answerAsUser` (forgery check, run as the person, renew the login, answer), `answerPublic` (a public read), `uploadFrom` (a streamed upload), `fileAsUser` (a private file) |

### `lib/`, `utils/`, `types/`

| File | What it does |
| --- | --- |
| `lib/config.ts` | Settings read from the environment (`.env.local`), server only |
| `lib/fonts.ts` | Outfit and Noto Sans Devanagari, from our own site, each loaded only for the characters it covers |
| `lib/http.ts` | Browser calls to our endpoints: `get`, `send`, `patch`, `put`, `remove` and `upload` (with progress and Cancel), with the time limit, the forgery label and one error shape |
| `lib/uploads.ts` | Upload limits copied from the backend, for a quick check before sending; the photo sizes |
| `lib/i18n.ts` | The two languages, choosing one, and `getMessages` for the English and Hindi text |
| `lib/errors.ts` | `AppError`, and `messageFor`: our own message for any error |
| `utils/format.ts` | Dates and times in IST, rupees, phone numbers, GST rates |
| `utils/cn.ts` | The class-name helper the shadcn/ui tool expects |
| `utils/url.ts` | Addresses with their query (`withQuery`), page numbers, picking list filters |
| `utils/message-checks.ts` | What `npm run check:messages` checks (not used by the site) |
| `types/auth.ts` | User, login and session answers, the phone and code forms |
| `types/error.ts` | The backend's error answer |
| `types/common.ts` | Shapes every area shares: a page of a list, a reason |
| `types/catalogue.ts` | Backend Area 3a lists (GST rate, HSN code, category with attributes, brand, size, colour), their forms, tree order |
| `types/product.ts` | Backend Area 3b answers (product, variant, photo, form guide, moderation), the product forms, rupees to paise |
| `types/vendor.ts` | Backend Area 2 answers (vendor, address, document, admin views) and the application forms |
| `types/generated/` | Request types, the OpenAPI description and the error-code list, made by `npm run gen:types` and `gen:error-codes`; never edited |

### Outside `src/`

| Folder | What it holds |
| --- | --- |
| `scripts/` | `gen-types`, `gen-error-codes`, `check-messages`, and copying files after a build |
| `tests/unit/` | Fast tests of the helpers (Vitest) |
| `tests/e2e/` | Browser tests against the real backend (Playwright); `fixtures/` holds the garment illustrations used as test photos |

## To change something, look here

| I want to… | Files |
| --- | --- |
| Change a text on screen | `messages/en.json` and `hi.json` (both) |
| Change a colour, size or type style | `app/globals.css` (tokens) or the component in `components/ui/` |
| Change what a backend error says | `errors.codes` in the same two files |
| Change a form's checks | Its schema in `types/<area>.ts` |
| Add a backend call | `api/<area>.ts`, with its answer shape in `types/<area>.ts` |
| Add an endpoint for the browser | `app/api/<area>/…/route.ts`, using `asUser` and `responses.ts` from `middleware/` |
| Use it on a screen | A hook in `hooks/use-<area>.ts`, then the component in `components/<area>/` |
| Change how backend calls behave (timeouts, retries) | `api/client.ts` |
| Change a cookie's lifetime | `middleware/cookies.ts` |
| Change who may open a page | The page's layout, using `requireUser` |
| Change where people go after login | `defaultDestination` in `middleware/session.ts` |
