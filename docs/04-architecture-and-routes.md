# 4. Architecture and routes

> **Status: Draft — pending review and approval.**
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
| D4-05 | **Shared-store durability.** Entries that protect against reuse (refresh-token consumed markers, pending-add used marks) need a store that is persistent, never evicts them, keeps them for as long as the protected cookie can arrive, writes them atomically, and carries a generation id so any loss is detected. If these guarantees cannot be confirmed, refreshing stops (section 4) | **Proposed — pending owner approval** |
| D4-06 | **Safe refresh coordination and stale requests.** A refresh token that was, or may have been, used is never sent again. A consumed marker is written before the backend call, and an unknown outcome counts as used. The refresh token never goes into the shared store. A request that cannot safely refresh fails alone, without setting or clearing authentication cookies in its own response; clearing after a confirmed rejection or an explicit logout goes through a separate compare-and-clear step, which narrows but cannot fully remove the delayed-response race (section 9) | **Proposed — pending owner approval** |
| D4-07 | **Cookie security.** Every cookie we set uses the `__Host-` prefix with `Secure`, path `/`, no domain, and `HttpOnly` and `SameSite=Lax` as shown in section 9. Pending-add and after-login cookies are signed. There is no anti-forgery cookie. Logout and a confirmed session end keep the language cookie. Names and numeric lifetimes are set in Document 7 | **Proposed — pending owner approval** |
| D4-08 | **Pending add runs at most once.** The one-time mark guarantees at most once, not completion. An add whose outcome is unknown is never repeated automatically, and the person is told to check the cart (section 9) | **Proposed — pending owner approval** |

D4-05 to D4-08 are **proposals, not approved decisions.** Sections 4 and 9 describe them in detail and would need revising if any is changed or rejected.

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

## 4. Hosting requirements (D4-03, D4-05)

Because the host is not chosen, the app must meet these, and a host is acceptable only if it does too.

- **A plain Node.js server**, run as one or more identical instances, with no feature specific to one host.
- **Stateless instances.** Anything that must be shared between instances goes to the shared store below.
- **A shared store** reachable by all instances, for coordination and shared data (sections 7 and 9). It never holds a refresh token or a password-like secret. The only credential it ever holds is a newly issued access token, encrypted and kept for a few seconds (section 9). Its entries fall into two classes with **different durability needs**, and the store must satisfy both:
  - **Security-critical entries: must not be lost or evicted early.** These are the "consumed" markers of refresh tokens (they stop a used refresh token from ever being sent again) and the "already used" marks of pending adds. Losing one early could let a used token or a one-time action be repeated. The store must therefore provide, for this class:
    - **Persistence:** a write is acknowledged only once it is durable, and entries survive a restart or failover of the store.
    - **No eviction:** these entries are never removed to free memory. When the store is full it **refuses new writes** instead of evicting. Capacity is monitored and an alert is raised well before it is full.
    - **Retention:** each entry lives at least as long as the old cookie it protects could still arrive, plus a safety margin (section 9). It then expires on its own.
    - **Availability:** reachable by every instance, with an atomic "create only if absent" write, so two instances cannot both claim the same token.
    - **Loss detection:** the store carries a permanent *generation id*, created with the store and never expired. **Any loss of security-critical entries, whole or partial** (a failover or restore that may drop acknowledged writes, an eviction or manual deletion, a failed replica), **must either change the generation id, or block refreshing until the loss is detected and a new generation is established.** A surviving generation id is never proof that the markers are intact (section 9).
  - **Disposable entries: may be lost, evicted or short-lived.** These are locks, short-lived refresh results, and cached public data (pages, search results, the brand map). Losing one only costs a repeat of work or a "try again", and never weakens any protection, because the security-critical entries are always checked first. They may live in a separate store or area with ordinary eviction and shorter lifetimes.
  - **If the guarantees for the security-critical class cannot be provided or confirmed, refreshing stops** and the request gets a temporary "try again" answer, with no backend call and no cookie change (fails closed, section 9). Each instance checks the configuration at start-up and regularly (persistence on, eviction off, generation id present). The check list and the automated test are in Document 7.
