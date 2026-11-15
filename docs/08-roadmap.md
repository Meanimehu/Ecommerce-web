# 8. Roadmap

> **Status: Approved (10 Nov 2026).** The owner reviewed and approved the document, including D8-01, D8-02, the slices and the Slice 2 clarification. Q8-2 to Q8-5 stay open.
> Follows Documents 1 to 7. Documentation only: no code is written, and no dates are given.

## 1. Purpose

The order in which the frontend is built, what each step depends on, and what has to wait for someone else. Document 5 points here for "order of building the screens". It says **what comes before what**. It does not say how long anything takes.

## 2. Decisions

| ID | Decision | Status |
| --- | --- | --- |
| D8-01 | **Build in vertical slices.** First one thin path that works from end to end (a vendor adds a product, an admin approves it, a customer finds it and puts it in the cart), then widen each area in turn | Approved (10 Nov 2026) |
| D8-02 | **The roadmap shows order and dependencies only.** It has no dates and no time estimates. Dates are added only if the owner provides them as targets | Approved (10 Nov 2026) |

## 3. What the first release includes

Everything in Documents 1 to 7, which means the screens in Document 5 for the storefront, account, Vendor area and Admin area, in English and Hindi. **Not included, because the backend has not built it** (Document 1, section 4; `backend-gap-list.md`): checkout, orders and payments (Area 6 onwards), and the vendor `canSell` rule (Area 2 Part B). The cart is review-only (D5-02).

## 4. The slices

Each slice ends with something that can be tried by a person, not just a list of finished files. A slice is "done" only when its checks in section 6 for that slice are met. No check result is claimed in this document.

**Working slice by slice (agreed by the owner 12 Nov 2026; Document 7, D7-19).** Each slice is finished, cleaned up, tested and reviewed before the next one starts, and clean-up that a slice's work does not need is never mixed into that slice's pull requests. Before Slice 3, the code from Slices 0 to 2 is brought to the code practices in Document 7, section 20. This clean-up changes no behaviour (apart from the storefront addresses agreed in Document 4, D4-02) and adds no feature; its steps and progress are in Document 7, section 20.13.

| Slice | What it delivers | Screens and parts (Document 5) | Needs first | Done when (proposed) |
| --- | --- | --- | --- | --- |
| **0. Setup** | The project can be built, run, tested and checked in every environment | None. The repository structure, environments, the automatic checks: generated request types (D7-02), accessibility and size checks, message-catalogue check | Documents 1 to 7 | A blank page deploys to staging, and the checks run on every change |
| **1. Foundations** | What every screen uses | Design tokens and shared components (Document 6, approved Stage 4); the English and Hindi message system; the one API layer on the server (Document 3); **login, sessions and cookies** (Documents 2 and 4, section 9), which is the riskiest part and is built and tested first | Slice 0 | A person can log in by phone code and stay logged in, refresh works when several tabs or requests renew at once (Document 4, D4-11), and logout and "log out everywhere" work |
| **2. First path, end to end** | One thin working route through all three areas | Vendor: become a vendor (7.1), add a product with variants and photos, submit (7.3). Admin: approve the vendor, approve the product (8.3, product moderation), and **the catalogue lists a product needs: HSN codes, categories, brands, sizes and colours** (8.3, catalogue lists; Q8-1 settled). Storefront: category list, product page, add to cart, review-only cart (6.1 to 6.3) | Slice 1 | With test data, a vendor applies, an admin approves, the vendor adds and submits a product, a moderator approves it, and a customer finds it, logs in, adds it and sees it in the cart |
| **3. Widen the storefront** | The rest of the customer experience | Home with the hero and New arrivals (D5-12, D5-16, D5-17); brand pages; search with suggestions; filters and sort; account, addresses and security (6.5); error, empty and not-found states | Slice 2 | Every storefront and account screen in Document 5, section 8.1 works in both languages |
| **4. Widen the Vendor area** | The rest of what vendors do | Vendor home (7.2); business profile; stock (7.4); product revisions and rejected products; CSV imports; sales; coupons and coupon requests; read-only states for unapproved vendors (7.5) | Slice 2 | Every Vendor area screen in Document 5, section 8.2 works, including read-only states |
| **5. Widen the Admin area** | The rest of what staff do | Users and roles; audit log; catalogue lists; stock history; sales; coupons; coupon requests; role-based menus, "View only" and "no access" states | Slice 2 | Every Admin area screen in Document 5, section 8.3 works for each role that can read it |
| **6. Launch readiness** | Confidence that it is fit for real customers | See section 6 | Slices 3, 4 and 5 | Every item in section 6 is checked and recorded |

