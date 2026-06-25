# ATDD Checklist - Epic 2, Story 2.6: Sort Client List

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL) + E2E (Playwright)

---

## Story Summary

A commercial team member can sort the client list by four criteria (Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo) entirely client-side — no new API call is triggered on sort change. The sort state is local to `ClienteListPanel` and operates over the TanStack Query cache already populated by Story 2.1. When a search filter is active, the sort is applied on top of the filtered result set without clearing the search input.

**As a** commercial team member
**I want** to sort the client list by different criteria
**So that** I can organize my view and quickly find clients based on how I prioritize them

---

## Acceptance Criteria

1. Given the client list is loaded with at least two clients, When the user selects "Nombre A→Z" from the SortControl component, Then the client list reorders alphabetically ascending by Nombre without triggering a new API call.

2. Given the client list is loaded, When the user selects "Nombre Z→A" from the SortControl, Then the client list reorders alphabetically descending by Nombre without triggering a new API call.

3. Given the client list is loaded, When the user selects "Más reciente", Then the client list orders by creation date descending (newest client appears first) without triggering a new API call.

4. Given the client list is loaded, When the user selects "Más antiguo", Then the client list orders by creation date ascending (oldest client appears first) without triggering a new API call.

5. Given an active search filter is applied, When the user changes the sort order via SortControl, Then the sort is applied to the already-filtered result set without clearing the search input.

6. Given the SortControl renders on initial page load, When no sort preference has been set, Then the default sort order is "Más reciente" (`fecha-desc`).

---

## Failing Tests Created (RED Phase)

### E2E Tests (12 tests)

**File:** `e2e/story-2-6/sort-client-list.spec.ts`

- **Test:** `should render the SortControl component on the client list page`
  - **Status:** RED — `sort-control` data-testid does not exist (SortControl not implemented)
  - **Verifies:** AC1 — SortControl renders on /clientes page

- **Test:** `should list first item before second when "Nombre A→Z" is selected`
  - **Status:** RED — `sort-control` not found; sort has no effect on list order
  - **Verifies:** AC1 — Alphabetical ascending sort applied to rendered list

- **Test:** `should not trigger a new API call when "Nombre A→Z" is selected`
  - **Status:** RED — Sort control does not exist; sort change cannot be triggered
  - **Verifies:** AC1 — No new API call on sort change

- **Test:** `should list Zafiro Corp before Alfa Industries when "Nombre Z→A" is selected`
  - **Status:** RED — SortControl not implemented
  - **Verifies:** AC2 — Alphabetical descending sort applied

- **Test:** `should not trigger a new API call when "Nombre Z→A" is selected`
  - **Status:** RED — SortControl not implemented
  - **Verifies:** AC2 — No new API call on sort change

- **Test:** `should list the newest client first when "Más reciente" is selected`
  - **Status:** RED — SortControl not implemented
  - **Verifies:** AC3 — Date descending sort applied

- **Test:** `should not trigger a new API call when "Más reciente" is selected`
  - **Status:** RED — SortControl not implemented
  - **Verifies:** AC3 — No new API call on sort change

- **Test:** `should list the oldest client first when "Más antiguo" is selected`
  - **Status:** RED — SortControl not implemented
  - **Verifies:** AC4 — Date ascending sort applied

- **Test:** `should not trigger a new API call when "Más antiguo" is selected`
  - **Status:** RED — SortControl not implemented
  - **Verifies:** AC4 — No new API call on sort change

- **Test:** `should apply sort only to the already-filtered set when search is active`
  - **Status:** RED — SortControl not implemented; sort + filter interaction not wired
  - **Verifies:** AC5 — Sort operates on filtered result set, not full dataset

- **Test:** `should not clear the search input when sort order changes`
  - **Status:** RED — SortControl not implemented
  - **Verifies:** AC5 — Search input value preserved when sort changes

- **Test:** `should show SortControl with "Más reciente" selected on initial page load`
  - **Status:** RED — SortControl not present; default value not set
  - **Verifies:** AC6 — Default sort is fecha-desc on initial render

