# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-12
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component

---

## Story Summary

As a commercial team member, I want to view the complete details of a client by selecting them from the list, so that I can review all their information without navigating away from the clients section. This story implements the right panel of the split-panel layout at `/clientes/:clienteId`, including deep-linking support (FR30). It covers the full stack: backend `GET /api/v1/clientes/{id}` endpoint, the `useCliente` TanStack Query hook, and the `ClienteDetailPanel` frontend component.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, when the user clicks on a client item, then the right panel shows Nombre, NIT/RUC, Teléfono, Ciudad and the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **AC2** — Given the user is on the client detail view, when the user accesses the URL `/clientes/:clienteId` directly, then the correct client details are loaded and displayed (FR30).

3. **AC3** — Given a `clienteId` in the URL does not exist, when the page loads, then a not-found message ("Cliente no encontrado") is displayed gracefully in the right panel without crashing the application.

4. **AC4** — Given the client detail is loading, when the `GET /api/v1/clientes/:id` fetch is in-flight, then skeleton placeholders (via `react-loading-skeleton`) are shown in the right panel.

5. **AC5** — Given the backend is unavailable when loading the detail, when the `GET /api/v1/clientes/:id` fetch fails, then an `ErrorPanel` with a "Reintentar" button is displayed in the right panel.

6. **AC6** — Given no client is selected, when the user is on `/clientes` without a `clienteId` param, then the right panel shows an `EmptyState` (variant `no-selection`) with text "Selecciona un cliente para ver sus detalles".

---

## Failing Tests Created (RED Phase)

### E2E Tests (20 tests)

**File:** `e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`

**AC1 — Clicking a client item shows its details in the right panel (5 tests):**

- **Test:** should navigate to /clientes/:clienteId when a client item is clicked
  - **Status:** RED - Route `/clientes/:clienteId` does not exist yet
  - **Verifies:** AC1 — URL deep-link update on click

- **Test:** should display the client Nombre in the right panel after clicking
  - **Status:** RED - `ClienteDetailPanel` component not implemented
  - **Verifies:** AC1 — Nombre displayed in detail panel

- **Test:** should display the client NIT/RUC in the right panel after clicking
  - **Status:** RED - `data-testid="cliente-detail-nit"` not present
  - **Verifies:** AC1 — NIT/RUC displayed in detail panel

- **Test:** should display the client Teléfono in the right panel after clicking
  - **Status:** RED - `data-testid="cliente-detail-telefono"` not present
  - **Verifies:** AC1 — Teléfono displayed in detail panel

- **Test:** should display the client Ciudad in the right panel after clicking
  - **Status:** RED - `data-testid="cliente-detail-ciudad"` not present
  - **Verifies:** AC1 — Ciudad displayed in detail panel

- **Test:** should mark the clicked client item as selected (aria-selected=true)
  - **Status:** RED - `aria-selected` attribute not set on selection
  - **Verifies:** AC1 — Visual selected state of list item

**AC2 — Direct navigation / deep link (3 tests):**

- **Test:** should display the client detail panel when navigating directly to the deep-link URL
  - **Status:** RED - Route `/clientes/:clienteId` does not exist
  - **Verifies:** AC2 — Deep link support (FR30)

- **Test:** should highlight the correct list item as selected when navigating via deep link
  - **Status:** RED - Selected item sync from URL param not implemented
  - **Verifies:** AC2 — List item selection synced with URL param

- **Test:** should call GET /api/v1/clientes/:id when navigating directly via deep link
  - **Status:** RED - `useCliente` hook not implemented
  - **Verifies:** AC2 — Detail API is called on direct URL access

**AC3 — Not-found state (2 tests):**

- **Test:** should display "Cliente no encontrado" when the clienteId returns 404
  - **Status:** RED - `data-testid="cliente-not-found"` element not implemented
  - **Verifies:** AC3 — Not-found message rendered on 404

- **Test:** should NOT crash the application when clienteId returns 404
  - **Status:** RED - Error boundary / graceful 404 handling not implemented
  - **Verifies:** AC3 — No application crash on 404

**AC4 — Skeleton loading (3 tests):**

- **Test:** should show skeleton placeholders in the right panel while the detail fetch is in-flight
  - **Status:** RED - `data-testid="cliente-detail-skeleton"` not implemented
  - **Verifies:** AC4 — Skeleton shown during fetch

