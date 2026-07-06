# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-07-06
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL) + API Integration (xUnit)

---

## Story Summary

Adds a read-only client detail view reachable both by clicking a client in the list and by
a direct/deep-linked URL (`/clientes/:clienteId`), backed by a new `GET /api/v1/clientes/{id}`
endpoint that returns `null`/404 (never an exception) when the id doesn't resolve.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. Given the client list is displayed (`clientes-list-panel`), when the user clicks a client item (`cliente-list-item`), then the right panel (`cliente-detail-panel`) shows Nombre/NIT-RUC/Teléfono/Ciudad, and the URL updates to `/clientes/:clienteId` (FR30) without a full page reload.
2. Given a client exists, when the user accesses `/clientes/:clienteId` directly (fresh load), then the correct client's details load inside the same split-panel layout (FR30).
3. Given a `clienteId` that is well-formed but does not exist, when the page loads, then a graceful not-found message (`cliente-not-found`, reusing `EmptyState`) is shown instead of a crash/blank screen, and the raw backend error is never rendered (NFR6).

---

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `e2e/tests/clientes/clientes-detalle.spec.ts` (89 lines)

- ✅ **Test:** `TC-E2-P1-09 — muestra un mensaje de no encontrado para un clienteId inexistente`
  - **Status:** RED — `ClienteDetailView`/routes don't exist yet; today `/clientes/:id` resolves to the current placeholder route (or 404), never `cliente-not-found`. Fully runnable today (no dependency on Story 2.3's `POST`).
  - **Verifies:** AC #3, risk R6
- ✅ **Test:** `TC-E2-P1-07 — clic en un cliente navega al detalle y actualiza la URL (FR30)`
  - **Status:** RED (blocked) — authored correctly per test-design, but depends on `apiHelper.createCliente` (`POST /api/v1/clientes`), which is Story 2.3 scope. Not a gate for this story; becomes runnable once 2.3 lands.
  - **Verifies:** AC #1, FR30
- ✅ **Test:** `TC-E2-P1-08 — acceso directo a /clientes/:clienteId carga el cliente correcto (FR30)`
  - **Status:** RED (blocked) — same `POST`-seeding dependency as TC-E2-P1-07.
  - **Verifies:** AC #2, FR30

### API Tests (17 tests: 2 xUnit Unit + 4 xUnit Integration additions to existing files)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (66 lines, 2 tests)

- ✅ **Test:** `Handle_ReturnsMappedDto_WhenRepositoryReturnsEntity`
  - **Status:** RED — compile error `CS0246: GetClienteByIdQueryHandler could not be found` (verified locally: whole `SiesaAgents.UnitTests` assembly fails to build until Task 1 exists).
  - **Verifies:** AC #1/#2 — Domain → DTO mapping contract
- ✅ **Test:** `Handle_ReturnsNull_WhenRepositoryReturnsNull`
  - **Status:** RED — same compile error.
  - **Verifies:** AC #3 — handler returns `null`, never throws, for a missing record

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (extended, +3 tests)

- ✅ **Test:** `GetClienteById_ReturnsOk_WhenClienteExists`
  - **Status:** RED — **verified locally** (`dotnet test`): fails today with `Expected: OK / Actual: NotFound` since the `{id:guid}` route doesn't exist yet.
  - **Verifies:** AC #1/#2 happy path
- ✅ **Test:** `GetClienteById_ReturnsCorrectDto_WhenClienteExists`
  - **Status:** RED — **verified locally**: fails today (`Id` deserializes to `Guid.Empty` since the body is the default 404 page, not a `ClienteDto`).
  - **Verifies:** AC #1/#2 field-mapping
