# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-18
**Author:** SiesaTeam
**Primary Test Level:** Component

---

## Story Summary

A commercial team member wants to view the complete details of a client by clicking on
them from the list, so that they can review all their information without navigating away
from the clients section. The story implements the read-detail side of the Client domain
with deep-link routing support.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC-1**: Given the client list is displayed, When the user clicks on a client item in the left panel, Then the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad AND the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **AC-2**: Given the user is on the client detail view, When the user accesses the URL `/clientes/:clienteId` directly, Then the correct client details are loaded from `GET /api/v1/clientes/:id` and displayed without a redirect (FR30).

3. **AC-3**: Given a `clienteId` in the URL does not exist on the backend, When the page loads and the API returns 404, Then a not-found message ("Cliente no encontrado.") is displayed gracefully in the right panel — no crash or blank screen.

---

## Failing Tests Created (RED Phase)

### E2E Tests (1 test)

**File:** `e2e/tests/clientes/cliente-detail-view.spec.ts`

- **Test:** `GIVEN the client list is displayed WHEN the user clicks a client item THEN the right panel shows complete client details AND URL updates to /clientes/:clienteId`
  - **Status:** RED — `clientesPage.detailPanel` locator (`data-testid="cliente-detail-panel"`) not found; `ClienteDetailView` component and `/clientes/$clienteId` route do not exist yet
  - **Verifies:** AC-1 — URL deep link (FR30) + right panel detail display; Risk R-207

### API Integration Tests (2 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdTests.cs`

- **Test:** `GetClienteById_HappyPath_Returns200WithCorrectClienteDto`
  - **Status:** RED — `GET /api/v1/clientes/{id}` endpoint does not exist; returns 404 from routing layer
  - **Verifies:** AC-2 — `GET /api/v1/clientes/:id` returns 200 with all ClienteDto fields (id, nombre, nit, telefono, ciudad, createdAt)

- **Test:** `GetClienteById_UnknownId_Returns404ProblemDetails_WithoutStackTrace`
  - **Status:** RED — endpoint not implemented; test cannot even reach the not-found path
  - **Verifies:** AC-3 — 404 Problem Details (RFC 7807) returned for unknown id; no stackTrace key in body (NFR6)

### Component Tests (4 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- **Test:** `GIVEN API call is in-flight WHEN ClienteDetailView is mounted THEN skeleton blocks are displayed`
  - **Status:** RED — `ClienteDetailView` module not found (compile error)
  - **Verifies:** Loading skeleton renders during API in-flight state (react-loading-skeleton pattern)

- **Test:** `GIVEN API returns valid ClienteDto WHEN ClienteDetailView is mounted THEN all four fields are displayed with Spanish labels`
  - **Status:** RED — `ClienteDetailView` module not found (compile error)
  - **Verifies:** AC-1, AC-2 — Nombre, NIT/RUC, Teléfono, Ciudad with Spanish labels; `data-testid="cliente-detail-panel"`

- **Test:** `GIVEN API returns 404 WHEN ClienteDetailView is mounted THEN "Cliente no encontrado." is displayed`
  - **Status:** RED — `ClienteDetailView` module not found (compile error)
  - **Verifies:** AC-3 — graceful 404 handling; no crash; panel still rendered

- **Test:** `GIVEN API returns 500 WHEN ClienteDetailView is mounted THEN ErrorPanel with "Reintentar" is displayed`
  - **Status:** RED — `ClienteDetailView` module not found (compile error)
  - **Verifies:** Non-404 error surfaces `<ErrorPanel>` with "Reintentar" button

### Hook Unit Tests (3 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

- **Test:** `GIVEN MSW returns valid ClienteDto WHEN useCliente is called THEN returns correct Cliente data`
  - **Status:** RED — `useCliente` module not found (compile error)
  - **Verifies:** TanStack Query hook fetches `GET /api/v1/clientes/:id` and returns mapped data

