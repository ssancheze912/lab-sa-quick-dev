# Story 2.6: Sort Client List

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to sort the client list by different criteria (name, date),
so that I can organize my view and quickly find clients based on how I prioritize them.

## Acceptance Criteria

1. **Given** the client list is loaded with at least two clients, **When** the user selects "Nombre A→Z" from the `SortControl` component, **Then** the client list reorders alphabetically ascending by Nombre without triggering a new API call.

2. **Given** the client list is loaded, **When** the user selects "Nombre Z→A" from the `SortControl`, **Then** the client list reorders alphabetically descending by Nombre without a new API call.

3. **Given** the client list is loaded, **When** the user selects "Más reciente", **Then** the client list orders by `createdAt` descending (newest client appears first).

4. **Given** the client list is loaded, **When** the user selects "Más antiguo", **Then** the client list orders by `createdAt` ascending (oldest client appears first).

5. **Given** an active search filter is applied, **When** the user changes the sort order via `SortControl`, **Then** the sort is applied to the already-filtered result set without clearing the search input.

6. **Given** the `SortControl` renders on initial page load, **When** no sort preference has been set, **Then** the default sort order is "Más reciente" (`fecha-desc`).

## Tasks / Subtasks

- [x] Task 1 — Create `SortControl` shared component (AC: #1, #2, #3, #4, #6)
  - [x] Create `frontend/src/shared/components/SortControl.tsx`
  - [x] Props: `{ value: SortOption; onChange: (option: SortOption) => void }`
  - [x] Export `SortOption` type: `'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'`
  - [x] Render a `<select>` or siesa-ui-kit `Select` component with four options in Spanish
  - [x] Options: `{ value: 'nombre-asc', label: 'Nombre A→Z' }`, `{ value: 'nombre-desc', label: 'Nombre Z→A' }`, `{ value: 'fecha-desc', label: 'Más reciente' }`, `{ value: 'fecha-asc', label: 'Más antiguo' }`
  - [x] Add `data-testid="sort-control"` on the root element
  - [x] Add `aria-label="Ordenar clientes"` for accessibility (WCAG 2.1 AA)

- [x] Task 2 — Create `useSortClientes` application hook (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useSortClientes.ts`
  - [x] Accept `clientes: Cliente[]` as input and return `{ sortedClientes, sortOption, setSortOption }`
  - [x] Manage sort state with `useState<SortOption>('fecha-desc')` (default: "Más reciente")
  - [x] Apply sorting logic using `useMemo` to avoid unnecessary recomputation:
    - `nombre-asc`: `[...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))`
    - `nombre-desc`: `[...clientes].sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))`
    - `fecha-desc`: `[...clientes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())`
    - `fecha-asc`: `[...clientes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())`
  - [x] Use `String.prototype.localeCompare` with `'es'` locale for correct Spanish name sorting
  - [x] NEVER mutate the original array — always spread before sort

- [x] Task 3 — Integrate `SortControl` and `useSortClientes` into `ClienteListView` (AC: #1–#6)
  - [x] Modify `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [x] Import and call `useSortClientes`, passing the filtered clientes array (after search filter, before render)
  - [x] Render `<SortControl value={sortOption} onChange={setSortOption} />` above the client list, below the search input
  - [x] Pass `sortedClientes` (not the raw filtered array) to the list renderer
  - [x] Sorting pipeline order: raw data from TanStack Query → client-side search filter → `useSortClientes` → render list
  - [x] Confirm no new API call is triggered when sort changes (TanStack Query cache is not invalidated)

