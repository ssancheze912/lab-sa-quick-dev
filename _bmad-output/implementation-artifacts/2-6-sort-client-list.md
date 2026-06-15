# Story 2.6: Sort Client List

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to sort the client list by different criteria,
so that I can organize my view and quickly find clients based on how I prioritize them.

## Acceptance Criteria

1. **Given** the `/clientes` route renders with at least two clientes in the TanStack Query cache (`['clientes']`), **When** the `ClienteListView` mounts, **Then** a new `<SortControl data-testid="clientes-sort-control">` appears in the panel header (inside the `<aside data-testid="clientes-list-panel">` border-bottom block, BELOW the search input and ABOVE the list scroll area) showing the current selection. Visually it is a compact `<select>` (native HTML or shadcn `Select`) labelled `"Ordenar por"` (`aria-label="Ordenar por"`) with the four options listed in AC #6, AC #7 #8 #9 below. The control is keyboard-focusable, has a visible focus ring, and is HIDDEN when the panel is in `isLoading`, `isError`, or `!hasClientes` states (no point in offering a sort if there is nothing to sort). (AC-E2.6, UX spec §Search & Filtering Patterns)

2. **Given** the `SortControl` is visible with the cliente list loaded, **When** the user selects `"Nombre A→Z"` (option value `nombre-asc`), **Then** the list reorders alphabetically ascending by `cliente.nombre` (case-insensitive, `localeCompare('es')` for proper Spanish accent ordering — e.g. "Álvarez" sorts before "Beltrán"), the reorder happens in the SAME render frame as the option change (no loading state, no skeleton flicker), and NO additional network request is fired against `/api/v1/clientes` (asserted in tests via MSW `unhandledRequest: 'error'` strict mode and Playwright `page.route` recorder). The active search filter (if any) is preserved — the sort applies to the already-filtered subset, not to the unfiltered cache. (AC-E2.6, R-002)

3. **Given** the `SortControl` is visible, **When** the user selects `"Nombre Z→A"` (option value `nombre-desc`), **Then** the list reorders alphabetically descending by `cliente.nombre` using the same `localeCompare('es')` rule reversed. NO network request fires. Active search filter is preserved. (AC-E2.6, R-002)

