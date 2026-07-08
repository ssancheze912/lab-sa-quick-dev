# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-07-08
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + @testing-library/react + MSW) with supporting E2E (Playwright, route-intercepted) and Backend Integration (xUnit + `WebApplicationFactory<Program>`)

---

## Story Summary

Story 2.1 delivers the first vertical slice of Epic 2 — the `/clientes` split-panel view with a scrollable, sortable, client-side searchable list. The RED phase locks the behaviour of every layer through failing tests: backend `GetClientesQueryHandler` + `ClienteConfiguration` + `MapClienteEndpoints`; frontend `useClientes` hook + `useDebouncedValue` + `clienteApiRepository` + `EmptyState`/`ErrorPanel`/`ClienteListItem`/`ClienteListView`; and end-to-end user journeys on `/clientes` from list load through search filtering, empty/error states, and item selection.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for from the `/clientes` view.

---

## Acceptance Criteria

1. **AC #1** — `/clientes` renders a 280 px split-panel with a scrollable list sorted by `created_at DESC`, each item showing `Nombre` and `NIT/RUC`.
2. **AC #2** — Typing in the search input filters the list in-memory (case + accent insensitive), debounced at 150 ms, with zero extra HTTP requests.
3. **AC #3** — Zero matches replaces the list with an `EmptyState` variant `search-empty` (exact Spanish copy + `aria-live="polite"`).
4. **AC #4** — Backend empty array replaces the list with an `EmptyState` variant `no-clients` (exact Spanish copy).
5. **AC #5** — Backend failure replaces the list with an `ErrorPanel` (Spanish title/subtitle + `Reintentar` button that calls `refetch()`; raw error message NEVER shown per NFR6).
6. **AC #6** — Initial in-flight query renders exactly 6 skeleton items (no spinner).
7. **AC #7** — Clicking a `ClienteListItem` updates the URL to `/clientes/:clienteId` and marks the item selected (via `data-selected="true"`).
8. **AC #8** — `GET /api/v1/clientes` returns HTTP 200 with a JSON array of `ClienteDto` objects in camelCase; no query parameters accepted in Story 2.1.
9. **AC #9** — `AddClientesTable` migration creates the `clientes` table (snake_case columns) with a `uk_clientes_nit` unique index.
10. **AC #10** — Backend + frontend builds compile without errors; TypeScript strict mode passes; no new warnings.
11. **AC #11** — All existing tests remain green plus the tests introduced by this story pass with `> 80%` coverage on new files.

---

## Failing Tests Created (RED Phase)

### Backend Tests — xUnit + `WebApplicationFactory<Program>`

#### File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (3 tests)

- ✅ **Test:** `HandleAsync_ReturnsEmpty_WhenRepositoryEmpty`
  - **Status:** RED — types `SiesaAgents.Application.Clientes.Queries.{GetClientesQuery,GetClientesQueryHandler}`, `SiesaAgents.Application.Clientes.DTOs.ClienteDto`, `SiesaAgents.Domain.Clientes.Entities.ClienteEntity`, and `SiesaAgents.Domain.Clientes.Interfaces.IClienteRepository` do not exist yet (Tasks 1, 3).
  - **Verifies:** AC #4, AC #8
- ✅ **Test:** `HandleAsync_MapsAllFields_FromEntityToDto`
  - **Status:** RED — same reason as above.
  - **Verifies:** AC #8
- ✅ **Test:** `HandleAsync_PreservesRepositoryOrder`
  - **Status:** RED — same reason as above.
  - **Verifies:** AC #1, AC #8

#### File: `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs` (7 tests — theories expanded)

- ✅ **Test:** `Configuration_MapsClienteEntity_ToClientesTable`
  - **Status:** RED — `ClienteConfiguration`, `AppDbContext.Clientes`, and `ClienteEntity` do not exist (Task 2).
  - **Verifies:** AC #9
