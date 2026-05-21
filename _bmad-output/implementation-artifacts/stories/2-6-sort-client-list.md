# Story 2.6: Sort Client List

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to sort the client list by different criteria (Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo),
so that I can organize my view and quickly find clients based on how I prioritize them.

## Acceptance Criteria

1. **Given** the client list is loaded with at least two clients, **When** the user selects "Nombre A→Z" from the `SortControl` component, **Then** the client list reorders alphabetically ascending by `nombre` without triggering a new API call.

2. **Given** the client list is loaded, **When** the user selects "Nombre Z→A" from the `SortControl`, **Then** the client list reorders alphabetically descending by `nombre` without a new API call.

3. **Given** the client list is loaded, **When** the user selects "Más reciente", **Then** the client list orders by `createdAt` descending (newest client appears first).

4. **Given** the client list is loaded, **When** the user selects "Más antiguo", **Then** the client list orders by `createdAt` ascending (oldest client appears first).

5. **Given** an active search filter is applied, **When** the user changes the sort order via `SortControl`, **Then** the sort is applied to the already-filtered result set without clearing the search input or triggering a new API call.

6. **Given** the `SortControl` renders on initial page load, **When** no sort preference has been set, **Then** the default sort order is "Más reciente" (`fecha-desc`).

## Tasks / Subtasks

