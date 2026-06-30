# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-30
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

Commercial team members need to view complete client details by clicking a client in the list. The right panel shows all four required fields (Nombre, NIT/RUC, Teléfono, Ciudad) and the URL updates to `/clientes/:clienteId` for deep linking. Direct URL access must also load the correct client, and non-existent IDs must render a graceful not-found message.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, When the user clicks on a client item, Then the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, And the URL updates to `/clientes/:clienteId` (FR30 deep linking).
2. **AC2** — Given the user is on the client detail view, When the user accesses the URL `/clientes/:clienteId` directly, Then the correct client details are loaded and displayed (FR30).
3. **AC3** — Given a clienteId in the URL does not exist, When the page loads, Then a not-found message is displayed gracefully.

---

## Failing Tests Created (RED Phase)

### E2E Tests (13 tests)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**AC1 — Clicking a client item opens detail panel and updates URL (6 tests):**

- **Test:** should show the client Nombre in the right panel after clicking a list item
  - **Status:** RED — `[data-testid="cliente-detail-content"]` not found (ClienteDetailView + $clienteId route not yet implemented)
  - **Verifies:** AC1 — Nombre field visible in detail panel after click

- **Test:** should show the client NIT/RUC in the right panel after clicking a list item
  - **Status:** RED — `[data-testid="cliente-detail-content"]` not found
  - **Verifies:** AC1 — NIT/RUC field visible in detail panel

- **Test:** should show the client Teléfono in the right panel after clicking a list item
  - **Status:** RED — `[data-testid="cliente-detail-content"]` not found
  - **Verifies:** AC1 — Teléfono field visible in detail panel

- **Test:** should show the client Ciudad in the right panel after clicking a list item
  - **Status:** RED — `[data-testid="cliente-detail-content"]` not found
  - **Verifies:** AC1 — Ciudad field visible in detail panel

- **Test:** should update the URL to /clientes/:clienteId after clicking a list item
  - **Status:** RED — TanStack Router `$clienteId` route does not exist; navigation fails
  - **Verifies:** AC1 — URL updates to `/clientes/:clienteId` (FR30 deep linking)

- **Test:** should show cliente-detail-content testid after clicking a list item
  - **Status:** RED — `data-testid="cliente-detail-content"` not present in DOM
  - **Verifies:** AC1 — `data-testid="cliente-detail-content"` present on success state

**AC2 — Direct URL /clientes/:clienteId loads correct client (4 tests):**

- **Test:** should load and display the correct Nombre when accessing /clientes/:clienteId directly
  - **Status:** RED — Route `/clientes/$clienteId` does not exist; TanStack Router 404s
  - **Verifies:** AC2 — Direct URL loads Nombre

- **Test:** should load and display the correct NIT when accessing /clientes/:clienteId directly
  - **Status:** RED — Route does not exist
  - **Verifies:** AC2 — Direct URL loads NIT

- **Test:** should display cliente-detail-content when navigating directly to /clientes/:clienteId
  - **Status:** RED — Route does not exist
  - **Verifies:** AC2 — detail content container visible on direct navigation

- **Test:** should keep the left panel visible when navigating directly to /clientes/:clienteId
  - **Status:** RED — Route does not exist; layout not rendered
  - **Verifies:** AC2 — two-panel layout preserved (left panel still visible)

**AC3 — Non-existent clienteId shows graceful not-found message (3 tests):**

- **Test:** should show the not-found message when clienteId does not exist
  - **Status:** RED — `[data-testid="cliente-not-found"]` not found (not-found state not implemented)
  - **Verifies:** AC3 — not-found state rendered on 404

- **Test:** should display "No se encontró el cliente solicitado." text when clienteId is not found
  - **Status:** RED — `[data-testid="cliente-not-found"]` not found
  - **Verifies:** AC3 — exact message text shown

- **Test:** should NOT show cliente-detail-content when clienteId does not exist
  - **Status:** RED — Route does not exist
  - **Verifies:** AC3 — detail content absent when not found

- **Test:** should NOT show an unhandled error or blank page when clienteId does not exist
  - **Status:** RED — Route does not exist; renders blank or router error
  - **Verifies:** AC3 (R-008 risk) — no blank page or unhandled error on invalid ID

### API Tests (11 tests)

**File:** `e2e/tests/api/clientes-get-by-id.api.spec.ts`

**AC2 — GET /api/v1/clientes/{id} found (7 tests):**

