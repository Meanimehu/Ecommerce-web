# Code map

A plain guide to the frontend code: which file does what, and how a request travels through them. The rules behind it
are in Documents 1 to 8; the folders are fixed in Document 7, section 16. Update this page when a file is added,
moved or removed.

## The folders

| Folder | What goes in it | Runs in |
| --- | --- | --- |
| `app/` | Routing and layouts: pages in `[lang]/`, our own endpoints in `api/` | Both |
| `features/<feature>/` | One folder per feature, once it has moved (Document 7, D7-17): `components/`, `hooks/`, `server/` (server only) and `types.ts`. **`auth`, `vendor`, `catalogue` (the admin lists), `product`, `storefront` (a group of parts, D7-20), `cart`, `account` and `layout` have moved | Both; `server/` server only |
| `components/` | Reusable UI any feature may use: `ui/` (shadcn), `form/`, `common/`. It imports no feature | Browser and server pages |
| `hooks/` | Reusable logic: the form hook; each feature's hooks are in its `hooks/` | Browser |
| `api/` | `client.ts`: the one way our server calls the backend; each feature's calls are in its `server/` | **Server only** |
| `middleware/` | Shared technical helpers for our endpoints, knowing nothing about the session: answers, the forgery check, public reads, uploads, the cookie list and tools | **Server only** (except `cookies.ts`) |
| `lib/` | Configs and integrations: settings, the browser's call helper, languages and text, page addresses, errors, the server log | Both |
| `utils/` | Helper functions: money, dates, phone numbers | Both |
| `types/` | Types and the Zod shapes they come from; `generated/` for tool-made files | Both |
| `messages/` | `en.json` and `hi.json`: every text on screen | Both |
| `fonts/` | The Devanagari font files trimmed to the characters Hindi uses, how they were made (`README.md`) and their licence | Both |
| `proxy.ts` | The page middleware: language redirect, keeping the after-login page, the page's own address for layout guards, images only from our site and the photo host | Server |

A feature keeps everything in its folder: everything about login and the session is in
`features/auth/`, everything about the cart in `features/cart/`.

## How a request travels

The login code, from the button to the backend and back (Document 7, section 20.9):

```
BROWSER                                              OUR SERVER                             BACKEND
───────                                              ──────────                             ───────
features/auth/components/login-form.tsx   draws only
  <Form onSubmit={form.handleSubmit(sendCode, showValidationErrors)}>
   │ field check fails → showValidationErrors (summary takes focus); passes → sendCode
   ▼
features/auth/hooks/use-login-form.ts   usePhoneStep: sendCode, onSuccess, onError
   │ requestLoginCode.mutate(phone, { onSuccess, onError })
   ▼
features/auth/hooks/use-auth.ts   useRequestLoginCode: the address and the typed answer
   │
   ▼
lib/http.ts   send('/api/auth/code') ──────────►  app/api/auth/code/route.ts
  time limit, forgery header,                        │ guardChange: is it from our site?
  every failure becomes an AppError                  ▼
                                                   features/auth/server/auth-api.ts
                                                     requestLoginCode()
                                                     │
                                                   api/client.ts  callBackend() ──────────►  /api/v1/auth/otp/request
                                                     │ answer checked against features/auth/types.ts
   ◄─────────────────────────────────────────────  ok(answer) or the same error code
   ▼
features/auth/hooks/use-login-form.ts   onSuccess → the code step;  onError(error: AppError) → message + focus
```

- The browser never calls the backend; only `api/client.ts` does, on our server (Document 3, D3-03). Public photos are the one
  exception (D3-04).
- `lib/http.ts` is the browser's "interceptor" and `api/client.ts` is the server's: every call goes through them.
- `app/[lang]/providers.tsx` holds the one `QueryClient` (the "store"). Its error handler ends the session from any
  screen when the backend says it is over.

## Logging in, step by step

All the files named here without a folder are in `features/auth/`.

1. `/en/login`: `app/[lang]/login/page.tsx` shows `LoginForm` from `components/login-form.tsx`. The screen only
   draws; its logic is `usePhoneStep` and `useCodeStep` in `hooks/use-login-form.ts`.
2. The phone number is checked in the browser by `PhoneFormSchema` in `types.ts` (only its shape; the backend decides
   the rest), through `form.handleSubmit` on the `Form` (`components/form/form.tsx`, always a post).
3. "Send code": `sendCode` calls `useRequestLoginCode` (`hooks/use-auth.ts`), which posts to `/api/auth/code` through
   `lib/http.ts`.
4. `app/api/auth/code/route.ts` checks the request comes from our site (`guardChange` in `middleware/responses.ts`),
   then calls `requestLoginCode` in `server/auth-api.ts`.
5. The answer comes back to `onSuccess` (go to the code step) or `onError` (an `AppError`: the message under the field
   or in the summary, then focus on the summary). A code sent a moment ago (`OTP_RESEND_WAIT`) still goes to the code
   step and shows the wait.
6. The code: `verifyCode` calls `useVerifyLoginCode`, which posts to `/api/auth/verify`. That endpoint gets the tokens
   from the backend, puts them in cookies (`setSessionCookies`, `server/session.ts`), asks `cart` to run a pending "Add to cart" once
   (`runPendingAdd`, `features/cart/server/pending-add.ts`), and says which page comes next: the page remembered by `after-login-page.ts`, else `defaultDestination`.
   The login form keeps what happened to that add for the next page (`keepAddNotice`, `lib/add-notice.ts`).
   "Send code again" (`resendCode`) uses the same call as step 3.