- **Streaming** of request and response bodies, and a request body limit at least as large as the biggest backend upload (Document 3, section 10).
- **Configuration through environment variables** for each environment (local, staging, production): the backend address, the public site address, and the secrets for cookies and anti-forgery tokens. Secrets are never in the repository.
- **Full control of cache headers**, so the rules in Document 2, section 5 can be met and checked.
- **Region** close to India for low delay (D-11).
- **A health check endpoint** for the frontend itself, and a clean shutdown that lets running requests finish.

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
- *How a slug becomes an id:* the frontend server keeps one **map of brand slug to brand id**, built from the public brand list (all pages, read until the total is reached) and kept in the shared public cache with a refresh interval set in Document 7. A brand page request is **one lookup in the map**; the paged list is never scanned per request. Building the map costs one backend request per page of the brand list; that cost is paid once per refresh interval, not on each brand-page request.
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
| Home, category, brand, product | On the server, for search visibility and fast first delivery | May be cached and shared, refreshed on an interval. Contains nothing about who is logged in (Document 2, section 5) |
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

## 9. Sessions and cookies across instances (Document 2; D4-06 to D4-08)

### Cookies (D4-07)

Every cookie our frontend server sets uses the `__Host-` name prefix. The browser then guarantees that the cookie is `Secure`, has no domain (so it is never shared with, or overwritten from, another subdomain), and has the path `/`. This prevents a sibling subdomain or another path from planting or replacing our cookies. Because `__Host-` requires the path `/`, Document 2's "narrowest path that works" means `/` here. These cookies are only read by our server, so being sent with every request to our site is not a concern. Document 2 left the exact cookie names and lifetimes to this document; this document fixes the rules (prefix, attributes, what each holds, relative lifetimes), and the final names after the prefix and the numeric lifetimes are set with the other constants in Document 7.

| Cookie | Holds | Attributes | Lifetime |
| --- | --- | --- | --- |
| Access | The backend access token | `__Host-`, `Secure`, `HttpOnly`, `SameSite=Lax`, path `/`, no domain | No longer than the access token |
| Refresh | The backend refresh token, and the store's generation id from when it was stored (see "Store generation" below) | Same | No longer than the longest refresh-token lifetime in `docs/api/reference/area-1-accounts.md`, section 1. The backend stays the authority: an expired or refused token is handled as "session ended" |
| Pending add | Only the variant, the quantity and a one-time id (Document 2, section 3) | Same, and the value is signed so it cannot be altered | Minutes; set in Document 7 |
| After-login destination | A path inside our own site | Same, and the value is signed. The path is checked again when it is used | Minutes; set in Document 7 |
| Language choice | `en` or `hi` | Same. Set only when the person uses the language switcher (section 6). Not cleared by logout or session end | Long-lived; set in Document 7 |

- `SameSite=Lax` is needed so a person arriving from a link stays logged in and returns from login to where they were. `SameSite=None` is not used.
- **There is no anti-forgery cookie.** The anti-forgery token is derived on the server from a secret and the person's session. The browser receives it in the response of a read request, keeps it in memory, and sends it in a request header on every data-changing request (Document 2, section 6). Because it is not a cookie, it cannot be sent automatically by another site.
- **Explicit logout and a confirmed end of session (the backend rejecting the session, cleared through compare-and-clear, see "When cookies are cleared") clear the authentication cookies (access, refresh) and the temporary-flow cookies (pending add, after-login destination), but keep the language-preference cookie** (Document 2, section 4). The language cookie changes only when the person changes their language, or clears their site data.
- **A request that merely cannot refresh never clears or sets authentication cookies** (see "Three answers" below).
- Running these cookies in local development needs the site served in a way the browser accepts for `Secure` cookies; the setup is in Document 7.

### Refresh across instances (D4-05, D4-06)

**Rules that never change:**
- **A refresh token that has been replaced, or may have been, is never sent to the backend again.** The app does not use the backend's retry tolerance (see the backend reference for how refresh tokens are replaced).
- **The refresh token never leaves the cookie** and the instance's memory while it is being used. It is never written to the shared store, to logs or to any report.
- Only the instance holding the session's **lock** may refresh.

**What the shared store holds, all keyed by a keyed hash of the refresh token (never the token).** The three kinds have different durability needs (section 4):

