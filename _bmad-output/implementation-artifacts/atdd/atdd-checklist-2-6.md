# ATDD Checklist - Epic 2, Story 6: Sort Client List

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component/Unit

---

## Story Summary

A commercial team member can sort the client list by four criteria: Nombre A→Z, Nombre Z→A, Más reciente (newest first), and Más antiguo (oldest first). Sorting is performed client-side over the TanStack Query in-memory cache — no additional API calls are triggered. Sort state is managed with local React `useState` in `ClienteListPanel`. The `SortControl` component lives at `src/shared/components/SortControl.tsx`. Sorting is chained after the existing search filter so both operations compose correctly (AC5).

**As a** commercial team member
**I want** to sort the client list by different criteria (Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo)
**So that** I can organize my view and quickly find clients based on how I prioritize them

---

## Acceptance Criteria

1. **AC1** — Given the client list is loaded with at least two clients, When the user selects "Nombre A→Z" from the `SortControl` component, Then the client list reorders alphabetically ascending by `nombre` without triggering a new API call.

2. **AC2** — Given the client list is loaded, When the user selects "Nombre Z→A" from the `SortControl`, Then the client list reorders alphabetically descending by `nombre` without a new API call.

3. **AC3** — Given the client list is loaded, When the user selects "Más reciente", Then the client list orders by `createdAt` descending (newest client appears first).

4. **AC4** — Given the client list is loaded, When the user selects "Más antiguo", Then the client list orders by `createdAt` ascending (oldest client appears first).

5. **AC5** — Given an active search filter is applied, When the user changes the sort order via `SortControl`, Then the sort is applied to the already-filtered result set without clearing the search input or triggering a new API call.

6. **AC6** — Given the `SortControl` renders on initial page load, When no sort preference has been set, Then the default sort order is "Más reciente" (`fecha-desc`).

---

## Failing Tests Created (RED Phase)

### E2E Tests — 6 tests

**File:** `e2e/tests/clientes/clientes-sort.spec.ts` (NEW — 218 lines)

- **Test:** E2E-C-28 — seleccionar "Nombre A→Z" reordena la lista ascendente sin nueva llamada a la API
  - **Status:** RED — `SortControl` component not rendered in `ClienteListPanel`; `sortClientes` utility not implemented; `seleccionarOrden('nombre-asc')` will fail because `[data-testid="sort-control"]` does not exist
  - **Verifies:** AC1 — sort ascending by name, no API call (P0)

- **Test:** E2E-C-29 — seleccionar "Nombre Z→A" reordena la lista descendente sin nueva llamada a la API
  - **Status:** RED — same reasons as E2E-C-28
  - **Verifies:** AC2 — sort descending by name, no API call (P0)

- **Test:** E2E-C-30 — seleccionar "Más reciente" ordena por fecha de creación descendente
  - **Status:** RED — `SortControl` and `sortClientes('fecha-desc')` not implemented in `ClienteListPanel`
  - **Verifies:** AC3 — sort by createdAt descending (newest first) (P1)

- **Test:** E2E-C-31 — seleccionar "Más antiguo" ordena por fecha de creación ascendente
  - **Status:** RED — `SortControl` and `sortClientes('fecha-asc')` not implemented in `ClienteListPanel`
  - **Verifies:** AC4 — sort by createdAt ascending (oldest first) (P1)

- **Test:** E2E-C-32 — cambiar el orden con filtro de búsqueda activo preserva el input y aplica el orden solo al conjunto filtrado
  - **Status:** RED — `SortControl` not integrated with `ClienteListPanel`'s search filter `useMemo`; search + sort chaining not implemented (Risk R5)
  - **Verifies:** AC5 — search filter preserved after sort change, no extra API call (P0)

- **Test:** E2E-C-33 — el orden predeterminado al cargar la página es "Más reciente"
  - **Status:** RED — `SortControl` not rendered; default `sortOption` state not wired to `ClienteListPanel` (Risk R10)
  - **Verifies:** AC6 — default sort is `fecha-desc`; newest client appears first on initial load (P2)

### Component / Unit Tests — 9 tests

