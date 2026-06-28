---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-28"
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

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers the complete client management feature: a split-panel view at `/clientes` with a scrollable 280px left panel listing all clients, real-time client-side search by Nombre or NIT/RUC, a right panel showing full client details, and full CRUD (create, edit, delete) with NIT uniqueness enforcement, required-field validation, and client-side sorting without additional API calls. Delete cascades to contacts via `ON DELETE SET NULL` at the database layer (contacts become unassigned). All changes are reflected immediately for all users (FR27) via TanStack Query `invalidateQueries`.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Left panel rendering, real-time filter (≤500 records), EmptyState, ErrorPanel + retry |
| 2.2 | Client Detail View | Right panel detail, URL deep linking, unknown clienteId handling |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), NIT uniqueness (409 conflict), success toast, immediate list update |
| 2.4 | Edit Client | Pre-fill, optimistic update, cancel without mutation, required-field validation on edit |
| 2.5 | Delete Client | Confirmation dialog, cascade to contacts (SET NULL), associated contacts toast variant |
| 2.6 | Sort Client List | Four sort options client-side, default "Más reciente", search + sort interaction, no extra API call |

### Out of Scope for This Epic

- Contact management (Epic 3)
- Client–Contact association UI (Epic 4)
- Authentication / authorization (deferred MVP)
- Server-side pagination (NFR11 deferred)
- Performance testing at scale > 500 records (MVP constraint)

---

## 2. Risk Assessment

### Risk Matrix

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | NIT uniqueness not enforced at DB level — concurrent inserts could create duplicates if only validated at application layer | 2 | 3 | 6 | Assert `uk_clientes_nit` unique index exists; integration test two concurrent POST requests with same NIT returns 409 | DEV | Before Story 2.3 |
| R-002 | BUS | TanStack Query `invalidateQueries(['clientes'])` missing in mutation `onSuccess` — list does not update after create/edit/delete, breaking FR27 | 2 | 3 | 6 | API integration test: mutate then fetch `/api/v1/clientes` and assert new state; component test: assert list re-renders after mutation | DEV | Before Stories 2.3–2.5 |
| R-003 | BUS | Delete cascade: contacts associated with the deleted client expected to become `clienteId = null` (SET NULL). If FK is DELETE CASCADE instead, contacts would also be deleted — silent data loss | 2 | 3 | 6 | Integration test: create client + 2 contacts, delete client, assert contacts still exist with `clienteId = null` | DEV | Before Story 2.5 |
| R-004 | BUS | Form validation (Zod/FluentValidation) divergence — frontend allows submit but backend rejects, or vice versa, causing confusing UX with backend 400 errors shown raw | 2 | 2 | 4 | Component test: submit empty form, assert inline error messages appear before API call (MSW: verify POST never fires); API test: send invalid payload, assert Problem Details 400 shape | DEV/QA | Before Story 2.3 |
| R-005 | PERF | Client-side search filter over 500 records with debounce — results must appear in < 1s (NFR1). Missing debounce or synchronous filter blocks the render thread | 2 | 2 | 4 | Component test with 500 mock records: type in search field, measure filter execution ≤ 150ms; E2E smoke test asserts results visible within 1s | DEV | Story 2.1 |
| R-006 | BUS | Sort + Search interaction: applying sort after a search filter clears the search input or triggers a new API call, violating AC-E2.6 | 2 | 2 | 4 | Component test: apply search filter "Acme", change sort order, assert search input still shows "Acme" and list contains only filtered + sorted results | DEV | Story 2.6 |
| R-007 | BUS | Error state (backend unavailable on load): `ErrorPanel` with "Reintentar" button does not appear — user sees blank or infinite spinner, breaking AC-E2.1 retry path | 2 | 2 | 4 | Component test (MSW 500 mock): assert ErrorPanel renders, click "Reintentar", assert new fetch is triggered | DEV | Story 2.1 |
| R-008 | BUS | Deep-link to `/clientes/:clienteId` with non-existent ID shows blank right panel or crashes instead of graceful not-found message (AC-2.2) | 1 | 2 | 2 | E2E test: navigate directly to `/clientes/00000000-0000-0000-0000-000000000000`, assert not-found message rendered | QA | Story 2.2 |
| R-009 | BUS | Cancel button on Edit form mutates state — some pre-fill component implementation resets original data in-flight, leaving stale cache | 1 | 2 | 2 | Component test: load edit form, change Nombre field, click Cancel, reopen detail view, assert original Nombre still shown | DEV | Story 2.4 |
| R-010 | OPS | Toast messages not displayed in Spanish or wrong text — violates company standard and breaks AC acceptance criteria checking toast content | 1 | 1 | 1 | Component/E2E test: assert exact Spanish toast strings: "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente" | QA | Stories 2.3–2.5 |

