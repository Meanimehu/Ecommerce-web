# 7. Technical conventions

> **Status: Approved (9 Nov 2026).** The owner reviewed the decisions D7-01 to D7-10, every group of starting figures and sections 5 to 11, and approved the document as a whole on 9 Nov 2026. The starting figures in section 12 are **proposed and provisional**: nothing has been measured, and nothing here claims technical validation. D7-11 to D7-15 were approved on 10 Nov 2026. On 11 Nov 2026 the owner approved removing the frontend store and simplifying forgery protection: D7-13 changed, the refresh timings removed (section 17). The same day the owner chose a new folder layout (section 16). **Agreed by the owner on 12 Nov 2026:** the code practices in section 20 (D7-16), feature folders introduced one feature at a time with `auth` owning everything about the session and `layout` owning page frames (D7-17, section 16), plain-text logging through one helper (D7-18), and working slice by slice (D7-19). **13 Nov 2026:** the `auth` pilot is merged (pull request #39), with the logging details in pull request #40; the owner settled how the remaining rollout steps are done (20.13). The page-size question (Q7-7) stays open until the measurements in its row are reviewed.
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
| D7-16 | **Code is written to be read, and every common job is done one way** (section 20): clear names with a short list of exceptions, named values for anything the code branches on, stores or sends, error codes as enums, page addresses from one place, screens that only draw, one form hook per form and one call hook per call, one way to submit, every browser failure an `AppError`, short lines, comments only where they explain why | Agreed by the owner (12 Nov 2026), after the login pilot (pull request #36) |
| D7-17 | **Feature code lives in feature folders** (`src/features/<feature>/`); shared code stays in `components/ui`, `components/form`, `components/common`, `lib`, `utils`, `middleware`, `api/client.ts` and `types` (section 16). **`auth` owns everything about the session:** login, logout, reading, writing, clearing and renewing the login cookies, running a call as the person, the answer when a session fails, and page access. Other features use it only through its public helpers (20.4). **`layout` owns page frames, headers, navigation and page structure;** it may show `auth` and `cart` information but holds none of their logic. **Shared code depends on no feature and holds no business logic.** "Admin" is a role, not a feature. Features move one at a time, `auth` first as the pilot, each in a commit that only moves files | Agreed by the owner (12 Nov 2026). The owner reviews the `auth` pilot before other features move |
| D7-18 | **Server logs are plain text, one line per event, written only through `logServerEvent`** (section 20.10). Each event is named in `ServerEvent`, and the helper gives each event its level. `JSON.stringify` is not used for logging. The helper's types accept only our request id, error codes, backend call names, field names and named true/false flags; never personal data, tokens, cookies, headers or request and response bodies | Agreed by the owner (12 Nov 2026) |
| D7-19 | **Work goes slice by slice** (Document 8). Each slice is finished, cleaned up, tested and reviewed before the next one starts. Clean-up that a slice's work does not need is not mixed into that slice's pull requests. The code written in Slices 0 to 2 is brought to section 20 before Slice 3 starts; from Slice 3 on, code is written to section 20 from the start | Agreed by the owner (12 Nov 2026). Settles Q7-8 |
| D7-20 | **A group folder holds features that belong to one area of the site** (section 16, 20.4). `src/features/storefront/` is the first: it holds the parts of the shopping side (`product-list`, `product-page`, `search`, `home`) and no files of its own. Each part is a feature in its own right, with the usual folders and the same rules between features. One level only | Agreed by the owner (15 Nov 2026) |

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
- **The tests that need the backend in CI (owner, 14 Nov 2026; postponed by the owner, 15 Nov 2026).** Today CI starts no backend, so every test that logs in or loads real products is skipped there (200 of 344 on #48) and runs only locally, in Chromium. The plan below is **postponed until the whole application is built**; it is then done once, for all slices together. Nothing in it is dropped. The pull request that builds it (#54) stays open and is not merged until then.
  - **on every pull request:** Chromium desktop, Chromium phone and WebKit phone (Android Chrome, desktop Chrome, and Apple's browser engine);
  - **nightly and after each merge to `main`:** Firefox desktop and phone, WebKit desktop, installed Edge, and installed Chrome where needed.
  - The same end-to-end specs are used and grow with each feature; there is no separate test system. How CI starts the database (GitHub's service database, as the backend's CI does, or PostgreSQL installed on the runner) is decided then.
  - **What is needed to finish it:** a read-only deploy key on the backend repository and the secret `BACKEND_DEPLOY_KEY` on this repository (the backend repository is private; the agent's workspace cannot set these).
- **Testing status and what is postponed (owner, 15 Nov 2026).** The priority now is to complete the application.
  - **Done for every feature:** its end-to-end tests run against the real backend (real database, login code read from the backend's log) in Chromium, covering the whole request and response cycle: the request a click sends, the answer, and the page after a reload. Unit tests, the accessibility checker and the page-size budget run in CI on every pull request. The tests that need no backend run in CI in all eight browser configurations.
  - **Each new feature:** its spec is written with it and passes before the pull request is opened, and the specs of all earlier features are run again, so a new feature cannot quietly break an old one. The result is reported in the pull request.
  - **Postponed:** the backend tests in CI, and every browser other than Chromium against the backend (WebKit, Firefox, Edge, installed Chrome); the manual checks on real browsers and devices (above, Slice 6); Brotli sizes once a host is chosen; real-user INP (Q7-7). The real SMS, photo storage and virus scan are not tested either, because the tests use the mock SMS, photos kept in memory and no scanning.
  - **Revisited together** once the whole application is built, in one pass over all browsers and all slices.

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
| T7-2 | Document 6 performance figures (LCP, INP, CLS, 300 KB, 150 KB, 100 KB per area). **First measurement (11 Nov 2026, Slice 1, transferred, empty cache):** English home 225 KB and English login 273 KB, both within 300 KB; plus 53 KB for the Hindi font on English pages, loaded on demand because the language switch shows "हिन्दी" (Document 6, 5.4: not counted in the total, how to count it is open). Hindi home 278 KB, within. **Hindi login 375 KB, over the 300 KB** (Document 6, section 14, item 3: fonts take 146 KB on Hindi pages, the login page's scripts about 220 KB). Owner decision needed; the end-to-end test reports this page without judging it until then. **Slice 2a (12 Nov 2026):** the build's chunk setting was changed (`next.config.ts`, `turbopackChunking.minChunkSize` 10,000) after the default sent the shared button code three times on the login page; with the new message text English login is 288 KB, English home 223 KB, Hindi home 276 KB, Hindi login 391 KB. **Slice 2d (12 Nov 2026):** the browser now gets only its page's language, and the Vendor and Admin areas' own text only inside those areas (`lib/messages.ts`), so storefront pages do not grow with area screens. English login 296 KB, English home 229 KB, English category page 294 KB, Hindi home 283 KB, Hindi login 399 KB (still the open owner decision). **Verified 12 Nov 2026,** on the local production server (`next start`), each page measured three times with identical results: `main` gives English home 228.8 KB, English login 295.5 KB, Hindi home 283.0 KB, Hindi login 399.2 KB; the login pilot branch (pull request #36) gives 231.7, 298.2, 286.0 and 401.9 KB, the difference being its list of named error codes (about 3 KB on every page). The figures are the bytes transferred with **gzip**, which is what the local server sends (it sent gzip even when the browser also offered Brotli), plus about 10 KB of HTTP headers, with an empty cache and the fonts for the page language inside the total (Document 6, section 14). Measured on `main`: every page shares 174 KB of scripts (React and Next.js about 125 KB, the button `Slot` and class merging 14 KB, TanStack Query about 12 KB, the page's text 10 KB); the login page adds 52 KB (Zod 31 KB, React Hook Form with its Zod link 15 KB, the code that sends data 4 KB, the login screen 2 KB). **Caching, as checked in the response headers of the local production server:** scripts, styles and fonts are sent with `public, max-age=31536000, immutable`, so a browser may keep them for up to a year, and a visitor who reaches login from another page then needs only about 52 KB of login scripts plus the page; the page itself is sent with `private, no-store` and is downloaded on every visit. A browser can still drop its cache earlier, and the chosen host must send the same headers (D4-03, "full control of cache headers"), which is checked again on staging. **Brotli sizes have not been measured;** they are measured once a host is chosen (Q7-7) and recorded separately from these gzip figures. **14 Nov 2026 (pull request #49), under the split budget (Document 6, section 14):** the shop's text (`store`, about 0.8 KB compressed in English) and the cart's text (`cart`) are carried only by the category and product pages and by the cart page (`PAGE_SECTIONS` in `lib/messages.ts`), so the other pages, login among them, no longer carry them; with the trimmed Devanagari font, English home 230.1 KB, English login 297.4 KB, English category page 266.7 KB, English product page 265.0 KB; Hindi home 273.8 KB, Hindi login 381.1 KB (257.0 KB without fonts), Hindi category page 350.4 KB, Hindi product page 348.8 KB; the Hindi font loaded on demand on English pages 42.7 KB (was 52.7 KB). `tests/e2e/support/page-size.ts` checks each rule on home, login, a category page and a product page in both languages | First working build; Hindi login open; English login close to the limit; next measurements in Q7-7 |
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
| Q7-4 | Folder layout | **Settled 12 Nov 2026: D7-17** |
| Q7-5 | Rename `[lang]` to `[language]`? | **Settled 12 Nov 2026: no.** `[lang]` stays: it matches the HTML `lang` attribute and the language cookie; it is a listed naming exception (20.2) |
| Q7-6 | Named values for `typeof` checks? | **Settled 12 Nov 2026: no.** Native `typeof value === 'string'` stays: TypeScript already rejects a misspelt type name (20.6) |
| Q7-7 | Login page sizes: English 298 KB (close to the provisional 300 KB), Hindi 402 KB (over it; fonts alone are 144 KB). **Agreed measuring plan,** for the English and Hindi login pages, each on a first visit (empty cache) and a repeat visit (after the home page), measured first on an **emulated** budget Android phone and slow-network profile from Document 6, until Q7-3 names the real devices: (1) loading time, LCP; (2) responsiveness of a controlled interaction (the time from tapping "Send code" to the screen's next update, measured in the test browser); (3) real-user INP, only if a measuring tool is available (D7-05 allows no tracking service in the first release; error monitoring is Q7-2); (4) Brotli transfer sizes, once a host is selected (D4-03), recorded apart from the gzip figures in T7-2. **No library or font is removed, and the 300 KB budget is not changed, before the owner has reviewed the results** **Decided by the owner, 14 Nov 2026, after reviewing the results below:** a split budget for Hindi pages (258 KB without fonts in every language, fonts 150 KB per language) and a trimmed Devanagari font (Document 6, section 14), applied in pull request #49. **The emulated profile used** until Q7-3 names real devices (our choice, the same as the mobile test in Lighthouse): a phone screen of 412 × 823, the processor slowed 4 times, and a slow 4G network of 150 ms round trip, 1.6 Mbit/s down and 750 kbit/s up; and, as the slower case Document 6 asks for, the same phone on 400 ms, 400 kbit/s down and 400 kbit/s up. Items 1 and 2 are measured on `main` and with the trimmed font, in English and Hindi, on a first and a repeat visit; item 4 still waits for a host **Results (14 Nov 2026,** the local production server with gzip, each the middle of three runs; first visit / repeat visit after the home page; `main` → trimmed font**):** on slow 4G, English login 351.6 / 79.0 KB (the first visit includes the on-demand Hindi font for the "हिन्दी" link, Document 6, section 14, item 4) → 341.6 / 79.0 KB; Hindi login 402.7 / 130.1 KB → 382.9 / 120.4 KB. LCP 0.24 to 0.61 s on slow 4G and 0.49 to 1.65 s on the slower profile, the same with both fonts (within 50 ms, which is run-to-run noise), because the largest element is text, drawn at once in the fallback font. The tap on "Send code" (request held, so no code was sent) 56 to 72 ms in every case. What the font size changes is when the fonts and the rest have arrived: Hindi first visit on the slower profile, fonts 9.1 s → 8.3 s, everything 9.3 s → 8.9 s (English 8.2 s → 8.0 s). With the trimmed font, 577 Hindi lines (every Hindi message and a set of hard conjuncts, both weights) and ten page screenshots (Hindi home, login, category and product, English home, at phone and desktop width) are pixel for pixel the same as with the full font. These are emulated figures on a cloud machine, not a real phone. **Still open:** Brotli sizes (item 4), once a host is chosen; real-user INP (item 3), if a measuring tool is added | Brotli and real-user INP: when a host and a tool exist |
| Q7-8 | Clean-up before or alongside Slice 3? | **Settled 12 Nov 2026: D7-19** |
| Q7-9 | Logging | **Settled 12 Nov 2026: D7-18** |

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
| 17 | 12 Nov 2026 | **Agreed by the owner (12 Nov 2026):** D7-16 (code practices, section 20), D7-17 (feature folders one feature at a time; `auth` owns the session, its cookies, login, logout and page access, and is used by other features only through its listed public helpers; `layout` owns page frames; shared code depends on no feature; `api/client.ts` is the only code that calls the backend), D7-18 (plain-text logging through `logServerEvent`, levels set by the helper, details limited by its types, no `JSON.stringify` for logging) and D7-19 (slice by slice) added; Q7-4 to Q7-9 added, Q7-4, Q7-5, Q7-6, Q7-8 and Q7-9 settled and Q7-7 given a measuring plan; section 16 rewritten for feature folders, with cookie ownership split between shared tools, `auth` and `cart`; section 17.1: trusting the local certificate when the frontend runs in WSL; section 20 added; T7-2 measurements verified, caching stated from the checked headers, gzip and Brotli kept apart; in 20.1 the `<feature>Keys` naming exception for query-key objects; in 20.9 the hooks that are kept and why; in 20.13 the one-time `sessionKeys` rename (step 3), the split of `types/catalogue.ts` and `api/catalogue.ts` between `catalogue` and `storefront` (steps 5 and 8), and moving `utils/message-checks.ts` to `scripts/` (step 11); the photo frame moves to shared code with `product` (step 6) and the category-tree call hook to `storefront` (step 8); which steps start with a move-only commit; which pull requests are not one feature |
| 18 | 12 Nov 2026 | Agreed by the owner: in 20.3 other features' public parts sit between shared code and the feature's own files in the import order; in 20.13 the shared components' `t` prop becomes `messages` in its own small pull request after login. No other decision changed |
| 19 | 12 Nov 2026 | The `auth` pilot (20.13, step 3; pull request #39, for the owner's review): section 16 says `auth` has moved and adds the top-level plain file a feature may have for code `proxy.ts` also uses; the public-helper table in 20.4 takes the pilot's names, and `Unavailable` finds the page's address itself so `currentPath` stays inside `auth` (the owner's choice, 12 Nov 2026); 20.10 says how a call name is written. No decision changed |
| 20 | 13 Nov 2026 | Agreed by the owner (13 Nov 2026): 20.10 gains the `errorType` detail, so an unexpected error logs its kind as 20.9 and 20.10 already said; a backend call name comes from the generated list of backend calls, which `npm run gen:types` writes and `npm run check:types` keeps in step; the API client's schema-mismatch line uses `logServerEvent` (pull request #40). No other decision changed |
| 21 | 13 Nov 2026 | Status: the `auth` pilot (#39) and the logging details (#40) are merged. **Agreed by the owner:** in 20.13, steps 4 to 11 are code-quality changes with behaviour kept, and old code is replaced, tested and only then removed, never deleted first. No other decision changed |
| 22 | 13 Nov 2026 | **Agreed by the owner** for the `vendor` step: 20.9 and section 16 add the action hook (`use-<action>.ts`) for a screen part with call and error logic but no form, under the form hook's rules; section 16 lets a feature's `types.ts` hold small rules about its types (`stepFor`, `isEditable`). No other decision changed |
| 23 | 13 Nov 2026 | Status: step 4, `vendor`, in review (pull request #42). No decision changed |
| 24 | 13 Nov 2026 | Status: step 4, `vendor`, done (#42); step 5, `catalogue`, in review (#43). **Agreed by the owner:** in 20.9, the form hooks of one feature may share a helper hook inside that feature for the steps they all take. No other decision changed |
| 25 | 13 Nov 2026 | Status: step 5, `catalogue`, done (#43); step 6, `product`, in review (#44). **Agreed by the owner:** in 20.2, the words inside a group's round brackets and every other folder name in `src/app/` are full words; `vendor/(app)/` becomes `vendor/(needs-vendor)/` and `vendor/products/new/` becomes `vendor/products/add/` (20.13, step 6); in 20.9, one exception for the photo upload queue, which keeps going after the vendor leaves the photos step. No other decision changed |
| 26 | 13 Nov 2026 | **Agreed by the owner:** in 20.9, a change sends only the changed fields, read through `useAppForm`; in 20.12, item 6, a bug found on the way is fixed in its own pull request before the next step; in item 8, a form that changes saved data has an end-to-end test that edits it and checks the request body and the saved value. Status: the bug fix is pull request #45. No other decision changed |
| 27 | 14 Nov 2026 | Status: step 6 done (#44) and the bug fix merged (#45); step 7 in review (#46). In 20.2, the two rules of `lib/routes.ts` (it imports no feature, and has no server-only code or Zod because `proxy.ts` uses it), a helper added by the step that first needs it, and list query strings kept with `withQuery`, as agreed by the owner with the step 7 plan. No other decision changed |
| 28 | 14 Nov 2026 | Status: step 7 done (#46; the owner accepted the 0.2 KB the whole `lib/routes.ts` adds to every page); step 8 in review (#47). **Agreed by the owner:** in 20.13, step 8, the old `/c/` and `/p/` addresses are a real 404 with no redirect, and the storefront spec is written before the clean-up. In section 16, `rules.ts` for a feature whose rules a public page needs: no Zod, so the product page stays as light as before (found in step 8: with the rules in `types.ts` the product page grew by 33.5 KB). No other decision changed |
| 29 | 14 Nov 2026 | Status: step 8 done (#47); the "Load more" focus bug, found by the step 8 storefront spec, is fixed before step 9 (#48), as 20.12, item 6 asks. No other decision changed |
| 30 | 14 Nov 2026 | Status: the focus fix is done (#48); before step 9, the Q7-7 measurements (#49), with their results in Q7-7. **Agreed by the owner:** in Q7-7, the planned split budget and trimmed font for Hindi pages, applied after the results are reviewed, and the emulated profile used; in section 11, the tests that need the backend run in CI after step 11, with the browsers for every pull request and for nightly runs; in 20.13, that CI work as the last item before Slice 3. No other decision changed |
| 31 | 14 Nov 2026 | **Agreed by the owner after the Q7-7 results:** the split budget and the trimmed Devanagari font applied (#49); Q7-7 settled except Brotli and real-user INP; T7-2: the figures under the new rule, and the text only some pages carry (`store`, `cart`). No other decision changed |
| 32 | 14 Nov 2026 | Status: the Hindi page size done (#49); step 9 in progress. **Agreed by the owner:** the step 9 plan in 20.13 (the cart's folder, `lib/add-notice.ts`, `useAddAfterLogin`, the header's temporary use of `cart` until step 10, the cart spec first). No other decision changed |
| 33 | 14 Nov 2026 | **Agreed by the owner:** in section 16, `rules.ts` is used wherever a page's browser code needs a feature's enums and rules but not its schemas, not only on public pages; the cart has one (#50), which takes about 31 KB of Zod off the cart page. In 20.13, the step 9 plan names it. No other decision changed |
| 34 | 14 Nov 2026 | Status: the bug found in step 9 (an add whose session had ended, when keeping it for after login fails) is fixed before step 10 (#51), as 20.12, item 6 asks. No other decision changed |
| 35 | 14 Nov 2026 | Status: step 9 done (#50), its bug fix done (#51); step 10 in progress. **Agreed by the owner:** the step 10 plan in 20.13 (the layout folder, the staff-screen rule in `auth`, the language switch's hooks, the layout spec first) and that the account page's own links are left for Slice 3. No other decision changed |
| 36 | 14 Nov 2026 | Status: step 10 done (#52); step 11 in progress. **Agreed by the owner:** the step 11 plan in 20.13, including fixing the reason dialog to the 20.9 pattern (a shared action hook, named callbacks, no `try`/`catch`) rather than recording it as an exception, with its test written first. No other decision changed |
| 37 | 15 Nov 2026 | Status: step 11 done (#53), the clean-up complete. **Agreed by the owner:** in section 11, the backend tests in CI and the other browsers are postponed until the whole application is built (pull request #54 stays open, unmerged), and the testing status is recorded; in 20.13, Slice 3 follows step 11 directly. No other decision changed |
| 38 | 15 Nov 2026 | **Agreed by the owner:** D7-20, a group folder for the features of one area; `storefront` becomes a group with four parts (`product-list`, `product-page`, `search`, `home`) and `account` is a new feature (section 16, 20.4). The Slice 3 plan is in Document 8, section 4. No other decision changed |
| 39 | 15 Nov 2026 | **Agreed by the owner:** the first-load limits are raised to 265 KB without fonts in every language and 307 KB in total for English pages (Document 6, section 14), for the storefront header of Slice 3. No other decision changed |
| 40 | 15 Nov 2026 | In 20.4, the storefront header (`layout`) reads the category tree through `product-list`'s server call and shows `search`'s box (Slice 3c). No other decision changed |
| 41 | 15 Nov 2026 | Slice 3d: the new `account` feature (profile, saved addresses, the account tabs, the areas); the account's text is carried only by the account pages (`PAGE_SECTIONS`); the account page's links left from step 10 are done. No decision changed |
| 42 | 15 Nov 2026 | Slice 3e: the error, no-access and not-found pages build their home address with `homePath` (20.2). No decision changed |

## 16. Names: folders and files

Recorded 10 Nov 2026; folders by kind of code chosen by the owner on 11 Nov 2026; **feature folders agreed on 12 Nov 2026 (D7-17), introduced one feature at a time.** Until a feature has moved, its files stay in the earlier layout (`components/<area>/`, `hooks/use-<area>.ts`, `api/<area>.ts`, `types/<area>.ts`). **`auth` has moved** (20.13, step 3, pull request #39), with the session work that was in `middleware/`; reading the pending-add cookie stays in `middleware/cookies.ts` until the `cart` step (step 9). `docs/code-map.md` says where each file is.

| Folder | What goes in it |
| --- | --- |
| `src/app/` | Routing only; Next.js fixes these names. Pages under `[lang]/` (D4-01), our endpoints under `api/` (addresses `/api/...`). Pages are thin and show a feature's screen; endpoints call a feature's server code. Never moved into `features/`, because Next.js reads addresses from it |
| `src/proxy.ts` | The page middleware (Document 4, section 6). Next.js fixes this file name |
| `src/features/<feature>/components/` | The feature's screens and their parts |
| `src/features/<feature>/hooks/` | `use-<feature>.ts`: the feature's call hooks, one per API call. `use-<form>-form.ts`: one file per form. `use-<action>.ts`: one file per action part that has call and error logic but no form (20.9) |
| `src/features/<feature>/server/` | **Server only:** the feature's backend operations (`<feature>-api.ts`): which call, its input, its answer schema and its rules, each made through `api/client.ts`. Also the server logic the feature's endpoints share |
| `src/features/<feature>/types.ts` | The feature's Zod schemas and the types made from them, forms included, its enums, and small rules about those types that screens and hooks share (for example `vendor`'s `stepFor`, which step fixes a missing item, and `isEditable`, which statuses its owner may change) |
| `src/features/<feature>/rules.ts` | Where a page's browser code needs a feature's enums and small rules but not its schemas: the same enums and rules, in a file with no Zod that imports only types, so the page does not load Zod (about 31 KB) into the browser. `storefront`'s `product-list` (the sort, finding a category in the tree) and `product-page` (choosing a variant, stock levels, breadcrumbs) have one for their public pages; `cart` has one (the line status, the largest quantity, which lines cannot be bought) for the cart page, which was 0.1 KB under its budget (owner, 14 Nov 2026). `types.ts` then keeps only the schemas and their types. The same reason as `lib/add-notice.ts`, kept apart from `features/cart/types.ts` |
| `src/features/<feature>/<name>.ts` | A plain file at the top of the feature for code that `proxy.ts` uses as well as the server, so it cannot be server only and must not load Zod: `auth`'s `after-login-page.ts` |
| `src/components/ui/`, `form/`, `common/` | Shared UI: shadcn/ui components (D7-14), form parts (`Form`, fields, the error summary), and pieces two or more features use |
| `src/lib/` | Shared code that knows the app: settings, the browser's call helper, errors and error codes, HTTP statuses, languages and messages, page addresses (`routes.ts`), the server log helper (`server-log.ts`) |
| `src/api/client.ts` | **The shared, server-only backend transport client.** Feature server code uses it to make backend calls. It owns the actual HTTP communication: the backend address, time limits, retrying safe reads only, request ids, and checking each answer against the schema the feature gives it. Each feature owns its backend operations, their inputs, their answers and their business rules |
| `src/utils/` | Plain helpers with no app knowledge: formatting, class names |
| `src/middleware/` | **Server only, shared technical helpers that know nothing about the session or any feature:** endpoint answers (`ok`, `fail`, and `fromAppError` for non-session failures, 20.9), the forgery check (section 17.3), reading a request body, the public-answer and upload helpers, and the generic cookie tools in `cookies.ts`: the list of our cookie names and lifetimes (section 17.2), the options every cookie uses (D4-07), the tool that deletes a cookie by name, signing and checking signed values, the safe-local-path check and the page-address header. `cookies.ts` holds no rule about what any cookie means, and `middleware/` imports no feature |
| `src/types/` | Shared types: `common.ts`, `error.ts`, `react-query.d.ts`; `generated/` is never edited by hand (D7-02) |
| `src/messages/` | The message catalogue (Document 4, section 6) |
| `scripts/`, `tests/unit/`, `tests/e2e/` | Commands and their helpers; tests |

**The features.**

| Feature | What it owns |
| --- | --- |
| `auth` | Login, logout and "log out everywhere". The session: reading the login cookies, writing them after login or renewal, renewing tokens, running a call as the person, and the answer when a session fails (`fromFailure`, 20.9). When a session ends or the person logs out, `auth` starts the clean-up Document 4, section 9 requires: it deletes the login cookies and the short-lived cookies that go with them, using the shared cookie list and delete tool. Page access: the page guard, the default page after login by role, and the cookie that remembers the page to return to after login |
| `vendor` | The vendor application, who may enter the vendor area, and the admin's vendor review |
| `catalogue` | The admin lists: categories with attributes, HSN codes, GST rates, brands, sizes, colours |
| `product` | A vendor's products and their moderation: the same backend area (3b), the same types and the same photos |
| `storefront/` (group, D7-20) | The shopping side, in four parts. The group folder holds no files of its own |
| `storefront/product-list` | Every list of products a customer sees: the category page, the brand page, search results and New arrivals; the filters, the sort and "Load more"; the product card; the public category tree and brand list, and the map from a brand's slug to its id (Document 4, section 5) |
| `storefront/product-page` | One product's page: photos, size and colour choice, stock message, price and the buy box (which uses `cart`'s Add to cart hook) |
| `storefront/search` | The search box in the header and its suggestions while typing |
| `storefront/home` | The home hero |
| `account` | The customer's own settings: profile (name and email), saved addresses, the account tabs and the links to the areas the person may enter. Logout stays in `auth`, which the security page shows |
| `cart` | The cart and Add to cart, including the add that waits for login (D2-02): what its signed cookie means, writing it, reading it (`decodePendingAdd`) and running the add. The login endpoint asks `cart` to run it; `auth` never calls the cart, and deleting the cookie at a session end needs only its name from the shared list |
| `layout` | Page frames, headers, navigation and page structure: the storefront header and the staff area frame and menus. It shows `auth` and `cart` information (who is logged in, the cart count) through their public hooks, but owns none of their logic |

- "Admin" is a role, not a feature. Admin pages in `src/app/[lang]/admin/` show screens from `vendor`, `catalogue` and `product`.
- A folder is created when its first file is written.
- **A group folder (D7-20)** holds only its parts, never a file of its own, and has no group inside it. Its parts are imported by their full path (`@/features/storefront/product-list/...`). `account` is not part of `storefront`: like `cart` and `auth`, it is its own feature.
- How names, imports and dependencies between features are handled is in section 20.

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

**Agreed by the owner on 12 Nov 2026**, after a review of the code, a reference project the owner shared, and a pilot on the login feature (pull request #36). The goal: someone new can open a file, see what it is for, follow the calls and know what each name holds without guessing. These practices change how code is written, never what it does: no behaviour, backend contract or feature changes come from them. Parts of this section describe code the login pilot introduces (pull request #36: the error-code enums, `Form`, the form hooks, the named values); until it is merged they are the target the code is brought to.

### 20.1 Names

- **Variables, functions, parameters, callbacks and state:** camelCase full words. No single letters or unclear short names (`t`, `n`, `raw`), callback parameters included: `sellers.map((seller) => …)`.
- **Functions say what they do:** a verb and its object, such as `sendCode`, `removeUnavailableLines`, `showSendCodeError`.
- **Components** are PascalCase and named for what they show (`LoginForm`, `CodeStep`).
- **The page's text** is `messages`, never `t`.
- **In a catch** (only where 20.9 allows one), the caught value is `caughtError`.
- **Constants** are UPPER_SNAKE_CASE (`FIELD_IDS`); enums and their members are PascalCase (`HttpStatus.TooManyRequests`).
- **Query-key objects** keep the existing `<feature>Keys` camelCase form (for example `sessionKeys`, `cartKeys` and `vendorKeys`). This is an established naming exception, not a general exception for constants.
- **Schemas:** a backend answer is `<Thing>Schema` (`UserSchema`); a form is `<Thing>FormSchema` (`PhoneFormSchema`), with `<Thing>FormInput` for what the fields hold and `<Thing>FormValues` for the checked values.

### 20.2 Folders, files and addresses

- **Folders and files:** kebab-case, named for what they hold. A component file exports the same name in PascalCase (`login-form.tsx` exports `LoginForm`). Where they live is section 16.
- **Short names only where something else fixes them:** `ui` and `cn` (shadcn/ui), `app` (Next.js), `api` (Next.js's `app/api/` and our backend client folder `src/api/`), `en` and `hi` (language codes), `me` (the backend's own address word), `id`, and `[lang]` (Q7-5).
- **Inside `src/app/` a folder name is the web address.** Names Next.js fixes stay as they are: `page.tsx`, `layout.tsx`, `route.ts`, `[slug]` for a changing part, `[[...name]]` for an optional part, and round brackets for a group that is not in the address. The words inside the brackets and every other folder name are ours, and are full words that say what the folder holds: `vendor/(needs-vendor)/` holds the vendor pages that need a vendor, and the page for adding a product is `vendor/products/add/` (owner, 13 Nov 2026).
- **Address words are full words:** `category`, `brand` and `product`, as recorded in Document 4 (D4-02 and the route table). The `storefront` pull request implements these documented addresses; `brand` is not built yet.
- **Page addresses are built only in `lib/routes.ts`,** with one helper for each kind of page (for example `homePath`, `loginPath`, `cartPath`, `categoryPath`, `productPath`). Pages, screens and components use these helpers and never write an address such as `` `/${lang}/category/${slug}` `` by hand, so a renamed address changes in one file. The readable product name for addresses (D4-02) is made there too. Addresses of our own endpoints (`/api/...`) stay with the call hooks that use them. Each feature's clean-up pull request moves that feature's hand-built addresses to these helpers. Two rules keep the file usable everywhere: it imports no feature (D7-17), so a step or a list is passed in as plain text by the screen that knows its enum (`myProductPath(lang, id, ProductStep.Photos)`); and it has no server-only code and no Zod, because `proxy.ts` uses it. A helper is added by the step that first needs it, so the file never holds an address nobody uses. Query strings for list filters and pages stay with `withQuery` (`utils/url.ts`), on top of the helper's address.
- **Pages in `src/app/` are thin:** they read the address values, check the language and show the feature's screen.

### 20.3 Imports and exports

- **Named exports only.** Default exports only where a tool requires them: Next.js pages, layouts and special files (`error.tsx`, `not-found.tsx`, `forbidden.tsx`, `global-error.tsx`, `global-not-found.tsx`), and config files (`next.config.ts`, `eslint.config.mjs`, the Playwright and Vitest configs).
- **`@/` for anything outside the file's own folder; `./` only for a file in the same folder.** Never `../../`.
- **Order:** packages, then shared code, then other features' public parts (20.4), then the feature's own files, then files in the same folder. `import type` for what is used only as a type.
- **No index files that re-export a folder.** Import the file itself.
- **Server-only files** (`src/api/client.ts`, `features/*/server/`, `middleware/` except `cookies.ts`, `lib/server-log.ts`) start with `import 'server-only'`.
- **A `'use client'` file never exports a constant or enum that server code needs;** those go in a plain file.
- **Heavy libraries stay where they are needed.** A file every page loads (the header, the session) never imports a file that brings Zod. The add-to-cart result is kept apart from the cart's schemas for this reason.

### 20.4 Features, layout and shared code (D7-17)

- **Code starts in its feature.** It moves to shared code only when a second feature needs it.
- **What one feature may use from another:**
  - its **call hooks, types and schemas**, when the business needs that link: the storefront's Add to cart uses the cart's hook, product forms use the catalogue's categories, product screens check the vendor's status;
  - **`auth`'s public session and access helpers,** because every page and endpoint needs to know who is logged in. These are the only parts of `auth` other features use:

    | Helper | Where it is used | What it does |
    | --- | --- | --- |
    | `useSession` | browser | Who is logged in, for showing things |
    | `getViewer` | server, page render | Who is logged in |
    | `requireUser` and its "not available" view (`Unavailable`) | server, pages | The page guard. `Unavailable` finds the page's own address for its "Try again" link, so no other feature needs the address helper (`currentPath`), which stays inside `auth` |
    | `answerAsUser`, `fileAsUser` | server, endpoints | Run a backend call, or open a private file, as the person |
    | `rememberPageAfterLogin` | server, `proxy.ts` | Remember the page to return to after login |
    | `isStaff` | anywhere | Whether a person has a staff role |
    | the `User` and `SessionAnswer` types | anywhere | The person's shape |

    The names are those of the `auth` pilot (pull request #39). `app/` may also use `auth`'s screens (`LoginForm`, `LogoutButtons`) and, in `providers.tsx`, its session-end handler (`endsSession`, `endSession`).
- **A feature never uses another feature's screens or form hooks,** and nothing outside `auth` uses its other files (its backend calls, token renewal, its cookie writing).
- **Who places screens on a page:** only `src/app/` (pages, endpoints and `proxy.ts`) and `layout` put feature screens together. A page may show `LoginForm` from `auth` and the header from `layout`; a feature's own screen never contains another feature's screen.
- **A component two features need** moves to `components/common/` (for example the photo frame).
- **The parts of a group are features** (D7-20): they follow every rule in this section between each other. For example `product-page` may use `product-list`'s category tree hook and types, but never its screens; the price both parts show moves to `components/common/`.
- **No circular dependencies.** If two features would need each other, the part both need moves to shared code, or the combining moves up to `src/app/`. The login endpoint (`app/api/auth/verify/route.ts`) calls `auth` to log the person in and `cart` to run the pending add, so neither feature imports the other.

  **Migration exception, now closed:** one loop was tolerated during the clean-up: login imported the add-to-cart result from `cart` while `cart` imports the session from `auth` (D2-02). The `cart` pull request (20.13, step 9) removed it by making the add-to-cart result shared code (`lib/add-notice.ts`). This rule now applies with no exception.
- **Shared code never imports a feature and holds no business logic.** `middleware/` keeps only technical helpers (section 16). For cookies the work is split three ways:
  - **The owning feature** decides what its cookie means and does the normal reading and writing: `auth` for the login cookies and the after-login page, `cart` for the add that waits for login.
  - **Shared code** (`middleware/cookies.ts`) supplies only generic tools: the list of cookie names and lifetimes, the options every cookie uses, signing, and deleting a cookie by name.
  - **`auth` starts the clean-up** when a session ends or the person logs out, deleting the login cookies and the short-lived cookies Document 4, section 9 requires. It does this with the shared list and delete tool, so it never imports `cart` code.
- **`layout` shows, it does not decide.** It owns page frames, headers, navigation and page structure, and may show `auth` and `cart` information through their public hooks (who is logged in, the cart count). On the server the storefront header shows the top-level categories through `product-list`'s category-tree call, the server side of a call hook, and it places `search`'s search box (Slice 3). Rules such as who may enter an area belong to `auth` (page access) and to the feature (for example `vendor`: no vendor means the application page).
- **`lib/` and `utils/`:** `lib/` knows the app; `utils/` is plain functions with no app knowledge.
- **Calls to the backend (D3-03):**
  - The browser calls only our own server; the one exception is approved public product photos, which load straight from the public photo host (D3-04).
  - On our server, **only `src/api/client.ts` makes outbound HTTP requests to the backend.** Feature server code calls the client and never the backend directly.

### 20.5 Layout and formatting

- **Prettier:** single quotes, trailing commas, lines up to 100 characters (`npm run format`). Markdown files are not run through Prettier.
- Comments are kept within 100 characters by hand; a long text string may run longer when breaking it would make it harder to read.
- **No nested `? :` chains in JSX.** A screen with several states returns early for each, or uses one small named component per state.
- **One expression does one thing.** A long condition gets a named variable; a long call gets its own lines.
- **A blank line between the steps of a function.**
- **Files are sized by responsibility,** not kept small for its own sake. No tiny files, wrapper functions or new layers unless they remove real repetition.

### 20.6 Named values instead of raw comparisons

- **A value the code branches on, stores or sends gets a name first** (an enum or a named constant), and the code uses the name: states, outcomes, notices, error codes, HTTP statuses and methods, kinds of failure, browser error names, log events. `sessionNotice === SessionNotice.Blocked`, `error.status === HttpStatus.TooManyRequests`, never `=== 'blocked'` or `=== 429`.
- A string enum keeps the stored or sent value (`SessionNotice.Blocked = 'blocked'`), so nothing stored in the browser or sent to the backend changes.
- **Not covered:** text, CSS classes, element ids, message keys, and the typed props of our own components (`tone="error"`, `variant="quiet"`), which TypeScript already checks.
- **Native `typeof` checks stay as they are** (`typeof value === 'string'`, Q7-6).
- **Named values introduced with the login pilot:** `HttpStatus` with `isSuccess`, `isClientError`, `isServerError` and `HttpStatus.NoResponse` (`lib/http-status.ts`); `ErrorKind` (`lib/errors.ts`); `SessionNotice`; `AddOutcome`; `HttpMethod` and `BrowserErrorName` (`lib/http.ts`); `DEFAULT_LOCALE`; `isSingular(count)` (`utils/format.ts`). `ServerEvent` (`lib/server-log.ts`, 20.10) comes with the `auth` pilot.

### 20.7 Error codes

- **`BackendErrorCode`** (`src/types/generated/backend-error-codes.ts`) is generated from the backend's error catalogue with `backend-error-codes.json` (`npm run gen:error-codes`). Values are the backend's codes exactly; names are the same words in PascalCase. Never edited by hand; `npm run check:messages` fails if it differs from the stored catalogue.
- **`AppErrorCode`** (`src/lib/error-codes.ts`) holds the codes the frontend knows that are not in the backend's catalogue: the ones our code produces, and `NOT_FOUND` and `TOO_MANY_REQUESTS` from the backend's framework. The check fails if one is ever a catalogue code.
- No backend code is renamed, given another meaning or invented. Message keys stay the plain code strings.
- A code the frontend does not know still reaches the screen and gets the general message for its kind (section 19).

### 20.8 Comments

- A comment explains **why**, or something the code cannot show (a backend rule, a browser quirk, a privacy reason). It does not repeat the code.
- A rule that comes from a decision names it briefly, such as `(D2-02)`. File headers are a sentence or two.
- No commented-out code; no `console.log` left behind.

### 20.9 Forms, calls and our endpoints

**Who does what.**

| Part | File | Its one job |
| --- | --- | --- |
| The screen | `features/<feature>/components/…` | Draws fields and buttons and wires the submit. No call or error logic |
| `Form` | `components/form/form.tsx` | The `<form>` every form uses: always `method="post"`, the browser's own checks off, so a tap before the scripts load never puts what was typed in the address |
| The form hook | `features/<feature>/hooks/use-<form>-form.ts` | The form (`useAppForm` with its schema), what happens on success and on each error, the error-summary focus, timers |
| The action hook | `features/<feature>/hooks/use-<action>.ts` | For a screen part that runs calls and handles their errors but has no form (an upload row, a submit button with a checkbox, a set of admin decisions): what happens on each action, on success and on each error, and the state the part shows (progress, a message) |
| The call hook | `features/<feature>/hooks/use-<feature>.ts` | One TanStack Query hook per call, with its address, typed input and typed answer |
| `lib/http.ts` | | The only place the browser calls our server: our forgery header, a time limit, and every failure becomes an `AppError` |
| Our endpoint | `app/api/<area>/…/route.ts` | Checks the request and calls the feature's server code |
| The feature's server code | `features/<feature>/server/<feature>-api.ts` | The feature's backend operations: which call, its input, its answer schema and its rules. It never makes the HTTP request itself |
| The backend client | `src/api/client.ts` | The only code that makes HTTP requests to the backend: the address, time limits, request ids, retrying safe reads only (never a change, D7-01), and checking each answer against the schema it is given |

**How a submit runs** (the full login example is in `docs/code-map.md` once pull request #36 is merged):
1. `<Form onSubmit={form.handleSubmit(sendCode, showValidationErrors)}>`: React Hook Form checks the schema, then calls the first function with the checked values, or the second when a field is wrong.
2. The form hook calls the call hook: `requestLoginCode.mutate(phone, { onSuccess, onError })`, both named functions.
3. `onError` receives a typed `AppError` (`types/react-query.d.ts`).
4. Field errors go under their field and the rest into the error summary (`applyServerError`); focus moves to the summary (`useErrorSummaryFocus`).

**Rules.**
- **One way to submit:** `handleSubmit(onValid, onInvalid)` in the screen, `mutate` with `onSuccess` and `onError` in the form hook.
- **One form hook per form,** each in its own file when a feature has more than one form (`use-vendor-address-form.ts`).
- **One action hook per action part** (`use-document-upload.ts`, `use-vendor-submit.ts`), with the same rules as a form hook: `mutate` with named `onSuccess` and `onError` functions.
- **One exception, the photo upload queue** (`product`'s `use-photo-uploads.ts`): it sends the chosen photos one after another and keeps going when the vendor moves to another step, as it always has. `mutate`'s own `onSuccess` and `onError` stop running once the screen has closed, so this one hook uses `mutateAsync(…).then(onUploaded, onUploadFailed)`, still with named functions and no `try`/`catch` (owner, 13 Nov 2026).
- **Form hooks of one feature may share a helper hook** for the steps they all take, so the steps are not copied into each (`catalogue`'s `use-catalogue-save.ts`: add or change, the toast, and the backend's errors under the right fields). It follows the form hook's rules and is used only inside its feature; each form keeps its own form hook, which decides what that form sends.
- **No `try`/`catch` and no `toAppError` in screens, form hooks or action hooks.** A call hook may turn one expected error into a value, with a comment saying why (`useMyVendor` returns `null` for `VENDOR_NOT_FOUND`).
- **A screen with a form never calls a call hook itself.** A small action without a form (a Remove button) may.
- **A value that must survive a step change belongs to the parent** (the phone form lives in `LoginForm`).
- **Hooks that are kept, and why.** Each has a job that would otherwise be repeated in every screen or would put timing work into the screen:
  - `useMessages` gives a client component the page's text in its language, so text is not passed down through every component.
  - `useSessionNotice` reads, once, the notice a session end leaves for the login page ("log in again" or "blocked"), and reads it again if a session ends while that page is open.
  - The resend countdown holds the wait the backend sets before "Send code again" and counts it down on screen.
  - `useErrorSummaryFocus` tells the error summary that a submit has failed. The summary only appears after the errors are set, so it is the summary that moves focus to itself once it is on screen, once for each failed submit. After a failed submit the form only signals the failure; it does not move focus itself.
- **Field checks** run when a field is left and on submit (D6-25), and check only a missing value or a wrong shape.
- **Text** comes from `useMessages()` in client components, from the catalogue in both languages with the same keys (Document 4, section 6; `check:messages` enforces it).
- **Request bodies are typed,** from the generated backend request types where the body passes through unchanged.
- **A change sends only the changed fields.** The form hook reads them from `form.formState.dirtyFields` when Save is pressed. `useAppForm` reads them once every time the form draws, because React Hook Form keeps them up to date only for a form that does; without that read the list is empty when Save is pressed, and nothing is sent (the bug fixed in pull request #45).
- **Our endpoints:**
  - An endpoint that acts as the logged-in person uses `auth`'s `answerAsUser` or `fileAsUser`.
  - A public one uses `answerPublic` (`middleware/endpoint.ts`).
  - One that can use neither (before login, or one that streams an upload) runs, in this order: the forgery check (`guardChange`), the body check, the call, and `fromAppError` for a failure.
  - An endpoint's logic lives in its feature's server code or its `route.ts`, never in `middleware/`.

**Error answers from our endpoints.** Two helpers with separate jobs; they never overlap:

| Helper | Owner | For | What it answers |
| --- | --- | --- | --- |
| `fromAppError` | shared (`middleware/responses.ts`) | **Non-session failures** from calls in any feature: the backend refused the call, the call got no answer, or something unexpected went wrong | An `AppError` passes on its code and status. A call that got no answer becomes 502, or 504 when it ran out of time. Anything else is unexpected: it is logged with `logServerEvent` (its type and a new request id, never its message) and answered as `SERVER_ERROR` (500) |
| `fromFailure` | `auth` | **Failures caused by authentication or session handling**: the request could not run as the person | Nobody logged in: `UNAUTHORIZED` (401). Renewal temporarily impossible: `SESSION_TEMPORARY` (503), with no cookie changed. The backend confirmed the session is over: `SESSION_ENDED` (401) or `USER_BLOCKED` (403), and the login cookies are cleared in that same answer (D2-05) |

`answerAsUser` first sorts out the session: if that fails, the answer comes from `fromFailure`. Only once the call itself runs as the person does a failure of that call go to `fromAppError`. Features never call `fromFailure` themselves.

### 20.10 Logging (D7-18)

- **Server only, through one helper:** `logServerEvent` (`lib/server-log.ts`, server only). Nothing else in our code writes server logs.
- **Events and levels:**
  - each event is a member of the `ServerEvent` enum;
  - the helper keeps one table that gives every event its level (warning or error), and TypeScript fails the build if an event has no level;
  - it writes one plain-text line in the backend's style, for example `[requestId] logout_backend_failed code=SESSION_ENDED everywhere=true`; a backend call name holds a space, so it is written in quotes (`call="POST /auth/logout"`).
- **No `JSON.stringify` for logging,** in the helper or anywhere else. Any Node.js host records each console line. A structured format is considered only if a log or monitoring service the owner chooses needs one (Q7-2), and only with the owner's approval. Other uses of `JSON.stringify` that are not logging stay as they are: sending request bodies, signed cookie values, browser storage.
- **What the helper's types allow.** The details argument accepts only these fields; any other field fails to compile:

  | Field | Accepts |
  | --- | --- |
  | `requestId` | text: only our own random id or the id the backend sent |
  | `code` | an `ErrorCode` |
  | `call` | a backend call by its name in the generated list of backend calls (`src/types/generated/backend-calls.ts`, made by `npm run gen:types` from the stored OpenAPI description), for example `POST /auth/otp/verify` or `GET /admin/vendors/{id}`, so no value from an address can appear in it. `src/api/client.ts` finds the name by matching the real address against that list |
  | `fields` | field names: only the paths from a schema check, never the values |
  | `flags` | true/false values with names from a fixed list (for example `everywhere`) |
  | `errorType` | the kind of an unexpected error, made only by `errorTypeOf`: a built-in JavaScript error name (`TypeError`, `RangeError`, `SyntaxError`, `ReferenceError`, `URIError`, `EvalError`, `AggregateError`), `Error` for any other error, or `NotAnError` when something that is not an error was thrown. Never its message |

  The types cannot check what is inside the two text fields (`requestId` and `fields`), so the rule fixes where their content may come from, and review checks it.
- **Never logged:** request or response bodies, cookies, headers, tokens, session data, phone numbers, login codes, names, addresses, or the message of an unknown error (it can contain data). An unknown error logs its kind (`errorType`) and the request id, for example `[requestId] unexpected_error code=SERVER_ERROR errorType=TypeError`; its full text appears only outside production.
- **In the browser:** nothing in production except the error page's report of the error to the person's own console; development-only warnings are wrapped in a development check.

### 20.11 What we do not copy

From the reference project the owner shared on 12 Nov 2026 we take descriptive names, short formatted lines, screens that only draw with one hook doing the work, and `handleSubmit(onSubmit, onError)` wiring. We do **not** take:

- login tokens in the browser (D4-07);
- `any`, `../../../` imports, default exports everywhere, mixed file-name styles;
- hard-coded English text;
- the backend's error text shown to the person;
- commented-out code, `console.log` in error handlers, empty `if` branches, a second loading flag next to the call's own `isPending`;
- state setters passed down to children; a named callback such as `onCodeSent` is passed instead.

### 20.12 How work is done

1. **Slice by slice (D7-19).** Each slice is finished, cleaned up, tested and reviewed before the next starts. Clean-up that the slice's work does not need goes in its own pull request, never alongside new feature work.
2. **Review before changing,** and report findings and a plan first.
3. **Decide, document, pilot, review, then roll out:** a new pattern or structure is tried on one feature, shown to the owner, and rolled out only after the owner agrees.
4. **Documents first, then code;** `docs/code-map.md` changes with the structure or the request flow.
5. **Explain in plain words,** step by step: which file comes in when, and why.
6. **Behaviour is kept.** What no test covers is checked by reading the existing code. A bug found on the way is reported, then fixed in its own pull request before the next step starts (owner, 13 Nov 2026).
7. **After every change:** types, lint, the message and enum checks, generated types, unit tests, every end-to-end test on desktop and phone, and the first-load page sizes (T7-2). A change that adds weight to every page is found and fixed.
8. **Tests:** one end-to-end spec per feature, named after it (for example `auth.spec.ts`). Each pull request adds or updates tests for the behaviour it touches, and a new kind of page joins the page-size test. A form that changes something already saved has an end-to-end test that edits it, checks the request body that is sent (`nextRequestBody` in `tests/e2e/support/requests.ts`) and checks the value after a reload: a toast or the next page alone does not show that anything was saved. Each feature pull request splits or renames the existing slice-based specs (`slice-1-login.spec.ts`, `slice-2a-vendor.spec.ts` and so on) that cover it, so that by the end of the clean-up every spec is named after its feature.
9. **Moves are their own commit:** a commit that moves files changes nothing else, so the review shows only renames.
10. **Pull requests:** one feature each; the documents (20.13, step 1), page addresses (step 7) and the final clean-up (step 11) each have their own. The description says what changed, why, the flow if it changed, the checks run, the page sizes and the open items. Nothing is merged unless the owner says "merge". No assistant attribution lines.

### 20.13 How it is rolled out

The code from Slices 0 to 2 is brought to these practices before Slice 3 starts (D7-19), one pull request per feature, in this order, each reviewed before the next.

**Where it stands (14 Nov 2026):** steps 1 to 3 are done and merged: the documents (#37), login (#36) with the shared `messages` prop (#38), and the `auth` pilot (#39), followed by the logging details the pilot left open (#40). Step 4, `vendor`, is done (#42): `src/features/vendor/`, the first feature cleaned up with the replace-first rule below and with action hooks (20.9). Step 5, `catalogue`, is done (#43): the admin catalogue lists are in `src/features/catalogue/`. Step 6, `product`, is done (#44), followed by a bug fix (#45): the eight forms that send only the changed fields sent nothing when something already saved was edited. Step 7, page addresses, is done (#46): `lib/routes.ts`, used by `auth`, `vendor`, `catalogue` and `product`; the whole file reaches every page (about 0.2 KB), which the owner accepted. Step 8, `storefront`, is done (#47). **Before step 9, a bug fix** (pull request #48, done): after "Load more", focus left the button for the top of the page; it now stays on the button, and moves to the first card added once the button is gone (Document 6, 8.8). **Then, also before step 9, the Q7-7 measurements and the Hindi budget** (pull request #49): the login pages measured on the emulated profile, on `main` and with a trimmed Devanagari font; after the owner's review, the split budget and the trimmed font applied (Document 6, section 14), done. **Step 9, `cart`, is done** (#50). **Then, before step 10, a bug fix** (pull request #51): when the session had ended meanwhile, "Add to cart" sends the person to log in; if keeping the add for after login then failed, the button stayed busy with no message. It now shows the error and the button can be pressed again, as on the not-logged-in path; done. **Step 10, `layout`, is done** (#52). **Step 11, the final clean-up, is done** (#53): the code-style rules and the format check now cover all code, in `npm run check` and CI; `message-checks.ts` is in `scripts/`; the reason dialog follows 20.9.

**How steps 4 to 11 are done (owner, 13 Nov 2026):**
- They are code-quality changes, not new features: behaviour is kept (20.12, item 6). The one change a person sees is the storefront addresses in step 8, already agreed in Document 4 (D4-02). New features start with Slice 3.
- **The old code is not deleted first.** Each feature is replaced, tested, and only then removed:
  1. a move-only commit puts the feature's files in `src/features/<feature>/`;
  2. a file that only needs renames is renamed; a file that is badly built (a screen holding logic, a mixed-up hook) is written again in the new shape, with the old file used only as a reference for what it must do;
  3. the feature's end-to-end tests must still pass, which shows the new code does everything the old code did;
  4. what is left of the old code is removed in the same pull request.
- The site keeps working at every step, and no old structure is left behind at the end.
- A feature is rebuilt from nothing only if its behaviour itself is wrong, and only when the owner asks for it.

The steps:

1. **Documents, in one docs-only pull request made from the current `main`,** changing no code:
   - Document 7: the status line, decisions D7-16 to D7-19, the open questions, T7-2, section 16, section 17.1 (WSL certificate) and section 20;
   - Document 4 (D4-02 and the route table) and Document 5 (section 8.1);
   - the Document 8 sentence;
   - the README's local-setup note for WSL and its pointer to section 20.

   Its decisions were marked Proposed while it was reviewed and switched to Agreed when the owner approved it on 12 Nov 2026 (pull request #37). The short reference copy in the owner's Claude project is rewritten from this section 20 and follows the same status. It is the only pull request that changes these documents.
2. **Login** (pull request #36), after the documents are merged:
   - its own changes to Documents 4, 5 and 7 and to the README's practice notes are removed, so the two pull requests never edit the same text;
   - it keeps its login code, the tooling it adds (with the README rows that describe that tooling), and the code map's explanation of the login flow and its files;
   - it is finished under these rules (`PhoneSchema` becomes `PhoneFormSchema`) and merged when the owner says so.

   Then, in a separate small pull request, the shared components' text prop `t` becomes `messages` (`components/form/` and `components/common/`, with every place that passes it), and `ui/banner.tsx` names its tone styles `toneStyle`. Feature components that still take `t`, and each feature's local `t`, are renamed in that feature's own pull request.
3. **The `auth` pilot:**
   - `auth` moves to `src/features/auth/` (move-only commit).
   - The session work leaves `middleware/`: `middleware/session.ts`; `answerAsUser` and `fileAsUser` from `endpoint.ts`; `fromFailure`, `setSessionCookies` and `clearSessionCookies` from `responses.ts`; and the after-login page cookie helpers from `cookies.ts`. `middleware/` then imports nothing from `auth`, and gains the generic delete-a-cookie tool.
   - Logout and the session are cleaned up, with `logServerEvent` (D7-18).
   - One-time clean-up: `SESSION_QUERY_KEY` becomes `sessionKeys`, matching the other features' query-key objects (`cartKeys`, `vendorKeys`). This is a single rename, not a new naming rule.

   The owner reviews it before any other feature moves.
4. **`vendor`.**
5. **`catalogue`:** `types/catalogue.ts` and `api/catalogue.ts` are split by ownership. The admin catalogue lists (their schemas, forms and backend operations) move to `catalogue`. The category tree and the storefront's product cards and product pages stay where they are until step 8 moves them to `storefront`. Behaviour does not change, and nothing is copied: a type or operation that both features use has one owner, and the other feature uses it under 20.4.
6. **`product`**, with moderation. The photo frame moves to `components/common/`, because the storefront, the cart and moderation all use it (20.4); this keeps `product` and `storefront` from depending on each other. Two folder names change (20.2): the vendor page group `(app)` becomes `(needs-vendor)`, which no address shows, and the page for adding a product moves from `vendor/products/new` to `vendor/products/add`, so its address becomes `/{lang}/vendor/products/add`. That address change is the only change a person can see in this step; the site is not live, so the old address is not redirected. Until step 8 the category-tree call hook waits in `src/hooks/use-category-tree.ts`, because `storefront` owns it.
7. **Page addresses (`lib/routes.ts`):** its own pull request, or part of the first feature pull request that needs it. Each later feature pull request moves its own hand-built addresses to the helpers.
8. **`storefront`:** implements the addresses already recorded in Document 4 (`category`, `product`), using `lib/routes.ts`. It also moves the remaining parts of `types/catalogue.ts` and `api/catalogue.ts` (the category tree, product cards and product pages) to `storefront`; the two old files are then gone. The category-tree call hook (`useCategoryTree`, waiting in `src/hooks/use-category-tree.ts` since step 6) moves to `storefront`, which owns that endpoint, and `product` uses it under 20.4. Apart from the two addresses, behaviour does not change, and nothing is copied. The old addresses `/{lang}/c/…` and `/{lang}/p/…` are a real 404 and are not redirected: the site is not live, so nobody has them saved (owner, 14 Nov 2026). The buy box keeps using the cart's hooks where they are until step 9. Because the buy box and "Load more" are rewritten and today's tests cover them only in part, a storefront spec is written first and passes on today's code before the clean-up.
9. **`cart`:**
   - `decodePendingAdd` and the running of the pending add move to `cart`, and the login endpoint calls `cart` for it;
   - the add-to-cart result that login hands to the next page becomes shared code, which ends the loop between `auth` and `cart` (20.4).

   **The plan agreed by the owner (14 Nov 2026):**
   - `src/features/cart/`: `types.ts` (from `types/cart.ts`) and `rules.ts` (the line status as an enum, the largest quantity, 10, as one named value, and which lines cannot be bought; with no Zod, so the cart page does not load it, owner, 14 Nov 2026); `components/` with the cart screen split into the screen, one cart line, the totals and the coupon form; `hooks/use-cart.ts` (the call hooks, and `useAddAfterLogin`, which replaces the plain `addAfterLogin` function), the action hooks `use-cart-line.ts` and `use-coupon.ts`; `server/cart-api.ts` (from `api/cart.ts`) and `server/pending-add.ts`, which holds all of the add that waits for login: writing its cookie, reading it (`decodePendingAdd`, from `middleware/cookies.ts`) and running it (from the login endpoint).
   - The add-to-cart result (`AddOutcome`, `AddNotice`, keeping it for the next page and taking it there) becomes `lib/add-notice.ts`: login writes it and the product page reads it, so neither feature imports the other.
   - The storefront's buy box uses `useAddAfterLogin` (the item left from step 8).
   - The header (`components/common/header-actions.tsx`) took the cart count from `cart` until it moved to `layout` in step 10, where that is allowed (20.4); done in step 10.
   - **The cart spec is written first** (`tests/e2e/cart.spec.ts`), passing on the old code: the cart needs a login (moved from the Slice 2 journey), an add before login, changing a quantity (the request sent and the value after a reload), removing a line, a coupon that does not apply, removing unavailable lines, and the Hindi cart page. The unit tests of the add that waits for login move from `storefront.test.ts` to `cart.test.ts`.
10. **`layout`.**

    **The plan agreed by the owner (14 Nov 2026):**
    - `src/features/layout/`: `components/` with the storefront header (`site-header.tsx`, `header-actions.tsx`, `language-switch.tsx`, `wordmark.tsx`, from `components/common/`), the Vendor and Admin frame (`area-shell.tsx`, `area-nav.tsx`, from `components/auth/`) and `admin-home.tsx` (the Admin home links, taken out of the page); `hooks/use-layout.ts` (the call hook that remembers the chosen language) and the action hook `use-language-switch.ts`, so the switch only draws; `menus.ts` (what each menu lists, from `components/auth/area-menus.ts` and `nav-icons.ts`, with its addresses from `lib/routes.ts`).
    - Which admin screens each role may use is a page-access rule, so it moves to `auth` (`features/auth/staff-screens.ts`); the Admin menu and the Admin home read it (20.4: `layout` shows, it does not decide).
    - The header then takes who is logged in from `auth` and the cart count from `cart` as `layout` may, which ends the header's temporary exception from step 9. `components/auth/` goes.
    - **The layout spec is written first** (`tests/e2e/layout.spec.ts`), passing on the old code: the storefront header logged out and logged in with the cart count, the language switch (same page, choice remembered), the Vendor menu with and without a vendor, the Admin menu and Admin home for a moderator and for an admin, the phone menu drawer, and the staff frame in Hindi with an accessibility check.
    - **Left for Slice 3 (owner, 14 Nov 2026):** the account page (`src/app/[lang]/account/page.tsx`) builds its own short list of links (Admin area, Vendor area, Become a vendor). That is page content, not the frame, so it stays as it is in step 10 and is cleaned up when the account page is built out in Slice 3 (profile, addresses and the account tabs, Document 5, section 6.5). **Done in Slice 3d:** the links are `account`'s `AccountAreas`, on the profile tab.
11. **Finally:**
    - the lint rule for one-letter names and nested ternaries covers all of `src/`, the format check joins CI, and the temporary file list in `eslint.config.mjs` goes;
    - `utils/message-checks.ts` moves to `scripts/`, after checking again that no app code uses it. Today its only users are the message check (`scripts/check-messages.ts`) and that check's unit test (`tests/unit/messages.test.ts`), whose import changes with it.

    **The plan agreed by the owner (14 Nov 2026):**
    - Measured before starting: with the rule for one-letter names and nested ternaries on for all of `src/`, `tests/` and `scripts/`, 77 problems in 25 files (73 short names, 4 nested ternaries); 60 files are not in the Prettier format. They are fixed in separate commits: formatting only (no code change), then the names and ternaries. Then the temporary file list goes, `npm run check` also runs the format check, and so does CI.
    - **The reason dialog** (`components/common/reason-dialog.tsx`: rejecting a vendor, a document or a product, and suspending a vendor) awaited the decision's promise in a `try`/`catch`, which 20.9 does not allow and which was never recorded as an exception. It is fixed rather than excused (owner, 14 Nov 2026): the dialog's logic moves to a shared action hook (`hooks/use-reason-dialog.ts`) and the dialog only draws; it hands the reason to the feature's hook with named `onSuccess` and `onError` functions, and the feature's hook calls `mutate` with them, like every other form (20.9). It still stays open with the error in its summary when the backend refuses, keeps the reason typed, and closes when the decision is made. **A test is written first** (`tests/e2e/product.spec.ts`), passing on the old code: a refused rejection keeps the dialog open with the error, focused, and the reason kept; trying again closes it.

    Then Slice 3 starts. The tests that need the backend in CI (section 11) are postponed until the whole application is built (owner, 15 Nov 2026).

Steps 3 to 6 and 8 to 10 each start with a move-only commit, and each one also splits or renames the slice-based specs for its feature (20.12, item 8).
