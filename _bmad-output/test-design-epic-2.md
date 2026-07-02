# Test Design: Epic 2 - Client Management

**Date:** 2026-07-02
**Author:** SiesaTeam (TEA Agent)
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Design Level:** full

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (Stories 2.1 to 2.6). Covers list & search, detail view, create, edit, delete (with contact FK cascade to NULL), and client-side sort.

**Risk Summary:**

- Total risks identified: **17**
- High-priority risks (score >= 6): **6**
- Critical categories: **DATA, PERF, TECH, BUS**

**Coverage Summary:**

- P0 scenarios: **18** (~36 hours)
- P1 scenarios: **26** (~26 hours)
- P2 scenarios: **22** (~11 hours)
- P3 scenarios: **6** (~1.5 hours)
- **Total effort:** ~74.5 hours (~9-10 days)

**Test Levels Mix (target):** Unit 45% / Integration (API) 30% / Component 15% / E2E 10%

---

## Requirements Under Test

**Functional Requirements covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR27, FR28, FR30

**Non-Functional Requirements exercised:** NFR1 (<1s search @500 records), NFR2 (<2s CRUD reflect), NFR5 (input sanitization), NFR6 (no stack traces to user), NFR8 (<=2 clicks nav)

**Stories in scope:**

- **Story 2.1** — Client List & Search (`/clientes`)
- **Story 2.2** — Client Detail View (`/clientes/:clienteId`)
- **Story 2.3** — Create Client (form + 409 NIT/RUC handling)
- **Story 2.4** — Edit Client (pre-filled form)
- **Story 2.5** — Delete Client (with contacts SET NULL cascade)
- **Story 2.6** — Sort Client List (client-side over TanStack cache)

---

## Risk Assessment

### High-Priority Risks (Score >= 6)

| Risk ID | Category | Description                                                                                                       | Prob | Impact | Score | Mitigation                                                                                                      | Owner   | Timeline    |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------------- | ---- | ------ | ----- | --------------------------------------------------------------------------------------------------------------- | ------- | ----------- |
| R-001   | DATA     | Delete cliente does not SET NULL on `contactos.cliente_id`; orphan FK violation or lost contacts (Story 2.5, FR25) | 2    | 3      | 6     | Integration test on DELETE endpoint asserting FK cascade + Domain entity test on unassignment semantics         | Backend | Sprint 2    |
| R-002   | DATA     | Duplicate NIT/RUC persisted due to missing unique constraint enforcement or race between two POST /clientes calls | 2    | 3      | 6     | DB uk_clientes_nit constraint verified via IntegrationTest; API returns 409; frontend handles duplicate         | Backend | Sprint 2    |
| R-003   | PERF     | Search + sort combined over 500 records exceeds 1s render budget on low-end devices (NFR1)                        | 3    | 2      | 6     | Component perf benchmark on filtered list; useMemo dependency check; virtualization if fails                    | Frontend| Sprint 2    |
| R-004   | TECH     | TanStack Query cache not invalidated after Create/Update/Delete → stale UI, violates FR27 (immediate reflection)  | 2    | 3      | 6     | Unit test on each mutation hook asserting `invalidateQueries(['clientes'])`; E2E smoke on immediate reflection  | Frontend| Sprint 2    |
| R-005   | BUS      | Destructive delete with no undo/soft-delete → accidental client wipe causes commercial data loss                  | 3    | 2      | 6     | E2E confirmation dialog test; API contract test on DELETE 200 vs 204; UX ok, but log deletion via ILogger       | Full    | Sprint 2    |
| R-006   | TECH     | Client-side sort clears search filter (regression AC-E2.6 & Story 2.6 last-AC) — sort state and searchQuery unlinked | 3    | 2      | 6     | Component test with searchQuery active + SortControl change; assert filtered result set retained                | Frontend| Sprint 2    |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                                                                                       | Prob | Impact | Score | Mitigation                                                              | Owner   |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------------- | ---- | ------ | ----- | ----------------------------------------------------------------------- | ------- |
| R-007   | SEC      | User inputs (Nombre, NIT/RUC, Teléfono, Ciudad) not sanitized in backend → stored XSS or SQL/injection risk (NFR5)| 2    | 2      | 4     | FluentValidation on Create/Update commands; integration test with `<script>` payload | Backend |
| R-008   | DATA     | Optimistic UI update inconsistent rollback on 4xx/5xx (Create/Edit/Delete) → UI shows client that does not exist  | 2    | 2      | 4     | Mutation hook unit test with MSW mocking 500 → assert rollback + toast  | Frontend|
| R-009   | OPS      | ErrorPanel "Reintentar" button not wired to `queryClient.refetchQueries` → users stuck on stale error state       | 2    | 2      | 4     | Component test simulating 500 → Reintentar → assert refetch invoked      | Frontend|
| R-010   | TECH     | Deep link `/clientes/:clienteId` with non-existent id shows crash instead of graceful not-found (AC Story 2.2)    | 2    | 2      | 4     | Route-level test + integration on GET /clientes/{id} 404 handling       | Frontend|
| R-011   | BUS      | Toast messages missing/wrong text for edge cases (409 duplicate, unassigned contacts on delete)                   | 3    | 1      | 3     | Component tests verifying exact toast copy per AC (Spanish strings)     | Frontend|
| R-012   | DATA     | Form field trimming/normalization missing → same NIT with trailing spaces bypass uniqueness                       | 2    | 2      | 4     | Zod schema `.trim()` unit test + backend normalization                  | Fullstack|
| R-013   | PERF     | Initial list fetch of all 500 records blocks first paint on slow network                                          | 2    | 2      | 4     | Loading skeleton state + performance budget on `useClientes`             | Frontend|

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                                                                              | Prob | Impact | Score | Action  |
| ------- | -------- | -------------------------------------------------------------------------------------------------------- | ---- | ------ | ----- | ------- |
| R-014   | SEC      | No auth in MVP → any browser can DELETE (documented accepted limitation of NFR scope)                     | 3    | 1      | 3(*)  | Monitor + doc |
| R-015   | OPS      | Backend error responses may leak stack traces (NFR6) if `UseDeveloperExceptionPage` enabled in prod       | 1    | 2      | 2     | Monitor + config audit |
| R-016   | BUS      | Default sort "Más reciente" not applied on first load (last AC of Story 2.6)                              | 1    | 1      | 1     | Component test  |
| R-017   | OPS      | Toast on delete with associated contacts uses wrong copy (Spanish message with unassignment note)         | 1    | 2      | 2     | Component test on text |

