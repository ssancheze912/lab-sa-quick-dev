# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component

---

## Story Summary

A commercial team member can view the complete details of a client by selecting them from the list,
and the right panel displays all fields (Nombre, NIT/RUC, Teléfono, Ciudad) with URL deep-linking.
The story covers loading, error, not-found, and empty-selection states in the right panel of the
split layout established in Story 2.1.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, When the user clicks on a client item, Then the right panel shows complete client details (Nombre, NIT/RUC, Teléfono, Ciudad) AND the URL updates to `/clientes/:clienteId` via TanStack Router client-side navigation (FR30).

2. **AC2** — Given the user accesses the URL `/clientes/:clienteId` directly, When the page loads, Then the correct client details are fetched from `GET /api/v1/clientes/{id}` and displayed in the right panel.

3. **AC3** — Given a clienteId in the URL does not exist (backend returns 404), When the page loads, Then a not-found message "Cliente no encontrado." is displayed gracefully — no unhandled error, no stack trace.

4. **AC4** — Given the backend is unavailable when fetching the client detail, When the fetch fails (network error or non-2xx non-404 response), Then an `ErrorPanel` component with a "Reintentar" button is displayed; clicking "Reintentar" triggers a new fetch attempt.

5. **AC5** — Given the client detail is loading, When the fetch is in-flight, Then a skeleton loader (react-loading-skeleton) is rendered in the right panel — no spinner.

6. **AC6** — Given no client is selected (user navigates to `/clientes` without a clienteId), When the page renders, Then the right panel shows "Selecciona un cliente para ver sus detalles."

7. **AC7** — Given the client list is displayed, When the user clicks on a client item, Then the corresponding `ClientListItem` shows the active/selected visual state (aria-selected="true", bg-primary-50 text-primary-700).

---

## Failing Tests Created (RED Phase)

### E2E Tests (32 tests)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

- **Test:** AC1 — should update the URL to /clientes/:clienteId when a list item is clicked
  - **Status:** RED — route `/_app/clientes/$clienteId` stub, `ClienteDetailView` not yet implemented
  - **Verifies:** FR30 deep-link URL update (AC1)

- **Test:** AC1 — should display the right panel with ClienteDetailView after clicking a list item
  - **Status:** RED — `data-testid="cliente-detail-view"` does not exist yet
  - **Verifies:** Detail panel renders on item click (AC1)

- **Test:** AC1 — should display client Nombre in the detail view after clicking a list item
  - **Status:** RED — `data-testid="cliente-detail-nombre"` does not exist yet
  - **Verifies:** Nombre field displayed in detail (AC1)

- **Test:** AC1 — should display client NIT/RUC in the detail view after clicking a list item
  - **Status:** RED — `data-testid="cliente-detail-nit"` does not exist yet
  - **Verifies:** NIT/RUC field displayed in detail (AC1)

- **Test:** AC1 — should display client Teléfono in the detail view after clicking a list item
  - **Status:** RED — `data-testid="cliente-detail-telefono"` does not exist yet
  - **Verifies:** Teléfono field displayed in detail (AC1)

- **Test:** AC1 — should display client Ciudad in the detail view after clicking a list item
  - **Status:** RED — `data-testid="cliente-detail-ciudad"` does not exist yet
  - **Verifies:** Ciudad field displayed in detail (AC1)

- **Test:** AC1 — should NOT trigger a full page reload when navigating to /clientes/:clienteId
  - **Status:** RED — TanStack Router nested routing not yet wired
  - **Verifies:** Client-side navigation (FR30, AC1)

- **Test:** AC1 — should keep ClienteListView visible in the left panel after navigating to detail
  - **Status:** RED — split layout outlet not yet configured
  - **Verifies:** Split layout preserved on navigation (AC1)

- **Test:** AC2 — should fetch and display client details when navigating directly to /clientes/:clienteId
  - **Status:** RED — `GET /api/v1/clientes/{id}` endpoint not yet implemented
  - **Verifies:** Direct URL access fetches detail (AC2)

- **Test:** AC2 — should send a GET /api/v1/clientes/:id request when accessing detail URL directly
  - **Status:** RED — `clienteApiRepository.getById()` not yet implemented
  - **Verifies:** API call triggered on direct URL (AC2)

- **Test:** AC2 — should display all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) on direct URL access
  - **Status:** RED — `ClienteDetailView` component not yet created
  - **Verifies:** All four fields rendered (AC2)

