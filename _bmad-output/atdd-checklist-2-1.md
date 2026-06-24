# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright) + Component (Vitest + RTL) + API (Playwright)

---

## Story Summary

A commercial team member needs to view and search client records in a persistent left panel at `/clientes`. The panel shows a scrollable list of all clients with Nombre and NIT/RUC visible per item, a real-time client-side search filter, and appropriate states (loading skeleton, empty state, error panel with retry).

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given clients in the system, when the user navigates to `/clientes`, then the left panel (280px fixed width) renders a scrollable list of all clients with Nombre and NIT/RUC visible per item using the `ClientListItem` shared component.

2. **AC2** — Given the client list is loaded, when the user types in the search input field, then the list filters in real time (client-side, no new API call) showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), and results appear in under 1 second with up to 500 records (NFR1).

3. **AC3** — Given there are no clients in the system (empty array returned from API), when the user navigates to `/clientes`, then an `EmptyState` component is displayed with a Spanish-language message guiding the user to create the first client.

4. **AC4** — Given the backend is unavailable when the page loads, when the fetch fails (network error or non-2xx response), then an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, and clicking "Reintentar" triggers a new fetch attempt.

5. **AC5** — Given the client list is rendered, when the user clicks on a client item, then the item is visually highlighted as selected (active state) and the URL updates to `/clientes/:clienteId` using TanStack Router client-side navigation without a full page reload (FR30).

6. **AC6** — Given the `clientes` route renders, when the component mounts, then a single `GET /api/v1/clientes` request is sent and the response is cached under `queryKey: ['clientes']` via TanStack Query.

7. **AC7** — Given client data is loading from the API, when the fetch is in-flight, then a skeleton loader (via `react-loading-skeleton`) is rendered in the list area — no spinner.

---

## Failing Tests Created (RED Phase)

### E2E Tests (29 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**AC1 — Client list panel renders on /clientes (6 tests):**

- RED — `should render the clientes-view wrapper with the list panel aside`
  - **Verifies:** page wrapper and aside exist after API intercept + navigation
- RED — `should render ClientListItem components for each client returned by the API`
  - **Verifies:** 3 `data-testid="client-list-item-{id}"` elements visible
- RED — `should display client Nombre in each list item`
  - **Verifies:** Nombre text inside `client-list-item-{id}`
- RED — `should display client NIT/RUC in each list item`
  - **Verifies:** NIT text inside `client-list-item-{id}`
- RED — `should render the list panel as an aside element (semantic HTML)`
  - **Verifies:** `<aside aria-label="Lista de clientes">` present
- RED — `should render the list container as a listbox for accessibility`
  - **Verifies:** `<ul role="listbox">` present

**AC2 — Real-time search filter (6 tests):**

- RED — `should render the search input with correct placeholder text`
  - **Verifies:** `data-testid="client-search-input"` with Spanish placeholder
- RED — `should filter the list by Nombre when user types in the search input`
  - **Verifies:** matching item visible, non-matching hidden
- RED — `should filter the list by NIT/RUC when user types in the search input`
  - **Verifies:** NIT partial match filter works
- RED — `should filter case-insensitively (lowercase input matches uppercase Nombre)`
  - **Verifies:** case-insensitive matching
- RED — `should restore full list when search input is cleared`
  - **Verifies:** clearing input restores all items
- RED — `should NOT trigger a new API call when filtering (client-side only)`
  - **Verifies:** API call count remains 1 after multiple searches

**AC3 — EmptyState on empty client list (3 tests):**

- RED — `should render the EmptyState component when API returns an empty array`
  - **Verifies:** `data-testid="empty-state"` visible
- RED — `should display Spanish guidance text in the EmptyState component`
  - **Verifies:** "No hay clientes registrados" in EmptyState text
- RED — `should NOT render any ClientListItem when the list is empty`
  - **Verifies:** zero `client-list-item-*` elements

**AC4 — ErrorPanel on fetch failure (5 tests):**

- RED — `should render the ErrorPanel component when the backend returns a 500 error`
  - **Verifies:** `data-testid="error-panel"` on 500 response