### High-Priority Risks (Score ≥ 6)

| Risk ID | Category | Description | Score |
|---------|----------|-------------|-------|
| R-001 | DATA | NIT unique constraint not enforced at DB level — concurrent duplicates possible | 6 |
| R-002 | BUS | TanStack Query cache not invalidated after mutations — FR27 broken, list stale | 6 |
| R-003 | BUS | FK cascade type wrong (CASCADE vs SET NULL) — associated contacts silently deleted | 6 |

### Top 3 Risk Areas for Epic 2

1. **Data integrity at mutation boundaries** (R-001, R-002, R-003) — NIT uniqueness, TanStack Query invalidation pattern, and cascade semantics are the three most likely failure points; all have high business impact and medium-high probability.
2. **Form validation divergence** (R-004) — Zod and FluentValidation must agree on required fields and NIT format to prevent confusing split-brain error states.
3. **Search + Sort client-side interaction** (R-005, R-006) — two interacting local-state operations that can mutually clear each other or degrade performance if not carefully isolated.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌▌          6 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌  16 tests
  Component (Vitest+RTL+MSW) ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 18 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌▌▌▌         8 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                         48 tests
```

### Rationale

- **Epic 2 is domain-heavy**: CRUD mutations, validation rules, and client-side filtering are best covered by fast Component and API Integration tests.
- **E2E is selective**: reserved for full user journeys (create-to-list, delete-cascade-toast) that cannot be asserted at a lower level.
- **No duplication rule applied**: validation logic tested at Unit + API level; no API test duplicates what the Unit validator covers; no E2E test duplicates what the component test covers.

### Test Level Assignments

| Test Level | Scope | Tools |
|------------|-------|-------|
| Unit | Zod schema validation (clienteSchema), FluentValidator rules, sort utility fn | Vitest, xUnit |
| Component | ClienteListView filter/sort/empty/error states, ClienteForm render/submit/cancel, confirmation dialog | Vitest + React Testing Library + MSW |
| API Integration | All 5 REST endpoints — happy path + error scenarios | xUnit + WebApplicationFactory + Testcontainers (PostgreSQL) |
| E2E | Full user journeys: list renders, create, edit, delete with contact cascade, deep link, sort+search | Playwright |

---

## 4. Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria**: Blocks core user journey + High risk (≥6) + No workaround

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-E2.1: List renders clients | GET `/api/v1/clientes` returns array of clients | API | R-002 | 1 | DEV |
| AC-E2.1: Create client, appears in list | POST `/api/v1/clientes` → 201 + body; re-GET returns new record | API | R-001, R-002 | 2 | DEV |
| R-001: NIT uniqueness enforced | POST same NIT twice → second returns 409 + Problem Details "El NIT/RUC ya está registrado" | API | R-001 | 1 | DEV |
| R-002: Mutation invalidates query | E2E: create client, assert name appears in left panel without page reload | E2E | R-002 | 1 | QA |
| R-003: Delete cascade (SET NULL) | Integration: create client + 2 contacts, DELETE client, GET contacts → assert both exist with `clienteId = null` | API | R-003 | 1 | DEV |
| AC-E2.4: Required fields block submit | Component: submit empty ClienteForm, assert 4 inline error messages, assert POST never called (MSW) | Component | R-004 | 1 | DEV |
| AC-E2.5: Delete client removes from list | E2E: delete client, confirm dialog, assert item removed from left panel, right panel returns to empty state | E2E | R-002, R-003 | 1 | QA |

**Total P0**: 8 tests, ~14 hours

### P1 (High) — Run on PR to main

**Criteria**: Important features + Medium risk (3–4) + Common workflows

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-E2.3: Edit client, changes persist | PUT `/api/v1/clientes/:id` → 200 + updated body | API | R-002 | 1 | DEV |
| AC-E2.3: Edit pre-fills form | Component: open edit form, assert input values match fixture client data | Component | — | 1 | DEV |
| AC-E2.4: Cancel edit restores data | Component: modify field, click Cancel, assert original value shown | Component | R-009 | 1 | DEV |
| AC-E2.2: Detail view loads correct client | GET `/api/v1/clientes/:id` returns correct client | API | — | 1 | DEV |
| AC-E2.2: Deep link loads client detail | E2E: navigate directly to `/clientes/:id`, assert detail panel shows correct Nombre + NIT | E2E | R-008 | 1 | QA |
| AC-E2.1: Search filters list in real time | Component: render 10 clients, type "Acme" in search, assert only matching items shown | Component | R-005 | 1 | DEV |
| AC-E2.1: EmptyState shown when no clients | Component: render with empty data, assert EmptyState visible, no list items | Component | — | 1 | DEV |
| AC-E2.1: ErrorPanel shown on fetch failure | Component (MSW 500): load ClienteListView, assert ErrorPanel + "Reintentar" button | Component | R-007 | 1 | DEV |
| AC-E2.1: Retry after error re-fetches | Component: click "Reintentar", assert new GET issued via MSW handler | Component | R-007 | 1 | DEV |
| AC-E2.5: Delete cancel leaves record | Component: open confirm dialog, click "Cancelar", assert DELETE not called | Component | — | 1 | DEV |
| AC-E2.5: Delete toast — with contacts | E2E: delete client with associated contacts, assert toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." | E2E | R-003 | 1 | QA |
| AC-E2.6: Sort "Nombre A→Z" | Component: render 5 clients, select "nombre-asc", assert list order ascending | Component | R-006 | 1 | DEV |
| AC-E2.6: Sort "Nombre Z→A" | Component: select "nombre-desc", assert list order descending | Component | R-006 | 1 | DEV |
| AC-E2.6: Sort "Más reciente" | Component: assert default sort on mount is creation date descending | Component | — | 1 | DEV |
| AC-E2.6: Sort "Más antiguo" | Component: select "fecha-asc", assert oldest client appears first | Component | — | 1 | DEV |
| AC-E2.6: Sort + active search preserved | Component: apply search "Test", change sort, assert search input unchanged and list is filtered+sorted | Component | R-006 | 1 | DEV |
| API: GET non-existent client | GET `/api/v1/clientes/unknown-uuid` → 404 + Problem Details | API | — | 1 | DEV |
| API: DELETE non-existent client | DELETE `/api/v1/clientes/unknown-uuid` → 404 + Problem Details | API | — | 1 | DEV |
| API: Create with missing fields | POST with empty body → 400 + Problem Details with `errors` object | API | R-004 | 1 | DEV |
| API: Update with missing required field | PUT with Nombre=null → 400 + Problem Details | API | R-004 | 1 | DEV |

**Total P1**: 20 tests, ~22 hours

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary features + Low risk (1–2) + Edge cases

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-E2.2: Unknown clienteId in URL | Component: load ClienteDetailView with non-existent ID (MSW 404), assert not-found message | Component | R-008 | 1 | DEV |
| Success toasts — correct Spanish text | Component: create → assert toast "Cliente creado correctamente"; edit → "Cliente actualizado correctamente"; delete → "Cliente eliminado correctamente" | Component | R-010 | 3 | QA |
| NIT uniqueness — Zod schema | Unit: clienteSchema rejects empty NIT, accepts valid NIT formats | Unit | R-004 | 3 | DEV |
| FluentValidation — backend | Unit: CreateClienteRequestValidator rejects null Nombre, null NIT, null Telefono, null Ciudad | Unit | R-004 | 4 | DEV |
| Sort utility function | Unit: sortClientes(array, 'nombre-asc') returns correctly sorted array for each of 4 options | Unit | — | 4 | DEV |
| NFR1: Search perf with 500 records | Component: render ClienteListView with 500 MSW records, measure filter execution ≤150ms via performance.now() | Component | R-005 | 1 | DEV |
| AC-E2.6: No API call on sort | Component: apply sort, assert MSW handler called exactly once (initial load only) | Component | — | 1 | DEV |

**Total P2**: 17 tests, ~10 hours

### P3 (Low) — Run on-demand

**Criteria**: Nice-to-have + Exploratory + Edge cases

| Requirement | Test Scenario | Test Level | Count | Owner |
|-------------|---------------|------------|-------|-------|
| Responsive layout: left panel 280px | E2E (1280px viewport): assert ClienteListPanel computed width = 280px | E2E | 1 | QA |
| UK constraint name in migration | API: assert `uk_clientes_nit` index exists in information_schema | API | 1 | DEV |
| Problem Details shape exhaustive check | API: assert all error responses contain `type`, `title`, `status`, `detail` keys (no `stackTrace`) | API | 1 | DEV |
| Very long Nombre (255 chars) | API: POST with 255-char Nombre → 201; POST with 256-char Nombre → 400 | API | 2 | DEV |

**Total P3**: 5 tests, ~3 hours

---

## 5. Execution Order

### Smoke Tests (<5 min)

Purpose: Fast feedback, catch build-breaking issues before full suite

- [ ] GET `/api/v1/clientes` returns 200 and JSON array (API) — 10s
- [ ] POST `/api/v1/clientes` with valid payload returns 201 (API) — 15s
- [ ] Navigate to `/clientes` — left panel renders without crash (E2E) — 30s

**Total smoke**: 3 scenarios, ~1 min

### P0 Tests (<10 min)

Purpose: Critical path validation — must all pass before any PR merge

- [ ] GET `/api/v1/clientes` returns array of clients (API)
- [ ] POST `/api/v1/clientes` → 201 + body (API)
- [ ] POST same NIT twice → 409 + Problem Details (API)
- [ ] E2E: create client, assert appears in left panel (E2E)
- [ ] Delete client + cascade: contacts remain with clienteId = null (API)
- [ ] Submit empty ClienteForm → inline errors, no API call (Component)
- [ ] E2E: delete client from detail panel, assert removed from list (E2E)

**Total P0**: 7 scenarios, ~8 min

### P1 Tests (<30 min)

Purpose: Important feature coverage

- [ ] PUT `/api/v1/clientes/:id` → 200 + updated body (API)
- [ ] Component: edit form pre-fills with current client data
- [ ] Component: cancel edit restores original values
- [ ] GET `/api/v1/clientes/:id` returns correct client (API)
- [ ] E2E: deep link to `/clientes/:id` loads detail (E2E)
- [ ] Component: search "Acme" filters list to matching items only
- [ ] Component: empty data shows EmptyState
- [ ] Component: MSW 500 shows ErrorPanel + "Reintentar"
- [ ] Component: click "Reintentar" triggers new GET
- [ ] Component: confirm dialog cancel leaves record
- [ ] E2E: delete client with contacts — cascade toast shown
- [ ] Component: SortControl nombre-asc / nombre-desc / fecha-desc / fecha-asc (4 tests)
- [ ] Component: search + sort — search preserved after sort change
- [ ] API: GET unknown ID → 404 Problem Details
- [ ] API: DELETE unknown ID → 404 Problem Details
- [ ] API: POST empty body → 400 Problem Details with errors
- [ ] API: PUT Nombre=null → 400 Problem Details

**Total P1**: 20 scenarios, ~22 min

### P2/P3 Tests (<60 min)

Purpose: Full regression coverage

- [ ] Component: unknown clienteId URL → not-found message
- [ ] Component: toast text assertions (create / edit / delete)
- [ ] Unit: clienteSchema validates NIT correctly (3 tests)
- [ ] Unit: FluentValidation rejects each missing required field (4 tests)
- [ ] Unit: sortClientes utility for all 4 sort options (4 tests)
- [ ] Component: 500 records filter perf ≤ 150ms
- [ ] Component: sort triggers no extra API call
- [ ] E2E: left panel width at 1280px = 280px
- [ ] API: uk_clientes_nit index exists
- [ ] API: Problem Details shape (no stackTrace)
- [ ] API: 255-char Nombre accepted; 256-char rejected

**Total P2/P3**: 22 scenarios, ~35 min

---

## 6. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 8 | 2.0 | 16h | Includes DB setup (Testcontainers), E2E teardown |
| P1 | 20 | 1.0 | 20h | Standard MSW + RTL component tests |
| P2 | 17 | 0.5 | 8.5h | Simpler assertions, reuse existing fixtures |
| P3 | 5 | 0.25 | 1.25h | Exploratory, low setup cost |
| **Total** | **50** | — | **~46h** | **~6 developer-days** |

### Prerequisites

**Test Data:**

- `clienteFactory` — Faker-based builder for `CreateClienteRequest` (Nombre, NIT, Telefono, Ciudad); auto-cleanup after each xUnit test
- `clienteFixture` — Vitest fixture providing a list of 5–10 seeded clients via MSW handlers
- `largeClienteList` — 500-item array for performance tests (generated, not persisted)

**Tooling:**

- Vitest + React Testing Library + MSW 2.x (component tests — already installed in Epic 1)
- xUnit + `Microsoft.AspNetCore.Mvc.Testing` WebApplicationFactory (backend integration tests — Epic 1)
- Testcontainers for PostgreSQL (backend integration tests — confirms cascade at DB level)
- Playwright (E2E — already configured in Epic 1)

**Environment:**

- Local PostgreSQL 18 instance (or Testcontainers ephemeral) for API integration tests
- MSW browser handler registered in `src/app/providers/` for component tests
- Playwright base URL: `http://localhost:5173` with backend at `http://localhost:5000`

