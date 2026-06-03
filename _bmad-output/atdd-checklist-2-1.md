# ATDD Checklist — Story 2.1: Client List & Search

**Date:** 2026-06-03
**Epic:** 2 — Client Management
**Story:** 2.1 — Client List & Search
**Author:** TEA Agent (sa-tea-atdd)
**Status:** RED phase — all tests generated and failing

---

## Story Summary

**As a** commercial team member,
**I want** to see a list of all clients and search them by name or NIT/RUC,
**So that** I can quickly find the client I'm looking for.

---

## Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | There are clients in the system | User navigates to `/clientes` | Left panel (280px) shows scrollable list with Nombre and NIT/RUC per item |
| AC2 | The client list is loaded | User types in the search field | List filters in real time by Nombre or NIT/RUC in under 1 second with up to 500 records |
| AC3 | There are no clients in the system | User navigates to `/clientes` | `EmptyState` component displayed with guidance to create first client |
| AC4 | Backend is unavailable on page load | GET `/api/v1/clientes` fetch fails | `ErrorPanel` with "Reintentar" button shown; clicking triggers refetch |
| AC5 | Client list renders | User has not set any sort preference | Clients displayed in "Más reciente" order (newest `createdAt` first) by default |

---

## Failing Tests Created (RED Phase)

### Frontend Component Tests — Vitest + RTL + MSW

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

#### TC-E2-P1-07 — Real-time Search Filters Client List

- **Test:** `Given 10 clients loaded, When "Banco" is typed, Then only "Banco Nacional" is shown`
  - **Status:** RED — `ClienteListView` does not exist; import fails
  - **Verifies:** AC2 — search filters by nombre

- **Test:** `Given search active, When search is cleared, Then all 10 clients are shown again`
  - **Status:** RED — same
  - **Verifies:** AC2 — clearing search restores full list

- **Test:** `Given clients loaded, When a NIT fragment "800100200" is typed, Then "Banco Nacional" is found by NIT`
  - **Status:** RED — same
  - **Verifies:** AC2 — NIT-based filtering works independently

- **Test:** `Given search active, When typing, Then no additional API calls are triggered`
  - **Status:** RED — same
  - **Verifies:** AC2 — search is client-side only, no new API calls

#### TC-E2-P1-08 — EmptyState Rendered When No Clients Exist

- **Test:** `Given GET /api/v1/clientes returns [], When the page loads, Then EmptyState component is rendered`
  - **Status:** RED — `ClienteListView` and `EmptyState` do not exist
  - **Verifies:** AC3 — EmptyState shown on empty list

- **Test:** `Given empty list, When EmptyState renders, Then no client list items are shown`
  - **Status:** RED — same
  - **Verifies:** AC3 — no phantom list items

- **Test:** `Given empty list, When EmptyState renders, Then a message guides user to create first client`
  - **Status:** RED — same
  - **Verifies:** AC3 — instructional text present

#### TC-E2-P1-09 — ErrorPanel Rendered When Backend Is Unavailable

- **Test:** `Given backend returns 500, When the page loads, Then ErrorPanel is rendered`
  - **Status:** RED — `ClienteListView` and `ErrorPanel` do not exist
  - **Verifies:** AC4 — ErrorPanel shown on fetch failure

- **Test:** `Given ErrorPanel rendered, When rendered, Then "Reintentar" button is visible`
  - **Status:** RED — same
  - **Verifies:** AC4 — Reintentar button present

- **Test:** `Given ErrorPanel rendered, When "Reintentar" is clicked, Then a new GET /api/v1/clientes request is made`
  - **Status:** RED — same
  - **Verifies:** AC4 — retry triggers refetch

- **Test:** `Given backend error, When ErrorPanel renders, Then raw error message is NOT displayed`
  - **Status:** RED — same
  - **Verifies:** AC4 — error isolation (NFR6)

#### TC-E2-P1-14 — Default Sort Order is "Más reciente"

- **Test:** `Given clients with different createdAt dates, When rendered with no sort preference, Then newest client appears first`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC5 — default sort is fecha-desc (newest first)

- **Test:** `Given clients rendered, When no sort preference is set, Then SortControl shows "Más reciente" as default`
  - **Status:** RED — same
  - **Verifies:** AC5 — sort control reflects default value

#### TC-E2-P3-03 — Search Input Does Not Drop Keystrokes

- **Test:** `Given 20 clients loaded, When 5 characters are typed rapidly, Then final filter matches the full 5-character term`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC2 — no dropped keystrokes under rapid input

#### TC-E2-P3-04 — Search Performance ≤ 150ms with 500 Records

