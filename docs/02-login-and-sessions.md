# 2. Login and sessions

> **Status: Approved. Decisions D2-01 to D2-04 approved 4 Nov 2026; merged (PR #3). D2-05 approved 9 Nov 2026. Simplified 11 Nov 2026 (owner approved): no frontend store for refreshing, simpler forgery protection (section 6), the pending add is removed in the answer that runs it.**
> Follows Document 1 (`01-overview-and-decisions.md`). Documentation only.

## 1. Purpose

How people log in, stay logged in and log out in the web app, and how the three areas (storefront, Vendor area, Admin area) are protected. It covers frontend behaviour only. How login works in the backend, its endpoints, token lifetimes, rules and error codes are in the backend documentation (section 7) and are not repeated here.

## 2. Decisions

| ID | Decision | Status |
| --- | --- | --- |
| D2-01 | **The frontend server holds the login tokens in cookies (a backend-for-frontend design).** After login, the Next.js server sets the backend tokens as `Secure`, `HttpOnly` cookies in the browser, so browser JavaScript cannot read them. On each request the Next.js server reads the cookies and attaches the appropriate token when it calls the backend for the browser. Tokens never appear in URLs, local storage, page scripts or logs. No backend change is needed. Final hosting and deployment details are settled in Document 4 | Approved (4 Nov 2026) |
| D2-02 | **A visitor who taps "Add to cart" while logged out is asked to log in, and the add is then completed automatically**, returning them to the same page. The pending add runs once (the answer that runs it also removes it) and handles changed or unavailable products gracefully (section 3) | Approved (4 Nov 2026). "Runs once" wording changed 11 Nov 2026 (owner approved) |
| D2-03 | **After login a person returns to the page they asked for.** If there is none: customer to the storefront, vendor to the Vendor area, staff to the Admin area. A person with more than one area gets an area switcher | Approved (4 Nov 2026) |
| D2-04 | **One login page for everyone** (customers, vendors and staff). The person's roles decide what they can open | Approved (4 Nov 2026) |
| D2-05 | **Authentication cookies are cleared only on explicit logout, or when the backend confirms that it rejects the session or the refresh.** A network error, a timeout or an unknown outcome never clears them. How this works is in Document 4, section 9 (D4-07, D4-11) | Approved (9 Nov 2026) |

## 3. Login screens and flow

1. **Enter phone number.** Accepts the common ways of writing an Indian mobile number. Mobile-first: numeric keypad, no extra fields.
2. **Enter the code.** One field, numeric keypad, `autocomplete="one-time-code"` so phones can fill it from the SMS. A visible countdown before "Send again", using the waiting time the backend returns rather than a fixed number.
3. **Done.** The person goes where D2-03 says. A first-time user is the same flow: the account is created by the first successful code check.

The login page is light and works without heavy scripts (D-11). Every message shown on this page is our own text in English and Hindi (D-08, D-09). The situations that need a message are: invalid number, wrong code, expired code, too many wrong tries, "wait before asking again", too many requests, SMS could not be sent, and blocked account. The codes behind them are in the backend documentation (section 7).

### The pending "Add to cart" (D2-02)

- **What is kept:** only which product variant and how many, never prices or product details. It is kept briefly, tied to this browser, and discarded if login is not completed.
- **Runs once:** after a successful login it runs in one request, and the answer to that request removes it, so a page reload, the back button or a retry cannot add the item again. If that answer is lost on the way (rare), the item could be added a second time; the person sees the quantity in the cart and can change it. If the add itself fails, it is not retried automatically; the person sees the message and can tap again.
- **Changed or unavailable products:** the add is a normal cart request, so it is checked against the current product, price and stock at that moment. If the product is no longer available, there is not enough stock, or the cart limit is reached, the person lands on the same page with a clear message (our own English and Hindi text) and nothing is added silently. If the price changed, they see the current price in the cart.
- **Other login paths:** a pending add never carries over to a different person or a later login.

## 4. Session behaviour

| Situation | What the app does |
| --- | --- |
| Normal use | The Next.js server reads the cookies and attaches the access token to each backend call. The browser only talks to the frontend server for anything that needs login |
| Access token expired | The frontend server swaps the refresh token for a new pair once, stores the new tokens in the cookies, then repeats the call. The person notices nothing |
| Several requests or tabs refresh at the same time | On one server, only one refresh runs for a session at a time; the other requests wait for it and use its result. Across tabs and servers we rely on the backend: a replaced refresh token that comes back within 10 seconds is accepted as a retry (`docs/api/reference/area-1-accounts.md`, section "1. Login and sessions", refresh). One that comes back later is treated as theft and the session ends; the person logs in again. There is no frontend store for this (Document 4, D4-11) |
| Session ended, or the backend confirms it rejects the session or the refresh | Cookies are cleared in that same answer, the person sees a short "please log in again" message, logs in and returns to where they were |
| A request or refresh that fails without a confirmed backend rejection (network error, timeout, unknown outcome) | Cookies are **not** cleared and the stored login is not removed. The request shows "Something went wrong. Please try again." (Document 7, D7-10) |
| Account blocked | Cookies are cleared and a clear "account blocked, contact support" message is shown instead of the login form's normal flow |
| Logged out in another tab | The next call in this tab ends the session as above |
| Log out | The frontend server asks the backend to end the session, and **clears the cookies even if that request fails** (for example the backend is unreachable). The person always appears logged out in the app. A failed backend request is logged without the token. The account page also offers "log out everywhere" |
| No access to a screen (wrong role) | A "you don't have access" page. Screens a person cannot use are not shown in the menus |

## 5. Protecting the areas

| Area | Not logged in | Logged in |
| --- | --- | --- |
| Public storefront (browse, search, product pages) | Open to everyone. Rendered on the server and may be cached and shared | Same pages. User-specific parts (name, cart count) are filled in separately after the page loads (see below) |
| Cart and customer account | Login page, with D2-02 and D2-03 | Open |
| Vendor area | Login page | Open for vendors; others see the no-access page |
| Admin area | Login page | Open for staff; each screen is limited to the staff roles allowed for it. The role-to-screen map is in Document 5, taken from the backend API contract |

Hiding screens in the app is only for a better experience. The backend decides what is allowed, and the app handles a refusal gracefully.

### No user-specific data in shared caches

- **Shared cached content is the same for everyone.** Public pages that may be cached (in the frontend server, a CDN or any other shared cache) contain no cart count, name, phone, roles, saved addresses or any other account information, **Shared public-page responses must not contain a `Set-Cookie` header, and must not vary based on the logged-in user's cookies.** Personalised information must never enter a shared cache.
- **User-specific information is fetched separately** after the page loads, from a request that identifies the person by their cookies and is never stored in a shared cache (it is sent as private and not cacheable). The page shows a neutral placeholder until it arrives.
- **Anything rendered on the server for a logged-in person** (for example the cart or account pages) is never stored in a shared cache.
- **Cached and logged-in variants are never mixed:** a response must never be reused for a different person, and this is checked by an automated test (planned in Document 7).

## 6. Security requirements

- Tokens are never placed in URLs, local or session storage, logs, or error reports.
- Phone numbers and login codes are never placed in URLs either: the login forms send with POST, so even before the page's scripts have loaded a tap on a button cannot put them in the address (clarified 11 Nov 2026).
- **Cookies:** `Secure` and `HttpOnly` on every login cookie, set for our own site only, with the narrowest path that works. **`SameSite=Lax`** is the default, so a person following a link to our site stays logged in, and cookies are not sent on requests started by other sites (other than ordinary top-level navigation). `SameSite=None` is not used. The exact cookie names and lifetimes are settled in Document 4.
- **Forgery (CSRF) protection for data-changing requests:** the frontend server accepts a data-changing request only if its `Origin` is exactly our own site **and** it carries our fixed request header. Another site cannot add that header to a request to us (the browser refuses unless we allow that site, and we never allow other sites), and `SameSite=Lax` keeps our cookies off requests that other sites start. The rule is the same before and after login. **Safe, read-only requests do not need this**, and must never change data. Details: Document 7, section 17.3 (D7-13). (Changed 11 Nov 2026, owner approved: the earlier session-tied token was removed as unnecessary.)
- The "where to go after login" value is accepted only as a path inside our own site, never a full address (no open redirects). The pending add-to-cart (D2-02) is used once.
- The login page never reveals whether a phone number has an account.
- Staff sessions are shorter than customer sessions in the backend. The app does not extend them.

## 7. Backend documentation used (not repeated here)

All paths are in `Meanimehu/Ecommerce`.

- Login, refresh and logout, token lifetimes: `docs/api/reference/area-1-accounts.md`, section "1. Login and sessions".
- Own profile: same file, section "2. Own profile".
- How tokens are sent, roles, rate limits, CORS and the error catalogue: `docs/api/api-contract.md`.

## 8. Handled in other documents

- How the app calls the API and turns errors into messages: Document 3.
- Routes, the server, hosting, cookie details and how refresh works: Document 4.
- Each login and account screen in detail, and the role-to-screen map: Document 5.
- Component look, input styles and accessibility patterns: Document 6.
- The automated tests for caching, CSRF and the pending add: Document 7.

## 9. Open questions

| # | Question | Settled in |
| --- | --- | --- |
| Q2-1 | After a customer's first login, do we ask for their name and email straight away, or later (for example at checkout)? | Settled — see Document 5 (D5-04) |
| Q2-2 | Do staff sessions need an idle timeout in the app on top of the backend's limits? | Settled — see Document 5 (D5-06) |
| Q2-3 | Which browser calls to the backend, if any, go direct rather than through the frontend server (for example public catalogue reads)? | Settled — see Document 3 (D3-03) |
| Q2-4 | How we keep a half-filled form when a session ends (vendor product forms in particular) | Settled — see Document 5 (D5-05) |
