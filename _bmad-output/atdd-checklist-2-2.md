# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-04
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** Component (Vitest + RTL + MSW) + Unit (xUnit) + Integration (xUnit + WebApplicationFactory)

---

## Story Summary

As a commercial team member, I want to view the complete details of a client by selecting them from the list, so that I can review all their information without navigating away from the clients section. The feature includes a split-panel right panel showing Nombre, NIT/RUC, Teléfono, and Ciudad, with FR30 deep linking support and graceful handling of non-existent client IDs.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **Given** the client list is displayed **When** the user clicks on a client item **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view **When** the user accesses the URL `/clientes/:clienteId` directly **Then** the correct client details are loaded and displayed (FR30).

3. **Given** a clienteId in the URL does not exist **When** the page loads **Then** a not-found message is displayed gracefully in the right panel. No JS exception is thrown. The left panel list still renders normally.

---

## Failing Tests Created (RED Phase)

### E2E Tests — 19 tests (PRE-EXISTING from client-detail-view.spec.ts)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts` (446 lines)

**Status:** Pre-existing RED tests — retained and validated as-is.

- **TC-E2-P1-06** — AC1: should show the right panel with client detail after clicking a list item
  - **Status:** RED — `ClienteDetailView` not implemented; `data-testid="cliente-detail-panel"` does not exist
  - **Verifies:** AC1 right panel renders on click

- **TC-E2-P1-06** — AC1: should display Nombre in the right panel after clicking a client item
  - **Status:** RED — `ClienteDetailView` not implemented
  - **Verifies:** AC1 nombre field visible

- **TC-E2-P1-06** — AC1: should display NIT/RUC in the right panel after clicking a client item
  - **Status:** RED — `data-testid="cliente-nit"` missing
  - **Verifies:** AC1 nit field visible

- **TC-E2-P1-06** — AC1: should display Teléfono in the right panel after clicking a client item
  - **Status:** RED — `data-testid="cliente-telefono"` missing
  - **Verifies:** AC1 telefono field visible

- **TC-E2-P1-06** — AC1: should display Ciudad in the right panel after clicking a client item
  - **Status:** RED — `data-testid="cliente-ciudad"` missing
  - **Verifies:** AC1 ciudad field visible

- **TC-E2-P1-06** — AC1: should update the URL to /clientes/:clienteId after clicking a client item
  - **Status:** RED — `useNavigate()` wiring in `ClienteListView` not implemented
  - **Verifies:** AC1 FR30 deep linking URL update

- **TC-E2-P1-07** — AC2: should load and display correct client details when navigating directly to /clientes/:id
  - **Status:** RED — `clientes.$clienteId.tsx` route not created
  - **Verifies:** AC2 deep link renders detail

- **TC-E2-P1-07** — AC2: should show Nombre on deep link to /clientes/:id
  - **Status:** RED — route and component not implemented
  - **Verifies:** AC2 nombre on direct URL access

- **TC-E2-P1-07** — AC2: should show NIT/RUC on deep link to /clientes/:id
  - **Status:** RED — route and component not implemented
  - **Verifies:** AC2 nit on direct URL access

- **TC-E2-P1-07** — AC2: should preserve the left panel list on deep link navigation
  - **Status:** RED — route not implemented
  - **Verifies:** AC2 left panel remains intact

- **TC-E2-P1-08** — AC3: should display the not-found message when the clienteId does not exist
  - **Status:** RED — `ClienteDetailView` not-found state not implemented
  - **Verifies:** AC3 graceful not-found

- **TC-E2-P1-08** — AC3: should NOT display the detail panel when the clienteId does not exist
  - **Status:** RED — not-found branch missing
  - **Verifies:** AC3 detail panel absent on 404

- **TC-E2-P1-08** — AC3: should still render the left panel client list when the clienteId does not exist
  - **Status:** RED — layout not implemented
  - **Verifies:** AC3 left panel remains on not-found