**File:** `frontend/src/shared/components/__tests__/SortControl.test.tsx` (ALREADY CREATED — 127 lines)

- **Test:** UNIT-C-01 — renders 4 options with correct Spanish labels
  - **Status:** RED — `SortControl.tsx` does not exist yet; import will fail at module resolution
  - **Verifies:** AC1–AC4 — all four sort option labels present in Spanish (P1)

- **Test:** UNIT-C-02 — fires onChange with "nombre-asc" when selecting "Nombre A→Z"
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — onChange fires with correct identifier (P1)

- **Test:** UNIT-C-02b — fires onChange with "nombre-desc" when selecting "Nombre Z→A"
  - **Status:** RED — component not implemented
  - **Verifies:** AC2 — onChange fires with correct identifier (P1)

- **Test:** UNIT-C-03 — shows "Más reciente" selected by default when value="fecha-desc"
  - **Status:** RED — component not implemented
  - **Verifies:** AC6 — default display shows "Más reciente" (P1)

- **Test:** UNIT-C-04 — controlled: value prop updates the displayed selection
  - **Status:** RED — component not implemented
  - **Verifies:** AC6 — controlled component pattern works (P2)

- **Test:** Accessibility — has aria-label "Ordenar clientes"
  - **Status:** RED — component not implemented
  - **Verifies:** WCAG 2.1 AA — accessible label on control element

**File:** `frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts` (ALREADY CREATED — 147 lines)

- **Test:** UNIT-C-05 — nombre-asc: returns clients alphabetically ascending
  - **Status:** RED — `sortClientes.ts` does not exist; import will fail
  - **Verifies:** AC1 — alphabetical ascending sort logic (P1)

- **Test:** UNIT-C-06 — nombre-desc: returns clients alphabetically descending
  - **Status:** RED — `sortClientes.ts` does not exist
  - **Verifies:** AC2 — alphabetical descending sort logic (P1)

- **Test:** UNIT-C-07 — fecha-desc: returns clients newest first by createdAt
  - **Status:** RED — `sortClientes.ts` does not exist
  - **Verifies:** AC3 — date descending sort logic (P1)

- **Test:** UNIT-C-08 — fecha-asc: returns clients oldest first by createdAt
  - **Status:** RED — `sortClientes.ts` does not exist
  - **Verifies:** AC4 — date ascending sort logic (P1)

- **Test:** Immutability — does not mutate the input array
  - **Status:** RED — `sortClientes.ts` does not exist
  - **Verifies:** correctness constraint — spread `[...clientes]` before sort (P1)

---

## POM Extension

**File:** `e2e/pages/clientes.page.ts` (MODIFIED)

Added to constructor:
- `this.sortControl = page.getByTestId('sort-control')` — locator for the SortControl trigger element

Added method:
- `async seleccionarOrden(option: 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc')` — clicks the sort control and selects the matching option using Spanish label pattern matching

---

## Data Factories Used

**File:** `e2e/helpers/data.helper.ts` (existing — no changes needed)

- `buildCliente(overrides?)` — builds a valid cliente payload with unique `nombre`, `nit`, `telefono`, and `ciudad`

**Usage in Story 2.6 tests:**
```typescript
const cZebra = await apiHelper.createCliente(buildCliente({ nombre: 'Zebra Corp SA' }));
const cAlfa = await apiHelper.createCliente(buildCliente({ nombre: 'Alfa Ingeniería SAS' }));
const cMedio = await apiHelper.createCliente(buildCliente({ nombre: 'Medio Distribuciones Ltda' }));
```

---

## Required data-testid Attributes

| Attribute | Component | File |
|---|---|---|
| `sort-control` | `SortControl` root/trigger element | `frontend/src/shared/components/SortControl.tsx` |

---

## Implementation Checklist

### Task 1 — Create `sortClientes` pure utility function (AC1, AC2, AC3, AC4)

**Makes these tests GREEN:** UNIT-C-05, UNIT-C-06, UNIT-C-07, UNIT-C-08