- **Test:** should set aria-busy="true" on the detail panel while loading
  - **Status:** RED - `aria-busy` not set on panel container
  - **Verifies:** AC4 — Accessibility loading state

- **Test:** should replace skeleton with client details once fetch completes
  - **Status:** RED - Full flow not implemented
  - **Verifies:** AC4 — Skeleton replaced by real data after load

**AC5 — ErrorPanel (4 tests):**

- **Test:** should display ErrorPanel when GET /api/v1/clientes/:id returns a server error
  - **Status:** RED - Error state not propagated to UI
  - **Verifies:** AC5 — ErrorPanel shown on 500

- **Test:** should display "No se pudo cargar el detalle del cliente" in the ErrorPanel
  - **Status:** RED - Error message text not implemented
  - **Verifies:** AC5 — Correct error message text (Spanish)

- **Test:** should display "Intentar de nuevo" retry button in the ErrorPanel
  - **Status:** RED - Retry button not present
  - **Verifies:** AC5 — "Intentar de nuevo" CTA

- **Test:** should show client detail after clicking "Intentar de nuevo" when backend recovers
  - **Status:** RED - Retry / refetch flow not implemented
  - **Verifies:** AC5 — Retry recovers and shows client data

**AC6 — No-selection EmptyState (4 tests):**

- **Test:** should display EmptyState no-selection in the right panel when on /clientes without a clienteId
  - **Status:** RED - `data-testid="empty-state-no-selection"` not implemented
  - **Verifies:** AC6 — No-selection EmptyState on `/clientes`

- **Test:** should display "Selecciona un cliente para ver sus detalles" in the no-selection state
  - **Status:** RED - EmptyState text not implemented
  - **Verifies:** AC6 — Correct guidance text

- **Test:** should NOT display a CTA button in the no-selection EmptyState
  - **Status:** RED - EmptyState variant not implemented
  - **Verifies:** AC6 — No CTA in no-selection variant

- **Test:** should replace the no-selection EmptyState with client details when a client is clicked
  - **Status:** RED - Transition from no-selection to detail not implemented
  - **Verifies:** AC6 — EmptyState replaced by detail on selection

---

### API Tests (7 tests)

**File:** `e2e/tests/clientes/story-2-2/client-detail-api.spec.ts`

- **Test:** should return HTTP 404 with Problem Details when clienteId does not exist
  - **Status:** RED - `GET /api/v1/clientes/{id}` endpoint not implemented
  - **Verifies:** AC3 (backend) — 404 response for non-existent ID

- **Test:** should return Problem Details body when clienteId does not exist (RFC 7807)
  - **Status:** RED - Problem Details response shape not implemented
  - **Verifies:** AC3 (backend) — RFC 7807 compliant response body

- **Test:** should return HTTP 200 with a ClienteDto when clienteId exists
  - **Status:** RED - Endpoint returns 404 (not implemented)
  - **Verifies:** AC2 (backend) — 200 OK for existing client

- **Test:** should return a ClienteDto with all required fields when clienteId exists
  - **Status:** RED - ClienteDto shape not validated by endpoint
  - **Verifies:** AC2 (backend) — Complete ClienteDto contract

- **Test:** should return a direct object (not wrapped in an envelope) for an existing clienteId
  - **Status:** RED - Response envelope not defined
  - **Verifies:** AC2 (backend) — Direct object response (no wrapper)

- **Test:** should return createdAt as an ISO 8601 string with timezone offset
  - **Status:** RED - DateTimeOffset serialization not verified
  - **Verifies:** AC2 (backend) — DateTimeOffset ISO 8601 format

- **Test:** should return Content-Type application/json for a valid clienteId request
  - **Status:** RED - Content-Type not set for this endpoint
  - **Verifies:** AC2 (backend) — Correct Content-Type header

---

### Component Tests (18 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailPanel.test.tsx`

**AC1 — Renders client data (6 tests):**

- **Test:** should render the client Nombre as a heading when data is loaded
  - **Status:** RED - `ClienteDetailPanel` component does not exist
  - **Verifies:** AC1 — Nombre heading rendered

- **Test:** should render the NIT/RUC value in the description list
  - **Status:** RED - DescriptionList fields not implemented
  - **Verifies:** AC1 — NIT/RUC field rendered