- **TC-E2-P1-08** — AC3: should NOT throw a JS exception when the clienteId does not exist
  - **Status:** RED — no error boundary or not-found handling
  - **Verifies:** AC3 no unhandled JS error

---

### Backend Unit Tests — 12 tests (NEW)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

- **Handle_WithExistingId_ReturnsClienteDto** — Returns non-null ClienteDto for existing id
  - **Status:** RED — `GetClienteByIdQueryHandler` class does not exist
  - **Verifies:** AC1/AC2 handler maps entity to DTO

- **Handle_WithExistingId_ReturnsDtoWithCorrectId** — DTO id matches entity id
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 id field correct

- **Handle_WithExistingId_ReturnsDtoWithCorrectNombre** — DTO nombre matches entity
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 nombre mapped

- **Handle_WithExistingId_ReturnsDtoWithCorrectNit** — DTO nit matches entity
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 nit mapped

- **Handle_WithExistingId_ReturnsDtoWithCorrectTelefono** — DTO telefono matches entity
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 telefono mapped

- **Handle_WithExistingId_ReturnsDtoWithCorrectCiudad** — DTO ciudad matches entity
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 ciudad mapped

- **Handle_WithExistingId_ReturnsDtoWithCorrectCreatedAt** — DTO createdAt is DateTimeOffset
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 DateTimeOffset format (never DateTime)

- **Handle_WithExistingId_CallsRepositoryGetByIdOnce** — Delegates to repository
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 correct delegation pattern

- **Handle_WithNonExistentId_ReturnsNull** — Returns null for empty repository
  - **Status:** RED — handler not implemented
  - **Verifies:** AC3 null returned (not exception)

- **Handle_WithIdNotInRepository_ReturnsNull** — Returns null when id not found
  - **Status:** RED — handler not implemented
  - **Verifies:** AC3 null on miss

- **Handle_WithNonExistentId_DoesNotReturnClientDto** — Confirms null is null, not empty DTO
  - **Status:** RED — handler not implemented
  - **Verifies:** AC3 correct null return type

- **Handle_WithMultipleClients_ReturnsOnlyRequestedClient** — Returns only the queried client
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 correct entity selected from multiple

---

### Backend Integration Tests — 10 tests (NEW, appended to existing file)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

- **TC-E2-P2-02: GetClienteById_WithSeededClient_Returns200** — GET /api/v1/clientes/{id} returns 200
  - **Status:** RED — `GET /{id:guid}` endpoint not implemented in `ClienteEndpoints.cs`
  - **Verifies:** AC1/AC2 endpoint returns 200 for existing client

- **GetClienteById_WithSeededClient_ReturnsJsonObjectNotArray** — Response is a JSON object (direct, no wrapper)
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1/AC2 response contract is direct object (not array)

- **GetClienteById_WithSeededClient_ResponseContainsAllRequiredFields** — id, nombre, nit, telefono, ciudad, createdAt present
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 complete DTO shape

- **GetClienteById_WithSeededClient_ResponseContainsCorrectNombre** — nombre matches seeded entity
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 correct data in response

- **GetClienteById_WithSeededClient_ResponseContainsCorrectNit** — nit matches seeded entity
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 correct nit in response

- **GetClienteById_WithSeededClient_ResponseContainsValidIso8601CreatedAt** — createdAt is DateTimeOffset ISO 8601
  - **Status:** RED — endpoint not implemented; DateTimeOffset serialization not verified
  - **Verifies:** AC1 DateTimeOffset format (never bare DateTime)

- **TC-E2-P2-03: GetClienteById_WithNonExistentId_Returns404** — GET /api/v1/clientes/{nonExistentId} returns 404
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC3 404 status code

- **GetClienteById_WithNonExistentId_ResponseIsProblemDetailsFormat** — Response is RFC 7807 Problem Details
  - **Status:** RED — endpoint not implemented; Problem Details format not configured
  - **Verifies:** AC3 Problem Details format with status + title

