# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-24
**Author:** BMad TEA Agent
**Primary Test Level:** Component (Vitest + RTL + MSW) + Unit (xUnit) + E2E (Playwright)

---

## Story Summary

Commercial team members can navigate to `/clientes` and see a scrollable list of all clients showing Nombre and NIT/RUC per item. The list can be filtered in real time by Nombre or NIT/RUC (client-side, no extra API call). When no clients exist, an EmptyState component guides the user to create the first client. If the API fails, an ErrorPanel with a "Reintentar" button is shown. While loading, skeleton placeholders appear (no spinner).

**As a** commercial team member,
**I want** to see a list of all clients and search them by name or NIT/RUC,
**So that** I can quickly find the client I'm looking for.

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px) shows a scrollable list of all clients with `Nombre` and `NIT/RUC` visible per item, rendered by `ClienteListView`.

2. **AC2** — Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose `Nombre` or `NIT/RUC` match the input (case-insensitive), with no additional API call triggered. Results appear in under 1 second with up to 500 records (NFR1).

3. **AC3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed in the left panel with a Spanish-language message guiding the user to create the first client.

4. **AC4** — Given the backend is unavailable when the page loads, When `GET /api/v1/clientes` fails, Then an `ErrorPanel` component with a "Reintentar" button is displayed. Clicking "Reintentar" triggers `refetch()` on the TanStack Query `['clientes']` query.

5. **AC5** — Given the `/clientes` route is loaded, When the GET request to `/api/v1/clientes` is in-flight, Then skeleton placeholders (`react-loading-skeleton`) are displayed — no spinner.

---

## Failing Tests Created (RED Phase)

### Component Tests — Vitest + RTL + MSW (14 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/-ClienteListView.test.tsx`

#### TC-E2-P1-01: Client list renders on page load (5 tests)

- **Test:** `[P1] Given clients exist, When navigating to /clientes, Then all client Nombre values are visible`
  - **Status:** RED — `ClienteListView` component does not exist.
  - **Verifies:** AC1 — All client Nombre values are rendered in the list.

- **Test:** `[P1] Given clients exist, When list is loaded, Then each item shows NIT/RUC value`
  - **Status:** RED — `ClienteListView` not implemented; no `nitRuc` field rendered.
  - **Verifies:** AC1 — Each list item displays `nitRuc`.