- **Test:** `GIVEN MSW returns 404 WHEN useCliente is called THEN isError is true`
  - **Status:** RED — `useCliente` module not found (compile error)
  - **Verifies:** 404 response surfaces as `isError: true` (with `retry: 0` on queryClient)

- **Test:** `GIVEN no id is provided WHEN useCliente is called with undefined THEN no network request is made`
  - **Status:** RED — `useCliente` module not found (compile error)
  - **Verifies:** `enabled: !!id` guard prevents spurious API calls when no clienteId selected

---

## Data Factories Created

Reused from Story 2.1 — no new factories needed.

### Cliente Factory (existing)

**File:** `frontend/src/test/factories/cliente.factory.ts`

**Exports:**
- `clienteFactory(overrides?)` - Creates a single ClienteDto with sequential unique fields
- `clienteListFactory(count)` - Creates an array of n ClienteDtos

**Example Usage:**
```typescript
const cliente = clienteFactory({ nombre: 'Acme Detail SA', ciudad: 'Bogotá' });
// Returns: { id: '00000000-0000-0000-0000-000000000001', nombre: 'Acme Detail SA', ... }
```

---

## Fixtures Created

No new Playwright fixtures required for Story 2.2.

The existing `base.fixture.ts` (`e2e/fixtures/base.fixture.ts`) provides `clientesPage` fixture
(navigate to /clientes before test). Story 2.2 E2E test uses inline `page.route()` interception
instead of fixtures, consistent with Story 2.1 pattern.

---

## Mock Requirements

### GET /api/v1/clientes/:id — Success Mock (MSW Node)

**Endpoint:** `GET /api/v1/clientes/:id`

**Success Response:**
```json
{
  "id": "00000000-0000-0000-0000-000000000099",
  "nombre": "Detail View Corp",
  "nit": "900200001",
  "telefono": "3101000001",
  "ciudad": "Medellín",
  "createdAt": "2026-06-18T10:00:00Z"
}
```

**404 Response:**
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "Cliente no encontrado."
}
```

**500 Response:**
```json
{
  "title": "Internal Server Error",
  "status": 500
}
```

**Notes:**
- Use `server.use(http.get('/api/v1/clientes/:id', ...))` in individual tests to override default behavior
- MSW intercepts by exact path match — use `cliente.id` from factory as path parameter
- queryClient must have `retry: false` to surface errors immediately

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-panel` - Root element of the detail panel (already referenced in `ClientesPage` POM)

**Implementation Example:**
```tsx
<div data-testid="cliente-detail-panel" className="flex-1 p-6">
  {/* detail content */}
</div>
```

### ClienteListView (modified)

- `cliente-list-item` - Each client row in the list (already exists from Story 2.1)
  - Must be wrapped in `<Link to="/clientes/$clienteId">` for navigation

### Existing (from Story 2.1 — no changes needed)

- `clientes-list-panel` - Left panel container
- `empty-state` - Empty state component
- `error-panel` - Error panel component

---

## Implementation Checklist

### Test: `GetClienteById_HappyPath_Returns200WithCorrectClienteDto`

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdTests.cs`

**Tasks to make this test pass:**

- [ ] Create `GetClienteByIdQuery.cs` in `backend/src/SiesaAgents.Application/Clientes/Queries/` — property: `Guid Id`
- [ ] Create `GetClienteByIdQueryHandler.cs` — calls `IClienteRepository.GetByIdAsync(id, ct)`, returns `ClienteDto` or throws not-found exception
- [ ] Add `GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository.cs`
- [ ] Implement `GetByIdAsync` in `ClienteRepository.cs` using `FirstOrDefaultAsync(c => c.Id == id)`
- [ ] Add `GET /api/v1/clientes/{id}` route in `ClienteEndpoints.cs` — returns 200 with `ClienteDto` on success
- [ ] Register `GetClienteByIdQueryHandler` in `Program.cs` DI
- [ ] Run test: `dotnet test --filter "GetClienteById_HappyPath_Returns200WithCorrectClienteDto"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: `GetClienteById_UnknownId_Returns404ProblemDetails_WithoutStackTrace`

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdTests.cs`

**Tasks to make this test pass:**

- [ ] `GetClienteByIdQueryHandler` throws a domain/not-found exception when repository returns `null`
- [ ] `ExceptionHandlingMiddleware` maps the not-found exception to 404 Problem Details (RFC 7807)
- [ ] 404 response body has no `stackTrace` or `exception` key (NFR6)
- [ ] Run test: `dotnet test --filter "GetClienteById_UnknownId_Returns404ProblemDetails_WithoutStackTrace"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (middleware already handles exceptions)