(*) R-014 accepted per architecture (MVP scope, no auth); not a blocker for release.

### Risk Category Legend

- **TECH:** Technical/Architecture (cache invalidation, routing, integration)
- **SEC:** Security (input sanitization, authz)
- **PERF:** Performance (NFR1 <1s search, NFR2 <2s reflect)
- **DATA:** Data Integrity (FK cascade, unique constraint, rollback)
- **BUS:** Business Impact (accidental deletes, wrong toast copy)
- **OPS:** Operations (error recovery, prod config)

---

## Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey + High risk (score >= 6) + No workaround

| # | Requirement / Scenario                                                                    | Test Level | Risk Link | Test Count | Owner    | Notes                                                                          |
| - | ----------------------------------------------------------------------------------------- | ---------- | --------- | ---------- | -------- | ------------------------------------------------------------------------------ |
| 1 | Create + Edit + Delete cliente reflects immediately on list (FR27)                        | E2E        | R-004     | 3          | QA/Front | Playwright/Vitest+RTL smoke — one per mutation                                 |
| 2 | Delete cliente sets `contactos.cliente_id = NULL`, keeps contact records                  | Integration| R-001     | 2          | Backend  | xUnit + WebApplicationFactory + in-memory PG (Testcontainers)                  |
| 3 | POST /clientes with duplicate NIT/RUC returns 409 (uk_clientes_nit)                       | Integration| R-002     | 2          | Backend  | Includes concurrent-write scenario                                             |
| 4 | Frontend maps 409 to "El NIT/RUC ya está registrado" and does NOT reveal internals (NFR6) | Component  | R-002     | 1          | Frontend | MSW 409 mock                                                                   |
| 5 | Sort with active search preserves filter (AC-E2.6, Story 2.6 last-AC)                     | Component  | R-006     | 2          | Frontend | Combine search + all 4 sort options                                            |
| 6 | Search returns results in <1s with 500-record dataset (NFR1)                              | Component  | R-003     | 1          | Frontend | Perf benchmark via Vitest `bench` + seeded factory                             |
| 7 | Each mutation hook invalidates `['clientes']` query key                                   | Unit       | R-004     | 3          | Frontend | `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`                     |
| 8 | Deletion confirmation dialog requires explicit "Confirmar" before DELETE call             | Component  | R-005     | 2          | Frontend | Cancel path + confirm path                                                     |
| 9 | Required fields validation prevents submit on empty Nombre/NIT/Teléfono/Ciudad (FR8, AC-E2.4)| Component  | R-008     | 2          | Frontend | Zod schema + React Hook Form                                                   |

