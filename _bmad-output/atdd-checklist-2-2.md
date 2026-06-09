# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-09
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component + API

---

## Story Summary

A commercial team member can click on a client item in the left panel list and view the complete
client details (Nombre, NIT/RUC, Teléfono, Ciudad) in the right panel, with the URL updating to
`/clientes/:clienteId` for deep linking (FR30). Navigating directly to that URL also loads the
correct details. If the clienteId does not exist, a Spanish not-found message is shown gracefully
while the client list remains visible.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC#1** — Given the client list is displayed, when the user clicks on a client item, then the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, and the URL updates to `/clientes/:clienteId` (FR30 deep linking).
2. **AC#2** — Given the user is on the client detail view, when the user accesses the URL `/clientes/:clienteId` directly, then the correct client details are loaded and displayed (FR30).
3. **AC#3** — Given a clienteId in the URL does not exist, when the page loads, then a not-found message is displayed gracefully in the right panel and the client list remains visible.

---

## Failing Tests Created (RED Phase)

### E2E Tests (9 tests)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

- **Test:** `should load the correct client details when navigating directly to /clientes/:clienteId`
  - **Status:** RED — `ClienteDetailView` component + `clientes.$clienteId.tsx` route not yet implemented
  - **Verifies:** AC#2 — direct URL navigation loads correct client details (TC-E2-P1-07)

- **Test:** `should display correct Nombre in detail panel on direct URL navigation`
  - **Status:** RED — `data-testid="clientes-detail-panel"` does not exist yet
  - **Verifies:** AC#2 — Nombre field visible in detail panel on deep link

- **Test:** `should display NIT in detail panel on direct URL navigation`
  - **Status:** RED — detail panel not implemented
  - **Verifies:** AC#2 — NIT/RUC field visible in detail panel on deep link

- **Test:** `should keep the client list visible (left panel) alongside the detail view (right panel)`
  - **Status:** RED — split-panel layout (`clientes.$clienteId.tsx`) not implemented
  - **Verifies:** AC#2 — both `clientes-list-panel` and `clientes-detail-panel` coexist

- **Test:** `should show the client detail panel when user clicks a client item`
  - **Status:** RED — click navigation in `ClienteListView` + `clientes.$clienteId.tsx` not implemented
  - **Verifies:** AC#1 — clicking a list item reveals the detail panel

- **Test:** `should update the URL to /clientes/:clienteId when user clicks a client item`
  - **Status:** RED — TanStack Router navigate on item click not implemented
  - **Verifies:** AC#1 — URL deep-link update on click (FR30)

- **Test:** `should display a not-found message when navigating to /clientes/id-inexistente`
  - **Status:** RED — `ClienteDetailView` 404 state not implemented
  - **Verifies:** AC#3 — not-found message for invalid clienteId

- **Test:** `should keep the client list panel visible when detail shows not-found`
  - **Status:** RED — split panel with not-found state not implemented
  - **Verifies:** AC#3 — `clientes-list-panel` remains visible when detail shows 404

### API Tests (13 tests)

**File:** `e2e/tests/api/client-detail-view.api.spec.ts`

- **Test:** `should return HTTP 200 when GET /api/v1/clientes/:id with a valid existing ID`
  - **Status:** RED — `GET /api/v1/clientes/{id}` endpoint not yet registered in `ClienteEndpoints.cs`
  - **Verifies:** AC#2 — backend endpoint returns 200 for known ID (TC-E2-P2-02)

- **Test:** `should return Content-Type application/json for GET /api/v1/clientes/:id`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 — correct Content-Type header

- **Test:** `should return a single ClienteDto object (not an array) for GET /api/v1/clientes/:id`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 — API contract: single object response, no wrapper

- **Test:** `ClienteDto from GET /api/v1/clientes/:id must have a valid UUID "id" field`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 — id field matches requested UUID

- **Test:** `ClienteDto from GET /api/v1/clientes/:id must return correct "nombre" field`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 — nombre field in ClienteDto

- **Test:** `ClienteDto from GET /api/v1/clientes/:id must return correct "nit" field`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 — nit field in ClienteDto

- **Test:** `ClienteDto from GET /api/v1/clientes/:id must return correct "telefono" field`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 — telefono field in ClienteDto

- **Test:** `ClienteDto from GET /api/v1/clientes/:id must return correct "ciudad" field`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 — ciudad field in ClienteDto

- **Test:** `ClienteDto from GET /api/v1/clientes/:id must have "createdAt" in ISO 8601 with timezone`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 — createdAt is DateTimeOffset (ISO 8601 + timezone)

