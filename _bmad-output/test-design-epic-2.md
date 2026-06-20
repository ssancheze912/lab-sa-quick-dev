---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-20"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: approved
---

# Test Design — Epic 2: Client Management

**Date:** 2026-06-20
**Author:** SiesaTeam
**Status:** Approved

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management

Epic 2 delivers the complete CRUD lifecycle for `Cliente` records: listing, searching, creating, viewing, editing, deleting, and sorting. All six stories share a split-panel layout (`/clientes` route) built on TanStack Router + TanStack Query, with client-side filtering over an in-memory array of up to 500 records. The backend implements a .NET 10 Minimal API + Clean Architecture + EF Core 10 + PostgreSQL 18 stack. Key cross-cutting concerns are real-time UI consistency via `invalidateQueries` (FR27), dual-field search by Nombre and NIT/RUC (NFR1 < 1 s), form validation on both frontend (Zod) and backend (FluentValidation), and graceful error handling per Problem Details RFC 7807 / NFR6.

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥ 6): 5 (R-001 to R-005)
- Critical categories: DATA, BUS, PERF, SEC, TECH

**Coverage Summary:**

- P0 scenarios: 10 (20.0 hours)
- P1 scenarios: 16 (16.0 hours)
- P2 scenarios: 14 (7.0 hours)
- P3 scenarios: 4 (1.0 hours)
- **Total effort:** 44.0 hours (~5.5 days)

---

## 1. Epic Overview & Test Scope

### Stories in Scope

| Story | Title | FRs Covered | Key Concerns |
|-------|-------|-------------|-------------|
| 2.1 | Client List & Search | FR2, FR3, FR4, FR27, FR28, FR30 | Real-time dual-field filter, EmptyState, ErrorPanel + retry, deep link |
| 2.2 | Client Detail View | FR5, FR30 | Click-to-detail, URL sync, not-found graceful handling |
| 2.3 | Create Client | FR1, FR8, NFR5, NFR6 | Required-field validation (Zod + FluentValidation), NIT/RUC uniqueness (409), optimistic update |
| 2.4 | Edit Client | FR6, FR8, FR27 | Pre-fill form, save/cancel, inline validation, immediate list reflection |
| 2.5 | Delete Client | FR7, FR27 | Confirmation dialog, cascading contact orphan (ON DELETE SET NULL), undo cancel |
| 2.6 | Sort Client List | FR27, FR28, AC-E2.6 | Four sort modes, sort-over-filter, default "Más reciente", no extra API call |

### Out of Scope for This Epic

- Contact management (Epics 3 and 4)
- Client–Contact association flows (Epic 4)
- Authentication / authorization (deferred, not in MVP)
- HTTPS configuration (NFR4 — deployment concern)
- Server-side pagination (deferred per NFR11 — client-side filter sufficient for ≤ 500 records)
- Statistics dashboard (Epic 5)

---

## 2. Risk Assessment

