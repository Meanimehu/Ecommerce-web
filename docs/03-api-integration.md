# 3. API integration

> **Status: Approved. Decisions D3-01 to D3-03 approved 4 Nov 2026; merged (PR #4).**
> Follows Documents 1 and 2. Documentation only.

## 1. Purpose

How the frontend talks to the backend: where the calls are made, how responses are typed and checked, how errors, retries, money, dates, lists and uploads are handled. It covers frontend behaviour only. Endpoints, request and response fields, validation rules, limits and error codes are in the backend documentation (section 11) and are not repeated here.

## 2. Decisions

| ID | Decision | Status |
| --- | --- | --- |
| D3-01 | **Request types are generated; response shapes are written by hand.** Request types come from the backend's OpenAPI description. Response shapes are written once as Zod schemas, taken from the API reference pages, because the OpenAPI description does not describe responses | Approved (4 Nov 2026) |
| D3-02 | **A response that does not match its schema is strict in tests and development, lenient in production.** Tests and development fail with a clear message. In production the app keeps working with the data it can use, and the mismatch is reported to us | Approved (4 Nov 2026) |
| D3-03 | **All backend calls go through the frontend server, public reads included.** The browser never calls the backend directly. This settles open question Q2-3 of Document 2 | Approved (4 Nov 2026) |

## 3. Where calls are made

- **One API layer, on the server only.** It is the only code that talks to the backend: one typed function per backend operation, grouped by backend area. Screens never build backend requests themselves.
- **Server rendering** (D-07) calls this layer directly.
- **The browser** (TanStack Query, D-02) calls the frontend server's own endpoints, which call this layer. How those endpoints are exposed is decided in Document 4.
- **Tokens** are attached by this layer from the cookies (Document 2). Calls that need no login send no token.
- Because the browser never calls the backend, the app does not depend on the backend's allowed-browser-origin (CORS) setting.
- Each call has a timeout. The values are set in Document 7.

## 4. Typing and checking responses

- **Requests:** types generated from the OpenAPI description. The generated output is not edited by hand. Because the description is switched off in production, it is generated from a development or staging copy (open question Q3-3).
- **Responses:** one Zod schema per response shape, kept in one place per backend area, each pointing to the section of the API reference it was taken from.
- **TypeScript response types are inferred from the Zod schemas** (not written a second time), so a type and its schema can never disagree.
- **Additional fields are ignored.** The backend may add fields without breaking the app. **Missing or invalid required fields are reported** as a mismatch.
- **Mismatch behaviour** follows D3-02. In production:
  - The report includes the endpoint, the request id and the field, and never the data.
  - **Invalid data is never passed to screens as if it were valid, and replacement values are never invented** (for example a missing price is never shown as zero, and a missing name is never replaced by an empty string).
  - The app keeps working with the parts it can safely use. **If a feature cannot safely continue** without the invalid part, the screen shows an appropriate fallback or error state, and actions that depend on that data are not offered.
- **Current backend gaps.** The backend gap list currently documents two issues the app has to work around: error `details` can contain a database constraint name (item B1), and the cart answers an unknown variant like an unavailable one (item B3). For now the app ignores `details.constraint` and does not depend on the wording of that cart answer. These are **current, documented gaps, not permanent requirements**: when the backend fixes them, this paragraph and the app are updated (backend gap list, section 11).

## 5. Errors

- Every failed call becomes one error type carrying the backend's error code, the HTTP status, the request id and any details. The app always decides by the **code**, never by the message text (D-09).
- **Our own messages.** Each code has an English and a Hindi message in the message catalogue; unknown codes fall back to a generic message chosen by the kind of failure (the person's input, their access, a conflict, too many requests, a server problem, the network). The catalogue's location is decided in Document 4.
- **How an error is shown:**
  - Field problems appear next to the fields in the form.
  - Login and session problems follow Document 2.
  - "Too many requests" shows a friendly wait message, using the waiting time the backend gives where it gives one.
  - Server and network problems show a generic message and the **request id**, so a person can quote it to support. A retry action is offered only when it is safe to retry. For a data-changing request with an unknown outcome, the app follows section 6 and reconciles the current state before offering another attempt.
  - Business refusals (for example not enough stock) show their own clear message and keep the person where they are.
- **A check** flags any backend error code that has no message in the catalogue. Its source list is the backend's error catalogue (section 11). Planned in Document 7.

## 6. Retries and repeated submits

- **Automatic retry only for safe reads**, and only after a network failure, a gateway or server error, or "too many requests" (after the wait). A limited number of attempts with growing pauses; the numbers are set in Document 7.
- **Data-changing requests are never repeated automatically**, because repeating some of them (such as adding to the cart) changes the result. This includes the case where **the outcome is unknown** (a lost connection, a timeout, or an unclear answer).
- **When the outcome is unknown, the app reconciles first:** it reloads the current state of the affected data, and only then tells the person what it sees. **It reports the observed current state, and does not claim that the original request succeeded or failed unless that can be established** (the data may have been changed by another action in the meantime). The person decides whether to try again.
- **One submit at a time:** a button that sends a change is disabled while its request is running, and a second tap does nothing.

## 7. Money, dates and phone numbers

- **Money** in the backend's JSON is whole paise, in fields whose names end in `Paise` (API contract, section 1). It is kept and calculated as whole numbers and converted to rupees only for display, with one shared formatting helper (D-15, Indian digit grouping). The app never uses floating-point arithmetic on money.
- **One exception: the bulk product import file** (CSV) uses rupees with up to two decimals, not paise (API reference, Area 3b, the import section). The import screens convert between the two with exact whole-number or text handling and never floating point.
- **Dates and times** in the backend's JSON are ISO 8601 in UTC (API contract, section 1), and requests are sent in the same form. They are shown in IST with one shared helper (D-16). Times people type are IST and converted to UTC before sending.
- **Phone numbers** are sent and shown as the backend documents them. Formatting for display is done by one shared helper.
- **Ids** are treated as opaque text.

## 8. Lists

- The app uses the backend's paging as it is. A page is always requested with an explicit size.
- The data layer supports both numbered pages and "load more"; which one each screen uses is decided in Document 5.
- Filters and search are sent to the backend. The app does not filter or sort full lists itself.
- Storefront lists carry counts for filters (facets). The app shows them as given.

## 9. Caching and freshness (browser data layer)

- **Query keys include the area and the inputs** and never mix data of different people. Logging out, or a change of person, clears all cached data.
- **Server-side caches are isolated.** Any TanStack Query cache on the frontend server that holds user-specific data is created **per incoming request or per user session** and is never shared. No process-wide or global cache may hold one person's data where another person's request could reuse it. Caches shared between people hold public data only (Document 2, section 5).
- **After a change, the data it affects is refetched** (for example cart after a cart change, stock after a stock change, a list after adding to it). Writes do not edit cached data by hand unless Document 5 says a screen needs it.
- **Prices, stock and the cart are always fresh when it matters:** they are refetched when the person opens the cart or before any step that depends on them.
- **How long other data is kept before it is refetched** is set per kind of data in Document 7.
- Caching of server-rendered pages and its refresh interval is decided in Document 4, within the rules in Document 2, section 5.

## 10. Uploads and downloads

- **Files go through the frontend server too** (D2-01, D3-03). Each upload request carries exactly one file, in the field `file`, together with any other form fields that endpoint takes (API contract, section 6). The hosting must allow bodies at least as large as the biggest backend upload limit (Document 4).
- **Large files are streamed** through the frontend server, in both directions, rather than loaded whole into memory. Uploads are passed on to the backend as they arrive, and downloads are passed on to the browser as they come. Buffering a whole file is done only where it cannot be avoided.
- **Quick checks in the browser:** file type and size are checked before upload for fast feedback, from one shared configuration copied from the backend limits (section 11). The backend is always the authority, and the app handles its refusal.
- Uploads show progress, can be cancelled, and are not retried automatically (section 6).
- **Private files** (vendor documents) are downloaded through the frontend server with the person's token, never by a public address.

## 11. Backend documentation used (not repeated here)

All paths are in `Meanimehu/Ecommerce`.

- Shared rules (base path, formats, ids, roles, paging, rate limits, uploads, CORS): `docs/api/api-contract.md`, sections 1, 2, 4, 6 and 7.
- Error shape and how to read it: same file, section 3. Error catalogue: section 11.
- Every endpoint, request, response and error, by area: `docs/api/reference/README.md` and the area pages.
- Known gaps: `docs/api/reference/backend-gap-list.md`.

## 12. Handled in other documents

- Routes, how the frontend server exposes these calls, hosting and body-size limits, the message catalogue's location: Document 4.
- Which screens use which calls, page style per list, field-level error placement: Document 5.
- Error and loading components: Document 6.
- Timeouts, retry numbers, freshness times, the mismatch report, and the automated checks: Document 7.

## 13. Open questions

| # | Question | Settled in |
| --- | --- | --- |
| Q3-1 | Timeout, retry count and pause lengths, and how long each kind of data stays fresh | Document 7 |
| Q3-2 | Numbered pages or "load more" for each list | Document 5 |
| Q3-3 | Where the generated request types come from, given the OpenAPI description is off in production (a stored copy, or generated from a development or staging backend), and how we notice when it changes | Document 7 |
