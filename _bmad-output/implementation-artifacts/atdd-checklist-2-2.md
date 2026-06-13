# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-13
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

Story 2.2 implements the right panel (flex-1) of the `/clientes` split-panel view. When a user clicks a client item in the left list panel, the right panel fetches and displays the full client details (Nombre, NIT/RUC, Teléfono, Ciudad) and the URL updates to `/clientes/:clienteId` to support deep linking (FR30). The story is read-only — no editing or deletion.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. Clicking a client item shows complete details in the right panel (flex-1) and URL updates to `/clientes/:clienteId` (FR30 deep linking).
2. Accessing `/clientes/:clienteId` directly loads correct client details from `GET /api/v1/clientes/{id}`.
3. When `GET /api/v1/clientes/{id}` returns 404, the right panel displays "Cliente no encontrado." — no crash.
4. When the backend is unavailable, an ErrorPanel with "Reintentar" button is shown; clicking it triggers a new fetch.
5. While the detail is loading, skeleton placeholders are shown (react-loading-skeleton — NOT a spinner).
6. No client selected (`/clientes` with no `clienteId`) shows a placeholder "Selecciona un cliente para ver su detalle."

---

## Failing Tests Created (RED Phase)

### E2E Tests (19 tests)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

- **Test:** should update the URL to /clientes/:clienteId when a client item is clicked
  - **Status:** RED - Route `clientes.$clienteId.tsx` not implemented
  - **Verifies:** AC1 — URL deep linking on click

- **Test:** should render the right panel with the detail container after clicking a client item
  - **Status:** RED - `ClienteDetailView` component not created; `data-testid="cliente-detail-panel"` missing
  - **Verifies:** AC1 — right panel container renders on click

- **Test:** should display the client Nombre in the detail panel after clicking
  - **Status:** RED - `ClienteDetailView` not rendering data
  - **Verifies:** AC1 — Nombre field displayed

- **Test:** should display the client NIT/RUC in the detail panel after clicking
  - **Status:** RED - `ClienteDetailView` not rendering data
  - **Verifies:** AC1 — NIT/RUC field displayed

- **Test:** should display the client Teléfono in the detail panel after clicking
  - **Status:** RED - `ClienteDetailView` not rendering data
  - **Verifies:** AC1 — Teléfono field displayed

- **Test:** should display the client Ciudad in the detail panel after clicking
  - **Status:** RED - `ClienteDetailView` not rendering data
  - **Verifies:** AC1 — Ciudad field displayed

- **Test:** should highlight the selected client item in the list
  - **Status:** RED - `data-selected` attribute not set on `ClientListItem`
  - **Verifies:** AC1 — Selected item visual state

- **Test:** should load and display client details when navigating directly to /clientes/:clienteId
  - **Status:** RED - Dynamic route not created; direct URL loads blank panel
  - **Verifies:** AC2 — FR30 deep linking

- **Test:** should show all four client fields when navigating directly to /clientes/:clienteId
  - **Status:** RED - Detail view not rendered on direct access
  - **Verifies:** AC2 — All 4 fields on direct URL access

- **Test:** should render both the list panel and the detail panel on direct URL access
  - **Status:** RED - Split layout not rendered on direct URL access
  - **Verifies:** AC2 — Split-panel preserved on direct URL

- **Test:** should display "Cliente no encontrado." when the API returns 404
  - **Status:** RED - 404 error state not handled in `ClienteDetailView`
  - **Verifies:** AC3 — Graceful 404 message

- **Test:** should NOT render an ErrorPanel for 404 — only the not-found text message
  - **Status:** RED - 404 vs generic error distinction not implemented
  - **Verifies:** AC3 — 404 shows text not ErrorPanel

- **Test:** should not crash the application when clienteId results in a 404
  - **Status:** RED - Unhandled error state
  - **Verifies:** AC3 — No crash on 404

- **Test:** should render an ErrorPanel when GET /api/v1/clientes/:id returns 500
  - **Status:** RED - `ClienteDetailView` error state not implemented
  - **Verifies:** AC4 — ErrorPanel for non-404 errors

- **Test:** should render a "Reintentar" button inside the ErrorPanel for detail fetch failure
  - **Status:** RED - ErrorPanel not wired to detail fetch
  - **Verifies:** AC4 — Retry button visible

- **Test:** should trigger a new GET /api/v1/clientes/:id fetch when "Reintentar" is clicked
  - **Status:** RED - `refetch` not wired to retry button
  - **Verifies:** AC4 — Retry triggers new fetch

- **Test:** should render skeleton elements during loading
  - **Status:** RED - `react-loading-skeleton` not used; `data-testid="cliente-detail-skeleton"` missing
  - **Verifies:** AC5 — Skeleton placeholders visible during loading

