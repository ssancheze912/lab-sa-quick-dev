# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-07-08
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + @testing-library/react + MSW) with supporting Routing-integration (TanStack Router memory history), Backend Integration (xUnit + `WebApplicationFactory<Program>`), and E2E (Playwright, route-intercepted)

---

## Story Summary

Story 2.2 extends the split-panel `/clientes` slice Story 2.1 built by turning the placeholder `clientes.$clienteId.tsx` route into a real `ClienteDetailView`. RED-phase tests lock the behaviour of every layer: backend `GetClienteByIdQueryHandler` + `GET /api/v1/clientes/{id:guid}` (including 404 Problem Details + `:guid` route constraint); frontend `useCliente(id)` hook with UUID guard + 404 short-circuit; presentation branches (skeleton, 404 not-found, non-404 ErrorPanel, happy card); routing integration through the real routeTree; and E2E user journeys covering deep-linking, invalid UUIDs, and inter-client selection switching.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section.

---

## Acceptance Criteria

1. **AC #1** — Clicking a `ClienteListItem` updates the URL to `/clientes/:clienteId`, renders `ClienteDetailView` (Nombre, NIT/RUC, Teléfono, Ciudad) in the right panel, and the list item shows `data-selected="true"`.
2. **AC #2** — Direct deep-link to `/clientes/:clienteId` renders the split-panel + populated `ClienteDetailView` without requiring a prior list click.
3. **AC #3** — Well-formed UUID that does not exist renders `ClienteNotFound` (exact Spanish copy, `role="status"`, `aria-live="polite"`, "Volver a la lista" siesa-ui-kit button navigating to `/clientes`). No crash, no auto-redirect, no raw 404 body leak (NFR6).
4. **AC #4** — Non-UUID `:clienteId` short-circuits the query (no network hit) and renders the same `ClienteNotFound`; the list remains interactive.
5. **AC #5** — First-time in-flight query shows four `react-loading-skeleton` placeholders on a container with `aria-busy="true"` and `data-testid="cliente-detail-skeleton"`; no spinner.
6. **AC #6** — Non-404 failure renders `ErrorPanel` with title `"No se pudo cargar el cliente"`, subtitle `"Comprueba tu conexión e intenta nuevamente."`, and a `Reintentar` button that calls `refetch()`. Raw error internals NEVER shown (NFR6).
7. **AC #7** — Switching from `/clientes/:A` to `/clientes/:B` updates the URL, re-fetches the detail via `useCliente(B)`, and moves `data-selected="true"` from the A row to the B row without invalidating the list query.
8. **AC #8** — `GET /api/v1/clientes/{id}` returns HTTP 200 with a single `ClienteDto` (camelCase, ISO 8601 with tz) — a single object, not an array.
9. **AC #9** — `GET /api/v1/clientes/{id}` with an unknown UUID returns HTTP 404 with a Problem Details RFC 7807 body (`type`, `title`, `status`, `instance`). No `stackTrace`, `exception`, or internal keys (NFR6, R-001).
10. **AC #10** — Non-UUID route segment is short-circuited by the `:guid` route constraint (HTTP 404, `application/problem+json`).
11. **AC #11** — Backend + frontend builds compile with 0 errors / 0 new warnings; TS strict mode passes; CSS gzip does not regress > +5 KB.
12. **AC #12** — All existing tests remain green; new tests pass; `> 80%` coverage on new files.

---

## Failing Tests Created (RED Phase)

### Backend Tests — xUnit + `WebApplicationFactory<Program>`

#### File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (3 tests, NEW)

- ✅ **Test:** `HandleAsync_ReturnsNull_WhenRepositoryReturnsNull`
  - **Status:** RED — type `SiesaAgents.Application.Clientes.Queries.GetClienteByIdQuery` / `GetClienteByIdQueryHandler` do not exist yet (Task 1).
  - **Verifies:** AC #9
- ✅ **Test:** `HandleAsync_MapsAllFields_FromEntityToDto_WhenFound`
  - **Status:** RED — same reason.
  - **Verifies:** AC #8