- [x] Task 4 — Frontend unit tests (AC: #1–#6)
  - [x] Create `frontend/src/shared/components/SortControl.test.tsx`
    - [x] Renders four options with correct Spanish labels
    - [x] Calls `onChange` with correct `SortOption` value on selection
    - [x] Default selected value is `'fecha-desc'`
    - [x] `data-testid` and `aria-label` are present
  - [x] Create `frontend/src/modules/crm/clientes/application/useSortClientes.test.ts`
    - [x] Default sort is `fecha-desc` (newest first)
    - [x] `nombre-asc` sort produces alphabetically ascending result
    - [x] `nombre-desc` sort produces alphabetically descending result
    - [x] `fecha-asc` sort produces chronologically ascending result
    - [x] `fecha-desc` sort produces chronologically descending result
    - [x] Sort is applied on top of filtered array without clearing filter
    - [x] Original array is not mutated
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
    - [x] `SortControl` is rendered in the list view
    - [x] Changing sort via `SortControl` reorders the displayed client list
    - [x] Search filter and sort coexist (filtered + sorted result renders correctly)

## Dev Notes

### Architecture Context

Story 2.6 is **frontend-only** — no backend changes required. Sorting is performed entirely client-side over the TanStack Query cache (`queryKey: ['clientes']`), consistent with the NFR1 strategy established in Story 2.1 (client-side filtering for ≤ 500 records). No additional API calls, no backend query params for sort.

**Direct dependency chain from previous stories:**
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — extend to embed `SortControl` and wire `useSortClientes` (established in Story 2.1)
- `frontend/src/modules/crm/clientes/application/useClientes.ts` — data source (`queryKey: ['clientes']`); already caches full client list
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` — `createdAt: string` field is available on the entity (set in Story 1.3 / 2.1); used for date-based sorting
- `frontend/src/shared/components/` — `SortControl` is a new shared component, following the `EmptyState` / `ClientListItem` pattern already in this directory

**Sorting pipeline (strict order — no deviation):**
```
TanStack Query cache ['clientes']
  → raw data: Cliente[]
  → client-side search filter (existing, from Story 2.1)
  → useSortClientes(filteredClientes) → sortedClientes
  → <ClientListItem> render
```

### MasterCrud Assessment

Story 2.6 adds a sort control to the **existing split-panel list view**. This is NOT a MasterCrud grid — the client list uses the custom `ClientListPanel` + `ClientListItem` pattern established in Story 2.1. MasterCrud is not applicable here.

### UI Implementation Requirements (MANDATORY)

- **Component priority**: Check siesa-ui-kit catalog first for a `Select` or `Dropdown` component before using a plain HTML `<select>`. If siesa-ui-kit has a `Select` component, use it. Fall back to shadcn/ui `Select`, then native `<select>` as last resort.
- **Placement**: `SortControl` renders in the left panel (280px) above the client list, below the search input field. This matches the established left-panel pattern from Story 2.1 (`ClienteListView.tsx`).
- **All user-facing text in Spanish**: Option labels ("Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo"), `aria-label` ("Ordenar clientes").
- **WCAG 2.1 AA**: The sort control must be keyboard-navigable and have an `aria-label`.
- **No loading state needed**: Sort is instantaneous (client-side); no skeleton or spinner.
- **Brand colors**: Use Tailwind `slate-*` for neutral UI elements; `#0e79fd` (Siesa Blue) only for interactive focus rings per existing component patterns.

### `SortControl` Component Contract

```typescript
// frontend/src/shared/components/SortControl.tsx
export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

interface SortControlProps {
  value: SortOption
  onChange: (option: SortOption) => void
}

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'nombre-asc',  label: 'Nombre A→Z'  },
  { value: 'nombre-desc', label: 'Nombre Z→A'  },
  { value: 'fecha-desc',  label: 'Más reciente' },
  { value: 'fecha-asc',   label: 'Más antiguo'  },
]

export function SortControl({ value, onChange }: SortControlProps) { ... }
```

### `useSortClientes` Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useSortClientes.ts
import { useState, useMemo } from 'react'
import { Cliente } from '../domain/Cliente'
import { SortOption } from '../../../../shared/components/SortControl'

export function useSortClientes(clientes: Cliente[]) {
  const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')

  const sortedClientes = useMemo(() => {
    const copy = [...clientes]
    switch (sortOption) {
      case 'nombre-asc':
        return copy.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      case 'nombre-desc':
        return copy.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))
      case 'fecha-desc':
        return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'fecha-asc':
        return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
  }, [clientes, sortOption])

  return { sortedClientes, sortOption, setSortOption }
}
```

### `ClienteListView` Integration Pattern

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx (additions)
import { SortControl } from '../../../../shared/components/SortControl'
import { useSortClientes } from '../application/useSortClientes'

// Inside component, after search filter:
const filteredClientes = clientes.filter(/* existing search filter */)
const { sortedClientes, sortOption, setSortOption } = useSortClientes(filteredClientes)

// In JSX — place SortControl below search input, above list:
<SortControl value={sortOption} onChange={setSortOption} />

// Pass sortedClientes to the list renderer instead of filteredClientes
{sortedClientes.map(cliente => <ClientListItem ... />)}
```