- **Test:** should NOT show a spinner during loading
  - **Status:** RED - No skeleton implemented yet
  - **Verifies:** AC5 — Spinner explicitly forbidden

- **Test:** should display the "Selecciona un cliente" placeholder when at /clientes with no clienteId
  - **Status:** RED - Placeholder state not rendered in `clientes.tsx`
  - **Verifies:** AC6 — Empty state placeholder

- **Test:** should display the text "Selecciona un cliente para ver su detalle." in the right panel
  - **Status:** RED - Placeholder text not in DOM
  - **Verifies:** AC6 — Correct Spanish placeholder text

- **Test:** should NOT show the detail panel with client data when no client is selected
  - **Status:** RED - Detail fields shown when they should not be
  - **Verifies:** AC6 — Fields hidden when no selection

### API Tests (9 tests)

**File:** `e2e/tests/api/client-detail.api.spec.ts`

- **Test:** should return HTTP 200 when requesting an existing client by ID
  - **Status:** RED - `GET /{id}` endpoint not implemented in `ClienteEndpoints.cs`
  - **Verifies:** AC2 — Backend endpoint returns 200

- **Test:** should return a JSON object with id, nombre, nit, telefono, ciudad fields
  - **Status:** RED - `GetClienteByIdQueryHandler` not created
  - **Verifies:** AC2 — Response shape matches contract

- **Test:** should return content-type application/json for a successful response
  - **Status:** RED - Endpoint not implemented
  - **Verifies:** AC2 — Correct content-type header

- **Test:** should return the exact same data that was used to create the client
  - **Status:** RED - `GetByIdAsync` not implemented in repository
  - **Verifies:** AC2 — Data integrity

- **Test:** should return HTTP 404 when requesting a client ID that does not exist
  - **Status:** RED - Handler returns null but endpoint does not map to 404
  - **Verifies:** AC3 — HTTP 404 status

- **Test:** should return a Problem Details body (RFC 7807) for a 404 response
  - **Status:** RED - Problem Details 404 not mapped
  - **Verifies:** AC3 — Problem Details format

- **Test:** should include detail "Cliente not found." in the 404 Problem Details body
  - **Status:** RED - Detail field not set in Results.Problem call
  - **Verifies:** AC3 — Correct error message text

- **Test:** should return content-type application/problem+json for a 404 response
  - **Status:** RED - Content-Type not set to problem+json
  - **Verifies:** AC3/AC4 — Correct MIME type for errors

- **Test:** should return HTTP 400 or 404 (not 500) for a malformed (non-GUID) clienteId
  - **Status:** RED - Route constraint `{id:guid}` not yet applied
  - **Verifies:** AC4 — No crash on bad input

- **Test:** should never return an HTML error page for a missing client
  - **Status:** RED - `ExceptionHandlingMiddleware` not verified for this path
  - **Verifies:** AC4 — Problem Details not HTML

---

## Data Factories Created

### Cliente Factory

**File:** `e2e/helpers/data.helper.ts` (extends existing)

**Exports:**
- `buildCliente(overrides?)` — already present from Story 2.1; no changes needed

**Inline stubs used in tests:**
```typescript
const CLIENTE_STUB = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  nombre: 'Empresa Detalle SA',
  nit: '900111222',
  telefono: '3001234567',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};
```

---

## Fixtures Created

No new Playwright fixtures are required. The existing `base.fixture.ts` provides `clientesPage` for navigation.
API tests use Playwright's built-in `request` fixture with direct REST calls for setup/teardown.

---

## Mock Requirements

### GET /api/v1/clientes/{id} — E2E Mocks (Playwright route interception)

**Success Response (200):**
```json
{
  "id": "a1b2c3d4-0000-0000-0000-000000000001",
  "nombre": "Empresa Detalle SA",
  "nit": "900111222",
  "telefono": "3001234567",
  "ciudad": "Medellín",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

**Not-Found Response (404):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente not found."
}
```

**Server Error Response (500):**
```json
{
  "title": "Internal Server Error",
  "status": 500
}
```

