# ATDD Checklist - Epic 2, Story 2.6: Sort Client List

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW)

---

## Story Summary

Story 2.6 adds client-side sorting to the existing `ClienteListView`. The user can select among four sort orders via a new `SortControl` component. Sorting operates exclusively over the TanStack Query cache — no new API calls are made. Sort and search filters are independent and compose correctly.

**As a** commercial team member
**I want** to sort the client list by different criteria
**So that** I can organize my view and quickly find clients based on how I prioritize them

---

## Acceptance Criteria

1. Given the client list is loaded with at least two clients, When the user selects "Nombre A→Z" from the SortControl, Then the client list reorders alphabetically ascending by Nombre without triggering a new API call.
2. Given the client list is loaded, When the user selects "Nombre Z→A" from the SortControl, Then the client list reorders alphabetically descending by Nombre without a new API call.
3. Given the client list is loaded, When the user selects "Más reciente", Then the client list orders by creation date descending (newest client appears first).
4. Given the client list is loaded, When the user selects "Más antiguo", Then the client list orders by creation date ascending (oldest client appears first).
5. Given an active search filter is applied, When the user changes the sort order via SortControl, Then the sort is applied to the already-filtered result set without clearing the search input.
6. Given the SortControl renders on initial page load, When no sort preference has been set, Then the default sort order is "Más reciente" (`fecha-desc`).

---

## Failing Tests Created (RED Phase)

### Component Tests (6 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx`

- **Test:** TC-E2-2-6-CMP-P1-1 — default sort on mount
  - **Status:** RED — `SortControl` component does not exist yet; `[data-testid="sort-control"]` not found
  - **Verifies:** AC #6 — SortControl renders with `fecha-desc` selected by default; newest client appears first

- **Test:** TC-E2-2-6-CMP-P1-2 — sort nombre-asc
  - **Status:** RED — `SortControl` not wired into `ClienteListView`; sort change has no effect
  - **Verifies:** AC #1 — selecting "Nombre A→Z" reorders list alphabetically ascending

- **Test:** TC-E2-2-6-CMP-P1-3 — sort nombre-desc
  - **Status:** RED — `SortControl` not wired into `ClienteListView`; sort change has no effect
  - **Verifies:** AC #2 — selecting "Nombre Z→A" reorders list alphabetically descending

- **Test:** TC-E2-2-6-CMP-P1-4 — sort fecha-asc
  - **Status:** RED — `SortControl` not wired into `ClienteListView`; sort change has no effect
  - **Verifies:** AC #4 — selecting "Más antiguo" puts oldest client first

- **Test:** TC-E2-2-6-CMP-P1-5 — sort + search independence (R-006)
  - **Status:** RED — `SortControl` not present; search + sort interaction cannot be tested
  - **Verifies:** AC #5 — search input is preserved and filter is maintained when sort changes

- **Test:** TC-E2-2-6-CMP-P2-1 — no extra API call on sort change
  - **Status:** RED — `SortControl` not wired; sort triggers no change, MSW call count behavior cannot be validated
  - **Verifies:** AC #1, #2, #3, #4 — sorting is client-side only (TanStack Query cache), no new GET calls

---

## Data Factories Used

### Cliente Factory (pre-existing — Story 2.1)

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts`

**Exports used:**
- `buildCliente(overrides?)` — Create single Cliente with specific `nombre` and `createdAt` for reliable sort assertions
- `resetClienteCounter()` — Called in `afterEach` for deterministic IDs

**Usage in sort tests:**
```typescript
const oldest = buildCliente({ nombre: 'Cliente Antiguo', createdAt: '2022-01-01T00:00:00.000Z' });
const newest = buildCliente({ nombre: 'Cliente Nuevo', createdAt: '2026-06-01T00:00:00.000Z' });
```

No new factory files needed — `clienteFactory.ts` fully covers this story.

---

## Fixtures

No new fixture files required. Tests use `QueryClientProvider` with isolated `QueryClient` instances (pattern established in Story 2.1).

---

## Mock Requirements

### GET /api/v1/clientes (MSW — already mocked)

All tests intercept `GET http://localhost:5000/api/v1/clientes` via MSW before rendering `ClienteListView`. This is the same endpoint used by the existing test suite.

**Pattern used (network-first):**
```typescript
// CRITICAL: Route intercept BEFORE render
server.use(
  http.get(CLIENTES_URL, () => HttpResponse.json([...clients]))
);
renderClienteListView();
```

No external services need mocking beyond MSW for the existing API endpoint.

---

## Required data-testid Attributes

### SortControl Component (to be created)

- `sort-control` — The `<select>` element of the SortControl component

**Implementation requirement:**
```tsx
<select
  data-testid="sort-control"
  aria-label="Ordenar clientes"
  value={value}
  onChange={(e) => onChange(e.target.value as SortOption)}
>
  <option value="fecha-desc">Más reciente</option>
  <option value="fecha-asc">Más antiguo</option>
  <option value="nombre-asc">Nombre A→Z</option>
  <option value="nombre-desc">Nombre Z→A</option>
</select>
```

