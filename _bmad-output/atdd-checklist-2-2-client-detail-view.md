# ATDD Checklist — Epic 2, Story 2: Client Detail View

**Date:** 2026-05-24
**Author:** BMad TEA Agent
**Story:** 2.2 — Client Detail View
**Primary Test Levels:** E2E + API + Component + Unit

---

## Story Summary

As a commercial team member, I want to view the complete details of a client by selecting them
from the list, so that I can review all their information without navigating away from the
clients section.

The story implements the right panel of the split-panel UI at `/clientes`, which shows a
`ClienteDetailView` fed by `useCliente` (TanStack Query) → `clienteApiRepository.getById`
→ `GET /api/v1/clientes/{id}`. It supports deep linking (FR30), graceful 404 handling,
skeleton loading state, and an error panel for 5xx failures.

---

## Acceptance Criteria

1. **AC1** — Clicking a client item in the left panel renders the right panel with all 4 fields:
   Nombre, NIT/RUC, Teléfono, Ciudad.
2. **AC2** — URL updates to `/clientes/:clienteId` (FR30 deep linking) without a full page reload.
3. **AC3** — Direct navigation to `/clientes/:clienteId` fetches `GET /api/v1/clientes/{id}`
   and displays correct details; matching list item is highlighted.
4. **AC4** — Non-existent clienteId returns HTTP 404 → right panel shows "Cliente no encontrado."
   with no JS console errors and no blank/crashed panel.
5. **AC5** — Skeleton loading state (`react-loading-skeleton`) shown while fetch is in-flight;
   NOT a spinner (company UX standard).
6. **AC6** — Backend unavailable (5xx / network error) → `ErrorPanel` shown with "Reintentar"
   button; clicking triggers refetch.
7. **AC7** — `GET /api/v1/clientes/{id}` returns HTTP 200 + `ClienteDto` JSON object with
   `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt` in camelCase.
8. **AC8** — `GET /api/v1/clientes/{id}` returns HTTP 404 + Problem Details RFC 7807 body
   (no stack trace exposed — NFR6).
9. **AC9** — When no clienteId is in the URL, right panel shows default empty state in Spanish:
   "Selecciona un cliente para ver sus detalles."

---

## Failing Tests Created (RED Phase)

### E2E Tests — 9 tests (AC1, AC2, AC3, AC4, AC9)

**File:** `e2e/tests/clientes/client-detail.spec.ts` (new — created by this workflow)

**TC-E2-P1-05 — AC1+AC2: Click client → detail panel + URL update (2 tests):**

- **Test:** should render all four client fields in the right panel after clicking a list item
  - **Status:** RED — `ClienteDetailView` not implemented; `data-testid="cliente-detail-panel"` not found
  - **Verifies:** AC1 — Nombre, NIT/RUC, Teléfono, Ciudad visible in right panel

- **Test:** should update URL to /clientes/:clienteId after clicking a list item without full page reload
  - **Status:** RED — routing to `clientes.$clienteId.tsx` not wired
  - **Verifies:** AC2 — URL update; no full page reload

**TC-E2-P1-06 — AC3: Deep link to known UUID (3 tests):**

- **Test:** should display the correct client details when navigating directly to /clientes/:clienteId
  - **Status:** RED — `clientes.$clienteId.tsx` route not implemented
  - **Verifies:** AC3 — deep link loads correct record

- **Test:** should show the matching client item highlighted/selected in the left panel on deep link
  - **Status:** RED — `aria-current="true"` logic not implemented
  - **Verifies:** AC3 — list item highlighted

- **Test:** should NOT redirect to root /clientes when using a valid deep link
  - **Status:** RED — route not implemented
  - **Verifies:** AC3 — no unintended redirect

**TC-E2-P1-07 — AC4: Non-existent ID graceful not-found (4 tests):**

- **Test:** should display "Cliente no encontrado." in the right panel for a non-existent ID
  - **Status:** RED — 404 handling not implemented; panel crashes or is blank
  - **Verifies:** AC4 — graceful Spanish message

