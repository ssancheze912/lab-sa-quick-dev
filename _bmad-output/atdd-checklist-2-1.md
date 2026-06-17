# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-17
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + API Integration (xUnit)

---

## Story Summary

Commercial team members need to quickly find clients from a searchable list displayed in a 280px left panel at `/clientes`. The list filters in real time (< 1s for 500 records) without additional API calls. When no clients exist, an EmptyState guides the user; when the backend is unavailable, an ErrorPanel with a Reintentar button is shown.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given clients exist, when the user navigates to `/clientes`, then the left panel (280px) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.
2. **AC2** — Given the client list is loaded, when the user types in the search field, then the list filters in real time showing only clients whose Nombre or NIT/RUC match (case-insensitive), and results appear in under 1 second with up to 500 records (NFR1).
3. **AC3** — Given there are no clients, when the user navigates to `/clientes`, then an `EmptyState` component is displayed with a message guiding the user to create the first client.
4. **AC4** — Given the backend is unavailable, when the fetch fails, then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list.

---

## Failing Tests Created (RED Phase)

### E2E Tests (17 tests)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

- **Test:** `should show scrollable client list in the left panel when clients exist`
  - **Status:** RED — `[data-testid="clientes-list-panel"]` does not exist (component not built)
  - **Verifies:** AC1 — list panel visibility

- **Test:** `should display client Nombre in each list item`
  - **Status:** RED — `[data-testid="cliente-list-item"]` does not exist
  - **Verifies:** AC1 — Nombre visible in list item

- **Test:** `should display client NIT/RUC in each list item`
  - **Status:** RED — `[data-testid="cliente-list-item"]` does not exist
  - **Verifies:** AC1 — NIT/RUC visible in list item

- **Test:** `should have the left panel with a fixed width of 280px`
  - **Status:** RED — panel does not exist / width not constrained
  - **Verifies:** AC1 — 280px width requirement

- **Test:** `should have a search input with correct aria-label for accessibility`
  - **Status:** RED — search input not rendered
  - **Verifies:** AC1 + WCAG 2.1 AA — accessible search input

- **Test:** `should render client list with role="list" and items with role="listitem"`
  - **Status:** RED — list container not rendered
  - **Verifies:** AC1 + WCAG 2.1 AA — list semantics

- **Test:** `should filter client list by Nombre when user types in search field`
  - **Status:** RED — filtering logic not implemented
  - **Verifies:** AC2 — Nombre filtering

- **Test:** `should filter client list by NIT/RUC when user types in search field`
  - **Status:** RED — filtering logic not implemented
  - **Verifies:** AC2 — NIT/RUC filtering

- **Test:** `should perform search case-insensitively`
  - **Status:** RED — filtering logic not implemented
  - **Verifies:** AC2 — case-insensitive search

- **Test:** `should restore full list when search input is cleared`
  - **Status:** RED — filtering logic not implemented
  - **Verifies:** AC2 — search clear restores list

- **Test:** `should display EmptyState component when there are no clients`
  - **Status:** RED — EmptyState component not rendered
  - **Verifies:** AC3 — EmptyState on empty response

- **Test:** `should display guiding message in EmptyState when no clients exist`
  - **Status:** RED — EmptyState not rendered
  - **Verifies:** AC3 — guiding message text

- **Test:** `should NOT show any list items when EmptyState is displayed`
  - **Status:** RED — component does not exist
  - **Verifies:** AC3 — no list items with EmptyState

- **Test:** `should display ErrorPanel when backend returns a network error`
  - **Status:** RED — ErrorPanel component not rendered
  - **Verifies:** AC4 — ErrorPanel on network failure

- **Test:** `should display "Reintentar" button in ErrorPanel when fetch fails`
  - **Status:** RED — ErrorPanel does not exist
  - **Verifies:** AC4 — Reintentar button present

- **Test:** `should retry the API call when user clicks Reintentar button`
  - **Status:** RED — retry logic not implemented
  - **Verifies:** AC4 — Reintentar fires new GET request

- **Test:** `should NOT render any client list items when ErrorPanel is displayed`
  - **Status:** RED — component not built
  - **Verifies:** AC4 — no list items with ErrorPanel

### API Integration Tests (7 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs`

- **Test:** `GivenThreeClientsSeeded_WhenGetClientes_ThenReturns200WithThreeItems` (TC-E2-P1-01)
  - **Status:** RED — `GET /api/v1/clientes` endpoint does not exist
  - **Verifies:** AC1 — endpoint returns HTTP 200 with all seeded clients

