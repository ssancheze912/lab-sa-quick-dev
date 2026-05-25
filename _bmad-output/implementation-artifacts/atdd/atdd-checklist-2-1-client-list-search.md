# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-25
**Author:** sa-tea-atdd
**Primary Test Level:** Component (Vitest + RTL + MSW) + Unit (xUnit) + E2E (Playwright)

---

## Story Summary

Story 2.1 delivers the client list panel at `/clientes` with real-time client-side search by Nombre or NIT/RUC, EmptyState for no clients, and ErrorPanel with retry for backend failures. The split-panel layout (280px left panel + detail placeholder) is introduced here.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for.

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px) renders a scrollable list of all clients with Nombre and NIT/RUC visible per item (FR1, FR2).

2. **AC2** — Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (AC-E2.2, NFR1). No additional GET request is sent to the backend on each keystroke.

3. **AC3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed with a message guiding the user to create the first client (variant `no-clients`).

4. **AC4** — Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list; clicking "Reintentar" triggers a new fetch (NFR6).

5. **AC5** — Given the search field is cleared after a search, When the input becomes empty, Then the full client list is restored without triggering a new API call.

---

## Environment Constraints

**IMPORTANT:** The frontend module (`frontend/src/modules/crm/clientes/`) does not exist yet. The following adaptations apply:

- **Component tests** (Vitest + RTL + MSW): Will fail with `Cannot find module` because `ClienteListView`, `useClientes`, `EmptyState`, and `ErrorPanel` do not exist. These are valid RED-phase tests.
- **Backend unit tests** (xUnit InMemory): Will fail to compile because `SiesaAgents.Application.Clientes.*` and `SiesaAgents.Domain.Clientes.*` namespaces do not exist.
- **E2E tests** (Playwright): The file `e2e/tests/clientes/client-list-search.spec.ts` already exists and covers AC1, AC3, AC4 at E2E level. It will fail until backend + frontend are both implemented.

---

## Failing Tests Created (RED Phase)

### Component Tests — Vitest + RTL + MSW

**File:** `frontend/src/__tests__/clientes/ClienteListView.test.tsx`

**TC-E2-P1-06 — Real-time search by nombre (no extra API call):**

- **Test:** `Given the client list is loaded, When the user types in the search field, Then only matching clients appear`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC2 — Client-side filter by Nombre, no extra API call

- **Test:** `Given filtering is active, When the search field is cleared, Then the full list is restored`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC5 — Clear restores full list

- **Test:** `Given search is active, When input is cleared, Then no new API call is made (AC5)`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC5 — No API re-fetch on clear

**TC-E2-P1-07 — Real-time search by NIT/RUC partial match:**

- **Test:** `Given clients with known NITs, When user types NIT partial match, Then only matching client appears`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC2 — Client-side filter by NIT/RUC

- **Test:** `Given search by NIT, When no client matches the NIT, Then an empty state is shown for search`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC2 — Search with no results

- **Test:** `Given search by NIT, When no new API call is triggered on keystroke (TC-E2-P1-06 invariant)`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC2 — No API call on NIT keystrokes

**TC-E2-P2-01 — EmptyState displayed when no clients exist:**

- **Test:** `Given no clients in the system, When the user navigates to /clientes, Then EmptyState is rendered`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC3 — EmptyState visible with `data-testid="empty-state"`

- **Test:** `Given no clients, Then EmptyState shows "No hay clientes registrados" message`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC3 — Spanish guidance message in EmptyState

- **Test:** `Given no clients, Then no list items are rendered`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC3 — No `data-testid="cliente-list-item"` when empty

- **Test:** `Given no clients, Then EmptyState has aria-live="polite" for screen reader announcements`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC3 + WCAG 2.1 AA — `aria-live="polite"` on EmptyState

**TC-E2-P2-02 — ErrorPanel displayed on fetch failure:**

- **Test:** `Given the backend is unavailable, When the fetch fails, Then ErrorPanel is displayed instead of the list`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC4 — ErrorPanel visible with `data-testid="error-panel"`

- **Test:** `Given the backend is unavailable, Then "Reintentar" button is visible in ErrorPanel`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC4 — "Reintentar" button accessible by role

- **Test:** `Given ErrorPanel is shown, When user clicks "Reintentar", Then a new fetch is triggered`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC4 — Retry button triggers new GET /api/v1/clientes

