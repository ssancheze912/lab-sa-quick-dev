# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) — detail rendering/loading/not-found/empty states; Routing (Vitest + real TanStack Router tree) for deep-linking/navigation; E2E (Playwright) for the two P1 full-stack scenarios per test-design-epic-2.md

---

## Story Summary

As a commercial team member, I want to view the complete details of a client by selecting them from the list, so that I can review all their information without navigating away from the clients section.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`. **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).
2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (no prior in-app navigation), **Then** the correct client details are loaded and displayed (FR30, TC-E2-P1-06).
3. **Given** a `clienteId` in the URL does not exist, **When** the page loads, **Then** a graceful not-found message is displayed — no blank page, no unhandled JS error, no console error (TC-E2-P1-07).
4. **Given** the client list is displayed and no client is selected, **When** the user has not clicked any client item, **Then** the right panel shows an empty/default state.

---

## Test Framework Note

This project uses **Vitest + React Testing Library + MSW** for component/routing-level coverage and **Playwright** for the two P1 full-stack E2E scenarios (per test-design-epic-2.md §4, TC-E2-P1-06/07). Backend `GetByIdAsync`/`GET /api/v1/clientes/{id}` coverage is xUnit integration tests (Task 5 of the story), mirroring Story 2.1's split: ATDD covers both the frontend-observable behavior AND the backend contract, since Story 2.2 introduces a new endpoint (unlike 2.1's list-only scope which had backend tests written directly by DEV).

**Test infrastructure extended in this ATDD pass** (did not exist before):

- `frontend/src/test/msw/handlers.ts` — added `CLIENTE_BY_ID_ENDPOINT` (`*/api/v1/clientes/:id`) default 200 handler + `clienteNotFoundProblemDetails` (RFC 7807 fixture for the 404 case), reusing the existing `createCliente` factory (no new factory needed — `Cliente` shape is unchanged)
- `frontend/src/routes/-navigation-shell.routing.test.tsx` — extended with a `beforeEach(() => queryClient.clear())` scoped to the new "Story 2.2" describe block only, so per-test MSW fixtures aren't masked by the app's real singleton `queryClient`'s 60s `staleTime` cache bleeding across tests (pre-existing AC3/AC4/AC5 tests in this file are unaffected — verified, all 7 still pass)
- `e2e/pages/clientes.page.ts` — added `detailEmptyState`, `detailNotFound`, `detailLoading` locators and a `gotoDetail(clienteId)` navigation helper

---

## Failing Tests Created (RED Phase)

### Component Tests (13 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx` (new, 199 lines)

- **AC #1/#2 — success state (Nombre, NIT/RUC, Teléfono, Ciudad)**
  - `should display the Nombre label and value` — RED: `ClienteDetailView.tsx` does not exist
  - `should display the NIT/RUC label and value` — RED: module not found
  - `should display the Teléfono label and value` — RED: module not found
  - `should display the Ciudad label and value` — RED: module not found
  - `should render field labels in Spanish` — RED: module not found
  - `should render the detail panel inside a data-testid="cliente-detail-panel" container` — RED: module not found
- **AC #1/#2 — loading state**
  - `should render skeleton placeholders while useCliente is loading` — RED: module not found (`cliente-detail-loading` testid does not exist)
- **AC #3 — graceful not-found state**
  - `should render a not-found message when the query resolves with a 404` — RED: module not found
  - `should NOT render raw error text or technical details on 404 (NFR6)` — RED: module not found
  - `should NOT render the field labels in the not-found state` — RED: module not found
- **AC #4 — empty/default "no client selected" state**
  - `should render a "no client selected" guidance message when clienteId is undefined` — RED: module not found
  - `should show Spanish guidance copy in the empty/default state` — RED: module not found
  - `should NOT trigger a fetch when clienteId is undefined (useCliente enabled: !!id)` — RED: module not found

### Routing Tests (6 tests)

**File:** `frontend/src/routes/-navigation-shell.routing.test.tsx` (extended, new "Story 2.2 - Client Detail View routing" describe block) — uses the real `routeTree.gen.ts` + `RouterProvider`, so these tests exercise the actual file-based route once created (Task 4), not an isolated harness.

