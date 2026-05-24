# Test Design: Epic 2 - Client Management (Gestión de Clientes)

**Date:** 2026-05-24
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Epic-level test design for Epic 2 — Client Management (Stories 2.1, 2.2, 2.3, 2.4, 2.5, 2.6)

**Risk Summary:**

- Total risks identified: 10
- High-priority risks (≥6): 4 (R-001, R-002, R-003, R-004)
- Critical categories: DATA (NIT uniqueness, contacts orphaned on delete), BUS (real-time list sync FR27), PERF (search < 1s NFR1)

**Coverage Summary:**

- P0 scenarios: 7 (14.0 hours)
- P1 scenarios: 10 (10.0 hours)
- P2/P3 scenarios: 7 (3.5 hours)
- **Total effort**: 27.5 hours (~3.4 days)

---

## Epic Context

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time filter, EmptyState, ErrorPanel + Retry, NFR1 (< 1s, 500 records) |
| 2.2 | Client Detail View | Deep linking `/clientes/:id`, not-found graceful, FR30 |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), duplicate NIT 409, FR27 (list update) |
| 2.4 | Edit Client | Pre-fill form, update reflected in list, Cancel no-op, required-field validation |
| 2.5 | Delete Client | Confirmation dialog, contacts orphaned (clienteId = null), "Sin cliente" filter, FR27 |
| 2.6 | Sort Client List | Client-side sort (4 criteria), sort + filter coexistence, no API call on sort |

### Functional Requirements Covered

FR1 (create client), FR2 (list clients), FR3 (search by name), FR4 (search by NIT/RUC), FR5 (view client detail), FR6 (edit client), FR7 (delete client), FR8 (required-field validation).

### Non-Functional Requirements in Scope

- **NFR1**: Search results rendered in < 1 second with up to 500 records (client-side filter in < 50 ms)
- **NFR2**: All CRUD changes reflected in UI in < 2 seconds (TanStack Query invalidation + refetch)
- **NFR5**: API validates and sanitizes all inputs before persisting (FluentValidation backend + Zod frontend)
- **NFR6**: No stack traces or internal error details exposed to end users (Problem Details RFC 7807 on 409/422/500)

### Out of Scope

- Authentication / authorization — deferred (no MVP auth)
- Contact management (Epic 3) and Client↔Contact association (Epic 4)
- HTTPS — non-local deployments only (NFR4)
- `ContactManager` wiring within client detail — deferred to Epic 4

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | DATA | NIT/RUC uniqueness constraint not enforced at DB level or not surfaced correctly: backend returns 409 but frontend shows generic error or no feedback, violating story 2.3 AC | 2 | 3 | 6 | Integration test: POST duplicate NIT → assert 409 with Problem Details `"El NIT/RUC ya está registrado"`; component test: assert inline error renders, form not submitted | DEV/QA | Sprint 2 |
| R-002 | BUS | Contacts not orphaned on client delete: `cliente_id` FK is deleted (CASCADE) instead of set to NULL, destroying contact records unexpectedly | 2 | 3 | 6 | Integration test: create client + contacts, DELETE client, assert contacts remain with `clienteId: null`; verify ON DELETE SET NULL in migration | QA | Sprint 2 |
| R-003 | BUS | TanStack Query not invalidated after create/update/delete → list does NOT update without manual page reload, violating FR27/NFR2 | 2 | 3 | 6 | Component integration test: perform mutation, assert `useClientes` query re-executed and list contains new/updated/removed item within 2s | DEV | Sprint 2 |
| R-004 | PERF | Client-side search filter does not meet NFR1 (< 1s) with 500 records, OR filter triggers a new API call instead of filtering the in-memory TanStack Query cache | 2 | 3 | 6 | Performance test: seed 500 client records; trigger filter and measure render time; assert no additional network request fired; assert result renders in < 1s | QA | Sprint 2 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-005 | BUS | Sort order resets when search filter changes — SortControl state not preserved during re-renders | 2 | 2 | 4 | Component test: apply sort, then update search query; assert sort order persists on filtered result set | DEV |
| R-006 | BUS | Client detail URL (`/clientes/:clienteId`) does not deep-link correctly on direct navigation — TanStack Router loader not invoked or ID not resolved | 2 | 2 | 4 | E2E test: navigate directly to `/clientes/{known-uuid}` without prior app state; assert detail panel renders correct data | QA |
| R-007 | DATA | Required-field validation fires only on submit but not on blur — UX regression; or FluentValidation errors are not mapped to Problem Details `errors{}` field by name | 1 | 3 | 3 | Component test: clear Nombre field and submit; assert inline error on Nombre field; API integration test: assert 422 `errors.nombre` key present | DEV/QA |
| R-008 | BUS | Delete confirmation dialog "Cancelar" does not prevent deletion — dialog closes but API call is still issued | 1 | 3 | 3 | Component test: click Eliminar, then Cancelar; assert DELETE API endpoint never called | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-009 | BUS | EmptyState not rendered when client list is empty — component substituted or condition inverted | 1 | 2 | 2 | Component test: render ClienteListView with empty `useClientes` result; assert EmptyState in DOM |
| R-010 | OPS | ErrorPanel "Reintentar" button does not trigger `refetch` — onClick not wired to TanStack Query refetch | 1 | 2 | 2 | Component test: mock failed fetch, render ErrorPanel; click "Reintentar"; assert `refetch` called once |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E2.1: Create client — all required fields saved & appears in list | API Integration + E2E | R-003 | 2 | QA/DEV | POST `/api/v1/clientes` + E2E form submit |
| AC-E2.2: Search by name/NIT returns results in < 1s | Component + Performance | R-004 | 2 | QA | MSW mock + 500-record filter timing |
| AC-E2.4: Required fields validation — blank fields blocked | API Integration + Component | R-007 | 2 | QA/DEV | 422 + inline error |
| AC-E2.5: Delete client — contacts orphaned (clienteId=null), not deleted | API Integration | R-002 | 1 | QA | DELETE then GET contacts |