- **GetClienteById_WithNonExistentId_ResponseHasNoStackTrace** — No stack trace in 404 response (NFR6)
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC3 NFR6 no technical information exposed

- **GetClienteById_WithNonExistentId_DetailMessageIsInSpanish** — "detail" field in Spanish
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC3 Spanish user-facing error message

---

### Frontend Unit Tests — 10 tests (NEW)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useCliente.test.ts`

**useCliente_WithValidId_ReturnsMappedCliente:**
- **useCliente returns isSuccess and full client object** — Repository resolves, hook data equals fixture
  - **Status:** RED — `useCliente.ts` not implemented
  - **Verifies:** AC1/AC2 hook returns data on success

- **useCliente returns nombre from client data** — data.nombre is correct
  - **Status:** RED — hook not implemented
  - **Verifies:** AC1 nombre field

- **useCliente returns nit from client data** — data.nit is correct
  - **Status:** RED — hook not implemented
  - **Verifies:** AC1 nit field

- **useCliente returns telefono from client data** — data.telefono is correct
  - **Status:** RED — hook not implemented
  - **Verifies:** AC1 telefono field

- **useCliente returns ciudad from client data** — data.ciudad is correct
  - **Status:** RED — hook not implemented
  - **Verifies:** AC1 ciudad field

**useCliente_WithNonExistentId_ReturnsError:**
- **useCliente sets isError=true when 404 thrown** — Mock throws 404-like error, isError is true
  - **Status:** RED — hook not implemented
  - **Verifies:** AC3 error state on 404

- **useCliente does not return data on 404** — data is undefined when isError
  - **Status:** RED — hook not implemented
  - **Verifies:** AC3 no stale data on error

**useCliente_WhenIdIsUndefined_DoesNotFetch:**
- **useCliente does NOT call getById when id is undefined** — getById mock never called
  - **Status:** RED — hook not implemented
  - **Verifies:** AC3 enabled: !!id guard

- **useCliente returns isLoading=false and no data when id is undefined** — disabled state
  - **Status:** RED — hook not implemented
  - **Verifies:** AC3 disabled query behavior

- **useCliente does NOT call getById when id is empty string** — empty string is falsy
  - **Status:** RED — hook not implemented
  - **Verifies:** AC3 edge case guard

---

### Frontend Component Tests — 18 tests (NEW)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**TC-E2-P2-02 — ClienteDetailView renders complete client data:**
- should render data-testid="cliente-detail-panel" when client data loads
  - **Status:** RED — `ClienteDetailView.tsx` not implemented
  - **Verifies:** AC1/AC2 detail panel renders

- should render the Nombre field with correct value
  - **Status:** RED — component missing
  - **Verifies:** AC1 nombre displayed

- should render the NIT/RUC field with correct value
  - **Status:** RED — component missing
  - **Verifies:** AC1 nit displayed

- should render the Teléfono field with correct value
  - **Status:** RED — component missing
  - **Verifies:** AC1 telefono displayed

- should render the Ciudad field with correct value
  - **Status:** RED — component missing
  - **Verifies:** AC1 ciudad displayed

**AC2 — Direct render simulates deep link:**
- should load and display all 4 fields when rendered directly with a known clienteId
  - **Status:** RED — `ClienteDetailView.tsx` not implemented
  - **Verifies:** AC2 deep link behavior

**TC-E2-P2-03 / AC3 — 404 renders not-found message:**
- should render data-testid="cliente-not-found" when API returns 404
  - **Status:** RED — not-found state not implemented
  - **Verifies:** AC3 not-found renders

- should NOT render data-testid="cliente-detail-panel" when 404 is returned
  - **Status:** RED — error branch missing
  - **Verifies:** AC3 detail panel absent on 404

- should display "Cliente no encontrado" message in Spanish on 404
  - **Status:** RED — Spanish text not implemented
  - **Verifies:** AC3 Spanish error text