- **Test:** should NOT produce JavaScript console errors when clienteId does not exist (R-007)
  - **Status:** RED — unhandled error likely causes JS console errors
  - **Verifies:** AC4 + R-007 mitigation — no JS errors

- **Test:** should still render the left panel (client list) when clienteId does not exist
  - **Status:** RED — panel likely blank/crashed
  - **Verifies:** AC4 — left panel unaffected

- **Test:** should NOT render the generic ErrorPanel for a 404 not-found response
  - **Status:** RED — error boundaries may show wrong state
  - **Verifies:** AC4 — 404 is a business condition, not a system failure

**AC9 — Default empty state (1 test):**

- **Test:** should render the default empty state in the right panel when no clienteId is in URL
  - **Status:** RED — right panel placeholder not replaced with `ClienteDetailView`
  - **Verifies:** AC9 — "Selecciona un cliente para ver sus detalles." shown

---

### API Contract Tests — 14 tests (AC7, AC8)

**File:** `e2e/tests/api/clientes-get-by-id.api.spec.ts` (new — created by this workflow)

**AC7 — GET /api/v1/clientes/{id} returns 200 + ClienteDto (9 tests):**

- **Test:** should return HTTP 200 when GET /api/v1/clientes/{id} is called with an existing id
  - **Status:** RED — endpoint does not exist (404)
  - **Verifies:** AC7 — HTTP 200 response

- **Test:** should return a ClienteDto JSON object (not an array) for an existing id
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — direct object response, not array or wrapper

- **Test:** should return ClienteDto with an "id" field matching the requested UUID
  - **Status:** RED — endpoint does not exist; R-008 mitigation
  - **Verifies:** AC7 + R-008 — UUID id, id matches requested value

- **Test:** should return ClienteDto with "nombre" field matching the seeded value
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — nombre field in DTO

- **Test:** should return ClienteDto with "nit" field matching the seeded value
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — nit field in DTO

- **Test:** should return ClienteDto with "telefono" field
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — telefono field in DTO

- **Test:** should return ClienteDto with "ciudad" field
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — ciudad field in DTO

- **Test:** should return ClienteDto with "createdAt" field in ISO 8601 format
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — createdAt as ISO 8601 DateTimeOffset with timezone

- **Test:** should return Content-Type application/json for a 200 response
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — correct Content-Type header

**AC8 + TC-E2-P2-06 — GET /api/v1/clientes/{id} returns 404 + Problem Details (5 tests):**

- **Test:** should return HTTP 404 when GET /api/v1/clientes/{id} record does not exist
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC8 + TC-E2-P2-06 — HTTP 404 response

- **Test:** should return Content-Type application/problem+json on 404
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC8 — Problem Details media type

- **Test:** should return a Problem Details RFC 7807 body on 404
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC8 — RFC 7807 body shape (status, title)

- **Test:** should NOT expose a stack trace in the 404 response body
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC8 + NFR6 — no stackTrace / exception fields exposed

- **Test:** should not return HTTP 200 for a non-existent UUID
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC8 — negative assertion on 200

---

### Component Tests — 15 tests (AC1, AC4, AC5, AC6, AC9)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (new — created by this workflow)

**AC9 — Default empty state (2 tests):**

- **Test:** should render the default empty state message when clienteId is undefined
  - **Status:** RED — `ClienteDetailView` module does not exist
  - **Verifies:** AC9 — "Selecciona un cliente para ver sus detalles." shown

- **Test:** should NOT trigger a network request when clienteId is undefined
  - **Status:** RED — module does not exist
  - **Verifies:** AC9 — enabled: !!id guard

**AC5 — Skeleton loading state (2 tests):**

- **Test:** should render skeleton rows (NOT a spinner) while loading
  - **Status:** RED — module does not exist; `data-testid="skeleton-row"` not found
  - **Verifies:** AC5 — react-loading-skeleton rows; no spinner