- **Test:** `[P1] Given clients exist, When list is loaded, Then list panel renders with data-testid="clientes-list-panel"``
  - **Status:** RED — Container `data-testid="clientes-list-panel"` not implemented.
  - **Verifies:** AC1 — Left panel has required `data-testid` for E2E selectors.

- **Test:** `[P1] Given clients exist, When list is loaded, Then no ErrorPanel is shown`
  - **Status:** RED — Component missing; cannot verify ErrorPanel is absent on success.
  - **Verifies:** AC1 — No false-positive error state on successful load.

- **Test:** `[P1] Given clients exist, When list is loaded, Then no EmptyState is shown`
  - **Status:** RED — Component missing; cannot verify EmptyState absence with data.
  - **Verifies:** AC1 — No false-positive empty state when clients exist.

#### TC-E2-P1-02: Real-time filter by Nombre (3 tests)

- **Test:** `[P1] Given list is loaded, When typing "Beta" in search, Then only Empresa Beta is visible`
  - **Status:** RED — Search input and `useMemo` filter not implemented.
  - **Verifies:** AC2 — Name-based filtering reduces visible items.

- **Test:** `[P1] Given filter "Beta" applied, When search is cleared, Then all 3 clients are visible again`
  - **Status:** RED — Search clear / reset behavior not implemented.
  - **Verifies:** AC2 — Clearing filter restores the full list.

- **Test:** `[P1] Given list loaded, When search is case-insensitive match, Then client is found regardless of case`
  - **Status:** RED — Case-insensitive filter logic (`toLowerCase()`) not implemented.
  - **Verifies:** AC2 — Filter is case-insensitive.

#### TC-E2-P1-03: Real-time filter by NIT/RUC (2 tests)

- **Test:** `[P1] Given list is loaded, When typing the NIT/RUC of Empresa Beta, Then only Empresa Beta is visible`
  - **Status:** RED — `nitRuc` filter field not implemented.
  - **Verifies:** AC2 — NIT/RUC-based filtering works.

- **Test:** `[P1] Given list is loaded, When typing a partial NIT/RUC, Then matching clients are visible`
  - **Status:** RED — Partial match on `nitRuc` not implemented.
  - **Verifies:** AC2 — Partial NIT/RUC match works.

#### TC-E2-P1-04: EmptyState shown when no clients exist (4 tests)

- **Test:** `[P1] Given no clients in system, When navigating to /clientes, Then EmptyState renders with guidance text`
  - **Status:** RED — `EmptyState` component not created; `ClienteListView` not checking empty state.
  - **Verifies:** AC3 — `EmptyState` is shown when API returns `[]`.

- **Test:** `[P1] Given no clients, When EmptyState renders, Then guidance text directs user to create first client`
  - **Status:** RED — `EmptyState` with Spanish guidance text not implemented.
  - **Verifies:** AC3 — EmptyState contains Spanish-language guidance.

- **Test:** `[P1] Given no clients, When EmptyState renders, Then no client list items are shown`
  - **Status:** RED — Conditional rendering logic not implemented.
  - **Verifies:** AC3 — No list items when EmptyState is shown.

- **Test:** `[P1] Given no clients, When EmptyState renders, Then no ErrorPanel is shown`
  - **Status:** RED — Conditional branches not implemented.
  - **Verifies:** AC3 — EmptyState and ErrorPanel are mutually exclusive.

#### TC-E2-P1-05: ErrorPanel shown when API is unavailable (4 tests)

- **Test:** `[P1] Given backend is unavailable, When query fails, Then ErrorPanel renders instead of the list`
  - **Status:** RED — `ErrorPanel` component not created; `isError` branch not handled.
  - **Verifies:** AC4 — ErrorPanel renders on network failure.

- **Test:** `[P1] Given ErrorPanel is shown, When user sees it, Then a "Reintentar" button is visible`
  - **Status:** RED — `ErrorPanel` "Reintentar" button not implemented.
  - **Verifies:** AC4 — "Reintentar" (exact text) button is present.

- **Test:** `[P1] Given ErrorPanel is shown, When API unavailable, Then no client items are rendered`
  - **Status:** RED — Error branch rendering not implemented.
  - **Verifies:** AC4 — No client items visible when error occurs.

- **Test:** `[P1] Given ErrorPanel is shown, When API unavailable, Then no EmptyState is shown`
  - **Status:** RED — Conditional branches not implemented.
  - **Verifies:** AC4 — ErrorPanel and EmptyState are mutually exclusive.

#### Skeleton Loading State + Accessibility (2 tests)

- **Test:** `[P1] Given API call is in-flight, When component first renders, Then no spinner role is present`
  - **Status:** RED — Loading state uses unimplemented skeleton pattern; no role="status" constraint.
  - **Verifies:** AC5 — Company standard: react-loading-skeleton, never spinner.

- **Test:** `[P1] Given list panel renders, When inspecting search input, Then it has aria-label="Buscar clientes"`
  - **Status:** RED — Search input with `aria-label="Buscar clientes"` not implemented.
  - **Verifies:** AC1 / WCAG 2.1 AA — Search input has required accessibility label.

---

### Unit Tests — Vitest + RTL renderHook + MSW (10 tests)

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts`

#### Successful data fetch (4 tests)

- **Test:** `Given API returns clients, When useClientes resolves, Then data contains expected clients`
  - **Status:** RED — `useClientes` hook does not exist.
  - **Verifies:** AC1 — Hook returns the API data correctly.

