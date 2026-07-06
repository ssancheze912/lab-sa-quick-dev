# Story 2.6: Sort Client List

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to sort the client list by different criteria,
so that I can organize my view and quickly find clients based on how I prioritize them.

## Acceptance Criteria

1. **Given** the client list (`ClienteListView`) is loaded with at least two clients, **When** the user selects **"Nombre A→Z"** from the `SortControl` component (`data-testid="sort-control"`, `nombre-asc`), **Then** the visible client list reorders alphabetically ascending by `nombre` **without** triggering a new `GET /api/v1/clientes` request (client-side re-sort of the existing `useClientes()` / TanStack Query cache array only).

2. **Given** the client list is loaded, **When** the user selects **"Nombre Z→A"** (`nombre-desc`), **Then** the list reorders alphabetically descending by `nombre`, again with zero additional network requests.

3. **Given** the client list is loaded, **When** the user selects **"Más reciente"** (`fecha-desc`), **Then** the list orders by `createdAt` descending (the most recently created client appears first).

4. **Given** the client list is loaded, **When** the user selects **"Más antiguo"** (`fecha-asc`), **Then** the list orders by `createdAt` ascending (the oldest client appears first).

5. **Given** an active search filter (the `role="search"` `Input` established in Story 2.1) has narrowed the visible clients, **When** the user changes the sort order via `SortControl`, **Then** the sort is applied only to the already-filtered result set, the search input's value is **not** cleared, and no additional client fetch is triggered.

6. **Given** `ClienteListView` renders on initial page load with no prior sort interaction, **When** the list first appears, **Then** the default sort order is **"Más reciente"** (`fecha-desc`) — i.e. `sortOption` state initializes to `'fecha-desc'`, not to an unsorted/API-order state.

## Tasks / Subtasks