**Total P0:** 18 tests, ~36 hours

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3-4) + Common workflows

| # | Requirement / Scenario                                                                    | Test Level | Risk Link | Test Count | Owner    | Notes                                             |
| - | ----------------------------------------------------------------------------------------- | ---------- | --------- | ---------- | -------- | ------------------------------------------------- |
| 1 | GET /clientes list, search by name, search by NIT (FR2, FR3, FR4)                         | Integration| —         | 3          | Backend  | xUnit endpoint tests                              |
| 2 | GET /clientes/{id} returns 404 for non-existent id                                        | Integration| R-010     | 1          | Backend  | Problem Details RFC 7807 compliance               |
| 3 | Deep link /clientes/:clienteId with unknown id shows not-found gracefully                 | Component  | R-010     | 2          | Frontend | Route + fallback state                            |
| 4 | Real-time search debounced filter matches Nombre and NIT (AC-2.1)                         | Component  | —         | 2          | Frontend | useMemo dependency correctness                    |
| 5 | Empty state renders when zero clients returned                                            | Component  | R-011     | 1          | Frontend |                                                   |
| 6 | Error panel with "Reintentar" refetches on click (backend down)                           | Component  | R-009     | 1          | Frontend | MSW network error                                 |
| 7 | Edit form pre-filled with current values (FR6, AC-2.4)                                    | Component  | —         | 1          | Frontend |                                                   |
| 8 | Edit + Cancel keeps original data unchanged                                               | Component  | —         | 1          | Frontend |                                                   |
| 9 | Optimistic UI rollback on mutation error (create/update/delete)                           | Unit       | R-008     | 3          | Frontend | Mutation hooks with MSW 500                       |
| 10| Toast success/error copy in Spanish for each mutation                                     | Component  | R-011     | 4          | Frontend | "Cliente creado / actualizado / eliminado ..."    |
| 11| Sort options: nombre-asc, nombre-desc, fecha-desc, fecha-asc — no new API call            | Component  | R-006     | 4          | Frontend | Assert TanStack fetch not triggered                |
| 12| URL updates to `/clientes/:clienteId` on selection (FR30 deep linking)                    | Component  | —         | 1          | Frontend | TanStack Router assertion                          |
| 13| Backend input validation rejects `<script>` payloads (NFR5)                               | Integration| R-007     | 2          | Backend  | FluentValidation                                  |

**Total P1:** 26 tests, ~26 hours

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (1-2) + Edge cases

| # | Requirement / Scenario                                                             | Test Level | Risk Link | Test Count | Owner    | Notes                                        |
| - | ---------------------------------------------------------------------------------- | ---------- | --------- | ---------- | -------- | -------------------------------------------- |
| 1 | Zod schema unit tests: required, trim, min length (Nombre, NIT), phone format      | Unit       | R-012     | 6          | Frontend | Pure schema tests                            |
| 2 | ClienteEntity domain invariants (backend)                                          | Unit       | —         | 4          | Backend  | xUnit                                        |
| 3 | Default sort "Más reciente" applied on first render                                | Component  | R-016     | 1          | Frontend |                                              |
| 4 | Delete cliente with contacts: toast message includes "Sus contactos ... sin cliente"| Component  | R-017     | 1          | Frontend |                                              |
| 5 | `contactos` with cliente_id=NULL appear in "Sin cliente" filter after delete (FR25) | Integration| R-001     | 1          | Backend  | Requires ContactosTests context               |
| 6 | Trimmed NIT/RUC with trailing spaces still rejected as duplicate                   | Integration| R-012     | 1          | Backend  |                                              |
| 7 | Search on 500-record dataset re-renders within budget under filter change stress   | Component  | R-003     | 2          | Frontend | Vitest bench                                 |
| 8 | List panel scrolls with 500 records; no layout shift                               | Component  | R-013     | 1          | Frontend |                                              |
| 9 | Non-required whitespace-only submit rejected on all 4 required fields              | Component  | R-012     | 4          | Frontend |                                              |
| 10| PUT /clientes/{id} updates only mutable fields; created_at unchanged               | Integration| —         | 1          | Backend  |                                              |

**Total P2:** 22 tests, ~11 hours

### P3 (Low) — Run on-demand