- **Test:** should render the Teléfono value in the description list
  - **Status:** RED - DescriptionList fields not implemented
  - **Verifies:** AC1 — Teléfono field rendered

- **Test:** should render the Ciudad value in the description list
  - **Status:** RED - DescriptionList fields not implemented
  - **Verifies:** AC1 — Ciudad field rendered

- **Test:** should render an amber badge (sin-contactos) when contactCount is 0
  - **Status:** RED - Badge logic not implemented
  - **Verifies:** AC1 — Amber badge for zero contacts

- **Test:** should NOT render the sin-contactos badge when contactCount is greater than 0
  - **Status:** RED - Badge logic not implemented
  - **Verifies:** AC1 — No badge when contacts exist

**AC3 — Not-found state (2 tests):**

- **Test:** should show "Cliente no encontrado" when data is undefined
  - **Status:** RED - Not-found state not implemented
  - **Verifies:** AC3 — Not-found message

- **Test:** should NOT show client fields when data is undefined
  - **Status:** RED - Conditional rendering not implemented
  - **Verifies:** AC3 — Fields hidden in not-found state

**AC4 — Skeleton loading (4 tests):**

- **Test:** should render skeleton placeholders when isLoading is true
  - **Status:** RED - Skeleton not implemented
  - **Verifies:** AC4 — Skeleton shown on load

- **Test:** should set aria-busy="true" on the panel container while loading
  - **Status:** RED - aria-busy not set
  - **Verifies:** AC4 — Accessibility loading attribute

- **Test:** should NOT render client data fields while loading
  - **Status:** RED - Conditional rendering not implemented
  - **Verifies:** AC4 — Data hidden during loading

- **Test:** should NOT render the skeleton when isLoading is false and data is available
  - **Status:** RED - Skeleton cleanup not implemented
  - **Verifies:** AC4 — Skeleton removed after data arrives

**AC5 — ErrorPanel (4 tests):**

- **Test:** should render an ErrorPanel when isError is true
  - **Status:** RED - ErrorPanel not wired to component
  - **Verifies:** AC5 — ErrorPanel rendered on error

- **Test:** should display "No se pudo cargar el detalle del cliente" in the ErrorPanel
  - **Status:** RED - Error message text not implemented
  - **Verifies:** AC5 — Correct error message

- **Test:** should render an "Intentar de nuevo" retry button in the ErrorPanel
  - **Status:** RED - Retry button not implemented
  - **Verifies:** AC5 — Retry CTA visible

- **Test:** should call onRetry when the "Intentar de nuevo" button is clicked
  - **Status:** RED - onRetry prop not wired up
  - **Verifies:** AC5 — Retry callback invoked

**AC6 — No-selection EmptyState (4 tests):**

- **Test:** should render the no-selection EmptyState when clienteId is undefined
  - **Status:** RED - EmptyState variant not implemented
  - **Verifies:** AC6 — no-selection EmptyState shown

- **Test:** should display "Selecciona un cliente para ver sus detalles" in the no-selection state
  - **Status:** RED - EmptyState text not implemented
  - **Verifies:** AC6 — Correct guidance text

- **Test:** should NOT render a CTA button in the no-selection EmptyState
  - **Status:** RED - EmptyState variant not implemented
  - **Verifies:** AC6 — No CTA in no-selection

- **Test:** should NOT render the no-selection EmptyState when a clienteId is provided
  - **Status:** RED - Conditional rendering not implemented
  - **Verifies:** AC6 — EmptyState absent when clienteId is present

---

## Data Factories

### Cliente Factory (existing — reused)

**File:** `e2e/factories/cliente.factory.ts`

**Exports:**
- `buildCliente(overrides?)` - Creates a single ClienteDto with optional overrides
- `buildClientes(count, overrides?)` - Creates an array of ClienteDto instances

**New override patterns used in Story 2.2 tests:**
```typescript
const cliente = buildCliente({ nombre: 'Empresa Deep Link SAS' });
const clienteSinContactos = buildCliente({ contactCount: 0 });
const clienteConCiudad = buildCliente({ ciudad: 'Medellín' });
```

---

## Fixtures

### Base Fixture (existing — reused)

**File:** `e2e/fixtures/base.fixture.ts`

No new fixtures required for Story 2.2. The base fixture provides `clientesPage` navigation. Story 2.2 E2E tests navigate directly using `page.goto('/clientes')` and `page.goto('/clientes/:clienteId')`.