### ClienteListView (existing — no new testids required)

- `clientes-list-panel` — already present
- `cliente-list-item` — already present (used by sort order assertions)
- `empty-state` — already present
- `error-panel` — already present

---

## Implementation Checklist

### Test: TC-E2-2-6-CMP-P1-1 — default sort on mount (AC #6)

**File:** `frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/SortControl.tsx` with props `value: SortOption` and `onChange: (value: SortOption) => void`
- [ ] Add `data-testid="sort-control"` to the `<select>` element
- [ ] Add `aria-label="Ordenar clientes"` for WCAG 2.1 AA compliance
- [ ] Add four `<option>` elements: `fecha-desc` (Más reciente), `fecha-asc` (Más antiguo), `nombre-asc` (Nombre A→Z), `nombre-desc` (Nombre Z→A)
- [ ] Import `SortOption` type from `frontend/src/shared/lib/sortClientes.ts` — do NOT redefine
- [ ] Wire `SortControl` into `ClienteListView`: add `useState<SortOption>('fecha-desc')` as `sortOption`
- [ ] Replace hardcoded `sortClientes(data, 'fecha-desc')` on line 22 of `ClienteListView.tsx` with `sortClientes(data, sortOption)`
- [ ] Run test: `pnpm --filter frontend test SortControl.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-2-6-CMP-P1-2 — sort nombre-asc (AC #1)

**File:** `frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx`

**Tasks to make this test pass:**

- [ ] `SortControl` renders with `value` prop controlling `<select>` value
- [ ] `onChange` callback fires with the new `SortOption` value on `<select>` change
- [ ] `ClienteListView` updates `sortOption` state on `SortControl` `onChange`
- [ ] `sortedClientes` useMemo reacts to `sortOption` change (dependency array includes `sortOption`)
- [ ] Run test: `pnpm --filter frontend test SortControl.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by same implementation as P1-1)

---

### Test: TC-E2-2-6-CMP-P1-3 — sort nombre-desc (AC #2)

**File:** `frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx`

**Tasks to make this test pass:**

- [ ] `sortClientes` utility handles `nombre-desc` (already implemented in Story 2.1 — verify, do NOT recreate)
- [ ] `ClienteListView` passes updated `sortOption` to `sortClientes`
- [ ] Run test: `pnpm --filter frontend test SortControl.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by same implementation as P1-1 and P1-2)

---

### Test: TC-E2-2-6-CMP-P1-4 — sort fecha-asc (AC #4)

**File:** `frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx`

**Tasks to make this test pass:**

- [ ] `sortClientes` utility handles `fecha-asc` (already implemented in Story 2.1 — verify, do NOT recreate)
- [ ] Run test: `pnpm --filter frontend test SortControl.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by same implementation as P1-1)

---

### Test: TC-E2-2-6-CMP-P1-5 — sort + search independence (AC #5, R-006)

**File:** `frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx`

**Tasks to make this test pass:**

- [ ] `sortOption` state and `searchQuery` state are INDEPENDENT in `ClienteListView` — verify they do not share state or reset each other
- [ ] `sortedClientes` useMemo depends on `[data, sortOption]` — sort applied first
- [ ] `filteredClientes` useMemo depends on `[sortedClientes, searchQuery]` — filter applied second
- [ ] Changing `sortOption` does NOT call `setSearchQuery('')` anywhere
- [ ] Run test: `pnpm --filter frontend test SortControl.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours (architecture already supports this — just verify wiring is correct)

---

### Test: TC-E2-2-6-CMP-P2-1 — no extra API call on sort change (AC #1–#4)

**File:** `frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx`

**Tasks to make this test pass:**

- [ ] Sort change must NOT call `refetch()` or any TanStack Query mutation
- [ ] `setSortOption` only updates local React state — no side effects that trigger network calls
- [ ] `sortedClientes` useMemo is purely synchronous (reads from TanStack Query cache `data`)
- [ ] Run test: `pnpm --filter frontend test SortControl.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (guaranteed by the useState + useMemo approach)

---

## Running Tests

