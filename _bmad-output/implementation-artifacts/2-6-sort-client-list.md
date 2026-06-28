# Story 2.6: Sort Client List

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to sort the client list by different criteria,
so that I can organize my view and quickly find clients based on how I prioritize them.

## Acceptance Criteria

1. **Given** the client list is loaded with at least two clients, **When** the user selects "Nombre A→Z" from the SortControl component, **Then** the client list reorders alphabetically ascending by Nombre without triggering a new API call.

2. **Given** the client list is loaded, **When** the user selects "Nombre Z→A" from the SortControl, **Then** the client list reorders alphabetically descending by Nombre without a new API call.

3. **Given** the client list is loaded, **When** the user selects "Más reciente", **Then** the client list orders by creation date descending (newest client appears first).

4. **Given** the client list is loaded, **When** the user selects "Más antiguo", **Then** the client list orders by creation date ascending (oldest client appears first).

5. **Given** an active search filter is applied, **When** the user changes the sort order via SortControl, **Then** the sort is applied to the already-filtered result set without clearing the search input.

6. **Given** the SortControl renders on initial page load, **When** no sort preference has been set, **Then** the default sort order is "Más reciente" (`fecha-desc`).

## Tasks / Subtasks

- [x] Task 1 — Frontend: Create `SortControl` shared component (AC: #1, #2, #3, #4, #6)
  - [x] Create `frontend/src/shared/components/SortControl.tsx`:
    - Props: `value: SortOption`, `onChange: (value: SortOption) => void`
    - Renders a `<select>` (or shadcn/ui `Select`) with four options in Spanish:
      - `fecha-desc` → "Más reciente" (default — selected when `value === 'fecha-desc'`)
      - `fecha-asc` → "Más antiguo"
      - `nombre-asc` → "Nombre A→Z"
      - `nombre-desc` → "Nombre Z→A"
    - `aria-label="Ordenar clientes"` for WCAG 2.1 AA compliance
    - `data-testid="sort-control"`
    - Import `SortOption` type from `frontend/src/shared/lib/sortClientes.ts`
    - All option labels in Spanish

- [x] Task 2 — Frontend: Wire `SortControl` into `ClienteListView` (AC: #1, #2, #3, #4, #5, #6)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Add local `useState<SortOption>` initialized to `'fecha-desc'`:
      ```ts
      const [sortOption, setSortOption] = useState<SortOption>('fecha-desc');
      ```
    - Replace the hardcoded `sortClientes(data, 'fecha-desc')` call:
      ```ts
      const sortedClientes = useMemo(() => sortClientes(data, sortOption), [data, sortOption]);
      ```
    - Add `<SortControl value={sortOption} onChange={setSortOption} />` inside the header `div` (below the search `<input>` and above the scrollable list area)
    - Preserve the existing `filteredClientes` useMemo — it already reads from `sortedClientes`, so sort + search interaction is automatically correct
    - Import `SortControl` from `../../../../shared/components/SortControl`
    - Keep the existing `searchQuery` state and `filteredClientes` useMemo unchanged

- [x] Task 3 — Tests (AC: #1, #2, #3, #4, #5, #6) — aligned with test-design-epic-2.md
  - [x] **Component — P1**: Render `ClienteListView` with 5 clients, select "nombre-asc" from `SortControl`, assert list order alphabetically ascending (Vitest + RTL + MSW)
  - [x] **Component — P1**: Select "nombre-desc" from `SortControl`, assert list order alphabetically descending (Vitest + RTL + MSW)
  - [x] **Component — P1**: On initial mount, assert default sort is "Más reciente" (first list item is the client with newest `createdAt`) (Vitest + RTL + MSW)
  - [x] **Component — P1**: Select "fecha-asc" from `SortControl`, assert oldest client appears first (Vitest + RTL + MSW)
  - [x] **Component — P1**: Apply search filter "Test", then change sort order, assert search input still contains "Test" and list shows only filtered items in new order (Vitest + RTL + MSW) — covers R-006
  - [x] **Component — P2**: Apply sort, assert MSW GET handler called exactly once (initial load only — no extra API call on sort change) (Vitest + RTL + MSW)
  - [x] **Unit — P2**: `sortClientes` utility tests — verified existing tests in `frontend/src/modules/crm/clientes/__tests__/` from Story 2.1; NOT duplicated

## Dev Notes

### Architecture Context

This story adds client-side sort to the existing `ClienteListView`. It introduces:
- `SortControl` shared component at `frontend/src/shared/components/SortControl.tsx`
- Local `useState<SortOption>` in `ClienteListView` replacing the hardcoded `'fecha-desc'` sort

**Scope boundary (CRITICAL):** This story is frontend-only. No backend changes. No new API calls. No new TanStack Query mutations. Sorting operates exclusively over the TanStack Query cache already populated by `useClientes()`.

**Sort + Search interaction (CRITICAL — Risk R-006):** Sort state and search state are independent `useState` values. Sort is applied first (`sortedClientes` useMemo), then search filter is applied on top (`filteredClientes` useMemo). Changing sort does NOT touch `searchQuery` state. The existing two-`useMemo` chain in `ClienteListView` already handles this correctly — just swap the hardcoded sort argument for `sortOption` state.

**`sortClientes` utility:** Already exists at `frontend/src/shared/lib/sortClientes.ts` (created in Story 2.1). Do NOT recreate it. The `SortOption` type is exported from that file — import it from there.

**Current `ClienteListView` sort:** Line 22 has `const sortedClientes = useMemo(() => sortClientes(data, 'fecha-desc'), [data]);`. Replace with dynamic `sortOption` state as described in Task 2.

**MasterCrud note:** Not applicable. Custom split-panel layout is the established architecture for Epic 2.

### Frontend: SortControl Component

```typescript
// frontend/src/shared/components/SortControl.tsx
import type { SortOption } from '../lib/sortClientes';

interface SortControlProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      aria-label="Ordenar clientes"
      data-testid="sort-control"
      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent bg-white text-slate-700"
    >
      <option value="fecha-desc">Más reciente</option>
      <option value="fecha-asc">Más antiguo</option>
      <option value="nombre-asc">Nombre A→Z</option>
      <option value="nombre-desc">Nombre Z→A</option>
    </select>
  );
}
```

> **Note:** Use a native `<select>` to avoid a shadcn/ui `Select` dependency for a simple dropdown. If the project has shadcn/ui `Select` already installed (`frontend/src/components/ui/select.tsx`), prefer it for visual consistency; otherwise native `<select>` is acceptable.

### Frontend: ClienteListView — Updated Sort Wiring

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx (relevant changes only)
import { useMemo, useState } from 'react';
import { sortClientes } from '../../../../shared/lib/sortClientes';
import type { SortOption } from '../../../../shared/lib/sortClientes';
import { SortControl } from '../../../../shared/components/SortControl';

// Inside the component (add alongside existing searchQuery state):
const [sortOption, setSortOption] = useState<SortOption>('fecha-desc');

// Replace hardcoded sort:
const sortedClientes = useMemo(() => sortClientes(data, sortOption), [data, sortOption]);

// filteredClientes useMemo unchanged — reads from sortedClientes automatically

// In JSX, inside the header div, below the search input:
<SortControl value={sortOption} onChange={setSortOption} />
```

### Project Structure Notes

**Files to create:**

```
frontend/
└── src/
    └── shared/
        └── components/
            └── SortControl.tsx                       ← CREATE
```

**Files to modify:**

```
frontend/
└── src/
    └── modules/crm/clientes/
        ├── presentation/
        │   └── ClienteListView.tsx                   ← MODIFY (add sortOption state + SortControl)
        └── __tests__/
            └── SortControl.test.tsx                  ← CREATE (component tests for sort)
```

**Verify from prior stories — DO NOT recreate:**
- `sortClientes.ts` and `SortOption` type — Story 2.1; do NOT modify
- `useClientes.ts` — Story 2.1; do NOT modify
- `clienteApiRepository.ts` — Story 2.1; do NOT modify
- `ClienteListItem.tsx`, `EmptyState.tsx`, `ErrorPanel.tsx` — Story 2.1; do NOT modify
- `ClienteDetailView.tsx`, `ClienteForm.tsx` — Stories 2.2–2.4; do NOT modify

### Testing Approach

**Frontend component tests** use Vitest + RTL + MSW 2.x. Key scenarios:

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E2-2-6-CMP-P1-1 | Component | Default sort on mount is "Más reciente" (fecha-desc) | P1 |
| TC-E2-2-6-CMP-P1-2 | Component | Select "nombre-asc" → list order alphabetically ascending | P1 |
| TC-E2-2-6-CMP-P1-3 | Component | Select "nombre-desc" → list order alphabetically descending | P1 |
| TC-E2-2-6-CMP-P1-4 | Component | Select "fecha-asc" → oldest client appears first | P1 |
| TC-E2-2-6-CMP-P1-5 | Component | Search "Test" then change sort → search input unchanged, list filtered+sorted | P1 |
| TC-E2-2-6-CMP-P2-1 | Component | Sort change does not trigger new GET (MSW handler called exactly once) | P2 |

**Test setup hints:**
- Use `clienteFactory` from `frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts` (created in Story 2.1) to generate fixture clients with distinct `nombre` and `createdAt` values for reliable sort assertions
- Use `fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } })` to trigger sort selection in RTL

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `SortControl` renders at `frontend/src/shared/components/SortControl.tsx` — NOT inside the `clientes` module (it's a shared component)
- [ ] Default sort is `'fecha-desc'` (most recent first) — matches AC #6 and Story 2.1 AC #5
- [ ] Sort change does NOT call `refetch()` or trigger any new TanStack Query fetch
- [ ] `searchQuery` state is NOT reset when sort changes — search + sort work independently (AC #5)
- [ ] `filteredClientes` useMemo depends on `sortedClientes` (which depends on `sortOption`) — chain is correct
- [ ] All option labels in Spanish: "Más reciente", "Más antiguo", "Nombre A→Z", "Nombre Z→A"
- [ ] `aria-label="Ordenar clientes"` present on the sort control element (WCAG 2.1 AA)
- [ ] `data-testid="sort-control"` present on the sort control element
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `SortOption` type imported from `shared/lib/sortClientes.ts` — NOT redefined
- [ ] Existing `ClienteListView` behavior (search, loading skeleton, ErrorPanel, EmptyState) NOT broken — no regressions

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.6`]
- Architecture — ClienteListView 280px panel, useMemo filter pattern: [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)`]
- Architecture — Frontend folder structure: [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Test design — R-006 (sort + search interaction), P1 sort component tests, P2 no-extra-API-call test: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Coverage Plan`]
- Company standards — TanStack Query (server state), useState (local), shadcn/ui + Tailwind: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Preceding story — sortClientes utility (already created), SortOption type: [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md`]
- Preceding story — ClienteListView current implementation (hardcoded fecha-desc on line 22): [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Task 1: Created `SortControl.tsx` as a native `<select>` element at `frontend/src/shared/components/SortControl.tsx`. Used native select (no shadcn/ui Select dependency needed) per story guidance. WCAG 2.1 AA compliant with `aria-label` and `data-testid`.
- Task 2: Updated `ClienteListView.tsx` — added `sortOption` state (default `'fecha-desc'`), replaced hardcoded sort argument, added `<SortControl>` below search input. The two-useMemo chain (sortedClientes → filteredClientes) correctly handles sort+search independence per AC #5.
- Task 3: All 6 ATDD tests (TC-E2-2-6-CMP-P1-1 through TC-E2-2-6-CMP-P2-1) pass GREEN. Pre-existing `sortClientes.test.ts` from Story 2.1 not duplicated. TypeScript strict mode passes with no `any` types. Pre-existing failure in `DeleteCliente.edge.test.tsx` (cache eviction test) confirmed pre-existing from Story 2.5 — not a regression.

### File List

**Created:**
- `frontend/src/shared/components/SortControl.tsx`

**Modified:**
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-6-sort-client-list.md`

**Tests (pre-existing, verified GREEN):**
- `frontend/src/modules/crm/clientes/__tests__/SortControl.test.tsx` — 6/6 tests pass
