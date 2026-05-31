# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-31
**Author:** BMad TEA Agent
**Primary Test Level:** Component (Vitest + RTL + MSW) + API Integration (xUnit + TestContainers)

---

## Story Summary

A commercial team member can navigate to `/clientes` and see a scrollable list of all clients with Nombre and NIT visible per item. The list can be filtered in real time by name or NIT/RUC without additional API calls. An EmptyState is displayed when there are no clients. An ErrorPanel with a "Reintentar" button is displayed if the backend is unavailable.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px wide) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **AC2** — Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC match (case-insensitive). No additional API call is triggered — filtering is client-side over TanStack Query cache.

3. **AC3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed with the Spanish message "No hay clientes aún. Crea el primero."

4. **AC4** — Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` with a "Reintentar" button is displayed. Clicking "Reintentar" triggers a new fetch.

5. **AC5** — Given the backend returns client data, When `GET /api/v1/clientes` is called, Then the response is a direct JSON array where each item contains `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (DateTimeOffset ISO 8601), `updatedAt` (DateTimeOffset ISO 8601).

---

## Failing Tests Created (RED Phase)

### Component Tests (Vitest + RTL + MSW) — 16 tests

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

#### TC-E2-P1-04: Client list renders with Nombre and NIT per item (4 tests)

- **Test:** `Given GET /api/v1/clientes returns 2 clients, When ClienteListView renders, Then both Nombre values are visible`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC1 — Nombre visible per item

- **Test:** `Given GET /api/v1/clientes returns 2 clients, When ClienteListView renders, Then both NIT values are visible`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC1 — NIT visible per item

- **Test:** `Given GET /api/v1/clientes returns 2 clients, When ClienteListView renders, Then left panel has data-testid="cliente-list-panel"`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC1 — panel container present

- **Test:** `Given data is loaded, When ClienteListView renders, Then loading skeleton is no longer shown`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC1 — skeleton clears when data resolves

#### TC-E2-P1-05: Real-time search filter by Nombre and NIT (5 tests)

- **Test:** `Given 3 clients loaded, When user types "Alpha" in the search field, Then only "Empresa Alpha" is visible`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC2 — filter by Nombre

- **Test:** `Given 3 clients loaded, When user types "222" in the search field, Then only "Beta Corp" (NIT 222...) is visible`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC2 — filter by NIT

- **Test:** `Given 3 clients loaded and search is active, When user clears the search field, Then all clients are visible again`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC2 — clearing filter restores full list

- **Test:** `Given 3 clients loaded, When user types in the search field, Then no additional fetch to /api/v1/clientes is triggered`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC2 — client-side filtering (MSW fetch count stays at 0 during typing)

- **Test:** `Given search is case-sensitive concern, When user types "alpha" (lowercase), Then "Empresa Alpha" is still visible`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC2 — case-insensitive filtering

#### TC-E2-P1-06: EmptyState displayed when no clients exist (3 tests)

- **Test:** `Given GET /api/v1/clientes returns empty array, When ClienteListView renders, Then EmptyState is rendered`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC3 — EmptyState component rendered

- **Test:** `Given no clients, When ClienteListView renders, Then EmptyState contains Spanish guidance message`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC3 — exact text "No hay clientes aún. Crea el primero."

- **Test:** `Given no clients, When ClienteListView renders, Then no client list items are rendered`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC3 — no list items when empty

#### TC-E2-P1-07: ErrorPanel with "Reintentar" on fetch failure (4 tests)

- **Test:** `Given GET /api/v1/clientes returns network error, When ClienteListView renders, Then ErrorPanel is displayed`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC4 — ErrorPanel shown on fetch failure

- **Test:** `Given fetch fails, When ErrorPanel is shown, Then "Reintentar" button is visible`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC4 — "Reintentar" button present

- **Test:** `Given ErrorPanel is shown, When user clicks "Reintentar" and backend recovers, Then client list renders`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC4 — retry triggers new fetch and renders list

- **Test:** `Given fetch fails, When ErrorPanel is shown, Then error message is in Spanish`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC4 — exact text "No se pudo cargar la lista de clientes."

#### Loading state tests (2 tests)

- **Test:** `Given ClienteListView is mounted, When fetch is in-flight, Then skeleton placeholders are rendered`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC1 — loading skeleton shown during initial fetch

- **Test:** `Given ClienteListView is loading, When loading skeleton renders, Then ARIA label "Cargando clientes..." is present`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** WCAG 2.1 AA — ARIA label on loading container

#### Search field accessibility (1 test)

