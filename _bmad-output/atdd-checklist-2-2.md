# ATDD Checklist — Epic 2, Story 2.2: Client Detail View

**Date:** 2026-05-23
**Author:** TEA Agent (claude-sonnet-4-6)
**Primary Test Levels:** Component (Vitest + RTL + MSW) + Unit (Vitest hook) + Backend Unit (xUnit) + E2E (Playwright)

---

## Story Summary

Story 2.2 implements the detail panel of the split-panel client management screen,
extending the foundation from Story 2.1 with single-client deep linking.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, When the user clicks on a client item, Then the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, And the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **AC2** — Given the user is on the client detail view, When the user accesses the URL `/clientes/:clienteId` directly, Then the correct client details are loaded and displayed from the backend (`GET /api/v1/clientes/:id`) without requiring the list to be pre-loaded in cache (FR30).

3. **AC3** — Given a `clienteId` in the URL does not exist (backend returns 404), When the page loads, Then a graceful not-found message is displayed in the right panel without crashing the shell layout or triggering a JS error boundary.

4. **AC4** — Given the backend is unavailable when loading client detail, When the `GET /api/v1/clientes/:id` request fails, Then an `ErrorPanel` with a "Reintentar" button is displayed in the right panel (reuses shared `ErrorPanel` component).

5. **AC5** — Given the detail panel is rendered, When the data is loading, Then skeleton placeholders (`react-loading-skeleton`) are shown — NOT a spinner.

---

## Failing Tests Created (RED Phase)

### Unit Tests — Vitest (useCliente hook) — 9 tests

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**Status:** File already exists from prior ATDD run. All 9 tests are RED (fail) because `useCliente` hook and `clienteApiRepository.getById` do not exist yet.

#### Data fetching (5 tests)

- **Test:** `should return client data when GET /api/v1/clientes/:id responds with 200`
  - **Status:** RED — `useCliente` hook does not exist yet
  - **Verifies:** AC2 — hook returns correct data

- **Test:** `should set isLoading=true initially then isLoading=false after fetch completes`
  - **Status:** RED — `useCliente` does not exist yet
  - **Verifies:** AC5 — loading state lifecycle

- **Test:** `should return client with all required fields: id, nombre, nit, telefono, ciudad`
  - **Status:** RED — `useCliente` does not exist yet
  - **Verifies:** AC2 — DTO shape correctness

- **Test:** `should use queryKey ["clientes", id] for TanStack Query cache`
  - **Status:** RED — canonical query key `['clientes', id]` not yet defined
  - **Verifies:** AC2 — TanStack Query cache key architecture rule

- **Test:** `should not fetch when id is empty string (disabled query)`
  - **Status:** RED — `useCliente` does not exist yet
  - **Verifies:** AC2 — query guard: `enabled: !!id`

#### Error handling (4 tests)

- **Test:** `should set isError=true when GET /api/v1/clientes/:id returns a network error`
  - **Status:** RED — `useCliente` does not exist yet
  - **Verifies:** AC4 — network failure sets error flag

- **Test:** `should set isError=true when GET /api/v1/clientes/:id returns HTTP 404`
  - **Status:** RED — `useCliente` does not exist yet
  - **Verifies:** AC3 — 404 triggers error state (Axios throws on 404 by default)

- **Test:** `should set isError=true when GET /api/v1/clientes/:id returns HTTP 500`
  - **Status:** RED — `useCliente` does not exist yet
  - **Verifies:** AC4 — HTTP 500 triggers error state

- **Test:** `should expose a refetch function for retry capability (AC4)`
  - **Status:** RED — `useCliente` does not exist yet
  - **Verifies:** AC4 — refetch function required by ErrorPanel's Reintentar button

---

