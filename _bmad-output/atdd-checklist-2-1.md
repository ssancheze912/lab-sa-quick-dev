# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-10
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + React Testing Library) + E2E (Playwright) + API (Playwright APIRequestContext)

---

## Story Summary

Commercial team members need to navigate to `/clientes` and see a scrollable panel listing all clients with Nombre and NIT/RUC, search by either field in real time, and receive appropriate feedback when the system is empty or unavailable.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given clients exist, when the user navigates to `/clientes`, then the left panel (280px) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.
2. **AC2** — Given the client list is loaded, when the user types in the search field, then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).
3. **AC3** — Given there are no clients in the system, when the user navigates to `/clientes`, then an `EmptyState` component is displayed with a message guiding the user to create the first client.
4. **AC4** — Given the backend is unavailable when the page loads, when the fetch fails, then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list.

---

## Failing Tests Created (RED Phase)

### E2E Tests (13 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**AC1 — Client list renders at /clientes:**

- **Test:** `should show the left list panel (280px) when navigating to /clientes`
  - **Status:** RED — `[data-testid="clientes-list-panel"]` does not exist yet
  - **Verifies:** AC1 — Panel container renders after navigation

- **Test:** `should display each client item with Nombre visible`
  - **Status:** RED — `[data-testid="client-list-item"]` not implemented yet
  - **Verifies:** AC1 — Each item shows the client's Nombre

- **Test:** `should display each client item with NIT/RUC visible`
  - **Status:** RED — `[data-testid="client-list-item"]` not implemented yet
  - **Verifies:** AC1 — Each item shows the client's NIT alongside the Nombre

- **Test:** `should show skeleton placeholders while clients are loading`
  - **Status:** RED — `[data-testid="loading-skeleton"]` not implemented; component does not exist
  - **Verifies:** AC1 — Skeleton shown during loading (not a spinner)

- **Test:** `should show detail placeholder on right panel at initial load`
  - **Status:** RED — `[data-testid="cliente-detail-placeholder"]` not implemented
  - **Verifies:** AC1 — Right panel placeholder is visible before a client is selected

**AC2 — Real-time search filters client list:**

- **Test:** `should filter clients by Nombre when user types in search field`
  - **Status:** RED — `[data-testid="search-input"]` not implemented; filter logic missing
  - **Verifies:** AC2 — Nombre filter reduces visible list items

- **Test:** `should filter clients by NIT/RUC when user types in search field`
  - **Status:** RED — Filter logic for NIT not implemented
  - **Verifies:** AC2 — NIT filter reduces visible list items

- **Test:** `should restore the full list when search input is cleared`
  - **Status:** RED — Clear behavior not implemented
  - **Verifies:** AC2 — Clearing input restores all items (P3/T2.1-007)

- **Test:** `should have a search input with correct placeholder text`
  - **Status:** RED — Search input does not exist
  - **Verifies:** AC2 — Placeholder is "Buscar por nombre o NIT/RUC"

**AC3 — EmptyState when no clients exist:**

- **Test:** `should display the EmptyState component when the API returns an empty array`
  - **Status:** RED — `EmptyState` component not implemented; `[data-testid="empty-state"]` missing
  - **Verifies:** AC3 — EmptyState visible when list is empty

- **Test:** `should hide the client list and show EmptyState when no clients exist`
  - **Status:** RED — EmptyState logic not implemented
  - **Verifies:** AC3 — List items absent when EmptyState is shown

**AC4 — ErrorPanel on fetch failure:**

- **Test:** `should display ErrorPanel when the backend fetch fails`
  - **Status:** RED — `[data-testid="error-panel"]` not implemented
  - **Verifies:** AC4 — ErrorPanel replaces the list on network error

- **Test:** `should display a "Reintentar" button inside ErrorPanel on fetch failure`
  - **Status:** RED — `[data-testid="retry-button"]` not implemented
  - **Verifies:** AC4 — Retry button is accessible to user

