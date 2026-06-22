---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-22"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: draft
---

# Test Design — Epic 2: Client Management

**Date:** 2026-06-22
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (Stories 2.1 through 2.6)

This epic delivers the complete CRUD lifecycle for the `clientes` entity: list with real-time search, detail view with deep-linking, create, edit, delete with cascade-contact handling, and client-side sort. It covers FRs FR1–FR8 and is the first epic that touches the database domain layer (`clientes` table, `ClienteEntity`, FluentValidation).

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (score ≥6): 5 (R-001, R-002, R-003, R-004, R-005)
- Critical categories: DATA, PERF, BUS, SEC, TECH

**Coverage Summary:**

- P0 scenarios: 12 (24 hours)
- P1 scenarios: 18 (18 hours)
- P2 scenarios: 14 (7 hours)
- P3 scenarios: 5 (1.25 hours)
- **Total effort:** 50.25 hours (~6.3 days)

---

## 1. Epic Overview & Test Scope

### Stories in Scope

| Story | Title                   | Key Concerns                                                                     |
|-------|-------------------------|----------------------------------------------------------------------------------|
| 2.1   | Client List & Search    | Real-time filter (<1s, 500 records), EmptyState, ErrorPanel + retry             |
| 2.2   | Client Detail View      | Deep-link routing (`/clientes/:id`), 404 handling, panel selection state        |
| 2.3   | Create Client           | Form validation (all required), NIT/RUC uniqueness (409), optimistic update     |
| 2.4   | Edit Client             | Pre-fill values, inline validation, cancel discards changes, FR27 refresh       |
| 2.5   | Delete Client           | Confirmation dialog, contact cascade (clienteId=null), "Sin cliente" filter     |
| 2.6   | Sort Client List        | 4 sort options, client-side only (no new API call), preserves active search     |

### Out of Scope

- Authentication — not in MVP (no auth story)
- Contact management — Epic 3
- Client↔Contact association — Epic 4
- "Sin cliente" filter for contacts — Epic 3/4
- HTTPS in non-local — NFR4 deferred

### Technology Stack Context

| Layer      | Technology                                             |
|------------|--------------------------------------------------------|
| Frontend   | Vite 7 / React 18 / TypeScript strict / TanStack Router / TanStack Query 5 |
| Backend    | .NET 10 / C# Minimal API / Clean Architecture / FluentValidation |
| Database   | PostgreSQL 18 / EF Core 10 / snake_case / UUID PKs / DateTimeOffset |
| Testing    | Vitest + RTL + MSW (frontend) / xUnit (backend) |
| UI         | siesa-ui-kit + shadcn/ui Dialog |
| HTTP       | Axios, REST `/api/v1/clientes` |

---