**Total P0**: 7 tests, 14.0 hours

#### Test Case Details

**TC-E2-P0-01: Create Client via API — 201 Response with Correct Payload**

- **Level:** API Integration | **Story:** 2.3 | **Risk:** R-001, R-003
- **Steps:** (1) POST `/api/v1/clientes` with `{ nombre, nit, telefono, ciudad }`. (2) Assert HTTP 201. (3) Assert response body contains `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 DateTimeOffset). (4) GET `/api/v1/clientes/{id}` and assert same data.
- **Expected:** 201 Created; body has all fields; subsequent GET returns same record.
- **Automation:** xUnit integration test with `WebApplicationFactory<Program>`.

**TC-E2-P0-02: Create Client E2E — Form Submit, List Updates Immediately**

- **Level:** E2E (Playwright) | **Story:** 2.3 | **Risk:** R-003
- **Steps:** (1) Navigate to `/clientes`. (2) Click "Nuevo cliente". (3) Fill Nombre, NIT/RUC, Teléfono, Ciudad. (4) Submit. (5) Assert toast "Cliente creado correctamente" appears. (6) Assert new client item visible in left panel list without page reload.
- **Expected:** New client appears in list immediately (FR27/NFR2); toast confirms success.
- **Automation:** Playwright E2E.

**TC-E2-P0-03: Search Filters Client List in Real Time (Name)**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.1 | **Risk:** R-004
- **Steps:** (1) Mock `GET /api/v1/clientes` returning 10 clients. (2) Render `ClienteListView`. (3) Type partial name in search field. (4) Assert only matching clients render. (5) Assert no additional network request fired after typing.
- **Expected:** List filters client-side; no API re-call; matching items visible.
- **Automation:** Vitest + RTL + MSW interceptor.

**TC-E2-P0-04: Search Filters Client List in Real Time (NIT/RUC)**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.1 | **Risk:** R-004
- **Steps:** (1) Same setup as P0-03. (2) Type partial NIT/RUC. (3) Assert only clients whose NIT contains the input are shown. (4) Assert no additional network call.
- **Expected:** NIT-based filter works client-side; no API re-call.
- **Automation:** Vitest + RTL + MSW.

**TC-E2-P0-05: Create Client — Required Fields Validation (Backend 422)**

- **Level:** API Integration | **Story:** 2.3 | **Risk:** R-007
- **Steps:** (1) POST `/api/v1/clientes` with `nombre` empty (`""`). (2) Assert HTTP 422. (3) Assert response body is Problem Details RFC 7807 with `errors.nombre` key. (4) Assert no record created in DB.
- **Expected:** 422 Unprocessable Entity; `errors.nombre` present; no record persisted.
- **Automation:** xUnit integration test.

**TC-E2-P0-06: Create Client — Required Fields Validation (Frontend Inline Error)**

- **Level:** Component (Vitest + RTL) | **Story:** 2.3 | **Risk:** R-007
- **Steps:** (1) Render `ClienteForm`. (2) Leave Nombre blank; submit. (3) Assert inline error message appears on Nombre field. (4) Assert MSW handler for POST `/api/v1/clientes` was NOT called.
- **Expected:** Zod validation fires; inline error shown; form not submitted to backend.
- **Automation:** Vitest + RTL + MSW.

**TC-E2-P0-07: Delete Client — Associated Contacts Orphaned (clienteId = null)**

- **Level:** API Integration | **Story:** 2.5 | **Risk:** R-002
- **Steps:** (1) Create client and 2 contacts with `clienteId = client.id`. (2) DELETE `/api/v1/clientes/{id}`. (3) Assert HTTP 204. (4) GET `/api/v1/contactos` and assert both contacts still exist with `clienteId: null`.
- **Expected:** Client deleted; contacts remain; contacts have `clienteId: null` (ON DELETE SET NULL).
- **Automation:** xUnit integration test.

---

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E2.1: Empty state rendered when no clients | Component | R-009 | 1 | DEV | EmptyState in DOM |
| AC-E2.1: Error panel + Retry on backend unavailable | Component | R-010 | 1 | DEV | MSW network error; click Reintentar |
| AC-E2.2: Deep link `/clientes/:clienteId` renders correct detail | E2E | R-006 | 1 | QA | Direct URL navigation |
| AC-E2.2: Unknown clienteId shows not-found gracefully | Component | R-006 | 1 | DEV | 404 response → not-found UI |
| AC-E2.3: Duplicate NIT/RUC returns 409 — correct error to user | API Integration + Component | R-001 | 2 | QA/DEV | 409 + "El NIT/RUC ya está registrado" |
| AC-E2.4: Edit form pre-filled with current values | Component | - | 1 | DEV | Fields match existing client data |
| AC-E2.4: Edit form "Cancelar" does not mutate data | Component | - | 1 | DEV | Original data unchanged |
| AC-E2.5: Delete — confirm dialog shown; confirm triggers DELETE | Component | R-008 | 1 | DEV | Confirm flow wired to API |
| AC-E2.5: Delete — cancel dialog does NOT call DELETE | Component | R-008 | 1 | DEV | Cancel → no API call |

**Total P1**: 10 tests, 10.0 hours

#### Test Case Details

**TC-E2-P1-01: Empty State Displayed When No Clients Exist**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.1 | **Risk:** R-009
- **Steps:** (1) Mock `GET /api/v1/clientes` returning `[]`. (2) Render `ClienteListView`. (3) Assert `EmptyState` component in DOM with guiding message. (4) Assert no client list items rendered.
- **Expected:** EmptyState visible; no list items; message guides user to create first client.
- **Automation:** Vitest + RTL + MSW.

**TC-E2-P1-02: Error Panel and Retry Button on Backend Failure**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.1 | **Risk:** R-010
- **Steps:** (1) Mock `GET /api/v1/clientes` returning network error. (2) Render `ClienteListView`. (3) Assert `ErrorPanel` in DOM with "Reintentar" button. (4) Click "Reintentar". (5) Assert `GET /api/v1/clientes` called a second time (MSW handler count).
- **Expected:** ErrorPanel visible; clicking Reintentar triggers refetch.
- **Automation:** Vitest + RTL + MSW.

**TC-E2-P1-03: Deep Link to /clientes/:clienteId Renders Correct Detail**

- **Level:** E2E (Playwright) | **Story:** 2.2 | **Risk:** R-006
- **Steps:** (1) Create a client via API seed. (2) Navigate browser directly to `/clientes/{clienteId}`. (3) Assert detail panel shows Nombre, NIT/RUC, Teléfono, Ciudad matching seed data. (4) Assert URL is `/clientes/{clienteId}`.
- **Expected:** Correct client detail renders from direct URL; no redirect or blank panel.
- **Automation:** Playwright E2E.

**TC-E2-P1-04: Unknown clienteId in URL Shows Not-Found Message**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.2 | **Risk:** R-006
- **Steps:** (1) Mock `GET /api/v1/clientes/{unknownId}` returning 404. (2) Render route with that ID. (3) Assert not-found message in detail panel. (4) Assert no crash or unhandled error.
- **Expected:** Not-found message gracefully displayed; shell remains intact.
- **Automation:** Vitest + RTL + MSW.

**TC-E2-P1-05: Duplicate NIT/RUC Returns 409 — API Level**

- **Level:** API Integration | **Story:** 2.3 | **Risk:** R-001
- **Steps:** (1) POST `/api/v1/clientes` with NIT `123456789`. (2) POST `/api/v1/clientes` again with same NIT. (3) Assert second POST returns HTTP 409. (4) Assert Problem Details body contains `"El NIT/RUC ya está registrado"` in `detail` or `errors` field. (5) Assert only one record exists in DB.
- **Expected:** 409 Conflict; descriptive Problem Details; no duplicate record.
- **Automation:** xUnit integration test.

**TC-E2-P1-06: Duplicate NIT/RUC — Frontend Shows Correct Error Message**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.3 | **Risk:** R-001
- **Steps:** (1) Mock `POST /api/v1/clientes` returning 409 with body `{ "detail": "El NIT/RUC ya está registrado" }`. (2) Render `ClienteForm`, fill all fields, submit. (3) Assert error message "El NIT/RUC ya está registrado" visible in form. (4) Assert no stack trace or technical detail visible.
- **Expected:** User-friendly error shown; no technical detail exposed (NFR6).
- **Automation:** Vitest + RTL + MSW.

**TC-E2-P1-07: Edit Form Pre-Filled with Current Client Values**

- **Level:** Component (Vitest + RTL) | **Story:** 2.4 | **Risk:** -
- **Steps:** (1) Render `ClienteDetailView` with a client `{ nombre: "Acme", nit: "900100200", telefono: "3001234567", ciudad: "Bogotá" }`. (2) Click "Editar". (3) Assert each form field value matches the client data.
- **Expected:** All four fields pre-populated with existing client data (FR6).
- **Automation:** Vitest + RTL.

**TC-E2-P1-08: Edit Form Cancel — Original Data Unchanged**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.4 | **Risk:** -
- **Steps:** (1) Render edit form pre-filled with client data. (2) Modify Nombre field. (3) Click "Cancelar". (4) Assert PUT `/api/v1/clientes/{id}` was NOT called. (5) Assert detail view still shows original Nombre.
- **Expected:** Cancel is a pure no-op; no API call; original data preserved.
- **Automation:** Vitest + RTL + MSW.

**TC-E2-P1-09: Delete Confirmation — Confirm Triggers API Delete and List Update**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.5 | **Risk:** R-008
- **Steps:** (1) Render `ClienteDetailView` with a client. (2) Click "Eliminar". (3) Assert confirmation dialog with "¿Eliminar este cliente?" is visible. (4) Click "Confirmar". (5) Assert `DELETE /api/v1/clientes/{id}` called once. (6) Assert toast "Cliente eliminado correctamente" shown. (7) Assert right panel returns to empty/default state.
- **Expected:** Full deletion flow executes; list updated; right panel clears.
- **Automation:** Vitest + RTL + MSW.

**TC-E2-P1-10: Delete Confirmation — Cancel Does Not Call Delete API**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.5 | **Risk:** R-008
- **Steps:** (1) Render `ClienteDetailView`. (2) Click "Eliminar". (3) Assert dialog visible. (4) Click "Cancelar". (5) Assert `DELETE /api/v1/clientes/{id}` was NOT called. (6) Assert client still visible in list.
- **Expected:** Cancel closes dialog; no API call made; client record intact.
- **Automation:** Vitest + RTL + MSW.

---

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E2.6: Sort "Nombre A→Z" reorders list without API call | Component | R-005 | 1 | DEV | SortControl → alphabetical ascending |
| AC-E2.6: Sort "Nombre Z→A" reorders list without API call | Component | R-005 | 1 | DEV | Alphabetical descending |
| AC-E2.6: Sort "Más reciente" / "Más antiguo" by createdAt | Component | R-005 | 1 | DEV | Date sort ascending/descending |
| AC-E2.6: Sort preserved when search filter is active | Component | R-005 | 1 | DEV | Combined sort + filter state |
| AC-E2.5: Delete with contacts — toast shows orphan message | Component | R-002 | 1 | DEV | Toast copy with contact warning |
| AC-E2.6: Default sort is "Más reciente" on initial load | Component | - | 1 | DEV | Initial SortControl state |

**Total P2**: 6 tests, 3.0 hours

#### P2 Test Case Details

**TC-E2-P2-01: Sort "Nombre A→Z" — List Reorders Alphabetically Without API Call**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.6 | **Risk:** R-005
- **Steps:** (1) Mock `GET /api/v1/clientes` returning clients `["Zeta S.A.", "Alpha Corp", "Beta Inc"]`. (2) Render `ClienteListView`. (3) Select "Nombre A→Z" in SortControl. (4) Assert list order is `["Alpha Corp", "Beta Inc", "Zeta S.A."]`. (5) Assert no additional API call was made.
- **Expected:** Client-side alphabetical ascending sort; zero network calls.

**TC-E2-P2-02: Sort "Nombre Z→A" — List Reorders Alphabetically Descending Without API Call**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.6 | **Risk:** R-005
- **Steps:** Same setup as P2-01. (3) Select "Nombre Z→A". (4) Assert order `["Zeta S.A.", "Beta Inc", "Alpha Corp"]`. (5) Assert no additional API call.
- **Expected:** Client-side alphabetical descending sort; zero network calls.

**TC-E2-P2-03: Sort by Date — "Más reciente" and "Más antiguo"**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.6 | **Risk:** R-005
- **Steps:** (1) Mock 3 clients with `createdAt` values: oldest, middle, newest. (2) Select "Más reciente"; assert newest first. (3) Select "Más antiguo"; assert oldest first. (4) Assert no API calls during either sort.
- **Expected:** Date-based client-side sort in both directions; zero network calls.

**TC-E2-P2-04: Sort State Preserved When Search Filter Is Active**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.6 | **Risk:** R-005
- **Steps:** (1) Mock clients with varied names and dates. (2) Apply search filter for a partial name. (3) Select "Nombre A→Z". (4) Assert filtered results are sorted alphabetically. (5) Change sort to "Nombre Z→A". (6) Assert search input value unchanged. (7) Assert sorted result is the filtered subset.
- **Expected:** Sort applies to filtered set; search input and filter not cleared.

**TC-E2-P2-05: Delete with Contacts — Toast Shows Orphan Warning Message**

- **Level:** Component (Vitest + RTL + MSW) | **Story:** 2.5 | **Risk:** R-002
- **Steps:** (1) Mock DELETE response indicating associated contacts exist. (2) Perform delete flow (Confirm). (3) Assert toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." rather than the plain "Cliente eliminado correctamente".
- **Expected:** Correct toast variant displayed when contacts are orphaned.

**TC-E2-P2-06: Default Sort Is "Más reciente" on Initial Load**

- **Level:** Component (Vitest + RTL) | **Story:** 2.6 | **Risk:** -
- **Steps:** (1) Render `ClienteListView` with multiple clients, without selecting any sort. (2) Assert SortControl shows "Más reciente" as selected. (3) Assert clients sorted newest-first.
- **Expected:** Default state is `fecha-desc`; SortControl reflects this selection.

---

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
| ----------- | ---------- | ---------- | ----- | ----- |
| NFR1: Search renders in < 1s with 500 seeded records | Performance | 1 | QA | Playwright + `performance.now()` timing; 500 client seed |
| Search + sort combined with 500 records — no lag | Performance | 1 | QA | Full client-side filter + sort on large dataset |

**Total P3**: 2 tests, 0.5 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch breaking changes

- [ ] TC-E2-P0-01: POST /api/v1/clientes returns 201 (30s)
- [ ] TC-E2-P0-05: POST with empty nombre returns 422 (30s)
- [ ] TC-E2-P0-07: DELETE client — contacts remain with clienteId=null (1min)

**Total**: 3 scenarios

### P0 Tests (<15 min)

**Purpose**: Critical path validation

- [ ] TC-E2-P0-02: E2E create client form — list updates immediately
- [ ] TC-E2-P0-03: Search by name (client-side, no API re-call)
- [ ] TC-E2-P0-04: Search by NIT/RUC (client-side, no API re-call)
- [ ] TC-E2-P0-06: Frontend inline validation — blank field blocks submit

**Total**: 4 scenarios (7 total with smoke)

### P1 Tests (<35 min)

**Purpose**: Important feature coverage

- [ ] TC-E2-P1-01: EmptyState when no clients
- [ ] TC-E2-P1-02: ErrorPanel + Retry button triggers refetch
- [ ] TC-E2-P1-03: Deep link `/clientes/:id` renders correct detail (E2E)
- [ ] TC-E2-P1-04: Unknown clienteId shows not-found gracefully
- [ ] TC-E2-P1-05: Duplicate NIT 409 — API level
- [ ] TC-E2-P1-06: Duplicate NIT — frontend error message (no technical detail)
- [ ] TC-E2-P1-07: Edit form pre-filled with current values
- [ ] TC-E2-P1-08: Edit form Cancel — no API call, data unchanged
- [ ] TC-E2-P1-09: Delete Confirm — API called, list updated, panel cleared
- [ ] TC-E2-P1-10: Delete Cancel — no API call, record intact

**Total**: 10 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] TC-E2-P2-01: Sort Nombre A→Z without API call
- [ ] TC-E2-P2-02: Sort Nombre Z→A without API call
- [ ] TC-E2-P2-03: Sort by date (Más reciente / Más antiguo)
- [ ] TC-E2-P2-04: Sort preserved during active search filter
- [ ] TC-E2-P2-05: Delete with contacts — orphan warning toast
- [ ] TC-E2-P2-06: Default sort "Más reciente" on initial load
- [ ] TC-E2-P3-01: NFR1 performance with 500 seeded records (< 1s)
- [ ] TC-E2-P3-02: Search + sort combined with 500 records

**Total**: 8 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| -------- | ----- | ---------- | ----------- | ----- |
| P0 | 7 | 2.0 | 14.0 | API integration + E2E + validation — complex setup with DB |
| P1 | 10 | 1.0 | 10.0 | Component + API tests — medium complexity |
| P2 | 6 | 0.5 | 3.0 | Client-side sort/filter component tests |
| P3 | 2 | 0.25 | 0.5 | Performance benchmarks |
| **Total** | **25** | **—** | **27.5 hours** | **~3.4 days** |

### Prerequisites

**Test Data:**

- Client factory required: `ClienteEntity { Nombre, NIT (unique), Telefono, Ciudad, CreatedAt (DateTimeOffset) }`
- Contact factory required for Story 2.5 (orphan test): `ContactoEntity { Nombre, ClienteId }`
- 500-record seed script for P3 performance tests
- `WebApplicationFactory<Program>` configured for integration tests with test PostgreSQL DB

**Tooling:**

- Vitest 2+ with `@testing-library/react`, `jsdom`, MSW 2+ — frontend component tests
- Playwright 1.40+ — E2E deep-link and full-flow tests (TC-E2-P0-02, TC-E2-P1-03, TC-E2-P3-01)
- xUnit 2+ with `WebApplicationFactory<Program>` — backend API integration tests
- TestContainers (Postgres) or GitHub Actions `services.postgres` — isolated DB per test run
- `performance.now()` or Playwright `page.evaluate` for NFR1 timing measurements

**Environment:**

- Node.js 20+ with npm/pnpm — frontend test execution
- .NET 10 SDK — backend test execution
- PostgreSQL 18+ with `siesa_agents_db` and proper FK/index migrations applied
- Epic 1 implementation complete (foundation layer prerequisite)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (all 7 tests must pass — no exceptions)
- **P1 pass rate**: 100% for this epic (core CRM functionality; no partial pass acceptable)
- **P2/P3 pass rate**: ≥90% (sort/filter tests; may defer with justification)
- **High-risk mitigations**: 100% complete for R-001, R-002, R-003, R-004 before Epic 2 closure

### Coverage Targets

- **Critical paths** (create, update, delete CRUD, NIT uniqueness): 100%
- **Data integrity** (contacts not deleted on client removal): 100%
- **Search performance** (NFR1 < 1s, client-side, no API re-call): 100%
- **Real-time sync** (FR27/NFR2 list update within 2s): 100%
- **Sort/filter coexistence** (AC-E2.6): ≥80% automated coverage

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] R-002 mitigated: contacts confirmed orphaned (not deleted) after client deletion
- [ ] R-003 mitigated: TanStack Query invalidation confirmed via component test
- [ ] R-004 mitigated: search confirmed client-side with no additional API call
- [ ] R-001 mitigated: 409 + correct frontend error message for duplicate NIT
- [ ] NFR6 verified: 409/422 responses contain no stack traces or technical details

---

## Mitigation Plans

### R-001: Duplicate NIT/RUC Not Surfaced Correctly (Score: 6)

**Mitigation Strategy:** Backend — add unique index `uk_clientes_nit` in `ClienteConfiguration.cs` (`HasIndex(c => c.NIT).IsUnique()`). Handle `DbUpdateException` (PostgreSQL unique violation) in `CreateClienteCommandHandler` and throw domain exception mapped to 409 with message "El NIT/RUC ya está registrado". Frontend — `ClienteForm` must check for `response.status === 409` in `onError` callback and display that `detail` field in the form (not in a generic toast).

**Owner:** DEV
**Timeline:** Story 2.3 implementation
**Status:** Planned
**Verification:** TC-E2-P0-01 + TC-E2-P1-05 + TC-E2-P1-06 all pass.

### R-002: Contacts Not Orphaned on Client Delete (Score: 6)

**Mitigation Strategy:** `ContactoConfiguration.cs` must configure the FK with `.OnDelete(DeleteBehavior.SetNull)`. EF Core migration must emit `ON DELETE SET NULL` for `contactos.cliente_id`. This must be verified by TC-E2-P0-07 before the epic is closed.

**Owner:** DEV
**Timeline:** Story 2.5 implementation (requires contacts table from Epic 1/3 — confirm FK configured in Epic 2 migration)
**Status:** Planned
**Verification:** TC-E2-P0-07 passes: contacts exist with `clienteId: null` after client deletion.

### R-003: TanStack Query Not Invalidated After Mutations (Score: 6)

**Mitigation Strategy:** All mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in their `onSuccess` callback. For delete, additionally clear the `['clientes', id]` query. Component tests must use a real `QueryClient` (not a mock) to verify invalidation + re-render.

**Owner:** DEV
**Timeline:** Stories 2.3, 2.4, 2.5 implementation
**Status:** Planned
**Verification:** TC-E2-P0-02 (E2E list update) and TC-E2-P1-09 (delete list update) pass.

### R-004: Search Does Not Meet NFR1 or Triggers API Re-call (Score: 6)

**Mitigation Strategy:** `ClienteListView` must apply search filter as a `useMemo` over the TanStack Query cached array — never as a query parameter to a new `GET /api/v1/clientes?q=` call. The `searchQuery` state is local `useState`; the query key remains `['clientes']` (no search param). MSW interceptor in tests counts network calls; assert count === 1 (initial load only) after typing.

**Owner:** DEV
**Timeline:** Story 2.1 implementation
**Status:** Planned
**Verification:** TC-E2-P0-03, TC-E2-P0-04, TC-E2-P3-01 pass.

---

## Acceptance Criteria Coverage Matrix

| Epic/Story AC | Test Cases | Level | Status |
| ------------- | ---------- | ----- | ------ |
| AC-E2.1: Register client with all required fields — appears in list immediately | TC-E2-P0-01, TC-E2-P0-02 | API Integration + E2E | Covered |
| AC-E2.2: Search by name/NIT returns results in < 1s | TC-E2-P0-03, TC-E2-P0-04, TC-E2-P3-01 | Component + Performance | Covered |
| AC-E2.3: View detail, edit any field, save changes | TC-E2-P1-07, TC-E2-P1-08 | Component | Covered |
| AC-E2.4: Required fields validation — error messages shown | TC-E2-P0-05, TC-E2-P0-06 | API Integration + Component | Covered |
| AC-E2.5: Delete client — removed from list | TC-E2-P1-09 | Component | Covered |
| AC-E2.6: Sort without page reload + preserves filter | TC-E2-P2-01 through TC-E2-P2-06 | Component | Covered |
| AC-2.1.a: Client list with Nombre + NIT/RUC in left panel 280px | TC-E2-P1-03 | E2E | Covered |
| AC-2.1.b: Real-time filter by name | TC-E2-P0-03 | Component | Covered |
| AC-2.1.c: Real-time filter by NIT/RUC | TC-E2-P0-04 | Component | Covered |
| AC-2.1.d: Filter results in < 1s with 500 records (NFR1) | TC-E2-P3-01 | Performance | Covered |
| AC-2.1.e: EmptyState when no clients | TC-E2-P1-01 | Component | Covered |
| AC-2.1.f: ErrorPanel + Reintentar on backend failure | TC-E2-P1-02 | Component | Covered |
| AC-2.2.a: Click client → right panel shows full detail | TC-E2-P1-03 | E2E | Covered |
| AC-2.2.b: URL updates to /clientes/:clienteId (FR30) | TC-E2-P1-03 | E2E | Covered |
| AC-2.2.c: Direct URL loads correct client detail (FR30) | TC-E2-P1-03 | E2E | Covered |
| AC-2.2.d: Unknown clienteId → not-found message | TC-E2-P1-04 | Component | Covered |
| AC-2.3.a: "Nuevo cliente" opens form with all required fields | TC-E2-P0-02 | E2E | Covered |
| AC-2.3.b: Form submit → client in list, toast "Cliente creado correctamente" | TC-E2-P0-02 | E2E | Covered |
| AC-2.3.c: Empty required field → inline error, no backend call | TC-E2-P0-06 | Component | Covered |
| AC-2.3.d: Duplicate NIT → "El NIT/RUC ya está registrado" (no technical detail) | TC-E2-P1-05, TC-E2-P1-06 | API Integration + Component | Covered |
| AC-2.4.a: Edit form pre-filled with current values (FR6) | TC-E2-P1-07 | Component | Covered |
| AC-2.4.b: Edit save → changes reflected immediately (FR27) | TC-E2-P1-09 (pattern) | Component | Covered |
| AC-2.4.c: Empty required field in edit → inline error, no submit | TC-E2-P0-06 (same Zod schema) | Component | Covered |
| AC-2.4.d: Cancel → original data unchanged | TC-E2-P1-08 | Component | Covered |
| AC-2.5.a: Delete → confirmation dialog with Confirmar/Cancelar | TC-E2-P1-09 | Component | Covered |
| AC-2.5.b: Confirm → removed from list, right panel default, toast | TC-E2-P1-09 | Component | Covered |
| AC-2.5.c: Cancel dialog → record intact | TC-E2-P1-10 | Component | Covered |
| AC-2.5.d: Delete with contacts → contacts remain as clienteId=null (FR25) | TC-E2-P0-07, TC-E2-P2-05 | API Integration + Component | Covered |
| AC-2.6.a: Sort Nombre A→Z without API call | TC-E2-P2-01 | Component | Covered |
| AC-2.6.b: Sort Nombre Z→A without API call | TC-E2-P2-02 | Component | Covered |
| AC-2.6.c: Sort Más reciente / Más antiguo | TC-E2-P2-03 | Component | Covered |
| AC-2.6.d: Sort + active filter coexist | TC-E2-P2-04 | Component | Covered |
| AC-2.6.e: Default sort is "Más reciente" | TC-E2-P2-06 | Component | Covered |

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 (foundation) is complete: backend starts on port 5000, EF Core migrations run, `clientes` and `contactos` tables exist with correct FK (`ON DELETE SET NULL`).
2. `SortControl` component in `src/shared/components/SortControl` is implemented as specified; sort option identifiers are `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`.
3. TanStack Query is configured with default `staleTime: 0` or similar so that `invalidateQueries` triggers an immediate refetch (required for NFR2).
4. MSW 2 handlers in test environment are registered at the test suite level; each test that asserts "no API call" uses handler call count assertion.
5. The `contactos` table migration is present and includes `cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL`.

### Dependencies

1. Epic 1 fully implemented and gate-passed — prerequisite for `clientes` table and CORS/middleware setup
2. Story 2.1 implementation complete — prerequisite for all list-related P0/P1 tests
3. Story 2.3 implementation complete — prerequisite for P0 create tests
4. Story 2.5 implementation complete — prerequisite for P0 orphan test (requires contacts table FK migration)

### Risks to Plan

- **Risk**: `contactos` table may not exist until Epic 3 — TC-E2-P0-07 (orphan test) requires it.
  - **Impact**: P0-07 may need to be deferred to Epic 3 integration test suite.
  - **Contingency**: Add `ContactoEntity` migration in Epic 2 Story 2.5 with minimal fields sufficient to verify ON DELETE SET NULL behavior; promote the test to Epic 3 closure gate if deferred.

- **Risk**: siesa-ui-kit `SortControl` component interface may differ from architecture spec.
  - **Impact**: Sort component tests may fail on selector mismatch.
  - **Contingency**: Use `data-testid="sort-control"` and `data-testid="sort-option-{identifier}"` attributes for test targeting; agree on test IDs during implementation story.

---

## Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. `ClienteListView` must implement search as `useMemo` over cached array — NEVER as a query parameter. `queryKey` stays `['clientes']` at all times.
2. All three mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`.
3. `ClienteForm` must check for `response.status === 409` specifically and render `detail` from the Problem Details body as an inline error on the NIT field — do NOT use a generic toast for this error.
4. `ContactoConfiguration.cs` must configure `.OnDelete(DeleteBehavior.SetNull)` for `cliente_id` FK — never `Cascade`.
5. `SortControl` sort state must be `useState<'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'>('fecha-desc')` — default is `fecha-desc`.
6. Sort must be applied after the search filter (`useMemo` → filtered array → sort), not before, to ensure sort applies to the visible filtered subset.
7. All toast messages must be in Spanish exactly as specified in acceptance criteria (case-sensitive for test assertions).
8. Delete confirmation dialog must call the API ONLY when the user clicks "Confirmar" — not on dialog open or close.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests from TC-E2-P0-01 through TC-E2-P0-07.
- Run `*automate` for broader component coverage once Stories 2.1–2.6 implementation exists.
- Run `*trace` after Epic 2 gate to verify all ACs are traced to passing tests.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam  Date: 2026-05-24
- [ ] Tech Lead: SiesaTeam  Date: 2026-05-24
- [ ] QA Lead: SiesaTeam  Date: 2026-05-24

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (TECH/SEC/PERF/DATA/BUS/OPS)
- `probability-impact.md` — Risk scoring: Probability (1-3) × Impact (1-3) = Score
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision matrix
- `test-priorities-matrix.md` — P0-P3 prioritization criteria and time budgets

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD Feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- PRD Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Prior Epic Test Design: `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: Epic-Level (Phase 4)