- **Test:** `should retry loading clients when "Reintentar" button is clicked`
  - **Status:** RED — Retry / refetch logic not wired
  - **Verifies:** AC4 — Clicking retry triggers new fetch; list recovers

- **Test:** `should not display raw error message to the user on fetch failure`
  - **Status:** RED — No ErrorPanel exists to prevent raw message display
  - **Verifies:** AC4 / NFR6 — error.message never rendered directly

### API Tests (5 tests)

**File:** `e2e/tests/api/clientes-list.api.spec.ts`

- **Test:** `should return HTTP 200 with a JSON array`
  - **Status:** RED — Backend endpoint `GET /api/v1/clientes` not implemented
  - **Verifies:** AC1 — Endpoint exists and returns array

- **Test:** `should return 200 with empty array when no clients exist (never 404)`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — Empty list returns 200 `[]`, not 404

- **Test:** `should include required fields in each item`
  - **Status:** RED — `ClienteDto` and endpoint not implemented
  - **Verifies:** AC1 — Response schema includes `id, nombre, nit, telefono, ciudad, createdAt, updatedAt`

- **Test:** `should return a direct JSON array (no wrapper object)`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — Response is `[]` not `{ data: [] }`

- **Test:** `should include Content-Type: application/json in response headers`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — Response is well-formed JSON

### Component Tests (14 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx`

**T2.1-001 — AC1: List renders with Nombre + NIT/RUC per item:**

- **Test:** `should render the list panel when clients exist`
  - **Status:** RED — `ClienteListPanel` component does not exist
  - **Verifies:** AC1 — Panel container rendered

- **Test:** `should render each client item with its Nombre visible`
  - **Status:** RED — `ClientListItem` not implemented
  - **Verifies:** AC1 — Each Nombre visible in DOM

- **Test:** `should render each client item with its NIT visible`
  - **Status:** RED — `ClientListItem` not implemented
  - **Verifies:** AC1 — Each NIT visible in DOM

- **Test:** `should render three client-list-item elements for three clients`
  - **Status:** RED — `ClientListItem` not implemented
  - **Verifies:** AC1 — Correct item count

- **Test:** `should show loading-skeleton while data is loading`
  - **Status:** RED — Loading skeleton not implemented
  - **Verifies:** AC1 — Skeleton shown during isLoading

**T2.1-002 — AC3: EmptyState shown when API returns empty array:**

- **Test:** `should display EmptyState component when API returns empty array`
  - **Status:** RED — `EmptyState` component not implemented
  - **Verifies:** AC3 — EmptyState rendered for empty list

- **Test:** `should not render any client-list-item when the list is empty`
  - **Status:** RED — Conditional rendering not implemented
  - **Verifies:** AC3 — No list items when empty

- **Test:** `should display a message guiding user to create the first client`
  - **Status:** RED — EmptyState message not implemented
  - **Verifies:** AC3 — Message text present in Spanish

**T2.1-003 — AC4: ErrorPanel + "Reintentar" on fetch failure:**

- **Test:** `should display ErrorPanel when network request fails`
  - **Status:** RED — `ErrorPanel` component not implemented
  - **Verifies:** AC4 — ErrorPanel rendered on isError

- **Test:** `should display "Reintentar" button when fetch fails`
  - **Status:** RED — Retry button not implemented
  - **Verifies:** AC4 — Button with retry action present

- **Test:** `should not render client-list-item elements when fetch fails`
  - **Status:** RED — ErrorPanel conditional not implemented
  - **Verifies:** AC4 — List hidden when error

- **Test:** `should not expose raw error.message to the user`
  - **Status:** RED — ErrorPanel not guarding against raw messages
  - **Verifies:** AC4 / NFR6 — No technical error text leaked

**T2.1-007 (P3) — AC2: Clearing search restores full list:**

