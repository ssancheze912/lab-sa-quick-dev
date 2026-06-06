---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-06"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: Draft
---

# Test Design — Epic 2: Client Management

**Date:** 2026-06-06
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (Stories 2.1–2.6)

Epic 2 delivers the complete client CRUD module: list with real-time search, detail view with deep-link support, create/edit forms with validation, delete with cascading contact handling, and client-side sort. All stories are currently `pending` in sprint-status.yaml. No existing unit or component tests exist for the domain; one partial E2E spec (`e2e/tests/clientes/clientes-crud.spec.ts`) covers FR1, FR2, FR4, FR7, FR8 but is missing FR3/FR5/FR6, empty-state, error-panel, sort, deep-link, cancel, and cascade-delete behaviors.

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥6): 4
- Critical categories: DATA, BUS, PERF, TECH

**Coverage Summary:**

- P0 scenarios: 14 (28 hours)
- P1 scenarios: 19 (19 hours)
- P2 scenarios: 12 (6 hours)
- P3 scenarios: 5 (1.25 hours)
- **Total effort:** 54.25 hours (~7 days)

---

## 1. Epic Overview & Test Scope

### Stories in Scope

| Story | Title | Key FR/NFR |
|-------|-------|-----------|
| 2.1 | Client List & Search | FR2, FR3, FR4, NFR1 |
| 2.2 | Client Detail View | FR5, FR30 |
| 2.3 | Create Client | FR1, FR8, NFR5, NFR6 |
| 2.4 | Edit Client | FR6, FR8, FR27 |
| 2.5 | Delete Client | FR7, FR27 (cascade: contactos → `cliente_id = NULL`) |
| 2.6 | Sort Client List | FR2 (sort extension), client-side only |

### Out of Scope for This Epic

- Authentication / authorization (not in MVP)
- Client–Contact association panel in client detail (Epic 4)
- Contact management (Epic 3)
- HTTPS enforcement (non-local environments only — NFR4)

### Existing Test Coverage (Gap Analysis)

| Coverage Area | Status |
|--------------|--------|
| E2E: list clients (FR1/FR2 by name and NIT) | Partial — exists, no reload-free assertion |
| E2E: create client (FR4) | Partial — exists, no toast assertion |
| E2E: duplicate NIT error (FR7) | Exists |
| E2E: required fields validation (FR8) | Exists |
| E2E: view detail / deep-link (FR5, FR30) | **Missing** |
| E2E: edit client (FR6) | **Missing** |
| E2E: delete client (FR7/FR27) | **Missing** |
| E2E: cascade delete (contacts orphaned) | **Missing** |
| E2E: empty state | **Missing** |
| E2E: backend error / retry panel | **Missing** |
| E2E: sort (2.6) | **Missing** |
| E2E: cancel form without saving | **Missing** |
| API: contract tests for all 5 endpoints | **Missing** |
| Component: ClienteListPanel, SortControl | **Missing** |
| Unit: Zod schema, client-side sort logic | **Missing** |

---

