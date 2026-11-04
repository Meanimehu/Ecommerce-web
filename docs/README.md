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
| 1 | Overview and decisions | `01-overview-and-decisions.md` | Draft — pending review and approval |
| 2 | Login and sessions | `02-login-and-sessions.md` | Not started |
| 3 | API integration | `03-api-integration.md` | Not started |
| 4 | Architecture and routes | `04-architecture-and-routes.md` | Not started |
| 5 | Screens and flows | `05-screens-and-flows.md` | Not started |
| 6 | Design system | `06-design-system.md` | Not started |
| 7 | Conventions (includes the browser support and testing matrix) | `07-conventions.md` | Not started |
| 8 | Roadmap | `08-roadmap.md` | Not started |

Document 1 is not in the repository yet: it is committed here once approved.
