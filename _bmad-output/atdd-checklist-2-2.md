# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-05-24
**Author:** BMad TEA Agent
**Primary Test Level:** Component (Vitest + RTL + MSW) + Unit (xUnit) + Hook Unit (Vitest)

---

## Story Summary

Commercial team members can select a client from the list to view their complete details in the right panel. The URL updates to `/clientes/:clienteId` without a full page reload (deep linking). Direct navigation to `/clientes/:clienteId` loads the correct client via `GET /api/v1/clientes/{id}`. If the id does not exist, "Cliente no encontrado" is shown gracefully. Skeleton placeholders appear while loading — no spinner.

**As a** commercial team member,
**I want** to view the complete details of a client by selecting them from the list,
**So that** I can review all their information without navigating away from the clients section.

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, When the user clicks on a client item, Then the right panel shows the complete client details: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`, rendered by `ClienteDetailView`. And the URL updates to `/clientes/:clienteId` without a page reload (FR30 deep linking).

2. **AC2** — Given the user accesses the URL `/clientes/:clienteId` directly (deep link), When the page loads, Then `GET /api/v1/clientes/{id}` is called and the correct client details are displayed in the right panel (FR30).

3. **AC3** — Given a `clienteId` in the URL does not exist in the system, When `GET /api/v1/clientes/{id}` returns 404, Then a not-found message ("Cliente no encontrado") is displayed gracefully in the right panel. The application shell remains visible and no unhandled JavaScript error is thrown.

4. **AC4** — Given the `/clientes/:clienteId` route loads, When `GET /api/v1/clientes/{id}` is in-flight, Then skeleton placeholders (`react-loading-skeleton`) are displayed in the right panel — no spinner.

---

## Failing Tests Created (RED Phase)

### Component Tests — Vitest + RTL + MSW (14 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/-ClienteDetailView.test.tsx`

#### TC-E2-P1-06a: Right panel shows all four client fields (5 tests)

- **Test:** `[P1] Given MSW returns a client, When ClienteDetailView renders, Then Nombre is displayed`
  - **Status:** RED — `ClienteDetailView` component does not exist.
  - **Verifies:** AC1 — `Nombre` value visible in detail panel.

- **Test:** `[P1] Given MSW returns a client, When ClienteDetailView renders, Then NIT/RUC is displayed`
  - **Status:** RED — `ClienteDetailView` not implemented.
  - **Verifies:** AC1 — `NIT/RUC` value visible in detail panel.

- **Test:** `[P1] Given MSW returns a client, When ClienteDetailView renders, Then Teléfono is displayed`
  - **Status:** RED — `ClienteDetailView` not implemented.
  - **Verifies:** AC1 — `Teléfono` value visible in detail panel.

- **Test:** `[P1] Given MSW returns a client, When ClienteDetailView renders, Then Ciudad is displayed`
  - **Status:** RED — `ClienteDetailView` not implemented.
  - **Verifies:** AC1 — `Ciudad` value visible in detail panel.

- **Test:** `[P1] Given MSW returns a client, When data is loaded, Then all field labels are in Spanish`
  - **Status:** RED — Component not implemented; Spanish labels not rendered.
  - **Verifies:** AC1 — All labels (`Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`) in Spanish (company standard).

#### data-testid contract: cliente-detail-panel (2 tests)

- **Test:** `[P1] Given any state, When ClienteDetailView mounts, Then outer container has data-testid="cliente-detail-panel"`
  - **Status:** RED — `data-testid="cliente-detail-panel"` not implemented.
  - **Verifies:** AC1 / AC4 — Container testid required for E2E selectors and Playwright tests.

- **Test:** `[P1] Given 404 response, When ClienteDetailView renders not-found state, Then container still has data-testid="cliente-detail-panel"`
  - **Status:** RED — Component not implemented.
  - **Verifies:** AC3 — Panel container persists even on 404 (shell remains visible).

#### TC-E2-P1-08a: Graceful 404 — "Cliente no encontrado" message (3 tests)

- **Test:** `[P1] Given clienteId does not exist in system, When GET returns 404, Then "Cliente no encontrado" message is displayed`
  - **Status:** RED — 404 branch not implemented; no "Cliente no encontrado" text rendered.
  - **Verifies:** AC3 — User-friendly not-found message shown in Spanish.