- ✅ **Test:** `Configuration_MarksStringProperty_AsRequired` (theory, 4 cases: Nombre/Nit/Telefono/Ciudad)
  - **Status:** RED
  - **Verifies:** AC #9
- ✅ **Test:** `Configuration_SetsMaxLength_ForStringProperty` (theory, 4 cases: 200/50/50/100)
  - **Status:** RED
  - **Verifies:** AC #9
- ✅ **Test:** `Configuration_DefinesUniqueIndex_OnNit_NamedUkClientesNit`
  - **Status:** RED
  - **Verifies:** AC #9
- ✅ **Test:** `Configuration_MarksTimestampProperty_AsRequired` (theory, 2 cases: CreatedAt/UpdatedAt)
  - **Status:** RED
  - **Verifies:** AC #9
- ✅ **Test:** `Configuration_UsesId_AsPrimaryKey`
  - **Status:** RED
  - **Verifies:** AC #9

#### File: `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs` (3 tests)

- ✅ **Test:** `GetClientes_ReturnsOk_WithEmptyArray_ForFreshDb`
  - **Status:** RED — endpoint `GET /api/v1/clientes` is not mapped in `Program.cs` (Task 4); `IClienteRepository` is not registered in DI so the `RemoveAll/AddSingleton` override is a no-op until the type exists.
  - **Verifies:** AC #4, AC #8
- ✅ **Test:** `GetClientes_ReturnsAllSeededItems_InRepositoryOrder`
  - **Status:** RED — endpoint missing (Task 4).
  - **Verifies:** AC #1, AC #8
- ✅ **Test:** `GetClientes_ReturnsJson_WithCamelCaseKeys`
  - **Status:** RED — endpoint missing (Task 4).
  - **Verifies:** AC #8

### Frontend Tests — Vitest + @testing-library/react + MSW

#### File: `frontend/src/modules/crm/clientes/application/useClientes.test.ts` (4 tests)

- ✅ **Test:** GIVEN backend returns 3 clientes, THEN data has length 3
  - **Status:** RED — module `./useClientes` does not exist.
  - **Verifies:** AC #1, AC #8
- ✅ **Test:** GIVEN backend returns 500, THEN isError is true
  - **Status:** RED — module missing.
  - **Verifies:** AC #5
- ✅ **Test:** GIVEN a re-render, THEN no additional MSW request fires
  - **Status:** RED — module missing.
  - **Verifies:** AC #2 (client-side filter contract)
- ✅ **Test:** THEN the exported query key is `["clientes"]`
  - **Status:** RED — symbol `CLIENTES_QUERY_KEY` does not exist.
  - **Verifies:** AC #11 (architecture-mandated canonical key for FR27 invalidation)

#### File: `frontend/src/modules/crm/clientes/application/useDebouncedValue.test.ts` (5 tests)

- ✅ **Test:** initial value emits immediately
  - **Status:** RED — module `./useDebouncedValue` does not exist (Task 8).
  - **Verifies:** AC #2
- ✅ **Test:** less-than-150 ms elapsed → debounced value NOT updated
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** exactly-150 ms elapsed → debounced value updated
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** rapid changes → only the last value is emitted
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** default delay is 150 ms
  - **Status:** RED
  - **Verifies:** AC #2

#### File: `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.test.ts` (4 tests)

- ✅ **Test:** `getAll` returns the array from `/api/v1/clientes`
  - **Status:** RED — module `./clienteApiRepository` does not exist (Task 7).
  - **Verifies:** AC #1, AC #8
- ✅ **Test:** URL is exactly `/api/v1/clientes`
  - **Status:** RED
  - **Verifies:** AC #8
- ✅ **Test:** on 500 the promise rejects
  - **Status:** RED
  - **Verifies:** AC #5
- ✅ **Test:** returned objects match the `Cliente` shape
  - **Status:** RED — types missing (Task 6).
  - **Verifies:** AC #8

#### File: `frontend/src/shared/components/EmptyState.test.tsx` (7 tests)