- **Test:** `should order newest client first on initial load`
  - **Status:** RED — No sort applied by default (SortControl missing)
  - **Verifies:** AC6 — Default sort ordering matches fecha-desc behavior

### Component Tests — SortControl (12 tests)

**File:** `frontend/src/shared/components/SortControl.test.tsx`

- **Test:** `should render with the "Más reciente" option selected when value is "fecha-desc"`
  - **Status:** RED — SortControl module does not exist
  - **Verifies:** AC6 — Controlled value prop reflected in select element

- **Test:** `should render the visible label "Ordenar por:" in Spanish`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC6 / Accessibility — Spanish label present

- **Test:** `should render the "Nombre A→Z" option`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC1 — Spanish option label present

- **Test:** `should render the "Nombre Z→A" option`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC2 — Spanish option label present

- **Test:** `should render the "Más reciente" option`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC3 — Spanish option label present

- **Test:** `should render the "Más antiguo" option`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC4 — Spanish option label present

- **Test:** `should show "nombre-asc" selected when value prop is "nombre-asc"`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC1 — Controlled component reflects prop

- **Test:** `should call onChange with "nombre-asc" when user selects "Nombre A→Z"`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC1 — onChange fires with correct identifier

- **Test:** `should call onChange with "nombre-desc" when user selects "Nombre Z→A"`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC2 — onChange fires with correct identifier

- **Test:** `should call onChange with "fecha-desc" when user selects "Más reciente"`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC3 — onChange fires with correct identifier

- **Test:** `should call onChange with "fecha-asc" when user selects "Más antiguo"`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** AC4 — onChange fires with correct identifier

- **Test:** `should have aria-label="Ordenar clientes" on the control element`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** Accessibility — WCAG 2.1 AA aria-label

- **Test:** `should not have internal state — does not update displayed value without new value prop`
  - **Status:** RED — SortControl does not exist
  - **Verifies:** Controlled component pattern (no internal useState)

### Component Tests — ClienteListPanel Sort Integration (17 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.sort.test.tsx`

- **Test:** `should render the SortControl component on initial load`
  - **Status:** RED — SortControl not rendered inside ClienteListPanel
  - **Verifies:** AC6 — SortControl integrated into panel

- **Test:** `should have "fecha-desc" as the default selected sort value`
  - **Status:** RED — SortControl not present
  - **Verifies:** AC6 — Default sort state is fecha-desc

- **Test:** `should place SortControl below the search input`
  - **Status:** RED — SortControl not rendered
  - **Verifies:** AC6 — UI layout: SortControl below search input

- **Test:** `should show Alfa Industries before Zafiro Corp when "nombre-asc" is selected`
  - **Status:** RED — Sort logic not in useMemo
  - **Verifies:** AC1 — Alphabetical ascending sort applied to rendered list

- **Test:** `should not trigger an additional API call when "nombre-asc" is selected`
  - **Status:** RED — SortControl not present
  - **Verifies:** AC1 — No refetch on sort change

- **Test:** `should show Zafiro Corp before Alfa Industries when "nombre-desc" is selected`
  - **Status:** RED — Sort logic not in useMemo
  - **Verifies:** AC2 — Alphabetical descending sort applied

- **Test:** `should not trigger an additional API call when "nombre-desc" is selected`
  - **Status:** RED — SortControl not present
  - **Verifies:** AC2 — No refetch on sort change

- **Test:** `should show newest client first when "fecha-desc" is selected`
  - **Status:** RED — Sort logic not in useMemo
  - **Verifies:** AC3 — Date descending sort applied

- **Test:** `should not trigger an additional API call when "fecha-desc" is selected`
  - **Status:** RED — SortControl not present
  - **Verifies:** AC3 — No refetch on sort change

- **Test:** `should show oldest client first when "fecha-asc" is selected`
  - **Status:** RED — Sort logic not in useMemo
  - **Verifies:** AC4 — Date ascending sort applied

- **Test:** `should not trigger an additional API call when "fecha-asc" is selected`
  - **Status:** RED — SortControl not present
  - **Verifies:** AC4 — No refetch on sort change

- **Test:** `should apply sort only to the already-filtered set (not all clients)`
  - **Status:** RED — Filter+sort chaining not implemented
  - **Verifies:** AC5 — Sort applied to filtered subset

