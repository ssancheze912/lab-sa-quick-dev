# Test Design: Epic 2 - Client Management

**Date:** 2026-07-08
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Workflow:** `_bmad/bmm/testarch/test-design` v4.0

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (CRUD + search + sort).

Epic 2 delivers the complete CRUD lifecycle for the `clientes` entity: list & search (Story 2.1), detail view with deep linking (2.2), create (2.3), edit (2.4), delete with cascade-to-null of associated contacts (2.5), and client-side sort integrated with search filter (2.6). This design targets the split-panel view at `/clientes` and `/clientes/:clienteId`, the REST endpoints under `/api/v1/clientes`, and the TanStack Query cache invalidation pattern that guarantees FR27.

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥6): 4 (R-001 SEC error exposure, R-004 DATA cascade-to-null on delete, R-007 OPS EF Core migration for FK ON DELETE SET NULL, R-011 TECH TanStack Query invalidation)
- Critical categories: SEC, DATA, OPS, TECH

**Coverage Summary:**

- P0 scenarios: 18 tests (36 hours)
- P1 scenarios: 22 tests (22 hours)
- P2/P3 scenarios: 26 tests (11 hours)
- **Total effort:** 69 hours (~9 days)

**Test Level Distribution:**

- E2E (Playwright): 14 tests — critical happy paths + deep linking + a11y flows
- API (Playwright request context / xUnit integration): 22 tests — REST contract, validation, uniqueness, cascade
- Component (Vitest + RTL + MSW): 20 tests — forms, list, sort, empty/error states
- Unit (Vitest + xUnit): 10 tests — Zod/FluentValidation edge cases, mapping

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                                                                                     | Probability | Impact | Score | Mitigation                                                                                                                                    | Owner  | Timeline |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| R-001   | SEC      | Backend leaks stack traces or internal error details on 409/500 responses, violating NFR6                                       | 2           | 3      | 6     | Enforce `ExceptionHandlingMiddleware` producing RFC 7807 Problem Details; add API test asserting no `stackTrace`/`exception` fields in body   | BE Dev | Story 2.3 |
| R-004   | DATA     | Deleting a client cascades incorrectly and destroys contact rows instead of setting `cliente_id = NULL` (breaks FR25, Story 2.5) | 2           | 3      | 6     | EF Core FK config `OnDelete(DeleteBehavior.SetNull)` verified via migration test + integration test that reads contacts after client deletion  | BE Dev | Story 2.5 |
| R-007   | OPS      | EF Core migration for `fk_contactos_clientes ON DELETE SET NULL` missing or reverted, silently breaking Story 2.5 across envs   | 2           | 3      | 6     | Migration test asserts constraint exists with `SET NULL` action; CI runs `dotnet ef database update` on clean DB before integration suite      | BE Dev | Story 2.5 |
| R-011   | TECH     | Mutation success path forgets `queryClient.invalidateQueries(['clientes'])`, causing stale list after create/edit/delete (FR27) | 3           | 2      | 6     | Component test with MSW verifies list refetch after each mutation; E2E smoke asserts new client appears immediately without page reload      | FE Dev | Story 2.3 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                                                                                                     | Probability | Impact | Score | Mitigation                                                                                                                       | Owner  |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| R-002   | SEC      | Duplicate NIT/RUC returns raw DB error instead of user-friendly 409 "El NIT/RUC ya está registrado" (Story 2.3)                 | 2           | 2      | 4     | FluentValidation + explicit uniqueness check in handler; API test asserts 409 payload; component test asserts inline error text  | BE+FE  |
| R-003   | PERF     | Search over 500 records exceeds NFR1 (<1s) because filter recomputes on every keystroke without memoization                    | 2           | 2      | 4     | Use `useMemo` + debounce ≥150ms; component test asserts filter latency <100ms on 500-item fixture; Playwright measures type→render <1s | FE Dev |
| R-005   | DATA     | Optimistic update rollback broken: on 4xx/5xx the UI shows the phantom-created client (violates FR27 consistency)               | 2           | 2      | 4     | Mutation `onError` restores previous cache via `context.previousData`; MSW test simulates 500 and asserts list restored          | FE Dev |
| R-006   | BUS      | Zod (FE) and FluentValidation (BE) drift → FE accepts input that BE rejects, causing confusing errors (FR8)                     | 2           | 2      | 4     | Shared contract fixture with same required-field matrix used by both suites; contract test in `e2e/tests/api` covers each field | QA Lead |
| R-008   | TECH     | Sort operation triggers new API call instead of client-side reorder over cache, breaking Story 2.6 explicit requirement          | 2           | 2      | 4     | Component test spies on `fetch`/MSW and asserts zero network calls when sort changes; only `queryClient.getQueryData` is used     | FE Dev |
| R-009   | BUS      | Sort clears active search filter or vice versa, degrading UX (AC-E2.6 explicit)                                                 | 2           | 2      | 4     | Component test: type search → apply sort → assert both filter and sort applied on same result set                                | FE Dev |
| R-010   | OPS      | CORS misconfig on `/api/v1/clientes` blocks frontend at deploy time in non-local env (NFR4 HTTPS + CORS)                        | 1           | 3      | 3     | Playwright API test hits backend from origin `http://localhost:5173`; asserts `Access-Control-Allow-Origin` header present       | DevOps |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                                                                                    | Probability | Impact | Score | Action                                                                    |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ----- | ------------------------------------------------------------------------- |
| R-012   | BUS      | Toast copy in English instead of Spanish (violates architecture P0 mandate on Spanish UI text)                 | 1           | 2      | 2     | Component test asserts exact Spanish string `"Cliente creado correctamente"` |

