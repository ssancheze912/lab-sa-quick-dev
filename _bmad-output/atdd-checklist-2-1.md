# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-14
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + E2E (Playwright)

---

## Story Summary

As a commercial team member, I want to see a list of all clients and search them by name or NIT/RUC so that I can quickly find the client I'm looking for. This story builds the left panel (280px) of the master-detail CRM layout, including real-time client-side filtering, a loading skeleton, empty state, and error state with retry.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px fixed width) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item, rendered inside `ClienteListView`.

2. Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC contain the input (case-insensitive), and results appear in under 1 second even with 500 records (NFR1).

3. Given the user clears the search field, When the input becomes empty, Then the full client list is restored without triggering a new API call.

4. Given there are no clients in the system (API returns `[]`), When the user navigates to `/clientes`, Then an `EmptyState` component is displayed in the left panel with the message "No hay clientes registrados. Crea el primero." — no skeleton, no error.

5. Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` component is displayed with the message "Error al cargar los clientes." and a "Reintentar" button that triggers a refetch on click.

6. Given the client list is loading for the first time, When data has not yet arrived, Then a skeleton placeholder (react-loading-skeleton) is displayed in the left panel instead of the list or empty state.

---

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `e2e/tests/clientes/story-2-1-client-list-search.spec.ts`

- **Test:** AC#1 — should show client list with Nombre and NIT/RUC on /clientes navigation
  - **Status:** RED — endpoint `GET /api/v1/clientes` and `ClienteListView` do not exist yet
  - **Verifies:** AC#1 — full stack list rendering

- **Test:** AC#2 — should filter client list by Nombre in real time (TC-E2-P1-15)
  - **Status:** RED — search input `data-testid` and filter logic not implemented
  - **Verifies:** AC#2 — real-time search and NFR1 performance

- **Test:** AC#2 — should filter client list by NIT/RUC in real time (TC-E2-P3-01)
  - **Status:** RED — same as above, NIT/RUC filter path
  - **Verifies:** AC#2 — NIT search path

- **Test:** AC#3 — should restore full client list when search is cleared
  - **Status:** RED — clear search behavior not implemented
  - **Verifies:** AC#3 — full list restoration without API call

### Component Tests (20 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

- **Test:** AC#6 — should render skeleton placeholder while data is loading
  - **Status:** RED — `ClienteListView` does not exist; `clientes-list-skeleton` testid missing
  - **Verifies:** AC#6 — loading skeleton during initial fetch

- **Test:** AC#1 — should render all client items once data arrives (TC-E2-P1-06)
  - **Status:** RED — `ClienteListView` and `useClientes` do not exist
  - **Verifies:** AC#1 — list renders 3 items

- **Test:** AC#1 — should display Nombre for each client item
  - **Status:** RED — same
  - **Verifies:** AC#1 — Nombre visible

- **Test:** AC#1 — should display NIT/RUC for each client item
  - **Status:** RED — same
  - **Verifies:** AC#1 — NIT/RUC visible

- **Test:** AC#1 — should render list panel with role="listbox" and aria-label
  - **Status:** RED — ARIA attributes not implemented
  - **Verifies:** AC#1 — WCAG compliance

- **Test:** AC#1 — should render search input with aria-label "Buscar cliente"
  - **Status:** RED — search input not implemented
  - **Verifies:** AC#1 — accessible search

- **Test:** AC#2 — should filter list by Nombre (TC-E2-P1-07)
  - **Status:** RED — filter logic not implemented
  - **Verifies:** AC#2 — nombre filter

- **Test:** AC#2 — should filter list by NIT/RUC
  - **Status:** RED — same
  - **Verifies:** AC#2 — NIT/RUC filter

- **Test:** AC#2 — should be case-insensitive in search
  - **Status:** RED — same
  - **Verifies:** AC#2 — case-insensitive behavior

- **Test:** AC#2 — should show "Sin resultados" message when no matches
  - **Status:** RED — empty search result message not implemented
  - **Verifies:** AC#2 — no-match feedback

- **Test:** AC#2/NFR1 — should filter 500 records in under 150ms (TC-E2-P0-05)
  - **Status:** RED — component + filter do not exist
  - **Verifies:** NFR1 — performance requirement

- **Test:** AC#3 — should restore full client list when search is cleared
  - **Status:** RED — clear behavior not implemented
  - **Verifies:** AC#3 — restore full list

- **Test:** AC#4 — should render EmptyState when API returns [] (TC-E2-P2-01)
  - **Status:** RED — `EmptyState` component and conditional rendering not implemented
  - **Verifies:** AC#4 — empty state display

- **Test:** AC#4 — should NOT render list items when API returns []
  - **Status:** RED — same
  - **Verifies:** AC#4 — no list items on empty

- **Test:** AC#4 — should NOT show skeleton when API returns []
  - **Status:** RED — same
  - **Verifies:** AC#4 — skeleton not shown on empty

- **Test:** AC#5 — should render ErrorPanel when backend unavailable
  - **Status:** RED — `ErrorPanel` component not implemented
  - **Verifies:** AC#5 — error state display

- **Test:** AC#5 — should render "Reintentar" button in ErrorPanel
  - **Status:** RED — same
  - **Verifies:** AC#5 — retry button visible

- **Test:** AC#5 — should trigger refetch when "Reintentar" clicked (TC-E2-P2-02)
  - **Status:** RED — retry wiring not implemented
  - **Verifies:** AC#5 — refetch on retry click

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`

