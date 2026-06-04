# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-04
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + E2E (Playwright)

---

## Story Summary

As a commercial team member, I want to see a list of all clients and search them by name or NIT/RUC, so that I can quickly find the client I'm looking for. The feature includes a 280px fixed-width left panel, real-time client-side filtering, an EmptyState for no results, and an ErrorPanel with a Reintentar button for backend failures.

**As a** commercial team member
**I want** to see a list of all clients and search by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px fixed width) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. Given the client list is loaded, When the user types in the search field, Then the list filters in real time (client-side, no additional API call) showing only matching clients, and results appear in under 1 second with up to 500 records (NFR1).

3. Given there are no clients in the system, When the user navigates to `/clientes` and the API returns an empty array, Then an EmptyState component is displayed with guidance to create the first client. No list items or loading skeleton are visible.

4. Given the backend is unavailable, When the fetch fails (network error or 5xx), Then an ErrorPanel with a "Reintentar" button is displayed. Clicking "Reintentar" triggers a new GET `/api/v1/clientes` request.

5. Given the client list is loaded, When the user clears the search field, Then the full list is displayed again without a new API call.

---

## Failing Tests Created (RED Phase)

### E2E Tests (13 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts` (492 lines)

- **Test:** AC1 — should display the 280px fixed-width left panel
  - **Status:** RED - `ClienteListView` not implemented; `data-testid="clientes-list-panel"` does not exist
  - **Verifies:** AC1 panel renders with correct dimensions

- **Test:** AC1 — should show Nombre for each client item
  - **Status:** RED - `data-testid="cliente-list-item"` does not exist
  - **Verifies:** AC1 nombre is visible per item

- **Test:** AC1 — should show NIT/RUC for each client item
  - **Status:** RED - `data-testid="cliente-list-item"` does not exist
  - **Verifies:** AC1 nit is visible per item

- **Test:** AC2 — should filter list by nombre in real time without issuing a new API call
  - **Status:** RED - `data-testid="search-clientes"` does not exist; `ClienteListView` not implemented
  - **Verifies:** AC2 real-time client-side search by nombre

- **Test:** AC2 — should filter list by NIT/RUC in real time
  - **Status:** RED - search field and filter logic do not exist
  - **Verifies:** AC2 NIT/RUC search

- **Test:** AC2 — should display search results in under 1 second with 500 records (NFR1)
  - **Status:** RED - implementation does not exist
  - **Verifies:** AC2 performance NFR1

- **Test:** AC3 — should display EmptyState when API returns []
  - **Status:** RED - `EmptyState` component not created; `data-testid="empty-state"` missing
  - **Verifies:** AC3 empty state display

- **Test:** AC3 — should NOT show any list items when EmptyState is displayed
  - **Status:** RED - implementation missing
  - **Verifies:** AC3 no list items in empty state

- **Test:** AC3 — should show a guidance message to create the first client
  - **Status:** RED - `EmptyState` component missing
  - **Verifies:** AC3 guidance message content

- **Test:** AC4 — should display ErrorPanel when fetch fails with 5xx
  - **Status:** RED - `ErrorPanel` component not created; `data-testid="error-panel"` missing
  - **Verifies:** AC4 error state on 5xx

- **Test:** AC4 — should display a "Reintentar" button inside ErrorPanel
  - **Status:** RED - `ErrorPanel` not implemented
  - **Verifies:** AC4 retry button

- **Test:** AC4 — should trigger new GET request when "Reintentar" is clicked
  - **Status:** RED - `onRetry → refetch` wiring not implemented
  - **Verifies:** AC4 retry triggers new API call

- **Test:** AC4 — should display ErrorPanel on network-level failure (aborted request)
  - **Status:** RED - implementation missing
  - **Verifies:** AC4 network error (not just 5xx)

- **Test:** AC5 — should show full list again after clearing the search field
  - **Status:** RED - search state management not implemented
  - **Verifies:** AC5 clear restores full list

- **Test:** AC5 — should NOT issue a new API call when search is cleared
  - **Status:** RED - implementation missing
  - **Verifies:** AC5 no extra API call on clear

