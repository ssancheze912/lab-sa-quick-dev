# Test Design: Epic 2 - Client Management

**Date:** 2026-06-25
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic Source:** `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (Gestión de Clientes)

This epic delivers complete CRUD operations for the client catalog: list & search (Story 2.1), detail view with deep linking (Story 2.2), create (Story 2.3), edit (Story 2.4), delete with contact-orphan handling (Story 2.5), and client-side sort (Story 2.6). All data changes must reflect immediately in the UI (FR27/TanStack Query). Client-side filtering covers search (NFR1: <1s with 500 records) and sorting (no new API calls). Backend validation uses FluentValidation; frontend uses Zod. Error handling follows Problem Details RFC 7807 (NFR6).

**Risk Summary:**

- Total risks identified: 10
- High-priority risks (score >= 6): 4
- Critical categories: DATA, BUS, PERF, SEC

**Coverage Summary:**

- P0 scenarios: 9 (18 hours)
- P1 scenarios: 14 (14 hours)
- P2/P3 scenarios: 13 (6 hours)
- **Total effort:** 38 hours (~5 days)

---

## Risk Assessment

### High-Priority Risks (Score >= 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | DATA | Deleting a client with associated contacts silently orphans contacts or cascades a delete, causing unintended data loss or breaking the "Sin cliente" filter (FR25, AC-E2.5) | 3 | 3 | 9 | API integration test asserts DELETE 200, contacts remain with `clienteId = null`; E2E verifies orphaned contacts appear in "Sin cliente" filter; toast message validated | DEV/QA | Story 2.5 |
| R-002 | BUS | NIT/RUC duplicate accepted silently — same NIT/RUC registered twice corrupts the client catalog and violates business identity uniqueness | 2 | 3 | 6 | Backend enforces unique constraint on NIT/RUC; API test sends duplicate POST and asserts 409; E2E verifies error message "El NIT/RUC ya está registrado" appears (AC-E2.3, NFR6) | DEV | Story 2.3 |
| R-003 | PERF | Client-side search over 500 records exceeds 1-second threshold (NFR1), degrading UX when the list is fully populated | 2 | 3 | 6 | Performance test loads 500 seed records and measures filter render time; debounce (150ms) verified in component test; assert results in <1s | DEV/QA | Story 2.1 |
| R-004 | SEC | Backend accepts a client record with empty or whitespace-only required fields (Nombre, NIT/RUC, Teléfono, Ciudad) due to missing FluentValidation rules (NFR5, AC-E2.4) | 2 | 3 | 6 | API test sends POST/PUT with each required field empty individually; assert 400 + Problem Details body; Zod front-end validation tested at component level | DEV | Stories 2.3, 2.4 |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-005 | BUS | Client sort changes clear the active search filter, breaking combined search+sort UX (AC-E2.6) | 2 | 2 | 4 | Component test applies search filter then changes sort; asserts search input value and filtered result set are unchanged | DEV |
| R-006 | TECH | TanStack Query cache not invalidated after create/edit/delete, causing stale data in the client list (FR27, AC-E2.1, E2.3, E2.5) | 2 | 2 | 4 | Unit/integration test verifies `invalidateQueries(['clients'])` called after each mutation; E2E asserts new/updated/deleted client reflected immediately without page reload | DEV |
| R-007 | BUS | Deep-link to `/clientes/:clienteId` for a non-existent ID renders blank screen or throws unhandled error instead of graceful not-found view (AC — Story 2.2) | 2 | 2 | 4 | E2E navigates directly to `/clientes/00000000-0000-0000-0000-000000000000`; asserts not-found message rendered | QA |
| R-008 | DATA | Cancel during edit restores UI state correctly but form internal state is dirty — re-opening the edit form shows stale/dirty values instead of the current server data | 2 | 2 | 4 | Component test: open edit, mutate fields, click "Cancelar", re-open edit; assert all fields reset to original server values | DEV |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-009 | OPS | API error responses (5xx) from backend during client list load are swallowed silently — no ErrorPanel shown to user (AC — Story 2.1) | 1 | 2 | 2 | E2E mocks backend failure (MSW or Playwright route intercept); asserts ErrorPanel + "Reintentar" button visible | QA |
| R-010 | BUS | Default sort "Más reciente" not applied on initial page load — list appears in arbitrary insertion order (AC-E2.6 last criterion) | 1 | 1 | 1 | Component test verifies SortControl default state is `fecha-desc`; list order is newest-first on mount | DEV |

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

**Criteria:** Blocks core journey + High risk (>= 6) + No workaround

| Requirement | Acceptance Criterion | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ------------------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E2.1: Register client (Story 2.3) | Fill Nombre, NIT/RUC, Teléfono, Ciudad and submit → client appears in list immediately | E2E | R-006 | 1 | QA | Playwright: submit form, assert client in left panel list without reload |
| AC-E2.1: Register client (Story 2.3) | Submit with each required field empty → inline error; form NOT sent to backend | E2E | R-004 | 1 | QA | Playwright: submit empty, assert error messages per field; assert no POST request |
| AC-E2.2: Search (Story 2.1) | Search by name filters list in real time, results <1s with 500 records | E2E | R-003 | 1 | QA | Playwright: seed 500 clients via API, type in search, measure render time assertion |
| AC-E2.4: Validation — backend (Stories 2.3, 2.4) | POST with empty `nombre` → 400 + Problem Details; no client created | API | R-004 | 1 | DEV | xUnit: POST `{"nombre":"","nitRuc":"...","telefono":"...","ciudad":"..."}` → 400 |
| AC-E2.4: Validation — backend (Stories 2.3, 2.4) | PUT with empty `nitRuc` → 400 + Problem Details; no client updated | API | R-004 | 1 | DEV | xUnit: PUT with `nitRuc: ""` → 400 |
| AC-E2.3: NIT/RUC duplicate (Story 2.3) | Submit duplicate NIT/RUC → 409 + "El NIT/RUC ya está registrado" displayed (NFR6) | E2E | R-002 | 1 | QA | Playwright: create client, attempt second with same NIT/RUC, assert error message shown, no stack trace |
| AC-E2.5: Delete with contacts (Story 2.5) | Confirm delete of client with contacts → client removed; contacts remain with `clienteId = null`; toast shows correct message | E2E | R-001 | 1 | QA | Playwright: create client + contacts, delete client, assert contacts visible with no client in "Sin cliente" filter |
| AC-E2.5: Delete (Story 2.5) — API contract | DELETE `/api/clients/{id}` returns 200; associated contacts have `clienteId = null` | API | R-001 | 1 | DEV | xUnit: create client + contacts via EF, DELETE endpoint, query contacts assert `clienteId == null` |
| AC-E2.2: Search — no results (Story 2.1) | No clients → EmptyState component displayed at `/clientes` | E2E | R-006 | 1 | QA | Playwright: clean DB state, navigate to `/clientes`, assert EmptyState visible |

**Total P0:** 9 tests, 18 hours

---

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3–4) + Common workflows

| Requirement | Acceptance Criterion | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ------------------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E2.2: Search by NIT/RUC (Story 2.1) | Search by NIT/RUC filters list correctly | E2E | R-003 | 1 | QA | Playwright: type NIT/RUC in search, assert matching records shown |
| AC-E2.2: Client detail view (Story 2.2) | Clicking client in list shows detail: Nombre, NIT/RUC, Teléfono, Ciudad | E2E | — | 1 | QA | Playwright: click client item, assert all fields in right panel |
| AC-E2.2: Deep linking (Story 2.2) | Direct URL `/clientes/:clienteId` loads correct client details | E2E | R-007 | 1 | QA | Playwright: `page.goto('/clientes/<uuid>')`, assert client fields visible |
| AC-E2.2: Deep linking — invalid ID (Story 2.2) | `/clientes/<non-existent-id>` shows not-found message gracefully | E2E | R-007 | 1 | QA | Playwright: navigate to fake UUID, assert not-found element rendered |
| AC-E2.3: Edit client (Story 2.4) | Open edit form → pre-filled with current values; save → changes in list and detail immediately | E2E | R-006 | 1 | QA | Playwright: edit client name, save, assert updated name in list + detail panel |
| AC-E2.3: Edit validation (Story 2.4) | Clear required field in edit form and submit → inline error; no PUT sent | E2E | R-004 | 1 | QA | Playwright: clear Teléfono, submit, assert inline error, assert no PUT request |
| AC-E2.3: Cancel edit (Story 2.4) | Click "Cancelar" → form closes, original data unchanged | Component | R-008 | 1 | DEV | Vitest + RTL: render EditClientForm, mutate fields, click cancel, assert component unmounted or fields reset |
| AC-E2.5: Delete — confirm dialog (Story 2.5) | Click "Eliminar" → confirmation dialog with "Confirmar" and "Cancelar" | Component | — | 1 | DEV | Vitest + RTL: assert dialog visible, assert buttons present |
| AC-E2.5: Delete — cancel dialog (Story 2.5) | Click "Cancelar" in dialog → client remains in system | E2E | — | 1 | QA | Playwright: open delete dialog, click cancel, assert client still in list |
| AC-E2.6: Sort A→Z (Story 2.6) | Select "Nombre A→Z" → list ordered alphabetically ascending, no new API call | Component | R-005 | 1 | DEV | Vitest + RTL: render with 3 clients, select `nombre-asc`, assert rendered order; spy on queryClient — no fetch triggered |
| AC-E2.6: Sort Z→A (Story 2.6) | Select "Nombre Z→A" → list ordered alphabetically descending | Component | R-005 | 1 | DEV | Vitest + RTL: select `nombre-desc`, assert order reversed |
| AC-E2.6: Sort newest/oldest (Story 2.6) | "Más reciente" orders by `createdAt` desc; "Más antiguo" by `createdAt` asc | Component | — | 1 | DEV | Vitest + RTL: two tests, one per sort option; assert ordering by mocked `createdAt` dates |
| AC-E2.6: Sort preserves search filter (Story 2.6) | Change sort while search active → filtered set preserved, search input value unchanged | Component | R-005 | 1 | DEV | Vitest + RTL: set search to "ACME", select `nombre-asc`, assert search input still "ACME" and only matching items shown |
| AC-E2.6: Default sort (Story 2.6) | SortControl default on mount is "Más reciente" (`fecha-desc`) | Component | R-010 | 1 | DEV | Vitest + RTL: render SortControl, assert selected value is `fecha-desc` |

**Total P1:** 14 tests, 14 hours

---

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (1–2) + Edge cases

| Requirement | Acceptance Criterion | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ------------------- | ---------- | --------- | ---------- | ----- | ----- |
| Story 2.1: Backend unavailable at load | `fetch` fails on page load → ErrorPanel + "Reintentar" button shown | E2E | R-009 | 1 | QA | Playwright: intercept GET `/api/clients` → 500; assert ErrorPanel rendered |
| Story 2.1: Empty state message | EmptyState guides user to create first client (text/CTA present) | Component | — | 1 | DEV | Vitest + RTL: render ClientList with empty array; assert EmptyState text + button |
| Story 2.3: Create toast (Story 2.3) | Successful create → toast "Cliente creado correctamente" | Component | — | 1 | DEV | Vitest + RTL: mock successful mutation, assert toast displayed |
| Story 2.4: Update toast (Story 2.4) | Successful edit → toast "Cliente actualizado correctamente" | Component | — | 1 | DEV | Vitest + RTL: mock successful mutation, assert toast displayed |
| Story 2.5: Delete toast — no contacts (Story 2.5) | Delete client with no contacts → toast "Cliente eliminado correctamente" | Component | — | 1 | DEV | Vitest + RTL: mock delete response, no contacts, assert standard toast |
| Story 2.5: Delete toast — with contacts (Story 2.5) | Delete client with contacts → toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." | Component | R-001 | 1 | DEV | Vitest + RTL: mock delete response indicating orphaned contacts, assert extended toast |
| Story 2.4: Re-open edit form clean (Story 2.4) | After cancel, re-open edit → form fields match current server data | Component | R-008 | 1 | DEV | Vitest + RTL: open, mutate, cancel, re-open, assert original values |
| AC-E2.5: Right panel reset after delete | After confirmed delete, right panel returns to empty/default state | E2E | — | 1 | QA | Playwright: delete client, assert detail panel is empty/placeholder state |
| Story 2.1: URL updates on client select (Story 2.2) | Clicking client updates URL to `/clientes/:clienteId` (FR30) | E2E | — | 1 | QA | Playwright: click client, assert `page.url()` includes client UUID |

**Total P2:** 9 tests, 4.5 hours

---

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Lower-impact edge cases

| Requirement | Test Level | Test Count | Owner | Notes |
| ----------- | ---------- | ---------- | ----- | ----- |
| Zod validation schema — all fields required | Unit | 1 | DEV | Vitest: import Zod schema, parse objects missing each field, assert ZodError with correct path |
| NIT/RUC unique constraint at DB level | Unit/Integration | 1 | DEV | xUnit: attempt to insert duplicate via EF; assert `DbUpdateException` or unique violation |
| Search debounce 150ms applied | Component | 1 | DEV | Vitest + fake timers: assert filter not triggered before 150ms, triggered after |
| Client list scrollable with 500+ items (accessibility) | E2E | 1 | QA | Playwright: seed 500 clients, scroll left panel to bottom; assert last item reachable |

**Total P3:** 4 tests, 1.5 hours

---

## Execution Order

### Smoke Tests (< 5 min)

**Purpose:** Confirm the client module loads and the API endpoint is reachable

- [ ] GET `/api/clients` returns 200 with JSON array (30s)
- [ ] Navigate to `/clientes` — client list panel renders without crash (45s)
- [ ] Navigate to `/clientes` with empty DB — EmptyState visible (30s)

**Total:** 3 scenarios

---

### P0 Tests (< 10 min)

**Purpose:** Critical path validation — must pass on every commit

- [ ] Create client with all required fields → appears in list immediately (E2E)
- [ ] Submit empty form → inline errors, no API call (E2E)
- [ ] Search by name — results in <1s with 500 records (E2E)
- [ ] POST with empty `nombre` field → 400 + Problem Details (API)
- [ ] PUT with empty `nitRuc` field → 400 + Problem Details (API)
- [ ] Create duplicate NIT/RUC → 409 + user-friendly error, no stack trace (E2E)
- [ ] Delete client with contacts → contacts orphaned with `clienteId = null` (E2E)
- [ ] DELETE API → contacts remain with `clienteId = null` (API)
- [ ] No clients in DB → EmptyState shown at `/clientes` (E2E)

**Total:** 9 scenarios

---

### P1 Tests (< 30 min)

**Purpose:** Important feature and integration coverage — run on PR to main

- [ ] Search by NIT/RUC filters correctly (E2E)
- [ ] Click client → full detail panel with all fields (E2E)
- [ ] Direct URL `/clientes/:clienteId` loads correct details (E2E)
- [ ] Direct URL with invalid clienteId → not-found message (E2E)
- [ ] Edit client → pre-filled form; save → updated in list and detail (E2E)
- [ ] Clear required field in edit, submit → inline error, no PUT (E2E)
- [ ] Cancel edit → form closes, original data unchanged (Component)
- [ ] Click "Eliminar" → confirmation dialog visible (Component)
- [ ] Cancel delete dialog → client still in list (E2E)
- [ ] Sort "Nombre A→Z" → ordered correctly, no API call (Component)
- [ ] Sort "Nombre Z→A" → ordered correctly (Component)
- [ ] Sort "Más reciente" and "Más antiguo" by createdAt (Component)
- [ ] Sort with active search → search filter preserved (Component)
- [ ] SortControl default on mount is `fecha-desc` (Component)

**Total:** 14 scenarios

---

### P2/P3 Tests (< 60 min)

**Purpose:** Full regression coverage, edge cases, compliance

- [ ] Backend 500 → ErrorPanel + "Reintentar" button (E2E)
- [ ] EmptyState text and CTA present (Component)
- [ ] Create toast message (Component)
- [ ] Edit toast message (Component)
- [ ] Delete toast — no contacts (Component)
- [ ] Delete toast — with contacts (Component)
- [ ] Re-open edit after cancel → original values (Component)
- [ ] Delete → right panel returns to default state (E2E)
- [ ] Click client → URL updates to `/clientes/:clienteId` (E2E)
- [ ] Zod schema validates all required fields (Unit)
- [ ] DB unique constraint on NIT/RUC (Unit/Integration)
- [ ] Search debounce 150ms (Component)
- [ ] 500 clients scrollable — last item reachable (E2E)

**Total:** 13 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| -------- | ----- | ---------- | ----------- | ----- |
| P0 | 9 | 2.0 | 18.0 | API seed, Playwright setup, 500-record perf test |
| P1 | 14 | 1.0 | 14.0 | Standard coverage |
| P2 | 9 | 0.5 | 4.5 | Simple scenarios |
| P3 | 4 | 0.375 | 1.5 | Exploratory / compliance |
| **Total** | **36** | **—** | **38.0** | **~5 days** |

### Prerequisites

**Test Data:**

- `ClientFactory` — faker-based factory generating `{ nombre, nitRuc, telefono, ciudad }` with uniqueness guarantee for NIT/RUC; auto-cleanup after test
- `ClientWithContactsFactory` — creates a client + N contacts linked via `clienteId`; used for delete-with-contacts scenarios
- Seed script to insert 500 clients for NFR1 performance test (can be a Playwright global setup fixture)

**Tooling:**

- Playwright (latest) for E2E tests — already initialized from Epic 1 framework workflow
- Vitest + @testing-library/react for component and unit tests
- xUnit + EF Core InMemory / test PostgreSQL for API integration tests
- MSW or Playwright `page.route()` for network interception (ErrorPanel test, CORS check)
- `@faker-js/faker` for test data generation

**Environment:**

- PostgreSQL 18+ instance with clean-state reset between test runs (transaction rollback or truncate)
- Backend API running (port 5000) for E2E and API integration tests
- Frontend dev server (port 5173) for E2E tests
- CI: PostgreSQL service container (`services: postgres:`) same as Epic 1

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions — all 9 critical path tests must pass before any story merges to main)
- **P1 pass rate:** >= 95% (at most 1 failure with documented waiver)
- **P2/P3 pass rate:** >= 90% (informational)
- **High-risk mitigations (R-001 through R-004):** 100% complete or approved waivers at epic close

### Coverage Targets

- **Critical paths (create, search, delete with contacts):** >= 80%
- **Security / validation scenarios (NFR5, NFR6):** 100%
- **Business logic (sort, search, cache invalidation):** >= 70%
- **Edge cases (cancel, not-found, 500 error):** >= 50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass before merging any story to main
- [ ] R-001 (delete + orphan contacts) — API contract test passes 100%
- [ ] R-002 (NIT/RUC duplicate) — 409 with user-friendly message, no stack trace exposed (NFR6)
- [ ] R-003 (search <1s) — measured with 500 records in CI environment
- [ ] R-004 (input validation) — 400 responses for each empty required field verified independently

---

## Mitigation Plans

### R-001: Client delete silently orphans or cascades contacts (Score: 9)

**Mitigation Strategy:** Backend DELETE endpoint must set `clienteId = null` on all associated contacts (no cascade delete). EF Core relationship configured as optional 1:N with `DeleteBehavior.SetNull`. API integration test (xUnit) verifies contacts still exist with `clienteId == null` after DELETE. E2E test verifies orphaned contacts appear in "Sin cliente" filter and toast message matches spec.
**Owner:** DEV
**Timeline:** Story 2.5 implementation
**Status:** Planned
**Verification:** P0 API test + P0 E2E test both pass; contacts visible in "Sin cliente" filter after delete

---

### R-002: Duplicate NIT/RUC accepted silently (Score: 6)

**Mitigation Strategy:** Add unique index on `NIT_RUC` column in EF Core `OnModelCreating`. Backend returns 409 with Problem Details body `{ "title": "Conflict", "detail": "El NIT/RUC ya está registrado" }` — no internal exception details. Frontend displays the `detail` field as an inline or toast error. E2E test confirms no stack trace in the response.
**Owner:** DEV
**Timeline:** Story 2.3 implementation
**Status:** Planned
**Verification:** P0 duplicate NIT/RUC E2E test passes; API returns 409 with correct `detail`; no `stackTrace` field in response body

---

### R-003: Search performance >1s with 500 records (Score: 6)

**Mitigation Strategy:** Client-side filtering applied over TanStack Query cache with debounce (150ms). Playwright test seeds exactly 500 clients via API setup and measures elapsed time from keypress to DOM update using `performance.now()` or Playwright's performance API. If threshold approaches 1s, introduce `useMemo` over the client array. Target: <500ms to leave headroom.
**Owner:** DEV/QA
**Timeline:** Story 2.1 implementation
**Status:** Planned
**Verification:** P0 search performance E2E test asserts filter completes in <1000ms with 500 records in CI

---

### R-004: Backend accepts empty required fields (Score: 6)

**Mitigation Strategy:** FluentValidation `AbstractValidator<CreateClientDto>` with `.NotEmpty()` on all four fields (Nombre, NIT/RUC, Teléfono, Ciudad). Same validator reused for `UpdateClientDto`. Each field tested independently in API tests. Frontend Zod schema mirrors these constraints. Global exception middleware converts `ValidationException` to 400 + Problem Details without exposing stack trace (NFR6).
**Owner:** DEV
**Timeline:** Stories 2.3 and 2.4 implementation
**Status:** Planned
**Verification:** API tests send 4 separate POST requests (one per empty field) + 4 PUT requests; all return 400 with correct Problem Details

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 infrastructure is fully implemented: frontend Vite dev server, .NET backend, PostgreSQL DB with EF Core migrations applied, Playwright framework initialized.
2. `siesa-ui-kit` provides `SortControl` component and `EmptyState` and `ErrorPanel` components as referenced in UX spec and epic ACs; if not available, shadcn/ui fallback components are used.
3. No authentication is required — all `/api/clients` endpoints are publicly accessible (consistent with PRD: no auth in MVP).
4. TanStack Query `invalidateQueries(['clients'])` is the agreed mechanism for cache refresh after mutations (FR27); no WebSockets or polling.
5. The "Sin cliente" filter for contacts is available via a separate query/filter in the contacts section (Epic 3/4 dependency) — the Epic 2 deletion test only verifies `clienteId = null` at the API level and at the contacts list level if that feature is accessible by Story 2.5.
6. Client-side search and sort operate over the full in-memory TanStack Query cache (all clients loaded at once) — valid for MVP scale of ≤500 records.

### Dependencies

1. Playwright framework initialized (from Epic 1 `testarch-framework` workflow) — required before any P0 E2E test can run
2. `ClientFactory` and `ClientWithContactsFactory` test data helpers — must be created before Story 2.3 and 2.5 tests respectively
3. PostgreSQL 18+ CI service container — required before API integration tests for delete+orphan and unique constraint scenarios
4. Epic 1 stories 1.1–1.3 complete — backend API and DB foundation must be operational

### Risks to Plan

- **Risk:** 500-record seed is slow in CI, making the NFR1 performance test (P0) exceed the CI time budget
  - **Impact:** P0 suite exceeds 10-minute target; R-003 test may be demoted to P1 in CI
  - **Contingency:** Run seed as a global Playwright setup fixture (one-time per CI run, not per test); use transaction isolation to avoid teardown cost

- **Risk:** "Sin cliente" contacts filter (FR25) belongs to a later epic and may not be testable within Epic 2
  - **Impact:** E2E portion of R-001 test cannot verify the filter UI; only API-level assertion available in Epic 2
  - **Contingency:** R-001 E2E test verifies `clienteId = null` via a direct API GET on contacts after delete; the filter UI test is deferred to Epic 4 traceability

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before Story 2.3/2.5 implementation begins (highest risk).
- Run `*automate` for broader coverage after all 6 stories are implemented.
- Run `*nfr` to formally validate NFR1 (search <1s) and NFR2 (CRUD <2s) once Epic 2 entities exist in production-like data volume.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam  Date: ___________
- [ ] Tech Lead: SiesaTeam  Date: ___________
- [ ] QA Lead: SiesaTeam  Date: ___________

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories)
- `probability-impact.md` — Risk scoring methodology (P x I matrix)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision framework
- `test-priorities-matrix.md` — P0–P3 automated priority calculation

### Related Documents

- PRD Feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic 1 Test Design (reference): `_bmad-output/test-design-epic-1.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Epic:** 2 — Client Management (Gestión de Clientes)