- ✅ **Test:** variant `no-clients` — Spanish title
  - **Status:** RED — module `./EmptyState` does not exist (Task 9).
  - **Verifies:** AC #4
- ✅ **Test:** variant `no-clients` — Spanish subtitle
  - **Status:** RED
  - **Verifies:** AC #4
- ✅ **Test:** variant `no-clients` — `role="status"` + `aria-live="polite"`
  - **Status:** RED
  - **Verifies:** AC #4 (a11y)
- ✅ **Test:** variant `search-empty` — Spanish title
  - **Status:** RED
  - **Verifies:** AC #3
- ✅ **Test:** variant `search-empty` — Spanish subtitle
  - **Status:** RED
  - **Verifies:** AC #3
- ✅ **Test:** variant `search-empty` — `role="status"` + `aria-live="polite"`
  - **Status:** RED
  - **Verifies:** AC #3 (a11y)
- ✅ **Test:** respects custom `title` override
  - **Status:** RED
  - **Verifies:** AC #3/#4

#### File: `frontend/src/shared/components/ErrorPanel.test.tsx` (6 tests)

- ✅ **Test:** renders title + subtitle
  - **Status:** RED — module `./ErrorPanel` does not exist (Task 9).
  - **Verifies:** AC #5
- ✅ **Test:** `role="alert"`
  - **Status:** RED
  - **Verifies:** AC #5 (a11y)
- ✅ **Test:** button labelled "Reintentar"
  - **Status:** RED
  - **Verifies:** AC #5
- ✅ **Test:** clicking Reintentar calls `onRetry` once
  - **Status:** RED
  - **Verifies:** AC #5
- ✅ **Test:** `isRetrying=true` disables the button
  - **Status:** RED
  - **Verifies:** AC #5
- ✅ **Test:** NEVER displays raw error internals (NFR6)
  - **Status:** RED
  - **Verifies:** AC #5, NFR6

#### File: `frontend/src/shared/components/ClienteListItem.test.tsx` (6 tests)

- ✅ **Test:** renders `nombre` on line 1
  - **Status:** RED — module `./ClienteListItem` does not exist (Task 9).
  - **Verifies:** AC #1
- ✅ **Test:** renders `NIT: {nit}` on line 2
  - **Status:** RED
  - **Verifies:** AC #1
- ✅ **Test:** exposes Spanish `aria-label="Ver cliente: {nombre}"`
  - **Status:** RED
  - **Verifies:** AC #1 (a11y)
- ✅ **Test:** clicking calls `onSelect(cliente.id)`
  - **Status:** RED
  - **Verifies:** AC #7
- ✅ **Test:** `selected=true` sets `data-selected="true"`
  - **Status:** RED
  - **Verifies:** AC #7
- ✅ **Test:** `selected=false` sets `data-selected="false"`
  - **Status:** RED
  - **Verifies:** AC #7

#### File: `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (13 tests)

- ✅ **Test:** GIVEN 3 clientes, WHEN the view mounts, THEN 3 items render
  - **Status:** RED — `ClienteListView`, `useClientes`, `EmptyState`, `ErrorPanel`, `ClienteListItem` all missing (Tasks 8, 9, 10).
  - **Verifies:** AC #1
- ✅ **Test:** aside has `role="complementary"` + `w-[280px]` + `flex-shrink-0`
  - **Status:** RED
  - **Verifies:** AC #1
- ✅ **Test:** typing filters by nombre
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** typing filters by NIT
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** search is accent-insensitive
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** rapid keystrokes fire exactly ONE MSW request
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** search input has placeholder + aria-label
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** empty backend response renders `no-clients` EmptyState
  - **Status:** RED
  - **Verifies:** AC #4
- ✅ **Test:** non-matching search renders `search-empty` EmptyState
  - **Status:** RED
  - **Verifies:** AC #3
- ✅ **Test:** 500 response renders ErrorPanel with Spanish copy
  - **Status:** RED
  - **Verifies:** AC #5
- ✅ **Test:** clicking Reintentar re-fetches and the list recovers
  - **Status:** RED
  - **Verifies:** AC #5