- **Test:** `GivenClientsSeeded_WhenGetClientes_ThenResponseContainsAllRequiredFields`
  - **Status:** RED — endpoint and ClienteDto mapping not implemented
  - **Verifies:** AC1 — all DTO fields present (id, nombre, nitRuc, telefono, ciudad, createdAt)

- **Test:** `GivenClientsSeeded_WhenGetClientes_ThenEachItemHasValidUuidId`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC1 — id field is a valid UUID

- **Test:** `GivenEmptyDatabase_WhenGetClientes_ThenReturns200WithEmptyArray` (TC-E2-P1-02)
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC1 — empty DB returns 200 [] (not 404)

- **Test:** `GivenEmptyDatabase_WhenGetClientes_ThenResponseBodyIsEmptyArray`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC1 — body is empty JSON array

- **Test:** `GivenEmptyDatabase_WhenGetClientes_ThenContentTypeIsApplicationJson`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC1 — correct Content-Type header

### Unit Tests (6 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

- **Test:** `GivenThreeClientsInRepository_WhenHandleAsync_ThenReturnsThreeClienteDtos`
  - **Status:** RED — GetClientesQueryHandler class does not exist
  - **Verifies:** AC1 — handler maps 3 entities to 3 DTOs

- **Test:** `GivenClienteEntity_WhenHandleAsync_ThenDtoNombreMatchesEntityNombre`
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 — Nombre field mapping

- **Test:** `GivenClienteEntity_WhenHandleAsync_ThenDtoNitRucMatchesEntityNit`
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 — Nit → NitRuc field name mapping

- **Test:** `GivenClienteEntity_WhenHandleAsync_ThenDtoIdMatchesEntityId`
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 — Id UUID round-trip

- **Test:** `GivenEmptyRepository_WhenHandleAsync_ThenReturnsEmptyList`
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 — empty list returned (not null/exception)

- **Test:** `GivenQuery_WhenHandleAsync_ThenRepositoryGetAllCalledExactlyOnce`
  - **Status:** RED — handler not implemented
  - **Verifies:** AC1 — single repository call per query

### Component Tests (21 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- **Test:** `should render EmptyState when the API returns an empty array` (TC-E2-P1-03)
  - **Status:** RED — ClienteListView component does not exist
  - **Verifies:** AC3

- **Test:** `should NOT render any client list items when API returns empty array`
  - **Status:** RED — component does not exist
  - **Verifies:** AC3

- **Test:** `should NOT render ErrorPanel when API returns empty array (200 [])`
  - **Status:** RED — component does not exist
  - **Verifies:** AC3

- **Test:** `should display the guiding message in EmptyState`
  - **Status:** RED — EmptyState component does not exist
  - **Verifies:** AC3

- **Test:** `should render ErrorPanel when the API call fails with a network error` (TC-E2-P1-04)
  - **Status:** RED — ErrorPanel component does not exist
  - **Verifies:** AC4

- **Test:** `should display a "Reintentar" button inside the ErrorPanel`
  - **Status:** RED — ErrorPanel does not exist
  - **Verifies:** AC4

- **Test:** `should NOT render any client list items when ErrorPanel is displayed`
  - **Status:** RED — component does not exist
  - **Verifies:** AC4

- **Test:** `should fire a new GET /api/v1/clientes request when Reintentar is clicked`
  - **Status:** RED — retry logic not implemented
  - **Verifies:** AC4

- **Test:** `should NOT render EmptyState when ErrorPanel is displayed`
  - **Status:** RED — component does not exist
  - **Verifies:** AC4

- **Test:** `should show only matching clients when user types a Nombre search term` (TC-E2-P1-05)
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2

- **Test:** `should NOT trigger an additional API call when search input changes`
  - **Status:** RED — component does not exist
  - **Verifies:** AC2 — synchronous filter (no API re-call)

- **Test:** `should perform case-insensitive Nombre search`
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2

- **Test:** `should restore full list when search input is cleared`
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2

- **Test:** `should show only matching clients when user types a NIT/RUC partial` (TC-E2-P1-06)
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2

- **Test:** `should NOT trigger an additional API call when filtering by NIT/RUC`
  - **Status:** RED — component does not exist
  - **Verifies:** AC2

- **Test:** `should show no results when NIT/RUC search term does not match any client`
  - **Status:** RED — filtering not implemented
  - **Verifies:** AC2

- **Test:** `should complete filtering of 500 clients in under 1000ms` (TC-E2-P2-01)
  - **Status:** RED — ClienteListView does not exist
  - **Verifies:** AC2 + NFR1

- **Test:** `should maintain filter correctness with 500 records`
  - **Status:** RED — component does not exist
  - **Verifies:** AC2 — correctness at scale