- [ ] Create `frontend/src/modules/crm/clientes/application/sortClientes.ts`
- [ ] Export `type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'`
- [ ] Implement `sortClientes(clientes: Cliente[], option: SortOption): Cliente[]`
- [ ] `nombre-asc`: `[...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))`
- [ ] `nombre-desc`: `[...clientes].sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))`
- [ ] `fecha-desc`: sort by `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()` (newest first)
- [ ] `fecha-asc`: sort by `new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()` (oldest first)
- [ ] Return a new array (spread `[...clientes]` before sort — never mutate input)
- [ ] Run: `npx vitest run frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts`
- [ ] All 5 unit tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Task 2 — Create `SortControl` shared component (AC1, AC2, AC3, AC4, AC6)

**Makes these tests GREEN:** UNIT-C-01, UNIT-C-02, UNIT-C-02b, UNIT-C-03, UNIT-C-04, accessibility test

- [ ] Check siesa-ui-kit catalog for a sort/select component — if available, use it
- [ ] If unavailable, use shadcn/ui `Select` (already installed per architecture.md)
- [ ] Create `frontend/src/shared/components/SortControl.tsx`
- [ ] Props: `value: SortOption`, `onChange: (value: SortOption) => void`
- [ ] 4 options rendered with Spanish labels:
  - `nombre-asc` → "Nombre A→Z"
  - `nombre-desc` → "Nombre Z→A"
  - `fecha-desc` → "Más reciente"
  - `fecha-asc` → "Más antiguo"
- [ ] Add `data-testid="sort-control"` on the root/trigger element
- [ ] Add `aria-label="Ordenar clientes"` for WCAG 2.1 AA accessibility
- [ ] Root element or trigger must display the current selected label (controlled by `value` prop)
- [ ] Run: `npx vitest run frontend/src/shared/components/__tests__/SortControl.test.tsx`
- [ ] All 6 component tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Task 3 — Integrate `SortControl` into `ClienteListPanel` (AC1–AC6)

**Makes these tests GREEN:** E2E-C-28, E2E-C-29, E2E-C-30, E2E-C-31, E2E-C-32, E2E-C-33

