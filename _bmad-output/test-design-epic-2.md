# Test Design: Epic 2 - Gestión de Clientes (Client Management)

**Date:** 2026-06-15
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management CRUD (Create, Read/List, Detail, Update, Delete, Sort) covering 6 user stories (2.1–2.6) and acceptance criteria AC-E2.1 → AC-E2.6, FRs 1–8 and NFRs 1, 2, 5, 6, 7, 8.

**Risk Summary:**

- Total risks identified: **12**
- High-priority risks (score ≥6): **3**
- Critical categories: **DATA, BUS, PERF**

**Coverage Summary:**

- P0 scenarios: 11 (22.0 hours)
- P1 scenarios: 14 (14.0 hours)
- P2 scenarios: 12 (6.0 hours)
- P3 scenarios: 4 (1.0 hours)
- **Total effort: 41 tests, ~43 hours (~5.5 days)**

**Reuse note:** Playwright E2E framework already initialized at `/e2e/` with `ClientesPage` POM, `ApiHelper`, `buildCliente` factory, and `clientes-crud.spec.ts` already covering FR1, FR2, FR4, FR7, FR8 at a basic level. New tests EXTEND this scaffolding rather than re-create it. Vitest+RTL is configured at `/frontend/vitest.config.ts` for unit/component tests.

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                                                                                          | Probability | Impact | Score | Mitigation                                                                                                                                              | Owner   | Timeline    |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------- |
| R-001   | DATA     | Story 2.5: deleting a client with associated contacts may cascade delete the contacts instead of nulling `cliente_id` (FR25 breach). | 2           | 3      | **6** | API integration test that asserts `ON DELETE SET NULL` behaviour: create cliente+contacto, delete cliente, verify contact still exists with `null` FK. | QA      | Sprint 2    |
| R-002   | BUS      | Story 2.6: sort + active search filter interaction may either clear the search or apply sort over the unfiltered result set.         | 3           | 2      | **6** | Dedicated E2E test: type search, then change sort, assert (a) input value preserved, (b) filtered subset reordered correctly, (c) no network call.      | QA/DEV  | Sprint 2    |
| R-003   | DATA     | Story 2.3 / 2.4: NIT/RUC uniqueness enforced only on frontend may allow duplicates via direct API call (NFR5 input validation).      | 2           | 3      | **6** | Backend integration test posting duplicate NIT directly to API; expect 409 Problem Details with Spanish-safe `detail` field (no stack trace per NFR6).   | DEV     | Sprint 2    |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                                                                                                            | Probability | Impact | Score | Mitigation                                                                                                                | Owner |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ----- | ------------------------------------------------------------------------------------------------------------------------- | ----- |
| R-004   | PERF     | Story 2.1: search at 500 records may exceed NFR1 (<1s) if filtering is wired through API instead of client-side cache.                 | 2           | 2      | 4     | Component test that seeds 500 cached records and asserts filter render ≤ 1s. Add `data.helper` bulk seeding helper.        | QA    |
| R-005   | BUS      | Story 2.2: deep-link `/clientes/:id` for an unknown id may crash instead of showing not-found gracefully.                              | 2           | 2      | 4     | E2E test: navigate directly to `/clientes/00000000-0000-0000-0000-000000000000`; assert friendly not-found UI, no console error. | QA    |
| R-006   | BUS      | Story 2.4: "Cancelar" on edit form may persist accidental field changes if state is shared with detail panel.                          | 2           | 2      | 4     | Component test in `ClienteForm.test.tsx`: open edit, mutate field, click Cancelar, assert pristine values restored.        | DEV   |
| R-007   | TECH     | Stories 2.3–2.5: TanStack Query keys may not invalidate after mutations, breaking FR27 (immediate update for all users).               | 2           | 2      | 4     | E2E asserts list reflects mutation without manual reload. Also unit-level: hook test asserts `invalidateQueries(['clientes'])` is called. | DEV   |
| R-008   | SEC      | NFR5/NFR6: malformed payloads (XSS in `nombre`, oversized strings) may be persisted or surfaced raw in the UI.                         | 2           | 2      | 4     | API edge test with payload containing `<script>` and 10k-char strings; assert sanitized/rejected and error follows Problem Details. | QA    |
| R-009   | BUS      | Story 2.1: ErrorPanel "Reintentar" path may stay broken (refetch button no-op) when backend recovers.                                  | 2           | 2      | 4     | E2E test using route interception: 1st call fails → ErrorPanel; click Reintentar with route unblocked; list renders.       | QA    |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                                                                  | Probability | Impact | Score | Action  |
| ------- | -------- | -------------------------------------------------------------------------------------------- | ----------- | ------ | ----- | ------- |
| R-010   | OPS      | Migration adding NIT unique constraint may fail on databases with pre-existing duplicates.   | 1           | 2      | 2     | Monitor; pre-migration cleanup script if needed. |
| R-011   | BUS      | Default sort = "Más reciente" depends on `created_at` being persisted; missing on legacy rows. | 1           | 2      | 2     | Monitor; backend always sets `CreatedAt = DateTimeOffset.UtcNow`. |
| R-012   | TECH     | Toasts ("Cliente creado/actualizado/eliminado correctamente") may not appear in Spanish if i18n fallback regresses. | 1           | 1      | 1     | Monitor; manual smoke. |