- **Test:** isLoading=true initially
  - **Status:** RED — `useClientes` hook does not exist
  - **Verifies:** AC#6 — loading state exposure

- **Test:** returns array of 3 clients when API has 3 records (TC-E2-P3-06)
  - **Status:** RED — hook not implemented
  - **Verifies:** AC#1 — typed client data

- **Test:** returns typed Cliente objects with all required fields
  - **Status:** RED — same
  - **Verifies:** AC#1 — domain type compliance

- **Test:** exposes isError=true when backend returns 500
  - **Status:** RED — same
  - **Verifies:** AC#5 — error state

- **Test:** exposes refetch function
  - **Status:** RED — same
  - **Verifies:** AC#5 — retry capability

- **Test:** uses queryKey ["clientes"]
  - **Status:** RED — same
  - **Verifies:** AC#1 — architecture compliance

**File:** `frontend/src/shared/components/__tests__/EmptyState.test.tsx` (5 tests)

All 5 tests are RED — `EmptyState` component does not exist.
- Verifies: AC#4 — message, role="status", aria-label, optional action slot, no action when not provided

**File:** `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` (5 tests)

All 5 tests are RED — `ErrorPanel` component does not exist.
- Verifies: AC#5 — message, role="alert", "Reintentar" button, onRetry called, multiple clicks

**File:** `frontend/src/shared/components/__tests__/ClienteListItem.test.tsx` (8 tests)

All 8 tests are RED — `ClienteListItem` component does not exist.
- Verifies: AC#1 — Nombre, NIT, role="option", aria-selected, onClick, Enter key, tabIndex, data-testid

### API Tests (6 tests)

**File:** `e2e/tests/api/clientes-api.spec.ts`

- **Test:** AC#1 — should return 200 OK with a JSON array (TC-E2-P1-01)
  - **Status:** RED — `GET /api/v1/clientes` endpoint not implemented
  - **Verifies:** AC#1 — endpoint contract

- **Test:** AC#1 — should return clients with all required fields
  - **Status:** RED — same
  - **Verifies:** AC#1 — API response shape

- **Test:** AC#1 — should return correct field values for a seeded client
  - **Status:** RED — same
  - **Verifies:** AC#1 — data integrity

- **Test:** AC#1 — should return empty array when no clients exist
  - **Status:** RED — same
  - **Verifies:** AC#4 — empty array (not error)

- **Test:** AC#1 — Content-Type should be application/json
  - **Status:** RED — same
  - **Verifies:** AC#1 — content type header

