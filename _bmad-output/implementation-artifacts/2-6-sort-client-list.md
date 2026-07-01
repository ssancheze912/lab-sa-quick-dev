# Story 2.6: Sort Client List

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to sort the client list by different criteria,
so that I can organize my view and quickly find clients based on how I prioritize them.

## Acceptance Criteria

1. **Given** the client list is loaded with at least two clients, **When** the user selects "Nombre A→Z" from the `SortControl` component, **Then** the client list reorders alphabetically ascending by `nombre` **without triggering a new API call** (TC-E2-P1-12, R5).

2. **Given** the client list is loaded, **When** the user selects "Nombre Z→A" from the `SortControl`, **Then** the client list reorders alphabetically descending by `nombre` without a new API call (TC-E2-P1-12, R5).

3. **Given** the client list is loaded, **When** the user selects "Más reciente", **Then** the client list orders by `createdAt` descending (newest client appears first) without a new API call (TC-E2-P1-12, R5).

4. **Given** the client list is loaded, **When** the user selects "Más antiguo", **Then** the client list orders by `createdAt` ascending (oldest client appears first) without a new API call (TC-E2-P1-12, R5).

5. **Given** an active search filter is applied (search input has a non-empty value that has already narrowed the list), **When** the user changes the sort order via `SortControl`, **Then** the sort is applied ONLY to the already-filtered result set — clients excluded by the search do not reappear — **and** the search input retains its typed value (not cleared) (TC-E2-P1-13, R5).

6. **Given** the `SortControl` renders on initial page load with no prior sort preference set, **When** the list first renders, **Then** the default sort order is "Más reciente" (`fecha-desc`), both visually selected in `SortControl` and reflected in the list order (newest-first) (TC-E2-P1-14).

## Tasks / Subtasks