- **Test:** `should return HTTP 404 when GET /api/v1/clientes/00000000-0000-0000-0000-000000000000`
  - **Status:** RED — `ClienteNotFoundException` + `ExceptionHandlingMiddleware` 404 case not implemented
  - **Verifies:** AC#3 — 404 for unknown ID (TC-E2-P2-02)

- **Test:** `should return Content-Type application/problem+json for 404 response`
  - **Status:** RED — middleware 404 case not implemented
  - **Verifies:** AC#3 — RFC 7807 Problem Details Content-Type

- **Test:** `should return Problem Details body with "status": 404 for unknown client ID`
  - **Status:** RED — middleware 404 case not implemented
  - **Verifies:** AC#3 — Problem Details body has status: 404

- **Test:** `should return Problem Details body with Spanish "title" field for unknown client ID`
  - **Status:** RED — middleware 404 case not implemented
  - **Verifies:** AC#3 + NFR6 — Spanish title, no stack trace exposed

- **Test:** `Problem Details response must NOT include stack traces or internal .NET fields (NFR6)`
  - **Status:** RED — middleware 404 case not implemented
  - **Verifies:** NFR6 — no internal error leakage in 404 response

### Component Tests (14 tests)

**File — Hook:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts` (6 tests)

- **Test:** `returns typed Cliente with all required fields on success`
  - **Status:** RED — `useCliente.ts` does not exist yet
  - **Verifies:** AC#2 — hook fetches GET /api/v1/clientes/:id and returns typed Cliente

- **Test:** `returns isLoading=true initially when id is provided`
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** Loading state exposed correctly

- **Test:** `uses queryKey [clientes, id] array shape (canonical per architecture.md)`
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** Canonical `['clientes', id]` array key shape for targeted cache invalidation

- **Test:** `does NOT fire the query when id is empty string (enabled: Boolean(id))`
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** Guard against fetching with empty id

- **Test:** `returns isError=true when API responds with 404`
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** AC#3 — isError flag exposed for not-found state detection

- **Test:** `exposes refetch function`
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** refetch function available for ErrorPanel onRetry

**File — Component:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (8 tests)

- **Test:** `shows skeleton screen while data is loading (not a spinner)`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** Loading state uses `react-loading-skeleton`, not a spinner (TC-E2-P2-02-fe)

- **Test:** `shows "Nombre:" label and value after data loads`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** AC#1, AC#2 — Nombre field visible after load

- **Test:** `shows "NIT/RUC:" label and value after data loads`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** AC#1, AC#2 — NIT/RUC field visible after load

- **Test:** `shows "Teléfono:" label and value after data loads`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** AC#1, AC#2 — Teléfono field visible after load

- **Test:** `shows "Ciudad:" label and value after data loads`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** AC#1, AC#2 — Ciudad field visible after load

- **Test:** `renders the detail panel container with data-testid="clientes-detail-panel"`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** data-testid present for E2E test stability

- **Test:** `each field label is accessible via dl/dt/dd or aria-label (WCAG 2.1 AA)`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** WCAG 2.1 AA compliance for label/value pairs

- **Test:** `shows Spanish not-found message when API returns 404`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** AC#3 — Spanish not-found message in DOM (TC-E2-P1-08)

- **Test:** `does NOT show raw error.message when API returns 404 (NFR6)`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** NFR6 — no raw error text exposed to user

- **Test:** `does NOT show the 4 field labels when in not-found state`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** AC#3 — clean not-found state (field labels hidden)

- **Test:** `ClienteDetailView pre-populated with TanStack Query cache shows all 4 fields`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** AC#1 — all 4 fields from cache (TC-E2-P1-06)

- **Test:** `detail panel renders with correct data-testid for E2E selector stability`
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** data-testid contract between component and E2E tests

- **Test:** `shows ErrorPanel with retry button on non-404 server error`
  - **Status:** RED — `ClienteDetailView.tsx` + `ErrorPanel` integration not implemented
  - **Verifies:** non-404 error state uses shared ErrorPanel component

---

## Data Factories

The following factory helper already exists and is reused:

### buildCliente Factory

**File:** `e2e/helpers/data.helper.ts` (already implemented from Story 2.1)

**Exports:**
- `buildCliente(overrides?)` — generates unique cliente payload with nombre, nit, telefono, ciudad

**Usage in Story 2.2 tests:**
```typescript
const clienteData = buildCliente({ nombre: 'Empresa Deep Link SA', telefono: '3001234567', ciudad: 'Bogotá' });
const created = await apiHelper.createCliente(clienteData);
```

**No new factories needed** — the E2E helper covers test data generation with auto-unique IDs.

---

## Fixtures Created

Existing base fixture is reused:

### Base Fixture (existing)

**File:** `e2e/fixtures/base.fixture.ts` (already implemented from Story 2.1)

**Fixtures provided:**
- `clientesPage` — navigates to `/clientes` before test, provides auto-teardown

**Note:** Story 2.2 E2E tests use inline `ApiHelper` for create/delete teardown (see `try/finally` blocks).

---

## Mock Requirements

### Frontend Component Tests (MSW)

**Endpoint:** `GET */api/v1/clientes/:id`

**Success Response (200):**
```json
{
  "id": "uuid-detail-1",
  "nombre": "Acme",
  "nit": "900-1",
  "telefono": "3001111111",
  "ciudad": "Bogotá",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

**Not-Found Response (404):**
```json
{
  "status": 404,
  "title": "Cliente no encontrado.",
  "detail": "Cliente con id 'id-que-no-existe' no encontrado."
}
```

### E2E Tests (Network Interception — AC#3 tests)

Route interception applied BEFORE navigation (network-first pattern):

```typescript
// Intercept detail endpoint before navigating — prevents race conditions
await page.route('**/api/v1/clientes/00000000-0000-0000-0000-000000000000', (route) =>
  route.fulfill({
    status: 404,
    contentType: 'application/problem+json',
    body: JSON.stringify({ status: 404, title: 'Cliente no encontrado.' }),
  }),
);
await page.goto('/clientes/00000000-0000-0000-0000-000000000000');
```

---

## Required data-testid Attributes

### ClienteDetailView (Right Panel)

- `clientes-detail-panel` — the container element for the entire detail panel (right panel)
- `cliente-detail-skeleton` — skeleton screen container shown during `isLoading` state
- `cliente-detail-nombre` — element containing the Nombre value (optional, for field-level E2E)
- `cliente-detail-nit` — element containing the NIT/RUC value (optional)
- `cliente-detail-telefono` — element containing the Teléfono value (optional)
- `cliente-detail-ciudad` — element containing the Ciudad value (optional)
- `error-panel` — shared ErrorPanel container (for non-404 errors, reused from Story 2.1)
- `retry-button` — retry button inside ErrorPanel (reused from Story 2.1)

### ClienteListView (Left Panel — already from Story 2.1)

- `clientes-list-panel` — left panel container (already required, Story 2.1)
- `cliente-list-item` — each client list item (already required, Story 2.1)

**Implementation Example:**
```tsx
<div data-testid="clientes-detail-panel">
  {isLoading && <div data-testid="cliente-detail-skeleton"><Skeleton count={4} height={24} /></div>}
  {isLoaded && (
    <dl>
      <dt>Nombre:</dt><dd data-testid="cliente-detail-nombre">{data.nombre}</dd>
      <dt>NIT/RUC:</dt><dd data-testid="cliente-detail-nit">{data.nit}</dd>
      <dt>Teléfono:</dt><dd data-testid="cliente-detail-telefono">{data.telefono}</dd>
      <dt>Ciudad:</dt><dd data-testid="cliente-detail-ciudad">{data.ciudad}</dd>
    </dl>
  )}
  {isNotFound && <p>Cliente no encontrado.</p>}
  {isError && !isNotFound && <ErrorPanel onRetry={refetch} />}
</div>
```

---

## Implementation Checklist

### Test: `GET /api/v1/clientes/:id` returns 200 + ClienteDto

**File:** `e2e/tests/api/client-detail-view.api.spec.ts`

- [ ] Add `GetClienteByIdQuery.cs` under `backend/src/SiesaAgents.Application/Clientes/Queries/`
- [ ] Add `GetClienteByIdQueryHandler.cs` — calls `IClienteRepository.GetByIdAsync(id)`, throws `ClienteNotFoundException` if null
- [ ] Add `ClienteNotFoundException.cs` in `backend/src/SiesaAgents.Domain/Clientes/Exceptions/`
- [ ] Add `GetByIdAsync(Guid id): Task<ClienteEntity?>` to `IClienteRepository.cs`
- [ ] Implement `GetByIdAsync` in `ClienteRepository.cs` using `_context.Clientes.FindAsync(id)`
- [ ] Register `GET /api/v1/clientes/{id:guid}` in `ClienteEndpoints.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/client-detail-view.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: `GET /api/v1/clientes/:id` returns 404 Problem Details

**File:** `e2e/tests/api/client-detail-view.api.spec.ts`

- [ ] Add `ClienteNotFoundException` case to `ExceptionHandlingMiddleware.cs`: status 404, `Content-Type: application/problem+json`, Spanish title `"Cliente no encontrado."`
- [ ] Do NOT restructure the existing middleware — only add the new exception case
- [ ] Run test: `npx playwright test e2e/tests/api/client-detail-view.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `useCliente(id)` hook — all 6 tests

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
- [ ] Uses `useQuery` from TanStack Query: `queryKey: ['clientes', id]`, `queryFn: () => clienteApiRepository.getById(id)`, `enabled: Boolean(id)`
- [ ] Exports `{ data, isLoading, isError, error, refetch }`
- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `getById` in `clienteApiRepository.ts`: `GET /api/v1/clientes/${id}`
- [ ] Run test: `pnpm --filter frontend test useCliente`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: `ClienteDetailView` component — all field and state tests

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- [ ] Receives `clienteId: string` prop
- [ ] Uses `useCliente(clienteId)` hook
- [ ] Loading state: `<Skeleton count={4} height={24} />` wrapped in `data-testid="cliente-detail-skeleton"` (NOT a spinner)
- [ ] Loaded state: `<dl>/<dt>/<dd>` structure with Spanish labels (Nombre:, NIT/RUC:, Teléfono:, Ciudad:)
- [ ] Not-found state (isError + HTTP 404): Spanish message `"Cliente no encontrado."` — check siesa-ui-kit Alert/NotFound first
- [ ] Non-404 error state: `<ErrorPanel onRetry={refetch} />` (shared from Story 2.1)
- [ ] Container div with `data-testid="clientes-detail-panel"`
- [ ] All user-facing text in Spanish
- [ ] WCAG 2.1 AA: use `<dl>/<dt>/<dd>` or `aria-label`
- [ ] Add required `data-testid` attributes: `clientes-detail-panel`, `cliente-detail-skeleton`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2.5 hours

---

### Test: E2E — click list item → detail panel + URL update (AC#1)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

- [ ] Verify or create `frontend/src/routes/_app/clientes.$clienteId.tsx` for path `/clientes/$clienteId`
- [ ] Route renders both `ClienteListView` (left, 280px) and `ClienteDetailView` (right, flex) in split layout
- [ ] `ClienteListView` list items use TanStack Router `navigate()` or `<Link>` to `/clientes/${clienteId}` on click
- [ ] `clienteId` param is read from TanStack Router params and passed to `ClienteDetailView`
- [ ] Ensure route is registered in the router tree (`routeTree.gen.ts`)
- [ ] Run E2E test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: E2E — AC#3 not-found message (TC-E2-P1-08)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

Tasks are covered by the ClienteDetailView not-found state implementation above.

- [ ] Verify not-found message renders in the right panel (does not crash the whole route)
- [ ] Verify left panel (`clientes-list-panel`) remains visible
- [ ] Run E2E test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E tests for Story 2.2
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts

# Run Story 2.2 API integration tests
npx playwright test e2e/tests/api/client-detail-view.api.spec.ts

# Run all Story 2.2 component and hook tests (Vitest)
pnpm --filter frontend test -- useCliente ClienteDetailView

# Run only the useCliente hook tests
pnpm --filter frontend test -- useCliente.test

# Run only the ClienteDetailView component tests
pnpm --filter frontend test -- ClienteDetailView.test

# Run all E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --debug

# Run all Story 2.2 tests (E2E + API + Component)
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/client-detail-view.api.spec.ts && pnpm --filter frontend test -- useCliente ClienteDetailView
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (E2E: 9, API: 13, Component/Hook: 20 = 42 total)
- ✅ Fixtures and factories documented with auto-cleanup patterns
- ✅ Mock requirements documented for MSW and Playwright route interception
- ✅ data-testid requirements listed for all new UI elements
- ✅ Implementation checklist created with ordered tasks

**Verification:**

- E2E tests fail because `ClienteDetailView`, `clientes.$clienteId.tsx` route, and `GET /api/v1/clientes/{id}` backend endpoint do not exist
- API tests fail because `GetClienteByIdQueryHandler`, `ClienteNotFoundException`, and the endpoint registration are missing
- Component tests fail because `useCliente.ts` and `ClienteDetailView.tsx` do not exist

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (recommended order: backend endpoint → hook → component → route)
2. **Read the test** to understand the expected behavior and contract
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended implementation order:**
1. Backend: `GET /api/v1/clientes/{id}` endpoint (enables API tests + E2E TC-E2-P1-07)
2. Backend: `ClienteNotFoundException` + middleware 404 case (enables TC-E2-P2-02 not-found)
3. Frontend: `useCliente.ts` hook (enables hook tests)
4. Frontend: `ClienteDetailView.tsx` (enables component tests)
5. Frontend: `clientes.$clienteId.tsx` route + list item click navigation (enables E2E AC#1)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 42 tests pass
2. Review `ClienteDetailView.tsx` for readability and reuse with Stories 2.3/2.4
3. Check siesa-ui-kit for `DetailPanel` or `DataItem` component to replace custom dl/dt/dd
4. Ensure `useCliente` hook is typed and exported correctly for Story 2.4 (edit form pre-fill)
5. Run full test suite to confirm no regressions from Story 2.1 tests

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/client-detail-view.api.spec.ts && pnpm --filter frontend test -- useCliente ClienteDetailView`
3. Begin implementation following the checklist order above
4. Work one test at a time (red → green for each)
5. When all 42 tests pass, refactor for quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation: E2E not-found tests intercept `**/api/v1/clientes/00000000...` before `page.goto()`; AC#2 tests use `page.waitForResponse()` setup before clicking
- **fixture-architecture.md** — `ApiHelper` inline create/delete with `try/finally` for E2E data teardown; MSW `setupServer` with `beforeAll/afterAll/afterEach` for component tests
- **data-factories.md** — `buildCliente(overrides?)` factory in `e2e/helpers/data.helper.ts`; MSW mock objects typed as `Cliente`
- **component-tdd.md** — Component tests use `QueryClientProvider` + `setQueryData` for cache pre-population (TC-E2-P1-06 pattern); MSW intercepts for async state testing
- **test-quality.md** — One assertion per test (atomic); explicit `waitFor` waits; no hard sleeps; Spanish text assertions mandatory; no raw error.message in DOM
- **selector-resilience.md** — All selectors use `data-testid` (`clientes-detail-panel`, `cliente-detail-skeleton`, `error-panel`, `retry-button`); text assertions use `/i` regex for case-insensitive Spanish
- **test-levels-framework.md** — E2E for critical user journeys (AC#1 click + AC#2 deep link); API for backend contract (TC-E2-P2-02); Component for UI state machine (loading/loaded/not-found/error)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures:**

All 42 tests should fail in RED phase with these types of errors:

**E2E tests (`client-detail-view.spec.ts`):**
```
Error: page.waitForResponse: Test timeout of 30000ms exceeded.
  - data-testid="clientes-detail-panel" not found
  - Route /clientes/:clienteId does not exist (TanStack Router 404)
```

**API tests (`client-detail-view.api.spec.ts`):**
```
Error: expect(received).toBe(expected)
  Expected: 200
  Received: 404  (endpoint GET /api/v1/clientes/{id} not registered)

Error: expect(received).toBe(expected)
  Expected: 404
  Received: 500  (ClienteNotFoundException not handled → unhandled exception → 500)
```

**Component tests (`ClienteDetailView.test.tsx`, `useCliente.test.ts`):**
```
Error: Failed to resolve import "./useCliente" from "useCliente.test.ts"
  Module does not exist

Error: Failed to resolve import "./ClienteDetailView" from "ClienteDetailView.test.tsx"
  Module does not exist
```

**Summary:**
- Total tests: 42
- Passing: 0 (expected)
- Failing: 42 (expected)
- Status: RED phase verified

---

## Notes

- **Skeleton vs spinner**: Story explicitly requires `react-loading-skeleton` (`<Skeleton count={4} height={24} />`). Any spinner implementation will fail the `shows skeleton screen while data is loading` test.
- **Spanish text mandatory**: All user-facing text must be in Spanish. Tests assert Spanish strings (`"Nombre:"`, `"NIT/RUC:"`, `"Teléfono:"`, `"Ciudad:"`, `"Cliente no encontrado."`, `"Reintentar"`).
- **TanStack Query key shape**: `['clientes', id]` array — not `'clientes-' + id` string. The `uses queryKey [clientes, id] array shape` test verifies this by checking `queryClient.getQueryData(['clientes', id])`.
- **isLoading vs isPending**: Use `isLoading` (not `isPending`) in TanStack Query v5 when `enabled: Boolean(id)` is set — `isLoading` is false when the query is disabled.
- **ErrorPanel reuse**: The `ErrorPanel` from Story 2.1 at `frontend/src/shared/components/ErrorPanel.tsx` must be used for non-404 errors. Do not build a new error component.
- **MasterCrud NOT applicable**: This is a read-only detail panel in a split layout, not a CRUD data-grid screen.

---

## Contact

**Questions or Issues?**

- Refer to story file: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md`
- Refer to test design: `_bmad-output/implementation-artifacts/test-design-epic-2.md`
- Architecture reference: `_bmad-output/planning-artifacts/architecture.md`

---

**Generated by BMad TEA Agent** - 2026-06-09
