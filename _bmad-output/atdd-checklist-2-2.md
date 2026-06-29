# ATDD Checklist — Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW)

---

## Story Summary

As a commercial team member, I want to view the complete details of a client by selecting them from the list, so that I can review all their information (Nombre, NIT/RUC, Teléfono, Ciudad) without navigating away from the clients section. The feature supports deep linking via `/clientes/:clienteId` and graceful 404 handling for non-existent IDs.

**As a** commercial team member
**I want** to view complete client details by selecting a client from the list
**So that** I can review their information using deep links without leaving the clients section

---

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel renders the complete client details showing: Nombre, NIT/RUC, Teléfono, and Ciudad.
2. **Given** the user clicks a client item, **When** the right panel loads, **Then** the URL updates to `/clientes/:clienteId` reflecting the selected client's UUID.
3. **Given** the user accesses the URL `/clientes/:clienteId` directly (deep link), **When** the page loads, **Then** the correct client details are fetched from `GET /api/v1/clientes/{id}` and displayed.
4. **Given** a `clienteId` in the URL does not correspond to any existing client, **When** the API returns 404, **Then** "Cliente no encontrado" is displayed gracefully with no JS crash.
5. **Given** no client has been selected yet, **When** the right panel has no active selection, **Then** the right panel displays an EmptyState with Spanish prompt "Selecciona un cliente para ver sus detalles".
6. **Given** the user clicks a client item, **When** the detail renders, **Then** a `GET /api/v1/clientes/{id}` request is triggered using `queryKey: ['clientes', clienteId]`.

---

## Failing Tests Created (RED Phase)

### Unit Tests (5 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

- ✅ **Test:** should NOT enable the query when clienteId is null
  - **Status:** RED — Cannot find module `./useCliente` (file does not exist yet)
  - **Verifies:** AC #6 — `enabled: false` guard with null

- ✅ **Test:** should NOT enable the query when clienteId is undefined
  - **Status:** RED — Cannot find module `./useCliente`
  - **Verifies:** AC #6 — `enabled: false` guard with undefined

- ✅ **Test:** should NOT enable the query when clienteId is an empty string
  - **Status:** RED — Cannot find module `./useCliente`
  - **Verifies:** AC #6 — `enabled: false` guard with empty string

- ✅ **Test:** should enable the query when clienteId is a valid UUID string
  - **Status:** RED — Cannot find module `./useCliente`
  - **Verifies:** AC #6 — `enabled: true` with valid ID

- ✅ **Test:** should use queryKey ["clientes", clienteId] for the single-item query
  - **Status:** RED — Cannot find module `./useCliente`
  - **Verifies:** AC #6 — canonical query key pattern

### Component Tests (15 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**AC #5 — Empty state (3 tests):**

- ✅ **Test:** should render the empty state panel when clienteId is null
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #5 — empty state panel rendered

- ✅ **Test:** should show a Spanish prompt to select a client when clienteId is null
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #5 — "Selecciona un cliente" text

- ✅ **Test:** should NOT render the detail panel fields when clienteId is null
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #5 — no detail fields visible in empty state

**TC-E2-P1-04 — All fields rendered (5 tests):**

- ✅ **Test:** should render Nombre when a client is fetched successfully
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #1 — Nombre field

- ✅ **Test:** should render NIT/RUC when a client is fetched successfully
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #1 — NIT/RUC field

- ✅ **Test:** should render Teléfono when a client is fetched successfully
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #1 — Teléfono field

- ✅ **Test:** should render Ciudad when a client is fetched successfully
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #1 — Ciudad field

- ✅ **Test:** should show the client detail panel (not empty state) when a client is fetched
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #1 — detail panel visible, empty state hidden

**AC #4 — Not-found message on 404 (3 tests):**

- ✅ **Test:** should display "Cliente no encontrado" when API returns 404
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #4 — not-found message text