### Risk Category Legend

- **TECH**: Technical/Architecture (TanStack Query invalidation, adapter wiring, SPA integrity)
- **SEC**: Security (error exposure NFR6, input sanitization NFR5, HTTPS NFR4)
- **PERF**: Performance (NFR1 search <1s, NFR2 CRUD <2s)
- **DATA**: Data Integrity (FK cascade, orphan contacts FR25, optimistic rollback)
- **BUS**: Business Impact (validation drift, Spanish copy, sort+filter UX)
- **OPS**: Operations (migrations, CORS, deployment gates)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria:** Blocks core journey + High risk (≥6) + No workaround

| Story | Requirement                                                                        | Test Level | Risk Link | Test Count | Owner | Notes                                                                                    |
| ----- | ---------------------------------------------------------------------------------- | ---------- | --------- | ---------- | ----- | ---------------------------------------------------------------------------------------- |
| 2.1   | List renders all clients on `/clientes`; empty state shown when zero rows           | E2E        | R-011     | 2          | QA    | Happy path + empty state — smoke                                                         |
| 2.1   | Backend failure shows `ErrorPanel` with "Reintentar" (retry refetches)             | E2E + Comp | R-011     | 2          | QA    | MSW returns 500 for component test; Playwright route abort for E2E                       |
| 2.3   | Create client with all required fields → appears in list immediately (FR27, NFR2)   | E2E        | R-011     | 1          | QA    | Assert row visible without page reload                                                   |
| 2.3   | Duplicate NIT/RUC → 409 with Spanish message, no DB details leaked (NFR6)          | API        | R-001, R-002 | 2       | BE    | Assert Problem Details `title`+`detail`; assert no `stackTrace`/`exception` keys         |
| 2.3   | Required-field validation blocks submit + inline errors (FR8)                       | Comp       | R-006     | 2          | FE    | React Hook Form + Zod — one test per required field                                      |
| 2.4   | Edit existing client → changes reflected in list & detail (FR6, FR27)               | E2E        | R-011     | 1          | QA    |                                                                                          |
| 2.5   | Delete client with associated contacts → contacts become `clienteId = null` (FR25)  | API        | R-004     | 2          | BE    | Integration test seeds client+contacts, DELETE client, GET contacts asserts `null` FK    |
| 2.5   | Delete confirmation dialog gates destructive action (cancel keeps record)          | E2E        | R-004     | 1          | QA    |                                                                                          |
| 2.5   | EF Core migration produces FK with `ON DELETE SET NULL`                            | Unit (BE)  | R-007     | 1          | BE    | `MigrationTests` asserts constraint action via `information_schema`                       |
| 2.6   | Sort changes reorder in-memory without network request                              | Comp       | R-008     | 2          | FE    | Spy on MSW handler call count                                                            |
| 2.6   | Sort + active search work together (AC-E2.6)                                        | Comp       | R-009     | 2          | FE    | Type search → change sort → assert both applied                                          |

