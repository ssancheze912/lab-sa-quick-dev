# Story 2.6: Sort Client List

Status: ready

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to sort the client list by different criteria,
So that I can organize my view and quickly find clients based on how I prioritize them.

## Acceptance Criteria

1. **Given** the client list is loaded with at least two clients, **When** the user selects "Nombre A→Z" from the SortControl component, **Then** the client list reorders alphabetically ascending by Nombre without triggering a new API call.

2. **Given** the client list is loaded, **When** the user selects "Nombre Z→A" from the SortControl, **Then** the client list reorders alphabetically descending by Nombre without triggering a new API call.

3. **Given** the client list is loaded, **When** the user selects "Más reciente", **Then** the client list orders by creation date descending (newest client appears first) without triggering a new API call.

4. **Given** the client list is loaded, **When** the user selects "Más antiguo", **Then** the client list orders by creation date ascending (oldest client appears first) without triggering a new API call.

5. **Given** an active search filter is applied, **When** the user changes the sort order via SortControl, **Then** the sort is applied to the already-filtered result set without clearing the search input.

6. **Given** the SortControl renders on initial page load, **When** no sort preference has been set, **Then** the default sort order is "Más reciente" (`fecha-desc`).

## Tasks / Subtasks

- [ ] Task 1 — Frontend: Create `SortControl` shared component (AC: #1, #2, #3, #4, #6)
  - [ ] Create `frontend/src/shared/components/SortControl.tsx`:
    ```typescript
    export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc';

    interface SortControlProps {
      value: SortOption;
      onChange: (value: SortOption) => void;
    }
    ```
  - [ ] Check siesa-ui-kit catalog first for a select/dropdown component; if not available use shadcn `Select` (install via `npx shadcn@latest add select` if not present).
  - [ ] Render a labeled `<select>` or shadcn `Select` with four options in Spanish:
    - `fecha-desc` → "Más reciente" (default)
    - `fecha-asc` → "Más antiguo"
    - `nombre-asc` → "Nombre A→Z"
    - `nombre-desc` → "Nombre Z→A"
  - [ ] The component is purely controlled: no internal state — `value` and `onChange` are required props.
  - [ ] Accessible: `aria-label="Ordenar clientes"` on the control, visible label "Ordenar por:" in Spanish.
  - [ ] Apply Tailwind classes consistent with existing components: `slate-*` neutrals, Inter font, WCAG 2.1 AA contrast.

- [ ] Task 2 — Frontend: Integrate sort state and logic into `ClienteListPanel` (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`:
    - Add `sortOrder` state: `const [sortOrder, setSortOrder] = useState<SortOption>('fecha-desc')`.
    - Import `SortControl` from `@/shared/components/SortControl`.
    - Render `<SortControl value={sortOrder} onChange={setSortOrder} />` above the client list, below the search input.
    - Extend the existing `useMemo` that computes `filtered` clients to also apply sorting after filtering:
      ```typescript
      const filteredAndSorted = useMemo(() => {
        const filtered = data?.filter(c =>
          c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.nit.toLowerCase().includes(searchQuery.toLowerCase())
        ) ?? [];

        return [...filtered].sort((a, b) => {
          switch (sortOrder) {
            case 'nombre-asc':
              return a.nombre.localeCompare(b.nombre, 'es');
            case 'nombre-desc':
              return b.nombre.localeCompare(a.nombre, 'es');
            case 'fecha-asc':
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'fecha-desc':
            default:
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        });
      }, [data, searchQuery, sortOrder]);
      ```
    - Replace use of `filtered` with `filteredAndSorted` in the render path.
    - Sorting is entirely client-side over the existing TanStack Query cache — no new `useQuery` call, no API call triggered by sort change.

- [ ] Task 3 — Frontend: Write unit and component tests (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `frontend/src/shared/components/SortControl.test.tsx`:
    - Test: renders with the provided `value` selected.
    - Test: calls `onChange` with the correct `SortOption` identifier when user selects each option.
    - Test: default rendered option is "Más reciente" when `value` is `'fecha-desc'`.
    - Test: all four options are present in the DOM in Spanish.
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`:
    - Test: on initial render, `SortControl` is present and shows "Más reciente" selected.
    - Test: selecting "Nombre A→Z" reorders the client list alphabetically ascending (no additional fetch).
    - Test: selecting "Nombre Z→A" reorders the client list alphabetically descending.
    - Test: selecting "Más antiguo" orders clients by `createdAt` ascending.
    - Test: selecting "Más reciente" orders clients by `createdAt` descending.
    - Test: when a search filter is active and sort changes, the filtered set is reordered and the search input is NOT cleared.
    - Test: no additional API call is triggered when sort order changes (verify MSW handler is not called again after initial load).

## Dev Notes

### Architecture Alignment

This story is **frontend-only** — no backend changes. Sorting is performed client-side over the data already held in the TanStack Query cache (`queryKey: ['clientes']`). No new API endpoint, no new migration, no backend command or query needed.

Clean Architecture layers for frontend (`src/modules/crm/clientes/`):
- **Shared**: `SortControl.tsx` — new reusable presentation component (no business logic, purely controlled)
- **Presentation**: `ClienteListPanel.tsx` — extended with `sortOrder` state and sort logic in `useMemo`
- No Domain, Application, or Infrastructure changes required.

### State Management

- **Sort state**: local `useState<SortOption>('fecha-desc')` inside `ClienteListPanel` — ephemeral per session, no URL persistence, no Zustand store needed.
- **Sort + filter interaction**: both `searchQuery` and `sortOrder` are dependencies of a single `useMemo`. Filter runs first (reduces set), then sort is applied to the filtered result. Changing sort does NOT reset `searchQuery` and vice versa (AC #5).
- **Server state**: unchanged — `useClientes()` with `queryKey: ['clientes']` is already in place from Story 2.1. Sort change never triggers `refetch` or `invalidateQueries`.

### Sort Implementation Details

- **Locale-aware string sort**: use `localeCompare(b.nombre, 'es')` to correctly sort Spanish names with accented characters (á, é, í, ó, ú, ñ).
- **Date sort**: parse `createdAt` (ISO 8601 string) with `new Date(...)` and compare `.getTime()`. `createdAt` is a `DateTimeOffset` from the backend — JavaScript `Date` handles ISO 8601 with timezone offsets correctly.
- **Immutability**: use `[...filtered].sort(...)` — never mutate the array returned from TanStack Query cache directly.
- **Default**: `'fecha-desc'` (newest first) matches existing `ClienteRepository.GetAllAsync()` ordering by `CreatedAt` descending (Story 2.1 established this backend default). The frontend default reinforces the same visual order on initial load.

### `SortControl` Component Design

- **Location**: `frontend/src/shared/components/SortControl.tsx` — shared component, not inside the `clientes` module, because the pattern may be reused for contacts (Story 3.x).
- **Controlled component pattern**: `value` + `onChange` props — no internal state. Consistent with the existing `ClienteForm` pattern (React Hook Form controlled inputs).
- **siesa-ui-kit first rule**: check siesa-ui-kit catalog before installing shadcn. If siesa-ui-kit has a Select/Dropdown component, use it. If not, install shadcn `Select` via `npx shadcn@latest add select`. If shadcn is already installed and `select` is already present at `frontend/src/components/ui/select.tsx`, use it directly without reinstalling.
- **Fallback**: if neither siesa-ui-kit nor shadcn `Select` is available, use a native `<select>` element styled with Tailwind — this is acceptable for MVP.

### UI Implementation Requirements (MANDATORY)

- All user-facing text in Spanish: label "Ordenar por:", option labels "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo".
- Code (variables, functions, types) in English.
- WCAG 2.1 AA: `aria-label="Ordenar clientes"` on the control element; visible label "Ordenar por:" associated via `htmlFor`/`id` or wrapping `<label>`.
- Brand colors: Siesa Blue `#0e79fd` for focus ring on SortControl if applicable; `slate-*` for background/border neutrals.
- Typography: Inter font classes (`font-normal`, `font-bold` per context).
- No loading skeleton needed — the SortControl renders immediately and is always enabled (sort operates on already-loaded data).
- Sort change must NOT show any loading indicator — it is synchronous (pure `useMemo` re-computation).

### MasterCrud Note

This story does NOT use MasterCrud. Sorting is a client-side `useMemo` enhancement within the existing `ClienteListPanel` split-panel layout. MasterCrud applies to standard table-based CRUD orchestration screens.

### Previous Story Learnings

1. `@/` path alias is configured in `vite.config.ts` and `tsconfig.json` — use it for all imports.
2. `useClientes()` hook already returns `data: Cliente[]` with `createdAt: string` (ISO 8601) — no type changes needed.
3. `ClienteListPanel.tsx` already has a `useMemo` for client-side filtering (Story 2.1) — extend it rather than creating a separate memo.
4. siesa-ui-kit does NOT export `EmptyState` or `ErrorPanel` (confirmed Story 2.1) — check catalog again for Select/Dropdown before installing shadcn.
5. shadcn components are already being used in the project (`alert-dialog` was installed in Story 2.5 via `@radix-ui/react-alert-dialog`). Check if `select` is already present at `frontend/src/components/ui/select.tsx` before installing.
6. MSW is set up for frontend tests — use it to verify sort change does not trigger a new API call.
7. Test pattern: wrap components in `QueryClientProvider` + `RouterProvider` as established in Stories 2.1–2.5 tests.
8. `localeCompare` with `'es'` locale correctly sorts Spanish-language names — use it for `nombre-asc` and `nombre-desc`.

### Project Structure Notes

Files to create or modify in this story:

**Frontend — new:**
```
frontend/src/shared/components/SortControl.tsx
frontend/src/shared/components/SortControl.test.tsx
```

**Frontend — modify:**
```
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx    ← add sortOrder state + SortControl render + extend useMemo
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx ← add sort-related tests
```

**shadcn — install if missing:**
```
frontend/src/components/ui/select.tsx   ← npx shadcn@latest add select (only if siesa-ui-kit has no Select and file does not exist)
```

No backend files. No new migrations. No new API endpoints.

### References

- AC-E2.6 (ordenar sin recargar página, sin perder filtro de búsqueda) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria (QA Validation)`]
- Story 2.6 full specification [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.6: Sort Client List`]
- TanStack Query cache / client-side sort strategy [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- FR27 (cambios inmediatos — `invalidateQueries`) NOT triggered by sort (sort is client-side only)
- `ClienteListPanel` useMemo filter pattern [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md#Search Implementation`]
- `Cliente.createdAt` field type: `string` (ISO 8601) [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md#Task 3`]
- siesa-ui-kit mandatory check before shadcn [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]
- shadcn/ui components (Select) install via MCP [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- `SortControl` at `src/shared/components/SortControl` [Source: Story 2.6 Technical Context]
- Sort option identifiers: `nombre-asc` | `nombre-desc` | `fecha-desc` | `fecha-asc` [Source: Story 2.6 Technical Context]
- Company standards: Spanish UI text, English code, WCAG 2.1 AA, Siesa Blue `#0e79fd`, Inter font [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
