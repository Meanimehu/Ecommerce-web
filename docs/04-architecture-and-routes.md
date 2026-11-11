# 4. Architecture and routes

> **Status: Approved. D4-01 to D4-04 approved 4 Nov 2026; D4-05 to D4-09 approved 9 Nov 2026; D4-10 approved 10 Nov 2026; merged (PR #5). Section 4 plain-language note and Q4-1 updated 10 Nov 2026 (no decision changed). Simplified 11 Nov 2026 (owner approved): the frontend store is removed; D4-05, D4-06 and D4-10 are withdrawn and replaced by D4-11; D4-08 changed.**
> Follows Documents 1 to 3. Documentation only.

## 1. Purpose

How the frontend is organised and run: its layers, its pages and addresses, language handling, rendering and caching of pages, search indexing, and the runtime it needs. It also settles what Documents 2 and 3 left to this document. It covers frontend design only; backend behaviour is in the backend documentation (section 11) and is not repeated here.

## 2. Decisions

| ID | Decision | Status |
| --- | --- | --- |
| D4-01 | **Every page has a language prefix, `/en` or `/hi`**, in all three areas (storefront, Vendor area, Admin area). The person's choice is remembered for plain visits to the site | Approved (4 Nov 2026) |
| D4-02 | **Product pages use a readable name plus the id**, for example `/en/p/<id>/slim-fit-chinos`. The frontend builds the readable part from the title; the id is what is looked up. A wrong or old name part redirects to the correct address. No backend change is needed | Approved (4 Nov 2026). Clarified (route form only): the id and the name are separate path segments, because ids are opaque (Document 3, section 7) |
| D4-03 | **Hosting is not chosen now.** The app is built to run as a plain, self-contained Node.js server that any suitable host can run, and the host is chosen at deployment time against the checklist in section 4 | Approved (4 Nov 2026) |
| D4-04 | **Search engines index only the home page, category pages, brand pages and product pages.** Search results, filter and sort combinations, cart, account, login, vendor and admin pages are marked not to be indexed | Approved (4 Nov 2026) |
| D4-07 | **Cookie security.** Every cookie we set uses the `__Host-` prefix with `Secure`, path `/`, no domain, and `HttpOnly` and `SameSite=Lax` as shown in section 9. Pending-add and after-login cookies are signed. There is no anti-forgery cookie. Logout and a confirmed session end keep the language cookie. Names and numeric lifetimes are set in Document 7 | Approved (9 Nov 2026) |
| D4-08 | **Pending add runs once.** The answer that runs it also removes it, so a reload, the back button or a retry cannot run it again. An add whose outcome is unknown is never repeated automatically, and the person is told to check the cart (section 9) | Approved (9 Nov 2026). Changed 11 Nov 2026 (owner approved): no "already used" mark in a store |
| D4-09 | **The New arrivals section of the home page (Document 5, D5-12) shares the home page's cache refresh interval, and cached home-page content is public catalogue data only:** nothing specific to a person or to login. The interval itself is set in Document 7 (Q4-4) | Approved (9 Nov 2026) |
| D4-11 | **No frontend store. Refreshing relies on the backend's 10-second tolerance.** Each server runs at most one refresh per session at a time and shares its result with the requests waiting on that server. Tabs or servers that refresh at the same moment are covered by the backend, which accepts a just-replaced refresh token again within 10 seconds (`docs/api/reference/area-1-accounts.md`, section "1. Login and sessions", refresh). Cookies are set or cleared in the answer to the request itself (section 9). Replaces D4-05, D4-06 and D4-10 | Approved (11 Nov 2026) |

D4-05 to D4-08 were approved by the owner on 9 Nov 2026, as written, and D4-09 on the same date. **D4-05, D4-06 and D4-10 (the frontend's shared store) were withdrawn on 11 Nov 2026 and replaced by D4-11:** the backend already accepts a repeated refresh within 10 seconds, so the store protected nothing the customer would notice. Sections 7 and 9 describe the decisions in detail.

## 3. Layers

The app has these layers. A layer may use only the layer below it, with one exception: server rendering calls the API layer directly (below).

| Layer | Job | May call the backend? |
| --- | --- | --- |
| Pages and routes | Decide what is shown at each address; server rendering | Only through the API layer, when rendering on the server (see below) |
| Screens and features | The screens of each area, their forms and their user flows | No |
| Browser data layer | TanStack Query in the browser; calls the frontend server's own endpoints | No |
| Frontend server endpoints | The plain HTTP endpoints the browser calls. They check login, CSRF and role (Document 2), then call the API layer | Only through the API layer |
| API layer (server only) | The one place that talks to the backend (Document 3) | Yes |

- **All browser data requests use the frontend server's plain HTTP endpoints**, including uploads and streamed requests. (Ordinary page requests and static assets are not data requests and are served as usual.) Framework-specific form-action calls are not used, so reads, changes and streamed uploads all work the same way (Document 3, section 10).
- **Server-rendered pages get their backend data from the server-only API layer directly,** as specified in Document 3, section 3. They do not call our own HTTP endpoints. The **browser** only ever uses the frontend server's HTTP endpoints, and **never calls the backend directly** (D3-03).
- These endpoints sit under one reserved prefix that has no language prefix. They mirror the backend operations grouped by area.
- The backend's address is configuration read only on the server and is never sent to the browser (D3-03).
- Text for screens and our own error messages live in the message catalogue, never inside screens (D-08, D-09).

## 4. Hosting requirements (D4-03)

Because the host is not chosen, the app must meet these, and a host is acceptable only if it does too.

- **A plain Node.js server**, run as one or more identical instances, with no feature specific to one host.
- **Identical instances that share nothing.** Each keeps its own short-lived caches, and refreshing relies on the backend (D4-11), so no store is shared between them.
- **Streaming** of request and response bodies, and a request body limit at least as large as the biggest backend upload (Document 3, section 10).
- **Configuration through environment variables** for each environment (local, staging, production): the backend address, the public site address, and the secret that signs our short-lived cookies. Secrets are never in the repository.
- **Full control of cache headers**, so the rules in Document 2, section 5 can be met and checked.
- **Region** close to India for low delay (D-11).
- **A health check endpoint** for the frontend itself, and a clean shutdown that lets running requests finish.
- **The customer's address** (Document 3, section 3). The host's front door gives each customer's address in a header (named in `CLIENT_ADDRESS_HEADER`), the backend runs with `TRUST_PROXY=true`, and the backend is reachable only from the frontend server, so nobody else can send it an address. Without this, the backend's per-address limits would count every customer as one, and logins would stop after the hourly limit.

## 5. Routes

All paths begin with the language prefix `/{lang}`. This lists areas and the main routes. The screens, and the full route list within each area, are in Document 5.

| Area | Routes | Notes |
| --- | --- | --- |
| Home | `/{lang}` | Indexed |
| Category | `/{lang}/c/{category-slug}` | Indexed. The slug is the backend's category slug |
| Brand | `/{lang}/b/{brand-slug}` | Indexed. The slug is the backend's brand slug |
| Product | `/{lang}/p/{id}/{name}` | Indexed. The first segment is the full id, the second is the readable name |
| Search | `/{lang}/search` | Not indexed |
| Login | `/{lang}/login` | Not indexed |
| Cart | `/{lang}/cart` | Not indexed |
| Customer account | `/{lang}/account/...` | Not indexed |
| Vendor area | `/{lang}/vendor/...` | Not indexed |
| Admin area | `/{lang}/admin/...` | Not indexed |
| Not found, no access, error | Shown in place at the address asked for | Real 404, 403 and 5xx statuses |

**Product addresses (D4-02).**
- **The id is a separate path segment and is passed through unchanged.** Document 3 treats ids as opaque, so the frontend never splits, parses or guesses at an id's format. It is URL-encoded only as needed to sit in a path, decoded on arrival, and used as given for the lookup.
- **The name is only for the URL and the canonical redirect.** It is never used for lookup. A request with the id but no name segment (`/{lang}/p/{id}`) is also redirected to the full address.
- The name part is lower case Latin letters, digits and hyphens made from the title. A title with no such characters (for example one written fully in Hindi) uses a fixed word instead. The title shown on the page is always the vendor's text as written.
- A request whose id is valid but whose name segment is wrong, old or missing is redirected permanently to the correct address.
- A product the backend says does not exist or is not visible shows the not-found page with a real 404 status.

**Category addresses.** The backend's product list accepts a category slug directly, so a category page needs no lookup. If the slug is unknown, the not-found page is shown.

**Brand addresses.**
- *What the backend offers:* the public brand list is paged and has no lookup by slug, and the product list filters brands by id, not slug (`docs/api/reference/area-3a-catalogue.md`, brands and product list). The brand facet on the product list carries slugs, but only for the brands in the current result, so it cannot be used as a lookup.
- *How a slug becomes an id:* the frontend server keeps one **map of brand slug to brand id**, built from the public brand list (all pages, read until the total is reached) and kept in each server's cache with a refresh interval set in Document 7. A brand page request is **one lookup in the map**; the paged list is never scanned per request. Building the map costs one backend request per page of the brand list; that cost is paid once per refresh interval, not on each brand-page request.
- *Unknown slug:* the map is rebuilt once (rebuilds are limited to one in a short period, so repeated unknown slugs cannot hammer the backend), and if the slug is still missing the not-found page is shown. A brand switched off in the backend disappears from the map at its next rebuild.
- *No backend change is proposed.* The current API is enough. This is revisited only if the number of brands grows so large that building the map becomes slow.

## 6. Language

- **Languages:** English (`en`) and Hindi (`hi`) (D-08).
- **A visit with no prefix** (for example the bare site address) goes to a prefixed address by this order: the person's remembered choice, else the browser's language preference, else English. This redirect is never stored in a shared cache.
- **Switching language** keeps the person on the same page and remembers the choice. The choice is saved only when the person acts on the switcher, through a request that is not cached. Prefixed pages never set a cookie and never change with cookies (Document 2, section 5).
- **Each page declares** its language, its address in the other language, and its own preferred address, for search engines.
- **The message catalogue** is one file per language in the repository, with the same keys in both. Document 3 expected its location here; the exact folder and file names are set with the other names in Document 7. It holds screen text and our own error messages (Document 3, section 5). A missing translation falls back to English and is reported by an automated check (Document 7).
- **Vendor-written content** and catalogue names are shown as the backend sends them (D-09).

## 7. Rendering and caching of pages (D-07)

| Page kind | Rendering | Caching |
| --- | --- | --- |
| Home, category, brand, product | On the server, for search visibility and fast first delivery | May be cached and shared, refreshed on an interval. Contains nothing about who is logged in (Document 2, section 5). **The home page's New arrivals section (Document 5, D5-12) is part of the cached home page, uses the same refresh interval, and holds public catalogue data only, never user-specific or login information (D4-09)** |
| Search results | On the server | Public results only may use a shared cache, under the rules below. Not indexed |
| Login, cart, account, vendor, admin | On the server for each request, or in the browser after login | Never stored in a shared cache |

- **Prices and stock on cached pages can be out of date.** Before a person can add an item to the cart, the browser fetches the current price and availability of that item, and the cart is always the authority (Document 3, section 9).
- **The user-specific parts** of public pages (name, cart count) are fetched separately after the page loads (Document 2, section 5).
- How often cached public pages are refreshed is set in Document 7.

**Search and list caching.**
- **Only public, non-personal results may use a shared cache.** The backend's storefront operations return the same result whether or not the caller is logged in (`docs/api/reference/area-3a-catalogue.md`, section "Errors that can happen on any call"), so a shared copy contains nothing about the person. Nothing personal is ever added to a search or list result before it is cached.
- **The cache key contains every input that changes the result,** in one fixed form so equal requests share a copy: the search text (trimmed), the category, brand, size, colour, price range, discount, stock and attribute filters (values sorted), the sort order, the page and the page size. When the whole rendered page is cached, the language is part of the key too. The key never contains cookies, tokens or any person identifier, and the cached response never varies with them (Document 2, section 5).
- **The cache is bounded:** a short life and a limit on the number of entries, so that unlimited different searches cannot fill it. Requests the backend refuses as invalid are not cached. The numbers are set in Document 7.
- **Search suggestions while typing** follow the same rules, with an even shorter life.
- A person's own recent searches, if they are ever kept, are personal data and are never part of a shared cache.

## 8. Search indexing (D4-04)

- Only the pages marked Indexed in section 5 may be indexed. Every other page carries a "do not index" instruction.
- **Filter and sort combinations** of a list point to the plain list address as their preferred address.
- A **sitemap** lists the indexed pages in both languages. A site rules file points to it and keeps search engines out of the endpoints and the login areas.
- Whether pages after the first of a list are indexed is an open question (Q4-2).

## 9. Sessions and cookies (Document 2; D4-07, D4-08, D4-11)

### Cookies (D4-07)

Every cookie our frontend server sets uses the `__Host-` name prefix. The browser then guarantees that the cookie is `Secure`, has no domain (so it is never shared with, or overwritten from, another subdomain), and has the path `/`. This prevents a sibling subdomain or another path from planting or replacing our cookies. Because `__Host-` requires the path `/`, Document 2's "narrowest path that works" means `/` here. These cookies are only read by our server, so being sent with every request to our site is not a concern. Document 2 left the exact cookie names and lifetimes to this document; this document fixes the rules (prefix, attributes, what each holds, relative lifetimes), and the final names after the prefix and the numeric lifetimes are set with the other constants in Document 7.

| Cookie | Holds | Attributes | Lifetime |
| --- | --- | --- | --- |
| Access | The backend access token | `__Host-`, `Secure`, `HttpOnly`, `SameSite=Lax`, path `/`, no domain | No longer than the access token |
| Refresh | The backend refresh token | Same | No longer than the longest refresh-token lifetime in `docs/api/reference/area-1-accounts.md`, section 1. The backend stays the authority: an expired or refused token is handled as "session ended" |
| Pending add | Only the variant and the quantity (Document 2, section 3) | Same, and the value is signed so it cannot be altered | Minutes; set in Document 7 |
| After-login destination | A path inside our own site | Same, and the value is signed. The path is checked again when it is used | Minutes; set in Document 7 |
| Language choice | `en` or `hi` | Same. Set only when the person uses the language switcher (section 6). Not cleared by logout or session end | Long-lived; set in Document 7 |

- `SameSite=Lax` is needed so a person arriving from a link stays logged in and returns from login to where they were. `SameSite=None` is not used.
- **There is no anti-forgery cookie and no anti-forgery token.** A data-changing request must come from our own origin and carry our fixed request header (Document 2, section 6; Document 7, section 17.3).
- **Explicit logout and a confirmed end of session (the backend rejecting the session) clear the authentication cookies (access, refresh) and the temporary-flow cookies (pending add, after-login destination), but keep the language-preference cookie** (Document 2, section 4). The language cookie changes only when the person changes their language, or clears their site data.
- **A request whose refresh fails without a confirmed rejection** (network error, timeout, backend error) **changes no cookie.**
- Running these cookies in local development needs the site served in a way the browser accepts for `Secure` cookies; the setup is in Document 7.

### Refresh (D4-11)

1. A request finds the access token missing, or the backend answers that it has expired.
2. If this server is already refreshing this session, the request waits for that refresh and uses its result. Otherwise it starts one.
3. The frontend server sends the refresh token to the backend once:
   - **Success:** the call is repeated with the new access token, and this answer sets the new access and refresh cookies.
   - **The backend confirms the session is over** (session ended, token reused, account blocked): this answer clears the authentication and temporary-flow cookies, keeps the language cookie, and the person sees Document 2's message.
   - **No clear answer** (timeout, network error, backend error): cookies stay as they are and the person sees "Something went wrong. Please try again." (Document 7, D7-10). The refresh is not repeated in that request.
4. A server-rendered page cannot set cookies. When it finds the access token missing or expired, the browser asks our session endpoint, which refreshes as above and sets the cookies, and the page renders again.

**Why this is enough.** The backend replaces the refresh token on every refresh and treats an old one that comes back as theft, except within 10 seconds of replacing it: then it gives another new token instead (`docs/api/reference/area-1-accounts.md`, section "1. Login and sessions", refresh). That covers two tabs or two servers refreshing at once, and a retry after a lost answer.

**Logout.** The logout endpoint asks the backend to end the session and clears the cookies in its own answer, whether or not the backend request succeeded (Document 2, section 4). A failed backend request is logged without the token.

**Limits we accept (rare; the person logs in again).**
- If the answer carrying new cookies is lost and the browser sends the old refresh token more than 10 seconds later, the backend ends that login.
- A slow answer can overwrite newer cookies: for example, a logout in one tab whose answer arrives after a new login in another tab clears that new login. No extra mechanism is added for this.

### Pending add and after-login destination

Kept in the short-lived signed cookies above. **The pending add runs in one request after login, and the answer to that request removes the pending-add cookie (D4-08),** so a reload, the back button or a retry cannot run it again. If that answer is lost on the way, the cookie could arrive once more and the item could be added a second time; the person sees the quantity in the cart and can change it.

**When the outcome is unknown** (the server fails, or the answer is lost, before the cart request finishes), the add may not have happened. In that case:
- The add is **never repeated automatically**, because repeating it can change the cart a second time (Document 3, section 6).
- The person sees a clear message: the item may not have been added, **please check your cart and add it again if needed**. The cart and its count are reloaded fresh so they see what is really there.
- The app does not promise exactly-once completion. That would need an idempotency mechanism in the backend's cart operations; none is documented, so none is assumed (`docs/api/reference/area-5-sales-cart-coupons.md`).

## 10. Errors and unusual states

- **Not found, no access (403) and error pages** exist in English and Hindi, and return the real status.
- **A browser too old** to run the interactive parts shows a clear message and the basic fallback (D-12). The detection and the browser list are in Document 7.
- Network and server problems on a screen follow Document 3, section 5.

## 11. Backend documentation used (not repeated here)

All paths are in `Meanimehu/Ecommerce`.

- Storefront operations, category and brand slugs, product identifiers, and the fact that storefront results do not depend on login: `docs/api/reference/area-3a-catalogue.md`; shared rules for ids and paging: `docs/api/api-contract.md`, sections 1 and 4.
- Token lifetimes and refresh-token replacement: `docs/api/reference/area-1-accounts.md`, section "1. Login and sessions".
- Upload limits: `docs/api/api-contract.md`, section 6.
- Environments and promotion from staging to production: `docs/design/hld-staging-mvp.md`, section "Staging to production".

## 12. Handled in other documents

- Every screen and the route list inside each area: Document 5.
- Look and feel, error pages' design, and loading states: Document 6.
- Names of folders and files, environment variable names, refresh intervals, all the lifetimes and limits named above, the sitemap, the browser list, local development setup and the automated checks: Document 7.

## 13. Open questions

| # | Question | Settled in |
| --- | --- | --- |
| Q4-1 | Which host to use, chosen against the checklist in section 4 | Deployment time (owner). (The shared store settled on 10 Nov 2026 was removed on 11 Nov 2026, D4-11) |
| Q4-2 | Are pages after the first of an indexed list indexed, and what is their preferred address | Settled — see Document 5 (D5-07) |
| Q4-3 | How the sitemap is built and kept up to date for a large catalogue | Settled — see Document 7 (D7-03, section 6) |
| Q4-4 | Refresh intervals for cached public pages, the size and life of the search cache, and the short lifetimes in section 9 | Approach settled — see Document 7 (D7-04, section 7); the intervals are proposed and provisional until validated |
| Q4-5 | Document 2, section 4 ("Session ended, or the refresh failed") should say that cookies are cleared only on confirmed backend rejection or logout, matching section 9 here. A separate small change to Document 2, if you approve it | Settled — Document 2, section 4 and D2-05 updated 9 Nov 2026 |
