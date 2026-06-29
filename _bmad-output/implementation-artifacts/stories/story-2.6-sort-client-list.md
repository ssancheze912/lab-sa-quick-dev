# Story 2.6: Sort Client List

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to sort the client list by different criteria,
so that I can organize my view and quickly find clients based on how I prioritize them.

## Acceptance Criteria

1. **Given** the client list is loaded with at least two clients, **When** the user selects "Nombre A→Z" from the SortControl component, **Then** the client list reorders alphabetically ascending by Nombre without triggering a new API call. (AC-E2.6, FR2)

2. **Given** the client list is loaded, **When** the user selects "Nombre Z→A" from the SortControl, **Then** the client list reorders alphabetically descending by Nombre without a new API call. (AC-E2.6, FR2)

3. **Given** the client list is loaded, **When** the user selects "Más reciente", **Then** the client list orders by creation date descending (newest client appears first) without triggering a new API call. (AC-E2.6)

4. **Given** the client list is loaded, **When** the user selects "Más antiguo", **Then** the client list orders by creation date ascending (oldest client appears first) without triggering a new API call. (AC-E2.6)

5. **Given** an active search filter is applied, **When** the user changes the sort order via SortControl, **Then** the sort is applied to the already-filtered result set without clearing the search input. (AC-E2.6, R-E2-04)

6. **Given** the SortControl renders on initial page load, **When** no sort preference has been set, **Then** the default sort order is "Más reciente" (`fecha-desc`). (AC-E2.6)

## Tasks / Subtasks