## 2. Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Cascade delete: deleting a client does not set `cliente_id = NULL` on associated contacts — contacts become orphaned with stale FK references, violating data integrity | 2 | 3 | **6** | Test DELETE `/api/v1/clientes/{id}` with pre-seeded associated contacts; assert all contacts have `clienteId = null` in GET response. Verify `ON DELETE SET NULL` FK constraint in EF Core migration. | DEV + QA | Sprint 2 start |
| R-002 | BUS | Duplicate NIT conflict not surfaced correctly: backend 409 swallowed by Axios interceptor or generic error handler, user sees no message or wrong message | 2 | 3 | **6** | API test: POST with duplicate NIT → assert HTTP 409 + Problem Details body with no `stackTrace`. E2E test: assert "El NIT/RUC ya está registrado" toast/inline message (not generic error). | DEV + QA | Sprint 2 start |
| R-003 | PERF | Search performance: real-time client-side filter over 500 records may exceed 1s threshold due to unoptimized re-renders or large DOM reconciliation in ClienteListPanel | 2 | 3 | **6** | Performance test: seed 500 client records, measure time from keypress to filtered DOM render. Assert ≤1000ms (NFR1). Use React DevTools Profiler to identify re-render bottlenecks. | DEV + QA | Sprint 2 |
| R-004 | TECH | TanStack Query cache invalidation not triggered after mutate (create/edit/delete): list does not refresh automatically, violating FR27 (changes immediately visible) | 2 | 3 | **6** | Integration test: create/edit/delete via API, then verify list query refetches. E2E: create a client and assert it appears in the list without manual reload. | DEV | Sprint 2 |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-005 | TECH | Deep-link to `/clientes/:id` with invalid UUID crashes the app instead of showing not-found message gracefully (unhandled TanStack Router error boundary) | 2 | 2 | **4** | E2E test: navigate to `/clientes/non-existent-uuid` → assert not-found message rendered, no JS error in console. | DEV |
| R-006 | BUS | Sort state lost when search filter is applied or cleared: SortControl resets to default on each search event | 2 | 2 | **4** | Component + E2E test: apply sort "Nombre Z→A", then type in search field, assert sort selection persists in SortControl. | DEV |
| R-007 | DATA | Form pre-fill on edit loads stale TanStack Query cache instead of fresh data when client was updated by another session | 1 | 3 | **3** | API test: update client, then open edit form; assert pre-filled values match latest server state. | DEV |
| R-008 | BUS | Cancel button on create/edit form does not restore original state: unsaved changes are partially committed to local state | 2 | 2 | **4** | E2E test: open edit form, modify fields, click Cancelar, assert detail panel shows original unmodified data. | DEV + QA |
| R-009 | TECH | SortControl renders with incorrect default: initial sort order is not "Más reciente" (fecha-desc) on first page load | 1 | 2 | **2** | Component test: render SortControl with no props, assert selected value is `fecha-desc`. | DEV |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-010 | OPS | EmptyState component not shown when client list is empty (conditional rendering bug) | 1 | 2 | **2** | Monitor — covered by E2E empty-state test |
| R-011 | BUS | Toast messages show incorrect text (e.g., creation toast shown on update) | 1 | 1 | **1** | Monitor — covered by P1 E2E assertion |
| R-012 | OPS | ErrorPanel "Reintentar" button does not re-trigger the query fetch | 1 | 2 | **2** | Component test: simulate fetch failure, click Reintentar, assert query re-fetched |

### Risk Category Legend

- **TECH**: Technical/Architecture (integration, state management, routing)
- **DATA**: Data Integrity (cascade operations, stale data, orphan records)
- **BUS**: Business Impact (UX harm, incorrect messages, lost state)
- **PERF**: Performance (SLA violations, render bottlenecks)
- **OPS**: Operations (conditional rendering, retry mechanics)

---

## 3. Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core client journey + High risk (score ≥6) + No workaround

| Requirement / AC | Test Level | Risk Link | Scenario | Test Count | Owner |
|-----------------|-----------|-----------|----------|------------|-------|
| AC-E2.1: Create client with all required fields, appears in list | E2E | R-004 | Happy path: fill Nombre/NIT/Teléfono/Ciudad, submit, assert client in list + toast "Cliente creado correctamente" | 1 | QA |
| AC-E2.4: Required fields validation prevents submission | E2E | — | Submit empty form, assert inline errors on all 4 fields, assert POST not sent | 1 | QA |
| Story 2.3: Duplicate NIT returns 409, user-friendly message | E2E + API | R-002 | POST existing NIT via UI, assert "El NIT/RUC ya está registrado" message; API: assert 409 + Problem Details | 2 | QA |
| AC-E2.3: Edit client, changes reflected immediately | E2E | R-004 | Edit Nombre field, save, assert detail panel + list updated without reload + toast "Cliente actualizado correctamente" | 1 | QA |
| AC-E2.5: Delete client, removed from list immediately | E2E | R-004 | Delete client via confirmation dialog, assert removed from list + right panel empty + toast | 1 | QA |
| Story 2.5: Cascade delete — associated contacts become `clienteId = null` | API | R-001 | Seed client with 2 contacts via API, DELETE client, GET each contact → assert `clienteId = null` | 2 | QA |
| Story 2.5: Cascade delete toast text with contacts | E2E | R-001 | Delete client with associated contacts (seeded), assert toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." | 1 | QA |
| AC-E2.2: Search returns results ≤1s with 500 records | API + PERF | R-003 | Seed 500 clients, measure filter render time on keypress → assert ≤1000ms | 2 | QA |
| Story 2.1: Error panel + Reintentar when backend unavailable | E2E | — | Mock backend failure, navigate to /clientes, assert ErrorPanel visible; click Reintentar, assert query re-triggered | 1 | QA |