- [x] Task 1 — Frontend: `SortControl` shared component + sort comparator (AC: #1, #2, #3, #4, #6)
  - [x] Create `frontend/src/shared/components/SortControl.tsx`. Export:
    - `export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'` — the exact 4 identifiers mandated by the epic's Technical Context.
    - `export const SORT_OPTIONS: { value: SortOption; label: string }[]` in this exact order/labels (Spanish, user-facing per company standard): `{ value: 'fecha-desc', label: 'Más reciente' }`, `{ value: 'fecha-asc', label: 'Más antiguo' }`, `{ value: 'nombre-asc', label: 'Nombre A→Z' }`, `{ value: 'nombre-desc', label: 'Nombre Z→A' }`.
    - `export function sortClientes<T extends { nombre: string; createdAt: string }>(items: T[], sortOption: SortOption): T[]` — a pure function returning a **new** array (`[...items].sort(...)`), never mutating its input (the input will be the TanStack Query cache array). Comparators: `nombre-asc`/`nombre-desc` via `a.nombre.localeCompare(b.nombre)` (and its negation); `fecha-desc`/`fecha-asc` via `new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()` (and its negation).
    - `export function SortControl({ value, onChange }: { value: SortOption; onChange: (value: SortOption) => void })` — renders a `<div data-testid="sort-control">` wrapping siesa-ui-kit's `Select` (`import { Select } from 'siesa-ui-kit'`): `options={SORT_OPTIONS}`, `value={value}`, `ariaLabel="Ordenar clientes"`, `selectSize="sm"`, `onChange={(newValue) => onChange(newValue as SortOption)}` (`Select.onChange` is typed `(value: string | number) => void`; the values are always one of the 4 string literals so the cast is safe and localized to this one call site). The wrapping `div[data-testid="sort-control"]` is required because `Select` itself exposes no `data-testid`/`className`-on-root prop for the trigger — `test-design-epic-2.md` (§ line 702) already names `getByTestId('sort-control')` as the required locator.

- [x] Task 2 — Frontend: wire sort state into `ClienteListView` (AC: #1, #2, #3, #4, #5, #6)
  - [x] In `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`, add `const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')` (AC #6 default) alongside the existing `searchTerm`/`isFormOpen` `useState` calls. Import `SortControl`, `SortOption`, `sortClientes` from `@/shared/components/SortControl`.
  - [x] Rename the existing `filteredClientes` `useMemo` result to `sortedClientes` and extend its dependency array to include `sortOption`: keep the current filter logic unchanged (search by `nombre`/`nit`, case-insensitive substring match), then return `sortClientes(filtered, sortOption)` — filter **then** sort, so AC #5 (sort applied to the already-filtered set, search untouched) holds by construction; `searchTerm` and `sortOption` remain fully independent `useState` values, so changing one never resets the other.
  - [x] Render `<SortControl value={sortOption} onChange={setSortOption} />` inside the `role="search"` container's parent `div` (i.e., directly below the search `Input`, above the scrollable list `div`), so the control is visible for every list state (loaded/empty/error) — matches the "renders on initial page load" wording of AC #6.
  - [x] Update the list-rendering line (`filteredClientes.map(...)`) and the empty-state condition (`filteredClientes.length === 0 && searchTerm === ''`) to reference `sortedClientes` instead of `filteredClientes` (sorting never changes array length, so the empty-state condition's meaning is unchanged).

- [x] Task 3 — Frontend tests (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx` as a new sibling file (the project already splits `ClienteListView` specs by concern — `.test.tsx` / `.edge-cases.test.tsx` / `.perf.test.tsx` — and `ClienteListView.test.tsx` is already at 372 lines, over the project's <300-line-per-file convention noted in Story 2.5's Dev Notes, so sort tests must not be appended there). Reuse the `renderClienteListView()` MSW/router helper pattern and `createCliente`/`createClientes` factory from `ClienteListView.test.tsx`; register the `GET /api/v1/clientes` MSW handler via `server.use(...)` **before** render (network-first pattern), and track handler invocation count (e.g., a module-level counter incremented inside the handler) to assert "no new API call" per AC #1/#2/#5.
  - [x] **TC-E2-P1-11** (sort by name, no new fetch): seed 3 clients named e.g. `Beta`, `Alfa`, `Charlie`; render; select **"Nombre A→Z"** via the `sort-control` `Select` and assert the rendered `cliente-list-item` order is `Alfa, Beta, Charlie`; select **"Nombre Z→A"** and assert `Charlie, Beta, Alfa`; assert the `GET /api/v1/clientes` MSW handler fired exactly once total (the initial mount fetch only — both sort changes are client-side).
  - [x] **TC-E2-P1-12** (sort + active search, filter preserved): seed clients where only a subset matches a search term (e.g., `Nombre Test Alfa`, `Nombre Test Beta`, `Otro Cliente`); type into the search `Input` (`aria-label="Buscar clientes"`) to filter down to the "Nombre Test" subset; change the sort order; assert only the filtered subset is shown (in the new order) and the search input's `value` is unchanged after the sort interaction.
  - [x] **TC-E2-P2-01** (sort by date): seed 3 clients via `createCliente({ createdAt: ... })` with distinct, clearly-ordered ISO timestamps (e.g. `2024-01-01T00:00:00.000Z`, `2024-06-01T00:00:00.000Z`, `2024-12-01T00:00:00.000Z`); select **"Más reciente"** and assert newest-first order; select **"Más antiguo"** and assert oldest-first order.
  - [x] **TC-E2-P2-02** (default sort on first render): using the same 3 distinctly-timestamped fixture clients, render `ClienteListView` fresh with **no** sort interaction and assert the initial `cliente-list-item` order already matches `createdAt desc` — catches a regression where the default `sortOption` state or its comparator silently no-ops.
  - [x] No separate `SortControl.test.tsx` is needed (minimal-complexity principle): `SortControl` is a ~20-line presentational wrapper around `siesa-ui-kit`'s `Select` with no internal state or branching logic of its own; its four test-design cases above already exercise every one of its behaviors (all 4 options selectable, `onChange` propagates) through `ClienteListView`, which is the level `test-design-epic-2.md` specifies ("Level: Component (Vitest + RTL)" against `ClienteListView`, not `SortControl`, for all 4 cases).

- [x] Task 4 — E2E (AC: #1, #2, #3, #4, #5)
  - [x] Extend `e2e/pages/clientes.page.ts` (`ClientesPage`): add `readonly sortControl: Locator = page.getByTestId('sort-control')` and a `async seleccionarOrden(opcion: 'Nombre A→Z' | 'Nombre Z→A' | 'Más reciente' | 'Más antiguo')` method that clicks the `sortControl` trigger to open the `Select` menu, then clicks the option by its visible text (mirrors the existing `seleccionarCliente(nombre)` filter-by-text convention already in the file).
  - [x] Create `e2e/tests/clientes/clientes-sort.spec.ts` (new file, following the one-spec-per-story-concern convention already set by `clientes-delete.spec.ts`/`clientes-edit.spec.ts`/`clientes-detalle.spec.ts` — the existing `clientes-crud.spec.ts` is reserved for create/list/search per those prior stories). Cover the full-stack round trip explicitly called out as E2E-required in `test-design-epic-2.md` (§ "E2E is reserved for the critical user journeys... and sort behavior"): seed ≥2 clients via `e2e/helpers/api.helper.ts`/`data.helper.ts`, navigate to `/clientes`, assert the list visually reorders after selecting each of the 4 sort options, and assert that combining an active search (`buscar(...)`) with a sort change leaves the search input's value intact.

## Dev Notes

### Architecture patterns and constraints

- **Purely a frontend/presentation-layer story — no backend, domain, or infrastructure changes.** `Cliente.createdAt` already exists (added in Story 2.1's domain type: `frontend/src/modules/crm/clientes/domain/Cliente.ts`) and the `GET /api/v1/clientes` endpoint already returns it; there is no new API contract, migration, or repository method to add. Clean Architecture layering is respected: the sort comparator (`sortClientes`) is pure, framework-agnostic logic co-located with the presentational `SortControl` in `shared/components/` (not `domain/`, since it is UI-list-ordering behavior, not a business rule about the `Cliente` aggregate itself — Story 2.6 explicitly scopes sorting as a `shared/components/SortControl` concern per the epic's own Technical Context).
- **Client-side only, per epic mandate**: sorting must run over the already-fetched `useClientes()` / TanStack Query cache (`queryKey: ['clientes']`, unchanged from Story 2.1) — `sortOption` is local `useState` in `ClienteListView`, exactly as `searchTerm` already is. No `queryKey` changes, no `sort`/`order` query params are added to `clienteApiRepository.getAll()`.
- **Filter-then-sort ordering is what makes AC #5 hold for free**: because `sortedClientes` is derived by sorting the output of the existing search-filter step (not the raw `clientes` cache), and `searchTerm`/`sortOption` are independent `useState` values, there is no code path where changing one resets the other — no special-case "preserve search" logic is needed beyond keeping the two `useState` calls decoupled.
- **`Select.onChange` is typed `(value: string | number) => void`** (siesa-ui-kit `SelectProps`, `frontend/node_modules/siesa-ui-kit` dist typings) — since `SORT_OPTIONS` values are always one of the 4 `SortOption` string literals, a single, localized `as SortOption` cast inside `SortControl`'s own `onChange` wrapper is acceptable per company TypeScript strict-mode rules (no `any`); callers of `SortControl` (i.e. `ClienteListView`) receive a fully-typed `(value: SortOption) => void` and never see the cast.
- **No new abstraction beyond what's requested**: `sortClientes` is generic (`<T extends { nombre: string; createdAt: string }>`) only because it is exported from a `shared/` component and could plausibly be reused by a future sortable list — it is not wrapped in a strategy/factory pattern or a reusable "useSortableList" hook, since only one screen (`ClienteListView`) needs it today (minimal-complexity principle).

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, v1.0.256) — use its `Select` component (`import { Select } from 'siesa-ui-kit'`, `SelectProps`/`SelectOption` types) for `SortControl`. Do **not** build a custom `<select>`/dropdown from scratch — `siesa-ui-kit` already ships an equivalent (`Select` supports `options`, `value`, `onChange`, `ariaLabel`, `selectSize`), same rule Stories 2.3/2.4/2.5 applied for `Button`/`Input`/`Dialog`.
- **Accessibility (WCAG 2.1 AA)**: pass `ariaLabel="Ordenar clientes"` to `Select` (mirrors the existing `aria-label="Buscar clientes"` pattern on the search `Input` in `ClienteListView.tsx`).
- **All user-facing option labels in Spanish**: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo" — exact strings from the epic AC; code identifiers (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`, `sortOption`, `sortClientes`, `SortControl`) stay in English per company convention.
- **Placement**: `SortControl` sits directly below the existing search `Input` and above the scrollable `cliente-list-item` list, inside `ClienteListView`'s 280px left panel (`clientes-list-panel`) — no new panel/layout region is introduced.

### Project Structure Notes

- New frontend file: `frontend/src/shared/components/SortControl.tsx` (exports `SortControl`, `SortOption`, `SORT_OPTIONS`, `sortClientes`) — placed flat in `shared/components/` matching the existing sibling convention (`ClientListItem.tsx`, `EmptyState.tsx`, `ErrorPanel.tsx`), not a sub-folder, consistent with how those single-purpose shared components are organized today.
- Modified frontend file: `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (add `sortOption` state, `sortedClientes` derivation, render `<SortControl>`).
- New frontend test file: `frontend/src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx`.
- New E2E files: `e2e/tests/clientes/clientes-sort.spec.ts`; modified `e2e/pages/clientes.page.ts` (add `sortControl` locator + `seleccionarOrden` method).
- No backend files touched, no database migration, no new API endpoint or query param.

### Testing Standards Summary

- Frontend: Vitest + React Testing Library + MSW, network-first pattern (`server.use(...)` before render), reusing `renderClienteListView()`'s router+QueryClient scaffolding and the `createCliente`/`createClientes` factories already established in `ClienteListView.test.tsx` (Story 2.1+). New sort tests live in a dedicated `ClienteListView.sort.test.tsx` file to respect the project's <300-line-per-file convention (already applied via `.edge-cases.test.tsx`/`.perf.test.tsx` splits).
- E2E: Playwright, extending `ClientesPage` (Page Object Model) rather than duplicating locators, per `test-design-epic-2.md`'s explicit instruction that the page object "must be extended, not duplicated" ahead of Story 2.6's close.
- Relevant test-design cases (`test-design-epic-2.md`): TC-E2-P1-11 (name sort, zero extra API calls, risk R5), TC-E2-P1-12 (sort + search combined, risk R5), TC-E2-P2-01 (date sort), TC-E2-P2-02 (default sort order, risk R11).
- Coverage target for this story: all 4 sort modes + the filter-preservation scenario + the default-order scenario covered at the component level (P1/P2 per test-design); the sort-behavior "critical user journey" additionally covered once at the E2E level per `test-design-epic-2.md`'s explicit call-out.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.6: Sort Client List] (AC-E2.6 at the epic level: "ordenar la lista de clientes por Nombre A→Z, Nombre Z→A, Más reciente o Más antiguo sin recargar la página ni perder el filtro de búsqueda activo").
- Epic-level test plan: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-11], [#TC-E2-P1-12], [#TC-E2-P2-01], [#TC-E2-P2-02], [#R5], [#R11] — note line 702's explicit `getByTestId('sort-control')` locator requirement and line 105's explicit E2E designation for "sort behavior".
- Previous story state and established patterns (`Cliente.createdAt`, `useClientes`, `ClienteListView`'s `searchTerm`/`filteredClientes` `useMemo`, MSW/network-first test pattern, `createCliente`/`createClientes` factory): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]; [Source: frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx]; [Source: frontend/src/modules/crm/clientes/domain/Cliente.ts].
- siesa-ui-kit `Select` API contract: `frontend/node_modules/siesa-ui-kit/dist/components/Select/Select.types.d.ts` (`SelectProps`: `options`, `value`, `onChange: (value: string | number) => void`, `ariaLabel`, `selectSize`).
- Company stack/UI/accessibility standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md] (state management: `useState` local for this story's sort state; WCAG 2.1 AA; Spanish user-facing text; `shared/components/` folder convention).

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (sa-create-story sub-agent for story authoring; sa-dev-story sub-agent for implementation)

### Debug Log References

- `jsdom` does not implement `ResizeObserver`, required by `siesa-ui-kit`'s `Select` (built on Headless UI's `Listbox`) to position its menu. This is the first component test suite in the project to open a `Select` dropdown, so the gap was previously latent. Fixed with a minimal global polyfill in `frontend/src/test/setup.ts`.
- Pre-existing, unrelated E2E flake confirmed out of scope: `e2e/tests/clientes/clientes-delete.spec.ts` › `TC-E2-P2-04` (rapid-double-click delete confirm, Story 2.5) fails intermittently under real browser timing both with and without this story's changes (reproduced in isolation, `--workers=1`, no other spec files running). Not touched by Story 2.6's diff (`ClienteListView.tsx`, `SortControl.tsx`, `setup.ts`, `clientes.page.ts`, `clientes-sort.spec.ts`); left as-is.

### Completion Notes List

- Implemented `SortControl` (`frontend/src/shared/components/SortControl.tsx`) exporting `SortOption`, `SORT_OPTIONS`, `sortClientes`, and `SortControl` exactly per Task 1's spec (siesa-ui-kit `Select`, `ariaLabel="Ordenar clientes"`, `selectSize="sm"`, `data-testid="sort-control"` wrapper div).
- Wired `sortOption` state (default `'fecha-desc'`) into `ClienteListView.tsx`: renamed `filteredClientes` → `sortedClientes`, filter-then-sort via `sortClientes(filtered, sortOption)`, rendered `<SortControl>` directly below the search `Input`. `searchTerm` and `sortOption` remain independent `useState` values, so AC #5 (search preserved across sort changes) holds by construction.
- ATDD test files for this story (`ClienteListView.sort.test.tsx`, `clientes-sort.spec.ts`, and the `sortControl`/`seleccionarOrden` additions to `e2e/pages/clientes.page.ts`) already existed from the TEA ATDD phase (RED); no changes were needed to them — implementing Tasks 1-2 turned all of them GREEN.
- Test results: `npx vitest run` (frontend, full suite) — 120/120 passed, 0 regressions. `npx tsc -b` — clean, no type errors. `npx oxlint` — no new warnings beyond the project's pre-existing `only-export-components` pattern (already present in route files; `SortControl.tsx` follows the same shape as those). E2E: `clientes-sort.spec.ts` 5/5 passed on both `chromium` and `mobile-chrome` (10/10 total); full `e2e/tests/clientes/` regression run 50/52 passed on both projects, with the 2 failures isolated to the pre-existing, unrelated `clientes-delete.spec.ts` flake noted above (reproduced independently of this story's changes).
- No backend, domain, or infrastructure changes — purely frontend/presentation, as scoped by the story's Dev Notes.

### File List

- New: `frontend/src/shared/components/SortControl.tsx`
- Modified: `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- Modified: `frontend/src/test/setup.ts` (ResizeObserver polyfill for jsdom, required by siesa-ui-kit's `Select`)
- Pre-existing (from ATDD phase, unmodified by this implementation): `frontend/src/modules/crm/clientes/presentation/ClienteListView.sort.test.tsx`, `e2e/tests/clientes/clientes-sort.spec.ts`, `e2e/pages/clientes.page.ts` (sortControl locator + seleccionarOrden method)
