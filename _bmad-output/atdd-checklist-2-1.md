# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-15
**Author:** SiesaTeam (TEA agent)
**Primary Test Level:** E2E (Playwright) + API Integration (xUnit) + Component (Vitest + RTL + MSW)

---

## Story Summary

Story 2.1 lands the read-side of the Clientes module: the backend exposes
`GET /api/v1/clientes` backed by a new `ClienteEntity` + EF Core migration
(`clientes` table, snake_case columns, `uk_clientes_nit` unique index), and
the frontend renders a 280px split-panel list with a client-side search
input that filters by `nombre` OR `nit` in under 1 second over up to 500
records. The view handles loading, empty, search-empty, and error states
with a `Reintentar` recovery path that refetches without a page reload.

**As a** commercial team member,
**I want** to see a list of all clients and search them by name or NIT/RUC,
**So that** I can quickly find the client I'm looking for.

---

## Acceptance Criteria

1. AC #1 / AC-E2.1 / FR1, FR2 — `<aside data-testid="clientes-list-panel">` (280px) renders one `ClienteListItem` per record, showing `nombre` + `nit`.
2. AC #2 / AC-E2.2 / FR2-FR4 / NFR1 — search filters CLIENT-SIDE in < 1s over up to 500 records by `nombre` OR `nit` (case-insensitive, trim-aware); no extra network request.
3. AC #3 / FR2 — empty backend response → `clientes-empty-state` panel with "Aún no hay clientes" Spanish copy; search input stays visible (disabled).
4. AC #4 / NFR6 — 5xx response → `clientes-error-panel` with "No se pudieron cargar los clientes" Spanish copy and a `Reintentar` button that calls `query.refetch()`; on success the panel is replaced by the list with no page reload.
5. AC #5 / FR2 — zero search matches → `clientes-search-empty` panel with `«{query}»` interpolation; input remains focused and editable.
6. AC #6 / FR1, FR2 — `GET /api/v1/clientes` returns HTTP 200 with a `ClienteDto[]` (direct array, camelCase, `[]` when empty).
7. AC #7 — EF migration `AddClientes` creates PostgreSQL `clientes` with snake_case columns and unique index `uk_clientes_nit`.
8. AC #8 — Database column / index / PK names appear exactly snake_case in `\d clientes`.
9. AC #9 — `pnpm run build` is green in strict mode; bundle stays < 500 KB gzipped.
10. AC #10 — 3 API integration tests pass (empty, seeded camelCase, snake_case model assertion).
11. AC #11 — 6 Vitest + RTL component tests pass (panel width, filter by nombre, filter by nit, empty, error+retry, 500-record perf).

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests — covers AC #1, #2, #3, #4, #5, P0 scenarios)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts` (~210 lines)

- **Test:** `GIVEN three clientes WHEN user searches by nombre "Acme" THEN only the matching item is visible`
  - **Status:** RED — `clientes-list-panel`, `clientes-search-input`, and `cliente-list-item` testids do not exist on `/clientes` (placeholder route only renders `<h1>Clientes</h1>`).
  - **Verifies:** AC #1, AC #2 — search by `nombre` and no extra network call.
- **Test:** `GIVEN three clientes WHEN user searches by a NIT substring "901222" THEN only the matching item is visible`
  - **Status:** RED — same reason as above.
  - **Verifies:** AC #2 — search by `nit`.
- **Test:** `GIVEN backend returns an empty list WHEN /clientes loads THEN the empty-state panel is shown`
  - **Status:** RED — `clientes-empty-state` panel not implemented.
  - **Verifies:** AC #3.
- **Test:** `GIVEN GET /clientes returns 500 WHEN ErrorPanel is shown AND user clicks Reintentar AND second call returns 200 THEN list renders`
  - **Status:** RED — `clientes-error-panel` + `Reintentar` button + refetch wiring not implemented.
  - **Verifies:** AC #4 / R-009.
- **Test:** `GIVEN three clientes WHEN user searches "zzz-no-match" THEN search-empty panel is shown and input remains editable`
  - **Status:** RED — `clientes-search-empty` panel not implemented.
  - **Verifies:** AC #5.
- **Test:** `GIVEN clientes are loaded WHEN /clientes renders THEN the list panel reports a width of 280px`
  - **Status:** RED — view does not render the aside element yet.
  - **Verifies:** AC #1 visual contract.