### Risk Category Legend

- **TECH**: Architecture / integration / TanStack Query keys / siesa-ui-kit usage
- **SEC**: Input sanitization, error detail exposure
- **PERF**: NFR1 search <1s, NFR2 CRUD <2s
- **DATA**: NIT uniqueness, FK SET NULL, optimistic update rollback
- **BUS**: User flows, sort+search interaction, deep linking, cancel semantics
- **OPS**: DB migrations, configuration

---

## Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey + High risk (≥6) + No workaround + Direct AC mapping

| Story | Requirement / AC                                                                  | Test Level | Risk Link | Test Count | Owner | Notes                                                                                              |
| ----- | --------------------------------------------------------------------------------- | ---------- | --------- | ---------- | ----- | -------------------------------------------------------------------------------------------------- |
| 2.1   | AC-E2.2 / FR2-FR4: search by nombre and NIT returns matches                       | E2E        | R-004     | 2          | QA    | Already partially covered in `clientes-crud.spec.ts` — extend for both fields, search clear flow.   |
| 2.1   | EmptyState on zero clients + ErrorPanel "Reintentar" path                         | E2E        | R-009     | 2          | QA    | Use Playwright `page.route` to fail/recover `/api/v1/clientes`.                                     |
| 2.2   | AC-E2.3 / FR30: deep link `/clientes/:id` loads correct detail                    | E2E        | R-005     | 1          | QA    | Pre-seed via `ApiHelper.createCliente`, navigate directly to URL.                                   |
| 2.2   | Unknown clienteId returns graceful not-found                                      | E2E        | R-005     | 1          | QA    | New negative E2E test.                                                                              |
| 2.3   | AC-E2.1 / FR1: create cliente with all required fields → appears immediately       | E2E        | R-007     | 1          | QA    | Already exists in `clientes-crud.spec.ts`, keep as smoke.                                           |
| 2.3   | AC-E2.4 / FR8: required-field validation prevents submit                          | E2E        | R-007     | 1          | QA    | Already exists; reinforce inline error coverage per field.                                          |
| 2.3   | FR7 / NFR6: duplicate NIT returns 409 with Spanish-safe message, no stack trace   | API        | R-003     | 1          | QA    | New API spec under `e2e/tests/api/clientes.api.spec.ts`.                                            |
| 2.4   | AC-E2.3: edit + save reflected in list and detail without reload                  | E2E        | R-007     | 1          | QA    | New E2E test.                                                                                       |
| 2.5   | AC-E2.5 + FR25: deleting cliente with associated contacts sets `cliente_id = NULL`| API        | R-001     | 1          | QA    | Integration: pre-seed cliente + 2 contactos via API, DELETE cliente, GET both contactos, assert `clienteId === null`. |

**Total P0:** 11 tests × ~2 hours/test = **22 hours**

### P1 (High) — Run on PR to main

**Criteria:** Important AC behaviour + Medium risk (3-4) + Common workflow