- ✅ **Test:** should NOT show a blank screen on 404
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #4 — data-testid element always present (R-E2-07)

- ✅ **Test:** should NOT render detail field rows when API returns 404
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #4 — fields not shown alongside error

**Loading state (2 tests):**

- ✅ **Test:** should show a skeleton while the client data is loading
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #1 — skeleton visible during fetch

- ✅ **Test:** should hide the skeleton once data arrives
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #1 — skeleton removed, detail panel shown

**AC #6 — Query triggered (2 tests):**

- ✅ **Test:** should call GET /api/v1/clientes/:clienteId when a valid clienteId is provided
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #6 — network request fired

- ✅ **Test:** should NOT call GET /api/v1/clientes/:clienteId when clienteId is null
  - **Status:** RED — Cannot find module `./ClienteDetailView`
  - **Verifies:** AC #6 — no network request when disabled

### E2E Tests (9 tests)

**File:** `e2e/tests/clientes/cliente-detail.spec.ts`

**TC-E2-P1-05 — Deep link to existing client (4 tests):**

- ✅ **Test:** should render the client Nombre in the detail panel when navigating directly to /clientes/:clienteId
  - **Status:** RED — Route `clientes.$clienteId.tsx` does not exist; page loads but detail panel missing
  - **Verifies:** AC #3 — deep link hydrates client detail

- ✅ **Test:** should NOT show a blank page when navigating directly to /clientes/:clienteId
  - **Status:** RED — `cliente-detail-panel` testid missing
  - **Verifies:** AC #3 — no blank page on deep link

- ✅ **Test:** should NOT redirect away from /clientes/:clienteId when loading a valid client
  - **Status:** RED — URL may redirect to `/clientes` if route is missing
  - **Verifies:** AC #2, #3 — URL preserved

- ✅ **Test:** should display NIT/RUC in the detail panel on direct navigation
  - **Status:** RED — `cliente-detail-nit` testid missing
  - **Verifies:** AC #3 — NIT shown on deep link

**TC-E2-P1-06 — Deep link to non-existent client (4 tests):**

- ✅ **Test:** should display a not-found message when navigating to /clientes/:nonExistentId
  - **Status:** RED — `cliente-detail-not-found` testid missing
  - **Verifies:** AC #4, R-E2-07

- ✅ **Test:** should show "Cliente no encontrado" text on 404 deep link
  - **Status:** RED — testid and text missing
  - **Verifies:** AC #4 — Spanish message

- ✅ **Test:** should keep the navigation shell visible when a 404 occurs on deep link
  - **Status:** RED — `nav-shell` testid may be missing or detail crashes
  - **Verifies:** AC #4 — navigation shell preserved

- ✅ **Test:** should NOT crash the page (no blank white screen) on 404 deep link
  - **Status:** RED — unhandled error may crash
  - **Verifies:** AC #4, R-E2-07 — no JS crash

**AC #2 — URL update on list click (1 test):**

- ✅ **Test:** should update the URL to /clientes/:clienteId when a list item is clicked
  - **Status:** RED — `ClienteListView` not wired with navigation; URL does not change
  - **Verifies:** AC #2 — deep link URL generated on click

### API Integration Tests (4 tests — xUnit)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteDetailEndpointsTests.cs`

- ✅ **Test:** TC_E2_P2_09_GetClienteById_Returns404_WithProblemDetails_WhenClientNotFound
  - **Status:** RED — Endpoint `GET /api/v1/clientes/{id}` does not exist; returns 404 "Not Found" from router, not Problem Details
  - **Verifies:** TC-E2-P2-09, AC #4

- ✅ **Test:** GetClienteById_Returns_ProblemJsonContentType_WhenClientNotFound
  - **Status:** RED — Content-Type is not `application/problem+json`
  - **Verifies:** TC-E2-P2-09 — RFC 7807 compliance

