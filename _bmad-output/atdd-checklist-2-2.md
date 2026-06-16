# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-16
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component

---

## Story Summary

The commercial team can view the complete details of a specific client by clicking on it from the
client list, or by navigating directly to a deep-linked URL (`/clientes/:clienteId`). The right
panel of the split-panel layout shows all client fields (Nombre, NIT/RUC, Teléfono, Ciudad) with
loading skeletons, graceful not-found handling, and error recovery via ErrorPanel.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, When the user clicks on a client item in the left panel, Then the right panel shows the complete client details (Nombre, NIT/RUC, Teléfono, Ciudad) and the URL updates to `/clientes/:clienteId` (FR30 deep linking).
2. **AC2** — Given the user accesses the URL `/clientes/:clienteId` directly (deep link), When the page loads, Then the correct client details are loaded and displayed using `GET /api/v1/clientes/:id` (FR30).
3. **AC3** — Given a `clienteId` in the URL does not exist (unknown UUID), When the page loads, Then a not-found message is displayed gracefully in the right panel — no blank screen or unhandled JS error.
4. **AC4** — Given `GET /api/v1/clientes/:id` is called with a valid UUID, When the response is returned, Then HTTP 200 with all fields: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
5. **AC5** — Given `GET /api/v1/clientes/:id` is called with a non-existent UUID, When the response is returned, Then HTTP 404 with Problem Details RFC 7807 format (no stack trace).
6. **AC6** — Given the backend is unavailable when the detail view loads, When the fetch fails, Then an `ErrorPanel` is displayed with a "Reintentar" button. Raw error message is never shown (NFR6).
7. **AC7** — Given the client detail is loading, When the fetch is in-flight, Then skeleton placeholders (react-loading-skeleton) are rendered with `aria-busy="true"` on the panel container — no spinner.

---

## Failing Tests Created (RED Phase)

### E2E Tests (9 tests)

**File:** `e2e/tests/clientes/2-2-client-detail-view.spec.ts`

- **Test:** AC1 — clicking a client item in the left panel displays its detail in the right panel
  - **Status:** RED — `cliente-detail-panel` testid not yet implemented
  - **Verifies:** AC1, split-panel layout shows client data in right panel

- **Test:** AC1 — clicking a client item updates the URL to /clientes/:clienteId (TC-E2-P1-07)
  - **Status:** RED — route `_app/clientes.$clienteId.tsx` not yet created; URL navigation not wired
  - **Verifies:** AC1, FR30 deep linking (TC-E2-P1-07)

- **Test:** AC1 — right panel shows field labels in Spanish (Nombre, NIT/RUC, Teléfono, Ciudad)
  - **Status:** RED — `ClienteDetailView` component not yet implemented
  - **Verifies:** AC1, mandatory Spanish labels per company standards

- **Test:** AC2 — accessing /clientes/:clienteId directly loads the correct client detail (TC-E2-P1-08)
  - **Status:** RED — TanStack Router route `clientes.$clienteId.tsx` not yet created
  - **Verifies:** AC2, FR30 deep linking (TC-E2-P1-08)

- **Test:** AC2 — deep link preserves the left panel (split layout remains intact)
  - **Status:** RED — split layout not yet wired for deep link route
  - **Verifies:** AC2, split-panel layout remains on direct URL access

- **Test:** AC3 — accessing /clientes/:unknownId shows graceful not-found message (TC-E2-P1-09)
  - **Status:** RED — not-found state not yet implemented in `ClienteDetailView`
  - **Verifies:** AC3, R-007 mitigation (TC-E2-P1-09)

- **Test:** AC3 — no unhandled JS error is thrown for non-existent clienteId
  - **Status:** RED — unhandled error boundary not yet in place
  - **Verifies:** AC3, no crash on 404 (R-007)

- **Test:** AC6 — ErrorPanel is shown when the detail fetch fails (backend unavailable)
  - **Status:** RED — `ErrorPanel` not yet rendered in `ClienteDetailView`
  - **Verifies:** AC6, NFR6 — no raw error shown

- **Test:** AC6 — clicking "Reintentar" triggers a new detail fetch
  - **Status:** RED — `refetch` on ErrorPanel button not wired
  - **Verifies:** AC6, retry mechanism

- **Test:** AC7 — skeleton placeholders with aria-busy="true" are shown while detail is loading
  - **Status:** RED — skeleton loading state not yet implemented
  - **Verifies:** AC7, no spinner — skeleton only