**Notes:** All E2E mocks intercept `**/api/v1/clientes/{id}` BEFORE `page.goto()` is called (network-first pattern). The list endpoint `**/api/v1/clientes` is always intercepted concurrently.

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-panel` — wrapper `<div>` for the entire right panel (used by both placeholder and loaded states)
- `cliente-detail-skeleton` — container for react-loading-skeleton while `isLoading` is true (4 skeleton rows)
- `cliente-detail-fields` — wrapper for the populated field list (`<dl>` or equivalent) — only rendered when data is present
- `cliente-detail-placeholder` — the `<p>` or `<div>` shown when `clienteId` is undefined/empty ("Selecciona un cliente...")

### ClientListItem Component (modification)

- `cliente-list-item` — already exists from Story 2.1; add `data-selected="true|false"` attribute based on `isSelected` prop

**Implementation Example:**

```tsx
// ClienteDetailView.tsx
<div data-testid="cliente-detail-panel">
  {/* Loading state */}
  {isLoading && (
    <div data-testid="cliente-detail-skeleton">
      <Skeleton count={4} />
    </div>
  )}

  {/* Placeholder (no clienteId) */}
  {!clienteId && (
    <p data-testid="cliente-detail-placeholder">
      Selecciona un cliente para ver su detalle.
    </p>
  )}

  {/* Populated detail */}
  {data && (
    <dl data-testid="cliente-detail-fields">
      <dt>Nombre</dt><dd>{data.nombre}</dd>
      <dt>NIT/RUC</dt><dd>{data.nit}</dd>
      <dt>Teléfono</dt><dd>{data.telefono}</dd>
      <dt>Ciudad</dt><dd>{data.ciudad}</dd>
    </dl>
  )}
</div>

// ClientListItem.tsx — add data-selected attribute
<li
  data-testid="cliente-list-item"
  data-selected={isSelected ? 'true' : 'false'}
>
  ...
</li>
```

---

## Implementation Checklist

### Test: should return HTTP 200 when requesting an existing client by ID (API)

**File:** `e2e/tests/api/client-detail.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository.cs`
- [ ] Implement `GetByIdAsync` in `ClienteRepository.cs` using `FindAsync`
- [ ] Create `GetClienteByIdQuery.cs` with property `Guid Id`
- [ ] Create `GetClienteByIdQueryHandler.cs` returning `ClienteDto?`
- [ ] Add `GET /{id:guid}` route in `ClienteEndpoints.cs` calling handler
- [ ] Run test: `npx playwright test e2e/tests/api/client-detail.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: should return HTTP 404 with Problem Details for non-existent ID (API)

**File:** `e2e/tests/api/client-detail.api.spec.ts`

**Tasks to make this test pass:**
- [ ] In endpoint handler: if handler returns `null` → `Results.Problem(title: "Not Found", detail: "Cliente not found.", statusCode: 404)`
- [ ] Verify `ExceptionHandlingMiddleware` does not intercept intentional 404s
- [ ] Run test: `npx playwright test e2e/tests/api/client-detail.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should update the URL to /clientes/:clienteId when a client item is clicked (E2E)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `getById` in `clienteApiRepository.ts`
- [ ] Create `useCliente.ts` hook with TanStack Query
- [ ] Create route `frontend/src/routes/_app/clientes.$clienteId.tsx`
- [ ] In `ClienteListPanel.tsx`: wrap each `ClientListItem` with TanStack Router `<Link to="/_app/clientes/$clienteId">`
- [ ] Add required data-testid: `cliente-detail-panel`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC1"`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: should display client Nombre/NIT/Teléfono/Ciudad in detail panel (E2E)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] Create `ClienteDetailView.tsx` component
- [ ] Wire `useCliente(clienteId)` in `ClienteDetailView`
- [ ] Render `<dl data-testid="cliente-detail-fields">` with all 4 fields
- [ ] Add data-testid: `cliente-detail-fields`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "Nombre|NIT|Teléfono|Ciudad"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: should highlight the selected client item (E2E)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] In `ClientListItem.tsx`: accept `isSelected` prop; add `data-selected={isSelected ? 'true' : 'false'}`
- [ ] In `ClienteListPanel.tsx`: pass `isSelected={selectedClienteId === cliente.id}`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "highlight"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should load client details on direct URL access (E2E, AC2)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] In `clientes.$clienteId.tsx` route: add loader with `queryClient.prefetchQuery(['clientes', clienteId], ...)`
- [ ] Render `<ClienteDetailView clienteId={clienteId} />` in the route component
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC2"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should display "Cliente no encontrado." for 404 (E2E, AC3)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] In `ClienteDetailView.tsx`: detect `error.response?.status === 404` (AxiosError)
- [ ] Render `<p className="text-slate-500">Cliente no encontrado.</p>` for 404
- [ ] Add data-testid: `cliente-detail-panel` wrapping the 404 message
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC3"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should render ErrorPanel with "Reintentar" for non-404 errors (E2E, AC4)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] In `ClienteDetailView.tsx`: for non-404 `isError` → render `<ErrorPanel onRetry={refetch} />`
- [ ] Verify `ErrorPanel` has `data-testid="error-panel"` and retry button has `data-testid="error-panel-retry-button"`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC4"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should render skeleton placeholders during loading (E2E, AC5)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] In `ClienteDetailView.tsx`: for `isLoading` → render `<div data-testid="cliente-detail-skeleton"><Skeleton count={4} /></div>`
- [ ] Import `Skeleton` from `react-loading-skeleton`
- [ ] Add required data-testid: `cliente-detail-skeleton`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC5"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should display "Selecciona un cliente para ver su detalle." placeholder (E2E, AC6)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] In `ClienteDetailView.tsx`: if `!clienteId` → render `<p data-testid="cliente-detail-placeholder">Selecciona un cliente para ver su detalle.</p>`
- [ ] In `clientes.tsx` (Story 2.1 route): render `<ClienteDetailView clienteId={undefined} />` in the `flex-1` right panel
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC6"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all Story 2.2 E2E failing tests
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts

# Run all Story 2.2 API failing tests (requires backend running on :5000)
npx playwright test e2e/tests/api/client-detail.api.spec.ts

# Run all Story 2.2 tests together
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/client-detail.api.spec.ts

# Run tests in headed mode (see browser interactions)
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --headed

# Run a specific AC group
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC1"
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC2"
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC3"
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC4"
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC5"
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC6"

# Debug a specific test
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**
- All tests written and failing
- Network-first intercept pattern applied throughout
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created with clear task mapping

**Verification:**
- All E2E tests fail because `ClienteDetailView`, `clientes.$clienteId.tsx`, and `GET /{id}` endpoint do not exist
- API tests fail because `GET /api/v1/clientes/{id}` is not implemented
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with API tests — backend first)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order (backend first, then frontend):**
1. Backend: `IClienteRepository.GetByIdAsync` → `GetClienteByIdQueryHandler` → endpoint
2. API tests should go green
3. Frontend: `useCliente` hook → `ClienteDetailView` → route `clientes.$clienteId.tsx`
4. E2E tests should go green AC by AC

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review `ClienteDetailView.tsx` for accessibility (`<dl>/<dt>/<dd>` semantic structure)
3. Verify WCAG 2.1 AA compliance (run axe in Vitest unit test as specified in Task 8)
4. Run unit tests (Vitest + RTL + MSW) as specified in the story's Task 8 and Task 9
5. Ensure all tests still pass after refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/client-detail.api.spec.ts`
3. Begin implementation starting with backend endpoint
4. Work one test at a time (red → green for each)
5. When all Playwright tests pass, run unit tests (Vitest/xUnit) for full coverage
6. When all tests pass, manually update story status to 'in-review' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception applied BEFORE `page.goto()` throughout all E2E tests
- **selector-resilience.md** — All selectors use `data-testid` (no CSS/text fragile selectors)
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, no hard waits
- **fixture-architecture.md** — API tests use `request` fixture with inline create/delete for cleanup
- **test-levels-framework.md** — E2E for user journeys (AC1, AC2, AC3, AC4, AC5, AC6); API for contract verification (AC2, AC3, AC4)
- **timing-debugging.md** — Simulated network delay uses `setTimeout` inside route handler (not `page.waitForTimeout`)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/client-detail.api.spec.ts`

**Expected Results:**
```
E2E tests: 21 failed — ClienteDetailView not implemented
API tests: 9 failed — GET /api/v1/clientes/{id} not implemented

Summary:
  Total tests: 30
  Passing: 0 (expected)
  Failing: 30 (expected)
  Status: RED phase verified
```

**Expected Failure Messages:**
- E2E: `Locator.click: Error: locator('data-testid=cliente-list-item') resolves to 0 elements` (no route)
- E2E: `expect(locator).toHaveURL(...)` — URL did not update
- E2E: `Locator 'data-testid=cliente-detail-panel' resolved to 0 elements`
- API: `Error: connect ECONNREFUSED 127.0.0.1:5000` (if backend not running) or `expect(received).toBe(200)` with 404 (endpoint not implemented)

---

## Notes

- The E2E tests for AC5 (skeleton loading) use a `setTimeout` inside the route handler to simulate a slow network. This is an in-process delay in the Playwright route handler and does not constitute a hard wait in the test itself.
- API tests require the backend to be running (`dotnet run` in `backend/src/SiesaAgents.API`). They will fail with ECONNREFUSED if the server is not running.
- The `data-selected` attribute on `ClientListItem` (AC1 test: "should highlight the selected client item") must be implemented as an HTML attribute accessible to Playwright, not only a CSS class. This ensures test stability.
- Story 2.2 Vitest unit tests (Task 8) and xUnit tests (Task 9) are NOT covered by this ATDD checklist. Those are specified in the story's task list and should be written by the dev agent as part of implementation.

---

**Generated by BMad TEA Agent** - 2026-06-13