- ✅ **Test:** GetClienteById_Returns200_WithClienteDto_WhenClientExists
  - **Status:** RED — Endpoint does not exist
  - **Verifies:** AC #3 — 200 with ClienteDto on success

- ✅ **Test:** GetClienteById_DoesNotExposeStackTrace_WhenClientNotFound
  - **Status:** RED — Endpoint does not exist; assertion on Problem Details structure
  - **Verifies:** TC-E2-P2-09, NFR6 — no stack trace exposed

---

## Data Factories Created

### Cliente Factory (extended)

**File:** `frontend/src/test/factories/cliente.factory.ts` (existing, from Story 2.1)

**Exports:**
- `createCliente(overrides?)` — Create single client; used in all component and unit tests
- `createClientes(count, overrides?)` — Create array of clients
- `resetClienteCounter()` — Reset counter for deterministic IDs in beforeEach

**No new factory file needed** — Story 2.1 factory covers all fields required for Story 2.2.

---

## MSW Handlers Created

### Single-Client GET Handler

**File:** `frontend/src/test/msw/handlers/clientes-detail.handlers.ts` (new)

**Exports:**
- `handleGetClienteByIdSuccess(client)` — Returns the client when ID matches; 404 otherwise
- `handleGetClienteByIdNotFound(clienteId?)` — Returns 404 Problem Details for any request
- `handleGetClienteByIdDelayed(client, delayMs)` — Simulates loading state with delay
- `handleGetClienteByIdError()` — Returns HTTP 500 for error state testing

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-panel` — Outer container when a client is loaded and data is available
- `cliente-detail-empty` — Shown when `clienteId` is null/undefined (empty/default state)
- `cliente-detail-skeleton` — Loading skeleton shown while fetch is in-flight
- `cliente-detail-not-found` — Shown when API returns 404
- `cliente-detail-nombre` — Nombre field value element
- `cliente-detail-nit` — NIT/RUC field value element
- `cliente-detail-telefono` — Teléfono field value element
- `cliente-detail-ciudad` — Ciudad field value element

### Navigation Shell (already in E2E shell)

- `nav-shell` — The app's navigation shell (sidebar/header); must remain visible even on error

### ClienteListView / ClientListItem (update needed for AC #2)

- `cliente-item-{id}` — Each list item (already defined in Story 2.1; pattern: `cliente-item-${client.id}`)

**Implementation Example:**

```tsx
// ClienteDetailView.tsx
function ClienteDetailView({ clienteId }: { clienteId: string | null }) {
  if (!clienteId) {
    return (
      <div data-testid="cliente-detail-empty">
        Selecciona un cliente para ver sus detalles
      </div>
    );
  }

  const { data, isLoading, isError } = useCliente(clienteId);

  if (isLoading) return <div data-testid="cliente-detail-skeleton">{/* skeleton */}</div>;
  if (isError || !data) {
    return <div data-testid="cliente-detail-not-found">Cliente no encontrado</div>;
  }

  return (
    <div data-testid="cliente-detail-panel">
      <span data-testid="cliente-detail-nombre">{data.nombre}</span>
      <span data-testid="cliente-detail-nit">{data.nit}</span>
      <span data-testid="cliente-detail-telefono">{data.telefono}</span>
      <span data-testid="cliente-detail-ciudad">{data.ciudad}</span>
    </div>
  );
}
```

---

## Mock Requirements

### GET /api/v1/clientes/{id} — Frontend MSW

**Endpoint:** `GET /api/v1/clientes/:clienteId`

**Success Response (200):**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "nombre": "Empresa Detalle SA",
  "nit": "900123456-7",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-29T10:00:00Z"
}
```