- **Test:** AC#1 — should NOT expose internal EF Core navigation property names
  - **Status:** RED — same
  - **Verifies:** AC#1 — clean DTO response shape

---

## Data Factories

### Cliente Factory (frontend)

**File:** `frontend/src/test/factories/cliente.factory.ts` (already exists from ATDD 2.1 prep)

**Exports:**
- `createCliente(overrides?)` — Create single Cliente with optional overrides
- `createClientes(count, overrides?)` — Create array of Clientes
- `resetClienteFactory()` — Reset internal counter for deterministic tests

**E2E Data Helper:**
**File:** `e2e/helpers/data.helper.ts` (already exists)
**Export:** `buildCliente(overrides?)` — generates unique client test data for E2E

---

## Fixtures

### Base E2E Fixture

**File:** `e2e/fixtures/base.fixture.ts` (already exists)

**Fixtures:**
- `clientesPage` — navigates to `/clientes` before test, no cleanup needed (uses afterEach apiHelper)

---

## Mock Requirements

### GET /api/v1/clientes — MSW Handler (Component Tests)

**Endpoint:** `GET http://localhost:5000/api/v1/clientes`

**Success Response (3 clients):**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Empresa ABC",
    "nit": "900100200-1",
    "telefono": "601 234 5678",
    "ciudad": "Bogotá",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

**Empty Response:**
```json
[]
```

**Error Response (500):**
```json
{ "error": "Internal Server Error" }
```

**Notes:** MSW server is set up in each test file with `beforeAll`/`afterEach`/`afterAll` lifecycle. Network-first pattern used in E2E tests (Playwright `page.route` before `page.goto`).

---

## Required data-testid Attributes

### ClienteListView / Left Panel

- `clientes-list-panel` — the 280px left panel container
- `clientes-list-skeleton` — skeleton placeholder during loading (wrapping Skeleton component)

### ClienteListItem

- `cliente-list-item` — each client item in the list (also needs `role="option"` per story spec)

### EmptyState

- `empty-state` — the empty state container (already referenced in `clientes.page.ts`)

### ErrorPanel

- (No specific data-testid required — uses `role="alert"` for test selection)

**Implementation Example:**
```tsx
// ClienteListView.tsx
<div data-testid="clientes-list-panel" className="w-[280px] ...">
  {isLoading && (
    <div data-testid="clientes-list-skeleton">
      <Skeleton count={8} height={56} />
    </div>
  )}
  {/* ...rest of panel */}
</div>

// ClienteListItem.tsx
<div
  data-testid="cliente-list-item"
  role="option"
  aria-selected={isSelected}
  tabIndex={0}
  onClick={onClick}
  onKeyDown={(e) => e.key === 'Enter' && onClick()}
>
  ...
</div>

// EmptyState.tsx
<div role="status" aria-label={message} data-testid="empty-state">
  {message}
</div>

// ErrorPanel.tsx
<div role="alert">
  <p>{message}</p>
  <button onClick={onRetry}>Reintentar</button>
</div>
```

---

## Implementation Checklist

### Test: AC#6 — Skeleton during loading

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `ClienteListView.tsx` with `isLoading` branch rendering `<div data-testid="clientes-list-skeleton"><Skeleton count={8} height={56} /></div>`
- [ ] Wire `useClientes` hook inside `ClienteListView`
- [ ] Install `react-loading-skeleton` if not present (`pnpm --filter frontend add react-loading-skeleton`)
- [ ] Run test: `pnpm --filter frontend test ClienteListView`
- [ ] Test passes (green phase)

---

### Test: AC#1 — List renders with Nombre and NIT

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` (interface with 7 fields)
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` (TanStack Query hook)
- [ ] Create `frontend/src/shared/components/ClienteListItem.tsx` with `data-testid="cliente-list-item"`, `role="option"`, `aria-selected`
- [ ] Render `<ClienteListItem>` for each client in `ClienteListView`
- [ ] Add `role="listbox"` and `aria-label="Lista de clientes"` to list container
- [ ] Add search input with `aria-label="Buscar cliente"` and `type="search"`
- [ ] Run test: `pnpm --filter frontend test ClienteListView`
- [ ] Tests pass (green phase)

