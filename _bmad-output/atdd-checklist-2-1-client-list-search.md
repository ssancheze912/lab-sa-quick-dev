# ATDD Checklist - Epic 2, Story 1: Client List & Search

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** Component + API + E2E

---

## Story Summary

As a commercial team member, I want to see a list of all clients and search them by name or NIT/RUC, so that I can quickly find the client I am looking for.

The story implements the left-panel client list (280px fixed width) at `/clientes` with real-time client-side search, empty state handling, error state with retry, and a `GET /api/v1/clientes` backend endpoint backed by EF Core + PostgreSQL.

**As a** commercial team member
**I want** to see a scrollable list of clients searchable by Nombre or NIT/RUC
**So that** I can quickly find the client I need

---

## Acceptance Criteria

1. **AC1** — Left panel (280px) renders scrollable list with Nombre + NIT/RUC visible per item when clients exist.
2. **AC2** — Real-time search filters by Nombre or NIT/RUC (case-insensitive); results appear within 1 second with up to 500 records.
3. **AC3** — `EmptyState` component is displayed with Spanish guidance message when backend returns empty array.
4. **AC4** — `ErrorPanel` with "Reintentar" button shown when backend fails (network error or 5xx); clicking retry triggers refetch.
5. **AC5** — `GET /api/v1/clientes` returns HTTP 200 with JSON array of `ClienteDto` objects (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`) — no wrapper object.
6. **AC6** — Search input has `aria-label="Buscar clientes"`, list container has `role="list"`, each item has `role="listitem"` with accessible label combining Nombre + NIT/RUC.

---

## Failing Tests Created (RED Phase)

### E2E Tests (10 tests — AC1, AC3, AC4)

**File:** `e2e/tests/clientes/client-list-search.spec.ts` (already existed — reviewed, covers AC1/AC3/AC4)

- **Test:** should render left panel (data-testid="clientes-list-panel") when navigating to /clientes
  - **Status:** RED — `clientes-list-panel` element not found (ClienteListView not implemented)
  - **Verifies:** AC1 — left panel present

- **Test:** should display a list item for each existing client with Nombre visible
  - **Status:** RED — `cliente-list-item` not found
  - **Verifies:** AC1 — Nombre visible per item

- **Test:** should display NIT/RUC within the client list item
  - **Status:** RED — `cliente-list-item` not found
  - **Verifies:** AC1 — NIT visible per item

- **Test:** should render the left panel with fixed 280px width
  - **Status:** RED — panel not implemented
  - **Verifies:** AC1 — 280px fixed width

- **Test:** should render the search input with placeholder text
  - **Status:** RED — search input not implemented
  - **Verifies:** AC2 — search input present

- **Test:** should display EmptyState component when GET /api/v1/clientes returns []
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — EmptyState rendered

- **Test:** should show Spanish guidance message in EmptyState when no clients exist
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — Spanish message

- **Test:** should NOT render any client list items when EmptyState is shown
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — no list items when empty

- **Test:** should display ErrorPanel component when GET /api/v1/clientes returns 500
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — ErrorPanel on 500

- **Test:** should display "Reintentar" button inside ErrorPanel when backend is unavailable
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — Reintentar button present

### API Tests (10 tests — AC5)

**File:** `e2e/tests/api/clientes-get.api.spec.ts` (new — created by this workflow)

- **Test:** should return HTTP 200 when GET /api/v1/clientes is called
  - **Status:** RED — endpoint does not exist (404)
  - **Verifies:** AC5 — HTTP 200 response

- **Test:** should return a JSON array (not a wrapper object)
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — direct array response, no wrapper

- **Test:** should return an empty array when the clientes table has no records
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — empty array (not null)

- **Test:** should return 3 items when 3 clients exist in the database
  - **Status:** RED — endpoint + table do not exist
  - **Verifies:** AC5 — full list returned

- **Test:** should return client objects with an "id" field that is a valid UUID
  - **Status:** RED — endpoint does not exist; R-008 mitigation
  - **Verifies:** AC5 + R-008 — UUID id (not integer)

- **Test:** should return client objects with a "nombre" field
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — nombre field in DTO

- **Test:** should return client objects with a "nit" field
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — nit field in DTO

- **Test:** should return client objects with a "telefono" field
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — telefono field in DTO

- **Test:** should return client objects with a "ciudad" field
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — ciudad field in DTO

- **Test:** should return client objects with a "createdAt" field in ISO 8601 format
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — createdAt as ISO 8601 DateTimeOffset

- **Test:** should return client objects with an "updatedAt" field in ISO 8601 format
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — updatedAt as ISO 8601 DateTimeOffset

- **Test:** should return response Content-Type application/json
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — correct Content-Type header

### Component Tests (27 tests — AC1, AC2, AC3, AC4, AC6)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (new — created by this workflow)

**AC1 — List structure (6 tests):**

- **Test:** should render the list panel container with data-testid="clientes-list-panel"
  - **Status:** RED — ClienteListView module does not exist
  - **Verifies:** AC1 — panel container present

- **Test:** should render a ul element with role="list" after clients load
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — role="list" on container

- **Test:** should render a list item for each client returned by the API
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — one item per client

- **Test:** should display client Nombre in each list item
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — Nombre visible

- **Test:** should display client NIT/RUC in each list item
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — NIT/RUC visible

- **Test:** should render list items with role="listitem"
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — role="listitem" per item

- **Test:** should render skeleton rows when data is loading (isLoading state)
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — skeleton (not spinner) during load

**AC2 — Real-time search (6 tests):**

- **Test:** should render the search input with aria-label="Buscar clientes"
  - **Status:** RED — module does not exist
  - **Verifies:** AC2 + AC6 — search input accessible

- **Test:** should render the search input with placeholder text in Spanish
  - **Status:** RED — module does not exist
  - **Verifies:** AC2 — Spanish placeholder

- **Test:** should filter list to show only matching clients when user types by Nombre
  - **Status:** RED — module does not exist
  - **Verifies:** AC2 — filter by Nombre

- **Test:** should filter list to show only matching clients when user types by NIT
  - **Status:** RED — module does not exist
  - **Verifies:** AC2 — filter by NIT/RUC

- **Test:** should filter case-insensitively (uppercase query matches lowercase data)
  - **Status:** RED — module does not exist
  - **Verifies:** AC2 — case-insensitive search

- **Test:** should show all clients again when search field is cleared
  - **Status:** RED — module does not exist
  - **Verifies:** AC2 — clear restores full list

- **Test:** should complete filtering within 1000ms for 500 records (performance — AC2 NFR1)
  - **Status:** RED — module does not exist; R-003 mitigation
  - **Verifies:** AC2 + NFR1 — ≤1s with 500 records

**AC3 — EmptyState (4 tests):**

- **Test:** should render EmptyState component when API returns empty array
  - **Status:** RED — module does not exist
  - **Verifies:** AC3 — EmptyState rendered

- **Test:** should display Spanish guidance message in EmptyState
  - **Status:** RED — module does not exist
  - **Verifies:** AC3 — Spanish message

- **Test:** should NOT render any list items when EmptyState is displayed
  - **Status:** RED — module does not exist
  - **Verifies:** AC3 — no list items when empty

- **Test:** should display EmptyState with "no results" message when search yields no matches
  - **Status:** RED — module does not exist
  - **Verifies:** AC3 — "no results" variant for search

**AC4 — ErrorPanel (4 tests):**

- **Test:** should render ErrorPanel component when GET /api/v1/clientes returns 500
  - **Status:** RED — module does not exist
  - **Verifies:** AC4 — ErrorPanel (role="alert") on 500

- **Test:** should display "Reintentar" button inside ErrorPanel
  - **Status:** RED — module does not exist
  - **Verifies:** AC4 — Reintentar button present

- **Test:** should NOT render any client list items when ErrorPanel is displayed
  - **Status:** RED — module does not exist
  - **Verifies:** AC4 — no list items on error

- **Test:** should trigger a refetch when "Reintentar" button is clicked
  - **Status:** RED — module does not exist
  - **Verifies:** AC4 — retry triggers new GET request

**AC6 — Accessibility (6 tests):**

- **Test:** should have search input with aria-label="Buscar clientes"
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — aria-label on search input

- **Test:** should have list container with role="list"
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — role="list" on container

- **Test:** should have each list item with role="listitem"
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — role="listitem" per item

- **Test:** should have aria-label on each list item combining Nombre and NIT/RUC in Spanish
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — accessible label with Nombre + NIT/RUC

- **Test:** should set aria-current="true" on the selected client list item
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — aria-current on selected item

- **Test:** should call onClienteSelect with client id when a list item is clicked
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 + AC6 — click behavior + ID propagation

### Backend Unit Tests (6 tests — AC5 handler)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (new — created by this workflow)

- **Test:** Handle_WhenRepositoryReturnsTwoClientes_ReturnsTwoClienteDtos
  - **Status:** RED — compile error (types do not exist)
  - **Verifies:** AC5 — handler maps entity count to DTO count

- **Test:** Handle_WhenRepositoryReturnsTwoClientes_MapsNombreCorrectly
  - **Status:** RED — compile error
  - **Verifies:** AC5 — Nombre mapping

- **Test:** Handle_WhenRepositoryReturnsTwoClientes_MapsNitCorrectly
  - **Status:** RED — compile error
  - **Verifies:** AC5 — Nit mapping

- **Test:** Handle_WhenRepositoryReturnsTwoClientes_MapsIdAsNonEmptyGuid
  - **Status:** RED — compile error; R-008 mitigation
  - **Verifies:** AC5 + R-008 — Id is non-empty GUID

- **Test:** Handle_WhenRepositoryReturnsEmpty_ReturnsEmptyEnumerable
  - **Status:** RED — compile error
  - **Verifies:** AC5 — empty list → empty enumerable

- **Test:** Handle_AlwaysCalls_GetAllAsyncOnRepository
  - **Status:** RED — compile error
  - **Verifies:** AC5 — handler delegates to repository

- **Test:** Handle_WhenRepositoryReturnsTwoClientes_MapsCreatedAtAsDateTimeOffset
  - **Status:** RED — compile error
  - **Verifies:** AC5 + company standard — DateTimeOffset not DateTime

---

## Data Factories Used

Existing factories in `e2e/helpers/data.helper.ts` are reused:

- `buildCliente(overrides?)` — creates a unique test client with Colombian nit/telefono format
- `buildContacto(overrides?)` — available for future stories

No new factories needed for Story 2.1.

---

## Fixtures Used

Existing `e2e/fixtures/base.fixture.ts` and `e2e/helpers/api.helper.ts` are reused:

- `ApiHelper.createCliente(data)` — seeds test data
- `ApiHelper.deleteCliente(id)` — cleans up after each test
- `createdIds[]` array pattern — tracks created records for teardown

---

## Mock Requirements

### MSW Handler: GET /api/v1/clientes

Used in component tests (`ClienteListView.test.tsx`):

**Default (success) response:**
```json
[
  {
    "id": "11111111-1111-4111-8111-111111111111",
    "nombre": "Acme Colombia SAS",
    "nit": "900123456-7",
    "telefono": "+57 601 234 5678",
    "ciudad": "Bogotá",
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-10T10:00:00Z"
  }
]
```

**Error response (AC4 tests):**
```json
{ "title": "Internal Server Error", "status": 500 }
```
HTTP status: 500

**Empty response (AC3 tests):**
```json
[]
```
HTTP status: 200

**Notes:**
- MSW handlers are set up with `setupServer` from `msw/node` in the component test file.
- Each test group that needs a different response uses `server.use(...)` to override the default.
- `server.resetHandlers()` runs in `afterEach` to restore defaults between tests.
- `onUnhandledRequest: 'error'` catches missing MSW handlers during test development.

---

## Required data-testid Attributes

### `ClienteListView.tsx`

- `clientes-list-panel` — The outer container div for the left panel (280px fixed width)
- `skeleton-row` — Each skeleton row during loading state (3-5 rows)

### `ClientListItem.tsx`

- `cliente-list-item` — Each `<li>` element in the client list

### `EmptyState.tsx`

- `empty-state` — The container `<div>` with `role="status"` for empty state

### `ErrorPanel.tsx`

*(Uses `role="alert"` — no data-testid needed; identified by role in tests)*

**Implementation example:**

```tsx
// ClienteListView.tsx
<div data-testid="clientes-list-panel" className="w-[280px] overflow-y-auto">
  <input
    type="search"
    aria-label="Buscar clientes"
    placeholder="Buscar por nombre o NIT/RUC"
  />
  {isLoading && (
    <div className="p-3 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} data-testid="skeleton-row">
          <Skeleton height={56} />
        </div>
      ))}
    </div>
  )}
  {isError && <ErrorPanel onRetry={refetch} />}
  {!isLoading && !isError && filteredClientes.length === 0 && searchQuery === '' && (
    <EmptyState message="No hay clientes registrados. Crea el primero." />
  )}
  {!isLoading && !isError && filteredClientes.length === 0 && searchQuery !== '' && (
    <EmptyState message="No se encontraron clientes con ese criterio." />
  )}
  {!isLoading && !isError && filteredClientes.length > 0 && (
    <ul role="list">
      {filteredClientes.map((c) => (
        <ClientListItem key={c.id} cliente={c} isSelected={selectedClienteId === c.id} onClick={() => onClienteSelect(c.id)} />
      ))}
    </ul>
  )}
