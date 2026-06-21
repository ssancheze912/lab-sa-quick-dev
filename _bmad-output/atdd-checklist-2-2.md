# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-21
**Author:** SiesaTeam
**Primary Test Level:** Component + E2E

---

## Story Summary

A commercial team member wants to view the complete details of a client by selecting them from the client list. The right panel shows Nombre, NIT/RUC, Teléfono, and Ciudad without navigating away. The URL updates to `/clientes/:clienteId` (deep link support, FR30), and error states are handled gracefully in Spanish without exposing stack traces (NFR6).

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC#1** — Given the client list is displayed, When user clicks a client item, Then the right panel shows Nombre, NIT/RUC, Teléfono, Ciudad AND the URL updates to `/clientes/:clienteId` without full page reload. (AC-E2.3, FR3, FR30)

2. **AC#2** — Given the user is on the client detail view, When the user accesses `/clientes/:clienteId` directly (deep link with cold TanStack Query cache), Then the correct client details are fetched via `GET /api/v1/clientes/{id}` and displayed. (FR30, R-005)

3. **AC#3** — Given a `clienteId` in the URL does not exist in the backend, When the page loads, Then a not-found message is displayed gracefully in Spanish with no stack trace exposed. (NFR6, R-005)

4. **AC#4** — Given the backend is unavailable when loading a client detail, When the fetch fails, Then an `ErrorPanel` with a "Reintentar" button is displayed in the right panel.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `e2e/tests/clientes/2-2-client-detail-view.spec.ts`

- **Test:** `[TC-2.2-E-01] Navigate directly to /clientes/{uuid}, assert detail panel shows Nombre and NIT`
  - **Status:** RED — `ClienteDetailView` component does not exist; `data-testid="cliente-detail-panel"` absent
  - **Verifies:** AC#1, AC#2 — Deep link cold cache fetch (R-005)

- **Test:** `[TC-2.2-E-04] Navigate to /clientes/:clienteId, assert all four fields rendered`
  - **Status:** RED — `ClienteDetailView` not implemented; testids `cliente-detail-nombre`, `cliente-detail-nit`, `cliente-detail-telefono`, `cliente-detail-ciudad` absent
  - **Verifies:** AC#1 — All four required fields visible in detail panel

- **Test:** `[TC-2.2-E-03] Click client item, assert URL changes to /clientes/:clienteId without reload`
  - **Status:** RED — `ClientListItem` does not navigate to `/clientes/${id}` yet; `<Link>` not wired
  - **Verifies:** AC#1 — URL synchronization on list item click

- **Test:** `[TC-2.2-E-02] Navigate to /clientes/nonexistent-uuid, assert Spanish not-found message, no stack trace`
  - **Status:** RED — Not-found message not rendered; component does not exist
  - **Verifies:** AC#3 — Graceful 404 handling in Spanish (NFR6)

- **Test:** `[TC-2.2-E-05] Backend unavailable, assert ErrorPanel with "Reintentar" in right panel`
  - **Status:** RED — `ErrorPanel` not rendered by non-existent `ClienteDetailView`
  - **Verifies:** AC#4 — Network failure ErrorPanel state

### API Tests (5 tests)

**File:** `e2e/tests/api/2-2-clientes-by-id-endpoint.api.spec.ts`

- **Test:** `[TC-2.2-A-03] GET /api/v1/clientes/{id} → 200 status`
  - **Status:** RED — Endpoint not implemented; returns 404 or connection refused
  - **Verifies:** AC#2 — Backend endpoint exists and returns 200

- **Test:** `[TC-2.2-A-04] GET /api/v1/clientes/{id} → correct shape with all required fields`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC#2 — Response shape: id, nombre, nit, telefono, ciudad, createdAt, updatedAt

- **Test:** `[TC-2.2-A-02] GET /api/v1/clientes/{id} → createdAt includes timezone offset (R-007)`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC#2 — DateTimeOffset serialization (R-007)

- **Test:** `[TC-2.2-A-05] GET /api/v1/clientes/{nonexistent-id} → 404 status exactly`
  - **Status:** RED — Endpoint not implemented; may return 404 for wrong reason (route not found vs entity not found)
  - **Verifies:** AC#3 — Backend returns HTTP 404 for missing client

- **Test:** `[TC-2.2-A-01] GET /api/v1/clientes/{nonexistent-id} → Problem Details RFC 7807 without stackTrace (NFR6)`
  - **Status:** RED — 404 Problem Details response shape not implemented
  - **Verifies:** AC#3, NFR6 — No stack trace in 404 response body

### Component Tests (11 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

- **Test:** `[TC-2.2-C-01] Mock valid GET response, assert all fields (Nombre, NIT, Teléfono, Ciudad) rendered`
  - **Status:** RED — `ClienteDetailView` does not exist; import will fail
  - **Verifies:** AC#2 — All four fields rendered from API data