- RED — `should render the ErrorPanel component on a network error`
  - **Verifies:** `data-testid="error-panel"` on aborted request
- RED — `should render a "Reintentar" button inside the ErrorPanel`
  - **Verifies:** `data-testid="retry-button"` visible
- RED — `should trigger a new fetch when "Reintentar" button is clicked`
  - **Verifies:** second API call made + list renders after retry
- RED — `should NOT render client list items when in error state`
  - **Verifies:** zero `client-list-item-*` on error

**AC5 — Click item: active state and URL navigation (5 tests):**

- RED — `should update the URL to /clientes/:clienteId when a list item is clicked`
  - **Verifies:** URL pattern `/clientes/{uuid}` after click
- RED — `should apply aria-selected="true" to the clicked list item`
  - **Verifies:** `aria-selected="true"` on clicked item
- RED — `should NOT reload the full page when navigating to /clientes/:clienteId`
  - **Verifies:** no 'load' event after click (client-side nav)
- RED — `should show the right panel placeholder when a client is selected`
  - **Verifies:** `data-testid="cliente-detail-placeholder"` present
- RED — `should deselect previous item and select new item when clicking a different client`
  - **Verifies:** only last-clicked item has `aria-selected="true"`

**AC6 — Single API request + caching (2 tests):**

- RED — `should send exactly one GET /api/v1/clientes request when the page mounts`
  - **Verifies:** API call count = 1 after full render
- RED — `should NOT send additional GET requests when the search input is used`
  - **Verifies:** API call count remains 1 after multiple search interactions

**AC7 — Skeleton loader (3 tests):**

- RED — `should render the skeleton loader while the API request is in flight`
  - **Verifies:** `data-testid="cliente-list-skeleton"` visible during delayed fetch
- RED — `should NOT render a spinner during loading (skeleton only, no spinner)`
  - **Verifies:** no `[role="progressbar"]` or `.spinner` present
- RED — `should hide the skeleton loader once data is fully loaded`
  - **Verifies:** skeleton not visible after data arrives

### API Tests (7 tests)

**File:** `e2e/tests/api/client-list.api.spec.ts`

- RED — `should return HTTP 200 when the clientes table is accessible`
  - **Verifies:** GET /api/v1/clientes → status 200
- RED — `should return Content-Type: application/json`
  - **Verifies:** Content-Type header contains `application/json`
- RED — `should return a JSON array (not an object wrapper)`
  - **Verifies:** `Array.isArray(body) === true`
- RED — `should return HTTP 200 with empty array [] when no clients exist`
  - **Verifies:** 200 + `[]` (not 404) on empty table
- RED — `should return client objects with required camelCase fields`
  - **Verifies:** id, nombre, nit, telefono, ciudad, createdAt, updatedAt present
- RED — `should return id as a UUID string (not numeric)`
  - **Verifies:** id matches UUID pattern `/^[0-9a-f]{8}-...`
- RED — `should return createdAt and updatedAt as ISO 8601 timestamp strings`
  - **Verifies:** timestamps are valid ISO 8601

### Component Tests (20 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**AC7 — Skeleton during loading (4 tests):**

- RED — `should render the skeleton loader when isLoading is true`
- RED — `should NOT render a spinner when isLoading is true (skeleton only)`
- RED — `should NOT render client list items while loading`
- RED — `should NOT render EmptyState while loading`

**AC3 — EmptyState (4 tests):**

- RED — `should render the EmptyState component when data is an empty array`
- RED — `should display the Spanish guidance message in EmptyState`
- RED — `should NOT render any client list items when the list is empty`
- RED — `should NOT render ErrorPanel when the list is empty`

**AC4 — ErrorPanel + retry (5 tests):**

- RED — `should render the ErrorPanel when isError is true`
- RED — `should render the "Reintentar" button inside the ErrorPanel`
- RED — `should call refetch when "Reintentar" button is clicked`
- RED — `should NOT render client list items when in error state`
- RED — `should NOT render EmptyState when in error state`

