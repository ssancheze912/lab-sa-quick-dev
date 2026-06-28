# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component

---

## Story Summary

A commercial team member can view the complete details of a client by selecting them from the list or navigating directly via deep link. The right panel displays Nombre, NIT/RUC, Teléfono, and Ciudad. The URL updates to `/clientes/:clienteId` (FR30 deep linking). Error states (404, 500, no selection) are handled gracefully.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (deep link), **Then** the correct client details are loaded and displayed without requiring navigation from the list panel (FR30).

3. **Given** a `clienteId` in the URL does not correspond to any existing client, **When** the page loads, **Then** a not-found message is displayed gracefully in the right panel (no crash, no blank panel).

4. **Given** the backend is unavailable when loading a specific client detail, **When** the `GET /api/v1/clientes/:id` fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed in the right panel instead of the client data.

5. **Given** the user navigates to `/clientes` with no `clienteId` in the URL, **When** no client has been selected, **Then** the right panel displays a placeholder/empty state indicating no client is selected.

---

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `e2e/tests/clientes/clientes-detail-view.spec.ts`

- **Test:** `TC-E2-2-2-E2E-1: should show client Nombre and NIT in detail panel when navigating directly to /clientes/:id`
  - **Status:** RED - `ClienteDetailView` and `clientes.$clienteId.tsx` route do not exist yet
  - **Verifies:** AC#2 — Deep link to `/clientes/:id` loads and displays client details (FR30, risk R-008)

- **Test:** `should update URL to /clientes/:clienteId when user clicks a client in the left panel`
  - **Status:** RED - Navigation on `ClienteListItem` click not yet implemented; detail panel missing
  - **Verifies:** AC#1 — URL updates on list item click and detail panel shows data

- **Test:** `TC-E2-2-2-E2E-2: should display not-found message when navigating to /clientes/00000000-0000-0000-0000-000000000000`
  - **Status:** RED - `NotFoundPanel` component does not exist; route handling for 404 not implemented
  - **Verifies:** AC#3 — 404 clienteId shows graceful not-found message (risk R-008)

### API Tests (5 tests)

**File:** `e2e/tests/api/clientes-detail.api.spec.ts`

- **Test:** `TC-E2-2-2-API-1: should return 200 with correct ClienteDto when fetching an existing client by id`
  - **Status:** RED - `GET /api/v1/clientes/:id` endpoint not implemented
  - **Verifies:** AC#2 — Backend returns correct ClienteDto for valid ID

- **Test:** `should return correct content-type application/json for a valid client`
  - **Status:** RED - Endpoint does not exist
  - **Verifies:** Response shape compliance (Content-Type header)

- **Test:** `should return all required ClienteDto fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)`
  - **Status:** RED - Endpoint does not exist
  - **Verifies:** Complete DTO shape including DateTimeOffset timestamps

- **Test:** `TC-E2-2-2-API-2: should return 404 with Problem Details RFC 7807 when client id does not exist`
  - **Status:** RED - Endpoint does not exist; 404 + Problem Details not wired
  - **Verifies:** AC#3 — 404 response conforms to RFC 7807 Problem Details shape

- **Test:** `should return content-type application/problem+json for a 404 response`
  - **Status:** RED - Endpoint does not exist
  - **Verifies:** 404 response uses proper `application/problem+json` content type

### Component Tests (11 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.test.tsx`

- **Test:** `TC-E2-2-2-CMP-2: should show placeholder text when clienteId is undefined`
  - **Status:** RED - `ClienteDetailView` component does not exist
  - **Verifies:** AC#5 — No-selection state shows Spanish placeholder text

- **Test:** `should NOT render Nombre, NIT/RUC, Teléfono, or Ciudad when no client is selected`
  - **Status:** RED - Component does not exist
  - **Verifies:** AC#5 — Placeholder state has no client data rendered

- **Test:** `should NOT trigger any network request when clienteId is undefined`
  - **Status:** RED - `useCliente` hook with `enabled: !!id` not implemented
  - **Verifies:** `enabled: !!id` guard in `useCliente` prevents spurious fetches

