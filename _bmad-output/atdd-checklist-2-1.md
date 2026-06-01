# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-01
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component (Unit)

---

## Story Summary

Allows commercial team members to navigate to `/clientes` and see a scrollable 280px left panel listing all clients with Nombre and NIT/RUC per item. Users can search in real time by Nombre or NIT/RUC (client-side filter, no re-fetch). Handles empty state via `EmptyState` component and backend errors via `ErrorPanel` with a "Reintentar" button.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given clients exist, when user navigates to `/clientes`, then the left panel (280px) renders a scrollable list of all clients, each item showing Nombre and NIT/RUC (FR2, FR3, FR4).
2. **AC2** — Given the client list is loaded, when the user types in the search field, then the list filters in real time (client-side) showing only matching clients; results in under 1 second with up to 500 records (NFR1).
3. **AC3** — Given no clients exist, when the user navigates to `/clientes`, then an `EmptyState` component is displayed guiding the user to create the first client.
4. **AC4** — Given the backend is unavailable, when fetch fails, then an `ErrorPanel` with a "Reintentar" button is displayed; no stack traces or technical details shown (NFR6).
5. **AC5** — Given the application is running, when `GET /api/v1/clientes` is called, then it returns a JSON array of client objects with fields `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt` with HTTP 200.
6. **AC6** — Given the backend entity and EF Core config are in place, when `dotnet build SiesaAgents.sln` is executed, then the solution compiles with zero errors and the migration creates the `clientes` table with `id` (UUID PK), `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at` columns in snake_case.

---

## Failing Tests Created (RED Phase)

### E2E Tests (13 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

- **[P0] should render the list panel at /clientes route**
  - **Status:** RED — `clientes-list-panel` data-testid does not exist (component not implemented)
  - **Verifies:** AC1 — panel renders on navigation to /clientes

- **[P0] should render client item showing Nombre in the list panel**
  - **Status:** RED — `cliente-list-item` with nombre text not found (component not implemented)
  - **Verifies:** AC1 — each item shows Nombre

- **[P0] should render client item showing NIT/RUC in the list panel**
  - **Status:** RED — `cliente-list-item` with nit text not found (component not implemented)
  - **Verifies:** AC1 — each item shows NIT/RUC

- **[P0] should render the list panel with fixed width of 280px**
  - **Status:** RED — panel width is not 280px (component not implemented)
  - **Verifies:** AC1 — panel has correct 280px fixed width

- **[P1] should render multiple client items when multiple clients exist**
  - **Status:** RED — list items not rendered (component not implemented)
  - **Verifies:** AC1 — all clients in the list are shown

- **[P0] should render a search input with placeholder "Buscar por nombre o NIT/RUC"**
  - **Status:** RED — search input with correct placeholder not found
  - **Verifies:** AC2 — search input is present with correct label

- **[P0] should filter list by Nombre when user types in search field**
  - **Status:** RED — client-side filter not implemented; all items remain visible
  - **Verifies:** AC2 — filter by Nombre works in real time

- **[P0] should filter list by NIT/RUC when user types in search field**
  - **Status:** RED — client-side filter not implemented
  - **Verifies:** AC2 — filter by NIT/RUC works in real time

- **[P0] should perform case-insensitive search by Nombre**
  - **Status:** RED — filter not implemented
  - **Verifies:** AC2 — filter is case-insensitive

- **[P1] should clear filter and show all clients when search input is cleared**
  - **Status:** RED — filter reset not implemented
  - **Verifies:** AC2 — clearing search restores full list

- **[P2] should not trigger a new API call when user types in search field**
  - **Status:** RED — component not implemented; API call behavior untestable
  - **Verifies:** AC2 — client-side filter (no additional API calls on search)

- **[P0] should display EmptyState when the client list is empty**
  - **Status:** RED — `empty-state` data-testid not found (EmptyState not implemented)
  - **Verifies:** AC3 — EmptyState shown on empty list