- ✅ **Test:** `HandleAsync_UsesRequestedId_ForRepositoryLookup`
  - **Status:** RED — same reason.
  - **Verifies:** AC #8, #9

#### File: `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdTests.cs` (3 tests, NEW)

- ✅ **Test:** `GetClienteById_Returns200_WithDto_WhenIdExists`
  - **Status:** RED — endpoint `GET /api/v1/clientes/{id:guid}` is not mapped yet (Task 2). `GetClienteByIdQueryHandler` is not in DI.
  - **Verifies:** AC #8
- ✅ **Test:** `GetClienteById_Returns404_WithProblemDetails_WhenIdNotFound`
  - **Status:** RED — endpoint missing; the `UseStatusCodePages` handler cannot rewrite an empty 404 body until the endpoint returns `Results.NotFound()`.
  - **Verifies:** AC #9 + NFR6 anti-leak (R-001)
- ✅ **Test:** `GetClienteById_Returns404_WhenIdIsNotGuid`
  - **Status:** RED — the `:guid` route constraint is only enforced when the route exists (Task 2).
  - **Verifies:** AC #10

### Frontend Tests — Vitest + @testing-library/react + MSW

#### File: `frontend/src/modules/crm/clientes/application/useCliente.test.ts` (10 tests, NEW)

- ✅ **Test:** `clienteQueryKey` returns `['clientes', id]`
  - **Status:** RED — module `./useCliente` does not exist (Task 4).
  - **Verifies:** AC #7 (canonical single-query key)
- ✅ **Test:** `isValidClienteId` accepts a well-formed UUID
  - **Status:** RED — guard not exported.
  - **Verifies:** AC #4
- ✅ **Test:** `isValidClienteId` rejects non-UUID string
  - **Status:** RED — guard missing.
  - **Verifies:** AC #4
- ✅ **Test:** `isValidClienteId` rejects `undefined`
  - **Status:** RED — guard missing.
  - **Verifies:** AC #4
- ✅ **Test:** `isValidClienteId` rejects empty string
  - **Status:** RED — guard missing.
  - **Verifies:** AC #4
- ✅ **Test:** Happy path — hook resolves with data on 200
  - **Status:** RED — hook missing.
  - **Verifies:** AC #2, #8
- ✅ **Test:** UUID id is passed verbatim into URL path segment
  - **Status:** RED — hook missing.
  - **Verifies:** AC #8
- ✅ **Test:** Non-UUID id disables the query (no request fires)
  - **Status:** RED — hook missing.
  - **Verifies:** AC #4
- ✅ **Test:** `undefined` id disables the query (no request fires)
  - **Status:** RED — hook missing.
  - **Verifies:** AC #4
- ✅ **Test:** 404 response is terminal (`isError === true` AND handler called ONCE — no retries)
  - **Status:** RED — hook missing.
  - **Verifies:** AC #3

#### File: `frontend/src/shared/components/ClienteNotFound.test.tsx` (7 tests, NEW)

- ✅ **Test:** Renders exact Spanish title "Cliente no encontrado"
  - **Status:** RED — component does not exist (Task 5).
  - **Verifies:** AC #3, #4
- ✅ **Test:** Renders exact Spanish subtitle
  - **Status:** RED.
  - **Verifies:** AC #3, #4
- ✅ **Test:** Container has `role="status"`
  - **Status:** RED.
  - **Verifies:** AC #3 (accessibility)
- ✅ **Test:** Container has `aria-live="polite"`
  - **Status:** RED.
  - **Verifies:** AC #3 (accessibility)
- ✅ **Test:** Renders "Volver a la lista" button
  - **Status:** RED.
  - **Verifies:** AC #3
- ✅ **Test:** Clicking "Volver a la lista" invokes `onBackToList` exactly once
  - **Status:** RED.
  - **Verifies:** AC #3
- ✅ **Test:** No `exception`/`stack` leaked (NFR6)
  - **Status:** RED.
  - **Verifies:** AC #3 NFR6

#### File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (8 tests, NEW)

- ✅ **Test:** Happy path — four fields render with exact values (Nombre heading + NIT/Teléfono/Ciudad testids)
  - **Status:** RED — component does not exist (Task 6). Depends on `useCliente` + `ClienteNotFound`.
  - **Verifies:** AC #1, #2