- **Test:** `Given ErrorPanel is shown, When retry succeeds, Then ErrorPanel is replaced by the list or EmptyState`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC4 — ErrorPanel disappears after successful retry

- **Test:** `Given ErrorPanel, Then no raw error codes or stack traces are exposed in the UI`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC4 + NFR6 — No stack trace in UI

**TC-E2-P2-09 — 500-record filter under 1 second:**

- **Test:** `Given 500 clients loaded, When the user types in the search field, Then results appear in under 1000ms`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC2 + NFR1 — useMemo filter performance

**AC1 — Structural requirements:**

- **Test:** `Given clients exist, When the component renders, Then it shows Nombre and NIT/RUC per item`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC1 — Both Nombre and NIT visible per list item

- **Test:** `Given clients exist, When the component renders, Then aria-busy="true" is set while loading`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC1 + WCAG 2.1 AA — `aria-busy` during loading

- **Test:** `Given clients exist, Then the search input has aria-label="Buscar clientes"`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC1 + WCAG 2.1 AA — accessible search input label

- **Test:** `Given clients exist, Then the search container has role="search"`
  - **Status:** RED — `ClienteListView` module not found
  - **Verifies:** AC1 + WCAG 2.1 AA — search landmark present

---

### Hook Unit Tests — Vitest

**File:** `frontend/src/__tests__/clientes/useClientes.test.ts`

- **Test:** `Given the backend returns clients, When useClientes is called, Then data contains all clients`
  - **Status:** RED — `useClientes` module not found
  - **Verifies:** AC1 — Hook returns data array

- **Test:** `Given the backend returns clients, Then each client has the expected shape`
  - **Status:** RED — `useClientes` module not found
  - **Verifies:** AC1 — All DTO fields present in data

- **Test:** `Given the backend returns an empty array, When useClientes is called, Then data is an empty array`
  - **Status:** RED — `useClientes` module not found
  - **Verifies:** AC3 — Empty data triggers EmptyState

- **Test:** `Given the backend is unavailable, When useClientes is called, Then isError is true`
  - **Status:** RED — `useClientes` module not found
  - **Verifies:** AC4 — isError exposed for ErrorPanel

- **Test:** `Given the backend returns 500, When useClientes is called, Then isError is true`
  - **Status:** RED — `useClientes` module not found
  - **Verifies:** AC4 — 500 response treated as error

- **Test:** `Given useClientes, Then the hook exposes a refetch function`
  - **Status:** RED — `useClientes` module not found
  - **Verifies:** AC4 — refetch available for "Reintentar" button

- **Test:** `Given useClientes, Then the queryKey is ["clientes"] (canonical key — array form, NOT string)`
  - **Status:** RED — `useClientes` module not found
  - **Verifies:** Implementation constraint — array form queryKey required

---