- **Test:** `[TC-2.2-C-02] clienteId provided as prop, assert component fetches data for that ID`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC#1 — URL (prop) is source of truth for selected client

- **Test:** `[TC-2.2-C-03] Mock 404 response, assert Spanish not-found message, no stack trace (NFR6)`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC#3, NFR6 — 404 distinct from network error; Spanish message

- **Test:** `[TC-2.2-C-04] Mock 500 error, assert ErrorPanel with "Reintentar" rendered`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC#4 — Network/server error shows ErrorPanel

- **Test:** `[TC-2.2-C-04b] ErrorPanel shown, click "Reintentar", assert fetch retried and data shown`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC#4 — Retry mechanism works via `refetch`

- **Test:** `[TC-2.2-C-04c] Fetch fails, assert no technical error details visible (NFR6)`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** NFR6 — No stack trace or internal error message exposed

- **Test:** `[TC-2.2-C-05] No clienteId, assert neutral Spanish placeholder message rendered`
  - **Status:** RED — `ClienteDetailView` does not exist; testid `cliente-detail-placeholder` absent
  - **Verifies:** AC#1 — Unselected state shows placeholder

- **Test:** `[TC-2.2-C-06] Data loading, assert skeleton rows shown (not spinner)`
  - **Status:** RED — `ClienteDetailView` does not exist; testid `skeleton-row` absent
  - **Verifies:** AC#2 — Skeleton loading state (company standard)

- **Test:** `[TC-2.2-C-07] 404 response, assert not-found message is in Spanish`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC#3 — Locale compliance (Spanish UI requirement)

- **Test:** `[TC-2.2-C-08] Data loaded, assert semantic HTML (dl/dt/dd or ARIA labels) for WCAG 2.1 AA`
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** WCAG 2.1 AA — Semantic HTML for screen readers

---

## Data Factories

Existing factories in `e2e/helpers/data.helper.ts` — `buildCliente()` already covers all fields (nombre, nit, telefono, ciudad).

Component tests use an inline `buildClienteDto()` factory (same pattern as `ClienteListView.test.tsx`).

**No new factory files are required.** The API helper `e2e/helpers/api.helper.ts` already has `createCliente()` and `deleteCliente()` for test data setup/teardown.

---

## Fixtures Created

No new Playwright fixtures were created. E2E tests use the inline `ApiHelper` + `buildCliente()` pattern established in Story 2.1, with `try/finally` blocks for auto-cleanup of created backend data.

---

## Mock Requirements

### Backend: GET /api/v1/clientes/{id}

**Endpoint:** `GET /api/v1/clientes/{id}`

**Success Response (200):**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "nombre": "Empresa Test",
  "nit": "900000001-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-03-12T10:30:00Z"
}
```

**Not Found Response (404 — Problem Details RFC 7807):**
```json
{
  "title": "Cliente no encontrado.",
  "status": 404
}
```

**Notes:**
- Response MUST NOT include `stackTrace`, `stack_trace`, `exception`, or `traceId` fields (NFR6)
- `createdAt` and `updatedAt` MUST include timezone offset (`Z` or `+hh:mm`) — RFC 7807 (R-007)
- Handler injection pattern (no MediatR) — register as `Scoped` in `Program.cs`

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-panel` — Wrapper container for the entire detail view (shown when clienteId is provided and data loaded)
- `cliente-detail-nombre` — Element displaying the client's Nombre (heading or field value)
- `cliente-detail-nit` — Element displaying the client's NIT/RUC value
- `cliente-detail-telefono` — Element displaying the client's Teléfono value
- `cliente-detail-ciudad` — Element displaying the client's Ciudad value
- `cliente-detail-placeholder` — Neutral placeholder when no clienteId is provided (unselected state)
- `skeleton-row` — Individual skeleton row during loading (reuse testid from Story 2.1 pattern)
- `error-panel` — ErrorPanel component (already exists in `src/shared/components/ErrorPanel.tsx`)

### ClientListItem Component (modification required)

The existing `ClientListItem` component must be updated to use `<Link>` navigation. The existing `data-testid="cliente-list-item"` testid must be preserved.

**Implementation Example:**
```tsx
// ClienteDetailView.tsx
<div data-testid="cliente-detail-panel">
  <dl>
    <dt>Nombre</dt>
    <dd data-testid="cliente-detail-nombre">{cliente.nombre}</dd>
    <dt>NIT/RUC</dt>
    <dd data-testid="cliente-detail-nit">{cliente.nit}</dd>
    <dt>Teléfono</dt>
    <dd data-testid="cliente-detail-telefono">{cliente.telefono}</dd>
    <dt>Ciudad</dt>
    <dd data-testid="cliente-detail-ciudad">{cliente.ciudad}</dd>
  </dl>
</div>

// Placeholder state
<div data-testid="cliente-detail-placeholder">
  <p>Selecciona un cliente de la lista para ver su detalle.</p>
</div>

// Loading state (react-loading-skeleton)
<Skeleton data-testid="skeleton-row" count={4} />
```