- **Test:** `Given 500 clients loaded, When search filter is applied, Then re-render completes in ≤ 150ms`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** NFR1 — search < 1s with 500 records (component-level: ≤ 150ms)

#### AC1 — List renders with Nombre and NIT visible per item

- **Test:** `Given clients loaded, When the list renders, Then each item shows Nombre and NIT`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC1 — Nombre and NIT/RUC visible per item

- **Test:** `Given clients loaded, When the list renders, Then the search input has the correct placeholder`
  - **Status:** RED — same
  - **Verifies:** AC1 — search input with correct placeholder text

#### Loading State — Skeleton Placeholders

- **Test:** `Given the list is loading, When ClienteListView is first rendered, Then skeleton placeholders are visible`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** Story task 7 — 3 skeleton rows during loading

---

### Frontend Unit Tests — Vitest + renderHook

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`

#### TC-E2-P3-01 — useClientes Hook Returns Correct Query Key

- **Test:** `should use queryKey ["clientes"] when fetching clients`
  - **Status:** RED — `useClientes` hook does not exist at `application/useClientes.ts`
  - **Verifies:** Story task 3 — queryKey is `['clientes']`

- **Test:** `should expose isLoading, isError, and refetch from the hook`
  - **Status:** RED — same
  - **Verifies:** Story task 3 — hook exposes correct shape

- **Test:** `should call GET /api/v1/clientes endpoint`
  - **Status:** RED — same
  - **Verifies:** Story task 2 — repository calls correct endpoint

---

### Frontend Shared Component Tests — Vitest + RTL

**File:** `frontend/src/shared/components/__tests__/EmptyState.test.tsx`

- **Test:** `When rendered with a title, Then the title text is visible`
  - **Status:** RED — `EmptyState.tsx` does not exist
  - **Verifies:** AC3 — EmptyState renders title prop

- **Test:** `When rendered with a description, Then the description is visible`
  - **Status:** RED — same
  - **Verifies:** AC3 — EmptyState renders description prop

- **Test:** `When rendered without description, Then only title is shown without error`
  - **Status:** RED — same
  - **Verifies:** AC3 — description is optional

- **Test:** `When rendered with an action slot, Then the action is rendered`
  - **Status:** RED — same
  - **Verifies:** Story task 4 — action/CTA slot works

- **Test:** `When rendered with data-testid, Then it can be queried by testid`
  - **Status:** RED — same
  - **Verifies:** Selector resilience pattern

**File:** `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx`

- **Test:** `When rendered, Then the "Reintentar" button is visible`
  - **Status:** RED — `ErrorPanel.tsx` does not exist
  - **Verifies:** AC4 — Reintentar button present

- **Test:** `When the "Reintentar" button is clicked, Then onRetry callback is called`
  - **Status:** RED — same
  - **Verifies:** AC4 — retry callback wired correctly

- **Test:** `When rendered, Then the default Spanish error message is displayed`
  - **Status:** RED — same
  - **Verifies:** Story task 5 — Spanish default message

- **Test:** `When rendered with a custom message, Then custom message overrides default`
  - **Status:** RED — same
  - **Verifies:** Story task 5 — message prop works

- **Test:** `When rendered, Then raw error message or stack trace is NOT displayed`
  - **Status:** RED — same
  - **Verifies:** AC4 + NFR6 — error isolation

- **Test:** `When rendered with data-testid, Then it can be queried by testid`
  - **Status:** RED — same
  - **Verifies:** Selector resilience pattern

---

### Backend Unit Tests — xUnit + EF Core InMemory

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`

- **Test:** `Create_ShouldSetAllFields_WhenCalledWithValidParameters`
  - **Status:** RED — `ClienteEntity` class does not exist at `Domain/Clientes/Entities/ClienteEntity.cs`
  - **Verifies:** Story task 9 — ClienteEntity.Create() factory method

- **Test:** `Create_ShouldAssignNonEmptyGuid_ForId`
  - **Status:** RED — same
  - **Verifies:** Story task 9 — Id is non-empty Guid

- **Test:** `Create_ShouldSetCreatedAt_AsDateTimeOffset`
  - **Status:** RED — same
  - **Verifies:** Story task 9 — DateTimeOffset (not DateTime)

- **Test:** `Create_ShouldSetUpdatedAt_AsDateTimeOffset`
  - **Status:** RED — same
  - **Verifies:** Story task 9 — DateTimeOffset for UpdatedAt

- **Test:** `Create_ShouldGenerateUniqueIds_ForEachInstance`
  - **Status:** RED — same
  - **Verifies:** Story task 9 — unique Guid per entity

