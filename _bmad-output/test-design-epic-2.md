# Test Design: Epic 2 - Client Management

**Date:** 2026-06-24
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic Source:** `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (Gestión de Clientes)

Epic 2 implements the complete CRUD lifecycle for client records: listing, searching, creating, viewing details, editing, deleting, and sorting. It covers FR1–FR8 plus the real-time update requirement (FR27), deep-linking (FR30), and client-side sorting (AC-E2.6). This is the first epic with domain business logic, user-facing forms, validation feedback, and API contract obligations.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR27, FR30
**NFRs covered:** NFR1 (search < 1s), NFR2 (CRUD < 2s), NFR5 (input sanitization), NFR6 (no stack traces), NFR7 (usability — no training required), NFR8 (≤2 clicks to contacts)

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (score ≥6): 4
- Critical categories: DATA, BUS, PERF, SEC

**Coverage Summary:**

| Priority | Scenarios | Effort (hours) |
|----------|-----------|---------------|
| P0       | 12        | 24.0          |
| P1       | 16        | 16.0          |
| P2       | 10        | 5.0           |
| P3       | 5         | 1.25          |
| **Total**| **43**    | **46.25 (~6 days)** |

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | NIT/RUC uniqueness constraint not enforced at database level or not handled gracefully — duplicate NITs possible, or 409 response leaks raw DB error. | 2 | 3 | 6 | API integration test: POST duplicate NIT → assert 409 + Problem Details body with message "El NIT/RUC ya está registrado"; assert no stack trace in response; verify `uk_clientes_nit` index exists in migration | DEV/QA | Sprint 2 Day 1 |
| R-002 | BUS | Client list does not update immediately after create/edit/delete — TanStack Query cache not invalidated, violating FR27 and AC-E2.1/E2.3/E2.5. User sees stale data. | 2 | 3 | 6 | E2E test: create client → assert appears in list within 2s without manual refresh; delete client → assert removed; edit client → assert updated values in list and detail panel | QA | Sprint 2 Day 2 |
| R-003 | BUS | Required-field validation missing or incomplete — user can submit form with empty fields, creating invalid client records in DB. Violates FR8 and AC-E2.4. | 2 | 3 | 6 | Component + E2E test: submit form with each required field (Nombre, NIT/RUC, Teléfono, Ciudad) blank individually → assert inline error message per field → assert no API call made (MSW intercept confirms no request) | QA/DEV | Sprint 2 Day 1 |
| R-004 | PERF | Client list search performance degrades above 200 records due to unoptimized client-side filter or missing memoization in `useMemo`. Violates NFR1 (< 1s with 500 records). | 2 | 3 | 6 | Performance test with 500 seeded clients: measure filter render time on each keypress with Vitest benchmark or Playwright `performance.now()`; assert < 1000ms wall clock from input change to list update | QA/DEV | Sprint 2 Day 3 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-005 | TECH | Deep link to `/clientes/:clienteId` with invalid/nonexistent ID renders blank page or throws unhandled error instead of graceful not-found message. Violates AC-E2.2 (detail view). | 2 | 2 | 4 | E2E test: navigate directly to `/clientes/00000000-0000-0000-0000-000000000000`; assert not-found message displayed, no unhandled exception in console | QA | Sprint 2 Day 2 |
| R-006 | SEC | Backend accepts and stores unsanitized input (XSS payload, SQL injection pattern) in Nombre or NIT fields. Violates NFR5. | 2 | 2 | 4 | API integration test: POST client with `<script>alert(1)</script>` as Nombre; assert 400 or stored safely; assert when rendered in UI, no script executes (React auto-escapes, but backend should sanitize too) | QA | Sprint 2 Day 2 |
| R-007 | DATA | Delete of a client with associated contacts (future Epic 4 data) does not cascade correctly — contacts not set to `clienteId = null`. While Epic 4 is not yet implemented, the FK constraint must be verified now. | 1 | 3 | 3 | Backend unit test: DeleteClienteCommandHandler with mocked IClienteRepository; verify ON DELETE SET NULL constraint defined in `ContactoConfiguration.cs`; integration test once Epic 4 is available | DEV | Sprint 2 Day 3 |
| R-008 | BUS | Sort state is not preserved when active search filter is applied — changing sort clears search input or triggers a new API call, violating AC-E2.6 technical context. | 2 | 2 | 4 | Component test (Vitest + RTL): render ClienteListView with active search + change sort → assert search input unchanged, list shows filtered+sorted results, no additional network call | QA/DEV | Sprint 2 Day 3 |
| R-009 | TECH | Cancel button on Edit form resets form to initial values but leaves the detail panel showing stale data (pre-edit snapshot vs current DB state). | 1 | 2 | 2 | E2E test: open edit form, modify fields, click "Cancelar"; assert detail panel shows original values unchanged | QA | Sprint 2 Day 3 |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-010 | OPS | EmptyState component not rendered when client list is truly empty — list shows blank div instead of guided message. | 1 | 2 | 2 | Component test: render ClienteListView with empty `[]` data; assert EmptyState component present with guidance text | Monitor |
| R-011 | OPS | ErrorPanel "Reintentar" button does not trigger a new fetch after network failure on list load. | 1 | 2 | 2 | Component test: mock API error, assert ErrorPanel rendered; click "Reintentar" → assert refetch called | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### Story Coverage Breakdown

| Story | Description | Primary Test Focus |
|-------|-------------|-------------------|
| 2.1 | Client List & Search | List display, real-time filter, empty state, error state |
| 2.2 | Client Detail View | Detail panel, URL deep link, 404 for unknown ID |
| 2.3 | Create Client | Form validation, successful create, duplicate NIT handling, immediate list update |
| 2.4 | Edit Client | Pre-filled form, save changes reflect immediately, cancel leaves data unchanged |
| 2.5 | Delete Client | Confirmation dialog, deletion + list update, cancel no-op, contact orphan behavior |
| 2.6 | Sort Client List | All 4 sort options, default sort, sort preserves active search filter |

---

### P0 (Critical) — Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Req / AC | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|----------|------------|-----------|----------------------|------------|-------|
| AC-E2.1 — Create client appears in list | E2E | R-002 | Fill form with Nombre, NIT/RUC, Teléfono, Ciudad → submit → assert client appears in left-panel list within 2s without manual refresh; assert success toast "Cliente creado correctamente" | 2 | QA |
| AC-E2.4 — Required field validation blocks submit | E2E | R-003 | Submit create form with each required field blank one at a time (4 cases); assert inline error per field; assert no POST request made (network idle) | 2 | QA |
| Story 2.3 — Duplicate NIT returns user-friendly error | API | R-001 | POST `/api/v1/clientes` with NIT that already exists; assert HTTP 409; assert response body is Problem Details (status=409, title present, detail contains "NIT/RUC"); assert no stack trace in body | 2 | QA |
| AC-E2.5 — Delete removes client from list | E2E | R-002 | View client detail → click "Eliminar" → confirm dialog → assert client removed from list within 2s; assert toast "Cliente eliminado correctamente"; assert right panel returns to default state | 2 | QA |
| AC-E2.3 — Edit reflects changes immediately | E2E | R-002 | Open edit form → change Nombre and Ciudad → save → assert updated values in detail panel and list within 2s; assert toast "Cliente actualizado correctamente" | 2 | QA |
| Story 2.3 — Backend validates required fields | API | R-003 | POST `/api/v1/clientes` with missing Nombre, NIT, Teléfono, Ciudad (each individually); assert HTTP 400 + Problem Details `errors` field per missing field | 2 | DEV |

**Total P0**: 12 tests, 24.0 hours

---

### P1 (High) — Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Req / AC | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|----------|------------|-----------|----------------------|------------|-------|
| AC-E2.1 — List shows clients with Nombre and NIT/RUC | E2E | — | Navigate to `/clientes` with seeded clients; assert left panel (280px) shows scrollable list; each item displays Nombre and NIT/RUC | 1 | QA |
| AC-E2.2 — Search filters in real time | E2E | R-004 | Type partial Nombre in search field; assert list shows only matching clients; type partial NIT/RUC; assert correct subset | 2 | QA |
| AC-E2.1 — Empty state on no clients | Component | R-010 | Render `ClienteListView` with empty response; assert `EmptyState` component rendered with guidance message | 1 | QA |
| AC-E2.1 — Error panel on load failure | Component | R-011 | Render `ClienteListView` with API error (MSW intercept 500); assert `ErrorPanel` with "Reintentar" button rendered; click → assert `refetch` invoked | 1 | QA |
| AC-E2.2 — Click client updates URL and detail | E2E | R-005 | Click client in list → assert URL changes to `/clientes/:clienteId`; assert right panel shows Nombre, NIT/RUC, Teléfono, Ciudad of clicked client | 2 | QA |
| AC-E2.2 — Deep link loads correct client | E2E | R-005 | Navigate directly to `/clientes/{known-uuid}`; assert correct client details rendered without navigating from list | 1 | QA |
| AC-E2.2 — Unknown clienteId shows not-found | E2E | R-005 | Navigate directly to `/clientes/00000000-0000-0000-0000-000000000000`; assert not-found message gracefully displayed; no console error thrown | 1 | QA |
| AC-E2.4 — Edit form pre-filled | E2E | — | Click "Editar" on a client detail; assert form opens with all current field values pre-filled (Nombre, NIT/RUC, Teléfono, Ciudad) | 1 | QA |
| AC-E2.5 — Cancel delete — client unchanged | E2E | — | Click "Eliminar" → confirmation dialog appears → click "Cancelar" → assert client still in list and detail panel | 1 | QA |
| AC-E2.4 — Clear required field in edit form | E2E | R-003 | In edit form, clear Nombre → submit → assert inline error message; assert no PUT request made | 1 | QA |
| AC-E2.4 — Cancel edit preserves original data | E2E | R-009 | Open edit form, change Nombre, click "Cancelar"; assert detail panel shows original Nombre unchanged | 1 | QA |
| Story 2.6 — Default sort is Más reciente | Component | — | Render `ClienteListView`; assert `SortControl` displays "Más reciente" as selected option on initial render | 1 | QA |
| Story 2.6 — Nombre A→Z sort reorders list | Component | R-008 | Render with 3 clients (B, A, C); select "Nombre A→Z"; assert order: A, B, C; verify no additional API call fired | 1 | QA |
| Story 2.6 — Sort preserves active search | Component | R-008 | Set search filter to partial match; change sort option; assert search input unchanged; assert sorted results are subset of filtered list | 1 | QA |

**Total P1**: 16 tests, 16.0 hours

---

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Req / AC | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|----------|------------|-----------|----------------------|------------|-------|
| AC-E2.2 — Search results < 1s with 500 records | Performance | R-004 | Seed 500 clients; measure time from keypress to list re-render; assert < 1000ms via Vitest benchmark on `useMemo` filter function | 1 | QA/DEV |
| Story 2.6 — Nombre Z→A sort | Component | — | Select "Nombre Z→A"; assert descending alphabetical order; no API call | 1 | QA |
| Story 2.6 — Más antiguo sort | Component | — | Select "Más antiguo"; assert oldest `createdAt` first; no API call | 1 | QA |
| Story 2.6 — Más reciente sort | Component | — | Select "Más reciente"; assert newest `createdAt` first; no API call | 1 | QA |
| AC-E2.5 — Delete client with contacts preserves contacts | API | R-007 | (Pre-Epic 4 validation) Verify `ContactoConfiguration.cs` defines ON DELETE SET NULL for `cliente_id` FK; backend unit test for DeleteClienteCommandHandler contract | 1 | DEV |
| Story 2.3 — Input sanitization | API | R-006 | POST client with XSS payload in Nombre (`<script>alert(1)</script>`); assert 400 or safely stored; GET client; assert no raw HTML in response; render in UI and assert no script execution | 1 | QA |
| AC-E2.5 — Toast with contact orphan message | E2E | — | (Deferred until Epic 4 contacts exist) Verify toast text "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." when client with contacts is deleted | 1 | QA |
| Story 2.3 — Success toast text exact | E2E | — | Create client; assert toast text is exactly "Cliente creado correctamente" (exact string match) | 1 | QA |
| Story 2.4 — Success toast text exact | E2E | — | Edit client; assert toast text is exactly "Cliente actualizado correctamente" | 1 | QA |
| Story 2.5 — Toast delete text exact | E2E | — | Delete client (no contacts); assert toast is exactly "Cliente eliminado correctamente" | 1 | QA |

**Total P2**: 10 tests, 5.0 hours

---

### P3 (Low) — Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Req / AC | Test Level | Scenario Description | Test Count | Owner |
|----------|------------|----------------------|------------|-------|
| NFR7 — Usability: core task without training | E2E | New user flow: navigate to /clientes, click "Nuevo cliente", fill form, save, find in list — assert all actions discoverable with zero prior knowledge (label text, placeholders in Spanish) | 1 | QA |
| NFR8 — 2 clicks to contacts | E2E | From client list (click 1: select client) → from detail view (click 2: ContactManager visible without further navigation); assert contact section visible in detail panel | 1 | QA |
| Story 2.3 — Mobile form usability | E2E | At 390px viewport: open create form; assert all fields visible and tappable without horizontal scroll; submit form successfully | 1 | QA |
| Story 2.6 — SortControl identifier values | Unit | Assert `SortControl` accepts and renders `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc` option identifiers without error | 1 | DEV |
| NFR3 — Concurrent users (10) | Performance | Simulate 10 concurrent GET /api/v1/clientes requests; assert all return HTTP 200 within 2s; no 5xx responses (k6 or load test script) | 1 | QA |

**Total P3**: 5 tests, 1.25 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback — confirm CRUD API endpoints are reachable before any other tests run

- [ ] GET `/api/v1/clientes` returns HTTP 200 (30s)
- [ ] POST `/api/v1/clientes` with valid body returns 201 (45s)
- [ ] GET `/api/v1/clientes/{id}` returns 200 for existing record (30s)
- [ ] Navigate to `/clientes` — left panel renders within 3s (60s)

**Total**: 4 scenarios (~2.5 min)

### P0 Tests (<10 min)

**Purpose**: Critical path validation — block merge if any fail

- [ ] Create client → appears in list immediately; toast shown (E2E)
- [ ] Submit create form with blank Nombre → inline error, no API call (E2E)
- [ ] Submit create form with blank NIT/RUC → inline error, no API call (E2E)
- [ ] Submit create form with blank Teléfono → inline error, no API call (E2E)
- [ ] Submit create form with blank Ciudad → inline error, no API call (E2E)
- [ ] POST duplicate NIT → 409 Problem Details, user-friendly message (API)
- [ ] POST duplicate NIT → no stack trace in response body (API)
- [ ] Edit client → changes visible in list + detail within 2s (E2E)
- [ ] Delete client → removed from list within 2s; toast shown (E2E)
- [ ] POST with missing Nombre → 400 Problem Details with `errors.nombre` (API)
- [ ] POST with missing NIT → 400 Problem Details with `errors.nit` (API)
- [ ] POST with all required fields missing → 400 Problem Details with all error fields (API)

**Total**: 12 scenarios

### P1 Tests (<30 min)

**Purpose**: Full client management feature coverage

- [ ] Client list renders with Nombre and NIT/RUC per item (E2E)
- [ ] Search by partial Nombre filters list in real time (E2E)
- [ ] Search by partial NIT/RUC filters list in real time (E2E)
- [ ] Empty list renders EmptyState component with guidance (Component)
- [ ] API error on list load renders ErrorPanel with Reintentar button (Component)
- [ ] Reintentar button triggers refetch (Component)
- [ ] Click client item → URL updates to /clientes/:id; detail panel populated (E2E)
- [ ] Direct navigate to /clientes/{uuid} → correct client loaded (E2E)
- [ ] Direct navigate to /clientes/{invalid-uuid} → not-found message (E2E)
- [ ] Edit form opens pre-filled with all current field values (E2E)
- [ ] Clear required field in edit form → inline error, no PUT (E2E)
- [ ] Cancel edit → detail panel shows unchanged original data (E2E)
- [ ] Cancel delete → client still present in list (E2E)
- [ ] Default sort is "Más reciente" on initial load (Component)
- [ ] Select "Nombre A→Z" → list reorders ascending; no API call (Component)
- [ ] Active search + sort change → search input unchanged, list filtered+sorted (Component)

**Total**: 16 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression, edge cases, performance, and compliance

- [ ] Search with 500 seeded clients < 1s (Performance)
- [ ] Nombre Z→A sort reorders descending (Component)
- [ ] Más antiguo sort: oldest first (Component)
- [ ] Más reciente sort: newest first (Component)
- [ ] ON DELETE SET NULL FK verified in ContactoConfiguration (Unit)
- [ ] XSS payload in Nombre rejected or stored safely (API)
- [ ] Create toast exact text: "Cliente creado correctamente" (E2E)
- [ ] Edit toast exact text: "Cliente actualizado correctamente" (E2E)
- [ ] Delete toast exact text: "Cliente eliminado correctamente" (E2E)
- [ ] SortControl identifier values render without error (Unit)
- [ ] Core task completable without training: mobile 390px form (E2E)
- [ ] 2-click path to contact section visible from detail (E2E)
- [ ] 10 concurrent GET /api/v1/clientes → all 200 within 2s (Performance)
- [ ] Delete client with contacts → orphan toast message (E2E, deferred to Epic 4)
- [ ] Mobile form: all fields visible and tappable at 390px (E2E)

**Total**: 15 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 12 | 2.0 | 24.0 | Form validation, API contract, cache invalidation |
| P1 | 16 | 1.0 | 16.0 | CRUD flows, routing, sort/search component logic |
| P2 | 10 | 0.5 | 5.0 | Edge cases, exact text, FK verification |
| P3 | 5 | 0.25 | 1.25 | Performance, usability, exploratory |
| **Total** | **43** | — | **46.25** | **~6 days** |

### Test Level Distribution

| Level | Count | Rationale |
|-------|-------|-----------|
| E2E (Playwright) | 20 | Full user journeys require browser: list→detail→form→toast→list update |
| API/Integration | 8 | HTTP contract, status codes, Problem Details, duplicate NIT — requires running API |
| Component (Vitest + RTL) | 10 | Sort logic, empty state, error state, search filter — isolated, fast |
| Unit | 3 | Zod schema, FK config, SortControl identifiers — pure logic, no DOM |
| Performance | 2 | Filter benchmark (Vitest) + concurrency test (k6) |

### Prerequisites

**Test Data:**
- Client factory (faker-based): `{ nombre: faker.company.name(), nit: faker.string.numeric(10), telefono: faker.phone.number(), ciudad: faker.location.city() }`
- Seeded dataset of 500 clients for performance tests
- Known UUID fixtures for deep-link tests (pre-created in DB setup)
- Auto-cleanup via `afterEach` or test database reset per suite

**Tooling:**
- Playwright (Chromium) for E2E and API integration tests
- Vitest + `@testing-library/react` + MSW for Component and Unit tests
- `dotnet test` with xUnit for backend unit tests (`SiesaAgents.UnitTests`)
- xUnit + `WebApplicationFactory<Program>` for API integration tests (`SiesaAgents.IntegrationTests`)
- k6 (optional) for concurrent-user load test (P3)

**Environment:**
- PostgreSQL `siesa_agents_db` running with Epic 1 migrations applied
- Additional migration for `clientes` table (Epic 2 story 2.3 schema)
- Backend on `http://localhost:5000`
- Frontend dev server on `http://localhost:5173`
- MSW service worker registered in Vitest setup for component tests

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — zero exceptions, blocks merge to main
- **P1 pass rate**: ≥95% — single failure requires tech lead waiver
- **P2/P3 pass rate**: ≥90% — informational, does not block merge
- **High-risk mitigations (R-001, R-002, R-003, R-004)**: 100% implemented and verified before Epic 3 starts