**Total P0:** 14 tests, 28 hours (2h/test avg for E2E + data setup complexity)

---

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (score 3–4) + Common workflows

| Requirement / AC | Test Level | Risk Link | Scenario | Test Count | Owner |
|-----------------|-----------|-----------|----------|------------|-------|
| Story 2.1: Empty state shown when no clients | E2E | R-010 | Navigate to /clientes with empty DB, assert EmptyState component with guidance message | 1 | QA |
| Story 2.2: Detail panel shows all fields on client click | E2E | — | Seed client, click list item, assert detail panel shows Nombre, NIT, Teléfono, Ciudad | 1 | QA |
| Story 2.2: Deep-link to `/clientes/:clienteId` loads correct detail | E2E | R-005 | Navigate directly to seeded client URL, assert correct data displayed without going through list | 1 | QA |
| Story 2.2: Invalid clienteId in URL shows not-found gracefully | E2E | R-005 | Navigate to `/clientes/invalid-id`, assert not-found message, no JS error | 1 | QA |
| Story 2.2: URL updates to `/clientes/:id` on item click | E2E | — | Click client in list, assert URL matches `/clientes/{uuid}` | 1 | QA |
| Story 2.3: Form opens with all 4 required fields | E2E | — | Click "Nuevo cliente", assert form visible with Nombre/NIT/Teléfono/Ciudad fields | 1 | QA |
| Story 2.4: Edit form pre-fills with current values | E2E | R-007 | Open edit for existing client, assert all fields pre-populated with current data | 1 | QA |
| Story 2.4: Cancel edit restores original data | E2E | R-008 | Modify fields in edit form, click Cancelar, assert detail panel shows original values | 1 | QA |
| Story 2.4: Clearing required field and submitting shows inline error | E2E | — | Edit client, clear Nombre, submit → assert inline error, assert PATCH/PUT not sent | 1 | QA |
| Story 2.5: Confirmation dialog appears before delete | E2E | — | Click Eliminar, assert dialog "¿Eliminar este cliente?" with Confirmar + Cancelar options | 1 | QA |
| Story 2.5: Cancel delete leaves record intact | E2E | R-008 | Click Eliminar → click Cancelar in dialog, assert client still in list | 1 | QA |
| AC-E2.6: Sort Nombre A→Z, no additional API call | Component + E2E | R-006 | Select "Nombre A→Z" in SortControl, assert list sorted alphabetically ascending; assert no new network request | 2 | DEV + QA |
| AC-E2.6: Sort Nombre Z→A | Component | R-006 | Select "Nombre Z→A", assert descending alphabetical order | 1 | DEV |
| AC-E2.6: Sort Más reciente / Más antiguo by createdAt | Component | — | Select each date-based option, assert ordering by `createdAt` | 2 | DEV |
| AC-E2.6: Sort persists while search filter is active | E2E | R-006 | Apply search filter, change sort, assert sort applied to filtered set, search input not cleared | 1 | QA |
| AC-E2.6: Default sort is "Más reciente" on load | Component | R-009 | Render SortControl with no sort preference, assert `fecha-desc` selected | 1 | DEV |
| API: GET /api/v1/clientes returns all clients | API | — | Assert 200 + array of ClienteDto with correct fields | 1 | QA |
| API: PUT /api/v1/clientes/{id} validates required fields | API | — | PUT with missing Nombre → assert 400 + Problem Details (FluentValidation) | 1 | QA |

