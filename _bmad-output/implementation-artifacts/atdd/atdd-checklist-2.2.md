# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-05-31
**Author:** BMad TEA Agent
**Primary Test Level:** Component (Vitest + RTL + MSW) + E2E (Playwright) + API Integration (xUnit)

---

## Story Summary

A commercial team member can click a client item in the left panel list and see that client's full details (Nombre, NIT/RUC, Teléfono, Ciudad) in the right panel, with the URL updating to `/clientes/:clienteId` (FR30 deep linking). Direct navigation to the deep-link URL also loads the correct client. If the clienteId does not exist, a graceful not-found message is shown. If the backend is unavailable, an ErrorPanel with "Reintentar" is displayed. If no client is selected (`/clientes`), the right panel shows an empty placeholder.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, When the user clicks on a client item, Then the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad. And the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **AC2** — Given the user is on the client detail view, When the user accesses the URL `/clientes/:clienteId` directly, Then the correct client details are loaded and displayed (FR30). The `GET /api/v1/clientes/{id}` endpoint is called using the `clienteId` URL parameter.

3. **AC3** — Given a `clienteId` in the URL does not exist, When the page loads, Then a not-found message is displayed gracefully. No JS error is thrown and the navigation shell remains visible.

4. **AC4** — Given the backend is unavailable when loading a client detail, When `GET /api/v1/clientes/{id}` fails, Then an `ErrorPanel` with a "Reintentar" button is displayed within the right panel.

5. **AC5** — Given no client is selected (user navigates to `/clientes` without a `clienteId`), When the page loads, Then the right panel shows an empty/placeholder state prompting the user to select a client from the list.

---

## Failing Tests Created (RED Phase)

### Component Tests (Vitest + RTL + MSW) — 14 tests

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

#### AC5 — Empty/placeholder state when no client is selected (2 tests)

- **Test:** `Given clienteId is undefined, When ClienteDetailView renders, Then placeholder message is displayed`
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC5 — placeholder "Selecciona un cliente para ver sus detalles"

- **Test:** `Given clienteId is undefined, When ClienteDetailView renders, Then no API call to /api/v1/clientes is made`
  - **Status:** RED — `ClienteDetailView` does not exist; if it fetches with undefined id, MSW throws
  - **Verifies:** AC5 — `enabled: !!id` guard in `useCliente` hook prevents spurious fetch

#### AC1 / AC2 — Detail panel renders client fields (5 tests)

- **Test:** `Given GET /api/v1/clientes/{id} returns a client, When ClienteDetailView renders, Then Nombre is visible`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC1/AC2 — Nombre field rendered

- **Test:** `Given GET /api/v1/clientes/{id} returns a client, When ClienteDetailView renders, Then NIT/RUC is visible`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC1/AC2 — NIT/RUC field rendered

- **Test:** `Given GET /api/v1/clientes/{id} returns a client, When ClienteDetailView renders, Then Teléfono is visible`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC1/AC2 — Teléfono field rendered

- **Test:** `Given GET /api/v1/clientes/{id} returns a client, When ClienteDetailView renders, Then Ciudad is visible`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC1/AC2 — Ciudad field rendered

- **Test:** `Given data is loaded, When ClienteDetailView renders, Then detail section has aria-label="Detalle del cliente"`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** WCAG 2.1 AA — `role="region"` + `aria-label="Detalle del cliente"`

#### Loading state — skeleton (1 test)

- **Test:** `Given ClienteDetailView is mounted with a clienteId, When fetch is in-flight, Then skeleton is rendered`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC1/AC2 — skeleton shown during loading (not a spinner)

#### AC3 — TC-E2-P1-09: Non-existent clienteId shows not-found message (2 tests)

- **Test:** `Given GET /api/v1/clientes/{non-existent-id} returns 404, When ClienteDetailView renders, Then not-found message is displayed`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC3 / TC-E2-P1-09 — Spanish text "El cliente no existe o fue eliminado."

- **Test:** `Given GET /api/v1/clientes/{non-existent-id} returns 404, When ClienteDetailView renders, Then no ErrorPanel retry button is shown`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC3 — 404 is a not-found case, not a recoverable network error; no "Reintentar" shown