- **Test:** `[P1] Given clienteId does not exist, When GET returns 404, Then data-testid="cliente-not-found" is present`
  - **Status:** RED — `data-testid="cliente-not-found"` element not implemented.
  - **Verifies:** AC3 — Not-found element with testid for E2E selection.

- **Test:** `[P1] Given clienteId does not exist, When 404 is displayed, Then the "Cliente no encontrado" text is inside the not-found element`
  - **Status:** RED — Element not implemented.
  - **Verifies:** AC3 — Text content of not-found element is correct.

#### TC-E2-P1-08b: No crash on 404, navigation context preserved (3 tests)

- **Test:** `[P1] Given GET returns 404, When component renders, Then no ErrorPanel crash is thrown`
  - **Status:** RED — 404 detection via `(error as AxiosError)?.response?.status === 404` not implemented.
  - **Verifies:** AC3 — Component does not throw on 404; no unhandled error.

- **Test:** `[P1] Given GET returns 404, When component renders, Then generic ErrorPanel is NOT shown (404 is handled specifically)`
  - **Status:** RED — 404 vs generic error branching not implemented.
  - **Verifies:** AC3 — 404 is handled gracefully with its own message, not as a generic error.

- **Test:** `[P1] Given GET returns 404, When not-found state is shown, Then the detail panel container is still rendered`
  - **Status:** RED — Outer container not rendered.
  - **Verifies:** AC3 — Application shell remains visible (FR30 deep-link constraint).

#### Skeleton loading state (3 tests)

- **Test:** `[P1] Given GET is in-flight, When component first renders, Then no role="status" spinner is present`
  - **Status:** RED — Loading state with skeleton not implemented; spinner absence not enforced.
  - **Verifies:** AC4 — Company standard: `react-loading-skeleton`, never `role="status"` spinner.

- **Test:** `[P1] Given GET is in-flight, When loading, Then data-testid="cliente-detail-panel" is already present`
  - **Status:** RED — Component not implemented.
  - **Verifies:** AC4 — Panel container exists during loading state (skeletons rendered inside it).

- **Test:** `[P1] Given GET is in-flight, When loading, Then client data fields are NOT visible yet`
  - **Status:** RED — Loading branch not implemented.
  - **Verifies:** AC4 — Data fields are hidden during skeleton loading (no premature display).

#### Detail card structural rendering (2 tests)

- **Test:** `[P1] Given data is loaded, When ClienteDetailView renders, Then Nombre label is "Nombre" (Spanish)`
  - **Status:** RED — `<dt>Nombre</dt>` label not implemented.
  - **Verifies:** AC1 — Spanish label for the Nombre field.

- **Test:** `[P1] Given data is loaded, When rendered, Then no "not found" element is shown for an existing client`
  - **Status:** RED — Component not implemented.
  - **Verifies:** AC1 / AC3 — Not-found element is absent when the client exists.

---

### Unit Tests — Vitest + RTL renderHook + MSW (8 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

> **Note:** This file already exists and was generated as part of Story 2.2 ATDD setup. All 8 tests are in RED phase.

#### Successful data fetch (3 tests)

- **Test:** `[P1] Given MSW returns a client by id, When useCliente resolves, Then data contains the expected client`
  - **Status:** RED — `useCliente` hook does not exist.
  - **Verifies:** AC2 — Hook returns the correct client data.

- **Test:** `[P1] Given MSW returns a client by id, When useCliente resolves, Then isLoading is false`
  - **Status:** RED — Hook not implemented.
  - **Verifies:** AC4 — Loading state resolves correctly.

- **Test:** `[P1] Given MSW returns a client by id, When useCliente resolves, Then isError is false`
  - **Status:** RED — Hook not implemented.
  - **Verifies:** AC2 — No error on successful fetch.

#### 404 not found (3 tests)

- **Test:** `[P1] Given MSW returns 404, When useCliente rejects, Then isError is true`
  - **Status:** RED — Hook not implemented; 404 as error not handled.
  - **Verifies:** AC3 — `isError` is true when API returns 404.

- **Test:** `[P1] Given MSW returns 404, When useCliente rejects, Then error response status is 404`
  - **Status:** RED — Axios error with `response.status` not propagated.
  - **Verifies:** AC3 — Error carries HTTP status 404 for detection via `AxiosError`.

