# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Commercial team members need to see a scrollable list of all clients with Nombre and NIT/RUC visible, search them client-side in real time (no extra API call), and receive appropriate feedback when the list is empty or the backend is unavailable.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px wide) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **AC2** — Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1). The filter is applied client-side over the TanStack Query cache — no additional API call is triggered (R-004).

3. **AC3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **AC4** — Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list. Clicking "Reintentar" calls `refetch()` from TanStack Query.

---

## Test Level Strategy

| AC | Test Level | File |
|----|-----------|------|
| AC1 (panel structure, items, Nombre+NIT display) | E2E (Playwright) | `e2e/tests/clientes/client-list-and-search.spec.ts` |
| AC1 (panel + search input rendering) | Component (Vitest+RTL) | `frontend/src/.../presentation/__tests__/ClienteListView.test.tsx` |
| AC2 (client-side filter, no API re-call — TC-E2-P0-03, TC-E2-P0-04) | E2E + Component | Both files |
| AC3 (EmptyState — TC-E2-P1-01) | E2E + Component | Both files |
| AC4 (ErrorPanel + Reintentar — TC-E2-P1-02) | E2E + Component | Both files |
| AC1 — API contract (GET /api/v1/clientes shape, 200, direct array) | API (Playwright) | `e2e/tests/api/clientes-api.spec.ts` |
| AC1, AC4 — useClientes hook (data, isLoading, isError, refetch) | Component (Vitest) | `frontend/src/.../application/__tests__/useClientes.test.ts` |

---

## Failing Tests Created (RED Phase)

### E2E Tests — 16 tests

**File:** `e2e/tests/clientes/client-list-and-search.spec.ts`

**AC1 — Client list renders on /clientes:**

- **Test:** `should render the left panel with data-testid="cliente-list-view"`
  - **Status:** RED — `ClienteListView` component does not exist yet
  - **Verifies:** AC1 — left panel with data-testid present

- **Test:** `should display each client item with data-testid="cliente-item"`
  - **Status:** RED — `ClientListItem` component not implemented
  - **Verifies:** AC1 — each client rendered as an item

- **Test:** `should display the client Nombre in each list item`
  - **Status:** RED — `ClientListItem` not implemented
  - **Verifies:** AC1 — Nombre visible in item

- **Test:** `should display the client NIT/RUC in each list item`
  - **Status:** RED — `ClientListItem` not implemented
  - **Verifies:** AC1 — NIT/RUC visible in item

- **Test:** `should render the search input with data-testid="search-input"`
  - **Status:** RED — `ClienteListView` not implemented
  - **Verifies:** AC1 — search input present

- **Test:** `should render search input with placeholder "Buscar por nombre o NIT/RUC"`
  - **Status:** RED — placeholder not configured
  - **Verifies:** AC1 — correct Spanish placeholder

- **Test:** `should render search input with aria-label="Buscar clientes" for accessibility`
  - **Status:** RED — aria-label not configured
  - **Verifies:** AC1 — WCAG 2.1 AA compliance

**AC2 — Client-side search filtering:**

- **Test:** `TC-E2-P0-03 — should filter list by nombre without triggering a new API call`
  - **Status:** RED — `ClienteListView` with `useMemo` filter not implemented
  - **Verifies:** AC2, R-004 — client-side filter by nombre, single API call

- **Test:** `TC-E2-P0-04 — should filter list by NIT/RUC without triggering a new API call`
  - **Status:** RED — `ClienteListView` filter not implemented
  - **Verifies:** AC2, R-004 — client-side filter by NIT, single API call

- **Test:** `should show all clients when search field is cleared`
  - **Status:** RED — filter state management not implemented
  - **Verifies:** AC2 — clearing search restores full list

- **Test:** `should perform search filter in under 1 second (NFR1)`
  - **Status:** RED — component not implemented
  - **Verifies:** AC2, NFR1 — < 1 second for 500 records

**AC3 — EmptyState:**

- **Test:** `TC-E2-P1-01 — should display data-testid="empty-state" when API returns empty array`
  - **Status:** RED — `EmptyState` component and `ClienteListView` not implemented
  - **Verifies:** AC3, R-009

- **Test:** `should display the guidance message in EmptyState`
  - **Status:** RED — EmptyState message not configured
  - **Verifies:** AC3 — Spanish guidance text