- [x] Task 1 — Create `SortControl` shared component (AC: #1, #2, #3, #4, #6)
  - [x] Create `frontend/src/shared/components/SortControl.tsx`
    - Renders a `<select>` or a siesa-ui-kit / shadcn `Select` dropdown (check siesa-ui-kit catalog FIRST, then shadcn)
    - Accepts `value: SortOption` and `onChange: (value: SortOption) => void` props
    - Displays 4 options (all text in Spanish):
      - `nombre-asc` → "Nombre A→Z"
      - `nombre-desc` → "Nombre Z→A"
      - `fecha-desc` → "Más reciente" (default)
      - `fecha-asc` → "Más antiguo"
    - ARIA label: `aria-label="Ordenar clientes"` for WCAG 2.1 AA compliance
    - Exports `SortOption` type: `'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'`
    - Default value is `fecha-desc` when `value` matches the default
  - [x] Create `frontend/src/shared/components/SortControl.test.tsx`
    - TC-E2-P2-01: renders all 4 options with correct labels in Spanish
    - TC-E2-P3-01: verifies identifier constants match `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`

- [x] Task 2 — Add sort state and sort logic to `ClienteListView` (AC: #1–#6)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
    - Add `const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')` (default = "Más reciente")
    - Existing `searchQuery` state remains unchanged — both states coexist (AC #5: sort must not clear search)
    - Add `useMemo` for `sortedClientes`:
      ```typescript
      const sortedClientes = useMemo(() => {
        const sorted = [...filteredClientes] // filteredClientes from existing search useMemo
        switch (sortOption) {
          case 'nombre-asc':
            return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
          case 'nombre-desc':
            return sorted.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es', { sensitivity: 'base' }))
          case 'fecha-desc':
            return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          case 'fecha-asc':
            return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          default:
            return sorted
        }
      }, [filteredClientes, sortOption])
      ```
    - Render `<SortControl>` component in the list panel header (above the client items, below or alongside the search input)
    - Pass `sortedClientes` to the list render instead of `filteredClientes`
    - Sort is client-side only — no extra API call triggered (operates on TanStack Query cache already loaded via `useClientes()`)

- [x] Task 3 — Verify `createdAt` field is included in `ClienteDto` (AC: #3, #4)
  - [x] Check `frontend/src/modules/crm/clientes/domain/Cliente.ts` — verify `createdAt: string` (ISO 8601) field exists on `Cliente` interface
  - [x] Check `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — verify `CreatedAt: DateTimeOffset` is included in the DTO response
  - [x] If `createdAt` is missing from the `Cliente` domain type, add it: `createdAt: string` (ISO 8601 with timezone, e.g. `"2026-06-29T10:30:00Z"`)
  - [x] If `CreatedAt` is missing from `ClienteDto.cs`, add `public DateTimeOffset CreatedAt { get; init; }` and map from `ClienteEntity.CreatedAt`

- [x] Task 4 — Write tests for sort integration (AC: #1–#6)
  - [x] **Component test** `ClienteListView.sort.test.tsx` at `frontend/src/modules/crm/clientes/presentation/`:
    - TC-E2-P1-12: Load list with "Zeta", "Alpha", "Mango"; select "Nombre A→Z"; assert DOM order: "Alpha", "Mango", "Zeta"; assert no additional GET called
    - TC-E2-P1-13: Same setup, select "Nombre Z→A"; assert DOM order: "Zeta", "Mango", "Alpha"
    - TC-E2-P1-14: Load with clients `createdAt` A=2026-01-01, B=2026-06-01, C=2026-03-01; select "Más reciente" → assert order B, C, A; select "Más antiguo" → assert order A, C, B
    - TC-E2-P1-15: Load 5 clients (2 matching "Ac": "Acme", "Aceros"); type "Ac"; select "Nombre Z→A"; assert search input still shows "Ac"; assert only "Aceros", "Acme" visible in that order (R-E2-04)
    - TC-E2-P1-16: Render `ClienteListView` fresh; assert `SortControl` shows "Más reciente" selected; assert list ordered newest-first

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. Sorting is a pure Presentation concern — the sort `useMemo` lives in `ClienteListView.tsx` (Presentation layer). No changes required in Domain, Application, or Infrastructure layers.
- **Sort is entirely client-side**: operates on the TanStack Query cache (`useClientes()` result) already loaded in memory. Zero new API calls. Sort state is `useState<SortOption>('fecha-desc')` local to `ClienteListView` — no Zustand, no URL param, no query key change.
- **Sort pipeline**: `allClientes` (TanStack Query cache) → `filteredClientes` (useMemo, existing search filter) → `sortedClientes` (useMemo, new sort step). `sortedClientes` is what gets rendered.
- **Spanish locale sort**: use `localeCompare(b.nombre, 'es', { sensitivity: 'base' })` for case-insensitive Spanish alphabetical sort (handles ñ, accented vowels correctly).
- **`createdAt` field**: the sort-by-date criteria requires `createdAt` to be present in the `Cliente` domain type and included in `ClienteDto` from the backend. Verify before implementing (added in Task 3).
- **No backend changes required** unless `createdAt` is missing from the DTO (low likelihood — `ClienteEntity` has `CreatedAt: DateTimeOffset` per architecture and prior stories).
- **Primary keys**: `Id = Guid` — UUID mandatory per company standards. No changes here.

### siesa-ui-kit Usage (MANDATORY)

- **SortControl UI**: Check siesa-ui-kit catalog FIRST for a `Select` or dropdown component before creating a custom one or using shadcn. If siesa-ui-kit has a select dropdown, use it.
  - If NOT found in siesa-ui-kit → use shadcn `Select` (already installed from Story 1.1 initialization).
  - If neither covers the use case → build a minimal native `<select>` with TailwindCSS v4 styling.
- Install: `npm install siesa-ui-kit` (must already be present from Story 1.1).
- All labels and placeholder text MUST be in Spanish: "Ordenar por", "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo".
- Heroicons may be used for an optional sort icon indicator in the control (e.g., `BarsArrowDownIcon`).

### Project Structure Notes

Frontend files to create or modify:

```
frontend/src/shared/components/
  SortControl.tsx                            ← New: shared sort dropdown component
  SortControl.test.tsx                       ← New: TC-E2-P2-01, TC-E2-P3-01

frontend/src/modules/crm/clientes/
  domain/
    Cliente.ts                               ← Verify/update: add createdAt field if missing
  presentation/
    ClienteListView.tsx                      ← Update: add sortOption state, sortedClientes useMemo, SortControl render
    ClienteListView.sort.test.tsx            ← New: TC-E2-P1-12 through TC-E2-P1-16
```

Backend files to verify (likely no changes needed):

```
backend/src/SiesaAgents.Application/Clientes/
  DTOs/ClienteDto.cs                         ← Verify: CreatedAt (DateTimeOffset) field present
```

No new backend endpoints, commands, queries, or validators needed for this story.

### Sort Logic Pattern

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx

import { useState, useMemo } from 'react'
import { SortControl, type SortOption } from '@/shared/components/SortControl'

// Inside ClienteListView:
const [searchQuery, setSearchQuery] = useState('')  // existing
const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')

// Existing search filter useMemo (already present from Story 2.1):
const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return clientes ?? []
  const q = searchQuery.toLowerCase()
  return (clientes ?? []).filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  )
}, [clientes, searchQuery])

// New sort useMemo (Story 2.6 addition):
const sortedClientes = useMemo(() => {
  const list = [...filteredClientes]
  switch (sortOption) {
    case 'nombre-asc':
      return list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    case 'nombre-desc':
      return list.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es', { sensitivity: 'base' }))
    case 'fecha-desc':
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'fecha-asc':
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    default:
      return list
  }
}, [filteredClientes, sortOption])

// Render: use sortedClientes instead of filteredClientes for the list items
// Render: add <SortControl value={sortOption} onChange={setSortOption} /> in panel header
```

### SortControl Component Pattern

```typescript
// frontend/src/shared/components/SortControl.tsx

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

interface SortControlProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
  { value: 'nombre-asc', label: 'Nombre A→Z' },
  { value: 'nombre-desc', label: 'Nombre Z→A' },
]

export function SortControl({ value, onChange }: SortControlProps) {
  // Use siesa-ui-kit Select if available, else shadcn Select, else native <select>
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      aria-label="Ordenar clientes"
      className="..."  // TailwindCSS v4 classes
    >
      {sortOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
```

### API Contract

No new endpoints required for this story. All sorting is client-side over the existing TanStack Query cache.

The existing `GET /api/v1/clientes` endpoint already returns the full client list. The `createdAt` (`DateTimeOffset`) field must be present in the response — verify `ClienteDto.cs` includes it (it should, as `ClienteEntity` has `CreatedAt: DateTimeOffset` per the domain model established in Story 1.3/2.1).

### TanStack Query Keys (Canonical — No Changes)

```typescript
['clientes']   // list — already populated from Story 2.1; sort reads from cache, no new queryKey
```

Sorting NEVER triggers `queryClient.invalidateQueries` or any new fetch. It is a pure in-memory transform over the cached array.

### Testing Test Cases Covered by This Story

From `test-design-epic-2.md`:

- **P1:** TC-E2-P1-12 (Sort A→Z), TC-E2-P1-13 (Sort Z→A), TC-E2-P1-14 (Sort by date — Más reciente + Más antiguo), TC-E2-P1-15 (Sort + active search — no clear, R-E2-04), TC-E2-P1-16 (Default sort Más reciente)
- **P2:** TC-E2-P2-01 (SortControl renders all 4 options)
- **P3:** TC-E2-P3-01 (Sort identifier constants)

Risk mitigated:
- **R-E2-04** (sort clears active search filter): fully mitigated by TC-E2-P1-15 — both `searchQuery` and `sortOption` are independent `useState` variables; changing `sortOption` does not touch `searchQuery`.

### Previous Story Learnings (from Stories 2.1–2.5)

- `ClienteListView.tsx` already manages `searchQuery` state with `useState` and a `filteredClientes` `useMemo` — add `sortOption` as a parallel `useState` and chain `sortedClientes` as a downstream `useMemo` of `filteredClientes`.
- `useClientes()` hook in `frontend/src/modules/crm/clientes/application/useClientes.ts` returns the full cached list — no changes needed to the hook.
- `apiClient.ts` (Axios singleton) at `frontend/src/shared/lib/apiClient.ts` is unchanged.
- `Cliente.ts` domain interface: Story 2.5 added an optional `contactCount` field — verify `createdAt: string` is also present; if not, add it alongside `contactCount`.
- All user-facing text in Spanish: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo", ARIA label "Ordenar clientes".
- shadcn `Select` is installed (confirmed in architecture from Story 1.1 initialization) — use as fallback if siesa-ui-kit has no select/dropdown.
- MSW handlers for `GET /api/v1/clientes` already exist in prior stories' test setups; reuse them for sort component tests — no new MSW handlers required.
- Story 2.5 note: `ClienteDetailView` and `ClienteListView` have established `data-testid` patterns — maintain consistency (e.g., `data-testid="sort-control"`, `data-testid="cliente-list-item"`).

### Performance Notes

- `useMemo` with `[filteredClientes, sortOption]` dependencies guarantees the sort only re-runs when the filtered list or sort criteria change — no unnecessary re-sorts on unrelated re-renders.
- `Array.prototype.sort` on ≤ 500 records completes in < 1ms — well within NFR1 (< 1s) and NFR2 (< 2s) thresholds.
- Spreading `filteredClientes` before sort (`[...filteredClientes]`) avoids mutating the memoized array in place — required for React state immutability correctness.

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision).
- All user-facing text MUST be in Spanish — sort labels and ARIA labels.
- Code variables, functions, and classes MUST be in English (`sortOption`, `SortControl`, `SortOption`, `sortedClientes`).
- Sort is a pure read operation — no backend write, no mutation, no sensitive data exposure.
- No backend validation changes needed.

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.6 AC and Technical Context
- Previous story 2.5: `_bmad-output/implementation-artifacts/2-5-delete-client.md` — `ClienteListView`, `useClientes`, `Cliente.ts` with `contactCount`, established patterns
- Previous story 2.1: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — `ClienteListView`, `filteredClientes` useMemo, `searchQuery` state, canonical query keys
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — Client-side filter strategy (useMemo), no-server-side-pagination decision, TanStack Query keys, frontend module structure
- Test Design Epic 2: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — TC-E2-P1-12 through TC-E2-P1-16, TC-E2-P2-01, TC-E2-P3-01, R-E2-04
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, TypeScript strict, TailwindCSS v4, siesa-ui-kit P0 mandatory, Spanish UI text, English code
- MasterCrud reference: Not applicable for this story. The SortControl is a lightweight dropdown component added to the split-panel list view, not a MasterCrud data grid screen.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A — No debug issues. Implementation was clean ATDD green-phase completion.

### Completion Notes List

- All 4 tasks verified complete. SortControl and ClienteListView.sort were pre-implemented by ATDD agent.
- 27 tests GREEN: 14 in SortControl.test.tsx (TC-E2-P2-01, TC-E2-P3-01) + 13 in ClienteListView.sort.test.tsx (TC-E2-P1-12 through TC-E2-P1-16).
- `Cliente.ts` already had `createdAt: string` (ISO 8601). `ClienteDto.cs` already had `DateTimeOffset CreatedAt`. No backend changes needed.
- SortControl uses native `<select>` with TailwindCSS v4 styling (siesa-ui-kit has no Select equivalent; shadcn Select not needed for this simple case).
- Sort pipeline: `data` (TanStack Query cache) → `filteredAndSorted` (combined useMemo with filter + sort). Implementation uses a single combined useMemo for filter+sort (functionally equivalent to the specified two-stage pipeline — simpler and correct).
- AC#5 (R-E2-04) fully satisfied: `searchQuery` and `sortOrder` are independent `useState` variables.
- Zero new API calls — sort is purely client-side over the TanStack Query cache.
- WCAG 2.1 AA: `aria-label="Ordenar clientes"` present on the `<select>`.

### File List

- `frontend/src/shared/components/SortControl.tsx` — NEW: Sort dropdown component with SortOption type
- `frontend/src/shared/components/SortControl.test.tsx` — NEW: TC-E2-P2-01, TC-E2-P3-01 (14 tests)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — UPDATED: sortOrder state, filteredAndSorted combined useMemo, SortControl rendered in panel header
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx` — NEW: TC-E2-P1-12 through TC-E2-P1-16 (13 tests)
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` — VERIFIED (no change): createdAt field already present
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — VERIFIED (no change): DateTimeOffset CreatedAt already present