**Total P1:** 19 tests, 19 hours (1h/test avg)

---

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Edge cases + Low risk (score 1–2)

| Requirement / AC | Test Level | Risk Link | Scenario | Test Count | Owner |
|-----------------|-----------|-----------|----------|------------|-------|
| AC-E2.2: Search filters real-time as user types (debounce behavior) | Component | — | Simulate keystrokes with 150ms debounce, assert list updates without extra renders | 2 | DEV |
| Story 2.3: NIT field trims whitespace before submission | Unit | — | Zod schema: assert " 12345 ".trim() passes NIT validation | 1 | DEV |
| Story 2.3: All fields max-length respected (Zod schema) | Unit | — | Test Zod schema with strings at boundary lengths (e.g., Nombre 255 chars) | 3 | DEV |
| Story 2.4: Form closes after successful save | E2E | — | Edit and save client, assert form/modal closed and detail panel visible | 1 | QA |
| Story 2.6: Sort option identifiers match spec | Unit | — | Assert sort identifiers: `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc` | 1 | DEV |
| Story 2.6: SortControl component renders all 4 options | Component | — | Render SortControl, assert 4 options present with correct labels | 1 | DEV |
| API: GET /api/v1/clientes/{id} returns 404 for unknown ID | API | — | GET with random UUID → assert 404 + Problem Details | 1 | QA |
| API: DELETE /api/v1/clientes/{id} returns 404 for unknown ID | API | — | DELETE unknown UUID → assert 404 | 1 | QA |
| API: POST /api/v1/clientes returns 201 with Location header | API | — | Create client → assert 201 + Location header pointing to new resource | 1 | QA |

**Total P2:** 12 tests, 6 hours (0.5h/test avg)

---

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Benchmarks

| Requirement / AC | Test Level | Scenario | Test Count | Owner |
|-----------------|-----------|----------|------------|-------|
| NFR3: 10 simultaneous users — no performance degradation | PERF | k6 load test: 10 VUs × 60s on GET /api/v1/clientes, assert p95 < 500ms | 1 | QA |
| NFR6: No stack traces in API error responses | API | Trigger unhandled exception in test endpoint, assert no `stackTrace` key in response body | 1 | QA |
| Story 2.1: List scrolls correctly with 500 items | E2E | Seed 500 clients, scroll list panel to bottom, assert no UI freeze | 1 | QA |
| Story 2.6: Sort + Search combined: correct intersection result | E2E | Seed 10 clients, search for partial name, apply sort, assert correct sorted subset | 1 | QA |
| Accessibility: form fields have associated labels | Component | Assert each form input has `aria-label` or `<label htmlFor>` | 1 | DEV |

**Total P3:** 5 tests, 1.25 hours (0.25h/test avg)

---

## 4. Execution Order

### Smoke Tests (<5 min)

**Purpose:** Fast feedback — catch broken client CRUD on every commit

- [ ] Create client with valid data and assert appears in list (P0 — E2E, ~45s)
- [ ] Submit empty form and assert required-field errors shown (P0 — E2E, ~20s)
- [ ] Delete client and assert removed from list (P0 — E2E, ~30s)

**Total:** 3 scenarios, ~2 min

---

### P0 Tests (<10 min)

**Purpose:** Critical path — all high-risk areas