---

### Test: AC#2 — Real-time search filter

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Add `useState<string>('')` for `searchQuery` in `ClienteListView`
- [ ] Add `useMemo` filter: `data.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
- [ ] Wire `onChange` on search input to `setSearchQuery`
- [ ] Render "Sin resultados para '{searchQuery}'" when filtered array is empty but data.length > 0
- [ ] Run test: `pnpm --filter frontend test ClienteListView`
- [ ] Tests pass (green phase)

---

### Test: AC#3 — Clear search restores full list

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Ensure `useMemo` returns full `data` array when `searchQuery.trim()` is empty (no `.filter()` call)
- [ ] Verify no extra `queryClient.refetchQueries` on clear (client-side only filter)
- [ ] Run test: `pnpm --filter frontend test ClienteListView`
- [ ] Test passes (green phase)

---

### Test: AC#4 — EmptyState on empty list

**File:** `frontend/src/shared/components/__tests__/EmptyState.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` with props: `message: string`, `action?: React.ReactNode`
- [ ] Render `role="status"`, `aria-label={message}`, `data-testid="empty-state"`
- [ ] In `ClienteListView`: render `<EmptyState>` when `!isLoading && !isError && data?.length === 0`
- [ ] Run test: `pnpm --filter frontend test EmptyState`
- [ ] Run test: `pnpm --filter frontend test ClienteListView`
- [ ] Tests pass (green phase)

---

### Test: AC#5 — ErrorPanel with Reintentar

**File:** `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with props: `message: string`, `onRetry: () => void`
- [ ] Render `role="alert"` container, message text, and `<button onClick={onRetry}>Reintentar</button>`
- [ ] In `ClienteListView`: render `<ErrorPanel message="Error al cargar los clientes." onRetry={refetch} />` when `isError`
- [ ] Run test: `pnpm --filter frontend test ErrorPanel`
- [ ] Run test: `pnpm --filter frontend test ClienteListView`
- [ ] Tests pass (green phase)

---

### Test: AC#1 — ClienteListItem component

**File:** `frontend/src/shared/components/__tests__/ClienteListItem.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/shared/components/ClienteListItem.tsx`
- [ ] Render `data-testid="cliente-list-item"`, `role="option"`, `aria-selected={isSelected}`
- [ ] Add `tabIndex={0}` and `onKeyDown={(e) => e.key === 'Enter' && onClick()}`
- [ ] Display `nombre` (bold, `truncate` class) and `nit` (smaller, `text-slate-500`)
- [ ] Run test: `pnpm --filter frontend test ClienteListItem`
- [ ] Tests pass (green phase)

---

### Test: GET /api/v1/clientes API endpoint

**File:** `e2e/tests/api/clientes-api.spec.ts`

**Tasks to make this test pass:**
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with factory + validation
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Create EF Core migration `AddClienteEntity` and apply it
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` + handler
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with `GET /api/v1/clientes`
- [ ] Register DI: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`
- [ ] Wire `app.MapClienteEndpoints()` in `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-api.spec.ts`
- [ ] Tests pass (green phase)

---

### Test: useClientes hook

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`

**Tasks to make this test pass:**
- [ ] Create `clienteApiRepository` (singleton, calls `GET /api/v1/clientes` via apiClient)
- [ ] Create `useClientes` hook with `queryKey: ['clientes']`, `queryFn: clienteApiRepository.getAll()`
- [ ] Expose `{ data, isLoading, isError, refetch }` from hook
- [ ] Run test: `pnpm --filter frontend test useClientes`
- [ ] Tests pass (green phase)

---

## Running Tests

```bash
# Run all component + unit tests for story 2.1 (frontend)
pnpm --filter frontend test --run

# Run specific component test file
pnpm --filter frontend test ClienteListView

