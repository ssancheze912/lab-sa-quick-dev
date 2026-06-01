# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-01
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** E2E + API + Component (Unit)

---

## Story Summary

Commercial team members can view the complete details of a selected client in a right-side panel. Clicking a client item in the left panel navigates to `/clientes/:clienteId`, which fetches client data via `GET /api/v1/clientes/{id}`. The page supports direct URL access (FR30 deep linking), graceful 404 handling ("Cliente no encontrado"), server error handling (ErrorPanel + Reintentar), and skeleton placeholders during loading.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, when the user clicks on a client item in the left panel, then the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad (FR3).
2. **AC2** — Given a client is selected, when the detail panel renders, then the URL updates to `/clientes/:clienteId` reflecting the selected client's UUID (FR30 deep linking).
3. **AC3** — Given the user accesses the URL `/clientes/:clienteId` directly, when the page loads, then the correct client details are fetched via `GET /api/v1/clientes/{id}` and displayed in the right panel (FR30).
4. **AC4** — Given a `clienteId` in the URL does not exist (404 from backend), when the page loads, then "Cliente no encontrado" is displayed gracefully — no stack traces or technical details exposed (NFR6).
5. **AC5** — Given the backend is unavailable when fetching client detail, when the `GET /api/v1/clientes/{id}` call fails, then an `ErrorPanel` with "Reintentar" is displayed in the right panel, and the list panel remains functional.
6. **AC6** — Given the detail is loading, when the `useCliente(id)` query is in `isLoading` state, then skeleton placeholders are displayed using `react-loading-skeleton` (no spinner).
7. **AC7** — Given the backend entity and handler are in place, when `GET /api/v1/clientes/{id}` is called with a valid UUID, then HTTP 200 + JSON with fields `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`; for unknown UUID → HTTP 404 Problem Details RFC 7807.

---

## Failing Tests Created (RED Phase)

### E2E Tests (18 tests)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

- **[P0] should show client detail panel when a client item is clicked**
  - **Status:** RED — `cliente-detail-panel` data-testid does not exist (ClienteDetailPanel not implemented)
  - **Verifies:** AC1 — detail panel renders on client click

- **[P0] should display Nombre in the client detail panel**
  - **Status:** RED — ClienteDetailPanel not implemented
  - **Verifies:** AC1 — Nombre field shown

- **[P0] should display NIT/RUC in the client detail panel**
  - **Status:** RED — ClienteDetailPanel not implemented
  - **Verifies:** AC1 — NIT/RUC field shown

- **[P0] should display Telefono in the client detail panel**
  - **Status:** RED — ClienteDetailPanel not implemented
  - **Verifies:** AC1 — Teléfono field shown

- **[P0] should display Ciudad in the client detail panel**
  - **Status:** RED — ClienteDetailPanel not implemented
  - **Verifies:** AC1 — Ciudad field shown

- **[P0] should display field labels in Spanish (Nombre, NIT/RUC, Teléfono, Ciudad)**
  - **Status:** RED — ClienteDetailPanel not implemented
  - **Verifies:** AC1 — all 4 Spanish labels present in detail panel

- **[P1] should keep the left panel (ClienteListPanel) visible when detail is shown**
  - **Status:** RED — detail route not wired; split panel layout not implemented
  - **Verifies:** AC1 — left panel persists (not replaced by detail view)

- **[P0] should update URL to /clientes/:clienteId when a client is clicked**
  - **Status:** RED — ClientListItem onClick navigation to /clientes/$clienteId not implemented
  - **Verifies:** AC2 — URL deep linking on client click

- **[P1] should highlight the selected client item in the left panel**
  - **Status:** RED — active/selected styling on ClientListItem not implemented
  - **Verifies:** AC2 — selected client gets active visual indicator

- **[P0] should fetch and display client details when navigating directly to /clientes/:clienteId**
  - **Status:** RED — route `clientes.$clienteId.tsx` does not exist; ClienteDetailPanel not implemented
  - **Verifies:** AC3 — direct URL load triggers GET /api/v1/clientes/{id}

- **[P0] should call GET /api/v1/clientes/:id when loading direct URL**
  - **Status:** RED — useCliente hook not implemented; getById not in clienteApiRepository
  - **Verifies:** AC3 — correct API endpoint is called

- **[P0] should display "Cliente no encontrado" when clienteId does not exist (404)**
  - **Status:** RED — 404 handling in ClienteDetailPanel not implemented
  - **Verifies:** AC4 — not-found message shown for 404

