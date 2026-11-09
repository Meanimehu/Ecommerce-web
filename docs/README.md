# Frontend documentation

Documentation for the web frontend of the multi-vendor fashion marketplace. Documents are written one at a time and each is approved before the next starts. No frontend code exists yet.

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
| 1 | Overview and decisions | `01-overview-and-decisions.md` | Merged (PR #2, 4 Nov 2026). Decisions D-01 to D-17 approved. The header still says Draft |
| 2 | Login and sessions | `02-login-and-sessions.md` | Merged (PR #3, 4 Nov 2026). Decisions D2-01 to D2-04 approved. The header still says Draft |
| 3 | API integration | `03-api-integration.md` | Merged (PR #4, 4 Nov 2026). Decisions D3-01 to D3-03 approved. The header still says Draft |
| 4 | Architecture and routes | `04-architecture-and-routes.md` | Merged (PR #5, 4 Nov 2026). D4-01 to D4-04 approved; **D4-05 to D4-08 are still proposed, pending owner approval**. The header still says Draft |
| 5 | Screens and flows | `05-screens-and-flows.md` | Approved. Merged 4 Nov 2026 (PR #6, D5-01 to D5-11); 9 Nov 2026 updates D5-12 to D5-15 in PR #7 |
| 6 | Design system | `06-design-system.md` | Approved (9 Nov 2026), Stage 3 specification, in PR #7. Stages 4 and 5 not started |
| 7 | Conventions (includes the browser support and testing matrix) | `07-conventions.md` | Not started |
| 8 | Roadmap | `08-roadmap.md` | Not started |

Status here is the approval and merge state, checked against the merged pull requests and each document's decision table. Documents 1 to 4 were merged on 4 Nov 2026 with their headers still reading "Draft — pending review and approval"; the headers were not changed. Documents 7 and 8 have no file yet.
