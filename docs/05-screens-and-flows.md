# 5. Screens and flows

> **Status: Approved (9 Nov 2026).** Storefront addresses use full words (agreed 12 Nov 2026; Document 4, D4-02): `/category/`, `/brand/`, `/product/`.
> Follows Documents 1 to 4. Documentation only. Working file for discussion; changes are made in place.
> **Revision of 9 Nov 2026:** applies the owner's decisions of 9 Nov 2026 (D5-12 to D5-17, and the "Become a vendor" label in D5-10). Nothing else in the approved decisions changes. Document 6 (Design system) records the visual side.

## 1. Purpose

What each screen is for, who can see it, and how the main journeys move from screen to screen. It covers frontend behaviour only. Endpoints, fields, statuses, limits, validation and error codes are in the backend documentation (section 12) and are **not repeated here**; this document points to them by file and section.

Scope, as chosen by the owner:
- **Core detail** for the customer journeys and the vendor product and stock flow (sections 6 and 7).
- **A screen map** (purpose, who, which backend area) for everything else (section 8).

## 2. Decisions

| ID | Decision | Status |
| --- | --- | --- |
| D5-01 | **Detail where the risk is, a map elsewhere.** Customer journeys and the vendor product and stock flow are specified screen by screen. Other screens (vendor sales and coupons, all staff screens) are a map | Approved (4 Nov 2026) |
| D5-02 | **The cart is review-only for now.** The backend has no checkout yet. The cart screen shows the cart and its problems, and a clear note: "Checkout is coming soon". There is no checkout button. This is removed when checkout exists | Approved (4 Nov 2026) |
| D5-03 | **Storefront lists use "load more"; tables use numbered pages.** Product lists (category, brand, search) load more on request. Vendor and admin tables have numbered pages. Settles Q3-2 | Approved (4 Nov 2026) |
| D5-04 | **No prompt for name and email after first login.** They are optional and edited in the profile. Settles Q2-1 | Approved (4 Nov 2026) |
| D5-05 | **A half-filled form survives a session ending, for the same person only.** Details in section 9. Settles Q2-4 | Approved (4 Nov 2026) |
| D5-06 | **No extra idle timeout for staff in the app for now.** The only limits are the backend's session lifetimes (section 4 note). The refresh token slides (12 hours from each refresh), which is neither a total session limit nor a conventional idle timeout; the known behaviour is recorded in section 4 and as V5-1 (known, parked). Settles Q2-2 | Approved (4 Nov 2026) |
| D5-07 | **Home, category, brand and product pages stay indexable, as in D4-04.** For category and brand lists only the first, server-rendered batch of products is guaranteed to be seen by crawlers; "Load more" creates no extra indexable addresses. Search, filter and sort combinations, cart, account, login, vendor and admin stay not indexed (Document 4, section 8). Settles Q4-2 | Approved (4 Nov 2026) |
| D5-08 | **Field errors appear next to the field and in a summary at the top; an error for a field the screen does not know goes to the summary.** Section 10 | Approved (4 Nov 2026) |
| D5-09 | **Journeys 1 to 5 in section 11 are the core customer journeys for the D-17 target (WCAG 2.2 AA, where feasible).** Journey 6 (vendor) is an additional accessibility aim outside that formal target. Usability rules for these journeys are in section 11 | Approved (4 Nov 2026) |
| D5-10 | **"Become a vendor" appears only in the account menu**, not in the storefront header. Settles Q5-3 | Approved (4 Nov 2026). The label was "Become a seller" when approved; the owner changed it to "Become a vendor" on 9 Nov 2026 (Document 6, D6-19 and D6-40). Where the link appears is unchanged |
| D5-11 | **CSV export from vendor and admin tables is out of scope for the first release.** The backend provides paged JSON lists and no CSV export endpoints; the only CSV download it supports is the blank product-import template, which is not an export of vendor or admin data. The frontend does not build CSV exports itself as a workaround. CSV export can be considered later as a separate backend feature. Settles Q5-2 | Approved (4 Nov 2026, explicitly by the owner) |
| D5-12 | **The home page shows entry points to categories and brands, and a New arrivals section** with the newest products from the existing product list sorted by newest (`docs/api/reference/area-3a-catalogue.md`, product list). It shows only what the catalogue sends: no prices, reviews or promotional lines are added, and no content needs a new backend feature. The section has **no "View all" link** until an appropriate route exists. Banners and featured lists stay open (Q5-1). Visual rules: Document 6, sections 7.4 and 12.4 | Approved (9 Nov 2026; Document 6, D6-20 and D6-36) |
| D5-13 | **Saving while a restore offer is unanswered** is handled as set out in section 9 ("Saving while the offer is unanswered") | Approved (9 Nov 2026; Document 6, D6-39) |
| D5-14 | **The request id on an error screen comes with a "Copy" button, and both appear only when the request id is reliably available to the frontend.** Otherwise the message shows without either. The backend's id reaches the browser (V5-5, closed 11 Nov 2026) | Approved (9 Nov 2026; Document 6, D6-38) |
| D5-15 | **Area labels: "Vendor area" and "Admin area".** These are the names of the two staff-facing areas on screen. Route names (`/{lang}/vendor/...`, `/{lang}/admin/...`) and screen names such as "Admin home" are unchanged | Approved (9 Nov 2026; Document 6, D6-19 and D6-37) |
| D5-16 | **The home hero is one static product cover photo from the catalogue**, with no carousel, no rotation and no button until a suitable route exists. **Banners and featured lists are deferred** until the backend offers support for them (Q5-1). Visual rules: Document 6, section 12.4 | Approved (9 Nov 2026; Document 6, D6-58 and D6-60) |
| D5-17 | **Home hero details.** The hero is one static catalogue product photo **chosen by the marketplace admin**, used only where **the vendor's permission is confirmed**. **Clicking the photo opens that product's detail page** (the photo is the link; there is still no hero button). A larger image rendition is used when the frame needs it, kept light for slower connections. Visual rules: Document 6, section 12.4 (D6-61) | Approved (9 Nov 2026) |