- **Test:** should set aria-busy="true" on the container while loading
  - **Status:** RED — module does not exist
  - **Verifies:** AC5 — accessibility during loading

**AC1 — All four fields rendered (6 tests):**

- **Test:** should render Nombre when data is returned
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — Nombre field

- **Test:** should render NIT/RUC when data is returned
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — NIT/RUC field

- **Test:** should render Teléfono when data is returned
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — Teléfono field

- **Test:** should render Ciudad when data is returned
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — Ciudad field

- **Test:** should render the detail panel with aria-label="Detalle del cliente"
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — accessible region label

- **Test:** should render all 4 field labels in Spanish
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — Spanish labels

**AC4 — Graceful not-found on 404 (3 tests):**

- **Test:** should render "Cliente no encontrado." when API returns 404
  - **Status:** RED — module does not exist
  - **Verifies:** AC4 — Spanish not-found message

- **Test:** should render not-found message with role="status"
  - **Status:** RED — module does not exist
  - **Verifies:** AC4 — accessibility role

- **Test:** should NOT render the ErrorPanel when API returns 404
  - **Status:** RED — module does not exist
  - **Verifies:** AC4 — 404 is not a system error (no ErrorPanel)

**AC6 — ErrorPanel on 5xx (4 tests):**

- **Test:** should render ErrorPanel when GET /api/v1/clientes/:id returns 500
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — ErrorPanel (role="alert") on 500

- **Test:** should render a "Reintentar" button inside ErrorPanel on 5xx
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — retry button present

- **Test:** should trigger a refetch when "Reintentar" is clicked
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — clicking retry triggers a second fetch

- **Test:** should NOT render not-found message when API returns 500
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — 500 shows ErrorPanel, not not-found message

---

### Hook Unit Tests — 6 tests (AC3, AC5, AC6)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts` (new — created by this workflow)

**AC3 — Hook fetches client data by id (2 tests):**

- **Test:** should return data from mocked GET /api/v1/clientes/:id
  - **Status:** RED — `useCliente.ts` module does not exist
  - **Verifies:** AC3 — hook fetches and returns correct data

- **Test:** should set isError to true when GET /api/v1/clientes/:id returns 500
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — hook exposes isError on 5xx

**AC5 — Hook disabled when id is undefined (2 tests):**

- **Test:** should NOT issue a fetch when id is undefined
  - **Status:** RED — module does not exist
  - **Verifies:** AC5 + AC9 — enabled: !!id guard (no fetch when undefined)

- **Test:** should NOT issue a fetch when id is an empty string
  - **Status:** RED — module does not exist
  - **Verifies:** AC5 — enabled: !!id guard (empty string is falsy)

**AC6 — Hook exposes refetch (1 test):**

- **Test:** should expose a refetch function
  - **Status:** RED — module does not exist
  - **Verifies:** AC6 — refetch is callable for retry

---

### Backend Unit Tests — 8 tests (AC7, AC8)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (new — created by this workflow)

**AC7 — Handler maps entity to ClienteDto (7 tests):**

- **Test:** Handle_WhenRepositoryReturnsEntity_ReturnsClienteDto
  - **Status:** RED — compile error: `GetClienteByIdQuery` and `GetClienteByIdQueryHandler` types do not exist
  - **Verifies:** AC7 — handler returns ClienteDto on success

- **Test:** Handle_WhenRepositoryReturnsEntity_MapsNombreCorrectly
  - **Status:** RED — compile error
  - **Verifies:** AC7 — Nombre mapping

- **Test:** Handle_WhenRepositoryReturnsEntity_MapsNitCorrectly
  - **Status:** RED — compile error
  - **Verifies:** AC7 — Nit mapping

- **Test:** Handle_WhenRepositoryReturnsEntity_MapsTelefonoCorrectly
  - **Status:** RED — compile error
  - **Verifies:** AC7 — Telefono mapping