---

## 7. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — no exceptions; failing P0 blocks merge
- **P1 pass rate**: ≥95% — at most 1 failure allowed with approved waiver
- **P2/P3 pass rate**: ≥90% — informational; does not block release
- **High-risk mitigations**: R-001, R-002, R-003 must have passing tests before Story 2.5 is closed

### Coverage Targets

- **Critical paths** (CRUD + search + sort): ≥80% line coverage on `clientes/` module
- **Validation logic** (Zod + FluentValidation): 100% branch coverage on schemas and validators
- **API endpoints**: 100% of the 5 cliente endpoints covered by at least one happy-path + one error-path test

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] R-001: NIT uniqueness returns 409 with correct Problem Details
- [ ] R-002: List updates after mutation without page reload (invalidateQueries confirmed)
- [ ] R-003: Associated contacts have `clienteId = null` after client deletion (not deleted)
- [ ] No stack traces exposed in any error response (NFR6)
- [ ] All toast and UI text in Spanish (company standard)

---

## 8. Mitigation Plans

### R-001: NIT uniqueness not enforced at DB level (Score: 6)

**Mitigation Strategy:** Assert `uk_clientes_nit` unique index in `ClienteConfiguration.cs` EF Core config; add integration test that POSTs the same NIT twice and asserts the second call returns 409. Also add Zod validation to catch duplicate NIT client-side if the API returns 409 (show "El NIT/RUC ya está registrado" inline on the NIT field).
**Owner:** DEV
**Timeline:** Story 2.3 implementation
**Status:** Planned
**Verification:** Integration test `POST /api/v1/clientes` with duplicate NIT returns HTTP 409 + Problem Details title matching "NIT"