### API Integration Tests (3 tests — AC #10)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClientesEndpointsTests.cs` (~200 lines)

- **Test:** `GetClientes_WhenEmpty_Returns200WithEmptyArray`
  - **Status:** RED — endpoint `GET /api/v1/clientes` not yet registered; `ClienteEntity` / `ClienteDto` / `GetClientesQueryHandler` not implemented.
  - **Verifies:** AC #6, AC #10.
- **Test:** `GetClientes_WhenSeeded_ReturnsAllInCamelCaseShape`
  - **Status:** RED — same as above. Also reflection-locates `ClienteEntity.Create(...)` factory which does not exist yet.
  - **Verifies:** AC #6 (camelCase contract), AC #10.
- **Test:** `ClientesTable_AfterMigration_HasSnakeCaseColumns`
  - **Status:** RED — `AppDbContext.Clientes` DbSet + `ClienteConfiguration` not yet declared, so `Model.FindEntityType(ClienteEntity)` returns `null`.
  - **Verifies:** AC #7, AC #8, AC #10.

### Component Tests (10 tests — AC #11 + smoke tests for shared components)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` (~220 lines)

- **Test:** `panel renders with 280px width and 3 items` — AC #11.1, AC #1.
- **Test:** `filters by nombre "Acme"` — AC #11.2.
- **Test:** `filters by nit "901222"` — AC #11.3.
- **Test:** `empty state when backend returns []` — AC #11.4, AC #3.
- **Test:** `ErrorPanel + Reintentar recovers` — AC #11.5, AC #4.
- **Test:** `filter 500 records under 1000ms` — AC #11.6, NFR1, R-004.

  All six tests are RED because `ClienteListView`, `useClientes`, and the shared components have not been implemented.

**File:** `frontend/src/shared/components/__tests__/EmptyState.test.tsx` (~50 lines)

- **Test:** `default variant renders title + description + testId in Spanish` — Smoke for AC #3.
- **Test:** `variant="search-empty" renders the search-empty panel` — Smoke for AC #5.

**File:** `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` (~55 lines)

- **Test:** `renders title + description + Reintentar button` — Smoke for AC #4.
- **Test:** `onRetry is invoked once on click` — Smoke for AC #4 callback wiring.

  All four shared-component tests are RED because the components do not yet exist.

---

## Data Factories Created

### Bulk Cliente Factory

**File:** `e2e/helpers/data.helper.ts` (extended)

**New export:**

- `buildClienteBulk(count: number)` — produces `count` deterministic `ClienteDto` shapes (camelCase, valid UUID-shaped ids, monotonic `createdAt`). Used by Playwright `page.route` for the 500-record performance scenario AND mirrored by an inline `buildBulk` helper inside the Vitest component test (no cross-import to keep node/browser boundaries clean).

**Example Usage:**

```ts
await page.route('**/api/v1/clientes', (route) =>
  route.fulfill({
    status: 200,
    body: JSON.stringify(buildClienteBulk(500)),
    contentType: 'application/json',
  }),
);
```

---

## Fixtures Created

No new fixtures were added beyond the existing `e2e/fixtures/base.fixture.ts`
(which already provides the `clientesPage` navigation fixture). The new E2E
tests rely on the existing `ClientesPage` POM (extended below).

### Existing POM Extension

**File:** `e2e/pages/clientes.page.ts` (extended)

**New locators (Story 2.1):**

- `errorPanel` — `page.getByTestId('clientes-error-panel')`
- `emptyStatePanel` — `page.getByTestId('clientes-empty-state')`
- `searchEmptyPanel` — `page.getByTestId('clientes-search-empty')`
- `btnReintentar` — `page.getByRole('button', { name: /reintentar/i })`

These align verbatim with Task 12 in the story and with the test-design-epic-2
P0 scenarios.

---

## Mock Requirements

All E2E tests intercept the network through Playwright's `page.route` before
navigation (network-first pattern) — no backend is required to run them.

### `GET /api/v1/clientes` Mock (per test scenario)

**Happy path (3 records):**

```json
[
  { "id": "...", "nombre": "Acme Industrial S.A.S.", "nit": "900111222-1", "telefono": "3001112233", "ciudad": "Bogotá", "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "..." },
  { "id": "...", "nombre": "Comercializadora Andina Ltda.", "nit": "901222333-2", "telefono": "3002223344", "ciudad": "Medellín", "createdAt": "...", "updatedAt": "..." },
  { "id": "...", "nombre": "Distribuciones del Pacífico", "nit": "902333444-3", "telefono": "3003334455", "ciudad": "Cali", "createdAt": "...", "updatedAt": "..." }
]
```