- **AC #1 — click navigates + updates URL**
  - `should navigate to /clientes/:clienteId and update the URL when a client item is clicked` — RED: `window.location.pathname` stays `/` (no route/wiring exists yet)
  - `should mark the clicked client as selected via the route param (aria-selected)` — RED: `aria-selected` never flips to `"true"` (no navigation wiring)
  - `should render the complete client details in the right panel after selection` — RED: `cliente-detail-panel` testid not found
- **AC #2 — direct deep link**
  - `should load and display the correct client when navigating directly to /clientes/:clienteId` — RED: text not found (route does not exist, `ClienteListView` renders alone at any path)
- **AC #3 — non-existent clienteId**
  - `should render a graceful not-found message for a well-formed but non-existent clienteId` — RED: `cliente-not-found` testid not found
- **AC #4 — empty/default state**
  - `should show the "no client selected" state on the base /clientes route` — RED: `cliente-detail-empty` testid not found

### Backend xUnit Tests (6 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Repositories/ClienteRepositoryTests.cs` (extended, 2 new tests)

- `GetByIdAsync_WithExistingId_ReturnsTheMatchingEntity` — RED: compile error, `ClienteRepository` has no `GetByIdAsync` member
- `GetByIdAsync_WithNonExistentId_ReturnsNull` — RED: compile error (same cause)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` (extended, 4 new tests)

- `GetClienteById_WithExistingId_ReturnsOk` — RED: endpoint `GET /api/v1/clientes/{id:guid}` does not exist (404/405 from routing, or blocked by the sibling compile error above)
- `GetClienteById_WithExistingId_ReturnsTheCorrectClienteDto` — RED: same cause
- `GetClienteById_WithNonExistentId_ReturnsNotFound` — RED: same cause
- `GetClienteById_WithNonExistentId_ReturnsProblemDetailsWithoutStackTrace` — RED: same cause

### E2E Tests (5 tests × 4 browser projects = 20 runnable entries)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts` (new, 105 lines) — TC-E2-P1-06 and TC-E2-P1-07 (test-design-epic-2.md, risk R7), using real seeded data via `ApiHelper` (full-stack path, not mocked network).

- `TC-E2-P1-06 — should load and display the correct client when navigating directly to /clientes/:clienteId` — RED: `cliente-detail-panel` does not exist
- `TC-E2-P1-06 — should not redirect to /clientes root when deep-linking to an existing client` — RED: route does not exist, URL will not match
- `TC-E2-P1-07 — should show a graceful not-found UI for a well-formed but non-existent clienteId` — RED: `cliente-not-found` testid does not exist
- `TC-E2-P1-07 — should log zero console errors when the clienteId does not exist` — RED: same cause (also currently unverifiable since the route 404s at the router level today)
- `AC #4 — should show the empty/default state on /clientes when no client is selected` — RED: `cliente-detail-empty` testid does not exist

**Verification (RED phase confirmed):**

```
$ pnpm --filter frontend test
 FAIL  ClienteDetailView.test.tsx — Failed to resolve import "./ClienteDetailView" (module not found)
 FAIL  -navigation-shell.routing.test.tsx — 6 new "Story 2.2" tests fail (pathname stays '/', testids not found)
 Test Files  2 failed | 6 passed (8)
      Tests  6 failed | 58 passed (64)   ← 58 pre-existing tests unaffected (zero regressions)
      (+13 tests in ClienteDetailView.test.tsx fail at collection time — file-level import error)

$ dotnet build (backend/SiesaAgents.sln)
 error CS1061: 'ClienteRepository' does not contain a definition for 'GetByIdAsync' (x2)
 Build FAILED — 2 compile errors, both traced to the new Story 2.2 repository tests

$ npx tsc --noEmit -p frontend/tsconfig.app.json
 1 error: Cannot find module './ClienteDetailView' — the only type error, no collateral damage

$ npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --list
 20 tests in 1 file (5 tests × 4 browser projects) — discoverable, will fail at runtime
 against the current app (route /clientes/:clienteId does not exist, all requests 404 at router level)
```

All failures trace to missing implementation (`ClienteDetailView.tsx`, `useCliente.ts`, `IClienteRepository.getById`, `clientes.$clienteId.tsx` route, backend `GetByIdAsync`/`GET /api/v1/clientes/{id}`), not test defects.

---

## Data Factories

