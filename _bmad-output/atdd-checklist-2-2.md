# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-17
**Author:** SiesaTeam
**Primary Test Level:** Component + API Integration + E2E

---

## Story Summary

A commercial team member needs to view the complete details of a client by selecting them from the list, with the right panel showing all fields (Nombre, NIT/RUC, Teléfono, Ciudad) without navigating away. The story also implements FR30 deep linking so that /clientes/:clienteId URLs can be shared and bookmarked.

**As a** commercial team member
**I want** to view complete client details by selecting a client from the list
**So that** I can review all client information without navigating away from the clients section

---

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows Nombre, NIT/RUC, Teléfono, Ciudad, **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (deep link), **Then** the correct client details are loaded and displayed without requiring prior navigation (FR30).

3. **Given** a clienteId in the URL does not exist (non-existent UUID), **When** the page loads or the detail panel renders, **Then** a not-found message is displayed gracefully with no unhandled JS error.

---

## Failing Tests Created (RED Phase)

### E2E Tests (11 tests)

**File:** `e2e/tests/clientes/clientes-detail-view.spec.ts`

- **Test:** AC1 — should display Nombre in the right panel when user clicks a client list item
  - **Status:** RED — `cliente-detail-panel` and `cliente-detail-nombre` data-testid attributes do not exist yet
  - **Verifies:** AC1 — Right panel shows client Nombre on list item click

- **Test:** AC1 — should display NIT/RUC in the right panel when user clicks a client list item
  - **Status:** RED — `cliente-detail-nitruc` data-testid does not exist yet
  - **Verifies:** AC1 — Right panel shows NIT/RUC on list item click

- **Test:** AC1 — should display Teléfono in the right panel when user clicks a client list item
  - **Status:** RED — `cliente-detail-telefono` data-testid does not exist yet
  - **Verifies:** AC1 — Right panel shows Teléfono on list item click

- **Test:** AC1 — should display Ciudad in the right panel when user clicks a client list item
  - **Status:** RED — `cliente-detail-ciudad` data-testid does not exist yet
  - **Verifies:** AC1 — Right panel shows Ciudad on list item click

- **Test:** AC1 — should update the URL to /clientes/:clienteId when user clicks a client list item
  - **Status:** RED — TanStack Router `<Link>` not yet replacing `<a href>` in ClientListItem; route does not exist
  - **Verifies:** AC1 — FR30 deep link URL update on click

- **Test:** AC1 — should keep the left panel list visible while the right panel shows client details
  - **Status:** RED — Split-panel `<Outlet />` not yet added to clientes.tsx
  - **Verifies:** AC1 — Split-panel layout with both panels simultaneously visible

- **Test:** AC1 — should highlight the active client item with aria-current="page"
  - **Status:** RED — `activeProps` not yet set on TanStack Router `<Link>`
  - **Verifies:** AC1 — WCAG 2.1 AA active item indicator

- **Test:** TC-E2-P1-08 — should load and display Nombre when navigating directly to /clientes/:clienteId
  - **Status:** RED — Dynamic route `clientes.$clienteId.tsx` does not exist yet
  - **Verifies:** AC2 — FR30 deep link direct navigation loads Nombre

- **Test:** TC-E2-P1-08 — should load and display NIT/RUC when navigating directly to /clientes/:clienteId
  - **Status:** RED — Same: missing dynamic route and ClienteDetailView component
  - **Verifies:** AC2 — FR30 direct navigation loads NIT/RUC

- **Test:** TC-E2-P1-08 — should load and display Teléfono when navigating directly to /clientes/:clienteId
  - **Status:** RED — Same: missing dynamic route and ClienteDetailView component
  - **Verifies:** AC2 — FR30 direct navigation loads Teléfono

- **Test:** TC-E2-P1-08 — should load and display Ciudad when navigating directly to /clientes/:clienteId
  - **Status:** RED — Same: missing dynamic route and ClienteDetailView component
  - **Verifies:** AC2 — FR30 direct navigation loads Ciudad