## 2. Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                                                       | Probability | Impact | Score | Mitigation                                                                                          | Owner | Timeline    |
|---------|----------|---------------------------------------------------------------------------------------------------|-------------|--------|-------|------------------------------------------------------------------------------------------------------|-------|-------------|
| R-001   | DATA     | Delete client does NOT set `clienteId = null` on associated contacts — contacts silently orphaned with stale FK | 2 | 3 | 6 | Integration + E2E test: create client with contacts, delete client, assert contacts have `clienteId = null` and appear in "Sin cliente" filter | Dev/QA | Story 2.5  |
| R-002   | BUS      | NIT/RUC duplicate silently creates a second record (409 not handled) — corrupt data integrity    | 2           | 3      | 6     | API test: POST duplicate NIT/RUC → assert 409 + correct Spanish error message. Frontend component test: 409 response renders "El NIT/RUC ya está registrado" without stack trace | Dev/QA | Story 2.3  |
| R-003   | PERF     | Client-side filter over 500 records takes >1s (NFR1 violation) due to unoptimized `Array.filter` or missing debounce | 3 | 2 | 6 | Component performance test: load 500 fixture clients, measure filter response with `performance.now()`, assert <1s | QA     | Story 2.1  |
| R-004   | SEC      | FluentValidation not registered or not applied — raw unvalidated inputs persisted (NFR5)         | 2           | 3      | 6     | API integration test: POST/PUT with empty Nombre, empty NIT, oversized fields → assert 400 + Problem Details RFC 7807, no 500 | Dev/QA | Stories 2.3–2.4 |
| R-005   | TECH     | Sort changes trigger an additional `GET /api/v1/clientes` call (wrong implementation) — should be pure client-side over TanStack Query cache | 2 | 3 | 6 | Component test + network spy: intercept fetch, apply sort, assert zero new network calls | Dev/QA | Story 2.6  |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description                                                                                     | Probability | Impact | Score | Mitigation                                                                     | Owner |
|---------|----------|-------------------------------------------------------------------------------------------------|-------------|--------|-------|---------------------------------------------------------------------------------|-------|
| R-006   | BUS      | EmptyState not shown when client list is genuinely empty — user sees blank panel with no guidance | 2 | 2 | 4 | Component test: mock API returns `[]`, assert `EmptyState` renders with CTA text | DEV   |
| R-007   | TECH     | Deep-link `/clientes/:clienteId` with invalid UUID format causes unhandled 500 instead of 404   | 2           | 2      | 4     | API + E2E test: navigate to `/clientes/not-a-uuid`, assert 404/not-found UI without crash | QA    |
| R-008   | BUS      | Cancel in edit form clears fields visually but leaves dirty state → next open shows empty form  | 2           | 2      | 4     | Component test: open edit, modify, cancel, re-open → assert original values restored | DEV   |
| R-009   | BUS      | Sort resets to default when search input changes — violates AC-E2.6 (sort must persist over filter) | 2 | 2 | 4 | Component test: sort "Nombre Z→A", type in search, assert sort order still Z→A | DEV   |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description                                                                               | Probability | Impact | Score | Action  |
|---------|----------|-------------------------------------------------------------------------------------------|-------------|--------|-------|---------|
| R-010   | OPS      | Toast notifications not dismissed (stay on screen >5s), cluttering UI for power users    | 1           | 2      | 2     | Monitor |
| R-011   | BUS      | Confirmation dialog "Eliminar" accessible by keyboard only (a11y gap), not caught in PR  | 1           | 1      | 1     | Monitor |

---

## 3. Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey + High risk (≥6) + No workaround

| AC / Requirement                                   | Test Level | Risk Link | Scenarios | Owner | Notes                                                     |
|----------------------------------------------------|------------|-----------|-----------|-------|-----------------------------------------------------------|
| DELETE client → contacts set clienteId=null (AC-E2.5 cascade) | E2E + API | R-001 | 2 | QA | Requires seeded client + contacts. Assert contact still exists with null FK |
| POST duplicate NIT/RUC → 409 + Spanish error message (AC-E2.4) | API        | R-002     | 2         | QA    | Backend returns 409; frontend toast shows correct message (no stack trace) |
| Search 500 records returns results <1s (NFR1, AC-E2.2)         | Component  | R-003     | 2         | QA    | Vitest + performance.now(); fixture: 500 generated clients |
| POST/PUT empty required fields → 400 FluentValidation (AC-E2.4, NFR5) | API | R-004 | 3 | Dev | Empty Nombre, empty NIT, empty Telefono; each returns 400 Problem Details |
| Sort changes zero additional API calls (AC-E2.6 technical) | Component  | R-005     | 3         | Dev   | MSW intercept; verify fetch count stays 1 across all 4 sort options |

**Total P0:** 12 scenarios, 24 hours

### P1 (High) — Run on PR to main

**Criteria:** Important feature + Medium risk (3–4) + Common workflow