- [ ] Create client: full happy path + toast message (E2E)
- [ ] Required fields block submission — all 4 fields (E2E)
- [ ] Duplicate NIT: UI shows correct user-friendly message (E2E)
- [ ] Duplicate NIT: API returns 409 + Problem Details, no stackTrace (API)
- [ ] Edit client: changes reflected in detail + list without reload (E2E)
- [ ] Delete client: removed from list + right panel empty + toast (E2E)
- [ ] Cascade delete: API asserts contacts become `clienteId = null` — 2 contacts (API ×2)
- [ ] Cascade delete: UI toast shows orphaned contacts message (E2E)
- [ ] Search performance: 500 records, keypress → render ≤1000ms (API + PERF ×2)
- [ ] Error panel visible on backend failure + Reintentar re-triggers query (E2E)

**Total:** 14 scenarios

---

### P1 Tests (<30 min)

**Purpose:** Full feature coverage — all stories validated

- [ ] Empty state shown when no clients exist (E2E)
- [ ] Detail panel shows all fields on list item click (E2E)
- [ ] Deep-link `/clientes/:id` loads correct client (E2E)
- [ ] Invalid `clienteId` URL shows not-found gracefully (E2E)
- [ ] URL updates on item click (E2E)
- [ ] "Nuevo cliente" button opens form with all 4 fields (E2E)
- [ ] Edit form pre-populates with current client data (E2E)
- [ ] Cancel edit — original data unchanged in detail panel (E2E)
- [ ] Clear required field in edit → inline error, no PUT sent (E2E)
- [ ] Delete confirmation dialog shown with correct options (E2E)
- [ ] Cancel delete — record remains in list (E2E)
- [ ] Sort "Nombre A→Z": list reorders, no new API call (Component + E2E ×2)
- [ ] Sort "Nombre Z→A": descending alphabetical (Component)
- [ ] Sort "Más reciente" / "Más antiguo": by `createdAt` (Component ×2)
- [ ] Sort persists while active search filter is applied (E2E)
- [ ] SortControl default is "Más reciente" on initial load (Component)
- [ ] API: GET all clients returns 200 + ClienteDto array (API)
- [ ] API: PUT with missing field returns 400 + Problem Details (API)

**Total:** 19 scenarios

---

### P2/P3 Tests (<60 min)

**Purpose:** Full regression and edge case coverage

- [ ] Search debounce: 150ms delay, no extra renders (Component ×2)
- [ ] Zod schema: NIT whitespace trimmed (Unit)
- [ ] Zod schema: field max-length boundaries (Unit ×3)
- [ ] Form closes after successful save (E2E)
- [ ] Sort identifiers match spec values (Unit)
- [ ] SortControl renders 4 options with correct labels (Component)
- [ ] API: GET by unknown ID → 404 + Problem Details (API)
- [ ] API: DELETE unknown ID → 404 (API)
- [ ] API: POST returns 201 + Location header (API)
- [ ] k6 load: 10 VUs × 60s, p95 < 500ms (PERF)
- [ ] No stack trace in error responses (API)
- [ ] List scrolls 500 items without freeze (E2E)
- [ ] Sort + Search combined intersection (E2E)
- [ ] Form fields have accessible labels (Component)

**Total:** 17 scenarios

---

## 5. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|-----------|------------|-------|
| P0 | 14 | 2.0 | 28.0 | Complex E2E + API data setup, cascade verification |
| P1 | 19 | 1.0 | 19.0 | Standard E2E and component coverage |
| P2 | 12 | 0.5 | 6.0 | Simple edge cases and unit scenarios |
| P3 | 5 | 0.25 | 1.25 | On-demand / performance benchmarks |
| **Total** | **50** | — | **54.25** | **~7 working days** |

### Prerequisites

**Test Data:**

- `buildCliente(overrides?)` factory (faker-based, already exists in `e2e/helpers/data.helper.ts`) — extend with `createdAt` field for sort tests
- `ApiHelper.createCliente()` / `deleteCliente()` (already in `e2e/helpers/api.helper.ts`) — extend with `createContacto(clienteId)` method for cascade delete tests
- Backend endpoint or DB seeding script for inserting 500 client records (performance tests)

**Tooling:**

- Playwright + `@playwright/test` — E2E tests (already configured)
- Vitest + React Testing Library + MSW — Component and Unit tests
- xUnit (backend) — API contract tests for Problem Details, 409, cascade FK
- k6 — NFR3 performance load test (P3)

