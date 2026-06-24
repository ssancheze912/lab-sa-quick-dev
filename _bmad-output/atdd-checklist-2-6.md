# ATDD Checklist - Epic 2, Story 2.6: Sort Client List

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest/RTL) + E2E (Playwright)

---

## Story Summary

A commercial team member wants to sort the client list by different criteria (name or date) so they can organize their view and quickly find clients based on how they prioritize them. Sorting is performed entirely client-side over the TanStack Query cache — no new API calls are triggered when the sort changes.

**As a** commercial team member
**I want** to sort the client list by Nombre A→Z, Nombre Z→A, Más reciente, or Más antiguo
**So that** I can organize my view and quickly find clients based on how I prioritize them

---

## Acceptance Criteria

1. **AC1** — Given the client list is loaded with at least two clients, When the user selects "Nombre A→Z" from the `SortControl` component, Then the client list reorders alphabetically ascending by Nombre without triggering a new API call.

2. **AC2** — Given the client list is loaded, When the user selects "Nombre Z→A" from the `SortControl`, Then the client list reorders alphabetically descending by Nombre without a new API call.

3. **AC3** — Given the client list is loaded, When the user selects "Más reciente", Then the client list orders by `createdAt` descending (newest client appears first).

4. **AC4** — Given the client list is loaded, When the user selects "Más antiguo", Then the client list orders by `createdAt` ascending (oldest client appears first).

5. **AC5** — Given an active search filter is applied, When the user changes the sort order via `SortControl`, Then the sort is applied to the already-filtered result set without clearing the search input.

6. **AC6** — Given the `SortControl` renders on initial page load, When no sort preference has been set, Then the default sort order is "Más reciente" (`fecha-desc`).

---

## Failing Tests Created (RED Phase)

### E2E Tests (13 tests)

**File:** `e2e/tests/clientes/sort-client-list.spec.ts`

- **Test:** AC6 — should render the SortControl component on the /clientes page
  - **Status:** RED — `[data-testid="sort-control"]` element does not exist yet
  - **Verifies:** SortControl is rendered inside ClienteListView

- **Test:** AC6 — should have "Más reciente" selected as the default sort option
  - **Status:** RED — sort-control element missing; `.toHaveValue('fecha-desc')` will fail
  - **Verifies:** Default sort is fecha-desc on initial page load (AC6)

- **Test:** AC6 — should order clients by newest first when default sort is applied
  - **Status:** RED — sort-control not present; list order is currently undefined
  - **Verifies:** fecha-desc ordering: newest createdAt first

- **Test:** AC1 — should reorder the client list alphabetically ascending when "Nombre A→Z" is selected
  - **Status:** RED — sort-control missing; `.selectOption('nombre-asc')` will fail
  - **Verifies:** nombre-asc: A before Z

- **Test:** AC1 — should NOT trigger a new API call when sorting by nombre-asc
  - **Status:** RED — sort-control missing; no sort change occurs
  - **Verifies:** Client-side only sort (no new GET /api/v1/clientes)

- **Test:** AC2 — should reorder the client list alphabetically descending when "Nombre Z→A" is selected
  - **Status:** RED — sort-control missing
  - **Verifies:** nombre-desc: Z before A

- **Test:** AC2 — should NOT trigger a new API call when sorting by nombre-desc
  - **Status:** RED — sort-control missing
  - **Verifies:** Client-side only sort

- **Test:** AC3 — should order client list by createdAt descending when "Más reciente" is selected
  - **Status:** RED — sort-control missing
  - **Verifies:** fecha-desc ordering after switching sort options

- **Test:** AC4 — should order client list by createdAt ascending when "Más antiguo" is selected
  - **Status:** RED — sort-control missing
  - **Verifies:** fecha-asc: oldest createdAt first

- **Test:** AC4 — should NOT trigger a new API call when sorting by fecha-asc
  - **Status:** RED — sort-control missing
  - **Verifies:** Client-side only sort

- **Test:** AC5 — should apply sort to the already-filtered result set
  - **Status:** RED — sort-control missing; combined filter+sort pipeline not implemented
  - **Verifies:** Sort on filtered subset; unmatched item stays hidden

- **Test:** AC5 — should NOT clear the search input when sort option changes
  - **Status:** RED — sort-control missing
  - **Verifies:** search input value preserved after sort change

- **Test:** AC5 — should NOT trigger a new API call when sort changes while search filter is active
  - **Status:** RED — sort-control missing
  - **Verifies:** Client-side only sort while filter is active