**Total P0:** 18 tests, 36 hours (2 hrs/test — includes fixtures, factories, adapter wiring)

### P1 (High) - Run on PR to main

**Criteria:** Important features + Medium risk (3-4) + Common workflows

| Story | Requirement                                                                                       | Test Level | Risk Link | Test Count | Owner | Notes                                                                     |
| ----- | ------------------------------------------------------------------------------------------------- | ---------- | --------- | ---------- | ----- | ------------------------------------------------------------------------- |
| 2.1   | Search by Nombre filters list; search by NIT/RUC filters list; case-insensitive                    | Comp       | R-003     | 3          | FE    | One test per field + one for case                                         |
| 2.1   | Search over 500-item fixture renders in <1s (NFR1)                                                 | E2E        | R-003     | 1          | QA    | Playwright `performance.now()` around type → visible                     |
| 2.2   | Deep link `/clientes/:clienteId` loads correct client (FR30)                                       | E2E        | -         | 1          | QA    |                                                                           |
| 2.2   | Unknown clienteId shows graceful not-found message                                                 | Comp       | -         | 1          | FE    |                                                                           |
| 2.2   | Selecting client from list updates URL to `/clientes/:clienteId`                                   | E2E        | -         | 1          | QA    |                                                                           |
| 2.3   | Toast "Cliente creado correctamente" (Spanish) after successful create                             | Comp       | R-012     | 1          | FE    | Exact string assertion                                                    |
| 2.3   | Optimistic UI rollback on 500 (client disappears after failure)                                    | Comp       | R-005     | 1          | FE    | MSW returns 500; assert cache restored                                    |
| 2.4   | Form pre-fills with current values on edit                                                         | Comp       | -         | 1          | FE    |                                                                           |
| 2.4   | Cancel without saving leaves data unchanged                                                        | Comp       | -         | 1          | FE    |                                                                           |
| 2.4   | Clearing a required field on edit blocks submit + shows inline error                               | Comp       | R-006     | 1          | FE    |                                                                           |
| 2.4   | Toast "Cliente actualizado correctamente" after update                                             | Comp       | R-012     | 1          | FE    |                                                                           |
| 2.5   | Toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." variant         | Comp       | R-012     | 1          | FE    | Verify variant when associated contacts existed                           |
| 2.5   | Right panel returns to empty/default state after deletion                                          | Comp       | -         | 1          | FE    |                                                                           |
| 2.6   | Default sort is "Más reciente" on first load (AC-E2.6)                                             | Comp       | -         | 1          | FE    |                                                                           |
| 2.6   | Each of the four sort options reorders correctly                                                   | Comp       | -         | 4          | FE    | Fixture with predictable createdAt/nombre                                 |
| 2.3   | POST `/api/v1/clientes` contract: 201 + Location header + `ClienteDto` shape                       | API        | -         | 1          | BE    |                                                                           |
| 2.4   | PUT `/api/v1/clientes/{id}`: 200 + full DTO; 404 for missing id                                    | API        | -         | 2          | BE    |                                                                           |

**Total P1:** 22 tests, 22 hours (1 hr/test)

### P2 (Medium) - Run nightly/weekly

**Criteria:** Secondary features + Low risk + Edge cases

| Story | Requirement                                                                                      | Test Level | Risk Link | Test Count | Owner | Notes                                                                     |
| ----- | ------------------------------------------------------------------------------------------------ | ---------- | --------- | ---------- | ----- | ------------------------------------------------------------------------- |
| 2.1   | Real-time filter latency <100ms on 500 records                                                   | Comp       | R-003     | 1          | FE    | Micro-benchmark via `performance.now`                                     |
| 2.1   | Scrollable list of 500 items renders without virtualization jank                                 | Comp       | -         | 1          | FE    |                                                                           |
| 2.3   | Phone accepts common formats (+57, dashes, spaces) — normalization contract                       | Unit       | R-006     | 2          | BE+FE | Zod + FluentValidation parity                                             |
| 2.3   | NIT/RUC max length + charset validation (per Zod schema)                                         | Unit       | R-006     | 2          | FE    |                                                                           |
| 2.5   | Delete of non-existent id returns 404 with RFC 7807                                              | API        | R-001     | 1          | BE    |                                                                           |
| 2.5   | Delete with zero associated contacts still succeeds and returns 204                              | API        | -         | 1          | BE    |                                                                           |
| 2.6   | Sort persistence: changing selection then reloading page resets to default "Más reciente"        | Comp       | -         | 1          | FE    | Confirms local state only, not persisted (matches architecture)           |
| 2.1   | CORS preflight `OPTIONS /api/v1/clientes` returns allow-headers `Content-Type`                    | API        | R-010     | 1          | DevOps |                                                                           |
| 2.3   | Global exception middleware returns Problem Details for unhandled exceptions                     | API        | R-001     | 1          | BE    | Simulated via test endpoint or forced failure                             |
| 2.1   | ARIA labels on list items and search input (WCAG AA)                                             | Comp       | -         | 2          | FE    | `getByRole` + `aria-label` assertions                                     |
| 2.2   | Split-panel layout collapses correctly on <1024px breakpoint (NFR mobile responsiveness)         | E2E        | -         | 1          | QA    | Playwright viewport 375×667                                               |

