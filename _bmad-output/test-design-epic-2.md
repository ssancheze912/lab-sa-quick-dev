# Test Design: Epic 2 — Client Management (Gestión de Clientes)

**Date:** 2026-06-21
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic Number:** 2
**Stories Covered:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (CRUD, search, sort, deep linking, error states)

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (score ≥6): 4
- Critical categories: DATA, BUS, PERF, TECH

**Coverage Summary:**

- P0 scenarios: 14 (28 hours)
- P1 scenarios: 18 (18 hours)
- P2/P3 scenarios: 22 (8 hours)
- **Total effort:** 54 hours (~7 days)

**Test Level Distribution:**

- E2E: 10 scenarios
- API: 16 scenarios
- Component: 14 scenarios
- Unit: 14 scenarios

---

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers complete client record management for the commercial team: list with real-time search, detail view with deep linking, create form, edit form, delete with confirmation, and client-side sort (Nombre A→Z, Z→A, Más reciente, Más antiguo). The UI uses a two-panel layout (`/clientes` = list + detail panel). Sorting is client-side over TanStack Query cache — no additional API calls. The backend exposes a REST `/api/v1/clientes` resource with CRUD endpoints; NIT/RUC is unique-constrained at the database level.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time filter, EmptyState, ErrorPanel, 500-record performance |
| 2.2 | Client Detail View | Deep linking, not-found graceful handling, URL sync |
| 2.3 | Create Client | Form validation, duplicate NIT/RUC (409), success toast |
| 2.4 | Edit Client | Pre-fill, update reflection, cancel guard, required field validation |
| 2.5 | Delete Client | Confirmation dialog, contact disassociation, success toast, panel reset |
| 2.6 | Sort Client List | 4 sort modes, sort over filtered set, default "Más reciente", no API call |

### Out of Scope for This Epic

- Contact management (Epic 3)
- Client↔Contact association (Epic 4)
- Authentication / authorization (deferred post-MVP)
- Server-side pagination (deferred post-MVP)
- Performance under >500 records (beyond MVP scale)
- HTTPS enforcement (non-local deployments only — NFR4)

---

## 2. Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Contact disassociation on client delete — `ON DELETE SET NULL` not applied in migration; associated contacts could be orphaned or cascade-deleted instead of becoming `clienteId = null` | 2 | 3 | 6 | Integration test: create client with contacts, delete client, assert contacts still exist with `clienteId = null` in DB | QA/DEV | Before Story 2.5 merge |
| R-002 | BUS | Duplicate NIT/RUC creates 409 backend response that is NOT mapped to a user-friendly inline error — user sees generic toast or silent failure | 2 | 3 | 6 | API + Component test: POST duplicate NIT, assert 409 → UI shows "El NIT/RUC ya está registrado" inline, no stack trace | QA | Before Story 2.3 merge |
| R-003 | PERF | Real-time search with 500 records causes visible lag (>1s) due to unoptimized filter function — AC-E2.2 NFR1 violation | 2 | 3 | 6 | Component + Unit test: seed 500 records in TQ cache, measure filter latency < 200ms; E2E smoke with 500-record seed | QA/DEV | Before Story 2.1 merge |
| R-004 | TECH | Sort applied to raw unfiltered list rather than to the filtered result set — AC-E2.6 violation; user loses active search after changing sort | 2 | 3 | 6 | Unit test: apply search filter then change sort, assert sort works only on filtered array without clearing search | DEV | Before Story 2.6 merge |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-005 | TECH | Deep link `/clientes/:clienteId` loads but TanStack Query cache is cold — component must re-fetch correctly or display NotFound | 2 | 2 | 4 | E2E: navigate directly to `/clientes/{uuid}`, assert correct detail panel loads | QA |
| R-006 | BUS | Delete confirmation dialog can be bypassed by rapid double-click or keyboard shortcut — client deleted without explicit confirmation | 1 | 3 | 3 | Component test: simulate click sequence, assert deletion only proceeds after explicit "Confirmar" | QA |
| R-007 | DATA | `CreatedAt`/`UpdatedAt` stored as `DateTime` instead of `DateTimeOffset` — sort by "Más reciente" / "Más antiguo" produces wrong order in non-UTC environments | 1 | 3 | 3 | Unit test: verify entity timestamps are `DateTimeOffset`; API test: assert response includes timezone offset | DEV |
| R-008 | BUS | Form does not block navigation (no dirty-check guard) when user has unsaved edits and clicks "Cancelar" — silent data loss expectation mismatch | 2 | 2 | 4 | Component test: fill form, click Cancelar, assert original data unchanged and no submit fires | QA |
| R-009 | TECH | TanStack Query `invalidateQueries(['clientes'])` not called after create/update/delete — list does not update immediately, breaking FR27 | 2 | 2 | 4 | Integration test: create client, assert new item appears in list without manual refresh | QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-010 | OPS | EmptyState component not rendered when backend returns empty array vs. undefined response | 1 | 2 | 2 | Monitor / Component test |
| R-011 | BUS | Toast messages displayed in wrong language (English instead of Spanish) violating UX spec | 1 | 1 | 1 | Monitor / Spot check in Component tests |

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

