# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-30
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component

---

## Story Summary

Commercial team members need to quickly find clients from a list that loads at `/clientes`. The left panel (280px fixed width) shows a scrollable list of all clients with nombre and nit visible per item, and supports real-time case-insensitive search by nombre or NIT.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given clients in the system, When user navigates to `/clientes`, Then the left panel (280px fixed width) shows a scrollable list with `nombre` and `nit` visible per item.
2. **AC2** — Given the client list is loaded, When the user types in the search input, Then the list filters in real time showing only clients whose `nombre` or `nit` match the input (case-insensitive), with results in under 1 second for up to 500 records.
3. **AC3** — Given no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed inside the left panel with a message guiding the user to create the first client.
4. **AC4** — Given the backend is unavailable when the page loads, When GET `/api/v1/clientes` fails, Then an `ErrorPanel` component with a "Reintentar" button is displayed inside the left panel instead of the list.
5. **AC5** — Given the `/clientes` route renders, When no client is selected, Then the right panel displays a neutral empty/default state (no detail content).
6. **AC6** — Given the client list is fetched successfully, When `useClientes` returns data, Then the `['clientes']` TanStack Query cache is populated and subsequent navigations within the session do not trigger redundant network requests (staleTime > 0).

---

## Failing Tests Created (RED Phase)

### E2E Tests (16 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

- **Test:** should display client list panel at /clientes with 280px fixed width
  - **Status:** RED — `[data-testid="clientes-list-panel"]` not found (component not yet implemented)
  - **Verifies:** AC1 — left panel exists at /clientes

- **Test:** should show client nombre in the list item
  - **Status:** RED — `[data-testid="cliente-list-item"]` not found
  - **Verifies:** AC1 — nombre displayed per item

- **Test:** should show client nit in the list item
  - **Status:** RED — `[data-testid="cliente-list-item"]` not found
  - **Verifies:** AC1 — nit displayed per item

- **Test:** should render the search input with correct placeholder text
  - **Status:** RED — search input not rendered
  - **Verifies:** AC1 — search input with placeholder "Buscar por nombre o NIT..."

- **Test:** should filter list to show only clients matching the typed nombre
  - **Status:** RED — `[data-testid="search-clientes"]` not found
  - **Verifies:** AC2 — real-time filtering by nombre

- **Test:** should filter list case-insensitively (uppercase query matches lowercase nombre)
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2 — case-insensitive search

- **Test:** should filter list by nit when user types in the search input
  - **Status:** RED — nit search not implemented
  - **Verifies:** AC2 — search by nit

- **Test:** should complete filtering in under 1 second for 500 records
  - **Status:** RED — component not implemented (NFR1)
  - **Verifies:** AC2 + NFR1 — performance under 1s

- **Test:** should display EmptyState in the left panel when there are no clients
  - **Status:** RED — EmptyState not rendered
  - **Verifies:** AC3 — EmptyState shown when data is empty

- **Test:** should display EmptyState with a message guiding user to create first client
  - **Status:** RED — EmptyState text not present
  - **Verifies:** AC3 — guidance message in EmptyState

- **Test:** should display EmptyState when search query yields no matches
  - **Status:** RED — no-match EmptyState not implemented
  - **Verifies:** AC3 — EmptyState on zero search results

- **Test:** should display ErrorPanel in the left panel when GET /api/v1/clientes fails
  - **Status:** RED — ErrorPanel not rendered
  - **Verifies:** AC4 — ErrorPanel on API failure

- **Test:** should display "Reintentar" button inside ErrorPanel
  - **Status:** RED — Reintentar button not present
  - **Verifies:** AC4 — retry button in ErrorPanel

- **Test:** should NOT display the client list when ErrorPanel is visible
  - **Status:** RED — not implemented
  - **Verifies:** AC4 — no list items when error

- **Test:** should retry the API call when user clicks Reintentar
  - **Status:** RED — refetch not wired
  - **Verifies:** AC4 — retry handler calls refetch

