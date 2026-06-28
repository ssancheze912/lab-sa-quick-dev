---
epic: 3
title: "Contact Management"
mode: epic-level
phase: 4
createdAt: "2026-06-28"
stories:
  - "3.1 — Contact List & Search"
  - "3.2 — Contact Detail View"
  - "3.3 — Create Contact"
  - "3.4 — Edit Contact"
  - "3.5 — Delete Contact"
status: draft
---

# Test Design — Epic 3: Contact Management

**Date:** 2026-06-28
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 3 — Contact Management

**Risk Summary:**

- Total risks identified: 10
- High-priority risks (≥6): 3
- Critical categories: DATA, BUS, PERF

**Coverage Summary:**

- P0 scenarios: 7 (14 hours)
- P1 scenarios: 19 (19 hours)
- P2 scenarios: 15 (7.5 hours)
- P3 scenarios: 4 (1 hour)
- **Total effort**: ~42 hours (~5.5 developer-days)

---

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 3 delivers the complete standalone contact management feature: a list view at `/contactos` showing all contacts (Nombre, Cargo, Email), real-time client-side search by Nombre or Email, a detail view at `/contactos/:contactoId` showing all four fields, and full CRUD (create, edit, delete) with required-field validation (Zod + FluentValidation), success toasts, and immediate list updates (FR27) via TanStack Query `invalidateQueries`. Contacts at this stage are independent of any client association — `clienteId` is nullable and remains null until Epic 4 wire-up. The epic covers FR9–FR16 and AC-E3.1–AC-E3.5.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 3.1 | Contact List & Search | List rendering (Nombre, Cargo, Email per item), real-time filter (≤1,000 records), EmptyState, ErrorPanel + retry |
| 3.2 | Contact Detail View | Detail panel (Nombre, Cargo, Teléfono, Email), URL deep linking `/contactos/:contactoId`, unknown ID graceful handling |
| 3.3 | Create Contact | Form validation (Zod + FluentValidation) for 4 required fields, success toast, immediate list update |
| 3.4 | Edit Contact | Pre-fill all fields, optimistic update, cancel without mutation, required-field validation on edit |
| 3.5 | Delete Contact | Confirmation dialog, contact removed from list, navigation back to list, success toast |

### Out of Scope for This Epic

- Client–Contact association UI (Epic 4)
- `clienteId` field on contacts (Epic 4 concern)
- Authentication / authorization (deferred MVP)
- Server-side pagination (NFR11 deferred)
- Performance testing at scale > 1,000 records (MVP NFR10 limit)

---

## 2. Risk Assessment

### Risk Matrix

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Email uniqueness not enforced — multiple contacts with the same email can be created silently, causing confusion in Epic 4 association | 2 | 3 | 6 | Verify PRD: email is NOT a unique key per spec (contacts can share emails); if uniqueness is desired add DB unique index; test current behavior explicitly | DEV | Before Story 3.3 |
| R-002 | BUS | TanStack Query `invalidateQueries(['contactos'])` missing in mutation `onSuccess` — list does not refresh after create/edit/delete, breaking FR27 | 2 | 3 | 6 | API integration test: mutate then GET `/api/v1/contactos` and assert new state; Component test: assert list re-renders after mutation via MSW | DEV | Before Stories 3.3–3.5 |
| R-003 | PERF | Client-side search filter over 1,000 contacts (NFR1 updated for contacts) — results must appear in < 1s. Missing debounce or synchronous filter blocks render thread | 2 | 3 | 6 | Component test with 1,000 mock records: type in search field, measure filter execution ≤150ms via performance.now(); E2E smoke asserts results visible within 1s | DEV | Story 3.1 |
| R-004 | BUS | Form validation (Zod/FluentValidation) divergence — frontend allows submit but backend rejects, causing raw 400 error shown to user (NFR6 violation) | 2 | 2 | 4 | Component test: submit empty ContactoForm, assert 4 inline error messages, assert POST never called (MSW); API test: send invalid payload, assert Problem Details 400 shape | DEV/QA | Before Story 3.3 |
| R-005 | BUS | Error state on list load — backend unavailable causes blank screen or infinite spinner instead of ErrorPanel + "Reintentar" button (AC-E3.1 regression) | 2 | 2 | 4 | Component test (MSW 500): assert ErrorPanel renders; click "Reintentar", assert new fetch triggered | DEV | Story 3.1 |
| R-006 | BUS | Deep-link to `/contactos/:contactoId` with non-existent ID shows blank or crash instead of graceful not-found message (AC-3.2 regression vs Epic 2 pattern) | 1 | 2 | 2 | E2E test: navigate to `/contactos/00000000-0000-0000-0000-000000000000`, assert not-found message | QA | Story 3.2 |
| R-007 | BUS | Edit form does not pre-fill all four fields — one field left blank by implementation error causes data loss on save | 2 | 2 | 4 | Component test: load edit form with fixture contact, assert each input value matches fixture (Nombre, Cargo, Teléfono, Email) | DEV | Story 3.4 |
| R-008 | BUS | Cancel button on Edit form mutates TanStack Query cache — original data lost, user sees stale values in detail view after cancel | 1 | 2 | 2 | Component test: open edit form, modify Nombre, click Cancel, reopen detail view, assert original Nombre still shown | DEV | Story 3.4 |
| R-009 | BUS | Delete confirmation dialog absent or non-functional — contact deleted immediately on click without confirmation, violating AC-3.5 | 1 | 2 | 2 | Component test: click "Eliminar", assert dialog shows "¿Eliminar este contacto?", assert DELETE not called until "Confirmar" clicked; assert cancel leaves record intact | DEV | Story 3.5 |
| R-010 | OPS | Toast messages missing, wrong language, or wrong copy — violates company standard and breaks AC acceptance criteria | 1 | 1 | 1 | Component/E2E test: assert exact Spanish strings: "Contacto creado correctamente", "Contacto actualizado correctamente", "Contacto eliminado correctamente" | QA | Stories 3.3–3.5 |