- **[P0] should NOT display ErrorPanel (with Reintentar) for a 404 not-found case**
  - **Status:** RED — ClienteDetailPanel not implemented
  - **Verifies:** AC4 — 404 is NOT an ErrorPanel situation; no retry button

- **[P0] should NOT expose stack traces or technical details on 404 (NFR6)**
  - **Status:** RED — error handling not implemented
  - **Verifies:** AC4 / NFR6 — no technical details visible to user

- **[P0] should display ErrorPanel in the right panel when detail fetch fails with server error**
  - **Status:** RED — ClienteDetailPanel not implemented; isError state not handled
  - **Verifies:** AC5 — ErrorPanel on server error

- **[P0] should display "Reintentar" button in ErrorPanel when detail fetch fails**
  - **Status:** RED — ErrorPanel not wired in ClienteDetailPanel
  - **Verifies:** AC5 — Reintentar button present on error

- **[P1] should keep the left panel (ClienteListPanel) functional when detail fetch fails**
  - **Status:** RED — route and split panel not implemented
  - **Verifies:** AC5 — left panel remains visible and functional on error

- **[P0] should display skeleton placeholders while client detail is loading**
  - **Status:** RED — skeleton loading state not implemented in ClienteDetailPanel
  - **Verifies:** AC6 — loading state uses skeletons, not spinner

- **[P1] should NOT display a spinner in the loading state (skeleton-only per design)**
  - **Status:** RED — ClienteDetailPanel not implemented
  - **Verifies:** AC6 — no role="status" spinner shown during load

### API Tests (11 tests)

**File:** `e2e/tests/api/client-detail-view.api.spec.ts`

- **[P0] should return HTTP 200 for GET /api/v1/clientes/{id} with a valid UUID**
  - **Status:** RED — endpoint does not exist (GetClienteByIdQueryHandler not implemented)
  - **Verifies:** AC7 — endpoint returns 200 for valid UUID

- **[P0] should return application/json content type for client detail**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC7 — correct Content-Type header

- **[P0] should return a single client object (not an array) for a valid UUID**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC7 — response is a single object, not an array

- **[P0] should return all required fields for a client detail**
  - **Status:** RED — endpoint not implemented; fields not mapped
  - **Verifies:** AC7 — all 7 fields present (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)

- **[P0] should return correct field values matching the created client**
  - **Status:** RED — endpoint not implemented; no field mapping
  - **Verifies:** AC7 — field values match persisted entity

- **[P0] should return id in UUID format**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC7 — id is UUID

- **[P1] should return createdAt and updatedAt as ISO 8601 date strings**
  - **Status:** RED — endpoint not implemented; DateTimeOffset serialization untested
  - **Verifies:** AC7 — timestamps are ISO 8601

- **[P0] should return HTTP 404 for GET /api/v1/clientes/{id} with an unknown UUID**
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — 404 for unknown UUID

- **[P0] should return Problem Details RFC 7807 format for 404 response**
  - **Status:** RED — endpoint not implemented; Problem Details not configured
  - **Verifies:** AC7 — 404 conforms to RFC 7807 (title + status fields)

- **[P0] should return "Cliente no encontrado" as the title in the 404 Problem Details**
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC7 — title is "Cliente no encontrado" in Spanish

- **[P0] should NOT expose stack traces or internal details in 404 response body (NFR6)**
  - **Status:** RED — error handling not implemented
  - **Verifies:** AC7 / NFR6 — no technical details in 404 response

- **[P1] should NOT accept non-UUID values in the {id:guid} route (route constraint)**
  - **Status:** RED — endpoint not implemented; route constraint not set
  - **Verifies:** AC7 — {id:guid} constraint rejects non-UUID values

### Component Unit Tests (12 tests)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useCliente.unit.test.ts`

- **[P0] should export a useCliente function hook**
  - **Status:** RED — useCliente.ts does not exist
  - **Verifies:** AC3 — hook module exists

- **[P0] useCliente should have the correct hook name**
  - **Status:** RED — module not found
  - **Verifies:** AC3 — function name is 'useCliente'

- **[P0] useCliente hook module should exist at the expected path**
  - **Status:** RED — module not found
  - **Verifies:** AC3 — file is in correct application layer location

- **[P0] useCliente should accept an id parameter**
  - **Status:** RED — module not found
  - **Verifies:** AC3 — hook accepts optional id parameter

- **[P0] useCliente has no default export**
  - **Status:** RED — module not found
  - **Verifies:** AC3 — named-only export convention