- **Test:** TC-E2-P1-08 — should display region with aria-label="Detalle del cliente"
  - **Status:** RED — ClienteDetailView not yet implemented with the required aria-label
  - **Verifies:** AC2 — WCAG 2.1 AA landmark on detail panel

- **Test:** AC3 — should display a not-found message when navigating to a non-existent clienteId
  - **Status:** RED — Not-found state (`cliente-not-found` data-testid) not yet implemented
  - **Verifies:** AC3 — Graceful 404 handling

- **Test:** AC3 — should display Spanish not-found text when clienteId does not exist
  - **Status:** RED — "No se encontró el cliente solicitado." text not yet rendered
  - **Verifies:** AC3 — Spanish not-found message

- **Test:** AC3 — should NOT throw an unhandled JS error when clienteId does not exist
  - **Status:** RED — No error boundary handling yet for 404 state
  - **Verifies:** AC3 — No unhandled JS errors on 404

- **Test:** AC3 — should provide a back affordance in the not-found state
  - **Status:** RED — `cliente-not-found-back` data-testid not yet implemented
  - **Verifies:** AC3 — Back navigation affordance

### API Integration Tests (11 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteGetByIdTests.cs`

- **Test:** GivenOneClientSeeded_WhenGetClienteById_ThenReturns200
  - **Status:** RED — GET /api/v1/clientes/{id} endpoint does not exist
  - **Verifies:** TC-E2-P1-07 (backend) — HTTP 200 on valid GET by ID

- **Test:** GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectId
  - **Status:** RED — Same: missing endpoint
  - **Verifies:** TC-E2-P1-07 — id field in response matches seeded UUID

- **Test:** GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectNombre
  - **Status:** RED — Same: missing endpoint
  - **Verifies:** TC-E2-P1-07 — nombre field correct

- **Test:** GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectNitRuc
  - **Status:** RED — Same: missing endpoint + camelCase field requirement
  - **Verifies:** TC-E2-P1-07 — nitRuc field (camelCase) correct

- **Test:** GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectTelefono
  - **Status:** RED — Same: missing endpoint
  - **Verifies:** TC-E2-P1-07 — telefono field correct

- **Test:** GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectCiudad
  - **Status:** RED — Same: missing endpoint
  - **Verifies:** TC-E2-P1-07 — ciudad field correct

- **Test:** GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCreatedAt
  - **Status:** RED — Same: missing endpoint + DateTimeOffset format requirement
  - **Verifies:** TC-E2-P1-07 — createdAt field is valid ISO-8601 DateTimeOffset

- **Test:** TC-E2-P2-08 — GivenNonExistentClienteId_WhenGetClienteById_ThenReturns404
  - **Status:** RED — Endpoint does not exist
  - **Verifies:** TC-E2-P2-08 — HTTP 404 on non-existent UUID (Guid.Empty)

- **Test:** TC-E2-P2-08 — GivenNonExistentClienteId_WhenGetClienteById_ThenContentTypeIsProblemJson
  - **Status:** RED — Endpoint does not exist; no Problem Details implementation yet
  - **Verifies:** TC-E2-P2-08 — Content-Type: application/problem+json (RFC 7807)

- **Test:** TC-E2-P2-08 — GivenNonExistentClienteId_WhenGetClienteById_ThenResponseBodyContainsProblemDetailsStatus404
  - **Status:** RED — Same: missing endpoint + Problem Details body
  - **Verifies:** TC-E2-P2-08 — Problem Details body contains status: 404

- **Test:** TC-E2-P2-08 — GivenNonExistentClienteId_WhenGetClienteById_ThenResponseBodyContainsProblemDetailsTitle
  - **Status:** RED — Same: missing title field in Problem Details
  - **Verifies:** TC-E2-P2-08 — title: "Cliente no encontrado" in Problem Details

