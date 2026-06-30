# Test Design: Epic 2 - Client Management

**Date:** 2026-06-30
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Workflow:** `_bmad/bmm/testarch/test-design` v4.0

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management

Epic 2 delivers the complete CRUD lifecycle for clients: the commercial team can register, view, search, sort, update, and delete client records. The epic encompasses 6 stories spanning a split-panel layout with a scrollable client list (left panel, 280px) and a detail view (right panel), real-time filtering, client-side sorting, form validation (frontend Zod + backend FluentValidation), and optimistic cache invalidation via TanStack Query.

**Stories covered:**
- Story 2.1: Client List & Search
- Story 2.2: Client Detail View
- Story 2.3: Create Client
- Story 2.4: Edit Client
- Story 2.5: Delete Client
- Story 2.6: Sort Client List

**Requirements covered:** FR1–FR8, FR27, FR28, FR29, FR30 + NFR1 (search < 1s), NFR2 (CRUD < 2s), NFR5 (input validation), NFR6 (no stack traces)

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (score ≥6): 4
- Critical categories: DATA, BUS, PERF, SEC

**Coverage Summary:**

- P0 scenarios: 10 (20 hours)
- P1 scenarios: 14 (14 hours)
- P2/P3 scenarios: 12 (5 hours)
- **Total effort:** 39 hours (~5 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Duplicate NIT/RUC allowed due to missing unique constraint enforcement — backend allows 409 path but constraint not applied in migration | 2 | 3 | 6 | Verify `uk_clientes_nit` unique constraint exists in migration; integration test: POST with duplicate NIT returns 409 | Dev | Story 2.3 |
| R-002 | BUS | Deleting a client with associated contacts silently removes contacts instead of setting `cliente_id = NULL` — `ON DELETE SET NULL` not configured in EF Core | 2 | 3 | 6 | Verify `ContactoConfiguration.cs` applies `ON DELETE SET NULL` on FK; integration test: delete client with contacts and confirm contacts remain with `clienteId = null` | Dev | Story 2.5 |
| R-003 | PERF | Client-side filtering over 500 records exceeds 1-second render threshold due to unoptimized `useMemo` dependency or missing memoization | 2 | 3 | 6 | Component test with 500 seeded records: measure filter render time; assert < 1000ms; verify `useMemo` wraps the filter | QA | Story 2.1 |
| R-004 | BUS | TanStack Query cache not invalidated after mutation — stale list shown after create/edit/delete instead of reflecting the change immediately (NFR2 + FR27 violation) | 3 | 2 | 6 | For each mutation hook: unit test `queryClient.invalidateQueries(['clientes'])` called in `onSuccess`; E2E: verify list updates after each CRUD operation | QA | Stories 2.3–2.5 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-005 | SEC | Backend accepts client creation without input sanitization — HTML/script tags stored in Nombre or Ciudad fields (NFR5) | 2 | 2 | 4 | Integration test: POST with `<script>alert(1)</script>` in Nombre; verify FluentValidation rejects or sanitizes; confirm no XSS stored | Dev |
| R-006 | BUS | Form submitted with all required fields empty and reaches the backend — frontend Zod validation not preventing submission | 2 | 2 | 4 | Component test: submit ClienteForm with empty fields; assert inline errors shown, no HTTP request fired; verify `onSubmit` not called | QA |
| R-007 | BUS | Cancel button in edit form does not restore original values — dirty form state persists after cancel | 2 | 2 | 4 | Component test: pre-fill form, modify field, click Cancelar; assert form closes and client detail shows original values | QA |
| R-008 | TECH | Deep link `/clientes/:clienteId` with non-existent ID renders blank page or unhandled error instead of graceful not-found message | 2 | 2 | 4 | E2E test: navigate directly to `/clientes/non-existent-uuid`; verify not-found message rendered; no console errors | QA |
| R-009 | BUS | Sort state lost when search filter changes — switching sort order clears search input, violating AC-E2.6 | 2 | 2 | 4 | Component test: apply search, then change sort; assert search input value unchanged and list is filtered+sorted | QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-010 | OPS | Backend returns raw exception detail when GET `/api/v1/clientes` fails — ExceptionHandlingMiddleware not registered before endpoint mapping | 1 | 2 | 2 | Monitor — integration test: cause deliberate 500; verify response is Problem Details (no stack trace) |
| R-011 | BUS | EmptyState component not shown when `clientes` list returns 0 records — conditional rendering missing in ClienteListView | 1 | 2 | 2 | Monitor — component test: render ClienteListView with empty array; assert EmptyState renders |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround exists

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-E2.1: Create client — all required fields + immediate list update | E2E | R-001, R-004 | 2 | QA | Happy path + POST 409 for duplicate NIT |
| AC-E2.5: Delete client — removed from list immediately | E2E | R-002, R-004 | 2 | QA | Delete with no contacts + delete with associated contacts (verify contacts retain with clienteId=null) |
| NFR1: Search returns results in < 1s with 500 records | Component | R-003 | 2 | QA | useMemo filter timing with 500 records; assert < 1000ms |
| FR27: Cache invalidated after create/edit/delete | Unit | R-004 | 4 | DEV | Unit tests on useCreateCliente, useUpdateCliente, useDeleteCliente: verify invalidateQueries(['clientes']) called on success |

**Total P0**: 10 tests, 20 hours

### P1 (High) — Run on PR to main

**Criteria**: Important user features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-E2.3: View client detail + edit all fields + save | E2E | R-007 | 2 | QA | Edit happy path + cancel restores original values |
| AC-E2.4: Form validation — required fields empty → inline errors, no submit | Component | R-006 | 3 | QA | Empty Nombre, empty NIT, empty Ciudad; verify error messages, no HTTP call |
| NFR5: Backend rejects/sanitizes XSS input in Nombre and Ciudad | API | R-005 | 2 | DEV | POST with script tags; verify 400 or sanitized response |
| AC-E2.6: Sort preserves active search filter | Component | R-009 | 2 | QA | Apply search, change sort; assert input and filter unchanged |
| FR30: Deep link `/clientes/:clienteId` direct URL — existing ID loads detail | E2E | R-008 | 2 | QA | Navigate directly to valid + invalid UUID; verify correct rendering |
| Story 2.1: EmptyState rendered when 0 clients exist | Component | R-011 | 1 | QA | Render ClienteListView with empty array |
| Story 2.1: ErrorPanel + retry button rendered when fetch fails | Component | — | 2 | QA | Mock network error; assert ErrorPanel with Reintentar button |

**Total P1**: 14 tests, 14 hours

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-E2.6: All sort orders (nombre-asc, nombre-desc, fecha-desc, fecha-asc) without new API call | Component | — | 4 | QA | Each sort order: verify list order + no extra fetch |
| AC-E2.6: Default sort is "Más reciente" on initial load | Component | — | 1 | QA | Render SortControl with no prior state; assert fecha-desc selected |
| Story 2.5: Confirmation dialog shows before delete | Component | — | 2 | QA | Click Eliminar → confirm dialog; click Cancelar → record unchanged |
| Story 2.3: Success toast "Cliente creado correctamente" | Component | — | 1 | DEV | Mock mutation success; assert toast content |
| Story 2.4: Success toast "Cliente actualizado correctamente" | Component | — | 1 | DEV | Mock mutation success; assert toast content |
| Story 2.5: Success toast includes orphan contacts message when applicable | Component | — | 1 | DEV | Delete client with contacts; assert toast "Sus contactos asociados quedaron sin cliente asignado" |
| NFR6: Backend 500 error returns Problem Details, not stack trace | API | R-010 | 1 | DEV | Trigger deliberate error; verify Problem Details shape, no stackTrace field |
| Zod schema: clienteSchema validates all four required fields | Unit | — | 1 | DEV | Unit test on clienteSchema.ts with valid + invalid inputs |

**Total P2**: 12 tests, 5 hours

### P3 (Low) — Run on-demand

**Criteria**: Nice-to-have + Exploratory + Benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| NFR2: CRUD reflects changes in UI in < 2s under normal conditions | E2E | 1 | QA | Create client; measure time from submit to list update |
| Story 2.1: List scrollable with 500 records — no layout overflow | E2E | 1 | QA | Seed 500 clients; verify scroll behavior, no horizontal overflow |
| FR29: Mobile viewport (375px) — split panel, form, detail render correctly | E2E | 1 | QA | Playwright mobile viewport; complete full CRUD cycle |

**Total P3**: 3 tests, 1 hour

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback — catch build-breaking issues before full test suite

- [ ] GET /api/v1/clientes returns 200 with empty array on fresh DB (15s)
- [ ] POST /api/v1/clientes with valid body returns 201 and client object (20s)
- [ ] Frontend /clientes route renders ClienteListView without console errors (30s)

**Total**: 3 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation — cache invalidation, NIT uniqueness, cascade delete

- [ ] E2E: Create client → appears in list immediately (TanStack Query invalidation) (90s)
- [ ] E2E: POST duplicate NIT → 409 response + "El NIT/RUC ya está registrado" error shown (60s)
- [ ] E2E: Delete client (no contacts) → removed from list, right panel returns to default state (60s)
- [ ] E2E: Delete client (with contacts) → contacts remain in system with clienteId=null (120s)
- [ ] Component: Filter 500 clients by name → render time < 1000ms (30s)
- [ ] Component: Filter 500 clients by NIT/RUC → render time < 1000ms (30s)
- [ ] Unit: useCreateCliente.onSuccess → invalidateQueries(['clientes']) called (10s)
- [ ] Unit: useUpdateCliente.onSuccess → invalidateQueries(['clientes']) called (10s)
- [ ] Unit: useDeleteCliente.onSuccess → invalidateQueries(['clientes']) called (10s)
- [ ] API: uk_clientes_nit unique constraint — second insert with same NIT returns 409 (20s)

**Total**: 10 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage — edit, validation, sort, deep link, error states

- [ ] E2E: Edit client — form pre-filled, modify Telefono, save → detail reflects new value (90s)
- [ ] E2E: Edit client — cancel → original values restored, no change in list (60s)
- [ ] Component: Submit empty Nombre → inline error "El nombre es requerido", no HTTP call (15s)
- [ ] Component: Submit empty NIT/RUC → inline error shown, no HTTP call (15s)
- [ ] Component: Submit empty Ciudad → inline error shown, no HTTP call (15s)
- [ ] API: POST Nombre = `<script>alert(1)</script>` → 400 or sanitized response (20s)
- [ ] API: POST Ciudad = `<script>` → 400 or sanitized response (20s)
- [ ] Component: Search "abc" then sort "nombre-asc" → search input still "abc", list filtered+sorted (20s)
- [ ] Component: Sort "nombre-desc" then search → sort preserved (20s)
- [ ] E2E: Navigate directly to /clientes/:valid-uuid → client detail loads (40s)
- [ ] E2E: Navigate directly to /clientes/non-existent-uuid → not-found message shown (30s)
- [ ] Component: ClienteListView with [] → EmptyState with create-first-client message (10s)
- [ ] Component: ClienteListView on fetch error → ErrorPanel with Reintentar button (15s)
- [ ] Component: Click Reintentar in ErrorPanel → refetch triggered (15s)

**Total**: 14 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression — sort orders, toasts, dialogs, NFR2, mobile

- [ ] Component: Sort "nombre-asc" → list alphabetical ascending, no new API call (10s)
- [ ] Component: Sort "nombre-desc" → list alphabetical descending, no new API call (10s)
- [ ] Component: Sort "fecha-desc" → newest client first, no new API call (10s)
- [ ] Component: Sort "fecha-asc" → oldest client first, no new API call (10s)
- [ ] Component: SortControl default = "fecha-desc" on first render (5s)
- [ ] Component: Click Eliminar → confirmation dialog with "¿Eliminar este cliente?" + options (15s)
- [ ] Component: Confirmation dialog → click Cancelar → client still in list (10s)
- [ ] Component: Create success → toast "Cliente creado correctamente" (10s)
- [ ] Component: Update success → toast "Cliente actualizado correctamente" (10s)
- [ ] Component: Delete client with contacts → toast with orphan message (10s)
- [ ] API: Trigger 500 → Problem Details response, no stackTrace field (15s)
- [ ] Unit: clienteSchema validates Nombre, NIT, Telefono, Ciudad all required (5s)
- [ ] E2E: Create + submit → UI updated in < 2s (P3, benchmark) (60s)
- [ ] E2E: Seed 500 clients → scroll without layout overflow (P3) (120s)
- [ ] E2E: Mobile 375px → full CRUD cycle completes (P3) (180s)

**Total**: 15 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 10 | 2.0 | 20 | Complex setup: DB seed, mutation mocks, cascade delete |
| P1 | 14 | 1.0 | 14 | Standard: form tests, E2E paths, error states |
| P2 | 12 | 0.4 | 5 | Simple: sort variants, toast assertions, dialog |
| P3 | 3 | 0.3 | 1 | Benchmarks and exploratory |
| **Total** | **39** | **—** | **40 hours** | **~5 days** |

### Prerequisites

**Test Data:**

- `clienteFactory` — faker-based factory: `{ nombre: faker.company.name(), nit: faker.string.numeric(10), telefono: faker.phone.number(), ciudad: faker.location.city() }`; auto-cleanup via `afterEach` DB reset
- `clientesWith500Records` fixture — seeds 500 clients for NFR1 performance tests
- `clienteWithContacts` fixture — seeds 1 client + 2 contacts with `clienteId` FK for Story 2.5 cascade test

**Tooling:**

- Vitest + React Testing Library + MSW for unit and component tests (frontend)
- Playwright for E2E tests (critical paths and responsive)
- xUnit for backend integration/unit tests
- WebApplicationFactory (testcontainers or in-memory for integration API tests)

**Environment:**

- Test PostgreSQL database (ephemeral) for backend integration tests — same schema as production, `uk_clientes_nit` constraint active
- Playwright browser: Chromium + Firefox for E2E
- Mobile viewport: 375×812 (iPhone SE) for NFR29 tests

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations (R-001 to R-004)**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths (CRUD + cache invalidation)**: ≥80%
- **Security scenarios (NFR5 input sanitization)**: 100%
- **Business logic (validation, sort, search)**: ≥70%
- **Edge cases (empty state, error panel, cancel)**: ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated before implementation starts
- [ ] `uk_clientes_nit` unique constraint validated by integration test
- [ ] `ON DELETE SET NULL` behavior on contacts validated by integration test

---

## Mitigation Plans

### R-001: Duplicate NIT/RUC allowed (Score: 6)

**Mitigation Strategy:** Verify `ClienteConfiguration.cs` (EF Core) declares `HasIndex(c => c.NIT).IsUnique()` generating `uk_clientes_nit`. Add backend integration test: seed one client, POST second with same NIT → assert HTTP 409 response with Problem Details `"El NIT/RUC ya está registrado"`. Add frontend unit test: mock 409 response from MSW → assert error message rendered in form without technical details.
**Owner:** Dev
**Timeline:** Before Story 2.3 implementation
**Status:** Planned
**Verification:** Integration test passing + frontend unit test passing

### R-002: DELETE client does not cascade SET NULL on contacts (Score: 6)

**Mitigation Strategy:** Verify `ContactoConfiguration.cs` applies `.OnDelete(DeleteBehavior.SetNull)` on the `ClienteId` FK. Write integration test: create 1 client + 2 contacts with `clienteId`, DELETE client, GET each contact by ID → assert `clienteId = null`, contacts still exist. Validate toast message includes orphan warning.
**Owner:** Dev
**Timeline:** Before Story 2.5 implementation
**Status:** Planned
**Verification:** Integration test with real PostgreSQL confirms SET NULL behavior

### R-003: Search performance > 1s with 500 records (Score: 6)

**Mitigation Strategy:** Component test seeds 500 mock client objects into MSW. Render `ClienteListView` with 500 records, type in search field. Use `performance.now()` before/after render. Assert render completes in < 1000ms. Verify `useMemo` wraps the filter function and has correct dependencies `[clientes, searchQuery]`.
**Owner:** QA
**Timeline:** Before Story 2.1 implementation
**Status:** Planned
**Verification:** Component test passes consistently; no memoization regression

### R-004: TanStack Query cache not invalidated after mutation (Score: 6)

**Mitigation Strategy:** Unit tests for each mutation hook (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`): mock `queryClient.invalidateQueries` with `vi.fn()`, execute mutation `onSuccess` callback, assert `invalidateQueries` called with `{ queryKey: ['clientes'] }`. E2E smoke test: complete create action, assert list re-renders with new item within 2s.
**Owner:** QA
**Timeline:** Before Stories 2.3–2.5 implementation
**Status:** Planned
**Verification:** All three unit tests pass; E2E list update confirmed

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 is complete and the frontend dev server (port 5173) and backend (port 5000) run without errors — test infrastructure is available.
2. PostgreSQL test database is accessible with the same schema used in production (migrations applied); `uk_clientes_nit` constraint exists.
3. MSW (Mock Service Worker) is configured in the frontend test setup (`src/mocks/handlers.ts`) from Epic 1 foundation.
4. `siesa-ui-kit` components (`ContactManager`, `EmptyState`, `SortControl`) are available and render correctly in the test environment.
5. Client-side search is performed in memory on the TanStack Query cache (no additional API call for search), as specified in the architecture (`NFR1` + client-side filter strategy).

### Dependencies

1. `ClienteConfiguration.cs` with `uk_clientes_nit` unique constraint — required before Story 2.3 integration tests can run
2. `ContactoConfiguration.cs` with `ON DELETE SET NULL` — required before Story 2.5 integration tests
3. Playwright E2E framework initialized (from Epic 1 or testarch-framework workflow) — required before P0 E2E tests
4. `clienteFactory` faker-based test factory — required before any component or integration test using client data

### Risks to Plan

- **Risk**: Epic 1 backend (database migration + EF Core setup) has defects that carry forward to Epic 2 tests
  - **Impact**: Integration tests fail due to schema issues, not Epic 2 code
  - **Contingency**: Run Epic 1 integration tests first; verify DB schema before Epic 2 test execution

- **Risk**: `siesa-ui-kit` SortControl component API differs from assumed `SortControl` at `src/shared/components/SortControl`
  - **Impact**: Sort tests target wrong component or event model
  - **Contingency**: Read `SortControl` actual API from siesa-ui-kit catalog before writing sort tests; adjust event handlers accordingly

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before implementation begins (Story 2.1 first).
- Run `*automate` for broader coverage expansion after implementation of each story.
- Run `*trace` after all Epic 2 stories complete to verify traceability matrix and emit quality gate decision.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam Date: 2026-06-30
- [ ] Tech Lead: SiesaTeam Date: 2026-06-30
- [ ] QA Lead: SiesaTeam Date: 2026-06-30

**Comments:**

---

---

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories)
- `probability-impact.md` — Risk scoring: Probability × Impact matrix
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision
- `test-priorities-matrix.md` — P0-P3 automated priority calculation

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd/`
- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epic 1 Test Design: `_bmad-output/test-design-epic-1.md`

### API Endpoints Under Test (Epic 2)

```
GET    /api/v1/clientes              → List all clients (no search param — client-side filter)
POST   /api/v1/clientes              → Create client (201 + created object)
GET    /api/v1/clientes/{id}         → Get client by ID
PUT    /api/v1/clientes/{id}         → Update client (200 + updated object)
DELETE /api/v1/clientes/{id}         → Delete client (204 No Content)
```

### Test Tag Strategy

```
@smoke     — 3 tests, run always
@p0        — 10 tests, run on every commit
@p1        — 14 tests, run on PR to main
@p2        — 12 tests, run nightly
@p3        — 3 tests, run on-demand
@epic-2    — all 39 tests in this epic
@data      — tests touching DB integrity (R-001, R-002)
@perf      — tests measuring render/response time (R-003, NFR1, NFR2)
@security  — tests validating input sanitization (R-005, NFR5)
```

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