- should have role="status" on the not-found container (WCAG 2.1 AA)
  - **Status:** RED — accessibility not implemented
  - **Verifies:** AC3 accessibility requirement

**AC3 — Loading skeleton visible during fetch:**
- should render data-testid="cliente-detail-loading" while the fetch is pending
  - **Status:** RED — loading state not implemented
  - **Verifies:** AC3 skeleton visible during load

- should NOT render loading skeleton after data has loaded
  - **Status:** RED — loading state branching missing
  - **Verifies:** AC3 skeleton disappears after load

**TC-E2-P1-06 — ClientesView with selectedClienteId renders right panel:**
- should render ClienteDetailView in the right panel when selectedClienteId is provided
  - **Status:** RED — `ClientesView` does not accept `selectedClienteId` prop
  - **Verifies:** AC1 right panel integration

- should display the correct Nombre in the right panel when selectedClienteId is set
  - **Status:** RED — prop not wired
  - **Verifies:** AC1 correct nombre in right panel

- should display the correct NIT/RUC in the right panel when selectedClienteId is set
  - **Status:** RED — prop not wired
  - **Verifies:** AC1 correct nit in right panel

- should render the left panel list even when a detail is shown
  - **Status:** RED — layout not implemented
  - **Verifies:** AC1 split-panel co-renders both panels

- should NOT render the detail panel when no selectedClienteId is provided
  - **Status:** RED — conditional rendering not implemented
  - **Verifies:** AC1 empty state when no selection

**AC3 — Click handler navigates to detail route:**
- should call navigate when a client list item is clicked
  - **Status:** RED — `useNavigate()` wiring in `ClienteListView` not implemented
  - **Verifies:** AC1 click triggers navigation + detail render

---

## Data Factories Used

### Cliente Factory (pre-existing, Story 2.1)

**File:** `frontend/src/test-support/factories/cliente.factory.ts`

Used functions in Story 2.2 tests:
- `createCliente(overrides?)` — Creates a single client with overrides for specific field values
- `clienteFixtures.nitExacto()` — Client with known NIT "900123456-1"

---

## MSW Handlers Used / Extended

### Clientes MSW Handlers (pre-existing, Story 2.1)

**File:** `frontend/src/test-support/mocks/clientes.handlers.ts`

Used in Story 2.2 tests:
- `clientesHandlers.success(clientes)` — Returns 200 with array (for ClientesView list panel)
- `clientesHandlers.empty()` — Returns 200 with [] (for no-selection state test)

### New Inline MSW Handlers (defined inline in test file)

Story 2.2 tests define inline MSW handlers for the new endpoint `/api/v1/clientes/:id`:

```typescript
// Success: Returns the full client object
http.get(`*/api/v1/clientes/${cliente.id}`, () =>
  HttpResponse.json(cliente)
)

// 404: Returns Problem Details RFC 7807
http.get(`*/api/v1/clientes/${NON_EXISTENT_ID}`, () =>
  HttpResponse.json(
    { status: 404, title: 'Not Found', detail: 'El cliente no fue encontrado' },
    { status: 404 }
  )
)

// Delayed: For loading state test
http.get(`*/api/v1/clientes/${clienteId}`, async () => {
  await new Promise((r) => setTimeout(r, 100));
  return HttpResponse.json(cliente);
})
```

---

## Required data-testid Attributes

### ClienteDetailView (to be created)

| Attribute | Element | State | Purpose |
|-----------|---------|-------|---------|
| `cliente-detail-panel` | Root div | data loaded | Test: detail panel visible |
| `cliente-nombre` | Nombre span | data loaded | Test: correct nombre displayed |
| `cliente-nit` | NIT/RUC span | data loaded | Test: correct nit displayed |
| `cliente-telefono` | Teléfono span | data loaded | Test: correct telefono displayed |
| `cliente-ciudad` | Ciudad span | data loaded | Test: correct ciudad displayed |
| `cliente-not-found` | Not-found container | error/404 | Test: graceful not-found (AC3) |
| `cliente-detail-loading` | Skeleton container | loading | Test: skeleton during fetch |