- **Test:** should respond with HTTP 200 when the client exists
  - **Status:** RED — `GET /api/v1/clientes/{id}` endpoint not registered
  - **Verifies:** AC2 — 200 response for existing client

- **Test:** should return content-type application/json when client exists
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC2 — JSON content-type header

- **Test:** should return a ClienteDto with the correct id
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC2 — id field matches the requested client

- **Test:** should return a ClienteDto with the correct nombre
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC2 — nombre field matches

- **Test:** should return a ClienteDto with the correct nit
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC2 — nit field matches

- **Test:** should return a ClienteDto with all required fields
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC2 — full ClienteDto shape (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)

- **Test:** should return a direct ClienteDto object (not wrapped)
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC2 — no wrapper object (architecture contract: direct dto)

**AC3 — GET /api/v1/clientes/{id} not found (4 tests):**

- **Test:** should respond with HTTP 404 when the clienteId does not exist
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC3 — 404 for non-existent GUID

- **Test:** should return Problem Details RFC 7807 format on 404
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC3 — Problem Details format (ExceptionHandlingMiddleware or Results.NotFound())

- **Test:** should not expose internal stack trace in 404 response body
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC3 + NFR6 — no stack trace leakage

- **Test:** should respond with 400 or 404 for a non-GUID clienteId (route constraint)
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC3 — `{id:guid}` route constraint rejects non-GUID values

---

## Data Factories Used

### Cliente Factory (existing — `e2e/helpers/data.helper.ts`)

**Function:** `buildCliente(overrides?)` — Already exists from Story 2.1. No new factory needed.

**Usage in Story 2.2 tests:**

```typescript
const data = buildCliente({ nombre: 'Empresa Detalle', nit: '900100200-1', telefono: '3009876543', ciudad: 'Medellín' });
const cliente = await apiHelper.createCliente(data);
```

---

## Fixtures Used

### ApiHelper (existing — `e2e/helpers/api.helper.ts`)

Extended with `getClienteById(id: string)` method for Story 2.2:

```typescript
async getClienteById(id: string) {
  const response = await this.request.get(`${API_BASE_URL}/api/v1/clientes/${id}`);
  return { status: response.status(), body: await response.json().catch(() => null) };
}
```

All E2E tests follow the pattern of:
1. Create client via `apiHelper.createCliente()` in `beforeEach`
2. Register cleanup via `createdIds` array in `afterEach`
3. Intercept routes network-first before navigation

---

## Mock Requirements

### GET /api/v1/clientes/{id} Mock (for E2E tests with network-first interception)

**Endpoint:** `GET /api/v1/clientes/{id}`

**Success Response (200):**

```json
{
  "id": "uuid",
  "nombre": "Empresa Ejemplo",
  "nit": "900100200-1",
  "telefono": "3009876543",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-03-12T10:30:00Z"
}
```

**Not Found Response (404 — Problem Details RFC 7807):**

```json
{
  "title": "Not Found",
  "status": 404,
  "detail": "Client with the specified ID was not found."
}
```

**Notes:**
- Route constraint `{id:guid}` rejects non-GUID values at routing level with 400/404
- The mock for AC3 tests uses `00000000-0000-0000-0000-000000000000` as the non-existent GUID
- E2E tests that hit the real API (no mock) use `beforeEach`/`afterEach` with `ApiHelper.deleteCliente()` for cleanup

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-content` — Container for the success state showing all four fields (Nombre, NIT, Teléfono, Ciudad). Present only when client data is loaded successfully.
- `cliente-not-found` — Container for the not-found state. Rendered when API returns 404 or client data is null/undefined.

### Clientes Route (`clientes.$clienteId.tsx`)

The following testids from Story 2.1 must remain working:
- `clientes-list-panel` — Left panel (280px); must be visible on direct `/clientes/:clienteId` navigation
- `cliente-list-item` — Individual client items in the left panel; clicking triggers navigation
- `cliente-detail-panel` — Right panel container; must still show default state when no client is selected (when on `/clientes` without a `$clienteId` child)

**Implementation Example:**

```tsx
// Success state
<div data-testid="cliente-detail-content" className="...">
  <p><span>Nombre:</span> {cliente.nombre}</p>
  <p><span>NIT/RUC:</span> {cliente.nit}</p>
  <p><span>Teléfono:</span> {cliente.telefono}</p>
  <p><span>Ciudad:</span> {cliente.ciudad}</p>