---

## Implementation Checklist

### Test: TC-2.2-A-01 through TC-2.2-A-05 — Backend API endpoint

**File:** `e2e/tests/api/2-2-clientes-by-id-endpoint.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `GetByIdAsync(Guid id): Task<ClienteEntity?>` to `IClienteRepository` in `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `GetClienteByIdQuery.cs` and `GetClienteByIdQueryHandler.cs` in `backend/src/SiesaAgents.Application/Clientes/Queries/`
- [ ] Implement `GetByIdAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` using EF Core — return `null` if not found
- [ ] Register `GET /api/v1/clientes/{id:guid}` in `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — returns 200 with `ClienteDto` when found, 404 Problem Details when not found
- [ ] Register `GetClienteByIdQueryHandler` as Scoped in `Program.cs`
- [ ] Verify 404 response does NOT include `stackTrace` or `exception` fields (use `Results.NotFound(new { title = "...", status = 404 })`)
- [ ] Run test: `npx playwright test e2e/tests/api/2-2-clientes-by-id-endpoint.api.spec.ts`
- [ ] ✅ All API tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-2.2-C-01, TC-2.2-C-06, TC-2.2-C-08 — ClienteDetailView loaded and loading states

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository` interface in `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Implement `getById` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios GET to `/api/v1/clientes/${id}`
- [ ] Create `useCliente(id)` hook in `frontend/src/modules/crm/clientes/application/useCliente.ts` — TanStack Query with `queryKey: ['clientes', id]` and `enabled: !!id`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
  - Loaded state: renders `data-testid="cliente-detail-panel"` with all four fields (each with their testid)
  - Loading state: `react-loading-skeleton` with `data-testid="skeleton-row"` per row (NOT a spinner)
  - Semantic HTML: `<dl>`, `<dt>`, `<dd>` for fields (WCAG 2.1 AA)
- [ ] Add required `data-testid` attributes: `cliente-detail-panel`, `cliente-detail-nombre`, `cliente-detail-nit`, `cliente-detail-telefono`, `cliente-detail-ciudad`, `skeleton-row`
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`
- [ ] ✅ Tests TC-2.2-C-01, TC-2.2-C-06, TC-2.2-C-08 pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-2.2-C-05 — Placeholder for unselected state

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] In `ClienteDetailView.tsx`: When `clienteId` prop is `undefined`, render `<div data-testid="cliente-detail-placeholder">` with Spanish message "Selecciona un cliente de la lista para ver su detalle."
- [ ] Run test: `pnpm --filter frontend test -- -t "TC-2.2-C-05"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: TC-2.2-C-03, TC-2.2-C-07 — 404 not-found message

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**

- [ ] In `ClienteDetailView.tsx`: detect 404 via `isError && (error as AxiosError)?.response?.status === 404`
- [ ] Render `<p>Cliente no encontrado.</p>` (or equivalent) for the not-found state — no `ErrorPanel`, no stack trace
- [ ] Run test: `pnpm --filter frontend test -- -t "TC-2.2-C-03"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-2.2-C-04, TC-2.2-C-04b, TC-2.2-C-04c — Network error ErrorPanel state

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**

- [ ] In `ClienteDetailView.tsx`: For non-404 errors (`isError` and status !== 404), render `<ErrorPanel onRetry={refetch} />` (reuse `src/shared/components/ErrorPanel.tsx`)
- [ ] Ensure `ErrorPanel` renders with `data-testid="error-panel"` (verify existing component)
- [ ] Ensure `ErrorPanel` shows "Reintentar" button that calls `onRetry`
- [ ] Never expose `error.message` or Axios error internals in the UI
- [ ] Run test: `pnpm --filter frontend test -- -t "TC-2.2-C-04"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-2.2-C-02 — URL as source of truth (prop wiring)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Create TanStack Router dynamic route `frontend/src/routes/_app/clientes.$clienteId.tsx` — reads `clienteId` from `Route.useParams()` and passes to `<ClienteDetailView clienteId={clienteId} />`
- [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `<Outlet />` in the right panel
- [ ] Run test: `pnpm --filter frontend test -- -t "TC-2.2-C-02"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-2.2-E-03 — Click client item updates URL (E2E)