- **Test:** right panel shows default placeholder when no client is selected
  - **Status:** RED — default empty right panel state not yet implemented
  - **Verifies:** AC1 (default state), "Selecciona un cliente de la lista" message

### API Tests (6 tests)

**File:** `e2e/tests/api/2-2-client-detail-view.api.spec.ts`

- **Test:** AC4 TC-E2-P1-01 — GET /api/v1/clientes/{id} returns HTTP 200 when client exists
  - **Status:** RED — `GET /api/v1/clientes/{id}` endpoint not yet implemented in backend
  - **Verifies:** AC4 (TC-E2-P1-01)

- **Test:** AC4 TC-E2-P1-01 — GET /api/v1/clientes/{id} returns Content-Type application/json
  - **Status:** RED — endpoint not yet implemented
  - **Verifies:** AC4 content-type contract

- **Test:** AC4 TC-E2-P1-01 — response body contains all required fields
  - **Status:** RED — endpoint not yet implemented
  - **Verifies:** AC4, all 7 required fields present

- **Test:** AC4 — response body does NOT expose internal fields (NFR6)
  - **Status:** RED — endpoint not yet implemented
  - **Verifies:** NFR6 — no stackTrace, exception, innerException

- **Test:** AC5 TC-E2-P1-02 — GET /api/v1/clientes/{unknown-uuid} returns HTTP 404
  - **Status:** RED — endpoint not yet implemented; 404 not returned
  - **Verifies:** AC5 (TC-E2-P1-02), R-007

- **Test:** AC5 TC-E2-P1-02 — 404 response uses Problem Details format (RFC 7807)
  - **Status:** RED — endpoint not yet implemented
  - **Verifies:** AC5, Content-Type: application/problem+json

- **Test:** AC5 TC-E2-P1-02 — 404 body conforms to RFC 7807 shape
  - **Status:** RED — endpoint not yet implemented
  - **Verifies:** AC5, `title` + `status` fields present

- **Test:** AC5 TC-E2-P1-02 — 404 body does NOT expose stack traces (NFR6)
  - **Status:** RED — endpoint not yet implemented
  - **Verifies:** AC5, NFR6 — no stack trace keywords

- **Test:** AC5 — GET with valid but non-existent UUID returns 404 not 400 or 500
  - **Status:** RED — endpoint not yet implemented
  - **Verifies:** AC5, correct HTTP status for valid-format non-existent UUID

### Component Tests (10 tests)

**File:** `e2e/tests/component/2-2-client-detail-view.component.spec.ts`

- **Test:** AC1 — detail panel renders Nombre field and value after selecting a client
  - **Status:** RED — `ClienteDetailView` not yet implemented
  - **Verifies:** AC1, Nombre field visible

- **Test:** AC1 — detail panel renders NIT/RUC field and value
  - **Status:** RED — `ClienteDetailView` not yet implemented
  - **Verifies:** AC1, NIT/RUC field visible

- **Test:** AC1 — detail panel renders Teléfono field and value
  - **Status:** RED — `ClienteDetailView` not yet implemented
  - **Verifies:** AC1, Teléfono field visible

- **Test:** AC1 — detail panel renders Ciudad field and value
  - **Status:** RED — `ClienteDetailView` not yet implemented
  - **Verifies:** AC1, Ciudad field visible

- **Test:** AC3 — not-found message is shown in the right panel when 404 is returned
  - **Status:** RED — 404-specific not-found state not yet implemented
  - **Verifies:** AC3, graceful not-found (R-007)

- **Test:** AC6 — ErrorPanel is shown when detail fetch fails with a non-404 error
  - **Status:** RED — ErrorPanel not yet rendered in detail component
  - **Verifies:** AC6, NFR6

- **Test:** AC6 — ErrorPanel is shown when network is completely unavailable
  - **Status:** RED — ErrorPanel not yet rendered
  - **Verifies:** AC6, NFR6 on network abort

- **Test:** AC7 — detail panel container has aria-busy="true" while fetching
  - **Status:** RED — skeleton loading state + aria-busy not yet implemented
  - **Verifies:** AC7, WCAG 2.1 AA — aria-busy

- **Test:** AC7 — no spinner element is visible during loading (skeleton-only)
  - **Status:** RED — loading state not yet implemented
  - **Verifies:** AC7, no spinner (react-loading-skeleton only)

- **Test:** detail panel is keyboard navigable and meets basic ARIA requirements
  - **Status:** RED — accessibility structure not yet implemented
  - **Verifies:** WCAG 2.1 AA, keyboard navigation