| AC / Requirement                                           | Test Level | Risk Link | Scenarios | Owner | Notes                                                      |
|------------------------------------------------------------|------------|-----------|-----------|-------|------------------------------------------------------------|
| EmptyState shown when client list is empty (AC-E2.1)      | Component  | R-006     | 1         | Dev   | Mock API `[]`, assert EmptyState + CTA visible             |
| ErrorPanel + "Reintentar" shown on fetch failure (Story 2.1) | Component | -       | 1         | Dev   | MSW returns 503, assert ErrorPanel with retry button       |
| Deep-link `/clientes/:id` loads correct client (AC-E2.2, FR30) | E2E   | R-007     | 2         | QA    | Direct URL navigation; assert detail panel populated       |
| `/clientes/:id` not-found → graceful message (Story 2.2)  | E2E + API  | R-007     | 2         | QA    | Non-existent UUID; assert 404 API + not-found UI           |
| Create client → appears in list immediately (AC-E2.1, FR27) | E2E      | -         | 2         | QA    | Full create flow; assert list updates without page reload  |
| Edit pre-fills current values (AC-E2.3, FR6)              | Component  | R-008     | 1         | Dev   | Assert form fields match client fixture data               |
| Cancel edit → original values unchanged (Story 2.4)       | Component  | R-008     | 1         | Dev   | Modify field, cancel, re-open, assert original             |
| Delete confirmation dialog shows before deleting (Story 2.5) | E2E     | -         | 1         | QA    | Click Eliminar → dialog appears                            |
| Cancel delete → client remains (Story 2.5)                | E2E        | -         | 1         | QA    | Open dialog, click Cancelar, assert client still in list   |
| Sort preserves active search filter (AC-E2.6)             | Component  | R-009     | 2         | Dev   | Apply search, change sort, assert filtered + sorted result |
| Sort "Más reciente" default on load (AC-E2.6)             | Component  | -         | 1         | Dev   | Initial render; assert sort state = `fecha-desc`           |
| POST client → success toast "Cliente creado correctamente" | Component | -        | 1         | Dev   | Assert toast appears after successful mutation             |

**Total P1:** 16 scenarios, 16 hours

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary feature + Low risk (1–2) + Edge cases

| AC / Requirement                                                     | Test Level | Risk Link | Scenarios | Owner | Notes                                                              |
|----------------------------------------------------------------------|------------|-----------|-----------|-------|--------------------------------------------------------------------|
| URL updates to `/clientes/:id` when client selected (FR30)           | E2E        | -         | 1         | QA    | Click list item, assert URL changed                               |
| All 4 sort options reorder list correctly (AC-E2.6)                  | Component  | -         | 4         | Dev   | Assert array ordering for nombre-asc, nombre-desc, fecha-desc, fecha-asc |
| Edit client → changes reflected in list + detail (AC-E2.3, FR27)    | E2E        | -         | 1         | QA    | Full edit flow; assert updated name in list panel                 |
| Delete client with contacts → toast mentions contacts unassigned     | E2E        | R-001     | 1         | QA    | Assert special toast message (not the generic one)                |
| PUT empty required field → inline error, no backend call (AC-E2.4, FR8) | Component | R-004 | 2 | Dev | Zod validation fires before Axios call; assert no network request |
| Inline error messages on empty required fields at create (AC-E2.4, FR8) | Component | R-004 | 2 | Dev | Each required field shows individual error label                  |
| NIT/RUC uniqueness check on edit (409 on PUT)                        | API        | R-002     | 1         | QA    | PUT with NIT that belongs to another client → 409               |
| Backend returns Problem Details RFC 7807 (no stackTrace key)         | API        | -         | 1         | Dev   | Assert response has `type`, `title`, `status`; no `stackTrace`  |
| Search input debounce — no filter on every keystroke                 | Component  | R-003     | 1         | Dev   | Assert filter function called at most once per 150ms window       |

**Total P2:** 14 scenarios, 7 hours

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Benchmarks