No new factory needed — `frontend/src/test/factories/cliente.factory.ts`'s existing `createCliente(overrides?)` (Story 2.1) already produces a complete, valid `Cliente` object with all four required fields (`nombre`, `nit`, `telefono`, `ciudad`). Reused as-is throughout every new test.

---

## Fixtures / Infrastructure Extended

### MSW Handlers (Component/Routing tests)

**File:** `frontend/src/test/msw/handlers.ts`

- `CLIENTE_BY_ID_ENDPOINT` (`*/api/v1/clientes/:id`) — default success handler (returns a `createCliente()` with the requested `:id` param echoed back); tests override per-scenario via `server.use(http.get(CLIENTE_BY_ID_ENDPOINT, ...))` **before** `renderWithRouter`/`renderAppAt` triggers the mount-time fetch (network-first pattern)
- `clienteNotFoundProblemDetails` — fixed RFC 7807 Problem Details object (`type`, `title: 'Not Found'`, `status: 404`, `detail`) used for every 404-path test, matching the backend's Task 1 contract

### Shared queryClient cache isolation (Routing tests)

**File:** `frontend/src/routes/-navigation-shell.routing.test.tsx`

- `beforeEach(() => queryClient.clear())`, scoped to the "Story 2.2 - Client Detail View routing" describe block, prevents the app's real singleton `queryClient` (60s `staleTime`, shared across all tests using `renderAppAt` in this file) from serving a previous test's cached `['clientes']`/`['clientes', id]` data instead of the current test's MSW fixture

---

## Mock Requirements

### GET /api/v1/clientes/:id Mock

**Endpoint:** `GET /api/v1/clientes/:id`

**Success Response (200):**

```json
{ "id": "uuid", "nombre": "Comercializadora Andina SAS", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-06-01T10:00:00.000Z" }
```