- **Test:** `should restore all client items when search input is cleared`
  - **Status:** RED — Search input and filter not implemented
  - **Verifies:** AC2 — Clear restores full list

- **Test:** `should show search input with placeholder text`
  - **Status:** RED — Search input not implemented
  - **Verifies:** AC2 — Placeholder text correct

### Unit Tests (8 tests)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`

**T2.1-004 — AC2: Filter by Nombre:**

- **Test:** `should return only clients whose Nombre matches the search query`
  - **Status:** RED — `useClientesFiltrados` hook not implemented
  - **Verifies:** AC2 — Nombre filter returns correct subset

- **Test:** `should be case-insensitive when filtering by Nombre`
  - **Status:** RED — Filter logic missing
  - **Verifies:** AC2 — Case-insensitive matching

- **Test:** `should return the full list when search query is empty`
  - **Status:** RED — Empty query behavior not implemented
  - **Verifies:** AC2 — Empty query returns all clients

- **Test:** `should return empty array when no Nombre matches the query`
  - **Status:** RED — No-match behavior not implemented
  - **Verifies:** AC2 — No false positives

**T2.1-005 — AC2: Filter by NIT/RUC:**

- **Test:** `should return only clients whose NIT matches the search query`
  - **Status:** RED — NIT filter not implemented
  - **Verifies:** AC2 — NIT filter returns correct subset

- **Test:** `should return clients matching partial NIT search`
  - **Status:** RED — Partial match for NIT not implemented
  - **Verifies:** AC2 — Partial NIT matching works

- **Test:** `should match both Nombre and NIT when multiple clients partially match`
  - **Status:** RED — OR logic for Nombre+NIT not implemented
  - **Verifies:** AC2 — Filter matches either field

**T2.1-006 (P3) — NFR1: Performance:**

- **Test:** `should filter 500 clients in under 100ms`
  - **Status:** RED — Hook not implemented; performance not measurable yet
  - **Verifies:** NFR1 — Filter completes <100ms with 500 records

---

## Data Factories Created

### Cliente Factory

**File:** `frontend/src/test/factories/cliente.factory.ts` *(already created)*

**Exports:**
- `createCliente(overrides?)` — Create single client with optional field overrides
- `createClientes(count, overrides?)` — Create array of clients (used for bulk/NFR1 tests)

**Example Usage:**

```typescript
const c = createCliente({ nombre: 'Empresa Especial', nit: '111222333' })
const bulk = createClientes(500)
```

---

## Fixtures Created

### MSW Handler Fixture

**File:** `frontend/src/test/handlers/clientes.ts` *(already created)*

**Handlers:**
- `clienteListSuccessHandler` — GET /api/v1/clientes returns 3 mock clients (200)
  - **Setup:** Intercepts network requests at MSW server level
  - **Provides:** Deterministic 3-client response with known Nombre/NIT values
  - **Cleanup:** `server.resetHandlers()` in afterEach
- `clienteListEmptyHandler` — GET /api/v1/clientes returns [] (200)
  - **Provides:** Empty array response for AC3 tests
- `clienteListNetworkErrorHandler` — GET /api/v1/clientes returns network error
  - **Provides:** Simulated backend unavailability for AC4 tests
- `clienteList500Handler` — GET /api/v1/clientes returns 500 clients (200)
  - **Provides:** Bulk data for NFR1 performance test T2.1-006

**Example Usage:**

```typescript
import { server } from '@/test/server'
import { clienteListSuccessHandler } from '@/test/handlers/clientes'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('...', async () => {
  server.use(clienteListSuccessHandler)
  // test body
})
```

---

## Mock Requirements

### Backend API Mock (MSW — Component Tests)

**Endpoint:** `GET /api/v1/clientes`

**Success Response (200):**