D5-05 to D5-09 were explicitly approved by the owner on 4 Nov 2026. D5-10 and D5-11 were also explicitly approved by the owner on 4 Nov 2026. D5-12 to D5-17 were approved by the owner on 9 Nov 2026.

## 3. Screen rules that apply everywhere

- **Every screen has the same four non-normal states**, each with a plain message and a next action: *loading* (a skeleton shaped like the content, not a spinner alone), *empty* (says why and offers the next step), *error* (says what failed, offers "Try again", and shows the request id with a "Copy" button only when the id is reliably available to the frontend: D5-14), and *no access* (Document 2: real 403 for a wrong role, login redirect for no session).
- **Partial failures.** A failure that affects the whole screen (for example the product itself cannot be loaded) uses a full-page error state. A failure of one independent part (for example related products, or the stock summary on a vendor page) shows its error and a "Try again" **inside that part**; the rest of the screen stays usable and is not reloaded.
- **Request id.** The backend sends one with every response (`api-contract.md`, section 1), but the browser talks to the frontend server (D3-03), not the backend. The id is shown **only when it is reliably available to the frontend**, with a **"Copy" button** beside it (D5-14). The frontend server passes the backend's id on to the browser (V5-5, closed 11 Nov 2026). No screen depends on it: when no id is reliably available, the message shows without the id and without the Copy button, and so does a failure with no response at all. The convention is recorded in Document 7, T7-4, so the separate Document 3 clarification proposed earlier is no longer needed.
- **Messages come from the backend's error code, not its text.** The frontend keeps its own English and Hindi message for each code it handles (Document 3), and a general message for any code it does not know.
- **Prices** are shown in rupees from paise using one shared formatter (D-15; Document 3, section 7). A struck-through price is shown only when the backend says so.
- **Stock and availability wording** use the backend's state values and are never worked out from numbers on the screen.
- **Buttons that change data** are disabled while a request is running, so a double click sends once. They keep focus while busy (Document 6, 8.2, owner, 23 Nov 2026). A change whose outcome is unknown is never repeated automatically (Document 3, D3-03); the screen says so and offers a refresh.
- **Tables** (vendor and admin) have numbered pages, the page in the address (`?page=`), a visible total, and keep filters in the address so a link can be shared and the back button works. Tables have **no export action** (D5-11): the backend has no CSV export, and the frontend does not generate exports itself.
- **Language and section:** all addresses follow Document 4, section 5.

## 4. Who sees which area

From the backend roles table (`docs/api/api-contract.md`, section 2), which is the general permission overview. Endpoint-specific permissions are in the relevant area reference (`docs/api/reference/`), which is followed where it is more specific (V5-6, closed: the area references are authoritative). The frontend hides what a role cannot use, but the backend always decides.

| Area | Who can open it | Notes |
| --- | --- | --- |
| Storefront | Everyone | Cart and account need login |
| Vendor application (`/{lang}/vendor/apply`) | **Any logged-in person** | Apply, and later read the application status. This is the only vendor-area route open to someone with no vendor |
| Vendor area (all other `/{lang}/vendor/...`) | A logged-in person who **has a vendor** (any status) | A person with no vendor who opens these is sent to the application page. Access then depends on status. **Approved** vendors use the permitted management screens. For the **application itself**, the backend allows changes in `draft` and `rejected` (and limited changes when approved) and refuses them when `submitted` or `suspended` (`area-2-vendors.md`, statuses). For **products, stock, sales and imports**, changes need an approved vendor, and a vendor of any other status can read but not change (`api-contract.md`, section 2). For **coupons and coupon requests** (`area-5-sales-cart-coupons.md`, vendor coupon sections): reading is open to a vendor of any status; accepting a coupon's terms, and creating, editing, submitting or withdrawing a coupon request, need an approved vendor; **disabling a coupon charged to the vendor (which also declines a pending one) is allowed in any vendor status**. The roles table in `api-contract.md` lists these only as "vendor"; the per-endpoint rules in the area reference are followed here (V5-6, closed: confirmed against the backend code). |
| Admin area | Any staff role | Each admin screen is shown only to the roles that can read it (section 8). A staff user with no allowed screen sees an empty "no access" page |

Staff sessions: the backend gives staff a shorter refresh token (12 hours against 30 days: `area-1-accounts.md`, login section). **Sliding expiry is confirmed:** each refresh issues a new refresh token that lasts 12 hours from that refresh (backend code: `sessions.service.ts`, `rotate` and `insertToken`; `auth.service.ts`, `refreshTtlFor`; also `design/area-design-specs.md`, Area 1, "decided … at every refresh"). This is a limit on the time between refreshes. It is **not a total session limit** and **not a conventional idle timeout**: ordinary requests with a valid access token do not extend it, and this document makes no claim about any other cap or idle rule. **Known behaviour, not being changed (V5-1, parked):** a staff access token lasts 24 hours and the staff refresh token 12 hours, so the backend's session check can end a staff session about 12 hours after the last refresh even while the access token is still valid.

Vendor and staff roles can be held by the same person. The header shows an area switcher listing only the areas that person may enter.

## 5. Navigation shape