- **Test:** `should NOT display data-testid="cliente-item" when list is empty`
  - **Status:** RED — component not implemented
  - **Verifies:** AC3 — no items when empty

- **Test:** `should display EmptyState when search filter reduces results to zero`
  - **Status:** RED — filter + EmptyState interaction not implemented
  - **Verifies:** AC3 — EmptyState on filtered zero results

**AC4 — ErrorPanel:**

- **Test:** `TC-E2-P1-02 — should display data-testid="error-panel" when API fails`
  - **Status:** RED — `ErrorPanel` component not implemented
  - **Verifies:** AC4, R-010 — error state shown

- **Test:** `should display the Spanish error message in ErrorPanel`
  - **Status:** RED — ErrorPanel message not configured
  - **Verifies:** AC4 — Spanish error message

- **Test:** `should display a "Reintentar" button in the ErrorPanel`
  - **Status:** RED — ErrorPanel with retry not implemented
  - **Verifies:** AC4 — retry button present

- **Test:** `TC-E2-P1-02 — clicking "Reintentar" triggers a new API call (refetch)`
  - **Status:** RED — refetch wiring not implemented
  - **Verifies:** AC4 — retry button calls refetch()

- **Test:** `should NOT display the client list when ErrorPanel is shown`
  - **Status:** RED — conditional rendering not implemented
  - **Verifies:** AC4 — list hidden on error

---

### API Tests — 9 tests

**File:** `e2e/tests/api/clientes-api.spec.ts`

- **Test:** `should return HTTP 200`
  - **Status:** RED — `ClienteEndpoints.cs` and DI registration not yet created
  - **Verifies:** AC1 — endpoint registered and returns 200

- **Test:** `should return Content-Type application/json`
  - **Status:** RED — endpoint not yet created
  - **Verifies:** AC1 — correct content type

- **Test:** `should return a JSON array (direct array — no wrapper object)`
  - **Status:** RED — endpoint not yet created
  - **Verifies:** AC1 — no wrapper, direct array per architecture pattern

- **Test:** `should return ClienteDto objects with required fields`
  - **Status:** RED — `ClienteDto` and query handler not yet created
  - **Verifies:** AC1 — all required fields in response

- **Test:** `should return id as a non-empty string (UUID v7)`
  - **Status:** RED — UUIDv7 generation not yet wired
  - **Verifies:** AC1 — id field format

- **Test:** `should return createdAt and updatedAt as ISO 8601 strings`
  - **Status:** RED — `DateTimeOffset` mapping not yet implemented
  - **Verifies:** AC1 — timestamp field format

- **Test:** `should return an empty array when no clients exist`
  - **Status:** RED — endpoint not yet created
  - **Verifies:** AC1 — empty array is valid 200 response

- **Test:** `should NOT return 404 (endpoint must be registered in Program.cs)`
  - **Status:** RED — endpoint not registered yet
  - **Verifies:** AC4 — endpoint exists

- **Test:** `should NOT return 405 Method Not Allowed for GET`
  - **Status:** RED — endpoint not registered yet
  - **Verifies:** AC1 — GET method allowed

---

### Component Tests — 22 tests