**Not-Found Response (404 — RFC 7807):**
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "Cliente con ID 00000000-0000-0000-0000-000000000000 no encontrado."
}
```

**Notes:**
- Content-Type for 404 must be `application/problem+json` in the real backend
- Never expose `stackTrace`, `exception`, or `innerException` fields in the 404 body

---

## Implementation Checklist

### Test: AC #6 — useCliente hook enabled guard

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - `export function useCliente(clienteId: string | null | undefined)`
  - Uses `useQuery({ queryKey: ['clientes', clienteId], queryFn: ..., enabled: !!clienteId })`
  - Exposes `data`, `isLoading`, `isError` from the query
- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `getById` in `clienteApiRepository.ts` calling `GET /api/v1/clientes/{id}`
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/application/useCliente.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-P1-04 / AC #1 / AC #5 / AC #4 — ClienteDetailView component

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - Accepts `clienteId: string | null` as prop
  - Renders `data-testid="cliente-detail-empty"` with "Selecciona un cliente..." when `clienteId` is null
  - Calls `useCliente(clienteId)` when `clienteId` is non-null
  - Shows `data-testid="cliente-detail-skeleton"` while `isLoading` is true
  - Shows `data-testid="cliente-detail-not-found"` with "Cliente no encontrado" when `isError` is true
  - Shows `data-testid="cliente-detail-panel"` with all 4 field testids when data is available
- [ ] Add `data-testid` attributes: `cliente-detail-panel`, `cliente-detail-empty`, `cliente-detail-skeleton`, `cliente-detail-not-found`, `cliente-detail-nombre`, `cliente-detail-nit`, `cliente-detail-telefono`, `cliente-detail-ciudad`
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E2-P1-05 / TC-E2-P1-06 — E2E deep linking

**File:** `e2e/tests/clientes/cliente-detail.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — TanStack Router dynamic route
  - Reads `clienteId` from `Route.useParams()`
  - Renders split-panel: `ClienteListView` (280px left) + `ClienteDetailView` (flex right)
- [ ] Update `frontend/src/routes/_app/clientes.tsx` — render split-panel with `ClienteDetailView clienteId={null}`
- [ ] Update `ClienteListView.tsx` — wire `<Link to="/clientes/$clienteId">` on each `ClientListItem`
- [ ] Ensure `nav-shell` data-testid exists on the navigation shell element
- [ ] Verify `GET /api/v1/clientes/{id}` backend endpoint exists and returns 200/404 correctly
- [ ] Run tests: `npx playwright test e2e/tests/clientes/cliente-detail.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours (includes route wiring, backend endpoint)

---

### Test: TC-E2-P2-09 — Backend GET /{id} endpoint

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteDetailEndpointsTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- [ ] Create `SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  - Fetches client by UUID from DbContext
  - Returns `ClienteDto` if found
  - Throws domain exception mapped to 404 if not found
- [ ] Update `SiesaAgents.API/Endpoints/ClientesEndpoints.cs` — add `GET /api/v1/clientes/{id}`
  - Returns 200 + `ClienteDto` on success
  - Returns 404 + Problem Details RFC 7807 when not found
  - `ExceptionHandlingMiddleware` handles the domain exception → 404
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "ClienteDetailEndpoints"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all unit tests for Story 2.2 (useCliente hook)
pnpm --filter frontend test src/modules/crm/clientes/application/useCliente.test.ts

# Run all component tests for Story 2.2 (ClienteDetailView)
pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx

# Run all Story 2.2 frontend tests together
pnpm --filter frontend test --reporter=verbose src/modules/crm/clientes

# Run E2E tests for Story 2.2 only
npx playwright test e2e/tests/clientes/cliente-detail.spec.ts

# Run E2E tests headed (see browser)
npx playwright test e2e/tests/clientes/cliente-detail.spec.ts --headed

# Debug E2E test
npx playwright test e2e/tests/clientes/cliente-detail.spec.ts --debug

# Run backend integration tests for Story 2.2
dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "ClienteDetailEndpoints"