- **Test:** Handle_WhenRepositoryReturnsEntity_MapsCiudadCorrectly
  - **Status:** RED — compile error
  - **Verifies:** AC7 — Ciudad mapping

- **Test:** Handle_WhenRepositoryReturnsEntity_MapsIdAsNonEmptyGuid
  - **Status:** RED — compile error; R-008 mitigation
  - **Verifies:** AC7 + R-008 — Id is non-empty GUID, not integer

- **Test:** Handle_WhenRepositoryReturnsEntity_MapsCreatedAtAsDateTimeOffset
  - **Status:** RED — compile error
  - **Verifies:** AC7 — CreatedAt as DateTimeOffset (company standard)

**AC8 — Handler returns null when entity not found (1 test):**

- **Test:** Handle_WhenRepositoryReturnsNull_ReturnsNull
  - **Status:** RED — compile error
  - **Verifies:** AC8 — handler returns null → endpoint returns 404

**Repository delegation (1 test):**

- **Test:** Handle_AlwaysCalls_GetByIdAsyncOnRepository
  - **Status:** RED — compile error
  - **Verifies:** AC7 — handler delegates to repository.GetByIdAsync exactly once

---

## Summary by Level

| Level | File | Tests | Status |
|-------|------|-------|--------|
| E2E (Playwright) | `e2e/tests/clientes/client-detail.spec.ts` | 9 | RED |
| API Contract (Playwright) | `e2e/tests/api/clientes-get-by-id.api.spec.ts` | 14 | RED |
| Component (Vitest+RTL) | `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` | 15 | RED |
| Hook Unit (Vitest) | `frontend/src/modules/crm/clientes/application/useCliente.test.ts` | 6 | RED |
| Backend Unit (xUnit) | `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` | 9 | RED |
| **Total** | | **53** | **RED** |

---

## Required data-testid Attributes

### `ClienteDetailView.tsx`

- `cliente-detail-panel` — The outer container `<section>` or `<div>` for the right panel.
  Must have `aria-label="Detalle del cliente"` and `role="region"`.
- `skeleton-row` — Each skeleton row (4 minimum: Nombre, NIT/RUC, Teléfono, Ciudad).
  Rendered only when `isLoading` is true.

### Accessibility (WCAG 2.1 AA)

- `role="region"` + `aria-label="Detalle del cliente"` on the detail panel container
- `aria-busy="true"` on the container while `isLoading` is true
- `role="status"` on the not-found message element (`<p role="status">Cliente no encontrado.</p>`)
- `role="alert"` on the `ErrorPanel` container (already implemented in `ErrorPanel.tsx`)

---

## Mock Requirements

### MSW Handler: GET /api/v1/clientes/:id

Used in component tests (`ClienteDetailView.test.tsx`) and hook tests (`useCliente.test.ts`).

**Success response (AC1, AC3, AC7):**
```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "nombre": "Acme Colombia SAS",
  "nit": "900123456-7",
  "telefono": "+57 601 234 5678",
  "ciudad": "Bogotá",
  "createdAt": "2026-01-10T10:00:00Z",
  "updatedAt": "2026-01-10T10:00:00Z"
}
```

**Not-found response (AC4, AC8):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente con id '00000000-...' no encontrado."
}
```
HTTP status: 404

**Server error response (AC6):**
```json
{ "error": "Internal Server Error" }
```
HTTP status: 500

---

## Implementation Checklist

### Backend Tasks (make API + unit tests green)

#### Tests: GetClienteByIdQueryHandler unit tests (AC7, AC8)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
  — record `GetClienteByIdQuery(Guid Id) : IRequest<ClienteDto?>`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  — injects `IClienteRepository`, calls `GetByIdAsync(query.Id)`, returns `ClienteDto` or null
- [ ] Verify `IClienteRepository.GetByIdAsync(Guid id, CancellationToken ct)` exists (confirmed in `IClienteRepository.cs`)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "GetClienteById"`
- [ ] ✅ Unit tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