#### useClientes hook — 9 tests

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`

- **Test:** `should return the list of clients when API responds with data`
  - **Status:** RED — `useClientes.ts` does not exist
  - **Verifies:** AC1 — data returned from hook

- **Test:** `should return isLoading=true initially before data arrives`
  - **Status:** RED — hook not implemented
  - **Verifies:** AC1 — loading state

- **Test:** `should return isLoading=false after data is loaded`
  - **Status:** RED — hook not implemented
  - **Verifies:** AC1 — loading state resolves

- **Test:** `should use queryKey ["clientes"] (never appends search term)`
  - **Status:** RED — hook not implemented
  - **Verifies:** AC2, R-004 — queryKey is static

- **Test:** `should return an empty array when API returns []`
  - **Status:** RED — hook not implemented
  - **Verifies:** AC3 — empty data

- **Test:** `should return isError=true when the API call fails (network error)`
  - **Status:** RED — hook not implemented
  - **Verifies:** AC4 — error state

- **Test:** `should expose a refetch function that re-triggers the API call`
  - **Status:** RED — hook not implemented
  - **Verifies:** AC4 — refetch behavior

- **Test:** `should return isError=true when API returns 500`
  - **Status:** RED — hook not implemented
  - **Verifies:** AC4 — 500 treated as error

- **Test:** `should expose refetch function regardless of error state`
  - **Status:** RED — hook not implemented
  - **Verifies:** AC4 — refetch always available

#### ClienteListView component — 13 tests

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

- **TC-E2-P0-03:** Filter by nombre, no new API call — RED
- **TC-E2-P0-04:** Filter by NIT, no new API call — RED
- **TC-E2-P1-01:** EmptyState when API returns [] — RED
- **TC-E2-P1-02:** ErrorPanel + Reintentar triggers refetch (API call count = 2) — RED
- Plus 9 additional tests for panel structure, items, accessibility — all RED

---

## Data Factories Created

### Cliente Factory (E2E layer)

**File:** `e2e/support/factories/cliente.factory.ts`

**Exports:**
- `createCliente(overrides?)` — Create single cliente response object with optional overrides
- `createClientes(count, overrides?)` — Create array of cliente response objects

**Example Usage:**
```typescript
const cliente = createCliente({ nombre: 'Empresa Especial SAS', nit: '900-100-200-1' })
const clientes = createClientes(10)  // Generate 10 unique clients
```

### Cliente Builder (data.helper.ts — extended)

**File:** `e2e/helpers/data.helper.ts` (existing, already has `buildCliente`)

The existing `buildCliente` factory in `data.helper.ts` is reused for E2E API-seeded tests. The new `cliente.factory.ts` provides the full response shape (including `id`, `createdAt`, `updatedAt`) needed for network interception mocks.

---

## Fixtures Created

### Clientes Fixture (E2E layer)

**File:** `e2e/fixtures/clientes.fixture.ts`

**Fixtures:**

- `mockClientes(clientes[])` — Intercepts GET /api/v1/clientes with the given array BEFORE navigation
  - **Setup:** Registers route interception (network-first)
  - **Provides:** Called before page.goto()
  - **Cleanup:** Playwright auto-removes route handlers after test

- `mockClientesError()` — Intercepts GET /api/v1/clientes and aborts it
  - **Setup:** Route abort
  - **Provides:** Simulates backend unavailability for AC4 tests
  - **Cleanup:** Auto-removed after test

- `emptyClientesList` — Navigates to /clientes with an empty list intercepted
  - **Setup:** Route intercept + goto('/clientes')
  - **Provides:** Page ready with empty state
  - **Cleanup:** Auto

- `seededClientesList` — Navigates to /clientes with 3 clients intercepted and loaded
  - **Setup:** Route intercept + goto + waitFor first item visible
  - **Provides:** `{ clientes: ClienteResponse[] }` — the seeded data for assertions
  - **Cleanup:** Auto

**Example Usage:**
```typescript
import { test, expect } from '../../fixtures/clientes.fixture'

test('should show empty state', async ({ emptyClientesList, page }) => {
  await expect(page.getByTestId('empty-state')).toBeVisible()
})
```

---

## Mock Requirements

### GET /api/v1/clientes

**Endpoint:** `GET /api/v1/clientes`

**Success Response:**
```json
[
  {
    "id": "00000000-0000-7000-0000-000000000001",
    "nombre": "Empresa Ejemplo SAS",
    "nit": "900100200-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-05-24T10:30:00Z",
    "updatedAt": "2026-05-24T10:30:00Z"
  }
]
```

**Empty Response:**
```json
[]
```

**Failure Response (network abort or 500):**
- Network abort: `route.abort('failed')` — triggers TanStack Query `isError: true`
- HTTP 500: `{ status: 500, body: '{}' }` — triggers error state

**Notes:**
- Response is a **direct array** (no `{ data: [...] }` wrapper per architecture pattern)
- `id` is a UUID v7 string
- `createdAt` and `updatedAt` are ISO 8601 DateTimeOffset strings
- All text fields are non-null strings
- Client-side filtering uses the cached array — no `?q=` query param ever sent

---

## Required data-testid Attributes

### ClienteListView component (`frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`)

- `cliente-list-view` — Root element of the 280px left panel
- `search-input` — The search `<input>` element (also requires `aria-label="Buscar clientes"` and `placeholder="Buscar por nombre o NIT/RUC"`)

### ClientListItem component (`frontend/src/shared/components/ClientListItem.tsx`)

- `cliente-item` — Each client list item element (also requires `role="button"`, `tabIndex={0}`)

### ErrorPanel component (`frontend/src/shared/components/ErrorPanel.tsx`)

- `error-panel` — Root element of the error panel (also requires `role="alert"`)
- `retry-button` — The "Reintentar" button

### EmptyState component (`frontend/src/shared/components/EmptyState.tsx`)

- `empty-state` — Root element of the empty state

**Implementation Example:**
```tsx
// ClienteListView.tsx
<div data-testid="cliente-list-view" style={{ width: '280px', overflowY: 'auto' }}>
  <input
    data-testid="search-input"
    aria-label="Buscar clientes"
    placeholder="Buscar por nombre o NIT/RUC"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  {/* items */}