| # | Requirement / Scenario                                                    | Test Level | Test Count | Owner    | Notes                              |
| - | ------------------------------------------------------------------------- | ---------- | ---------- | -------- | ---------------------------------- |
| 1 | Mobile viewport (FR29): list + form usable at 375px width                 | E2E        | 1          | QA       | Playwright device emulation        |
| 2 | Search input is accessible (aria-label, keyboard focus)                   | Component  | 2          | Frontend | axe-core smoke                     |
| 3 | Backend logs a "cliente deleted" event via ILogger                        | Integration| 1          | Backend  |                                    |
| 4 | Prod exception middleware does not leak stack traces (NFR6)               | Integration| 1          | Backend  | Verify Problem Details only        |
| 5 | Explore: high-volume paste into search field does not freeze UI (>1000 chars) | Exploratory| 1        | QA       | Manual                             |

**Total P3:** 6 tests, ~1.5 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose:** Fast feedback per commit

- [ ] List `/clientes` loads and renders EmptyState or client list (30s)
- [ ] Create cliente happy path — appears in list (45s)
- [ ] Delete cliente happy path — disappears from list (45s)
- [ ] Search by "Nombre" returns filtered results (30s)

**Total:** 4 scenarios

### P0 Tests (<10 min)

**Purpose:** Critical path validation — mutations, cache invalidation, NIT/RUC uniqueness, cascade

- [ ] All 18 P0 tests (list above)

### P1 Tests (<30 min)

**Purpose:** Important feature coverage — routing, error recovery, toasts, sort/search interaction

- [ ] All 26 P1 tests (list above)

### P2/P3 Tests (<60 min)

**Purpose:** Full regression + perf + a11y

- [ ] All 22 P2 tests
- [ ] All 6 P3 tests

---

## Resource Estimates

### Test Development Effort

| Priority  | Count  | Hours/Test | Total Hours | Notes                                  |
| --------- | ------ | ---------- | ----------- | -------------------------------------- |
| P0        | 18     | 2.0        | 36          | Complex setup (Testcontainers, MSW, E2E)|
| P1        | 26     | 1.0        | 26          | Standard component + integration       |
| P2        | 22     | 0.5        | 11          | Simple unit/component                  |
| P3        | 6      | 0.25       | 1.5         | Exploratory + smoke                    |
| **Total** | **72** | —          | **74.5**    | **~9-10 days**                         |

### Prerequisites

**Test Data:**

- `clienteFactory` (faker-based) — bulk 500-record seed for NFR1 perf tests
- `contactoFactory` with `clienteId` param for cascade tests
- MSW handlers for `/api/v1/clientes` GET/POST/PUT/DELETE (200, 400, 404, 409, 500)

**Tooling:**

- Vitest + @testing-library/react + MSW (frontend unit/component)
- Vitest `bench` for NFR1 perf benchmarks
- xUnit + WebApplicationFactory + Testcontainers-PostgreSQL (backend integration)
- Playwright for smoke E2E (optional — respect `tea_use_playwright_utils: false`)
- axe-core smoke (P3 a11y)

**Environment:**

- Backend running on `http://localhost:5000` for E2E only
- `AppDbContext` uses ephemeral Postgres via Testcontainers for integration tests
- Snake_case naming enforced (verified in R-001 mitigation)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions)
- **P1 pass rate:** >=95% (waivers require documented rationale)
- **P2/P3 pass rate:** >=90% (informational; failures noted, not blocking)
- **High-risk (>=6) mitigations:** 100% complete OR approved waiver

### Coverage Targets

- **Critical paths (Create/Edit/Delete + Cascade):** >=90%
- **Client-side sort/search logic:** >=80% branch coverage
- **Domain entities (ClienteEntity):** >=85%
- **Input validation (Zod + FluentValidation):** 100% of required fields

### Non-Negotiable Requirements

- [ ] All 18 P0 tests pass
- [ ] R-001 (FK cascade), R-002 (NIT unique), R-004 (cache invalidation) all mitigated
- [ ] NIT/RUC duplicate returns 409 and shows correct Spanish toast copy (NFR6)
- [ ] Search over 500 records under 1s (NFR1)
- [ ] No stack traces exposed in backend responses (NFR6 audit)

---

## Mitigation Plans

### R-001: Delete cliente FK cascade to `contactos.cliente_id = NULL` (Score 6)