### API Tests (7 tests)

**File:** `e2e/tests/api/clientes-list.api.spec.ts` (150 lines)

- **Test:** TC-E2-P2-01 — should return HTTP 200 when called
  - **Status:** RED - `GET /api/v1/clientes` endpoint not yet implemented
  - **Verifies:** AC1 endpoint exists and returns 200

- **Test:** TC-E2-P2-01 — should return a JSON array (direct, no wrapper)
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC1 response contract is a direct array

- **Test:** TC-E2-P2-01 — should return Content-Type application/json
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC1 correct content type header

- **Test:** TC-E2-P2-01 — should return client objects with all required fields
  - **Status:** RED - endpoint not implemented; `ClienteEntity` not mapped to `ClienteDto`
  - **Verifies:** AC1 complete DTO shape

- **Test:** TC-E2-P2-01 — should return id as a UUID string
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC1 id is UUID format

- **Test:** TC-E2-P2-01 — should return createdAt as ISO 8601 with timezone
  - **Status:** RED - endpoint not implemented; `DateTimeOffset` serialization not configured
  - **Verifies:** AC1 DateTimeOffset (not DateTime) in response

- **Test:** AC4 — should NOT expose stack traces on errors (NFR6)
  - **Status:** RED - `ExceptionHandlingMiddleware` not wired to clientes endpoint
  - **Verifies:** AC4 NFR6 no stack trace exposure

- **Test:** AC4 — should return CORS header for frontend origin
  - **Status:** RED - `MapClienteEndpoints()` not registered
  - **Verifies:** AC4 CORS policy covers new endpoint

### Component Tests (22 tests)

