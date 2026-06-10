---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-10"
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

**Date:** 2026-06-10
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (Stories 2.1–2.6)

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥6): 5
- Critical categories: DATA, BUS, TECH, SEC, PERF

**Coverage Summary:**

- P0 scenarios: 14 (28 hours)
- P1 scenarios: 18 (18 hours)
- P2 scenarios: 12 (6 hours)
- P3 scenarios: 4 (1 hour)
- **Total effort:** 53 hours (~7 days)

---

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers the complete Client Management module: a split-panel view at `/clientes` with a scrollable client list (left panel, 280px), real-time search by Nombre/NIT-RUC, client detail view (right panel), full CRUD (create, edit, delete) via modal forms, a sort control for in-memory ordering, and error/empty state handling.

Technology stack in scope:
- **Frontend:** React 18 + TanStack Router + TanStack Query (`['clientes']` query key) + React Hook Form + Zod + siesa-ui-kit
- **Backend:** .NET 10 Minimal API + Clean Architecture + FluentValidation + EF Core 10 + PostgreSQL
- **Client-side filtering:** `useMemo` over cached query — no additional API call
- **Sort:** local `useState` over filtered TanStack Query cache — no additional API call

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | List rendering, real-time client-side filter, EmptyState, ErrorPanel + Retry |
| 2.2 | Client Detail View | Panel binding to URL param, deep-link direct access, not-found state |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), duplicate NIT/RUC (409), success toast, immediate list update |
| 2.4 | Edit Client | Pre-fill, required field validation, success toast, immediate list update, cancel without save |
| 2.5 | Delete Client | Confirmation dialog, immediate removal, orphan contacts set to null, specialized toast |
| 2.6 | Sort Client List | Four sort modes (Nombre A→Z/Z→A, Más reciente, Más antiguo), default = Más reciente, no API call, filter preserved |

### Out of Scope for This Epic

- Contact management (Epic 3)
- Client-Contact association panel within client detail (Epic 4)
- Authentication / authorization (deferred MVP)
- Server-side pagination (deferred post-MVP)
- Performance testing at scale beyond 500 records (NFR10 boundary)

---

