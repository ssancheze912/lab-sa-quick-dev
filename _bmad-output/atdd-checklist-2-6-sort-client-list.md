# ATDD Checklist - Epic 2, Story 2.6: Sort Client List

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + React Testing Library — 100% frontend/presentation scope, zero backend footprint)

---

## Story Summary

As a commercial team member, I want to sort the client list by different criteria, so that I can organize my view and quickly find clients based on how I prioritize them. Sorting is a pure client-side concern over the already-fetched TanStack Query cache — it must never trigger a new API call, and it must compose correctly with the existing search filter (sort applies only to the already-filtered subset).

**As a** commercial team member
**I want** to sort the client list by different criteria
**So that** I can organize my view and quickly find clients based on how I prioritize them

---

## Acceptance Criteria

1. Given the client list is loaded with at least two clients, when the user selects "Nombre A→Z" from `SortControl`, then the list reorders alphabetically ascending by `nombre` without triggering a new API call (TC-E2-P1-12, R5).
2. Given the client list is loaded, when the user selects "Nombre Z→A", then the list reorders alphabetically descending by `nombre` without a new API call (TC-E2-P1-12, R5).
3. Given the client list is loaded, when the user selects "Más reciente", then the list orders by `createdAt` descending (newest first) without a new API call (TC-E2-P1-12, R5).
4. Given the client list is loaded, when the user selects "Más antiguo", then the list orders by `createdAt` ascending (oldest first) without a new API call (TC-E2-P1-12, R5).
5. Given an active search filter narrows the list, when the user changes the sort order, then the sort applies only to the filtered subset (excluded clients never reappear) and the search input retains its typed value (TC-E2-P1-13, R5).
6. Given `SortControl` renders on initial page load with no prior sort preference, when the list first renders, then the default sort order is "Más reciente" (`fecha-desc`), both visually selected in `SortControl` and reflected in the list order (TC-E2-P1-14).

---

## Failing Tests Created (RED Phase)

### Component Tests (23 tests across 2 files)

#### File: `frontend/src/shared/components/SortControl.test.tsx` (140 lines, 10 tests)

Isolated component contract — does not depend on `ClienteListView`/network.

- **Test:** `should render the "Nombre A→Z" option`
  - **Status:** RED — `Failed to resolve import "./SortControl"` (component file does not exist)
- **Test:** `should render the "Nombre Z→A" option` — RED, same reason
- **Test:** `should render the "Más reciente" option` — RED, same reason
- **Test:** `should render the "Más antiguo" option` — RED, same reason
  - **Verifies:** all 4 fixed Spanish-labeled options are present in the `siesa-ui-kit` `Select` options list, in the order specified by the epic
- **Test:** `should call onChange with "nombre-asc" when "Nombre A→Z" is selected` — RED, same reason
- **Test:** `should call onChange with "nombre-desc" when "Nombre Z→A" is selected` — RED, same reason
- **Test:** `should call onChange with "fecha-desc" when "Más reciente" is selected` — RED, same reason
- **Test:** `should call onChange with "fecha-asc" when "Más antiguo" is selected` — RED, same reason
  - **Verifies:** selecting each option calls the controlled `onChange(value: SortOption)` prop with the correct fixed union value
- **Test:** `should reflect "nombre-asc" as the visually selected option when passed as value` — RED, same reason
- **Test:** `should reflect "fecha-desc" as the visually selected option when passed as value` — RED, same reason
  - **Verifies:** the controlled `value` prop drives the visually-displayed selection on the closed trigger (`data-testid="sort-control"`)

#### File: `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.sort.test.tsx` (~340 lines, 13 tests)

Integration-level: `ClienteListView` + `SortControl` + `useClientes()` cache + search filter, via MSW.