### Backend Unit Tests — xUnit InMemory

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs`

- **Test:** `Create_SetsNombreCorrectly`
  - **Status:** RED — `SiesaAgents.Domain.Clientes.Entities` namespace not found
  - **Verifies:** AC1 — Entity factory sets Nombre

- **Test:** `Create_SetsNitCorrectly`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Entity factory sets Nit

- **Test:** `Create_SetsTelefonoCorrectly`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Entity factory sets Telefono

- **Test:** `Create_SetsCiudadCorrectly`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Entity factory sets Ciudad

- **Test:** `Create_AssignsNonEmptyGuidId`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Id is a non-empty Guid after creation

- **Test:** `Create_TwoCallsProduceDifferentIds`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Each entity gets a unique Id

- **Test:** `Create_SetsCreatedAtAsDateTimeOffset`
  - **Status:** RED — namespace not found
  - **Verifies:** Company rule — DateTimeOffset NEVER DateTime

- **Test:** `Create_SetsUpdatedAtAsDateTimeOffset`
  - **Status:** RED — namespace not found
  - **Verifies:** Company rule — DateTimeOffset NEVER DateTime

- **Test:** `Create_SetsCreatedAtToUtcNow`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Timestamp is UTC and near current time

- **Test:** `Create_SetsUpdatedAtEqualToCreatedAt_OnInitialCreation`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — UpdatedAt equals CreatedAt on new entity

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

- **Test:** `HandleAsync_ReturnsAllClients_WhenMultipleExist` (TC-E2-P1-02)
  - **Status:** RED — `SiesaAgents.Application.Clientes` namespace not found
  - **Verifies:** TC-E2-P1-02 — Handler returns all 5 seeded clients

- **Test:** `HandleAsync_ReturnsEmptyList_WhenNoClientsExist`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Empty database returns empty list (not null)

- **Test:** `HandleAsync_MapsNombreCorrectly_ToClienteDto`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Nombre mapped to DTO

- **Test:** `HandleAsync_MapsNitCorrectly_ToClienteDto`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — Nit mapped to DTO

- **Test:** `HandleAsync_MapsAllFieldsCorrectly_ToClienteDto`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — All 7 DTO fields populated

- **Test:** `HandleAsync_DtoIdMatchesEntityId`
  - **Status:** RED — namespace not found
  - **Verifies:** AC1 — DTO Id matches entity Id

- **Test:** `HandleAsync_ReturnsDtosWithDateTimeOffsetTimestamps`
  - **Status:** RED — namespace not found
  - **Verifies:** Company rule — DateTimeOffset in DTO output

---

### E2E Tests — Playwright (already exists)

**File:** `e2e/tests/clientes/client-list-search.spec.ts` *(pre-existing)*

- **Test:** `AC1 — should render the client list panel at /clientes`
  - **Status:** RED — frontend + backend not implemented
  - **Verifies:** AC1 — `data-testid="clientes-list-panel"` visible

- **Test:** `AC1 — should display client Nombre in the list item`
  - **Status:** RED — frontend + backend not implemented
  - **Verifies:** AC1 — Nombre visible in `data-testid="cliente-list-item"`

- **Test:** `AC1 — should display client NIT in the list item alongside the Nombre`
  - **Status:** RED — frontend + backend not implemented
  - **Verifies:** AC1 — NIT visible in `data-testid="cliente-list-item"`

- **Test:** `AC3 — should display EmptyState when no clients exist in the system`
  - **Status:** RED — frontend not implemented
  - **Verifies:** AC3 — `data-testid="empty-state"` visible when API returns []

- **Test:** `AC3 — EmptyState should contain a message to guide user to create first client`
  - **Status:** RED — frontend not implemented
  - **Verifies:** AC3 — Spanish guidance text in EmptyState

- **Test:** `AC4 — should display ErrorPanel when backend returns 500`
  - **Status:** RED — frontend not implemented
  - **Verifies:** AC4 — `data-testid="error-panel"` visible on 500

- **Test:** `AC4 — ErrorPanel should contain a "Reintentar" button`
  - **Status:** RED — frontend not implemented
  - **Verifies:** AC4 — Retry button in ErrorPanel

- **Test:** `AC4 — clicking "Reintentar" triggers a new fetch to GET /api/v1/clientes`
  - **Status:** RED — frontend not implemented
  - **Verifies:** AC4 — Retry triggers GET request

---

## Required `data-testid` Attributes

The following `data-testid` attributes must be present in the DOM for tests to pass:

| Component | `data-testid` | Usage |
|-----------|--------------|-------|
| `ClienteListView` container | `clientes-list-panel` | E2E: left panel visible assertion |
| `ClientListItem` | `cliente-list-item` | All tests: list items enumeration and filter assertions |
| `EmptyState` container | `empty-state` | AC3 tests: empty state visibility assertion |
| `ErrorPanel` container | `error-panel` | AC4 tests: error state visibility assertion |

---

## Data Factories

**Frontend (already exists):** `e2e/helpers/data.helper.ts` — `buildCliente()` factory

**Frontend component tests:** Inline `makeCliente()` and `makeClientes(count)` helpers in `ClienteListView.test.tsx`

**Backend unit tests:** Inline seeding using `ClienteEntity.Create()` in `GetClientesQueryHandlerTests.cs`

---

## Mock Requirements

| Level | Tool | Mock Target |
|-------|------|-------------|
| Component (Vitest) | MSW 2+ | `GET http://localhost:5000/api/v1/clientes` |
| Hook unit (Vitest) | MSW 2+ | `GET http://localhost:5000/api/v1/clientes` |
| Backend unit (xUnit) | EF Core InMemory | AppDbContext + IClienteRepository |
| E2E (Playwright) | `page.route()` | `**/api/v1/clientes` |

---

## Implementation Checklist

### Phase 1 — Backend Domain & Infrastructure (Tasks 8–11)