### Component Tests — Vitest + RTL + MSW (ClienteDetailPanel) — 20 tests

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`

#### TC-E2-P1-06 — AC1: Detail panel shows all four fields (7 tests)

- **Test:** `should render the detail panel container with data-testid="cliente-detail-panel"`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC1 — panel container with testid

- **Test:** `should display the client Nombre in the detail panel`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC1 — Nombre field visible

- **Test:** `should display the client NIT/RUC in the detail panel`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC1 — NIT/RUC field visible

- **Test:** `should display the client Teléfono in the detail panel`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC1 — Teléfono field visible

- **Test:** `should display the client Ciudad in the detail panel`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC1 — Ciudad field visible

- **Test:** `should display all four fields simultaneously (AC1 full coverage)`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC1 — TC-E2-P1-06 core assertion: all four fields at once

- **Test:** `should render detail region with role="region" and aria-label="Detalle del cliente" (WCAG 2.1 AA)`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC1 / WCAG 2.1 AA — accessible landmark region

- **Test:** `should display Spanish field labels: Nombre, NIT/RUC, Teléfono, Ciudad`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC1 — all labels in Spanish

#### AC2 — Deep linking (2 tests)

- **Test:** `should fetch client data using GET /api/v1/clientes/:id when rendered with clienteId prop`
  - **Status:** RED — `ClienteDetailPanel` and `useCliente` do not exist yet
  - **Verifies:** AC2 — independent fetch without list cache (FR30)

- **Test:** `should use queryKey ["clientes", clienteId] independent of ["clientes"] list cache`
  - **Status:** RED — `useCliente` with canonical key does not exist yet
  - **Verifies:** AC2 — TanStack Query key isolation

#### TC-E2-P1-08 — AC3: Not-found graceful message (5 tests)

- **Test:** `should display a not-found message when GET /api/v1/clientes/:id returns 404`
  - **Status:** RED — `ClienteDetailPanel` not-found path does not exist yet
  - **Verifies:** AC3 — graceful not-found message in Spanish (TC-E2-P1-08)

- **Test:** `should render the not-found message with role="status" (WCAG 2.1 AA)`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC3 / WCAG 2.1 AA — role="status" for non-disruptive message

- **Test:** `should NOT render an error boundary or crash the shell layout on 404`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC3 — shell layout persists (TC-E2-P1-08)

- **Test:** `should NOT render the four client fields when 404 not-found`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC3 — client data absent in not-found state

- **Test:** `should NOT render ErrorPanel (Reintentar button) on 404 — distinct from network error`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC3 — 404 uses not-found message, not ErrorPanel

#### AC4 — ErrorPanel on network failure (6 tests)

- **Test:** `should render ErrorPanel when GET /api/v1/clientes/:id returns a network error`
  - **Status:** RED — `ClienteDetailPanel` error path does not exist yet
  - **Verifies:** AC4 — ErrorPanel rendered on network failure

- **Test:** `should render a "Reintentar" button inside ErrorPanel on network failure`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC4 — button labeled exactly "Reintentar"

- **Test:** `should re-fetch client data when Reintentar is clicked after network error`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC4 — retry triggers re-fetch via refetch()

- **Test:** `should render ErrorPanel with role="alert" on network failure (WCAG 2.1 AA)`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC4 / WCAG 2.1 AA — role="alert" on ErrorPanel

- **Test:** `should render ErrorPanel with data-testid="error-panel" on network failure`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC4 — ErrorPanel testid present

- **Test:** `should NOT render the four client fields when in error state`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC4 — client data absent in error state

#### AC5 — Skeleton placeholders during loading (4 tests)

- **Test:** `should render the detail panel container even during loading state`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC5 — panel container present during loading

- **Test:** `should NOT render client data fields while loading is in progress`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC5 — data fields hidden during loading

- **Test:** `should NOT render ErrorPanel or not-found message during loading state`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC5 — only skeleton visible during load

- **Test:** `should NOT render a spinner element during loading (skeleton only, per AC5)`
  - **Status:** RED — `ClienteDetailPanel` does not exist yet
  - **Verifies:** AC5 — no spinner (react-loading-skeleton only)

---

### Backend Unit Tests — xUnit (GetClienteByIdQueryHandler) — 7 tests

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

- **Test:** `HandleAsync_WhenClienteExists_ReturnsClienteDto`
  - **Status:** RED — `GetClienteByIdQueryHandler` and `GetClienteByIdQuery` do not exist yet
  - **Verifies:** AC2 — handler returns DTO for existing id

- **Test:** `HandleAsync_WhenClienteExists_MapsAllFieldsToDtoCorrectly`
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist yet
  - **Verifies:** AC2 — all four fields mapped correctly to DTO

- **Test:** `HandleAsync_WhenClienteExists_DtoHasNonEmptyGuidId`
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist yet
  - **Verifies:** AC2 — DTO Id is valid non-empty Guid

- **Test:** `HandleAsync_WhenClienteExists_DtoHasDateTimeOffsetTimestamps`
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist yet
  - **Verifies:** AC2 — timestamps are DateTimeOffset (architectural rule)

- **Test:** `HandleAsync_WhenClienteDoesNotExist_ReturnsNull`
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist yet
  - **Verifies:** AC3 — handler returns null for non-existent id; endpoint maps to HTTP 404

- **Test:** `HandleAsync_WhenClienteDoesNotExistAmongMultiple_ReturnsNull`
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist yet
  - **Verifies:** AC3 — null returned when id not found in populated repository

- **Test:** `HandleAsync_PassesCancellationToken_ToRepository`
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist yet
  - **Verifies:** AC2 — CancellationToken correctly forwarded to repository

---

### E2E Tests — Playwright (Story 2.2, AC1 + AC2) — 5 tests

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

- **Test:** `AC1 — should render detail panel with all four fields when a list item is clicked`
  - **Status:** RED — `ClienteDetailPanel` and click-navigation do not exist yet
  - **Verifies:** AC1 — TC-E2-P1-06 (E2E supplement) full-stack detail on click

- **Test:** `AC1 — URL should update to /clientes/:clienteId after clicking a client (FR30 deep linking)`
  - **Status:** RED — `clientes.$clienteId.tsx` route does not exist yet
  - **Verifies:** AC1 — URL deep-link update (FR30)

- **Test:** `TC-E2-P1-07 — AC2: Direct URL /clientes/:clienteId renders correct client without list pre-loaded`
  - **Status:** RED — `clientes.$clienteId.tsx` route and `ClienteDetailPanel` do not exist yet
  - **Verifies:** AC2 — TC-E2-P1-07: deep link renders detail independently of list cache

- **Test:** `TC-E2-P1-07 — AC2: No blank page or JS error on direct URL access (FR30)`
  - **Status:** RED — `clientes.$clienteId.tsx` route does not exist yet
  - **Verifies:** AC2 / FR30 — no blank page, no JS error on direct URL

- **Test:** `TC-E2-P1-07 — AC2: Shell layout (navigation) remains visible on direct URL access`
  - **Status:** RED — `clientes.$clienteId.tsx` route does not exist yet
  - **Verifies:** AC3 — shell layout (split panel + list) persists on direct URL access

---

## Summary of RED Tests (Failing — Require Implementation)

| # | Test | File | AC | TC |
|---|------|------|----|----|
| 1 | `should return client data when GET /api/v1/clientes/:id responds with 200` | useCliente.test.ts | AC2 | TC-E2-P1-06 |
| 2 | `should set isLoading=true initially...` | useCliente.test.ts | AC5 | - |
| 3 | `should return client with all required fields` | useCliente.test.ts | AC2 | TC-E2-P1-06 |
| 4 | `should use queryKey ["clientes", id]` | useCliente.test.ts | AC2 | TC-E2-P1-07 |
| 5 | `should not fetch when id is empty string` | useCliente.test.ts | AC2 | - |
| 6 | `should set isError=true ... network error` | useCliente.test.ts | AC4 | TC-E2-P1-08 |
| 7 | `should set isError=true ... HTTP 404` | useCliente.test.ts | AC3 | TC-E2-P1-08 |
| 8 | `should set isError=true ... HTTP 500` | useCliente.test.ts | AC4 | - |
| 9 | `should expose a refetch function` | useCliente.test.ts | AC4 | - |
| 10 | `should render the detail panel container with data-testid="cliente-detail-panel"` | ClienteDetailPanel.test.tsx | AC1 | TC-E2-P1-06 |
| 11 | `should display the client Nombre` | ClienteDetailPanel.test.tsx | AC1 | TC-E2-P1-06 |
| 12 | `should display the client NIT/RUC` | ClienteDetailPanel.test.tsx | AC1 | TC-E2-P1-06 |
| 13 | `should display the client Teléfono` | ClienteDetailPanel.test.tsx | AC1 | TC-E2-P1-06 |
| 14 | `should display the client Ciudad` | ClienteDetailPanel.test.tsx | AC1 | TC-E2-P1-06 |
| 15 | `should display all four fields simultaneously` | ClienteDetailPanel.test.tsx | AC1 | TC-E2-P1-06 |
| 16 | `should render region with role="region" aria-label="Detalle del cliente"` | ClienteDetailPanel.test.tsx | AC1 | - |
| 17 | `should display Spanish field labels` | ClienteDetailPanel.test.tsx | AC1 | TC-E2-P1-06 |
| 18 | `should fetch client data using GET /api/v1/clientes/:id independently` | ClienteDetailPanel.test.tsx | AC2 | TC-E2-P1-07 |
| 19 | `should use queryKey ["clientes", clienteId] independent of list cache` | ClienteDetailPanel.test.tsx | AC2 | TC-E2-P1-07 |
| 20 | `should display a not-found message when GET returns 404` | ClienteDetailPanel.test.tsx | AC3 | TC-E2-P1-08 |
| 21 | `should render not-found message with role="status"` | ClienteDetailPanel.test.tsx | AC3 | TC-E2-P1-08 |
| 22 | `should NOT crash the shell layout on 404` | ClienteDetailPanel.test.tsx | AC3 | TC-E2-P1-08 |
| 23 | `should NOT render the four client fields when 404 not-found` | ClienteDetailPanel.test.tsx | AC3 | TC-E2-P1-08 |
| 24 | `should NOT render Reintentar button on 404` | ClienteDetailPanel.test.tsx | AC3 | - |
| 25 | `should render ErrorPanel on network failure` | ClienteDetailPanel.test.tsx | AC4 | - |
| 26 | `should render Reintentar button on network failure` | ClienteDetailPanel.test.tsx | AC4 | - |
| 27 | `should re-fetch when Reintentar is clicked` | ClienteDetailPanel.test.tsx | AC4 | - |
| 28 | `should render ErrorPanel with role="alert"` | ClienteDetailPanel.test.tsx | AC4 | - |
| 29 | `should render ErrorPanel with data-testid="error-panel"` | ClienteDetailPanel.test.tsx | AC4 | - |
| 30 | `should NOT render client fields in error state` | ClienteDetailPanel.test.tsx | AC4 | - |
| 31 | `should render panel container during loading` | ClienteDetailPanel.test.tsx | AC5 | - |
| 32 | `should NOT render client data fields during loading` | ClienteDetailPanel.test.tsx | AC5 | - |
| 33 | `should NOT render ErrorPanel or not-found during loading` | ClienteDetailPanel.test.tsx | AC5 | - |
| 34 | `should NOT render a spinner during loading` | ClienteDetailPanel.test.tsx | AC5 | - |
| 35 | `HandleAsync_WhenClienteExists_ReturnsClienteDto` | GetClienteByIdQueryHandlerTests.cs | AC2 | TC-E2-P3-02 |
| 36 | `HandleAsync_WhenClienteExists_MapsAllFieldsToDtoCorrectly` | GetClienteByIdQueryHandlerTests.cs | AC2 | - |
| 37 | `HandleAsync_WhenClienteExists_DtoHasNonEmptyGuidId` | GetClienteByIdQueryHandlerTests.cs | AC2 | - |
| 38 | `HandleAsync_WhenClienteExists_DtoHasDateTimeOffsetTimestamps` | GetClienteByIdQueryHandlerTests.cs | AC2 | - |
| 39 | `HandleAsync_WhenClienteDoesNotExist_ReturnsNull` | GetClienteByIdQueryHandlerTests.cs | AC3 | TC-E2-P3-02 |
| 40 | `HandleAsync_WhenClienteDoesNotExistAmongMultiple_ReturnsNull` | GetClienteByIdQueryHandlerTests.cs | AC3 | TC-E2-P3-02 |
| 41 | `HandleAsync_PassesCancellationToken_ToRepository` | GetClienteByIdQueryHandlerTests.cs | AC2 | - |
| 42 | `AC1 — detail panel with all four fields on click (E2E)` | client-detail-view.spec.ts | AC1 | TC-E2-P1-06 |
| 43 | `AC1 — URL updates to /clientes/:clienteId on click` | client-detail-view.spec.ts | AC1 | FR30 |
| 44 | `TC-E2-P1-07 — direct URL renders correct client` | client-detail-view.spec.ts | AC2 | TC-E2-P1-07 |
| 45 | `TC-E2-P1-07 — no blank page or JS error on direct URL` | client-detail-view.spec.ts | AC2 | TC-E2-P1-07 |
| 46 | `TC-E2-P1-07 — shell layout visible on direct URL access` | client-detail-view.spec.ts | AC3 | TC-E2-P1-07 |

**Total RED tests: 46**
*(9 in pre-existing useCliente.test.ts + 20 new in ClienteDetailPanel.test.tsx + 7 backend + 5 E2E)*

---

## data-testid Attributes Required

The following `data-testid` attributes must be present on DOM elements for tests to pass:

| Attribute | Element | Component | AC |
|-----------|---------|-----------|-----|
| `cliente-detail-panel` | Right panel container | `ClienteDetailPanel` | AC1 |
| `error-panel` | Error container (shared) | `ErrorPanel` (already implemented) | AC4 |

---

## Mock Requirements

### MSW Handlers Required (Component Tests)

```typescript
// Default success handler
http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => HttpResponse.json(mockCliente))