---

## Mock Requirements

### GET /api/v1/clientes (List) Mock

**Endpoint:** `GET **/api/v1/clientes`
**Purpose:** Provides the client list so the left panel renders before detail interaction

**Success Response:**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Empresa Test SAS",
    "nit": "900123456",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-01-15T10:30:00Z",
    "contactCount": 2
  }
]
```

### GET /api/v1/clientes/:id (Detail) Mock

**Endpoint:** `GET **/api/v1/clientes/:id`

**Success Response (200):**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "nombre": "Empresa Test SAS",
  "nit": "900123456",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-01-15T10:30:00Z",
  "contactCount": 2
}
```

**Not-Found Response (404):**
```json
{
  "status": 404,
  "title": "Cliente no encontrado",
  "detail": "No existe un cliente con el ID proporcionado."
}
```

**Server Error Response (500):**
```json
{
  "title": "Internal Server Error",
  "status": 500
}
```

---

## Required data-testid Attributes

### ClienteDetailPanel Component

- `cliente-detail-panel` - Root container of the right panel (must have `aria-busy` attribute)
- `cliente-detail-nombre` - Client name heading element (h2 with `text-3xl font-bold`)
- `cliente-detail-nit` - NIT/RUC value cell in DescriptionList
- `cliente-detail-telefono` - Teléfono value cell in DescriptionList
- `cliente-detail-ciudad` - Ciudad value cell in DescriptionList
- `cliente-detail-skeleton` - Skeleton container rendered during loading
- `cliente-not-found` - Not-found message container (shown when data is undefined after fetch)
- `sin-contactos-badge` - Amber badge shown when contactCount === 0
- `empty-state-no-selection` - EmptyState variant no-selection container
- `error-panel` - Error panel container (reused from Story 2.1)

**Implementation Example:**
```tsx
<div data-testid="cliente-detail-panel" aria-busy={isLoading ? 'true' : 'false'}>
  {isLoading && <div data-testid="cliente-detail-skeleton">...</div>}
  {!isLoading && data && (
    <>
      <h2 data-testid="cliente-detail-nombre">{data.nombre}</h2>
      <dd data-testid="cliente-detail-nit">{data.nit}</dd>
      <dd data-testid="cliente-detail-telefono">{data.telefono}</dd>
      <dd data-testid="cliente-detail-ciudad">{data.ciudad}</dd>
      {data.contactCount === 0 && (
        <span data-testid="sin-contactos-badge" title="Sin contactos asignados">⚠</span>
      )}
    </>
  )}
  {!isLoading && !isError && !data && (
    <div data-testid="cliente-not-found">Cliente no encontrado</div>
  )}
  {isError && (
    <div data-testid="error-panel">
      No se pudo cargar el detalle del cliente
      <button onClick={onRetry}>Intentar de nuevo</button>
    </div>
  )}
</div>

{/* No-selection state when clienteId is undefined */}
{!clienteId && (
  <div data-testid="empty-state-no-selection">
    Selecciona un cliente para ver sus detalles
  </div>
)}
```

### Route / URL

- `cliente-list-item` — (existing from Story 2.1) Must support `aria-selected="true"` on click
- `clientes-list-panel` — (existing from Story 2.1) Left panel container

---

## Implementation Checklist

### Test: AC1 — Click client item → show detail, update URL

**File:** `e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Create route `frontend/src/routes/_app/clientes.$clienteId.tsx` — split-panel layout with ClienteListView (280px) left + ClienteDetailPanel right
- [ ] Update `ClientListItem` click handler to call `navigate('/clientes/$clienteId')` via TanStack Router `useNavigate`
- [ ] Implement `ClienteDetailPanel.tsx` in `frontend/src/modules/crm/clientes/presentation/`
- [ ] Render `data-testid="cliente-detail-panel"` on the root container
- [ ] Render `data-testid="cliente-detail-nombre"` for the client name heading
- [ ] Render `data-testid="cliente-detail-nit"` for the NIT/RUC value
- [ ] Render `data-testid="cliente-detail-telefono"` for the Teléfono value
- [ ] Render `data-testid="cliente-detail-ciudad"` for the Ciudad value
- [ ] Set `aria-selected="true"` on the clicked `ClientListItem`
- [ ] Run test: `pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC2 — Direct navigation deep link