- [ ] Task 1 — Create the `SortControl` component (AC: #1, #2, #3, #4, #6)
  - [ ] Create `frontend/src/shared/components/SortControl.tsx`. Use `siesa-ui-kit`'s `Select` component (`import { Select } from 'siesa-ui-kit'`, `SelectOption` type) — do NOT hand-roll a custom dropdown; `Select` already covers this control's needs (options list, controlled `value`, `onChange`, `ariaLabel`).
  - [ ] Props: `value: SortOption` (controlled) and `onChange: (value: SortOption) => void`, where `SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'` (exported type, colocated in the same file or a sibling `SortControl.types.ts` — follow whichever pattern is lighter; a single file is sufficient for this component's scope).
  - [ ] `options` array (in this exact order, per the epic's listed order): `{ value: 'nombre-asc', label: 'Nombre A→Z' }`, `{ value: 'nombre-desc', label: 'Nombre Z→A' }`, `{ value: 'fecha-desc', label: 'Más reciente' }`, `{ value: 'fecha-asc', label: 'Más antiguo' }`.
  - [ ] Wire `Select`'s `value={value}` and `onChange={(v) => onChange(v as SortOption)}` (the kit's `onChange` signature is `(value: string | number) => void`; narrow/cast to `SortOption` since all 4 option values are the fixed string union — no runtime validation library needed for a closed 4-item set). Pass `ariaLabel="Ordenar lista de clientes"` (accessibility — no visible `label`/`showLabel` needed unless visual design calls for one; a compact toolbar control alongside the search input is the expected placement per the epic, mirroring `ClienteListView`'s existing search+button row).
  - [ ] `data-testid="sort-control"` on the root/wrapping element (or pass through via `className`/wrapper `div` if `Select`'s root node isn't directly addressable) so component tests can target it consistently with the rest of the module's `data-testid` conventions (`cliente-search-input`, `cliente-list-item`, etc.).
  - [ ] All visible option labels in Spanish (already listed above); the `SortOption` union values and all code identifiers in English, per company standards.

- [ ] Task 2 — Wire sort state and sorting logic into `ClienteListView` (AC: #1, #2, #3, #4, #5, #6)
  - [ ] In `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.tsx`, add `const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')` (default per AC #6) alongside the existing `searchQuery`/`isCreateDialogOpen` local state — plain `useState`, no Zustand/URL param, per the epic's explicit technical context ("Sort state is managed with local React `useState`").
  - [ ] Extend the existing `filteredClientes` `useMemo` (do NOT add a second, separate `useMemo` that re-filters/re-sorts independently — chain the two operations in one pipeline so the sort always applies AFTER the search filter, which is what AC #5 requires): first filter `data` by `searchQuery` (unchanged logic), then sort the filtered array by `sortOption` before returning. Rename the memo/variable if it clarifies intent (e.g. keep `filteredClientes` name since it's still consumed the same way by the render below — a rename is optional, not required), but the two ordering concerns (filter, then sort) must live in the same derived-data pipeline. Add `sortOption` to the `useMemo` dependency array alongside `data` and `searchQuery`.
  - [ ] Sort comparators (pure functions, e.g. extracted to a small local helper or inlined in the memo — no new file needed for 4 simple comparators):
    - `nombre-asc`: `a.nombre.localeCompare(b.nombre)`
    - `nombre-desc`: `b.nombre.localeCompare(a.nombre)`
    - `fecha-desc`: `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()`
    - `fecha-asc`: `new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()`
  - [ ] Sort a COPY of the filtered array (`[...filtered].sort(...)`), never mutate the array returned by `useClientes()`'s cache in place — `Array.prototype.sort` mutates its receiver, and TanStack Query's cached `data` reference must not be mutated directly (would corrupt the cache across re-renders/other consumers).
  - [ ] Render `<SortControl value={sortOption} onChange={setSortOption} />` in the existing top toolbar row (`flex items-center gap-2` div that currently holds the search `Input` and "Nuevo cliente" `Button`), positioned after the search input and before/after the "Nuevo cliente" button — place it between search and the create button for a natural left-to-right reading order (search → sort → create action).
  - [ ] Do NOT add any new `useQuery`/`refetch` call, and do NOT change `useClientes()`'s `queryKey: ['clientes']` or `queryFn` — sorting must be verifiably zero-network-impact (AC #1-#4, TC-E2-P1-12 asserts fetch/query call count is unchanged after every sort action).
  - [ ] The existing empty-state branches (`no-clients`, `search-empty`) are evaluated against `filteredClientes.length` exactly as today — since sorting never changes array length or membership, no changes are needed to those conditions.

- [ ] Task 3 — Tests (AC: all)
  - [ ] Frontend Vitest + RTL: create `frontend/src/shared/components/SortControl.test.tsx` — renders all 4 options with correct Spanish labels, calls `onChange` with the correct `SortOption` value when an option is selected, reflects the controlled `value` prop as the visually selected option.
  - [ ] Frontend Vitest + RTL: extend `ClienteListView.test.tsx` (or add a sibling `ClienteListView.sort.test.tsx` if it keeps the existing file more focused — follow whichever convention the existing suite already uses for AC-grouped test files, e.g. `ClienteListView.edge-cases.test.tsx`/`ClienteListView.performance.test.tsx` precedent suggests a new `ClienteListView.sort.test.tsx` file is acceptable and keeps this story's tests isolated):
    - TC-E2-P1-12: render list with ≥3 clients with distinct `nombre` and `createdAt` (use `createClientes`/`createCliente` factories from `frontend/src/test/factories/cliente.factory`, explicitly overriding `nombre`/`createdAt` per client since factory defaults may not guarantee distinct sortable values). For each of the 4 `SortControl` options: select it, assert the resulting `cliente-list-item` DOM order matches the expected comparator result, and assert the mocked/spied `useClientes`/query function call count is unchanged after the interaction (spy on the MSW handler call count via `server.events` or a `vi.fn()` wrapping the handler — mirror whatever spy mechanism `ClienteListView.performance.test.tsx` already uses for call-count assertions, if any exists; otherwise assert via MSW's request count).
    - TC-E2-P1-13: type a search query that narrows the list to a subset, then change `SortControl`'s value — assert the search `Input`'s value is unchanged (still shows the typed text) and only the filtered subset is reordered (clients outside the filter never reappear in the DOM).
    - TC-E2-P1-14: render the list with no prior interaction — assert `SortControl` shows "Más reciente" as the selected/displayed option AND the initial list DOM order is newest-`createdAt`-first.
  - [ ] Confirm no test relies on `Array.prototype.sort`'s mutation side effect leaking into `data` — e.g. assert the TanStack Query cache (`queryClient.getQueryData(['clientes'])`) retains its original (pre-sort) array order after a sort interaction, guarding against the in-place-mutation regression called out in Task 2.

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY client-side sorting of the already-loaded `clientes` list. It does **not**:
- Add any backend endpoint, query parameter, or `ORDER BY` clause — `GET /api/v1/clientes` (Story 2.1) is unmodified. Sorting is a pure frontend concern for this story, per the epic's explicit technical context.
- Persist the sort preference (localStorage, URL search param, backend). Sort state resets to the default (`fecha-desc`) on every fresh mount/reload — no persistence mechanism is requested by the epic AC.
- Touch `useClientes.ts`, `clienteApiRepository.ts`, `IClienteRepository.ts`, or any backend file — this is the first Epic 2 story that is 100% frontend/presentation-layer scope.

### Previous Story Intelligence (Stories 2.1–2.5)

- `ClienteListView.tsx` (Story 2.1) already owns a `filteredClientes` `useMemo` that filters `data` (from `useClientes()`) by `searchQuery`. This story extends that SAME memo to also sort — do not introduce a second competing derived-state memo. [Source: frontend/src/modules/crm/clientes/presentation/components/ClienteListView.tsx]
- The toolbar row (`<div className="flex items-center gap-2">`) currently holds the search `Input` (wrapped in a `relative` div with a manually-positioned Heroicon, due to a documented `siesa-ui-kit@1.0.250` `Input` `startIcon` DOM-prop-warning workaround) and the "Nuevo cliente" `Button`. `SortControl` is a third sibling in this same row.
- `Cliente` entity (`frontend/src/modules/crm/clientes/domain/entities/Cliente.ts`) has `createdAt: string` (ISO date string) — already present since Story 2.1/2.2, no entity change needed; `new Date(cliente.createdAt)` is a safe, already-established pattern in this codebase for date handling.
- `useClientes()` (`application/hooks/useClientes.ts`) is a plain `useQuery({ queryKey: ['clientes'], queryFn: ..., staleTime: 60_000 })` — this story must not touch this file; verifying "no new API call" means verifying no NEW `useQuery`/`refetch`/`queryClient.invalidateQueries` call is introduced anywhere in this story's code, not that this hook is forbidden from being called (it already is, once, by the existing component).
- Story 2.5 established the precedent of using `data-testid` consistently for every new interactive control (`cliente-search-input` precedent) — `SortControl` follows the same convention (`data-testid="sort-control"`).
- `pnpm` is the package manager; `siesa-ui-kit` (`^1.0.250`) is already installed with a `Select` component available (`import { Select, type SelectOption } from 'siesa-ui-kit'`) — no new dependency required for this story.

### Architecture References

- Client-side sorting over the TanStack Query cache, no additional fetch: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.6, "Technical Context"]
- Sort state via local React `useState`, `SortControl` at `src/shared/components/SortControl`, sort identifiers `nombre-asc | nombre-desc | fecha-desc | fecha-asc`: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.6, "Technical Context"]
- Query key convention: `['clientes']` list query is the sole data source; sorting/searching both operate purely over this cached array — no additional `useQuery`/`refetch` should fire on sort or search state changes (verifiable via a spy on the query function): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md, "Recommendations" #5]
- Company stack standards (React functional components + hooks, TypeScript strict mode/no `any`, TanStack Query for server state + `useState` for local state, `siesa-ui-kit` before custom components, Spanish UI text / English code identifiers, Vitest + RTL testing): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (actual `ClienteListView.tsx` toolbar structure, `filteredClientes` memo, `Cliente.createdAt` field, `data-testid` conventions): [Source: _bmad-output/implementation-artifacts/2-5-delete-client.md]

### Test Design References (Epic 2 test plan)

- TC-E2-P1-12 (Component, P1): Sort reorders list without new API call, all 4 modes — AC #1-#4. Risk covered: R5. Automation: Vitest + RTL with a spy/mock on `useClientes`. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-12]
- TC-E2-P1-13 (Component, P1): Sort applied on top of active search filter without clearing it — AC #5. Risk covered: R5. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-13]
- TC-E2-P1-14 (Component, P1): Default sort on initial load is "Más reciente" — AC #6. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-14]
- R5 risk: "Sort/search interaction bug" — applying a sort after an active search clears the search input or refetches from API, violating the "without triggering a new API call" requirement. Test: apply search filter, then change sort order, assert search input value unchanged AND no new network request fired. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#R5]
- Epic 2 "Recommendations" #3: "Client-side search/sort correctness under combined state (R4, R5)" flagged as one of the epic's top-3 highest-value test investments — search and sort must operate on the same in-memory cache without new fetches, and their interaction is exactly the kind of state-management bug that's easy to introduce and easy to miss. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md, "Recommendations"]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit`'s `Select` component (`SelectProps`/`SelectOption` — `options`, `value`, `onChange`, `ariaLabel`) as the underlying primitive for `SortControl`. Do not hand-roll a custom `<select>` or dropdown menu — `Select` already provides controlled value/onChange, accessibility (`ariaLabel`), and sizing (`selectSize`) needed here.
- **Constraint**: `SortControl` is a new, story-scoped component at `frontend/src/shared/components/SortControl.tsx` (per the epic's explicit path) — a thin wrapper around `siesa-ui-kit`'s `Select` with the 4 fixed sort options, not a generic reusable select wrapper (no need to over-abstract for a single fixed use case).
- This story does **not** use `MasterCrud` — `SortControl` is a small toolbar control on top of the existing custom split-panel list, not a `MasterCrud`-orchestrated grid/CRUD screen. Consistent with Stories 2.1–2.5's established rationale for this module.
- Icons: none required for `SortControl` itself (a plain labeled `Select`); Heroicons remain the project's primary icon set if any is later needed.
- All user-facing text (the 4 option labels: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo") MUST be in Spanish; code identifiers (`SortControl`, `SortOption`, `sortOption`, `setSortOption`, `nombre-asc`, etc.) MUST be in English.

### Testing Standards Summary

- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests; assert "no new API call" via MSW request-count spying or a `vi.fn()`-wrapped query function, per TC-E2-P1-12's automation note.
- Coverage target: >80% per company standards; "Search/sort interaction" is explicitly called out in test-design-epic-2.md as a ≥80% coverage area.
- R5 (sort/search interaction bug) is the epic's specific named risk for this story — the combined search-then-sort test (TC-E2-P1-13) is non-negotiable, not optional/nice-to-have.
- No backend tests required for this story (zero backend files touched).

### Project Structure Notes

- Sixth story to touch `frontend/src/modules/crm/clientes/` (modifies `ClienteListView.tsx` only — no new files in this module).
- First story to add a file under `frontend/src/shared/components/` since the Epic 1 shell components (`AppShell`, `EmptyState`, `ErrorPanel`, `ClientListItem`, `NotFoundView`) — `SortControl.tsx` follows the same flat `shared/components/{Name}.tsx` (+ `{Name}.test.tsx`) convention as its siblings, no subfolder needed for a component this size.
- First story in Epic 2 with zero backend footprint — purely `presentation`/`shared` layer, consistent with Clean Architecture's principle that client-side-only UI concerns (sorting an already-fetched list) don't require Domain/Application/Infrastructure layer changes.
- No variance from the unified project structure anticipated.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