| Entry | Class | Durability and lifetime |
| --- | --- | --- |
| **Consumed marker**, written **before** the backend call. From that moment the token counts as used, whatever happens next | **Security-critical** | Persistent, never evicted, written with an atomic "create only if absent" and **acknowledged as durable before the backend is called**. Kept for the longest refresh-token lifetime (`docs/api/reference/area-1-accounts.md`, section 1) plus a safety margin for clock differences, so it outlives any time the old cookie could still arrive. Expires only by this rule |
| **Lock**, taken before a refresh | Disposable | Expires a little after the backend call timeout (Document 7), so a crashed instance cannot block a session for long. If a lock is lost, nothing is weakened: the marker is still checked first, and a second refresh with the same token is refused |
| **Short-lived result**: either a **success** (the new access token, encrypted) or a **confirmed rejection** by the backend. It never contains the new refresh token. An unknown outcome is never stored as a result: it is simply a marker with no result | Disposable | A few seconds (Document 7). If it is lost, a waiting request gets the stale-session answer and never refreshes again |

The keyed-hash secret is kept, even after a change of secret, for as long as the markers made with it can still be needed, so that no marker becomes unfindable.

**Store generation.** The refresh cookie also carries the store's *generation id* from the time its token was stored (section 4). At refresh time, if the store's current generation id has **changed**, markers may have been lost, so every cookie from before the change is treated as possibly consumed: the request gets the stale-session answer (below) and the person logs in again. Cookies issued after the change are not affected. If the id is **missing** (the store has lost its data), the guarantees cannot be confirmed, so refreshing is blocked with the temporary answer until a new generation is established.

**A matching generation id is not enough.** If security-critical markers may have been lost while the id survived (partial loss), refreshing must not proceed. The store, or the procedure that runs it, must then either start a new generation immediately, or hold refreshing blocked until the loss is detected and a new generation is established. Failovers, restores and any deletion or eviction of these entries are covered by this rule.

**Three answers. None of them sets or clears a cookie in its own response.**

| | Temporary "try again" | Stale-session | Session-ended |
| --- | --- | --- | --- |
| When | The shared store is unavailable, or its guarantees cannot currently be confirmed (including suspected partial loss until a new generation is established) | The store's generation id has changed since the cookie was issued, or a consumed marker exists but no usable result is available (including an unknown outcome) | The backend has **confirmed** it rejected the session (session ended, token reused, account blocked), either to this request's own refresh or as a stored rejection result |
| Backend | No call | No call; the used token is never sent | No further call for this token |
| Cookies in this response | Untouched | Untouched | Untouched; cleared afterwards by the compare-and-clear step below |
| What it means | A problem on our side that is expected to pass. The person stays logged in | This refresh token is already used or cannot be trusted | The session is over |
| Person sees | "Something went wrong, please try again shortly" | "Your session changed. Please try again; if it keeps happening, log in again" | "Please log in again" (Document 2, section 4) |