**Not-Found Response (404, RFC 7807 Problem Details, AC #3):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente no encontrado."
}
```

**Notes:** The frontend MUST NOT render any Problem Details field (`type`/`title`/`status`/`detail`) or backend-provided text under any circumstance (NFR6) — the not-found block shows only fixed Spanish copy. The backend response itself must also carry zero stack trace / exception type strings (verified by `GetClienteById_WithNonExistentId_ReturnsProblemDetailsWithoutStackTrace`).

---

## Required data-testid Attributes

### `/clientes/:clienteId` route (`ClienteDetailView`)

- `cliente-detail-panel` — success-state container, rendered when `useCliente(clienteId)` resolves with data; must show `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad` values as visible text
- `cliente-detail-loading` — skeleton loading container (react-loading-skeleton), shown while `useCliente(clienteId)` is `isLoading`
- `cliente-not-found` — graceful not-found block, shown when the query's error indicates a 404 (AC #3); must NOT render raw Problem Details text
- `cliente-detail-empty` — empty/default "no client selected" block (AC #4), shown when no `clienteId` route param is present; distinct from `cliente-not-found` and from Story 2.1's `empty-state-no-clients`/`empty-state-search-empty`

**Implementation Example:**

```tsx
{!clienteId && <div data-testid="cliente-detail-empty">Selecciona un cliente para ver el detalle</div>}
{clienteId && isLoading && <div data-testid="cliente-detail-loading"><Skeleton count={4} /></div>}
{clienteId && isNotFoundError && <div data-testid="cliente-not-found">Cliente no encontrado</div>}
{clienteId && data && (
  <div data-testid="cliente-detail-panel">
    <p>Nombre</p><p>{data.nombre}</p>
    <p>NIT/RUC</p><p>{data.nit}</p>
    <p>Teléfono</p><p>{data.telefono}</p>
    <p>Ciudad</p><p>{data.ciudad}</p>
  </div>
)}
```

---

## Implementation Checklist

### Test: ClienteRepositoryTests.cs + ClienteEndpointsTests.cs (AC #1, #2, #3 — backend)

**Files:** `backend/tests/SiesaAgents.IntegrationTests/Repositories/ClienteRepositoryTests.cs`, `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs`

**Tasks to make these tests pass:**

- [ ] Add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository`
- [ ] Implement `GetByIdAsync` in `ClienteRepository` using `FirstOrDefaultAsync`, returning `null` on no match (no exception)
- [ ] Create `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` (CQRS, mirrors `GetClientesQuery`), mapping to the existing `ClienteDto`
- [ ] Add `GET /api/v1/clientes/{id:guid}` to `ClienteEndpoints.cs` — 200 + `ClienteDto` on found, 404 + Problem Details (no stack trace) on `null`
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~ClienteRepositoryTests|FullyQualifiedName~ClienteEndpointsTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: ClienteDetailView.test.tsx (AC #1, #2, #3, #4 — frontend component)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `getById(id): Promise<Cliente>` to `IClienteRepository.ts` + `clienteApiRepository.ts` (let 404 propagate as a rejected promise)
- [ ] Create `useCliente.ts` — `queryKey: ['clientes', id]`, `enabled: !!id`
- [ ] Create `ClienteDetailView.tsx` accepting a `clienteId?: string` prop — renders empty/loading/not-found/success states per the data-testid contract above
- [ ] Add required data-testid attributes: `cliente-detail-panel`, `cliente-detail-loading`, `cliente-not-found`, `cliente-detail-empty`
- [ ] Run: `pnpm --filter frontend test -- src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: -navigation-shell.routing.test.tsx "Story 2.2" block (AC #1, #2, #3, #4 — routing)

**File:** `frontend/src/routes/-navigation-shell.routing.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` rendering the split-panel layout (`ClienteListView` + `ClienteDetailView`), passing the route's `clienteId` param
- [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `ClienteListView` + `ClienteDetailView` (no `clienteId`, triggers AC #4 empty state) using the same split-panel composition
- [ ] Wire `ClientListItem`'s existing `onClick` prop in `ClienteListView.tsx` to `useNavigate()` → `/clientes/:clienteId`; pass `selected={cliente.id === clienteId}` from the route param
- [ ] Run: `pnpm --filter frontend test -- src/routes/-navigation-shell.routing.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours (depends on `ClienteDetailView.tsx` above existing first)

---

### Test: e2e/tests/clientes/client-detail-view.spec.ts (TC-E2-P1-06, TC-E2-P1-07 — full stack)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm all data-testid attributes above are present in the real DOM (not just isolated component tests)
- [ ] Confirm the backend endpoint from Task 1 is deployed/running against the E2E environment
- [ ] Run: `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (mostly wiring verification, once component/routing/backend work above is done)

---

## Running Tests

```bash
# Run all failing tests for this story (frontend component + routing)
pnpm --filter frontend test -- src/modules/crm/clientes src/routes/-navigation-shell.routing.test.tsx

# Run specific test file
pnpm --filter frontend test -- src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx

# Run in watch mode
pnpm --filter frontend test:watch

# Backend tests
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~Cliente"

# Run E2E tests for this story
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts

# Run E2E in headed mode
npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --headed

# Run full frontend suite (regression check)
pnpm --filter frontend test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 13 component tests + 6 routing tests + 6 backend xUnit tests + 5 E2E tests (20 runnable across browsers) written and failing
- ✅ MSW handlers extended (`CLIENTE_BY_ID_ENDPOINT`, `clienteNotFoundProblemDetails`)
- ✅ `queryClient.clear()` isolation added to prevent cache bleed in the shared-router routing tests
- ✅ `ClientesPage` Page Object extended (`gotoDetail`, detail locators)
- ✅ Mock requirements documented (200/404 Problem Details)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- `pnpm --filter frontend test` → 6 new routing tests + 13 new component tests fail (missing route wiring / missing `ClienteDetailView` module); all 58 pre-existing tests still pass (zero regressions)
- `dotnet build` (backend) → fails with 2 compile errors, both traced to the new `GetByIdAsync` calls (expected — no other errors introduced)
- `npx tsc --noEmit -p frontend/tsconfig.app.json` → only the expected "Cannot find module './ClienteDetailView'" error
- `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts --list` → 20 tests (5 × 4 browser projects) discovered successfully

---

### GREEN Phase (DEV Team - Next Steps)

1. Pick one failing test from the Implementation Checklist above — start with the backend (`GetByIdAsync`/endpoint), since the frontend hook/component depend on it
2. Implement minimal code to make it pass (Tasks 1-4 of the story file)
3. Run the test to verify green
4. Move to the next test (backend → `useCliente`/`ClienteDetailView` → routing wiring → E2E)
5. Repeat until all tests pass

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all new tests pass (6 backend + 13 component + 6 routing + 5 E2E scenarios) alongside the 58 pre-existing frontend tests
2. Review `ClienteDetailView.tsx` for readability/duplication with the upcoming Story 2.4 (Edit) which will extend the same detail panel
3. Ensure tests still pass after each refactor
4. Confirm `dotnet test` and `pnpm test` both pass with zero failures before marking the story done

---

## Next Steps

1. Share this checklist and the failing test files with the dev-story workflow (manual handoff)
2. Implement one test at a time (RED → GREEN), starting with the backend `GetByIdAsync`/endpoint
3. Run `pnpm --filter frontend test`, `dotnet test`, and `npx playwright test e2e/tests/clientes/client-detail-view.spec.ts` frequently
4. When all tests pass, refactor with confidence
5. Update story status to reflect dev-story completion

---

## Knowledge Base References Applied

- **data-factories.md** — reused Story 2.1's `createCliente` factory (no new factory needed, same entity shape)
- **network-first.md** — MSW handlers registered via `server.use()` before `renderWithRouter`/`renderAppAt`; `page.route`/real backend seeding before `page.goto` in E2E
- **component-tdd.md** — provider isolation (fresh `QueryClient` per component test via `renderWithRouter`'s `withQueryClient`), Red-Green-Refactor structure
- **test-quality.md** — one behavior per test, Given-When-Then comments, `data-testid` selectors only, no hard waits (`findBy*`/`waitFor` throughout)
- **test-levels-framework.md** — Component (Vitest+RTL) for detail-state rendering, Routing (real router tree) for navigation/deep-linking, E2E reserved for the two P1 full-stack scenarios (TC-E2-P1-06/07) per test-design-epic-2.md
- **timing-debugging.md** — `queryClient.clear()` in `beforeEach` to eliminate cross-test cache race conditions in the shared-router routing suite

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm --filter frontend test`

**Results:**

```
 FAIL  src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx
   Error: Failed to resolve import "./ClienteDetailView" — Does the file exist?
 FAIL  src/routes/-navigation-shell.routing.test.tsx (13 tests | 6 failed)
   × should navigate to /clientes/:clienteId and update the URL when a client item is clicked
   × should mark the clicked client as selected via the route param (aria-selected)
   × should render the complete client details in the right panel after selection
   × should load and display the correct client when navigating directly to /clientes/:clienteId
   × should render a graceful not-found message for a well-formed but non-existent clienteId
   × should show the "no client selected" state on the base /clientes route
 Test Files  2 failed | 6 passed (8)
      Tests  6 failed | 58 passed (64)   ← pre-existing suite, zero regressions
```

**Command:** `dotnet build` (backend/SiesaAgents.sln)

```
error CS1061: 'ClienteRepository' does not contain a definition for 'GetByIdAsync' (x2)
Build FAILED — 2 Error(s)
```

**Summary:**

- Total new tests: 13 component + 6 routing + 6 backend + 5 E2E (× 4 browsers = 20 runnable entries) = 30 distinct test cases
- Status: ✅ RED phase verified — all failures trace to missing implementation (`ClienteDetailView.tsx`, `useCliente.ts`, `IClienteRepository.getById`/`GetByIdAsync`, `clientes.$clienteId.tsx` route, `GET /api/v1/clientes/{id}` endpoint), not test defects

---

## Notes

- Backend tests were included in this ATDD pass (unlike Story 2.1's list-only scope) because Story 2.2 introduces a brand-new endpoint (`GET /api/v1/clientes/{id}`) with an explicit 404/Problem Details contract that the frontend's not-found UI directly depends on — testing this contract first (RED) de-risks the frontend work built on top of it.
- The routing tests reuse the existing `-navigation-shell.routing.test.tsx` file (real `routeTree.gen.ts`) rather than a new file, since Story 2.2 is the first to add a dynamic-parameter route and this file is already the project's established home for cross-route navigation/deep-linking assertions (Story 1.2/2.1 precedent).
- `queryClient.clear()` was added scoped only to the new describe block to avoid changing any behavior for the 7 pre-existing tests in that file (verified unaffected).
- Editar/Eliminar actions and `ContactManager` composition are explicitly out of scope per the story's Dev Notes — no tests for those were written here; they belong to Stories 2.4/2.5 and Epic 4 respectively.

---

**Generated by BMad TEA Agent** - 2026-07-01