**Total P2:** 14 tests, 7 hours (0.5 hr/test)

### P3 (Low) - Run on-demand

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Story | Requirement                                                                       | Test Level | Test Count | Owner | Notes                                              |
| ----- | --------------------------------------------------------------------------------- | ---------- | ---------- | ----- | -------------------------------------------------- |
| 2.1   | Search stress test — type/erase 100 times without memory leak                     | E2E        | 1          | QA    | Chromium heap snapshot delta                       |
| 2.3   | Bulk create 500 clients via API and measure P95 latency                           | API        | 1          | QA    | Fixture generator + timing                         |
| 2.6   | Sort stability with 500-item dataset (equal values keep insertion order)         | Unit       | 2          | FE    | Deterministic ordering guarantee                   |
| 2.5   | Delete under concurrent read of contacts endpoint (race check)                    | API        | 1          | BE    |                                                    |
| 2.1   | Accessibility audit (axe) on `/clientes` full page                                | E2E        | 1          | QA    | `@axe-core/playwright`                             |
| 2.4   | Diacritic & Unicode names round-trip through PUT                                  | Unit       | 2          | BE+FE |                                                    |
| 2.3   | Rate-limit / throttling behavior when 10 concurrent creates fired (NFR3)          | API        | 1          | QA    | Confirms no data corruption; not a P0 requirement  |
| 2.1   | Empty-state CTA link navigates to create form                                     | Comp       | 1          | FE    |                                                    |
| 2.2   | Browser Back navigation between list and detail preserves scroll position         | E2E        | 1          | QA    |                                                    |
| 2.1   | Search input debounce timing (150ms) matches architecture spec                    | Unit       | 1          | FE    |                                                    |

**Total P3:** 12 tests, 3 hours (0.25 hr/test)

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose:** Fast feedback, catch build-breaking issues

- [ ] List loads on `/clientes` with seeded fixtures (E2E, 30s)
- [ ] Empty state renders when DB empty (Comp, 5s)
- [ ] Create client → row appears (E2E, 45s)
- [ ] Delete client → row disappears (E2E, 40s)
- [ ] Deep link `/clientes/:id` loads detail (E2E, 25s)

**Total:** 5 scenarios, ~2.5 min

### P0 Tests (<10 min)

**Purpose:** Critical path validation — must be 100% green to merge

- Full P0 table above (18 scenarios)
- Priority order: cascade-delete integration → mutation invalidation → error middleware → validation

**Total:** 18 scenarios

### P1 Tests (<30 min)

**Purpose:** Important feature coverage — runs on PR to main

- Full P1 table above (22 scenarios)

**Total:** 22 scenarios

### P2/P3 Tests (<60 min)

**Purpose:** Full regression coverage + exploratory

- P2 (14) + P3 (12) = 26 scenarios

**Total:** 26 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count  | Hours/Test | Total Hours | Notes                                                       |
| --------- | ------ | ---------- | ----------- | ----------------------------------------------------------- |
| P0        | 18     | 2.0        | 36          | Cascade migration, integration setup, Spanish copy fixtures |
| P1        | 22     | 1.0        | 22          | Standard component + API coverage                            |
| P2        | 14     | 0.5        | 7           | Edge cases, a11y, CORS                                       |
| P3        | 12     | 0.25       | 3           | Exploratory, benchmarks                                     |
| **Total** | **66** | **-**      | **68**      | **~9 days**                                                 |

