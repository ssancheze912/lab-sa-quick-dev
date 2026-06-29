# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-29
**Author:** SiesaTeam
**Story:** 2.1 — Client List & Search
**Primary Test Level:** Component (Vitest + RTL + MSW)

---

## Story Summary

A commercial team member needs to navigate to `/clientes` and see a scrollable list of all clients with their Nombre and NIT/RUC, search in real time by either field (case-insensitive, < 1s for 500 records), and receive appropriate feedback when the list is empty or the backend is unavailable.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. Given clients exist, when navigating to `/clientes`, then the left panel renders a scrollable list showing Nombre and NIT/RUC per item.
2. Given the list is loaded, when typing in the search field, then the list filters in real time matching Nombre or NIT/RUC as substring (case-insensitive), results appear in under 1 second with up to 500 records.
3. Given no clients in the system, when navigating to `/clientes`, then `EmptyState` is displayed with a Spanish creation-prompt message.
4. Given the backend is unavailable, when the fetch fails, then `ErrorPanel` with a "Reintentar" button is shown; clicking it triggers a new fetch.
5. Given the page first loads with no sort preference, then `SortControl` defaults to "Más reciente" and list is ordered by `createdAt` descending.

---

## Failing Tests Created (RED Phase)

### Unit Tests (4 tests)

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`

- **TC-E2-P0-05A** — `should reject an empty object with errors on all required fields`
  - **Status:** RED — Cannot find module `../clienteSchema` (file not created yet)
  - **Verifies:** AC #2 validation, FR8 — Zod schema enforces nombre, nit, telefono, ciudad as required

- **TC-E2-P2-07** — `should reject partial payload when only nombre is provided`
  - **Status:** RED — Cannot find module `../clienteSchema`
  - **Verifies:** Schema rejects partial payloads; nit, telefono, ciudad are required

- `should accept a fully valid cliente payload`
  - **Status:** RED — Cannot find module `../clienteSchema`
  - **Verifies:** Positive path — valid payload parses successfully

- `should reject payload where all fields are empty strings`
  - **Status:** RED — Cannot find module `../clienteSchema`
  - **Verifies:** Schema requires non-empty strings (not just field presence)

---

### Component Tests (14 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**TC-E2-P0-01 group (3 tests):**

- `should show loading skeleton before data arrives`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** Loading skeleton (`data-testid="clientes-list-skeleton"`) shown during fetch

- `should render all 3 clients after data arrives`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** All 3 MSW-returned clients appear as `data-testid="cliente-item-{id}"` elements

- `should display Nombre and NIT/RUC for each client item`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** Each list item renders both Nombre and NIT visible in DOM

**TC-E2-P0-02 group (3 tests):**

- `should render EmptyState component when API returns empty array`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** `data-testid="clientes-empty-state"` present when MSW returns `[]`

- `should show zero client list items when empty`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** Zero `data-testid="cliente-item-*"` elements in DOM

- `should display Spanish creation-prompt message in EmptyState`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** EmptyState text contains "cliente" (Spanish guidance text)

**TC-E2-P0-03 group (3 tests):**

- `should render ErrorPanel when GET /api/v1/clientes returns 500`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** `data-testid="clientes-error-panel"` visible on 500 response

- `should display Reintentar button in ErrorPanel`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** `data-testid="clientes-retry-button"` with text matching `/reintentar/i`

- `should trigger a new fetch when Reintentar button is clicked`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** Clicking retry clears error panel; new fetch triggered

**TC-E2-P1-01 group (3 tests):**

- `should show only matching clients when searching by partial Nombre`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** "Ace" filter → "Acme Corp" and "Aceros del Valle" visible; "Beta SA" hidden

- `should restore full list when search is cleared`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** Clearing search input restores full list

- `should perform case-insensitive search on Nombre`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** "acme" (lowercase) matches "Acme Corp"

**TC-E2-P1-02 group (2 tests):**

- `should show only matching clients when searching by partial NIT`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** "222" filter matches only Empresa B (NIT 900222000-2)

- `should match NIT substring (not only prefix)`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** "3456" matches NIT "900123456-7" (substring, not prefix)

**TC-E2-P1-03 (1 test):**

- `should filter 500 clients in under 150ms`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** `performance.now()` delta < 150ms with 500 records loaded from MSW

**TC-E2-P2-04 (1 test):**

- `should display loading indicator before data arrives (200ms delay)`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** Loading skeleton visible during 200ms delayed response; disappears after

**AC#5 group (2 tests):**

- `should show SortControl defaulting to fecha-desc on initial render`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** `data-testid="sort-control"` has value `"fecha-desc"` on initial render

- `should display newest client first by default (createdAt descending)`
  - **Status:** RED — Cannot find module `../ClienteListView`
  - **Verifies:** DOM order puts newest `createdAt` client first

---

### API Integration Tests (2 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClientesEndpointsTests.cs`