- **Test:** `Given API returns clients, When useClientes resolves, Then isLoading is false`
  - **Status:** RED — Hook not implemented.
  - **Verifies:** AC5 — Loading state resolves correctly.

- **Test:** `Given API returns clients, When useClientes resolves, Then isError is false`
  - **Status:** RED — Hook not implemented.
  - **Verifies:** AC4 — Error state is false on success.

- **Test:** `Given API returns clients, When useClientes resolves, Then each client has all required domain fields`
  - **Status:** RED — `Cliente` interface not defined.
  - **Verifies:** AC1 — All domain fields (`id`, `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`) present.

#### Network failure (3 tests)

- **Test:** `Given API is unavailable, When useClientes rejects, Then isError is true`
  - **Status:** RED — `useClientes` not implemented; network error not handled.
  - **Verifies:** AC4 — Error state is true on network failure.

- **Test:** `Given API is unavailable, When useClientes rejects, Then data is undefined`
  - **Status:** RED — Hook not implemented.
  - **Verifies:** AC4 — Data is not populated on error.

- **Test:** `Given API returns 500, When useClientes rejects, Then isError is true`
  - **Status:** RED — Axios error handling not implemented.
  - **Verifies:** AC4 — Server-side 500 is treated as an error.

#### queryKey contract (3 tests)

- **Test:** `Given useClientes runs, When query registered, Then queryKey is exactly ['clientes']`
  - **Status:** RED — `useClientes` not implemented; queryKey not defined.
  - **Verifies:** AC1 / Critical: `queryKey: ['clientes']` is mandatory for cache invalidation by mutations in Stories 2.3–2.5.

- **Test:** `Given useClientes runs, When data loads, Then refetch function is available`
  - **Status:** RED — `useClientes` not implemented.
  - **Verifies:** AC4 — `refetch` is exposed for ErrorPanel "Reintentar" functionality.

---

### Unit Tests — C# / xUnit — ClienteEntity (11 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs`

#### Factory — Happy Path (5 tests)

- **Test:** `Create_ValidData_ReturnsEntityWithAllFieldsSet`
  - **Status:** RED — `ClienteEntity` class and `Create()` factory method do not exist.
  - **Verifies:** AC1 — Factory creates entity with all fields populated.

- **Test:** `Create_ValidData_ReturnsEntityWithNonEmptyGuidId`
  - **Status:** RED — `ClienteEntity` not implemented; `Id` property not set.
  - **Verifies:** AC1 — Id is non-empty Guid (UUID — company standard).

- **Test:** `Create_TwoClients_HaveDifferentIds`
  - **Status:** RED — `ClienteEntity` not implemented.
  - **Verifies:** AC1 — Each entity has a unique Id.

- **Test:** `Create_ValidData_ReturnsEntityWithCreatedAtAsDateTimeOffset`
  - **Status:** RED — `ClienteEntity.CreatedAt` property not implemented.
  - **Verifies:** AC1 — `CreatedAt` is `DateTimeOffset` (company standard: never `DateTime`).

- **Test:** `Create_ValidData_TrimsLeadingAndTrailingWhitespace`
  - **Status:** RED — Trim logic in `Create()` not implemented.
  - **Verifies:** AC1 — Input normalization: `.Trim()` applied to all string fields.

#### Factory — Required field validation (6 tests)

- **Test:** `Create_EmptyNombre_ThrowsArgumentException`
  - **Status:** RED — Validation not implemented.
  - **Verifies:** AC1 / FR1 — Empty `Nombre` is rejected.

- **Test:** `Create_EmptyNitRuc_ThrowsArgumentException`
  - **Status:** RED — Validation not implemented.
  - **Verifies:** AC1 / FR1 — Empty `NitRuc` is rejected.

- **Test:** `Create_EmptyTelefono_ThrowsArgumentException`
  - **Status:** RED — Validation not implemented.
  - **Verifies:** AC1 / FR1 — Empty `Telefono` is rejected.