**Criteria:** Blocks core journey + High risk (≥6) + No workaround

| AC / Requirement | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|-----------------|------------|-----------|----------------------|------------|-------|
| AC-E2.1: Create client, appears in list | E2E | R-009 | Happy path: fill all required fields, submit, assert client in list + success toast | 1 | QA |
| AC-E2.4: Required field validation blocks submit | Component | R-002 | Submit empty form, assert inline errors on Nombre, NIT/RUC, Teléfono, Ciudad; no API call | 1 | QA |
| AC-E2.3: Duplicate NIT/RUC → inline error | API + Component | R-002 | POST duplicate NIT, mock 409, assert "El NIT/RUC ya está registrado" visible, no stack trace | 2 | QA |
| AC-E2.5: Delete client + contact disassociation | API (Integration) | R-001 | Create client + contacts, DELETE client, assert contacts exist with `clienteId = null` | 2 | QA |
| AC-E2.5: Delete reflects immediately in list | E2E | R-001, R-009 | Confirm delete, assert client removed from list, panel returns to default state | 1 | QA |
| AC-E2.2: Search returns results < 1s with 500 records | Component + Unit | R-003 | Seed 500-item cache, trigger filter, assert filtered list rendered in < 200ms | 2 | QA/DEV |
| AC-E2.6: Sort over filtered set without clearing filter | Unit | R-004 | Apply search "acme", change sort to "Nombre Z→A", assert search input unchanged and sort applies to filtered array | 2 | DEV |
| AC-E2.3: Create client visible to all / TQ invalidation | E2E | R-009 | Create client, assert list auto-updates (invalidateQueries called) | 1 | QA |

**Total P0:** 14 tests, 28 hours (2 hours/test)

---

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3-4) + Common workflows

| AC / Requirement | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|-----------------|------------|-----------|----------------------|------------|-------|
| AC-E2.2: Deep link `/clientes/:id` loads correct detail | E2E | R-005 | Navigate directly to `/clientes/{uuid}`, assert detail panel shows correct Nombre/NIT | 1 | QA |
| Story 2.2: Not-found graceful handling | E2E | R-005 | Navigate to `/clientes/nonexistent-uuid`, assert NotFound message displayed | 1 | QA |
| Story 2.2: URL updates on client select | Component | R-005 | Click client item, assert URL changes to `/clientes/:clienteId` without reload | 1 | QA |
| AC-E2.3: Edit pre-fills current values | Component | R-008 | Open edit form, assert all fields populated with current client data | 1 | QA |
| AC-E2.4: Edit required field clear blocks submit | Component | R-008 | Clear Nombre in edit form, submit, assert inline error and no API call | 1 | QA |
| AC-E2.3: Edit Cancel — original data unchanged | Component | R-008 | Fill edit form, click Cancelar, assert detail panel shows original values | 1 | QA |
| AC-E2.5: Delete Cancelar — record remains | Component | R-006 | Open delete dialog, click Cancelar, assert client still in list | 1 | QA |
| AC-E2.5: Delete toast with contacts message | E2E | R-001 | Delete client with associated contacts, assert toast reads "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." | 1 | QA |
| AC-E2.6: Sort Nombre A→Z | Component | - | Select "Nombre A→Z", assert list alphabetically ascending | 1 | QA |
| AC-E2.6: Sort Nombre Z→A | Component | - | Select "Nombre Z→A", assert list alphabetically descending | 1 | QA |
| AC-E2.6: Sort Más reciente | Component | R-007 | Select "Más reciente", assert newest client (by `createdAt` desc) appears first | 1 | QA |
| AC-E2.6: Sort Más antiguo | Component | R-007 | Select "Más antiguo", assert oldest client (by `createdAt` asc) appears first | 1 | QA |
| AC-E2.6: Default sort is "Más reciente" | Component | - | On initial load with no sort preference, assert default sort `fecha-desc` selected | 1 | DEV |
| Story 2.1: EmptyState when no clients | Component | R-010 | Mock empty API response, assert EmptyState rendered with guidance message | 1 | QA |
| Story 2.1: ErrorPanel on backend failure | Component | - | Mock API error on fetch, assert ErrorPanel with "Reintentar" button rendered | 1 | QA |
| AC-E2.6: Sort does NOT trigger new API call | Unit | R-004 | Change sort option, assert no `fetch`/`axios` call fired (spy on query client) | 1 | DEV |
| `DateTimeOffset` on entities | API | R-007 | GET /api/v1/clientes, assert `createdAt` in response includes timezone offset (ISO 8601 with +hh:mm) | 1 | DEV |
| AC-E2.1: Success toast on create | Component | - | Submit valid form, mock 201 response, assert toast "Cliente creado correctamente" | 1 | QA |