- **Test:** `[P1] Given MSW returns 404, When useCliente rejects, Then data is undefined`
  - **Status:** RED — Hook not implemented.
  - **Verifies:** AC3 — No stale data is shown on error.

#### queryKey contract (2 tests)

- **Test:** `[P1] Given useCliente runs, When the query is registered, Then queryKey is exactly ['clientes', id]`
  - **Status:** RED — `useCliente` not implemented; canonical queryKey not set.
  - **Verifies:** AC2 — Critical: `queryKey: ['clientes', id]` must be exact (architecture contract).

- **Test:** `[P1] Given useCliente runs, When data loads, Then refetch function is available`
  - **Status:** RED — Hook not implemented.
  - **Verifies:** AC3 / AC4 — `refetch` exposed for `ErrorPanel` retry functionality.

---

### Unit Tests — C# / xUnit — GetClienteByIdQueryHandler (12 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

#### Entity found: returns ClienteDto (7 tests)

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCorrectNombre`
  - **Status:** RED — `GetClienteByIdQueryHandler`, `GetClienteByIdQuery`, `IClienteRepository.GetByIdAsync` not implemented.
  - **Verifies:** AC2 — `Nombre` maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCorrectNitRuc`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC2 — `NitRuc` maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCorrectTelefono`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC2 — `Telefono` maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCorrectCiudad`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC2 — `Ciudad` maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithMatchingId`
  - **Status:** RED — Handler not implemented; Id not mapped.
  - **Verifies:** AC2 — `Id` (UUID) maps correctly to DTO.

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCreatedAtAsDateTimeOffset`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC2 — `CreatedAt` maps as `DateTimeOffset` (company standard).

- **Test:** `HandleAsync_WhenRepositoryReturnsEntity_AllFieldsMappedCorrectly`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC2 — All six DTO fields map correctly in a single assertion.

#### Entity not found: returns null (2 tests)

- **Test:** `HandleAsync_WhenRepositoryReturnsNull_ReturnsNull`
  - **Status:** RED — Handler not implemented; null return path not defined.
  - **Verifies:** AC3 — Handler returns `null` when entity is not found (maps to HTTP 404).

- **Test:** `HandleAsync_WhenIdDoesNotMatchAnyEntity_ReturnsNull`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC3 — Non-matching id results in `null` (not an exception).

#### Repository call contract (3 tests)

- **Test:** `HandleAsync_WhenCalledOnce_InvokesRepositoryGetByIdAsyncExactlyOnce`
  - **Status:** RED — Handler not implemented; call count not trackable.
  - **Verifies:** AC2 — No N+1: handler calls `GetByIdAsync` exactly once.

- **Test:** `HandleAsync_WhenCalled_PassesCorrectIdToRepository`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC2 — Handler passes the exact `query.Id` to the repository.

- **Test:** `HandleAsync_WhenRepositoryReturnsNull_StillCallsRepositoryExactlyOnce`
  - **Status:** RED — Handler not implemented.
  - **Verifies:** AC3 — Repository is called even in not-found path; handler does not short-circuit.

#### Return type contract (1 test)

- **Test:** `HandleAsync_WhenEntityFound_ReturnTypeIsClienteDto`
  - **Status:** RED — `ClienteDto` type not returned.
  - **Verifies:** AC2 — CQRS: query returns `ClienteDto?` (nullable for 404 path).

---

## Required data-testid Attributes

The following `data-testid` attributes MUST be added during implementation for tests to pass:

| Component | `data-testid` | Location |
|-----------|---------------|----------|
| Detail panel container | `cliente-detail-panel` | `ClienteDetailView.tsx` — outer `<div>` |
| Not-found message | `cliente-not-found` | `ClienteDetailView.tsx` — `<p>` for 404 state |

---

## Mock Requirements

### Frontend MSW Handlers (per component test file)

Each test file sets up its own inline MSW server. Handlers defined in `-ClienteDetailView.test.tsx`:

```typescript
// Success: returns full client object
http.get('/api/v1/clientes/:id', ({ params }) => {
  if (params.id === TEST_ID) return HttpResponse.json(mockCliente)
  return new HttpResponse(null, { status: 404 })
})

// 404 — application/problem+json (matches backend contract)
new HttpResponse(
  JSON.stringify({ status: 404, title: 'Cliente no encontrado' }),
  { status: 404, headers: { 'Content-Type': 'application/problem+json' } }
)

// Delayed response — for skeleton loading state tests
http.get('/api/v1/clientes/:id', async () => {
  await new Promise((resolve) => setTimeout(resolve, 60))
  return HttpResponse.json(mockCliente)
})
```