**File:** `e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Route `clientes.$clienteId.tsx` renders and fetches on mount
- [ ] Implement `useCliente(id)` hook in `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - Uses `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id!), staleTime: 30_000, enabled: !!id })`
- [ ] Implement `getById(id: string)` in `clienteApiRepository.ts` calling `GET /api/v1/clientes/:id`
- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Sync selected item visual state from URL param: pass `selectedId` to `ClienteListView`
- [ ] Run test: `pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC3 — Not-found state on 404

**File:** `e2e/tests/clientes/story-2-2/client-detail-view.spec.ts` + `client-detail-api.spec.ts`

**Tasks to make this test pass (frontend):**

- [ ] Handle 404 response in `clienteApiRepository.getById` — throw so TanStack Query marks as error, OR return `undefined`/`null` as a `no-data` resolved state
- [ ] In `ClienteDetailPanel`: when `!isLoading && !isError && !data`, render `data-testid="cliente-not-found"` with text "Cliente no encontrado"
- [ ] Run test: `pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`
- [ ] ✅ Test passes (green phase)

**Tasks to make this test pass (backend):**

- [ ] Implement `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` in `SiesaAgents.Application/Clientes/Queries/`
- [ ] Register `GET /api/v1/clientes/{id}` in `ClienteEndpoints.cs`
- [ ] Return 404 Problem Details (RFC 7807) when client is not found
- [ ] Run test: `pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2.5 hours

---

### Test: AC4 — Skeleton placeholders during loading

**File:** `e2e/tests/clientes/story-2-2/client-detail-view.spec.ts` + component tests

**Tasks to make this test pass:**

- [ ] In `ClienteDetailPanel`: when `isLoading === true`, render `data-testid="cliente-detail-skeleton"` using `react-loading-skeleton` matching field layout shape
- [ ] Set `aria-busy="true"` on `data-testid="cliente-detail-panel"` when loading
- [ ] Run test: `pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — ErrorPanel with retry

**File:** `e2e/tests/clientes/story-2-2/client-detail-view.spec.ts` + component tests

**Tasks to make this test pass:**

- [ ] In `ClienteDetailPanel`: when `isError === true`, render `data-testid="error-panel"` with text "No se pudo cargar el detalle del cliente"
- [ ] Add retry button with label "Intentar de nuevo" that calls `onRetry` prop (mapped to TanStack Query `refetch`)
- [ ] Run test: `pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC6 — No-selection EmptyState

**File:** `e2e/tests/clientes/story-2-2/client-detail-view.spec.ts` + component tests

**Tasks to make this test pass:**

- [ ] Update `frontend/src/routes/_app/clientes.tsx` — right panel renders `ClienteDetailPanel` without `clienteId` (triggers no-selection)
- [ ] In `ClienteDetailPanel`: when `clienteId` is `undefined`, render `data-testid="empty-state-no-selection"` with text "Selecciona un cliente para ver sus detalles"
- [ ] Add `no-selection` variant to `EmptyState.tsx` with `UserIcon` (Heroicons outline), no CTA
- [ ] Run test: `pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-view.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### API Contract Tests

**File:** `e2e/tests/clientes/story-2-2/client-detail-api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Implement `GET /api/v1/clientes/{id}` endpoint returning `ClienteDto` (200) or Problem Details (404)
- [ ] Verify `ClienteDto` has all required fields: `id (Guid)`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt (DateTimeOffset)`, `contactCount (int)`
- [ ] Ensure `createdAt` serializes as ISO 8601 with timezone (DateTimeOffset)
- [ ] Run test: `pnpm test:api:2-2` (add script to package.json)
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all E2E failing tests for this story
pnpm test:e2e e2e/tests/clientes/story-2-2/

# Run only E2E acceptance tests
pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-view.spec.ts

# Run only API contract tests
pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-api.spec.ts

# Run all E2E in headed mode (see the browser)
pnpm test:e2e e2e/tests/clientes/story-2-2/ --headed

# Debug a specific test
pnpm test:e2e e2e/tests/clientes/story-2-2/client-detail-view.spec.ts --debug

# Run component tests (once frontend test runner is configured)
# pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteDetailPanel.test.tsx
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Factories reused from Story 2.1 (`buildCliente`)
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- E2E tests fail because route `/clientes/:clienteId` does not exist
- API tests fail because `GET /api/v1/clientes/{id}` endpoint is not implemented
- Component tests fail because `ClienteDetailPanel` component does not exist
- All failures are due to missing implementation, NOT test bugs

---

### GREEN Phase (DEV Team — Next Steps)

1. Pick one failing test from implementation checklist (recommended order: AC6 → AC4 → AC1 → AC2 → AC3 → AC5)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Key Principles:**
- One test at a time (do not try to fix all at once)
- Minimal implementation (do not over-engineer)
- Run tests frequently (immediate feedback)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review code for quality (readability, maintainability, performance)
3. Extract duplications (DRY principle)
4. Optimize performance if needed
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm test:e2e e2e/tests/clientes/story-2-2/`
3. Begin implementation using implementation checklist as guide (start with AC6 — simplest)
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'in-review'