**Total P1:** 18 tests, 18 hours (1 hour/test)

---

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (1-2) + Edge cases

| AC / Requirement | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|-----------------|------------|-----------|----------------------|------------|-------|
| AC-E2.4: Update success toast | Component | - | Submit valid edit form, assert toast "Cliente actualizado correctamente" | 1 | QA |
| Story 2.1: Real-time filter updates with keystroke | Component | - | Type progressively in search field, assert list updates on each keystroke | 1 | QA |
| AC-E2.2: Deep link to non-existent client — NFR6 no stack trace | API | R-002 | GET /api/v1/clientes/{nonexistent-uuid}, assert 404 Problem Details without stackTrace field | 1 | QA |
| Search with special characters (NIT/RUC format) | Unit | - | Filter function handles hyphens and slashes in NIT input without errors | 1 | DEV |
| Toast Spanish language validation | Component | R-011 | Assert all toast messages are in Spanish as specified in epic ACs | 3 | QA |
| API: GET /api/v1/clientes returns correct shape | API | - | Assert response array items include id, nombre, nit, telefono, ciudad, createdAt, updatedAt | 1 | QA |
| API: POST /api/v1/clientes validation errors (400) | API | - | POST missing required fields, assert 400 Problem Details with field-level errors | 1 | QA |
| API: PUT /api/v1/clientes/{id} returns updated resource | API | - | PUT valid payload, assert 200 with updated field values | 1 | QA |
| API: DELETE /api/v1/clientes/{id} returns 204 | API | - | DELETE existing client, assert 204 No Content | 1 | QA |
| SortControl initial render with no preference | Component | - | Mount SortControl with no stored preference, assert `fecha-desc` option selected | 1 | DEV |
| EmptyState when search yields no results | Component | - | Apply filter that matches no clients, assert empty results message (not full EmptyState) | 1 | QA |

**Total P2:** 13 tests, 6.5 hours (0.5 hours/test)

---

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Scenario Description | Test Count | Owner |
|-------------|------------|----------------------|------------|-------|
| Search debounce performance benchmark | Unit | Measure filter time at 100, 250, 500 records; assert no degradation curve | 1 | DEV |
| Keyboard navigation through client list | E2E | Arrow keys navigate items, Enter opens detail | 1 | QA |
| Form field tab order | Component | Tab through form fields in logical order | 1 | QA |
| Visual regression: client list panel | E2E | Screenshot comparison of client list at 1280px and 375px | 2 | QA |
| API: concurrent DELETE requests for same client | API | Two simultaneous DELETE requests — assert second returns 404 gracefully | 1 | QA |
| Pagination readiness: 1000+ records stress | API | Seed 1000 clients, GET /api/v1/clientes, assert response time < 3s | 1 | QA |

**Total P3:** 7 tests, 1.75 hours (0.25 hours/test)

---

## 4. Execution Order

### Smoke Tests (<5 min)

**Purpose:** Fast feedback — catch deployment-breaking issues

- [ ] GET /api/v1/clientes returns 200 with array (30s)
- [ ] GET /health returns 200 (15s)
- [ ] Frontend route `/clientes` renders without JS errors (45s)
- [ ] Create client happy path — end to end (90s)

**Total:** 4 scenarios

---

### P0 Tests (<10 min)

**Purpose:** Critical path validation — gate for every commit