#### Tests: GET /api/v1/clientes/{id} API contract tests (AC7, AC8)

**File:** `e2e/tests/api/clientes-get-by-id.api.spec.ts`

- [ ] Add `GET /api/v1/clientes/{id:guid}` endpoint in `ClienteEndpoints.cs`:
  ```csharp
  app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) => {
      var result = await mediator.Send(new GetClienteByIdQuery(id), ct);
      return result is null ? Results.NotFound() : Results.Ok(result);
  }).WithName("GetClienteById").WithTags("Clientes");
  ```
- [ ] Confirm `ExceptionHandlingMiddleware` produces `application/problem+json` for unhandled exceptions
- [ ] Confirm `Results.NotFound()` returns `application/problem+json` via ASP.NET Core Problem Details
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-get-by-id.api.spec.ts`
- [ ] ✅ API contract tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Frontend Tasks (make hook + component + E2E tests green)

#### Tests: useCliente hook unit tests (AC3, AC5, AC6)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
  ```typescript
  export function useCliente(id: string | undefined) {
    const { data, isLoading, isError, error, refetch } = useQuery({
      queryKey: ['clientes', id],
      queryFn: () => clienteApiRepository.getById(id!),
      enabled: !!id,
      staleTime: 0,
      retry: 1,
    });
    return { data, isLoading, isError, error, refetch };
  }
  ```
- [ ] Verify `clienteApiRepository.getById(id)` is implemented (confirmed in `clienteApiRepository.ts`)
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/application/useCliente.test.ts`
- [ ] ✅ Hook unit tests pass

**Estimated Effort:** 0.5 hours

---

#### Tests: ClienteDetailView component tests (AC1, AC4, AC5, AC6, AC9)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- [ ] Props: `{ clienteId: string | undefined }`
- [ ] Empty state (AC9): when `!clienteId`, render `"Selecciona un cliente para ver sus detalles."`
- [ ] Loading state (AC5): when `isLoading`, render skeleton rows with `data-testid="skeleton-row"` (4 rows);
  set `aria-busy="true"` on container; do NOT render a spinner
- [ ] Not-found (AC4): when `isError && isAxiosError(error) && error.response?.status === 404`,
  render `<p role="status">Cliente no encontrado.</p>`
- [ ] Error (AC6): when `isError` (5xx / network), render `<ErrorPanel onRetry={refetch} />`
- [ ] Success (AC1): when `data` exists, render 4 labeled fields using `<dl><dt/><dd/>` structure
- [ ] Container: `<section data-testid="cliente-detail-panel" role="region" aria-label="Detalle del cliente">`
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- [ ] ✅ Component tests pass

**Estimated Effort:** 2.5 hours

---

#### Tests: E2E client detail tests (AC1, AC2, AC3, AC4, AC9)

**File:** `e2e/tests/clientes/client-detail.spec.ts`

- [ ] Wire `<ClienteDetailView clienteId={selectedClienteId} />` into right panel of
  `frontend/src/routes/_app/clientes.tsx` (AC9, AC2)
- [ ] Create / update `frontend/src/routes/_app/clientes.$clienteId.tsx`:
  - Extract `clienteId` from `Route.useParams()`
  - Render split-panel: `<ClienteListView selectedClienteId={clienteId}>` (left) +
    `<ClienteDetailView clienteId={clienteId}>` (right)
  - `onClienteSelect`: `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })`