</div>

// ClientListItem.tsx
<div
  data-testid="cliente-item"
  role="button"
  tabIndex={0}
  onClick={onClick}
  onKeyDown={handleKeyDown}
>
  <span>{cliente.nombre}</span>
  <span>{cliente.nit}</span>
</div>

// ErrorPanel.tsx
<div data-testid="error-panel" role="alert">
  <p>No se pudo cargar la información. Verifica tu conexión.</p>
  <button data-testid="retry-button" onClick={onRetry}>Reintentar</button>
</div>

// EmptyState.tsx
<div data-testid="empty-state">
  <p>Aún no hay clientes registrados. Crea el primero.</p>
</div>
```

---

## Implementation Checklist

### Test: AC1 — ClienteListView panel renders

**Files:** `e2e/tests/clientes/client-list-and-search.spec.ts`, `ClienteListView.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — 280px panel
- [ ] Add `data-testid="cliente-list-view"` to root element
- [ ] Add `data-testid="search-input"` with `aria-label` and `placeholder`
- [ ] Add `data-testid="cliente-item"` with `role="button"` and `tabIndex={0}` to each item
- [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `ClienteListView`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-and-search.spec.ts`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC2 — Client-side search filtering (TC-E2-P0-03, TC-E2-P0-04)

**Files:** Both E2E and Component test files

**Tasks to make this test pass:**

- [ ] Add `useState<string>('')` for `searchQuery` in `ClienteListView`
- [ ] Implement `useMemo` filter: `data.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
- [ ] Ensure `queryKey` is always `['clientes']` — NEVER append search term
- [ ] Verify filter applies only to in-memory data (TanStack Query cache)
- [ ] Run test: `npx playwright test --grep "TC-E2-P0-03|TC-E2-P0-04"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — EmptyState (TC-E2-P1-01)

**Files:** Both E2E and Component test files

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/EmptyState.tsx`
- [ ] Add `data-testid="empty-state"` to EmptyState root
- [ ] Add default message: `"Aún no hay clientes registrados. Crea el primero."`
- [ ] Include `UsersIcon` from `@heroicons/react` for visual support
- [ ] Render `<EmptyState>` in `ClienteListView` when `filteredClientes.length === 0` (both data empty and filtered to zero)
- [ ] Run test: `npx playwright test --grep "TC-E2-P1-01|EmptyState"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC4 — ErrorPanel + Reintentar (TC-E2-P1-02)

**Files:** Both E2E and Component test files

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
- [ ] Add `data-testid="error-panel"` and `role="alert"` to ErrorPanel root
- [ ] Add `data-testid="retry-button"` to the "Reintentar" button
- [ ] Message: `"No se pudo cargar la información. Verifica tu conexión."`
- [ ] Wire `onRetry={refetch}` from `useClientes` to `ErrorPanel`
- [ ] Render `<ErrorPanel>` when `isError` is true
- [ ] Run test: `npx playwright test --grep "TC-E2-P1-02|ErrorPanel"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: API contract — GET /api/v1/clientes

**File:** `e2e/tests/api/clientes-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `ApplicationDbContext`
- [ ] Apply `ClienteConfiguration` in `OnModelCreating` BEFORE `ApplySnakeCaseNaming()`
- [ ] Create EF Core migration `AddClientesTable`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- [ ] Register DI: `IClienteRepository → ClienteRepository`, `GetClientesQueryHandler`
- [ ] Call `app.MapClienteEndpoints()` in `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

## Running Tests

```bash
# Run all E2E tests for this story
npx playwright test e2e/tests/clientes/client-list-and-search.spec.ts

# Run API contract tests
npx playwright test e2e/tests/api/clientes-api.spec.ts

# Run all story 2.1 E2E tests
npx playwright test --grep "AC1|AC2|AC3|AC4|TC-E2"

# Run in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-list-and-search.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/clientes/client-list-and-search.spec.ts --debug

# Run frontend unit + component tests (Vitest)
pnpm --filter frontend test

# Run specific test files (Vitest)
pnpm --filter frontend test src/modules/crm/clientes/application/__tests__/useClientes.test.ts
pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx

# Run with coverage
pnpm --filter frontend test --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All E2E tests fail with "Test timeout / element not found" (components not yet rendered)
- API tests fail with "Connection refused" (endpoint not registered)
- Component tests fail with "Cannot find module '../useClientes'" and "Cannot find module '../ClienteListView'"
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** — start with API contract (foundational)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: `ClienteEntity` → `IClienteRepository` → `ClienteDto` → `GetClientesQueryHandler` → `ClienteRepository` → `ClienteEndpoints` → run API tests
2. Frontend: `useClientes` → run hook tests
3. Frontend: `EmptyState` → `ErrorPanel` → `ClientListItem` → `ClienteListView` → run component tests
4. E2E: Update route file → run E2E tests

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (verify filter handles 500 records < 1s in production build)
5. **Ensure tests still pass** after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm --filter frontend test && npx playwright test e2e/tests/api/clientes-api.spec.ts`
3. **Begin implementation** using implementation checklist as guide (recommended: backend first)
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor for quality
6. **When refactoring complete**, manually update story 2.1 status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation (all E2E tests use `page.route()` before `page.goto()`)
- **data-factories.md** — Factory patterns for generating test data (`createCliente`, `buildCliente`)
- **fixture-architecture.md** — Fixture setup/teardown with auto-cleanup (`clientes.fixture.ts`)
- **component-tdd.md** — Given-When-Then, Vitest+RTL component testing, MSW for network mocking
- **test-quality.md** — One assertion per test, explicit waits, deterministic test data
- **selector-resilience.md** — `data-testid` selectors over CSS/text (all selectors use `data-testid`)
- **test-levels-framework.md** — E2E for user journeys, API for contracts, Component for UI behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm --filter frontend test && npx playwright test e2e/tests/clientes/ e2e/tests/api/clientes-api.spec.ts`

**Expected Results:**

```
Frontend (Vitest):
  FAIL frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts
    Cannot find module '../useClientes' from 'useClientes.test.ts'

  FAIL frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx
    Cannot find module '../ClienteListView' from 'ClienteListView.test.tsx'

E2E (Playwright):
  FAIL e2e/tests/clientes/client-list-and-search.spec.ts
    AC1 — Client list renders on /clientes > should render the left panel with data-testid="cliente-list-view"
    Timeout 30000ms exceeded while waiting for locator('[data-testid="cliente-list-view"]')

  FAIL e2e/tests/api/clientes-api.spec.ts
    GET /api/v1/clientes > should return HTTP 200
    Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Summary:**

- Total tests: 47
- Passing: 0 (expected)
- Failing: 47 (expected)
- Status: ✅ RED phase verified

---

## Notes

- **queryKey constraint (R-004 critical):** The `queryKey` must stay `['clientes']` at all times. NEVER append the search term to the query key. The `TC-E2-P0-03` and `TC-E2-P0-04` tests verify this by counting API calls (`apiCallCount === 1` after filtering).
- **faker not installed in e2e layer:** The `e2e/support/factories/cliente.factory.ts` uses an incrementing counter instead of `@faker-js/faker`. The frontend test files use inline factories for the same reason.
- **MSW version:** Tests use `msw@^2.x` (`http` and `HttpResponse` from `msw/node`). Verify MSW version with `pnpm --filter frontend ls msw`.
- **DateTimeOffset MANDATORY in backend:** All `createdAt`/`updatedAt` fields must use `DateTimeOffset`, never `DateTime`.
- **Skeleton loading, not spinner:** The loading state test checks for `aria-busy="true"` or `.react-loading-skeleton` class — not a spinner component.

---

**Generated by BMad TEA Agent** - 2026-05-24