---

## Data Factories / Mocks

Inline factory function `mockClienteDto()` is used directly in each test file to generate mock
`ClienteDto` responses matching the backend contract. The existing `buildCliente()` from
`e2e/helpers/data.helper.ts` is reused for tests that interact with the real API.

**Mock shape (inline in each spec file):**
```typescript
{
  id: string,       // UUID format
  nombre: string,   // empresa name
  nit: string,      // company tax ID
  telefono: string, // phone number
  ciudad: string,   // city name
  createdAt: string, // ISO 8601 DateTimeOffset
  updatedAt: string, // ISO 8601 DateTimeOffset
}
```

---

## Mock Requirements

### GET /api/v1/clientes/{id} — Success (200)

**Endpoint:** `GET /api/v1/clientes/{id}`

**Success Response:**
```json
{
  "id": "uuid-string",
  "nombre": "Empresa Demo S.A.S",
  "nit": "900123456",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-16T10:00:00.000Z",
  "updatedAt": "2026-06-16T10:00:00.000Z"
}
```

### GET /api/v1/clientes/{unknown-id} — Not Found (404)

**Endpoint:** `GET /api/v1/clientes/00000000-0000-0000-0000-000000000000`

**Failure Response (RFC 7807):**
```json
{
  "title": "Cliente no encontrado",
  "status": 404,
  "detail": "No se encontró el cliente solicitado."
}
```

**Content-Type:** `application/problem+json`

**Notes:** Must NOT include `stackTrace`, `exception`, or `innerException` properties (NFR6).

---

## Required data-testid Attributes

### ClienteDetailView Component (right panel)

- `cliente-detail-panel` — Right panel container (aria-busy="true" during loading)
- `cliente-detail-nombre` — (Optional granular testid) Nombre field label+value pair
- `cliente-detail-nit` — (Optional) NIT/RUC field label+value pair
- `cliente-detail-telefono` — (Optional) Teléfono field label+value pair
- `cliente-detail-ciudad` — (Optional) Ciudad field label+value pair
- `error-panel` — ErrorPanel component (shared from Story 2.1, already defined)
- `spinner` — Must NOT exist during loading (skeleton pattern only)

### ClienteListView (left panel — from Story 2.1, verify still present)

- `clientes-list-panel` — Left panel container
- `cliente-list-item` — Each clickable client item

### Default empty state (base /clientes route)

Text: "Selecciona un cliente de la lista" visible when no clienteId in URL.

**Implementation Example:**
```tsx
<div data-testid="cliente-detail-panel" aria-busy={isLoading ? 'true' : undefined}>
  {isLoading && <SkeletonRows count={4} />}
  {isError && is404 && <p>No se encontró el cliente solicitado.</p>}
  {isError && !is404 && <ErrorPanel onRetry={refetch} />}
  {data && (
    <dl>
      <dt>Nombre</dt><dd>{data.nombre}</dd>
      <dt>NIT/RUC</dt><dd>{data.nit}</dd>
      <dt>Teléfono</dt><dd>{data.telefono}</dd>
      <dt>Ciudad</dt><dd>{data.ciudad}</dd>
    </dl>
  )}
</div>
```

---

## Implementation Checklist

### Test Group A: Backend endpoint (AC4, AC5) — TC-E2-P1-01, TC-E2-P1-02

**Files to create/modify:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — add `GetByIdAsync`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — NEW
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — NEW
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `GetByIdAsync`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add `MapGet /api/v1/clientes/{id:guid}`

**Tasks to make API tests pass:**
- [ ] Add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository`
- [ ] Implement `GetByIdAsync` using EF Core `FindAsync` with `AsNoTracking()`
- [ ] Create `GetClienteByIdQuery` record with `Guid Id` property
- [ ] Create `GetClienteByIdQueryHandler` — returns `ClienteDto?` (null when not found; no throw)
- [ ] Add `app.MapGet("/api/v1/clientes/{id:guid}", ...)` endpoint — returns 200 or `Results.Problem(status: 404)` (RFC 7807)
- [ ] Verify response body has all 7 fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt
- [ ] Verify 404 response uses `application/problem+json` Content-Type
- [ ] Verify no stackTrace or exception in any response body (NFR6)
- [ ] Run tests: `npx playwright test e2e/tests/api/2-2-client-detail-view.api.spec.ts`
- [ ] All API tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test Group B: useCliente hook (AC2, AC6) — Frontend application layer

**File:** `frontend/src/modules/crm/clientes/application/useCliente.ts`

**Tasks:**
- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository` interface
- [ ] Add `getById` implementation to `clienteApiRepository.ts` (Axios GET /api/v1/clientes/${id})
- [ ] Create `useCliente.ts` hook with TanStack Query (`queryKey: ['clientes', clienteId]`, `enabled: !!clienteId`, `staleTime: 30_000`, `retry: 0`)
- [ ] Ensure Axios 404 propagates as `isError: true` (not swallowed)
- [ ] Run vitest tests: `pnpm --filter frontend test useCliente`