- **TC-E2-P1-17** — `TC_E2_P1_17_GetClientes_Returns200_WithDirectArrayAndAllDtoFields`
  - **Status:** RED — 404 Not Found (GET `/api/v1/clientes` not registered in Program.cs)
  - **Verifies:** HTTP 200, direct JSON array (not wrapped), each item has `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 DateTimeOffset with TZ)

- `GetClientes_Returns200_WithEmptyArray_WhenNoneExist`
  - **Status:** RED — 404 Not Found (endpoint not registered)
  - **Verifies:** HTTP 200 with empty `[]` array when no clients are seeded

---

## Data Infrastructure Created

### Cliente Factory

**File:** `frontend/src/test/factories/cliente.factory.ts`

**Exports:**
- `createCliente(overrides?)` — creates a single ClienteTestData with sequential IDs
- `createClientes(count, overrides?)` — creates an array of count clients
- `resetClienteCounter()` — resets internal counter for deterministic tests in beforeEach

**Example:**
```typescript
const client = createCliente({ nombre: 'Acme Corp' });
const bulk = createClientes(500);
```

---

### MSW Handlers

**File:** `frontend/src/test/msw/handlers/clientes.handlers.ts`

**Exports:**
- `handleGetClientesSuccess(clients)` — returns specified client array
- `handleGetClientesEmpty()` — returns `[]`
- `handleGetClientesError()` — returns HTTP 500
- `handleGetClientes500()` — returns 500 generated clients (for performance test)
- `handleGetClientesDelayed(clients, delayMs)` — returns clients after delay (loading state test)

---

## Required `data-testid` Attributes

### ClienteListView Component

- `clientes-list-skeleton` — loading skeleton container (visible during fetch)
- `clientes-empty-state` — EmptyState component (visible when list is empty)
- `clientes-error-panel` — ErrorPanel component (visible on fetch failure)
- `clientes-retry-button` — "Reintentar" button inside ErrorPanel
- `clientes-search-input` — search text input field
- `sort-control` — SortControl select element (must have `value` attribute reflecting current sort)
- `cliente-item-{id}` — each individual client list item (dynamic, uses client UUID)

### ClientListItem Component

- `cliente-item-{id}` — root element with client UUID in `data-testid`

### EmptyState Component

- `clientes-empty-state` — root element of EmptyState when rendered for clientes

### ErrorPanel Component

- `clientes-error-panel` — root element of ErrorPanel
- `clientes-retry-button` — "Reintentar" button

### SortControl Component

- `sort-control` — the `<select>` element

---

## Mock Requirements

### GET /api/v1/clientes

**Endpoint:** `GET /api/v1/clientes`

**Success Response (200):**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Empresa Test 0001",
    "nit": "9000001-1",
    "telefono": "3000000001",
    "ciudad": "Bogotá",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

**Error Response (500):**
```json
{ "status": 500, "title": "Internal Server Error" }
```

**Variants required:**
1. 3-client array (TC-E2-P0-01)
2. Empty array `[]` (TC-E2-P0-02)
3. HTTP 500 (TC-E2-P0-03)
4. 500-client array (TC-E2-P1-03)
5. Delayed 200ms response (TC-E2-P2-04)

---

## Implementation Checklist

### Test group TC-E2-P0-01 (Client list renders)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/shared/lib/apiClient.ts` (verify exists)
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` with `data-testid="cliente-item-{id}"`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- [ ] Add `data-testid="clientes-list-skeleton"` to loading skeleton
- [ ] Add `data-testid="cliente-item-{id}"` to each ClientListItem rendering
- [ ] Run: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] All TC-E2-P0-01 tests pass (green)

**Estimated Effort:** 3 hours

---

### Test group TC-E2-P0-02 (Empty state)

**Tasks to make these tests pass:**

- [ ] Create or verify `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string` prop
- [ ] Add `data-testid="clientes-empty-state"` to EmptyState root element
- [ ] Wire empty state in `ClienteListView.tsx` — show EmptyState when `data?.length === 0`
- [ ] Spanish message text (e.g., "No hay clientes. Crea el primero.")
- [ ] Run: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] All TC-E2-P0-02 tests pass (green)

**Estimated Effort:** 1 hour

---

### Test group TC-E2-P0-03 (ErrorPanel + retry)

**Tasks to make these tests pass:**

- [ ] Create or verify `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void` prop
- [ ] Add `data-testid="clientes-error-panel"` to ErrorPanel root element
- [ ] Add `data-testid="clientes-retry-button"` to "Reintentar" button
- [ ] Wire error panel in `ClienteListView.tsx` — show ErrorPanel when `isError === true` with `onRetry={refetch}`
- [ ] Run: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] All TC-E2-P0-03 tests pass (green)

**Estimated Effort:** 1 hour

---

### Test group TC-E2-P1-01 + TC-E2-P1-02 (Search)

**Tasks to make these tests pass:**

- [ ] Add search input to `ClienteListView.tsx` — controlled `useState` for search query
- [ ] Add `data-testid="clientes-search-input"` to search input element
- [ ] Implement `useMemo` filter: `data?.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
- [ ] Ensure filter is case-insensitive (`.toLowerCase()` on both sides)
- [ ] Ensure substring match (`.includes()` not `.startsWith()`)
- [ ] Run: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] All TC-E2-P1-01 and TC-E2-P1-02 tests pass (green)

