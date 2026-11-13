# Frontend documentation

Documentation for the web frontend of the multi-vendor fashion marketplace. Documents are written one at a time and each is approved before the next starts. **[`code-map.md`](code-map.md)** is a plain guide to the code itself: which file does what.

## Rules

- **No duplication of backend information.** The backend documentation is the source of truth for endpoints, request and response details, error codes, validation rules and the database. These documents link to it by file path or section and never copy it. They cover only frontend requirements, architecture, screens, user flows, UI behaviour and implementation.
- Every document is marked **Draft — pending review and approval** until the owner approves it.
- Approved decisions are recorded in the document they belong to. A later document that conflicts with one stops and asks the owner.

## Backend documentation (in `Meanimehu/Ecommerce`, folder `docs/`)

| What you need | Where |
| --- | --- |
| API conventions, roles, error codes | `docs/api/api-contract.md` |
| Every endpoint: request, response, errors, examples | `docs/api/reference/` (start at its `README.md`) |
| What the backend still lacks | `docs/api/reference/backend-gap-list.md` |
| What each area should do | `docs/design/area-design-specs.md` |
| Database | `docs/data/` |

## The documentation set

| # | Document | File | Status |
| --- | --- | --- | --- |
| 1 | Overview and decisions | `01-overview-and-decisions.md` | Approved. Decisions D-01 to D-17 approved; merged 4 Nov 2026 (PR #2) |
| 2 | Login and sessions | `02-login-and-sessions.md` | Approved. Decisions D2-01 to D2-04 approved; merged 4 Nov 2026 (PR #3). D2-05 approved 9 Nov 2026 (cookie clearing). Simplified 11 Nov 2026: no frontend store, simpler forgery protection |
| 3 | API integration | `03-api-integration.md` | Approved. Decisions D3-01 to D3-03 approved; merged 4 Nov 2026 (PR #4); D3-04 approved 10 Nov 2026 |
| 4 | Architecture and routes | `04-architecture-and-routes.md` | Approved. D4-01 to D4-04 approved 4 Nov 2026 and D4-05 to D4-09 approved 9 Nov 2026; merged 4 Nov 2026 (PR #5), with the 9 Nov approval in PR #8; D4-10 approved 10 Nov 2026. 11 Nov 2026: D4-05, D4-06 and D4-10 withdrawn, D4-11 added (no frontend store), D4-08 changed |
| 5 | Screens and flows | `05-screens-and-flows.md` | Approved. Merged 4 Nov 2026 (PR #6, D5-01 to D5-11); 9 Nov 2026 updates D5-12 to D5-17 in PR #7 and the final-decisions PR. Q5-1 deferred, Q5-4 settled; V5-5 open (implementation check) |
| 6 | Design system | `06-design-system.md` | Approved (9 Nov 2026), Stage 3 specification, revision 8 (D6-57 to D6-61: Dhaaga text wordmark, static hero photo chosen by the admin and linking to its product, no View full photo control, banners deferred). Performance figures provisional until validated in Document 7. In PR #7 and the final-decisions PR. Stage 4 (component library) approved 9 Nov 2026; Stage 5 in progress: Storefront approved 9 Nov 2026, Vendor area and Admin area approved 9 Nov 2026; Stage 5 complete, with the checks listed in Document 6 still open |
| 7 | Technical conventions (includes the browser support and testing matrix) | `07-technical-conventions.md` | Approved (9 Nov 2026), merged (PR #17). D7-01 to D7-15 (D7-11 to D7-15 approved 10 Nov 2026; D7-13 changed 11 Nov 2026); section 16 folder layout changed 11 Nov 2026; figures are provisional until validated; open checks T7-1 to T7-9 and questions Q7-1 to Q7-3. **Section 20, the code practices (D7-16 to D7-19), agreed 12 Nov 2026 (PR #37)**; the clean-up rollout and its progress are in 20.13 (13 Nov 2026: steps 1 to 3 merged, `vendor` next) |
| 8 | Roadmap | `08-roadmap.md` | Approved (10 Nov 2026), merged (PR #18). D8-01 (vertical slices), D8-02 (no dates); Q8-1 settled; Q8-2 to Q8-5 open. 12 Nov 2026: working slice by slice (Document 7, D7-19) |

Status here is the approval and merge state, checked against the merged pull requests and each document's decision table. Document headers match this table. The 9 Nov 2026 approvals (Document 4 decisions D4-05 to D4-08, and the headers of Documents 1 to 4) are in PR #8.