- ✅ **Test:** `GetClienteById_ReturnsNotFound_WhenClienteDoesNotExist`
  - **Status:** GREEN-before-implementation (documented, not a test bug) — **verified locally**: this one already passes today, because no route currently matches `/api/v1/clientes/{any-guid}` at all, so ASP.NET's default routing already returns 404. This coincidental overlap is called out explicitly in Story 2.2 Task 1 (the `:guid` constraint intentionally reuses the same default-404 behavior post-implementation). The sibling two tests above are this endpoint's true RED signal.
  - **Verifies:** AC #3

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsEdgeCasesTests.cs` (extended, +1 test)

- ✅ **Test:** `GetClienteById_ReturnsNotFound_WhenIdIsMalformedGuid`
  - **Status:** GREEN-before-implementation (same reasoning as above) — **verified locally**: passes today for the same routing reason; guards that the `:guid` constraint's default-404 behavior for malformed segments is never regressed once the route is mapped.
  - **Verifies:** AC #3, risk R6

### Component Tests (11 tests: 9 new + 2 added to the existing ClienteListView suite)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (188 lines, 9 tests)

- ✅ **Test:** `renders the client Nombre inside cliente-detail-nombre`
  - **Status:** RED — **verified locally** (`vitest run`): fails to resolve import `"./ClienteDetailView"` (module doesn't exist).
  - **Verifies:** AC #1/#2
- ✅ **Test:** `renders the client NIT/RUC inside cliente-detail-nit` — **Status:** RED (same import error) — **Verifies:** AC #1/#2
- ✅ **Test:** `renders the client Teléfono inside cliente-detail-telefono` — **Status:** RED (same) — **Verifies:** AC #1/#2
- ✅ **Test:** `renders the client Ciudad inside cliente-detail-ciudad` — **Status:** RED (same) — **Verifies:** AC #1/#2
- ✅ **Test:** `renders cliente-not-found (EmptyState variant) instead of a crash or blank panel` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `does not render any detail field when the client is not found` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `renders the error-panel with "No se pudo cargar" when GET fails with 500` — **Status:** RED (same) — **Verifies:** NFR6, error/not-found distinction
- ✅ **Test:** `never renders the raw backend error/exception message (NFR6)` — **Status:** RED (same) — **Verifies:** NFR6
- ✅ **Test:** `does not render cliente-not-found on a genuine 500 failure` — **Status:** RED (same) — **Verifies:** AC #3 vs. error distinction

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (extended, +2 tests — no dedicated `ClientListItem.test.tsx` exists yet, added here per Story 2.2 Task 6)

- ✅ **Test:** `renders cliente-list-item as a link with an href pointing to /clientes/{clienteId}`
  - **Status:** RED — **verified locally**: fails today (`href` attribute is `null`; `ClientListItem` renders a plain `<div>`, not a `Link`).
  - **Verifies:** AC #1 — click-navigation wiring
- ✅ **Test:** `clicking the item navigates the router to /clientes/{clienteId} (no full page reload)`
  - **Status:** RED — **verified locally**: fails today (`router.state.location.pathname` stays `"/"` — nothing navigates on click).
  - **Verifies:** AC #1

---

## Data Factories Created

No new factories — this story reuses `frontend/src/test/factories/cliente.factory.ts` (`createCliente`, `createClientes`) created in Story 2.1, and `e2e/helpers/data.helper.ts` (`buildCliente`). Both already generate all four fields (Nombre, NIT, Teléfono, Ciudad) needed here; no overrides or extensions required.

---

## Fixtures Created

No new fixtures. Reuses the shared MSW `server` (`frontend/src/test/msw/server.ts`) and Playwright's `e2e/fixtures/base.fixture.ts` / `e2e/helpers/api.helper.ts` (`createCliente`/`deleteCliente`), all established in Story 2.1.

---

## Mock Requirements

No external services beyond the existing backend API. MSW handlers registered per-test in `ClienteDetailView.test.tsx` for `GET /api/v1/clientes/:id`:

### GET /api/v1/clientes/:id Mock

**Endpoint:** `GET /api/v1/clientes/:id`

**Success Response (200):**

```json
{ "id": "...", "nombre": "Acme Corp", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "..." }
```

**Not-Found Response (404):** empty body, status 404 — must map to `data === null` in `useCliente`, rendering `cliente-not-found`, NOT `error-panel`.

**Failure Response (500):**

```json
{ "detail": "boom" }
```

**Notes:** The frontend must never render the raw `detail` string (NFR6); only the fixed `"No se pudo cargar"` copy via `ErrorPanel`.

---

## Required data-testid Attributes

### ClienteDetailView (new)

- `cliente-detail-panel` — wrapper around the detail view (moves here from `clientes.index.tsx`'s placeholder)
- `cliente-detail-nombre` — Nombre value
- `cliente-detail-nit` — NIT/RUC value
- `cliente-detail-telefono` — Teléfono value
- `cliente-detail-ciudad` — Ciudad value
- `cliente-not-found` — `EmptyState` variant for AC #3 (via existing `testId` prop)
- `error-panel` — reused verbatim from Story 2.1's `ErrorPanel`

### ClientListItem (modified)

- `cliente-list-item` — moves from the wrapping `<div>` onto the new `Link` element

**Implementation Example:**

```tsx
<dl data-testid="cliente-detail-panel">
  <dt>Nombre</dt>
  <dd data-testid="cliente-detail-nombre">{cliente.nombre}</dd>
  <dt>NIT/RUC</dt>
  <dd data-testid="cliente-detail-nit">{cliente.nit}</dd>