**Files:**
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` (220 lines)
- `frontend/src/shared/components/__tests__/EmptyState.test.tsx` (95 lines)
- `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` (105 lines)

**ClienteListView tests (15 tests):**

- **Test:** TC-E2-P1-01 — should render clientes-list-panel
  - **Status:** RED - `ClienteListView.tsx` does not exist
  - **Verifies:** AC1 panel renders

- **Test:** TC-E2-P1-01 — should display nombre per item
  - **Status:** RED - component missing
  - **Verifies:** AC1 nombre visible

- **Test:** TC-E2-P1-01 — should display nit per item
  - **Status:** RED - component missing
  - **Verifies:** AC1 nit visible

- **Test:** TC-E2-P1-01 — should render one list item per client
  - **Status:** RED - component missing
  - **Verifies:** AC1 correct item count

- **Test:** TC-E2-P1-01 — should render search input with correct placeholder
  - **Status:** RED - component missing
  - **Verifies:** AC1 search field in Spanish

- **Test:** TC-E2-P1-02 — should filter to matching nombre items on type
  - **Status:** RED - `useMemo` filter not implemented
  - **Verifies:** AC2 real-time nombre filter

- **Test:** TC-E2-P1-02 — should not show non-matching clients
  - **Status:** RED - filter not implemented
  - **Verifies:** AC2 non-matching items hidden

- **Test:** TC-E2-P1-02 — should NOT issue extra API call during search
  - **Status:** RED - TanStack Query cache not used for client-side filter
  - **Verifies:** AC2 no extra network call

- **Test:** TC-E2-P1-03 — should filter to matching NIT fragment
  - **Status:** RED - NIT filter not implemented
  - **Verifies:** AC2 NIT/RUC search

- **Test:** TC-E2-P1-03 — should be case-insensitive on NIT match
  - **Status:** RED - filter not implemented
  - **Verifies:** AC2 case-insensitive match

- **Test:** TC-E2-P1-04 — should display EmptyState when API returns []
  - **Status:** RED - `EmptyState` component missing; conditional rendering not wired
  - **Verifies:** AC3 empty state branch

- **Test:** TC-E2-P1-04 — should NOT render list items during EmptyState
  - **Status:** RED - empty branch not implemented
  - **Verifies:** AC3 no items in empty state

- **Test:** TC-E2-P1-04 — should display guidance message in EmptyState
  - **Status:** RED - `EmptyState` component missing
  - **Verifies:** AC3 guidance message

- **Test:** TC-E2-P1-04 — should NOT show skeleton during EmptyState
  - **Status:** RED - state branching not implemented
  - **Verifies:** AC3 skeleton not visible in empty state

- **Test:** TC-E2-P1-05 — should display ErrorPanel on 500 error
  - **Status:** RED - `ErrorPanel` component missing; error branch not wired
  - **Verifies:** AC4 error state

- **Test:** TC-E2-P1-05 — should display "Reintentar" button in ErrorPanel
  - **Status:** RED - `ErrorPanel` not created
  - **Verifies:** AC4 retry button

- **Test:** TC-E2-P1-05 — should trigger new request on Reintentar click
  - **Status:** RED - `onRetry={refetch}` wiring missing
  - **Verifies:** AC4 retry → new API call

- **Test:** TC-E2-P1-05 — should display ErrorPanel on network error
  - **Status:** RED - error branch not implemented
  - **Verifies:** AC4 network failure handling

- **Test:** AC5 — should show full list after clearing search
  - **Status:** RED - `useState('')` for search not implemented
  - **Verifies:** AC5 clear restores list

- **Test:** AC5 — should NOT issue extra API call on clear
  - **Status:** RED - client-side state not implemented
  - **Verifies:** AC5 no extra network call on clear

**EmptyState tests (6 tests):**

- **Test:** should render with data-testid="empty-state"
  - **Status:** RED - `EmptyState.tsx` does not exist
  - **Verifies:** AC3 component renders with testid

- **Test:** should display the message prop
  - **Status:** RED - component missing
  - **Verifies:** AC3 message prop rendered

- **Test:** should display optional description prop
  - **Status:** RED - component missing
  - **Verifies:** AC3 description prop rendered

- **Test:** should NOT render description when omitted
  - **Status:** RED - component missing
  - **Verifies:** AC3 optional prop is truly optional

- **Test:** should have accessible role for screen readers
  - **Status:** RED - ARIA role not implemented (WCAG 2.1 AA)
  - **Verifies:** AC3 accessibility

- **Test:** should include guidance to create first client
  - **Status:** RED - component missing
  - **Verifies:** AC3 content requirement

**ErrorPanel tests (6 tests):**

- **Test:** should render with data-testid="error-panel"
  - **Status:** RED - `ErrorPanel.tsx` does not exist
  - **Verifies:** AC4 component renders with testid

- **Test:** should display error message in Spanish
  - **Status:** RED - component missing
  - **Verifies:** AC4 Spanish error text

- **Test:** should display "Reintentar" button
  - **Status:** RED - component missing
  - **Verifies:** AC4 retry button present

- **Test:** should call onRetry when Reintentar clicked
  - **Status:** RED - component missing
  - **Verifies:** AC4 onRetry prop called

- **Test:** should call onRetry exactly once per click
  - **Status:** RED - component missing
  - **Verifies:** AC4 no double-fire

- **Test:** should have role="alert" for screen readers
  - **Status:** RED - ARIA role not implemented (WCAG 2.1 AA)
  - **Verifies:** AC4 accessibility

---

## Data Factories Created

### Cliente Factory

**File:** `frontend/src/test-support/factories/cliente.factory.ts`

**Exports:**
- `createCliente(overrides?)` - Create single client with optional field overrides
- `createClientes(count, overrides?)` - Create array of clients
- `clienteFixtures.aceroGroup()` - 3 clients with "Acero" prefix for search tests
- `clienteFixtures.aceroGroupWithOthers()` - 5 clients (3 Acero + 2 others)
- `clienteFixtures.nitExacto()` - Client with known NIT "900123456-1"

---

## Fixtures / MSW Handlers Created

### Clientes MSW Handlers

**File:** `frontend/src/test-support/mocks/clientes.handlers.ts`

**Handlers:**
- `clientesHandlers.success(clientes)` - Returns 200 with client array
- `clientesHandlers.empty()` - Returns 200 with []
- `clientesHandlers.serverError()` - Returns 500 Problem Details
- `clientesHandlers.networkError()` - Simulates network failure

**File:** `frontend/src/test-support/mocks/server.ts`

**Exports:**
- `server` - MSW `setupServer()` instance for Vitest tests

---

## Mock Requirements

### GET /api/v1/clientes

**Endpoint:** `GET /api/v1/clientes`

**Success Response (200):**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombre": "Empresa ABC",
    "nit": "900123456-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-06-04T10:30:00Z"
  }
]
```

