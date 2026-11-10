# 7. Technical conventions

> **Status: Approved (9 Nov 2026).** The owner reviewed the decisions D7-01 to D7-10, every group of starting figures and sections 5 to 11, and approved the document as a whole on 9 Nov 2026. The starting figures in section 12 are **proposed and provisional**: nothing has been measured, and nothing here claims technical validation. D7-11 was approved on 10 Nov 2026.
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
| Consumed-token markers (Document 4, section 9) | At least the longest refresh lifetime (30 days) plus a margin, and never evicted earlier |
| Short-lived refresh results and locks | A few seconds; locks a little longer than the refresh call's timeout (section 12) |
| Cached public pages (home, category, brand, product) | A short interval, refreshed in the background. **New arrivals shares the home page's interval** and holds public catalogue data only (D4-09) |
| Search results and suggestions | Shorter than pages; suggestions shorter again; the cache is bounded in size (Document 4, section 7) |

A cookie that outlives its backend token is harmless, because the backend rejects the token. A cookie must not be shorter than needed for refresh to work. Numeric intervals for pages and search are in section 12.

## 8. Scripts and tracking (D7-05, settles Q-2 for the first release)

- **No third-party scripts and no tracking or analytics services** are loaded in the first release. This includes advertising pixels, tag managers, and third-party error-monitoring scripts.
- Only code from our own site is loaded. This also keeps the 300 KB first-load budget (Document 6, section 14) in our control.
- Errors are recorded on our own frontend server in its own logs, with the request id (Document 3, section 5) and no personal data in the text.
- Adding any analytics or monitoring later is a new decision by the owner, with a review of consent and privacy duties. Nothing here approves or plans one.

## 9. Fonts and icons (D7-06, D7-07)

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
| Refresh result stored | About 10 s (kept by the owner as a starting point, 9 Nov 2026) |

## 13. Open checks (not validated, nothing invented)

| # | Check | When |
| --- | --- | --- |
| T7-1 | Every figure in section 12 against the real backend and the agreed budget-device and slow-connection profiles | First working build |
| T7-2 | Document 6 performance figures (LCP, INP, CLS, 300 KB, 150 KB, 100 KB per area) | First working build |
| T7-3 | OpenAPI source: which staging address, and whether it matches production (section 5) | First build |
| T7-4 | **Request ID (Document 5, V5-5):** frontend server endpoints include the backend's `requestId` in the error response they send to the browser, so it can be shown and copied. This is a frontend convention and needs no backend feature. It is confirmed only when the first build shows the id reaching the browser; the Copy button stays conditional until then (D5-14) | First build |
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

## 16. Names: folders and files

Recorded 10 Nov 2026. Document 4 left the exact folder and file names, and the message catalogue's location, to this document. The owner approved the layout in the implementation plan (section 1.2); these are the names used from Slice 0. **Cookie names** are added here in Slice 1, when the cookies are built.

| What | Where |
| --- | --- |
| Pages, all under the language prefix (D4-01) | `src/app/[lang]/` |
| Our own server endpoints for the browser: one reserved prefix with no language (Document 4, section 3) | `src/app/api/` (addresses `/api/...`) |
| Language redirect for visits with no prefix (Document 4, section 6) | `src/proxy.ts` |
| Screens and their flows, one folder per area | `src/features/storefront/`, `src/features/vendor/`, `src/features/admin/`, `src/features/auth/` |
| Shared components (Document 6, Stage 4) | `src/components/` |
| Server-only code: the one API layer, login and cookies, the shared store, settings | `src/server/api-layer/`, `src/server/auth/`, `src/server/store/`, `src/server/config.ts` |
| Response schemas, one folder per backend area (Document 3, D3-01) | `src/schemas/` |
| Generated request types and the stored OpenAPI description, never edited by hand (D7-02) | `src/generated/backend-api.d.ts`, `src/generated/backend-openapi.json` |
| **Message catalogue** (Document 4, section 6): one file per language, the same keys in both | `src/messages/en.json`, `src/messages/hi.json` |
| Shared helpers (language, messages; money, dates and phone numbers from Slice 1) | `src/lib/` |
| Shared store migrations (D4-10) | `store/migrations/` |
| Commands (type generation, checks, store tools) | `scripts/` |
| Tests: unit, store, end to end | `tests/unit/`, `tests/store/`, `tests/e2e/` |

Folders without content yet (`features`, `components`, `api-layer`, `auth`, `schemas`) are created when their first file is written.