- [ ] Create client: all required fields, client appears in list (E2E)
- [ ] Create client: empty form submit blocked with inline errors (Component)
- [ ] Create client: duplicate NIT/RUC returns inline error message (API + Component)
- [ ] Delete client: contact disassociation — contacts remain with null clienteId (API)
- [ ] Delete client: removed from list, panel resets (E2E)
- [ ] Search 500 records: filter latency < 200ms (Component + Unit)
- [ ] Sort over filtered set: search preserved after sort change (Unit)
- [ ] TanStack Query invalidation: list auto-updates after create (E2E)
- [ ] TanStack Query invalidation: list auto-updates after delete (E2E)

**Total:** 14 scenarios (across all P0 test counts including duplicates in table above)

---

### P1 Tests (<30 min)

**Purpose:** Important feature coverage — gate for PR to main

- [ ] Deep link direct navigation to client detail (E2E)
- [ ] Not-found graceful handling for unknown clienteId (E2E)
- [ ] URL updates to `/clientes/:id` on client select (Component)
- [ ] Edit form pre-fills current values (Component)
- [ ] Edit: required field clear blocks submit (Component)
- [ ] Edit: Cancel preserves original data (Component)
- [ ] Delete: Cancel does not remove record (Component)
- [ ] Delete with contacts: toast shows disassociation message (E2E)
- [ ] Sort Nombre A→Z (Component)
- [ ] Sort Nombre Z→A (Component)
- [ ] Sort Más reciente / Más antiguo (Component x2)
- [ ] Default sort "Más reciente" on initial load (Component)
- [ ] EmptyState on empty API response (Component)
- [ ] ErrorPanel on backend failure with Reintentar button (Component)
- [ ] Sort does not trigger API call (Unit)
- [ ] CreatedAt in ISO 8601 with timezone offset (API)
- [ ] Success toast "Cliente creado correctamente" (Component)
- [ ] Success toast "Cliente actualizado correctamente" (Component)

**Total:** 18 scenarios

---

### P2/P3 Tests (<60 min)

**Purpose:** Full regression + edge cases

- P2: API contract validation (GET, POST, PUT, DELETE shape and error codes)
- P2: Spanish toast language assertions
- P2: Search edge cases (special characters, empty results state)
- P3: Keyboard navigation
- P3: Visual regression screenshots
- P3: Concurrent DELETE stress test
- P3: 1000-record performance benchmark

**Total:** 20 scenarios

---

## 5. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 14 | 2.0 | 28 | Complex setup, DB seeding, mock 409/disassociation |
| P1 | 18 | 1.0 | 18 | Standard E2E and component coverage |
| P2 | 13 | 0.5 | 6.5 | API contract + edge cases |
| P3 | 7 | 0.25 | 1.75 | Exploratory + benchmarks |
| **Total** | **52** | **—** | **54.25** | **~7 days** |

### Prerequisites

**Test Data:**

- `clienteFactory` — faker-based factory generating valid client records (Nombre, NIT/RUC, Teléfono, Ciudad); auto-cleanup after each test
- `clienteWithContactsFixture` — creates a client + N contacts for disassociation tests (Story 2.5)
- `bulkClientesFixture` — seeds 500 client records in TanStack Query cache mock for search performance tests

**Tooling:**

- Vitest + React Testing Library + MSW for Component and Unit tests
- xUnit + EF Core InMemory/TestServer for API integration tests
- Playwright (E2E) for critical path and deep-link scenarios
- `@testing-library/user-event` for form interaction simulation

**Environment:**

- Local Docker-Compose with PostgreSQL 18+ test database (auto-migrate on start)
- MSW handlers for `/api/v1/clientes` intercepting all HTTP methods in component tests
- TanStack Query test wrapper with `QueryClient` fresh instance per test

---

## 6. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions; blocks merge)
- **P1 pass rate:** ≥95% (waivers documented per failing test)
- **P2/P3 pass rate:** ≥90% (informational; tracked in backlog)
- **High-risk mitigations (R-001 to R-004):** 100% test coverage before story merge

### Coverage Targets

- **Critical paths (CRUD + search):** ≥80% line coverage on `src/modules/crm/clientes`
- **API endpoints (all 5):** 100% contract tested
- **Business logic (filter, sort, form validation):** ≥70% branch coverage
- **Error scenarios (404, 409, 500, empty state):** ≥50% of defined error paths

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk items (R-001 to R-004) unmitigated before epic close
- [ ] Contact disassociation (R-001) verified by integration test before Story 2.5 ships
- [ ] NFR1 search performance (<1s) validated with 500-record seed (R-003)
- [ ] NFR6 no stack traces: all API error responses use Problem Details RFC 7807