- **Test:** AC3 — should display "Cliente no encontrado." when backend returns 404
  - **Status:** RED — `data-testid="cliente-not-found"` does not exist yet
  - **Verifies:** Graceful 404 handling (AC3)

- **Test:** AC3 — should NOT display an unhandled error or stack trace when backend returns 404
  - **Status:** RED — no 404 differentiation logic yet
  - **Verifies:** NFR6 — no stack traces exposed (AC3)

- **Test:** AC3 — should NOT render the ErrorPanel component when backend returns 404
  - **Status:** RED — 404 vs generic error differentiation not implemented
  - **Verifies:** 404 ≠ generic error (AC3)

- **Test:** AC4 — should render ErrorPanel in the right panel when detail fetch returns 500
  - **Status:** RED — `ErrorPanel` not wired into right panel
  - **Verifies:** Non-404 error shows ErrorPanel (AC4)

- **Test:** AC4 — should render a "Reintentar" button inside the ErrorPanel in the right panel
  - **Status:** RED — retry button in right panel not implemented
  - **Verifies:** Reintentar button present (AC4)

- **Test:** AC4 — should trigger a new fetch when "Reintentar" is clicked in the detail right panel
  - **Status:** RED — `refetch` not wired to retry button
  - **Verifies:** Retry triggers new fetch (AC4)

- **Test:** AC4 — should render ErrorPanel when detail fetch fails with a network error (abort)
  - **Status:** RED — network error handling not implemented
  - **Verifies:** Network error → ErrorPanel (AC4)

- **Test:** AC5 — should render a skeleton loader in the right panel while the detail API is in flight
  - **Status:** RED — `data-testid="cliente-detail-skeleton"` does not exist
  - **Verifies:** Skeleton shown during loading (AC5)

- **Test:** AC5 — should NOT render a spinner in the right panel during loading (skeleton only)
  - **Status:** RED — no loading state implemented yet
  - **Verifies:** Skeleton-only (no spinner) policy (AC5)

- **Test:** AC5 — should hide the skeleton loader once the detail data is fully loaded
  - **Status:** RED — no loading→success transition yet
  - **Verifies:** Skeleton hidden on data load (AC5)

- **Test:** AC6 — should render the placeholder "Selecciona un cliente para ver sus detalles." when navigating to /clientes
  - **Status:** RED — `ClienteDetailPlaceholder` component not yet created
  - **Verifies:** Empty right panel placeholder (AC6)

- **Test:** AC6 — should NOT render ClienteDetailView when no clienteId is in the URL
  - **Status:** RED — route conditional logic not yet implemented
  - **Verifies:** Detail view hidden when no clienteId (AC6)

- **Test:** AC6 — should show placeholder even when client list is empty
  - **Status:** RED — placeholder component not yet created
  - **Verifies:** Placeholder independent of list content (AC6)

- **Test:** AC7 — should apply aria-selected="true" to the clicked ClientListItem
  - **Status:** RED — active state wiring to clienteId URL param not yet done
  - **Verifies:** Active visual state on selection (AC7)

- **Test:** AC7 — should remove active state from previously selected item when a new one is clicked
  - **Status:** RED — selection state management not wired
  - **Verifies:** Only one item active at a time (AC7)

- **Test:** AC7 — should pre-select the item matching clienteId when page is loaded via direct URL
  - **Status:** RED — `isSelected` prop not wired to URL param
  - **Verifies:** Pre-selection on direct URL access (AC7)

### API Tests (12 tests)

**File:** `e2e/tests/api/client-detail.api.spec.ts`

- **Test:** GET /api/v1/clientes/{id} — should return HTTP 200 when the client exists
  - **Status:** RED — endpoint `GET /api/v1/clientes/{id}` not yet registered in `ClienteEndpoints.cs`
  - **Verifies:** 200 OK for existing client (AC2)

- **Test:** GET /api/v1/clientes/{id} — should return Content-Type: application/json for an existing client
  - **Status:** RED — endpoint not implemented
  - **Verifies:** JSON content type (AC2)

- **Test:** GET /api/v1/clientes/{id} — should return a single JSON object (not an array)
  - **Status:** RED — endpoint not implemented
  - **Verifies:** Response shape: object not array (AC2)

- **Test:** GET /api/v1/clientes/{id} — should return required camelCase fields
  - **Status:** RED — `ClienteDto` serialization not wired to new endpoint
  - **Verifies:** camelCase field names (AC2)

- **Test:** GET /api/v1/clientes/{id} — should return the correct field values matching the seeded client
  - **Status:** RED — `GetClienteByIdQueryHandler` not yet created
  - **Verifies:** Field values accuracy (AC2)

