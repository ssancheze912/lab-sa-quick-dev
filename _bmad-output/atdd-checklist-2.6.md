# ATDD Checklist - Epic 2, Story 2.6: Sort Client List

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW)

---

## Story Summary

A commercial team member can sort the client list by different criteria (Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo) using a SortControl dropdown. Sorting is entirely client-side — it operates on the TanStack Query cache and never triggers a new API call.

**As a** commercial team member
**I want** to sort the client list by different criteria
**So that** I can organize my view and quickly find clients based on how I prioritize them

---

## Acceptance Criteria

1. **AC#1** — Given client list loaded with ≥2 clients, When user selects "Nombre A→Z", Then list reorders alphabetically ascending by Nombre without new API call.
2. **AC#2** — Given client list loaded, When user selects "Nombre Z→A", Then list reorders alphabetically descending by Nombre without new API call.
3. **AC#3** — Given client list loaded, When user selects "Más reciente", Then list orders by createdAt descending (newest first) without new API call.
4. **AC#4** — Given client list loaded, When user selects "Más antiguo", Then list orders by createdAt ascending (oldest first) without new API call.
5. **AC#5 (R-E2-04)** — Given active search filter is applied, When user changes sort order, Then sort is applied to already-filtered set without clearing the search input.
6. **AC#6** — Given SortControl renders on initial page load with no prior preference, Then default sort is "Más reciente" (`fecha-desc`).

---

## Failing Tests Created (RED Phase)

> **Note:** The SortControl component and ClienteListView sort logic were already implemented in the worktree when ATDD was executed. The tests verified the implementation is correct and all pass (GREEN). These tests serve as regression guards and document the expected behavior per the story's acceptance criteria.

### Component Tests — SortControl (TC-E2-P2-01, TC-E2-P3-01)

**File:** `frontend/src/shared/components/SortControl.test.tsx`

**TC-E2-P2-01: SortControl renders all 4 options with correct Spanish labels (9 tests)**

- ✅ **Test:** renders dropdown with aria-label "Ordenar clientes"
  - **Verifies:** WCAG 2.1 AA ARIA label

- ✅ **Test:** renders option "Más reciente" for fecha-desc
  - **Verifies:** Spanish label for default sort option

- ✅ **Test:** renders option "Más antiguo" for fecha-asc
  - **Verifies:** Spanish label for date ascending option

- ✅ **Test:** renders option "Nombre A→Z" for nombre-asc
  - **Verifies:** Spanish label for alphabetical ascending option

- ✅ **Test:** renders option "Nombre Z→A" for nombre-desc
  - **Verifies:** Spanish label for alphabetical descending option

- ✅ **Test:** renders exactly 4 options
  - **Verifies:** No extra options present

- ✅ **Test:** reflects current value as selected option
  - **Verifies:** Controlled component behavior

- ✅ **Test:** has data-testid="sort-control" for stable selector
  - **Verifies:** Required testid per story spec

- ✅ **Test:** calls onChange with selected SortOption value on change
  - **Verifies:** onChange callback contract

**TC-E2-P3-01: SortOption identifier constants match expected values (5 tests)**

- ✅ **Test:** accepts "nombre-asc" as valid SortOption
- ✅ **Test:** accepts "nombre-desc" as valid SortOption
- ✅ **Test:** accepts "fecha-desc" as valid SortOption
- ✅ **Test:** accepts "fecha-asc" as valid SortOption
- ✅ **Test:** renders with each valid SortOption without errors

### Component Tests — ClienteListView Sort Integration (TC-E2-P1-12 through TC-E2-P1-16)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx`