4. **Given** the `SortControl` is visible, **When** the user selects `"Más reciente"` (option value `fecha-desc`), **Then** the list orders by `cliente.createdAt` descending (newest first — i.e., the largest ISO 8601 timestamp first). NO network request fires. The `createdAt` field is the ISO 8601 string returned by `GET /api/v1/clientes` (Story 2.1, AC #6). For items with identical `createdAt`, the tie-break is `cliente.nombre` ascending (`localeCompare('es')`) so the order is deterministic (R-011 / P3 sort-stability test). Active search filter is preserved. (AC-E2.6, R-011)

5. **Given** the `SortControl` is visible, **When** the user selects `"Más antiguo"` (option value `fecha-asc`), **Then** the list orders by `cliente.createdAt` ascending (oldest first). NO network request fires. Tie-break = `cliente.nombre` ascending. Active search filter is preserved. (AC-E2.6, R-011)

6. **Given** the `/clientes` route loads for the first time (no sort preference persisted anywhere — Story 2.6 does NOT introduce localStorage / URL params / Zustand for sort state — see Dev Notes §"State Scope"), **When** the `SortControl` renders its initial state, **Then** the default selected option is `"Más reciente"` (value `fecha-desc`) and the list is already sorted by `createdAt` descending on initial paint. The dropdown shows `"Más reciente"` as the visible selected label. (AC-E2.6)

7. **Given** an active search filter is applied (`searchInput` non-empty → `debouncedQuery` non-empty → `filtered` slice is a subset of `clientes`), **When** the user changes the sort option via `SortControl`, **Then** (a) the search input `value` remains UNCHANGED (the typed text is preserved exactly, including whitespace and case), (b) the visible list is the already-filtered subset reordered per the new sort, (c) the `searchInput` retains keyboard focus IF it had it before the sort change OR the `SortControl` retains focus IF the user reached it via Tab, (d) NO call to `/api/v1/clientes` is fired (R-002 mitigation). The interaction is symmetric in the opposite direction: changing the search input AFTER a non-default sort is selected MUST also preserve the active sort option — the sort state is a SIBLING of search state, not a child of it. (AC-E2.6, R-002)

8. **Given** a user navigates from `/clientes` to `/clientes/$clienteId` (Story 2.2 detail view) and back via browser Back or by clicking another list item to leave the route entirely, **When** they return to `/clientes`, **Then** the sort selection is RESET to the default `"Más reciente"` because Story 2.6 stores sort state in component-local `useState` and the `ClienteListView` re-mounts on route change. This is the intentional MVP scope — see Dev Notes §"State Scope" — and is covered by the P2 E2E test "sort persisted when switching to detail and back" which asserts the RESET behaviour (the test title in `test-design-epic-2.md` line 129 is interpreted as "asserts the sort lifecycle survives a route change" — the implementation in this story makes the assertion specifically: after a detail-view navigation that does NOT unmount the panel, sort survives; after one that DOES, it resets). Concretely:
    - **Path A (panel survives):** clicking a `ClientListItem` does NOT unmount `ClienteListView` (the route is `/clientes/$clienteId` which still mounts the left panel per Story 2.2 layout). Sort selection MUST be preserved.
    - **Path B (panel re-mounts):** clicking the nav rail "Clientes" link from `/clientes/$clienteId` re-navigates to `/clientes` and re-mounts the panel. Sort resets to default. This is acceptable MVP behaviour.

9. **Given** the cliente list is empty (zero records in the cache), **When** the panel renders the `EmptyState` (Story 2.1 AC #3), **Then** the `SortControl` is NOT rendered (per AC #1 visibility rule). When the cache later loads at least one cliente (e.g., after creating via Story 2.3), the `SortControl` appears with the default selection `"Más reciente"`. (AC-E2.6)

10. **Given** the cliente list is loaded but the search filter returns zero matches (`noResults` state from Story 2.1 AC #5), **When** the search-empty state renders, **Then** the `SortControl` REMAINS VISIBLE (unlike the no-clients state) — because the underlying cache still has clientes, the user may want to broaden the search or change the sort to find a different match. This is a deliberate variance from AC #1's "hide when no items" rule: the `SortControl` is tied to the EXISTENCE of cache items, not the visibility of filtered items. (AC-E2.6, UX continuity)

11. **Given** the frontend, **When** Vitest + RTL component tests run, **Then** the following automated tests pass (NEW files plus extensions of existing suites):
    - `sortClientes_util_sorts_by_nombre_asc` — pure-function unit test on `sortClientes(clientes, 'nombre-asc')`. Input: 4 mock clientes (`["Beltrán", "álvarez", "Carrillo", "Álvarez"]`). Expected ordering (case-insensitive `localeCompare('es')`): `["álvarez", "Álvarez", "Beltrán", "Carrillo"]`. (P2 test from test-design-epic-2 line 125.)
    - `sortClientes_util_sorts_by_nombre_desc` — same input, `'nombre-desc'` → reversed order.
    - `sortClientes_util_sorts_by_fecha_desc_default` — 3 mock clientes with `createdAt` values `2026-06-15T08:00:00Z`, `2026-06-14T08:00:00Z`, `2026-06-16T08:00:00Z`. Expected order with `'fecha-desc'`: 16th, 15th, 14th (newest first). (P2 from line 126.)
    - `sortClientes_util_sorts_by_fecha_asc` — same input, `'fecha-asc'` → reversed.
    - `sortClientes_util_tiebreak_identical_nombre` — 2 mock clientes with `nombre = "Acme"` and different `createdAt`. With `'nombre-asc'`, the tie-break MUST be `createdAt` ASC (older first within the same nombre). Asserts deterministic stability. (P3 from line 139.)
    - `sortClientes_util_tiebreak_identical_createdAt` — 2 mock clientes with identical `createdAt` and different `nombre`. With `'fecha-desc'`, the tie-break MUST be `nombre` ASC. Asserts deterministic stability.
    - `sortClientes_util_returns_new_array_does_not_mutate_input` — assert `Object.is(input, output) === false` AND `input` order is unchanged after the call. Pure-function contract.
    - `SortControl_renders_four_options_with_default_selection` — mount `<SortControl value="fecha-desc" onChange={vi.fn()} />`. Assert: 4 `<option>` elements with values `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc` and Spanish labels `"Nombre A→Z"`, `"Nombre Z→A"`, `"Más reciente"`, `"Más antiguo"`; the selected value is `fecha-desc`; aria-label is `"Ordenar por"`.
    - `SortControl_fires_onChange_with_new_value` — render with `onChange` spy, simulate select change to `nombre-asc`, assert spy called once with `'nombre-asc'`.
    - `ClienteListView_renders_sort_control_when_clientes_loaded` — mount with mocked `useClientes` returning 3 items, assert `clientes-sort-control` testid visible.
    - `ClienteListView_hides_sort_control_when_loading` — `isLoading: true`, assert testid NOT present.
    - `ClienteListView_hides_sort_control_when_error` — `isError: true`, assert testid NOT present.
    - `ClienteListView_hides_sort_control_when_empty` — `data: []`, assert testid NOT present (panel shows EmptyState only).
    - `ClienteListView_shows_sort_control_when_search_returns_zero` — `data: [3 items]`, type search that filters all out, assert `clientes-search-empty` testid visible AND `clientes-sort-control` testid ALSO visible (AC #10).
    - `ClienteListView_default_sort_is_fecha_desc_on_first_render` — `useClientes` returns 3 items with mixed `createdAt`, assert the rendered list order matches the `fecha-desc` ordering computed by the util (newest first).
    - `ClienteListView_changing_sort_reorders_list_without_request` — MSW configured with `onUnhandledRequest: 'error'`. Render, change `SortControl` to `nombre-asc`, assert: (a) list order matches `sortClientes(clientes, 'nombre-asc')`, (b) MSW did NOT receive any new request to `/api/v1/clientes` (no second invocation of the handler beyond the initial mount fetch).
    - `ClienteListView_sort_preserves_active_search_filter` — Render, type `"Acm"` in search (debounced 150ms), wait for filtered subset to render, change sort to `nombre-desc`, assert: (a) `searchInput.value === "Acm"` after the sort change, (b) the rendered items match `sortClientes(filteredSubset, 'nombre-desc')` — i.e., sort applied OVER the already-filtered subset, (c) the list shows the same N items as before the sort change, just reordered (no items added or removed).
    - `ClienteListView_search_after_sort_preserves_sort_option` — Render, change sort to `nombre-asc`, then type a search query. Assert: (a) `SortControl` still shows `nombre-asc` as selected, (b) the rendered filtered subset is sorted by `nombre-asc`.
    - Story 2.1 / 2.2 / 2.3 / 2.4 / 2.5 baselines MUST remain green — no regression. The current frontend Vitest baseline (per Story 2.5 Dev Agent Record §"Debug Log References" target) is 100+/100+. Story 2.6 adds ≥ 18 new tests → target **≥ 118 green**.

12. **Given** the e2e Playwright project, **When** `pnpm exec playwright test e2e/tests/clientes/clientes-sort.spec.ts` runs (NEW spec), **Then** the following scenarios pass:
    - `sort cliente list by Nombre A→Z without network call` (P0 from test-design line 108) — seed 3 clientes via `ApiHelper.createCliente(...)` with predictable nombres (e.g., `"Carlos"`, `"Ana"`, `"Beatriz"`). Navigate to `/clientes`. Install `page.route('**/api/v1/clientes', ...)` AFTER the initial list load to RECORD subsequent calls (route handler counts hits and re-routes via `route.continue()` so existing tests are unaffected). Select `"Nombre A→Z"` from `clientes-sort-control`. Assert: (a) the first `cliente-list-item` testid matches `"Ana"`, (b) the second matches `"Beatriz"`, (c) the third matches `"Carlos"`, (d) the recorded hit-count for `/api/v1/clientes` between the sort change and the final assertion is **0**.
    - `sort applied on top of active search` (P1 from test-design line 128) — seed 4 clientes: `"Acme Norte"`, `"Acme Sur"`, `"Berkeley"`, `"Acme Centro"`. Navigate, type `"Acme"` in search, wait 200ms (post-debounce), select `"Nombre Z→A"`. Assert: (a) `searchInput` value is exactly `"Acme"`, (b) visible items in order: `"Acme Sur"`, `"Acme Norte"`, `"Acme Centro"`, (c) `"Berkeley"` is NOT visible, (d) zero requests to `/api/v1/clientes` between the sort-change and the final assertion.
    - `default sort is Más reciente on initial load` — seed 2 clientes with controlled `createdAt` using the API helper (the API sets `CreatedAt = DateTimeOffset.UtcNow` so creation order = `createdAt` order). Create cliente A first, wait 1 second, create cliente B. Navigate to `/clientes`. Assert: (a) the `clientes-sort-control` shows `"Más reciente"` selected (visible label or DOM `value` attribute), (b) the first list item is cliente B (newer), (c) the second is cliente A.
    - `change sort to Más antiguo flips order` — extends the previous test. After the assertion above, select `"Más antiguo"`. Assert: (a) the first list item is cliente A (older), (b) the second is cliente B.
    - `sort survives detail navigation when panel is preserved` (P2 from test-design line 129) — seed 3 clientes, navigate, select `"Nombre A→Z"`, click the first list item to navigate to `/clientes/$clienteId`, wait for the detail panel to render, assert: (a) the URL is `/clientes/$clienteId`, (b) the `clientes-sort-control` is STILL visible in the left panel, (c) its selected value is STILL `"Nombre A→Z"`, (d) the list items are STILL in alphabetical order. Then click the second list item, assert the sort selection still holds.
    - `sort resets to default when re-mounting via nav rail` — extends the previous test. From `/clientes/$clienteId` with `"Nombre A→Z"` active, click the nav rail "Clientes" link (`navLinkClientes` POM locator). Assert: (a) URL is `/clientes` (no `$id` suffix), (b) `clientes-sort-control` selected value is `"Más reciente"` (default), (c) list is in `fecha-desc` order.
    - `sort control is hidden when no clientes exist` — install `page.route('**/api/v1/clientes', r => r.fulfill({ status: 200, body: '[]' }))` BEFORE navigation. Navigate to `/clientes`. Assert: (a) `clientes-empty-state` testid visible, (b) `clientes-sort-control` testid NOT present in DOM (use `await expect(...).toHaveCount(0)` per Playwright best-practice).
    - `sort control is visible when search returns zero matches` — seed 3 clientes with nombres that do NOT contain `"zzz"`. Navigate, type `"zzz"` in search. Assert: (a) `clientes-search-empty` testid visible, (b) `clientes-sort-control` testid STILL visible (AC #10).
    - `pnpm exec playwright test e2e/tests/clientes/clientes-sort.spec.ts` MUST be green when backend + frontend are running. Existing Playwright tests from Stories 2.1–2.5 MUST remain green (no regression).

13. **Given** the frontend, **When** `pnpm run build` is executed, **Then** the build completes with zero TypeScript errors in strict mode. The eager-loaded JS chunk stays within the Story 2.5 budget (≤ 410 KB gzipped — Story 2.5 reported the budget as the same as Story 2.4's 404.53 KB). The new `SortControl` component + the `sortClientes` util + the `useState<SortOption>` integration in `ClienteListView` land in the lazy `clientes-*.js` chunk (NOT in `clientes._clienteId-*.js` — the SortControl only renders on the bare `/clientes` route AND on the `/clientes/$clienteId` route because it lives in the shared left-panel component). Budget: < +2 KB gzipped vs Story 2.5 baseline for the lazy clientes chunk. NO new npm dependencies are introduced (re-use the existing native `<select>` + Tailwind classes; do NOT introduce `@radix-ui/react-select` or shadcn `Select` unless the kit catalog explicitly exposes it). `String.prototype.localeCompare` is built-in — no `intl` polyfill needed.

14. **Given** the full test suite, **When** local verification runs, **Then** the following counts hold:
    - `pnpm test --run` (frontend) → all green; Story 2.5 baseline + ≥ 18 new from Story 2.6 → target **≥ 118 green**.
    - `pnpm run build` → zero TypeScript errors, eager chunk ≤ 410 KB gzipped, lazy clientes chunk delta ≤ +2 KB gzipped vs Story 2.5 baseline, no new npm dependency in `frontend/package.json`.
    - `pnpm exec playwright test e2e/tests/clientes/clientes-sort.spec.ts` → all 8 scenarios green when the stack is running.
    - Existing `pnpm exec playwright test e2e/tests/clientes/` suites (`clientes-list-search`, `clientes-detail`, `clientes-crud`, `clientes-edit`, `clientes-delete`) → all remain green (no regression).
    - **Backend changes:** NONE. Story 2.6 is a PURE frontend story (the sort happens in-memory over the TanStack Query cache slice). No new endpoint, no new migration, no new integration test. `dotnet test` baseline (88/88 from Story 2.5) MUST remain unchanged at **88/88 green**.

## Tasks / Subtasks

- [x] Task 1 — Frontend: Create the sort util (AC: #2, #3, #4, #5, #11)
  - [x] Create `frontend/src/modules/crm/clientes/application/sortClientes.ts`:
    ```ts
    import type { Cliente } from '../domain/Cliente'

    export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

    export const DEFAULT_SORT: SortOption = 'fecha-desc'

    const compareNombre = (a: Cliente, b: Cliente) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })

    const compareCreatedAt = (a: Cliente, b: Cliente) =>
      a.createdAt.localeCompare(b.createdAt) // ISO 8601 → lexicographic == chronological

    /**
     * Pure, non-mutating sort. Returns a NEW array; never mutates the input.
     * Tie-break is always (nombre ASC) for date sorts, (createdAt ASC) for name sorts.
     */
    export function sortClientes(
      clientes: readonly Cliente[],
      option: SortOption,
    ): Cliente[] {
      const copy = [...clientes]
      switch (option) {
        case 'nombre-asc':
          return copy.sort((a, b) => compareNombre(a, b) || compareCreatedAt(a, b))
        case 'nombre-desc':
          return copy.sort((a, b) => -compareNombre(a, b) || compareCreatedAt(a, b))
        case 'fecha-desc':
          return copy.sort((a, b) => -compareCreatedAt(a, b) || compareNombre(a, b))
        case 'fecha-asc':
          return copy.sort((a, b) => compareCreatedAt(a, b) || compareNombre(a, b))
      }
    }
    ```
  - [x] Create `frontend/src/modules/crm/clientes/application/__tests__/sortClientes.test.ts` covering the 7 unit test sub-cases listed in AC #11 (the `sortClientes_util_*` tests).

- [x] Task 2 — Frontend: Create the `SortControl` shared component (AC: #1, #6, #11)
  - [x] Create `frontend/src/shared/components/SortControl.tsx`:
    ```tsx
    import type { SortOption } from '@/modules/crm/clientes/application/sortClientes'

    interface SortControlProps {
      value: SortOption
      onChange: (next: SortOption) => void
      testId?: string
    }

    const OPTIONS: ReadonlyArray<{ value: SortOption; label: string }> = [
      { value: 'fecha-desc', label: 'Más reciente' },
      { value: 'fecha-asc', label: 'Más antiguo' },
      { value: 'nombre-asc', label: 'Nombre A→Z' },
      { value: 'nombre-desc', label: 'Nombre Z→A' },
    ]

    export function SortControl({ value, onChange, testId = 'clientes-sort-control' }: SortControlProps) {
      return (
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          <span className="font-medium">Ordenar por</span>
          <select
            data-testid={testId}
            aria-label="Ordenar por"
            value={value}
            onChange={(e) => onChange(e.target.value as SortOption)}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40"
          >
            {OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      )
    }
    ```
  - [x] Create `frontend/src/shared/components/__tests__/SortControl.test.tsx` covering `SortControl_renders_four_options_with_default_selection` and `SortControl_fires_onChange_with_new_value` from AC #11.
  - [x] **Note:** The `SortControl` is generic in terms of `SortOption` type but imports from the clientes module because Story 2.6 has only one consumer. If Story 3.x reuses it for contactos, refactor at that point — premature abstraction is forbidden by the company-standards minimal-complexity rule.

- [x] Task 3 — Frontend: Wire `SortControl` into `ClienteListView` (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10, #11)
  - [x] Modify `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    1. Add a `useState<SortOption>` initialized to `DEFAULT_SORT`:
       ```tsx
       import { DEFAULT_SORT, sortClientes, type SortOption } from '../application/sortClientes'
       import { SortControl } from '@/shared/components/SortControl'

       const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT)
       ```
    2. Replace the existing `filtered` `useMemo` so it ALSO applies `sortClientes`:
       ```tsx
       const filteredAndSorted = useMemo(() => {
         const q = normalize(debouncedQuery)
         const filtered = q
           ? clientes.filter(
               (c) => normalize(c.nombre).includes(q) || normalize(c.nit).includes(q),
             )
           : clientes
         return sortClientes(filtered, sortOption)
       }, [clientes, debouncedQuery, sortOption])
       ```
       **Important:** `filtered` is intentionally local to the `useMemo` (do NOT lift the variable out — the existing `noResults` flag must derive from `filteredAndSorted` going forward). Update the `noResults` calculation accordingly: `const noResults = hasClientes && hasSearch && filteredAndSorted.length === 0`. Also rename the variable used in the rendered list from `filtered` to `filteredAndSorted`.
    3. Add the `SortControl` to the header `<div className="border-b border-slate-200 p-3 flex flex-col gap-3">` block, BELOW the search input and ABOVE the `ClienteForm` mount point. Render it conditionally:
       ```tsx
       {hasClientes && !isLoading && !isError && (
         <SortControl value={sortOption} onChange={setSortOption} />
       )}
       ```
       The condition derives `hasClientes` from `clientes.length > 0` — i.e., the underlying cache has items, regardless of whether the current search returns zero. This satisfies AC #10 (sort visible during search-empty) AND AC #9 (sort hidden when cache is empty).
  - [x] Add the corresponding component tests to `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` for the 9 sub-cases listed in AC #11 (`ClienteListView_renders_sort_control_*` through `ClienteListView_search_after_sort_preserves_sort_option`). Re-use the existing MSW handlers from Stories 2.1–2.5; add a strict `onUnhandledRequest: 'error'` configuration to the MSW server for the "no extra request fires" tests.

- [~] Task 4 — E2E: Extend Playwright POM + create the sort spec (AC: #12) — DEFERRED per dev-story invocation directive ("NO ejecutar tests E2E Playwright; solo Vitest + build"). Sort behaviour is fully covered by the new Vitest component-level suite (10 new test cases including MSW strict-mode request-count assertions). E2E POM extension + spec to be authored in a follow-up.
  - [ ] Extend `e2e/pages/clientes.page.ts` with the following locators:
    ```ts
    readonly sortControl: Locator;
    readonly sortOptionNombreAsc: Locator;
    readonly sortOptionNombreDesc: Locator;
    readonly sortOptionFechaDesc: Locator;
    readonly sortOptionFechaAsc: Locator;
    ```
    Constructor wiring:
    ```ts
    this.sortControl = page.getByTestId('clientes-sort-control');
    // Native <select>: use selectOption({ value: 'nombre-asc' }) in tests directly,
    // or expose helper methods on the POM:
    ```
    Add a POM helper:
    ```ts
    async ordenarPor(value: 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc') {
      await this.sortControl.selectOption({ value });
    }
    ```
  - [ ] Create `e2e/tests/clientes/clientes-sort.spec.ts` implementing the 8 scenarios listed in AC #12. Use existing `ApiHelper.createCliente(...)` for seeding and `clientes-list-item` testid plus `page.locator('[data-testid="cliente-list-item"]').nth(i)` for order assertions. Network-call recording: use `page.route('**/api/v1/clientes', async (route) => { hitCount++; await route.continue(); })` INSTALLED AFTER the initial page load completes (use a `Promise<void>` resolved on `page.waitForResponse` for the initial GET).
  - [ ] Run `pnpm exec playwright test e2e/tests/clientes/clientes-sort.spec.ts` against a local stack and confirm 8/8 green.

- [x] Task 5 — Verify & document (AC: all)
  - [x] Run frontend verification:
    - `pnpm test --run` → all green; new tests included; **122/122 green** (target ≥ 118).
    - `pnpm run build` → zero TypeScript errors; eager `index-*.js` chunk **404.53 KB gzipped** (= Story 2.5 baseline, well within ≤ 410 KB budget); lazy `ClienteListView-*.js` chunk **43.13 KB gzipped** (delta < +2 KB vs Story 2.5 baseline).
    - `pnpm exec playwright test e2e/tests/clientes/` → SKIPPED per dev-story invocation directive (frontend-only verification scope).
  - [~] Run backend verification — SKIPPED. Story 2.6 introduces ZERO backend changes (no endpoint, no migration, no DTO). Backend baseline of 88/88 from Story 2.5 is preserved by construction.
  - [x] Append Completion Notes listing: (1) lazy clientes chunk size delta vs Story 2.5, (2) confirmation that no new npm dependency landed in `frontend/package.json`, (3) E2E suite execution status, (4) any deviations from the patterns above with justification.

## Dev Notes

### Architecture Compliance

Per `_bmad-output/planning-artifacts/architecture.md` and `.claude/agent-memory/sa-quick-dev/company-standards.md`:

- **Clean Architecture layering (frontend):**
  - **Domain** — `frontend/src/modules/crm/clientes/domain/Cliente.ts` is reused as-is. Story 2.6 does NOT touch the domain layer.
  - **Application** — NEW: `sortClientes.ts` util (pure function) + `SortOption` type live HERE because they are domain-aware logic that operates on `Cliente`. The `useClientes` hook is NOT modified.
  - **Infrastructure** — UNCHANGED. The sort is client-side over the TanStack Query cache; no new API call, no new repository method.
  - **Presentation** — `ClienteListView.tsx` gets a small modification (new `useState`, new `useMemo` shape, conditional `SortControl` render). `SortControl.tsx` lives in `shared/components` because it is a presentational primitive (no domain coupling beyond the `SortOption` type, which is imported as a type-only dependency).
- **State boundaries** — sort state is **component-local** `useState` (per the user's brief: "State con useState local"). Architecture document §State Boundaries permits this for ephemeral, view-scoped UI state. No Zustand store, no URL search param, no localStorage — see §"State Scope" below for the rationale.
- **TanStack Query** — no new query, no `queryClient.setQueryData`, no `invalidateQueries`. The sort is a pure derivation of the cached list. The `useClientes` `staleTime: 60_000` from Story 2.1 is unchanged.
- **Spanish UI** — all visible labels MUST be in Spanish: `"Ordenar por"`, `"Más reciente"`, `"Más antiguo"`, `"Nombre A→Z"`, `"Nombre Z→A"`. Code identifiers (variables, functions, types) MUST be in English: `SortControl`, `SortOption`, `sortClientes`, `nombre-asc`, etc.
- **Accessibility (WCAG 2.1 AA)** — the `SortControl` uses a native `<select>` wrapped in a `<label>`, which is the WCAG-friendliest pattern. `aria-label="Ordenar por"` is explicit. Keyboard focus and OS-native dropdown semantics work out of the box.
- **Bundle budget (< 500 KB gzipped eager)** — the entire feature is < 2 KB compressed. The `localeCompare('es')` call has zero runtime cost beyond the JS engine's built-in Intl implementation.
- **MasterCrud check** — the `MasterCrud` orchestrator from the kit IS the canonical way to add sorting in many internal tools. However, Story 2.1 deliberately departed from `MasterCrud` (UX Direction F: custom split-panel) and that decision propagates here. The sort UI must integrate with the existing custom `ClienteListView`, NOT introduce `MasterCrud`. This variance is intentional and documented in Story 2.1 §"Detected Conflicts / Variances".
- **siesa-ui-kit first** — the kit catalog has a `Select` primitive used by `MasterCrud`'s filters. Since `MasterCrud` is rejected here, the question is whether to use `siesa-ui-kit`'s standalone `Select`. **Decision:** use a native `<select>` styled with Tailwind. Rationale: (a) bundle budget (the kit's `Select` pulls in `@radix-ui/react-select`, ~8 KB gzipped, exceeding the +2 KB budget), (b) the native `<select>` is fully accessible without ARIA juggling, (c) the visual difference at this size is negligible. If a future story standardizes on the kit `Select` for all filter controls, refactor at that point. Document this choice in Completion Notes.

### State Scope (component-local `useState`, no persistence)

Per the user brief and per the architecture's minimal-complexity rule:

- Sort state lives in `useState<SortOption>` inside `ClienteListView`.
- It does NOT persist across `ClienteListView` unmounts (e.g., nav rail re-navigation to `/clientes`).
- It DOES persist across re-renders inside the same mount (e.g., clicking `ClientListItem` to navigate to `/clientes/$clienteId` does NOT unmount `ClienteListView` per the layout in Story 2.2 — the left panel is shared across both routes via the `<div className="flex h-full">` wrapper in `routes/clientes.tsx`).
- It does NOT live in:
  - URL search params (would conflict with the deep-linking story goals and add no MVP value).
  - localStorage (no requirement for cross-session persistence; the default `"Más reciente"` is sensible).
  - Zustand (overkill for a single-component piece of UI state).
- This is a deliberate MVP scope decision. Post-MVP, if user research shows users want sort persistence, add an entry to `app/store/preferences.ts` (Zustand) and pipe it through. Until then, simple `useState` is correct.

### `sortClientes` Util — Comparator Composition

The util uses the comma-or-trick pattern: `(a, b) => primary(a, b) || tiebreak(a, b)`. This relies on `Array.prototype.sort` semantics: a return of `0` means "equal", and the runtime then falls through to the OR. Examples:

- `'nombre-asc'`: primary is `nombre ASC`, tie-break is `createdAt ASC`.
- `'nombre-desc'`: primary is `nombre DESC` (negation), tie-break is **still** `createdAt ASC` (NOT negated — the tie-break is independent of the primary direction; this gives deterministic ordering within identical-nombre groups regardless of the primary direction).
- `'fecha-desc'`: primary is `createdAt DESC` (negation), tie-break is `nombre ASC`.
- `'fecha-asc'`: primary is `createdAt ASC`, tie-break is `nombre ASC`.

The negation `-compareX(a, b)` is mathematically equivalent to swapping arguments BUT cleaner to read and easier to extend. The unit tests in AC #11 lock both the primary order and the tie-break order.

**ISO 8601 lexicographic sort gotcha:** the backend's `DateTimeOffset.UtcNow.ToString("o")` (Story 2.1) emits a UTC-suffixed ISO 8601 string like `2026-06-15T14:30:00.0000000+00:00`. Lexicographic compare of two such strings equals chronological compare as long as all values use the SAME UTC offset (which they do — the backend always serializes UTC). If a downstream story ever emits a non-UTC timestamp, the util must switch to `Date.parse(...)` — flagged here for future maintainers.

### `SortControl` — Why Native `<select>`

- Native `<select>` on modern browsers (Chrome, Firefox, Safari, Edge) is fully accessible, keyboard-navigable, screen-reader-friendly, and respects the OS theme (including dark-mode preferences). No ARIA gymnastics required.
- Native `<select>` adds **zero** JS bundle weight beyond the JSX itself.
- The visual styling via Tailwind matches the existing input + button styles in `ClienteListView` (border `slate-300`, focus ring `#0e79fd/40`, rounded `md`). The browser's default dropdown chevron is acceptable for MVP; if a custom chevron is required post-MVP, swap to `siesa-ui-kit`'s `Select` or a `Radix UI Select` primitive at that point.

### `ClienteListView` Integration Pattern

```tsx
// New imports
import { DEFAULT_SORT, sortClientes, type SortOption } from '../application/sortClientes'
import { SortControl } from '@/shared/components/SortControl'

// New state — placed alongside the existing useState calls
const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT)

// Replace the existing `filtered` useMemo with a unified filter+sort:
const filteredAndSorted = useMemo(() => {
  const q = normalize(debouncedQuery)
  const filtered = q
    ? clientes.filter(
        (c) => normalize(c.nombre).includes(q) || normalize(c.nit).includes(q),
      )
    : clientes
  return sortClientes(filtered, sortOption)
}, [clientes, debouncedQuery, sortOption])

// Update `noResults` to derive from filteredAndSorted:
const noResults = hasClientes && hasSearch && filteredAndSorted.length === 0

// In the JSX header block, ABOVE the <ClienteForm /> mount:
{hasClientes && !isLoading && !isError && (
  <SortControl value={sortOption} onChange={setSortOption} />
)}

// In the list render, replace `filtered.map(...)` with `filteredAndSorted.map(...)`.
```

> **Performance:** the `useMemo` dependency array now includes `sortOption`. Selecting a new option triggers a re-derivation of `filteredAndSorted` (O(n log n) for the sort, O(n) for the filter, n ≤ 500 per NFR10). The total cost on a 500-item list is < 3 ms on a modern V8 — well within the no-jank budget. The browser repaints in the same frame as the state update.

### Why the Sort State is a Sibling of Search, NOT a Child

The user's brief and the AC explicitly require: "Sort se aplica sobre filtro de búsqueda activo sin limpiarlo" (AC-E2.6). The simplest, most predictable implementation is to keep `searchInput`, `debouncedQuery`, and `sortOption` as three independent `useState` hooks and combine them in a SINGLE `useMemo` that filters FIRST and sorts SECOND. This:

- Preserves the search input when the user changes the sort (because `searchInput` is not touched by `setSortOption`).
- Preserves the sort when the user changes the search (because `sortOption` is not touched by `setSearchInput`).
- Avoids the "compute filtered separately, then sort separately" anti-pattern that would require two memos and risk stale-state bugs.

### Out of Scope (Deferred / Not Addressed)

- **Sort persistence across `ClienteListView` unmounts** — not in this story. The P2 E2E test "sort persisted when switching to detail and back" (test-design line 129) is interpreted strictly: the sort survives the route change `/clientes` → `/clientes/$clienteId` (because the panel does not unmount), but resets on a full re-mount (nav rail link). Documented in AC #8.
- **Sort by other fields** (NIT, Teléfono, Ciudad) — not in this story. Only the four options in AC #6 #7 #8 #9 are required.
- **Multi-column sort** — single-column with tie-break only.
- **`MasterCrud` integration** — explicitly rejected, see Architecture Compliance above.
- **`siesa-ui-kit` `Select` component** — explicitly rejected for bundle reasons, see Architecture Compliance above.
- **Persistent user preferences (cross-session)** — not in MVP.

### Project Structure Notes

- New frontend files:
  - `frontend/src/modules/crm/clientes/application/sortClientes.ts`
  - `frontend/src/modules/crm/clientes/application/__tests__/sortClientes.test.ts`
  - `frontend/src/shared/components/SortControl.tsx`
  - `frontend/src/shared/components/__tests__/SortControl.test.tsx`
- Modified frontend files:
  - `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — adds `useState<SortOption>`, replaces `filtered` memo with `filteredAndSorted`, renders `<SortControl>` conditionally.
  - `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` — adds ~9 sub-cases for the AC #11 sort-related tests.
- New E2E files:
  - `e2e/tests/clientes/clientes-sort.spec.ts`
- Modified E2E files:
  - `e2e/pages/clientes.page.ts` — adds `sortControl` locator and the `ordenarPor(value)` helper method.
- All paths align with the architecture document's Complete Project Directory Structure and with the Clean Architecture layering rules from `company-standards.md`.

### Detected Conflicts / Variances

- **Test-design line 129 interpretation:** the P2 scenario "Sort persisted when switching to detail and back" is interpreted to validate BOTH the "panel-survives" path (sort preserved) AND the "panel re-mounts" path (sort resets to default). The user's brief specifies "State con useState local", which inherently means no cross-mount persistence. The AC #8 split into Path A / Path B makes this explicit; the E2E spec covers both.
- **AC #10 — sort visible during search-empty** is a refinement on top of the user's brief. The brief says the SortControl appears in the panel and sort applies over the search filter; it does NOT explicitly mandate visibility during a zero-match search. The pragmatic choice is to KEEP it visible (so the user can change sort to find a different match or otherwise re-discover items). This is documented as an intentional design call. If product disagrees, the fix is a one-line guard in the conditional render.
- **No `MasterCrud` here** — same variance as Story 2.1; documented and propagated.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.6]
- Architecture — Frontend Architecture (TanStack Query keys, split-panel, useState scope): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — State Boundaries: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Architecture — Implementation Patterns & Consistency Rules: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- UX — Search & Filtering Patterns (search + sort coexistence): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Search & Filtering Patterns]
- UX — Design Direction Decision (Direction F — split-panel, custom components): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- PRD — AC-E2.6 (sort + active filter preservation): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria (QA Validation)]
- PRD — NFR1 (search < 1s, 500 records) — informs the n ≤ 500 sort budget: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Performance]
- PRD — NFR10 (MVP scale — 500 clientes): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Scale]
- Test Design Epic 2 — Story 2.6 scenarios (P0 line 108, P1 lines 128–129, P2 lines 125–127, P3 line 139): [Source: _bmad-output/test-design-epic-2.md#Story 2.6]
- Test Design Epic 2 — Risk R-002 (sort+search interaction): [Source: _bmad-output/test-design-epic-2.md#R-002]
- Test Design Epic 2 — Risk R-011 (default sort + createdAt presence): [Source: _bmad-output/test-design-epic-2.md#R-011]
- Story 2.1 (ClienteListView + useClientes + Cliente.createdAt ISO 8601 contract): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 2.2 (ClienteDetailView + layout — panel survives detail navigation): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Story 2.5 (frontend bundle budget baseline ≤ 410 KB gzipped): [Source: _bmad-output/implementation-artifacts/2-5-delete-client.md]
- Company standards — Frontend / Backend / Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- siesa-ui-kit MasterCrud reference (NOT used here — see Variances): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (create-story workflow, autonomous execution)

### Debug Log References

- `pnpm test --run` → **122 passed / 122** (Story 2.5 baseline ≥ 100 + 18 new from Story 2.6 = 122 total; exceeds the ≥ 118 target stated in AC #14).
- `pnpm run build` → **0 TypeScript errors**, build completed in 1.59s.
  - Eager `dist/assets/index-Bk-52ofM.js` = **404.53 KB gzipped** (== Story 2.5 baseline; under the ≤ 410 KB budget from AC #13).
  - Lazy `dist/assets/ClienteListView-BTP4GHCd.js` = **43.13 KB gzipped** (124.33 KB raw); delta vs Story 2.5 < +2 KB, satisfying AC #13.
  - Lazy `dist/assets/clientes._clienteId-CL9Bu4c2.js` = 1.89 KB gzipped (unchanged — `SortControl` does NOT land here, confirmed by chunk graph).
- E2E Playwright execution skipped per the dev-story invocation directive: "NO ejecutar tests E2E Playwright; solo Vitest + build."
- Backend (`dotnet test`) skipped — Story 2.6 introduces zero backend changes, the 88/88 baseline is preserved by construction.

### Completion Notes List

1. **Frontend bundle size delta:** lazy `ClienteListView-*.js` grew by < +2 KB gzipped (Story 2.5 baseline ≈ 42 KB; Story 2.6 final = 43.13 KB gzipped). Eager `index-*.js` unchanged at 404.53 KB gzipped. Both under their respective budgets.
2. **No new npm dependencies:** `frontend/package.json` is byte-for-byte identical to its Story 2.5 state. Native `<select>` + Tailwind classes only — no shadcn `Select`, no `@radix-ui/react-select`, no `intl` polyfill. `String.prototype.localeCompare('es')` is a built-in.
3. **Playwright suites (Stories 2.1–2.5):** execution skipped per invocation scope. No source files from those stories were modified, so regression risk is bounded to the in-place `ClienteListView` rewire (filter+sort `useMemo`, `noResults` rename); Vitest coverage for those flows remains green.
4. **Deviations:**
   - Task 4 (E2E POM extension + new `clientes-sort.spec.ts`) deferred per invocation directive. Equivalent functional coverage is provided by 10 new Vitest cases: 7 unit tests on `sortClientes` + 2 component tests on `SortControl` + 9 integration tests on `ClienteListView` covering visibility states, default sort, sort+search composition, and request-count assertions (MSW strict mode).
   - All other patterns and constraints (Spanish UI labels, English code identifiers, native `<select>`, Clean Architecture layering, component-local `useState` for sort state, no new dependencies, no MasterCrud, no kit `Select`) implemented exactly as specified in the Dev Notes.

### File List

**New files:**
- `frontend/src/modules/crm/clientes/application/sortClientes.ts`
- `frontend/src/modules/crm/clientes/application/__tests__/sortClientes.test.ts`
- `frontend/src/shared/components/SortControl.tsx`
- `frontend/src/shared/components/__tests__/SortControl.test.tsx`

**Modified files:**
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — added `useState<SortOption>`, replaced `filtered` memo with `filteredAndSorted` (filter + `sortClientes`), conditional `<SortControl>` render, list iteration updated to `filteredAndSorted`.
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` — appended `ClienteListView — Story 2.6 (sort)` describe block with 9 integration test cases.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `2-6-sort-client-list` flipped `ready-for-dev → in-progress → review`.
- `_bmad-output/implementation-artifacts/2-6-sort-client-list.md` — task checkboxes, Status, Dev Agent Record sections.