// 404 not-found handler
http.get(`*/api/v1/clientes/${NON_EXISTENT_ID}`, () => new HttpResponse(null, { status: 404 }))

// Network error handler (per-test override)
http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => HttpResponse.error())

// Slow/pending handler (loading state tests)
http.get(`*/api/v1/clientes/${CLIENTE_ID}`, async () => {
  await new Promise(() => { /* never resolves */ })
  return HttpResponse.json(mockCliente)
})
```

### Playwright Route Intercepts Required (E2E Tests)

```typescript
// Network-first: intercept BEFORE page.goto()
await page.route(`**/api/v1/clientes/${clienteId}`, route =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCliente) })
)
await page.route('**/api/v1/clientes', route =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockCliente]) })
)
```

---

## Required Implementation to Make RED Tests GREEN

### Frontend

**Task 1 — Extend domain + infrastructure:**
- [ ] `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `getById(id: string): Promise<Cliente>`
- [ ] `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `getById(id)` via `GET /api/v1/clientes/${id}`

**Task 2 — Create `useCliente(id)` hook:**
- [ ] `frontend/src/modules/crm/clientes/application/useCliente.ts`
- [ ] `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`
- [ ] Returns `{ data, isLoading, isError, refetch }` — never exposes raw `error.message`

**Task 3 — Create `ClienteDetailPanel` component:**
- [ ] `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
- [ ] Accepts `clienteId: string` prop
- [ ] Uses `useCliente(clienteId)` hook
- [ ] Loading: render 3–4 `react-loading-skeleton` rows (NOT a spinner)
- [ ] 404: render `<p role="status">Cliente no encontrado.</p>` (detect via `axios.isAxiosError(error) && error.response?.status === 404`)
- [ ] Network error: render `<ErrorPanel onRetry={refetch} />` ("Reintentar" button)
- [ ] Success: display Nombre, NIT/RUC, Teléfono, Ciudad with Spanish labels
- [ ] Root element: `data-testid="cliente-detail-panel"`, `role="region"`, `aria-label="Detalle del cliente"`