**TC-E2-P1-12: Sort "Nombre A→Z" (AC#1) — 2 tests**

- ✅ **Test:** should reorder list alphabetically ascending when "Nombre A→Z" is selected
  - **Verifies:** AC#1 — Alpha before Mango before Zeta

- ✅ **Test:** should show Alpha SA before Mango Ltda in A→Z order
  - **Verifies:** AC#1 — specific positional assertion

**TC-E2-P1-13: Sort "Nombre Z→A" (AC#2) — 2 tests**

- ✅ **Test:** should reorder list alphabetically descending when "Nombre Z→A" is selected
  - **Verifies:** AC#2 — Zeta before Mango before Alpha

- ✅ **Test:** should show Zeta Corp before Alpha SA in Z→A order
  - **Verifies:** AC#2 — specific positional assertion

**TC-E2-P1-14: Sort by creation date (AC#3, AC#4) — 3 tests**

- ✅ **Test:** should show newest client first when "Más reciente" (fecha-desc) is selected
  - **Verifies:** AC#3 — B(Jun) before C(Mar) before A(Jan)

- ✅ **Test:** should show oldest client first when "Más antiguo" (fecha-asc) is selected
  - **Verifies:** AC#4 — A(Jan) before C(Mar) before B(Jun)

- ✅ **Test:** should switch from fecha-desc to fecha-asc and reverse the order
  - **Verifies:** AC#3 → AC#4 transition

**TC-E2-P1-15: Sort + active search (AC#5, R-E2-04) — 3 tests**

- ✅ **Test:** should preserve search input text when sort order changes
  - **Verifies:** R-E2-04 — searchQuery state not cleared by sortOption change

- ✅ **Test:** should only show filtered clients ("Ac" matches) after sort change
  - **Verifies:** AC#5 — sort applied to filtered set, not full list

- ✅ **Test:** should show "Acme Corp" before "Aceros del Valle" when Z→A and search "Ac" is active
  - **Verifies:** AC#5 — correct Z→A order within filtered set

**TC-E2-P1-16: Default sort (AC#6) — 3 tests**

- ✅ **Test:** should show SortControl with "fecha-desc" selected on initial render
  - **Verifies:** AC#6 — SortControl default value

- ✅ **Test:** should display newest client first by default (createdAt descending)
  - **Verifies:** AC#6 — list order without user interaction

- ✅ **Test:** should not require user interaction to apply default fecha-desc sort
  - **Verifies:** AC#6 — 3-client date-ordered default render

---

## Data Factories Used

### Cliente Factory

**File:** `frontend/src/test/factories/cliente.factory.ts` (existing, from Story 2.1)

**Exports:**
- `createCliente(overrides?)` — creates single client; includes `createdAt` ISO 8601 field
- `createClientes(count, overrides?)` — creates array of clients
- `resetClienteCounter()` — resets sequential ID counter for deterministic tests

---

## Mock Requirements

### MSW Handlers Used

**File:** `frontend/src/test/msw/handlers/clientes.handlers.ts` (existing, from Story 2.1)

- `handleGetClientesSuccess(clients)` — returns provided clients list
- All sort tests use this handler with explicit client data (controlled createdAt dates and names)

**Network Strategy:** MSW intercepts `GET /api/v1/clientes` at the Node.js level via `setupServer()`. No real HTTP calls are made. Tests confirm sort is purely client-side by verifying sort changes without new MSW handler registrations.

---

## Required data-testid Attributes

### SortControl Component

- `sort-control` — the `<select>` dropdown element (used in all sort tests)

### ClienteListView

- `clientes-search-input` — search text input (used in AC#5 tests)
- `cliente-item-{id}` — per-client list item links (used to verify DOM order)
- `sort-control` — inherited from SortControl

All these are already present in the implementation.

---

## Implementation Checklist

> Implementation was already complete when ATDD was executed. Checklist reflects what was verified.

### AC#1 — Nombre A→Z sort (TC-E2-P1-12)

- [x] SortControl renders "Nombre A→Z" option with value `nombre-asc`
- [x] ClienteListView handles `nombre-asc` in sortedClientes useMemo
- [x] List reorders without triggering new API call
- [x] data-testid="sort-control" present on SortControl element
- [x] data-testid="cliente-item-{id}" present on each client link

### AC#2 — Nombre Z→A sort (TC-E2-P1-13)

- [x] SortControl renders "Nombre Z→A" option with value `nombre-desc`
- [x] ClienteListView handles `nombre-desc` in sortedClientes useMemo
- [x] List reorders without triggering new API call

### AC#3 — Más reciente (fecha-desc) (TC-E2-P1-14)

- [x] SortControl renders "Más reciente" option with value `fecha-desc`
- [x] ClienteListView handles `fecha-desc` using `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()`
- [x] `createdAt: string` field present on `Cliente` domain interface

### AC#4 — Más antiguo (fecha-asc) (TC-E2-P1-14)

- [x] SortControl renders "Más antiguo" option with value `fecha-asc`
- [x] ClienteListView handles `fecha-asc` using `new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()`

### AC#5 — Sort + search interaction (TC-E2-P1-15, R-E2-04)

- [x] `searchQuery` useState and `sortOrder` useState are independent
- [x] Changing sortOrder does not reset searchQuery
- [x] sortedClientes useMemo chains from filteredClientes (search first, then sort)

### AC#6 — Default sort fecha-desc (TC-E2-P1-16)

- [x] `useState<SortOption>('fecha-desc')` as initial value for sortOrder
- [x] SortControl renders with `value="fecha-desc"` on first load
- [x] List is ordered newest-first without user interaction

---

## Running Tests

```bash
# Run SortControl component tests
cd frontend && pnpm exec vitest run src/shared/components/SortControl.test.tsx

# Run ClienteListView sort integration tests
cd frontend && pnpm exec vitest run src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx

# Run both sort test files
cd frontend && pnpm exec vitest run src/shared/components/SortControl.test.tsx src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx

# Run all frontend tests
cd frontend && pnpm exec vitest run
```

---

## Red-Green-Refactor Workflow

### RED Phase

> Implementation was already present in the worktree — tests were generated to verify and document the existing behavior.

### GREEN Phase (Complete)

- ✅ All 27 tests pass
- ✅ SortControl: 14 tests GREEN
- ✅ ClienteListView sort integration: 13 tests GREEN

### REFACTOR Phase

- Sort logic uses `Array.prototype.sort` on a spread copy — immutability preserved
- `useMemo` dependencies correctly scoped to `[data, searchQuery, sortOrder]`
- Spanish locale sort not used (`localeCompare` without locale) — acceptable for MVP per implementation

---

## Test Execution Evidence

**Command:** `pnpm exec vitest run src/shared/components/SortControl.test.tsx src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx`

**Results:**
```
 Test Files  2 passed (2)
      Tests  27 passed (27)
   Start at  15:35:47
   Duration  2.76s
```

- Total tests: 27
- Passing: 27
- Failing: 0
- Status: All GREEN (implementation was complete)

---

## Notes

- The implementation (`SortControl.tsx`, `ClienteListView.tsx`) was already present in the worktree branch when ATDD was executed. Tests were generated to verify correct behavior and provide regression coverage.
- `ClienteListView.sort.test.tsx` uses `createMemoryHistory + createRouter + RouterProvider` (TanStack Router) because `ClienteListView` renders `<Link>` components that require Router context.
- `SortControl.test.tsx` does not need Router context as it is a pure controlled `<select>` component.
- Existing `ClienteListView.test.tsx` tests for AC#6 (default sort) were complemented but not replaced — the new dedicated file covers the sort feature more comprehensively.

---

## Contact

**Questions or Issues?**
- Refer to `./bmm/docs/tea-README.md` for workflow documentation
- Consult `./bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-29