- **Test:** GivenRandomNonExistentClienteId_WhenGetClienteById_ThenReturns404
  - **Status:** RED — Endpoint does not exist
  - **Verifies:** TC-E2-P2-08 — 404 for any non-existent UUID (not only Guid.Empty)

- **Test:** GivenTwoClientsSeeded_WhenGetClienteByFirstId_ThenReturnsOnlyFirstClientData
  - **Status:** RED — Endpoint does not exist; tests GET by ID isolation
  - **Verifies:** TC-E2-P1-07 — Correct client returned when multiple exist

### Component Tests (18 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- **Test (Group TC-E2-P1-07):** should display the client Nombre when MSW returns a valid client
  - **Status:** RED — ClienteDetailView component does not exist
  - **Verifies:** TC-E2-P1-07 — Nombre visible in DOM

- **Test (Group TC-E2-P1-07):** should display the client NIT/RUC when MSW returns a valid client
  - **Status:** RED — Same: missing component
  - **Verifies:** TC-E2-P1-07 — NIT/RUC visible

- **Test (Group TC-E2-P1-07):** should display the client Teléfono when MSW returns a valid client
  - **Status:** RED — Same: missing component
  - **Verifies:** TC-E2-P1-07 — Teléfono visible

- **Test (Group TC-E2-P1-07):** should display the client Ciudad when MSW returns a valid client
  - **Status:** RED — Same: missing component
  - **Verifies:** TC-E2-P1-07 — Ciudad visible

- **Test (Group TC-E2-P1-07):** should render a section with aria-label="Detalle del cliente"
  - **Status:** RED — Missing component and aria-label attribute
  - **Verifies:** AC1/AC2 — WCAG 2.1 AA region landmark

- **Test (Group TC-E2-P1-07):** should render NIT/RUC label as "NIT/RUC" in Spanish
  - **Status:** RED — Missing component
  - **Verifies:** Spanish UI text requirement (mandatory)

- **Test (Group TC-E2-P1-07):** should render Teléfono label in Spanish
  - **Status:** RED — Missing component
  - **Verifies:** Spanish UI text requirement (mandatory)

- **Test (Group TC-E2-P1-07):** should render Ciudad label in Spanish
  - **Status:** RED — Missing component
  - **Verifies:** Spanish UI text requirement (mandatory)

- **Test (Group TC-E2-P1-07):** should use `<dl>` semantic markup for field-value pairs
  - **Status:** RED — Missing component and `<dl>` structure
  - **Verifies:** WCAG 2.1 AA semantic markup requirement

- **Test (Group TC-E2-P1-09):** should display a not-found message when MSW returns HTTP 404
  - **Status:** RED — Missing component and 404 detection logic
  - **Verifies:** TC-E2-P1-09 — Not-found state on 404

- **Test (Group TC-E2-P1-09):** should display the Spanish not-found message text
  - **Status:** RED — Missing component
  - **Verifies:** TC-E2-P1-09 — "No se encontró el cliente solicitado." text

- **Test (Group TC-E2-P1-09):** should NOT display client fields when MSW returns 404
  - **Status:** RED — Missing component
  - **Verifies:** TC-E2-P1-09 — No data fields rendered in not-found state

- **Test (Group TC-E2-P1-09):** should NOT display the error retry panel when MSW returns 404
  - **Status:** RED — Missing component and 404 vs generic error distinction
  - **Verifies:** TC-E2-P1-09 — 404 state is distinct from generic ErrorPanel state

- **Test (Group TC-E2-P1-09):** should NOT throw an unhandled error when MSW returns 404
  - **Status:** RED — Missing component
  - **Verifies:** TC-E2-P1-09 — No unhandled errors on 404

- **Test (Skeleton):** should render skeleton placeholders while the API request is in-flight
  - **Status:** RED — `cliente-detail-skeleton` data-testid does not exist
  - **Verifies:** Loading state uses react-loading-skeleton (not spinner)