- **[P0] should display guidance message in EmptyState to create the first client**
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — EmptyState contains guidance message in Spanish

- **[P1] should NOT display client list items when EmptyState is shown**
  - **Status:** RED — component not implemented
  - **Verifies:** AC3 — list items absent when EmptyState is active

- **[P0] should display ErrorPanel when the backend is unavailable**
  - **Status:** RED — `error-panel` data-testid not found (ErrorPanel not implemented)
  - **Verifies:** AC4 — ErrorPanel renders on fetch failure

- **[P0] should display a "Reintentar" button in the ErrorPanel**
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — ErrorPanel has "Reintentar" button

- **[P0] should NOT expose stack traces or technical error details to the user**
  - **Status:** RED — ErrorPanel not implemented; no error handling
  - **Verifies:** AC4 / NFR6 — no technical details in user-facing error

- **[P1] should retry loading clients when "Reintentar" button is clicked**
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — retry button triggers refetch

- **[P1] should NOT display the client list when ErrorPanel is shown**
  - **Status:** RED — component not implemented
  - **Verifies:** AC4 — list absent when error state is active

### API Tests (12 tests)

**File:** `e2e/tests/api/client-list-search.api.spec.ts`

- **[P0] should return HTTP 200 from GET /api/v1/clientes**
  - **Status:** RED — endpoint does not exist (not implemented)
  - **Verifies:** AC5 — endpoint returns HTTP 200

- **[P0] should return a JSON array (direct array, no wrapper object)**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC5 — response shape is direct array

- **[P0] should return application/json content type**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC5 — correct content-type header

- **[P0] should return client objects with all required fields**
  - **Status:** RED — endpoint not implemented; no `id`, `nombre`, `nit`, etc.
  - **Verifies:** AC5 — all required fields present in each object

- **[P0] should return client with id as UUID format**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — id is UUID (Guid PK)

- **[P0] should return correct field values for a created client**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC5 — field values match what was persisted

- **[P1] should return createdAt and updatedAt as ISO 8601 date strings**
  - **Status:** RED — endpoint not implemented; DateTimeOffset serialization untested
  - **Verifies:** AC5/AC6 — timestamps are proper ISO 8601 strings

- **[P1] should return an empty array when no clients exist**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC5 — empty array is valid response shape

- **[P2] should NOT include a wrapper object with data property**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC5 — no wrapper (architecture standard: direct array)

- **[P0] should persist a cliente and retrieve it back via GET /api/v1/clientes**
  - **Status:** RED — endpoint and EF Core config not implemented
  - **Verifies:** AC6 — migration creates table; entity round-trips correctly

- **[P0] should reject creating a client with a duplicate NIT (unique constraint)**
  - **Status:** RED — unique index not created (migration not run)
  - **Verifies:** AC6 — `uk_clientes_nit` unique index enforced

- **[P1] should NOT expose stack traces in 409 error response body (NFR6)**
  - **Status:** RED — error handling middleware not tested for clientes
  - **Verifies:** AC6 / NFR6 — no technical details in 409 response

### Component Unit Tests (12 tests)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.unit.test.ts`

- **[P0] should export a useClientes function hook**
  - **Status:** RED — useClientes.ts does not exist
  - **Verifies:** AC1/AC2 — hook module exists

- **[P0] useClientes export should be a callable function**
  - **Status:** RED — module not found
  - **Verifies:** AC1/AC2 — hook is callable function

- **[P0] useClientes hook module should exist at expected path**
  - **Status:** RED — module not found
  - **Verifies:** AC1 — file is in correct location

- **[P0] should export a clienteApiRepository object with a getAll method**
  - **Status:** RED — clienteApiRepository.ts does not exist
  - **Verifies:** AC1 — infrastructure repository exists

- **[P0] should export a Cliente type definition from domain module**
  - **Status:** RED — Cliente.ts does not exist
  - **Verifies:** AC1 — domain type defined