## 2. Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Deleting a client with associated contacts must set `cliente_id = NULL` via `ON DELETE SET NULL` FK. If EF Core configuration is wrong or migration missing, contacts are deleted or remain orphaned with stale FK. | 2 | 3 | **6** | API integration test: POST client, POST contact linked to client, DELETE client, GET contact — assert `clienteId == null` and HTTP 200 | QA/Dev | Sprint start |
| R-002 | BUS | NIT/RUC uniqueness: backend must return HTTP 409 and frontend must display "El NIT/RUC ya está registrado" without exposing Problem Details internals. If the 409 is not intercepted, raw error or broken UI shown to user. | 2 | 3 | **6** | API test (409 contract) + Component test (error message rendered correctly) | QA | Sprint start |
| R-003 | TECH | TanStack Query invalidation after mutations (create/edit/delete) must trigger immediate refetch of `['clientes']`. If `invalidateQueries` targets wrong key or is missing, the list stales without reflecting changes (FR27 violation). | 2 | 3 | **6** | Unit tests for each mutation hook: assert `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is called on success | Dev | Per story |
| R-004 | BUS | Real-time client-side search must filter within <1 second with 500 records (NFR1). useMemo dependency on search query string must be correct; stale closure or wrong dep array silently breaks filter. | 2 | 3 | **6** | Unit test: render hook with 500 mock clients, assert filtered results <100ms + correct subset returned | Dev | Story 2.1 |
| R-005 | SEC | Form submission must be blocked client-side when required fields are empty. If Zod schema does not mark all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) as required, form reaches backend, bypassing validation UX. Additionally, FluentValidation must enforce the same rules server-side. | 3 | 2 | **6** | Unit test (Zod schema): assert each field required error fires; API test: POST with missing fields asserts 400 Problem Details with `errors` map | Dev/QA | Story 2.3 |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-006 | TECH | SortControl default must be "Más reciente" (`fecha-desc`) on initial load with no user preference. If `useState` default is wrong or undefined, clients may appear in arbitrary or ascending order. | 2 | 2 | **4** | Component test: render SortControl with no stored preference, assert active option = `fecha-desc` | Dev |
| R-007 | TECH | Sort must apply to the filtered result set when a search string is active — not reset the search input. If sort re-evaluates the raw `['clientes']` cache instead of the already-filtered array, search is silently cleared. | 2 | 2 | **4** | Unit test: with active filter + sort change, assert: (a) search input unchanged, (b) sorted list is a subset of filtered list | Dev |
| R-008 | BUS | Clicking "Cancelar" in the edit form must leave original client data unchanged. If form state is mutated in place (no reset), the cancel action may persist dirty state to the UI even without a save. | 2 | 2 | **4** | Component test: open edit form, dirty a field, cancel, assert displayed values = original | QA |
| R-009 | TECH | URL must update to `/clientes/:clienteId` when a client is selected and must be resolvable via direct navigation (FR30 deep-linking). If TanStack Router route is not parameterized or not linked, deep-link returns 404. | 2 | 2 | **4** | E2E: navigate directly to `/clientes/{known-id}`, assert correct client name in detail panel | QA |
| R-010 | BUS | Backend `GET /api/v1/clientes/{id}` with a non-existent UUID must return 404 Problem Details; frontend must show a graceful not-found message, not a crash. | 1 | 3 | **3** | API test: GET unknown UUID asserts 404 + `title: "Not Found"`; Component test: render with 404 response asserts not-found UI | QA |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-011 | OPS | Backend unavailable when `/clientes` loads: frontend must render `<ErrorPanel />` with "Reintentar" button (not crash). | 1 | 2 | **2** | Monitor |
| R-012 | BUS | Cancelling the deletion confirmation dialog must leave the client in the system unchanged. | 1 | 1 | **1** | Monitor |

### Risk Category Legend

- **TECH:** Technical/Architecture (query key consistency, sort logic, router params)
- **SEC:** Security (validation bypass, data exposure)
- **PERF:** Performance (filter <1s with 500 records, CRUD <2s)
- **DATA:** Data Integrity (orphan contacts on client delete, NIT uniqueness)
- **BUS:** Business Impact (UX correctness, user journeys, correct toasts)
- **OPS:** Operations (backend unavailability handling)

---

## 3. Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey + High risk (score ≥6) + No workaround

| Requirement | Story | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-------|-----------|-----------|------------|-------|-------|
| AC-E2.1: Register new client, appears in list immediately | 2.3 | E2E | R-003, R-005 | 2 | QA | Happy path + immediate list update |
| AC-E2.4: Required fields prevent save with inline errors | 2.3 | Component | R-005 | 3 | Dev | Each field: Nombre, NIT/RUC, Teléfono, Ciudad — Zod errors per field |
| AC-E2.4: Backend validation 400 on missing fields | 2.3 | API | R-005 | 1 | QA | POST with empty body; assert 400 + Problem Details errors map |
| Duplicate NIT/RUC → 409 + correct frontend message | 2.3 | API + Component | R-002 | 2 | QA | API: 409 shape; Component: message "El NIT/RUC ya está registrado" |
| DELETE client → contacts become unassigned (clienteId = null) | 2.5 | API | R-001 | 2 | QA | POST client, POST contact linked, DELETE client, GET contact → clienteId null |
| TanStack Query invalidation on create/edit/delete | 2.3, 2.4, 2.5 | Unit | R-003 | 3 | Dev | One unit test per mutation hook asserting invalidateQueries call |

**Total P0:** 13 tests, ~26 hours

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3–4) + Common workflows

| Requirement | Story | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-------|-----------|-----------|------------|-------|-------|
| AC-E2.2: Search by Nombre/NIT-RUC, results <1s with 500 records | 2.1 | Unit | R-004 | 2 | Dev | Filter hook with 500 mock clients; assert subset + timing |
| Client list renders with Nombre + NIT/RUC per item | 2.1 | Component | — | 1 | Dev | MSW: mock GET /clientes; assert each item shows both fields |
| EmptyState shown when no clients | 2.1 | Component | — | 1 | Dev | MSW: empty array response |
| ErrorPanel + "Reintentar" on fetch failure | 2.1 | Component | R-011 | 1 | Dev | MSW: network error response |
| AC-E2.3: Client detail panel shows all 4 fields | 2.2 | Component | — | 1 | Dev | Select client from list; assert Nombre, NIT/RUC, Teléfono, Ciudad |
| AC-E2.3: URL updates to /clientes/:clienteId on selection | 2.2 | E2E | R-009 | 1 | QA | Click item; assert URL param matches clienteId |
| AC-E2.3: Direct deep-link /clientes/:id loads correct detail | 2.2 | E2E | R-009 | 1 | QA | Navigate directly to known URL |
| Not-found message for unknown clienteId | 2.2 | Component | R-010 | 1 | QA | MSW: 404 response; assert graceful message |
| Edit pre-fills form with current client values | 2.4 | Component | — | 1 | Dev | Open edit; assert each input value matches current client data |
| Edit submit → list reflects changes immediately | 2.4 | E2E | R-003 | 1 | QA | Edit Nombre; assert updated Nombre in list panel |
| Edit cancel → original data unchanged | 2.4 | Component | R-008 | 1 | Dev | Dirty field, cancel; assert display unchanged |
| SortControl default = Más reciente on page load | 2.6 | Component | R-006 | 1 | Dev | No stored preference; assert active sort = `fecha-desc` |
| Sort applied to filtered set without clearing search | 2.6 | Unit | R-007 | 2 | Dev | Active filter + change sort; assert search input preserved + sorted subset |
| Delete with confirmation dialog and toast | 2.5 | E2E | — | 2 | QA | Confirm delete → client gone + toast; Cancel → client remains |

**Total P1:** 17 tests, ~17 hours

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (1–2) + Edge cases

| Requirement | Story | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-------|-----------|-----------|------------|-------|-------|
| Nombre A→Z sort orders list alphabetically ascending | 2.6 | Unit | — | 1 | Dev | Assert first item < last item by Nombre |
| Nombre Z→A sort orders list alphabetically descending | 2.6 | Unit | — | 1 | Dev | Assert first item > last item by Nombre |
| Más reciente sort orders by createdAt descending | 2.6 | Unit | — | 1 | Dev | Assert newer client appears first |
| Más antiguo sort orders by createdAt ascending | 2.6 | Unit | — | 1 | Dev | Assert older client appears first |
| Sort triggered client-side — no additional API call | 2.6 | Unit | — | 1 | Dev | Spy on queryClient.fetchQuery; assert 0 calls after sort change |
| Required fields inline error messages visible on submit | 2.3 | Component | — | 1 | Dev | Submit empty form; assert 4 inline error messages present |
| Toast "Cliente creado correctamente" after create | 2.3 | Component | — | 1 | Dev | MSW: 201 response; assert toast text |
| Toast "Cliente actualizado correctamente" after edit | 2.4 | Component | — | 1 | Dev | MSW: 200 response; assert toast text |
| Toast "Cliente eliminado correctamente" for client without contacts | 2.5 | Component | — | 1 | Dev | MSW: 204 response, no contacts; assert simple toast |
| Toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." | 2.5 | Component | — | 1 | Dev | MSW: 204 response, had contacts; assert specialized toast |
| Backend GET /api/v1/clientes/{unknown-id} returns 404 Problem Details | 2.2 | API | R-010 | 1 | QA | Assert status 404 + RFC 7807 shape |
| Editing required field cleared and submitted → inline error + no backend call | 2.4 | Component | — | 1 | Dev | Clear Nombre; submit; assert error visible, MSW spy = 0 calls |

**Total P2:** 12 tests, ~6 hours

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Story | Test Level | Test Count | Owner | Notes |
|-------------|-------|-----------|------------|-------|-------|
| Client-side filter performance: <100ms with 500 records | 2.1 | Unit | 1 | Dev | Benchmark useMemo filter with 500 clients |
| Search clears correctly when input is emptied | 2.1 | Component | 1 | Dev | Type then clear; assert full list restored |
| Cancelling create form: no client created (no POST fired) | 2.3 | Component | 1 | Dev | Open form, fill, cancel; assert MSW no POST received |
| Confirmation dialog cancel: client remains in list | 2.5 | Component | 1 | Dev | Click Eliminar, click Cancelar; assert client still in list |

**Total P3:** 4 tests, ~1 hour

---

## 4. Execution Order

### Smoke Tests (<5 min)

**Purpose:** Catch build-breaking issues before P0 suite runs

- [ ] `GET /api/v1/clientes` returns 200 with array (API) — 30s
- [ ] Client list page renders without JS errors (Component/E2E) — 45s
- [ ] Create client happy path: POST + 201 + appears in list (E2E) — 90s

**Total:** 3 scenarios

### P0 Tests (<10 min)

**Purpose:** Critical path validation — mandatory on every commit

- [ ] Create client — happy path E2E (2 tests)
- [ ] Required fields validation — Zod inline errors (3 Component tests)
- [ ] Required fields validation — backend 400 Problem Details (1 API test)
- [ ] Duplicate NIT/RUC — 409 API + frontend message (2 tests)
- [ ] Delete client → contacts orphaned (clienteId = null) (2 API tests)
- [ ] Mutation hooks invalidate `['clientes']` (3 Unit tests)

**Total:** 13 scenarios

### P1 Tests (<30 min)

**Purpose:** Important feature coverage — runs on PR to main

- [ ] Search filter unit test with 500 clients (2 Unit tests)
- [ ] Client list rendering (1 Component)
- [ ] EmptyState and ErrorPanel states (2 Component tests)
- [ ] Detail panel binding + URL update (2 E2E tests)
- [ ] Deep-link direct access (1 E2E)
- [ ] Not-found state (1 Component)
- [ ] Edit pre-fill + update + cancel (3 Component tests)
- [ ] Sort default + filter-preservation (3 Unit/Component tests)
- [ ] Delete E2E with dialog confirm/cancel (2 E2E tests)

**Total:** 17 scenarios

### P2/P3 Tests (<60 min)

**Purpose:** Full regression coverage

- [ ] Four sort mode unit tests (4 Unit)
- [ ] No-API-call on sort (1 Unit)
- [ ] Form UX: error messages, toasts, cancel (8 Component tests)
- [ ] Backend 404 API test (1 API)
- [ ] P3: performance benchmark, empty search, cancel flows (4 tests)

**Total:** 18 scenarios

---

## 5. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|-----------|-------------|-------|
| P0 | 13 | 2.0 | 26 hours | Complex setup: MSW mocks, mutation spy, API integration |
| P1 | 17 | 1.0 | 17 hours | Standard E2E + Component coverage |
| P2 | 12 | 0.5 | 6 hours | Edge cases, simple component assertions |
| P3 | 4 | 0.25 | 1 hour | Benchmarks and exploratory |
| **Total** | **46** | — | **50 hours** | **~7 days** |

### Prerequisites

**Test Data:**

- `clienteFactory` — faker-based: generates `{ id: uuid, nombre, nit, telefono, ciudad, createdAt, updatedAt }`. Auto-cleanup after each test.
- `clienteWithContactsFixture` — creates client + 1–3 linked contacts; deletes all on teardown.
- `bulkClientesFixture` — seeds exactly 500 clients for NFR1 performance tests.
- MSW handlers for `GET /api/v1/clientes`, `GET /api/v1/clientes/:id`, `POST /api/v1/clientes`, `PUT /api/v1/clientes/:id`, `DELETE /api/v1/clientes/:id`.

**Tooling:**

- Vitest + @testing-library/react — Unit and Component tests (frontend)
- MSW (Mock Service Worker) — API response mocking in component tests
- Playwright — E2E tests (smoke, P0/P1 user journeys)
- xUnit + WebApplicationFactory — API integration tests (.NET backend)
- EF Core In-Memory / PostgreSQL test container — backend integration data layer

**Environment:**

- Frontend dev server at `localhost:5173` with Vite HMR
- Backend API at `localhost:5000` (HTTP) connected to test PostgreSQL instance
- TanStack QueryClient with `retry: 0` and `staleTime: 0` in test wrappers to prevent caching interference

---

## 6. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions — any P0 failure blocks merge)
- **P1 pass rate:** ≥95% (1 waiver per sprint maximum; requires Tech Lead approval)
- **P2/P3 pass rate:** ≥90% (informational; failures do not block release)
- **High-risk mitigations (score ≥6):** 100% complete or approved waivers before epic sign-off

### Coverage Targets

- **Critical paths (CRUD happy paths):** ≥80%
- **Security/validation scenarios (FR8, NFR5, NFR6):** 100%
- **Business logic (sort, filter, orphan handling):** ≥70%
- **Edge cases (not-found, cancel flows, EmptyState):** ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk item (score ≥6) unmitigated
- [ ] R-001 (orphan contacts) verified via API integration test
- [ ] R-002 (NIT/RUC 409) verified at API + Component level
- [ ] R-005 (validation dual-layer) verified via Zod unit test + FluentValidation API test
- [ ] NFR1 (search <1s) verified via unit benchmark with 500 records

---

## 7. Mitigation Plans

### R-001: Client delete orphans contacts (Score: 6)

**Mitigation Strategy:** Verify EF Core `ContactoConfiguration.cs` declares `ON DELETE SET NULL` for the `ClienteID` FK. Add API integration test (xUnit + WebApplicationFactory) that creates a client, creates a contact linked to that client, calls `DELETE /api/v1/clientes/{id}`, then calls `GET /api/v1/contactos/{contactId}` and asserts `clienteId == null` and HTTP 200 (not 404 or 500).
**Owner:** Dev (EF Core config) + QA (integration test)
**Timeline:** Story 2.5 implementation start
**Status:** Planned
**Verification:** API integration test `ClienteEndpointsTests.cs::DeleteCliente_WithContacts_SetsContactClienteIdToNull` passes green.

### R-002: Duplicate NIT/RUC 409 handling (Score: 6)

**Mitigation Strategy:** API test asserts that `POST /api/v1/clientes` with a duplicate NIT returns HTTP 409 and a Problem Details body containing `title: "Conflict"` and detail text with "NIT" reference. Component test renders the form, mocks the 409 response via MSW, submits, and asserts the UI shows exactly "El NIT/RUC ya está registrado" — no raw error JSON.
**Owner:** Dev (backend 409 response) + QA (both tests)
**Timeline:** Story 2.3 implementation start
**Status:** Planned
**Verification:** Two tests pass: `CreateCliente_DuplicateNit_Returns409` (API) + `ClienteForm_DuplicateNit_ShowsUserFriendlyMessage` (Component).

### R-003: TanStack Query invalidation on mutations (Score: 6)

**Mitigation Strategy:** Unit test each of `useCreateCliente`, `useUpdateCliente`, and `useDeleteCliente` hooks using `renderHook` + a test `QueryClient`. Spy on `queryClient.invalidateQueries`. After simulating a successful mutation, assert the spy was called with `{ queryKey: ['clientes'] }`. Failure here means the list silently stales after any CRUD action (FR27 violation).
**Owner:** Dev
**Timeline:** Per story (2.3, 2.4, 2.5)
**Status:** Planned
**Verification:** Three unit tests pass; stale list behavior confirmed absent in E2E smoke test.

### R-004: Client-side filter performance with 500 records (Score: 6)

**Mitigation Strategy:** Unit test using `renderHook` + `useMemo` filter logic: seed 500 mock clients in the query cache, set search query to a 3-character string expected to match ~10% of the list, assert filtered result count and measure execution time with `performance.now()`. Assert time < 100ms (well within NFR1's 1s budget).
**Owner:** Dev
**Timeline:** Story 2.1
**Status:** Planned
**Verification:** Unit test `useClientes_Filter_Returns500RecordsInUnder100ms` passes green.

### R-005: Dual-layer validation Zod + FluentValidation (Score: 6)

**Mitigation Strategy:**
- Zod: Unit test `clienteSchema.ts` — assert each of Nombre, NIT/RUC, Teléfono, Ciudad fails validation when empty and returns a field-level error message.
- FluentValidation: API integration test — `POST /api/v1/clientes` with body `{}` asserts HTTP 400 + Problem Details RFC 7807 with `errors` map listing all four required fields.
- Combined: Component test submits empty form, asserts 4 inline error labels visible, asserts MSW spy received 0 POST calls (form blocked client-side).
**Owner:** Dev (schema) + QA (API test)
**Timeline:** Story 2.3
**Status:** Planned
**Verification:** Three tests pass: Zod unit, FluentValidation API, Component block-on-empty.

---

## 8. Test Scenarios — Detail

### Story 2.1: Client List & Search

| ID | Scenario | AC Ref | Level | Priority |
|----|----------|--------|-------|----------|
| T2.1-001 | Client list loads and renders Nombre + NIT/RUC per item | AC-E2.1 | Component | P1 |
| T2.1-002 | EmptyState shown when API returns empty array | — | Component | P1 |
| T2.1-003 | ErrorPanel + "Reintentar" button shown on fetch failure | — | Component | P1 |
| T2.1-004 | Search by Nombre filters list in real-time (useMemo) | AC-E2.2 | Unit | P1 |
| T2.1-005 | Search by NIT/RUC filters list in real-time | AC-E2.2 | Unit | P1 |
| T2.1-006 | Performance: filter 500 records in <100ms | NFR1 | Unit | P3 |
| T2.1-007 | Search input cleared → full list restored | — | Component | P3 |

### Story 2.2: Client Detail View

| ID | Scenario | AC Ref | Level | Priority |
|----|----------|--------|-------|----------|
| T2.2-001 | Click client item → detail panel shows Nombre, NIT/RUC, Teléfono, Ciudad | AC-E2.3 | Component | P1 |
| T2.2-002 | Clicking client item updates URL to /clientes/:clienteId | FR30 | E2E | P1 |
| T2.2-003 | Direct navigation to /clientes/:clienteId loads correct client | FR30 | E2E | P1 |
| T2.2-004 | Unknown clienteId in URL shows graceful not-found message | — | Component | P1 |
| T2.2-005 | Backend GET /api/v1/clientes/{unknown-uuid} returns 404 + Problem Details | — | API | P2 |

### Story 2.3: Create Client

| ID | Scenario | AC Ref | Level | Priority |
|----|----------|--------|-------|----------|
| T2.3-001 | Happy path: fill all fields → submit → client in list + success toast | AC-E2.1 | E2E | P0 |
| T2.3-002 | Happy path E2E: new client appears in list without page reload | AC-E2.1, FR27 | E2E | P0 |
| T2.3-003 | useCreateCliente mutation calls invalidateQueries(['clientes']) on success | FR27 | Unit | P0 |
| T2.3-004 | Empty form submit: 4 inline errors visible, no POST fired | AC-E2.4, FR8 | Component | P0 |
| T2.3-005 | Nombre field required: inline error on blur/submit | AC-E2.4 | Component | P0 |
| T2.3-006 | NIT/RUC field required: inline error on blur/submit | AC-E2.4 | Component | P0 |
| T2.3-007 | Teléfono field required: inline error | AC-E2.4 | Component | P0 |
| T2.3-008 | Ciudad field required: inline error | AC-E2.4 | Component | P0 |
| T2.3-009 | Backend POST with empty body returns 400 + Problem Details errors map | NFR5 | API | P0 |
| T2.3-010 | Duplicate NIT/RUC returns 409 from backend | — | API | P0 |
| T2.3-011 | Duplicate NIT/RUC: frontend shows "El NIT/RUC ya está registrado" | AC (2.3) | Component | P0 |
| T2.3-012 | Clienteā schema Zod: all 4 fields assert required error when empty | NFR5 | Unit | P0 |
| T2.3-013 | Toast "Cliente creado correctamente" appears after successful creation | — | Component | P2 |
| T2.3-014 | Cancel create form: no POST request sent | — | Component | P3 |

### Story 2.4: Edit Client

| ID | Scenario | AC Ref | Level | Priority |
|----|----------|--------|-------|----------|
| T2.4-001 | Clicking "Editar" opens form pre-filled with current client values | AC (2.4) | Component | P1 |
| T2.4-002 | Edit + save → list reflects updated values immediately | FR27 | E2E | P1 |
| T2.4-003 | useUpdateCliente mutation calls invalidateQueries(['clientes']) on success | FR27 | Unit | P0 |
| T2.4-004 | Clearing required field + submit → inline error, no PUT request | AC-E2.4, FR8 | Component | P2 |
| T2.4-005 | Cancel edit → original data displayed unchanged | — | Component | P1 |
| T2.4-006 | Toast "Cliente actualizado correctamente" after successful edit | — | Component | P2 |

### Story 2.5: Delete Client

| ID | Scenario | AC Ref | Level | Priority |
|----|----------|--------|-------|----------|
| T2.5-001 | Clicking "Eliminar" shows confirmation dialog with "Confirmar" + "Cancelar" | AC (2.5) | Component | P1 |
| T2.5-002 | Confirm deletion → client removed from list + right panel resets | AC-E2.5 | E2E | P1 |
| T2.5-003 | useDeleteCliente mutation calls invalidateQueries(['clientes']) on success | FR27 | Unit | P0 |
| T2.5-004 | DELETE client with linked contacts → contacts clienteId = null (API integration) | AC (2.5), FR23 | API | P0 |
| T2.5-005 | DELETE client with linked contacts → contacts clienteId = null (API integration) duplicate check | AC (2.5), FR23 | API | P0 |
| T2.5-006 | Cancel dialog → client still in list | — | Component | P3 |
| T2.5-007 | Toast "Cliente eliminado correctamente" for client without contacts | — | Component | P2 |
| T2.5-008 | Toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." for client with contacts | AC (2.5) | Component | P2 |

### Story 2.6: Sort Client List

| ID | Scenario | AC Ref | Level | Priority |
|----|----------|--------|-------|----------|
| T2.6-001 | Default sort on page load = "Más reciente" (fecha-desc) | AC-E2.6 | Component | P1 |
| T2.6-002 | Nombre A→Z: list sorted alphabetically ascending | AC-E2.6 | Unit | P2 |
| T2.6-003 | Nombre Z→A: list sorted alphabetically descending | AC-E2.6 | Unit | P2 |
| T2.6-004 | Más reciente: newest client first (createdAt desc) | AC-E2.6 | Unit | P2 |
| T2.6-005 | Más antiguo: oldest client first (createdAt asc) | AC-E2.6 | Unit | P2 |
| T2.6-006 | Sort change with active search: search input preserved | AC-E2.6 | Unit | P1 |
| T2.6-007 | Sort change with active search: sorted result is subset of filtered list | AC-E2.6 | Unit | P1 |
| T2.6-008 | Sort change does not trigger a new API call (no invalidateQueries) | AC-E2.6 | Unit | P2 |

---

## 9. Assumptions and Dependencies

### Assumptions

1. Epic 1 (foundation, navigation shell, database foundation) is complete and the test environment (frontend + backend + PostgreSQL) is operational before Epic 2 testing begins.
2. `ON DELETE SET NULL` FK constraint is correctly declared in `ContactoConfiguration.cs` by the developer implementing Story 2.5 (validated by R-001 test).
3. MSW handlers for all `/api/v1/clientes` endpoints are set up in the shared test setup before Story 2.1 component tests run.
4. `siesa-ui-kit` toast component is available and functional (validated in Epic 1); only the message text is tested here.
5. The `SortControl` component at `src/shared/components/SortControl` is implemented with the four option identifiers (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`) as specified in the epic.