- **Test:** `Create_EmptyCiudad_ThrowsArgumentException`
  - **Status:** RED — Validation not implemented.
  - **Verifies:** AC1 / FR1 — Empty `Ciudad` is rejected.

- **Test (Theory):** `Create_WhitespaceOnlyNombre_ThrowsArgumentException` (3 data cases)
  - **Status:** RED — `ArgumentException.ThrowIfNullOrWhiteSpace` not called.
  - **Verifies:** AC1 — Whitespace-only `Nombre` is rejected (company standard: `ThrowIfNullOrWhiteSpace`).

- **Test (Theory):** `Create_WhitespaceOnlyNitRuc_ThrowsArgumentException` (2 data cases)
  - **Status:** RED — Validation not implemented.
  - **Verifies:** AC1 — Whitespace-only `NitRuc` is rejected.

---

### Unit Tests — C# / xUnit — GetClientesQueryHandler (9 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

- **Test:** `HandleAsync_WhenRepositoryReturnsEmptyList_ReturnsEmptyDtoList`
  - **Status:** RED — `GetClientesQueryHandler`, `IClienteRepository`, `ClienteDto`, `GetClientesQuery` not implemented.
  - **Verifies:** AC1 — Handler returns empty list for empty repository.

- **Test:** `HandleAsync_WhenRepositoryReturnsTwoEntities_ReturnsTwoDtos`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC1 — Handler returns correct DTO count.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_DtoHasCorrectNombre`
  - **Status:** RED — Entity-to-DTO mapping not implemented.
  - **Verifies:** AC1 — `Nombre` maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_DtoHasCorrectNitRuc`
  - **Status:** RED — Entity-to-DTO mapping not implemented.
  - **Verifies:** AC1 — `NitRuc` maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_DtoHasCorrectTelefono`
  - **Status:** RED — Entity-to-DTO mapping not implemented.
  - **Verifies:** AC1 — `Telefono` maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_DtoHasCorrectCiudad`
  - **Status:** RED — Entity-to-DTO mapping not implemented.
  - **Verifies:** AC1 — `Ciudad` maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_DtoIdMatchesEntityId`
  - **Status:** RED — Id mapping not implemented.
  - **Verifies:** AC1 — `Id` (UUID) maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_DtoHasCreatedAtAsDateTimeOffset`
  - **Status:** RED — `CreatedAt` mapping not implemented.
  - **Verifies:** AC1 — `CreatedAt` maps as `DateTimeOffset` (company standard).

- **Test:** `HandleAsync_WhenCalledOnce_InvokesRepositoryGetAllAsyncExactlyOnce`
  - **Status:** RED — Handler not implemented; call tracking not verifiable.
  - **Verifies:** AC1 — No N+1 query: handler calls repository exactly once.

- **Test:** `HandleAsync_WhenRepositoryReturnsTwoEntities_DtosMaintainCorrectFieldMapping`
  - **Status:** RED — Handler mapping not implemented.
  - **Verifies:** AC1 — Both entities map correctly with preserved field ordering.

- **Test:** `HandleAsync_ReturnType_ImplementsIReadOnlyList`
  - **Status:** RED — Handler return type not implemented.
  - **Verifies:** AC1 — CQRS pattern: handler returns `IReadOnlyList<ClienteDto>` (read-only view).

---

### E2E Tests — Playwright (9 tests)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

- **Test:** `AC1 — Given clients exist, When navigating to /clientes, Then left panel shows client Nombre`
  - **Status:** RED — `ClienteListView` not implemented; route renders placeholder.
  - **Verifies:** AC1 — Client Nombre visible in full-stack integration.

- **Test:** `AC1 — Given clients exist, When navigating to /clientes, Then left panel shows NIT/RUC per item`
  - **Status:** RED — NIT/RUC rendering not implemented.
  - **Verifies:** AC1 — NIT/RUC visible per list item.