- **Test:** `Given ClienteListView is rendered, When data loads, Then search field has aria-label "Buscar clientes"`
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** WCAG 2.1 AA — search field ARIA label

---

### API Integration Tests (xUnit + TestContainers) — 10 tests

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs`

#### TC-E2-P1-01: GET /api/v1/clientes returns all clients as array

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenReturns200OK`
  - **Status:** RED — `ClienteEntity`, `ClienteRepository`, and `GET /api/v1/clientes` do not exist; `Program` class not exposed
  - **Verifies:** AC5 — HTTP 200 response

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenResponseBodyIsJsonArray`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — direct JSON array (no wrapper object)

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenResponseContainsAllThreeClients`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — all seeded clients returned

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsIdField`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — `id` field present and is a valid UUID

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsNombreField`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — `nombre` field present and non-empty

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsNitField`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — `nit` field present and non-empty

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsTelefonoField`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — `telefono` field present

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsCiudadField`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — `ciudad` field present

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsCreatedAtAsIso8601`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — `createdAt` as valid DateTimeOffset ISO 8601 string

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsUpdatedAtAsIso8601`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — `updatedAt` as valid DateTimeOffset ISO 8601 string

- **Test:** `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenContentTypeIsApplicationJson`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — Content-Type: application/json

- **Test:** `GivenNoClientsInDatabase_WhenGetApiV1Clientes_ThenReturns200WithEmptyArray`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC5 — empty array on 0 clients (not 404)

---

## Required data-testid Attributes

The following `data-testid` attributes must be added to the implementation for tests to pass:

| Component | data-testid | Purpose |
|-----------|-------------|---------|
| ClienteListView — root panel | `cliente-list-panel` | Left panel container |
| ClienteListView — list items | `cliente-list-item` | Individual client row |
| ClienteListView — skeleton container | `cliente-list-skeleton` | Loading state container |
| EmptyState | `empty-state` | Empty state component |
| ErrorPanel | `error-panel` | Error state component |

---

## Required ARIA Attributes

| Element | ARIA | Value |
|---------|------|-------|
| Search input | `aria-label` | `"Buscar clientes"` |
| Search input | `role` (implicit) | `searchbox` |
| Skeleton container | `aria-label` | `"Cargando clientes..."` |
| ErrorPanel | `role` | `alert` |
| EmptyState | `role` | `status` |

---

## MSW Handler Requirements

The frontend tests use MSW to intercept `GET /api/v1/clientes`. The MSW server is set up in `setupServer()` **before** rendering (network-first pattern).

The API base URL used in tests is `http://localhost:5000`. The `clienteApiRepository` must use `apiClient` with `baseURL: import.meta.env.VITE_API_URL`. For tests, ensure `VITE_API_URL` resolves to `http://localhost:5000` or the MSW handler must match the exact URL the repository uses.

**Recommendation:** In `clienteApiRepository.ts`, use a relative path `/api/v1/clientes` and configure the `baseURL` on `apiClient`. MSW handlers must intercept the full resolved URL.

---

## Implementation Checklist

### Backend — Make TC-E2-P1-01 tests pass

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs`

- [ ] Create `backend/tests/SiesaAgents.IntegrationTests/` project (csproj already created by ATDD workflow)
- [ ] Add project to solution: `dotnet sln add tests/SiesaAgents.IntegrationTests`
- [ ] Create `ClienteEntity` in `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` per Dev Notes pattern
- [ ] Create `IClienteRepository` in `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with `GetAllAsync()`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`
- [ ] Create `ClienteConfiguration.cs` in `SiesaAgents.Infrastructure/Data/Configurations/`
- [ ] Create `ClienteDto.cs` in `SiesaAgents.Application/Clientes/DTOs/`
- [ ] Create `GetClientesQuery.cs` and `GetClientesQueryHandler.cs` in `SiesaAgents.Application/Clientes/Queries/`
- [ ] Create `ClienteRepository.cs` in `SiesaAgents.Infrastructure/Repositories/`
- [ ] Create `ClienteEndpoints.cs` in `SiesaAgents.API/Endpoints/` — register `GET /api/v1/clientes`
- [ ] Register DI in `Program.cs`: `IClienteRepository -> ClienteRepository`, `GetClientesQueryHandler`
- [ ] Call `app.MapClienteEndpoints()` in `Program.cs`
- [ ] Expose `Program` to tests: add `public partial class Program {}` at bottom of `Program.cs`
- [ ] Run integration tests: `dotnet test backend/tests/SiesaAgents.IntegrationTests/`
- [ ] Verify all 12 integration tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Frontend — Make TC-E2-P1-04 through TC-E2-P1-07 tests pass

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios impl
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook (`retry: false` or configured, `queryKey: ['clientes']`)
- [ ] Check siesa-ui-kit for `EmptyState`, `ErrorPanel`, `Input` components
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` (if not in siesa-ui-kit) — `data-testid="empty-state"`, `role="status"`
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` (if not in siesa-ui-kit) — `data-testid="error-panel"`, `role="alert"`, "Reintentar" button
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — `data-testid="cliente-list-item"`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
  - `data-testid="cliente-list-panel"` on root container
  - `w-[280px]` + `overflow-y-auto`
  - Search input: `placeholder="Buscar cliente..."`, `aria-label="Buscar clientes"`, `role="searchbox"`
  - `useMemo` filter (case-insensitive `nombre` and `nit`)
  - Skeleton on `isLoading`: `data-testid="cliente-list-skeleton"`, `aria-label="Cargando clientes..."`
  - `EmptyState` when `data.length === 0`
  - `ErrorPanel` on `isError` with `onRetry={() => refetch()}`
- [ ] Run component tests: `pnpm test` in `frontend/`
- [ ] Verify all 17 component tests pass (green phase)

**Estimated Effort:** 3 hours

---

## Running Tests

```bash
# Run all component tests for Story 2.1
cd frontend && pnpm test src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx

# Run in watch mode
cd frontend && pnpm test:watch

# Run backend integration tests
dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "FullyQualifiedName~ClienteEndpointsTests"

# Run all backend tests
dotnet test backend/SiesaAgents.sln

# Run with verbose output
dotnet test backend/tests/SiesaAgents.IntegrationTests/ --logger "console;verbosity=normal"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All tests written and failing:

- Component tests fail with: `Cannot find module '../ClienteListView'` (component does not exist)
- Integration tests fail with: compile error — `SiesaAgents.Domain.Clientes.Entities.ClienteEntity` not found; `AppDbContext.Clientes` property does not exist
- Both test files reference implementations that do not yet exist

**Verification:**
- Frontend: `pnpm test` → `Error: Failed to resolve import "../ClienteListView"`
- Backend: `dotnet test` → `CS0246: The type or namespace name 'ClienteEntity' could not be found`

---

### GREEN Phase (DEV Team — Next Steps)

1. Start with backend:
   a. Create `ClienteEntity` → run `GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenReturns200OK` → should fail with 404 (endpoint missing)
   b. Create endpoint → run same test → should pass
   c. Work through remaining field-presence tests one by one

2. Then frontend:
   a. Create `ClienteListView` with skeleton only → run TC-E2-P1-04 tests → fail on data absence
   b. Add `useClientes` hook → add list rendering → tests pass one by one
   c. Add search filter → TC-E2-P1-05 tests pass
   d. Add `EmptyState` → TC-E2-P1-06 tests pass
   e. Add `ErrorPanel` → TC-E2-P1-07 tests pass

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 29 tests pass (17 component + 12 integration)
2. Confirm no `any` types in TypeScript
3. Confirm `useMemo` filter does not mutate `data` array
4. Confirm `staleTime` set on `queryClient` (1 minute default per architecture)
5. Run `pnpm build` — zero TS errors, bundle < 500KB gzip
6. Run `dotnet build SiesaAgents.sln` — 0 Warnings, 0 Errors

---

## Test Coverage Summary

| AC | Test Case IDs | Level | Tests |
|----|--------------|-------|-------|
| AC1 — List with Nombre + NIT per item | TC-E2-P1-04 | Component | 6 |
| AC2 — Real-time client-side search | TC-E2-P1-05 | Component | 5 |
| AC3 — EmptyState on empty list | TC-E2-P1-06 | Component | 3 |
| AC4 — ErrorPanel + Reintentar | TC-E2-P1-07 | Component | 4 |
| AC5 — GET /api/v1/clientes shape | TC-E2-P1-01 | API Integration | 12 |

**Total tests in RED phase:** 30 (17 component + 12 integration, + 1 test from TC-E2-P1-07 retry flow)

---

## Knowledge Base References Applied

- **Given-When-Then naming** — all test names follow the GWT pattern
- **Network-first intercepts** — MSW `setupServer()` called in `beforeAll`, handlers set before `render()`
- **data-testid selectors** — all assertions use `data-testid`, `role`, `placeholder`, or accessible text; no CSS class selectors
- **No hard waits** — `waitFor()` with explicit conditions; no `setTimeout` or fixed delays
- **RED phase confirmed** — tests reference non-existent modules; they will fail at import resolution

---

**Generated by BMad TEA Agent** — 2026-05-31