---

### Test: `useCliente` hook — U-01, U-02, U-03

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**Tasks to make this test pass:**

- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `getById` in `clienteApiRepository.ts` — `apiClient.get<Cliente>(\`/api/v1/clientes/${id}\`)`
- [ ] Create `useCliente.ts` with TanStack Query: `queryKey: ['clientes', id]`, `enabled: !!id`
- [ ] Export `data`, `isLoading`, `isError`, `error`, `refetch` from `useCliente`
- [ ] Run test: `pnpm --filter frontend test useCliente.test`
- [ ] ✅ All 3 hook unit tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: `ClienteDetailView` — C-01 Skeleton

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `ClienteDetailView.tsx` with root `<div data-testid="cliente-detail-panel">`
- [ ] Call `useCliente(clienteId)` inside the component
- [ ] Show `react-loading-skeleton` blocks while `isLoading === true`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ C-01 skeleton test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `ClienteDetailView` — C-02 All Four Fields

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Render detail card when `data` is present: Nombre, NIT/RUC, Teléfono, Ciudad
- [ ] All field labels in Spanish: "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
- [ ] Apply Siesa brand colors: primary `#0e79fd`, neutrals via `slate-*` Tailwind classes
- [ ] Check siesa-ui-kit catalog before creating any custom sub-component
- [ ] Add required `data-testid="cliente-detail-panel"` on root element
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ C-02 all fields test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `ClienteDetailView` — C-03 Not Found

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Check `error?.response?.status === 404` (or equivalent for axios/fetch)
- [ ] Show "Cliente no encontrado." message when 404 error
- [ ] Panel root (`data-testid="cliente-detail-panel"`) remains in DOM (no crash)
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ C-03 not-found test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `ClienteDetailView` — C-04 ErrorPanel

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Show `<ErrorPanel onRetry={refetch} />` for non-404 errors (HTTP 500, network errors)
- [ ] `ErrorPanel` must render with `data-testid="error-panel"` and "Reintentar" button
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ C-04 ErrorPanel test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: E2E — Click item → URL + detail panel