| Requirement                                                         | Test Level | Scenarios | Owner | Notes                                                      |
|---------------------------------------------------------------------|------------|-----------|-------|------------------------------------------------------------|
| Sort label reflects selected option in SortControl UI               | Component  | 1         | Dev   | Assert aria-label or visible text updates                  |
| Keyboard navigation through client list (a11y)                      | E2E        | 1         | QA    | Arrow keys traverse list items                             |
| 500-client dataset load time < 2s (NFR2 full list)                  | Component  | 1         | QA    | Measure total load from API mock to rendered list          |
| Search clears → full list restored immediately                      | Component  | 1         | Dev   | Clear search input, assert all items reappear              |
| Error panel retry button re-fetches client list                     | Component  | 1         | Dev   | After 503, click retry; mock next call success; assert list |

**Total P3:** 5 scenarios, 1.25 hours

---

## 4. Execution Order

### Smoke Tests (<5 min)

Fast feedback — catch build-breaking issues before running full suite.

- [ ] `GET /api/v1/clientes` returns 200 with empty array (API contract alive) (20s)
- [ ] `/clientes` route renders without crash (E2E shell) (30s)
- [ ] `POST /api/v1/clientes` with valid payload returns 201 + UUID (30s)
- [ ] Client list component mounts and displays fixture client name (Component, 20s)

**Total:** 4 scenarios, ~2 min

### P0 Tests (<10 min)

- [ ] DELETE client → contacts set clienteId=null (E2E)
- [ ] DELETE client → contacts still exist in DB (API)
- [ ] POST duplicate NIT/RUC → 409 response (API)
- [ ] POST duplicate NIT/RUC → "El NIT/RUC ya está registrado" toast (Component)
- [ ] Filter 500 clients by name → result < 1s (Component perf)
- [ ] Filter 500 clients by NIT → result < 1s (Component perf)
- [ ] POST empty Nombre → 400 + Problem Details (API)
- [ ] POST empty NIT → 400 + Problem Details (API)
- [ ] POST empty Telefono → 400 + Problem Details (API)
- [ ] Sort `nombre-asc` → zero new API calls (Component + network spy)
- [ ] Sort `nombre-desc` → zero new API calls (Component + network spy)
- [ ] Sort `fecha-asc` → zero new API calls (Component + network spy)

**Total:** 12 scenarios, ~8 min

### P1 Tests (<30 min)

- [ ] EmptyState renders when API returns `[]` (Component)
- [ ] ErrorPanel + "Reintentar" renders on 503 (Component)
- [ ] Direct URL `/clientes/:validId` loads correct client detail (E2E)
- [ ] Direct URL `/clientes/:validId` does not reload left panel (E2E)
- [ ] Invalid UUID `/clientes/not-a-uuid` → API 404 (API)
- [ ] Invalid UUID `/clientes/not-a-uuid` → not-found UI (E2E)
- [ ] Create client → client appears in list without reload (E2E)
- [ ] Create client → success toast "Cliente creado correctamente" (E2E)
- [ ] Edit form opens pre-filled with all 4 field values (Component)
- [ ] Cancel edit → re-open shows original values (Component)
- [ ] Delete confirmation dialog shown on "Eliminar" click (E2E)
- [ ] Cancel delete → client still in list (E2E)
- [ ] Search active + change sort → filtered + sorted (Component)
- [ ] Search active + change sort → search input not cleared (Component)
- [ ] Default sort on initial load = `fecha-desc` (Component)
- [ ] Create client → success mutation → POST called once (Component + spy)

**Total:** 16 scenarios, ~22 min

### P2/P3 Tests (<60 min)

All P2 and P3 scenarios listed in coverage plan above.

**Total:** 19 scenarios, ~45 min

---

## 5. Resource Estimates

### Test Development Effort