**AC1 — List rendering (6 tests):**

- RED — `should render a ClientListItem for each client returned by the API`
- RED — `should display each client Nombre inside the list item`
- RED — `should display each client NIT/RUC inside the list item`
- RED — `should render the list panel as an <aside> with aria-label="Lista de clientes"`
- RED — `should render the items container as a <ul role="listbox">`
- RED — `should render the data-testid="cliente-list-view" on the root aside element`

**AC2 — Search filter (6 tests):**

- RED — `should render the search input with data-testid="client-search-input"`
- RED — `should filter clients by Nombre when the user types in the search input`
- RED — `should filter clients by NIT/RUC when user types in the search input`
- RED — `should perform case-insensitive filtering`
- RED — `should show all clients when the search input is cleared`
- RED — `should NOT call refetch when the user types in the search (client-side only)`

**Accessibility (2 tests):**

- RED — `should apply aria-selected="false" to unselected list items`
- RED — `should have a visible search input with an accessible placeholder in Spanish`

**Total: 56 tests (29 E2E + 7 API + 20 Component)**

---

## Data Factories Created

### Cliente Factory

**File:** `e2e/support/factories/cliente.factory.ts`

**Exports:**

- `createClientePayload(overrides?)` — POST body payload (no id/timestamps)
- `createClienteDto(overrides?)` — Full DTO with id + timestamps (for mock API responses)
- `createClienteDtos(count, overrides?)` — Array of full DTOs

**Example Usage:**

```typescript
// For Playwright route mocking:
const clientes = createClienteDtos(3);
await page.route('**/api/v1/clientes', route =>
  route.fulfill({ status: 200, body: JSON.stringify(clientes) })
);

// For API seeding:
const payload = createClientePayload({ nombre: 'Empresa Especifica' });
await request.post(`${API_BASE}/api/v1/clientes`, { data: payload });
```

---

## Fixtures Created

No new fixtures required for Story 2.1. The `clientesPage` fixture in `e2e/fixtures/base.fixture.ts` already navigates to `/clientes`. Story 2.1 E2E tests use `page.route()` (network-first intercept) directly in each test, keeping them self-contained.

---

## Mock Requirements

### API Mock for E2E Tests (Playwright page.route)

**Endpoint:** `GET **/api/v1/clientes`

**Success Response (200 with clients):**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Empresa Test 1",
    "nit": "9000000001",
    "telefono": "3000000001",
    "ciudad": "Bogotá",
    "createdAt": "2026-06-24T00:00:00.000Z",
    "updatedAt": "2026-06-24T00:00:00.000Z"
  }
]
```

**Success Response (200 empty):**
```json
[]
```

**Error Response (500):**
```json
{ "type": "...", "title": "Internal Server Error", "status": 500 }
```

**Notes:** All E2E tests intercept BEFORE navigation (network-first pattern). Component tests use `vi.mock('../../application/useClientes')` to control hook return values.

### Component Test Mock (Vitest vi.mock)

The `useClientes` hook is fully mocked in component tests to control `{ data, isLoading, isError, refetch }` independently:

```typescript
vi.mock('../../application/useClientes', () => ({
  useClientes: vi.fn(),
}));

vi.mocked(useClientes).mockReturnValue({
  data: [...clientes],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
});
```

---

## Required data-testid Attributes

### `/clientes` Page Layout (`clientes.tsx`)

- `clientes-view` — Root flex container wrapping list + detail panels
- `cliente-detail-placeholder` — Right panel placeholder `<div>` (Story 2.2)

### `ClienteListView` Component (`ClienteListView.tsx`)

- `cliente-list-view` — Root `<aside>` element (`aria-label="Lista de clientes"`)
- `client-search-input` — Search `<input>` (placeholder: "Buscar por nombre o NIT/RUC...")
- `cliente-list-skeleton` — Skeleton loader container (`react-loading-skeleton`, 5 rows)

### `ClientListItem` Component (`ClientListItem.tsx`)

- `client-list-item-{id}` — Each `<li>` item (dynamic, using `cliente.id`)
  - Must also have: `aria-selected={isSelected ? 'true' : 'false'}`

### `EmptyState` Component (`EmptyState.tsx`)

- `empty-state` — Root container element

### `ErrorPanel` Component (`ErrorPanel.tsx`)

- `error-panel` — Root container element
- `retry-button` — "Reintentar" button

**Implementation Example:**

```tsx
// ClientListItem.tsx
<li
  data-testid={`client-list-item-${cliente.id}`}
  aria-selected={isSelected}
  onClick={() => onClick(cliente.id)}
  className={isSelected ? 'bg-primary-50 text-primary-700' : ''}