</div>

// Not-found state
<div data-testid="cliente-not-found" className="flex flex-1 flex-col items-center justify-center text-slate-500">
  <p className="text-sm">No se encontró el cliente solicitado.</p>
</div>
```

---

## Implementation Checklist

### Backend: Test `GET /api/v1/clientes/{id}` (makes API tests pass)

**Tasks:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with `Guid Id`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — calls `_repository.GetByIdAsync(query.Id, ct)`, returns `ClienteDto?`
- [ ] Register handler: `builder.Services.AddScoped<GetClienteByIdQueryHandler>()` in `Program.cs`
- [ ] Add endpoint to `ClienteEndpoints.cs`: `app.MapGet("/api/v1/clientes/{id:guid}", ...)` returning `Results.Ok(dto)` or `Results.NotFound()`
- [ ] Decorate endpoint with `.WithName("GetClienteById")`, `.WithTags("Clientes")`, `.Produces<ClienteDto>()`, `.ProducesProblem(404)`, `.ProducesProblem(500)`, `.WithOpenApi()`
- [ ] Run API tests: `npx playwright test e2e/tests/api/clientes-get-by-id.api.spec.ts`
- [ ] ✅ All API tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Frontend: `useCliente(id)` hook (makes unit tests in story tasks pass)

**Tasks:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
- [ ] Use `useQuery` with `queryKey: ['clientes', id]`, `queryFn: () => clienteApiRepository.getById(id)`, `enabled: !!id`
- [ ] Set `staleTime: 30_000`
- [ ] Return `{ data, isLoading, isError }`
- [ ] Run hook unit tests: `pnpm --filter frontend test useCliente`
- [ ] ✅ Hook tests pass

**Estimated Effort:** 0.5 hours

---

### Frontend: `ClienteDetailView` component (makes component unit tests + E2E AC1/AC2/AC3 pass)

**Tasks:**

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- [ ] Props: `{ clienteId: string }`
- [ ] Consume `useCliente(clienteId)` hook
- [ ] Loading state: skeleton rows using `react-loading-skeleton`
- [ ] Not-found state: `<div data-testid="cliente-not-found">` with "No se encontró el cliente solicitado."
- [ ] Success state: `<div data-testid="cliente-detail-content">` with labeled rows: Nombre, NIT/RUC, Teléfono, Ciudad
- [ ] Run component unit tests: `pnpm --filter frontend test ClienteDetailView`
- [ ] ✅ Component tests pass

**Estimated Effort:** 1.5 hours

---

### Frontend: `clientes.$clienteId.tsx` TanStack Router route (makes E2E AC1/AC2 URL tests pass)

**Tasks:**

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`
- [ ] Export `Route = createFileRoute('/_app/clientes/$clienteId')({...})`
- [ ] Access param via `const { clienteId } = Route.useParams()` (typed — NOT `useParams({ strict: false })`)
- [ ] Render two-panel layout: left = `<ClienteListView />` (280px), right = `<ClienteDetailView clienteId={clienteId} />`
- [ ] Regenerate route tree: `pnpm --filter frontend exec tsr generate`
- [ ] Add `data-testid="cliente-detail-content"` in `ClienteDetailView` success state
- [ ] Run E2E tests (AC1+AC2): `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ E2E AC1 and AC2 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Frontend: Update parent route `clientes.tsx` to support Outlet (preserves AC5 from Story 2.1)

**Tasks:**

- [ ] Modify `frontend/src/routes/_app/clientes.tsx` to render `<Outlet />` in the right panel when a child route (`$clienteId`) is active
- [ ] Verify Story 2.1 AC5 preserved: default "Selecciona un cliente para ver sus detalles" still shows when at `/clientes` without a child
- [ ] Run Story 2.1 AC5 test to confirm no regression: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC5"`
- [ ] ✅ AC5 still passes

**Estimated Effort:** 0.5 hours

---

### E2E Tests AC3 (makes not-found E2E tests pass)

**Tasks:**

- [ ] Implement not-found state in `ClienteDetailView` (renders when `isError && !data`)
- [ ] Add `data-testid="cliente-not-found"` to not-found container
- [ ] Ensure `data-testid="cliente-detail-content"` is absent when not found
- [ ] Run E2E tests (AC3): `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --grep "AC3"`
- [ ] ✅ AC3 E2E tests pass

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all Story 2.2 failing tests (E2E + API)
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/clientes-get-by-id.api.spec.ts