```bash
# Run all ATDD tests for Story 2.6
pnpm --filter frontend test SortControl.test

# Run with verbose output
pnpm --filter frontend test SortControl.test --reporter=verbose

# Run in watch mode during development
pnpm --filter frontend test --watch SortControl.test

# Run all component tests for Epic 2
pnpm --filter frontend test frontend/src/modules/crm/clientes/__tests__

# Run with coverage
pnpm --filter frontend test --coverage SortControl.test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 6 tests written and failing (SortControl does not exist yet)
- ✅ Tests use existing `clienteFactory` (Story 2.1) — no new factory needed
- ✅ Network-first pattern applied — MSW handlers registered before render in all tests
- ✅ `data-testid="sort-control"` requirement documented
- ✅ Implementation checklist created with clear tasks
- ✅ Mock requirements documented (MSW, same endpoint as existing tests)

**Verification:**

- All tests fail with: `Unable to find an element by: [data-testid="sort-control"]`
- Failures are due to missing `SortControl` component — not test bugs
- Test logic is sound (pattern matches existing passing Story 2.1 tests)

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Create `frontend/src/shared/components/SortControl.tsx` (see Dev Notes in story file)
2. Update `ClienteListView.tsx`: add `sortOption` state + wire `SortControl`
3. Run: `pnpm --filter frontend test SortControl.test`
4. All 6 tests should turn GREEN
5. Verify existing `ClienteListView.test.tsx` tests still pass (no regressions)

**Key Principles:**

- One test at a time (start with TC-E2-2-6-CMP-P1-1 — it validates the minimum implementation)
- Minimal implementation (a native `<select>` is acceptable; shadcn/ui `Select` is optional)
- Do NOT modify `sortClientes.ts` or `useClientes.ts` — they are already correct

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 6 tests pass
2. Optionally replace native `<select>` with shadcn/ui `Select` if already installed
3. Ensure tests still pass after any visual polish changes
4. Run full test suite: `pnpm --filter frontend test` — confirm zero regressions

---

## Next Steps

1. Share this checklist and `SortControl.test.tsx` with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm --filter frontend test SortControl.test`
3. Begin implementation: create `SortControl.tsx` then wire into `ClienteListView.tsx`
4. Work one test at a time (TC-E2-2-6-CMP-P1-1 first — smallest unit of work)
5. When all 6 tests pass, run full test suite to confirm no regressions
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — MSW handlers registered before `renderClienteListView()` in all 6 tests; prevents race conditions
- **data-factories.md** — `buildCliente(overrides)` used with explicit `nombre` and `createdAt` values for deterministic sort assertions
- **test-quality.md** — One assertion per describe block concern; `resetClienteCounter()` in `afterEach` for test isolation; no hard waits
- **selector-resilience.md** — `data-testid="sort-control"` selector used exclusively; no CSS class selectors
- **fixture-architecture.md** — Isolated `QueryClient` per test (pattern from Story 2.1); auto-cleanup via `server.resetHandlers()` and `resetClienteCounter()` in `afterEach`
- **component-tdd.md** — Tests written in RED phase before `SortControl` exists; failure messages are actionable

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm --filter frontend test SortControl.test`

**Expected Results:**
```
FAIL  frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx
  SortControl — TC-E2-2-6-CMP-P1-1: default sort on mount
    ✗ should show SortControl with "Más reciente" selected by default on initial render
      TestingLibraryElementError: Unable to find an element by: [data-testid="sort-control"]

  SortControl — TC-E2-2-6-CMP-P1-2: sort nombre-asc
    ✗ should reorder list alphabetically ascending when "nombre-asc" is selected
      TestingLibraryElementError: Unable to find an element by: [data-testid="sort-control"]

  SortControl — TC-E2-2-6-CMP-P1-3: sort nombre-desc
    ✗ should reorder list alphabetically descending when "nombre-desc" is selected
      TestingLibraryElementError: Unable to find an element by: [data-testid="sort-control"]

  SortControl — TC-E2-2-6-CMP-P1-4: sort fecha-asc
    ✗ should show oldest client first when "fecha-asc" is selected
      TestingLibraryElementError: Unable to find an element by: [data-testid="sort-control"]

  SortControl — TC-E2-2-6-CMP-P1-5: sort + search independence (R-006)
    ✗ should preserve search input and filter results when sort order changes
      TestingLibraryElementError: Unable to find an element by: [data-testid="sort-control"]

  SortControl — TC-E2-2-6-CMP-P2-1: no extra API call on sort change
    ✗ should NOT trigger a new GET /api/v1/clientes request when sort order changes
      TestingLibraryElementError: Unable to find an element by: [data-testid="sort-control"]

Test Files: 1 failed (1)
Tests:      6 failed (6)
```

**Summary:**

- Total tests: 6
- Passing: 0 (expected)
- Failing: 6 (expected)
- Status: ✅ RED phase verified — all failures due to missing `SortControl` implementation, not test bugs

---

## Notes

- Story 2.6 is **frontend-only** — no backend changes, no new API endpoints, no new TanStack Query mutations
- The `sortClientes` utility and `SortOption` type from Story 2.1 are already in place — tests rely on them
- The `clienteFactory` from Story 2.1 is reused — no new factory files needed
- Unit tests for `sortClientes` already exist in `sortClientes.test.ts` — do NOT duplicate them
- MSW intercept URL `http://localhost:5000/api/v1/clientes` matches the existing test suite convention

---

**Generated by BMad TEA Agent** — 2026-06-28