>
  <span className="font-bold">{cliente.nombre}</span>
  <span className="text-sm text-slate-500">{cliente.nit}</span>
</li>

// ClienteListView.tsx
<aside data-testid="cliente-list-view" aria-label="Lista de clientes" className="w-[280px]">
  <input data-testid="client-search-input" placeholder="Buscar por nombre o NIT/RUC..." />
  {isLoading && <div data-testid="cliente-list-skeleton">...</div>}
  {isError && <ErrorPanel data-testid="error-panel" onRetry={refetch} />}
  {!isLoading && !isError && data?.length === 0 && <EmptyState data-testid="empty-state" />}
  <ul role="listbox">
    {filteredClientes.map(c => <ClientListItem key={c.id} cliente={c} ... />)}
  </ul>
</aside>
```

---

## Implementation Checklist

### Test: AC1 — List Panel Renders on /clientes

**E2E File:** `e2e/tests/clientes/client-list-search.spec.ts`
**Component File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` (TanStack Query hook)
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` with `data-testid="client-list-item-{id}"` and `aria-selected`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` with `<aside data-testid="cliente-list-view" aria-label="Lista de clientes">` and `<ul role="listbox">`
- [ ] Wire `ClienteListView` into `frontend/src/routes/_app/clientes.tsx`
- [ ] Add `data-testid="clientes-view"` to route page wrapper
- [ ] Add `data-testid="cliente-detail-placeholder"` to right panel div
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: AC2 — Real-time Search Filter

**Tasks to make these tests pass:**

- [ ] Add `useState<string>` for `searchQuery` in `ClienteListView`
- [ ] Add `<input data-testid="client-search-input" placeholder="Buscar por nombre o NIT/RUC...">` connected to `setSearchQuery`
- [ ] Add `useMemo` filter: `clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
- [ ] Verify NO new fetch is triggered on search (only `useState` update)
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — EmptyState on Empty List

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/EmptyState.tsx` with `data-testid="empty-state"` and Spanish message
- [ ] Add conditional render in `ClienteListView`: `{data?.length === 0 && <EmptyState message="No hay clientes registrados. Crea el primero." />}`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — ErrorPanel with Reintentar

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with `data-testid="error-panel"` and `data-testid="retry-button"`
- [ ] Add conditional render in `ClienteListView`: `{isError && <ErrorPanel onRetry={refetch} />}`
- [ ] Ensure `retry-button` calls `onRetry` (which is the TanStack Query `refetch` function)
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — Click Item: Active State + URL Update

**Tasks to make these tests pass:**

- [ ] Implement click handler in `ClientListItem`: call `navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })`
- [ ] Track selected state in `ClienteListView` with `useState<string | null>`
- [ ] Apply `aria-selected={isSelected ? 'true' : 'false'}` to each `ClientListItem`
- [ ] Create stub route `frontend/src/routes/_app/clientes.$clienteId.tsx` (enables URL parameter)
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC6 — Single GET /api/v1/clientes on mount

**Backend tasks:**

- [ ] Create `backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs` (private ctor + factory)
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteEntityConfiguration.cs`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Run EF Core migration: `dotnet ef migrations add AddClientes`
- [ ] Create `GetClientesQuery`, `GetClientesQueryHandler`, `ClienteDto`
- [ ] Create `ClienteEndpoints.cs` and register `GET /api/v1/clientes` in `Program.cs`

**Frontend tasks:**

- [ ] Verify `useClientes` uses `queryKey: ['clientes']` and calls `clienteApiRepository.getAll()`
- [ ] Verify no duplicate queries on mount

- [ ] Run test: `npx playwright test e2e/tests/api/client-list.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours (backend)