- **Test:** `AC1 — Given clients exist, When navigating to /clientes, Then the left panel container is rendered`
  - **Status:** RED — `data-testid="clientes-list-panel"` not rendered.
  - **Verifies:** AC1 — Left panel container present in full-stack render.

- **Test:** `AC2 — Given list is loaded, When typing Nombre in search, Then list filters to matching clients`
  - **Status:** RED — Search input and client-side filter not implemented.
  - **Verifies:** AC2 — Full-stack: search by Nombre filters list.

- **Test:** `AC2 — Given search is applied, When clearing the search field, Then all clients reappear`
  - **Status:** RED — Search clear behavior not implemented.
  - **Verifies:** AC2 — Clearing filter restores all clients.

- **Test:** `AC2 — Given list is loaded, When search is case-insensitive, Then match found regardless of casing`
  - **Status:** RED — Case-insensitive filter not implemented.
  - **Verifies:** AC2 — Case-insensitive search.

- **Test:** `AC2 — Given list is loaded, When typing NIT/RUC in search, Then only matching client is shown`
  - **Status:** RED — NIT/RUC filter not implemented.
  - **Verifies:** AC2 — NIT/RUC search filters correctly.

- **Test:** `AC5 — Given /clientes route loads, When GET is in-flight, Then no spinner is shown`
  - **Status:** RED — Loading state not implemented; no skeleton verification yet.
  - **Verifies:** AC5 — Company standard: no `role="status"` spinner in loading state.

- **Test:** `AC1 — Given /clientes is loaded, When inspecting search input, Then it has aria-label="Buscar clientes"`
  - **Status:** RED — Search input `aria-label` not implemented.
  - **Verifies:** AC1 / WCAG 2.1 AA — Search input accessibility label.

---

## Required data-testid Attributes

The following `data-testid` attributes MUST be added during implementation for tests to pass:

| Component | `data-testid` | Location |
|-----------|---------------|----------|
| Left panel container | `clientes-list-panel` | `ClienteListView.tsx` — outer panel div |
| Client list item | `cliente-list-item` | `ClienteListItem.tsx` — button element |
| Empty state | `empty-state` | `EmptyState.tsx` — root element |
| Error panel | `error-panel` | `ErrorPanel.tsx` — root element |
| Skeleton row | `skeleton-row` | Each skeleton `<li>` element |

---

## Mock Requirements

### Frontend MSW Handlers (per component test file)

Each test file sets up its own MSW server inline. No global handler file needed for Story 2.1.

**Required handlers:**

```typescript
// Success: returns 3 clients
http.get('/api/v1/clientes', () => HttpResponse.json([...mockClientes]))

// Empty list: returns []
http.get('/api/v1/clientes', () => HttpResponse.json([]))

// Network failure
http.get('/api/v1/clientes', () => HttpResponse.error())

// Server error
http.get('/api/v1/clientes', () => new HttpResponse(null, { status: 500 }))
```

### Backend Test Double (xUnit)

`FakeClienteRepository` is defined inline in `GetClientesQueryHandlerTests.cs`. Implements `IClienteRepository` with an in-memory list. No real DB required for unit tests.

---

## Implementation Checklist

### Step 1 — Backend: Domain Layer (makes ClienteEntityTests GREEN)

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Inherit from `Entity` base class (from Story 1.1)
  - [ ] Fields: `string Nombre`, `string NitRuc`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt` (all `private set`)
  - [ ] Private constructor
  - [ ] Static `Create(string nombre, string nitRuc, string telefono, string ciudad)` factory
  - [ ] `ArgumentException.ThrowIfNullOrWhiteSpace()` on all four parameters
  - [ ] `.Trim()` applied to all string assignments
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Method: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)`
- [ ] Run: `dotnet test --filter "ClienteEntityTests"` — verify RED → GREEN