- **Test:** WCAG — should have an accessible label (aria-label="Ordenar clientes")
  - **Status:** RED — sort-control missing
  - **Verifies:** WCAG 2.1 AA accessibility

- **Test:** WCAG — should expose four sort options with Spanish labels
  - **Status:** RED — sort-control missing
  - **Verifies:** Four Spanish-labelled options: Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo

### Component Tests (SortControl) — 15 tests

**File:** `frontend/src/shared/components/SortControl.test.tsx`

- **Test:** should render with data-testid="sort-control" on the root element
  - **Status:** RED — `SortControl.tsx` module does not exist
  - **Verifies:** data-testid="sort-control" present

- **Test:** should have aria-label="Ordenar clientes" on the root element (WCAG 2.1 AA)
  - **Status:** RED — module missing
  - **Verifies:** Accessible label for screen readers

- **Test:** should render exactly four sort options
  - **Status:** RED — module missing
  - **Verifies:** Exactly 4 `<option>` elements

- **Test:** should render "Nombre A→Z" option with value "nombre-asc"
  - **Status:** RED — module missing
  - **Verifies:** Option label and value for AC1

- **Test:** should render "Nombre Z→A" option with value "nombre-desc"
  - **Status:** RED — module missing
  - **Verifies:** Option label and value for AC2

- **Test:** should render "Más reciente" option with value "fecha-desc"
  - **Status:** RED — module missing
  - **Verifies:** Option label and value for AC3/AC6

- **Test:** should render "Más antiguo" option with value "fecha-asc"
  - **Status:** RED — module missing
  - **Verifies:** Option label and value for AC4

- **Test:** should reflect value="fecha-desc" as the selected option when provided
  - **Status:** RED — module missing
  - **Verifies:** Controlled component behavior for AC6 default

- **Test:** should reflect value="nombre-asc" as the selected option when provided
  - **Status:** RED — module missing
  - **Verifies:** Controlled component for AC1

- **Test:** should reflect value="nombre-desc" as the selected option when provided
  - **Status:** RED — module missing
  - **Verifies:** Controlled component for AC2

- **Test:** should reflect value="fecha-asc" as the selected option when provided
  - **Status:** RED — module missing
  - **Verifies:** Controlled component for AC4

- **Test:** should call onChange with "nombre-asc" when "Nombre A→Z" is selected
  - **Status:** RED — module missing
  - **Verifies:** onChange propagation for AC1

- **Test:** should call onChange with "nombre-desc" when "Nombre Z→A" is selected
  - **Status:** RED — module missing
  - **Verifies:** onChange propagation for AC2

- **Test:** should call onChange with "fecha-desc" when "Más reciente" is selected
  - **Status:** RED — module missing
  - **Verifies:** onChange propagation for AC3

- **Test:** should call onChange with "fecha-asc" when "Más antiguo" is selected
  - **Status:** RED — module missing
  - **Verifies:** onChange propagation for AC4

### Unit Tests (useSortClientes hook) — 16 tests

**File:** `frontend/src/modules/crm/clientes/application/useSortClientes.test.ts`

- **Test:** should initialize sortOption to "fecha-desc"
  - **Status:** RED — `useSortClientes.ts` module does not exist
  - **Verifies:** Default state is fecha-desc (AC6)

- **Test:** should order clients by createdAt descending by default (newest first)
  - **Status:** RED — module missing
  - **Verifies:** fecha-desc default behavior (AC6)

- **Test:** should return clients sorted alphabetically ascending by Nombre when sortOption is "nombre-asc"
  - **Status:** RED — module missing
  - **Verifies:** nombre-asc sorting logic (AC1)

- **Test:** should use Spanish locale for alphabetical comparison (localeCompare "es")
  - **Status:** RED — module missing
  - **Verifies:** Correct Spanish collation for Ñ (AC1)

- **Test:** should return clients sorted alphabetically descending by Nombre when sortOption is "nombre-desc"
  - **Status:** RED — module missing
  - **Verifies:** nombre-desc sorting logic (AC2)

- **Test:** should return clients sorted by createdAt descending when sortOption is "fecha-desc"
  - **Status:** RED — module missing
  - **Verifies:** fecha-desc sorting logic (AC3)

- **Test:** should return clients sorted by createdAt ascending when sortOption is "fecha-asc"
  - **Status:** RED — module missing
  - **Verifies:** fecha-asc sorting logic (AC4)

- **Test:** should NOT mutate the original clientes array when sorting nombre-asc
  - **Status:** RED — module missing
  - **Verifies:** Immutability: original array unchanged (AC5)