- **Test:** should display a neutral default state in the right panel at /clientes with no selection
  - **Status:** RED — right panel default state not implemented
  - **Verifies:** AC5 — neutral right panel when no client selected

- **Test:** should NOT show client detail content in the right panel when no client is selected
  - **Status:** RED — detail panel not implemented
  - **Verifies:** AC5 — no detail content without selection

### API Tests (8 tests)

**File:** `e2e/tests/api/clientes-list.api.spec.ts`

- **Test:** should respond with HTTP 200
  - **Status:** RED — GET /api/v1/clientes endpoint not yet registered
  - **Verifies:** AC4 — API endpoint exists and responds 200

- **Test:** should return content-type application/json
  - **Status:** RED — endpoint not registered
  - **Verifies:** AC4 — correct content type

- **Test:** should return a direct array (not wrapped in an object)
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC4 + architecture contract — no wrapper

- **Test:** should return an empty array when no clients exist
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC4 — empty array, not null

- **Test:** should return ClienteDto with all required fields for each item
  - **Status:** RED — ClienteDto not yet defined
  - **Verifies:** AC4 — DTO shape (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)

- **Test:** should return clients ordered by nombre alphabetically
  - **Status:** RED — GetAllAsync with OrderBy(c => c.Nombre) not implemented
  - **Verifies:** AC1 — alphabetical ordering

- **Test:** should respond with Problem Details RFC 7807 format on server error
  - **Status:** RED — depends on endpoint registration
  - **Verifies:** AC4 — error format contract

- **Test:** should only call GET /api/v1/clientes once when navigating within the same session
  - **Status:** RED — useClientes with staleTime not implemented
  - **Verifies:** AC6 — cache prevents redundant network requests

- **Test:** should populate the clientes list from cache without loading skeleton on second visit
  - **Status:** RED — staleTime not configured
  - **Verifies:** AC6 — no skeleton on cached navigation