- **Test:** `TC-E2-2-2-CMP-1: should display Nombre, NIT/RUC, Teléfono, and Ciudad when client is loaded`
  - **Status:** RED - `ClienteDetailView` and `useCliente` hook do not exist
  - **Verifies:** AC#1/#2 — All 4 required fields displayed with Spanish labels

- **Test:** `should render Nombre as a heading with text-xl font-bold styling`
  - **Status:** RED - Component does not exist
  - **Verifies:** AC#1 — Nombre rendered as `<h2>` heading per architecture spec

- **Test:** `should use data-testid="cliente-detail-panel" on the root container`
  - **Status:** RED - Component does not exist
  - **Verifies:** `data-testid` presence for E2E selector stability

- **Test:** `TC-E2-2-2-CMP-3: should show ErrorPanel with "Reintentar" button when fetch returns 500`
  - **Status:** RED - `ClienteDetailView` does not exist
  - **Verifies:** AC#4 — ErrorPanel + "Reintentar" shown on 500 error

- **Test:** `should trigger a new GET request when "Reintentar" button is clicked after 500 error`
  - **Status:** RED - Component and hook do not exist
  - **Verifies:** AC#4 — `refetch` is wired to ErrorPanel `onRetry` prop

- **Test:** `should show ErrorPanel when network request fails completely (network error)`
  - **Status:** RED - Component does not exist
  - **Verifies:** AC#4 — Network errors also render ErrorPanel

- **Test:** `TC-E2-2-2-CMP-4: should show not-found message (not ErrorPanel) when fetch returns 404`
  - **Status:** RED - `NotFoundPanel` and 404 detection logic do not exist
  - **Verifies:** AC#3 — 404 uses `NotFoundPanel`, NOT `ErrorPanel` (distinct UX)

- **Test:** `should display not-found description text for 404 response`
  - **Status:** RED - Component does not exist
  - **Verifies:** AC#3 — Descriptive Spanish not-found subtext displayed

- **Test:** `should NOT show the "Reintentar" button on 404 (not an ephemeral error)`
  - **Status:** RED - Component does not exist
  - **Verifies:** AC#3 — 404 is permanent; no retry button (different from 500)

---

## Data Factories Used

### Cliente Factory (existing — reused from Story 2.1)

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts`

**Exports:**
- `buildCliente(overrides?)` — Build a single Cliente with optional field overrides
- `buildClientes(count, overridesFn?)` — Build an array of Clientes
- `resetClienteCounter()` — Reset counter for deterministic IDs in beforeEach

**Example Usage:**
```typescript
const cliente = buildCliente({
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Acme S.A.',
  nit: '900123456-1',
});
```

---

## Fixtures Used

### Base Fixture (existing)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**
- `clientesPage` — Navigates to `/clientes` before the test
- Standard `{ page, request }` from `@playwright/test` used for API setup/teardown

---

## Mock Requirements

### GET /api/v1/clientes/:id — Success (200)

**Endpoint:** `GET /api/v1/clientes/:id`

**Success Response:**
```json
{
  "id": "uuid",
  "nombre": "Acme S.A.",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-03-12T10:30:00Z"
}
```

### GET /api/v1/clientes/:id — Not Found (404)

**Failure Response:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Cliente no encontrado",
  "status": 404,
  "detail": "El cliente solicitado no fue encontrado."
}
```

**Notes:** MSW handlers use `http.get(`${CLIENTES_URL}/${clienteId}`, ...)` — pattern specific to the ID under test. Always set up handler BEFORE rendering the component (network-first pattern).

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-panel` — Root container of the right panel (used in E2E and component tests)
- `not-found-panel` — Root of the NotFoundPanel component rendered on 404
- `error-panel` — Root of the ErrorPanel component rendered on 500/network errors (already exists from Story 2.1)

### ClienteListView / ClienteListItem (verify from Story 2.1)

- `cliente-list-item` — Each client row in the left panel (must be clickable for navigation)

**Implementation Example:**
```tsx
// ClienteDetailView.tsx root element
<div data-testid="cliente-detail-panel" className="flex-1 ...">

// NotFoundPanel.tsx
<div data-testid="not-found-panel" ...>