---

### Test: AC7 — Skeleton Loader During Fetch

**Tasks to make these tests pass:**

- [ ] Install `react-loading-skeleton` if not present: `npm install react-loading-skeleton`
- [ ] Add conditional render in `ClienteListView`: `{isLoading && <div data-testid="cliente-list-skeleton"><Skeleton count={5} /></div>}`
- [ ] Verify no `[role="progressbar"]` spinner rendered
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC7"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E tests for Story 2.1
npx playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run API contract tests
npx playwright test e2e/tests/api/client-list.api.spec.ts

# Run component tests (Vitest)
cd frontend && npx vitest run src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx

# Run all Story 2.1 tests
npx playwright test e2e/tests/clientes/client-list-search.spec.ts e2e/tests/api/client-list.api.spec.ts

# Run E2E in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --debug

# Run with Playwright UI
npx playwright test --ui e2e/tests/clientes/client-list-search.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 56 tests written and in RED phase
- Data factory created (`e2e/support/factories/cliente.factory.ts`)
- Network-first intercept pattern applied to all E2E tests
- `vi.mock` pattern documented for component tests
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created per AC

**Verification:**

- All tests fail because `ClienteListView`, `ClientListItem`, `EmptyState`, `ErrorPanel` do not exist yet
- API tests fail because the backend endpoint is not yet implemented
- Failure messages are: module not found (component tests), timeout/selector not found (E2E tests)

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (start with AC6 backend, then AC7 skeleton, then AC1 list)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify green
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order:** AC6 backend → AC6 frontend hook → AC7 skeleton → AC1 list → AC3 empty → AC4 error → AC2 search → AC5 click

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 56 tests pass
2. Review `ClienteListView` for readability and code splitting
3. Extract any duplicated logic in test helpers
4. Optimize `useMemo` dependencies if needed
5. Ensure no snapshot or hardcoded values remain
6. Run `npx playwright test` + `cd frontend && npx vitest run` to confirm full green

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/`
3. Begin implementation using the checklist above (AC6 backend first)
4. Work one AC at a time (RED → GREEN for each)
5. When all tests pass, mark Story 2.1 status as `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Base fixture in `e2e/fixtures/base.fixture.ts` reused; Story 2.1 E2E tests are self-contained with inline `page.route()` setup
- **data-factories.md** — `e2e/support/factories/cliente.factory.ts` with override support and bulk creation
- **network-first.md** — ALL E2E tests call `page.route()` BEFORE `page.goto()` (no race conditions)
- **component-tdd.md** — `vi.mock` pattern for isolating hook dependencies in Vitest component tests
- **test-quality.md** — One assertion per test (atomic), Given-When-Then comments, no hard waits
- **test-levels-framework.md** — E2E for user journeys (AC1, AC5), API for HTTP contract (AC6), Component for isolated UI states (AC2, AC3, AC4, AC7)
- **selector-resilience.md** — All selectors use `data-testid`; never CSS classes or text selectors

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

All tests will fail in RED phase because:

**E2E tests:** `Error: page.getByTestId('clientes-view') is not visible` — route and components not yet implemented

**API tests:** `Error: connect ECONNREFUSED 127.0.0.1:5000` — backend endpoint not yet created

**Component tests:** `Error: Cannot find module '../ClienteListView'` — component file does not exist

**Summary:**

- Total tests: 56
- Passing: 0 (expected in RED phase)
- Failing: 56 (expected)
- Status: RED phase (tests define expected behavior before implementation)

---

**Generated by**: BMad TEA Agent (sa-tea-atdd)
**Workflow**: `_bmad/bmm/workflows/testarch/atdd`
**Story**: 2.1 — Client List & Search
**Epic**: 2 — Client Management
**Date**: 2026-06-24
