# 7. Technical conventions

> **Status: Approved (9 Nov 2026).** The owner reviewed the decisions D7-01 to D7-10, every group of starting figures and sections 5 to 11, and approved the document as a whole on 9 Nov 2026. The starting figures in section 12 are **proposed and provisional**: nothing has been measured, and nothing here claims technical validation. D7-11 to D7-15 were approved on 10 Nov 2026. On 11 Nov 2026 the owner approved removing the frontend store and simplifying forgery protection: D7-13 changed, the refresh timings removed (section 17). The same day the owner chose a new folder layout (section 16). On 12 Nov 2026 the owner set the code practices in section 20 (D7-16) after reviewing the code and a pilot on the login feature; the folder layout and a few smaller points stay open (Q7-4 to Q7-9).
> Follows Documents 1 to 6. Documentation only; no code is written for this document.

## 1. Purpose

The technical rules the first build follows, so that Documents 1 to 6 can leave their numbers and tools to one place: request timeouts and retries, data freshness, generated request types, the sitemap, cache intervals, scripts, fonts, icons, accessibility testing and browser support. Backend facts are quoted from the backend documentation and are not changed here (D-14: no backend change).

## 2. Decisions

| ID | Decision | Status |
| --- | --- | --- |
| D7-01 | **API calls use request-specific timeouts.** Each kind of call has its own timeout (section 3). **Only safe reads are retried automatically** (Document 3, section 6). **Data-changing requests are never retried automatically.** Each kind of data has a freshness time suited to it (section 4) | Approved (9 Nov 2026) |
| D7-02 | **Request types are generated in TypeScript from the backend's OpenAPI description** (Document 3, section 4). The generated files are not edited by hand, and a check notices when the description changes (section 5) | Approved (9 Nov 2026) |
| D7-03 | **The sitemap is generated automatically from the approved indexable public routes** (D4-04). Nothing is listed by hand (section 6) | Approved (9 Nov 2026) |
| D7-04 | **Cache intervals and cookie lifetimes are defined from the backend's actual session lifetimes** (section 7) | Approved (9 Nov 2026) |
| D7-05 | **No third-party scripts and no tracking services in the first release** (section 8) | Approved (9 Nov 2026) |
| D7-06 | **Fonts:** Outfit for English and Noto Sans Devanagari for Hindi, loading only the weights Document 6 uses (D6-06) (section 9) | Approved (9 Nov 2026) |
| D7-07 | **Icons: Lucide, used consistently,** as in Document 6 (section 9) | Approved (9 Nov 2026) |
| D7-08 | **Accessibility testing is automated and manual:** keyboard, screen reader, contrast and focus checks. The target is WCAG 2.2 AA for the five core customer journeys (D-17, D5-09) (section 10) | Approved (9 Nov 2026) |
| D7-09 | **Browser support:** the current versions of Chrome, Safari, Firefox and Edge on Android, iPhone and desktop, with graceful fallbacks for older browsers (D-10 to D-13) (section 11) | Approved (9 Nov 2026) |
| D7-10 | **Keep failure handling simple.** Every request has a time limit so the site never waits forever. Only safe viewing requests retry automatically; saves never do. A timed-out **view** shows: "Something went wrong. Please try again." A timed-out **save** is never resent automatically, and shows: "We couldn't confirm your change. Please check before trying again." with the current data reloaded once (D3-03). **No other status-checking or recovery features are added** (section 3) | Approved (9 Nov 2026) |
| D7-11 | **Real-browser checks complete the automated tests.** The automated end-to-end tests are a regression safety net and do not by themselves show support for a browser. Before launch, the actual current Chrome, Safari, Firefox and Edge are checked by hand on real Android and iPhone devices and on desktop, for login, the five core customer journeys and the vendor product form. Each result is recorded. A browser and device is described as supported only where it was actually checked (section 11) | Approved (10 Nov 2026) |
| D7-12 | **Local HTTPS and cookie names.** The local site runs over HTTPS. Cookie names and the lifetimes Document 4 left open are fixed in section 17. The access cookie follows the backend token's actual expiry; the refresh cookie's 30 days is only the browser cookie's lifetime, and the backend alone decides whether the token is valid | Approved (10 Nov 2026) |
| D7-13 | **Forgery protection, the same before and after login:** the exact `Origin` check, our fixed request header and `SameSite=Lax` cookies. No token, no anti-forgery cookie and no backend change (section 17.3) | Approved (10 Nov 2026). Changed 11 Nov 2026 (owner approved): the signed token was removed |
| D7-14 | **Components come from the shadcn/ui tool** (D-03), added into `src/components/ui/` and styled with the Document 6 tokens to the approved Stage 4 look (section 18) | Approved (10 Nov 2026) |
| D7-15 | **Error messages are written slice by slice.** Each slice adds English and Hindi messages for the backend error codes its screens can show; by launch every code in the backend's catalogue has one (section 19) | Approved (10 Nov 2026) |
| D7-16 | **Code is written to be read, and every common job is done one way** (section 20): clear names, no raw comparisons, error codes as enums, screens that only draw, one form hook per form and one call hook per call, one way to submit, every browser failure an `AppError`, short lines, comments only where they explain why. Rolled out area by area after the login pilot | Agreed by the owner (12 Nov 2026) after reviewing the login pilot (pull request #36). Folder layout open (Q7-4) |

## 3. Timeouts (D7-01)

- Every backend call made by the API layer has a timeout. The timeout is chosen **per kind of call**, not one value for all.
- A timeout is an **unknown outcome** for a data-changing request. It is handled as Document 3, section 6 says: nothing is repeated automatically, the app reloads the affected data and reports what it sees.
- A refresh-token call is a special case (Document 4, section 9): a timeout there counts as an unknown outcome and never clears cookies (D2-05).
- **Messages (D7-10):** a view that times out says "Something went wrong. Please try again." A save that times out says "We couldn't confirm your change. Please check before trying again." and the affected data is reloaded once. Nothing else is added: no background status checks and no recovery screens. Both messages exist in English and Hindi in the message catalogue (Document 4, section 6).
- The starting values are in section 12.

## 4. Retries and data freshness (D7-01)

- **Retried automatically:** safe reads only, after a network failure, a gateway or server error, or "too many requests" (after the wait the backend gives), as Document 3, section 6 says. A small number of attempts with growing pauses. The pauses include a random spread so many browsers do not retry together.
- **Never retried automatically:** every request that changes data, including when the outcome is unknown.
- **Freshness** is set per kind of data (Document 3, section 9):
  - Prices, stock and the cart: always refetched when they matter (opening the cart, before a step that depends on them). Freshness time zero for those steps.
  - Catalogue and lists: a short freshness time, so going back to a list does not refetch at once.
  - Rarely changing public data (category tree, brands): a longer time.
  - Vendor and admin lists: short, and refetched after any change made by the same person.
- The starting values are in section 12.

## 5. Generated request types (D7-02, settles Q3-3)

- **Source:** the backend's OpenAPI description. It is switched off in production (Document 3, section 4), so the types are generated from the description of a **development or staging copy** of the backend that matches what is deployed.
- **Output:** TypeScript request types in a generated folder, never edited by hand.
- **Noticing a change:** the generation is run again by an automated check, and any difference from the stored output is reported for review before it is accepted. This is how a backend change is noticed.
- Response shapes stay checked by Zod schemas (Document 3, section 4). Generated request types do not replace them.
- **Not yet verified:** which staging address supplies the description, and whether its output matches the production backend. This is checked in the first build (section 13).

## 6. Sitemap (D7-03, settles Q4-3)

- Built **automatically** from the pages marked Indexed in Document 4, section 5 (D4-04, D5-07), in both languages: home, category, brand and product pages, with the products, categories and brands read from the backend's public lists.
- Every other page (login, cart, account, Vendor area, Admin area, search, filter and sort combinations, extra "Load more" addresses) is never listed.
- It is rebuilt on a schedule and when the catalogue changes enough to matter. For a large catalogue it is split into several files with an index file, as the sitemap format requires. Its refresh interval is in section 12.
- **Not yet verified:** the catalogue size at which splitting starts, and how many products the backend's list can return per page for the build. Checked in the first build.

## 7. Cache intervals and cookie lifetimes (D7-04, settles Q4-4 in approach)

**Backend lifetimes used** (`docs/api/reference/area-1-accounts.md`, section 1, and the backend code constants): the access token lasts **24 hours** for everyone; a refresh token lasts **30 days**, or **12 hours for staff**.

| Item | Rule |
| --- | --- |
| Cookie holding the access token | Never lives longer than the access token's 24 hours |
| Cookie holding the refresh token | Never lives longer than the refresh token's lifetime for that account: 30 days for customers, 12 hours for staff (the longer figure is the upper limit for a single cookie rule; the backend decides the real expiry and rejects anything past it) |
| Cached public pages (home, category, brand, product) | A short interval, refreshed in the background. **New arrivals shares the home page's interval** and holds public catalogue data only (D4-09) |
| Search results and suggestions | Shorter than pages; suggestions shorter again; the cache is bounded in size (Document 4, section 7) |

A cookie that outlives its backend token is harmless, because the backend rejects the token. A cookie must not be shorter than needed for refresh to work. Numeric intervals for pages and search are in section 12.

## 8. Scripts and tracking (D7-05, settles Q-2 for the first release)

- **No third-party scripts and no tracking or analytics services** are loaded in the first release. This includes advertising pixels, tag managers, and third-party error-monitoring scripts.
- Only code from our own site is loaded. This also keeps the 300 KB first-load budget (Document 6, section 14) in our control.
- Errors are recorded on our own frontend server in its own logs, with the request id (Document 3, section 5) and no personal data in the text.
- Adding any analytics or monitoring later is a new decision by the owner, with a review of consent and privacy duties. Nothing here approves or plans one.

## 9. Fonts and icons (D7-06, D7-07)

- **How (Slice 1, 11 Nov 2026):** the font files come from the `@fontsource/outfit` and `@fontsource/noto-sans-devanagari` packages and are served from our own site through Next.js's local font loader (`src/lib/fonts.ts`). Each file declares its character range. Outfit Latin shows a size-matched fallback until it arrives; it is not preloaded, because Firefox downloaded preloaded fonts twice. Outfit's extended Latin (it holds the rupee sign) and Noto Sans Devanagari are fetched only when a page shows such characters. That is how D6-21 (second script only when needed) is met.
- **Fonts:** Outfit (Latin text and all numbers) and Noto Sans Devanagari (Hindi). Only the weights Document 6 uses are loaded: Outfit 400, 500, 600 and Noto Sans Devanagari 400, 500 (D6-06). Only the character ranges each page needs are loaded (Latin, and Devanagari when the language is Hindi). The fonts are served from our own site, not a third party. The 150 KB font budget (Document 6, section 14) stays provisional.
- **Icons:** Lucide only, as inline vector icons imported one by one so that unused icons are not shipped. One stroke width and one size scale (Document 6, section 6). No second icon set and no icon fonts.

## 10. Accessibility testing (D7-08)

- **Target:** WCAG 2.2 AA for the five core customer journeys in Document 5, section 11 (journeys 1 to 5). Journey 6 (vendor) is an additional aim (D5-09).
- **Automated:** an accessibility checker runs in the end-to-end tests on every screen of those journeys, and a lint rule runs on the code.
- **Manual, before release of those journeys:** keyboard-only use of every journey; screen reader use of every journey (at least one on Android and one on iPhone, and one on desktop); contrast checked on real combinations (D6-50); focus order and visible focus; zoom to 200 % and text spacing changes; reduced motion.
- A failure found in testing is recorded and fixed or accepted by the owner. No result is claimed before testing is done.

## 11. Browser support (D7-09)

- **Supported and tested:** the current stable versions of Chrome, Safari, Firefox and Edge on Android, iPhone and desktop. "Current" means the latest stable release at the time of testing.
- **Older browsers:** not deliberately blocked. Basic browsing works almost everywhere; if a browser cannot run the interactive features, the site shows a clear message and a basic fallback instead of a blank page (D-12).
- The browser list for the build tool's compatibility settings is set from this decision. The exact minimum versions are not decided here and are not claimed.
- The automated end-to-end tests run on Chromium, WebKit and Firefox at a phone size and a desktop size, and on installed Google Chrome and Microsoft Edge where available. They catch regressions. **WebKit in the test tool is not Safari itself**, so these tests are not evidence of Safari support (D7-11).
- **Manual real-browser checks** are done in Slice 6 on the real browsers and devices (D7-11). Which devices are used is open (Q7-3).

## 12. Starting figures (provisional, not validated)

**Review progress (9 Nov 2026):** all groups of starting figures (timeouts and retries, freshness, cache, search, sitemap, refresh result) have been reviewed and are kept by the owner as starting points. They remain provisional and unvalidated (T7-1).

These are **proposals** so the first build has numbers to start from. They are not approved facts, and none has been measured. Each is checked against the real backend and the budget-device and slow-connection profiles of Document 6, section 14, and changed there if needed.

| Item | Starting value (provisional) |
| --- | --- |
| Timeout: normal read (lists, product, search) | 8 s (kept by the owner as a starting point, 9 Nov 2026) |
| Timeout: write (cart, address, product edit) | 10 s (kept by the owner as a starting point, 9 Nov 2026) |
| Timeout: file upload | 60 s (kept by the owner as a starting point, 9 Nov 2026) |
| Timeout: login-code request and verify | 10 s (kept by the owner as a starting point, 9 Nov 2026) |
| Timeout: refresh-token call | 8 s (kept by the owner as a starting point, 9 Nov 2026) |
| Read retries | Up to 2 retries, pauses about 0.5 s then 1.5 s, with a random spread. A "too many requests" answer waits the time the backend gives (kept by the owner as a starting point, 9 Nov 2026) |
| Freshness: catalogue and lists | 60 s (kept by the owner as a starting point, 9 Nov 2026) |
| Freshness: category tree and brands | 10 min (kept by the owner as a starting point, 9 Nov 2026) |
| Freshness: vendor and admin lists | 30 s (kept by the owner as a starting point, 9 Nov 2026) |
| Freshness: cart, prices, stock | 0 s at the steps that depend on them (approved rule, Document 3, section 9) |
| Cached public pages | 60 s to 5 min, with background refresh (kept by the owner as a starting point, 9 Nov 2026) |
| Search results | 30 s; suggestions 10 s; at most a few thousand entries (kept by the owner as a starting point, 9 Nov 2026) |
| Sitemap | Rebuilt about daily (kept by the owner as a starting point, 9 Nov 2026) |

## 13. Open checks (not validated, nothing invented)

| # | Check | When |
| --- | --- | --- |
| T7-1 | Every figure in section 12 against the real backend and the agreed budget-device and slow-connection profiles | First working build |
| T7-2 | Document 6 performance figures (LCP, INP, CLS, 300 KB, 150 KB, 100 KB per area). **First measurement (11 Nov 2026, Slice 1, transferred, empty cache):** English home 225 KB and English login 273 KB, both within 300 KB; plus 53 KB for the Hindi font on English pages, loaded on demand because the language switch shows "हिन्दी" (Document 6, 5.4: not counted in the total, how to count it is open). Hindi home 278 KB, within. **Hindi login 375 KB, over the 300 KB** (Document 6, section 14, item 3: fonts take 146 KB on Hindi pages, the login page's scripts about 220 KB). Owner decision needed; the end-to-end test reports this page without judging it until then. **Slice 2a (12 Nov 2026):** the build's chunk setting was changed (`next.config.ts`, `turbopackChunking.minChunkSize` 10,000) after the default sent the shared button code three times on the login page; with the new message text English login is 288 KB, English home 223 KB, Hindi home 276 KB, Hindi login 391 KB. **Slice 2d (12 Nov 2026):** the browser now gets only its page's language, and the Vendor and Admin areas' own text only inside those areas (`lib/messages.ts`), so storefront pages do not grow with area screens. English login 296 KB, English home 229 KB, English category page 294 KB, Hindi home 283 KB, Hindi login 399 KB (still the open owner decision). **Code-style pilot (12 Nov 2026):** the named error codes (section 20.7) travel to the browser as a list of 120 codes, about 3 KB on every page: English home 232 KB, English login 298 KB (close to 300), Hindi home 286 KB, Hindi login 402 KB. The add-to-cart outcome is kept in its own file without Zod (`types/add-notice.ts`), because importing it from `types/cart.ts` put Zod (32 KB) on every page | First working build; Hindi login open; English login close to the limit |
| T7-3 | OpenAPI source: which staging address, and whether it matches production (section 5) | First build |
| T7-4 | **Request ID (Document 5, V5-5): confirmed 11 Nov 2026.** Our server endpoints include the backend's `requestId` in the error response they send to the browser; an end-to-end test checks it. Errors our server decides by itself carry none, so no made-up number is ever shown (D5-14) | Done |
| T7-5 | Sitemap size and splitting (section 6) | First build |
| T7-6 | Keyboard, screen reader, contrast and focus tests (section 10) | Before release of journeys 1 to 5 |
| T7-7 | Real vendor photos in the 4:5 complete-photo frames (Document 6, D6-33, D6-62). No real photos exist yet; the design stages used generated garment illustrations. Checked when real photos are available | First build or first real vendor uploads |
| T7-8 | How the hero product choice is stored (Document 6, D6-61) | Before the hero is built |
| T7-9 | Real-browser and real-device checks (D7-11): login, journeys 1 to 5 and the vendor product form. Results recorded | Slice 6 |

## 14. Open questions

| # | Question | Settled in |
| --- | --- | --- |
| Q7-1 | Exact minimum browser versions for the build tool's compatibility settings | First build, with the owner |
| Q7-2 | Whether an error-monitoring service is wanted after the first release | Owner, later |
| Q7-3 | Which real devices and browser versions are used for the manual checks (D7-11). Document 6 names a budget Android phone and slow-connection profile, but no specific devices | Owner, before Slice 6 |
| Q7-4 | Folder layout: keep folders by kind of code (section 16), or move to folders by feature (`src/features/<feature>/`, with `src/shared/` for shared code; section 20.2) | Owner, before the clean-up goes past login |
| Q7-5 | Rename the address placeholder `[lang]` to `[language]`? Addresses do not change either way (section 20.2) | Owner |
| Q7-6 | Do comparisons with a JavaScript type name (`typeof value === 'string'`) also get a named value (section 20.6)? | Owner |
| Q7-7 | The English login page is 298 KB, close to the provisional 300 KB; the Hindi login page is 402 KB, over it (T7-2) | Owner |
| Q7-8 | Does the code clean-up (section 20.11) finish before Slice 3 starts, or run alongside it? | Owner |
| Q7-9 | Logging in our endpoints: the logout route writes `console.warn(JSON.stringify(...))` by hand. The existing logging is to be looked at first and a proposal brought to the owner before it changes (section 20.11) | With the logout clean-up |

## 15. Revision history

| Version | Date | Change |
| --- | --- | --- |
| 1 | 9 Nov 2026 | First draft: D7-01 to D7-09 approved; starting figures proposed; checks listed |
| 2 | 9 Nov 2026 | Marked Approved by mistake and corrected back to Draft: the owner has not reviewed the document as a whole |
| 3 | 9 Nov 2026 | D7-10 added: keep failure handling simple, with the two messages for a timed-out view and a timed-out save |
| 4 | 9 Nov 2026 | Freshness figures kept by the owner as provisional starting points |
| 5 | 9 Nov 2026 | Cache figures (public pages, search, sitemap, refresh result) kept by the owner as provisional starting points |
| 6 | 9 Nov 2026 | Timeout and retry figures kept by the owner as provisional starting points. All starting figures now reviewed |
| 7 | 9 Nov 2026 | Approved by the owner after review of the decisions, the figures and sections 5 to 11. Figures stay provisional; checks T7-1 to T7-8 and questions Q7-1, Q7-2 stay open |
| 8 | 10 Nov 2026 | D7-11 added: real-browser checks complete the automated tests; section 11 says WebKit in the test tool is not Safari; T7-9 and Q7-3 added. No other decision changed |
| 9 | 10 Nov 2026 | Section 16 added: the folder and file names used from Slice 0, as the owner approved (the layout in the implementation plan, section 1.2). Settles the message-catalogue location left by Document 4, section 6. Cookie names are added in Slice 1. No decision changed |
| 10 | 10 Nov 2026 | D7-12 to D7-15 and sections 17 to 19 added: local HTTPS, cookie names and lifetimes, refresh timings (provisional), anti-forgery before login, components through the shadcn/ui tool, error messages slice by slice. Settles the open points left by Document 4, section 9. No earlier decision changed |
| 11 | 10 Nov 2026 | Section 17.1: the certificate is set up by `npm run dev` itself; local setup with Node.js and the store's own database in the backend's PostgreSQL. No decision changed |
| 12 | 11 Nov 2026 | Owner approved: the frontend store is removed (Document 4, D4-11), so the refresh timings (old 17.3), the marker and result lifetimes (section 7), the stored-result figure (section 12) and the store folders (section 16) are gone. D7-13 changed to the Origin check plus a fixed header; old 17.4 is now 17.3 |
| 13 | 11 Nov 2026 | Section 16: the owner chose folders by kind of code (`app`, `components`, `hooks`, `api`, `middleware`, `lib`, `utils`, `types`), with the same area name in each. No decision changed |
| 14 | 11 Nov 2026 | Slice 1 part 2: how the fonts are loaded (section 9); first page-size measurements recorded in T7-2, with the Hindi login page over the provisional 300 KB for the owner to decide |
| 15 | 12 Nov 2026 | Slice 2a: the build's chunk setting and new page-size measurements in T7-2. No decision changed |
| 16 | 12 Nov 2026 | Slice 2d: page sizes in T7-2 after sending each page only its language's text. No decision changed |
| 17 | 12 Nov 2026 | D7-16 and section 20 added: the code-style rules the owner asked for after reviewing the code, with the owner's choices (two error-code enums, 100-character lines, storefront addresses renamed). No earlier decision changed; the address change to D4-02 is made with the storefront clean-up |
| 18 | 12 Nov 2026 | Page sizes after the pilot in T7-2. Section 20 after the owner's review of the login pilot: named values instead of raw comparisons (20.5); screens only draw, form hooks do the work, one `Form` component, `handleSubmit(onValid, onInvalid)` with `mutate` callbacks, every browser failure an `AppError` (20.6). No earlier decision changed |
| 19 | 12 Nov 2026 | Section 20 rewritten with every practice the owner agreed on 12 Nov 2026: names, folders and addresses, imports and exports, shared and feature code, formatting, comments, error codes, named values, forms and calls, what we do not copy, how work is done, and the rollout. D7-16 agreed; Q7-4 to Q7-9 added. Section 17.1: trusting the local certificate when the frontend runs in WSL. No other decision changed |

## 16. Names: folders and files

Recorded 10 Nov 2026; **layout changed by the owner on 11 Nov 2026** to folders by kind of code, which is easier to recognise. Document 4 left the exact folder and file names, and the message catalogue's location, to this document.

| Folder | What goes in it |
| --- | --- |
| `src/app/` | Routing and layouts. Pages under the language prefix in `src/app/[lang]/` (D4-01); our own endpoints for the browser in `src/app/api/` (addresses `/api/...`, Document 4, section 3). Next.js fixes these names |
| `src/proxy.ts` | The page middleware: the language redirect for visits with no prefix (Document 4, section 6) and keeping the after-login page. Next.js fixes this file name |
| `src/components/` | Reusable UI: `ui/` for the shadcn/ui components (D7-14), `form/` (with `Form`, section 20.9), `common/`, and one subfolder per area for its screens (`auth/`, later `cart/`, `catalogue/`, `vendor/`, `admin/`) |
| `src/hooks/` | Reusable logic: the call hooks of each area (TanStack Query, D-02) in `use-<area>.ts`, a form's logic in `use-<area>-form.ts` (section 20.9), and the shared form hook (D-04) |
| `src/api/` | Backend handlers, **server only**: the one place that calls the backend (Document 3): `client.ts` and one file per backend area. Not to be confused with `src/app/api/`, our own endpoints |
| `src/middleware/` | Login and request handling, **server only**: running a call as the person and renewing the login (Document 4, section 9), cookies, the answers of our endpoints and the forgery check (section 17.3) |
| `src/lib/` | Configs and integrations: settings read from the environment, the browser's call helper, languages and the message catalogue, errors |
| `src/utils/` | Helper functions: money, dates and phone numbers, the class-name helper, the lists the message check uses |
| `src/types/` | TypeScript types and the Zod schemas they come from, one file per backend area (Document 3, D3-01), forms included |
| `src/types/generated/` | Generated request types, the stored OpenAPI description and the error-code list, never edited by hand (D7-02) |
| `src/messages/` | **Message catalogue** (Document 4, section 6): `en.json` and `hi.json`, the same keys in both |
| `scripts/` | Commands (type generation, checks) |
| `tests/unit/`, `tests/e2e/` | Tests |

- **The same area name is used in every folder** (`components/cart/`, `hooks/use-cart.ts`, `api/cart.ts`, `types/cart.ts`), so everything about one area is easy to find.
- **`src/api/` and `src/middleware/` are server only.** The files that call the backend or handle tokens are marked so the build fails if code for the browser imports them, so login tokens never reach the browser. `middleware/cookies.ts` is also used by `src/proxy.ts`, so it is not marked; it holds only cookie names and settings and the signing of the short-lived cookies.
- A folder is created when its first file is written. A plain guide to every file is in `docs/code-map.md`.
- How names, imports and shared code are handled is in section 20 (20.2 to 20.4). Whether this layout changes to folders by feature is open (Q7-4).

## 17. Local HTTPS and cookies (D7-12, D7-13)

Recorded 10 Nov 2026. Document 4 (section 9) left the local Secure-cookie setup, the cookie names and some lifetimes to this document. The owner chose local HTTPS on 10 Nov 2026.

### 17.1 Local HTTPS

- The local site runs at **`https://localhost:3001`**, so the `__Host-` cookie rules (D4-07) work locally the same way in every browser, including Safari.
- `npm run dev` uses Next.js's built-in development HTTPS. The first time, Next.js downloads `mkcert` and makes a locally trusted certificate by itself; the computer may ask for its password once. The certificate files are never committed.
- **Local setup:** the frontend runs with Node.js, not in Docker, and needs only the backend running. It has no database of its own.
- **Windows with WSL:** when `npm run dev` runs inside WSL and the browser runs on Windows, the certificate authority mkcert made lives in WSL (`~/.local/share/mkcert/rootCA.pem`), so Windows does not trust it. Copy only `rootCA.pem` (never `rootCA-key.pem`) to Windows and import it once into **Current User → Trusted Root Certification Authorities** (`certmgr.msc` → Import, file type "All Files"; or `certutil -user -addstore Root <file>`), then restart the browser. Firefox also needs `security.enterprise_roots.enabled`. It stays trusted until the certificate authority in WSL is deleted.
- In staging and production, the host provides HTTPS. The app itself does not handle certificates.
- `PUBLIC_SITE_URL` is `https://localhost:3001` locally. The origin check (Document 2, section 6) compares data-changing requests with it.

### 17.2 Cookie names and lifetimes

Every cookie uses the `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax`, path `/` and no domain (D4-07).

| Cookie | Name | Lifetime |
| --- | --- | --- |
| Access token | `__Host-dhaaga_at` | Follows the backend token's actual expiry (the `expiresIn` it sends). Today that is 24 hours; if the backend changes it, the cookie follows |
| Refresh token | `__Host-dhaaga_rt` | 30 days is only the browser cookie's lifetime (D7-04 upper limit). The backend alone decides whether the refresh token is still valid, including ending staff tokens after 12 hours. A cookie that outlives its token is harmless: the backend rejects the token and the person logs in again |
| Pending add to cart | `__Host-dhaaga_pa` | 15 minutes, signed |
| After-login page | `__Host-dhaaga_next` | 15 minutes, signed |
| Language | `__Host-dhaaga_lang` | 1 year |

### 17.3 Forgery protection (D7-13)

- Every data-changing request to our `/api/...` endpoints must have an `Origin` header exactly equal to `PUBLIC_SITE_URL`, and must carry the header `X-Dhaaga-CSRF: 1`. Anything else is refused before any work is done.
- Why this is enough: a page on another site cannot send that header to us. The browser asks our server first, and our server never allows other sites. A plain HTML form cannot add headers at all. `SameSite=Lax` also keeps our cookies off requests that other sites start.
- The same rule applies before and after login. There is no token, no anti-forgery cookie, no secret for it and no backend change.
- Read-only requests do not need it and must never change data (Document 2, section 6).

## 18. Components: shadcn/ui (D7-14)

- D-03 (Tailwind CSS with shadcn/ui) is unchanged. This section records how it is used.
- Components are added with the shadcn/ui tool, which copies their source code into **`src/components/ui/`**. From then on they are our own code.
- Each one is styled with the Document 6 tokens to match the approved Stage 4 component page. Components built from them for this app live in `src/components/`.
- Components are not taken from any other library or source.
- The tool downloads from `ui.shadcn.com`, so that site must be reachable from wherever components are added.

## 19. Error messages by slice (D7-15)

- Each slice writes English and Hindi messages for the backend error codes its screens can show, in the message catalogue (Document 4, section 6). Slice 1 writes the login, session and general messages.
- The check of Document 3, section 5 fails when a built screen can show a code that has no message. By launch (Slice 6) it covers every code in the backend's error catalogue (`docs/api/api-contract.md`, section 11).
- Unknown codes always fall back to a general message chosen by the kind of failure (Document 3, section 5).
- Hindi messages are drafts until reviewed by someone who writes Hindi (Document 8, section 6).

## 20. Code practices (D7-16)

Agreed by the owner on 12 Nov 2026, after a review of the code, a reference project the owner shared, and a pilot on the login feature (pull request #36). The goal: someone new can open a file, see what it is for, follow the calls and know what each name holds without guessing. Code is written for people to read, not only for the compiler. These practices change how code is written, never what it does: no behaviour, backend contract or feature changes come from them.

### 20.1 Names

- **Variables, functions, parameters, callbacks and state:** camelCase full words. No single letters or unclear short names (`t`, `n`, `raw`, `c`, `p`), including callback parameters: `sellers.map((seller) => …)`, not `(s) => …`. A longer name is fine when it is clearer.
- **Functions say what they do:** a verb and its object, such as `sendCode`, `verifyCode`, `resendCode`, `removeUnavailableLines`, `showSendCodeError`. Handlers are named for what they do, not `onPhone`.
- **Components** are PascalCase and named for what they show (`LoginForm`, `PhoneStep`, `CodeStep`).
- **The page's text** is `messages` (from `useMessages()` or `getMessages()`), never `t`.
- **In a catch** (only where section 20.9 allows one), the caught value is `caughtError`.
- **Constants** are UPPER_SNAKE_CASE when they are fixed values (`FIELD_IDS`, `MILLISECONDS_PER_SECOND`); enums and their members are PascalCase (`HttpStatus.TooManyRequests`).

### 20.2 Folders, files and addresses

- **Folders and files:** kebab-case, named for what they hold, so a developer knows what is inside without opening it. No one- or two-letter names. A component file exports the same name in PascalCase (`login-form.tsx` exports `LoginForm`).
- **Hook files:** `use-<area>.ts` holds the call hooks of an area (one per API call); `use-<area>-form.ts` holds a form's logic.
- **Inside `src/app/` a folder name is the web address** (Next.js). The names Next.js fixes stay as they are: `page.tsx`, `layout.tsx`, `route.ts`, a placeholder in square brackets for a changing part (`[lang]`, `[slug]`, `[id]`), `[[...name]]` for an optional part, and `(app)` for a group that shares a layout or guard but is not in the address.
- **Address words are full words.** The storefront's `c`, `b` and `p` become **`category`**, **`brand`** and **`product`** (`/en/category/kurtas`, `/en/product/<id>/<name>`), as the owner chose on 12 Nov 2026 (Document 4, D4-02 and section 5). This is done in the storefront clean-up; `brand` is not built yet.
- **Pages in `src/app/` are thin:** they read the address values, check the language, and render the area's screen. The work lives outside `src/app/`.
- **Layout today:** folders by kind of code, with the same area name in each (section 16). Whether to move to folders by feature is open (Q7-4):

```
src/features/<feature>/components/   the screens
src/features/<feature>/hooks/        use-<feature>.ts, use-<feature>-form.ts
src/features/<feature>/server/       backend calls, server only
src/features/<feature>/types.ts      schemas and types
src/shared/                          components/ui, components/form, lib, utils
```

### 20.3 Imports and exports

- **Named exports only.** Default exports only where Next.js requires them (pages, layouts).
- **`@/` for anything outside the file's own folder; `./` only for a file in the same folder.** Never `../../`.
- **Order:** packages, then shared code, then the area's own files, then files in the same folder. `import type` for anything used only as a type.
- **No index files that re-export a folder.** They hide where code lives and can pull more code into a page than it needs. Import the file itself.
- **Server-only files** (`src/api/`, `src/middleware/` except `cookies.ts`) start with `import 'server-only'`, so the build fails if browser code imports them.
- **A `'use client'` file never exports a constant or enum that server code needs.** Those go in a plain file. Server code importing one has crashed a page before.
- **Heavy libraries stay where they are needed.** A file every page loads (the header, the session) never imports a file that brings Zod. `types/add-notice.ts` is kept apart from `types/cart.ts` for this reason: importing it from there put Zod (32 KB) on every page.

### 20.4 Shared code and area code

- **Code starts in its area.** It moves to shared code only when a second area really needs it.
- **Shared code:** `components/ui/` (shadcn/ui), `components/form/` (`Form`, fields, the error summary), `components/common/`, `lib/`, `utils/` and `types/common.ts`.
- **`lib/` and `utils/`:** `lib/` is code that knows the app (calls to our server, errors and error codes, HTTP statuses, languages, messages). `utils/` is plain functions with no app knowledge (formatting, addresses, class names).
- **An area does not reach into another area's files.** If two areas need the same thing, it moves to shared code. Known case to fix in the clean-up: the login form hook uses `keepAddNotice` from the cart hook.
- **The browser only calls our server, and only `src/api/` calls the backend** (D3-03).

### 20.5 Layout and formatting

- **Prettier** formats the code: single quotes, trailing commas, **lines up to 100 characters** (`.prettierrc.json`, `npm run format`). Markdown files are not formatted by Prettier, so the documents keep their own layout.
- Prettier does not wrap comments; comments are kept within 100 characters by hand. A long text string may run longer when breaking it would make it harder to read.
- **No nested `? :` chains in JSX.** A screen with several states (loading, error, empty, content) returns early for each, or uses one small named component per state.
- **One expression does one thing.** A long condition gets a named variable (`const mustWaitToResend = …`); a long call gets its own lines.
- **Spacing:** a blank line between the steps of a function, so its flow reads top to bottom.
- **Files are sized by responsibility,** not kept small for its own sake. No tiny files, wrapper functions or new layers unless they remove real repetition.

### 20.6 Named values instead of raw comparisons

- **Code never compares with, or sets, a raw string or number.** The value gets a name first (an enum or a named constant), and the code uses the name: `sessionNotice === SessionNotice.Blocked`, `error.status === HttpStatus.TooManyRequests`, `fetchError.name === BrowserErrorName.Timeout`, `notice.outcome === AddOutcome.Added`; never `=== 'blocked'`, `=== 429` or `=== 'TimeoutError'`. This applies everywhere, not only in login.
- A string enum keeps the stored or sent value (`SessionNotice.Blocked = 'blocked'`), so nothing stored in the browser or sent to the backend changes.
- **Named values in use:** `HttpStatus` and the range checks `isSuccess`, `isClientError`, `isServerError` (`lib/http-status.ts`), with `HttpStatus.NoResponse` (0) for an error where no answer arrived; `ErrorKind` (`lib/errors.ts`); `SessionNotice` (`hooks/use-session.ts`); `AddOutcome` (`types/add-notice.ts`); `HttpMethod` and `BrowserErrorName` (`lib/http.ts`); `DEFAULT_LOCALE` (`lib/i18n.ts`); `isSingular(count)` (`utils/format.ts`) for "1 second" against "{seconds} seconds".
- Comparisons with a JavaScript type name (`typeof value === 'string'`) stay as they are until the owner decides (Q7-6).

### 20.7 Error codes

- **`BackendErrorCode`** (`src/types/generated/backend-error-codes.ts`) is generated from the backend's error catalogue together with `backend-error-codes.json` (`npm run gen:error-codes`). Its values are the backend's codes exactly; the names are the same words in PascalCase (`OTP_RESEND_WAIT` is `BackendErrorCode.OtpResendWait`). It is never edited by hand, and `npm run check:messages` fails if it differs from the stored catalogue.
- **`AppErrorCode`** (`src/lib/error-codes.ts`) holds the codes the frontend knows that are not in the backend's catalogue: the ones our code produces (a lost connection, a timeout, the forgery checks, a response that does not match, a cancelled upload, the general codes our endpoints use) and the two the backend's framework sends outside its catalogue (`NOT_FOUND`, `TOO_MANY_REQUESTS`). The check fails if one of them is ever a catalogue code.
- No backend code is renamed, given another meaning or invented. Message keys in `en.json` and `hi.json` stay the plain code strings.
- A code the frontend does not know (a newer backend) still reaches the screen and gets the general message for its kind (section 19); `ErrorCode` allows it.

### 20.8 Comments

- A comment explains **why**, or something the code cannot show (a backend rule, a browser quirk, a privacy reason). It does not repeat what the code says.
- Where a rule comes from a decision, the comment names it briefly, such as `(D2-02)`. File headers are a sentence or two, not a summary of the documents.
- No commented-out code, no `console.log` left behind.

### 20.9 Forms and calls from the browser

**Who does what.**

| Part | File | Its one job |
| --- | --- | --- |
| The screen | `components/<area>/…` | Draws fields and buttons and wires the submit. No call or error logic |
| `Form` | `components/form/form.tsx` | The `<form>` tag every form uses: always `method="post"`, the browser's own checks off. Posting means a tap before the scripts load never puts what was typed (a phone number, a code) in the address, where history and server logs keep it. A post to a page only shows the page again; nothing reads it |
| The form hook | `hooks/use-<area>-form.ts` | The form (`useAppForm` with its Zod schema), what happens on success and on each error, the error-summary focus, timers. Returns only what the screen needs |
| The call hook | `hooks/use-<area>.ts` | One TanStack Query hook per call, with its address, typed input and typed answer |
| `lib/http.ts` | | The only place the browser calls our server: our forgery header, a time limit, and **every failure becomes an `AppError`** |
| Our endpoint | `app/api/<area>/…/route.ts` | Checks the request is ours (`guardChange`) and complete, then calls `src/api/` |
| `src/api/` | `api/<area>.ts`, `api/client.ts` | The only place our server calls the backend; never retries a change; checks the answer's shape |

**How a submit runs** (the full login example is in `docs/code-map.md`).

1. The screen: `<Form onSubmit={form.handleSubmit(sendCode, showValidationErrors)}>`. React Hook Form's `handleSubmit` stops the browser's own submit and runs the Zod schema. It calls the first function with the checked values, or the second when a field is wrong.
2. The form hook's function calls the call hook: `requestLoginCode.mutate(phone, { onSuccess, onError })`. Both are named functions in the hook, so success and every error case are easy to find.
3. `onError` receives an `AppError`, already typed (`src/types/react-query.d.ts`), because `lib/http.ts` only ever rejects with one.
4. An error for a field goes under that field and the others go in the error summary (`applyServerError`); then focus moves to the summary (`useErrorSummaryFocus`). A failed field check moves focus there too.

**Rules.**

- **One way to submit:** `handleSubmit(onValid, onInvalid)` in the screen, `mutate` with `onSuccess` and `onError` in the form hook.
- **No `try`/`catch` and no `toAppError` in screens or form hooks.** `try`/`catch` is used only where a failure is a normal answer: our endpoints and `src/api/` (turning failures into answers), `lib/http.ts`, and reading browser storage.
- **A screen with a form never calls a call hook or `lib/http.ts` itself.** A small action without a form (a Remove button) may use the call hook directly.
- **A value that must survive a step change** belongs to the parent: the phone form is created in `LoginForm`, so the typed number is still there after "Change number".
- **Field checks** run when the person leaves a field and on submit (D6-25); they check only a missing value or a wrong shape, and the backend decides the rest.
- **Text in client components** comes from `useMessages()`. A component takes text as a prop only when a server page also uses it.
- **Request bodies are typed,** from the generated backend request types where the body passes through unchanged.
- **Hooks are kept when they have a real job:** `useMessages` (the page's text), `useSessionNotice` (the notice a session end leaves for the login page), the resend countdown, and `useErrorSummaryFocus` (the summary appears one render after the error is set, so it takes focus in its own effect when told to).

### 20.10 What we do not copy

From the reference project the owner shared on 12 Nov 2026, these are taken: descriptive names, short formatted lines, a screen that only draws with one hook doing the work, and `handleSubmit(onSubmit, onError)` wiring. These are **not** taken, because they conflict with approved decisions or cause problems:

- login tokens returned to the browser and kept in Redux or local storage (D4-07: tokens stay in cookies the browser's scripts cannot read);
- `any`, deep `../../../` imports, default exports everywhere, mixed file-name styles;
- hard-coded English text (both languages come from the message catalogue);
- the backend's error text shown in a toast (we show our own message for each code);
- commented-out code, `console.log` in error handlers, empty `if` branches, a separate loading flag next to the call's own `isPending`;
- passing state setters down to children (`setIsSubmitting`, `setStep`); a named callback such as `onCodeSent` is passed instead.

### 20.11 How work is done

1. **Review before changing.** Look at the existing code and its dependencies, explain what it does and why, and report findings and a plan before rewriting anything.
2. **A new pattern is tried on one feature first,** shown to the owner as code, and rolled out only after the owner agrees.
3. **Documents first, then code.** This document and `docs/code-map.md` are updated before or with the code they describe.
4. **Explain in plain words,** step by step: which file comes in when, and why.
5. **Behaviour is kept.** Anything a test does not cover (such as "Change number" keeping the typed number) is checked by reading the existing code. A fix found on the way is reported, never hidden.
6. **After every change:** types, lint, the message and enum checks, generated types, unit tests, every end-to-end test on desktop and phone, and the first-load page sizes (T7-2). A change that adds weight to every page is found and fixed, not accepted silently.
7. **Pull requests stay focused** on one area. Nothing is merged unless the owner says "merge". Commits and pull requests carry no assistant attribution lines.
8. **Logging** is looked at before it is changed (Q7-9): the existing logging is checked first and a proposal comes to the owner.

### 20.12 How it is rolled out

1. **Login** first (pull request #36), reviewed by the owner on 12 Nov 2026.
2. Then one pull request per area: **session and logout** (including the session middleware's outcome strings and the logout route's logging), **vendor application**, **admin catalogue**, **products and moderation**, **storefront and cart** (with the `category` and `product` addresses, D4-02 and the Document 4 route table updated first).
3. Files that follow these practices are listed in the lint settings (`eslint.config.mjs`), where one-letter names and nested ternaries are errors. When every area is done, the list becomes the whole of `src/`, and the format check (`npm run format:check`) joins CI.
4. If the owner chooses folders by feature (Q7-4), each area's pull request also moves that area into its folder.