**Empty Success Response (200):**
```json
[]
```

**Error Response (500 — Problem Details RFC 7807):**
```json
{
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred."
}
```

**Notes:** Direct array response — no wrapper object. DateTimeOffset format required (never bare DateTime).

---

## Required data-testid Attributes

### ClienteListView (frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx)

- `clientes-list-panel` — root 280px fixed-width left panel div
- `search-clientes` — search input field
- `cliente-list-item` — each row in the client list (one per client)
- `clientes-loading-skeleton` — loading skeleton container (shown during fetch)

**Implementation Example:**
```tsx
<div data-testid="clientes-list-panel" className="w-[280px] ...">
  <input data-testid="search-clientes" type="search" placeholder="Buscar por nombre o NIT/RUC" />
  {filteredClientes.map((c) => (
    <div data-testid="cliente-list-item" key={c.id}>...</div>
  ))}
</div>
```

### EmptyState (frontend/src/shared/components/EmptyState.tsx)

- `empty-state` — root element of the EmptyState component

**Implementation Example:**
```tsx
<div data-testid="empty-state" role="status" ...>
  <p>{message}</p>
  {description && <p>{description}</p>}
</div>
```

### ErrorPanel (frontend/src/shared/components/ErrorPanel.tsx)

- `error-panel` — root element of the ErrorPanel component

**Implementation Example:**
```tsx
<div data-testid="error-panel" role="alert" ...>
  <p>No se pudo cargar la información</p>
  <button onClick={onRetry}>Reintentar</button>
</div>
```

---

## Implementation Checklist

### Test: AC1 — ClienteListView renders 280px left panel

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` (TanStack Query)
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` with 280px left panel
- [ ] Add `data-testid="clientes-list-panel"` to panel div
- [ ] Add `data-testid="search-clientes"` to search input
- [ ] Add `data-testid="cliente-list-item"` to each `ClientListItem`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC1 — Backend GET /api/v1/clientes endpoint

**Tasks to make this test pass:**
- [ ] Create `ClienteEntity.cs` with static `Create()` factory
- [ ] Create `IClienteRepository.cs` with `GetAllAsync()`
- [ ] Create `ClienteConfiguration.cs` with EF Core config
- [ ] Register `DbSet<ClienteEntity> Clientes` in `AppDbContext`
- [ ] Run EF Core migration: `dotnet ef migrations add AddClienteTable`
- [ ] Create `GetClientesQuery.cs` and `GetClientesQueryHandler.cs`
- [ ] Create `ClienteDto.cs` with all required fields
- [ ] Create `ClienteRepository.cs` implementing `IClienteRepository`
- [ ] Create `ClienteEndpoints.cs` mapping `GET /api/v1/clientes`
- [ ] Register in DI and `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-list.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: AC2 — Real-time client-side search

**Tasks to make this test pass:**
- [ ] Add `useState<string>('')` for `searchQuery` in `ClienteListView`
- [ ] Add controlled `<input>` bound to `searchQuery` with `data-testid="search-clientes"`
- [ ] Implement `useMemo` filter on `data` array (case-insensitive `nombre` + `nit` match)
- [ ] Ensure no new API call is issued during search (client-side `useMemo` only)
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — EmptyState component

**Tasks to make this test pass:**
- [ ] Check siesa-ui-kit for existing empty state component
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` (if not in kit)
  - Props: `message: string`, `description?: string`
  - Add `data-testid="empty-state"` and `role="status"` to root
  - All user text in Spanish
- [ ] Wire `EmptyState` in `ClienteListView` when `data?.length === 0`
- [ ] Add required data-testid attributes
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC4 — ErrorPanel component with Reintentar