| Priority  | Count | Hours/Test | Total Hours | Notes                              |
|-----------|-------|------------|-------------|------------------------------------|
| P0        | 12    | 2.0        | 24.0        | Complex setup: DB seed, perf fixtures, network spies |
| P1        | 16    | 1.0        | 16.0        | Standard coverage, MSW mocks       |
| P2        | 14    | 0.5        | 7.0         | Simple scenarios, reuse fixtures   |
| P3        | 5     | 0.25       | 1.25        | Exploratory / benchmarks           |
| **Total** | **47** | —         | **48.25**   | **~6 days**                        |

### Prerequisites

**Test Data:**

- `ClienteFactory` — faker-based, generates Nombre/NIT/Telefono/Ciudad with unique NITs, auto-cleanup after test
- `ClienteWithContactsFixture` — seeds 1 client + N contacts for cascade delete scenarios (Story 2.5)
- `BulkClienteFixture` — seeds 500 clients for NFR1 performance tests (Story 2.1)

**Tooling:**

- Vitest + @testing-library/react — component tests (already in stack)
- MSW (Mock Service Worker) — API mocking for frontend unit/component tests
- xUnit + EF Core InMemory or Testcontainers/PostgreSQL — backend API integration tests
- `performance.now()` — client-side filter timing measurement
- Playwright (if framework initialized) — E2E tests for Stories 2.2, 2.3, 2.5
- Network spy (`vi.spyOn` or MSW request tracker) — verify zero re-fetch on sort

**Environment:**

- Local PostgreSQL `siesa_agents_db` (same as Epic 1 migration)
- Testcontainers or Docker PostgreSQL for isolated CI runs
- Frontend dev server on port 5173, Backend on port 5000 (CORS already validated in Epic 1)
- MSW worker registered in `src/mocks/browser.ts` for test environment

---

## 6. Detailed Mitigation Plans

### R-001: Delete cascade — contacts not unassigned (Score: 6)

**Mitigation Strategy:**
1. Backend: Confirm `ON DELETE SET NULL` is declared in EF Core Fluent API for `ContactoEntity.ClienteId` FK. Add xUnit integration test: seed client + 2 contacts → DELETE client → assert contacts have `ClienteId = null`.
2. Frontend E2E: After confirmed deletion, navigate to contacts view and assert the deleted client's former contacts appear in "Sin cliente" filter (Epic 4 dependency noted — partial validation possible in Epic 2 by checking `clienteId` null in API response).
3. Toast message test: assert toast reads "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (not the generic delete toast).

**Owner:** Dev (backend EF config) + QA (E2E)
**Timeline:** Before Story 2.5 implementation completes
**Status:** Planned
**Verification:** xUnit test green + E2E scenario green

### R-002: NIT/RUC duplicate not rejected (Score: 6)

**Mitigation Strategy:**
1. Backend: `uk_clientes_nit` unique constraint must exist in migration. FluentValidation rule on `CreateClienteCommand` rejects empty NIT. `ClienteService` must catch DB unique violation and return 409 (not 500).
2. API test: POST with existing NIT → 409 + body contains `"El NIT/RUC ya está registrado"`.
3. Frontend component test: MSW returns 409 → assert toast (or inline error) shows the Spanish message. Assert no stack trace visible.

**Owner:** Dev (backend) + Dev (frontend error handling)
**Timeline:** Before Story 2.3 implementation completes
**Status:** Planned
**Verification:** API test 409 + Component test error message rendered

### R-003: Filter >500 records >1s (Score: 6)

**Mitigation Strategy:**
1. Verify debounce: search input must debounce at 150ms before calling filter function (architecture doc reference).
2. Implement filter using `useMemo` over TanStack Query data — not re-filtering on every render.
3. Component performance test: `BulkClienteFixture` (500 items), `performance.now()` around filter call, assert `<1000ms`. Run in Vitest with `--pool forks` to avoid shared-worker timing noise.

**Owner:** Dev (implementation) + QA (measurement)
**Timeline:** Story 2.1 implementation
**Status:** Planned
**Verification:** Vitest performance test < 1000ms on P99