**Slice 2 clarification (10 Nov 2026).** Before vendor product submission is tested in staging, the required catalogue entries must be **created and active** in staging: categories, HSN codes, and any brands, sizes and colours the test products use. GST rates are already available, because the backend migration inserts them. The sample-data command does not run on staging, so an admin creates these entries with the catalogue screens in this slice.

**Slice 1 components (11 Nov 2026).** The owner chose to build in Slice 1 only the shared components the existing screens use: buttons, text fields, dialog, banners, skeleton, the error and no-access blocks, the headers. Every other Stage 4 component (chips, product card, tables, toasts, sheets, filters, pickers, the staff side menu) is built in the slice whose screen first needs it, to the approved Stage 4 look. The design tokens and fonts are complete in Slice 1.

**Test photos (10 Nov 2026).** Early layout and API work keeps using the plain coloured photos from the backend's sample data. When Slice 2 approaches, the approved garment illustrations are exported as development image files (at least 500 px on the shorter side) and uploaded through the real vendor upload. They are development stand-ins, are never presented as vendor photos (D6-62), and exist only in local and staging data. Real-photo testing (T7-7) stays open.

**Slice 2 notes (12 Nov 2026, owner decisions).** Recorded with the Slice 2 plan; no approved decision changes.
- **Stock.** The product form has no quantity: stock screens stay in Slice 4 (Document 5, 7.4). A new variant starts with 0 stock (`area-4-inventory.md`), so the Slice 2 end-to-end test sets the quantity by calling the backend directly, not through a screen. On staging a newly added product cannot be put in a cart until Slice 4; existing sample products can.
- **Vendor terms.** Until the owner supplies the real text (Q8-4, Q8-5), the terms step shows a box marked "Demo text — not the real vendor terms", which only says that the real terms will replace it, with the checkbox and the version label the backend sends (`requiredTermsVersion`). No legal wording is written.
- **Photos when testing locally.** The local backend keeps files in memory, so public photo addresses do not load on a developer's computer; pages show the approved "Photo unavailable" state (Document 6, 12.1). Tests check the photo address, not the picture. Staging shows real photos.
- **Four parts.** Slice 2 is built as four reviewed parts in order: 2a vendor application and vendor review; 2b catalogue lists; 2c vendor products and moderation; 2d storefront and cart.

**Slice 3 notes (15 Nov 2026, owner decisions).** Recorded with the Slice 3 plan; no approved decision changes.
- **Folders (Document 7, D7-20).** `storefront` becomes a group of four features: `product-list` (category, brand and search results, New arrivals, filters, sort, "Load more", the product card, the category tree and the brand list), `product-page`, `search` (the header box and its suggestions) and `home` (the hero). `account` is a new feature, outside the group. Pages in `src/app/` put the parts together.
- **Seven parts, one pull request each, in this order:**
  - **3.0** today's `storefront` moves into `product-list` and `product-page`, and the price display into `components/common/`. Nothing a person sees changes; the storefront, cart and layout specs and the page sizes are checked before and after;
  - **3a** filters and sort on the category page;
  - **3b** brand pages and the home page;
  - **3c** search and the storefront header of Document 6, 7.3: the search box with suggestions and the results page, the category row, the compact menu with the language switch, and the footer;
  - **3d** account: profile, addresses, security, the account tabs and the account menu;
  - **3e** the loading, empty, error and not-found states of every storefront and account screen, in both languages, and the check that the slice is done.