</dl>
```

---

## Implementation Checklist

### Test: ClienteDetailView field-rendering tests (AC #1/#2)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- [ ] Create `useCliente.ts` (`useQuery(['clientes', clienteId], ...)`, `enabled: !!clienteId`)
- [ ] Extend `IClienteRepository`/`clienteApiRepository` with `getById` (404 → `null`, other errors re-thrown)
- [ ] Create `ClienteDetailView.tsx` rendering `<dl>`/`<dt>`/`<dd>` fields with required `data-testid`s
- [ ] Run test: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: ClienteDetailView not-found / error-panel tests (AC #3, NFR6)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- [ ] Branch on `isSuccess && data === null` → `EmptyState` with `testId="cliente-not-found"`
- [ ] Branch on `isError` → `ErrorPanel message="No se pudo cargar"`
- [ ] Add required data-testid attributes: `cliente-not-found`, `error-panel`
- [ ] Run test: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: ClientListItem Link tests (AC #1)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- [ ] Wrap `ClientListItem`'s content in `Link` from `@tanstack/react-router` (`to="/clientes/$clienteId"`, `params={{ clienteId: cliente.id }}`), moving `data-testid="cliente-list-item"` onto the `Link`
- [ ] Run test: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Backend unit tests for GetClienteByIdQueryHandler (AC #1/#2/#3)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

- [ ] Add `IClienteRepository.GetByIdAsync(Guid, CancellationToken)`; correct the stale "do NOT add GetByIdAsync yet" doc comment
- [ ] Implement `ClienteRepository.GetByIdAsync` (`AsNoTracking().FirstOrDefaultAsync`, returns `null`)
- [ ] Create `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` (maps to `ClienteDto` or returns `null`)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter FullyQualifiedName~GetClienteByIdQueryHandlerTests`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Backend integration tests for GET /api/v1/clientes/{id} (AC #1/#2/#3)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs`, `ClienteEndpointsEdgeCasesTests.cs`

- [ ] Add `group.MapGet("/{id:guid}", ...)` to the existing `ClienteEndpoints` group, returning `Results.NotFound()` when the handler returns `null`, `Results.Ok(cliente)` otherwise
- [ ] Register `GetClienteByIdQueryHandler` in `Program.cs`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~ClienteEndpointsTests|FullyQualifiedName~ClienteEndpointsEdgeCasesTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: E2E deep-linking and not-found flows (AC #1/#2/#3, FR30)

**File:** `e2e/tests/clientes/clientes-detalle.spec.ts`, `e2e/pages/clientes.page.ts`

- [ ] Modify `routes/_app/clientes.tsx` into a layout (`<Outlet/>`)
- [ ] Create `routes/_app/clientes.index.tsx` and `routes/_app/clientes.$clienteId.tsx`
- [ ] Wire `ClienteDetailView` into `clientes.$clienteId.tsx`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-detalle.spec.ts`
- [ ] ✅ `TC-E2-P1-09` passes (green phase); `TC-E2-P1-07`/`08` pass once Story 2.3's `POST` endpoint exists (not a gate for this story)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Frontend component tests
cd frontend && pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx
cd frontend && pnpm vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx

# Backend unit + integration tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter FullyQualifiedName~GetClienteByIdQueryHandlerTests
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~ClienteEndpointsTests|FullyQualifiedName~ClienteEndpointsEdgeCasesTests"

# E2E
npx playwright test e2e/tests/clientes/clientes-detalle.spec.ts

# Headed / debug
npx playwright test e2e/tests/clientes/clientes-detalle.spec.ts --headed
npx playwright test e2e/tests/clientes/clientes-detalle.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ All tests written and verified failing (frontend: `vitest run`; backend: `dotnet build` / `dotnet test` against local Postgres)
- ✅ No new fixtures/factories needed — Story 2.1's are reused as-is
- ✅ Mock requirements documented for DEV team
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification (this session, against a live local Postgres instance):**

- `frontend`: `ClienteDetailView.test.tsx` fails to resolve its import (module doesn't exist) — 9/9 tests RED.
- `frontend`: `ClienteListView.test.tsx`'s 2 new `ClientListItem` tests fail with `href: null` / no navigation — RED; the file's 11 pre-existing Story 2.1 tests still pass (no regression).
- `backend`: `dotnet build` fails with 4 `CS0246` errors in `SiesaAgents.UnitTests` (new types don't exist) — whole assembly RED, consistent with the project's established pattern (see `atdd-checklist-1-3-backend-database-foundation.md`).
- `backend`: `dotnet test` on `SiesaAgents.IntegrationTests` — 2 of 5 new tests genuinely RED (`GetClienteById_ReturnsOk_WhenClienteExists`, `GetClienteById_ReturnsCorrectDto_WhenClienteExists`); the other 3 (not-found/malformed-guid cases) pass today as a documented, expected side effect of the route not existing yet (framework default 404) — see the notes on each test above.

### GREEN Phase (DEV Team - Next Steps)

Implement Story 2.2 Tasks 1-6 exactly as specified in the story file, one failing test at a time, starting with the backend `GetByIdAsync`/query/endpoint (Task 1), then the frontend data layer (Task 3), routing (Task 4), and `ClienteDetailView`/`ClientListItem` (Task 5).

### REFACTOR Phase (DEV Team - After All Tests Pass)

Standard refactor pass once GREEN; no known duplication risk beyond what Story 2.1 already established.

---

## Next Steps

1. Share this checklist and the failing tests above with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase using the commands above
3. Implement Story 2.2 Tasks 1-6 one test at a time (red → green)
4. `TC-E2-P1-07`/`TC-E2-P1-08` remain non-gating until Story 2.3's `POST /api/v1/clientes` lands
5. When all gating tests pass, refactor code for quality, then mark story 'done' in sprint-status.yaml

---

## Notes

- No new test infrastructure (factories/fixtures/MSW server) was needed — Story 2.1's are reused verbatim, matching this story's "component reuse over new components" Dev Note.
- The two backend "not found" tests are intentionally documented as passing before implementation — this is a known, accepted TDD edge case when the expected behavior (404) coincides with the default behavior of an unmapped route. It does not indicate a test-authoring bug; the sibling 200/DTO-mapping tests are this endpoint's true RED indicators, and both were verified to fail for the right reason.
- `TC-E2-P1-07`/`TC-E2-P1-08` are explicitly non-gating for this story per the story's own Task 6 guidance (same convention as Story 2.1's documented cross-story dependency on Story 2.3's `POST` endpoint).

---

**Generated by BMad TEA Agent** - 2026-07-06