#### AC4 — ErrorPanel with "Reintentar" on network error (4 tests)

- **Test:** `Given GET /api/v1/clientes/{id} returns network error, When ClienteDetailView renders, Then ErrorPanel is displayed`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC4 — ErrorPanel shown on network/backend failure

- **Test:** `Given network error, When ErrorPanel is shown, Then "Reintentar" button is visible`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC4 — "Reintentar" button present on ErrorPanel

- **Test:** `Given ErrorPanel is shown, When user clicks "Reintentar" and backend recovers, Then client detail renders`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC4 — retry triggers new fetch and renders detail on success

- **Test:** `Given network error, When ErrorPanel is shown, Then Spanish error message is visible`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC4 — exact text "No se pudo cargar el cliente."

---

### E2E Tests (Playwright) — 9 tests

**File:** `e2e/tests/clientes/cliente-detail-view.spec.ts`

#### AC5 — Placeholder state (1 test)

- **Test:** `AC5 — Given no client is selected, When user navigates to /clientes, Then right panel shows empty placeholder`
  - **Status:** RED — `ClienteDetailView` not implemented in `/clientes` route right panel
  - **Verifies:** AC5 — placeholder text visible in right panel

#### AC1 — Click client item → URL + detail (2 tests)

- **Test:** `AC1 — Given client list is displayed, When user clicks a client item, Then URL updates to /clientes/:clienteId`
  - **Status:** RED — `ClienteListView` items not wrapped in TanStack Router `<Link>`; URL does not update
  - **Verifies:** AC1 / FR30 — URL deep link update on click

- **Test:** `AC1 — Given client list is displayed, When user clicks a client item, Then right panel shows Nombre`
  - **Status:** RED — `ClienteDetailView` not implemented; right panel does not render client detail
  - **Verifies:** AC1 — detail appears in right panel after click

#### TC-E2-P1-08 — Deep link direct URL (3 tests)

- **Test:** `TC-E2-P1-08 — Given direct URL /clientes/:clienteId, When page loads, Then Nombre is displayed in detail panel`
  - **Status:** RED — `clientes.$clienteId.tsx` route file does not exist
  - **Verifies:** AC2 / TC-E2-P1-08 — deep link loads correct client detail

- **Test:** `TC-E2-P1-08 — Given direct URL /clientes/:clienteId, When page loads, Then NIT/RUC is displayed`
  - **Status:** RED — route file does not exist
  - **Verifies:** AC2 — NIT/RUC visible on direct URL navigation

- **Test:** `TC-E2-P1-08 — Given direct URL /clientes/:clienteId, When page loads, Then no redirect occurs and navigation shell is visible`
  - **Status:** RED — route file does not exist
  - **Verifies:** AC2 — URL stability + navigation shell visible

#### AC3 — Non-existent clienteId (3 tests)

- **Test:** `AC3 — Given non-existent clienteId in URL, When page loads, Then not-found message is displayed`
  - **Status:** RED — `ClienteDetailView` not-found state not implemented
  - **Verifies:** AC3 — graceful not-found message in browser

- **Test:** `AC3 — Given non-existent clienteId in URL, When page loads, Then navigation shell remains visible`
  - **Status:** RED — not implemented
  - **Verifies:** AC3 — navigation shell intact (no broken layout)

- **Test:** `AC3 — Given non-existent clienteId in URL, When page loads, Then no JavaScript error is thrown`
  - **Status:** RED — not implemented
  - **Verifies:** AC3 — no `pageerror` events captured

---

### API Integration Tests (xUnit) — 5 tests

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (added to existing file)

#### TC-E2-P1-02: GET /api/v1/clientes/{id} — 200 for known ID, 404 for unknown (5 tests)

- **Test:** `GivenClienteExists_WhenGetApiV1ClientesById_ThenReturns200OK`
  - **Status:** RED — `GET /{id:guid}` endpoint does not exist in `ClienteEndpoints.cs`
  - **Verifies:** AC2 / TC-E2-P1-02 positive — HTTP 200 for known ID

- **Test:** `GivenClienteExists_WhenGetApiV1ClientesById_ThenResponseContainsAllRequiredFields`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC2 — all fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt) present