- [ ] Task 1 — Create `sortClientes` pure utility function (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/sortClientes.ts`
  - [ ] Export `type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'`
  - [ ] Implement `sortClientes(clientes: Cliente[], option: SortOption): Cliente[]`
  - [ ] `nombre-asc`: `localeCompare` on `nombre` ascending
  - [ ] `nombre-desc`: `localeCompare` on `nombre` descending
  - [ ] `fecha-desc`: sort by `createdAt` descending (newest first) — default
  - [ ] `fecha-asc`: sort by `createdAt` ascending (oldest first)
  - [ ] Return a new array (do NOT mutate the input)

- [ ] Task 2 — Create `SortControl` shared component (AC: 1, 2, 3, 4, 6)
  - [ ] Create `frontend/src/shared/components/SortControl.tsx`
  - [ ] Props: `value: SortOption`, `onChange: (value: SortOption) => void`
  - [ ] Render a `<select>` or shadcn/ui `Select` with 4 options:
    - `nombre-asc` → label "Nombre A→Z"
    - `nombre-desc` → label "Nombre Z→A"
    - `fecha-desc` → label "Más reciente"
    - `fecha-asc` → label "Más antiguo"
  - [ ] Default selected option: `fecha-desc` ("Más reciente") when `value` is not provided
  - [ ] Add `data-testid="sort-control"` on the root/trigger element
  - [ ] All option labels in Spanish (mandatory per company standards)
  - [ ] WCAG 2.1 AA: accessible label `aria-label="Ordenar clientes"` on the control
  - [ ] Check siesa-ui-kit catalog first; if no sort/select component, use shadcn/ui `Select` (installed via MCP)

- [ ] Task 3 — Integrate `SortControl` into `ClienteListPanel` (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [ ] Add `sortOption` local state: `const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')`
  - [ ] Import and render `<SortControl value={sortOption} onChange={setSortOption} />` above the client list, below or alongside the search input
  - [ ] Chain sort after filter: apply `sortClientes(filteredClientes, sortOption)` in the `useMemo` that already produces `filteredClientes`
  - [ ] Sorting must operate over the filtered array — not over the raw `data` — so active search results are preserved (AC: 5)
  - [ ] No additional API call on sort change — sorting operates purely over the TanStack Query in-memory cache

- [ ] Task 4 — Write frontend unit tests for `sortClientes` (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts`
    - UNIT-C-05 (P1): `sortClientes('nombre-asc')` returns clients alphabetically ascending by `nombre`
    - UNIT-C-06 (P1): `sortClientes('nombre-desc')` returns clients alphabetically descending by `nombre`
    - UNIT-C-07 (P1): `sortClientes('fecha-desc')` returns clients newest first (by `createdAt`)
    - UNIT-C-08 (P1): `sortClientes('fecha-asc')` returns clients oldest first (by `createdAt`)
  - [ ] Each test uses a fixed array of 3 clients with controlled `nombre` and `createdAt` values
  - [ ] Assert return value is a new array (not mutated input)

- [ ] Task 5 — Write frontend unit tests for `SortControl` component (AC: 1, 2, 6)
  - [ ] Create `frontend/src/shared/components/__tests__/SortControl.test.tsx`
    - UNIT-C-01 (P1): Renders 4 options: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo"
    - UNIT-C-02 (P1): Fires `onChange` callback with correct sort option identifier on selection
    - UNIT-C-03 (P1): Shows "Más reciente" selected by default when no `value` prop is passed
    - UNIT-C-04 (P2): Controlled: changing `value` prop updates the displayed selection
  - [ ] Use Vitest + RTL; wrap in a `QueryClientProvider` if needed

- [ ] Task 6 — Write E2E tests for sort (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Create `e2e/tests/clientes/clientes-sort.spec.ts`
    - E2E-C-28 (P0): Selecting "Nombre A→Z" reorders list ascending without new API call
    - E2E-C-29 (P0): Selecting "Nombre Z→A" reorders list descending without new API call
    - E2E-C-30 (P1): Selecting "Más reciente" orders by `createdAt` descending (newest first)
    - E2E-C-31 (P1): Selecting "Más antiguo" orders by `createdAt` ascending (oldest first)
    - E2E-C-32 (P0): Changing sort with active search filter preserves search input value and applies sort only to filtered set
    - E2E-C-33 (P2): Default sort on initial page load is "Más reciente" (newest client appears first)
  - [ ] Extend `e2e/pages/clientes.page.ts` with `SortControl` locators and `seleccionarOrden()` method (see Dev Notes)

## Dev Notes

### Context from Previous Stories

- `ClienteListPanel.tsx` (Story 2.1) already has `searchQuery` local state and a `useMemo` that filters `data` (TanStack Query cache for `['clientes']`) by `nombre` and `nit`. The sort must be chained into this same `useMemo` — filter first, then sort — to ensure AC5 (search filter + sort compose correctly).
- `useClientes.ts` uses `queryKey: ['clientes']` and returns the full list from `GET /api/v1/clientes`. No changes needed to this hook — sorting is purely client-side over the cached data.
- `clienteApiRepository.ts` has `getAll()`, `create()`, `update()`, `delete()` — no changes needed.
- Architecture decision (architecture.md "State Boundaries"): sort state is local React `useState` — NOT Zustand, NOT URL param. This avoids persisting ephemeral UI preference across sessions and keeps the implementation minimal.
- The `Cliente` TypeScript interface (Story 2.1) already includes `createdAt: string` (ISO 8601) — use `new Date(a.createdAt).getTime()` for `fecha-*` sort comparisons.

### Implementation Notes

**`sortClientes` utility — canonical implementation:**

```typescript
// frontend/src/modules/crm/clientes/application/sortClientes.ts
import type { Cliente } from '../domain/Cliente'

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

export function sortClientes(clientes: Cliente[], option: SortOption): Cliente[] {
  const sorted = [...clientes] // never mutate input
  switch (option) {
    case 'nombre-asc':
      return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    case 'nombre-desc':
      return sorted.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))
    case 'fecha-desc':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'fecha-asc':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    default:
      return sorted
  }
}
```

**`ClienteListPanel` — integration pattern (chaining filter + sort):**

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx
import { useState, useMemo } from 'react'
import { useClientes } from '../application/useClientes'
import { sortClientes, type SortOption } from '../application/sortClientes'
import { SortControl } from '../../../shared/components/SortControl'

const [searchQuery, setSearchQuery] = useState('')
const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')
const { data = [], isLoading, isError, refetch } = useClientes()

const displayedClientes = useMemo(() => {
  const lower = searchQuery.toLowerCase().trim()
  const filtered = lower
    ? data.filter(c => c.nombre.toLowerCase().includes(lower) || c.nit.toLowerCase().includes(lower))
    : data
  return sortClientes(filtered, sortOption)
}, [data, searchQuery, sortOption])
```

**`SortControl` — component pattern:**

```typescript
// frontend/src/shared/components/SortControl.tsx
import type { SortOption } from '../../modules/crm/clientes/application/sortClientes'

interface SortControlProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortControl({ value, onChange }: SortControlProps) {
  // Use shadcn/ui Select or native <select>
  // data-testid="sort-control" on root element
  // aria-label="Ordenar clientes"
}
```

**Note on shadcn/ui Select:** Check siesa-ui-kit first. If unavailable, use shadcn/ui `Select` (already installed per architecture.md initialization commands). Do not build a custom dropdown component.

**`ClientesPage` POM extension (for E2E tests):**

```typescript
// e2e/pages/clientes.page.ts — add to constructor:
this.sortControl = page.getByTestId('sort-control')

// Add method:
async seleccionarOrden(option: 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc') {
  await this.sortControl.click()
  await this.page.getByRole('option', { name: new RegExp(option === 'nombre-asc' ? 'nombre a' : option === 'nombre-desc' ? 'nombre z' : option === 'fecha-desc' ? 'reciente' : 'antiguo', 'i') }).click()
}
```

### UI Implementation Requirements (MANDATORY)

- Library: `siesa-ui-kit` — check catalog first for a sort/select component
- Fallback: shadcn/ui `Select` (already installed)
- Do NOT create a custom dropdown component if a kit equivalent exists
- All option labels in Spanish
- `data-testid="sort-control"` on the root/trigger element for E2E locator stability

### Frontend File Locations

```
frontend/src/
  modules/crm/clientes/
    application/
      sortClientes.ts                          # NEW — pure sort utility + SortOption type
    presentation/
      ClienteListPanel.tsx                     # MODIFIED — add sortOption state + SortControl + chain sort into useMemo
  shared/components/
    SortControl.tsx                            # NEW — controlled select component (4 sort options)
  modules/crm/clientes/__tests__/
    sortClientes.test.ts                       # NEW — UNIT-C-05 to UNIT-C-08
  shared/components/__tests__/
    SortControl.test.tsx                       # NEW — UNIT-C-01 to UNIT-C-04

e2e/
  tests/clientes/
    clientes-sort.spec.ts                      # NEW — E2E-C-28 to E2E-C-33
  pages/
    clientes.page.ts                           # MODIFIED — add sortControl locator + seleccionarOrden()
```

### No Backend Changes Required

Story 2.6 is entirely frontend. Sorting is client-side over TanStack Query cache (`['clientes']`). No backend endpoint changes, no migration, no new commands or queries.

### data-testid Attributes Required

| Attribute | Component | File |
|---|---|---|
| `sort-control` | `SortControl` (root/trigger element) | `frontend/src/shared/components/SortControl.tsx` |

### Test IDs Covered by This Story

| Test ID | Priority | Description |
|---|---|---|
| E2E-C-28 | P0 | Selecting "Nombre A→Z" reorders list alphabetically ascending without new API call |
| E2E-C-29 | P0 | Selecting "Nombre Z→A" reorders list alphabetically descending without new API call |
| E2E-C-30 | P1 | Selecting "Más reciente" orders by `createdAt` descending (newest first) |
| E2E-C-31 | P1 | Selecting "Más antiguo" orders by `createdAt` ascending (oldest first) |
| E2E-C-32 | P0 | Changing sort with active search filter: search input preserved, sort applies to filtered set only |
| E2E-C-33 | P2 | Default sort on initial page load is "Más reciente" |
| UNIT-C-01 | P1 | SortControl renders 4 options with correct Spanish labels |
| UNIT-C-02 | P1 | SortControl fires `onChange` with correct sort option identifier |
| UNIT-C-03 | P1 | SortControl shows "Más reciente" selected by default |
| UNIT-C-04 | P2 | SortControl controlled: `value` prop updates displayed selection |
| UNIT-C-05 | P1 | `sortClientes('nombre-asc')` returns alphabetically ascending |
| UNIT-C-06 | P1 | `sortClientes('nombre-desc')` returns alphabetically descending |
| UNIT-C-07 | P1 | `sortClientes('fecha-desc')` returns newest first |
| UNIT-C-08 | P1 | `sortClientes('fecha-asc')` returns oldest first |

### Key Anti-Patterns to Avoid

```
❌ Zustand store for sort state          → useState (local, no cross-route persistence needed)
❌ URL search param for sort state       → useState (ephemeral UI preference per architecture.md)
❌ Sort before filter in useMemo         → filter first, then sort (AC5 requirement)
❌ Mutating the clientes array           → always spread [...clientes] before sorting
❌ New API call on sort change           → client-side only, no re-fetch on sort
❌ English UI labels in SortControl      → all labels in Spanish mandatory
❌ Custom dropdown without checking kit → check siesa-ui-kit first, then shadcn/ui Select
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.6 AC, AC-E2.6
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "State Boundaries" (sort state = local useState), "Search Strategy" (client-side filter pattern), "Enforcement Guidelines"
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — E2E-C-28 to E2E-C-33, UNIT-C-01 to UNIT-C-08, Risk R5 (sort clears search filter), Risk R10 (default sort order)
- Previous story: `_bmad-output/implementation-artifacts/stories/2-1-client-list-and-search.md` — `ClienteListPanel` search filter pattern (useMemo chain to extend)
- Previous story: `_bmad-output/implementation-artifacts/stories/2-5-delete-client.md` — hook patterns and component conventions
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack (TanStack Query, Zustand, useState, React 18+, TypeScript strict), UI Kit priority (siesa-ui-kit → shadcn/ui → custom)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