### Dependencies

1. `clienteFactory` (faker-based) — Required before any API integration or E2E test. Implement in `tests/helpers/clienteFactory.ts`.
2. MSW handler set `handlers/clientes.ts` — Required before component tests. Must cover all 5 CRUD endpoints.
3. `CreateClienteRequestValidator.cs` with FluentValidation — Required before API test T2.3-009. Validates Nombre, NIT, Teléfono, Ciudad as required.
4. EF Core migration with `ix_clientes_nit` unique index — Required before T2.3-010 (409 test).

### Risks to Plan

- **Risk:** EF Core `ON DELETE SET NULL` may not be supported automatically if cascade behavior is misconfigured.
  - **Impact:** Contacts deleted instead of orphaned; data loss scenario.
  - **Contingency:** If FK cascade is wrong, escalate to Dev immediately; do not ship Story 2.5 until R-001 test passes.

- **Risk:** siesa-ui-kit `SortControl` API may differ from assumed `onChange(sortId: string)` contract.
  - **Impact:** Story 2.6 component integration may require adapter pattern.
  - **Contingency:** Check siesa-ui-kit docs before implementing T2.6-001 through T2.6-008; adjust test selectors accordingly.

---

## 10. Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests from acceptance criteria (Story 2.3 and 2.5 most critical).
- Run `*automate` for E2E coverage automation once implementation is stable.
- Run `*trace` to validate requirements traceability matrix after Epic 2 completes.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: — Date: —
- [ ] Tech Lead: — Date: —
- [ ] QA Lead: — Date: —