**Empty:** `[]` with `Content-Type: application/json`.

**Error:** HTTP 500 with body `{ "status": 500, "title": "Internal Server Error" }` and `Content-Type: application/problem+json` (matches the RFC 7807 contract from Story 1.3).

**Recovery (Reintentar):** the test increments a `callCount`; first call returns 500, second call returns the happy-path payload.

### MSW handlers (Component tests)

Strict mode (`onUnhandledRequest: 'error'`) — guarantees `useMemo`-based
filtering never fires extra HTTP traffic per AC #2.

---

## Required data-testid Attributes

### `/clientes` list panel

- `clientes-list-panel` — `<aside>` wrapper, 280px wide.
- `clientes-search-input` — search `<input>` with `placeholder="Buscar cliente por nombre o NIT/RUC"`.
- `cliente-list-item` — applied to every `ClienteListItem` button.
- `clientes-empty-state` — empty-state panel when 0 records.
- `clientes-search-empty` — empty-state panel when 0 search matches.
- `clientes-error-panel` — error panel when `useClientes` returns an error.

**Implementation Example:**

```tsx
<aside data-testid="clientes-list-panel" className="w-[280px] shrink-0 overflow-y-auto …">
  <input data-testid="clientes-search-input" placeholder="Buscar cliente por nombre o NIT/RUC" />
  {/* … */}
  <button data-testid="cliente-list-item" data-active={isSelected}>
    <div className="font-medium">{cliente.nombre}</div>
    <div className="text-sm text-slate-500">{cliente.nit}</div>
  </button>
</aside>
```

---

## Implementation Checklist

### Test: E2E search by nombre / nit

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement `ClienteEntity` (Task 1) and `ClienteRepository` (Task 4).
- [ ] Implement `GetClientesQueryHandler` + `ClienteDto` (Task 5).
- [ ] Wire `GET /api/v1/clientes` endpoint (Task 6) BEFORE `app.MapFallback(...)`.
- [ ] Generate `AddClientes` migration; apply with `dotnet ef database update` (Task 3).
- [ ] Build `useClientes` TanStack Query hook (Task 7).
- [ ] Build `ClienteListView` with `data-testid="clientes-list-panel"`, search input, and `useMemo` filter (Task 8).
- [ ] Replace `/clientes` route placeholder (Task 9).
- [ ] Run: `pnpm exec playwright test e2e/tests/clientes/clientes-list-search.spec.ts`.
- [ ] All 6 E2E tests pass (green phase).

### Test: API integration

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClientesEndpointsTests.cs`

**Tasks to make these tests pass:**

- [ ] `ClienteEntity` with `Create(string, string, string?, string?)` factory + `Update(...)` (Task 1).
- [ ] `IClienteRepository` interface in Domain (Task 1) + `ClienteRepository` in Infrastructure (Task 4).
- [ ] `ClienteConfiguration.cs` mapping → table `clientes`, columns snake_case, unique index `uk_clientes_nit` (Task 2).
- [ ] `DbSet<ClienteEntity> Clientes` on `AppDbContext` (Task 2).
- [ ] `ClienteDto` + `GetClientesQuery` + `GetClientesQueryHandler` registered via DI (Task 5).
- [ ] `MapClienteEndpoints` registered on `app` in `Program.cs` (Task 6).
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests`.
- [ ] All 3 API tests pass (green phase).

### Test: Component (Vitest)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Implement `EmptyState` shared component supporting `variant: 'default' | 'search-empty' | 'no-clients'` (Task 8).
- [ ] Implement `ErrorPanel` with `onRetry` prop wired to a `Reintentar` button (Task 8).
- [ ] Implement `ClientListItem` rendering `nombre` (font-medium) + `nit` (text-sm) with `data-testid="cliente-list-item"` (Task 8).
- [ ] Implement `ClienteListView` per Task 8 (conditional rendering tree).
- [ ] Run: `pnpm --filter frontend test`.
- [ ] All 10 component tests pass (green phase).

---

## Running Tests