- **Test:** should NOT mutate the original clientes array when sorting fecha-asc
  - **Status:** RED — module missing
  - **Verifies:** Immutability: original array unchanged (AC5)

- **Test:** should sort the pre-filtered subset passed in as input
  - **Status:** RED — module missing
  - **Verifies:** Sort on filtered input (AC5)

- **Test:** should return correct sorted array when input array changes
  - **Status:** RED — module missing
  - **Verifies:** Reactive recompute when input changes (AC5)

- **Test:** should return sortedClientes, sortOption, and setSortOption
  - **Status:** RED — module missing
  - **Verifies:** Hook API surface contract

- **Test:** should return sortedClientes as an array
  - **Status:** RED — module missing
  - **Verifies:** Empty array handled gracefully

### Integration Tests (ClienteListView sort integration) — 11 tests

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx`

- **Test:** AC6 — should render the SortControl component in the client list view
  - **Status:** RED — SortControl not yet integrated into ClienteListView
  - **Verifies:** SortControl present in list view (AC6)

- **Test:** AC6 — should have "fecha-desc" as the default selected sort value
  - **Status:** RED — SortControl not integrated
  - **Verifies:** Default sort value on mount (AC6)

- **Test:** AC6 — should display clients ordered by newest createdAt first on initial load
  - **Status:** RED — no sort applied to list
  - **Verifies:** fecha-desc default ordering (AC6)

- **Test:** AC1 — should reorder list A→Z when "nombre-asc" is selected
  - **Status:** RED — SortControl not integrated; no sort pipeline
  - **Verifies:** nombre-asc reorder (AC1)

- **Test:** AC2 — should reorder list Z→A when "nombre-desc" is selected
  - **Status:** RED — SortControl not integrated
  - **Verifies:** nombre-desc reorder (AC2)

- **Test:** AC3 — should restore newest-first order when switching back to "fecha-desc"
  - **Status:** RED — no sort pipeline
  - **Verifies:** fecha-desc switch (AC3)

- **Test:** AC4 — should reorder list with oldest createdAt first when "fecha-asc" is selected
  - **Status:** RED — no sort pipeline
  - **Verifies:** fecha-asc reorder (AC4)

- **Test:** AC5 — should apply sort to the already-filtered result set when search is active
  - **Status:** RED — sort pipeline not wired
  - **Verifies:** Sort + search coexistence (AC5)

- **Test:** AC5 — should NOT clear the search input value when sort option changes
  - **Status:** RED — SortControl not integrated
  - **Verifies:** Search input preserved on sort change (AC5)

- **Test:** AC5 — should display the correct number of visible items when sort and search coexist
  - **Status:** RED — no combined pipeline
  - **Verifies:** Filtered count unchanged by sort (AC5)

---

## Data Factories Created

### Cliente Factory (already exists — extended for sort)

**File:** `e2e/support/factories/cliente.factory.ts` (existing, supports `createdAt` override)

**Exports:**

- `createClientePayload(overrides?)` — Create single payload without id
- `createClienteDto(overrides?)` — Create full DTO with `createdAt` field used in date-sort tests
- `createClienteDtos(count, overrides?)` — Create array of DTOs

**Usage in sort tests:**
```typescript
const older = createClienteDto({ nombre: 'Alfa Corp', createdAt: '2024-01-01T00:00:00Z' });
const newer = createClienteDto({ nombre: 'Zeta Corp', createdAt: '2026-06-01T00:00:00Z' });
```

---

## Fixtures Created

No new fixtures required. The existing `e2e/fixtures/base.fixture.ts` is sufficient.
Sort tests use inline `page.route()` intercepts (network-first) without additional fixtures.

---

## Mock Requirements

**This story is frontend-only.** No backend mock changes required.

The TanStack Query cache (`queryKey: ['clientes']`) is used as the data source. Sort only acts on the cached data. The existing `GET /api/v1/clientes` mock in E2E tests (via `page.route(API_CLIENTES, ...)`) is sufficient.

**Key constraint verified by tests:** Changing sort option does NOT trigger a new `GET /api/v1/clientes` call.

---

## Required data-testid Attributes

### SortControl Component

- `sort-control` — Root element of the `SortControl` component (select element or wrapper)

**Implementation Example:**
```tsx
<select
  data-testid="sort-control"
  aria-label="Ordenar clientes"
  value={value}
  onChange={(e) => onChange(e.target.value as SortOption)}