---

## 7. Mitigation Plans

### R-001: Contact Disassociation on Client Delete (Score: 6)

**Mitigation Strategy:** Add API integration test that creates a `Cliente` with 2 `Contacto` records, calls `DELETE /api/v1/clientes/{id}`, then queries `GET /api/v1/contactos` and asserts both contacts exist with `clienteId: null`. Verify database migration applies `ON DELETE SET NULL` on `contactos.cliente_id` FK.
**Owner:** DEV (migration) + QA (integration test)
**Timeline:** Before Story 2.5 implementation begins
**Status:** Planned
**Verification:** Integration test must be GREEN before Story 2.5 PR merges

### R-002: Duplicate NIT/RUC Not Surfaced as Inline Error (Score: 6)

**Mitigation Strategy:** MSW handler returns 409 for POST/PUT with duplicate NIT. Component test asserts: (1) the UI field shows "El NIT/RUC ya está registrado" inline error, (2) no generic error toast appears, (3) no stack trace text visible anywhere in DOM.
**Owner:** DEV (error mapping in axios interceptor) + QA (component test)
**Timeline:** Before Story 2.3 PR merges
**Status:** Planned
**Verification:** Component test `duplicate-nit.spec.tsx` must be GREEN

### R-003: Search Performance with 500 Records (Score: 6)

**Mitigation Strategy:** Unit test for the filter function seeds a 500-item array via `clienteFactory.buildList(500)`, calls the filter function with a search term, and asserts execution time < 200ms using `performance.now()`. E2E smoke test seeds the API mock with 500 records and measures render time.
**Owner:** DEV (optimize filter with memoization if needed) + QA (unit + E2E test)
**Timeline:** Before Story 2.1 PR merges
**Status:** Planned
**Verification:** Unit test latency assertion + E2E Playwright timing assertion

### R-004: Sort Applied to Unfiltered List (Score: 6)

**Mitigation Strategy:** Unit test: (1) set search state to "Acme", (2) verify filtered list has 3 items, (3) change sort to `nombre-desc`, (4) assert filtered list still has 3 items in reverse alpha order AND search input value is unchanged.
**Owner:** DEV (SortControl + list component logic)
**Timeline:** Before Story 2.6 PR merges
**Status:** Planned
**Verification:** Unit test `sort-over-filtered-list.spec.ts` must be GREEN

---

## 8. Assumptions and Dependencies

### Assumptions

1. Epic 1 (Foundation) is COMPLETE: backend is running on port 5000, PostgreSQL is available, CORS is configured for `localhost:5173`, and `Problem Details RFC 7807` middleware is active.
2. The `clientes` table migration from Story 2.3 (backend) will be applied before any API integration tests run.
3. Story 2.5 backend implementation applies `ON DELETE SET NULL` on the `contactos.cliente_id` FK constraint (coordinated with Epic 3).
4. MSW is set up as part of the test framework from Epic 1 / Story 1.2 test infrastructure.
5. Sort is implemented fully client-side; no API query parameter for sort order is required (per epic technical context).

### Dependencies

1. `contactos` table schema (Epic 3) — required by R-001 disassociation tests; coordinate with Epic 3 before closing Story 2.5
2. `clienteFactory` (faker-based) — must be created in Story 2.3 implementation before P0 test development
3. TanStack Query test wrapper — required for all Component and Unit cache tests (available from Epic 1 setup)
4. Playwright test setup — required for E2E tests (available if testarch-framework workflow was run)

### Risks to Plan

- **Risk:** Epic 3 (Contacts) schema delayed — Story 2.5 disassociation tests (R-001) cannot be fully validated without `contactos` table
  - **Impact:** P0 integration test for R-001 blocked
  - **Contingency:** Mock the DB constraint behavior in unit test; add full integration test as Epic 3 dependency gate

---

## 9. Follow-on Workflows (Manual)

- Run `*atdd` per story (2.1 through 2.6) to generate failing Playwright/Vitest tests before implementation (TDD red-green cycle).
- Run `*automate` after implementation to expand coverage beyond P0/P1 baseline.
- Run `*trace` at epic close to generate traceability matrix and emit quality gate decision.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: — Date: —
- [ ] Tech Lead: — Date: —
- [ ] QA Lead: — Date: —

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories, automated scoring)
- `probability-impact.md` — Probability × impact matrix
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision matrix
- `test-priorities-matrix.md` — P0-P3 prioritization criteria

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 1 Test Design (reference): `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