- **AC #1** — `should reorder the list alphabetically ascending by nombre` — RED: `Unable to find an element by: [data-testid="sort-control"]` (SortControl not wired into `ClienteListView` yet)
- **AC #1** — `should NOT trigger a new API call when sorting by "Nombre A→Z"` — RED, same reason
- **AC #2** — `should reorder the list alphabetically descending by nombre` — RED, same reason
- **AC #2** — `should NOT trigger a new API call when sorting by "Nombre Z→A"` — RED, same reason
- **AC #3** — `should reorder the list with the newest createdAt first` — RED, same reason
- **AC #3** — `should NOT trigger a new API call when sorting by "Más reciente"` — RED, same reason
- **AC #4** — `should reorder the list with the oldest createdAt first` — RED, same reason
- **AC #4** — `should NOT trigger a new API call when sorting by "Más antiguo"` — RED, same reason
- **AC #5 (R5)** — `should reorder only the filtered subset, never reintroducing excluded clients` — RED, same reason
- **AC #5 (R5)** — `should retain the typed search input value after changing the sort order` — RED, same reason
- **AC #6** — `should display "Más reciente" as the selected SortControl option on initial render` — RED, same reason
- **AC #6** — `should render the initial list order newest-createdAt-first by default` — RED: currently fails on an `AssertionError` (list renders in raw API/fetch order — no default sort applied yet), confirming the failure is behavioral, not a missing-element crash
- **Cache integrity** — `should preserve the original fetched array order in the ClienteListView list after a sort interaction re-renders` — RED: same missing-element reason; guards against the `Array.prototype.sort` in-place-mutation regression called out in Task 2 (sorting must copy the array, never mutate the TanStack Query cache's cached reference)

**RED phase verified:** ran `npx vitest run` for both files — 13/13 + component-level assertions confirmed failing for the correct reason (missing `SortControl` module / missing `data-testid="sort-control"` in the DOM), zero false-passes.

---

## Data Factories Created

No new factories required. Reused the existing `Cliente` factory from Story 2.1:

**File:** `frontend/src/test/factories/cliente.factory.ts` (pre-existing, unmodified)

**Exports used:**

- `createCliente(overrides?)` — used throughout with explicit `nombre`/`createdAt` overrides to guarantee deterministic, distinctly-sortable values (factory defaults use `faker.date.recent({ days: 30 })`, which does not guarantee distinct/ordered values across calls)
- `createClientes(count, overrides?)` — used for "no new API call" assertions where exact `nombre`/`createdAt` values are irrelevant

---

## Fixtures Created

No new fixtures required. Reused existing test support:

- `renderWithRouter(ui, { initialPath, withQueryClient })` — `frontend/src/test/support/renderWithRouter.tsx` (pre-existing)
- MSW `server` + `CLIENTES_ENDPOINT` — `frontend/src/test/msw/server.ts` / `handlers.ts` (pre-existing)

No fixture-level auto-cleanup is required beyond what MSW's `server.resetHandlers()` (global `afterEach`, per `frontend/src/test/setup.ts`) already provides — this story introduces zero new external state.

---

## Mock Requirements

No external services require new mocking. `GET /api/v1/clientes` (Story 2.1's existing MSW handler) is reused unmodified; individual tests override it via `server.use(...)` (network-first pattern) purely to control the `nombre`/`createdAt` ordering of the returned array — the endpoint's contract itself is unchanged by this story.

**Request-count spy pattern** (for the "no new API call" assertions, AC #1-#4):

```typescript
let requestCount = 0
server.use(
  http.get(CLIENTES_ENDPOINT, () => {
    requestCount += 1
    return HttpResponse.json(createClientes(3), { status: 200 })
  }),
)
// ... render, capture countAfterInitialLoad, interact, assert requestCount unchanged
```

---

## Required data-testid Attributes

### SortControl (new component, `frontend/src/shared/components/SortControl.tsx`)

- `sort-control` — root/wrapper element around the `siesa-ui-kit` `Select`; used both to open the options menu (`user.click`) and to read the currently-displayed label via `toHaveTextContent`

### ClienteListView (existing, no new testids needed)

- `cliente-search-input` (pre-existing, Story 2.1) — read/asserted for AC #5's "search value is retained" check
- `cliente-list-item` (pre-existing, Story 2.1) — DOM order is asserted after each sort interaction

**Implementation note:** the underlying `siesa-ui-kit` `Select` is built on Headless UI's `Listbox` — its trigger is a plain `<button>` (opened via click) and, once open, renders options with `role="option"`. Tests interact exclusively through `data-testid="sort-control"` + ARIA `option` roles, never through Headless UI/siesa-ui-kit internal classes, per selector-resilience.md's data-testid > ARIA > CSS hierarchy.

```tsx
<div data-testid="sort-control">
  <Select options={options} value={value} onChange={(v) => onChange(v as SortOption)} ariaLabel="Ordenar lista de clientes" />
</div>
```

---

## Implementation Checklist

### Test: SortControl renders all 4 options + reflects controlled value + calls onChange correctly

**File:** `frontend/src/shared/components/SortControl.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/SortControl.tsx`
- [ ] Import `Select` (and `SelectOption` type) from `siesa-ui-kit`
- [ ] Define and export `type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'`
- [ ] Define `options` array in the exact order: Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo
- [ ] Props: `value: SortOption` (controlled), `onChange: (value: SortOption) => void`
- [ ] Wire `Select`'s `value`/`onChange` (cast `string | number` → `SortOption`), pass `ariaLabel="Ordenar lista de clientes"`
- [ ] Add `data-testid="sort-control"` on the wrapping element
- [ ] Run test: `npx vitest run src/shared/components/SortControl.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: ClienteListView sort integration (AC #1-#6 + cache integrity)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.sort.test.tsx`

**Tasks to make this test pass:**

- [ ] In `ClienteListView.tsx`, add `const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')`
- [ ] Extend the existing `filteredClientes` `useMemo` to filter THEN sort (single pipeline, `sortOption` added to the dependency array)
- [ ] Implement the 4 pure comparators (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`) per the story's Task 2 spec
- [ ] Sort a COPY of the filtered array (`[...filtered].sort(...)`) — never mutate `useClientes()`'s cached `data` reference
- [ ] Render `<SortControl value={sortOption} onChange={setSortOption} />` in the existing toolbar row, between the search input and "Nuevo cliente"
- [ ] Do NOT add any new `useQuery`/`refetch` call; `useClientes()`'s `queryKey: ['clientes']` must remain unchanged
- [ ] Run test: `npx vitest run src/modules/crm/clientes/presentation/components/ClienteListView.sort.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all failing tests for this story
cd frontend && npx vitest run src/shared/components/SortControl.test.tsx src/modules/crm/clientes/presentation/components/ClienteListView.sort.test.tsx

# Run specific test file
cd frontend && npx vitest run src/shared/components/SortControl.test.tsx

# Run tests in watch mode (see re-runs as you implement)
cd frontend && npx vitest src/shared/components/SortControl.test.tsx

# Run the full frontend suite (regression guard)
cd frontend && npx vitest run
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 23 tests written and failing (10 in `SortControl.test.tsx`, 13 in `ClienteListView.sort.test.tsx`)
- ✅ No new fixtures/factories needed — reused Story 2.1's `cliente.factory.ts`, `renderWithRouter`, MSW `server`
- ✅ Mock requirements documented (request-count spy pattern for "no new API call" assertions)
- ✅ `data-testid="sort-control"` requirement documented
- ✅ Implementation checklist created

**Verification:** ran `npx vitest run` for both files — all 23 tests fail; 22 fail with `Unable to find an element` / `Failed to resolve import` (missing implementation), 1 fails with a behavioral `AssertionError` (no default sort applied) — all failures are due to missing implementation, none are test bugs.

### GREEN Phase (DEV Team - Next Steps)

1. Pick one failing test from the implementation checklist (start with `SortControl.test.tsx` — it has no dependency on `ClienteListView`)
2. Implement `SortControl.tsx` per Task 1 of the story
3. Run `SortControl.test.tsx` to verify green
4. Implement Task 2 (wire sort state + sorting logic into `ClienteListView.tsx`)
5. Run `ClienteListView.sort.test.tsx` to verify green
6. Run the full frontend suite to confirm no regressions in `ClienteListView.test.tsx` / `.performance.test.tsx` / `.edge-cases.test.tsx` / `.create-trigger.test.tsx`

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 23 new tests pass, plus the full existing `ClienteListView`/`ClienteDetailView`/`ClienteForm` suites remain green
2. Review the `filteredClientes` memo for readability (comparator extraction is optional per the story's Dev Notes)
3. Confirm zero new `console.error`/`console.warn` (NFR6 — matches the existing `startIcon` DOM-prop-warning precedent already worked around in this file)
4. Ensure tests still pass after any refactor

---

## Next Steps

1. Share this checklist and the 2 failing test files with the dev workflow (manual handoff)
2. Run `cd frontend && npx vitest run src/shared/components/SortControl.test.tsx src/modules/crm/clientes/presentation/components/ClienteListView.sort.test.tsx` to confirm RED phase locally
3. Begin implementation using the Implementation Checklist above (Task 1 → Task 2)
4. Work one test at a time (red → green for each)
5. When all 23 tests pass, refactor code for quality
6. When refactoring is complete, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **data-factories.md** — reused `createCliente`/`createClientes` with explicit overrides for deterministic sort ordering (factory defaults don't guarantee distinct/ordered values)
- **network-first.md** — every `server.use(...)` override registered before `renderWithRouter` triggers the initial fetch; request-count spy pattern for the "no new API call" assertions (AC #1-#4)
- **selector-resilience.md** — `data-testid="sort-control"` as the primary selector, `role="option"` (ARIA, from the underlying Headless UI `Listbox`) as the secondary hierarchy level; zero CSS-class selectors
- **test-quality.md** — one specific behavior asserted per test (list order OR request count, never both in one assertion block); sort tests isolated in a dedicated `.sort.test.tsx` file, mirroring the existing `.performance.test.tsx`/`.edge-cases.test.tsx` precedent in this module
- **component-tdd.md** — component test (`SortControl.test.tsx`) isolated from integration test (`ClienteListView.sort.test.tsx`); controlled-component contract (`value`/`onChange`) verified independently of any parent wiring

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `cd frontend && npx vitest run src/shared/components/SortControl.test.tsx src/modules/crm/clientes/presentation/components/ClienteListView.sort.test.tsx`

**Summary:**

- Total tests: 23 (10 + 13)
- Passing: 0 (expected)
- Failing: 23 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- `SortControl.test.tsx` (all 10 tests): `Error: Failed to resolve import "./SortControl" from "src/shared/components/SortControl.test.tsx". Does the file exist?`
- `ClienteListView.sort.test.tsx` (12 of 13 tests): `TestingLibraryElementError: Unable to find an element by: [data-testid="sort-control"]`
- `ClienteListView.sort.test.tsx` (`should render the initial list order newest-createdAt-first by default`): `AssertionError: expected [ 'Cliente Intermedio', …(2) ] to deeply equal [ 'Cliente Reciente', …(2) ]` — the list renders in raw fetch order today since no default sort exists yet, confirming a genuine behavioral gap rather than a crash

---

## Notes

- This story is 100% frontend/presentation-layer — no backend tests required (confirmed against Dev Notes' scope boundary: `GET /api/v1/clientes` is unmodified).
- No E2E (Playwright) tests were added for this story: the epic's test-design document (`test-design-epic-2.md`) classifies TC-E2-P1-12/13/14 as **Component**-level tests, and sorting is a pure in-memory/client-side concern best verified at the component level (per test-levels-framework.md's guidance to avoid duplicate coverage across levels).
- `ClientListItem.tsx` does not expose a dedicated `data-testid` for the `nombre` field; the sort-order assertions read the item's first rendered paragraph (`getAllByRole('paragraph')[0]`) instead of introducing an out-of-scope change to that component.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `./bmm/docs/tea-README.md` for workflow documentation
- Consult `./bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-07-01