// ClienteListItem.tsx (verify exists from Story 2.1)
<div data-testid="cliente-list-item" ...>
```

---

## Implementation Checklist

### Test: TC-E2-2-2-API-1 + TC-E2-2-2-API-2 (Backend endpoint)

**File:** `e2e/tests/api/clientes-detail.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — `public record GetClienteByIdQuery(Guid Id)`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — calls `IClienteRepository.GetByIdAsync(id, ct)`, returns `ClienteDto?`
- [ ] Verify/add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository.cs`
- [ ] Verify/add `GetByIdAsync` implementation in `ClienteRepository.cs` using `FirstOrDefaultAsync`
- [ ] Add `group.MapGet("/{id:guid}", ...)` to `ClienteEndpoints.cs` — returns `Results.Ok(dto)` on found, `Results.Problem(...)` with 404 on null
- [ ] Verify `ExceptionHandlingMiddleware` handles unexpected exceptions
- [ ] Run: `cd e2e && npx playwright test tests/api/clientes-detail.api.spec.ts`
- [ ] ✅ API tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E2-2-2-CMP-2 (Placeholder state)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.test.tsx`

**Tasks:**

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — accepts `clienteId: string | undefined`
- [ ] When `clienteId` is `undefined` → render `<div data-testid="cliente-detail-panel">Selecciona un cliente para ver su detalle</div>`
- [ ] Add `data-testid="cliente-detail-panel"` to root element
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`
- [ ] ✅ CMP-2 passes

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-2-2-CMP-1 (Valid client fields)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.test.tsx`

**Tasks:**

- [ ] Verify/extend `IClienteRepository.ts` (frontend domain) with `getById(id: string): Promise<Cliente>`
- [ ] Verify/extend `clienteApiRepository.ts` with `getById(id: string)` → `GET /api/v1/clientes/${id}`
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts` with `queryKey: ['clientes', id]`, `enabled: !!id`, `staleTime: 0`
- [ ] Implement loaded state in `ClienteDetailView.tsx`: render `<h2>{data.nombre}</h2>` and `<dl>` with NIT/RUC, Teléfono, Ciudad labels in Spanish
- [ ] Add `data-testid` attributes to rendered fields
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`
- [ ] ✅ CMP-1 passes

**Estimated Effort:** 1.5 hours

---

### Test: TC-E2-2-2-CMP-3 (ErrorPanel on 500)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.test.tsx`

**Tasks:**

- [ ] Implement `isError` state in `ClienteDetailView.tsx` → render `<ErrorPanel onRetry={refetch} message="No se pudo cargar el cliente." />`
- [ ] Wire `refetch` from `useCliente` to `ErrorPanel`'s `onRetry` prop
- [ ] Verify `ErrorPanel` has `data-testid="error-panel"` (from Story 2.1)
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`
- [ ] ✅ CMP-3 passes

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-2-2-CMP-4 (NotFoundPanel on 404)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.test.tsx`

**Tasks:**