- **Test:** `GivenClienteExists_WhenGetApiV1ClientesById_ThenResponseIsObjectNotArray`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC2 — response is a JSON object, not an array

- **Test:** `GivenNonExistentClienteId_WhenGetApiV1ClientesById_ThenReturns404`
  - **Status:** RED — endpoint does not exist; would likely return 404 only after handler maps null to NotFound
  - **Verifies:** AC3 / TC-E2-P1-02 negative — HTTP 404 for non-existent UUID

- **Test:** `GivenNonExistentClienteId_WhenGetApiV1ClientesById_ThenResponseIsProblemDetails`
  - **Status:** RED — endpoint does not exist; even if it did, Problem Details wrapping requires middleware configured
  - **Verifies:** AC3 — 404 response includes Problem Details JSON body (not empty response)

---

## Required data-testid Attributes

The following `data-testid` attributes must be added to the implementation for tests to pass:

| Component | data-testid | Purpose |
|-----------|-------------|---------|
| ClienteDetailView — skeleton container | `(implicit via aria-label)` | Identified via `aria-label="Cargando detalle del cliente..."` |
| ErrorPanel | `error-panel` | Already required by Story 2.1 — reuse existing component |

---

## Required ARIA Attributes

| Element | ARIA | Value |
|---------|------|-------|
| Detail section (when data loaded) | `role` | `region` |
| Detail section (when data loaded) | `aria-label` | `"Detalle del cliente"` |
| Skeleton container | `aria-label` | `"Cargando detalle del cliente..."` |
| ErrorPanel | `role` | `alert` (existing from Story 2.1) |
| Not-found container | `role` | `status` |

---

## Mock Requirements (MSW — Component Tests)

### GET /api/v1/clientes/{id} — Happy Path

**Endpoint:** `GET /api/v1/clientes/:id`

**Success Response:**
```json
{
  "id": "aaa00000-0000-0000-0000-000000000001",
  "nombre": "Empresa Alpha",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-05-01T10:00:00Z",
  "updatedAt": "2026-05-01T10:00:00Z"
}
```

### GET /api/v1/clientes/{id} — Not Found

**Endpoint:** `GET /api/v1/clientes/:id` (where `:id = NON_EXISTENT_ID`)

**404 Response:**
```
HTTP 404 (null body — the endpoint returns Results.NotFound())
```

### GET /api/v1/clientes/{id} — Network Error

**Endpoint:** `GET /api/v1/clientes/:id`

**Error:** `HttpResponse.error()` — simulates backend unavailable

**Notes:**
- The `useCliente` hook must set `enabled: !!id` — if `id` is `undefined`, no MSW handler is registered and `onUnhandledRequest: 'error'` would throw. Test verifies no fetch is made.
- When 404 is returned, Axios throws `AxiosError`. The component distinguishes 404 from network errors via `error.response?.status === 404`. 404 → not-found message; no `status` or status != 404 → ErrorPanel.

---

## Implementation Checklist

### Backend — Make TC-E2-P1-02 API integration tests pass

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (already extended)

- [ ] Verify `GetByIdAsync(Guid id)` is declared in `IClienteRepository.cs` (may already exist from Story 2.1 planning — check before adding)
- [ ] Implement `GetByIdAsync(Guid id)` in `ClienteRepository.cs`: `return await _context.Clientes.FindAsync(id)`
- [ ] Create `GetClienteByIdQuery.cs` in `SiesaAgents.Application/Clientes/Queries/`
- [ ] Create `GetClienteByIdQueryHandler.cs` — returns `ClienteDto?`; `null` when not found (no exception)
- [ ] Add `GET /{id:guid}` route in `ClienteEndpoints.cs` inside `MapClienteEndpoints`: maps `null` → `Results.NotFound()`
- [ ] Register `GetClienteByIdQueryHandler` as scoped in `Program.cs`
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "FullyQualifiedName~GivenClienteExists_WhenGetApiV1ClientesById"`
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "FullyQualifiedName~GivenNonExistentClienteId"`
- [ ] Verify all 5 new GET-by-ID tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Frontend Hook — Make `useCliente` hook and repository changes (prerequisite for component tests)