**Tasks to make backend unit tests pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Fields: `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Private constructor (EF Core)
  - [ ] Static `Create(string nombre, string nit, string telefono, string ciudad)` factory method
  - [ ] NEVER use `DateTime` — only `DateTimeOffset`

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Methods: `Task<IEnumerable<ClienteEntity>> GetAllAsync()` and `Task<ClienteEntity?> GetByIdAsync(Guid id)`

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
  - [ ] Record with: `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
  - [ ] Record with no parameters

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
  - [ ] Inject `IClienteRepository`, return all clients mapped to `ClienteDto`

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
  - [ ] Implements `IClienteRepository`, injects `AppDbContext`
  - [ ] `GetAllAsync`: `OrderByDescending(c => c.CreatedAt).ToListAsync()`

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
  - [ ] Table: `clientes`, PK: `id`, unique index: `uk_clientes_nit` on `nit`

- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`

- [ ] Register DI: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()` in `Program.cs`

- [ ] Run migration: `dotnet ef migrations add AddClienteEntity --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations` from `backend/`

- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] `GET /api/v1/clientes` → returns `Results.Ok(dtos)` (direct array, no wrapper)
  - [ ] Wire `app.MapClienteEndpoints()` in `Program.cs`

### Phase 2 — Frontend Domain, Repository & Hook (Tasks 1–3)

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`
  - [ ] Interface: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`

- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [ ] Interface: `getAll(): Promise<Cliente[]>` and `getById(id: string): Promise<Cliente>`

- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Axios implementation calling `GET /api/v1/clientes` via `apiClient`

- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] `useQuery` with `queryKey: ['clientes']` (array form — NOT string), `staleTime: 0`
  - [ ] Export: `data`, `isLoading`, `isError`, `refetch`

### Phase 3 — Frontend Shared Components (Tasks 5–6)

- [ ] Create `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `variant: 'no-clients' | 'search-empty' | 'no-contacts'`, `onAction?: () => void`
  - [ ] `data-testid="empty-state"` on root container
  - [ ] `aria-live="polite"` on root container
  - [ ] `no-clients` variant: title "No hay clientes registrados", subtitle "Crea el primer cliente del sistema", CTA "Nuevo cliente"

- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `message?: string`, `onRetry: () => void`
  - [ ] `data-testid="error-panel"` on root container
  - [ ] Default message: "No se pudo cargar la información"
  - [ ] "Reintentar" button calls `onRetry`
  - [ ] No raw error codes or stack traces exposed

- [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [ ] Props: `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`
  - [ ] `data-testid="cliente-list-item"` on root element
  - [ ] Shows `nombre` and `nit`
  - [ ] `role="button"`, `tabIndex={0}`, `aria-label="Ver cliente: {nombre}"`
  - [ ] Min height 44px (WCAG 2.1 AA touch target)
  - [ ] Keyboard handler for `Enter` and `Space`

### Phase 4 — Frontend ClienteListView Component (Task 4)

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Search input: `placeholder="Buscar por nombre o NIT..."`, `aria-label="Buscar clientes"`, in `role="search"` container
  - [ ] `useState<string>('')` for search term (NOT Zustand)
  - [ ] `useMemo` filter: `nombre.toLowerCase()` and `nit.toLowerCase()` against lower-cased term
  - [ ] Loading: 3 skeleton items (`react-loading-skeleton`)
  - [ ] `aria-busy="true"` on list container while `isLoading`
  - [ ] Error: `ErrorPanel` with `onRetry={refetch}`
  - [ ] Empty (data is []): `EmptyState` variant `no-clients`
  - [ ] Loaded: list of `ClientListItem` components
  - [ ] `data-testid="clientes-list-panel"` on panel container

### Phase 5 — Route Wiring (Task 7)

- [ ] Update `frontend/src/routes/_app/clientes.tsx`
  - [ ] Replace placeholder with split-panel layout
  - [ ] `ClienteListView` (280px fixed on `lg:`, full-width mobile)
  - [ ] Detail placeholder panel (flex-1) with "Selecciona un cliente para ver sus detalles"
  - [ ] `selectedId` state local to route (`useState`)

---

## Running Tests

```bash
# Frontend component tests (requires MSW — no backend)
cd /home/user/lab-sa-quick-dev/frontend
pnpm test -- src/__tests__/clientes/

# Backend unit tests (requires InMemory package — no real DB)
cd /home/user/lab-sa-quick-dev/backend
dotnet test tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~Clientes"

# E2E tests (requires frontend dev server + backend running)
cd /home/user/lab-sa-quick-dev
npx playwright test e2e/tests/clientes/client-list-search.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All tests are written and defined. Expected failure modes:

| Test File | Expected Failure |
|-----------|-----------------|
| `ClienteListView.test.tsx` (17 tests) | `Cannot find module '../../modules/crm/clientes/presentation/ClienteListView'` |
| `useClientes.test.ts` (7 tests) | `Cannot find module '../../modules/crm/clientes/application/useClientes'` |
| `ClienteEntityTests.cs` (10 tests) | `error CS0234: The type or namespace name 'Clientes' does not exist in 'SiesaAgents.Domain'` |
| `GetClientesQueryHandlerTests.cs` (7 tests) | `error CS0234: The type or namespace name 'Clientes' does not exist in 'SiesaAgents.Application'` |
| `client-list-search.spec.ts` (8 tests) | ECONNREFUSED or missing `data-testid` attributes in placeholder UI |

### GREEN Phase (DEV Team — Next Steps)

1. Implement Phase 1 (backend domain + infra + API endpoint)
2. Implement Phase 2 (frontend domain + repository + hook)
3. Implement Phase 3 (shared components: EmptyState, ErrorPanel, ClientListItem)
4. Implement Phase 4 (ClienteListView component)
5. Implement Phase 5 (route wiring)
6. Run all tests: `pnpm test` and `dotnet test`
7. Run E2E: `npx playwright test e2e/tests/clientes/`

### REFACTOR Phase (After All Tests Pass)

1. Verify all 49 tests pass (17 component + 7 hook + 10 domain + 7 application + 8 E2E)
2. Confirm `useMemo` filter does NOT fire new API calls (TC-E2-P1-06/07 invariant)
3. Verify `queryKey: ['clientes']` is array form (not string)
4. Confirm `ClienteEntity.CreatedAt` and `UpdatedAt` are `DateTimeOffset` (not `DateTime`)
5. Verify `uk_clientes_nit` unique index in migration output
6. Run `pnpm --dir frontend test` and `dotnet test backend/` and confirm 100% pass
7. Mark Story 2.1 status as `done`

---

## Acceptance Criteria Coverage Matrix

| AC | Description | Test Files | Test Count | Level |
|----|-------------|------------|------------|-------|
| AC1 | Left panel with Nombre + NIT per item, `aria-busy`, `role="search"`, `aria-label` | `ClienteListView.test.tsx`, `useClientes.test.ts`, `ClienteEntityTests.cs`, `GetClientesQueryHandlerTests.cs`, `client-list-search.spec.ts` | 4+3+10+7+3 = 27 | Component + Hook + Domain + App + E2E |
| AC2 | Real-time filter no API call, < 1s, 500 records | `ClienteListView.test.tsx` | 6+1 = 7 | Component |
| AC3 | EmptyState variant `no-clients` with Spanish message | `ClienteListView.test.tsx`, `client-list-search.spec.ts` | 4+2 = 6 | Component + E2E |
| AC4 | ErrorPanel + "Reintentar", retry triggers fetch, NFR6 | `ClienteListView.test.tsx`, `useClientes.test.ts`, `client-list-search.spec.ts` | 5+2+3 = 10 | Component + Hook + E2E |
| AC5 | Clear search restores list, no API call | `ClienteListView.test.tsx` | 2 | Component |

**Total: 49 tests across 5 files**

| File | Tests | Level |
|------|-------|-------|
| `frontend/src/__tests__/clientes/ClienteListView.test.tsx` | 17 | Component (Vitest + RTL + MSW) |
| `frontend/src/__tests__/clientes/useClientes.test.ts` | 7 | Hook Unit (Vitest + MSW) |
| `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs` | 10 | Domain Unit (xUnit InMemory) |
| `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` | 7 | Application Unit (xUnit InMemory) |
| `e2e/tests/clientes/client-list-search.spec.ts` | 8 | E2E (Playwright) — pre-existing |

---

## Next Steps

1. Share this checklist with the dev workflow (`sa-dev-story`)
2. Confirm RED phase: `pnpm --dir frontend test -- src/__tests__/clientes/ 2>&1 | head -20`
3. Implement tasks in order: backend domain → backend infra → backend API → frontend domain → components → route
4. When all tests pass, confirm TC-E2-P2-09 performance (500 records < 1s)
5. Update story `2-1-client-list-search.md` status to `done`

---

**Generated by sa-tea-atdd (testarch-atdd workflow)** — 2026-05-25