```bash
# E2E (RED → GREEN with frontend + backend running)
pnpm exec playwright test e2e/tests/clientes/clientes-list-search.spec.ts

# API integration tests
dotnet test backend/tests/SiesaAgents.IntegrationTests

# Frontend component tests
pnpm --filter frontend test

# Watch mode (faster TDD loop)
pnpm --filter frontend test:watch

# Headed E2E (visual debugging)
pnpm exec playwright test e2e/tests/clientes/clientes-list-search.spec.ts --headed
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 19 tests written and failing (6 E2E + 3 API + 6 component + 4 smoke).
- Network-first interception applied in every E2E + component scenario.
- MSW strict mode (`onUnhandledRequest: 'error'`) blocks accidental fetches.
- Each test uses Given-When-Then comments and one logical assertion.

### GREEN Phase (DEV Team)

1. Pick one failing test from the implementation checklist (start with API → component → E2E for the shortest feedback loop).
2. Implement the minimal production code to flip it green.
3. Re-run the targeted test before moving to the next.
4. Repeat until all 19 tests are green.

### REFACTOR Phase (DEV Team)

1. All tests passing.
2. Extract `normalize` helper if duplicated.
3. Inline the 150ms debounce per the story Dev Notes (no third-party library — bundle budget NFR).
4. Verify `pnpm run build` stays under 500 KB gzipped (AC #9).

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

Tests are not yet executed in this environment (no backend / frontend boot
performed by the TEA workflow). Expected failure modes per test file:

- **E2E (Playwright):** `Locator … getByTestId('clientes-list-panel')` times
  out — the current `/clientes` route still renders the `<h1>Clientes</h1>`
  placeholder from Story 1.2.
- **API (xUnit):** `Microsoft.EntityFrameworkCore.InvalidOperationException`
  or `NullReferenceException` from `LocateClienteEntityType()` because
  `SiesaAgents.Domain.Clientes.Entities.ClienteEntity` does not exist.
- **Component (Vitest):** module resolution error
  `Cannot find module '@/modules/crm/clientes/presentation/ClienteListView'`.

**Summary:**

- Total tests: 19
- Passing: 0 (expected)
- Failing: 19 (expected)
- Status: RED phase verified by source review

**Verification Command (to be run by DEV when ready):**

```bash
# Expect all to fail.
pnpm exec playwright test e2e/tests/clientes/clientes-list-search.spec.ts
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~ClientesEndpointsTests"
pnpm --filter frontend test
```

---

## Notes

- The component test suite reuses the existing `frontend/src/test/setup.ts`
  bootstrap (jest-dom + configurable `window.location`). No new global setup
  is required.
- `e2e/helpers/data.helper.ts` was extended (not replaced) with
  `buildClienteBulk(count)`; the existing `buildCliente` factory remains
  untouched to avoid regressions in `clientes-crud.spec.ts`.
- The new POM locators on `ClientesPage` are additive — existing tests that
  reference `btnNuevoCliente`, `inputNombre`, etc. continue to compile.
- The 500-record performance test asserts `< 1000ms` via `performance.now()`
  — well below the `< 5ms` realistic upper bound documented in the story Dev
  Notes ("For 500 records this is < 5 ms in modern V8"). The 1s threshold
  exists to keep the test resilient to CI noise while still catching a
  regression that wires the filter through the API instead of in-memory.
- The API integration test runs against an `UseInMemoryDatabase` provider
  swap inside `InMemoryFactory` (a subclass of `SiesaAgentsApiFactory`),
  matching the architectural decision in AC #11 ("Use `InMemoryDatabase`
  provider OR build a dedicated in-memory `DbContextOptions<AppDbContext>`
  to keep tests isolated").

---

## Knowledge Base References Applied

- **fixture-architecture.md** — auto-cleanup discipline (Playwright POM extension is additive; QueryClient is fresh per test).
- **data-factories.md** — `buildClienteBulk` produces deterministic shapes; overrides not yet needed for read-only flows.
- **network-first.md** — every E2E scenario calls `page.route(...)` BEFORE `clientesPage.goto()`.
- **selector-resilience.md** — every selector is `data-testid` or `getByRole`; no CSS class selectors used.
- **timing-debugging.md** — `waitFor` + `findBy*` replace hard waits; `performance.now()` measures the filter delta.
- **test-quality.md** — Given-When-Then comments + atomic asserts per test; no shared QueryClient cache across tests.
- **test-levels-framework.md** — E2E for the user-visible journey, API for the contract (camelCase + snake_case model), component for the rendering and 500-record perf bound.

---

**Generated by BMad TEA Agent** — 2026-06-15