**Environment:**

- Local PostgreSQL `siesa_agents_db` with clean-state reset between API tests
- Vite dev server (port 5173) + .NET backend (port 5000) for E2E
- MSW service worker configured for component tests (mock `/api/v1/clientes`)

---

## 6. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions — blocks merge)
- **P1 pass rate:** ≥95% (waivers require Tech Lead sign-off)
- **P2/P3 pass rate:** ≥90% (informational — does not block)
- **High-risk mitigations (R-001 to R-004):** 100% complete or approved waiver

### Coverage Targets

- **Critical paths (create/edit/delete + cascade):** ≥80%
- **Security scenarios (NFR5 input validation, NFR6 no stackTrace):** 100%
- **Business logic (validation, sort, search):** ≥70%
- **Edge cases (deep-link, empty state, cancel, not-found):** ≥50%

### Non-Negotiable Requirements

- [ ] All 14 P0 tests pass
- [ ] R-001 (cascade delete) and R-002 (duplicate NIT) mitigations verified by API tests
- [ ] R-003 (search ≤1s with 500 records) verified by PERF test
- [ ] R-004 (TanStack Query cache invalidation) verified for all 3 mutations (create/edit/delete)
- [ ] NFR6: No stack trace in any error response (200%: tested in P0 + P3)
- [ ] NFR5: Input validation active on both Zod (frontend) and FluentValidation (backend)

---

## 7. Mitigation Plans

### R-001: Cascade Delete — Contact Orphaning (Score: 6)

**Mitigation Strategy:** Verify EF Core migration uses `ON DELETE SET NULL` on `fk_contactos_clientes` FK. Add API test in `SiesaAgents.UnitTests` (or integration test) seeding 2 contacts linked to a client, calling DELETE, then asserting GET on each contact returns `clienteId: null`. Add E2E test asserting correct toast text when deleting a client with associated contacts.
**Owner:** DEV (FK migration) + QA (API + E2E tests)
**Timeline:** Before Story 2.5 implementation is merged
**Status:** Planned
**Verification:** `GET /api/v1/contactos/{id}` returns `clienteId: null` after client deleted

### R-002: Duplicate NIT Conflict Message (Score: 6)

**Mitigation Strategy:** Verify Axios interceptor does not swallow 409 status. Verify Problem Details body contains `title` or `detail` containing "NIT" or "ya está registrado". E2E test asserts the exact UI message text matches AC in Story 2.3.
**Owner:** DEV (Axios interceptor + error message copy) + QA (E2E test)
**Timeline:** Before Story 2.3 implementation is merged
**Status:** Planned
**Verification:** E2E asserts `/nit.*ya existe|ya.*registrado/i` text visible; API test asserts 409 body has no `stackTrace` key

### R-003: Search Performance ≤1s with 500 Records (Score: 6)

**Mitigation Strategy:** Client-side filter is performed on the TanStack Query cached array (not via DOM queries). Verify filter function uses `.filter()` on the JS array. Use Playwright `performance.now()` or `page.clock` to measure render time. Assert filter completes in ≤1000ms from keypress to list DOM update with 500 seeded records.
**Owner:** DEV (filter implementation) + QA (performance test)
**Timeline:** During Story 2.1 implementation
**Status:** Planned
**Verification:** Playwright timing assertion: `renderTime ≤ 1000ms` with 500-record fixture

### R-004: TanStack Query Cache Invalidation (Score: 6)

**Mitigation Strategy:** Verify each mutation (create, edit, delete) calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. E2E tests assert the updated/created/deleted record is visible/absent without `page.reload()`.
**Owner:** DEV
**Timeline:** During Stories 2.3/2.4/2.5 implementation
**Status:** Planned
**Verification:** E2E tests do NOT call `page.reload()` after mutations; list state reflects change automatically

---

## 8. Assumptions and Dependencies