# Run shared component tests
pnpm --filter frontend test EmptyState
pnpm --filter frontend test ErrorPanel
pnpm --filter frontend test ClienteListItem
pnpm --filter frontend test useClientes

# Run all E2E tests for story 2.1
npx playwright test e2e/tests/clientes/story-2-1-client-list-search.spec.ts

# Run API integration tests for story 2.1
npx playwright test e2e/tests/api/clientes-api.spec.ts

# Run all E2E tests in headed mode (see browser)
npx playwright test --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/story-2-1-client-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Fixtures and factories available (using existing `cliente.factory.ts` and `data.helper.ts`)
- Mock requirements documented (MSW handlers in each test file)
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- All tests will fail with import errors (modules not found) or assertion failures (DOM elements not found)
- Failures are due to missing implementation, not test bugs
- Tests document exactly what each component must expose (props, testids, ARIA attributes)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with highest priority)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended Order:**
1. Backend: `ClienteEntity` + `IClienteRepository` + migration + `ClienteRepository` + endpoint (makes API tests pass)
2. Frontend: `Cliente.ts` domain interface (makes domain tests pass)
3. Frontend: `clienteApiRepository` + `useClientes` (makes hook tests pass)
4. Frontend: `EmptyState` + `ErrorPanel` + `ClienteListItem` shared components
5. Frontend: `ClienteListView` composing all of the above
6. Frontend: Wire `ClienteListView` into `/clientes` route

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

- All tests passing (green phase complete)
- Review code quality (readability, maintainability, performance)
- Extract any duplicated logic
- Ensure `data-testid` attributes are consistent across components
- Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase:
   - `pnpm --filter frontend test --run` (component tests)
   - `npx playwright test e2e/tests/clientes/story-2-1-client-list-search.spec.ts` (E2E)
   - `npx playwright test e2e/tests/api/clientes-api.spec.ts` (API)
3. Begin implementation using implementation checklist above
4. Work one test at a time (red → green for each)
5. When all tests pass, mark story 2.1 as done in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns with setup/teardown (`beforeAll/afterEach/afterAll` MSW lifecycle)
- **data-factories.md** — Factory patterns using deterministic counters (no faker dependency; uses existing `cliente.factory.ts`)
- **component-tdd.md** — Component test strategies with RTL + MSW for state transitions
- **network-first.md** — Route interception patterns: MSW handlers registered before component render; Playwright E2E routes set before `page.goto`
- **test-quality.md** — Given-When-Then structure, one assertion per test where practical, deterministic data
- **selector-resilience.md** — `data-testid` selectors used throughout (never CSS class selectors)
- **test-levels-framework.md** — E2E for full-stack journeys, component tests for AC behavior, API tests for backend contract

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm --filter frontend test --run 2>&1 | grep -E "FAIL|PASS|ERROR"`

**Expected Results:**
```
FAIL  src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx
  Cannot find module '../ClienteListView'

FAIL  src/modules/crm/clientes/application/__tests__/useClientes.test.ts
  Cannot find module '../useClientes'

FAIL  src/shared/components/__tests__/EmptyState.test.tsx
  Cannot find module '../EmptyState'

FAIL  src/shared/components/__tests__/ErrorPanel.test.tsx
  Cannot find module '../ErrorPanel'

FAIL  src/shared/components/__tests__/ClienteListItem.test.tsx
  Cannot find module '../ClienteListItem'
```

**Status:** RED phase — all tests fail due to missing implementation.

---

## Notes

- The `cliente.factory.ts` and `data.helper.ts` already exist from previous ATDD work. No new factory files needed.
- The `ClienteListView` tests import from `../../../../test/factories/cliente.factory` using the existing factory.
- The E2E test file extends the existing `clientes-crud.spec.ts` patterns (same POM and helpers).
- The `resetClienteFactory()` call in `afterEach` ensures deterministic counter reset between tests.
- `tea_use_playwright_utils: false` — Playwright Utils not used; standard MSW + RTL patterns applied.
- All UI text is in Spanish per company standards.

---

**Generated by BMad TEA Agent** — 2026-06-14