**Files:** `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`, `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`, `frontend/src/modules/crm/clientes/application/useCliente.ts`

- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `getById(id: string)` in `clienteApiRepository.ts`: `GET /api/v1/clientes/{id}` via `apiClient`
- [ ] Create `useCliente.ts` hook: `queryKey: ['clientes', id]`, `enabled: !!id`, `queryFn: () => clienteApiRepository.getById(id!)`
- [ ] Ensure `AxiosError` with status 404 is propagated as `isError: true` (TanStack Query default behavior)

**Estimated Effort:** 0.5 hours

---

### Frontend Component — Make ClienteDetailView component tests pass

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`

- [ ] Create `ClienteDetailView.tsx` with prop `clienteId: string | undefined`
- [ ] State: `clienteId === undefined` → render placeholder "Selecciona un cliente para ver sus detalles"
- [ ] State: `isLoading` → render `ClienteDetailSkeleton` with `aria-label="Cargando detalle del cliente..."`
- [ ] State: `isError` + `error.response?.status === 404` → render not-found message "El cliente no existe o fue eliminado." (with `role="status"`)
- [ ] State: `isError` + not 404 → render `ErrorPanel` with `onRetry={refetch}` (reuse shared `ErrorPanel` from `src/shared/components/`)
- [ ] State: `data` exists → render `<section role="region" aria-label="Detalle del cliente">` with all four fields using `<dl>/<dt>/<dd>` pattern
- [ ] Detail section: `<h2>` with `data.nombre`
- [ ] Detail section: `<dt>NIT/RUC</dt><dd>{data.nit}</dd>`
- [ ] Detail section: `<dt>Teléfono</dt><dd>{data.telefono}</dd>`
- [ ] Detail section: `<dt>Ciudad</dt><dd>{data.ciudad}</dd>`
- [ ] Run tests: `pnpm test src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`
- [ ] Verify all 14 component tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Frontend Routing — Make E2E deep-link and placeholder tests pass

**Files:** `frontend/src/routes/_app/clientes.$clienteId.tsx`, `frontend/src/routes/_app/clientes.tsx`, `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (or `ClientListItem.tsx`)