**Estimated Effort:** 1 hour

---

### Test TC-E2-P1-03 (Performance)

**Tasks to make this test pass:**

- [ ] Ensure `useMemo` is used for filtering (not direct state mutation)
- [ ] Dependency array: `[data, searchQuery]`
- [ ] Verify < 150ms filtering with 500 records
- [ ] Run: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] TC-E2-P1-03 passes (green)

**Estimated Effort:** 0.5 hours

---

### Test TC-E2-P2-04 (Loading state)

**Tasks to make this test pass:**

- [ ] Render `Skeleton` from `react-loading-skeleton` inside a div with `data-testid="clientes-list-skeleton"` when `isLoading === true`
- [ ] Remove skeleton when `isLoading === false`
- [ ] Run: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] TC-E2-P2-04 passes (green)

**Estimated Effort:** 0.5 hours

---

### Test group AC#5 (Default sort)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/SortControl.tsx` — `<select data-testid="sort-control">` with 4 options
- [ ] Options: `fecha-desc` ("Más reciente"), `fecha-asc` ("Más antiguo"), `nombre-asc` ("Nombre A→Z"), `nombre-desc` ("Nombre Z→A")
- [ ] Default value: `fecha-desc`
- [ ] Wire sort state `useState<string>("fecha-desc")` in `ClienteListView.tsx`
- [ ] Implement sort `useMemo` over filtered results — sort by `createdAt` descending for `fecha-desc`
- [ ] Add `data-testid="sort-control"` with the select's `value` reflecting current sort
- [ ] Run: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] AC#5 tests pass (green)

**Estimated Effort:** 1.5 hours

---

### Test group clienteSchema unit tests

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- [ ] Define Zod schema with required non-empty strings: `nombre`, `nit`, `telefono`, `ciudad`
- [ ] Export `clienteSchema` and `ClienteFormData` type
- [ ] Run: `cd frontend && npx vitest run src/modules/crm/clientes/application/clienteSchema.test.ts`
- [ ] All clienteSchema tests pass (green)

**Estimated Effort:** 0.5 hours

---

### Test group TC-E2-P1-17 (API integration)

**Tasks to make these tests pass:**