### Prerequisites

**Test Data:**

- `clienteFactory` (faker-based, ES locale, produces Nombre/NIT/Telefono/Ciudad) — under `e2e/helpers/data.helper.ts`
- `contactoFactory` (nullable `clienteId`) — needed for R-004 cascade test
- 500-record seed for NFR1 performance test — reusable fixture in `e2e/fixtures/`
- `resetDatabase` helper hitting a test-only endpoint or direct `dotnet ef database drop -f`

**Tooling:**

- Playwright (E2E + API request context) — already configured (`playwright.config.ts`)
- Vitest + React Testing Library + MSW (frontend component/unit) — already in `frontend/`
- xUnit + `WebApplicationFactory` (backend integration) — already in `backend/tests/`
- `@axe-core/playwright` for P3 accessibility audit — install as devDependency

**Environment:**

- Backend running on `http://localhost:5000` with clean PostgreSQL schema before each integration run
- Frontend dev server on `http://localhost:5173` for Playwright E2E
- Ephemeral DB per CI job (docker-compose PostgreSQL 18)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions)
- **P1 pass rate:** ≥95% (waivers require QA Lead sign-off)
- **P2/P3 pass rate:** ≥90% (informational)
- **High-risk (≥6) mitigations:** 100% complete or approved waivers

### Coverage Targets

- **Critical paths (create/edit/delete/search):** ≥80% line + branch
- **Security scenarios (NFR6 error exposure, NFR5 sanitization):** 100%
- **Cascade delete + FK behavior:** 100%
- **Sort + filter combinations:** 100% of the six ACs in Story 2.6

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated (R-001, R-004, R-007, R-011)
- [ ] Migration test proves `ON DELETE SET NULL` at DB level
- [ ] API tests assert no `stackTrace`/`exception` keys in any error payload
- [ ] Every Spanish user-facing string in AC covered by exact-string assertion
- [ ] Every mutation covered by a test that verifies `invalidateQueries(['clientes'])` behavior (via observed refetch)

---

## Mitigation Plans

### R-001: Error exposure leaks internal details (Score 6)

- **Mitigation:** Ensure `ExceptionHandlingMiddleware` wraps every endpoint with Problem Details RFC 7807 output (no `stackTrace`, no `exception`, no framework internals). Story 2.3 uniqueness check must return typed 409 with `title = "Conflict"`, `detail = "El NIT/RUC ya está registrado"`.
- **Owner:** Backend developer implementing Story 2.3.
- **Timeline:** Before Story 2.3 code review.
- **Status:** Planned.
- **Verification:** API test on 409/404/500 asserts response body keys are exactly `{ type, title, status, detail, instance, errors? }`.

### R-004: Delete cascade destroys contacts instead of nulling FK (Score 6)

- **Mitigation:** `ContactoConfiguration.cs` must set `.OnDelete(DeleteBehavior.SetNull)` on the `ClienteId` FK. Integration test in `ClienteEndpointsTests.cs` seeds `{ cliente, contactoA, contactoB linked to cliente }`, executes DELETE, then GETs contacts and asserts both survive with `clienteId = null`.
- **Owner:** Backend developer implementing Story 2.5.
- **Timeline:** Before Story 2.5 merge.
- **Status:** Planned.
- **Verification:** Integration test + Story 2.5 E2E covering the "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." toast branch.

### R-007: Migration for `ON DELETE SET NULL` missing/reverted (Score 6)

- **Mitigation:** Extend `MigrationTests.cs` with an assertion that reads `information_schema.referential_constraints` and confirms the `fk_contactos_clientes` constraint has `delete_rule = 'SET NULL'`. CI applies migrations against a clean database before running integration suite.
- **Owner:** Backend developer.
- **Timeline:** Story 2.5.
- **Status:** Planned.
- **Verification:** Test passes on fresh DB; regression added to CI pipeline gate.

### R-011: TanStack Query mutation forgets `invalidateQueries` (Score 6)