# Run E2E tests only
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts

# Run API tests only
npx playwright test e2e/tests/api/clientes-get-by-id.api.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --debug

# Run frontend unit tests (hooks + components — from story tasks)
pnpm --filter frontend test useCliente ClienteDetailView

# Run backend unit tests
cd backend && dotnet test tests/SiesaAgents.UnitTests
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (13 E2E + 11 API = 24 total)
- ✅ Network-first intercept pattern applied to all E2E tests
- ✅ Auto-cleanup via `beforeEach`/`afterEach` with `createdIds` array
- ✅ data-testid requirements documented
- ✅ Mock requirements documented for DEV team
- ✅ Implementation checklist created

**Verification:**

- All tests fail because the `$clienteId` route and `GET /api/v1/clientes/{id}` endpoint do not yet exist
- E2E tests fail with: element not found / navigation to unknown route
- API tests fail with: HTTP 404 (endpoint not registered)

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with backend** — implement `GET /api/v1/clientes/{id}` endpoint (API tests turn green)
2. **Then implement** `useCliente(id)` hook (hook unit tests turn green)
3. **Then implement** `ClienteDetailView` component (component unit tests turn green)
4. **Then create** `clientes.$clienteId.tsx` route + regenerate route tree (E2E AC1+AC2 turn green)
5. **Then update** `clientes.tsx` parent route with `<Outlet />` (AC5 from 2.1 preserved)
6. **Finally verify** not-found state (AC3 E2E tests turn green)

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run `tsr generate` after creating `$clienteId` route file

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 24 tests pass (green phase complete)
2. Review `ClienteDetailView` for Tailwind class consistency with story UI requirements
3. Confirm `staleTime: 30_000` is consistent with `useClientes`
4. Ensure TypeScript types are strict (no `any` casts)
5. Run full test suite to confirm no regressions

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/clientes-get-by-id.api.spec.ts`
3. **Begin implementation** following the implementation checklist order (backend → hook → component → route)
4. **Work one group at a time** (backend API → component → route → not-found)
5. **Run `tsr generate`** after creating the `$clienteId` route file (critical — route tree must be regenerated)
6. **When all tests pass**, refactor for code quality

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before `page.goto()` applied in all E2E tests
- **data-factories.md** — `buildCliente()` factory from `e2e/helpers/data.helper.ts` reused
- **fixture-architecture.md** — `beforeEach`/`afterEach` with `createdIds` cleanup array pattern
- **test-quality.md** — One assertion per test (atomic), Given-When-Then, no hard waits
- **selector-resilience.md** — `data-testid` selectors exclusively; no CSS class selectors
- **test-levels-framework.md** — E2E for user journeys (AC1 click + URL update, AC2 direct nav, AC3 not-found); API for backend contract (AC2/AC3 endpoint)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts e2e/tests/api/clientes-get-by-id.api.spec.ts`

**Expected Results:**

```
E2E Tests: 13 failed (missing $clienteId route)
  - AC1 tests: element not found (route does not exist / detail component not rendered)
  - AC2 tests: navigation to /clientes/:id leads to router 404 or blank page
  - AC3 tests: cliente-not-found testid not found

API Tests: 11 failed (endpoint not registered)
  - GET /api/v1/clientes/{id} returns 404 (endpoint not registered in ClienteEndpoints.cs)
```

**Summary:**

- Total tests: 24
- Passing: 0 (expected)
- Failing: 24 (expected)
- Status: ✅ RED phase — all tests intentionally failing

---

## Notes

- The `$clienteId` route is the CRITICAL unresolved issue from Story 2.1 code review (flagged as CRITICAL: missing dynamic route). This story directly resolves it.
- After creating `clientes.$clienteId.tsx`, **always run** `pnpm --filter frontend exec tsr generate` to update `routeTree.gen.ts`.
- The E2E tests for AC1 use `route.continue()` to pass through to real API — they require a live backend and create real data. Tests for AC3 use mocked 404 responses to avoid depending on a non-existent record.
- Risk R-008 (deep link non-existent ID renders blank page) is covered by the AC3 E2E test "should NOT show an unhandled error or blank page".
- Frontend unit tests (Vitest + RTL + MSW) are specified in the story task list but are NOT part of this ATDD checklist — they are co-located tests for the `useCliente` hook and `ClienteDetailView` component.

---

**Generated by BMad TEA Agent** — 2026-06-30