### High-Priority Risks (Score ≥ 6)

| Risk ID | Category | Description | Score |
|---------|----------|-------------|-------|
| R-001 | DATA | Email uniqueness behavior undefined — potential duplicate emails silently accepted | 6 |
| R-002 | BUS | TanStack Query cache not invalidated after mutations — FR27 broken, list stale | 6 |
| R-003 | PERF | Client-side search over 1,000 records — response time SLA at risk without debounce | 6 |

### Top 3 Risk Areas for Epic 3

1. **Mutation state synchronization** (R-002) — TanStack Query invalidation pattern must be confirmed on every mutation hook (`useCreateContacto`, `useUpdateContacto`, `useDeleteContacto`). This is the same pattern as Epic 2 and must not be regressed.
2. **Search performance at 1,000 records** (R-003) — Epic 3 doubles the search dataset vs Epic 2 (1,000 contacts vs 500 clients per NFR10). Debounce strategy and filter algorithm must be validated at this scale.
3. **Email uniqueness policy** (R-001) — PRD does not explicitly state email must be unique across contacts, but Epic 4 association relies on correct contact identification. The behavior must be explicitly tested and documented regardless of outcome.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 3 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌          5 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌  15 tests
  Component (Vitest+RTL+MSW) ▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 18 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌▌▌▌        7 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                        45 tests
