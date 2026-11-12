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
| `proxy.ts` | The page middleware: language redirect, keeping the after-login page, the page's own address for layout guards, images only from our site and the photo host | Server |

The same area name is used in every folder: everything about login is `components/auth/`, `hooks/use-login.ts`,
`api/auth.ts`, `types/auth.ts`. A cart would be `components/cart/`, `hooks/use-cart.ts`, `api/cart.ts`, `types/cart.ts`.

## How a request travels

The login code, from the button to the backend and back (Document 7, section 20.9):

```
BROWSER                                              OUR SERVER                             BACKEND
───────                                              ──────────                             ───────
components/auth/login-form.tsx   draws only
  <Form onSubmit={form.handleSubmit(sendCode, showValidationErrors)}>
   │ field check fails → showValidationErrors (summary takes focus); passes → sendCode
   ▼
hooks/use-login-form.ts   usePhoneStep: sendCode, onSuccess, onError
   │ requestLoginCode.mutate(phone, { onSuccess, onError })
   ▼
hooks/use-login.ts   useRequestLoginCode: the address and the typed answer
   │
   ▼
lib/http.ts   send('/api/auth/code') ──────────►  app/api/auth/code/route.ts
  time limit, forgery header,                        │ guardChange: is it from our site?
  every failure becomes an AppError                  ▼
                                                   api/auth.ts  requestLoginCode()
                                                     │
                                                   api/client.ts  callBackend() ──────────►  /api/v1/auth/otp/request
                                                     │ answer checked against types/auth.ts
   ◄─────────────────────────────────────────────  ok(answer) or the same error code
   ▼
hooks/use-login-form.ts   onSuccess → the code step;  onError(error: AppError) → message + focus
```

- The browser never calls the backend; only `api/` does, on our server (Document 3, D3-03). Public photos are the one
  exception (D3-04).
- `lib/http.ts` is the browser's "interceptor" and `api/client.ts` is the server's: every call goes through them.
- `app/[lang]/providers.tsx` holds the one `QueryClient` (the "store"). Its error handler ends the session from any
  screen when the backend says it is over.

## Logging in, step by step

1. `/en/login`: `app/[lang]/login/page.tsx` shows `LoginForm` from `components/auth/login-form.tsx`. The screen only
   draws; its logic is `usePhoneStep` and `useCodeStep` in `hooks/use-login-form.ts`.
2. The phone number is checked in the browser by `PhoneFormSchema` in `types/auth.ts` (only its shape; the backend decides
   the rest), through `form.handleSubmit` on the `Form` (`components/form/form.tsx`, always a post).
3. "Send code": `sendCode` calls `useRequestLoginCode` (`hooks/use-login.ts`), which posts to `/api/auth/code` through
   `lib/http.ts`.
4. `app/api/auth/code/route.ts` checks the request comes from our site (`guardChange` in `middleware/responses.ts`),
   then calls `requestLoginCode` in `api/auth.ts`.
5. The answer comes back to `onSuccess` (go to the code step) or `onError` (an `AppError`: the message under the field
   or in the summary, then focus on the summary). A code sent a moment ago (`OTP_RESEND_WAIT`) still goes to the code
   step and shows the wait.
6. The code: `verifyCode` calls `useVerifyLoginCode`, which posts to `/api/auth/verify`. That endpoint gets the tokens
   from the backend, puts them in cookies, runs a pending "Add to cart" once, and says which page comes next.
   "Send code again" (`resendCode`) uses the same call as step 3.
7. Every page that needs login calls `requireUser` (`components/auth/require-user.tsx`), which asks `getViewer` in
   `middleware/session.ts` who the person is.
8. When the access token has expired, `useSession` (`hooks/use-session.ts`) asks `/api/session`, and `refreshSession`
   in `middleware/session.ts` gets new tokens. Two requests at once share one refresh; tabs and servers at once are
   covered by the backend's 10 seconds (Document 4, D4-11).
9. If the backend says the session is over, that answer clears the cookies, and `endSession` in
   `hooks/use-session.ts` takes the person to the login page with "Please log in again".

## Every file

### `app/` — pages and endpoints (Next.js decides these names)

| File | What it does |
| --- | --- |
| `[lang]/layout.tsx`, `providers.tsx` | The page frame for `/en` and `/hi`; the QueryClient and its session-end handler |
| `[lang]/page.tsx` | Home (a placeholder until Slice 3) |
| `[lang]/c/[slug]` | A category page: its products, newest first, with "Load more" (kept for 60 seconds) |
| `[lang]/p/[id]/[[...name]]` | A product page; a missing or wrong name part redirects to the full address (kept for 60 seconds) |
| `[lang]/cart` | The cart (needs login) |
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
| `api/catalogue/products/…` | Product cards for "Load more"; one product as it is now (before adding to the cart) |
| `api/cart/…` | The cart: view (with a coupon preview), add, change quantity, remove, remove unavailable |
| `api/cart/pending` | "Add to cart" while logged out: kept in a signed cookie until login (D2-02) |
| `api/auth/verify` | Also runs a pending add, once |
| `api/vendors/me/products/…` | The vendor's products: details, variants, photos (upload, order, description, private view), submit |
| `api/moderation/products/…` | Moderation: queue, one product, its photos, approve or reject |
| `api/language` | Remembers the language choice |
| `api/health` | Health check for the hosting |
| `globals.css` | The Document 6 design tokens: colours, type scale (with the Hindi rules), radius, focus ring, reduced motion, hover only where a device can hover |