- [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- [ ] Add `sortOption` local state: `const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')`
- [ ] Import `SortControl` from `../../../shared/components/SortControl`
- [ ] Import `sortClientes`, `SortOption` from `../application/sortClientes`
- [ ] Render `<SortControl value={sortOption} onChange={setSortOption} />` above client list, below/alongside search input
- [ ] Chain sort after filter in the existing `useMemo`:
  ```typescript
  const displayedClientes = useMemo(() => {
    const lower = searchQuery.toLowerCase().trim()
    const filtered = lower
      ? data.filter(c => c.nombre.toLowerCase().includes(lower) || c.nit.toLowerCase().includes(lower))
      : data
    return sortClientes(filtered, sortOption)
  }, [data, searchQuery, sortOption])
  ```
- [ ] Sorting must operate on the filtered array — NOT on raw `data` (AC5 requirement)
- [ ] No additional API call on sort change — sorting is client-side only over TanStack Query cache
- [ ] Run E2E tests: `npx playwright test e2e/tests/clientes/clientes-sort.spec.ts`
- [ ] All 6 E2E tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all E2E sort tests for Story 2.6
npx playwright test e2e/tests/clientes/clientes-sort.spec.ts

# Run only P0 sort tests
npx playwright test e2e/tests/clientes/clientes-sort.spec.ts --grep "E2E-C-28|E2E-C-29|E2E-C-32"

# Run tests in headed mode (see browser interaction)
npx playwright test e2e/tests/clientes/clientes-sort.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/clientes/clientes-sort.spec.ts --grep "E2E-C-32" --debug

# Run SortControl component tests
npx vitest run frontend/src/shared/components/__tests__/SortControl.test.tsx

# Run sortClientes unit tests
npx vitest run frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts

# Run all unit tests for Story 2.6 together
npx vitest run frontend/src/shared/components/__tests__/SortControl.test.tsx frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 15 tests written and in RED state
- E2E spec file created: `e2e/tests/clientes/clientes-sort.spec.ts`
- Component test file created: `frontend/src/shared/components/__tests__/SortControl.test.tsx`
- Unit test file created: `frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts`
- `ClientesPage` POM extended with `sortControl` locator and `seleccionarOrden()` method
- Implementation checklist with 3 tasks defined

**Verification:**

- E2E tests fail because `data-testid="sort-control"` does not exist in the DOM (neither `SortControl.tsx` nor its integration in `ClienteListPanel` is implemented)
- Component tests fail because `SortControl.tsx` does not exist — module import fails
- Unit tests fail because `sortClientes.ts` does not exist — module import fails

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick Task 1 (sortClientes utility) — simplest, no UI dependency
2. Run `npx vitest run ... sortClientes.test.ts` — verify 5 tests go GREEN
3. Pick Task 2 (SortControl component) — depends on SortOption type from Task 1
4. Run `npx vitest run ... SortControl.test.tsx` — verify 6 tests go GREEN
5. Pick Task 3 (ClienteListPanel integration)
6. Run `npx playwright test clientes-sort.spec.ts` — verify 6 E2E tests go GREEN

**Recommended order (by dependency):**
1. Task 1 — `sortClientes.ts` (pure function, no dependencies)
2. Task 2 — `SortControl.tsx` (depends on `SortOption` type from Task 1)
3. Task 3 — `ClienteListPanel.tsx` integration (depends on Tasks 1 and 2)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 15 tests pass (green phase complete)
2. Ensure `sortClientes` export is co-located with the `Cliente` domain module (not in shared)
3. Review `SortControl` for visual consistency with existing form controls in siesa-ui-kit
4. Confirm `useMemo` dependency array includes all three inputs: `[data, searchQuery, sortOption]`
5. Ensure tests still pass after each refactor step

---

## Key Anti-Patterns Verified Against

| Anti-Pattern | Verification |
|---|---|
| Sort before filter in `useMemo` | Tests E2E-C-32 verifies filter is preserved after sort — implementation must filter first, then sort |
| Zustand store for sort state | Story notes: local `useState` only; tests do not expect any global state side-effects |
| URL search param for sort | Tests navigate fresh and verify initial state independently from other tests |
| Mutating the clientes array | UNIT-C immutability test explicitly asserts input array is unchanged after `sortClientes()` |
| New API call on sort change | E2E-C-28 and E2E-C-29 track API call count and assert it does not increase after sort |
| English UI labels in SortControl | UNIT-C-01 asserts Spanish labels: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo" |

---

## Test Coverage Summary

| Test ID | Level | Priority | AC | Status |
|---|---|---|---|---|
| E2E-C-28 | E2E | P0 | AC1 | RED |
| E2E-C-29 | E2E | P0 | AC2 | RED |
| E2E-C-30 | E2E | P1 | AC3 | RED |
| E2E-C-31 | E2E | P1 | AC4 | RED |
| E2E-C-32 | E2E | P0 | AC5 | RED |
| E2E-C-33 | E2E | P2 | AC6 | RED |
| UNIT-C-01 | Component | P1 | AC1–AC4 | RED |
| UNIT-C-02 | Component | P1 | AC1 | RED |
| UNIT-C-02b | Component | P1 | AC2 | RED |
| UNIT-C-03 | Component | P1 | AC6 | RED |
| UNIT-C-04 | Component | P2 | AC6 | RED |
| Accessibility | Component | P1 | WCAG AA | RED |
| UNIT-C-05 | Unit | P1 | AC1 | RED |
| UNIT-C-06 | Unit | P1 | AC2 | RED |
| UNIT-C-07 | Unit | P1 | AC3 | RED |
| UNIT-C-08 | Unit | P1 | AC4 | RED |
| Immutability | Unit | P1 | Correctness | RED |

**Total: 17 tests — 6 E2E, 6 Component, 5 Unit**

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Confirm RED state for E2E: `npx playwright test e2e/tests/clientes/clientes-sort.spec.ts` — all 6 should fail
3. Confirm RED state for unit/component: `npx vitest run frontend/src/...` — all 11 should fail
4. Begin implementation with Task 1 (sortClientes) as it has no UI dependencies
5. When all 17 tests pass, update story status to 'done' in sprint-status.yaml

---

**Generated by BMad TEA Agent** — 2026-05-21