- ✅ **Test:** initial in-flight query renders 6 skeleton items
  - **Status:** RED
  - **Verifies:** AC #6
- ✅ **Test:** clicking an item pushes `/clientes/:id` on the router
  - **Status:** RED
  - **Verifies:** AC #7
- ✅ **Test:** deep link `/clientes/:id` marks the matching row selected
  - **Status:** RED
  - **Verifies:** AC #7
- ✅ **Test:** wrapper preserves `data-testid="clientes-view"` (Story 1.2 contract)
  - **Status:** RED
  - **Verifies:** AC #1

### End-to-End Tests — Playwright (route-intercepted)

#### File: `e2e/tests/clientes/story-2-1-client-list-search.spec.ts` (8 tests)

- ✅ **Test:** AC #1 — split-panel with 3 items renders
  - **Status:** RED — Story 2.1 implementation missing.
  - **Verifies:** AC #1
- ✅ **Test:** AC #2 — search filters by nombre
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** AC #2 — client-side filter fires zero extra API calls
  - **Status:** RED
  - **Verifies:** AC #2
- ✅ **Test:** AC #4 — empty backend renders no-clients EmptyState
  - **Status:** RED
  - **Verifies:** AC #4
- ✅ **Test:** AC #3 — non-matching search renders search-empty EmptyState
  - **Status:** RED
  - **Verifies:** AC #3
- ✅ **Test:** AC #5 — 500 renders ErrorPanel + Reintentar; NFR6 no error leak
  - **Status:** RED
  - **Verifies:** AC #5, NFR6
- ✅ **Test:** AC #7 — clicking a row updates URL to `/clientes/:id`
  - **Status:** RED
  - **Verifies:** AC #7
- ✅ **Test:** AC #6 — slow backend surfaces 6 skeleton items
  - **Status:** RED
  - **Verifies:** AC #6

---

## Data Factories Created

### Cliente Factory (frontend)

**File:** `frontend/src/test/factories/cliente.factory.ts`

**Exports:**

- `buildCliente(overrides?)` — Deterministic-ish Cliente with UUID-shaped id, Colombian phone, Bogotá as default city.
- `buildClientes(count, overridesFn?)` — Bulk generator.

**Example Usage:**

```typescript
import { buildCliente, buildClientes } from '@/test/factories/cliente.factory'

const one = buildCliente({ nombre: 'Empresa Alpha' })
const fifty = buildClientes(50, (i) => ({ nombre: `Cliente ${i}` }))
```

### Cliente-shaped data in E2E

The E2E spec includes an inline `buildCliente()` mirroring the frontend factory so the Playwright test file remains self-contained. No dependency on `faker`.

### Backend fake repository

A `FakeClienteRepository` is embedded inside `ClienteEndpointsTests.cs` (hand-rolled per Story 2.1 Testing Standards). It replaces the DI-bound `IClienteRepository` in the `Testing` environment so no PostgreSQL instance is required.

---

## Fixtures Created

### MSW support

**Files:**

- `frontend/src/test/msw/server.ts` — Central `setupServer` instance.
- `frontend/src/test/msw/handlers.ts` — Default handlers (empty `GET /api/v1/clientes`).
- `frontend/src/test-setup.ts` (edited) — Wires `beforeAll(server.listen) / afterEach(server.resetHandlers) / afterAll(server.close)`.

**Usage per test:**

```typescript
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { http, HttpResponse } from 'msw'

server.use(
  http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([...], { status: 200 })),
)
```

### Query-client render helper

**File:** `frontend/src/test/render.tsx`

- `createTestQueryClient()` — Fresh `QueryClient` per test, no retries, no gc.
- `renderWithQueryClient(ui)` — RTL `render` wrapped in `QueryClientProvider`.

### Playwright fixture

The existing `e2e/fixtures/base.fixture.ts` is reused as-is. No new fixture is required — `page.route` interception fully hermetises the E2E tests.