**Comments:**

---

## Appendix

### Requirements Traceability

| FR/NFR | Covered By | Priority |
|--------|-----------|----------|
| FR1 (Create client) | T2.3-001, T2.3-002 | P0 |
| FR2 (List clients) | T2.1-001 | P1 |
| FR3 (Search by name) | T2.1-004 | P1 |
| FR4 (Search by NIT/RUC) | T2.1-005 | P1 |
| FR5 (View detail) | T2.2-001 | P1 |
| FR6 (Edit client) | T2.4-001, T2.4-002 | P1 |
| FR7 (Delete client) | T2.5-002 | P1 |
| FR8 (Required field validation) | T2.3-004–T2.3-009, T2.4-004 | P0/P2 |
| FR27 (Immediate update for all users) | T2.3-003, T2.4-003, T2.5-003 | P0 |
| FR30 (Deep linking) | T2.2-002, T2.2-003 | P1 |
| NFR1 (Search <1s) | T2.1-006 | P3 |
| NFR2 (CRUD <2s) | T2.3-001, T2.4-002 (E2E timing assertion) | P0/P1 |
| NFR5 (Validation/sanitization) | T2.3-009, T2.3-012 | P0 |
| NFR6 (No stack traces) | T2.2-005 (Problem Details shape) | P2 |

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories, scoring gate)
- `probability-impact.md` — Probability × impact matrix used for R-001 through R-012
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision rationale
- `test-priorities-matrix.md` — P0–P3 assignment criteria applied above

### Related Documents

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 1 Test Design (reference): `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