| Story | Requirement / AC                                                                                 | Test Level | Risk Link | Test Count | Owner | Notes                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------ | ---------- | --------- | ---------- | ----- | ------------------------------------------------------------------------------------------- |
| 2.1   | Real-time search filter (<1s, 500 records) — NFR1                                                | Component  | R-004     | 1          | DEV   | Vitest test on `ClienteListPanel` with 500 mocked items; assert render <1s.                  |
| 2.1   | Search input preserves filter when list updates (FR27 invalidation)                              | E2E        | R-007     | 1          | QA    | Type search → trigger external mutation → assert filter still applied.                       |
| 2.2   | URL updates to `/clientes/:clienteId` when selecting item from list                              | E2E        | R-005     | 1          | QA    | Assert `page.url()` after click.                                                             |
| 2.3   | Toast "Cliente creado correctamente" appears on success                                          | Component  | R-012     | 1          | DEV   | Vitest + MSW on `useCreateCliente` hook.                                                     |
| 2.3   | Per-field inline error messages on empty submit (Nombre, NIT, Teléfono, Ciudad)                   | Component  | R-006     | 4          | DEV   | `ClienteForm.test.tsx` with React Hook Form + Zod.                                           |
| 2.4   | Edit form pre-filled with current values on open                                                 | Component  | R-006     | 1          | DEV   | Mount form with initial cliente; assert input `value` props.                                 |
| 2.4   | "Cancelar" reverts form state without saving                                                     | Component  | R-006     | 1          | DEV   | Mutate field → cancel → assert pristine cliente in detail panel.                             |
| 2.4   | Required field cleared in edit blocks save                                                       | Component  | R-006     | 1          | DEV   | Clear `nombre`, click Guardar, assert validation message + no submit.                        |
| 2.5   | Confirmation dialog appears before delete                                                        | Component  | -         | 1          | DEV   | siesa-ui-kit Dialog component test.                                                          |
| 2.5   | Cancel in delete dialog leaves cliente unchanged                                                 | E2E        | -         | 1          | QA    | Reuse `ClientesPage` POM.                                                                    |
| 2.6   | Sort "Nombre A→Z" reorders list without network call                                             | E2E        | R-002     | 1          | QA    | Use `page.route` to assert zero `/api/v1/clientes` calls during sort change.                 |

**Total P1:** 14 tests × ~1 hour/test = **14 hours**

### P2 (Medium) — Run nightly / weekly

**Criteria:** Secondary AC + Low risk + Edge cases

| Story | Requirement / AC                                                              | Test Level | Risk Link | Test Count | Owner | Notes                                                                          |
| ----- | ----------------------------------------------------------------------------- | ---------- | --------- | ---------- | ----- | ------------------------------------------------------------------------------ |
| 2.1   | Scrollable list rendering at the 280px panel width                            | Component  | -         | 1          | DEV   | Snapshot/regression test of `ClienteListView`.                                  |
| 2.3   | Toast on backend failure surfaces "No se pudo guardar" — not raw error (NFR6) | Component  | R-008     | 1          | DEV   | MSW returns 500; assert friendly message.                                       |
| 2.3/4 | XSS payload in `nombre` is sanitized / escaped on render                      | E2E        | R-008     | 1          | QA    | Inject `<script>alert(1)</script>`; assert text rendered, no script execution.  |
| 2.3   | API rejects oversized `nombre` (>200 chars) with 400 Problem Details          | API        | R-008     | 1          | QA    | Backend FluentValidation rule.                                                  |
| 2.4   | Optimistic update rollback on PUT failure (TanStack mutation `onError`)       | Component  | R-007     | 1          | DEV   | Vitest + MSW; assert detail panel reverts.                                      |
| 2.5   | After deletion, right panel returns to empty/default state                    | E2E        | -         | 1          | QA    |                                                                                |
| 2.5   | Toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente..."     | E2E        | R-001     | 1          | QA    | Asserts compound toast for the cascade-null case.                               |
| 2.6   | Sort "Nombre Z→A"                                                              | Component  | -         | 1          | DEV   | Pure-function sort util unit test.                                              |
| 2.6   | Sort "Más reciente" (default on load)                                          | Component  | R-011     | 1          | DEV   | Sort util + `SortControl` initial state.                                        |
| 2.6   | Sort "Más antiguo"                                                             | Component  | -         | 1          | DEV   | Sort util unit test.                                                            |
| 2.6   | Sort applied on top of active search                                          | E2E        | R-002     | 1          | QA    | Composite test for AC-E2.6 critical interaction.                                |
| 2.6   | Sort persisted when switching to detail and back                              | E2E        | -         | 1          | QA    | Edge case; sort state survives route change.                                    |

**Total P2:** 12 tests × ~0.5 hour/test = **6 hours**

### P3 (Low) — Run on-demand