**Mitigation Strategy:** Verify `ContactoConfiguration` uses `.OnDelete(DeleteBehavior.SetNull)`. Integration test: seed 1 cliente + 3 contactos, DELETE cliente, assert contactos remain with cliente_id=NULL and appear in `?sinCliente=true` filter.
**Owner:** Backend team (Story 2.5)
**Timeline:** During Story 2.5 dev
**Status:** Planned
**Verification:** `ClienteEndpointsTests.Delete_WithAssociatedContacts_SetsClienteIdToNull` passes.

### R-002: Duplicate NIT/RUC (Score 6)

**Mitigation Strategy:** DB `uk_clientes_nit` unique index + application-layer FluentValidation. On DB conflict, map `DbUpdateException` to 409 Problem Details. Frontend maps 409 to Spanish message.
**Owner:** Backend + Frontend (Story 2.3)
**Timeline:** During Story 2.3 dev
**Status:** Planned
**Verification:** Integration test + component test with MSW 409 mock.

### R-003: Search + sort perf on 500 records (Score 6)

**Mitigation Strategy:** `useMemo` on filtered+sorted list; measure re-render via Vitest bench with seeded 500 records. If >800ms, add virtualization (`@tanstack/react-virtual`).
**Owner:** Frontend (Story 2.1, 2.6)
**Timeline:** Story 2.6 completion
**Status:** Planned
**Verification:** Bench test asserts p95 < 900ms in CI.

### R-004: TanStack cache invalidation (Score 6)

**Mitigation Strategy:** Each mutation hook (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Unit-test the hook with a spy on `queryClient`.
**Owner:** Frontend (Stories 2.3, 2.4, 2.5)
**Timeline:** Per story
**Status:** Planned
**Verification:** Unit tests assert spy called; E2E smoke asserts UI reflects mutation.

### R-005: Destructive delete without undo (Score 6)

**Mitigation Strategy:** Enforce confirmation dialog with explicit "Confirmar" button. Log deletion in backend via `ILogger`. Future soft-delete backlog item.
**Owner:** Full-stack (Story 2.5)
**Timeline:** Story 2.5
**Status:** Planned
**Verification:** Component test on dialog + backend log assertion.

### R-006: Sort clears search filter (Score 6)

**Mitigation Strategy:** SortControl and searchQuery must both be local state that feed the same `useMemo` deriving `filteredSortedClientes`. Component test: type in search, then change sort, assert filter preserved.
**Owner:** Frontend (Story 2.6)
**Timeline:** Story 2.6
**Status:** Planned
**Verification:** Component test `sort-preserves-search.test.tsx` passes.

---

## Assumptions and Dependencies

### Assumptions

1. Backend Epic 1 delivered a working `AppDbContext` + `/api/v1/*` route surface with Clean Architecture layers.
2. Frontend Epic 1 delivered TanStack Router + TanStack Query provider + Axios `apiClient.ts` + MSW dev setup.
3. Testcontainers-PostgreSQL is available in CI (backend) — otherwise falls back to InMemory provider for R-001/R-002.
4. UX toasts use `sonner` or equivalent already wired in Epic 1.
5. `SortControl` is a shared component from `src/shared/components/SortControl` (per Story 2.6 tech context).

### Dependencies

1. Epic 1 (Foundation) — backend + frontend scaffolds — DONE (per gate-decision-epic-1.yaml).
2. `clienteFactory` + `contactoFactory` — must be created in Story 2.1 or shared test-utils.
3. MSW handlers for all `/api/v1/clientes` endpoints — created in Story 2.1.
4. Testcontainers infra in CI — required for R-001/R-002 mitigation.

### Risks to Plan

- **Risk:** Testcontainers unavailable in CI runner.
  - **Impact:** R-001, R-002, R-012 fall back to InMemory provider (weaker guarantee).
  - **Contingency:** Add integration smoke against staging DB weekly.
- **Risk:** NFR1 perf test flaky in CI (hardware variance).
  - **Impact:** R-003 may block PRs intermittently.
  - **Contingency:** Use `bench` threshold with 2x tolerance; run 3x median.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests per story (18 P0 scenarios above).
- Run `*automate` for broader coverage once each story is implemented.
- Run `*trace` after Epic 2 completion for traceability matrix + gate decision.
- Run `*nfr` before release to validate NFR1 (<1s search) and NFR6 (no stack trace leaks).

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories)
- `probability-impact.md` — Risk scoring methodology (P x I)
- `test-levels-framework.md` — Unit / Component / Integration / E2E decision
- `test-priorities-matrix.md` — P0-P3 prioritization criteria

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- PRD FRs: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- PRD NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`

---

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Mode:** Epic-Level (Phase 4)