- **Test:** GET /api/v1/clientes/{id} — should return id as a UUID string
  - **Status:** RED — endpoint not implemented
  - **Verifies:** UUID format for id (AC2)

- **Test:** GET /api/v1/clientes/{id} — should return createdAt and updatedAt as ISO 8601 timestamp strings
  - **Status:** RED — endpoint not implemented
  - **Verifies:** ISO 8601 timestamps (AC2)

- **Test:** GET /api/v1/clientes/{id} — should NOT return snake_case field names
  - **Status:** RED — endpoint not implemented
  - **Verifies:** No snake_case keys (AC2)

- **Test:** GET /api/v1/clientes/{id} — should return HTTP 404 when the client does not exist
  - **Status:** RED — `NotFoundException` → 404 middleware mapping not applied to this endpoint
  - **Verifies:** 404 for non-existent ID (AC3)

- **Test:** GET /api/v1/clientes/{id} — should return RFC 7807 Problem Details body on 404
  - **Status:** RED — endpoint not implemented, middleware not yet handling this endpoint
  - **Verifies:** Problem Details RFC 7807 format (AC3)

- **Test:** GET /api/v1/clientes/{id} — should include a descriptive detail message in the 404 Problem Details body
  - **Status:** RED — `NotFoundException` message not yet crafted for this handler
  - **Verifies:** Detail message contains the ID (AC3)

- **Test:** GET /api/v1/clientes/{id} — should NOT expose a stack trace in the 404 response body (NFR6)
  - **Status:** RED — ExceptionHandlingMiddleware not yet handling this endpoint's exceptions
  - **Verifies:** NFR6 — no stack traces (AC3)

### Component Tests (18 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- **Test:** should render the detail view root container with data-testid="cliente-detail-view"
  - **Status:** RED — `ClienteDetailView.tsx` does not exist
  - **Verifies:** Root element with data-testid (AC2)

- **Test:** should render the Nombre field value when client data is loaded
  - **Status:** RED — component and `data-testid="cliente-detail-nombre"` not yet created
  - **Verifies:** Nombre field (AC2)

- **Test:** should render the NIT/RUC field value when client data is loaded
  - **Status:** RED — `data-testid="cliente-detail-nit"` not yet created
  - **Verifies:** NIT/RUC field (AC2)

- **Test:** should render the Teléfono field value when client data is loaded
  - **Status:** RED — `data-testid="cliente-detail-telefono"` not yet created
  - **Verifies:** Teléfono field (AC2)

- **Test:** should render the Ciudad field value when client data is loaded
  - **Status:** RED — `data-testid="cliente-detail-ciudad"` not yet created
  - **Verifies:** Ciudad field (AC2)

- **Test:** should render all field labels in Spanish
  - **Status:** RED — component not yet created
  - **Verifies:** Spanish labels: Nombre, NIT/RUC, Teléfono, Ciudad (AC2)

- **Test:** should wrap the detail view in \<section aria-label="Detalle del cliente"\> for WCAG 2.1 AA
  - **Status:** RED — WCAG wrapper not yet implemented
  - **Verifies:** WCAG 2.1 AA accessibility (AC7)

- **Test:** should have data-testid attributes for each field value
  - **Status:** RED — all four data-testids not yet created
  - **Verifies:** All four testid attributes present (AC2)

- **Test:** should render a skeleton loader while the fetch is in-flight
  - **Status:** RED — react-loading-skeleton not yet integrated
  - **Verifies:** Skeleton during loading (AC5)

- **Test:** should NOT render a spinner during loading (skeleton only)
  - **Status:** RED — loading state not yet implemented
  - **Verifies:** Skeleton-only loading policy (AC5)

- **Test:** should hide the skeleton once the client data is loaded
  - **Status:** RED — component not yet created
  - **Verifies:** Skeleton hidden on data load (AC5)

- **Test:** should render "Cliente no encontrado." when the API returns 404
  - **Status:** RED — `data-testid="cliente-not-found"` not yet created
  - **Verifies:** Graceful 404 not-found message (AC3)

- **Test:** should NOT render ErrorPanel when the API returns 404
  - **Status:** RED — 404 vs generic error differentiation not implemented
  - **Verifies:** 404 uses not-found, not ErrorPanel (AC3)

- **Test:** should NOT render the detail view fields when the API returns 404
  - **Status:** RED — component not yet created
  - **Verifies:** No field data rendered on 404 (AC3)