### ClientesView (to be modified)

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `clientes-view` | Root div | Test: component renders |

---

## Mock Requirements

### GET /api/v1/clientes/{id}

**Endpoint:** `GET /api/v1/clientes/{id:guid}`

**Success Response (200 — direct object, no wrapper):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Empresa ABC",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-04T10:30:00Z"
}
```

**Not Found Response (404 — RFC 7807 Problem Details, no stack trace):**
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "El cliente no fue encontrado"
}
```

**Notes:**
- Direct object response — no wrapper
- DateTimeOffset format required in createdAt (never bare DateTime)
- No stack traces in any error response (NFR6)

---

## Implementation Checklist

### Test: AC1/AC2 — Backend GET /api/v1/clientes/{id} endpoint

**Tasks to make these tests pass:**
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
  - Record with `Guid Id` property
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  - Inject `IClienteRepository`, call `GetByIdAsync(query.Id, ct)`, return `ClienteDto?`
- [ ] In `ClienteEndpoints.cs`, add: `group.MapGet("/{id:guid}", ...)` → dispatch `GetClienteByIdQuery`
  - Return `200 OK` with `ClienteDto` when found
  - Return `Results.Problem(statusCode: 404)` when null
- [ ] Register `GetClienteByIdQueryHandler` in DI in `Program.cs`
- [ ] Verify `IClienteRepository.GetByIdAsync` is implemented (from Story 2.1)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC1/AC2 — Frontend useCliente hook

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - `queryKey: ['clientes', id]`
  - Calls `clienteApiRepository.getById(id!)`
  - `staleTime: 30_000`
  - `enabled: !!id`
  - Returns `{ data, isLoading, isError }`
- [ ] In `clienteApiRepository.ts`, add method `getById(id: string): Promise<Cliente>`
  - GET `/api/v1/clientes/${id}`, return `response.data`
- [ ] In `IClienteRepository.ts`, add `getById(id: string): Promise<Cliente>` to interface
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/application/__tests__/useCliente.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC1/AC2/AC3 — Frontend ClienteDetailView component

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - Props: `clienteId: string`
  - Loading state: `<div data-testid="cliente-detail-loading">` with `react-loading-skeleton`
  - Error/not-found state: `<div data-testid="cliente-not-found" role="status">` with "Cliente no encontrado"
  - Data state: `<div data-testid="cliente-detail-panel">` containing:
    - `<span data-testid="cliente-nombre">{data.nombre}</span>`
    - `<span data-testid="cliente-nit">{data.nit}</span>`
    - `<span data-testid="cliente-telefono">{data.telefono}</span>`
    - `<span data-testid="cliente-ciudad">{data.ciudad}</span>`
  - All visible labels in Spanish: "Nombre:", "NIT/RUC:", "Teléfono:", "Ciudad:"
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC1 — Route integration and navigation

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`
  - File-based route for `/_app/clientes/$clienteId` → URL `/clientes/:clienteId`
  - Use `Route.useParams()` to extract `clienteId`
  - Render `<ClientesView selectedClienteId={clienteId} />`
- [ ] Update `ClientesView.tsx` to accept `selectedClienteId?: string` prop
  - Render `<ClienteDetailView clienteId={selectedClienteId} />` in right panel when provided
  - Render empty placeholder when no `selectedClienteId`
- [ ] Update `ClienteListView.tsx` to wire `onClick → navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })`
  - Import `useNavigate` from `@tanstack/react-router`
  - Pass `isSelected={selectedClienteId === cliente.id}` to `ClientListItem`
- [ ] In base `clientes.tsx` route, ensure empty right panel when no `clienteId` in URL
- [ ] Run E2E tests: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all backend unit tests (RED phase — should fail for Story 2.2 handler tests)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "GetClienteById"

# Run all backend integration tests (RED phase — should fail for TC-E2-P2-02 and TC-E2-P2-03)
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "GetClienteById"

# Run all frontend unit tests (RED phase — useCliente.test.ts should fail)
pnpm --filter frontend test src/modules/crm/clientes/application/__tests__/useCliente.test.ts

# Run all frontend component tests (RED phase — ClienteDetailView.test.tsx should fail)
pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx

# Run E2E tests for Story 2.2 (pre-existing, requires frontend + backend running)
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts

# Run all E2E tests in Story 2.2 in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --debug
```