- **Filters follow the approved Stage 5 storefront screens:** size, colour, price (from and to, in rupees) and brand, with the counts the backend sends; the brand page has no brand filter. Sort: newest, price low to high, price high to low, and on search results "best match" (the backend's `relevance`). Filters and sort live in the address, with their values in one fixed order. On a narrow screen the filters open as a full-height sheet with "Show N results" at its foot (Document 6, 8.8).
- **Not offered in Slice 3:** filters on product attributes such as fit. The backend can filter on them (`attr.<key>`), but no public call says which attributes and values a customer can pick, so there is nothing to show (section 5). "On sale" and "In stock" are not in the approved screens, so they are not added.
- **The home hero** shows the approved text-only fallback (Document 6, 12.4) with the approved Stage 5 lines, "Browse new arrivals" and "Browse the newest listings.", until the hero photo's storage (T7-8) and the vendor's photo permission are settled. The owner may replace the lines; no claim is added.
- **Brand entries on the home page:** the active brands, by name, up to 100 (one page of the public brand list); revisited if brands grow beyond that.
- **Header (in 3c):** the search box and the top-level categories with products as links, as in Document 6, 7.3 and the approved screens; on compact screens a menu with the language switch and the categories, and the search box on its own row; a footer with the wordmark and the language switch. The compact menu is a native disclosure that opens under the header rather than a side drawer, so it needs no script; scripts stay as few as possible on the storefront. With the header the login page needed more room, so the owner raised the page-size limits (Document 6, section 14: 265 KB without fonts, 307 KB in total for English). The screens also show a "Brands" link and footer links (About, Help, Terms, Privacy); no page exists for any of them, so they are not built (no route or legal text is invented).
- **Lists that read filters are drawn on each request** (a page that reads its query string cannot be kept as a whole). To keep the backend load as before, our server keeps public list answers in a small shared cache (Document 4, section 7): the key is every input in one fixed form, nothing personal, errors not kept, at most 2,000 entries; lists and category pages 60 seconds, search results 30 seconds, suggestions 10 seconds (Document 7, section 12).
- **Testing (Document 7, section 11):** each part has its end-to-end spec against the real backend in Chromium, and every earlier spec runs again before its pull request; the page-size check adds the brand and search pages.
- **Status (15 Nov 2026): every part is built and open for the owner's review.** The pull requests are stacked, each on the one before, and are merged in this order: #56 (this plan), #57 (3.0), #58 (a checkbox fix found on the way), #59 (3a), #60 (3b), #61 (the raised page-size limits), #62 (3c), #63 (3d), #64 (3e). Every screen of Document 5, 8.1 is built and tested in English and Hindi, against the real backend in Chromium, with its loading, empty, error and not-found states.
- **Left open by Slice 3:** the hero photo (T7-8); filters on product attributes (section 5); the "Brands" link and the footer's About, Help, Terms and Privacy links (no pages); an account menu in the header (the account's links are on its Profile tab); the backend tests in CI and the other browsers (Document 7, section 11, postponed).
- **Owner review (15 Nov 2026):** the header's account link (Profile, not a menu) and the public list cache (60 seconds for lists, 30 for search, 10 for suggestions, 10 minutes for the category tree and brand map) are both confirmed as built. Vendor and admin screens do not read this cache; they call the backend directly, so a vendor's or moderator's own screens show the current state without the storefront's delay.

Slices 3, 4 and 5 do not depend on each other, so they can follow in any order or be worked on at the same time. This document does not choose between them.

## 5. Waiting on others

| Item | Who | Affects |
| --- | --- | --- |
| Checkout, orders and payments (Area 6 onwards) | Backend | The step after the cart, order history, vendor order handling. These screens are not designed yet |
| The `canSell` rule (Area 2 Part B), a draft design only | Backend and owner | Needed before Area 6 |
| Pre-launch backend items B1 to B6 (`backend-gap-list.md`) | Backend | Before real customers: database names in errors, one generic "vendor not approved" message, unknown-variant answer, an incomplete OpenAPI description, seed data gaps |
| Hero choice storage (D6-61, T7-8) | Owner | The home hero in Slice 3 shows the text-only fallback until decided |
| Filter values for product attributes (`attr.<key>`) | Backend | Customers cannot filter on attributes such as fit until a public call lists the filterable attributes and their values (Slice 3 notes) |
| Minimum browser versions (Q7-1) | Owner and first build | Build settings in Slice 0 |
| Error monitoring after launch (Q7-2) | Owner | Not needed for the first release (D7-05) |
| Catalogue data on staging: the backend's sample-data command does not run on staging (see section 7, Q8-1), so an admin must create the lists | Admin, using the Slice 2 catalogue screens | Slice 2 |
| Vendor terms text and its Hindi version | Owner | The terms step of the vendor application (Slice 2). The backend sends only a version label (`requiredTermsVersion`), not the text. No legal wording is written by us (Q8-4, Q8-5) |

## 6. Launch readiness (Slice 6)

Nothing below has been done. Each is a check, not a promise.

- **Figures validated** on the real backend, on the agreed budget-device and slow-connection profiles (Document 7, T7-1; Document 6 performance figures, T7-2).
- **Accessibility:** automated checks and the manual keyboard, screen reader, contrast and focus tests for the five core customer journeys (D7-08, T7-6). Contrast of every combination on the approved screens (D6-50).
- **Browsers:** the manual real-browser and real-device checks in D7-11 (the current Chrome, Safari, Firefox and Edge on Android, iPhone and desktop), recorded for each browser and device. The automated tests alone do not count (D7-09, D7-11).
- **Real vendor photos** in the 4:5 complete-photo frames (D6-62, T7-7).
- **Request ID** reaching the browser, before the "Copy" button is kept (V5-5, T7-4): confirmed in the first build on 11 Nov 2026; checked again on staging.
- **Sitemap size and splitting** (T7-5); the **OpenAPI source** matches production (T7-3).
- **Hindi wording** reviewed by someone who writes Hindi.
- **Backend items B1 to B6** closed or accepted by the owner.

## 7. Open questions