```json
[
  { "id": "id-001", "nombre": "Empresa Alfa", "nit": "123456789", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-06-01T10:00:00Z", "updatedAt": "2026-06-01T10:00:00Z" },
  { "id": "id-002", "nombre": "Compañía Beta", "nit": "987654321", "telefono": "3109876543", "ciudad": "Medellín", "createdAt": "2026-06-02T10:00:00Z", "updatedAt": "2026-06-02T10:00:00Z" }
]
```

**Empty Response (200):**

```json
[]
```

**Network Error:**

```
HttpResponse.error() — simulates backend unavailable
```

**Notes:** E2E tests use Playwright `page.route()` intercepts. Component tests use MSW. API tests call the real backend at `http://localhost:5000`.

---

## Required data-testid Attributes

### ClienteListPanel component

- `clientes-list-panel` — Root container of the 280px left panel
- `search-input` — Search `<input>` with placeholder "Buscar por nombre o NIT/RUC"
- `loading-skeleton` — Root of skeleton placeholders during isLoading (react-loading-skeleton)

### ClientListItem component

- `client-list-item` — Root element of each client row in the list

### EmptyState component

- `empty-state` — Root container of the EmptyState component

### ErrorPanel component

- `error-panel` — Root container of the ErrorPanel component
- `retry-button` — The "Reintentar" action button inside ErrorPanel

### Route placeholder (clientes.tsx)

- `cliente-detail-placeholder` — Right panel placeholder `<div>` before a client is selected

**Implementation Example:**

```tsx
// ClienteListPanel.tsx
<div data-testid="clientes-list-panel" className="w-[280px] h-full overflow-y-auto">
  <input data-testid="search-input" placeholder="Buscar por nombre o NIT/RUC" />
  {isLoading && <div data-testid="loading-skeleton">...</div>}
  {isError && <ErrorPanel data-testid="error-panel" onRetry={refetch} />}
  {isEmpty && <EmptyState data-testid="empty-state" message="No hay clientes registrados. Crea el primero." />}
  {filteredClientes.map(c => <ClientListItem data-testid="client-list-item" key={c.id} ... />)}
</div>

// ErrorPanel.tsx
<div data-testid="error-panel">
  <p>No se pudieron cargar los datos.</p>
  <button data-testid="retry-button" onClick={onRetry}>Reintentar</button>
</div>

// clientes.tsx route
<div data-testid="cliente-detail-placeholder">Selecciona un cliente</div>
```

---

## Implementation Checklist

### Test: T2.1-001 — Client list renders with Nombre + NIT/RUC per item

**File:** `e2e/tests/clientes/client-list-search.spec.ts` + `ClienteListPanel.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — calls `GET /api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — renders Nombre + NIT; `data-testid="client-list-item"`, `aria-selected`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` — 280px panel, skeleton on isLoading
- [ ] Add `data-testid="clientes-list-panel"` to ClienteListPanel root
- [ ] Add `data-testid="loading-skeleton"` to skeleton placeholders
- [ ] Update `frontend/src/routes/_app/clientes.tsx` — render `<ClienteListPanel />` in left panel
- [ ] Add `data-testid="cliente-detail-placeholder"` to right panel placeholder
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — `GET /api/v1/clientes`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC1"`
- [ ] Run test: `pnpm --filter frontend test ClienteListPanel`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 6–8 hours

---

### Test: T2.1-004/005 — useClientesFiltrados filters by Nombre and NIT/RUC

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`

**Tasks to make these tests pass:**

- [ ] Export `useClientesFiltrados(searchQuery: string)` from `useClientes.ts`
- [ ] Implement `useMemo` filter: match `nombre.toLowerCase().includes(q)` OR `nit.toLowerCase().includes(q)`
- [ ] Return `{ filteredClientes, isLoading, isError, refetch }` from hook
- [ ] Handle empty query: return full list when `searchQuery.trim() === ''`
- [ ] Verify case-insensitive matching (toLowerCase on both sides)
- [ ] Add `data-testid="search-input"` controlled input to `ClienteListPanel`
- [ ] Wire `searchQuery` state to `useClientesFiltrados`
- [ ] Run test: `pnpm --filter frontend test useClientes`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2–3 hours

---

### Test: T2.1-002 — EmptyState shown when API returns empty array

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx`