**File:** `e2e/tests/clientes/2-2-client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Update `ClientListItem` in `frontend/src/shared/components/ClientListItem.tsx` to use TanStack Router `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>` instead of a plain `<a>` or `onClick` callback
- [ ] Run test: `npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts -g "TC-2.2-E-03"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-2.2-E-01, TC-2.2-E-04 — Deep link E2E (AC#2, R-005)

**File:** `e2e/tests/clientes/2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] All frontend tasks above must be complete (route, hook, component, testids)
- [ ] All backend tasks above must be complete (`GET /api/v1/clientes/{id}` endpoint)
- [ ] Run test: `npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts -g "TC-2.2-E-01"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0 additional hours (covered by above tasks)

---

### Test: TC-2.2-E-02 — Non-existent UUID shows not-found (E2E)

**File:** `e2e/tests/clientes/2-2-client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Backend 404 Problem Details endpoint must be complete
- [ ] Frontend 404 handling in `ClienteDetailView.tsx` must be complete
- [ ] Run test: `npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts -g "TC-2.2-E-02"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 additional hours (covered by above tasks)

---

### Test: TC-2.2-E-05 — Backend unavailable shows ErrorPanel (E2E)

**File:** `e2e/tests/clientes/2-2-client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Frontend `ErrorPanel` rendering on non-404 errors must be complete
- [ ] Run test: `npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts -g "TC-2.2-E-05"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 additional hours (covered by above tasks)

---

## Running Tests

```bash
# Run all Story 2.2 E2E tests
npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts

# Run all Story 2.2 API tests
npx playwright test e2e/tests/api/2-2-clientes-by-id-endpoint.api.spec.ts

# Run all Story 2.2 component tests
pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx

# Run ALL Story 2.2 tests
npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts e2e/tests/api/2-2-clientes-by-id-endpoint.api.spec.ts && pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts --headed

# Debug a specific E2E test
npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts --debug

# Run with Playwright UI mode
npx playwright test --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (import error for `ClienteDetailView`, missing testids, missing endpoint)
- Fixtures and factories: reuse existing `buildCliente()` + `ApiHelper` pattern; inline factory in component tests
- Mock requirements documented (GET /api/v1/clientes/{id} success + 404)
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- E2E tests fail: `ClienteDetailView` not yet in DOM — `data-testid="cliente-detail-panel"` not found
- API tests fail: `GET /api/v1/clientes/{id}` endpoint not implemented — returns connection refused or 404 with wrong body
- Component tests fail: `import { ClienteDetailView } from '../ClienteDetailView'` — module not found

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick the backend tasks first (API tests are fastest to verify)
2. Start with `TC-2.2-A-03` — create the endpoint returning 200
3. Implement `TC-2.2-A-04` — shape the response correctly
4. Move to frontend: implement `useCliente` hook, then `ClienteDetailView`
5. Wire the route last (TC-2.2-C-02, TC-2.2-E-03)

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Extract any duplicated state logic from `ClienteDetailView.tsx`
3. Ensure semantic HTML and ARIA labels are clean (WCAG 2.1 AA)
4. Verify `queryKey: ['clientes', id]` is consistent across `useCliente` and future invalidation calls (Stories 2.3–2.5)
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev-story workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts`
3. Begin backend implementation first (API tests fastest feedback loop)
4. Then implement frontend layer by layer: domain → application → infrastructure → presentation → route
5. Use implementation checklist as roadmap (one test at a time)
6. When all tests pass, refactor with confidence (tests provide safety net)

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **component-tdd.md** — Component test strategies (MSW for API mocking, QueryClientProvider isolation)
- **data-factories.md** — Factory patterns (inline `buildClienteDto()` with sequential ID generation)
- **test-quality.md** — Given-When-Then format, one assertion per test (atomic), no hard waits
- **selector-resilience.md** — `data-testid` selectors over CSS selectors; ARIA roles for interactive elements
- **fixture-architecture.md** — `try/finally` auto-cleanup for created backend data in E2E tests

---

## Notes

- `ClienteDetailView` component does not exist yet — all component test imports will produce `Cannot find module '../ClienteDetailView'` errors until implementation starts. This is the expected RED state.
- The `tea_use_playwright_utils: false` config means standard Playwright fixtures are used without utility helpers.
- Backend tests require a running .NET backend. In this environment, tests are authored but cannot be executed without the dotnet SDK (same pattern as Story 2.1).
- The 404 not-found state renders a plain message (NOT `ErrorPanel`). The `ErrorPanel` is only for non-404 errors (network/server failures). This distinction is critical for TC-2.2-C-03 vs TC-2.2-C-04.
- `data-testid="skeleton-row"` — verify that `react-loading-skeleton` supports forwarding this attribute or wrap each `Skeleton` in a `<div data-testid="skeleton-row">`.

---

**Generated by BMad TEA Agent** - 2026-06-21