### Backend Test Double (xUnit)

`FakeClienteRepository` is defined inline in `GetClienteByIdQueryHandlerTests.cs`. Implements `IClienteRepository` with `GetByIdAsync` returning either the entity (if id matches) or `null`. Tracks `GetByIdAsyncCallCount` and `LastQueriedId` for contract verification. No real DB required.

---

## Implementation Checklist

### Step 1 — Backend: Add `GetByIdAsync` to IClienteRepository (makes FakeRepo compile)

- [ ] Add method to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`:
  `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);`

### Step 2 — Backend: Create `GetClienteByIdQuery` (AC: #2, #3)

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
  - Record: `public record GetClienteByIdQuery(Guid Id);`

### Step 3 — Backend: Create `GetClienteByIdQueryHandler` (makes GetClienteByIdQueryHandlerTests GREEN)

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  - Constructor takes `IClienteRepository`
  - `HandleAsync(GetClienteByIdQuery query, CancellationToken ct = default)` returns `Task<ClienteDto?>`
  - Call `repository.GetByIdAsync(query.Id, ct)` exactly once
  - Return `null` if entity is null
  - Map: `new ClienteDto(entity.Id, entity.Nombre, entity.NitRuc, entity.Telefono, entity.Ciudad, entity.CreatedAt)`
- [ ] Run: `dotnet test --filter "GetClienteByIdQueryHandlerTests"` — verify RED → GREEN

### Step 4 — Backend: Implement `GetByIdAsync` in `ClienteRepository`

- [ ] Add to `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
  `await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken)`

### Step 5 — Backend: Add `GET /api/v1/clientes/{id}` endpoint (AC: #2, #3)

- [ ] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add:
  `app.MapGet("/api/v1/clientes/{id:guid}", ...)` — returns `Results.Ok(dto)` or `Results.Problem(statusCode: 404)`
- [ ] Register DI in `Program.cs`: `builder.Services.AddScoped<GetClienteByIdQueryHandler>()`

### Step 6 — Frontend: Add `getById` to domain interface and repository

- [ ] Add `getById(id: string): Promise<Cliente>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Implement `getById` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`

### Step 7 — Frontend: Create `useCliente` hook (makes useCliente.test.ts GREEN)

- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`
  - Return `{ data, isLoading, isError, error, refetch }`
- [ ] Run: `npx vitest run src/modules/crm/clientes/application/useCliente.test.ts` — verify RED → GREEN

### Step 8 — Frontend: Create `ClienteDetailView` component (makes -ClienteDetailView.test.tsx GREEN)

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - Props: `{ clienteId: string }`
  - Import and call `useCliente(clienteId)`
  - Detect 404: `const isNotFound = isError && (error as AxiosError)?.response?.status === 404`
  - `isLoading` branch: 4 skeleton rows (`react-loading-skeleton`) — no spinner
  - `isNotFound` branch: `<p data-testid="cliente-not-found">Cliente no encontrado</p>`
  - `isError && !isNotFound` branch: `<ErrorPanel onRetry={refetch} />`
  - Data branch: detail card with `<dl>` containing labeled fields (`Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`)
  - Outer wrapper: `<div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-auto">`
- [ ] Run: `npx vitest run src/modules/crm/clientes/presentation/-ClienteDetailView.test.tsx` — verify RED → GREEN

### Step 9 — Frontend: Create nested route `/clientes/$clienteId` (AC: #1, #2)

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`
  - `export const Route = createFileRoute('/_app/clientes/$clienteId')({ component: ClienteDetailRoute })`
  - `ClienteDetailRoute` reads `clienteId` from `Route.useParams()` and renders `<ClienteDetailView clienteId={clienteId} />`
- [ ] Update `frontend/src/routes/_app/clientes.tsx` — replace right-panel placeholder with `<Outlet />`

### Step 10 — Frontend: Wire `ClienteListItem` click to navigate (AC: #1)

- [ ] Update `ClienteListView.tsx` — `useNavigate` → `navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })` on item click
- [ ] Track `selectedClienteId` from URL params via `useParams({ strict: false })`

---

## Running Tests

```bash
# Frontend — Component tests for ClienteDetailView
npx vitest run frontend/src/modules/crm/clientes/presentation/-ClienteDetailView.test.tsx

