# Automation Summary — Story 2.1: Client List & Search

**Date:** 2026-06-08
**Story:** 2.1 (Epic 2: Client Management)
**Mode:** BMad-Integrated (expanding existing ATDD coverage)
**Coverage Target:** critical-paths + edge cases
**Story status:** implemented

---

## Context

The ATDD baseline was already implemented and green:

- **Backend (dotnet test):** 72 passed + 8 skipped (PostgreSQL-gated by
  `RUN_DB_INTEGRATION_TESTS=1`, sandbox infra: PostgreSQL unavailable).
- **Frontend (vitest):** 75/75 passed across 12 test files.
- **E2E (Playwright chromium):** 8/8 passed in `e2e/tests/clientes/list-and-search.spec.ts`.

This `automate` pass expands coverage with edge cases, negative paths, and boundary
conditions intentionally left out of the ATDD phase. **No ATDD test was regenerated
or modified** (per the BMad automate principle — ATDD owns happy-path AC coverage;
automate owns the edges around it).

### ATDD baseline preserved (NOT regenerated)

**Backend:**

- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` — 11 cases (AC #1, #12)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — 3 cases (AC #2, #12)
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs` — 7 cases (AC #2, #12)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteSchemaIntegrationTests.cs` — 4 cases gated by `RUN_DB_INTEGRATION_TESTS=1` (AC #1, #12)

**Frontend:**

- `frontend/src/modules/crm/clientes/application/matchesQuery.test.ts` — 7 cases (AC #5, #11, #12 → TC-E2-P3-03)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — 15 cases (AC #4, #5, #6, #7, #8, #9, #10, #11, #12)
- `frontend/src/shared/hooks/useDebouncedValue.test.ts` — 4 cases (AC #5)
- `frontend/src/shared/components/EmptyState.test.tsx` — 11 cases (AC #6, #7, #11)
- `frontend/src/shared/components/ErrorPanel.test.tsx` — 6 cases (AC #8, #11)
- `frontend/src/shared/components/ClientListItem.test.tsx` — 8 cases (AC #4, #10, #11)

**E2E:**

- `e2e/tests/clientes/list-and-search.spec.ts` — 8 cases (AC #4, #5, #6, #7, #8, #10, #11)

---

## New automation generated in this pass

### Backend — xUnit edges (new)

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityEdgeTests.cs` (9 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P2 | Two rapid Create calls assign distinct Ids (no Guid collision) | #1 |
| 2 | P1 | Nombre at the 200-char DB max boundary persists verbatim | #1 |
| 3 | P1 | Nit at the 50-char DB max boundary persists verbatim | #1 |
| 4 | P1 | Ciudad at the 100-char DB max boundary persists verbatim | #1 |
| 5 | P2 | Spanish diacritics (`Compañía`, `Eléctrica`) round-trip through Create | #1 |
| 6 | P2 | Internal multi-spaces inside `nombre` are NOT trimmed/collapsed | #1 |
| 7 | P2 | ArgumentException carries the offending field name in ParamName | #1 |
| 8 | P2 | Private parameterless constructor exists for EF Core materialization | #1 |
| 9 | P2 | Every property setter is non-public (invariants enforced) | #1 |

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerEdgeTests.cs` (6 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P1 | Handler returns all 500 items in one call (NFR10 — no pagination) | #2 |
| 2 | P2 | Handler uses AsNoTracking — no entities leak into the change tracker | #2 |
| 3 | P2 | Cancellation token cancels the query (cooperative shutdown contract) | #2 |
| 4 | P2 | Result is a detached snapshot — later inserts do not mutate it | #2 |
| 5 | P2 | DTO projection preserves Spanish diacritics in `nombre`/`nit` | #2 |
| 6 | P2 | Two consecutive calls return the same set when CreatedAt values tie | #2 |

**File:** `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsEdgeTests.cs` (9 tests — POST/PUT/DELETE/PATCH is a Theory with 4 inline rows)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P2 | Response body contains no PascalCase keys (System.Text.Json camelCase contract) | #2 |
| 2 | P1 | 250-item seed returns all items in a single response (NFR10) | #2 |
| 3 | P2 | POST/PUT/DELETE/PATCH on the endpoint do NOT return 500 and do NOT leak stack traces (4 Theory rows) | #2, #3 |
| 4 | P2 | Unknown query string parameters are ignored (Story 2.6+ owns pagination) | #2 |
| 5 | P2 | Two consecutive GETs return byte-identical payloads (idempotent read) | #2 |
| 6 | P2 | Items ordered by CreatedAt DESC (Story 2.6 default-sort alignment) | #2 |

**Backend total new: 24 tests passing (9 + 6 + 9).**

### Frontend — Vitest edges (new)

**File:** `frontend/src/modules/crm/clientes/application/matchesQuery.edge.test.ts` (12 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P2 | Prefix match on `nombre` | #5 |
| 2 | P2 | Suffix match on `nombre` | #5 |
| 3 | P2 | Middle-substring match on `nombre` | #5 |
| 4 | P2 | Diacritics in data + matching query keeps diacritics literally | #5, #11 |
| 5 | P2 | Diacritic query against non-diacritic data does NOT match (documented literal contract) | #5, #11 |
| 6 | P2 | Query longer than every field returns false | #5 |
| 7 | P2 | Numeric NIT prefix matches | #5 |
| 8 | P2 | NIT trailing block matches | #5 |
| 9 | P2 | Digit appearing only in nombre does NOT cause false positive on NIT | #5 |
| 10 | P2 | Surrounding whitespace is trimmed before evaluation | #5 |
| 11 | P2 | Reflexivity — querying with exact nombre matches itself | #5 |
| 12 | P3 | Defensive boundary — empty fields with non-empty query return false | #5 |

**File:** `frontend/src/shared/hooks/useDebouncedValue.edge.test.ts` (5 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P2 | Numeric values propagate correctly (generic type T preserved) | #5 |
| 2 | P2 | Object references are replaced (not merged) | #5 |
| 3 | P2 | 0 ms delay flushes on the next macrotask | #5 |
| 4 | P2 | Unmount cancels the pending timeout (no setState-after-unmount warning) | #5 |
| 5 | P2 | Changing delayMs mid-flight reschedules to the new delay | #5 |

**File:** `frontend/src/shared/components/EmptyState.edge.test.tsx` (8 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P3 | `no-contacts` title verbatim (Story 4.x reuse) | #11 |
| 2 | P3 | `no-contacts` subtitle verbatim | #11 |
| 3 | P3 | `no-contacts` exposes `data-variant="no-contacts"` | #6, #7 |
| 4 | P3 | `no-contacts` keeps `role="status"` + `aria-live="polite"` | #11 |
| 5 | P3 | `no-contacts` renders "Nuevo contacto" CTA when onCtaClick provided | #11 |
| 6 | P2 | onCtaClick fires once per click (3 clicks → 3 invocations) | #6 |
| 7 | P2 | `search-empty` does NOT render CTA when onCtaClick is omitted | #7 |
| 8 | P2 | Each variant exposes a single root `[data-testid="empty-state"]` | #6, #7 |

**File:** `frontend/src/shared/components/ErrorPanel.edge.test.tsx` (6 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P2 | Custom `title` prop replaces the default Spanish title | #8 |
| 2 | P2 | Custom `message` prop replaces the default Spanish message | #8 |
| 3 | P2 | role="alert" preserved when title/message are overridden | #11 |
| 4 | P2 | "Reintentar" button label is NOT configurable (verbatim Spanish) | #11 |
| 5 | P1 | onRetry fires per click (3 clicks → 3 invocations) | #8 |
| 6 | P2 | Keyboard activation (click on focused button) invokes onRetry | #11 |

**File:** `frontend/src/shared/components/ClientListItem.edge.test.tsx` (7 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P2 | `data-active="true"` is set when isActive | #10 |
| 2 | P2 | `data-active="false"` is set when not active | #10 |
| 3 | P2 | 200-char nombre renders fully in DOM + aria-label | #4, #11 |
| 4 | P2 | Spanish diacritics in nombre render verbatim | #4, #11 |
| 5 | P2 | Alphanumeric NIT (RUC-style) renders literally | #4 |
| 6 | P1 | Keyboard click on focused button invokes onClick | #10, #11 |
| 7 | P2 | When active: both aria-current AND data-active move together | #10 |

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge.test.tsx` (8 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P1 | Clearing the search input restores every filtered item | #5 |
| 2 | P2 | search-empty → matching query removes the EmptyState | #5, #7 |
| 3 | P1 | Rapid typing applies only the final value after debounce | #5 |
| 4 | P1 | Selecting a different item moves aria-current to the new row | #10 |
| 5 | P2 | While loading, neither ErrorPanel nor EmptyState is rendered | #4 |
| 6 | P1 | `data-testid="clientes-view"` (Story 1.2 contract) persists when list is empty | #4 |
| 7 | P1 | `data-testid="clientes-view"` persists when fetch fails | #4, #8 |
| 8 | P2 | Search input value updates instantly (uncontrolled by debounce) | #5 |

**Frontend total new: 46 tests passing (12 + 5 + 8 + 6 + 7 + 8).**

### E2E — Playwright chromium edges (new)

**File:** `e2e/tests/clientes/list-and-search.edge.spec.ts` (8 tests)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P1 | Clearing the search input restores all 3 seeded items | #5 |
| 2 | P1 | Selecting a different item moves aria-current to the new row | #10 |
| 3 | P1 | Reintentar after 2 consecutive 500s eventually recovers on 200 | #8 |
| 4 | P2 | Keyboard: focus item + Enter navigates (parity with click) | #10, #11 |
| 5 | P2 | EmptyState (no-clients) exposes role="status" + aria-live="polite" | #11 |
| 6 | P2 | ErrorPanel exposes role="alert" for screen reader announcement | #11 |
| 7 | P2 | Mixed-case query still matches (case-insensitive substring) | #5 |
| 8 | P2 | Deep-link reload preserves active row (FR30 — URL is source of truth) | #10 |

**E2E total new: 8 tests passing (chromium-only, sandbox infra constraint).**

---

## Test execution

### Backend (dotnet test SiesaAgents.sln)

```bash
cd backend && dotnet test SiesaAgents.sln --nologo
```

**Result:** 96 passed, 0 failed, 8 skipped (PostgreSQL DB-integration tests gated)

Breakdown:
- ATDD baseline preserved: 72 passing
- New edge tests: 24 passing
- PostgreSQL-gated: 8 skipped (sandbox infra; will run with `RUN_DB_INTEGRATION_TESTS=1`)

### Frontend (vitest run)

```bash
cd frontend && pnpm test -- --run
```

**Result:** 121 passed, 0 failed across 18 test files (10.8 s)

Breakdown:
- ATDD baseline preserved: 75 passing (12 files)
- New edge tests: 46 passing (6 new files)

### E2E (Playwright — chromium project only)

```bash
pnpm exec playwright test --project=chromium \
  e2e/tests/clientes/list-and-search.spec.ts \
  e2e/tests/clientes/list-and-search.edge.spec.ts
```

**Result:**
- `list-and-search.spec.ts` (ATDD): 8 passed (12.2 s)
- `list-and-search.edge.spec.ts` (NEW): 8 passed (12.7 s)

Total Story 2.1 E2E: **16/16 passed** on first run, no healing required.

---

## Coverage analysis

| AC | ATDD coverage | Automate expansion |
|----|----------------|---------------------|
| AC #1 (table + columns + index) | DB-gated schema tests + entity invariants | Max-length boundaries (200/50/100), private ctor reflection, Spanish diacritics, internal spaces |
| AC #2 (GET returns JSON array) | 200 + array shape + camelCase keys + UTC offset | 250-item NFR10, no PascalCase leakage, idempotent, query params ignored, CreatedAt DESC |
| AC #3 (RFC 7807 errors) | Existing Story 1.3 middleware tests | POST/PUT/DELETE/PATCH on endpoint don't leak stack traces |
| AC #4 (280px panel) | List renders all items + w-[280px] class | Story 1.2 contract preserved across empty/error states |
| AC #5 (search + debounce) | Filter by nombre / nit + perf < 1s + no refetch | Clear restores list, rapid typing race, mixed-case match, prefix/suffix/middle substrings |
| AC #6 (EmptyState no-clients) | Variant rendered + search hidden | (already comprehensively covered) |
| AC #7 (EmptyState search-empty) | Variant rendered + search visible | search-empty → match recovery removes EmptyState |
| AC #8 (ErrorPanel + Reintentar) | Single 500 + retry recovery | Multi-failure retry chain, custom title/message override |
| AC #9 (canonical queryKey) | Cache contains ['clientes'] key | (already comprehensively covered) |
| AC #10 (URL state) | Click → URL navigates | Switching items moves aria-current, keyboard activation, reload preserves selection |
| AC #11 (Spanish + a11y) | aria-label, verbatim copy, role="alert"/"status" | Diacritics round-trip in nombre, role="alert" preserved on prop override, no-contacts variant accessibility |
| AC #12 (test suite green) | Listed test IDs pass | All ATDD + edges pass on first run |

---

## Quality checks

- All new tests follow Given-When-Then with comments
- All new tests tagged with `[P1]`/`[P2]`/`[P3]` priority in the test name
- All new tests deterministic — no `waitForTimeout` for sync, no conditional flow
- All new tests self-contained — no shared state between tests
- No page objects (per BMad rule)
- All new test files under 300 lines (largest: ClienteListView.edge at 232)
- Sandbox constraint honored — Playwright `--project=chromium` only
- 24/24 new backend tests green on first run
- 46/46 new frontend tests green on first run
- 8/8 new E2E tests green on first run
- No test required `test.fixme()` — all healing iterations: 0

## DoD

- [x] Edge cases added on top of ATDD (not duplicated)
- [x] Negative paths covered (non-GET methods, query>field, diacritic-mismatch literal, empty fields)
- [x] Boundary conditions covered (200-char nombre, 50-char NIT, 100-char ciudad, 0 ms debounce, 250/500-item lists)
- [x] Browser-state edges covered (clear-search recovery, reload preserves URL state, multi-failure retry)
- [x] Keyboard-parity covered (Tab + Enter on list item, click-on-focused button on Reintentar)
- [x] Accessibility edges covered (role="alert" on prop override, role="status" + aria-live across variants)
- [x] Story 1.2 regression contract preserved (`data-testid="clientes-view"` persists in empty + error states)
- [x] All generated tests pass on first run
- [x] No test required `test.fixme()`
- [x] Automation summary written to `_bmad-output/automation-summary.md`

## Next steps

1. Story 2.1 status: `implemented` → ready for `*trace` workflow (requirements-to-tests matrix).
2. Continue with `testarch-trace` and `quality-process` gate review for the story.
3. Total Story 2.1 test inventory:
   - Backend: 96 passing + 8 DB-gated (104 total)
   - Frontend Vitest: 121 passing across 18 files
   - Playwright chromium: 16 passing (8 ATDD + 8 edge)
4. PostgreSQL-gated tests will be exercised in CI when `RUN_DB_INTEGRATION_TESTS=1` is set (per Story 1.3 pattern).

## Knowledge Base References Applied

- `test-levels-framework.md` — E2E reserved for critical multi-step user flows (clear-search, retry chain, keyboard parity, reload); API for HTTP contract edges (camelCase leak, NFR10); Component for UI states and accessibility; Unit for pure logic (matchesQuery substring boundaries, useDebouncedValue cleanup).
- `test-priorities-matrix.md` — P1 reserved for recovery paths (clear search, multi-retry, active-row movement); P2 for boundary/data-shape; P3 for variant reuse (no-contacts).
- `test-quality.md` — Atomic asserts, Given-When-Then, no hard waits in Vitest; in Playwright only one `waitForTimeout(500)` is in the ATDD spec (unchanged); new specs use event-based waits (`expect().toBeVisible`, `expect(items.nth)`).
- `selective-testing.md` — Tag-based execution via `[P0]`/`[P1]`/`[P2]`/`[P3]` in test names enables `--grep "@P1"` filtering in CI.