### Component Tests (18 tests)

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts` (8 tests)

- **Test:** should return isLoading=true initially before data arrives
  - **Status:** RED — useClientes.ts does not exist
  - **Verifies:** AC1 — loading state

- **Test:** should return the list of clientes after successful fetch
  - **Status:** RED — useClientes.ts does not exist
  - **Verifies:** AC1 — data returned from hook

- **Test:** should return isLoading=false and data populated after fetch completes
  - **Status:** RED — hook not implemented
  - **Verifies:** AC1 — post-fetch state

- **Test:** should return isError=true when GET /api/v1/clientes fails with 500
  - **Status:** RED — hook not implemented
  - **Verifies:** AC4 — error state exposed

- **Test:** should expose a refetch function for the ErrorPanel retry button
  - **Status:** RED — hook not implemented
  - **Verifies:** AC4 — refetch exposed

- **Test:** should recover data after refetch when backend becomes available again
  - **Status:** RED — hook not implemented
  - **Verifies:** AC4 — retry recovers data

- **Test:** should use queryKey ["clientes"] (canonical key from architecture)
  - **Status:** RED — hook not implemented
  - **Verifies:** AC6 — canonical query key

- **Test:** should serve data from cache without a new network request within staleTime
  - **Status:** RED — staleTime not configured
  - **Verifies:** AC6 — staleTime: 30_000

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (18 tests)

- **Test:** should render loading skeletons while isLoading is true
  - **Status:** RED — ClienteListView.tsx does not exist
  - **Verifies:** AC1 (loading) — skeleton shown

- **Test:** should NOT render the client list while loading
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — no items during load

- **Test:** should render a list item for each client
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — one item per client

- **Test:** should display client nombre in each list item
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — nombre visible

- **Test:** should display client nit in each list item
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — nit visible

- **Test:** should render the search input with aria-label="Buscar clientes"
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — accessible search input

- **Test:** should render search input with placeholder "Buscar por nombre o NIT..."
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — correct placeholder

- **Test:** should render the list panel container with testid "clientes-list-panel"
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — panel testid present

- **Test:** should show only matching clients when user types in the search input
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2 — nombre filter

- **Test:** should filter case-insensitively
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2 — case-insensitive

- **Test:** should filter by nit when user types a nit fragment
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2 — nit filter

- **Test:** should restore the full list when search input is cleared
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2 — clear restores list

- **Test:** should show EmptyState when no items match the search query
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — EmptyState on zero search results

- **Test:** should display EmptyState component when there are no clients
  - **Status:** RED — component not implemented
  - **Verifies:** AC3 — EmptyState on empty data

- **Test:** should NOT display client list items when data is empty
  - **Status:** RED — component not implemented
  - **Verifies:** AC3 — no items with empty data

- **Test:** should render ErrorPanel when isError is true
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — error state

- **Test:** should render "Reintentar" button inside ErrorPanel
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — retry button

- **Test:** should call refetch when user clicks "Reintentar"
  - **Status:** RED — refetch not wired
  - **Verifies:** AC4 — refetch called on retry

---

## Data Factories Created

### Cliente Factory

**File:** `e2e/helpers/data.helper.ts` (already exists — `buildCliente()`)

**Exports:**
- `buildCliente(overrides?)` — Create a single cliente payload with unique generated fields

**Example Usage:**
```typescript
const data = buildCliente({ nombre: 'Empresa Custom', nit: '900111222-1' });
const cliente = await apiHelper.createCliente(data);
```

---

## Fixtures Created

### E2E Base Fixture (already exists)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**
- `clientesPage` — Navigates to `/clientes` before test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** page pre-navigated to /clientes
  - **Cleanup:** none (stateless navigation)

---

## Mock Requirements

### GET /api/v1/clientes

**Endpoint:** `GET /api/v1/clientes`

**Success Response:**
```json
[
  {
    "id": "uuid-string",
    "nombre": "Empresa ABC",
    "nit": "900123456-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

**Failure Response (500):**
```json
{
  "title": "Internal Server Error",
  "status": 500,
  "traceId": "..."
}
```

**Notes:** Direct array — no wrapper object. E2E tests use `page.route('**/api/v1/clientes', ...)` with network-first pattern (intercept BEFORE `page.goto()`).

---

## Required data-testid Attributes

### ClienteListView (left panel)

- `clientes-list-panel` — The 280px fixed-width left panel container
- `search-clientes` — The search text input (`aria-label="Buscar clientes"`)
- `cliente-list-item` — Each individual client row in the list
- `clientes-loading-skeleton` — Skeleton loader container (visible while isLoading)
- `empty-state` — EmptyState component (visible when data is [] or search yields 0 results)
- `error-panel` — ErrorPanel component (visible when isError=true)

### ClienteListItem (each row)

- `cliente-list-item` — The row element itself (`role="button"`, `tabIndex={0}`)

### ClientesPage (full page)

- `cliente-detail-panel` — Right panel container
- `cliente-detail-content` — Detail content block (only rendered when a client is selected)

**Implementation Example:**
```tsx
<aside data-testid="clientes-list-panel">
  <input data-testid="search-clientes" aria-label="Buscar clientes" placeholder="Buscar por nombre o NIT..." />
  {isLoading && <div data-testid="clientes-loading-skeleton">...</div>}
  {isError && <div data-testid="error-panel"><button>Reintentar</button></div>}
  {!isLoading && !isError && filteredClientes.length === 0 && <div data-testid="empty-state">...</div>}
  {filteredClientes.map(c => (
    <div key={c.id} data-testid="cliente-list-item" role="button" tabIndex={0}>...</div>
  ))}
</aside>
```

---

## Implementation Checklist

### Test: AC1 — Client list renders with nombre and nit (E2E + Component)

**Files:**
- `e2e/tests/clientes/client-list-search.spec.ts` (AC1 describe block)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (data loaded describe block)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — repository interface
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios impl
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook
- [ ] Create `frontend/src/shared/components/ClienteListItem.tsx` — list item component
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — 280px left panel
- [ ] Add `data-testid="clientes-list-panel"` to the aside/div container
- [ ] Add `data-testid="search-clientes"` and `aria-label="Buscar clientes"` to the input
- [ ] Add `data-testid="cliente-list-item"` and `role="button"` `tabIndex={0}` to each item
- [ ] Display `nombre` (bold, `text-sm`) and `nit` (`text-xs text-slate-500`) per item
- [ ] Run E2E: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts`
- [ ] Run component: `pnpm --filter frontend test`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC2 — Real-time search filtering (E2E + Component)

**Files:**
- `e2e/tests/clientes/client-list-search.spec.ts` (AC2 describe block)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (search filtering describe block)

**Tasks to make these tests pass:**

- [ ] Add `useState<string>('')` for `searchQuery` in `ClienteListView`
- [ ] Implement `useMemo` filter: `nombre.toLowerCase().includes(q) || nit.toLowerCase().includes(q)`
- [ ] Wire `onChange` on the search input to update `searchQuery`
- [ ] Verify filtering completes in < 1s for 500 records (client-side, no API call)
- [ ] Run E2E: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — EmptyState (E2E + Component)

**Files:**
- `e2e/tests/clientes/client-list-search.spec.ts` (AC3 describe block)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (empty state describe block)

**Tasks to make these tests pass:**

- [ ] Use `EmptyState` from `siesa-ui-kit` (check catalog) or create custom in `frontend/src/shared/components/EmptyState.tsx`
- [ ] Render EmptyState when `data?.length === 0` or `filteredClientes.length === 0`
- [ ] Add `data-testid="empty-state"` to the EmptyState component
- [ ] Include guidance message: e.g., "No hay clientes. Crea el primer cliente para comenzar."
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — ErrorPanel with Reintentar (E2E + API + Component)

**Files:**
- `e2e/tests/clientes/client-list-search.spec.ts` (AC4 describe block)
- `e2e/tests/api/clientes-list.api.spec.ts` (AC4 describe block)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (error state describe block)

**Tasks to make these tests pass:**

- [ ] Implement backend: `ClienteEntity`, `IClienteRepository`, `ClienteRepository`, `GetClientesQueryHandler`, `ClienteEndpoints` (Tasks 7-11 from story)
- [ ] Register `GET /api/v1/clientes` via `app.MapClienteEndpoints()` in `Program.cs`
- [ ] Use `EmptyState`/`ErrorPanel` from `siesa-ui-kit` or create `ErrorPanel` in `frontend/src/shared/components/ErrorPanel.tsx`
- [ ] Render ErrorPanel when `isError === true` in `ClienteListView`
- [ ] Add `data-testid="error-panel"` to the ErrorPanel container
- [ ] Add "Reintentar" button with `onClick={refetch}` inside ErrorPanel
- [ ] Ensure `useClientes` exposes `refetch` from `useQuery`
- [ ] Run API: `npx playwright test e2e/tests/api/clientes-list.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours (backend + frontend)

---

### Test: AC5 — Right panel neutral state (E2E)

**File:** `e2e/tests/clientes/client-list-search.spec.ts` (AC5 describe block)

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` — two-panel layout route
- [ ] Right panel: `data-testid="cliente-detail-panel"` with text "Selecciona un cliente para ver sus detalles" when no client is selected
- [ ] Ensure `data-testid="cliente-detail-content"` is ABSENT when no client selected
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC6 — TanStack Query cache / staleTime (API + Component)

**Files:**
- `e2e/tests/api/clientes-list.api.spec.ts` (AC6 describe block)
- `frontend/src/modules/crm/clientes/application/useClientes.test.ts` (cache describe block)

**Tasks to make these tests pass:**

- [ ] Set `staleTime: 30_000` in `useClientes` hook
- [ ] Verify `queryKey: ['clientes']` is the canonical key
- [ ] Verify second navigation within session does not trigger a second network call
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E tests for this story
npx playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run API contract tests
npx playwright test e2e/tests/api/clientes-list.api.spec.ts

# Run all E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --headed

# Run all component/unit tests (Vitest)
pnpm --filter frontend test

# Run only useClientes hook tests
pnpm --filter frontend test src/modules/crm/clientes/application/useClientes.test.ts

# Run only ClienteListView component tests
pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteListView.test.tsx

# Debug E2E test
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --debug

# Run with coverage
pnpm --filter frontend test:coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Fixtures and factories created (data.helper.ts, base.fixture.ts)
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages: "Cannot find module './useClientes'" (hook doesn't exist), Playwright "locator not found" (components not rendered)
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with highest priority)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order (dependency-driven):**
1. Backend: Tasks 7-11 (Entity, Repository, Handler, Endpoint) → AC4 API tests
2. Frontend domain + infra: Tasks 1-3 (Cliente.ts, IClienteRepository.ts, clienteApiRepository.ts, useClientes.ts) → AC6 component tests
3. Frontend presentation: Tasks 4-6 (ClienteListItem, ClienteListView, ClientesPage) → AC1/2/3/4/5 E2E + component tests

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all tests pass (green phase complete)
2. Review code for quality (readability, maintainability, performance)
3. Extract duplications (DRY principle)
4. Optimize performance (if needed)
5. Ensure tests still pass after each refactor
6. Update documentation (if API contracts change)

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/clientes/ && pnpm --filter frontend test`
3. **Begin implementation** using implementation checklist as guide (backend first, then frontend)
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'in-progress' then 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: `page.route('**/api/v1/clientes', ...)` called BEFORE `page.goto()` to prevent race conditions
- **data-factories.md** — `buildCliente()` factory with unique counter-based IDs and optional overrides
- **fixture-architecture.md** — `base.fixture.ts` extended test with `clientesPage` auto-setup fixture
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, explicit waits (no `sleep`)
- **selector-resilience.md** — `data-testid` selectors preferred over CSS/text selectors (`data-testid="cliente-list-item"` vs `.list-item`)
- **test-levels-framework.md** — E2E for user journeys (AC1-5), API for backend contract (AC4, AC6), Component for UI logic (AC1-4, AC6)
- **component-tdd.md** — `vi.mock('../application/useClientes')` to isolate component from network, MSW for hook integration tests

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected Commands:**
```bash
npx playwright test e2e/tests/clientes/client-list-search.spec.ts
pnpm --filter frontend test src/modules/crm/clientes/
```

**Expected Results:**

```
E2E: 17 failed (component/endpoint not implemented)
API: 8 failed (GET /api/v1/clientes not registered)
Component (useClientes): 8 failed (Cannot find module './useClientes')
Component (ClienteListView): 18 failed (Cannot find module './ClienteListView')
```

**Summary:**

- Total tests: 51
- Passing: 0 (expected)
- Failing: 51 (expected)
- Status: RED phase — tests define the contract, implementation follows

---

## Notes

- The `clientes-crud.spec.ts` file already covers FR4 (create) and FR7/FR8 (validation). Story 2.1 ATDD tests focus exclusively on AC1-AC6 (list, search, empty state, error state, right panel, caching).
- `tea_use_playwright_utils: false` — pure Playwright patterns used (no playwright-utils lib).
- `tea_use_mcp_enhancements: false` — AI Generation Mode used (standard patterns, not recording mode).
- Backend endpoint `GET /api/v1/clientes` returns a direct array (`ClienteDto[]`) — no wrapper object per architecture contract.
- `searchQuery` is local `useState` — NOT Zustand, NOT URL param (architecture decision).
- `staleTime: 30_000` (30 seconds) is the canonical configuration for `useClientes`.

---

**Generated by BMad TEA Agent** — 2026-06-30