```

### Rationale

- **Epic 3 mirrors Epic 2's domain pattern**: CRUD + search on a single entity. The same test level distribution applies (component-heavy + API integration-heavy, selective E2E for full user journeys).
- **E2E is selective**: reserved for full create-to-list, edit round-trip, and delete-with-navigation journeys that cannot be asserted at component level.
- **No duplication rule applied**: validation logic tested at Unit + API level only; E2E does not repeat what component tests already cover; search performance tested at component level (not E2E).
- **1,000 record search** (R-003): tested at component level with generated mock data, not E2E, to avoid environment variability.

### Test Level Assignments

| Test Level | Scope | Tools |
|------------|-------|-------|
| Unit | Zod schema validation (contactoSchema), FluentValidator rules (CreateContactoRequestValidator) | Vitest, xUnit |
| Component | ContactoListView filter/empty/error states, ContactoForm render/submit/cancel/pre-fill, confirmation dialog | Vitest + React Testing Library + MSW |
| API Integration | All 5 REST endpoints — happy path + error scenarios | xUnit + WebApplicationFactory + Testcontainers (PostgreSQL) |
| E2E | Full user journeys: list renders, create contact appears in list, edit round-trip, delete + navigation back, deep link | Playwright |

---

## 4. Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria**: Blocks core user journey + High risk (≥6) + No workaround

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-E3.1: List renders contacts | GET `/api/v1/contactos` returns array with Nombre, Cargo, Email fields | API | R-002 | 1 | DEV |
| AC-E3.1: Create contact, appears in list | POST `/api/v1/contactos` → 201 + body; re-GET returns new record | API | R-002 | 2 | DEV |
| R-002: Mutation invalidates query | E2E: create contact, assert Nombre appears in list without page reload | E2E | R-002 | 1 | QA |
| R-003: Search perf at 1,000 records | Component: render ContactoListView with 1,000 MSW records, type in search, measure filter execution ≤150ms | Component | R-003 | 1 | DEV |
| AC-E3.4: Required fields block submit | Component: submit empty ContactoForm, assert 4 inline error messages, assert POST never called (MSW) | Component | R-004 | 1 | DEV |
| AC-E3.5: Delete contact removes from list | E2E: delete contact, confirm dialog, assert item removed from list, view navigates to `/contactos` | E2E | R-002 | 1 | QA |

**Total P0**: 7 tests, ~14 hours

### P1 (High) — Run on PR to main

**Criteria**: Important features + Medium risk (3–4) + Common workflows

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-E3.3: Edit contact, changes persist | PUT `/api/v1/contactos/:id` → 200 + updated body | API | R-002 | 1 | DEV |
| AC-E3.4: Edit pre-fills all four fields | Component: open edit form, assert Nombre, Cargo, Teléfono, Email inputs match fixture data | Component | R-007 | 1 | DEV |
| AC-E3.4: Cancel edit restores data | Component: modify Nombre field, click Cancel, assert original value shown in detail | Component | R-008 | 1 | DEV |
| AC-E3.4: Required field cleared on edit → error | Component: clear Nombre in edit form, submit, assert inline error, assert PUT not called | Component | R-004 | 1 | DEV |
| AC-E3.2: Detail view shows all fields | GET `/api/v1/contactos/:id` returns Nombre, Cargo, Teléfono, Email | API | — | 1 | DEV |
| AC-E3.2: Deep link loads contact detail | E2E: navigate to `/contactos/:id`, assert all four fields displayed correctly | E2E | R-006 | 1 | QA |
| AC-E3.1: Search filters by Nombre in real time | Component: render 10 contacts, type partial Nombre in search field, assert only matching items shown | Component | R-003 | 1 | DEV |
| AC-E3.1: Search filters by Email in real time | Component: render 10 contacts, type partial Email in search field, assert only matching items shown | Component | R-003 | 1 | DEV |
| AC-E3.1: EmptyState shown when no contacts | Component: render with empty data, assert EmptyState visible, no list items | Component | — | 1 | DEV |
| AC-E3.1: ErrorPanel shown on fetch failure | Component (MSW 500): load ContactoListView, assert ErrorPanel + "Reintentar" button visible | Component | R-005 | 1 | DEV |
| AC-E3.1: Retry after error re-fetches | Component: click "Reintentar", assert new GET `/api/v1/contactos` issued via MSW handler | Component | R-005 | 1 | DEV |
| AC-E3.5: Delete cancel leaves record | Component: open confirm dialog, click "Cancelar", assert DELETE not called, record still in list | Component | R-009 | 1 | DEV |
| AC-E3.5: Confirmation dialog copy | Component: click "Eliminar", assert dialog shows "¿Eliminar este contacto?" with "Confirmar" and "Cancelar" | Component | R-009 | 1 | DEV |
| API: GET non-existent contacto | GET `/api/v1/contactos/unknown-uuid` → 404 + Problem Details | API | — | 1 | DEV |
| API: DELETE non-existent contacto | DELETE `/api/v1/contactos/unknown-uuid` → 404 + Problem Details | API | — | 1 | DEV |
| API: Create with missing fields | POST with empty body → 400 + Problem Details with `errors` object | API | R-004 | 1 | DEV |
| API: Update with missing required field | PUT with Nombre=null → 400 + Problem Details | API | R-004 | 1 | DEV |
| R-001: Email uniqueness behavior | POST two contacts with identical Email → document actual behavior (201 both, or 409 second); assert consistent with PRD decision | API | R-001 | 1 | DEV |
| AC-E3.3: Create contact with valid payload — E2E | E2E: fill form (Nombre, Cargo, Teléfono, Email), submit, assert success toast, assert contact in list | E2E | R-002 | 1 | QA |

**Total P1**: 19 tests, ~19 hours

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary features + Low risk (1–2) + Edge cases

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-3.2: Unknown contactoId in URL | Component: load ContactoDetailView with non-existent ID (MSW 404), assert not-found message | Component | R-006 | 1 | DEV |
| Success toasts — correct Spanish text (create) | Component: create → assert toast "Contacto creado correctamente" | Component | R-010 | 1 | QA |
| Success toasts — correct Spanish text (edit) | Component: edit → assert toast "Contacto actualizado correctamente" | Component | R-010 | 1 | QA |
| Success toasts — correct Spanish text (delete) | Component: delete → assert toast "Contacto eliminado correctamente" | Component | R-010 | 1 | QA |
| Zod schema — contactoSchema | Unit: schema rejects empty Nombre, empty Cargo, empty Teléfono, empty Email; accepts valid data | Unit | R-004 | 4 | DEV |
| FluentValidation — backend validator | Unit: CreateContactoRequestValidator rejects null Nombre, null Cargo, null Telefono, null Email individually | Unit | R-004 | 4 | DEV |
| URL updates to `/contactos/:contactoId` on click | Component: click contact item in list, assert router `navigate` called with correct contactoId (React Router spy or TanStack Router test util) | Component | — | 1 | DEV |
| API: contactos table schema | Integration: assert `contactos` table exists with `cliente_id` column nullable (FK to clientes.id) | API | — | 1 | DEV |
| Search: no results state | Component: type search string matching no contacts, assert empty results area (no EmptyState component — just no items) | Component | — | 1 | DEV |
| NFR2: CRUD reflects changes in < 2s | Component timing: submit create form, measure until list re-render ≤ 2s (MSW delay simulation) | Component | — | 1 | DEV |

**Total P2**: 16 tests, ~8 hours

### P3 (Low) — Run on-demand

**Criteria**: Nice-to-have + Exploratory + Edge cases

| Requirement | Test Scenario | Test Level | Count | Owner |
|-------------|---------------|------------|-------|-------|
| Problem Details shape (no stackTrace) | API: assert all error responses contain `type`, `title`, `status`, `detail` keys and NO `stackTrace` key (NFR6) | API | 1 | DEV |
| Very long Nombre (255 chars) | API: POST with 255-char Nombre → 201; POST with 256-char Nombre → 400 | API | 2 | DEV |
| Responsive layout — contacts list | E2E (mobile 375px viewport): navigate to `/contactos`, assert list renders without horizontal overflow | E2E | 1 | QA |

**Total P3**: 4 tests, ~1 hour

---

## 5. Execution Order

### Smoke Tests (<5 min)

Purpose: Fast feedback, catch build-breaking issues before full suite

- [ ] GET `/api/v1/contactos` returns 200 and JSON array (API) — 10s
- [ ] POST `/api/v1/contactos` with valid payload returns 201 (API) — 15s
- [ ] Navigate to `/contactos` — list renders without crash (E2E) — 30s

**Total smoke**: 3 scenarios, ~1 min

### P0 Tests (<10 min)

Purpose: Critical path validation — must all pass before any PR merge

- [ ] GET `/api/v1/contactos` returns array with correct fields (API)
- [ ] POST `/api/v1/contactos` → 201 + body; re-GET confirms record (API, 2 assertions)
- [ ] E2E: create contact, assert Nombre appears in list without reload (E2E)
- [ ] Component: 1,000 records search ≤ 150ms (Component)
- [ ] Component: submit empty form → 4 inline errors, no API call (Component)
- [ ] E2E: delete contact, confirm dialog, assert removed from list + navigation (E2E)

**Total P0**: 7 scenarios, ~8 min

### P1 Tests (<30 min)

Purpose: Important feature coverage

- [ ] PUT `/api/v1/contactos/:id` → 200 + updated body (API)
- [ ] Component: edit form pre-fills all four fields
- [ ] Component: cancel edit restores original values
- [ ] Component: clear required field on edit → inline error, no PUT
- [ ] GET `/api/v1/contactos/:id` returns all fields (API)
- [ ] E2E: deep link to `/contactos/:id` loads detail panel
- [ ] Component: search by Nombre filters list in real time
- [ ] Component: search by Email filters list in real time
- [ ] Component: empty data shows EmptyState
- [ ] Component: MSW 500 shows ErrorPanel + "Reintentar"
- [ ] Component: click "Reintentar" triggers new GET
- [ ] Component: confirm dialog cancel — DELETE not called
- [ ] Component: confirm dialog copy "¿Eliminar este contacto?" + button labels
- [ ] API: GET unknown ID → 404 Problem Details
- [ ] API: DELETE unknown ID → 404 Problem Details
- [ ] API: POST empty body → 400 Problem Details with errors
- [ ] API: PUT Nombre=null → 400 Problem Details
- [ ] API: POST two contacts same Email → assert documented behavior (1 assertion)
- [ ] E2E: full create journey — fill form, submit, toast, contact in list

**Total P1**: 19 scenarios, ~20 min

### P2/P3 Tests (<60 min)

Purpose: Full regression coverage

- [ ] Component: unknown contactoId URL → not-found message
- [ ] Component: toast text assertions (create / edit / delete — 3 tests)
- [ ] Unit: contactoSchema validates each required field (4 tests)
- [ ] Unit: FluentValidation rejects each missing required field (4 tests)
- [ ] Component: URL updates to `/contactos/:contactoId` on click
- [ ] API: contactos table schema with nullable cliente_id
- [ ] Component: search with no results (no items rendered)
- [ ] Component: CRUD timing ≤ 2s
- [ ] API: Problem Details shape (no stackTrace)
- [ ] API: 255/256-char Nombre boundary (2 tests)
- [ ] E2E: contacts list on mobile 375px viewport

**Total P2/P3**: 20 scenarios, ~30 min

---

## 6. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 7 | 2.0 | 14h | Includes DB setup (Testcontainers), E2E teardown, perf measurement setup |
| P1 | 19 | 1.0 | 19h | Standard MSW + RTL component tests, API integration tests |
| P2 | 16 | 0.5 | 8h | Simpler assertions, reuse existing fixtures |
| P3 | 4 | 0.25 | 1h | Exploratory, low setup cost |
| **Total** | **46** | — | **~42h** | **~5.5 developer-days** |

### Prerequisites

**Test Data:**

- `contactoFactory` — Faker-based builder for `CreateContactoRequest` (Nombre, Cargo, Telefono, Email); auto-cleanup after each xUnit test
- `contactoFixture` — Vitest fixture providing a list of 5–10 seeded contacts via MSW handlers
- `largeContactoList` — 1,000-item array for performance tests (generated, not persisted to DB)

**Tooling:**

- Vitest + React Testing Library + MSW 2.x (component tests — already installed in Epic 1)
- xUnit + `Microsoft.AspNetCore.Mvc.Testing` WebApplicationFactory (backend integration tests — Epic 1)
- Testcontainers for PostgreSQL (backend integration tests — confirms contactos table schema and FK behavior)
- Playwright (E2E — already configured in Epic 1)

**Environment:**

- Local PostgreSQL 18 instance (or Testcontainers ephemeral) for API integration tests
- MSW browser handler extended in `src/app/providers/` with contacto handlers for component tests
- Playwright base URL: `http://localhost:5173` with backend at `http://localhost:5000`