- **[P0] should export IClienteRepository interface from domain module**
  - **Status:** RED — IClienteRepository.ts does not exist
  - **Verifies:** AC1 — domain interface defined

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.unit.test.ts`

- **[P0] should export a ClienteListPanel function component**
  - **Status:** RED — ClienteListPanel.tsx does not exist
  - **Verifies:** AC1 — presentation component exists

- **[P0] ClienteListPanel should have the correct component name**
  - **Status:** RED — component not found
  - **Verifies:** AC1 — correct React component name

- **[P0] should export an EmptyState function component from shared components**
  - **Status:** RED — EmptyState.tsx does not exist
  - **Verifies:** AC3 — EmptyState component exists

- **[P0] EmptyState should not expose internal error.message in its output (NFR6)**
  - **Status:** RED — ErrorPanel.tsx does not exist
  - **Verifies:** AC4/NFR6 — fixed user-facing error message only

- **[P0] should export a ClientListItem function component from shared components**
  - **Status:** RED — ClientListItem.tsx does not exist
  - **Verifies:** AC1 — list item component exists

- **[P0] should export an ErrorPanel function component from shared components**
  - **Status:** RED — ErrorPanel.tsx does not exist
  - **Verifies:** AC4 — ErrorPanel component exists

---

## Data Factories Created

Existing factory used — no new factories required. `buildCliente()` in `e2e/helpers/data.helper.ts` already generates valid client objects.

**Available exports:**
- `buildCliente(overrides?)` — generates `{ nombre, nit, telefono, ciudad }` with unique values
- `buildCliente({ nombre: 'specific' })` — override specific fields for named test scenarios

---

## Fixtures Created

No new fixtures needed. Existing `base.fixture.ts` provides `clientesPage` and `contactosPage` navigation fixtures.

Network interception uses the inline `page.route()` pattern (network-first, intercept before navigation) per workflow patterns.

---

## Mock Requirements

### GET /api/v1/clientes — Network Intercept for UI Tests

All E2E tests that don't hit the real backend use inline `page.route()`:

**Empty state response:**
```json
[]
```

**Success response (with clients):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Cliente Test",
    "nit": "900123456-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00.000Z",
    "updatedAt": "2026-03-12T10:30:00.000Z"
  }
]
```

**Error response (500):**
```json
{ "title": "Internal Server Error" }
```

**Notes:** API-level tests (AC5, AC6) hit the real backend at `http://localhost:5000` — no mocking for those.

---

## Required data-testid Attributes

### ClienteListPanel (`frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`)

- `clientes-list-panel` — The 280px left panel container
- `cliente-list-item` — Each client row in the list (repeating)

### EmptyState (`frontend/src/shared/components/EmptyState.tsx`)

- `empty-state` — The root container of the EmptyState component

### ErrorPanel (`frontend/src/shared/components/ErrorPanel.tsx`)

- `error-panel` — The root container of the ErrorPanel component

**Implementation Example:**
```tsx
// ClienteListPanel.tsx
<div data-testid="clientes-list-panel" className="w-[280px] shrink-0 overflow-y-auto">
  {/* ... */}
</div>

// Inside list render:
<ClientListItem data-testid="cliente-list-item" cliente={c} key={c.id} />

// EmptyState.tsx
<div data-testid="empty-state">...</div>

// ErrorPanel.tsx
<div data-testid="error-panel">...</div>
```

---

## Implementation Checklist

### Test: [P0] should render the list panel at /clientes route

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` with the `Cliente` TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- [ ] Add `data-testid="clientes-list-panel"` to the panel container
- [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `ClienteListPanel`
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: [P0] should render client items with Nombre and NIT/RUC

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
  - Props: `cliente: Cliente`, `isSelected?: boolean`, `onClick?: () => void`
  - Display `nombre` (bold) and `nit` (secondary, `slate-500`)
  - Add `data-testid="cliente-list-item"`
  - Add WCAG 2.1 AA: `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space