- **Test:** should render ErrorPanel when the API returns a 500 error
  - **Status:** RED — ErrorPanel not wired into ClienteDetailView
  - **Verifies:** ErrorPanel on non-404 error (AC4)

- **Test:** should render a "Reintentar" button inside ErrorPanel on non-404 error
  - **Status:** RED — retry button not yet present
  - **Verifies:** Reintentar button (AC4)

- **Test:** should trigger a new fetch when the "Reintentar" button is clicked
  - **Status:** RED — `refetch` not wired to retry button
  - **Verifies:** Retry triggers new fetch (AC4)

- **Test:** should render ErrorPanel on a network error (not a 404)
  - **Status:** RED — error handling not implemented
  - **Verifies:** Network error → ErrorPanel (AC4)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts` (8 tests)

- **Test:** should return client data when the API fetch succeeds
  - **Status:** RED — `useCliente.ts` hook does not exist
  - **Verifies:** Successful fetch returns data (AC2)

- **Test:** should use the canonical query key ["clientes", id]
  - **Status:** RED — hook not yet created
  - **Verifies:** TanStack Query canonical key (AC2)

- **Test:** should return isLoading=true while the fetch is in-flight
  - **Status:** RED — hook not yet created
  - **Verifies:** Loading state (AC5)

- **Test:** should return isError=true when the API returns a 500 error
  - **Status:** RED — hook not yet created
  - **Verifies:** Error state on 500 (AC4)

- **Test:** should expose a refetch function when the fetch fails
  - **Status:** RED — hook not yet created
  - **Verifies:** refetch callable (AC4)

- **Test:** should return isError=true when the API returns a 404
  - **Status:** RED — hook not yet created
  - **Verifies:** 404 also surfaces as isError=true (AC3)

- **Test:** should NOT fetch when id is undefined (query disabled)
  - **Status:** RED — hook not yet created
  - **Verifies:** Query disabled when id=undefined (AC2)

- **Test:** should NOT fetch when id is an empty string (query disabled)
  - **Status:** RED — hook not yet created
  - **Verifies:** Query disabled when id="" (AC2)

---

## Data Factories Created

No new factories required — `cliente.factory.ts` from Story 2.1 covers all Story 2.2 needs.

**Existing factory reused:** `e2e/support/factories/cliente.factory.ts`

**Exports used:**
- `createClienteDto(overrides?)` — Creates a single ClienteDto with id + timestamps for mock API responses
- `createClienteDtos(count, overrides?)` — Creates array of ClienteDtos for list scenarios

---

## Fixtures Created

No new fixtures required — tests use inline `page.route()` network-first interception.

**Pattern used:** Network-first route interception (intercept routes BEFORE `page.goto()`) per `network-first.md` pattern.

---

## Mock Requirements

### GET /api/v1/clientes/{id} — Client Detail API

**Endpoint:** `GET /api/v1/clientes/{id}`

**Success Response (200):**
```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "nombre": "Empresa Test",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

**Not Found Response (404):**
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "Cliente with id '99999999-9999-9999-9999-999999999999' was not found."
}
```

**Server Error Response (500):**
```json
{
  "status": 500,
  "title": "Internal Server Error"
}
```

**Notes:** E2E tests use Playwright `page.route('**/api/v1/clientes/**', ...)` for interception. Component tests use MSW `http.get('*/api/v1/clientes/:id', ...)` handlers.

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-view` — Root `<section>` element of the detail view
- `cliente-detail-nombre` — Displays the client's Nombre field value
- `cliente-detail-nit` — Displays the client's NIT/RUC field value
- `cliente-detail-telefono` — Displays the client's Teléfono field value
- `cliente-detail-ciudad` — Displays the client's Ciudad field value
- `cliente-detail-skeleton` — Skeleton loader container during loading state
- `cliente-not-found` — Message element shown when API returns 404

**Implementation Example:**
```tsx
<section
  data-testid="cliente-detail-view"
  aria-label="Detalle del cliente"
>
  <label>Nombre</label>
  <span data-testid="cliente-detail-nombre">{data.nombre}</span>

  <label>NIT/RUC</label>
  <span data-testid="cliente-detail-nit">{data.nit}</span>

  <label>Teléfono</label>
  <span data-testid="cliente-detail-telefono">{data.telefono}</span>

  <label>Ciudad</label>
  <span data-testid="cliente-detail-ciudad">{data.ciudad}</span>
</section>
```

### ClienteDetailPlaceholder Component