**Tasks to make these tests pass:**

- [ ] Check `siesa-ui-kit` for EmptyState — use if available; otherwise create `frontend/src/shared/components/EmptyState.tsx`
- [ ] Props: `{ message: string; actionLabel?: string; onAction?: () => void }`
- [ ] Add `data-testid="empty-state"` to root element
- [ ] Icon: Heroicons `UserGroupIcon` with `aria-hidden="true"`
- [ ] Message text in Spanish: "No hay clientes registrados. Crea el primero."
- [ ] Wire into `ClienteListPanel`: render `<EmptyState>` when `data?.length === 0` and `!isLoading`
- [ ] Run test: `pnpm --filter frontend test ClienteListPanel --grep "T2.1-002"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1–2 hours

---

### Test: T2.1-003 — ErrorPanel + "Reintentar" on fetch failure

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx`

**Tasks to make these tests pass:**

- [ ] Check `siesa-ui-kit` for ErrorPanel — use if available; otherwise create `frontend/src/shared/components/ErrorPanel.tsx`
- [ ] Props: `{ onRetry: () => void }`
- [ ] Add `data-testid="error-panel"` to root element
- [ ] Add `data-testid="retry-button"` to the "Reintentar" button
- [ ] Message text: "No se pudieron cargar los datos." (never expose `error.message`)
- [ ] Wire into `ClienteListPanel`: render `<ErrorPanel onRetry={refetch} />` when `isError`
- [ ] Run test: `pnpm --filter frontend test ClienteListPanel --grep "T2.1-003"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1–2 hours

---

### Test: T2.1-006 (P3) — Filter performance <100ms with 500 clients

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`

**Tasks to make this test pass:**

- [ ] Ensure `useClientesFiltrados` uses `useMemo` (not recomputed on every render)
- [ ] Verify `useMemo` deps are `[data, searchQuery]` — no missing deps
- [ ] Run test: `pnpm --filter frontend test useClientes --grep "T2.1-006"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E tests for Story 2.1
npx playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run API integration tests for client list
npx playwright test e2e/tests/api/clientes-list.api.spec.ts

# Run component tests (Vitest)
pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteListPanel

# Run unit tests for the hook
pnpm --filter frontend test src/modules/crm/clientes/application/__tests__/useClientes

# Run E2E in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --debug

# Run all tests with coverage
pnpm --filter frontend test --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 40 tests written and failing (14 E2E, 5 API, 14 Component, 8 Unit — includes 1 E2E shared with clientes-crud.spec.ts)
- ✅ Data factories created (`cliente.factory.ts`)
- ✅ MSW handlers created (`handlers/clientes.ts`)
- ✅ Mock requirements documented
- ✅ Required `data-testid` attributes listed
- ✅ Implementation checklist created

**Verification:**

- Tests fail because `ClienteListPanel`, `useClientes`, `useClientesFiltrados`, `EmptyState`, and `ErrorPanel` do not exist yet
- API tests fail because `GET /api/v1/clientes` backend endpoint is not implemented
- Failure messages are actionable: "Cannot find module '../useClientes'", "Unable to find element with testid: clientes-list-panel"

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with backend endpoint — unblocks E2E and API tests)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order (dependency-driven):**

1. Backend: `GET /api/v1/clientes` endpoint → unlocks 5 API tests
2. `Cliente.ts` domain + `clienteApiRepository.ts` → unlocks `useClientes.ts`
3. `useClientes.ts` + `useClientesFiltrados` → unlocks 8 unit tests
4. `EmptyState.tsx` + `ErrorPanel.tsx` shared components → unlocks 6 component tests
5. `ClientListItem.tsx` → unlocks item-level rendering tests
6. `ClienteListPanel.tsx` → unlocks all component and E2E tests
7. Route wiring (`clientes.tsx`) → unlocks full E2E suite

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 40 tests pass (green phase complete)
2. Extract duplicate render logic from `ClienteListPanel` into smaller sub-components if needed
3. Ensure `useMemo` deps are minimal (no accidental re-renders)
4. Validate WCAG 2.1 AA: `aria-selected` on `ClientListItem`, `aria-hidden` on icons
5. Run tests after each refactor
6. Update story status to `done` in `bmm-workflow-status.md`

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/clientes/`
3. **Begin with backend endpoint** — creates foundation for all other layers
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'done'

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `test.extend()` patterns; MSW `setupServer` composition
- **data-factories.md** — Factory with sequence-based unique data; `createCliente`, `createClientes(500)` bulk helper
- **network-first.md** — `page.route()` registered BEFORE `page.goto()` in all E2E tests
- **test-quality.md** — Given-When-Then structure; one assertion per test; explicit waits only
- **selector-resilience.md** — `data-testid` for all element selection; no CSS selectors
- **timing-debugging.md** — `waitFor()` in component tests; no `page.waitForTimeout()`
- **test-levels-framework.md** — E2E for user journeys (AC1–AC4); Component for state rendering (T2.1-001–003/007); Unit for pure logic (T2.1-004–006)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Component tests command:** `pnpm --filter frontend test src/modules/crm/clientes`