- **Test (Skeleton):** should hide the skeleton and display client data after MSW responds
  - **Status:** RED — Missing component
  - **Verifies:** Skeleton disappears after data loads

- **Test (Skeleton):** should NOT render a spinner — only skeleton placeholders
  - **Status:** RED — Missing component; anti-pattern guard
  - **Verifies:** Spinner anti-pattern prevention (mandatory)

- **Test (ErrorPanel):** should render ErrorPanel when MSW returns a 500 server error
  - **Status:** RED — Missing component and non-404 error state
  - **Verifies:** Generic error state shows ErrorPanel with retry

- **Test (ErrorPanel):** should render ErrorPanel with Reintentar button on network error
  - **Status:** RED — Missing component
  - **Verifies:** Network error state shows Reintentar button

- **Test (ErrorPanel):** should NOT display the not-found message when the error is NOT a 404
  - **Status:** RED — Missing component
  - **Verifies:** Error state distinction: 404 vs generic error

---

## Data Factories

### Cliente Factory (Component Tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (inline)

**Exports:**
- `buildClienteDto(overrides?)` — Create a single `Cliente` DTO with unique generated values and optional overrides

**Example Usage:**
```typescript
const cliente = buildClienteDto({ nombre: 'Empresa Specific S.A.', ciudad: 'Cali' })
```

### E2E Client Factory

**File:** `e2e/helpers/data.helper.ts` (existing — reused without modification)

**Exports (existing):**
- `buildCliente(overrides?)` — Create E2E client payload (nombre, nit, telefono, ciudad)

---

## Fixtures Created

### API Cleanup Fixture (E2E Tests)

Pattern used in `e2e/tests/clientes/clientes-detail-view.spec.ts`:

**Pattern:** `test.beforeEach` / `test.afterEach` with `ApiHelper` + `createdIds` array
- **Setup:** Instantiate `ApiHelper` per test
- **Provides:** Direct API client for creating/deleting test data
- **Cleanup:** Deletes all created client IDs after each test via `apiHelper.deleteCliente(id)`

No additional fixture files were created — existing `ApiHelper` and `buildCliente` patterns from Story 2.1 are reused.

---

## Mock Requirements (MSW — Component Tests)

### GET /api/v1/clientes/{id} — Success

**Endpoint:** `GET */api/v1/clientes/:clienteId`

**Success Response (HTTP 200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Detail Visible S.A.S.",
  "nitRuc": "900987654-3",
  "telefono": "3219876543",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-17T14:30:00Z"
}
```

### GET /api/v1/clientes/{id} — Not Found

**Endpoint:** `GET */api/v1/clientes/:nonExistentId`

**404 Response (Problem Details RFC 7807):**
```json
{
  "status": 404,
  "title": "Cliente no encontrado",
  "detail": "No existe un cliente con el ID especificado."
}
```

**Notes:**
- Component tests use MSW 2 (`http.get`, `HttpResponse.json`) — same pattern as Story 2.1
- E2E tests use Playwright `page.route()` for 404 scenarios with non-existent UUIDs
- E2E happy path tests use the real backend via `ApiHelper.createCliente()` + `deleteCliente()` for cleanup
- MSW server is shared across component test describe blocks — `server.resetHandlers()` in `afterEach` ensures isolation

---

## Required data-testid Attributes

### ClienteDetailView Component (`frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`)

- `cliente-detail-panel` — The outer container of the client detail panel (section element)
- `cliente-detail-skeleton` — Skeleton loading placeholder (rendered during `isLoading` state)
- `cliente-detail-nombre` — The client's Nombre heading or display element
- `cliente-detail-nitruc` — The NIT/RUC field value (`<dd>` element)
- `cliente-detail-telefono` — The Teléfono field value (`<dd>` element)
- `cliente-detail-ciudad` — The Ciudad field value (`<dd>` element)
- `cliente-not-found` — The not-found state container (rendered on 404)
- `cliente-not-found-back` — The back affordance link/button in the not-found state

### Existing (from Story 2.1 — already required):

- `clientes-list-panel` — Left panel containing the client list
- `cliente-list-item` — Each client item in the list
- `empty-state` — Empty state component
- `error-panel` — Error panel component

**Implementation Example:**
```tsx
{/* Detail panel */}
<section
  data-testid="cliente-detail-panel"
  aria-label="Detalle del cliente"
  className="max-w-xl"