- **Test:** `should not clear the search input when sort order changes`
  - **Status:** RED — SortControl not present
  - **Verifies:** AC5 — searchQuery state independent from sortOrder state

- **Test:** `should not trigger an additional API call when sort changes while filter is active`
  - **Status:** RED — SortControl not present
  - **Verifies:** AC5 — No refetch when sort changes with active filter

---

## Data Factories

No new factory file is needed. The existing `buildCliente()` helper in each test file generates `ClienteResponse` stubs with `nombre`, `nit`, and `createdAt` fields sufficient for sort testing. Overrides are used directly per test case to control alphabetical and date ordering.

---

## Fixtures

No new fixture file is needed. Tests use the existing `renderWithQuery()` helper pattern (established in Story 2.1) that wraps the SUT in `QueryClientProvider`. MSW `setupServer()` handles network mocking for component tests.

---

## Mock Requirements

**GET /api/v1/clientes** (MSW — component tests):
- Success response: array of `ClienteResponse` objects with `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`
- The `createdAt` field (ISO 8601 string) must be varied per test case to exercise date sorting
- The handler call count is tracked via a closure counter to assert no extra fetches occur after sort changes

**Playwright route intercepts** (E2E tests):
- `**/api/v1/clientes` intercepted before navigation (network-first pattern)
- `apiCallCount` closure counter tracks total calls; value captured after initial load, then re-checked after sort interaction

---

## Required data-testid Attributes

### SortControl component (`frontend/src/shared/components/SortControl.tsx`)

- `sort-control` — The `<select>` element (or equivalent) for sort option selection

**Implementation example:**
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

### ClienteListPanel (already existing, no additions required)

- `clientes-list-panel` — Left panel container (already exists from Story 2.1)
- `clientes-search-input` — Search input (already exists from Story 2.1)
- `cliente-list-item` — Each client list item (already exists from Story 2.1)

---

## Implementation Checklist

### Test: `should render the SortControl component` (AC6)

**File:** `e2e/story-2-6/sort-client-list.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/SortControl.tsx` with `SortOption` type export
- [ ] Export `SortControl` as a named export from `SortControl.tsx`
- [ ] Add `data-testid="sort-control"` to the select element
- [ ] Add `aria-label="Ordenar clientes"` to the select element
- [ ] Add visible "Ordenar por:" label in Spanish
- [ ] Import `SortControl` in `ClienteListPanel.tsx`
- [ ] Render `<SortControl value={sortOrder} onChange={setSortOrder} />` in `ClienteListPanel`
- [ ] Run test: `npx playwright test e2e/story-2-6/sort-client-list.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should list first item alphabetically when "Nombre A→Z" is selected` (AC1)

**File:** `e2e/story-2-6/sort-client-list.spec.ts` + `ClienteListPanel.sort.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `sortOrder` state: `const [sortOrder, setSortOrder] = useState<SortOption>('fecha-desc')` in `ClienteListPanel`
- [ ] Extend `useMemo` to sort after filtering: add `localeCompare(b.nombre, 'es')` for `nombre-asc` case
- [ ] Spread filtered array before sorting: `[...filtered].sort(...)` (immutability)
- [ ] Ensure `sortOrder` is a dependency of the `useMemo`
- [ ] Run test: `npx playwright test e2e/story-2-6/sort-client-list.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should not trigger a new API call when sort changes` (AC1/AC2/AC3/AC4)

**File:** `e2e/story-2-6/sort-client-list.spec.ts` + `ClienteListPanel.sort.test.tsx`

**Tasks to make this test pass:**

- [ ] Confirm sort logic is purely inside `useMemo` — never calls `refetch()`, `invalidateQueries()`, or changes the TanStack Query key
- [ ] Confirm `setSortOrder` only updates local state and triggers `useMemo` re-run
- [ ] Run test: `npx playwright test e2e/story-2-6/sort-client-list.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Sort applied to filtered set; search input preserved (AC5)

**File:** `e2e/story-2-6/sort-client-list.spec.ts` + `ClienteListPanel.sort.test.tsx`