- [ ] Create `SiesaAgents.Domain/Entities/ClienteEntity.cs` — Id (Guid), Nombre, Nit, Telefono, Ciudad, CreatedAt (DateTimeOffset), UpdatedAt (DateTimeOffset)
- [ ] Create `SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — EF Core config with table `clientes`, unique index `uk_clientes_nit`, snake_case via `ApplySnakeCaseNaming()`
- [ ] Create `SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — Id, Nombre, Nit, Telefono, Ciudad, CreatedAt (DateTimeOffset)
- [ ] Create `SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` and `GetClientesQueryHandler.cs`
- [ ] Create `SiesaAgents.API/Endpoints/ClientesEndpoints.cs` — register `GET /api/v1/clientes` → 200 with `IEnumerable<ClienteDto>`
- [ ] Register endpoint in `Program.cs`
- [ ] Uncomment seeding code in `ClientesEndpointsTests.cs` after `ClienteEntity` is created
- [ ] Run: `cd backend && dotnet test tests/SiesaAgents.IntegrationTests/`
- [ ] TC-E2-P1-17 passes (green)

**Estimated Effort:** 4 hours

---

## Running Tests

```bash
# Run all component + unit tests (Story 2.1)
cd frontend && npx vitest run src/modules/crm/clientes/

# Run only ClienteListView component tests
cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx

# Run only Zod schema unit tests
cd frontend && npx vitest run src/modules/crm/clientes/application/clienteSchema.test.ts

# Run all frontend tests with coverage
cd frontend && npm run test:coverage

# Run backend API integration tests
cd backend && dotnet test tests/SiesaAgents.IntegrationTests/ --verbosity normal

# Run all frontend tests in watch mode
cd frontend && npx vitest src/modules/crm/clientes/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All tests written and failing (expected failures documented above)
- MSW handlers created with all required variants
- Cliente factory created with `createCliente` / `createClientes` / `resetClienteCounter`
- Mock requirements documented
- `data-testid` requirements listed
- Implementation checklist created

**Verification — expected failure messages:**

Component tests: `Error: Cannot find module '../ClienteListView' from 'ClienteListView.test.tsx'`
Unit tests: `Error: Cannot find module '../clienteSchema' from 'clienteSchema.test.ts'`
API tests: `Assert.Equal() Failure: Expected: OK (200), Actual: NotFound (404)`

---

### GREEN Phase (DEV Team)

1. Pick one failing test group from implementation checklist (start with clienteSchema — simplest)
2. Implement minimal code to make that specific test pass
3. Run the test to verify green
4. Check off the task in implementation checklist
5. Move to next test group
6. Follow order: clienteSchema → ClienteListView (P0-01) → P0-02 → P0-03 → P1-01/02 → P1-03 → P2-04 → AC#5 → API (P1-17)

---

### REFACTOR Phase (DEV Team — after all tests pass)

1. Extract search/sort logic to custom hooks if component grows large
2. Ensure `useMemo` deps arrays are tight (no missing deps)
3. Verify `data-testid` attributes are consistent with test expectations
4. Ensure all tests still pass after refactor

---

## Next Steps

1. Share this checklist with the dev workflow (dev-story for story 2.1)
2. Run: `cd frontend && npx vitest run src/modules/crm/clientes/` — confirm RED phase
3. Implement one test group at a time per checklist
4. After all green: run `testarch-automate` for coverage expansion
5. Update story 2.1 status to `in-progress` then `done` via sprint-status

---

## Knowledge Base References Applied

- `network-first.md` — MSW handlers registered before test render (setupServer pattern)
- `data-factories.md` — `createCliente` / `createClientes` factory with overrides and counter reset
- `component-tdd.md` — QueryClientProvider wrapper, `waitFor` for async assertions
- `test-quality.md` — Given-When-Then format, one assertion per atomic test
- `selector-resilience.md` — `data-testid` selectors throughout; no CSS or text-only selectors for structural elements
- `timing-debugging.md` — `waitFor` for async state; no `setTimeout` / `sleep` patterns

---

**Generated by:** BMad TEA Agent — testarch-atdd workflow
**Workflow:** `_bmad/bmm/workflows/testarch/atdd`
**Version:** 4.0 (BMad v6)
**Story:** 2.1 — Client List & Search
**Epic:** 2 — Client Management
**Date:** 2026-06-29