### Step 2 — Backend: Application Layer (makes GetClientesQueryHandlerTests GREEN)

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
  - [ ] Record with properties: `Guid Id`, `string Nombre`, `string NitRuc`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
  - [ ] Empty record (no parameters)
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
  - [ ] Constructor takes `IClienteRepository`
  - [ ] `HandleAsync(GetClientesQuery query, CancellationToken ct = default)` method
  - [ ] Call `repository.GetAllAsync(ct)` once
  - [ ] Map `ClienteEntity` → `ClienteDto`: `new ClienteDto(e.Id, e.Nombre, e.NitRuc, e.Telefono, e.Ciudad, e.CreatedAt)`
  - [ ] Return `IReadOnlyList<ClienteDto>`
- [ ] Run: `dotnet test --filter "GetClientesQueryHandlerTests"` — verify RED → GREEN

### Step 3 — Backend: Infrastructure Layer

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
  - [ ] `builder.ToTable("clientes")`
  - [ ] `HasIndex(c => c.NitRuc).IsUnique().HasDatabaseName("uk_clientes_nit_ruc")`
  - [ ] `HasMaxLength(200)` for Nombre, `HasMaxLength(50)` for NitRuc, `HasMaxLength(20)` for Telefono, `HasMaxLength(100)` for Ciudad
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
  - [ ] Implement `IClienteRepository`
  - [ ] Inject `SiesaAgentsDbContext`
  - [ ] `GetAllAsync`: `await _context.Clientes.AsNoTracking().OrderBy(c => c.Nombre).ToListAsync(ct)`
- [ ] Add `DbSet<ClienteEntity> Clientes { get; set; }` to `SiesaAgentsDbContext`

### Step 4 — Backend: API Layer

- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] `MapGet("/api/v1/clientes", ...)` returning `Results.Ok(await handler.HandleAsync(ct))`
  - [ ] Call `app.MapClienteEndpoints()` in `Program.cs`
- [ ] Register DI in `Program.cs`: `AddScoped<IClienteRepository, ClienteRepository>()` and `AddScoped<GetClientesQueryHandler>()`

### Step 5 — Backend: EF Core Migration

- [ ] `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `clientes` table with snake_case columns: `id`, `nombre`, `nit_ruc`, `telefono`, `ciudad`, `created_at`, `updated_at`
- [ ] Verify unique index `uk_clientes_nit_ruc` in `Up()` method
- [ ] `dotnet ef database update` (deferred if PostgreSQL unavailable)

### Step 6 — Frontend: Domain Types

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`
  - [ ] `export interface Cliente { id: string; nombre: string; nitRuc: string; telefono: string; ciudad: string; createdAt: string }`
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [ ] `getAll(): Promise<Cliente[]>`

### Step 7 — Frontend: Infrastructure Layer

- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Implements `IClienteRepository`
  - [ ] `getAll()`: `apiClient.get<Cliente[]>('/api/v1/clientes')` → return `response.data`

### Step 8 — Frontend: useClientes Hook (makes useClientes.test.ts GREEN)

- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`
  - [ ] Export `useClientes` function
- [ ] Run: `npx vitest run src/modules/crm/clientes/application/useClientes.test.ts` — verify RED → GREEN

### Step 9 — Frontend: Shared Components

- [ ] Create/verify `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `title: string`, `description?: string`, `action?: React.ReactNode`
  - [ ] Add `data-testid="empty-state"` to root element
  - [ ] Centered column, `text-slate-500`, Heroicons icon
