# 8. Roadmap

> **Status: Draft — pending review and approval.** D8-01 and D8-02 were chosen by the owner on 10 Nov 2026. The slices and "done when" lines below are my proposal and have not been reviewed.
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

| Slice | What it delivers | Screens and parts (Document 5) | Needs first | Done when (proposed) |
| --- | --- | --- | --- | --- |
| **0. Setup** | The project can be built, run, tested and checked in every environment | None. The repository structure, environments, the shared store (Document 4, section 4), the automatic checks: generated request types (D7-02), accessibility and size checks, message-catalogue check | Documents 1 to 7 | A blank page deploys to staging, the checks run on every change, and the shared store meets the checklist in Document 4, section 4 |
| **1. Foundations** | What every screen uses | Design tokens and shared components (Document 6, approved Stage 4); the English and Hindi message system; the one API layer on the server (Document 3); **login, sessions and cookies** (Documents 2 and 4, section 9), which is the riskiest part and is built and tested first | Slice 0 | A person can log in by phone code and stay logged in, refresh works safely across more than one server instance, and logout and "log out everywhere" work |
| **2. First path, end to end** | One thin working route through all three areas | Vendor: become a vendor (7.1), add a product with variants and photos, submit (7.3). Admin: approve the vendor, approve the product (8.3, product moderation). Storefront: category list, product page, add to cart, review-only cart (6.1 to 6.3) | Slice 1 | With test data, a vendor applies, an admin approves, the vendor adds and submits a product, a moderator approves it, and a customer finds it, logs in, adds it and sees it in the cart |
| **3. Widen the storefront** | The rest of the customer experience | Home with the hero and New arrivals (D5-12, D5-16, D5-17); brand pages; search with suggestions; filters and sort; account, addresses and security (6.5); error, empty and not-found states | Slice 2 | Every storefront and account screen in Document 5, section 8.1 works in both languages |
| **4. Widen the Vendor area** | The rest of what vendors do | Vendor home (7.2); business profile; stock (7.4); product revisions and rejected products; CSV imports; sales; coupons and coupon requests; read-only states for unapproved vendors (7.5) | Slice 2 | Every Vendor area screen in Document 5, section 8.2 works, including read-only states |
| **5. Widen the Admin area** | The rest of what staff do | Users and roles; audit log; catalogue lists; stock history; sales; coupons; coupon requests; role-based menus, "View only" and "no access" states | Slice 2 | Every Admin area screen in Document 5, section 8.3 works for each role that can read it |
| **6. Launch readiness** | Confidence that it is fit for real customers | See section 6 | Slices 3, 4 and 5 | Every item in section 6 is checked and recorded |

Slices 3, 4 and 5 do not depend on each other, so they can follow in any order or be worked on at the same time. This document does not choose between them.

## 5. Waiting on others

| Item | Who | Affects |
| --- | --- | --- |
| Checkout, orders and payments (Area 6 onwards) | Backend | The step after the cart, order history, vendor order handling. These screens are not designed yet |
| The `canSell` rule (Area 2 Part B), a draft design only | Backend and owner | Needed before Area 6 |
| Pre-launch backend items B1 to B6 (`backend-gap-list.md`) | Backend | Before real customers: database names in errors, one generic "vendor not approved" message, unknown-variant answer, an incomplete OpenAPI description, seed data gaps |
| Hero choice storage (D6-61, T7-8) | Owner | The home hero in Slice 3 shows the text-only fallback until decided |
| Minimum browser versions (Q7-1) | Owner and first build | Build settings in Slice 0 |
| Error monitoring after launch (Q7-2) | Owner | Not needed for the first release (D7-05) |
| Catalogue data for creating products: whether the backend's test data already includes categories, brands, sizes, colours, GST rates and HSN codes (Q8-1) | Backend and owner | Slice 2 |

## 6. Launch readiness (Slice 6)

Nothing below has been done. Each is a check, not a promise.

- **Figures validated** on the real backend, on the agreed budget-device and slow-connection profiles (Document 7, T7-1; Document 6 performance figures, T7-2).
- **Accessibility:** automated checks and the manual keyboard, screen reader, contrast and focus tests for the five core customer journeys (D7-08, T7-6). Contrast of every combination on the approved screens (D6-50).
- **Browsers:** the current Chrome, Safari, Firefox and Edge on Android, iPhone and desktop (D7-09).
- **Real vendor photos** in the 4:5 complete-photo frames (D6-62, T7-7).
- **Request ID** reaching the browser, before the "Copy" button is kept (V5-5, T7-4).
- **Sitemap size and splitting** (T7-5); the **OpenAPI source** matches production (T7-3).
- **Hindi wording** reviewed by someone who writes Hindi.
- **Backend items B1 to B6** closed or accepted by the owner.

## 7. Open questions

| # | Question | Settled in |
| --- | --- | --- |
| Q8-1 | Do the backend's test data and seed already include the catalogue lists needed to create a product, or does Slice 2 also need the admin catalogue screens? | Owner and backend, before Slice 2 |
| Q8-2 | Which of Slices 3, 4 and 5 comes first, or are they worked on together? | Owner, when Slice 2 is done |
| Q8-3 | Is a staging launch (invited vendors and testers) wanted before the real launch? | Owner |

## 8. Backend documentation used

- `docs/api/reference/backend-gap-list.md`: what the backend does not yet do.
- `docs/api/reference/README.md`: the area list.

## 9. Revision history

| Version | Date | Change |
| --- | --- | --- |
| 1 | 10 Nov 2026 | First draft: D8-01 (vertical slices) and D8-02 (no dates) chosen by the owner; slices, dependencies and launch checks proposed |