- **Storefront header:** the Dhaaga wordmark (text only, Document 6, section 12.3), search box with suggestions, language switch, account menu (login or the person's menu), cart with line count. **"Become a vendor" is in the account menu only** (D5-10), not in the header.
- **Vendor and admin:** a side menu on wide screens that becomes a menu button on narrow ones. The menu lists only screens the person can use. The top bar names the area: "Vendor area" or "Admin area" (D5-15).
- **Breadcrumbs** on category, product, and every vendor or admin screen deeper than the first level.

## 6. Customer journeys (core detail)

### 6.1 Find a product

1. **Home** shows entry points to categories and brands, and a **New arrivals** section with the newest products from the existing product list sorted by newest (`docs/api/reference/area-3a-catalogue.md`, product list; D5-12). It shows only what the catalogue sends; no prices, reviews or promotional lines are added, and no content needs a new backend feature. A failure of the New arrivals section shows its error and "Try again" inside that section only (section 3). The section has **no "View all" link** until an appropriate route exists. The home page also has a hero with one static product cover photo from the catalogue; it does not rotate and has no button, and clicking the photo opens that product's page (D5-16, D5-17). Banners and featured lists are deferred. Visual rules are in Document 6, sections 7.4 and 12.4.
2. **Category and brand pages** show a filter panel, sort, and a product grid with "Load more". Filters and sort are kept in the address. The first batch is rendered on the server (Document 4, section 7); later batches are fetched through the frontend server.
3. **Search** is a box with suggestions as the person types (calls are limited so each keystroke does not send one). Pressing enter opens the search results page, which has the same grid, filters and sort as a category page. A search with no results suggests clearing filters, and links to categories.
4. **Load more behaviour.** Changing a filter or the sort **resets** the loaded batches to the first batch. Filters and sort live in the address. Opening a product and pressing back **restores the same filters, the batches already loaded, and an approximate scroll position** where the browser allows it; if the earlier batches cannot be restored cheaply, the list restarts at the first batch with the filters kept. Each "Load more" tells screen readers how many items were added and keeps focus where it was.
5. **Filters on a narrow screen** open as a full-height panel with "Show N results" at the bottom.

### 6.2 Product page

- Shows photos (first one large, others as a strip), title, brand, price block, variant choice (size and colour), stock message, description, and attributes.
- **Variant choice.** A colour or size combination that does not exist, or is out of stock, is shown as unavailable and cannot be picked. **Unavailable is shown in text** (for example "Out of stock", or a strike-through plus a label), never by colour alone. **What is chosen at the start, and the add button (owner, 23 Nov 2026; replaces "the add button stays disabled until one variant is chosen").** The page opens with the first colour that has stock chosen (or the only colour). A size is never chosen for the person, unless the product has only one, so nobody gets a size they did not pick. "Add to cart" can always be pressed while anything is in stock, and keyboard and screen reader users can reach it. With a choice still to make, a short message under it says what to choose (and is read with the button); pressing it adds nothing and moves focus to that choice. It is off only when nothing, or the chosen variant, is in stock, and the page then says "Out of stock".
- **Price block** shows the sale price and the struck-through price only when the backend sends one. A running sale shows when it ends.
- **Add to cart** by a logged-in person adds the item and updates the cart count, with a status message that is announced to screen readers. It does not navigate away.
- **Add to cart when not logged in** follows the pending-add flow (Document 2, section 3, "The pending Add to cart"; Document 4, section 9): the person goes to login, comes back to this product, and the item is added once.
- **If the product is no longer visible**, the not-found page is shown with a real 404 (Document 4).

### 6.3 Cart (review-only, D5-02)

- Shows lines grouped by vendor, with the quantity control, remove, line total, and a subtotal for each vendor. A totals block shows what the backend sends. **Shipping is shown as "Shipping charges are not calculated yet. Checkout is coming soon."** (the backend reports shipping as not yet calculated; the wording avoids implying checkout is available).
- **Line problems** use the backend's line status. A line that cannot be bought shows a **text label and a plain explanation of the reason** (grey styling is only an extra cue) and offers "Remove". A line wanting more than is left says how many are left and offers to reduce. One action, "Remove unavailable items", clears the lines the backend clears; the screen does not guess which.
- **Coupon preview.** A field to try a code. **The backend decides whether a coupon is applied, and it never stores the code:** it must be sent with every cart view (`area-5-sales-cart-coupons.md`, coupon preview). The cart shows an applied coupon and its effect only when the backend's answer to that request says so. **Approved (4 Nov 2026): the screen keeps the typed code in temporary in-memory state only while the person is on the cart page, sends it with each cart-view request, and discards it when they leave the cart or log out. It is never written to browser storage (local, session or cookie) and is never presented as something the backend remembers.** If the backend no longer applies it, the discount disappears and the screen says so. A code that does not apply is not an error page: the backend's customer message is shown **next to the coupon field**.
- **No checkout button.** In its place, a box: "Checkout is coming soon. Your cart is saved." A person can still change the cart.
- **Cart count in the header** is refreshed after each cart change and when the person returns to the tab.
- **Not logged in:** a logged-out person who opens the cart is sent to login (with an explanation) and returned to the cart afterwards, because the backend cart belongs to a logged-in user. The pending-add flow covers adding first.

### 6.4 Login

- One login page for everyone (D2-04). It asks for a mobile phone number, then the one-time code (login is by phone code only; email is only a profile field). Request and verify rules, limits and the messages for the codes are in `docs/api/reference/area-1-accounts.md`.
- **Code entry:** one field that accepts a pasted code, with `autocomplete="one-time-code"`, a visible "Resend code" button with a countdown shown in text, and "Change number". It never says whether an account exists.
- **After login:** the person returns to the page they wanted (D2-03), or a role default: customer to the storefront home, vendor to the vendor home, staff to the admin home. **No prompt for name or email** (D5-04).

### 6.5 Account

- **Profile:** name and email, both optional (D5-04), changed through the profile endpoint, which edits name and email only (`area-1-accounts.md`, `PATCH /me`). The phone number is shown but not editable.
- **Saved addresses:** list, add, edit, delete, and mark default, as the backend allows (`area-1-accounts.md`). Address forms use the field rules and the pin code check the backend defines; the frontend does not copy those rules, it shows the backend's field errors (section 10).
- **Sessions:** "Log out" and "Log out everywhere", with a confirmation for the second.
- **Orders** do not exist yet. The account menu has no Orders entry until Area 6 is built.

## 7. Vendor flow (core detail): apply, add products, manage stock

### 7.1 Become a vendor (application)

The start page explains what is needed and shows the application's current status. Steps follow the backend's application rules (`docs/api/reference/area-2-vendors.md`).

- **Steps** (one screen each, saved as the person goes): business details, pickup address, documents, review and submit.
- **What is missing** comes from the backend's `missing` list on the application and is shown on the review step as a checklist; each item links to the step that fixes it. The submit button is disabled until the list is empty and the backend is the final judge.
- **Statuses** have a fixed look and message each: *draft*, *submitted* (waiting for review, read-only), *approved* (opens the vendor home), *rejected* (shows the reason, offers to edit and resubmit if the backend allows it), *suspended* (read-only notice; products stay readable).
- **Documents:** upload one file at a time with type and size checks done by the backend; the screen shows the file name, its status, and "Replace". Files are private.

### 7.2 Vendor home

A short list of what needs attention, built only from data the backend already sends: application status and outstanding items, products waiting or rejected, low-stock and out-of-stock counts, coupon requests needing a reply. No chart in the first release.

### 7.3 Products

- **List:** numbered pages, filter by status, search by title, columns for photo, title, status, price range, stock, and last change. A product's status chip uses text as well as colour.
- **Create** is a multi-step form saved as a draft after the first step (`area-3b-products.md`): basics (title, category, brand, description), attributes (the form's fields come from the dictionaries and category data the backend sends), variants (size and colour rows with SKU, MRP and selling price), photos, and review.
- **The `missing` list** from the backend is shown as a checklist on the review step, each item linking to its step. "Submit for review" is disabled until it is empty.
- **Photos:** drag-and-drop and a plain file button (both work with a keyboard); upload progress per file in text; reorder with up/down buttons as well as dragging; set the first photo as the main one. Several files are sent one after another (one file per request: Document 3, section 10). An upload **confirmed failed** offers "Retry" for that file only. If the outcome is **unknown** (for example the connection dropped after sending), the screen first reloads the product's photos to see whether the file arrived, and only then offers Retry if it did not (D3-03). Nothing is repeated blindly.
- **Approved products** are changed through revisions, not directly. The edit screen says so, shows the live version and the pending revision side by side, and the status of the revision.
- **Rejected products** show the moderator's reason at the top, with an "Edit and resubmit" action.
- **Bulk import (CSV):** download the template (the only CSV file the backend provides: a blank example for filling in, not an export of the vendor's data), upload, review the result row by row (errors in a table, with line numbers), then confirm. The confirm step is a separate button; nothing is created before it. **Confirm is not all-or-nothing:** each product is created or skipped on its own, so some may be created while others are skipped; the screen shows the outcome per product (section 11). If the outcome of the confirm is unknown, the screen reloads the import's state and does not confirm again blindly; it describes only what the reloaded state shows (if the import is still unconfirmed and has not expired, confirming again is safe; if it is confirmed, the outcomes are final). A product and its variants are created together or not at all, and the whole confirm is one transaction, so a confirm that fails unexpectedly leaves the import unconfirmed; after an unknown outcome the import's status and per-product outcomes (read again from the backend) give the reliable result, and a second confirm cannot duplicate products (V5-3, closed: `area-3b-products.md`, CSV import; confirmed in the backend code).
- **Pricing and money inputs** take rupees and send paise; the conversion is in one shared place (D-15; Document 3, section 7).

### 7.4 Stock

- **Stock list:** by variant with the available count, the state (*out*, *low*, *in stock*) as text and colour, a threshold, and a filter by state. A summary strip shows counts for each state.
- **Change stock:** set an exact number, or add or remove an amount, each with a note if the backend wants one. The screen shows the result the backend returns, not its own sum.
- **Bulk update by SKU** (up to the backend's limit) through a pasted or typed table. The backend applies it **all or nothing**: if any row is bad, nothing changes and each problem comes back with the row's position and SKU (`area-4-inventory.md`, bulk). The screen marks those rows in the table, in text, and the person fixes them and sends again. After success it shows the stock returned. If the outcome is unknown, the screen reloads current stock and shows what changed; it does not resend the table automatically.
- **History** per variant, in a table with numbered pages.
- **Unapproved or suspended vendors** see stock read-only; all change buttons are hidden and the page says why.

### 7.5 What a vendor sees when they cannot change things

The backend answers a change by an unapproved vendor with an error. The frontend does not wait for that: it uses the application status to hide the change actions and show one banner, and still handles the error if it arrives (the status may have changed since the page loaded).

## 8. Screen map (everything else)

The role column follows `docs/api/api-contract.md`, section 2. "Read" and "change" roles differ for some screens; where they do, both are given.

### 8.1 Storefront and account

| Screen | Route | Purpose | Backend area |
| --- | --- | --- | --- |
| Home | `/{lang}` | Category and brand entry points; New arrivals | 3a |
| Category | `/{lang}/category/{slug}` | Product grid with filters | 3a |
| Brand | `/{lang}/brand/{slug}` | Product grid for one brand | 3a |
| Product | `/{lang}/product/{id}/{name}` | Detail and add to cart | 3a, 5 |
| Search | `/{lang}/search` | Results with filters | 3a |
| Cart | `/{lang}/cart` | Review (D5-02) | 5 |
| Login | `/{lang}/login` | One-time code login | 1 |
| Profile | `/{lang}/account` | Name, email | 1 |
| Addresses | `/{lang}/account/addresses` | Saved addresses | 1 |
| Sessions | `/{lang}/account/security` | Log out, log out everywhere | 1 |

The account menu also holds "Become a vendor" (links to the application page) for a person with no vendor (D5-10).

### 8.2 Vendor area

The application page is open to any logged-in person. Every other row needs a person who has a vendor, and then follows status (section 4): approved vendors can change products, stock, sales and imports; other statuses read where the backend allows. The application and business profile follow the application status rules in section 4.

| Screen | Route | Purpose | Backend area | Change allowed for |
| --- | --- | --- | --- | --- |
| Vendor application | `/{lang}/vendor/apply` | Section 7.1 | 2 | Any logged-in person (own application) |
| Vendor home | `/{lang}/vendor` | Needs-attention list | 2, 3b, 4, 5 | n/a |
| Business profile | `/{lang}/vendor/profile` | Details, addresses, documents | 2 | Per application status (section 4); the backend decides |
| Products (list, add, edit) | `/{lang}/vendor/products`, `/{lang}/vendor/products/add`, `/{lang}/vendor/products/{id}` | Section 7.3 | 3b | Approved vendor |
| Imports | `/{lang}/vendor/imports...` | CSV import | 3b | Upload and confirm: approved vendor. Read and template: any vendor status |
| Stock | `/{lang}/vendor/stock...` | Section 7.4 | 4 | Approved vendor |
| Sales | `/{lang}/vendor/sales...` | Time-boxed sale prices: list, create, cancel. Not editable (cancel and recreate) | 5 | Create and cancel: approved vendor. Read: any vendor status |
| Coupons | `/{lang}/vendor/coupons...` | List coupons that charge the vendor; accept terms; disable (which declines a pending one) | 5 | Read: any vendor status. Accept: approved vendor. Disable: any vendor status |
| Coupon requests | `/{lang}/vendor/coupon-requests...` | Ask for a coupon, track status, edit after changes are requested, submit, withdraw | 5 | Read: any vendor status. Create, edit, submit, withdraw: approved vendor |

### 8.3 Admin area

| Screen | Route | Purpose | Backend area | Read | Change |
| --- | --- | --- | --- | --- | --- |
| Admin home | `/{lang}/admin` | Links to what the role may use | n/a | Any staff | n/a |
| Users and roles | `/{lang}/admin/users...` | Find users, block, grant roles | 1 | admin | admin |
| Audit log | `/{lang}/admin/audit-log` | Who did what | 1 | admin | n/a |
| Vendor review | `/{lang}/admin/vendors...` | Review applications: approve, reject, suspend, unsuspend | 2 | admin | admin |
| Catalogue lists | `/{lang}/admin/catalogue...` | Categories, brands, sizes, colours, GST rates, HSN codes | 3a | admin | admin |
| Product moderation | `/{lang}/admin/moderation...` | Approve or reject submitted products and revisions. Not for the person's own vendor | 3b | moderator, admin | moderator, admin |
| Stock history | `/{lang}/admin/inventory/...` | Read a variant's history | 4 | admin, moderator, support | n/a |
| Sales | `/{lang}/admin/sales` | Read all sales; cancel | 5 | admin, moderator, marketing, finance, support | admin, moderator (cancel) |
| Coupons | `/{lang}/admin/coupons...` | Read; create, change, enable, disable | 5 | admin, marketing, finance, support | admin, marketing |
| Coupon requests | `/{lang}/admin/coupon-requests...` | Read; approve, ask for changes, reject | 5 | admin, marketing, finance, support | admin, marketing |

A moderator sees no coupon screens. A role that can read but not change sees the screen without change buttons and with a short "View only" label.

## 9. Keeping a half-filled form when the session ends (D5-05, settles Q2-4)

**Approved approach (D5-05).**
- The product form and the vendor application are saved as drafts on the backend, step by step (`area-3b-products.md`; `area-2-vendors.md`). Those are the first protection. **The bulk stock update has no backend draft** (it is a single request: `area-4-inventory.md`), so for it the browser copy below is the only protection for rows typed or pasted into the on-screen table.
- For text typed since the last save, the form keeps a **copy in the browser's session storage**, updated after a short pause in typing.
- **Binding.** Each copy is stored under the **signed-in user's id, the form type and the record id** (or "new"). A copy is offered only when all three match the current user and screen. A copy belonging to another account is never offered, shown or used.
- **Allowed content.** Only fields on an explicit allow-list for each form, all non-sensitive text and numbers. Never tokens, one-time codes, file contents, or sensitive data (for example identity or tax document numbers and files, and anything in the login flow). Fields not on the list are not stored.
- **When the session expires.** If the session ends without the person logging out (it expires or is ended), the copy **stays in the open tab** so that after logging in again the form can offer it back. Recovery data is for this case only.
- **Clearing.** The copy is removed on a successful save, on "Discard", on **explicit logout** in that tab, when **"log out everywhere" is started in that tab**, when a different account signs in, when that tab detects that the session was revoked in a way it can recognise (for example a blocked account or detected token reuse), and when the tab closes. **Form data does not survive an explicit logout in the tab where it was done.** The frontend cannot erase session storage in **another tab or on another device**: if "log out everywhere" is started elsewhere, a tab that is still open keeps its copy until it detects the revoked session, or until it is closed. No immediate remote erasure is promised. The backend reports an ended session as `SESSION_ENDED`, which a tab cannot tell apart from an ordinary expiry, so in that case the copy stays; it is offered only to the same signed-in user (see Binding) and still goes when the tab is closed.
- **Saving while the offer is unanswered (D5-13).** Save sends only the values currently on the screen; the unanswered copy is never merged in. Before sending, the screen asks: "You have earlier changes you have not restored. Save without them?" with "Go back" and "Save without them". "Go back" sends nothing and keeps both the offer and the saved copy. "Save without them" saves only the values currently shown; if the save succeeds, the offer is dismissed and the old saved copy is cleared (as in the "Clearing" bullet); if it fails, the offer and the saved copy both stay. When the offer has already been answered with "Restore" or "Discard", there is no question.
- **No automatic restore.** After login the form opens and offers: "We kept your unsaved changes. Restore them?" with "Restore" and "Discard".
- **Newer server data.** If the record on the server was saved after the copy was made, the offer says so and **shows the differences field by field**. The person chooses, per field or all, whether to keep their copy or the server version. Nothing is overwritten silently by the restore itself. **A save is not protected against a change made by someone else in between, except for moderation decisions (V5-4, accepted limitation for the first release):** for vendor products, variants, stock, coupons and addresses the backend uses row locks and status checks, which do not stop a stale edit from replacing newer field values, so the last save wins. The screen does not claim to prevent lost updates. If the backend refuses a save (for example a moderation `REVIEW_STALE`, or a status change: section 15), the screen reloads the latest server data and lets the person resolve the difference, with no silent retry.
- **Photos and documents are never kept** in the recovery copy and must be selected again after the session ends.
- **CSV file contents are never kept** in the recovery copy. If an upload did not complete, the file must be selected again. If it was uploaded and previewed successfully, the saved import preview can be reopened from the imports list until it expires (`area-3b-products.md`, CSV import); the original file does not need to be selected again. "Bulk stock table entry" means rows typed or pasted directly into the on-screen bulk stock table; for it the allow-list is the SKU and quantity of each row.

**Limits, stated plainly.** Session storage is per tab and per browser, and is lost if the tab is closed, the browser clears it, or the person opens the page in a new tab or another device. It is readable by any script running on our pages, which is why the allow-list is small. It is not encrypted. It disappears when the tab closes. If a tab is left open on a shared computer, the copy stays readable until logout in that tab, a recognised session revocation, or closing the tab clears it; logout elsewhere does not erase it immediately. A longer-lived store was rejected for these reasons.

## 10. Field errors (D5-08)

- The backend returns field errors with a field name. Each is shown **directly under its field**, in text, with an icon and colour, and linked to the field (`aria-describedby`; the field is marked invalid).
- A **summary at the top** of the form lists the errors as links that move focus to each field. Focus goes to the summary after a failed submit.
- The frontend checks only for what is cheap and certain (a missing required value, a wrong shape) before sending. Rules about content are the backend's; the frontend does not copy them. If the backend rejects what the frontend accepted, that is an ordinary field error.
- **A field error for a field the screen does not have** (for example a field renamed in the backend) is **not dropped**: it appears in the summary with the backend's field name and the frontend's general wording, and is logged in development and test.
- **Summary accessibility.** The summary is a labelled region that receives focus after a failed submit and is announced to screen readers; each entry is a link reachable by keyboard that moves focus to its field; fields show their error in text tied to the field by `aria-describedby`.
- Errors with no field (for example "the product changed while you were editing") appear in the summary only.
- Messages are the frontend's own for each code and field, in English and Hindi, with the backend's text as the fallback in development only.

## 11. Core journeys for the accessibility target (D5-09)

D-17 sets a WCAG 2.2 AA target, where feasible, for the core customer journeys, and leaves their list to this document. **Journeys 1 to 5 are those customer journeys and are covered by the D-17 target.** **Journey 6 (vendor) is an additional accessibility aim, outside the five customer journeys covered by D-17.** Other screens use the same shared components (Document 6) but have no accessibility target stated here. Whether any of these blocks a release is a decision for Document 7, not made here.

1. Find a product: home, category, filters, load more, search.
2. View a product, choose a variant, add to cart.
3. Login with a one-time code, including the return to the page asked for.
4. Review and change the cart, including problem lines and a coupon code.
5. Manage saved addresses.
6. Vendor (additional aim, not part of the D-17 target): apply, add a product with photos, set stock. Included because a vendor cannot work around an inaccessible form.

**Usability rules that apply to these journeys.**
- Unavailable variants and cart lines are conveyed in text, not colour alone (sections 6.2, 6.3).
- **CSV import** shows the **original line number in the uploaded file** for every row (the backend returns it), and errors against their column. Before confirm the preview says **nothing has been created**. **Confirm is not all-or-nothing:** each product is created or skipped on its own, so after confirm some products may be created and others not (`area-3b-products.md`, confirm). The result is shown **per product**: created or skipped, with the reason. Products are described as created only from the backend's answer or the reloaded import state. If the confirm's outcome is unknown, the screen reloads the import and does not confirm again blindly. A product and its variants are created together or not at all (V5-3, closed). This is separate from bulk stock, below, which is all-or-nothing.
- **Bulk stock update** result: on success, how many variants changed and the stock returned; on failure, the failing rows by **their position in the table and SKU**, with the reason, and a clear statement that **nothing was changed**. There are no "partly saved" or "not processed" rows, because the backend is all or nothing.
- Field-error summaries follow section 10.
- Request ids, with their "Copy" button, are shown only when reliably available to the frontend; no screen depends on one (section 3, D5-14).

The CSV rules above rest on `area-3b-products.md` (CSV import) and the bulk stock rule on `area-4-inventory.md`.

Journey checks (keyboard only, screen reader, 200 percent zoom, narrow screen) are written in Document 7.

## 12. Backend documentation used (not repeated here)

- `docs/api/api-contract.md`: section 2 (roles, who may call what), and the sections on errors, paging and the cart.
- `docs/api/reference/area-1-accounts.md`: login, profile, addresses, users, audit log.
- `docs/api/reference/area-2-vendors.md`: application, documents, review.
- `docs/api/reference/area-3a-catalogue.md`: public catalogue, dictionaries, admin lists.
- `docs/api/reference/area-3b-products.md`: vendor products, variants, photos, revisions, moderation, import.
- `docs/api/reference/area-4-inventory.md`: stock.
- `docs/api/reference/area-5-sales-cart-coupons.md`: sales, cart, coupons, coupon requests.
- `docs/api/reference/backend-gap-list.md`: known gaps (checkout and orders are not built).

## 13. Handled in other documents

- Colours, type, spacing, component look, empty-state and skeleton styling: Document 6.
- Browser matrix, constants, the accessibility checks for the journeys above, form validation limits, retry and freshness times: Document 7.
- Order of building the screens: Document 8.

## 14. Open questions

| # | Question | Where it is settled |
| --- | --- | --- |
| Q5-1 | Banners and featured lists on the home page. The backend offers no promotional content feature. **Deferred (9 Nov 2026, D5-16)** until the backend offers support for them. Entry points, the New arrivals section and the hero are decided (D5-12, D5-16) | Deferred until backend support exists |
| Q5-2 | **Closed (4 Nov 2026, D5-11 approved):** CSV export from vendor and admin tables is out of scope for the first release. Verified in the backend code: no export endpoints exist; the only CSV download is the blank import template (`area-3b-products.md`, CSV import; `import-jobs.controller.ts`, `template`). A later export would be a separate backend feature | Closed |
| V5-1 | **Known behaviour, parked, not being changed.** Staff access token 24 hours; staff refresh token 12 hours with sliding expiry (`area-1-accounts.md`, login and refresh). The backend session check can end a staff session about 12 hours after the last refresh even while the access token is still valid (backend code: `jwt-auth.guard.ts`, `sessions.service.ts`). Login and refresh responses do not return the refresh token's expiry. This document makes no claim about a total session cap or an idle timeout. Revisit in Documents 2 and 4 if staff need to stay logged in while active | Parked; owner decision not to change token lifetimes (4 Nov 2026) |
| V5-2 | **Closed on documentation:** the backend never stores the coupon code; it is sent with each cart view (`area-5-sales-cart-coupons.md`, coupon preview). Section 6.3 records the approved behaviour: the typed code is kept in temporary in-memory state only while the person is on the cart page | Closed |
| V5-3 | **Closed (4 Nov 2026), verified in the backend code.** A product and its variants are created together or not at all; the whole confirm is one transaction; an unexpected failure leaves the import unconfirmed; a second confirm cannot duplicate; the import's status and per-product outcomes give the reliable result after an unknown outcome (`area-3b-products.md`, CSV import; `import-jobs.service.ts`, `confirm` and `tryCreate`) | Closed |
| V5-4 | **Accepted limitation for the first release (4 Nov 2026).** Only moderation has optimistic concurrency (`seenUpdatedAt` → `REVIEW_STALE`: `area-3b-products.md`, moderation). Vendor products, variants, stock, coupons and addresses use row locks and status checks, with last-save-wins on field values and no stale-edit detection. Recording the limitation in the backend documentation and gap list is separate backend work | Accepted; backend documentation to be handled in the backend project |
| V5-5 | **Closed (11 Nov 2026), checked in the first build.** Our server endpoints pass on the backend's `requestId` when they answer with a backend error, and an end-to-end test checks that the browser receives it (Document 7, T7-4). Errors our server decides by itself (for example a request from another site) carry no id, because no made-up number is shown. D5-14 stands: the id and the "Copy" button appear only where a real id is present | Closed |
| V5-6 | **Closed (4 Nov 2026), verified in the backend code.** The area references are authoritative (`area-5-sales-cart-coupons.md`). Reading is open in any vendor status; accepting coupon terms and creating, editing, submitting or withdrawing a coupon request need an approved vendor; disabling a coupon charged to the vendor is intentionally allowed in any vendor status | Closed |
| V5-7 | **Closed (4 Nov 2026), verified in the backend code.** A save refused because the product or revision status changed returns a `409` error code (`PRODUCT_LOCKED`, `PRODUCT_STATE_INVALID`, `REVISION_STATE_INVALID`) without the current status, so the frontend reloads the product to learn it | Closed |
| Q5-4 | **Settled (9 Nov 2026) — see Document 4, section 7 (D4-09).** The New arrivals section shares the home page's cache refresh interval, and cached home content is public catalogue data only | Settled in Document 4 |

## 15. Conflict handling

Cases where the screen shows data that has since changed on the server, with the behaviour confirmed against the backend:
- **Two tabs or two people edit one record** (for example a vendor product, a stock count, an admin coupon or a saved address). **Accepted limitation for the first release (V5-4):** the only stale-write check in the backend is moderation's `seenUpdatedAt` / `REVIEW_STALE`. Elsewhere the backend uses row locks and status checks, which serialise saves and refuse edits in the wrong status but do **not** detect that another save changed the same fields, so the **last save wins** and an earlier change can be lost. The screen shows the backend's answer after each save and never retries a write silently (D3-03). For moderation, the screen sends back the `seenUpdatedAt` it loaded and handles `REVIEW_STALE` by reloading. The section 9 compare-and-choose offer applies to restoring a kept copy, not to detecting another person's edit.
- **A cart line or stock count changes between viewing and acting.** The screen shows the backend's answer after the action, not its own prediction (section 3).
- **A product or revision changes status (for example is approved or rejected) while the vendor is editing.** The backend refuses a save made in the wrong status with a `409` error (`PRODUCT_LOCKED`, `PRODUCT_STATE_INVALID` or `REVISION_STATE_INVALID`) and does not include the current status in the error. The screen therefore **reloads the product (and its revision) and shows the status that returns**, then the vendor chooses as in section 9 (V5-7, closed: confirmed in the backend code).


## 16. Edit checklist (this review round)

| # | Review item | Section changed | State |
| --- | --- | --- | --- |
| 1 | Form recovery bound to user, allow-list, no auto-restore, newer server data, limits | 9 | Done |
| 2 | Application vs vendor-section access | 4, 8.2 | Done |
| 3 | Cart shipping wording, coupon state from backend | 6.3 | Done (V5-2 closed; in-memory coupon behaviour approved) |
| 4 | Load-more reset, restore on back | 6.1 | Done |
| 5 | Partial failures | 3 | Done |
| 6 | Staff timeout wording | 2 (D5-06), 4 | Done (V5-1 known, parked) |
| 7 | Indexing wording | 2 (D5-07) | Done |
| 8 | Unknown field errors | 2 (D5-08), 10 | Done |
| 9 | Accessibility refinements, request-id rule | 3, 6.2, 6.3, 10, 11 | Done (V5-5 open) |
| 10 | Vendor link: account menu only (D5-10), Q5-3 removed (label updated 9 Nov 2026, row 22) | 2, 5, 8.1, 14 | Done |
| 11 | Unresolved conflict handling | 15 | Done (V5-4 accepted limitation) |
| 12 | Second review: D5-07 aligned with D4-04; stale-write promises made conditional on V5-4; unknown-outcome rule for uploads, CSV confirm, bulk stock; D-17 scope wording; request id through frontend server (V5-5) | 2, 3, 7.3, 7.4, 9, 11, 15 | Done |
| 13 | Third review: section 9 "bulk stock table entry" and files-not-kept (incl. CSV files); first bullet corrected (bulk stock has no backend draft); 7.4 and 11 aligned with all-or-nothing bulk stock and per-product CSV outcome; V5-3 updated | 7.4, 9, 11, 14 | Done |
| 14 | Fourth review: login is phone-code only (6.4); Document 2 cross-reference fixed (6.2); profile line (6.5); logged-out cart line (6.3); coupon never stored by backend, keep-while-on-cart (6.3, approved in a later round); CSV confirm is per-product (7.3, 11); one file per upload request (7.3); V5-1 to V5-5 updated with evidence | 6.2, 6.3, 6.4, 6.5, 7.3, 11, 14 | Done |
| 15 | Final review: money cites D-15 not D-13; coupon kept in memory only; CSV partial result and V5-3 limits stated in 7.3 and 11; staff session wording (no idle-timeout claim); vendor access by status in 4 and 8.2; accessibility scope softened; V5-4 and V5-5 moved to section 14 | 3, 4, 6.3, 7.3, 8.2, 11, 14, 15 | Done |
| 16 | Fifth review: accessibility scope split (D5-09, 11); request id shown when available to the frontend (3, 11); coupon and coupon-request access by vendor status (4, 8.2; V5-6); session-expiry recovery vs explicit logout (9); status-change handling without assumed fields (15; V5-7) | 2, 3, 4, 8.2, 9, 11, 14, 15 | Done |
| 17 | Sixth review: roles table is the overview, area references give endpoint-specific rules (4, V5-6 later closed); checklist row 9 status corrected | 4, 16 | Done |
| 18 | Backend verification applied: V5-3, V5-6, V5-7 closed; V5-4 accepted first-release limitation; V5-1 known and parked; V5-5 kept open | 2 (D5-06), 4, 7.3, 9, 11, 14, 15 | Done |
| 19 | Owner approvals applied: D5-05 to D5-09 and the in-memory coupon behaviour approved; duplicated sentence removed in section 4; logout-everywhere limitation (9); vendor journey wording (11); V5-5 kept open | 2, 4, 6.3, 9, 11, 14, 16 | Done |
| 20 | Q5-2 recorded as D5-11 (CSV export out of scope for the first release): section 2, 3, 7.3, 14, 16 | 2, 3, 7.3, 14, 16 | Done; D5-11 approved (4 Nov 2026) |
| 21 | Section 4 staff-session paragraph reconciled: sliding refresh expiry stated as confirmed, distinguished from a total session limit and an idle timeout; D5-06 wording aligned | 2 (D5-06), 4 | Done |
| 22 | Owner decisions of 9 Nov 2026 applied: "Become a vendor" and "vendor" throughout, including the D5-10 label; home New arrivals without a "View all" link (D5-12); unanswered restore offer (D5-13, section 9); request id with a conditional "Copy" button (D5-14, section 3); "Vendor area" and "Admin area" labels (D5-15); V5-5 kept open; Q5-1 amended; Q5-4 added | 2, 3, 4, 5, 6.1, 6.3, 7.1, 8.1 to 8.3, 9, 11, 14, 16 | Done; Document 5 approved 9 Nov 2026 |
| 23 | Open items reviewed on 9 Nov 2026: V5-5 (needs an implementation check), Q5-1 (banners and featured lists) and Q5-4 (Document 4 note) stay open; no new decision was made. "Vendor area" and "Admin area" wording aligned in Documents 1, 2 and 4 | 14, 16 | Done |
| 24 | Final decisions of 9 Nov 2026 applied: home hero is one static product cover photo with no button, banners and featured lists deferred (D5-16, Q5-1); wordmark in the header (5); V5-5 traced and the smallest fix identified, still open; Q5-4 settled (D4-09) | 2, 5, 6.1, 14, 16 | Done; V5-5 open |
| 25 | Hero details (D5-17); V5-5 pointed to Document 7 (T7-4); Q4-3, Q4-4, Q3-1, Q3-3 and Q-2 now answered in Document 7 | 2, 14, 16 | Done; V5-5 open |
| 26 | 13 Nov 2026: the vendor's product addresses written out; the page for adding a product is `/{lang}/vendor/products/add` (owner; Document 7, 20.2 and 20.13 step 6). No decision changed | 8 | Done |
| 27 | 23 Nov 2026 (owner): section 6.2, the first colour in stock is chosen at the start, a size only when there is one, and "Add to cart" can always be pressed while anything is in stock (it moves focus to the choice still to make); section 3, busy buttons keep focus | 3, 6.2 | Done |