### High-Priority Risks (Score ≥ 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Client deletion without confirming ON DELETE SET NULL cascade: associated contacts silently lose `clienteId` without the toast message `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` appearing, causing data inconsistency between UI and DB | 3 | 3 | 9 | API integration test: create client + 2 contacts, delete client, assert contacts still exist with `clienteId=null`; E2E test: assert correct toast text | Dev/QA | Story 2.5 |
| R-002 | BUS | NIT/RUC uniqueness constraint not enforced end-to-end: backend returns 409 but frontend does not surface the error message "El NIT/RUC ya está registrado", leaving users unaware of conflict | 2 | 3 | 6 | API test: POST with duplicate NIT → 409 Problem Details; Component test: UI shows inline error from 409 response | Dev/QA | Story 2.3 |
| R-003 | PERF | Client-side filter over 500 records exceeds NFR1 (< 1 s): useMemo may not be memoized correctly or re-runs on every render, causing visible lag on slower devices | 2 | 3 | 6 | Unit test: benchmark filter fn over 500 synthetic records < 50 ms; E2E smoke: type in search field, measure time-to-visible-results ≤ 1 s | Dev | Story 2.1 |
| R-004 | TECH | TanStack Query `invalidateQueries(['clientes'])` not triggered after a mutation (create/update/delete): stale data persists in the panel until manual page refresh, violating FR27 and NFR2 (< 2 s) | 3 | 2 | 6 | Component/integration test per mutation hook: mock API → call mutate → assert `['clientes']` query refetched | Dev | Stories 2.3–2.5 |
| R-005 | SEC | Required-field validation exists only on the frontend (Zod): if FluentValidation is missing on the backend, crafted API calls bypass validation and persist empty Nombre or NIT/RUC to the DB | 2 | 3 | 6 | API integration test: POST `{"nombre":"","nit":"","telefono":"","ciudad":""}` → assert 400 + `errors` field listing each missing field per Problem Details | Dev | Story 2.3 |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-006 | BUS | EmptyState not rendered when the list is empty (0 records): users see a blank panel with no guidance | 2 | 2 | 4 | Component test: render `ClienteListView` with empty array → assert `EmptyState` component visible | Dev |
| R-007 | TECH | ErrorPanel with "Reintentar" button not shown when `GET /api/v1/clientes` fails: users see blank panel with no recovery path | 2 | 2 | 4 | Component test: MSW intercept with network error → assert `ErrorPanel` visible with retry button | Dev |
| R-008 | BUS | Sort state not preserved when search filter is active: changing SortControl clears `searchQuery` state or vice versa, breaking AC-E2.6 | 2 | 2 | 4 | Component test: set search filter + sort, assert both applied simultaneously to derived list | Dev |
| R-009 | DATA | Editing a client with a cleared required field submits the form (inline validation skipped on edit mode): blank Nombre reaches the backend | 1 | 3 | 3 | Component test: open edit form, clear required field, submit, assert inline error and no API call | Dev |
| R-010 | BUS | Clicking "Cancelar" after editing modifies the cached TanStack Query data (optimistic update not rolled back), so list shows stale edits | 1 | 3 | 3 | Component test: open edit, modify fields, cancel, assert original values in list | Dev |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-011 | OPS | Direct URL `/clientes/:nonExistentId` renders a blank panel instead of a graceful not-found message | 1 | 2 | 2 | Monitor — Component test: pass unknown id, assert not-found message |
| R-012 | BUS | Default sort on initial load is not "Más reciente" (fecha-desc), so oldest clients appear first | 1 | 2 | 2 | Monitor — Unit test: verify SortControl initial state = `fecha-desc` |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## 3. Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey + High risk (≥ 6) + No workaround

| Req / AC | Story | Test Level | Risk Link | Scenarios | Owner | Notes |
|----------|-------|------------|-----------|-----------|-------|-------|
| AC-E2.1 — Create client, appears in list immediately | 2.3 | E2E | R-004 | 2 | QA | Create happy path + list refresh assertion |
| AC-E2.3 — Edit client, changes reflected immediately | 2.4 | E2E | R-004 | 2 | QA | Edit happy path + list + detail refresh |
| AC-E2.5 — Delete client, disappears from list; orphan contacts toast | 2.5 | E2E | R-001 | 2 | QA | Delete with contacts scenario required |
| FR8 — Backend rejects empty required fields (POST) | 2.3 | API | R-005 | 2 | Dev | POST with empty body → 400 + Problem Details `errors` |
| NIT/RUC conflict → 409 propagated to UI | 2.3 | API + Component | R-002 | 2 | Dev/QA | API: 409 response; Component: inline error visible |

**Total P0: 10 tests, 20.0 hours**

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3–4) + Common workflows

| Req / AC | Story | Test Level | Risk Link | Scenarios | Owner | Notes |
|----------|-------|------------|-----------|-----------|-------|-------|
| AC-E2.1 — Client list displays Nombre + NIT/RUC per item | 2.1 | Component | R-006 | 1 | Dev | Snapshot + content assertion |
| AC-E2.2 — Search filters in real time < 1 s, 500 records | 2.1 | Component + Unit | R-003 | 3 | Dev | Filter benchmark + MSW mock 500 records |
| EmptyState shown when 0 clients | 2.1 | Component | R-006 | 1 | Dev | Render with empty array |
| ErrorPanel + "Reintentar" on fetch failure | 2.1 | Component | R-007 | 1 | Dev | MSW network error intercept |
| AC-E2.2 — URL updates to `/clientes/:id` on click | 2.2 | Component | — | 1 | Dev | TanStack Router mock + navigation assert |
| AC-E2.2 — Direct URL `/clientes/:id` loads correct client | 2.2 | E2E | — | 1 | QA | Deep link navigation |
| AC-E2.3 — Form opens with all 4 required fields | 2.3 | Component | — | 1 | Dev | Render form, assert field presence |
| AC-E2.3 — Toast "Cliente creado correctamente" on success | 2.3 | Component | R-004 | 1 | Dev | MSW POST mock → toast assertion |
| AC-E2.4 — Form pre-filled with current values | 2.4 | Component | — | 1 | Dev | Open edit form, assert field values |
| AC-E2.4 — Cancel preserves original data | 2.4 | Component | R-010 | 1 | Dev | Cancel flow, assert no change in list |
| AC-E2.4 — Toast "Cliente actualizado correctamente" on save | 2.4 | Component | R-004 | 1 | Dev | MSW PUT mock → toast |
| AC-E2.5 — Confirmation dialog appears on "Eliminar" click | 2.5 | Component | — | 1 | Dev | Click delete, assert dialog |
| AC-E2.5 — Cancel in dialog: client remains | 2.5 | Component | — | 1 | Dev | Cancel dialog, assert client still in list |
| AC-E2.6 — Nombre A→Z sort, no extra API call | 2.6 | Component | R-008 | 1 | Dev | Sort, assert list order + no fetch |
| AC-E2.6 — Sort persists over active search filter | 2.6 | Component | R-008 | 1 | Dev | Filter + sort simultaneously |