**Task 4 — Create `clientes.$clienteId.tsx` route:**
- [ ] `frontend/src/routes/_app/clientes.$clienteId.tsx`
- [ ] `Route = createFileRoute('/_app/clientes/$clienteId')({ component: ClienteDetailPage })`
- [ ] Read `clienteId` from `Route.useParams()`
- [ ] Render `<ClienteDetailPanel clienteId={clienteId} />`

**Task 5 — Wire click navigation in `ClienteListPanel`:**
- [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- [ ] On item click: `navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })`
- [ ] Apply `aria-current="page"` on matching URL param item (switch from `"true"` to `"page"`)

### Backend

**Task 6 — `GetClienteByIdQuery` and handler:**
- [ ] `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with `Guid Id`
- [ ] `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  - Calls `IClienteRepository.GetByIdAsync(id, ct)`
  - Returns `ClienteDto` if found; returns `null` if not found

**Task 7 — `GET /{id}` endpoint:**
- [ ] Extend `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- [ ] `group.MapGet("/{id:guid}", ...)` calls handler, returns `Results.Ok(dto)` or `Results.NotFound()`
- [ ] Register `GetClienteByIdQueryHandler` in DI in `Program.cs`

---

## Running Tests

```bash
# Frontend — hook unit tests
cd frontend && pnpm exec vitest run src/modules/crm/clientes/application/useCliente.test.ts

# Frontend — component tests for ClienteDetailPanel
cd frontend && pnpm exec vitest run src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx

# Frontend — all Story 2.2 tests
cd frontend && pnpm exec vitest run --reporter=verbose src/modules/crm/clientes/

# Backend — unit tests for GetClienteByIdQueryHandler
cd backend && dotnet test tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --filter "FullyQualifiedName~GetClienteByIdQueryHandler"

# E2E — Story 2.2
pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts

# All Story 2.2 tests
cd frontend && pnpm exec vitest run src/modules/crm/clientes/ && \
cd ../backend && dotnet test tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~GetClienteByIdQueryHandler"
```

---

## Acceptance Criteria Coverage Matrix

| AC | Test Cases | Test Files | Level |
|----|------------|------------|-------|
| AC1 — Right panel shows 4 fields + URL updates | TC-E2-P1-06 | ClienteDetailPanel.test.tsx, client-detail-view.spec.ts | Component + E2E |
| AC2 — Direct URL independent fetch (FR30) | TC-E2-P1-07 | useCliente.test.ts, ClienteDetailPanel.test.tsx, client-detail-view.spec.ts | Unit + Component + E2E |
| AC3 — 404 graceful not-found message | TC-E2-P1-08 | useCliente.test.ts, ClienteDetailPanel.test.tsx, GetClienteByIdQueryHandlerTests.cs | Unit + Component + Backend |
| AC4 — ErrorPanel + Reintentar on failure | - | useCliente.test.ts, ClienteDetailPanel.test.tsx | Unit + Component |
| AC5 — Skeleton placeholders (no spinner) | - | useCliente.test.ts, ClienteDetailPanel.test.tsx | Unit + Component |

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) — All 46 tests failing

**Verification of RED state:**
- Frontend unit/component tests fail with `Cannot find module './useCliente'` and `Cannot find module './ClienteDetailPanel'`
- Backend unit tests fail with `The type or namespace name 'GetClienteByIdQueryHandler' could not be found` and `The type or namespace name 'GetClienteByIdQuery' could not be found`
- E2E tests fail because `ClienteDetailPanel` is not rendered and `clientes.$clienteId.tsx` route does not exist
- All failures are due to missing implementation — NOT test bugs

### GREEN Phase (DEV Team)

**Recommended implementation order (fastest path to green):**

1. Add `getById` to `IClienteRepository.ts` + implement in `clienteApiRepository.ts` (unblocks hook tests)
2. Create `useCliente.ts` hook (makes 9 unit tests pass)
3. Create `ClienteDetailPanel.tsx` with all states: loading/skeleton, 404/not-found, error/panel, success (makes 20 component tests pass)
4. Create `clientes.$clienteId.tsx` route (makes E2E tests for URL and deep link pass)
5. Wire list item click to navigate in `ClienteListPanel.tsx` (makes E2E click test pass)
6. Create backend `GetClienteByIdQuery.cs` + `GetClienteByIdQueryHandler.cs` (makes 7 backend unit tests pass)
7. Add `GET /{id:guid}` endpoint in `ClienteEndpoints.cs` (makes API integration tests pass)

### REFACTOR Phase (After All Tests Pass)

1. Confirm `data-testid="cliente-detail-panel"` on root element
2. Confirm `role="region"` + `aria-label="Detalle del cliente"` on detail container
3. Confirm 404 uses `role="status"` (not role="alert")
4. Confirm ErrorPanel uses `role="alert"` with `data-testid="error-panel"`
5. Confirm skeleton uses `react-loading-skeleton` (not a spinner component)
6. Confirm all user-facing text is in Spanish
7. Confirm `useCliente` queryKey is exactly `['clientes', id]` (canonical per architecture)
8. Confirm deep link works without `['clientes']` list cache pre-loaded

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-23