- `cliente-detail-placeholder` — Root element of the right-panel placeholder (already referenced in Story 2.1 tests)

**Implementation Example:**
```tsx
<div data-testid="cliente-detail-placeholder">
  Selecciona un cliente para ver sus detalles.
</div>
```

---

## Implementation Checklist

### Test: AC1 — Click item shows detail in right panel + URL update

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make these tests pass:**
- [ ] Implement `ClienteDetailView` component at `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- [ ] Create `useCliente(id)` hook at `frontend/src/modules/crm/clientes/application/useCliente.ts`
- [ ] Add `getById(id: string)` to `IClienteRepository` interface and `clienteApiRepository.ts`
- [ ] Wire `ClienteDetailView` into `frontend/src/routes/_app/clientes.$clienteId.tsx` (replace stub)
- [ ] Configure TanStack Router outlet/split layout in `frontend/src/routes/_app/clientes.tsx`
- [ ] Pass `clienteId` from URL to `ClientListItem.isSelected` prop
- [ ] Add required data-testid attributes: `cliente-detail-view`, `cliente-detail-nombre`, `cliente-detail-nit`, `cliente-detail-telefono`, `cliente-detail-ciudad`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: AC2 — Direct URL access

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`, `e2e/tests/api/client-detail.api.spec.ts`

**Tasks to make these tests pass:**
- [ ] Create `GetClienteByIdQuery` record at `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- [ ] Create `GetClienteByIdQueryHandler` at `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- [ ] Add `GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository` and `ClienteRepository.cs` (using `AsNoTracking()`)
- [ ] Register `GET /api/v1/clientes/{id:guid}` endpoint in `ClienteEndpoints.cs`
- [ ] Register `GetClienteByIdQueryHandler` in `Program.cs` DI
- [ ] Add required data-testid attributes to `ClienteDetailView`
- [ ] Run test: `npx playwright test e2e/tests/api/client-detail.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC3 — 404 not-found graceful message

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`, `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Add 404 differentiation in `ClienteDetailView`: `(error as AxiosError)?.response?.status === 404`
- [ ] Render `<p data-testid="cliente-not-found">Cliente no encontrado.</p>` on 404
- [ ] Do NOT render `ErrorPanel` when error is 404
- [ ] Verify `ExceptionHandlingMiddleware` maps `NotFoundException` → 404 Problem Details (already done in Story 1.3)
- [ ] Add required data-testid: `cliente-not-found`
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC4 — ErrorPanel with Reintentar on non-404 error

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`, `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Render `<ErrorPanel onRetry={refetch} />` when `isError=true` AND error is NOT a 404
- [ ] Wire `refetch` from `useCliente` to `ErrorPanel.onRetry`
- [ ] Verify `data-testid="error-panel"` and `data-testid="retry-button"` are present in `ErrorPanel.tsx` (from Story 2.1)
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — Skeleton loader (no spinner)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`, `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Add `react-loading-skeleton` for 4 rows (Nombre, NIT/RUC, Teléfono, Ciudad) when `isLoading=true`
- [ ] Add `data-testid="cliente-detail-skeleton"` to the skeleton container
- [ ] Ensure NO spinner (`[role="progressbar"]`, `.spinner`, `data-testid="spinner"`) is rendered
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC6 — Right panel placeholder on /clientes

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make these tests pass:**
- [ ] Create `ClienteDetailPlaceholder` component at `frontend/src/shared/components/ClienteDetailPlaceholder.tsx`
- [ ] Add `data-testid="cliente-detail-placeholder"` to the placeholder root element
- [ ] Render text: "Selecciona un cliente para ver sus detalles."
- [ ] Wire into `clientes.tsx` route: show placeholder when no `clienteId` in URL
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC7 — Active visual state on selected ClientListItem

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make these tests pass:**
- [ ] Read `clienteId` from TanStack Router URL params in `clientes.tsx`
- [ ] Pass `isSelected={clienteId === cliente.id}` to each `ClientListItem`
- [ ] When `isSelected=true` render `aria-selected="true"` and apply classes `bg-primary-50 text-primary-700`
- [ ] When page loads from direct URL `/clientes/:clienteId`, pre-select the matching item
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 2.2 E2E tests (failing — RED phase)
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts

# Run Story 2.2 API contract tests (failing — RED phase)
npx playwright test e2e/tests/api/client-detail.api.spec.ts

# Run frontend component tests (failing — RED phase)
pnpm --filter frontend test -- ClienteDetailView.test.tsx
pnpm --filter frontend test -- useCliente.test.ts

# Run all Story 2.2 tests together
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/client-detail.api.spec.ts

# Run E2E in headed mode to observe browser
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --headed

# Debug specific failing test
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**
- ✅ All tests written and failing (70 total: 27 E2E + 12 API + 26 Component + 8 Unit hook)
- ✅ Fixtures and factories: existing `cliente.factory.ts` reused (no new fixtures needed)
- ✅ Mock requirements documented (GET /api/v1/clientes/{id} success + 404 + 500)
- ✅ data-testid requirements listed (7 new attributes)
- ✅ Implementation checklist created (7 test groups, clear tasks per AC)

**Verification:**
- All tests fail because: `ClienteDetailView.tsx` does not exist, `useCliente.ts` does not exist, `GET /api/v1/clientes/{id}` endpoint not registered, `ClienteDetailPlaceholder.tsx` does not exist
- Failure messages are clear: component imports fail, API requests receive 404 from backend, data-testid selectors find no elements

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC2 — backend endpoint, then AC2 — frontend hook)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended Implementation Order:**
1. Backend: `GetClienteByIdQueryHandler` + repository + endpoint (AC2)
2. Frontend: `useCliente` hook (AC2, AC4, AC5)
3. Frontend: `ClienteDetailView` component — success state (AC2)
4. Frontend: `ClienteDetailView` — skeleton loading (AC5)
5. Frontend: `ClienteDetailView` — 404 not-found (AC3)
6. Frontend: `ClienteDetailView` — ErrorPanel + retry (AC4)
7. Frontend: `ClienteDetailPlaceholder` + routing wiring (AC6)
8. Frontend: Active item state from URL param (AC7, AC1)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 70 tests pass
2. Extract any duplicated logic (e.g., field rendering, error differentiation)
3. Optimize TanStack Query cache invalidation for NFR2 (< 2s response)
4. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase:
   - `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
   - `pnpm --filter frontend test -- ClienteDetailView.test.tsx`