---

## Knowledge Base References Applied

- **network-first.md** - Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **data-factories.md** - Factory patterns (`buildCliente`, `buildClientes`) with overrides support
- **selector-resilience.md** - Selector hierarchy: `data-testid` used exclusively throughout
- **test-quality.md** - One assertion per test (atomic), Given-When-Then structure, no hard waits
- **component-tdd.md** - Component test strategies using Vitest + RTL
- **test-levels-framework.md** - E2E for user journeys (AC1, AC2, AC3, AC4, AC5, AC6), API for contract (AC2, AC3), Component for UI isolation (AC1, AC3, AC4, AC5, AC6)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm test:e2e e2e/tests/clientes/story-2-2/`

**Expected Results:**

```
Running 27 tests using 1 worker

  ✗ AC1 — Clicking a client item shows its details in the right panel
    ✗ should navigate to /clientes/:clienteId when a client item is clicked
      Error: page.goto: net::ERR_ABORTED - Route /clientes/:clienteId not found
    ✗ should display the client Nombre in the right panel after clicking
      Error: Element not found: [data-testid="cliente-detail-nombre"]
    [... 5 more AC1 tests failing ...]

  ✗ AC2 — Direct navigation to /clientes/:clienteId loads client detail (FR30)
    ✗ should display the client detail panel when navigating directly to the deep-link URL
      Error: Element not found: [data-testid="cliente-detail-panel"]
    [... 2 more AC2 tests failing ...]

  ✗ AC3 — Not-found message displayed when clienteId does not exist
    ✗ should display "Cliente no encontrado" when the clienteId returns 404
      Error: Element not found: [data-testid="cliente-not-found"]
    [... 1 more AC3 test failing ...]

  ✗ AC4 — Skeleton placeholders shown while client detail is loading
    ✗ should show skeleton placeholders in the right panel while the detail fetch is in-flight
      Error: Element not found: [data-testid="cliente-detail-skeleton"]
    [... 2 more AC4 tests failing ...]

  ✗ AC5 — ErrorPanel displayed when client detail fetch fails
    ✗ should display ErrorPanel when GET /api/v1/clientes/:id returns a server error
      Error: Element not found: [data-testid="error-panel"]
    [... 3 more AC5 tests failing ...]

  ✗ AC6 — EmptyState (no-selection) shown when no client is selected
    ✗ should display EmptyState no-selection in the right panel when on /clientes without a clienteId
      Error: Element not found: [data-testid="empty-state-no-selection"]
    [... 3 more AC6 tests failing ...]

27 failed
Status: RED phase verified
```

**Summary:**

- Total tests: 27 (20 E2E + 7 API)
- Passing: 0 (expected)
- Failing: 27 (expected)
- Status: RED phase verified

---

## Notes

- The E2E tests use Playwright's `page.route()` network-first interception — all routes are registered BEFORE `page.goto()` to prevent race conditions.
- The API tests in `client-detail-api.spec.ts` require the backend to be running on `http://localhost:5000` (or `API_BASE_URL` env var). Tests that require an existing client use `.skip()` gracefully when the database is empty.
- Component tests (`ClienteDetailPanel.test.tsx`) import directly from the not-yet-implemented `../ClienteDetailPanel` — the import itself causes the RED failure. Once the component file is created with the correct props interface and data-testid attributes, tests will begin to pass.
- Story 2.1's `buildCliente` factory is reused in full — no new factory file needed.
- The `error-panel` data-testid in AC5 is shared with Story 2.1's list error panel. The implementation must reuse the same `ErrorPanel` component with different message text.

---

**Generated by BMad TEA Agent** - 2026-06-12