---

## 7. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — no exceptions; failing P0 blocks merge
- **P1 pass rate**: ≥95% — at most 1 failure allowed with approved waiver
- **P2/P3 pass rate**: ≥90% — informational; does not block release
- **High-risk mitigations**: R-001, R-002, R-003 must have passing tests before Story 3.5 is closed

### Coverage Targets

- **Critical paths** (CRUD + search): ≥80% line coverage on `contactos/` module
- **Validation logic** (Zod + FluentValidation): 100% branch coverage on contacto schemas and validators
- **API endpoints**: 100% of the 5 contacto endpoints covered by at least one happy-path + one error-path test

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] R-002: List updates after mutation without page reload (invalidateQueries confirmed for all 3 mutation hooks)
- [ ] R-003: Search over 1,000 records executes in ≤150ms at component level
- [ ] R-001: Email uniqueness behavior documented and explicitly tested (PRD alignment confirmed or NOTED as assumption)
- [ ] No stack traces exposed in any error response (NFR6)
- [ ] All toast and UI text in Spanish (company standard)

---

## 8. Mitigation Plans

### R-001: Email uniqueness behavior undefined (Score: 6)

**Mitigation Strategy:** Inspect PRD and architecture: `contactos` table spec does NOT declare a unique constraint on `email` (per architecture.md data model). Test confirms two contacts with identical emails can be created (201 both). Document this as a known behavior. If product decides uniqueness is required before Epic 4, add `uk_contactos_email` unique index and update this plan. Verification test asserts the 201+201 path explicitly so behavior regression is caught if a unique constraint is accidentally added later.
**Owner:** DEV
**Timeline:** Story 3.3 implementation
**Status:** Planned
**Verification:** API integration test — POST same email twice, assert both return 201 (or document 409 if constraint added)