| Story | Requirement                                                              | Test Level | Test Count | Owner | Notes                                                       |
| ----- | ------------------------------------------------------------------------ | ---------- | ---------- | ----- | ----------------------------------------------------------- |
| 2.1   | Performance benchmark: render time of 500-row list under DevTools profile | Component  | 1          | DEV   | Vitest `performance.now()` smoke.                            |
| 2.3   | NFR2: CRUD round-trip <2s observed in E2E                                 | E2E        | 1          | QA    | Assert from click → list update timestamp.                  |
| 2.6   | Sort stability on items with identical `nombre` (tie-break by createdAt) | Component  | 1          | DEV   | Unit test on sort comparator.                                |
| 2.x   | NFR7: First-time user can find a cliente without docs (heuristic walk)   | E2E        | 1          | QA    | Manual/exploratory script, not auto-run.                    |

**Total P3:** 4 tests × ~0.25 hour/test = **1 hour**

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose:** Fast feedback, catch build-breaking issues

- [ ] `/clientes` route loads with NavigationRail + EmptyState (no records)
- [ ] Create cliente via UI happy path → appears in list
- [ ] Search by nombre returns expected match
- [ ] Delete cliente via UI → removed from list

**Total:** 4 smoke scenarios (~3 min)

### P0 Tests (<10 min)

**Purpose:** Critical-path validation (11 scenarios above)

- [ ] Search by nombre (E2E)
- [ ] Search by NIT (E2E)
- [ ] EmptyState on zero clients (E2E)
- [ ] ErrorPanel + Reintentar (E2E)
- [ ] Deep link `/clientes/:id` valid id (E2E)
- [ ] Deep link unknown id → not-found (E2E)
- [ ] Create cliente happy path (E2E)
- [ ] Required-field validation blocks submit (E2E)
- [ ] Duplicate NIT → 409 with Spanish message (API)
- [ ] Edit cliente → list+detail reflect immediately (E2E)
- [ ] Delete cliente with contacts → contacts orphaned, not deleted (API)

### P1 Tests (<30 min)

**Purpose:** Important feature coverage (14 scenarios)

### P2/P3 Tests (<60 min)

**Purpose:** Full regression coverage (16 scenarios)

---

## Resource Estimates

### Test Development Effort

| Priority  | Count  | Hours/Test | Total Hours | Notes                                |
| --------- | ------ | ---------- | ----------- | ------------------------------------ |
| P0        | 11     | 2.0        | 22.0        | E2E + API integration, route mocking |
| P1        | 14     | 1.0        | 14.0        | Component/unit standard coverage     |
| P2        | 12     | 0.5        | 6.0         | Simple unit + small E2E              |
| P3        | 4      | 0.25       | 1.0         | Benchmarks, exploratory              |
| **Total** | **41** | **-**      | **43.0**    | **~5.5 dev-days**                    |

### Prerequisites

**Test Data:**

- `buildCliente()` factory (already at `e2e/helpers/data.helper.ts`) — extend with `buildClienteBulk(count)` for the 500-record perf scenario.
- `ApiHelper.createCliente`, `.deleteCliente`, `.getClientes` (already exist). **Add** `createContacto`, `getContactoById` for R-001 cascade-null integration test.
- MSW handlers for unit/component tests covering: 200/201/400/404/409/500 against `/api/v1/clientes` and `/api/v1/contactos`.

**Tooling:**

- Playwright `page.route()` for network interception in EmptyState/Error/no-network-on-sort tests.
- Vitest + React Testing Library + MSW for component tests (already configured at `frontend/vitest.config.ts`).
- Existing `ClientesPage` POM at `e2e/pages/clientes.page.ts` — extend with `sortControl`, `confirmDeleteDialog`, `toastByText`, `errorPanel`, `emptyState` accessors.

**Environment:**

- Backend running at `localhost:5000` with empty `siesa_agents_db` per test run (truncate-on-setup or per-test cleanup via `createdIds[]` pattern already in use).
- `VITE_API_URL=http://localhost:5000` in `.env.test`.

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions)
- **P1 pass rate:** ≥95%
- **P2/P3 pass rate:** ≥90% (informational)
- **High-risk mitigations (R-001, R-002, R-003):** 100% covered by P0 tests, all green

### Coverage Targets

- **Critical paths (Create / List+Search / Delete-with-cascade):** ≥90%
- **Validation/error scenarios (NIT dup, required fields, 500 fallbacks):** 100%
- **Sort variants (4 options) × interaction with search:** 100% of AC-E2.6 sub-cases
- **Edge cases (XSS, oversized payload, optimistic rollback):** ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] R-001 (delete cascade SET NULL) explicitly validated
- [ ] R-002 (sort + search) explicitly validated
- [ ] R-003 (NIT uniqueness server-side) explicitly validated
- [ ] No raw stack traces / internal error details in UI (NFR6)
- [ ] All toasts, errors, labels in Spanish