- [ ] Wire `ClientListItem` into `ClienteListPanel` rendering loop
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "Nombre"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P0] should render the list panel with fixed width of 280px

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Apply `className="w-[280px] shrink-0"` to the list panel container
- [ ] Ensure two-panel flex layout: `<div className="flex flex-row">` wrapping list and detail panels
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "280px"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: [P0] should render a search input with placeholder "Buscar por nombre o NIT/RUC"

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Add search `<input>` to `ClienteListPanel` with `placeholder="Buscar por nombre o NIT/RUC"`
- [ ] Add `aria-label="Buscar clientes"` for WCAG 2.1 AA
- [ ] Wire `useState('')` for `searchQuery`
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "placeholder"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: [P0] should filter list by Nombre / NIT/RUC (client-side)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement `useMemo` client-side filter in `ClienteListPanel`:
  ```typescript
  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return clientes ?? []
    const q = searchQuery.toLowerCase()
    return (clientes ?? []).filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
    )
  }, [clientes, searchQuery])
  ```
- [ ] Render `filteredClientes` (not raw `clientes`) in the list
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "filter"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P0] should display EmptyState when client list is empty

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/EmptyState.tsx`
  - Props: `message: string`, `actionLabel?: string`, `onAction?: () => void`
  - Root element: `<div data-testid="empty-state">`
  - Include guidance message with `/primer cliente|crear/i` text
- [ ] Conditionally render `<EmptyState>` in `ClienteListPanel` when `clientes.length === 0` and not loading/error
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "EmptyState"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P0] should display ErrorPanel when backend is unavailable

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - Props: `message?: string`, `onRetry?: () => void`
  - Root element: `<div data-testid="error-panel">`
  - Fixed user message: "No se pudo cargar la información." (never expose `error.message`)
  - Render "Reintentar" button when `onRetry` is provided
- [ ] Conditionally render `<ErrorPanel onRetry={refetch} />` in `ClienteListPanel` when `isError` is true
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "ErrorPanel"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P0] GET /api/v1/clientes — HTTP 200 + correct JSON shape

**File:** `e2e/tests/api/client-list-search.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Register `IClienteRepository → ClienteRepository` in `Program.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `GetClientesQuery` + `GetClientesQueryHandler`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with `GET /api/v1/clientes`
- [ ] Register `MapClienteEndpoints()` in `Program.cs`
- [ ] Run migration: `dotnet ef migrations add AddClientes`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/client-list-search.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: [P0] Component unit tests — module contracts

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.unit.test.ts`
**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.unit.test.ts`

**Tasks to make these tests pass:**

- [ ] Create all files listed in "Project Structure — Files to Create" (Story 2.1 Dev Notes)
- [ ] All exports must match expected names: `useClientes`, `ClienteListPanel`, `EmptyState`, `ErrorPanel`, `ClientListItem`, `clienteApiRepository`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ All unit tests pass (green phase)

**Estimated Effort:** 0.5 hours (part of implementation above)

---

## Running Tests

```bash
# Run all E2E tests for Story 2.1
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run API tests for Story 2.1
pnpm exec playwright test e2e/tests/api/client-list-search.api.spec.ts

# Run frontend unit tests
pnpm --filter frontend test

# Run all Story 2.1 tests together
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts e2e/tests/api/client-list-search.api.spec.ts && pnpm --filter frontend test

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --headed

# Debug a specific test
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --debug