7. Every page that needs login calls `requireUser` (`components/require-user.tsx`), which asks `getViewer` in
   `server/session.ts` who the person is.
8. When the access token has expired, `useSession` (`hooks/use-auth.ts`) asks `/api/session`, and `refreshSession`
   in `server/session.ts` gets new tokens. Two requests at once share one refresh; tabs and servers at once are
   covered by the backend's 10 seconds (Document 4, D4-11).
9. If the backend says the session is over, that answer clears the cookies (`fromFailure` and `clearSessionCookies`
   in `server/session.ts`), and `endSession` in `hooks/use-session-end.ts` takes the person to the login page with
   "Please log in again".

## A call made as the logged-in person

Every endpoint that acts as the person (a vendor saving their details, an admin approving) works the same way:

1. The screen's call hook sends the request through `lib/http.ts`, for example `PATCH /api/vendors/me`.
2. `app/api/vendors/me/route.ts` calls `answerAsUser` (`features/auth/server/answer-as-user.ts`).
3. For a change, `answerAsUser` first runs the forgery check (`guardChange`, shared, `middleware/responses.ts`).
4. `asUser` (`features/auth/server/session.ts`) reads the login cookies and runs the call with the access token. When
   the token is missing or expired it renews it once (`refreshSession`, through `server/auth-api.ts` and
   `api/client.ts`) and repeats the call.
5. If the request cannot run as the person, `fromFailure` (`auth`) answers: 401 when nobody is logged in, 503 "try
   again" with no cookie changed, or 401/403 with the cookies cleared when the backend confirmed the session is over.
6. If the call runs and the backend refuses it, `fromAppError` (shared) passes the backend's code on. If it works, the
   answer goes back, with any renewed cookies set by `setSessionCookies` (`auth`).

Logout is `app/api/auth/logout/route.ts` → `logoutRoute` (`features/auth/server/logout.ts`): the backend is asked to end
the session, a failure is logged with `logServerEvent`, and `clearSessionCookies` clears the cookies either way.

## Every file

### `app/` — pages and endpoints (Next.js decides these names)