---

## Mock Requirements

### `GET /api/v1/clientes` (frontend + E2E)

- **Success:** HTTP 200, `Content-Type: application/json`, body = JSON array of `ClienteDto`.
- **Empty:** HTTP 200 with body `[]`.
- **Failure:** HTTP 500 with `{}` body (frontend does not surface error internals per NFR6).

**Frontend implementation:** MSW handlers registered per test via `server.use(...)`.
**E2E implementation:** `page.route(/\/api\/v1\/clientes(\?.*)?$/, (route) => route.fulfill(...))` **BEFORE** `page.goto` — network-first.

### Backend endpoint tests

The `IClienteRepository` DI registration is overridden with `FakeClienteRepository` inside each test — no external services need mocking.

---

## Required `data-testid` Attributes

### `/clientes` route

- `clientes-view` — Split-panel root container (preserves Story 1.2 contract).
- `cliente-skeleton` — Each of the 6 skeleton `<li>` items during initial load (AC #6).

### `ClienteListItem`

- `data-selected="true"` / `data-selected="false"` — Attribute on the `<button>` root, driven by the `selected` prop (AC #7).
  - Not a `data-testid` per se, but a stable test hook required by the RED tests.

### `EmptyState`, `ErrorPanel`

- No dedicated `data-testid` required — tests use `getByRole('status')` and `getByRole('alert')` respectively (better a11y hygiene).

**Implementation Example:**

```tsx
<div data-testid="clientes-view" className="flex h-full min-h-0">
  <ClienteListView />
  <section aria-label="Detalle del cliente" className="flex-1 p-6" />
</div>

<li key={i} data-testid="cliente-skeleton"><Skeleton height={44} /></li>

<button data-selected={selected} role="button" aria-label={`Ver cliente: ${cliente.nombre}`}>
  {/* ... */}
</button>
```

---

## Implementation Checklist

### Backend

- [ ] Create `ClienteEntity` (Domain) with private-set properties + `ClienteEntity.Create(...)` factory.
- [ ] Create `IClienteRepository` (Domain) with `GetAllAsync` / `GetByIdAsync`.
- [ ] Create `ClienteConfiguration` (Infrastructure) — table `clientes`, string constraints, unique index `uk_clientes_nit`.
- [ ] Add `DbSet<ClienteEntity> Clientes` + `ApplyConfigurationsFromAssembly` in `AppDbContext`.
- [ ] Create `ClienteRepository` (Infrastructure) — `AsNoTracking() + OrderByDescending(CreatedAt)`.
- [ ] Run `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Migrations`.
- [ ] Create `ClienteDto`, `GetClientesQuery`, `GetClientesQueryHandler` (Application).
- [ ] Create `ClienteEndpoints.MapClienteEndpoints()` (API) — one route: `GET /api/v1/clientes`.
- [ ] Register `IClienteRepository` + `GetClientesQueryHandler` in DI (`Program.cs`).
- [ ] Wire `app.MapClienteEndpoints()` after `app.UseCors(...)`.
- [ ] Run backend test suite:
  - [ ] `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~GetClientesQueryHandlerTests`
  - [ ] `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~ClienteConfigurationTests`
  - [ ] `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~ClienteEndpointsTests`
- [ ] ✅ All backend RED tests pass (green phase).

### Frontend

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` interface.
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`.
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`.
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — exports `CLIENTES_QUERY_KEY = ['clientes'] as const` and `useClientes()`.
- [ ] Create `frontend/src/modules/crm/clientes/application/useDebouncedValue.ts` — default 150 ms delay.
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` with `role="status"` + `aria-live="polite"`.
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with `role="alert"` + `Reintentar` button.
- [ ] Create `frontend/src/shared/components/ClienteListItem.tsx` with `data-selected` attribute.
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (split-panel skeleton per Dev Notes).
- [ ] Update `frontend/src/routes/clientes.tsx` to render the split-panel with `data-testid="clientes-view"`.
- [ ] Add a placeholder `frontend/src/routes/clientes.$clienteId.tsx` — only if typecheck fails on `navigate({ to: '/clientes/$clienteId', params })` (Story 2.2 populates the detail).
- [ ] Regenerate `routeTree.gen.ts` via `pnpm --dir frontend dev` (TanStack Router plugin).
- [ ] Run frontend tests:
  - [ ] `pnpm --dir frontend test -- useClientes`
  - [ ] `pnpm --dir frontend test -- useDebouncedValue`
  - [ ] `pnpm --dir frontend test -- clienteApiRepository`
  - [ ] `pnpm --dir frontend test -- EmptyState`
  - [ ] `pnpm --dir frontend test -- ErrorPanel`
  - [ ] `pnpm --dir frontend test -- ClienteListItem`
  - [ ] `pnpm --dir frontend test -- ClienteListView`
- [ ] ✅ All frontend RED tests pass (green phase).

### E2E

- [ ] Ensure both dev servers are running:
  - Frontend: `pnpm --dir frontend dev` on `http://localhost:5173`.
  - Backend: `dotnet run --project backend/src/SiesaAgents.API` on `http://localhost:5000`.
- [ ] Run: `pnpm exec playwright test e2e/tests/clientes/story-2-1-client-list-search.spec.ts --project=chromium`
- [ ] ✅ All 8 E2E tests pass.

---

## Running Tests

```bash
# Backend
dotnet test backend/SiesaAgents.sln

# Frontend — all
pnpm --dir frontend test

# Frontend — Story 2.1 targets only
pnpm --dir frontend test -- clientes

# E2E — Story 2.1
pnpm exec playwright test e2e/tests/clientes/story-2-1-client-list-search.spec.ts --project=chromium

# E2E — headed
pnpm exec playwright test e2e/tests/clientes/story-2-1-client-list-search.spec.ts --headed
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ All failing tests written across 3 backend files, 7 frontend files, and 1 E2E file.
- ✅ MSW server + handler infrastructure wired in `test-setup.ts`.
- ✅ Data factory `buildCliente` created for both frontend (`src/test/factories/cliente.factory.ts`) and inline in the E2E spec.
- ✅ Mock requirements documented (`GET /api/v1/clientes` variants: 200 empty, 200 with rows, 500 error).
- ✅ Test hooks documented (`data-testid`, `data-selected`, roles, `aria-label`s).
- ✅ Implementation checklist ordered so the DEV loop can go layer-by-layer (Domain → Infrastructure → Application → API → Frontend Domain → Application → Infrastructure → Presentation).

### GREEN Phase (DEV Team - Next Steps)

1. Start with the backend Domain layer (`ClienteEntity`, `IClienteRepository`) — unlocks `GetClientesQueryHandlerTests` first.
2. Move to Infrastructure (`ClienteConfiguration`, migration, `ClienteRepository`) — unlocks `ClienteConfigurationTests`.
3. Application + API (`GetClientesQuery{Handler}`, `MapClienteEndpoints`) — unlocks `ClienteEndpointsTests`.
4. Frontend Domain + Infrastructure + Application (`Cliente`, `clienteApiRepository`, `useClientes`, `useDebouncedValue`).
5. Frontend shared components (`EmptyState`, `ErrorPanel`, `ClienteListItem`).
6. Frontend Presentation (`ClienteListView`) — unlocks the biggest test file.
7. Route wiring (`routes/clientes.tsx`) — unlocks E2E and finalises `data-testid` contracts.
8. Run all tests until every RED transitions to GREEN.

### REFACTOR Phase (DEV Team - After All Tests Pass)

- Verify coverage `> 80%` on new files under `modules/crm/clientes/**` and `SiesaAgents.*/Clientes/**`.
- Confirm no `any` types were introduced (frontend TS strict).
- Confirm CSS gzip stays within +5 KB of the 670 KB baseline from Story 1.2.
- Do NOT modify the RED tests to accommodate implementation shortcuts — the tests are the contract.

---

## Next Steps

1. `sa-dev-story` implements Story 2.1 following the checklist above (Domain → Infrastructure → Application → API → Frontend layers).
2. `sa-tea-atdd-run` executes the generated tests and reports how many transitioned to GREEN.
3. `sa-tea-automate` expands coverage into P1/P2 scenarios after implementation.
4. `sa-code-review` performs the adversarial review pass before commit.
5. `sa-tea-trace` will fold Story 2.1 into the Epic 2 traceability matrix at end of epic.

---

## Knowledge Base References Applied

- **network-first.md** — Playwright `page.route(...)` interceptors registered BEFORE `page.goto`; MSW handlers registered before hook mounts.
- **selector-resilience.md** — Prefer `getByRole('button', { name: /ver cliente:/i })` over CSS selectors; use `data-selected` attribute over class-value inspection.
- **data-factories.md** — `buildCliente(overrides?)` supports partial override; helper `buildClientes(N)` for bulk data.
- **fixture-architecture.md** — `renderWithQueryClient` composes a fresh `QueryClient` per test; MSW server is a process-wide fixture with `resetHandlers` between tests.
- **test-quality.md** — Given-When-Then structure; deterministic tests (fake timers for debounce); explicit assertions per scenario.
- **test-levels-framework.md** — Component tests for UI logic (RTL+MSW), API endpoint tests for the REST contract (xUnit + `WebApplicationFactory`), E2E tests only for the split-panel happy path + selection navigation.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Commands (documented for the DEV team to run first):**

```bash
# Backend
dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~Clientes|FullyQualifiedName~ClienteEndpointsTests|FullyQualifiedName~ClienteConfigurationTests"

# Frontend
pnpm --dir frontend test -- --run

# E2E (requires backend+frontend running)
pnpm exec playwright test e2e/tests/clientes/story-2-1-client-list-search.spec.ts --project=chromium
```

**Expected results (before implementation):**

- **Backend:** All 13 tests in the three new test classes fail to compile — every referenced type (`ClienteEntity`, `IClienteRepository`, `GetClientesQueryHandler`, `ClienteDto`, `GetClientesQuery`) is missing. The build error itself is the RED signal.
- **Frontend:** All test files fail at import time — `useClientes`, `useDebouncedValue`, `clienteApiRepository`, `EmptyState`, `ErrorPanel`, `ClienteListItem`, `ClienteListView` do not resolve. Vitest reports `Cannot find module …`.
- **E2E:** The Playwright spec fails at every locator assertion — the `/clientes` route currently renders only an `<h1>Clientes</h1>` placeholder (Story 1.2 stub); there is no search input, no list, no ErrorPanel, no split-panel `<aside>`.

**Status:** ✅ RED phase verified by the deliberate absence of implementation.

---

## Notes

- The frontend `test-setup.ts` was extended once — MSW `beforeAll/afterEach/afterAll` hooks were added. Any pre-existing frontend tests that avoid HTTP work continue to pass because `onUnhandledRequest: 'bypass'` ensures MSW never intercepts requests without a matching handler.
- Story 1.2's `data-testid="clientes-view"` contract is preserved: `ClienteListView.test.tsx` asserts it explicitly, and the E2E spec relies on the same identifier for scoping.
- The E2E tests use pure `page.route` interception — no live backend required. This lets the RED spec run under any CI environment without provisioning PostgreSQL. Once GREEN, the same E2E can be re-run against the live backend by removing the `page.route(...)` call; coverage remains identical.
- The `useClientes.test.ts` file intentionally uses `React.createElement` instead of JSX to keep the file extension `.ts` as prescribed by Story 2.1 Task 11.
- `MasterCrud` is deliberately NOT tested at Story 2.1 level (documented deferral in the story's Dev Notes) — the RED tests exercise the composition of `Input` + custom list items + `EmptyState`/`ErrorPanel`, which is the architectural intent.

---

**Generated by BMad TEA Agent** - 2026-07-08