# Frontend — Unit tests for useCliente hook
npx vitest run frontend/src/modules/crm/clientes/application/useCliente.test.ts

# Frontend — All clientes module tests
npx vitest run frontend/src/modules/crm/clientes/

# Backend — Unit tests for GetClienteByIdQueryHandler
dotnet test backend/tests/SiesaAgents.UnitTests --filter "GetClienteByIdQueryHandlerTests"

# Backend — All unit tests
dotnet test backend/tests/SiesaAgents.UnitTests

# Full frontend test suite (RED phase confirmation)
npx vitest run frontend/src/modules/crm/clientes/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- Component tests created and failing: `-ClienteDetailView.test.tsx` (14 tests)
- Hook unit tests already created and failing: `useCliente.test.ts` (8 tests, pre-existing)
- Backend handler unit tests created and failing: `GetClienteByIdQueryHandlerTests.cs` (12 tests)

**Expected Failure Reasons:**

- Component tests: `Cannot find module './ClienteDetailView'` — component not yet created
- Hook tests: `Cannot find module './useCliente'` — hook not yet created
- Backend tests: `CS0246: The type or namespace 'GetClienteByIdQueryHandler' could not be found`

---

### GREEN Phase (DEV Team — Next Steps)

Implement tasks in this order for fastest feedback:

1. **Backend Domain Interface** (Step 1): Add `GetByIdAsync` to `IClienteRepository`
2. **Backend Application** (Steps 2–3): `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` → run `GetClienteByIdQueryHandlerTests`
3. **Backend Infrastructure + API** (Steps 4–5): Repository impl, endpoint, DI registration
4. **Frontend Domain + Infrastructure** (Step 6): Add `getById` to interface and repository
5. **Frontend Hook** (Step 7): `useCliente.ts` → run `useCliente.test.ts`
6. **Frontend Component** (Step 8): `ClienteDetailView.tsx` → run `-ClienteDetailView.test.tsx`
7. **Route + Navigation** (Steps 9–10): Nested route, `ClienteListItem` click wiring

---

### REFACTOR Phase (After All Tests Pass)

- [ ] Verify `queryKey: ['clientes', id]` is exact (architecture contract for cache invalidation)
- [ ] Verify `(error as AxiosError)?.response?.status === 404` detection is correct
- [ ] Verify skeleton uses `react-loading-skeleton` (not custom divs, not spinner)
- [ ] Verify all user-facing text is in Spanish (company standard)
- [ ] Verify `data-testid` attributes match: `cliente-detail-panel`, `cliente-not-found`
- [ ] Verify 404 response from backend uses `application/problem+json` without stack trace (NFR6)
- [ ] Run `npx vitest run frontend/src/modules/crm/clientes/` — zero failures
- [ ] Run `dotnet test backend/tests/SiesaAgents.UnitTests` — zero failures

---

## Coverage Summary

| AC | Story Criteria | Test Cases | Level |
|----|---------------|------------|-------|
| AC1 | Right panel shows Nombre, NIT/RUC, Teléfono, Ciudad; URL updates | TC-E2-P1-06a (5 comp), structural (2 comp) | Component |
| AC2 | Deep link `/clientes/:clienteId` loads correct client detail | useCliente success (3 hook), GetClienteByIdQueryHandler (7 unit) | Hook + Unit |
| AC3 | 404 shows "Cliente no encontrado" gracefully; shell remains | TC-E2-P1-08a (3 comp), TC-E2-P1-08b (3 comp), handler null (2 unit), useCliente 404 (3 hook) | Component + Hook + Unit |
| AC4 | Skeleton while loading, no spinner | Skeleton tests (3 comp), dataTestid panel (2 comp) | Component |

**Total tests generated: 34**
- Component (Vitest + RTL + MSW): 14 in `-ClienteDetailView.test.tsx`
- Hook unit (Vitest + renderHook + MSW): 8 in `useCliente.test.ts` (pre-existing)
- Backend unit — Application (xUnit): 12 in `GetClienteByIdQueryHandlerTests.cs`

---

**Generated by BMad TEA Agent** — 2026-05-24