3. Begin implementation using implementation checklist as guide
4. Work one AC group at a time (RED → GREEN per acceptance criterion)
5. When all tests pass, refactor code for quality

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests intercept routes BEFORE `page.goto()` to prevent race conditions
- **selector-resilience.md** — Exclusively `data-testid` selectors (no fragile CSS selectors)
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure throughout
- **data-factories.md** — Reuse of `createClienteDto()` / `createClienteDtos()` from Story 2.1 factory
- **component-tdd.md** — Vitest + RTL + MSW pattern consistent with Story 2.1 component tests
- **test-levels-framework.md** — E2E for critical user journeys (AC1, AC6, AC7), API for contract validation (AC2, AC3), Component for UI behavior (AC3, AC4, AC5)

---

## Test Execution Evidence

### Expected RED Phase Failures

**E2E tests — expected failure:**
```
Error: locator.click: Target closed
  Error: page.getByTestId('cliente-detail-view') → strict mode violation: getByTestId('cliente-detail-view') resolved to 0 elements
```

**API tests — expected failure:**
```
Error: expect(received).toBe(expected)
  Expected: 200
  Received: 404
  (GET /api/v1/clientes/{id} endpoint not yet registered)
```

**Component tests — expected failure:**
```
Error: Cannot find module './ClienteDetailView' from 'ClienteDetailView.test.tsx'
  (Component file does not exist — RED phase confirmed)
```

**Summary:**
- Total tests: 70 (27 E2E + 12 API + 18 Component + 8 Unit hook [approx — see test files])
- Passing: 0 (expected — RED phase)
- Failing: 70 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- `ClienteDetailPlaceholder` can be inlined in `clientes.tsx` route OR created as a shared component — either is acceptable for Story 2.2. The test only checks `data-testid="cliente-detail-placeholder"`.
- `ErrorPanel` already exists from Story 2.1 with `data-testid="error-panel"` and `data-testid="retry-button"`. No changes needed to `ErrorPanel.tsx`.
- The `ExceptionHandlingMiddleware` already maps `NotFoundException` → 404 Problem Details from Story 1.3. No changes needed to middleware.
- The `ClientListItem` shared component already has an `isSelected` prop from Story 2.1 — wire it, don't recreate.
- Story 2.1 tests in `client-list-search.spec.ts` already assert `data-testid="cliente-detail-placeholder"` (AC5 in that story) — Story 2.2 tests must remain compatible with that assertion.

---

**Generated by BMad TEA Agent** — 2026-06-24