**Tasks to make this test pass:**
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - Props: `onRetry: () => void`
  - Add `data-testid="error-panel"` and `role="alert"` to root
  - Add "Reintentar" button that calls `onRetry()` on click
  - Use Heroicons for error icon
- [ ] Wire `ErrorPanel` in `ClienteListView` when `isError === true`
  - Pass `onRetry={refetch}` from `useClientes()`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — Clearing search restores full list

**Tasks to make this test pass:**
- [ ] Ensure `searchQuery` state resets the `useMemo` filter when empty string
- [ ] Verify no API call is triggered on state change (only `useMemo` re-runs)
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all component + unit tests (RED phase — all should fail)
pnpm --filter frontend test

# Run specific component test file
pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx

# Run EmptyState and ErrorPanel component tests
pnpm --filter frontend test src/shared/components/__tests__/EmptyState.test.tsx
pnpm --filter frontend test src/shared/components/__tests__/ErrorPanel.test.tsx

# Run E2E tests for Story 2.1 (requires frontend + backend running)
npx playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run API-level tests only (requires backend running on port 5000)
npx playwright test e2e/tests/api/clientes-list.api.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**
- All tests written and failing
- Data factories created (cliente.factory.ts)
- MSW handlers created (clientes.handlers.ts + server.ts)
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**
- All tests run and fail as expected
- Failure messages indicate missing modules/components (not test bugs)
- Tests fail due to missing implementation, not test configuration errors

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with backend endpoint — AC1)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Key Principles:**
- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Extract duplications (DRY principle)
3. Optimize performance (if needed)
4. Ensure tests still pass after each refactor
5. Manually update story status to 'done' in sprint-status.yaml

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm --filter frontend test`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. Share progress in daily standup
6. When all tests pass, refactor code for quality
7. When refactoring complete, mark story status as 'done'

---

## Knowledge Base References Applied

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup
- **data-factories.md** - Factory patterns for deterministic test data generation
- **component-tdd.md** - Component test strategies using Vitest + RTL
- **network-first.md** - Route interception patterns (intercept BEFORE navigation)
- **test-quality.md** - Given-When-Then, one assertion per test, determinism, isolation
- **test-levels-framework.md** - E2E vs API vs Component selection framework
- **selector-resilience.md** - data-testid selectors for stability

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Component tests command:** `pnpm --filter frontend test`

**Expected results:**
```
FAIL src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx
  Cannot find module '../ClienteListView' (component not yet implemented)

FAIL src/shared/components/__tests__/EmptyState.test.tsx
  Cannot find module '../EmptyState' (component not yet created)

FAIL src/shared/components/__tests__/ErrorPanel.test.tsx
  Cannot find module '../ErrorPanel' (component not yet created)
```

**API/E2E tests command:** `npx playwright test e2e/tests/api/clientes-list.api.spec.ts`

**Expected results:**
```
FAIL GET /api/v1/clientes — Connection refused (endpoint not implemented)
```

**Summary:**
- Total component tests: 22
- Total API tests: 8
- Total E2E tests: 15 (already existed in e2e/tests/clientes/client-list-search.spec.ts)
- Passing: 0 (expected)
- Failing: 45 (expected — RED phase)
- Status: RED phase confirmed

---

## Notes

- The E2E tests at `e2e/tests/clientes/client-list-search.spec.ts` were pre-existing from a previous ATDD run and are comprehensive for all 5 ACs. They have been retained unchanged.
- The `tea_use_playwright_utils: false` setting in config.yaml means standard Playwright patterns (no custom utils) are used.
- The `tea_use_mcp_enhancements: false` setting means AI generation mode (not MCP recording) was used.
- Component tests use `require()` dynamically to fail with a "Cannot find module" error (cleaner RED failure than TypeScript compile error).
- The MSW server pattern uses `setupServer()` from `msw/node` per MSW 2.x API.
- All user-facing text in tests is in Spanish per company-standards.md.

---

**Generated by BMad TEA Agent** - 2026-06-04