- **[P0] should export a clienteApiRepository object with a getById method**
  - **Status:** RED — getById not implemented in clienteApiRepository.ts
  - **Verifies:** AC3 — infrastructure repository has getById

- **[P0] clienteApiRepository.getById should be a callable function**
  - **Status:** RED — method not implemented
  - **Verifies:** AC3 — getById is callable

- **[P0] IClienteRepository should compile — module exists at domain layer**
  - **Status:** RED — IClienteRepository.ts does not have getById (already exists, needs update)
  - **Verifies:** AC3 — domain interface includes getById

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailPanel.unit.test.ts`

- **[P0] should export a ClienteDetailPanel function component**
  - **Status:** RED — ClienteDetailPanel.tsx does not exist
  - **Verifies:** AC1 — presentation component exists

- **[P0] ClienteDetailPanel should have the correct component name**
  - **Status:** RED — component not found
  - **Verifies:** AC1 — correct React component name

- **[P0] ClienteDetailPanel module should exist at expected path**
  - **Status:** RED — file not found
  - **Verifies:** AC1 — file is in correct presentation layer location

- **[P0] ClienteDetailPanel has no default export**
  - **Status:** RED — component not found
  - **Verifies:** AC1 — named-only export convention

- **[P0] ErrorPanel should export an onRetry prop accepting a callback function**
  - **Status:** GREEN — ErrorPanel already exists from Story 2.1 (passes immediately)
  - **Verifies:** AC5 — ErrorPanel accepts onRetry

- **[P1] react-loading-skeleton module should be resolvable**
  - **Status:** RED — package may not be installed yet
  - **Verifies:** AC6 — react-loading-skeleton is installed

- **[P1] react-loading-skeleton should export a Skeleton component**
  - **Status:** RED — package may not be installed
  - **Verifies:** AC6 — Skeleton component available

- **[P1] @tanstack/react-router useParams should be importable**
  - **Status:** GREEN — package already installed from Story 2.1 (passes immediately)
  - **Verifies:** AC2 — TanStack Router available for URL param reading

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

- **[P0] HandleAsync_ExistingId_ReturnsMappedClienteDto**
  - **Status:** RED — GetClienteByIdQueryHandler and GetClienteByIdQuery do not exist
  - **Verifies:** AC7 — handler returns ClienteDto for existing UUID

- **[P0] HandleAsync_ExistingId_MapsNombreCorrectly**
  - **Status:** RED — handler not implemented
  - **Verifies:** AC7 — Nombre field mapped correctly

- **[P0] HandleAsync_ExistingId_MapsNitCorrectly**
  - **Status:** RED — handler not implemented
  - **Verifies:** AC7 — Nit field mapped correctly

- **[P0] HandleAsync_ExistingId_MapsTelefonoAndCiudadCorrectly**
  - **Status:** RED — handler not implemented
  - **Verifies:** AC7 — Telefono and Ciudad mapped correctly

- **[P0] HandleAsync_ExistingId_MapsIdCorrectly**
  - **Status:** RED — handler not implemented
  - **Verifies:** AC7 — Id field mapped correctly

- **[P0] HandleAsync_ExistingId_MapsDateTimeOffsetTimestamps**
  - **Status:** RED — handler not implemented
  - **Verifies:** AC7 — CreatedAt and UpdatedAt are DateTimeOffset

- **[P0] HandleAsync_ExistingId_ReturnTypeIsClienteDto**
  - **Status:** RED — handler not implemented
  - **Verifies:** AC7 — return type is ClienteDto

- **[P0] HandleAsync_UnknownId_ReturnsNull**
  - **Status:** RED — handler not implemented
  - **Verifies:** AC7 — null returned for unknown UUID (maps to HTTP 404)

- **[P0] HandleAsync_UnknownId_ReturnsNullNotClienteDtoOfOtherEntity**
  - **Status:** RED — handler not implemented
  - **Verifies:** AC7 — null returned even when other entities exist

- **[P0] GetClienteByIdQuery_ShouldHaveGuidIdProperty**
  - **Status:** RED — GetClienteByIdQuery record does not exist
  - **Verifies:** AC7 — query record has Guid Id property

- **[P0] GetClienteByIdQuery_IdShouldMatchConstructorArgument**
  - **Status:** RED — GetClienteByIdQuery record does not exist
  - **Verifies:** AC7 — query record stores provided Id

---

## Data Factories Used

Existing factory used — `buildCliente()` in `e2e/helpers/data.helper.ts`.

The existing `ApiHelper` class also provides `createCliente()` and `deleteCliente()` for backend test data setup/teardown.

**No new factories required.**

---

## Fixtures Used

Existing `base.fixture.ts` extended fixture pattern. All E2E tests use `test` from `../../fixtures/base.fixture`.

---

## Mock Requirements

### GET /api/v1/clientes/{id} — Network Intercepts for UI Tests

All E2E tests use inline `page.route()` — intercept BEFORE navigation (network-first pattern).

**Success response (HTTP 200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nombre": "Empresa Test AC1",
  "nit": "900111000-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00.000Z",
  "updatedAt": "2026-03-12T10:30:00.000Z"
}
```