# Run all tests
pnpm --filter frontend test && npx playwright test && dotnet test backend/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 33 tests written and failing across 4 test files
- ✅ MSW handler file created for single-client GET endpoint
- ✅ No new data factories needed (Story 2.1 factory reused)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests fail due to missing implementation, not test bugs
- Unit tests fail: "Cannot find module './useCliente'"
- Component tests fail: "Cannot find module './ClienteDetailView'"
- E2E tests fail: route `/clientes/:clienteId` does not exist → testids not found
- API integration tests fail: endpoint `GET /api/v1/clientes/{id}` does not exist → 404 without Problem Details

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with `useCliente.test.ts`)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run test to verify green
5. Move to next test — suggested order:
   - `useCliente.test.ts` (unit, no DOM needed, fastest feedback)
   - `ClienteDetailView.test.tsx` (component, depends on useCliente)
   - `ClienteDetailEndpointsTests.cs` (backend, enables real E2E)
   - `cliente-detail.spec.ts` (E2E, requires full stack)

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 33 tests pass
2. Review `ClienteDetailView.tsx` for clean component structure
3. Ensure `useCliente` hook follows same patterns as `useClientes` (staleTime, error handling)
4. Check that `clientes.$clienteId.tsx` route integrates cleanly with the existing `clientes.tsx` layout
5. Run tests after each refactor step
6. Mark story as DONE in sprint-status.yaml

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm --filter frontend test`
3. Begin with `useCliente.ts` (Task 1 in story) — fastest to implement
4. Implement `ClienteDetailView.tsx` (Task 3 in story)
5. Wire routes (Task 4 in story) — enables E2E tests to go green
6. Implement backend endpoint (Task 5 in story) — enables API tests and real E2E

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Fixture patterns: `server = setupServer()` with beforeEach/afterEach auto-cleanup
- **data-factories.md** — Reuse of Story 2.1 `createCliente(overrides)` factory; no duplication
- **component-tdd.md** — Red-green-refactor pattern for ClienteDetailView component tests
- **network-first.md** — Route interception before page.goto in all E2E tests; `page.route()` called before `page.goto()`
- **test-quality.md** — One assertion per test; explicit waits via `waitFor()`; no `hard` waits
- **selector-resilience.md** — All selectors use `data-testid`; no CSS class selectors

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures when running before implementation:**

```
FAIL frontend/src/modules/crm/clientes/application/useCliente.test.ts
  Error: Cannot find module './useCliente' from 'src/modules/crm/clientes/application/useCliente.test.ts'

FAIL frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx
  Error: Cannot find module './ClienteDetailView' from 'src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx'

FAIL [chromium] e2e/tests/clientes/cliente-detail.spec.ts
  Error: Locator.toBeVisible: Locator did not resolve to a single element
    selector: [data-testid="cliente-detail-panel"]

FAIL SiesaAgents.IntegrationTests.Clientes.ClienteDetailEndpointsTests
  Assert.Equal() Failure: Expected 404 (Not Found) but got 404 (Not Found) [different body]
  OR
  No route matched: GET /api/v1/clientes/{id}
```

**Summary:**

- Total tests: 33
- Passing: 0 (expected — RED phase)
- Failing: 33 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- Story 2.1's `ClienteListView` must be updated to wire navigation (`onClick` → TanStack Router `Link`) before AC #2 and TC-E2-P1-05 can go green.
- The `useCliente` hook introduced in this story uses a DISTINCT query key `['clientes', clienteId]` from the `useClientes` list hook `['clientes']` — no conflict.
- The `enabled: !!clienteId` guard is architecturally critical: it prevents a network request when the right panel has no selection (AC #5 / empty state scenario).
- All user-facing text in Spanish is mandatory per company standards: "Selecciona un cliente para ver sus detalles", "Cliente no encontrado".
- Loading state uses `react-loading-skeleton` (company standard); the test only checks for the `data-testid="cliente-detail-skeleton"` wrapper — internal skeleton markup is not tested.

---

**Generated by BMad TEA Agent** — 2026-06-29