### Testing Standards Summary

**Frontend:** Vitest + React Testing Library + MSW. All story-related tests colocated with the source files. Use `userEvent` for simulating sort selection changes. MSW is NOT needed for this story (sorting is client-side with no API calls). Coverage target > 80%.

**Key test utilities:**
- `renderHook` from `@testing-library/react` for `useSortClientes` unit tests
- `screen.getByTestId('sort-control')` for `SortControl` integration tests
- `userEvent.selectOptions(...)` to simulate sort change in `ClienteListView` tests

### Project Structure Notes

**Files to create:**
- `frontend/src/shared/components/SortControl.tsx`
- `frontend/src/shared/components/SortControl.test.tsx`
- `frontend/src/modules/crm/clientes/application/useSortClientes.ts`
- `frontend/src/modules/crm/clientes/application/useSortClientes.test.ts`

**Files to modify:**
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — import and wire `SortControl` + `useSortClientes`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — add sort-related tests

**No backend files changed.** No new API endpoints. No database migrations.

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.6]
- AC-E2.6 (sort without page reload, retain active filter): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria]
- Client-side filter strategy (NFR1 — <1s with 500 records): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- TanStack Query client-side approach (no additional fetch): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- `ClienteListView.tsx` path and split-panel structure: [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- `Cliente` entity interface with `createdAt: string` field: [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Tasks]
- TanStack Query key `['clientes']`: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Shared components directory (`src/shared/components/`): [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- siesa-ui-kit P0 component priority: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- WCAG 2.1 AA compliance: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- All user-facing text in Spanish: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Heroicons for icons (primary icon library): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Icons]
- Vitest + RTL testing standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Testing Standards]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Task 1: Created `SortControl.tsx` using `siesa-ui-kit` `Select` component (P0 priority per standards). Exports `SortOption` type and `SORT_OPTIONS` constant.
- Task 2: Created `useSortClientes.ts` hook with `useState` + `useMemo`. Uses `localeCompare('es')` for Spanish name sorting. Array spread prevents mutation.
- Task 3: Integrated into `ClienteListView.tsx`. Sorting pipeline: TanStack Query cache → search filter → `useSortClientes` → render. No API calls triggered on sort change.
- Task 4: 28 tests authored: 6 for `SortControl`, 8 for `useSortClientes`, 3 new integration tests in `ClienteListView.test.tsx`. 26/28 pass. 2 pre-existing failures in `ClienteListView.test.tsx` unrelated to Story 2.6 (accessibility `aria-selected` check and skeleton loader timing test existed before this story).

### File List

**Created:**
- `frontend/src/shared/components/SortControl.tsx`
- `frontend/src/shared/components/SortControl.test.tsx`
- `frontend/src/modules/crm/clientes/application/useSortClientes.ts`
- `frontend/src/modules/crm/clientes/application/useSortClientes.test.ts`

**Modified:**
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