**Total P1: 16 tests, 16.0 hours**

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (1–2) + Edge cases

| Req / AC | Story | Test Level | Risk Link | Scenarios | Owner | Notes |
|----------|-------|------------|-----------|-----------|-------|-------|
| Client not found (unknown id in URL) | 2.2 | Component | R-011 | 1 | Dev | Not-found message visible |
| AC-E2.4 — Inline error on cleared required field (edit) | 2.4 | Component | R-009 | 1 | Dev | Clear field + submit, assert error |
| AC-E2.6 — Default sort "Más reciente" on initial load | 2.6 | Unit | R-012 | 1 | Dev | SortControl initial state assertion |
| AC-E2.6 — Nombre Z→A sort | 2.6 | Component | — | 1 | Dev | Sort descending assertion |
| AC-E2.6 — Más reciente / Más antiguo sort by date | 2.6 | Component | — | 2 | Dev | Date order assertions |
| `useCreateCliente` invalidates `['clientes']` on success | 2.3 | Unit | R-004 | 1 | Dev | Mock queryClient, assert invalidation called |
| `useUpdateCliente` invalidates `['clientes']` and `['clientes', id]` | 2.4 | Unit | R-004 | 1 | Dev | Same pattern |
| `useDeleteCliente` invalidates `['clientes']` on success | 2.5 | Unit | R-004 | 1 | Dev | Same pattern |
| Backend: PUT client with empty Nombre → 400 FluentValidation | 2.4 | API | R-005 | 1 | Dev | Direct API call with invalid payload |
| Backend: DELETE non-existent id → 404 Problem Details | 2.5 | API | — | 1 | Dev | Verify correct HTTP status + Problem Details |
| `clienteSchema.ts` Zod rejects empty Nombre, NIT, Telefono, Ciudad | 2.3 | Unit | R-005 | 1 | Dev | Unit test for schema validation |
| SortControl renders with all 4 options (identifiers match AC) | 2.6 | Component | — | 1 | Dev | Render assertion + option values |

**Total P2: 14 tests, 7.0 hours**

### P3 (Low) — Run on demand

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Req / AC | Story | Test Level | Scenarios | Owner | Notes |
|----------|-------|------------|-----------|-------|-------|
| NFR1 — search < 1 s with 500 records (performance benchmark) | 2.1 | Unit | 1 | Dev | Benchmark-style timing, not assertion gated |
| NFR2 — CRUD UI update < 2 s end-to-end (timing trace) | 2.3–2.5 | E2E | 1 | QA | Measured but not blocking CI |
| Accessibility: form labels + ARIA on ClienteForm fields | 2.3–2.4 | Component | 1 | Dev | axe-core or RTL aria queries |
| Mobile layout: `/clientes` renders correctly at 375 px viewport | 2.1 | E2E | 1 | QA | Playwright device emulation |

**Total P3: 4 tests, 1.0 hours**

---

## 4. Execution Order

### Smoke Tests (< 5 min)

**Purpose:** Catch build-breaking and regression issues before every commit

- [ ] GET `/api/v1/clientes` returns 200 with array (API)
- [ ] POST `/api/v1/clientes` with valid payload returns 201 (API)
- [ ] `/clientes` route renders `ClienteListView` (Component)

**Total: 3 scenarios**