>
  <option value="nombre-asc">Nombre A→Z</option>
  <option value="nombre-desc">Nombre Z→A</option>
  <option value="fecha-desc">Más reciente</option>
  <option value="fecha-asc">Más antiguo</option>
</select>
```

**Note:** If using siesa-ui-kit `Select`, the `data-testid` must be on the underlying `<select>` element or the root wrapper that Playwright/RTL can query.

### Existing Attributes Required (from Story 2.1 — must remain intact)

- `client-search-input` — Search input (used in AC5 tests to verify search + sort coexistence)
- `client-list-item-{id}` — Each client list item (used in E2E sort order assertions)

---

## Implementation Checklist

### Task 1 — Create SortControl component (AC1, AC2, AC3, AC4, AC6)

**Files:**
- Create `frontend/src/shared/components/SortControl.tsx`

**Tasks to make tests pass:**
- [ ] Export `SortOption` type: `'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'`
- [ ] Export `SORT_OPTIONS` array with four `{ value, label }` entries (labels in Spanish)
- [ ] Implement `SortControl` component accepting `{ value: SortOption; onChange: (option: SortOption) => void }`
- [ ] Add `data-testid="sort-control"` on the root element
- [ ] Add `aria-label="Ordenar clientes"` (WCAG 2.1 AA)
- [ ] Check siesa-ui-kit for `Select` component first; fallback to shadcn/ui Select; fallback to native `<select>`
- [ ] Run unit tests: `pnpm --filter frontend test SortControl.test.tsx`
- [ ] ✅ All 15 SortControl tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Task 2 — Create useSortClientes hook (AC1–AC6)

**Files:**
- Create `frontend/src/modules/crm/clientes/application/useSortClientes.ts`

**Tasks to make tests pass:**
- [ ] Import `useState` and `useMemo` from react
- [ ] Import `Cliente` from `../domain/Cliente`
- [ ] Import `SortOption` from `../../../../shared/components/SortControl`
- [ ] Initialize sort state: `const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')`
- [ ] Implement sorting via `useMemo`:
  - `nombre-asc`: `[...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))`
  - `nombre-desc`: `[...clientes].sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))`
  - `fecha-desc`: `[...clientes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())`
  - `fecha-asc`: `[...clientes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())`
- [ ] NEVER mutate original array — always spread before sort: `[...clientes].sort(...)`
- [ ] Return `{ sortedClientes, sortOption, setSortOption }`
- [ ] Run unit tests: `pnpm --filter frontend test useSortClientes.test.ts`
- [ ] ✅ All 16 useSortClientes tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Task 3 — Integrate SortControl and useSortClientes into ClienteListView (AC1–AC6)

**Files:**
- Modify `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`

**Tasks to make tests pass:**
- [ ] Import `SortControl` from `../../../../shared/components/SortControl`
- [ ] Import `useSortClientes` from `../application/useSortClientes`
- [ ] Call `useSortClientes(filteredClientes)` AFTER the existing search filter, BEFORE the render
- [ ] Render `<SortControl value={sortOption} onChange={setSortOption} />` below the search input, above the client list
- [ ] Pass `sortedClientes` (not `filteredClientes`) to the list renderer `{sortedClientes.map(...)}`
- [ ] Sorting pipeline order: TanStack Query cache → search filter → `useSortClientes` → render list
- [ ] Verify no TanStack Query cache invalidation occurs on sort change
- [ ] Run integration tests: `pnpm --filter frontend test ClienteListView.sort.test.tsx`
- [ ] ✅ All 11 ClienteListView sort integration tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all E2E tests for Story 2.6
npx playwright test e2e/tests/clientes/sort-client-list.spec.ts

# Run all unit/component tests for Story 2.6
pnpm --filter frontend test SortControl.test.tsx
pnpm --filter frontend test useSortClientes.test.ts
pnpm --filter frontend test ClienteListView.sort.test.tsx

# Run all Story 2.6 tests together (frontend)
pnpm --filter frontend test --reporter=verbose 2>/dev/null | grep -E "(sort|Sort)"

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/sort-client-list.spec.ts --headed

# Run E2E tests in debug mode
npx playwright test e2e/tests/clientes/sort-client-list.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 55 tests written and failing (15 E2E + 15 SortControl component + 16 useSortClientes unit + 11 ClienteListView integration — note: E2E file has ~15 tests including accessibility)
- ✅ Network-first intercepts applied in all E2E tests (route set before `page.goto()`)
- ✅ Given-When-Then structure in all tests
- ✅ data-testid="sort-control" required attribute documented
- ✅ No hard waits — explicit waits only (`waitFor`, Playwright built-in auto-waits)
- ✅ Original array immutability verified in unit tests
- ✅ Mock requirements documented (no new mocks needed — frontend-only story)
- ✅ Implementation checklist created