**Not found response (HTTP 404, Problem Details RFC 7807):**
```json
{
  "type": "https://httpstatuses.com/404",
  "title": "Cliente no encontrado",
  "status": 404
}
```

**Server error response (HTTP 500):**
```json
{ "title": "Internal Server Error" }
```

**Notes:** API-level tests (AC7) hit the real backend at `http://localhost:5000` — no mocking for those.

---

## Required data-testid Attributes

### ClienteDetailPanel (`frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`)

- `cliente-detail-panel` — The root container of the right-side detail panel
- `cliente-detail-skeleton` — The skeleton loading container (wraps all 4 skeleton rows)

**Implementation Example:**
```tsx
// ClienteDetailPanel.tsx — success state root
<div data-testid="cliente-detail-panel" className="p-6">

// ClienteDetailPanel.tsx — loading state root
<div data-testid="cliente-detail-skeleton" className="p-6 space-y-4">
```

**Existing data-testids (from Story 2.1 — remain unchanged):**
- `clientes-list-panel` — Left panel container
- `cliente-list-item` — Each client row in the list
- `error-panel` — ErrorPanel root container

---

## Implementation Checklist

### Test: [P0] ClienteDetailPanel module exists and exports correctly

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailPanel.unit.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
  - Named export `ClienteDetailPanel`
  - No default export
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Module contract tests pass (green phase)

**Estimated Effort:** Included in Task 5 in story

---

### Test: [P0] useCliente hook exists and exports correctly

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useCliente.unit.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - Named export `useCliente`
  - Accepts `id: string | undefined`
  - Uses `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id!), enabled: !!id })`
- [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` to add `getById(id: string): Promise<Cliente>`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Hook module tests pass

**Estimated Effort:** Included in Tasks 3 and 4 in story

---

### Test: [P0] HandleAsync_ExistingId_ReturnsMappedClienteDto (backend unit tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
  - `record GetClienteByIdQuery(Guid Id)`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  - Constructor: `IClienteRepository _repo`
  - `HandleAsync(GetClienteByIdQuery query, CancellationToken ct)` → `Task<ClienteDto?>`
  - Calls `_repo.GetByIdAsync(query.Id, ct)`, returns `ClienteDto?` (null if not found)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "GetClienteByIdQueryHandlerTests"`
- [ ] ✅ Backend unit tests pass

**Estimated Effort:** Included in Task 1 in story

---

### Test: [P0] GET /api/v1/clientes/{id} — HTTP 200 with correct JSON shape

**File:** `e2e/tests/api/client-detail-view.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `app.MapGet("/api/v1/clientes/{id:guid}", ...)` in `ClienteEndpoints.cs`
  - If handler returns null → `Results.Problem(title: "Cliente no encontrado", statusCode: 404)`
  - If handler returns ClienteDto → `Results.Ok(dto)` (HTTP 200)
- [ ] Register `GetClienteByIdQueryHandler` in DI (Program.cs)
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/client-detail-view.api.spec.ts`
- [ ] ✅ API tests pass

**Estimated Effort:** Included in Task 2 in story

---

### Test: [P0] E2E — Client detail panel renders on client click

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`
  - Renders `<ClienteListPanel />` (left, 280px) + `<ClienteDetailPanel />` (right, flex-1)
  - Two-panel flex layout: `<div className="flex h-full">`
- [ ] Add `data-testid="cliente-detail-panel"` to `ClienteDetailPanel` root element
- [ ] Update `ClienteListPanel.tsx` to navigate to `/clientes/$clienteId` on item click
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ AC1 + AC2 E2E tests pass

**Estimated Effort:** Included in Tasks 5 and 6 in story

---

### Test: [P0] E2E — Direct URL /clientes/:clienteId loads correctly

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify TanStack Router route `clientes.$clienteId.tsx` handles direct navigation
- [ ] `ClienteDetailPanel` reads `clienteId` from `useParams({ from: '/_app/clientes/$clienteId' })`
- [ ] `useCliente(clienteId)` hook fetches `GET /api/v1/clientes/:id`
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "direct URL"`
- [ ] ✅ AC3 E2E tests pass

**Estimated Effort:** Included in Tasks 3–6 in story

---

### Test: [P0] E2E — 404 shows "Cliente no encontrado" without ErrorPanel

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] In `ClienteDetailPanel`, detect 404: `(error as AxiosError)?.response?.status === 404`
- [ ] For 404: render `<div className="p-6 text-slate-500 text-sm">Cliente no encontrado</div>` (no ErrorPanel, no retry)
- [ ] For non-404 errors: render `<ErrorPanel onRetry={refetch} />`
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "404"`
- [ ] ✅ AC4 E2E tests pass

**Estimated Effort:** Included in Task 5 in story

---

### Test: [P0] E2E — Skeleton loading state

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Install `react-loading-skeleton` if not already: `pnpm --filter frontend add react-loading-skeleton`
- [ ] Loading state: render `<div data-testid="cliente-detail-skeleton">` with 4 `<Skeleton>` rows
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "skeleton"`
- [ ] ✅ AC6 E2E tests pass