- [ ] Create `frontend/src/shared/components/NotFoundPanel.tsx` — accepts `title: string`, `description?: string`; renders `data-testid="not-found-panel"`
- [ ] Add 404 detection in `ClienteDetailView.tsx`: `const isNotFound = isError && axios.isAxiosError(error) && error.response?.status === 404`
- [ ] When `isNotFound` → render `<NotFoundPanel title="Cliente no encontrado" description="El cliente solicitado no existe o fue eliminado." />` (NOT ErrorPanel)
- [ ] Verify no "Reintentar" button on the NotFoundPanel
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`
- [ ] ✅ CMP-4 passes

**Estimated Effort:** 1 hour

---

### Test: TC-E2-2-2-E2E-1 (Deep link navigation)

**File:** `e2e/tests/clientes/clientes-detail-view.spec.ts`

**Tasks:**

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — TanStack Router dynamic route reading `clienteId` from `Route.useParams()`
- [ ] Render split-panel layout: `<ClienteListView />` (left, 280px) + `<ClienteDetailView clienteId={clienteId} />` (right, flex)
- [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `<ClienteDetailView clienteId={undefined} />`
- [ ] Update `ClienteListItem.tsx` with TanStack Router `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>`
- [ ] Add required data-testid attributes: `cliente-detail-panel`, `cliente-list-item`
- [ ] Run: `npx playwright test e2e/tests/clientes/clientes-detail-view.spec.ts`
- [ ] ✅ E2E-1 passes

**Estimated Effort:** 2 hours

---

### Test: TC-E2-2-2-E2E-2 (Not-found deep link)

**File:** `e2e/tests/clientes/clientes-detail-view.spec.ts`

**Tasks:**

- [ ] Verify route handles unknown UUIDs gracefully (no app crash)
- [ ] Ensure `ClienteDetailView` renders `NotFoundPanel` for 404 responses at route level
- [ ] Add `data-testid="not-found-panel"` to NotFoundPanel root element
- [ ] Run: `npx playwright test e2e/tests/clientes/clientes-detail-view.spec.ts`
- [ ] ✅ E2E-2 passes

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E tests for Story 2.2
npx playwright test e2e/tests/clientes/clientes-detail-view.spec.ts

# Run API tests for Story 2.2
npx playwright test e2e/tests/api/clientes-detail.api.spec.ts

# Run component tests for Story 2.2
pnpm --filter frontend test ClienteDetailView

# Run all Story 2.2 tests together (API + E2E via Playwright)
npx playwright test --grep "Story 2.2"

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/clientes-detail-view.spec.ts --headed

# Debug a specific E2E test
npx playwright test e2e/tests/clientes/clientes-detail-view.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (19 tests across 3 levels)
- ✅ Existing factory reused (`clienteFactory.ts` from Story 2.1)
- ✅ Existing fixtures reused (`base.fixture.ts`, `ApiHelper`)
- ✅ Mock requirements documented (MSW handlers, network-first pattern)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**
- Tests fail because `ClienteDetailView`, `useCliente`, `NotFoundPanel`, `clientes.$clienteId.tsx`, and `GET /api/v1/clientes/:id` do not yet exist
- Failure messages are import/module errors (RED for right reason)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Backend first** (unblocks API and E2E tests):
   - Implement `GET /api/v1/clientes/:id` → make TC-E2-2-2-API-1 and API-2 pass
2. **Frontend hooks** (unblocks component tests):
   - Create `useCliente.ts` and extend `clienteApiRepository.ts` → `getById`
3. **Component** (unblocks CMP tests):
   - Create `ClienteDetailView.tsx`, `NotFoundPanel.tsx`
   - Make CMP-2 → CMP-1 → CMP-3 → CMP-4 pass in order
4. **Route wiring** (unblocks E2E tests):
   - Create `clientes.$clienteId.tsx`, update `clientes.tsx`, wire `ClienteListItem` navigation
   - Make E2E-1 and E2E-2 pass

**Key Principles:**
- Follow order above (backend → hooks → component → routes)
- One test at a time (don't try to fix all at once)
- Run `pnpm --filter frontend test` after each component change

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 19 tests pass
2. Review `ClienteDetailView.tsx` for clean state management (no unnecessary re-renders)
3. Ensure `queryKey: ['clientes', id]` is consistent with Story 2.1's `['clientes']`
4. Verify no `any` types in TypeScript
5. Confirm all user-facing text is in Spanish

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/api/clientes-detail.api.spec.ts`
3. Start backend implementation (Task 1 in Story 2.2)
4. Work one test level at a time: API → Component → E2E

---

## Knowledge Base References Applied

- **network-first.md** — All tests set up MSW handlers/page.route() BEFORE rendering/navigating
- **data-factories.md** — `clienteFactory.ts` reused from Story 2.1 (no duplication)
- **fixture-architecture.md** — Existing `base.fixture.ts` extended for E2E; isolated `QueryClient` per component test
- **component-tdd.md** — `renderClienteDetailView()` helper isolates each test with fresh QueryClient
- **test-quality.md** — One assertion per test (atomic), explicit `waitFor()`, no hard waits
- **selector-resilience.md** — `data-testid` selectors throughout; no CSS class selectors

---

**Generated by BMad TEA Agent** — 2026-06-28