- [ ] Confirm `aria-current="true"` is set on selected `cliente-list-item` (for TC-E2-P1-06)
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-detail.spec.ts`
- [ ] ✅ E2E tests pass

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Backend unit tests (requires compilation)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "GetClienteById"

# API contract tests (requires backend running on port 5000)
npx playwright test e2e/tests/api/clientes-get-by-id.api.spec.ts

# Frontend hook unit tests
pnpm --filter frontend test src/modules/crm/clientes/application/useCliente.test.ts

# Frontend component tests
pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx

# E2E tests (requires frontend on 5173 + backend on 5000)
npx playwright test e2e/tests/clientes/client-detail.spec.ts

# Run ALL failing tests for this story
pnpm --filter frontend test && \
npx playwright test e2e/tests/api/clientes-get-by-id.api.spec.ts \
  e2e/tests/clientes/client-detail.spec.ts && \
dotnet test backend/tests/SiesaAgents.UnitTests/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ E2E tests written and failing (9 tests in `client-detail.spec.ts`)
- ✅ API contract tests written and failing (14 tests in `clientes-get-by-id.api.spec.ts`)
- ✅ Component tests written and failing (15 tests in `ClienteDetailView.test.tsx`)
- ✅ Hook unit tests written and failing (6 tests in `useCliente.test.ts`)
- ✅ Backend unit tests written and failing to compile (9 tests in `GetClienteByIdQueryHandlerTests.cs`)
- ✅ Network-first intercept pattern applied in all E2E tests
- ✅ MSW handlers configured for all component/hook test scenarios
- ✅ data-testid attributes documented for all UI elements
- ✅ Given-When-Then structure used throughout

**Expected failure modes:**

- **Component/hook failures:** `Cannot find module './ClienteDetailView'` and
  `Cannot find module './useCliente'` (modules do not exist)
- **Backend compile failures:** `GetClienteByIdQuery` and `GetClienteByIdQueryHandler`
  namespaces not found
- **API failures:** `404 Not Found` on `GET localhost:5000/api/v1/clientes/{id}`
  (endpoint does not exist)
- **E2E failures:** `Timeout: waiting for locator('[data-testid="cliente-detail-panel"]')`

---

### GREEN Phase (DEV Team — Next Steps)

**Recommended Implementation Order:**

1. **Backend** (unblocks API + unit tests):
   - `GetClienteByIdQuery.cs` → `GetClienteByIdQueryHandler.cs`
   - `ClienteEndpoints.cs` — add `GET /api/v1/clientes/{id:guid}`
2. **Frontend hook** (after backend endpoint is live):
   - `useCliente.ts` — TanStack Query hook with `enabled: !!id`
3. **Frontend component:**
   - `ClienteDetailView.tsx` — all states: empty, loading, error, 404, success
4. **Route wiring:**
   - `_app/clientes.tsx` — wire `ClienteDetailView` into right panel
   - `_app/clientes.$clienteId.tsx` — full split-panel with deep-link support

---

### REFACTOR Phase (After All Tests Pass)

1. Confirm TypeScript strict check: `npx tsc --noEmit` from `frontend/`
2. Run `dotnet build` — zero warnings/errors
3. Run full test suite: all 53 tests for Story 2.2 pass
4. Verify WCAG 2.1 AA compliance on all rendered states

---

## Risk Mitigations Addressed

| Risk | Mitigation | Verified By |
|------|-----------|-------------|
| R-007 — Deep link to non-existent ID crashes panel | `isAxiosError(error) && error.response?.status === 404` → graceful Spanish message | TC-E2-P1-07 (E2E), AC4 component tests |
| R-008 — Backend returns integer PK instead of UUID | API test asserts `id` matches UUID v4 regex and matches requested UUID | `clientes-get-by-id.api.spec.ts` |

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests apply `page.route(...)` BEFORE `page.goto()`
- **selector-resilience.md** — All selectors use `data-testid` or ARIA roles (no fragile CSS)
- **component-tdd.md** — Component tests use MSW; `QueryClientProvider` wrapper; Given-When-Then
- **test-quality.md** — Explicit async waits (`findBy*`); `afterEach` cleanup; no hard waits
- **test-levels-framework.md** — AC7/AC8 at API + Unit; AC1/AC4/AC5/AC6/AC9 at Component;
  TC-E2-P1-05/06/07 at E2E

---

**Generated by**: BMad TEA Agent — Test Architect Module (ATDD workflow)
**Story:** 2.2 — Client Detail View
**Epic:** 2 — Client Management
**Date:** 2026-05-24