### R-004: FluentValidation not applied — raw input persisted (Score: 6)

**Mitigation Strategy:**
1. Backend: FluentValidation validators registered in DI with `AddFluentValidationAutoValidation()`. Validators for `CreateClienteCommand` and `UpdateClienteCommand` enforce non-empty Nombre, NIT, Telefono, Ciudad + max lengths.
2. API integration test (xUnit): POST/PUT with empty body fields → assert 400 + Problem Details format (type, title, status, errors dictionary).
3. Frontend: Zod schema enforces same rules client-side — assert form does not submit to Axios when fields are empty (network spy: 0 calls on invalid submit).

**Owner:** Dev (backend validators) + Dev (Zod schema)
**Timeline:** Stories 2.3 and 2.4
**Status:** Planned
**Verification:** xUnit API tests green + Component network spy confirms no call on invalid form

### R-005: Sort triggers new API call (Score: 6)

**Mitigation Strategy:**
1. Implementation requirement: sort must be pure `Array.sort` over the TanStack Query cache data — no `refetch()` or `invalidateQueries()` call in sort handler.
2. Sort state: `useState<SortOption>('fecha-desc')` local to ClientesView — not in URL, not in Zustand.
3. Component test: MSW request tracker — count requests before and after each sort change. Assert request count = 1 (initial load only) across all 4 sort transitions.

**Owner:** Dev (implementation + test)
**Timeline:** Story 2.6
**Status:** Planned
**Verification:** Component test with request counter spy green

---

## 7. Coverage Matrix (Requirements → Tests)

| Acceptance Criterion        | Story | Test Level  | Priority | Risk Link      | Scenarios |
|-----------------------------|-------|-------------|----------|----------------|-----------|
| AC-E2.1 Register client     | 2.3   | E2E + API   | P0/P1    | R-002, R-004   | 5         |
| AC-E2.2 Search <1s / 500    | 2.1   | Component   | P0       | R-003          | 2         |
| AC-E2.3 View + edit + save  | 2.4   | E2E + Comp  | P1       | R-008          | 3         |
| AC-E2.4 Required field errors | 2.3/2.4 | API + Comp | P0/P2 | R-004         | 5         |
| AC-E2.5 Delete → removed    | 2.5   | E2E + API   | P0/P1    | R-001          | 5         |
| AC-E2.6 Sort (4 options)    | 2.6   | Component   | P0/P2    | R-005, R-009   | 8         |
| FR30 Deep-link              | 2.2   | E2E + API   | P1       | R-007          | 4         |
| NFR1 Search <1s             | 2.1   | Component   | P0       | R-003          | 2         |
| NFR5 Input sanitization     | 2.3/2.4 | API       | P0       | R-004          | 3         |
| NFR6 No stack traces        | 2.3/2.4 | API       | P2       | R-004          | 1         |
| FR27 Immediate UI refresh   | 2.3/2.4/2.5 | E2E  | P1       | -              | 3         |
| FR8 Inline validation errors | 2.3/2.4 | Component | P2      | R-004          | 4         |
| EmptyState (no clients)     | 2.1   | Component   | P1       | R-006          | 1         |
| ErrorPanel + Retry          | 2.1   | Component   | P1       | -              | 1         |
| Not-found (invalid ID)      | 2.2   | E2E + API   | P1       | R-007          | 2         |

---

## 8. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (zero exceptions; any P0 failure blocks story completion)
- **P1 pass rate:** ≥95% (waivers require documented justification)
- **P2/P3 pass rate:** ≥90% (informational, does not block)
- **High-risk mitigations (R-001 through R-005):** 100% confirmed before epic close

### Coverage Targets