### P0 Tests (< 10 min)

**Purpose:** Critical path validation — must pass 100%

- [ ] Create client happy path: form submit → list updated (E2E)
- [ ] Create client with contacts, delete client: contacts orphaned with correct toast (E2E)
- [ ] Edit client happy path: pre-filled form → save → list + detail updated (E2E)
- [ ] POST empty required fields → 400 + Problem Details `errors` (API)
- [ ] POST duplicate NIT/RUC → 409 + inline error in UI (API + Component)
- [ ] All 3 mutation hooks invalidate `['clientes']` query (Component/Unit — 3 scenarios)
- [ ] Delete happy path: client removed from list, panel returns to default (E2E)

**Total: 10 scenarios**

### P1 Tests (< 30 min)

**Purpose:** Important feature coverage

- [ ] ClienteListView with 3 records: Nombre + NIT visible per item (Component)
- [ ] ClienteListView search: type "ACME" → filters to matching records (Component)
- [ ] ClienteListView with 0 records: EmptyState visible (Component)
- [ ] ClienteListView fetch error: ErrorPanel + "Reintentar" visible (Component)
- [ ] Click client item → URL updates to `/clientes/:id` (Component)
- [ ] Direct URL `/clientes/:id` → correct client detail loaded (E2E)
- [ ] ClienteForm renders 4 required fields (Component)
- [ ] Create success: toast "Cliente creado correctamente" (Component)
- [ ] Edit form: fields pre-filled with current values (Component)
- [ ] Edit form cancel: original data unchanged (Component)
- [ ] Edit success: toast "Cliente actualizado correctamente" (Component)
- [ ] Delete click: confirmation dialog appears (Component)
- [ ] Delete dialog cancel: client remains in list (Component)
- [ ] Sort Nombre A→Z: list reorders, no extra fetch (Component)
- [ ] Sort active with search filter: both applied simultaneously (Component)

**Total: 15 scenarios (P1 count adjusted; 1 scenario counted across split entries)**

### P2/P3 Tests (< 60 min)

**Purpose:** Full regression and edge case coverage

- [ ] Unknown client id in URL: not-found message (Component)
- [ ] Edit mode, clear required field, submit: inline error, no API call (Component)
- [ ] SortControl initial state = `fecha-desc` / "Más reciente" (Unit)
- [ ] Sort Nombre Z→A: descending order (Component)
- [ ] Sort Más reciente / Más antiguo by `createdAt` (Component — 2)
- [ ] Zod schema rejects empty required fields (Unit)
- [ ] PUT empty Nombre → 400 FluentValidation (API)
- [ ] DELETE non-existent id → 404 Problem Details (API)
- [ ] SortControl option identifiers match spec (`nombre-asc|nombre-desc|fecha-desc|fecha-asc`) (Component)
- [ ] NFR1 performance benchmark: 500-record filter < 50 ms (Unit — P3)
- [ ] NFR2 timing trace: CRUD UI update < 2 s (E2E — P3)
- [ ] Accessibility: form labels + ARIA on ClienteForm (Component — P3)
- [ ] Mobile 375 px viewport: `/clientes` renders without overflow (E2E — P3)

**Total: 18 scenarios (P2: 14, P3: 4)**

---

## 5. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|-----------|-------------|-------|
| P0 | 10 | 2.0 | 20.0 | E2E setup, API contract, cascade assertion |
| P1 | 16 | 1.0 | 16.0 | Component + integration tests |
| P2 | 14 | 0.5 | 7.0 | Unit + edge case component tests |
| P3 | 4 | 0.25 | 1.0 | Exploratory benchmarks |
| **Total** | **44** | — | **44.0** | **~5.5 days** |

### Prerequisites

**Test Data:**

- `clienteFactory` — faker-based builder: `{ id: uuid, nombre, nit, telefono, ciudad, createdAt, updatedAt }` — auto-cleanup after each test
- `clienteListFixture(n)` — generates array of n ClienteDto for component tests
- `contactoFactory` with `clienteId` field for cascade tests (Story 2.5)

**Tooling:**

- **Vitest + React Testing Library + MSW** — unit and component tests (frontend, co-located)
- **xUnit + EF Core InMemory or Testcontainers/PostgreSQL** — API integration tests (backend)
- **Playwright** — E2E critical paths (Stories 2.3, 2.4, 2.5 happy paths + deep linking)
- **@testing-library/user-event** — keyboard/mouse interactions in component tests

**Environment:**