- **Why a response leaves cookies alone:** the browser may already hold newer cookies, from a successful refresh or a newer login. A delayed response from an old request must not clear or overwrite them.
- **A retry may or may not help after a stale-session answer, and the app does not promise it will.** It succeeds only if the browser already holds newer cookies from a successful refresh (for example another tab's refresh finished). If the successful refresh's response never reached the browser, the browser still holds the old refresh cookie. The new refresh token was never stored in the shared store, by design, so it cannot be recovered; retrying cannot work and the person must log in again.
- A new login replaces the old cookies, so a person is never permanently stuck.
- A server-rendered page treats a stale-session or session-ended answer as "not logged in" for that request and sends the person to the login page. For a temporary answer it shows an error state with a real 5xx status and does not send them to login.

**Flow.** The store checks and the marker are always done before any refresh starts.
1. A request finds the access token expired. If the store is unavailable or its guarantees cannot be confirmed, return the **temporary answer** and stop.
2. Compare the generation id in the refresh cookie with the store's. If it has changed, return the **stale-session answer** and stop.
3. **Check the consumed marker** for this token and what is stored with it:
   - **Marker with a successful result:** use the stored new access token for this request only. Do not refresh again, and set no token cookies.
   - **Marker with a confirmed-rejection result:** do not call the backend; return the **session-ended answer**.
   - **Marker with no usable result** (unknown outcome, lost or expired result, crashed holder): the token is treated as **consumed and is never resent**. If a lock shows that a refresh is still running, wait for its result up to a limit (Document 7). If no usable result appears, or no refresh is running, return the **stale-session answer**.
   - **No marker:** continue.
4. Take the lock. If another instance holds it, go back to step 3 after it finishes or the wait limit passes.
5. **Create the marker with the atomic create-if-absent write, and confirm that this call created it and that it is durable.** If the marker already exists, **stop without calling the backend** and handle the request as in step 3. If creation or durability cannot be confirmed, **stop without calling the backend** and return the **temporary answer**.
6. Only now call the backend:
   - **Success:** store the success result and set the new access and refresh cookies **only in this response**.
   - **Confirmed rejection:** store the rejection result and return the **session-ended answer**.
   - **Unknown outcome** (timeout, lost answer): store nothing; the token stays consumed; return the **stale-session answer**.
7. Requests that arrive carrying the old cookies, from other tabs or instances, are handled by step 3: on a success result they use the stored new access token for that one request, **do not set token cookies, and do not refresh**. The browser gets the new cookies from the refreshing request's response.

**When cookies are cleared.** Authentication cookies are cleared only on **explicit logout** or after a **confirmed backend rejection**. A rejection or an explicit logout clears them through the compare-and-clear step below, never in the response of an ordinary request (except the no-script logout fallback described there). In Document 2, section 4 the row "Session ended, or the refresh failed" says "Cookies are cleared", without separating a confirmed rejection from a refresh that could not be attempted safely. This document applies that row to confirmed rejection only, and a refresh that was never made is not a failure of the session. Because the wording is ambiguous, a separate clarification to Document 2 is needed (Q4-5).

**Compare-and-clear (after a session-ended answer or a logout).** The session-ended answer carries a non-secret *session handle* derived from the marker key (never the token). The screen then calls a dedicated endpoint with that handle. At the moment it processes that call, the server compares the handle with the refresh cookie the browser is **currently** sending. If they match, it clears the authentication and temporary-flow cookies (keeping the language cookie). If they differ, or no refresh cookie is sent, it changes nothing, because the browser now holds a newer session. **Explicit logout uses the same step.** The logout call asks the backend to end the session and changes no cookie. The frontend server derives the session handle locally from the refresh cookie, so it is available whether the backend logout request succeeds or fails, and returns it with its logout answer. The frontend always attempts compare-and-clear after the logout request, including when the backend is unavailable or returns an error. Cookie clearing does not depend on the backend accepting or completing the logout request (a failed backend request is logged without the token, Document 2, section 4). This stops a delayed logout response from clearing the cookies of a newer login. Without scripts the compare-and-clear call does not run. After a rejection the unusable cookies then stay until the next login or logout, which is harmless because the backend rejects them. A no-script logout form has to clear the cookies directly in its own response, which cannot be conditional, so that fallback has the full delayed-response race.

**Delayed responses: a limitation that cannot be fully guaranteed.** The browser applies a `Set-Cookie` whenever a response arrives, and the server cannot make that conditional on what the browser holds by then. Compare-and-clear removes the main race, because it checks the browser's current cookies when the call is processed. It cannot close the last gap: a newer login or refresh that completes between that check and the browser applying the clear response (about one request round trip) could still be overwritten. In the same way, a delayed *successful* refresh response could overwrite cookies of a login that completed while it was in flight. **Explicit logout is covered by this limitation too, and its cookie clearing is not race-free:** if a person logs out in one tab and logs in again in another, a delayed logout response (or the clear response of its compare-and-clear call) could still clear the new login's cookies. Compare-and-clear narrows this to the same one-round-trip window; the no-script fallback does not narrow it at all. This design cannot rule these cases out, and this document does not claim it does. **Required resolution before implementation:** Document 7 specifies and tests the compare-and-clear step and the order of cookie writes, and the owner decides either to accept the narrow remaining window, or, for rejections only, to use the simpler alternative of never clearing cookies (unusable cookies stay until the next login or logout), which has no clearing race. Explicit logout has no such alternative, because logging out must remove the cookies, so for logout the owner either accepts the window or Document 7 finds a stronger mechanism. Document 7 covers logout in the same specification and tests. How the handle reaches the login page after a server-rendered redirect, without putting it in the address, is also specified in Document 7.

**Failure behaviour (always fails closed):**

| What happens | What the app does |
| --- | --- |
| The shared store is unavailable | **Temporary answer.** No refresh, no backend call, cookies untouched, the problem is logged. The person is not logged out |
| The store's guarantees cannot be provided or confirmed now (persistence or no-eviction setting wrong or unknown, marker creation not confirmed durable, the store full and refusing writes, the check in Document 7 failing, the store's generation id missing, or possible partial loss while the id survives and no new generation exists yet) | **Temporary answer**, plus an alert to us. Refreshing stays blocked until the guarantees are confirmed, and after a possible loss until a new generation is established. The token is never sent without a confirmed marker |
| The store's generation id has changed since the cookie was issued (markers may have been lost) | **Stale-session answer.** Nothing is sent to the backend and cookies are untouched. Retry cannot refresh these cookies; the person must log in again. Rare, and expected only after a store failure |
| A marker is found for the token with a **successful** result | The stored new access token is used for this request only. No refresh, no backend call, no token cookies set |
| A marker is found for the token with a **confirmed-rejection** result | **Session-ended answer.** No backend call. Cookies are cleared afterwards by compare-and-clear |
| A marker is found for the token, but there is no usable result and no refresh running | **Stale-session answer.** The token is treated as used and is not sent. A retry helps only if the browser already holds newer cookies; otherwise the person must log in again |
| The instance holding the lock crashes after the marker was written | The marker has no result, so the token is treated as used. Later requests with the old cookie get the **stale-session answer**. Unless the browser holds newer cookies, the person must log in again |
| The backend call fails because the connection could not be made at all (the request was certainly never sent) | The token was not used. The marker is removed and a refresh may be tried again. If the marker cannot be removed, or there is any doubt that nothing was sent, the token stays treated as used |
| The backend call times out or the answer is lost (unknown outcome) | The token counts as consumed and is never resent. Nothing is stored as a result. This request gets the **stale-session answer**, and the person must log in again unless the browser holds newer cookies. Cookies are not cleared |
| The backend refuses the refresh (session ended, token reused, account blocked) | A confirmed rejection. The rejection is stored for a few seconds so waiting and later requests get the same **session-ended answer**. Cookies are cleared afterwards by compare-and-clear, and Document 2's behaviour for that case applies |
| A request arrives with an old refresh cookie after the result has expired | The marker says it was used, so it gets the **stale-session answer**. The old token is not sent and cookies are untouched. This happens when the refreshing response never reached the browser, and a retry cannot recover it: the person must log in again |

