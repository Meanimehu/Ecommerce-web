# 1. Overview and decisions

> **Status: Approved. Decisions D-01 to D-17 approved; merged 4 Nov 2026 (PR #2).**
> Documentation only: no frontend code or project setup exists yet.

## 1. Purpose

This document fixes what the web frontend is, what it covers, the decisions already made, and the rules for writing the rest of the documentation. Later documents must not contradict it; if one needs to, we stop and decide here first.

## 2. What we are building

One web application for an India-first, multi-vendor fashion marketplace, built on the existing backend (repository `Meanimehu/Ecommerce`). One application, three areas:

| Area | Who uses it | Needs login |
| --- | --- | --- |
| **Storefront** | Customers and visitors: browse, search, product pages, cart, own account and addresses | Browsing: no. Cart and account: yes |
| **Vendor area** | Vendors: application and documents, products, stock, sale prices, coupons | Yes |
| **Admin area** | Marketplace staff: users, vendor review, product moderation, catalogue lists, coupons and sales, audit log | Yes |

Roles and what each may do are defined by the backend in `docs/api/api-contract.md`. Which role may open which screen is decided in Document 2 (Login and sessions).

## 3. Approved decisions

| ID | Decision | Status |
| --- | --- | --- |
| D-01 | One Next.js application with React and TypeScript. Storefront, Vendor area and Admin area all live in it | Approved |
| D-02 | TanStack Query for server data and caching | Approved |
| D-03 | Tailwind CSS with shadcn/ui for styling and components | Approved |
| D-04 | React Hook Form with Zod for forms and validation | Approved |
| D-05 | Vitest for unit tests and Playwright for end-to-end tests | Approved |
| D-06 | The frontend lives in its own repository, `Meanimehu/Ecommerce-web` | Approved (confirmed 3 Nov 2026) |
| D-07 | Web only. Storefront pages are rendered on the server for search visibility and fast initial page delivery | Approved |
| D-08 | First release supports **English and Hindi**. The frontend is built for multiple languages from the start (all text kept in one place, not inside screens) | Approved |
| D-09 | Backend text is not shown directly. The frontend maps backend error codes and other machine-readable reasons to its own English and Hindi messages, with a generic fallback for unknown codes. Vendor-written content (titles, descriptions, brand names) is shown as written. Catalogue names (categories, sizes, colours) are shown as the backend sends them; translating them needs backend work later | Approved |
| D-10 | Broad compatibility: Android, iPhone, Windows and Mac; phone, tablet and desktop sizes. Older browsers and devices are not deliberately blocked, and we use graceful fallbacks where practical | Approved |
| D-11 | Performance comes first on budget Android phones and slow connections | Approved |
| D-12 | We do not promise full functionality where the technology stack cannot support it. Basic browsing works almost everywhere; interactive features (cart, login, vendor and admin tools) are guaranteed on the main test browsers and are not deliberately blocked elsewhere. If a browser is too old to run them, the site shows a clear message and a basic fallback instead of a blank page | Approved |
| D-13 | The exact browser support and testing matrix is defined in Document 7 (Conventions), not here | Approved |
| D-14 | No backend changes are needed for the frontend documentation or the first frontend work. Backend changes are made later, when required | Approved |
| D-15 | All prices are shown in Indian rupees (INR) | Approved (4 Nov 2026) |
| D-16 | All dates and times are shown in Indian Standard Time (IST) | Approved (4 Nov 2026) |
| D-17 | The core customer journeys target WCAG 2.2 level AA, where feasible. The journeys covered are listed in Document 5 (Screens and flows) | Approved (4 Nov 2026) |

How D-15 to D-17 are applied (formatting, components, tests) is decided in Documents 6 and 7.

## 4. Scope

**In scope now:** everything the backend already provides for Areas 1 to 5. What exists, and how each endpoint behaves, is in the backend documentation listed in section 5; this document does not repeat it.

**Depends on backend work that is not done.** These are shown in the documents as "future, backend not built" and no screen depends on them yet:

- Checkout, orders and payments (Area 6 onward)
- **Area 2 Part B (`canSell`: bank details, contract terms, onboarding completion)** is a **draft design only: not signed off and not built.** It is defined in `docs/design/area-2-part-b-design-draft.md` in the backend repository and must be built before checkout.
- Returns and refunds; shipping and delivery tracking; vendor payouts; notifications; reviews and ratings; wishlist

**Out of scope for this phase:** a mobile app (web only), frontend code and project setup while we write documentation, and backend changes.

## 5. Sources of truth

All paths are in the backend repository `Meanimehu/Ecommerce`. When sources disagree, the higher one wins:

1. The running backend and its OpenAPI description (how to open it: backend `README.md`).
2. **API reference, Areas 1 to 5:** `docs/api/reference/README.md`, with one page per area. Every endpoint, request, response and error.
3. **API contract:** `docs/api/api-contract.md`. Conventions, roles and error catalogue.
4. Design and data: `docs/design/area-design-specs.md` and `docs/data/`.

**Known backend gaps:** `docs/api/reference/backend-gap-list.md`. For Areas 1 to 5 it lists nothing that blocks the frontend start. Checkout, orders and payments do not exist yet (section 4). Its pre-launch items are tracked there, not here.

We do not invent endpoints, login behaviour or backend features. If a document needs something these sources do not show, we mark it as an open question.

## 6. Language, compatibility and performance (summary)

- **Languages:** English and Hindi in the first release (D-08, D-09). Language selection and URL handling are decided in Document 4.
- **Compatibility:** broad, with graceful fallbacks (D-10 to D-12). The exact browser matrix is in Document 7.
- **Performance:** budget Android phones and slow connections are the reference case (D-11). Targets are set in Document 6.

## 7. Open questions

Not decided yet. Each is settled in the document shown, or earlier by the owner.

| # | Question | Settled in |
| --- | --- | --- |
| Q-1 | Where the frontend is hosted and how it reaches the backend in each environment | Document 4 |
| Q-2 | Analytics and error monitoring: whether and which | Document 7 |
| Q-3 | Which pages must be indexed by search engines | Settled — see Document 4 (D4-04) |

## 8. Working rules

- **No duplication of backend information.** Backend endpoints, request and response details, error codes, validation rules and database structures stay in the backend documentation. Frontend documents link to it by file path or section and cover only frontend requirements, architecture, screens, user flows, UI behaviour and implementation.
- Every document is marked **Draft — pending review and approval** until the owner approves it.
- Documents are written one at a time. Each follows: discuss, clarify, draft, review, revise, approve. The next starts only after explicit approval.
- Nothing is committed, pushed or merged without the owner's explicit approval.
- A later document that conflicts with an approved decision stops and asks the owner; it does not change the decision.
- Documents stay short and practical. Nothing is stated as fact unless the sources support it.

## 9. Repository and files

Documents live in `docs/` of `Meanimehu/Ecommerce-web`, one file per document. The list of documents and their status is kept in one place only: `docs/README.md`.