- **Test:** `Create_ShouldReturnClienteEntityInstance`
  - **Status:** RED — same
  - **Verifies:** Story task 9 — return type is ClienteEntity

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

#### TC-E2-P1-01 — GET /api/v1/clientes Returns List of All Clients

- **Test:** `HandleAsync_ShouldReturnAllClientes_WhenThreeClientsSeeded`
  - **Status:** RED — `GetClientesQueryHandler`, `ClienteDto`, `AppDbContext.Clientes` do not exist
  - **Verifies:** TC-E2-P1-01 — returns all 3 seeded clients

- **Test:** `HandleAsync_ShouldMapFieldsCorrectly_FromEntityToDto`
  - **Status:** RED — same
  - **Verifies:** AC1 — correct field mapping to ClienteDto

- **Test:** `HandleAsync_ShouldReturnClientes_OrderedByCreatedAtDescending`
  - **Status:** RED — same
  - **Verifies:** AC5 — default sort order is fecha-desc

#### TC-E2-P2-07 — GET /api/v1/clientes Returns Empty Array When No Clients

- **Test:** `HandleAsync_ShouldReturnEmptyList_WhenNoDatabaseRecords`
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** TC-E2-P2-07 — returns `[]` not null or 404

- **Test:** `HandleAsync_ShouldReturnClienteDtos_NotEntities`
  - **Status:** RED — same
  - **Verifies:** AC1 — response shape is DTOs, not raw entities

---

## Test Summary

| Level | File | Count | Test Case IDs |
|-------|------|-------|---------------|
| Component (Vitest + RTL + MSW) | `ClienteListView.test.tsx` | 15 | TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09, TC-E2-P1-14, TC-E2-P3-03, TC-E2-P3-04, AC1 |
| Unit (Vitest + renderHook) | `useClientes.test.ts` | 3 | TC-E2-P3-01 |
| Component (Vitest + RTL) | `EmptyState.test.tsx` | 5 | AC3 |
| Component (Vitest + RTL) | `ErrorPanel.test.tsx` | 6 | AC4 |
| Unit (xUnit) | `ClienteEntityTests.cs` | 6 | Story task 9 |
| API/Unit (xUnit + InMemory) | `GetClientesQueryHandlerTests.cs` | 5 | TC-E2-P1-01, TC-E2-P2-07 |
| **Total** | | **40** | |

---

## data-testid Attributes Required

The following `data-testid` attributes must be present in the implementation for tests to pass:

| Component | data-testid | Purpose |
|-----------|-------------|---------|
| `ClienteListView` | `cliente-list` | Container for the client list |
| `ClienteListView` | `cliente-list-item` | Each client row (multiple) |
| `ClienteListView` | `cliente-list-skeleton` | Loading skeleton container |
| `ClienteListView` | `sort-control` | Sort dropdown/select element |
| `EmptyState` | `empty-state` | EmptyState root element |
| `ErrorPanel` | `error-panel` | ErrorPanel root element |

---

## aria-label / placeholder Attributes Required

| Element | Attribute | Value |
|---------|-----------|-------|
| Search input | `aria-label` | `"Buscar clientes"` |
| Search input | `placeholder` | `"Buscar por nombre o NIT/RUC"` |

---

## MSW Handler Pattern Used

```typescript
// Network-first intercept (MSW intercepts before navigation/render)
server.use(
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
)
```

All MSW handlers use wildcard prefix (`*/api/v1/clientes`) to work with any base URL configured in `VITE_API_URL`.

---

## Mock Requirements

### Frontend (MSW)
- `GET */api/v1/clientes` → JSON array of clients (various scenarios: populated, empty, error)
- No other endpoints required for Story 2.1 tests

### Backend (EF Core InMemory)
- `Microsoft.EntityFrameworkCore.InMemory` already in `SiesaAgents.UnitTests.csproj`
- `ClienteEntity.Create(...)` factory method required to seed test data

---

## Data Factories Used

- `createCliente(overrides?)` — single client with faker values + optional overrides
- `createClientes(count, overrides?)` — array of N clients
- `createClientesForSortTest()` — returns `[oldest, middle, newest]` with distinct `createdAt` dates

Source: `frontend/src/shared/factories/cliente.factory.ts` (already exists)

---

## Implementation Checklist (GREEN Phase — DEV Agent)