</div>

// ClientListItem.tsx
<li
  data-testid="cliente-list-item"
  role="listitem"
  aria-label={`${cliente.nombre}, NIT/RUC: ${cliente.nit}`}
  aria-current={isSelected ? 'true' : undefined}
  onClick={onClick}
>
  <span>{cliente.nombre}</span>
  <span>{cliente.nit}</span>
</li>

// EmptyState.tsx
<div data-testid="empty-state" role="status">
  <p>{message}</p>
  {onAction && actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
</div>

// ErrorPanel.tsx
<div role="alert">
  <ExclamationTriangleIcon />
  <p>{message ?? 'No se pudo cargar la información. Verifica tu conexión.'}</p>
  <Button onClick={onRetry}>Reintentar</Button>
</div>
```

---

## Implementation Checklist

### Backend Tasks (make API tests green)

#### Test: GET /api/v1/clientes returns HTTP 200

**File:** `e2e/tests/api/clientes-get.api.spec.ts`

- [ ] Create `ClienteEntity` in `SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (extends `Entity`)
- [ ] Create `IClienteRepository` in `SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `ClienteDto` in `SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `GetClientesQuery` in `SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- [ ] Create `GetClientesQueryHandler` in `SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- [ ] Create EF Core `ClienteConfiguration` in `SiesaAgents.Infrastructure/Data/Configurations/`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`
- [ ] Create `ClienteRepository` in `SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Create `ClienteEndpoints.cs` with `MapGet("/api/v1/clientes", ...)` in `SiesaAgents.API/Endpoints/`
- [ ] Register DI: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`
- [ ] Register MediatR handler assembly in `Program.cs`
- [ ] Call `app.MapClienteEndpoints()` in `Program.cs`
- [ ] Run EF Core migration: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Apply migration: `dotnet ef database update`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-get.api.spec.ts`
- [ ] ✅ API tests pass (green phase)

**Estimated Effort:** 4 hours

---

#### Test: GetClientesQueryHandler unit tests

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

- [ ] Ensure `ClienteEntity.Create(nombre, nit, telefono, ciudad)` static factory method exists
- [ ] Ensure `IClienteRepository.GetAllAsync()` returns `Task<IEnumerable<ClienteEntity>>`
- [ ] Ensure `GetClientesQueryHandler` constructor accepts `IClienteRepository`
- [ ] Ensure `ClienteDto` has: `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
- [ ] Ensure mapping in handler covers all fields
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/`
- [ ] ✅ Unit tests pass (green phase)

**Estimated Effort:** 1 hour (co-implemented with endpoint)

---

### Frontend Tasks (make component and E2E tests green)

#### Test: ClienteListView renders list structure (AC1)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` interface
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` (TanStack Query hook)
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` with `data-testid="cliente-list-item"`, `role="listitem"`, `aria-label`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- [ ] Add `data-testid="clientes-list-panel"` to the container div
- [ ] Add `data-testid="skeleton-row"` to skeleton rows during loading
- [ ] Render `<ul role="list">` with `<ClientListItem>` per filtered client
- [ ] Run test: `pnpm --filter frontend test ClienteListView.test.tsx`
- [ ] ✅ AC1 component tests pass

**Estimated Effort:** 3 hours

---

#### Test: Real-time search filters list (AC2)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- [ ] Add `<input type="search" aria-label="Buscar clientes" placeholder="Buscar por nombre o NIT/RUC" />`
- [ ] Add `useState<string>('')` for `searchQuery`
- [ ] Add `useMemo` filter: `cliente.nombre.toLowerCase().includes(q) || cliente.nit.toLowerCase().includes(q)`
- [ ] Verify `useMemo` runs synchronously (no debounce for search — see architecture notes)
- [ ] Run performance test with 500 records (< 1000ms requirement)
- [ ] Run test: `pnpm --filter frontend test ClienteListView.test.tsx --grep "AC2"`
- [ ] ✅ AC2 component tests pass

**Estimated Effort:** 1 hour

---

#### Test: EmptyState component (AC3)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- [ ] Create `frontend/src/shared/components/EmptyState.tsx`
- [ ] Add `data-testid="empty-state"` and `role="status"` to container
- [ ] Implement two EmptyState variants:
  - `"No hay clientes registrados. Crea el primero."` — when `data = []` and `searchQuery = ''`
  - `"No se encontraron clientes con ese criterio."` — when `filteredClientes = []` and `searchQuery !== ''`
- [ ] Run test: `pnpm --filter frontend test ClienteListView.test.tsx --grep "AC3"`
- [ ] ✅ AC3 component tests pass

**Estimated Effort:** 1 hour

---

#### Test: ErrorPanel component (AC4)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
- [ ] Add `role="alert"` to container
- [ ] Render "Reintentar" button using shadcn/ui `Button`
- [ ] Pass `onRetry` callback to `refetch` from `useClientes`
- [ ] Run test: `pnpm --filter frontend test ClienteListView.test.tsx --grep "AC4"`
- [ ] ✅ AC4 component tests pass

**Estimated Effort:** 1 hour

---

#### Test: Accessibility requirements (AC6)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- [ ] Verify `aria-label="Buscar clientes"` is on the `<input>` element
- [ ] Verify `role="list"` on the `<ul>` container
- [ ] Verify `role="listitem"` on each `<li>` item
- [ ] Verify `aria-label="{nombre}, NIT/RUC: {nit}"` on each `<li>`
- [ ] Verify `aria-current="true"` when `selectedClienteId` matches item id
- [ ] Run test: `pnpm --filter frontend test ClienteListView.test.tsx --grep "AC6"`
- [ ] ✅ AC6 component tests pass

**Estimated Effort:** 0.5 hours (part of AC1 implementation)

---

#### Test: E2E — List and panel visible (AC1, AC3, AC4)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

- [ ] Wire `ClienteListView` into `frontend/src/routes/_app/clientes.tsx`
- [ ] Replace `ClientesPlaceholder` with split-panel layout
- [ ] Render `<ClienteListView>` in the left 280px panel
- [ ] Ensure `w-[280px]` class is applied via Tailwind
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts`
- [ ] ✅ E2E tests pass

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run ALL component tests for this story
pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteListView.test.tsx

# Run component tests in watch mode
pnpm --filter frontend test:watch src/modules/crm/clientes/presentation/ClienteListView.test.tsx

# Run API contract tests (requires backend running on port 5000)
npx playwright test e2e/tests/api/clientes-get.api.spec.ts

# Run E2E tests (requires both frontend on 5173 and backend on 5000)
npx playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run backend unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "Clientes"

# Run ALL failing tests for this story
pnpm --filter frontend test && npx playwright test e2e/tests/api/clientes-get.api.spec.ts e2e/tests/clientes/client-list-search.spec.ts && dotnet test backend/tests/SiesaAgents.UnitTests/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ Component tests written and failing (27 tests in `ClienteListView.test.tsx`)
- ✅ API contract tests written and failing (10 tests in `clientes-get.api.spec.ts`)
- ✅ Backend unit tests written and failing to compile (7 tests in `GetClientesQueryHandlerTests.cs`)
- ✅ E2E tests already present and failing (10 tests in `client-list-search.spec.ts`)
- ✅ Network-first intercept pattern applied in all E2E tests
- ✅ MSW handlers configured for all component test scenarios
- ✅ data-testid attributes documented for all UI elements
- ✅ Implementation checklist created

**Verification:**

- Component failures: `Cannot find module './ClienteListView'` (module does not exist)
- API failures: `Connection refused` or `404` on `GET localhost:5000/api/v1/clientes`
- Unit failures: Compile error — `SiesaAgents.Application.Clientes.Queries` namespace not found
- E2E failures: `Timeout: waiting for locator('[data-testid="clientes-list-panel"]')`

---

### GREEN Phase (DEV Team - Next Steps)

**Recommended Implementation Order:**

1. **Backend first** (unblocks API tests + frontend integration):
   - `ClienteEntity.cs` → `IClienteRepository.cs` → `ClienteDto.cs` + query objects
   - `ClienteConfiguration.cs` → `AppDbContext` (add `DbSet`) → `ClienteRepository.cs`
   - `ClienteEndpoints.cs` → `Program.cs` registration → EF Core migration
2. **Frontend infrastructure** (after backend endpoint is live):
   - `Cliente.ts` interface → `IClienteRepository.ts` → `clienteApiRepository.ts` → `useClientes.ts`
3. **Shared components**:
   - `ClientListItem.tsx` → `EmptyState.tsx` → `ErrorPanel.tsx`
4. **ClienteListView.tsx** (wire everything together)
5. **Route integration**: update `_app/clientes.tsx`

**Key Principle:** One test at a time — run each test after implementing just enough to make it pass.

---

### REFACTOR Phase (After All Tests Pass)

1. Extract `useFilteredClientes` custom hook from `ClienteListView` if filtering logic is complex
2. Verify `react-loading-skeleton` styles are scoped (no global CSS leakage)
3. Run TypeScript check: `npx tsc --noEmit` from `frontend/`
4. Run `dotnet build` to confirm no warnings/errors
5. Confirm all 27 component + 10 API + 7 unit + 10 E2E tests pass

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run component tests first to confirm RED: `pnpm --filter frontend test ClienteListView.test.tsx`
3. Begin backend implementation (ClienteEntity → endpoint → migration)
4. Then implement frontend components (domain → application → presentation)
5. Work one failing test at a time
6. When all tests pass, refactor and run full suite
7. Update story status to 'in-dev' in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests apply `page.route('**/api/v1/clientes', ...)` BEFORE `page.goto()`
- **selector-resilience.md** — All selectors use `data-testid` or ARIA roles (no fragile CSS selectors)
- **component-tdd.md** — Component tests use MSW for network isolation; `QueryClientProvider` wrapper; Given-When-Then
- **test-quality.md** — One assertion per test (atomic); `afterEach` cleanup with `server.resetHandlers()`; no hard waits
- **timing-debugging.md** — Uses `screen.findByRole()` / `screen.findByTestId()` (explicit async waits, not `waitFor`)
- **data-factories.md** — Existing `buildCliente()` factory reused; `createdIds[]` array for teardown in API tests
- **test-levels-framework.md** — AC5 split across API (contract) + Unit (handler logic); AC1/AC2/AC3/AC4/AC6 at Component; critical flows at E2E

---

**Generated by BMad TEA Agent** - 2026-05-24