---

## Mitigation Plans

### R-001: Delete Cliente Cascades to Contactos (Score 6)

**Mitigation:** Backend `ContactoConfiguration` declares `OnDelete(DeleteBehavior.SetNull)`. P0 API integration test inserts cliente A with 2 contactos, deletes A, asserts both contactos persist with `clienteId === null` (matching FR25 "sin cliente" filter).
**Owner:** DEV (backend config) + QA (test author)
**Timeline:** Sprint 2 — must be green before Story 2.5 marked Done
**Verification:** `e2e/tests/api/clientes-cascade.api.spec.ts` returns 204 on delete, then GET contactos returns 200 with `clienteId: null`.

### R-002: Sort + Active Search Interaction (Score 6)

**Mitigation:** Sort handler reads from already-filtered TanStack cache slice; never re-fetches and never resets `searchTerm` state. P0 E2E test asserts (a) search input value preserved, (b) reordered subset matches expected order, (c) `page.route` recorder captures zero requests to `/api/v1/clientes` during sort change.
**Owner:** DEV
**Timeline:** Sprint 2 — Story 2.6 blocker
**Verification:** E2E test in `e2e/tests/clientes/sort-with-search.spec.ts`.

### R-003: NIT Uniqueness Bypass via Direct API (Score 6)

**Mitigation:** Backend has `uk_clientes_nit` unique index + FluentValidation pre-check; API returns 409 Problem Details with Spanish `detail`. Frontend Zod schema mirrors this but is not load-bearing.
**Owner:** DEV
**Timeline:** Sprint 2
**Verification:** API test posts duplicate NIT directly via `request.post`, asserts 409 + `application/problem+json` content type + Spanish `detail` field.

---

## Assumptions and Dependencies

### Assumptions

1. Backend exposes `/api/v1/clientes` and `/api/v1/contactos` per architecture.md §API & Communication Patterns.
2. `siesa_agents_db` PostgreSQL instance available for E2E/API tests; tests clean up via `createdIds[]` pattern already established.
3. `SortControl` component lives at `src/shared/components/SortControl` (per epic technical context).
4. siesa-ui-kit Dialog component is the source of the delete confirmation modal.
5. Playwright config already targets `http://localhost:5173` for the frontend.

### Dependencies

1. Epic 1 (Foundation) complete — gate decision PASS — required for backend/db scaffolding.
2. `e2e/pages/clientes.page.ts` POM extension (sort, dialog, toast helpers) — required before P0 E2E tests can run.
3. `IContactoRepository.cs` + EF `OnDelete(SetNull)` — required by R-001 test.

### Risks to Plan

- **Risk:** ContactManager component (siesa-ui-kit) may not be available in time, affecting Story 2.2 detail panel rendering.
  - **Impact:** Some P1 detail tests may be deferred to Epic 4 (asociación cliente-contacto).
  - **Contingency:** Mark affected tests as `test.skip` with `// TODO: enable when ContactManager wired` and revisit at Epic 4 start.

---

## Follow-on Workflows (Manual)

- Run `*atdd` per story to generate failing P0 tests (red-green-refactor).
- Run `*automate` after each story implementation to expand coverage toward P1.
- Run `*trace` at epic completion to verify AC↔test mapping and emit gate decision.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: ___________ Date: ___________
- [ ] Tech Lead: ___________ Date: ___________
- [ ] QA Lead: ___________ Date: ___________

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification (6 categories: TECH/SEC/PERF/DATA/BUS/OPS)
- `probability-impact.md` — Probability × impact scoring
- `test-levels-framework.md` — E2E vs API vs Component vs Unit
- `test-priorities-matrix.md` — P0-P3 prioritization

### Related Documents

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- FRs: `_bmad-output/planning-artifacts/prd/functional-requirements.md` (FR1–FR8, FR25, FR27, FR30)
- NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md` (NFR1, NFR2, NFR5, NFR6, NFR7, NFR8)
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Existing tests: `e2e/tests/clientes/clientes-crud.spec.ts`, `e2e/pages/clientes.page.ts`, `e2e/helpers/{api,data}.helper.ts`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