**File:** `e2e/tests/clientes/cliente-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — TanStack Router file-based dynamic route
- [ ] Route reads `clienteId` from `Route.useParams().clienteId`
- [ ] Route renders split-panel: left (`ClienteListView`) + right (`ClienteDetailView`)
- [ ] Clicking a client item in `ClienteListView` navigates to `/clientes/{clienteId}`
  - Wrap each list item in `<Link to="/clientes/$clienteId" params={{ clienteId: c.id }}>`
- [ ] Update `clientes.tsx` parent route to handle empty/placeholder right panel state
- [ ] Run test: `npx playwright test e2e/tests/clientes/cliente-detail-view.spec.ts`
- [ ] ✅ E2E test passes (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all Story 2.2 failing tests (Vitest — component + hook)
pnpm --filter frontend test useCliente.test
pnpm --filter frontend test ClienteDetailView.test

# Run backend API integration tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "GetClienteByIdTests"

# Run E2E test
npx playwright test e2e/tests/clientes/cliente-detail-view.spec.ts

# Run E2E in headed mode (see browser)
npx playwright test e2e/tests/clientes/cliente-detail-view.spec.ts --headed

# Debug E2E test
npx playwright test e2e/tests/clientes/cliente-detail-view.spec.ts --debug

# Run all clientes E2E tests
npx playwright test e2e/tests/clientes/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Factories reused (clienteFactory from Story 2.1)
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests fail at compile time (missing modules: `useCliente`, `ClienteDetailView`) or at runtime (missing endpoint `GET /api/v1/clientes/{id}`)
- Failure messages are clear: "Cannot find module './useCliente'" / "expected 404, received 404 from routing not from handler"
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with backend API-01)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend API-01 (GetClienteById happy path)
2. Backend API-02 (GetClienteById not found)
3. Hook unit tests U-01, U-02, U-03 (useCliente.ts)
4. Component C-01 skeleton
5. Component C-02 all fields
6. Component C-03 not found
7. Component C-04 ErrorPanel
8. Route wire-up + E2E E-01

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 10 tests pass (green phase complete)
2. Review code for quality (readability, maintainability)
3. Extract duplications (query key constants, error type guards)
4. Ensure tests still pass after each refactor
5. Update story status to done

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm --filter frontend test useCliente.test`
3. **Begin implementation** using implementation checklist as guide — start with backend
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'done'

---

## Knowledge Base References Applied

- **fixture-architecture.md** - MSW server lifecycle (beforeAll/afterEach/afterAll) with QueryClientProvider wrapper
- **data-factories.md** - `clienteFactory()` with sequential unique IDs, reused from Story 2.1
- **network-first.md** - `page.route()` BEFORE `page.goto()` in E2E; `server.use()` BEFORE `renderHook()` in unit tests
- **component-tdd.md** - `renderWithProviders()` helper pattern with fresh QueryClient per test, `retry: false`
- **test-quality.md** - One assertion per test (atomic), Given-When-Then format, no hard waits
- **selector-resilience.md** - `data-testid` selectors; ARIA roles for buttons/searchbox; no CSS class selectors

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures:**

```
FAIL  frontend/src/modules/crm/clientes/application/useCliente.test.ts
  × Cannot find module './useCliente' from 'useCliente.test.ts'

FAIL  frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx
  × Cannot find module './ClienteDetailView' from 'ClienteDetailView.test.tsx'

FAIL  backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdTests.cs
  × GetClienteById_HappyPath_Returns200WithCorrectClienteDto
    Expected: 200 OK
    Actual:   404 Not Found (route not registered)

  × GetClienteById_UnknownId_Returns404ProblemDetails_WithoutStackTrace
    Expected: 404 from handler
    Actual:   404 from routing layer (endpoint missing)

FAIL  e2e/tests/clientes/cliente-detail-view.spec.ts
  × clientesPage.detailPanel — element not found (no data-testid="cliente-detail-panel")
```

**Summary:**

- Total tests: 10
- Passing: 0 (expected)
- Failing: 10 (expected)
- Status: ✅ RED phase verified

---

## Notes

- `queryClient.ts` from Story 2.1 already has `retry: 0` — 404 errors surface immediately without backoff
- `ClientesTestFactory` from `GetClientesTests.cs` is reused for `GetClienteByIdTests.cs`; the factory is in the same namespace
- The E2E test intercepts both `GET /api/v1/clientes` (list) AND `GET /api/v1/clientes/{id}` (detail) before navigation; both routes must be mocked
- `data-testid="cliente-detail-panel"` is already referenced in `ClientesPage` POM (`e2e/pages/clientes.page.ts`); no POM update needed
- `MemoryRouter` wrapper added to component tests because `ClienteDetailView` may use TanStack Router `<Link>` internally; replace with `RouterProvider` if needed after implementation

---

**Generated by BMad TEA Agent** - 2026-06-18