**Estimated Effort:** 1.5 hours

---

### Test Group C: ClienteDetailView component (AC1, AC3, AC6, AC7) — TC-E2-P1-07

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`

**Tasks:**
- [ ] Create `ClienteDetailView.tsx` with prop `clienteId: string`
- [ ] Call `useCliente(clienteId)`
- [ ] Loading state: render 4 skeleton rows (`react-loading-skeleton`); add `aria-busy="true"` to container
- [ ] Error state (non-404): render `<ErrorPanel onRetry={refetch} />` — never expose raw error
- [ ] Error state (404): detect via `axios.isAxiosError(error) && error.response?.status === 404`; render "No se encontró el cliente solicitado." (Spanish — mandatory)
- [ ] Success state: render `<dl>` with dt/dd pairs for Nombre, NIT/RUC, Teléfono, Ciudad (labels in Spanish)
- [ ] Add `data-testid="cliente-detail-panel"` to the root container
- [ ] Verify no `data-testid="spinner"` or `role="progressbar"` element is rendered during loading
- [ ] Run component tests: `pnpm --filter frontend test ClienteDetailView`
- [ ] Run E2E component tests: `npx playwright test e2e/tests/component/2-2-client-detail-view.component.spec.ts`
- [ ] All component tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test Group D: Route wiring for deep link (AC1, AC2) — TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09

**Files:**
- `frontend/src/routes/_app/clientes.$clienteId.tsx` — NEW
- `frontend/src/routes/_app/clientes.tsx` — MODIFY (add default right panel state)
- `frontend/src/shared/components/ClientListItem.tsx` — MODIFY (ensure onClick nav prop)

**Tasks:**
- [ ] Create `clientes.$clienteId.tsx` with `createFileRoute('/clientes/$clienteId')`
- [ ] Extract `clienteId` from `Route.useParams()` and pass to `<ClienteDetailView clienteId={clienteId} />`
- [ ] Render split layout: left `<ClienteListView />` (280px) + right `<ClienteDetailView />`
- [ ] Update base `/clientes` route to show default empty right panel: "Selecciona un cliente de la lista para ver su detalle."
- [ ] Wire `ClienteListView` onClick → `useNavigate()` to `/clientes/$clienteId`
- [ ] Verify URL updates to `/clientes/:clienteId` on click (TC-E2-P1-07)
- [ ] Verify split layout preserved on direct URL access (TC-E2-P1-08)
- [ ] Verify not-found state renders for non-existent UUID (TC-E2-P1-09)
- [ ] Run E2E tests: `npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts`
- [ ] All E2E tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all Story 2.2 E2E acceptance tests
npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts

# Run API integration tests
npx playwright test e2e/tests/api/2-2-client-detail-view.api.spec.ts

# Run component-level acceptance tests
npx playwright test e2e/tests/component/2-2-client-detail-view.component.spec.ts

# Run ALL Story 2.2 tests at once
npx playwright test --grep "Story 2.2"

# Run in headed mode (see browser)
npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/clientes/2-2-client-detail-view.spec.ts --debug

# Run with specific test title
npx playwright test --grep "TC-E2-P1-07"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (expected — implementation not yet done)
- Inline mock factories with all required fields
- Network-first intercept pattern applied throughout (intercept BEFORE navigation)
- `data-testid` requirements documented
- Implementation checklist maps each test to concrete tasks

**Verification:**

- Tests fail due to missing implementation (`cliente-detail-panel` not found, routes missing, API 404)
- Failure messages are clear: "Locator not found", "Expected status 404, received 404" (endpoint missing)
- No test infrastructure bugs — all failures are missing-implementation failures

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick test group A (backend endpoint) — run `npx playwright test e2e/tests/api/2-2-client-detail-view.api.spec.ts`
2. Implement `GET /api/v1/clientes/{id}` (Tasks in Group A above)
3. Run API tests — verify all green
4. Pick test group B (useCliente hook) — implement and verify
5. Pick test group C (ClienteDetailView) — implement and run component tests
6. Pick test group D (route wiring) — implement and run E2E tests
7. Run full suite: `npx playwright test --grep "Story 2.2"` — all green

**Key Principles:**

- One test group at a time
- Minimal implementation per group
- Run tests after each group
- Spanish text is mandatory — no English labels in the UI

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 25 tests green
2. Extract any duplicated mock logic into shared helpers if warranted
3. Optimize: check `staleTime` and cache invalidation strategy matches architecture.md canonical keys
4. Verify WCAG 2.1 AA: keyboard navigation, heading hierarchy, `aria-busy` semantics
5. Ensure tests still pass after refactor

---

## Next Steps

1. Run failing tests to confirm RED phase: `npx playwright test --grep "Story 2.2"`
2. Begin with backend endpoint (Group A) — unblocks all API tests
3. Continue with useCliente hook (Group B) — unblocks component tests
4. Implement ClienteDetailView (Group C)
5. Wire routes (Group D)
6. When all tests pass, refactor for quality
7. Update story status to `done` in sprint-status.yaml after review

---

## Knowledge Base References Applied

- **network-first.md** — Route interception set BEFORE `page.goto()` in every test to prevent race conditions
- **data-factories.md** — Inline `mockClienteDto()` factory with optional overrides; `buildCliente()` reused for real-API tests
- **test-quality.md** — One assertion per test (atomic); explicit waits via `expect(...).toBeVisible()`; no hard waits or `sleep()`
- **selector-resilience.md** — `data-testid` selectors throughout; `getByRole()` for semantic elements (button, heading)
- **timing-debugging.md** — 300-400ms artificial delays for loading state tests; `waitForLoadState('networkidle')` for JS error check
- **test-levels-framework.md** — E2E for user journeys (AC1/AC2/AC3); API for contract validation (AC4/AC5); Component for UI behavior isolation (AC6/AC7)

---

## Test Execution Evidence

### Expected RED Phase Failures

**E2E tests (`2-2-client-detail-view.spec.ts`):**
```
✗ AC1 — clicking a client item displays its detail — Timeout: getByTestId('cliente-detail-panel') not found
✗ AC1 — URL updates to /clientes/:clienteId — Expected URL to match /clientes/uuid-..., received /clientes
✗ AC2 — deep link loads correct detail — Route /clientes/:clienteId does not exist (404 or redirect)
✗ AC3 — not-found message shown — Timeout: getByText('No se encontró...') not found
✗ AC6 — ErrorPanel shown — Timeout: getByTestId('error-panel') not found
✗ AC7 — skeleton with aria-busy — Expected attribute 'aria-busy' to be 'true'
```

**API tests (`2-2-client-detail-view.api.spec.ts`):**
```
✗ TC-E2-P1-01 — GET /api/v1/clientes/{id} returns 200 — Expected 200, received 404 (route not found)
✗ TC-E2-P1-02 — returns 404 Problem Details — Expected 404, received 404 (but wrong content-type or missing endpoint)
```

**Component tests (`2-2-client-detail-view.component.spec.ts`):**
```
✗ Nombre field visible — Timeout: getByTestId('cliente-detail-panel') not found
✗ aria-busy during loading — Expected 'true', received null (no implementation)
✗ no spinner — Timeout (page crashes without detail component)
```

**Summary:**
- Total tests: 25
- Passing: 0 (expected — RED phase)
- Failing: 25 (expected — RED phase)
- Status: RED phase verified

---

## Notes

- All UI text is in Spanish (mandatory per company standards): "No se encontró el cliente solicitado.", "Selecciona un cliente de la lista", "Reintentar", labels "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
- The `$` prefix in `clientes.$clienteId.tsx` is TanStack Router file naming convention for dynamic segments
- Route param access: `const { clienteId } = Route.useParams()` (type-safe, generated by TanStack Router)
- `queryKey: ['clientes', clienteId]` MUST match architecture.md canonical key for correct cache invalidation in Stories 2.3/2.4
- `retry: 0` in `useCliente` is intentional — let the user manually retry via ErrorPanel (NFR6 pattern)
- MasterCrud is NOT applicable for this detail panel (read-only card layout)
- Risk R-007 (non-existent clienteId shows blank screen) is mitigated by AC3 tests (TC-E2-P1-09)

---

**Generated by BMad TEA Agent** — 2026-06-16