| File | What it does |
| --- | --- |
| `[lang]/layout.tsx`, `providers.tsx` | The page frame for `/en` and `/hi`; the QueryClient and its session-end handler |
| `[lang]/page.tsx` | Home: the hero, "Shop by category", "Brands" and New arrivals, kept for 60 seconds; a part that could not be read is read again in the browser |
| `[lang]/brand/[slug]` | A brand page: the brand's products with filters (no brand filter) and sort, then "Load more"; an unknown slug is a real 404; the screen is in `features/storefront/product-list/` |
| `[lang]/category/[slug]` | A category page: its products with filters and sort in the address, then "Load more"; drawn on each request, its list answer kept for 60 seconds; only the plain list is indexed; the screen is in `features/storefront/product-list/` |
| `[lang]/product/[id]/[[...name]]` | A product page; a missing or wrong name part redirects to the full address (kept for 60 seconds); the screen is in `features/storefront/product-page/`. The old `/c/` and `/p/` addresses are a real 404 |
| `[lang]/search` | Search results: `?q=` with the filters and sort, best match first; drawn on each request, its list answer kept 30 seconds; never indexed; with no text it asks for some; the screen is in `features/storefront/product-list/` |
| `[lang]/cart` | The cart (needs login): `CartScreen` from `cart` |
| `[lang]/login/page.tsx` | The login page |
| `[lang]/account/page.tsx` | Account, the Profile tab: the phone, the name and email, the areas this person may open (needs login) |
| `[lang]/account/addresses` | Account, the Addresses tab: saved addresses, read on the server (needs login) |
| `[lang]/account/security` | Account, the Security tab: log out, log out everywhere (`auth`'s `LogoutButtons`) (needs login) |
| `[lang]/admin/layout.tsx`, `page.tsx` | Admin area (any staff role): `AreaShell` and `AdminHome` from `layout` |
| `[lang]/admin/vendors/…` | Vendor review: the list, and one application (admin only); the screens are in `features/vendor/` |
| `[lang]/admin/catalogue/[list]` | Catalogue lists: categories, HSN codes, brands, sizes, colours (admin only); the screens are in `features/catalogue/` |
| `[lang]/admin/moderation/…` | Product moderation: the queue and one product (moderator, admin); the screens are in `features/product/` |
| `[lang]/vendor/layout.tsx` | Vendor area: never indexed, always rendered for the person |
| `[lang]/vendor/apply/page.tsx` | Become a vendor: open to anyone logged in |
| `[lang]/vendor/(needs-vendor)/…` | Every other vendor page: needs a vendor in any status (the `(needs-vendor)` folder groups them, it is not in the address) |
| `[lang]/vendor/(needs-vendor)/profile/page.tsx` | The business profile; the screen is in `features/vendor/` |
| `[lang]/vendor/(needs-vendor)/products/…` | My products (`products`), add a product (`products/add`), one product (`products/{id}`); the screens are in `features/product/` |
| `[lang]/error.tsx`, `forbidden.tsx`, `global-error.tsx` | Error page, "no access" page (real 403), last-resort error page |
| `global-not-found.tsx` | "Not found" with a real 404, in English and Hindi together (the pages sit under a language segment, so Next.js uses one global page) |
| `api/auth/code`, `api/auth/verify` | Ask for a login code; check it and log in |
| `api/auth/logout`, `api/auth/logout-all` | Log out here; log out everywhere |
| `api/session` | Who is logged in; renews the login when needed |
| `api/vendors/…` | The person's own vendor application: details, addresses, documents (upload and view), submit |
| `api/admin/vendors/…` | Vendor review: list, one vendor, its documents, and the decisions |
| `api/admin/catalogue/[list]/…` | The catalogue lists: read, add, change (and switch off or on) |
| `api/catalogue/dictionaries` | What the product form offers (the backend's own address; it belongs to `product`) |
| `api/catalogue/categories` | The public category tree (`storefront/product-list`) |
| `api/me`, `api/me/addresses/…` | Change one's own name and email; the saved addresses: list, add, change, delete, make default (`account`) |
| `api/catalogue/suggest` | Suggestions while typing, fresh for 10 seconds (`storefront/search`) |
| `api/catalogue/brands` | A page of the active brands, fresh for 10 minutes (`storefront/product-list`) |
| `api/catalogue/products/…` | Product cards for "Load more"; one product as it is now (before adding to the cart) (`storefront/product-list`, `storefront/product-page`) |
| `api/cart/…` | The cart: view (with a coupon preview), add, change quantity, remove, remove unavailable |
| `api/cart/pending` | "Add to cart" while logged out: kept in a signed cookie until login (D2-02) |
| `api/auth/verify` | Also runs a pending add, once |
| `api/vendors/me/products/…` | The vendor's products: details, variants, photos (upload, order, description, private view), submit |
| `api/moderation/products/…` | Moderation: queue, one product, its photos, approve or reject |
| `api/language` | Remembers the language choice (the switch in `layout`) |
| `api/health` | Health check for the hosting |
| `globals.css` | The Document 6 design tokens: colours, type scale (with the Hindi rules), radius, focus ring, reduced motion, hover only where a device can hover |

### `components/` — UI

| File | What it does |
| --- | --- |
| `form/field-frame.tsx` | What every field shares: label, "(optional)", the error under it, help text |
| `form/text-field.tsx`, `select-field.tsx`, `textarea-field.tsx` | A labelled input, select and text area with their errors |
| `form/form.tsx` | `Form`: the `<form>` tag every form uses, always a post, our checks instead of the browser's |
| `form/error-summary.tsx` | The summary at the top of a form that takes focus |
| `common/error-message.tsx` | An error banner with its reference number and Copy, when a real one exists |
| `common/state-block.tsx` | Whole-screen states: error, no access, not found |
| `common/needs-script.tsx` | The "needs JavaScript" notice |
| `common/status-chip.tsx` | A status chip: icon, words and a tone |
| `common/price.tsx` | A price: the price, the MRP struck through when higher, "32% off" (the product card and the product page use it) |
| `common/photo-frame.tsx` | A product photo in its 4:5 frame, or "Photo unavailable" (the storefront, the cart and `product` use it) |
| `common/steps.tsx` | The steps of a long form |
| `common/data-table.tsx`, `pagination.tsx` | Staff tables (stacked blocks on phones) and numbered pages |
| `common/breadcrumbs.tsx` | Breadcrumbs (only the parent on phones) |
| `common/load-states.tsx` | Loading and "could not be loaded, Try again" for one part of a screen |
| `common/reason-dialog.tsx` | A confirmation that asks for a reason (reject, suspend); only draws |
| `common/toast.tsx` | The success toast ("Saved") |
| `ui/button.tsx` | Primary, secondary, quiet, destructive and destructive-confirm buttons; large, default and small; loading state |
| `ui/input.tsx`, `select.tsx`, `textarea.tsx`, `checkbox.tsx` | The text input, select, text area and checkbox |
| `ui/alert-dialog.tsx` | The confirmation dialog |
| `ui/banner.tsx` | Information, success, warning and error banners |
| `ui/skeleton.tsx` | Static loading shapes |

### `hooks/` — logic for the screens

| File | What it does |
| --- | --- |
| `use-app-form.ts` | `useAppForm` (React Hook Form with Zod; it keeps the changed fields up to date, so an edit sends only what changed), `applyServerError` (backend errors under the right field), `useErrorSummaryFocus` (focus after a failed submit), message keys |
| `use-reason-dialog.ts` | The reason dialog's action hook: the reason checked, handed to the feature's decision with `onSuccess` (close) and `onError` (show the refusal); `ReasonOutcome`, `ConfirmWithReason` |

### `api/` — calls to the backend (server only)

| File | What it does |
| --- | --- |
| `client.ts` | `callBackend`: time limits, retries for reads only, every answer checked against its shape, the customer's address passed on; streamed uploads; `openBackendFile` for private files |

### `middleware/` — shared helpers for our endpoints (server only, except `cookies.ts`)

Nothing here knows about the session or any feature, and nothing here imports a feature.

| File | What it does |
| --- | --- |
| `responses.ts` | `ok`, `fail`, `fromAppError` (non-session failures; an unexpected one is logged with its request id), the forgery check (`guardChange`), reading a JSON body |
| `endpoint.ts` | `answerPublic` (a public read), `jsonObject` (a JSON object body), `uploadFrom` (a streamed upload) |
| `cookies.ts` | Cookie names, lifetimes and settings, `deleteCookie`, signing, the safe-local-path check, and the page-address header. Also used by `proxy.ts` |

### `features/auth/` — login, logout, the session and page access

Other features use only its public helpers (Document 7, section 20.4): `useSession`, `getViewer`, `requireUser` with
`Unavailable`, `answerAsUser` and `fileAsUser`, `rememberPageAfterLogin`, `isStaff`, and the `User` and
`SessionAnswer` types.

| File | What it does |
| --- | --- |
| `types.ts` | `User`, `isStaff`, `VENDOR_OWNER_ROLE`, `ADMIN_ROLE`, the backend answer schemas, the session answer, the phone and code forms |
| `after-login-page.ts` | The page to return to after login: `rememberPageAfterLogin`, `readPageAfterLogin`, `forgetPageAfterLogin` (a signed cookie). No server-only import, so `proxy.ts` can use it |
| `staff-screens.ts` | Which admin screens each staff role may use: `AdminScreen`, `adminScreensFor` (a page-access rule; `layout` shows it) |
| `components/login-form.tsx` | The login screen: the phone and code steps, drawing only (logic in `hooks/use-login-form.ts`) |
| `components/require-user.tsx` | `requireUser`, the guard for pages that need login or a role; `Unavailable` ("try again shortly", with a link back to the same page); `currentPath`, the page's own address, used only inside |
| `components/session-check.tsx` | Shown while the browser renews an expired login |
| `components/logout-buttons.tsx` | "Log out" and "Log out everywhere" |
| `hooks/use-auth.ts` | The call hooks: `useSession` and `sessionKeys`, `reloadSession`, `useRequestLoginCode`, `useVerifyLoginCode`, `useLogout` |
| `hooks/use-login-form.ts` | The login form's logic: `usePhoneStep` and `useCodeStep` (submit, success, each error, resend countdown) |
| `hooks/use-session-end.ts` | `endSession` and `endsSession` (ending the session in the browser from any screen), `SessionNotice` and `useSessionNotice` (the "Please log in again" or blocked notice) |
| `server/auth-api.ts` | The login and session calls of backend Area 1, made through `api/client.ts` |
| `server/session.ts` | Who a request is (`readAuth`, `asUser`, `getViewer`), renewing the login (`refreshSession`), the session cookies (`setSessionCookies`, `clearSessionCookies`), the answer when a session fails (`fromFailure`), where to go after login (`defaultDestination`) |
| `server/answer-as-user.ts` | `answerAsUser` (forgery check for a change, run as the person, renew the login, answer) and `fileAsUser` (a private file) |
| `server/logout.ts` | `logoutRoute`: logout and "log out everywhere" |

### `features/vendor/` — becoming a vendor, the business profile, and the admin's vendor review

Admin is a role, not a feature, so the admin's vendor screens are here too. Other features use its call hooks (for
example `useMyVendor`, which `product` uses); `app/` pages also use `findVendorPresence`.

| File | What it does |
| --- | --- |
| `types.ts` | The backend answer schemas (vendor, address, document, admin views); the enums (`VendorStatus`, `SellerType`, `DocumentType`, `DocumentStatus`, `AddressType`, `VendorDecision`, `DocumentDecision`, `MissingItem`, `ApplyStep`); the request bodies from the generated types; the forms (`VendorDetailsFormSchema`, `VendorAddressFormSchema`, and `ProfileDetailsFormSchema` for the profile after approval); the small rules `stepFor` (which step fixes a missing item) and `isEditable` (which statuses the owner may change) |
| `components/vendor-area.tsx` | `VendorArea`: who may open which vendor page; the application page is open to anyone logged in. Every other vendor page shows the read-only banner when the vendor is not approved |
| `components/read-only-banner.tsx` | `ReadOnlyBanner`: the one banner of Document 5, section 7.5 (not approved, or suspended), with a link to the application |
| `components/business-profile.tsx` | The business profile: details, addresses and documents; an approved vendor changes the shop name and email, the addresses and the documents, others read only (logic in `hooks/use-profile-details-form.ts`) |
| `components/apply-screen.tsx` | Become a vendor: the status card with its one way on, and the four steps |
| `components/details-step.tsx` | Step 1, business details (logic in `hooks/use-vendor-details-form.ts`) |
| `components/address-step.tsx`, `address-form.tsx` | Step 2: the addresses, and the add/change form (logic in `hooks/use-vendor-address-form.ts`) |
| `components/vendor-address-card.tsx` | One address with Edit and Remove, or read only; on the application and the business profile |
| `components/documents-step.tsx`, `document-row.tsx` | Step 3: one row per document type, with upload, progress, Cancel, View and Remove (logic in `hooks/use-document-upload.ts`); the business profile shows the same rows, read only unless the vendor is approved. Remove only while the application is a draft or rejected |
| `components/review-step.tsx` | Step 4: the checklist, the terms and Submit (logic in `hooks/use-vendor-submit.ts`) |
| `components/vendor-status-chip.tsx` | The vendor status chip |
| `components/vendor-list.tsx` | Admin: the vendor review list with its filters and pages |
| `components/vendor-review.tsx` | Admin: one application, its documents and the decisions (logic in `hooks/use-vendor-decisions.ts`) |
| `hooks/use-vendor.ts` | The call hooks, one per call: `useMyVendor`, `useApplyAsVendor`, `useUpdateMyVendor`, `useSubmitMyVendor`, `useAddVendorAddress`, `useUpdateVendorAddress`, `useRemoveVendorAddress`, `useUploadVendorDocument`, `useRemoveVendorDocument`, `useVendorList`, `useVendor`, `useDecideVendor`, `useReviewVendorDocument`; `vendorKeys` |
| `hooks/use-vendor-details-form.ts` | The details form: a new application sends every detail, an existing one only what changed; `GSTIN_TAKEN` goes under its field |
| `hooks/use-vendor-address-form.ts` | The address form: add or change; an emptied second line is removed |
| `hooks/use-profile-details-form.ts` | The business profile's details form: only the shop name or email that changed is sent |
| `hooks/use-document-upload.ts` | Action hook: check the file, upload with progress and Cancel, an unknown outcome |
| `hooks/use-vendor-submit.ts` | Action hook: submit with the terms version; changed terms clear the box |
| `hooks/use-vendor-decisions.ts` | Action hook: the admin's decisions on the vendor and each document; what approval still lacks |
| `server/vendor-api.ts` | Backend Area 2: the application and the admin review, made through `api/client.ts` |
| `server/vendor-presence.ts` | `lookUpVendor`: whether the person has a vendor (`Exists`, `None`, or `Unknown` when the backend cannot be asked) and its status, for the vendor area; `findVendorPresence` gives only the first, for the account page |

### `features/catalogue/` — the admin catalogue lists

Categories, HSN codes, brands, sizes and colours; GST rates are read here only as choices. Other features use its types
(`product` uses `Attribute` and `AttributeSchema`). The storefront's category tree and product cards are in
`features/storefront/product-list/`.

| File | What it does |
| --- | --- |
| `types.ts` | The list schemas; the enums `CatalogueList`, `AttributeType`, `SizeGroup`; `EDITABLE_LISTS` (the tab order); the request bodies (`AddBody`, `ChangeBody`); the forms; small rules: `attributeBody`, `inTreeOrder`, `rateField`, `rateValue`, `MAX_CATEGORY_DEPTH` |
| `components/catalogue-screen.tsx` | The list tabs, and each list's columns and form |
| `components/catalogue-table.tsx` | The one table pattern: filters, status, Edit, Switch off or on, Add, pages |
| `components/catalogue-form-frame.tsx` | The frame every form shares: a heading that takes focus, the error summary, Save and Cancel |
| `components/hsn-code-form.tsx`, `brand-form.tsx`, `size-form.tsx`, `colour-form.tsx` | The add and change forms (logic in their hooks) |
| `components/category-form.tsx`, `attribute-row.tsx` | The category form and one attribute (logic in `hooks/use-category-form.ts`) |
| `components/read-only-value.tsx` | A value that cannot be changed, such as a code |
| `hooks/use-catalogue.ts` | The call hooks: `useCatalogueList`, `useActiveGstRates`, `useActiveHsnCodes`, `useAllCategories`, `useAddCatalogueItem`, `useChangeCatalogueItem`; `catalogueKeys` |
| `hooks/use-catalogue-save.ts` | The save steps the forms share: add or change, the toast, the backend's errors under the right fields |
| `hooks/use-hsn-code-form.ts`, `use-brand-form.ts`, `use-size-form.ts`, `use-colour-form.ts` | One form hook per form: what it sends (a new entry: what is filled; a change: only what changed; never the code) |
| `hooks/use-category-form.ts` | The category form: the parent choices, the attributes, and the backend's attribute problems |
| `hooks/use-gst-rate-options.ts` | The GST choices: the active rates, and the current one if switched off |
| `server/catalogue-api.ts` | Backend Area 3a, the admin lists: list, add, change |

### `features/product/` — a vendor's products, and their moderation

Backend Area 3b: products, variants, photos, the form guide (`/catalogue/dictionaries`) and moderation. It uses
`catalogue`'s `Attribute`, `vendor`'s `useMyVendor` and `VendorStatus`, `auth`'s role names, and the shared photo frame.

| File | What it does |
| --- | --- |
| `types.ts` | The answer schemas; the enums `ProductStatus`, `VariantStatus`, `TaxSource`, `ReviewKind`, `ProductDecision`, `PhotoSize`, `ProductStep`, `MissingItem`, `UploadState`; the request bodies; the forms (`BasicsFormSchema`, `attributesFormSchema`, `VariantFormSchema`, which turns rupees into paise); small rules: `productStepFor`, `productStepToShow`, `canEditProduct`, `canReviewProducts`, `sortedPhotos`, `flattenCategories`, `findCategoryChoice`, `dictionaryLabel`, `rupeesToPaise`, `paiseToRupees`, `photoSizeOf`, `MAX_PHOTOS` |
| `components/product-list.tsx` | My products: filters, table, numbered pages |
| `components/product-editor.tsx` | One product: the five steps while it can change, otherwise its summary; the notices above it |
| `components/product-step-nav.tsx` | The step bar, with "step 2 of 5" for screen readers |
| `components/basics-step.tsx`, `attributes-step.tsx`, `variants-step.tsx`, `photos-step.tsx`, `review-step.tsx` | The five steps (logic in their hooks) |
| `components/attributes-form.tsx`, `variant-form.tsx` | The attributes form and one variant's form |
| `components/upload-row.tsx`, `photo-row.tsx` | A photo being uploaded; a saved photo with its description, order and Remove |
| `components/product-summary.tsx` | A product the vendor cannot change right now, read-only |
| `components/product-status-chip.tsx`, `missing-count-text.ts` | The product status chip; "1 thing missing" |
| `components/moderation-queue.tsx`, `moderation-review.tsx` | The moderation queue, and one product with the decision |
| `hooks/use-product.ts` | The call hooks, one per call: the form guide, the vendor's products, variants and photos, and moderation; `productKeys`, `moderationKeys`, the photo addresses |
| `hooks/use-basics-form.ts`, `use-attributes-form.ts`, `use-variant-form.ts` | One form hook per form: what it sends (a new one: what is filled; a change: only what changed) and where the backend's errors go |
| `hooks/use-photo-uploads.ts` | The upload queue: one file at a time, progress, Cancel and Retry; it keeps going after the step closes (Document 7, 20.9) |
| `hooks/use-photo-order.ts`, `use-photo-actions.ts`, `use-variant-actions.ts` | Moving photos; one photo's description and Remove; switching a variant off or on and removing it |
| `hooks/use-product-submit.ts` | Sending for review, deleting a draft |
| `hooks/use-product-decision.ts` | A moderator's approve (with the tax confirmation) and reject |
| `server/product-api.ts` | Backend Area 3b, the vendor's side: the form guide, products, variants, photos |
| `server/moderation-api.ts` | Backend Area 3b, moderation: the queue, one product, the decision, its photos |

### `features/storefront/` — what a shopper browses (a group, Document 7, D7-20)

A group folder: it holds only its parts, each a feature with the usual folders. Backend Area 3a, the public part.

#### `storefront/product-list/` — the lists of products

The public category tree and the product cards, and the category page that shows them. `product`'s moderation
screens use its category tree (`useCategoryTree`, `findInTree`).

| File | What it does |
| --- | --- |
| `types.ts` | The answer schemas and their types: the category tree, the product card (used by the server) |
| `rules.ts` | No Zod, so the public pages stay light: `ProductSort`, `LIST_SORTS`, `SEARCH_SORTS`, `readSearchText` (at most 100 characters), `findInTree`, `categoryEntries`; the filters in the address (`ListParam`, `FilterGroup`, `ListFilters`, `readListFilters`, `listSearch`, `backendFilters`, `withToggled`, `activeFilterCount`, `isPlainList`; at most 20 values) |
| `components/category-screen.tsx`, `brand-screen.tsx` | A category page's and a brand page's content, drawn on the server (the brand page has no brand filter) |
| `components/search-screen.tsx` | The search results: "Results for “…”", the count, the list best match first with the text kept in the address, or "Nothing matches" with categories to browse |
| `components/catalogue-entries.tsx`, `new-arrivals.tsx` | The home page's "Shop by category" and "Brands" (names only, brands hidden on compact), and New arrivals (4 cards); each part reads again with "Try again" if it failed |
| `components/filtered-list.tsx` | A list with its filters and sort, shared by the category, brand and search pages: the side panel (wide), the sheet (narrow), the sort, the chips, the grid, "no products match" |
| `components/filter-groups.tsx`, `price-filter.tsx` | The filter groups in order (size, colour, price, brand) with the backend's counts; the price from and to, in rupees |
| `components/filter-sheet.tsx` | The "Filters · 2" button and the full-height sheet with "Show N results" (narrow screens) |
| `components/active-filters.tsx`, `sort-choice.tsx` | The chosen filters as removable chips with "Clear all"; the sort |
| `components/product-grid.tsx`, `product-card.tsx` | The product grid with "Load more", the product card |
| `hooks/use-product-list.ts` | The call hooks: `useCategoryTree`, `useBrands`, `useNewArrivals` (each may start from what the server drew), `useProductCards` (the batches of "Load more"); `productListKeys` |
| `hooks/use-list-filters.ts` | A change of filter or sort opens the new address without scrolling, keeping fixed values such as the search text; the controls show the new choice at once |
| `hooks/use-product-grid.ts` | The cards shown, "Showing 8 of 128", what to announce after each batch |
| `server/product-list-api.ts` | Backend Area 3a: the tree (kept 10 minutes on our server), a page of brands, and the cards with their filter counts (kept 60 seconds, search results 30, at most 2,000 each) |
| `server/brand-slugs.ts` | `findBrand`: a brand by its slug, from a map of the whole public brand list kept 10 minutes; an unknown slug reads the list again at most once a minute (Document 4, section 5) |

#### `storefront/search/` — the search box

`layout` shows the box in the storefront header.

| File | What it does |
| --- | --- |
| `types.ts` | The suggestions' answer schema and type |
| `components/search-box.tsx` | A plain search form (it works before any script) with a list of suggestions as a combobox; it only draws |
| `hooks/use-search-box.ts` | The suggestions in groups (products, categories, brands), Up and Down, Enter opens the chosen one, Escape closes the list |
| `hooks/use-suggestions.ts` | The call hook: asks once typing pauses (250 ms); `searchKeys` |
| `server/search-api.ts` | Backend Area 3a: suggestions, kept 10 seconds on our server (at most 2,000 texts) |

#### `storefront/home/` — the home hero

| File | What it does |
| --- | --- |
| `components/home-hero.tsx` | The hero's approved text-only fallback on `sunken`, with the approved Stage 5 lines and no button (Document 6, 12.4); the photo waits on T7-8 |

#### `storefront/product-page/` — one product

It uses the cart's call hooks for "Add to cart" (`useAddToCart`, `useAddAfterLogin`) and `auth`'s session.

| File | What it does |
| --- | --- |
| `types.ts` | The answer schema of one product and its types (used by the server) |
| `rules.ts` | No Zod: `StockLevel`, `MissingChoice`, `AddMessageTone`; `categoryTrail`, `sizesOf`, `coloursOf`, `chosenVariant`, `isAvailable`, `missingChoiceOf`, `stockLevelOf` |
| `components/product-screen.tsx` | A product page's content, drawn on the server |
| `components/product-gallery.tsx` | The product page's photos |
| `components/product-buy.tsx`, `size-choice.tsx`, `colour-choice.tsx` | Price, size and colour, stock, Add to cart (logic in its hooks) |
| `hooks/use-product-page.ts` | The call hook `useProductNow` (the product read again in the browser); `productPageKeys` |
| `hooks/use-variant-choice.ts` | The size and colour chosen, what is available, what is still to choose |
| `hooks/use-product-add.ts` | Add to cart now, or log in and add on the way back; the messages |
| `server/product-page-api.ts` | Backend Area 3a: one product; `findVisibleProduct` (null for a real 404) |

### `features/account/` — the customer's own settings

Backend Area 1, the person's own profile and saved addresses (Document 5, section 6.5). The profile is `auth`'s `User`;
logout stays in `auth`.

| File | What it does |
| --- | --- |
| `types.ts` | The address schema, the generated request bodies, the profile and address form schemas, `MAX_ADDRESSES` (10) |
| `components/account-tabs.tsx` | The heading and the Profile, Addresses and Security tabs (`AccountTab`) |
| `components/profile-form.tsx` | The phone (shown, not changed), the name and email (both optional) |
| `components/address-list.tsx`, `address-form.tsx` | Saved addresses, default first, with Edit, Delete (asks first) and Make default; the form opens in place; up to 10 |
| `components/account-areas.tsx` | The Admin area, the Vendor area or "Become a vendor", as the person may |
| `hooks/use-account.ts` | The call hooks: `useAddresses`, `useUpdateProfile`, `useAddAddress`, `useUpdateAddress`, `useRemoveAddress`, `useMakeDefaultAddress`; `accountKeys` |
| `hooks/use-profile-form.ts`, `use-address-form.ts` | The forms: only the changed fields are sent; the backend's errors show by the fields |
| `hooks/use-address-actions.ts` | Delete and make default, with a toast; a failure shows on the page |
| `server/account-api.ts` | Backend Area 1: change the profile; list, add, change, delete and make default an address |

### `features/layout/` — the page frames

The storefront header and the Vendor and Admin frame with their menus (Document 5, section 5; Document 6, 7.3). It shows
`auth`'s session and `cart`'s count through their public hooks and decides nothing: who may use which admin screen is
`auth`'s rule (`features/auth/staff-screens.ts`).

| File | What it does |
| --- | --- |
| `components/site-header.tsx` | The storefront header (Document 6, 7.3): wordmark, search box, language switch, "Log in" or the account, the cart, and the row of top-level categories with products; on compact screens the menu, and the search box on its own row. It reads the category tree through `product-list`'s server call |
| `components/site-menu.tsx` | The compact menu: a native disclosure (no script) with the language switch and the categories |
| `components/site-footer.tsx` | The storefront footer: the wordmark and the language switch |
| `components/header-actions.tsx` | "Log in" or the account, and the cart with its count |
| `components/language-switch.tsx` | The other language's name with a globe icon; only draws |
| `components/wordmark.tsx` | The Dhaaga wordmark, a link to the home page |
| `components/area-shell.tsx` | The Vendor and Admin frame: top bar (wordmark, area label, language, account), side menu, the areas' text |
| `components/area-nav.tsx` | The side menu, and the menu button with its drawer below 1024 px |
| `components/admin-home.tsx` | Admin home: links to the screens this person's roles can use |
| `hooks/use-layout.ts` | The call hook: `useRememberLanguage` |
| `hooks/use-language-switch.ts` | The switch: the other language, the same page in it, remember then go |
| `menus.ts` | `StaffArea`, and what each menu lists: `vendorNav`, `adminNav`, `adminScreenLinks` (server; reads `auth`'s rule) |
| `nav-items.ts` | `NavItem`, the icons by name and `isCurrentItem`; no Zod, for the browser menu |
| `header-link.ts` | The look of a header link, shared by the storefront header and the staff frame |

### `features/cart/` — the cart

Backend Area 5, the cart: the cart page and the add that waits for login (D2-02). It uses `auth`'s session; the
storefront's buy box uses its call hooks; the login endpoint asks it to run the pending add.

| File | What it does |
| --- | --- |
| `types.ts` | The cart view schema and the add's schemas, with their types. Brings Zod: browser code takes only its types |
| `rules.ts` | No Zod: `LineStatus`, `MAX_QUANTITY_PER_LINE`, `isUnbuyable`, `hasProblem`, so the cart page does not load Zod (Document 7, section 16) |
| `components/cart-screen.tsx` | The cart page: loading, error, empty, or the lines by seller with the summary and the coupon |
| `components/cart-line.tsx` | One line: photo, size and colour, price, its status in words, quantity, Remove |
| `components/cart-totals.tsx` | The summary, only the backend's totals |
| `components/coupon-form.tsx` | The coupon field and what the backend says about the code |
| `components/unavailable-banner.tsx` | The warning with "Remove unavailable items", which asks first |
| `hooks/use-cart.ts` | The call hooks: `useCart`, `useCartCount` (the header), `useAddToCart`, `useChangeQuantity`, `useRemoveLine`, `useRemoveUnavailable`, `useAddAfterLogin`; `cartKeys` |
| `hooks/use-cart-line.ts` | One line: change the quantity, remove it, its status and explanation, the error text |
| `hooks/use-coupon.ts` | The typed and the applied code, kept only in the page's memory; `couponNoteOf` |
| `hooks/use-unavailable-lines.ts` | Remove every line that can no longer be bought, and its error text |
| `server/cart-api.ts` | Backend Area 5, the cart: view, add, change, remove, remove unavailable |
| `server/cart-request.ts` | `couponCodeOf`: the coupon code an endpoint was asked to preview |
| `server/pending-add.ts` | The add that waits for login: `keepPendingAdd`, `decodePendingAdd`, `runPendingAdd`, `forgetPendingAdd` |

### `lib/`, `utils/`, `types/`

| File | What it does |
| --- | --- |
| `lib/config.ts` | Settings read from the environment (`.env.local`), server only |
| `lib/fonts.ts` | Outfit and Noto Sans Devanagari (the trimmed files in `src/fonts/`), from our own site, each loaded only for the characters it covers |
| `lib/http.ts` | Browser calls to our endpoints: `get`, `send`, `patch`, `put`, `remove` and `upload` (with progress and Cancel), with the time limit and the forgery label; every failure is an `AppError` |
| `lib/http-status.ts` | `HttpStatus` and the range checks (`isSuccess`, `isClientError`, `isServerError`) |
| `lib/server-log.ts` | `logServerEvent`: the only way our server writes a log, one plain-text line per event (Document 7, 20.10); `errorTypeOf` for an unexpected error's kind. Server only |
| `lib/uploads.ts` | Upload limits copied from the backend, for a quick check before sending |
| `lib/i18n.ts` | The two languages, choosing one, and `otherLocale` (the language the switch offers) |
| `lib/routes.ts` | Every page address, one helper per kind of page (`homePath`, `loginPath`, `categoryPath`, `productPath` with `productSlug`, `cartPath`, `myProductPath`, `adminVendorPath`, `samePageIn` for the language switch, …); no feature, server-only or Zod import, so `proxy.ts` can use it (Document 7, 20.2) |
| `lib/messages.ts` | `getMessages` for server pages; the shared text, the Vendor and Admin areas' own text, and the text only some pages carry (`store` on the shop's pages, `cart` on the cart page, `account` on the account pages) |
| `lib/messages-context.tsx` | `useMessages`: the page's text in the browser, only its language (area text only inside those areas, page-only text only on those pages) |
| `lib/add-notice.ts` | What happened to an "Add to cart" made before login: `AddOutcome`, `AddNotice`, `keepAddNotice` (login) and `takeAddNotice` (the page returned to). Shared so `auth` and `cart` never import each other; no Zod |
| `lib/errors.ts` | `AppError`, `toAppError`, and `messageFor`: our own message for any error |
| `lib/error-codes.ts` | `AppErrorCode` (codes not in the backend catalogue) and `ErrorCode`; re-exports `BackendErrorCode` (Document 7, 20.7) |
| `utils/format.ts` | Dates and times in IST, rupees, phone numbers, GST rates; `isSingular` for one-or-many messages |
| `utils/cn.ts` | The class-name helper the shadcn/ui tool expects |
| `utils/url.ts` | Addresses with their query (`withQuery`), page numbers, picking list filters |
| `utils/bounded-cache.ts` | A small in-memory cache with a life per entry and a limit on entries (the public list answers, Document 4, section 7) |
| `types/error.ts` | The backend's error answer |
| `types/common.ts` | Shapes every area shares: a page of a list, a reason |
| `types/react-query.d.ts` | Tells TanStack Query that every error is an `AppError` |
| `types/generated/` | Request types, the OpenAPI description, the list of backend calls by their listed names (`backend-calls.ts`, used for log lines), the error-code list and the `BackendErrorCode` enum, made by `npm run gen:types` and `gen:error-codes`; never edited |

### Outside `src/`

| Folder | What it holds |
| --- | --- |
| `scripts/` | `gen-types`, `gen-error-codes` (the code list and its enum), `check-messages` (also checks the enum) with `message-checks.ts`, what it checks, and copying files after a build |
| `.prettierrc.json`, `eslint.config.mjs` | Formatting (100-character lines) and lint; the files already following Document 7, section 20 are listed in the lint settings |
| `tests/unit/` | Fast tests of the helpers (Vitest) |
| `tests/e2e/` | Browser tests against the real backend (Playwright), one spec per feature; `support/` holds the shared steps (`login.ts`, `flows.ts`, `products.ts`: approved products with stock for the storefront and cart specs), `requests.ts` (`nextRequestBody`: what a click really sent) and `page-size.ts` (the first-load budget, Document 6, section 14); `fixtures/` holds the garment illustrations used as test photos |

## To change something, look here

| I want to… | Files |
| --- | --- |
| Change a text on screen | `messages/en.json` and `hi.json` (both). Text only the Vendor or Admin area uses goes in a section listed in `AREA_SECTIONS` (`lib/messages.ts`) |
| Change a colour, size or type style | `app/globals.css` (tokens) or the component in `components/ui/` |
| Change what a backend error says | `errors.codes` in the same two files |
| Change a form's checks | Its schema in `features/<feature>/types.ts` |
| Add a backend call | `features/<feature>/server/<feature>-api.ts`, with its answer shape in its types |
| Add an endpoint for the browser | `app/api/<area>/…/route.ts`, using `answerAsUser` or `fileAsUser` from `features/auth/server/answer-as-user.ts` when it acts as the person, and `middleware/` for the rest |
| Use it on a screen | A call hook in the feature's `hooks/use-<feature>.ts`, then the component in its `components/` |
| Change how backend calls behave (timeouts, retries) | `api/client.ts` |
| Change a cookie's lifetime | `middleware/cookies.ts` |
| Change who may open a page | The page's layout, using `requireUser` |
| Change where people go after login | `defaultDestination` in `features/auth/server/session.ts` |
| Log something on the server | Add a `ServerEvent` with its level in `lib/server-log.ts`, then call `logServerEvent` |