- **Mitigation:** Every mutation hook (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Test each hook with MSW returning 200; verify a follow-up GET is issued (observe via handler call count).
- **Owner:** Frontend developer.
- **Timeline:** Stories 2.3, 2.4, 2.5.
- **Status:** Planned.
- **Verification:** Component-level test for each hook + E2E smoke that creates a client and reads the list without navigation refresh.

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 (Foundation) infrastructure — Vite/React frontend, .NET 10 API, PostgreSQL 18, EF Core, siesa-ui-kit, TanStack Router/Query — is already available and green (traceability matrix `traceability-matrix-epic-1.md` confirms coverage).
2. `ContactManager` from siesa-ui-kit is not required in Epic 2 stories — client CRUD does not embed contact UI (that is Epic 4). However, R-004 cascade tests must exercise the raw contactos table.
3. `docker-compose` PostgreSQL is used for integration test DB; ephemeral per CI job.
4. All acceptance criteria are Spanish-strict — English variants are treated as failures per architecture P0 mandate.
5. Optimistic UI pattern is applied to create/update/delete mutations (architecture line 386-395); tests assume this pattern is implemented.

### Dependencies

1. Test framework already initialized (`e2e/`, `frontend/src/test-setup.ts`, `backend/tests/`) — no `*framework` re-run required.
2. `sa-tea-atdd` will consume this test-design to generate failing P0 tests before Story 2.3 implementation.
3. Sprint status file will be created by `sprint-planning` before dev loop begins.
4. Backend API contract stable per architecture doc (endpoints listed lines 249-262).

### Risks to Plan

- **Risk:** Story 2.5 cascade-to-null behavior may be misinterpreted as "delete contacts" during implementation.
  - **Impact:** Would silently destroy user data on delete.
  - **Contingency:** R-004 + R-007 tests must run in P0 tier and block merge on failure.
- **Risk:** Client-side sort might be accidentally implemented as a server-side sort (extra API param), duplicating list re-fetch.
  - **Impact:** Wasted 500-record refetch on each sort change; violates Story 2.6 explicit architecture note.
  - **Contingency:** R-008 MSW handler call count assertion catches this at PR gate.

---

## Follow-on Workflows (Manual)

- Run `*atdd` for each Story (2.1 → 2.6) to generate failing P0 tests before implementation.
- Run `*automate` after each Story is developed to expand coverage into P1/P2.
- Run `*trace` at end of epic to produce the traceability matrix and quality gate decision.
- Run `*nfr` before release to validate NFR1 (search <1s), NFR2 (CRUD <2s), NFR5 (input sanitization), NFR6 (no error leakage).

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _pending_ Date: _pending_
- [ ] Tech Lead: _pending_ Date: _pending_
- [ ] QA Lead: _pending_ Date: _pending_

**Comments:** Draft generated by TEA autonomous workflow — pending human review before ATDD kickoff.

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — 6-category risk framework (TECH/SEC/PERF/DATA/BUS/OPS)
- `probability-impact.md` — Probability × Impact scoring, ≥6 threshold
- `test-levels-framework.md` — E2E/API/Component/Unit selection
- `test-priorities-matrix.md` — P0-P3 mapping and time budgets

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd/index.md`
- Feature spec: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Requirements inventory: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`
- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic 1 traceability (prerequisite check): `_bmad-output/traceability-matrix-epic-1.md`

### FR Coverage Map for Epic 2

| FR   | Story | Test Level(s)        | Priority |
| ---- | ----- | -------------------- | -------- |
| FR1  | 2.3   | E2E + API + Comp     | P0       |
| FR2  | 2.1   | E2E + Comp           | P0       |
| FR3  | 2.1   | Comp + E2E           | P1       |
| FR4  | 2.1   | Comp + E2E           | P1       |
| FR5  | 2.2   | E2E + Comp           | P0/P1    |
| FR6  | 2.4   | E2E + Comp + API     | P0/P1    |
| FR7  | 2.5   | E2E + API + Unit(BE) | P0       |
| FR8  | 2.3, 2.4 | Comp + Unit + API | P0       |
| FR25 | 2.5   | API + E2E            | P0       |
| FR27 | 2.3, 2.4, 2.5 | E2E + Comp    | P0       |
| FR30 | 2.2   | E2E                  | P1       |
| NFR1 | 2.1   | E2E + Comp           | P1/P2    |
| NFR2 | 2.3, 2.4, 2.5 | E2E           | P1       |
| NFR5 | 2.3, 2.4 | API + Unit        | P0/P2    |
| NFR6 | 2.3, 2.4, 2.5 | API           | P0       |

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Mode:** Epic-Level (Phase 4) — forced by orchestrator