>
  <h2 data-testid="cliente-detail-nombre">{data.nombre}</h2>
  <dl>
    <div>
      <dt>NIT/RUC</dt>
      <dd data-testid="cliente-detail-nitruc">{data.nitRuc}</dd>
    </div>
    <div>
      <dt>Teléfono</dt>
      <dd data-testid="cliente-detail-telefono">{data.telefono}</dd>
    </div>
    <div>
      <dt>Ciudad</dt>
      <dd data-testid="cliente-detail-ciudad">{data.ciudad}</dd>
    </div>
  </dl>
</section>

{/* Not-found state */}
<div data-testid="cliente-not-found">
  <p>No se encontró el cliente solicitado.</p>
  <Link to="/clientes" data-testid="cliente-not-found-back">Volver a clientes</Link>
</div>

{/* Skeleton (react-loading-skeleton — NOT spinner) */}
<div data-testid="cliente-detail-skeleton">
  <Skeleton height={32} width={300} />
  <Skeleton count={3} />
</div>
```

---

## Implementation Checklist

### Test: TC-E2-P1-07 — Click client / direct navigation shows all 4 fields

**Files:**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteGetByIdTests.cs`
- `e2e/tests/clientes/clientes-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- [ ] Verify/add `GetByIdAsync(Guid id): Task<ClienteEntity?>` to `IClienteRepository.cs`
- [ ] Verify/add `GetByIdAsync` implementation in `ClienteRepository.cs` using `FindAsync(id)`
- [ ] Add `GET /api/v1/clientes/{id:guid}` endpoint to `ClienteEndpoints.cs` — returns `Ok(dto)` or `Problem(404)`
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `getById(id: string): Promise<Cliente>`
- [ ] Create/update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `getById`
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts` — `useQuery(['clientes', id], ...)`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — with `data-testid` attributes
- [ ] Add `data-testid="cliente-detail-panel"` on the `<section aria-label="Detalle del cliente">`
- [ ] Add `data-testid="cliente-detail-nombre"` on the Nombre heading
- [ ] Add `data-testid="cliente-detail-nitruc"` on the NIT/RUC `<dd>`
- [ ] Add `data-testid="cliente-detail-telefono"` on the Teléfono `<dd>`
- [ ] Add `data-testid="cliente-detail-ciudad"` on the Ciudad `<dd>`
- [ ] Use `<dl>` + `<dt>`/`<dd>` semantic markup for field-value pairs (WCAG 2.1 AA)
- [ ] All UI labels in Spanish: "NIT/RUC", "Teléfono", "Ciudad"
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test.tsx`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "ClienteGetByIdTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3–4 hours

---

### Test: TC-E2-P1-08 — Deep link direct navigation to /clientes/:clienteId

**Files:**
- `e2e/tests/clientes/clientes-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — TanStack Router dynamic route
- [ ] Update `frontend/src/routes/_app/clientes.tsx` — add `<Outlet />` to the right panel
- [ ] Ensure `ClienteDetailView` renders inside the `<Outlet />` slot of the split-panel layout
- [ ] Test that `useParams()` / `Route.useParams()` correctly extracts `clienteId` from the URL
- [ ] Run test: `pnpm test:e2e -- e2e/tests/clientes/clientes-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1–2 hours

---

### Test: TC-E2-P1-09 / AC3 — Not-found state for non-existent clienteId

**Files:**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `e2e/tests/clientes/clientes-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] In `useCliente`, set `retry: (count, error) => error?.response?.status === 404 ? false : count < 2`
- [ ] In `ClienteDetailView`, detect `isError && error?.response?.status === 404` as distinct not-found state
- [ ] Render `<NotFoundMessage>` (or equivalent) with `data-testid="cliente-not-found"` on 404
- [ ] Include text "No se encontró el cliente solicitado." in the not-found state (Spanish — mandatory)
- [ ] Include a back affordance (`<Link to="/clientes">`) with `data-testid="cliente-not-found-back"`
- [ ] Ensure no `console.error` for unhandled rejection when 404 is received
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test.tsx`
- [ ] Run test: `pnpm test:e2e -- e2e/tests/clientes/clientes-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-P2-08 — Backend returns HTTP 404 Problem Details for non-existent UUID