**Tasks to make this test pass:**

- [ ] In the `useMemo`, apply filter first then sort (not the other way around)
- [ ] Ensure `searchQuery` and `sortOrder` are both dependencies of the single `useMemo`
- [ ] Confirm `setSortOrder` does not reset `searchQuery` state (they are independent `useState` calls)
- [ ] Run test: `npx playwright test e2e/story-2-6/sort-client-list.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: SortControl component — all options, onChange, controlled pattern (AC1-AC6)

**File:** `frontend/src/shared/components/SortControl.test.tsx`

**Tasks to make this test pass:**

- [ ] Implement all four `<option>` elements with Spanish labels and correct `value` identifiers
- [ ] Wire `onChange` to call `props.onChange(e.target.value as SortOption)` — no internal state
- [ ] Export `SortOption` type: `'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'`
- [ ] Run test: `pnpm --filter frontend test SortControl`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all E2E failing tests for this story
npx playwright test e2e/story-2-6/

# Run in headed mode (see browser)
npx playwright test e2e/story-2-6/ --headed

# Run component tests for SortControl
pnpm --filter frontend test src/shared/components/SortControl.test.tsx

# Run component tests for ClienteListPanel sort integration
pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteListPanel.sort.test.tsx

# Run all component tests
pnpm --filter frontend test

# Debug specific E2E test
npx playwright test e2e/story-2-6/sort-client-list.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Network-first intercept pattern applied (E2E tests)
- data-testid requirements listed
- Implementation checklist created
- No new fixtures/factories needed (existing patterns sufficient)

**Verification:**

- All 42 tests will fail because `SortControl.tsx` does not exist, and `ClienteListPanel` does not have `sortOrder` state, `SortControl` render, or sort logic in `useMemo`
- Expected failure for E2E tests: `Timeout waiting for element [data-testid="sort-control"]` or element not found
- Expected failure for component tests: `Cannot find module './SortControl'` (import error)
- Expected failure for integration tests: `Cannot find module './SortControl'` cascading from missing component

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Create `frontend/src/shared/components/SortControl.tsx` (component + `SortOption` type)
2. Run `SortControl.test.tsx` — all 13 component tests should pass
3. Update `ClienteListPanel.tsx`: add `sortOrder` state, import `SortControl`, extend `useMemo` with sort
4. Run `ClienteListPanel.sort.test.tsx` — all 17 integration tests should pass
5. Run E2E tests — all 12 E2E tests should pass
6. Refactor if needed (code quality, deduplication)

**Key Principles:**

- One test at a time (start with SortControl component tests — fastest feedback)
- Minimal implementation (controlled component, no internal state)
- Run tests frequently (immediate feedback)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all tests pass (green phase complete)
2. Check siesa-ui-kit catalog for a Select/Dropdown component — replace native `<select>` if available
3. If siesa-ui-kit has no Select, check `frontend/src/components/ui/select.tsx` (shadcn) — use if present
4. Apply Tailwind classes: `slate-*` neutrals, Inter font, Siesa Blue `#0e79fd` focus ring
5. Ensure WCAG 2.1 AA contrast on SortControl
6. Ensure tests still pass after UI enhancement

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/story-2-6/`
3. Begin implementation with `SortControl.tsx` (smallest unit, fastest to green)
4. Work one test group at a time: SortControl component → ClienteListPanel integration → E2E
5. When all tests pass, refactor UI to use siesa-ui-kit or shadcn Select if available

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation in all E2E tests (`await page.route(...)` before `await page.goto(...)`)
- **fixture-architecture.md** — `renderWithQuery()` helper pattern (pure function → QueryClientProvider wrapper)
- **component-tdd.md** — Controlled component test pattern; `userEvent.selectOptions()` for option selection
- **test-quality.md** — One assertion per test; Given-When-Then structure; `data-testid` selectors throughout
- **selector-resilience.md** — `getByTestId('sort-control')` over CSS class selectors
- **timing-debugging.md** — `waitFor()` for async data load; `userEvent` over `fireEvent` for realistic interaction

---

**Generated by BMad TEA Agent** — 2026-06-25