- **Test:** `should render a search input with aria-label="Buscar cliente"`
  - **Status:** RED — component does not exist
  - **Verifies:** AC1 + WCAG 2.1 AA

- **Test:** `should render the client list with role="list"`
  - **Status:** RED — component does not exist
  - **Verifies:** AC1 + WCAG 2.1 AA

- **Test:** `should render each client item with role="listitem"`
  - **Status:** RED — component does not exist
  - **Verifies:** AC1 + WCAG 2.1 AA

---

## Data Factories Created

### Cliente Factory (Frontend — Component Tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (inline)

**Exports:**
- `buildClienteDto(overrides?)` — Creates a single `Cliente` DTO with unique suffix-based values
- `buildClienteDtos(count, overrides?)` — Creates an array of `Cliente` DTOs

**Example Usage:**
```typescript
const cliente = buildClienteDto({ nombre: 'Empresa Especial', nitRuc: '900111001-1' })
const clientes = buildClienteDtos(500) // Generate 500 random clients for perf test
```

### Cliente Factory (Backend — Integration Tests)

**Pattern:** `ClienteEntity.Create(nombre, nit, telefono, ciudad)` — static factory method on domain entity, used directly in test setup within `ClienteEndpointsTests.cs`.

### Cliente Factory (E2E Tests)

**File:** `e2e/helpers/data.helper.ts` (pre-existing — `buildCliente()`)

---

## Fixtures Created

### E2E — Clientes Page Fixture

**File:** `e2e/fixtures/base.fixture.ts` (pre-existing)

**Fixture:** `clientesPage` (navigates to `/clientes`)
- **Setup:** `await page.goto('/clientes')`
- **Provides:** page ready at `/clientes`
- **Cleanup:** none required (stateless navigation)

### E2E — API Helper

**File:** `e2e/helpers/api.helper.ts` (pre-existing — `createCliente()`, `deleteCliente()`)
- **Setup:** Creates clients via API before test
- **Provides:** created client `id` for cleanup
- **Cleanup:** `deleteCliente(id)` in `afterEach`

### Component Tests — MSW Server

MSW `setupServer()` is used inline per test. `server.resetHandlers()` called in `afterEach` for isolation. No shared state between tests.

---

## Mock Requirements

### GET /api/v1/clientes — Happy Path (200 with clients)

**Endpoint:** `GET /api/v1/clientes`

**Success Response (3 clients):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Empresa Alfa S.A.S.",
    "nitRuc": "900111001-1",
    "telefono": "3001111111",
    "ciudad": "Bogotá",
    "createdAt": "2026-06-17T14:30:00Z"
  }
]
```

**Empty Response (200 []):**
```json
[]
```

**Network Error (MSW HttpResponse.error()):**
```
Network failure — Axios/fetch throws an error
```

**Notes:**
- MSW handlers are registered BEFORE component render (equivalent of network-first for component tests)
- `server.resetHandlers()` in `afterEach` ensures test isolation
- Component tests use `retry: false` on QueryClient to fail fast on MSW errors

---

## Required data-testid Attributes

### ClienteListView Component (`frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`)

- `clientes-list-panel` — The 280px left panel container
- `cliente-list-item` — Each individual client item in the list (one per client)

### EmptyState Component (`frontend/src/shared/components/EmptyState.tsx`)

- `empty-state` — Root container of the EmptyState component

### ErrorPanel Component (`frontend/src/shared/components/ErrorPanel.tsx`)

- `error-panel` — Root container of the ErrorPanel component

**Implementation Example:**
```tsx
// ClienteListView.tsx
<div data-testid="clientes-list-panel" className="w-[280px] ...">
  <input
    aria-label="Buscar cliente"
    placeholder="Buscar por nombre o NIT/RUC..."
  />
  {isError && <ErrorPanel data-testid="error-panel" onRetry={refetch} />}
  {!isError && data?.length === 0 && !searchQuery && (
    <EmptyState data-testid="empty-state" message="No hay clientes registrados. Crea el primero." />
  )}
  {!isError && filteredClientes.length > 0 && (
    <ul role="list">
      {filteredClientes.map(c => (
        <li key={c.id} role="listitem" data-testid="cliente-list-item">
          {c.nombre} — {c.nitRuc}
        </li>
      ))}
    </ul>
  )}