### To make frontend Component tests GREEN:

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — Cliente interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — repository contract
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — calls `GET /api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook with `queryKey: ['clientes']`
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` — props: `title`, `description?`, `action?`, `data-testid?`
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — props: `onRetry`, `message?`, `data-testid?`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
  - `data-testid="cliente-list"` on list container
  - `data-testid="cliente-list-item"` on each client row
  - `data-testid="cliente-list-skeleton"` on skeleton container
  - `data-testid="sort-control"` on sort select element
  - `aria-label="Buscar clientes"` on search input
  - `placeholder="Buscar por nombre o NIT/RUC"` on search input
  - `useMemo` filter: case-insensitive match on `nombre` and `nit`
  - Default sort: `fecha-desc` (newest `createdAt` first)
  - Renders `<EmptyState data-testid="empty-state" ... />` when data is `[]`
  - Renders `<ErrorPanel data-testid="error-panel" onRetry={refetch} />` when `isError`
  - Renders skeleton with `data-testid="cliente-list-skeleton"` when `isLoading`

### To make backend tests GREEN:

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`:
  - Static factory: `Create(nombre, nit, telefono, ciudad): ClienteEntity`
  - All fields typed as `Guid`, `string`, `DateTimeOffset` (never `int`, `DateTime`)
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`:
  - Constructor: `GetClientesQueryHandler(AppDbContext context)`
  - `HandleAsync()`: `await _context.Clientes.OrderByDescending(c => c.CreatedAt).ToListAsync()` mapped to `ClienteDto`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`
- [ ] Create `ClienteConfiguration.cs` in Infrastructure/Data/Configurations

---

## Running Tests

```bash
# Frontend — all Story 2.1 tests (RED phase)
cd frontend && pnpm test -- --reporter=verbose src/modules/crm/clientes src/shared/components/__tests__/EmptyState src/shared/components/__tests__/ErrorPanel

# Frontend — specific component tests
pnpm test -- ClienteListView.test.tsx
pnpm test -- useClientes.test.ts
pnpm test -- EmptyState.test.tsx
pnpm test -- ErrorPanel.test.tsx

# Backend — Domain unit tests (RED phase)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ClienteEntityTests"

# Backend — Application unit tests (RED phase)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~GetClientesQueryHandlerTests"

# Backend — all Story 2.1 tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ClienteEntityTests|FullyQualifiedName~GetClientesQueryHandlerTests"
```

---

## RED Phase Verification

### Expected Frontend Failures

All tests in `ClienteListView.test.tsx`, `useClientes.test.ts`, `EmptyState.test.tsx`, and `ErrorPanel.test.tsx` will fail with:

```
Error: Failed to resolve import "../ClienteListView" from "src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx"
Error: Failed to resolve import "../useClientes" from "src/.../useClientes.test.ts"
Error: Failed to resolve import "../EmptyState" from "src/shared/components/__tests__/EmptyState.test.tsx"
Error: Failed to resolve import "../ErrorPanel" from "src/shared/components/__tests__/ErrorPanel.test.tsx"
```

These are import failures at module resolution — the RED phase is confirmed by missing implementation files.

### Expected Backend Failures

All tests in `ClienteEntityTests.cs` and `GetClientesQueryHandlerTests.cs` will fail with:

```
Build FAILED.
error CS0246: The type or namespace name 'ClienteEntity' could not be found
             (are you missing a using directive or an assembly reference?)
error CS0246: The type or namespace name 'GetClientesQueryHandler' could not be found
error CS0246: The type or namespace name 'ClienteDto' could not be found
```

Compilation failure confirms RED phase — `ClienteEntity`, `GetClientesQueryHandler`, and `ClienteDto` do not yet exist.

---

## Notes

- Story 2.1 has no E2E (Playwright) tests in scope for this story's ATDD phase. E2E tests (TC-E2-P1-12 for deep linking) belong to Story 2.2, and full CRUD E2E flows (TC-E2-P2-09, TC-E2-P2-10) belong to Stories 2.3 and 2.5.
- The `@faker-js/faker` package is referenced in the factory. If not installed, run: `pnpm --filter frontend add -D @faker-js/faker`
- MSW server setup uses `server.listen({ onUnhandledRequest: 'bypass' })` to avoid noise from unrelated requests.
- The `sort-control` data-testid expects a `<select>` element (or equivalent) with value `fecha-desc` by default. The `SortControl` shared component (Story 2.6) may replace the simple `<select>` — when it does, update the selector to match.
- Backend `GetClientesQueryHandlerTests` uses `AppDbContext` directly (not through `IClienteRepository`) to keep tests isolated from infrastructure, following the existing `AppDbContextTests.cs` pattern in this project.

---

**Generated by TEA Agent (sa-tea-atdd)** — 2026-06-03