- ✅ **Test:** Visible field labels are Spanish ("NIT/RUC", "Teléfono", "Ciudad")
  - **Status:** RED.
  - **Verifies:** AC #1, #2 (Spanish text)
- ✅ **Test:** Loading state renders `cliente-detail-skeleton` with `aria-busy="true"`
  - **Status:** RED.
  - **Verifies:** AC #5
- ✅ **Test:** 404 branch — `role="status"` + exact title
  - **Status:** RED.
  - **Verifies:** AC #3
- ✅ **Test:** 404 branch — clicking "Volver a la lista" calls `useNavigate({ to: '/clientes' })`
  - **Status:** RED.
  - **Verifies:** AC #3
- ✅ **Test:** Non-UUID short-circuit — ClienteNotFound renders AND 0 network calls
  - **Status:** RED.
  - **Verifies:** AC #4
- ✅ **Test:** Non-404 error — ErrorPanel with exact Spanish copy + Reintentar
  - **Status:** RED.
  - **Verifies:** AC #6
- ✅ **Test:** Non-404 error — Reintentar triggers re-fetch → recovers → detail card visible
  - **Status:** RED.
  - **Verifies:** AC #6
- ✅ **Test:** Switching clienteId A → B re-renders the detail card with B's data
  - **Status:** RED.
  - **Verifies:** AC #7

#### File: `frontend/src/routes/clientes.$clienteId.test.tsx` (3 tests, NEW)

- ✅ **Test:** Deep link `/clientes/{existingId}` — list has both items, matching row selected, detail card populated
  - **Status:** RED — route currently renders `null` placeholder from Story 2.1.
  - **Verifies:** AC #1, #7
- ✅ **Test:** Deep link `/clientes/{unknownUuid}` — ClienteNotFound + list stays interactive
  - **Status:** RED.
  - **Verifies:** AC #3
- ✅ **Test:** Deep link `/clientes/not-a-uuid` — ClienteNotFound + 0 requests to detail endpoint
  - **Status:** RED.
  - **Verifies:** AC #4

### E2E Tests — Playwright (route-intercepted, network-first)

#### File: `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts` (7 tests, NEW)

- ✅ **Test:** AC #1 — clicking a list item updates URL + renders four fields
  - **Status:** RED — `ClienteDetailView` is not wired into `clientes.$clienteId.tsx`.
  - **Verifies:** AC #1
- ✅ **Test:** AC #2 — direct deep-link renders split panel + detail card
  - **Status:** RED.
  - **Verifies:** AC #2
- ✅ **Test:** AC #3 — 404 renders `ClienteNotFound` (role="status", `aria-live="polite"`, exact Spanish copy)
  - **Status:** RED.
  - **Verifies:** AC #3
- ✅ **Test:** AC #3 — "Volver a la lista" click navigates to `/clientes`
  - **Status:** RED.
  - **Verifies:** AC #3
- ✅ **Test:** AC #4 — non-UUID renders ClienteNotFound + 0 detail requests + list stays interactive
  - **Status:** RED.
  - **Verifies:** AC #4
- ✅ **Test:** AC #5 — in-flight query shows skeleton with `aria-busy="true"`
  - **Status:** RED.
  - **Verifies:** AC #5
- ✅ **Test:** AC #6 — 500 renders ErrorPanel with Reintentar + no NFR6 leaks
  - **Status:** RED.
  - **Verifies:** AC #6
- ✅ **Test:** AC #7 — switching selection A → B updates URL, detail card, and `data-selected` contract
  - **Status:** RED.
  - **Verifies:** AC #7

---

## Data Factories Used (Reused)

### `buildCliente` — Vitest

- **File:** `frontend/src/test/factories/cliente.factory.ts` (Story 2.1, no new factory needed)
- **Exports:** `buildCliente(overrides?)`, `buildClientes(count, overridesFn?)`

### `buildCliente` — Playwright