- Local PostgreSQL 18 database `siesa_agents_db` with migrations applied
- MSW service worker configured for frontend component tests
- Backend running on `localhost:5000` for E2E (Playwright `baseURL`)
- Frontend dev server on `localhost:5173`

---

## 6. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions — blocks merge)
- **P1 pass rate:** ≥ 95% (failures require approved waiver)
- **P2/P3 pass rate:** ≥ 90% (informational, non-blocking)
- **High-risk mitigations (R-001 to R-005):** 100% complete before story sign-off

### Coverage Targets

- **Critical paths (CRUD + search):** ≥ 80%
- **Security scenarios (NFR5, NFR6, R-005):** 100%
- **Business logic (validation, cascade, toast messages):** ≥ 70%
- **Edge cases (empty state, error state, cancel flows):** ≥ 50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (10/10)
- [ ] R-001 (cascade contacts) fully mitigated and verified by test
- [ ] R-002 (NIT conflict) end-to-end: API 409 + UI inline error
- [ ] R-004 (invalidateQueries) verified for all 3 mutation hooks
- [ ] R-005 (backend validation) verified by API-level test bypassing frontend
- [ ] No high-risk (score ≥ 6) items unmitigated at epic close

---

## 7. Mitigation Plans

### R-001: Contact orphaning on client delete (Score: 9)

**Mitigation Strategy:** Integration test — create 1 client + 2 contacts via API, DELETE client, GET `/api/v1/contactos`, assert both contacts exist with `clienteId: null`. E2E test asserts toast text contains "Sus contactos asociados quedaron sin cliente asignado." exactly.
**Owner:** Dev (API test) + QA (E2E test)
**Timeline:** Story 2.5
**Status:** Planned
**Verification:** CI pipeline — API integration test suite (xUnit + Testcontainers or InMemory)

### R-002: NIT/RUC uniqueness 409 not surfaced in UI (Score: 6)

**Mitigation Strategy:** Two-layer test: (1) API test — POST duplicate NIT → assert HTTP 409 + Problem Details `detail` contains "NIT/RUC"; (2) Component test — MSW returns 409, assert `ClienteForm` shows inline error message "El NIT/RUC ya está registrado" near the NIT field.
**Owner:** Dev
**Timeline:** Story 2.3
**Status:** Planned
**Verification:** Vitest component test + xUnit API test

### R-003: Client-side filter performance (Score: 6)

**Mitigation Strategy:** Unit test benchmarks `filterClientes(array500, 'ABC')` execution time < 50 ms (well within 1 s NFR1 budget). Confirms `useMemo` dependency array is correct so it does not re-run on unrelated renders.
**Owner:** Dev
**Timeline:** Story 2.1
**Status:** Planned
**Verification:** Vitest unit test with `performance.now()` assertion

### R-004: TanStack Query invalidation after mutations (Score: 6)

**Mitigation Strategy:** Per-hook component test: wrap `useCreateCliente` / `useUpdateCliente` / `useDeleteCliente` in a test harness using a real QueryClient spy. After calling the mutation, assert `queryClient.getQueryState(['clientes']).dataUpdatedAt` changes (or spy on `invalidateQueries`).
**Owner:** Dev
**Timeline:** Stories 2.3–2.5
**Status:** Planned
**Verification:** Vitest unit tests for each hook (3 tests)

### R-005: Backend FluentValidation on required fields (Score: 6)