### R-002: TanStack Query cache not invalidated (Score: 6)

**Mitigation Strategy:** Code review checklist item: every mutation hook (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Add E2E test that mutates and immediately asserts new state in the UI without reloading the page.
**Owner:** DEV
**Timeline:** Stories 2.3–2.5 implementation
**Status:** Planned
**Verification:** E2E test — create client, assert name appears in left panel; delete client, assert name disappears from left panel

### R-003: FK DELETE CASCADE instead of SET NULL (Score: 6)

**Mitigation Strategy:** Assert `ContactoConfiguration.cs` uses `.OnDelete(DeleteBehavior.SetNull)`, not `Cascade`. Add integration test: seed 1 client + 2 contacts with `clienteId` set, DELETE client, GET both contacts, assert HTTP 200 and `clienteId = null` on both.
**Owner:** DEV
**Timeline:** Story 2.5 implementation (depends on Contacto entity from Epic 3 — may require Epic 3 DB migration to exist)
**Status:** Planned — dependency on Epic 3 DB schema noted
**Verification:** Integration test confirms contacts survive client deletion with null FK

---

## 9. Assumptions and Dependencies

### Assumptions

1. Epic 1 (Foundation) is complete: frontend dev server runs at `localhost:5173`, backend at `localhost:5000`, PostgreSQL connected, MSW and Playwright configured.
2. No authentication is required in MVP — all API endpoints are unauthenticated (explicit PRD decision).
3. Client-side search operates on the in-memory TanStack Query cache — no additional search API endpoint will be introduced for Epic 2.
4. SortControl component is implemented at `src/shared/components/SortControl` as specified in Story 2.6 technical context.
5. The `clientes` PostgreSQL table and EF Core migration will be created as part of Story 2.3 or a dedicated DB migration story within Epic 2.

### Dependencies

1. EF Core migration for `clientes` table — required by all API integration tests; must exist before Stories 2.3–2.6 tests run
2. Contacto entity and `contactos` table — required for R-003 cascade test (Story 2.5); may need to be created as a stub migration from Epic 3
3. `clienteFactory` test utility — shared across all stories; should be created in Story 2.1 and reused

### Risks to Plan

- **Risk**: Story 2.5 cascade test requires Contacto entity (Epic 3 scope)
  - **Impact**: R-003 validation cannot be fully tested until Epic 3 DB schema exists
  - **Contingency**: Create a minimal stub `contactos` migration in Story 2.5 sufficient for the cascade integration test; mark it as technical debt for Epic 3

---

## 10. Follow-on Workflows (Manual)

- Run `*atdd` per story (2.1–2.6) to generate failing P0 tests before implementation (TDD red phase).
- Run `*automate` after each story implementation to expand component/unit coverage.
- Run `*trace` at Epic 2 completion to validate FR1–FR8 + AC-E2.1–AC-E2.6 traceability.

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

- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- PRD Feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 1 Test Design (reference format): `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