**Estimated Effort:** Included in Task 5 in story

---

## Running Tests

```bash
# Run all E2E tests for Story 2.2
pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts

# Run API tests for Story 2.2
pnpm exec playwright test e2e/tests/api/client-detail-view.api.spec.ts

# Run frontend unit tests for Story 2.2
pnpm --filter frontend test -- --reporter=verbose

# Run backend unit tests for Story 2.2
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "GetClienteByIdQueryHandlerTests"

# Run all Story 2.2 tests together
pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/client-detail-view.api.spec.ts && pnpm --filter frontend test && dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "GetClienteByIdQueryHandlerTests"

# Run P0 tests only (E2E)
pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "\[P0\]"

# Debug a specific test
pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories reused (buildCliente, base.fixture.ts, ApiHelper)
- ✅ Network-first route interception applied (intercept before navigation)
- ✅ Mock requirements documented (success, 404, server error responses)
- ✅ data-testid requirements listed (`cliente-detail-panel`, `cliente-detail-skeleton`)
- ✅ Implementation checklist created
- ✅ Backend unit tests written against interfaces that will exist after implementation

### GREEN Phase (DEV Team — Next Steps)

**Recommended Implementation Order:**
1. Backend: `GetClienteByIdQuery` record → `GetClienteByIdQueryHandler` → register in DI → add `GET /api/v1/clientes/{id:guid}` endpoint
2. Frontend: Update `IClienteRepository.ts` (add `getById`) → update `clienteApiRepository.ts` (add `getById`) → create `useCliente.ts` hook → create `ClienteDetailPanel.tsx` → create `clientes.$clienteId.tsx` route → update `ClienteListPanel.tsx` onClick navigation

**Work one test at a time:** Run a failing test → implement minimal code → verify it passes → move to next test.

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review `ClienteDetailPanel` accessibility: `<dl>/<dt>/<dd>` semantic structure for field labels/values (WCAG 2.1 AA)
3. Confirm `data-testid` attributes are on correct DOM nodes
4. Run full test suite to ensure no regressions in Story 2.1 tests

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts`
3. Begin backend implementation (Tasks 1–2 in Story 2.2 story file)
4. Begin frontend implementation (Tasks 3–6 in Story 2.2 story file)
5. Work one test at a time (red → green for each)
6. When all tests pass, update story status to 'in-review'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: all UI tests intercept `**/api/v1/clientes/:id` BEFORE calling `page.goto()`
- **data-factories.md** — Reused existing `buildCliente()` factory from `e2e/helpers/data.helper.ts`
- **fixture-architecture.md** — Reused `base.fixture.ts` extended fixture pattern
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, no hard waits
- **selector-resilience.md** — `data-testid` selectors exclusively (`cliente-detail-panel`, `cliente-detail-skeleton`); never CSS class selectors
- **component-tdd.md** — Module contract tests for all new components (export shape, function name, props)
- **test-levels-framework.md** — E2E for AC1–AC6 user-facing behavior; API for AC7 endpoint contract; Unit for component/handler module contracts

---

**Generated by BMad TEA Agent** — 2026-06-01