- **File-local factory** in `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts` (mirrors Story 2.1's local factory in `story-2-1-client-list-search.spec.ts` for shape consistency).

**Rationale:** Story 2.2 does not introduce a new data shape — it only reads the same `Cliente` DTO Story 2.1 defined.

---

## Fixtures Created

**None new.** Story 2.2 reuses:

- `e2e/fixtures/base.fixture.ts` — Playwright base test (Story 2.1).
- `frontend/src/test/msw/server.ts` + `handlers.ts` — MSW server + `API_BASE` constant (Story 2.1).
- `frontend/src/test-setup.ts` — `beforeAll(server.listen)` + `afterEach(server.resetHandlers)` (Story 2.1).

The single hand-rolled `FakeClienteRepository` used by the two new backend test classes is a small file-scoped fake with the same shape as Story 2.1's inline fake — the ClienteEndpointsGetByIdTests fake plus the ClienteByIdHandler test fake instrument `LastRequestedId` to assert AC #8's verbatim-id contract.

---

## Mock Requirements

### Backend

- No new mock services. The `FakeClienteRepository` (in-memory) is the only substitution — same pattern as Story 2.1.
- `UseEnvironment("Testing")` continues to bypass PostgreSQL. `Results.NotFound()` returns an empty 404 body which the `UseStatusCodePages` handler (Story 1.3) rewrites into an RFC 7807 payload — the tests assert `Content-Type` starts with `application/problem+json`.

### Frontend

- MSW handlers per-test:
  - `GET http://localhost:5000/api/v1/clientes` — list handler (varies per case).
  - `GET http://localhost:5000/api/v1/clientes/:id` — detail handler; per-test cases: 200 with body, 404, 500, or delay.

**Notes:**

- Every test's MSW handler must be registered via `server.use(...)` before the render (route/interception first — pattern already blessed by Story 2.1).

---

## Required data-testid Attributes

### `ClienteDetailView` (new)

- `cliente-detail` — the main `<article>` wrapper (happy path).
- `cliente-detail-skeleton` — the skeleton wrapper (loading state, MUST also carry `aria-busy="true"`).
- `detail-nit` — the `<dd>` for NIT/RUC.
- `detail-telefono` — the `<dd>` for Teléfono.
- `detail-ciudad` — the `<dd>` for Ciudad.

### `ClienteListItem` (existing — Story 2.1)

- `data-selected="true"|"false"` on the item button — Story 2.2 reuses this contract for AC #7 without modification.

**Implementation reminder:**

```tsx
<article data-testid="cliente-detail" data-cliente-id={cliente.id}>
  <h2>{cliente.nombre}</h2>
  <dl>
    <dt>NIT/RUC</dt><dd data-testid="detail-nit">{cliente.nit}</dd>
    <dt>Teléfono</dt><dd data-testid="detail-telefono">{cliente.telefono}</dd>
    <dt>Ciudad</dt><dd data-testid="detail-ciudad">{cliente.ciudad}</dd>
  </dl>
</article>
```

---

## Implementation Checklist

### Test: Backend handler mapping (`GetClienteByIdQueryHandlerTests`)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

**Tasks to make these tests pass (Task 1):**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` (sealed record with `Guid Id`).
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — direct handler (no MediatR), returns `ClienteDto?`, uses `IClienteRepository.GetByIdAsync`.
- [ ] Ensure the handler returns `null` on repository miss and maps every field on hit.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~GetClienteByIdQueryHandlerTests`.
- [ ] ✅ Tests pass.

### Test: Backend endpoint (`ClienteEndpointsGetByIdTests`)

**File:** `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdTests.cs`

**Tasks to make these tests pass (Task 2):**

- [ ] Add `AddScoped<GetClienteByIdQueryHandler>()` inside `Program.cs` beside the existing `GetClientesQueryHandler` registration.
- [ ] In `ClienteEndpoints.cs`, extend the existing `MapGroup("/api/v1/clientes")` with `MapGet("/{id:guid}", ...)` returning `Results.Ok(dto)` on hit and `Results.NotFound()` on miss.
- [ ] Do NOT introduce a per-endpoint 404 body — `UseStatusCodePages` handler already turns `Results.NotFound()` into RFC 7807 JSON.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~ClienteEndpointsGetByIdTests`.
- [ ] ✅ Tests pass.

### Test: `useCliente` hook (`useCliente.test.ts`)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**Tasks to make these tests pass (Task 4):**

- [ ] Create `useCliente.ts` in `frontend/src/modules/crm/clientes/application/`.
- [ ] Export `clienteQueryKey(id) => ['clientes', id] as const`.
- [ ] Export `isValidClienteId(id: string | undefined | null): id is string` using `z.string().uuid()`.
- [ ] `useCliente(id)` calls `useQuery` with `enabled: isValidClienteId(id)`, `staleTime: 30_000`, and a `retry` predicate that returns `false` for status 404.
- [ ] Run: `pnpm --dir frontend test useCliente`.
- [ ] ✅ Tests pass.

### Test: `ClienteNotFound` (`ClienteNotFound.test.tsx`)

**File:** `frontend/src/shared/components/ClienteNotFound.test.tsx`

**Tasks to make these tests pass (Task 5):**

- [ ] Create `frontend/src/shared/components/ClienteNotFound.tsx` with `role="status"`, `aria-live="polite"`, exact Spanish copy, and a siesa-ui-kit `Button` labelled "Volver a la lista" that invokes the `onBackToList` prop.
- [ ] Do NOT reuse `EmptyState` — this is a routed not-found, not an empty list.
- [ ] Run: `pnpm --dir frontend test ClienteNotFound`.
- [ ] ✅ Tests pass.

### Test: `ClienteDetailView` (`ClienteDetailView.test.tsx`)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass (Task 6):**

- [ ] Create `ClienteDetailView.tsx` with the branch logic:
  - `!isValidClienteId(clienteId)` → `<ClienteNotFound onBackToList={() => navigate({ to: '/clientes' })} />`.
  - `query.isLoading` → `<ClienteDetailSkeleton />` (aria-busy, four react-loading-skeleton placeholders).
  - `query.isError` + status 404 → `<ClienteNotFound />`.
  - `query.isError` + status !== 404 → `<ErrorPanel title="No se pudo cargar el cliente" subtitle="Comprueba tu conexión e intenta nuevamente." onRetry={query.refetch} isRetrying={query.isFetching} />`.
  - `query.data` → `<ClienteDetailCard cliente={query.data} />` with `data-testid="cliente-detail"` and the three field `data-testid`s.
- [ ] Use `useNavigate` from `@tanstack/react-router`; call with `void navigate({ ... })`.
- [ ] Run: `pnpm --dir frontend test ClienteDetailView`.
- [ ] ✅ Tests pass.

### Test: Routing integration (`clientes.$clienteId.test.tsx`)

**File:** `frontend/src/routes/clientes.$clienteId.test.tsx`

**Tasks to make these tests pass (Task 7):**

- [ ] Replace the Story 2.1 placeholder body in `frontend/src/routes/clientes.$clienteId.tsx` with a real component that reads `clienteId` via `useParams({ from: '/clientes/$clienteId' })` and passes it to `<ClienteDetailView clienteId={clienteId} />`.
- [ ] Do NOT edit `clientes.tsx` — the Story 2.1 `<Outlet />` already hosts this route.
- [ ] Run: `pnpm --dir frontend test clientes.\$clienteId`.
- [ ] ✅ Tests pass.

### Test: E2E — `story-2-2-client-detail-view.spec.ts`

**File:** `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass (Task 6 + 7 combined + Task 2 backend):**

- [ ] Ensure the entire vertical slice above is wired (frontend + backend).
- [ ] Run: `pnpm playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts --project=chromium`.
- [ ] ✅ Tests pass.

---

## Running Tests

```bash
# Backend — new tests only
dotnet test backend/SiesaAgents.sln \
  --filter "FullyQualifiedName~GetClienteByIdQueryHandlerTests|FullyQualifiedName~ClienteEndpointsGetByIdTests"

# Backend — full suite (Story 1.x + 2.1 + 2.2 baseline)
dotnet test backend/SiesaAgents.sln

# Frontend — new tests only
pnpm --dir frontend test useCliente ClienteNotFound ClienteDetailView "clientes.\$clienteId"

# Frontend — full suite
pnpm --dir frontend test

# E2E — Story 2.2 spec only
pnpm playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts --project=chromium

# E2E — all
pnpm playwright test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All tests written and failing.
- Fixtures / factories reused (no new ones needed — Story 2.1 blessed the pattern).
- Mock requirements documented above.
- `data-testid` requirements listed above.
- Implementation checklist created per test.

### GREEN Phase (DEV Team — Next Steps)

1. Start with Task 1 (backend handler) → GREEN on `GetClienteByIdQueryHandlerTests`.
2. Task 2 (endpoint) → GREEN on `ClienteEndpointsGetByIdTests`.
3. Task 4 (`useCliente`) → GREEN on `useCliente.test.ts`.
4. Task 5 (`ClienteNotFound`) → GREEN on `ClienteNotFound.test.tsx`.
5. Task 6 (`ClienteDetailView`) → GREEN on `ClienteDetailView.test.tsx`.
6. Task 7 (route wiring) → GREEN on `clientes.$clienteId.test.tsx`.
7. Task 8 (full frontend suite + coverage) → all Vitest suites green.
8. E2E spec → GREEN once the frontend dev server serves the wired route.
9. Task 9 (verification) → typecheck, build, CSS gzip diff, full tests.

### REFACTOR Phase (DEV Team — After GREEN)

- Consider lifting `FakeClienteRepository` into `backend/tests/SiesaAgents.UnitTests/Fakes/FakeClienteRepository.cs` (Story 2.2 already has two files that could share it — the story authorises this).
- Verify strict-mode typing on `error.response?.status ?? error.status` in `useCliente` — narrow via `AxiosError` if the type surface allows without pulling axios types into the domain.

---

## Notes

- Every ATDD test is intentionally FAILING now — that is the RED phase contract.
- The backend endpoint tests share the same `WebApplicationFactory<Program>` + `UseEnvironment("Testing")` + fake-repository override pattern established by Story 2.1's `ClienteEndpointsTests`.
- The frontend routing test reuses the ad-hoc `QueryClientProvider` + `RouterProvider` wrapping pattern from Story 2.1's `deepLink.test.tsx` — no new helper introduced.
- `ClienteDetailView.test.tsx` mocks `useNavigate` at the module level (`vi.mock`) so the component can be exercised without booting a full router — the routing-integration test picks up the real router seam separately.
- E2E tests use route interception (`page.route(pattern, handler)` BEFORE `page.goto`) — the network-first pattern from the TEA knowledge base.
- Selection assertion uses `data-selected` (Story 2.1's contract) — do NOT rely on colour classes.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Reused Story 2.1's `server` (MSW) + `wrapperFactory` patterns.
- **data-factories.md** — Reused `buildCliente`/`buildClientes` factories from Story 2.1.
- **network-first.md** — Playwright `page.route(...)` registered BEFORE `page.goto(...)` in every E2E test.
- **selector-resilience.md** — data-testid + role-based selectors only (no CSS class matching for behaviour).
- **test-quality.md** — Given-When-Then structure, one primary assertion per test, no hard waits (only bounded `waitForTimeout`s for negative-space assertions e.g. "no request fired").
- **test-levels-framework.md** — Component (Vitest + RTL) as primary level for branches; Routing-integration for URL seam; Backend integration for endpoint/handler; E2E for user journey.
- **timing-debugging.md** — 404 no-retry assertion uses handler call-count instead of arbitrary timeouts.

---

## Next Steps

1. Share this checklist and the failing tests with the dev workflow (manual handoff).
2. Run the failing suites to confirm RED:
   - `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~ClienteEndpointsGetByIdTests`
   - `pnpm --dir frontend test useCliente ClienteNotFound ClienteDetailView`
3. Begin implementation task-by-task per the checklist above.
4. When all tests are green, run `pnpm --dir frontend test -- --coverage` to verify `> 80%` on new files.
5. Manual smoke: navigate to `/clientes`, click a row, paste `/clientes/00000000-0000-0000-0000-000000000000`, paste `/clientes/abc`.

---

**Generated by BMad TEA Agent** — 2026-07-08