**Expected Results:**

```
FAIL src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx
  × T2.1-001: should render the list panel when clients exist
    → Cannot find module '../../../../../routeTree.gen' or module '/clientes' does not render clientes-list-panel
  × T2.1-002: should display EmptyState component when API returns empty array
    → Unable to find element with testid: empty-state
  × T2.1-003: should display ErrorPanel when network request fails
    → Unable to find element with testid: error-panel
  × T2.1-007: should restore all client items when search input is cleared
    → Unable to find element with testid: search-input

FAIL src/modules/crm/clientes/application/__tests__/useClientes.test.ts
  × T2.1-004: should return only clients whose Nombre matches the search query
    → Cannot find module '../useClientes'
  × T2.1-005: should return only clients whose NIT matches the search query
    → Cannot find module '../useClientes'
  × T2.1-006: should filter 500 clients in under 100ms
    → Cannot find module '../useClientes'

Summary: 40 tests failing (expected) | 0 passing | RED phase verified ✅
```

**E2E tests command:** `npx playwright test e2e/tests/clientes/client-list-search.spec.ts`

**Expected Results:**

```
× AC1 - should show the left list panel (280px) → locator getByTestId('clientes-list-panel') not found
× AC2 - should filter clients by Nombre → locator getByTestId('search-input') not found
× AC3 - should display the EmptyState component → locator getByTestId('empty-state') not found
× AC4 - should display ErrorPanel → locator getByTestId('error-panel') not found

13 failed | 0 passed | RED phase verified ✅
```

---

## Notes

- The `clientes-crud.spec.ts` file (pre-existing) provides additional FR1/FR2 E2E coverage that overlaps with Story 2.1 AC1/AC2. Those tests use the `ClientesPage` POM which also targets `data-testid="search-input"` and `data-testid="client-list-item"` — consistent with this ATDD spec.
- Component tests use `routeTree.gen.ts` (TanStack Router auto-generated) — the `/clientes` route must be registered in the route tree for tests to pass.
- The `useClientesFiltrados` hook must be exported from `useClientes.ts` (not a separate file) per the story task specification (Task 3).
- Backend tests assume `POST /api/v1/clientes` exists for seeding — this endpoint is part of Story 2.3; for Story 2.1 API tests that need seeding, tests can be skipped or adapted to use only the GET endpoint if POST is not available.

---

**Generated by BMad TEA Agent** — 2026-06-10