### `components/` — UI

| File | What it does |
| --- | --- |
| `auth/login-form.tsx` | The login screen: the phone and code steps, drawing only (logic in `hooks/use-login-form.ts`) |
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
| `catalogue/product-card.tsx`, `price.tsx` | The storefront product card and price line |
| `catalogue/load-more.tsx` | The product grid with "Load more" |
| `catalogue/product-gallery.tsx`, `product-buy.tsx` | The product page's photos; size and colour, stock, Add to cart |
| `cart/cart-screen.tsx` | The cart: lines by seller, quantity, remove, line problems, coupon, totals |
| `common/header-actions.tsx` | "Log in" or the account, and the cart with its count, in the storefront header |
| `form/field-frame.tsx` | What every field shares: label, "(optional)", the error under it, help text |
| `form/text-field.tsx`, `select-field.tsx`, `textarea-field.tsx` | A labelled input, select and text area with their errors |
| `form/form.tsx` | `Form`: the `<form>` tag every form uses, always a post, our checks instead of the browser's |
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
| `use-session.ts` | `useSession` (who is logged in), `reloadSession`, `endSession`, `SessionNotice` and `useSessionNotice` (the "Please log in again" or blocked notice) |
| `use-login.ts` | The two login calls: `useRequestLoginCode`, `useVerifyLoginCode` |
| `use-login-form.ts` | The login form's logic: `usePhoneStep` and `useCodeStep` (submit, success, each error, resend countdown) |
| `use-logout.ts` | `useLogout` |
| `use-app-form.ts` | `useAppForm` (React Hook Form with Zod), `applyServerError` (backend errors under the right field), `useErrorSummaryFocus` (focus after a failed submit), message keys |
| `use-cart.ts` | The cart and its count, add, change, remove, add after login and its notice |
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
| `catalogue.ts` | Backend Area 3a: the admin catalogue lists, and the storefront (category tree, product cards, one product) |
| `product.ts` | Backend Area 3b: the vendor's products, variants and photos |
| `cart.ts` | Backend Area 5: the cart |
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
| `lib/http.ts` | Browser calls to our endpoints: `get`, `send`, `patch`, `put`, `remove` and `upload` (with progress and Cancel), with the time limit and the forgery label; every failure is an `AppError` |
| `lib/http-status.ts` | `HttpStatus` and the range checks (`isSuccess`, `isClientError`, `isServerError`) |
| `lib/uploads.ts` | Upload limits copied from the backend, for a quick check before sending; the photo sizes |
| `lib/i18n.ts` | The two languages and choosing one |
| `lib/messages.ts` | `getMessages` for server pages; the shared text and the Vendor and Admin areas' own text |
| `lib/messages-context.tsx` | `useMessages`: the page's text in the browser, only its language (and area text only inside those areas) |
| `lib/errors.ts` | `AppError`, `toAppError`, and `messageFor`: our own message for any error |
| `lib/error-codes.ts` | `AppErrorCode` (codes not in the backend catalogue) and `ErrorCode`; re-exports `BackendErrorCode` (Document 7, 20.7) |
| `utils/format.ts` | Dates and times in IST, rupees, phone numbers, GST rates; `isSingular` for one-or-many messages |
| `utils/cn.ts` | The class-name helper the shadcn/ui tool expects |
| `utils/url.ts` | Addresses with their query (`withQuery`), page numbers, picking list filters |
| `utils/message-checks.ts` | What `npm run check:messages` checks (not used by the site) |
| `types/auth.ts` | User, login and session answers, the phone and code forms |
| `types/error.ts` | The backend's error answer |
| `types/common.ts` | Shapes every area shares: a page of a list, a reason |
| `types/catalogue.ts` | Backend Area 3a lists (GST rate, HSN code, category with attributes, brand, size, colour), their forms, tree order; the storefront's category tree, product card, product, and product addresses |
| `types/cart.ts` | Backend Area 5 cart view, the pending add |
| `types/add-notice.ts` | `AddOutcome` and `AddNotice`: what happened to a pending add at login. Kept free of Zod because every page's header reads it |
| `types/react-query.d.ts` | Tells TanStack Query that every error is an `AppError` |
| `types/product.ts` | Backend Area 3b answers (product, variant, photo, form guide, moderation), the product forms, rupees to paise |
| `types/vendor.ts` | Backend Area 2 answers (vendor, address, document, admin views) and the application forms |
| `types/generated/` | Request types, the OpenAPI description, the error-code list and the `BackendErrorCode` enum, made by `npm run gen:types` and `gen:error-codes`; never edited |

### Outside `src/`

| Folder | What it holds |
| --- | --- |
| `scripts/` | `gen-types`, `gen-error-codes` (the code list and its enum), `check-messages` (also checks the enum), and copying files after a build |
| `.prettierrc.json`, `eslint.config.mjs` | Formatting (100-character lines) and lint; the files already following Document 7, section 20 are listed in the lint settings |
| `tests/unit/` | Fast tests of the helpers (Vitest) |
| `tests/e2e/` | Browser tests against the real backend (Playwright); `fixtures/` holds the garment illustrations used as test photos |

## To change something, look here

| I want to… | Files |
| --- | --- |
| Change a text on screen | `messages/en.json` and `hi.json` (both). Text only the Vendor or Admin area uses goes in a section listed in `AREA_SECTIONS` (`lib/messages.ts`) |
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