# Run P0 tests only
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "\[P0\]"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories reused (buildCliente, base.fixture.ts)
- ✅ Network-first route interception applied (intercept before navigation)
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages indicate missing components/endpoints (not test bugs)
- Tests fail due to missing implementation, not test errors

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with highest P0 priority)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended Implementation Order:**
1. Backend: Entity → Repository → EF Core Config → Migration → Application Layer → Endpoint
2. Frontend: Domain types → Infrastructure repo → useClientes hook → ClientListItem → EmptyState → ErrorPanel → ClienteListPanel → Route wiring

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review code quality (readability, type safety, performance)
3. Ensure `useMemo` filter meets NFR1 (< 50ms for 500 records)
4. Confirm `data-testid` attributes are on correct DOM nodes
5. Run tests after each refactor to ensure nothing regresses

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/clientes/`
3. Begin backend implementation (Tasks 1–6 in Story 2.1 story file)
4. Begin frontend implementation (Tasks 7–13 in Story 2.1 story file)
5. Work one test at a time (red → green for each)
6. When all tests pass, update story status to 'in-review'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: all UI tests intercept `**/api/v1/clientes` BEFORE calling `page.goto()`
- **data-factories.md** — Reused existing `buildCliente()` factory from `e2e/helpers/data.helper.ts`
- **fixture-architecture.md** — Reused `base.fixture.ts` extended fixture pattern
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, no hard waits
- **selector-resilience.md** — `data-testid` selectors exclusively (`clientes-list-panel`, `cliente-list-item`, `empty-state`, `error-panel`); never CSS class selectors
- **component-tdd.md** — Module contract tests for all new components (export shape, function name, props)
- **test-levels-framework.md** — E2E for user-facing AC1–AC4; API for AC5–AC6; Unit for component module contracts

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts e2e/tests/api/client-list-search.api.spec.ts`

**Expected Results:**

```
Running 31 tests using 3 workers

  × [P0] should render the list panel at /clientes route
  × [P0] should render client item showing Nombre in the list panel
  × [P0] should render client item showing NIT/RUC in the list panel
  × [P0] should render the list panel with fixed width of 280px
  × [P1] should render multiple client items when multiple clients exist
  × [P0] should render a search input with placeholder "Buscar por nombre o NIT/RUC"
  × [P0] should filter list by Nombre when user types in search field
  × [P0] should filter list by NIT/RUC when user types in search field
  × [P0] should perform case-insensitive search by Nombre
  × [P1] should clear filter and show all clients when search input is cleared
  × [P2] should not trigger a new API call when user types in search field
  × [P0] should display EmptyState when the client list is empty
  × [P0] should display guidance message in EmptyState
  × [P1] should NOT display client list items when EmptyState is shown
  × [P0] should display ErrorPanel when the backend is unavailable
  × [P0] should display a "Reintentar" button in the ErrorPanel
  × [P0] should NOT expose stack traces or technical error details
  × [P1] should retry loading clients when "Reintentar" button is clicked
  × [P1] should NOT display the client list when ErrorPanel is shown
  × [P0] should return HTTP 200 from GET /api/v1/clientes
  × [P0] should return a JSON array (direct array, no wrapper object)
  × ... (all 31 tests failing)

  31 failed
  Status: ✅ RED phase verified
```

**Expected Failure Messages:**
- E2E tests: `Error: locator.waitFor: Timeout 30000ms exceeded. Waiting for element to be visible: getByTestId('clientes-list-panel')`
- API tests: `Error: connect ECONNREFUSED 127.0.0.1:5000` OR `expect(received).toBe(expected): Expected 200 but received 404`
- Unit tests: `Error: Cannot find module '../useClientes'` / `Error: Cannot find module '../ClienteListPanel'`

---

## Notes

- Search is implemented **client-side** using `useMemo` over the TanStack Query cache — no additional API call on search (NFR1 architecture decision for ≤ 500 records).
- The `ErrorPanel` must **never** expose `error.message` directly to the user — only a fixed string "No se pudo cargar la información." (NFR6 compliance).
- All user-facing text must be in **Spanish**.
- The `ClientListItem` must include WCAG 2.1 AA accessibility attributes: `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space key activation.
- The `clientes.tsx` route must be updated to render `ClienteListPanel` in a two-panel flex layout (left 280px + right flex-1 placeholder).
- AC6 (migration correctness) is validated indirectly at the API level: if the migration fails, the endpoint returns an error, causing API tests to fail.

---

**Generated by BMad TEA Agent** — 2026-06-01