</div>
```

---

## Implementation Checklist

### Test Group: AC1 — Client List Panel

**Files to create:**
- [ ] `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface (id, nombre, nitRuc, telefono, ciudad, createdAt)
- [ ] `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`
- [ ] `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios impl, calls `GET /api/v1/clientes`
- [ ] `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook, `queryKey: ['clientes']`
- [ ] `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — 280px left panel, scrollable list
- [ ] Add `data-testid="clientes-list-panel"` to the panel container
- [ ] Add `data-testid="cliente-list-item"` to each list item
- [ ] Add `role="list"` to the `<ul>` and `role="listitem"` to each `<li>`
- [ ] Add `aria-label="Buscar cliente"` to the search input
- [ ] `frontend/src/routes/_app/clientes.tsx` — wire route, render `<ClienteListView />`
- [ ] Run tests: `pnpm --filter frontend test ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Backend files to create:**
- [ ] `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — UUID PK, private ctor, static `Create()` factory
- [ ] `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — `GetAllAsync()`, `GetByIdAsync(Guid)`
- [ ] `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — Id, Nombre, NitRuc (JSON: `nitRuc`), Telefono, Ciudad, CreatedAt
- [ ] `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — empty record class
- [ ] `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — calls repo, maps to DTOs
- [ ] `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — EF IEntityTypeConfiguration
- [ ] `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements IClienteRepository
- [ ] Modify `AppDbContext.cs` — add `DbSet<ClienteEntity> Clientes`
- [ ] Run EF migration: `AddClienteTable` (or create manually if CLI unavailable)
- [ ] `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — `MapGet("/api/v1/clientes", ...)` → HTTP 200
- [ ] Modify `Program.cs` — register `IClienteRepository`, call `app.MapClienteEndpoints()`
- [ ] Run API tests: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "Clientes"`
- [ ] ✅ Tests pass (green phase)

### Test Group: AC2 — Real-Time Search

- [ ] Add `useState<string>('')` for search state in `ClienteListView.tsx`
- [ ] Add `useMemo` filter: case-insensitive match on `nombre` OR `nitRuc` over `data`
- [ ] Bind search `<input>` `onChange` to `setSearchQuery`
- [ ] Verify: no additional API call on search (filter runs synchronously over cache)
- [ ] Run component tests: `pnpm --filter frontend test ClienteListView`
- [ ] ✅ TC-E2-P1-05, TC-E2-P1-06, TC-E2-P2-01 tests pass (green phase)

### Test Group: AC3 — EmptyState

- [ ] Check `siesa-ui-kit` for `EmptyState` equivalent — use if available
- [ ] If absent: create `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string`, centered icon + text, `data-testid="empty-state"`
- [ ] Wire in `ClienteListView.tsx`: show EmptyState when `data?.length === 0` AND `!searchQuery` AND `!isError`
- [ ] Run component tests: `pnpm --filter frontend test ClienteListView`
- [ ] ✅ TC-E2-P1-03 tests pass (green phase)

### Test Group: AC4 — ErrorPanel

- [ ] Check `siesa-ui-kit` for `ErrorPanel` equivalent — use if available
- [ ] If absent: create `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void`, error message + "Reintentar" button, `data-testid="error-panel"`
- [ ] Wire in `ClienteListView.tsx`: show ErrorPanel when `isError === true`, pass `refetch` as `onRetry`
- [ ] Run component tests: `pnpm --filter frontend test ClienteListView`
- [ ] ✅ TC-E2-P1-04 tests pass (green phase)

---

## Running Tests

```bash
# Frontend component tests (Vitest)
pnpm --filter frontend test -- ClienteListView.test.tsx

# Frontend all tests (watch mode)
pnpm --filter frontend test:watch

# Backend unit tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "Clientes"

# Backend integration tests (requires Docker for Testcontainers)
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "Clientes"

# E2E tests (requires frontend + backend running)
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts

# E2E tests — headed mode (see browser)
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --headed

# E2E tests — debug specific test
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --debug

# E2E tests — all clientes tests
npx playwright test e2e/tests/clientes/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (51 tests total)
- ✅ Fixtures and factories created (MSW + API helper + data.helper.ts)
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

All tests fail because:
- `ClienteListView` component does not exist → component tests fail with import error
- `GetClientesQueryHandler` does not exist → unit tests fail with compile error
- `GET /api/v1/clientes` endpoint does not exist → integration + E2E tests fail with 404

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with backend domain** (Tasks 1–2 in story): create `ClienteEntity`, `IClienteRepository`, `GetClientesQuery`, `GetClientesQueryHandler`, `ClienteDto`
2. **Run unit tests** — `GetClientesQueryHandlerTests` should go green
3. **Add infrastructure + API** (Tasks 3–4): EF config, migration, repository, endpoint
4. **Run integration tests** — `ClienteEndpointsTests` should go green
5. **Build frontend** (Tasks 5–9): repository, hook, components, route
6. **Run component tests** — `ClienteListView.test.tsx` tests should go green
7. **Run E2E tests** — `clientes-list-search.spec.ts` should go green