### R-002: TanStack Query cache not invalidated (Score: 6)

**Mitigation Strategy:** Code review checklist item: every mutation hook (`useCreateContacto`, `useUpdateContacto`, `useDeleteContacto`) must call `queryClient.invalidateQueries({ queryKey: ['contactos'] })` in `onSuccess`. Replicate the same pattern established in Epic 2 for clientes. E2E test confirms list refreshes after create and delete without manual page reload.
**Owner:** DEV
**Timeline:** Stories 3.3–3.5 implementation
**Status:** Planned
**Verification:** E2E test — create contact, assert Nombre appears in list; delete contact, assert Nombre disappears from list

### R-003: Search performance at 1,000 records (Score: 6)

**Mitigation Strategy:** Confirm ContactoListView uses the same debounced client-side filter pattern from Epic 2 (ClienteListView). The filter must run against the TanStack Query in-memory cache (no new API call). Component test renders 1,000 MSW-backed contacts and measures filter execution time with `performance.now()` brackets — must be ≤150ms. If timing fails, profile and apply `useMemo` on the filter computation.
**Owner:** DEV
**Timeline:** Story 3.1 implementation
**Status:** Planned
**Verification:** Component test with 1,000 records: `performance.now()` delta ≤150ms confirmed in CI via vitest benchmark