**Mitigation Strategy:** HTTP-level API test (xUnit): `POST /api/v1/clientes` with body `{"nombre":"","nit":"","telefono":"","ciudad":""}`. Assert 400 + Problem Details RFC 7807 with `errors` dictionary containing `nombre` and `nit` keys. Repeat with PUT for edit path.
**Owner:** Dev
**Timeline:** Story 2.3
**Status:** Planned
**Verification:** xUnit integration tests in `SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

---

## 8. Assumptions and Dependencies

### Assumptions

1. Epic 1 (Foundation) is complete: PostgreSQL DB is running, EF Core migrations include the `clientes` table with `uk_clientes_nit` unique index and correct `snake_case` naming.
2. `siesa-ui-kit` `ContactManager` component is NOT rendered in Epic 2 stories — it becomes relevant in Epic 4. Epic 2 tests do not need to mock `IContactServiceAdapter`.
3. No authentication is required in any test scenario — all API calls succeed without auth headers per MVP scope.
4. MSW (Mock Service Worker) is installed and configured in the frontend test setup from Epic 1 story 1.1.
5. `clienteFactory` and related test utilities are created fresh for Epic 2 if not already present.

### Dependencies

1. `clientes` table + `uk_clientes_nit` index migration applied — required before API integration tests
2. `ExceptionHandlingMiddleware` registered in `Program.cs` — required before backend validation tests (R-005)
3. TanStack Router SPA fallback configured — required before deep-link E2E tests (Story 2.2)
4. `SortControl` component at `src/shared/components/SortControl` with correct option identifiers — required before sort tests (Story 2.6)

### Risks to Plan

- **Risk:** `siesa-ui-kit` version incompatibility breaks `ClienteListView` render
  - **Impact:** Component tests fail at import, blocking P0 run
  - **Contingency:** Pin `siesa-ui-kit` to last verified version; open issue immediately if breakage detected

- **Risk:** PostgreSQL not available in CI environment
  - **Impact:** API integration tests (xUnit + real DB) cannot run
  - **Contingency:** Switch to EF Core InMemory for non-migration tests; use Testcontainers for migration and cascade tests

---

## 9. Coverage Matrix (Requirements → Tests)

| FR / NFR / AC | Story | Test Level | Priority | Risk Link | Tests Count |
|---------------|-------|------------|----------|-----------|-------------|
| FR1 — Create client | 2.3 | E2E + API + Component | P0 / P1 | R-004, R-005 | 4 |
| FR2 — View scrollable list | 2.1 | Component | P1 | R-006 | 1 |
| FR3 — Search by name | 2.1 | Component + Unit | P1 / P2 | R-003 | 2 |
| FR4 — Search by NIT/RUC | 2.1 | Component | P1 | R-003 | 1 |
| FR5 — View client detail | 2.2 | Component + E2E | P1 | — | 2 |
| FR6 — Edit client | 2.4 | E2E + Component | P0 / P1 / P2 | R-004, R-009, R-010 | 5 |
| FR7 — Delete client | 2.5 | E2E + API + Component | P0 / P1 | R-001, R-004 | 4 |
| FR8 — Required-field validation | 2.3 / 2.4 | API + Component + Unit | P0 / P2 | R-005 | 4 |
| FR27 — Immediate UI reflection | 2.3–2.6 | Component + Unit | P0 / P2 | R-004 | 3 |
| FR28 — No full page reload | 2.6 | Component | P1 | — | 1 |
| FR30 — Deep linking | 2.2 | E2E | P1 | — | 1 |
| NFR1 — Search < 1 s / 500 records | 2.1 | Unit (benchmark) | P2 / P3 | R-003 | 2 |
| NFR2 — CRUD < 2 s | 2.3–2.5 | E2E (timing) | P3 | R-004 | 1 |
| NFR5 — Input sanitization | 2.3 | API | P0 | R-005 | 2 |
| NFR6 — No stack trace exposure | 2.3–2.5 | API | P0 | — | 1 |
| AC-E2.1 — Client in list immediately | 2.3 | E2E | P0 | R-004 | 2 |
| AC-E2.2 — Search < 1 s | 2.1 | Component | P1 | R-003 | 1 |
| AC-E2.3 — Edit any field | 2.4 | E2E | P0 | R-004 | 2 |
| AC-E2.4 — Required-field error messages | 2.3 / 2.4 | Component | P0 | R-005 | 2 |
| AC-E2.5 — Delete removes from list | 2.5 | E2E | P0 | R-001 | 2 |
| AC-E2.6 — Sort without page reload / without losing filter | 2.6 | Component | P1 | R-008 | 3 |

---

## 10. Follow-on Workflows (Manual)

- Run `*atdd` per story to generate failing P0 tests before implementation begins (separate workflow — not auto-run by `*test-design`).
- Run `*automate` after implementation exists to expand coverage for P1/P2 scenarios.
- Run `*testarch-trace` at epic close to generate the traceability matrix and quality gate decision.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam — Date: 2026-06-20
- [ ] Tech Lead: SiesaTeam — Date: 2026-06-20
- [ ] QA Lead: SiesaTeam — Date: 2026-06-20

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories: TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` — Risk scoring: probability × impact matrix
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision framework
- `test-priorities-matrix.md` — P0–P3 prioritization criteria

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- PRD (feature): `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- PRD (functional requirements): `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- PRD (non-functional requirements): `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epic 1 Test Design (reference): `_bmad-output/test-design-epic-1.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