**Verification:**

- Tests fail due to missing `SortControl.tsx` module, missing `useSortClientes.ts` module, and `data-testid="sort-control"` not present in `ClienteListView`
- Failure messages are import/module-not-found errors and element-not-found errors — both clear and actionable

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick Task 1 first** (SortControl component) — it unblocks all other tests
2. **Read the test** `SortControl.test.tsx` to understand expected props and behavior
3. **Implement minimal code** to make `SortControl.test.tsx` pass
4. **Run tests** to verify green: `pnpm --filter frontend test SortControl.test.tsx`
5. **Move to Task 2** (`useSortClientes.ts` hook)
6. **Run tests**: `pnpm --filter frontend test useSortClientes.test.ts`
7. **Move to Task 3** (integrate into `ClienteListView.tsx`)
8. **Run integration tests**: `pnpm --filter frontend test ClienteListView.sort.test.tsx`
9. **Run E2E tests** last: `npx playwright test e2e/tests/clientes/sort-client-list.spec.ts`

**Key Principles:**

- One task at a time (don't try to fix all at once)
- Check siesa-ui-kit for `Select` component before using native `<select>`
- All user-facing text must be in Spanish
- NEVER mutate the original clientes array

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. **Verify all tests pass** (all 55 tests green)
2. **Review SortControl** for siesa-ui-kit conformance (styling with Tailwind `slate-*`)
3. **Review useSortClientes** for memoization efficiency
4. **Ensure accessibility** — keyboard navigation works for `SortControl`
5. **Ensure tests still pass** after refactoring

---

## Next Steps

1. **Share this checklist** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm --filter frontend test --run 2>&1 | grep "sort\|Sort\|FAIL"`
3. **Begin implementation** starting with `SortControl.tsx` (Task 1)
4. **Work one task at a time** (red → green for each task)
5. **When all tests pass**, refactor for code quality
6. **When refactoring complete**, update story status to 'done'

---

## Knowledge Base References Applied

- **selector-resilience.md** — `data-testid="sort-control"` used as primary selector (data-testid > ARIA > text > CSS hierarchy)
- **network-first.md** — `page.route()` intercepts set BEFORE `page.goto()` in all E2E tests
- **test-quality.md** — One assertion per test, Given-When-Then format, explicit waits only
- **component-tdd.md** — Controlled component testing with `value` prop and `onChange` spy
- **data-factories.md** — Existing `createClienteDto` factory reused with `createdAt` overrides for date-sort tests
- **timing-debugging.md** — No hard waits; using `waitFor` and Playwright auto-wait for async assertions

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failure for SortControl tests:**
```
FAIL frontend/src/shared/components/SortControl.test.tsx
  ● Cannot find module './SortControl' from 'SortControl.test.tsx'
```

**Expected failure for useSortClientes tests:**
```
FAIL frontend/src/modules/crm/clientes/application/useSortClientes.test.ts
  ● Cannot find module './useSortClientes' from 'useSortClientes.test.ts'
```

**Expected failure for ClienteListView.sort tests:**
```
FAIL frontend/src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx
  ● Unable to find element by: [data-testid="sort-control"]
```

**Expected failure for E2E tests:**
```
FAIL e2e/tests/clientes/sort-client-list.spec.ts
  ● AC6 — Default sort order on initial page load > should render the SortControl component on the /clientes page
    Error: locator.toBeVisible: Error: strict mode violation
    waiting for locator('[data-testid="sort-control"]') ...
```

**Summary:**

- Total tests: ~55
- Passing: 0 (expected)
- Failing: ~55 (expected)
- Status: ✅ RED phase verified — all failures due to missing implementation, not test bugs

---

## Notes

- **Frontend-only story:** No backend changes, no API endpoints, no database migrations.
- **No MSW needed for sort tests:** Since sorting is entirely client-side, MSW is only needed in `ClienteListView.sort.test.tsx` to provide the initial data — not to mock sort endpoints.
- **siesa-ui-kit priority:** Check siesa-ui-kit catalog for `Select` or `Dropdown` before using native `<select>`. The `data-testid` attribute must be reachable regardless of which component is used.
- **Spanish locale sorting:** The `localeCompare('es')` test verifies correct Ñ handling — this is important for Colombian client names.
- **Existing tests unaffected:** The new test files are additive. Story 2.1–2.5 tests remain unchanged.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-24