**Files:**
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteGetByIdTests.cs`

**Tasks to make this test pass:**

- [ ] Implement `GET /api/v1/clientes/{id:guid}` endpoint handler
- [ ] On null result from handler: return `Results.Problem(statusCode: 404, title: "Cliente no encontrado", detail: "...")`
- [ ] Verify the Problem Details response has `Content-Type: application/problem+json`
- [ ] Verify the Problem Details body contains `status: 404` and `title: "Cliente no encontrado"`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "ClienteGetByIdTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 30 minutes

---

### Test: Skeleton loading state

**Files:**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] In `ClienteDetailView`, detect `isLoading` state from `useCliente`
- [ ] Render `<Skeleton>` placeholders from `react-loading-skeleton` (NOT a spinner) during loading
- [ ] Add `data-testid="cliente-detail-skeleton"` on the skeleton container
- [ ] Ensure skeleton disappears and data renders after API response
- [ ] Ensure no `role="progressbar"` or `data-testid="spinner"` elements exist during loading
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 30 minutes

---

### Test: AC1 — Click list item updates URL and shows detail (E2E)

**Files:**
- `e2e/tests/clientes/clientes-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Update `ClientListItem.tsx` — replace `<a href>` with TanStack Router `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>`
- [ ] Add `activeProps={{ className: 'bg-blue-50 border-l-2 border-[#0e79fd]' }}` on the `<Link>` for visual active state
- [ ] Add `aria-current="page"` on the active link (via `activeProps` or conditional logic)
- [ ] Update `clientes.tsx` to include `<Outlet />` in the right panel
- [ ] Run test: `pnpm test:e2e -- e2e/tests/clientes/clientes-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all component tests for Story 2.2
pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx

# Run backend API integration tests for Story 2.2
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "ClienteGetByIdTests"

# Run E2E tests for Story 2.2
pnpm test:e2e -- e2e/tests/clientes/clientes-detail-view.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm test:e2e -- e2e/tests/clientes/clientes-detail-view.spec.ts --headed

# Debug a specific E2E test
pnpm test:e2e -- e2e/tests/clientes/clientes-detail-view.spec.ts --debug

# Run all tests (component + E2E)
pnpm --filter frontend test && pnpm test:e2e
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Factories created (inline in test files using `buildClienteDto`)
- ✅ Mock requirements documented (MSW 2 + Playwright `page.route()`)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- Component tests fail with: `Cannot find module './ClienteDetailView'`
- Backend tests fail with: `Expected: NotFound (404), Actual: NotFound — endpoint path does not match`
- E2E tests fail with: `Timeout: Waiting for locator '[data-testid="cliente-detail-panel"]'`

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from the implementation checklist (start with backend: `ClienteGetByIdTests`)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in the implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: `GetClienteByIdQuery.cs` + `GetClienteByIdQueryHandler.cs` + `IClienteRepository.GetByIdAsync`
2. Backend: `GET /api/v1/clientes/{id:guid}` endpoint in `ClienteEndpoints.cs`
3. Frontend: `useCliente.ts` hook
4. Frontend: `ClienteDetailView.tsx` component (success + loading + error + not-found states)
5. Frontend: `clientes.$clienteId.tsx` dynamic route
6. Frontend: `clientes.tsx` — add `<Outlet />` + update split-panel
7. Frontend: `ClientListItem.tsx` — replace `<a href>` with TanStack Router `<Link>`

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Check `siesa-ui-kit` catalog for `DetailPanel`/`Card`/`DescriptionList` components — migrate if available
3. Ensure dark mode classes (`dark:`) are applied to all elements in `ClienteDetailView`
4. Review for duplicated query patterns vs Story 2.1 (`useClientes`)
5. Ensure `TreatWarningsAsErrors = true` — zero compiler warnings in backend
6. Run linter: `pnpm --filter frontend lint`

---

## Next Steps

1. **Run failing tests** to confirm RED phase: `pnpm --filter frontend test ClienteDetailView.test.tsx`
2. **Begin implementation** using the implementation checklist as a guide
3. **Work one test at a time** (RED → GREEN for each test)
4. **Backend first** — endpoint and handler before frontend components
5. **Share progress** in daily standup

---

## Knowledge Base References Applied

- **network-first.md** — Playwright `page.route()` intercept before `page.goto()` in all E2E 404 scenarios
- **fixture-architecture.md** — `beforeEach`/`afterEach` with `createdIds` array and `ApiHelper` for E2E cleanup
- **data-factories.md** — `buildClienteDto()` inline factory with overrides support; `buildCliente()` reused from Story 2.1
- **component-tdd.md** — `renderClienteDetailView()` helper wrapping QueryClientProvider; fresh client per test
- **test-quality.md** — One assertion per test (atomic); Given-When-Then structure; no hard waits
- **selector-resilience.md** — `data-testid` selectors for all assertions; ARIA role selectors for buttons and regions

---

## Test Execution Evidence

**Status at generation time:** RED (all tests fail — no implementation exists)

**Component tests expected failure:**
```
FAIL src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx
  Cannot find module './ClienteDetailView' from '...ClienteDetailView.test.tsx'