### Coverage Targets

- **Critical paths (create, edit, delete CRUD)**: ≥80%
- **Validation scenarios (required fields + duplicate NIT)**: 100%
- **Security tests (NFR5 sanitization, NFR6 no stack traces)**: 100%
- **Business logic (sort + search + cache invalidation)**: ≥70%
- **Edge cases (deep link 404, cancel flows, empty state)**: ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass before any Epic 3 story starts
- [ ] Duplicate NIT returns 409 with user-friendly message — not 500
- [ ] No stack traces in any API error response (NFR6)
- [ ] Required field validation blocks submission in both frontend (Zod) and backend (FluentValidation)
- [ ] Client list updates within 2s after every mutation (FR27 / NFR2)
- [ ] Search returns results in under 1s with 500 records (NFR1)

---

## Mitigation Plans

### R-001: Duplicate NIT Not Handled Gracefully (Score: 6)

**Mitigation Strategy:** Verify `uk_clientes_nit` unique index is defined in `ClienteConfiguration.cs` (EF Core) and in the migration. In `CreateClienteCommandHandler`, catch `DbUpdateException` (or Npgsql's `PostgresException` with code `23505`) and throw a domain exception that maps to HTTP 409 in `ExceptionHandlingMiddleware`. The Problem Details `detail` field must contain "El NIT/RUC ya está registrado" — no raw DB error message.

**Owner:** DEV
**Timeline:** Story 2.3 implementation
**Status:** Planned
**Verification:** P0 API test — POST duplicate NIT → 409 + Problem Details; P0 E2E test — UI shows error message without technical details

---

### R-002: Cache Not Invalidated After Mutations (Score: 6)

**Mitigation Strategy:** Enforce TanStack Query invalidation pattern in every mutation hook:
- `useCreateCliente`: `invalidateQueries({ queryKey: ['clientes'] })` on `onSuccess`
- `useUpdateCliente`: `invalidateQueries({ queryKey: ['clientes'] })` + `invalidateQueries({ queryKey: ['clientes', id] })` on `onSuccess`
- `useDeleteCliente`: `invalidateQueries({ queryKey: ['clientes'] })` on `onSuccess`

Also show toast (Spanish) in every `onSuccess`. Add `onError` toast "No se pudo guardar. Intenta de nuevo."

**Owner:** DEV
**Timeline:** Stories 2.3, 2.4, 2.5 implementation
**Status:** Planned
**Verification:** P0 E2E tests — list updates within 2s after each mutation; no manual refresh required

---

### R-003: Required Field Validation Missing (Score: 6)

**Mitigation Strategy:** Frontend: `clienteSchema.ts` (Zod) must mark Nombre, NIT/RUC, Teléfono, Ciudad as `.min(1, 'Campo requerido')`. `ClienteForm.tsx` must use `react-hook-form` `register` with Zod resolver — error messages appear inline under each field. Form `onSubmit` must not fire if schema invalid. Backend: `CreateClienteRequestValidator.cs` (FluentValidation) must use `RuleFor(x => x.Nombre).NotEmpty()` etc. for all 4 fields.

**Owner:** DEV
**Timeline:** Story 2.3 implementation
**Status:** Planned
**Verification:** P0 E2E tests — each field blank produces inline error + no network call; P0 API tests — backend returns 400 with `errors` per field

---

### R-004: Search Performance with 500 Records (Score: 6)

**Mitigation Strategy:** The filter in `ClienteListView.tsx` must use `useMemo` with `[searchQuery, clientes]` dependencies — never inline filter in render. The filter function operates over the in-memory TanStack Query cache array (max 500 records), not triggering a new fetch. Add a Vitest benchmark test that seeds 500 client objects in memory and measures `useMemo` execution time; assert < 100ms for the pure filter. The 1s wall-clock budget (NFR1) includes React re-render, so the filter itself must be < 100ms.

**Owner:** DEV
**Timeline:** Story 2.1 implementation
**Status:** Planned
**Verification:** P2 Performance test — 500 records, measure filter time < 100ms; E2E test with 500 seeded clients confirms UI responds in < 1s

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 (foundation) is implemented and P0 tests pass — PostgreSQL DB is running, both servers start, CORS is configured.
2. `tea_use_playwright_utils: false` — standard Playwright API used; no `@seontechnologies/playwright-utils` wrappers.
3. No authentication in MVP — E2E tests do not need login sessions.
4. The `siesa_agents_db` database has the `clientes` table created via EF Core migration as part of Epic 2 stories.
5. The `SortControl` component is sourced from `src/shared/components/SortControl` as specified in the epic technical context.
6. Contact associations (Epic 4) are not yet implemented — the "delete with contacts → orphan toast" P2 test is marked as deferred until Epic 4 data exists.
7. Zod schema uses `.min(1)` rather than `.nonempty()` for compatibility with react-hook-form error messages.

### Dependencies

1. **Story 2.3 implementation complete** — Required before P0 API tests (create, duplicate NIT) can run
2. **Story 2.1 implementation complete** — Required before list, search, and empty-state component tests
3. **EF Core migration for `clientes` table** — Required before any API integration test that reads/writes clients
4. **MSW setup in Vitest** — Required before component tests that mock API responses
5. **500-record seed script** — Required before P2 performance test; must be idempotent

### Risks to Plan

- **Risk**: siesa-ui-kit `ContactManager` component not yet wired in Epic 2 detail view (it belongs to Epic 4)
  - **Impact**: P3 NFR8 test (2-click path to contacts) cannot validate full ContactManager render
  - **Contingency**: Assert that the contact section area is rendered in the detail panel, even if ContactManager is a placeholder; full validation deferred to Epic 4

- **Risk**: Playwright E2E tests are slow if run against real API with real DB
  - **Impact**: P0 suite may exceed 10-minute budget with sequential E2E scenarios
  - **Contingency**: Parallelize E2E workers in Playwright config (`workers: 2`); use `beforeAll` to seed and `afterAll` to clean test data per describe block

- **Risk**: Toast component is async — E2E assertions on toast may be flaky if polling not configured
  - **Impact**: Toast-related P0 tests may intermittently fail
  - **Contingency**: Use `page.waitForSelector('[role="status"]')` or Playwright `toHaveText` with timeout instead of `toBeVisible` without delay

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before Story 2.3 implementation begins (TDD red-green-refactor cycle).
- Run `*automate` after all Epic 2 stories are implemented to expand component and unit coverage.
- Run `*nfr` after Epic 2 to validate NFR1 (search performance), NFR5 (sanitization), and NFR6 (no stack traces) formally.
- Run `*trace` after Epic 2 to generate traceability matrix linking FR1–FR8 to test coverage.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam — Date: ___
- [ ] Tech Lead: SiesaTeam — Date: ___
- [ ] QA Lead: SiesaTeam — Date: ___

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories: TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` — Risk scoring: Probability × Impact matrix; thresholds ≥6 = high
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision matrix
- `test-priorities-matrix.md` — P0-P3 prioritization criteria and tagging strategy

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD (Functional): `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- PRD (NFR): `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 1 Test Design: `_bmad-output/test-design-epic-1.md`

### Validation Checklist

- [x] Risk assessment complete with all 6 categories evaluated
- [x] All risks scored (probability × impact)
- [x] High-priority risks (≥6) flagged: R-001, R-002, R-003, R-004
- [x] Coverage matrix maps requirements to test levels
- [x] Priority levels assigned (P0-P3) for all 43 scenarios
- [x] Execution order defined (smoke → P0 → P1 → P2/P3)
- [x] Resource estimates provided (46.25 hours / ~6 days)
- [x] Quality gate criteria defined
- [x] Output file created and formatted correctly

---

**Generated by**: BMad TEA Agent - Test Architect Module (sa-tea-test-design)
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: Epic-Level (Phase 4) — forced per sa-quick-dev orchestrator