**Key Principles:**

- One layer at a time (bottom-up: Domain → Application → Infrastructure → API → Frontend)
- Run tests after each layer to get fast feedback
- Do NOT debounce the search — synchronous filter is required (AC2, anti-pattern)
- Do NOT use Zustand for search state — `useState` only (anti-pattern)
- Do NOT return 404 for empty GET — always return 200 [] (anti-pattern)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 51 tests pass (green phase complete)
2. Review `ClienteListView.tsx` for readability — extract `ClientListItem` sub-component if needed
3. Review `GetClientesQueryHandler` for clean mapping — consider AutoMapper if project adopts it
4. Verify loading skeleton uses `react-loading-skeleton` (NOT a spinner)
5. Ensure dark mode `dark:` TailwindCSS classes are applied
6. Run tests after each refactor to confirm green

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase:
   - `pnpm --filter frontend test -- ClienteListView.test.tsx`
   - `dotnet test backend/tests/SiesaAgents.UnitTests --filter "Clientes"`
3. Begin implementation starting with Domain layer (bottom-up)
4. Work one test group at a time (AC1 → AC3 → AC4 → AC2)
5. All 51 tests should be GREEN before story is marked done

---

## Knowledge Base References Applied

- **fixture-architecture.md** — MSW `setupServer()` + `server.resetHandlers()` in `afterEach` for component test isolation; `ApiHelper` + `createdIds[]` pattern for E2E cleanup
- **data-factories.md** — `buildClienteDto()` factory with `crypto.randomUUID()` and unique suffix counter; `buildClienteDtos(count)` bulk generator for performance tests
- **network-first.md** — E2E tests: `await page.route(...)` BEFORE `await page.goto(...)` (race condition prevention); component tests: MSW handlers registered before `render()`
- **component-tdd.md** — `QueryClientProvider` wrapper with `retry: false` for fast failure; `waitFor()` for async state assertions; `userEvent.setup()` for realistic user interactions
- **test-quality.md** — One assertion per test (atomic); `afterEach` cleanup for isolation; no hardcoded test data (factory functions); deterministic test IDs via factory
- **selector-resilience.md** — `data-testid` selectors for stability; `getByRole('textbox', { name: /buscar cliente/i })` for accessible query; `getByRole('button', { name: /reintentar/i })` for Reintentar button
- **test-levels-framework.md** — Component tests for UI behavior (MSW mocks); API integration tests for endpoint contracts; E2E tests for critical user journeys only; unit tests for handler mapping

---

## Test Execution Evidence

### Expected Failure Messages

**Frontend component tests (RED):**
```
Error: Cannot find module './ClienteListView' from 'ClienteListView.test.tsx'
  → Component file does not exist yet (all 21 component tests fail)
```

**Backend unit tests (RED):**
```
CS0246: The type or namespace name 'GetClientesQueryHandler' could not be found
CS0246: The type or namespace name 'GetClientesQuery' could not be found
CS0246: The type or namespace name 'ClienteDto' could not be found
  → All 6 unit tests fail to compile
```

**Backend integration tests (RED):**
```
CS0103: The name 'ClienteEntity' does not exist in the current context
CS1061: 'AppDbContext' does not contain a definition for 'Clientes'
  → All 7 integration tests fail to compile; endpoint tests would also fail with 404
```

**E2E tests (RED):**
```
Error: Locator: getByTestId('clientes-list-panel')
  Expected: visible
  Received: hidden
  → /clientes route exists but ClienteListView is not rendered (all 17 E2E tests fail)
```

**Summary:**
- Total tests: 51
- Passing: 0 (expected — RED phase)
- Failing: 51 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- Story 2.1 is the first story in Epic 2 — it establishes the `clientes` module structure used by Stories 2.2–2.6
- The EF migration `AddClienteTable` will create the `clientes` table; Story 3.1 adds `contactos`
- The route `_app/clientes.tsx` should be designed for the split-panel layout from the start — right panel will be added in Story 2.2
- `nitRuc` (DTO JSON field) maps FROM `Nit` (entity/DB field) — ensure `[JsonPropertyName("nitRuc")]` or `JsonNamingPolicy.CamelCase` is configured
- The E2E tests for EmptyState and ErrorPanel use `page.route()` (network-first) instead of seeding/not-seeding the DB for speed and isolation

---

**Generated by BMad TEA Agent** — 2026-06-17