### Assumptions

1. The backend `ON DELETE SET NULL` constraint for `contactos.cliente_id` is implemented in the EF Core migration (Story 2.5). If cascade is handled at the application layer instead, additional service-layer tests are needed.
2. Client-side sort in Story 2.6 uses the TanStack Query cache array directly — no additional API endpoints are introduced for sort.
3. The existing `buildCliente()` and `ApiHelper` helpers in the E2E suite are extended (not replaced) to support cascade delete test setup.
4. The `SortControl` component at `src/shared/components/SortControl` is standalone and testable in isolation via Vitest + RTL.
5. No authentication is in scope; all endpoints are publicly accessible in the test environment.

### Dependencies

1. Epic 1 complete (Story 1.3: `clientes` table migration exists) — Required before Story 2.1 E2E tests can run
2. `buildCliente()` factory extended with `clienteId` field support — Required for cascade delete tests (Story 2.5)
3. MSW handlers for `/api/v1/clientes` — Required for component-level tests (Story 2.1 ErrorPanel, Story 2.6 SortControl)
4. Backend FluentValidation rules for ClienteDto (Nombre, NIT, Teléfono, Ciudad required) — Required for Story 2.3/2.4 API contract tests

### Risks to Plan

- **Risk:** Backend cascade FK implemented at application layer (not DB constraint) — the `ON DELETE SET NULL` behavior may be inconsistent under concurrent deletes.
  - **Impact:** Orphaned contacts with stale `clienteId` references; data corruption.
  - **Contingency:** Add an integration test verifying `contactos.cliente_id = NULL` after DELETE both at DB level (direct SQL assert) and API level.

- **Risk:** Search performance test relies on seeded 500-record fixture — slow seed time may inflate measured render time.
  - **Impact:** False positive performance failure.
  - **Contingency:** Seed data via direct DB INSERT (not through API) for performance tests; measure only from keypress event to DOM update.

---

## 9. Test Level Rationale

### Selection Strategy Applied

| Test Level | Use Cases in This Epic | Rationale |
|-----------|----------------------|-----------|
| **E2E (Playwright)** | Full CRUD journeys, toast messages, URL updates, error panel, cascade delete UI, sort+search combo | Only level that validates the complete user journey end-to-end including TanStack Router, Query cache, and Problem Details middleware |
| **API (xUnit / Playwright APIRequestContext)** | Contract tests (status codes, Problem Details format, 409, cascade FK assertion) | Faster than E2E for backend validation; no browser rendering overhead |
| **Component (Vitest + RTL + MSW)** | SortControl, ClienteListPanel debounce, ErrorPanel retry, form field rendering | Isolated unit-level UI testing; validates component state without full app boot |
| **Unit (Vitest)** | Zod schema validation (NIT, required fields, max-length), sort identifier constants | Fastest feedback for pure logic; no DOM, no network |

**Avoided Duplication:**
- Required field validation tested at Unit (Zod schema) + E2E (user sees error) — NOT at both E2E and API level simultaneously, unless different validation layers are being checked.
- Sort logic tested at Component level only — E2E adds a single cross-check for sort+search interaction.
- 409 conflict tested at API (contract) + E2E (message copy) — two different assertions, not duplicate.

---

## 10. Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests from this design (separate workflow — not auto-run by `*test-design`).
- Run `*automate` for broader coverage once Epic 2 implementation is merged.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: ___ Date: ___
- [ ] Tech Lead: ___ Date: ___
- [ ] QA Lead: ___ Date: ___

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories, automated scoring)
- `probability-impact.md` — Risk scoring methodology (probability × impact)
- `test-levels-framework.md` — Test level selection guidance
- `test-priorities-matrix.md` — P0-P3 prioritization criteria

### Related Documents

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Existing E2E spec: `e2e/tests/clientes/clientes-crud.spec.ts`
- Epic 1 test design: `_bmad-output/implementation-artifacts/test-design-epic-1.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Mode:** Epic-Level (Phase 4)