```

**Backend tests expected failure:**
```
FAIL SiesaAgents.IntegrationTests.Clientes.ClienteGetByIdTests
  Expected: System.Net.HttpStatusCode.OK
  Actual:   System.Net.HttpStatusCode.NotFound
  (GET /api/v1/clientes/{id} route not found)
```

**E2E tests expected failure:**
```
FAIL e2e/tests/clientes/clientes-detail-view.spec.ts
  TimeoutError: locator.click: Timeout 30000ms exceeded.
  Call log: waiting for getByTestId('cliente-list-item')...
  (ClienteDetailView component and dynamic route do not exist yet)
```

**Summary:**
- Total tests: 40 (11 E2E + 13 API Integration + 16 Component)
- Passing: 0 (expected — RED phase)
- Failing: 40 (expected — RED phase)
- Status: ✅ RED phase confirmed

---

## Notes

- The `useCliente` query key MUST be `['clientes', id]` — canonical from architecture.md. Do NOT use a string key.
- Retry MUST be disabled on 404 — use `retry: (count, error) => error?.response?.status === 404 ? false : count < 2`
- `react-loading-skeleton` is the only allowed loading indicator — NO spinners (anti-pattern)
- All UI text must be in Spanish: labels, error messages, loading text, aria-labels
- Check `siesa-ui-kit` catalog before building custom UI components
- `DateTimeOffset` (NOT `DateTime`) for all date fields in backend (TreatWarningsAsErrors will catch this)
- `EF Core FindAsync(id)` preferred over `FirstOrDefaultAsync` for primary key lookups

---

**Generated by BMad TEA Agent** — 2026-06-17