- [ ] Create `routes/_app/clientes.$clienteId.tsx` — reads `clienteId` from `Route.useParams()`, renders `<ClienteDetailView clienteId={clienteId} />`
- [ ] Update `routes/_app/clientes.tsx` — replace right panel placeholder div with `<ClienteDetailView clienteId={undefined} />`
- [ ] Wrap each item in `ClienteListView` (or `ClientListItem`) in `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>` (TanStack Router)
- [ ] Apply selected visual state: `bg-blue-50 border-l-2 border-[#0e79fd]` when current URL `clienteId === cliente.id`
- [ ] Minimum 44px touch target height per item (`min-h-[44px]`) — WCAG 2.1 AA
- [ ] Add `data-testid="cliente-detail-panel"` to the right panel container in `clientes.tsx` (if not already present — `ClientesPage.ts` references `cliente-detail-panel`)
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/clientes/cliente-detail-view.spec.ts`
- [ ] Verify all 9 E2E tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all component tests for Story 2.2
cd frontend && pnpm test src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx

# Run in watch mode
cd frontend && pnpm test:watch

# Run backend API integration tests for Story 2.2 (TC-E2-P1-02)
dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "FullyQualifiedName~GivenClienteExists_WhenGetApiV1ClientesById"
dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "FullyQualifiedName~GivenNonExistentClienteId"

# Run all backend integration tests (including Story 2.1 + 2.2)
dotnet test backend/tests/SiesaAgents.IntegrationTests/ --logger "console;verbosity=normal"

# Run E2E tests for Story 2.2
pnpm exec playwright test e2e/tests/clientes/cliente-detail-view.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/cliente-detail-view.spec.ts --headed

# Debug a specific E2E test
pnpm exec playwright test e2e/tests/clientes/cliente-detail-view.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All tests written and failing:

- **Component tests** fail with: `Cannot find module '../ClienteDetailView'` — component does not exist
- **E2E tests** fail with: `page.getByText('Selecciona un cliente para ver sus detalles') — locator not found` or route 404 / wrong HTML for deep-link tests
- **API integration tests** fail with: `expected 200 but received 404 (endpoint not registered)` or `expected to have property 'id' but endpoint not found`

**Verification:**
- Frontend: `pnpm test` → `Error: Failed to resolve import "../ClienteDetailView"` (module not found)
- Backend: `dotnet test` → test fails because `GET /{id:guid}` route is not registered — returns 404 from the framework (not the handler)
- E2E: Playwright → `page.getByRole('region', { name: 'Detalle del cliente' })` — element not found

---

### GREEN Phase (DEV Team — Next Steps)

1. **Backend first (unlocks AC2/AC3 API tests):**
   a. Verify / add `GetByIdAsync` to `IClienteRepository` and `ClienteRepository`
   b. Create `GetClienteByIdQuery.cs` and `GetClienteByIdQueryHandler.cs`
   c. Register handler, add endpoint → run `GivenClienteExists_WhenGetApiV1ClientesById_ThenReturns200OK` → should pass
   d. Work through remaining 4 GET-by-ID tests one by one

2. **Frontend hook (prerequisite for component tests):**
   a. Add `getById` to domain interface + repository implementation
   b. Create `useCliente.ts` hook → no tests fail on hook itself, but component tests need it

3. **Frontend component:**
   a. Create `ClienteDetailView` with undefined case only → AC5 placeholder tests pass
   b. Add loading skeleton → loading test passes
   c. Add data rendering → AC1/AC2 detail field tests pass
   d. Add 404 handling → TC-E2-P1-09 not-found test passes
   e. Add network error handling → AC4 ErrorPanel tests pass

4. **Routing + navigation (E2E tests):**
   a. Create `clientes.$clienteId.tsx` route
   b. Update `clientes.tsx` right panel
   c. Wrap list items in `<Link>` → AC1/TC-E2-P1-08/AC5 E2E tests pass

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 28 tests pass (14 component + 9 E2E + 5 API integration)
2. Confirm `enabled: !!id` guard is correctly placed in `useCliente` (no spurious fetches)
3. Confirm `aria-label="Detalle del cliente"` on `<section role="region">` (not just a div)
4. Confirm `<dl>/<dt>/<dd>` pattern used for field labels (accessible without extra ARIA per field)
5. Run `pnpm build` in `frontend/` — zero TypeScript errors, bundle < 500KB gzip
6. Run `dotnet build SiesaAgents.sln` — 0 Warnings, 0 Errors

---

## Test Coverage Summary

| AC | Test Case IDs | Level | Tests |
|----|--------------|-------|-------|
| AC1 — Click item → URL + detail fields | E2E: TC-E2-P1-08 partial | E2E | 2 |
| AC2 — Direct URL deep link | TC-E2-P1-08, TC-E2-P1-02 | E2E + API | 3 + 3 |
| AC3 — Not-found message, no JS error | TC-E2-P1-09, TC-E2-P1-02 negative | Component + E2E + API | 2 + 3 + 2 |
| AC4 — ErrorPanel + Reintentar on failure | — | Component | 4 |
| AC5 — Empty/placeholder when no client selected | — | Component + E2E | 2 + 1 |
| WCAG 2.1 AA | — | Component | 1 (aria-label) + 1 (skeleton) |

**Total tests in RED phase:** 28 (14 component + 9 E2E + 5 API integration)

---

## Knowledge Base References Applied

- **Given-When-Then naming** — all test names follow the GWT pattern
- **Network-first intercepts** — MSW `setupServer()` handlers set before `render()`; Playwright `page.route()` set before `page.goto()`
- **data-testid selectors** — assertions use `data-testid`, `role`, accessible text, `aria-label`; no CSS class selectors
- **No hard waits** — `waitFor()` with explicit conditions; no `setTimeout` or fixed delays (except MSW delay for loading state verification)
- **RED phase confirmed** — component tests reference non-existent `ClienteDetailView` module; E2E tests reference unimplemented routes; API tests reference unregistered endpoint
- **`enabled: !!id` guard** — undefined clienteId must NOT trigger any fetch (verified by test + MSW `onUnhandledRequest: 'error'`)

---

**Generated by BMad TEA Agent** — 2026-05-31