- **Critical paths (create, delete cascade, search):** ≥80% branch coverage
- **Security scenarios (NFR5 validation, NFR6 error exposure):** 100%
- **Business logic (sort, filter, pre-fill):** ≥70%
- **Edge cases (empty state, error state, invalid UUID):** ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (12 scenarios)
- [ ] R-001 (cascade delete) test green — contacts unassigned confirmed
- [ ] R-002 (NIT uniqueness) API test green — 409 returned
- [ ] R-004 (FluentValidation) API test green — 400 + Problem Details
- [ ] R-005 (sort no refetch) component test green — 0 extra API calls
- [ ] No test exposes raw stack traces or internal error details

---

## 9. Assumptions and Dependencies

### Assumptions

1. Epic 1 foundation is complete and green: PostgreSQL connected, CORS configured, Problem Details middleware registered, `dotnet build` exits 0.
2. The `clientes` table migration runs successfully before Epic 2 stories begin (`uk_clientes_nit` unique constraint included in migration).
3. MSW is already wired in `src/mocks/browser.ts` (or configured in Vitest setup) — no additional tooling setup needed for frontend component tests.
4. `ON DELETE SET NULL` for `contactos.cliente_id` FK is defined in the EF Core migration (referenced in architecture doc) — if not present, R-001 mitigation becomes a migration fix, not just a test.

### Dependencies

1. **Epic 1 tests green** — CORS, backend health, DB connection must be green (validates environment for Epic 2 API tests). Required before Epic 2 P0 API tests run.
2. **`clientes` EF Core migration** — must be applied before any backend integration tests. Required by Story 2.1 implementation start.
3. **MSW handler setup for `/api/v1/clientes`** — required for all frontend component tests. Required by Story 2.1 component test implementation.
4. **`SortControl` component** (`src/shared/components/SortControl`) — referenced in Story 2.6; must be implemented before component tests for sort run.
5. **"Sin cliente" filter (Epic 3/4)** — Story 2.5 cascade test can only fully validate the filter behavior when Epic 3 contacts view is implemented. Partial validation (null `clienteId` in API) is in scope for Epic 2.

### Risks to Plan

- **Risk:** PostgreSQL `ON DELETE SET NULL` not present in migration — cascade test fails with FK violation instead of null assignment.
  - **Impact:** R-001 E2E/API tests fail; Story 2.5 blocked.
  - **Contingency:** Add `OnDelete(DeleteBehavior.SetNull)` in EF Core Fluent API and re-generate migration before 2.5 tests run.

- **Risk:** `siesa-ui-kit` Dialog component not available or breaking change — confirmation dialog in Story 2.5 cannot be tested.
  - **Impact:** Delete E2E tests need workaround.
  - **Contingency:** Fall back to shadcn/ui Dialog (already in architecture as fallback).

---

## 10. Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before Story 2.1 implementation begins (separate workflow; not auto-run by `*test-design`).
- Run `*automate` after all 6 stories implemented to expand coverage and fill P2/P3 gaps.
- Run `*trace` after Epic 2 complete to generate traceability matrix (FRs FR1–FR8 → test coverage).
- Run `*nfr` to formally validate NFR1 (search <1s), NFR2 (CRUD <2s), NFR5 (validation), NFR6 (no stack traces).

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: __________ Date: __________
- [ ] Tech Lead: __________ Date: __________
- [ ] QA Lead: __________ Date: __________

---

## Appendix

### Knowledge Base References Applied

- `risk-governance.md` — Risk classification (6 categories: TECH/SEC/PERF/DATA/BUS/OPS), scoring
- `probability-impact.md` — Probability × impact matrix (P×I thresholds: ≥6 = high priority)
- `test-levels-framework.md` — E2E for critical paths, API for business logic, Component for UI behavior, Unit for edge cases
- `test-priorities-matrix.md` — P0 (blocks core + score ≥6), P1 (important + score 3–4), P2/P3 (low risk/edge case)

### Related Documents

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Feature PRD: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 1 Test Design (reference): `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Mode:** Epic-Level (Phase 4)