---

## Test Count Summary

| Level | File | Tests | Status |
|-------|------|-------|--------|
| E2E (Playwright) | `e2e/tests/clientes/client-detail-view.spec.ts` | 19 | RED (pre-existing) |
| Backend Unit (xUnit) | `GetClienteByIdQueryHandlerTests.cs` | 12 | RED (new) |
| Backend Integration (xUnit) | `ClienteEndpointsTests.cs` (appended) | 10 | RED (new) |
| Frontend Unit (Vitest) | `useCliente.test.ts` | 10 | RED (new) |
| Frontend Component (Vitest + RTL + MSW) | `ClienteDetailView.test.tsx` | 18 | RED (new) |
| **Total** | | **69** | **RED** |

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**
- All tests written and failing
- Pre-existing E2E tests confirmed as covering all ACs
- New unit/component/integration tests created for Stories 2.2 missing coverage
- data-testid requirements documented
- Mock requirements documented
- Implementation checklist created

**Verification:**
- All new tests will fail with "Cannot find module" or compile errors
- Failure messages indicate missing implementations, not test configuration bugs
- E2E tests fail with element-not-found errors as expected

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Start with backend: implement `GetClienteByIdQuery`, `GetClienteByIdQueryHandler`, and the `GET /{id:guid}` endpoint
2. Run backend unit tests to verify handler logic: `dotnet test --filter "GetClienteById"`
3. Run backend integration tests to verify endpoint: `dotnet test --filter "GetClienteById"`
4. Create `useCliente.ts` hook and `getById` method in `clienteApiRepository.ts`
5. Run frontend unit tests: `pnpm --filter frontend test useCliente.test.ts`
6. Create `ClienteDetailView.tsx` component with all states (loading, error, data)
7. Update `ClientesView.tsx` to accept `selectedClienteId` prop
8. Update `ClienteListView.tsx` to wire click → navigate
9. Create `clientes.$clienteId.tsx` route
10. Run component tests: `pnpm --filter frontend test ClienteDetailView.test.tsx`
11. Run E2E tests: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`

**Key Principles:**
- One test at a time (start with backend, then frontend)
- Minimal implementation (only what tests require)
- Run tests frequently (immediate feedback)
- URL is the source of truth for `selectedClienteId` — no Zustand store

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 69 tests pass (green phase complete)
2. Extract duplications (DRY principle)
3. Polish UX (loading skeleton, Spanish labels alignment)
4. Ensure tests still pass after each refactor
5. Manually update story status to 'done' in sprint-status.yaml

---

## Notes

- The E2E tests at `e2e/tests/clientes/client-detail-view.spec.ts` were pre-existing and comprehensive for all 3 ACs. They have been counted but not modified.
- All MSW handlers for `GET /api/v1/clientes/:id` are defined inline in `ClienteDetailView.test.tsx` (not added to `clientes.handlers.ts`) because this endpoint is new to Story 2.2.
- Backend integration tests are appended to the existing `ClienteEndpointsTests.cs` (Story 2.1 tests preserved unchanged).
- All user-facing text in tests and expected assertions is in Spanish per company-standards.md.
- `data-testid="cliente-not-found"` must include `role="status"` for WCAG 2.1 AA compliance.
- Loading state uses `react-loading-skeleton` (no spinner) per company-standards.md.
- `useCliente` hook uses `enabled: !!id` guard to prevent fetch when id is undefined/null.

---

**Generated by BMad TEA Agent** - 2026-06-04