**Expiry summary:** locks last a little longer than the backend timeout; results last a few seconds; markers last at least as long as the longest refresh-token lifetime plus a margin, and are never evicted earlier. The values are set in Document 7.

### Pending add and after-login destination

Kept in the short-lived signed cookies above. The "already used" mark for the pending add is kept in the shared store, so it can be used only once whichever instance handles the request (Document 2, section 3). It is a **security-critical entry** (section 4): persistent, never evicted, retained at least as long as the pending-add cookie lifetime plus a margin. If it cannot be written or confirmed, the pending add is **not run**; the person lands on the same page with a message and can tap "Add to cart" again.

**At most once, not exactly once (D4-08).** The one-time mark guarantees the add runs **at most once**. It does not guarantee that it completes. If the mark is written but the server fails (or the answer is lost) before the cart request finishes, the add may not have happened, or its result is unknown. In that case:
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
- Names of folders and files, environment variable names, refresh intervals, all the lifetimes and limits named above, the sitemap, the browser list, local development setup, the check list for the shared store's guarantees and the automated checks: Document 7.

## 13. Open questions

| # | Question | Settled in |
| --- | --- | --- |
| Q4-1 | Which host and which shared store to use, chosen against the checklist in section 4 (including the durability guarantees) | Deployment time (owner) |
| Q4-2 | Are pages after the first of an indexed list indexed, and what is their preferred address | Document 5 |
| Q4-3 | How the sitemap is built and kept up to date for a large catalogue | Document 7 |
| Q4-4 | Refresh intervals for cached public pages, the size and life of the search cache, and the short lifetimes in section 9 | Document 7 |
| Q4-5 | Document 2, section 4 ("Session ended, or the refresh failed") should say that cookies are cleared only on confirmed backend rejection or logout, matching section 9 here. A separate small change to Document 2, if you approve it | Separate follow-up, after Doc 4 is approved |