- [ ] Create/verify `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `onRetry: () => void`, `message?: string`
  - [ ] Add `data-testid="error-panel"` to root element
  - [ ] "Reintentar" button with `aria-label="Reintentar carga"` and `onClick={onRetry}`
- [ ] Create/verify `frontend/src/shared/components/ClienteListItem.tsx`
  - [ ] Props: `cliente: Cliente`, `isActive: boolean`, `onClick: (id: string) => void`
  - [ ] Add `data-testid="cliente-list-item"` to button element
  - [ ] Two-line layout: `nombre` (bold) + `nitRuc` (secondary)
  - [ ] Active state: `bg-[#0e79fd]/10 border-l-2 border-[#0e79fd]`

### Step 10 — Frontend: ClienteListView Component (makes -ClienteListView.test.tsx GREEN)

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Import and call `useClientes()` hook
  - [ ] `useState('')` for `searchQuery`
  - [ ] `useMemo` for `filteredClientes` (filter by nombre + nitRuc, case-insensitive)
  - [ ] `isLoading` → render skeleton rows with `data-testid="skeleton-row"` (3 rows, `react-loading-skeleton`)
  - [ ] `isError` → render `<ErrorPanel onRetry={refetch} />`
  - [ ] `!isLoading && !isError && filteredClientes.length === 0 && searchQuery === ''` → render `<EmptyState />`
  - [ ] `!isLoading && !isError && filteredClientes.length > 0` → render `<ul>` with `<ClienteListItem>` per client
  - [ ] Add `data-testid="clientes-list-panel"` to outer container
  - [ ] Search `<input>` with `placeholder="Buscar por nombre o NIT/RUC"` and `aria-label="Buscar clientes"`
  - [ ] Panel: `w-[280px] flex-shrink-0 flex flex-col h-full overflow-y-auto border-r border-slate-200`
- [ ] Run: `npx vitest run src/modules/crm/clientes/presentation/` — verify RED → GREEN

### Step 11 — Frontend: Route Integration

- [ ] Update `frontend/src/routes/_app/clientes.tsx` to use split-panel layout with `<ClienteListView />`

### Step 12 — E2E Verification

- [ ] Run: `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts` — verify all E2E tests pass

---

## Running Tests

```bash
# Frontend — Component tests for ClienteListView
npx vitest run frontend/src/modules/crm/clientes/presentation/-ClienteListView.test.tsx

# Frontend — Unit tests for useClientes hook
npx vitest run frontend/src/modules/crm/clientes/application/useClientes.test.ts

# Frontend — All component tests
npx vitest run frontend/src/modules/crm/clientes/

# Backend — Unit tests for ClienteEntity
dotnet test backend/tests/SiesaAgents.UnitTests --filter "ClienteEntityTests"

# Backend — Unit tests for GetClientesQueryHandler
dotnet test backend/tests/SiesaAgents.UnitTests --filter "GetClientesQueryHandlerTests"

# Backend — All unit tests
dotnet test backend/tests/SiesaAgents.UnitTests

# E2E — Story 2.1 tests (requires backend + frontend running)
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts

# Full test suite (RED phase confirmation)
npx vitest run && dotnet test backend/tests/SiesaAgents.UnitTests
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ Component tests created and failing: `-ClienteListView.test.tsx` (14 tests)
- ✅ Hook unit tests created and failing: `useClientes.test.ts` (10 tests)
- ✅ Domain entity unit tests created and failing: `ClienteEntityTests.cs` (11 tests)
- ✅ Query handler unit tests created and failing: `GetClientesQueryHandlerTests.cs` (10 tests)
- ✅ E2E tests created and failing: `clientes-list-search.spec.ts` (9 tests)
- ✅ Required `data-testid` attributes documented
- ✅ Implementation checklist created with ordered steps

**Expected Failure Reasons:**

- Frontend component tests: `Cannot find module './ClienteListView'` — component not yet created
- Hook tests: `Cannot find module './useClientes'` — hook not yet created
- Backend entity tests: `CS0246: The type or namespace 'ClienteEntity' could not be found`
- Backend handler tests: `CS0246: The type or namespace 'GetClientesQueryHandler' could not be found`
- E2E tests: Route `/clientes` renders placeholder heading instead of `ClienteListView`

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

Implement tasks in this order for fastest feedback:

1. **Backend Domain** (Step 1): `ClienteEntity` + `IClienteRepository` → run `ClienteEntityTests`
2. **Backend Application** (Step 2): `ClienteDto` + `GetClientesQuery` + `GetClientesQueryHandler` → run `GetClientesQueryHandlerTests`
3. **Backend Infrastructure + API** (Steps 3–5): Repository, DbContext, Endpoints, Migration
4. **Frontend Domain + Infrastructure** (Steps 6–7): `Cliente.ts` + `clienteApiRepository.ts`
5. **Frontend Hook** (Step 8): `useClientes.ts` → run `useClientes.test.ts`
6. **Frontend Components** (Step 9): `EmptyState`, `ErrorPanel`, `ClienteListItem`
7. **Frontend View** (Step 10): `ClienteListView.tsx` → run `-ClienteListView.test.tsx`
8. **Route** (Step 11): Update `/clientes` route
9. **E2E** (Step 12): Run full Playwright suite

---

### REFACTOR Phase (After All Tests Pass)

- [ ] Verify `useMemo` dependencies are correct: `[data, searchQuery]`
- [ ] Verify `queryKey: ['clientes']` is exact (used by mutations in 2.3–2.5)
- [ ] Verify `ErrorPanel` "Reintentar" button calls `refetch()` from TanStack Query
- [ ] Verify skeleton rows use `react-loading-skeleton` (not custom divs or spinner)
- [ ] Verify all user-facing text is in Spanish (company standard)
- [ ] Verify `data-testid` attributes match the documented list above
- [ ] Run `npx vitest run` — zero failures
- [ ] Run `dotnet test backend/tests/SiesaAgents.UnitTests` — zero failures
- [ ] Run `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts` — zero failures

---

## Coverage Summary

| AC | Story Criteria | Test Cases | Level |
|----|---------------|------------|-------|
| AC1 | Left panel, scrollable list, Nombre + NIT/RUC per item | TC-E2-P1-01 (5), ClienteEntityTests (11), GetClientesQueryHandlerTests (10), E2E (9) | Component + Unit + E2E |
| AC2 | Real-time filter by Nombre or NIT/RUC, case-insensitive, no extra API call | TC-E2-P1-02 (3), TC-E2-P1-03 (2), E2E (3) | Component + E2E |
| AC3 | EmptyState with Spanish guidance when list is empty | TC-E2-P1-04 (4), E2E (1) | Component + E2E |
| AC4 | ErrorPanel with "Reintentar" button on API failure | TC-E2-P1-05 (4), useClientes error tests (3) | Component + Hook |
| AC5 | Skeleton placeholders while loading, no spinner | Skeleton test (1), E2E (1) | Component + E2E |

**Total tests generated: 53**
- Component (Vitest + RTL + MSW): 14 in `-ClienteListView.test.tsx`
- Hook unit (Vitest + renderHook + MSW): 10 in `useClientes.test.ts`
- Backend unit — Domain (xUnit): 11 in `ClienteEntityTests.cs`
- Backend unit — Application (xUnit): 10 in `GetClientesQueryHandlerTests.cs`
- E2E (Playwright): 9 in `clientes-list-search.spec.ts`

---

## Notes

- The `-ClienteListView.test.tsx` prefix (`-`) follows TanStack Router `routeFileIgnorePrefix` convention established in Story 1.2. The router ignores files prefixed with `-`.
- The `queryKey: ['clientes']` is a critical contract. Tests verify the exact key to ensure that mutations in Stories 2.3–2.5 can call `invalidateQueries(['clientes'])` to refresh the list.
- `EmptyState` and `ErrorPanel` are checked against siesa-ui-kit first. If unavailable, they are created as shared components in `frontend/src/shared/components/`.
- The E2E test for AC3 (EmptyState) requires a clean database state. In CI, this is guaranteed by test isolation. Locally, it may need to be run against an empty DB.

---

**Generated by BMad TEA Agent** — 2026-05-24