---

## 9. Assumptions and Dependencies

### Assumptions

1. Epic 1 (Foundation) is complete: frontend dev server at `localhost:5173`, backend at `localhost:5000`, PostgreSQL connected, MSW and Playwright configured.
2. Epic 2 `clientes` table and EF Core migration already exist in the DB — no dependency needed from this epic for the `contactos.cliente_id` FK constraint (FK references `clientes.id`; if `clientes` table is absent the migration will fail).
3. No authentication is required in MVP — all API endpoints are unauthenticated (explicit PRD decision).
4. Client-side search operates on the in-memory TanStack Query cache — no new `/api/v1/contactos/search` endpoint introduced for Epic 3.
5. Email is NOT required to be unique across contacts per current architecture spec. If this assumption is invalidated by product, R-001 mitigation is updated accordingly.
6. `contactoFactory` and `contactoFixture` will be created in Story 3.1 and reused in all subsequent stories in this epic.

### Dependencies

1. `clientes` EF Core migration (Epic 2) — required for `contactos.cliente_id` FK reference; must exist before any `contactos` migration runs
2. MSW handler extension for contacto API routes — must be added to `src/app/providers/` in Story 3.1 and shared across Stories 3.2–3.5
3. `contactoFactory` test utility — created in Story 3.1; reused by all subsequent stories

### Risks to Plan

- **Risk**: Epic 2 DB migration not yet merged when Epic 3 backend work starts
  - **Impact**: `contactos` migration fails due to missing FK target table
  - **Contingency**: Epic 3 Stories 3.1–3.2 can proceed with frontend-only work; backend stories (3.3–3.5) must wait for Epic 2 migration to land in shared DB schema

---

## 10. Follow-on Workflows (Manual)

- Run `*atdd` per story (3.1–3.5) to generate failing P0 tests before implementation (TDD red phase).
- Run `*automate` after each story implementation to expand component/unit coverage.
- Run `*trace` at Epic 3 completion to validate FR9–FR16 + AC-E3.1–AC-E3.5 traceability.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam Date: ___
- [ ] Tech Lead: SiesaTeam Date: ___
- [ ] QA Lead: SiesaTeam Date: ___

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (TECH/SEC/PERF/DATA/BUS/OPS)
- `probability-impact.md` — Risk scoring methodology (P × I matrix)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision framework
- `test-priorities-matrix.md` — P0–P3 prioritization criteria

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md`
- PRD Feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-contactos.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 2 Test Design (reference format): `_bmad-output/implementation-artifacts/test-design-epic-2.md`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