| # | Question | Settled in |
| --- | --- | --- |
| Q8-1 | Do the backend's test data already include the catalogue lists needed to create a product? | **Settled (10 Nov 2026), checked in the backend code and docs, see below** |
| Q8-2 | Which of Slices 3, 4 and 5 comes first, or are they worked on together? | Owner, when Slice 2 is done |
| Q8-3 | Is a staging launch (invited vendors and testers) wanted before the real launch? | Owner |
| Q8-4 | The vendor terms text: who supplies it, who approves it, and what is shown on staging until then | Owner, later |
| Q8-5 | Whether the terms also need a Hindi version in the first release | Owner, later |

**Q8-1, what was checked.** Backend repository at its latest `main` (`src/dev-tools/seed-data.ts`, `seed-runner.ts`, `dev-tools-guard.ts`, `personas.ts`, migration `013_create_gst_rates.sql`, `README.md`, `docs/api/reference/area-3a-catalogue.md`, `area-3b-products.md`):
- **Built into every database:** GST rates only (0, 5, 12, 18 and 28 per cent), inserted by a migration.
- **Sample data on a developer's own machine:** the `seed:dev` command creates HSN codes, sizes (S, M, L, XL), six colours, three brands, categories (Men, Women, Shirts, T-Shirts, Trousers, Dresses, Kurtas), two approved vendors, 7 products and test accounts. It runs only when the environment is local or test and the database is on that machine.
- **Staging and production:** the backend code states that staging is deliberately not allowed to run it. So nothing but the GST rates exists there until an admin creates the lists with the admin catalogue endpoints (list, add and change for GST rates, HSN codes, categories, brands, sizes and colours).
- **Why it matters:** a product cannot be submitted without an active category, HSN code and GST rate (`area-3b-products.md`).
- **Result:** during development against a local backend the lists exist. For staging, Slice 2 includes the admin catalogue screens, so an admin can create them. The seeded vendors are already approved, so showing the apply-and-approve step needs a new test account.

## 8. Backend documentation used

- `docs/api/reference/backend-gap-list.md`: what the backend does not yet do.
- `docs/api/reference/README.md`: the area list.
- `docs/api/reference/area-3a-catalogue.md`, `area-3b-products.md`: the catalogue lists and what a product needs.
- Backend code: `src/dev-tools/` (sample data and its guard), `src/database/migrations/sql/013_create_gst_rates.sql`.

## 9. Revision history

| Version | Date | Change |
| --- | --- | --- |
| 1 | 10 Nov 2026 | First draft: D8-01 (vertical slices) and D8-02 (no dates) chosen by the owner; slices, dependencies and launch checks proposed |
| 2 | 10 Nov 2026 | Q8-1 settled after checking the backend code and docs: Slice 2 now includes the admin catalogue screens a product needs |
| 3 | 10 Nov 2026 | Slice 2 clarification added: required catalogue entries must exist and be active in staging before product submission is tested. No decision changed; Q8-2 and Q8-3 stay open |
| 4 | 10 Nov 2026 | Approved by the owner. Q8-2 and Q8-3 stay open |
| 5 | 10 Nov 2026 | Settled with the owner: shared store (D4-10), image exception (D3-04), real-browser checks (D7-11), test-photo approach (Slice 2 note). Vendor terms recorded as open (Q8-4, Q8-5). No approved decision changed |
| 6 | 11 Nov 2026 | Owner approved removing the frontend store (Document 4, D4-11): Slice 0 no longer includes it, and Slice 1's refresh check says what is actually tested |
| 7 | 11 Nov 2026 | Slice 1 components: only those the existing screens use; the rest come with the slice that first needs them (owner decision) |
| 8 | 12 Nov 2026 | Slice 2 notes: no quantity on the product form (stock stays in Slice 4), demo terms text until Q8-4 and Q8-5 are answered, photos when testing locally, and the four parts 2a to 2d (owner decisions) |
| 9 | 12 Nov 2026 | **Agreed by the owner:** working slice by slice (Document 7, D7-19); the code from Slices 0 to 2 is brought to Document 7, section 20 before Slice 3. No other decision changed |
| 10 | 13 Nov 2026 | The clean-up before Slice 3 is described as changing no behaviour and adding no feature, with its progress kept in Document 7, section 20.13 (owner, 13 Nov 2026). No decision changed |
| 11 | 15 Nov 2026 | Slice 3 notes (the header moved into part 3c with search on 15 Nov 2026): the folders (Document 7, D7-20), the seven parts, the filters of the approved screens, what is not offered, the hero text, brand entries, the header, the list cache and testing (owner decisions). Section 5: attribute filter values. No approved decision changed |
| 12 | 15 Nov 2026 | Slice 3 notes: the status (every part built and open for review, the order to merge) and what Slice 3 leaves open. No approved decision changed |
| 13 | 15 Nov 2026 | Owner confirmed the header's account link and the public list cache as built, and that vendor and admin screens read the backend directly, not this cache. No decision changed |
