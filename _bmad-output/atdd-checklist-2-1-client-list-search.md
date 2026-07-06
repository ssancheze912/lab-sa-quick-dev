# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-07-06
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + React Testing Library + MSW)

---

## Story Summary

Introduces the `/clientes` split-panel view: a 280px left panel listing all clients (Nombre + NIT/RUC) loaded via `GET /api/v1/clientes`, with a real-time, 100%-client-side search over the TanStack Query cache (no debounce, no extra fetch). Also introduces the shared `EmptyState` and `ErrorPanel` components used by every future Clientes/Contactos load-failure state.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, when the user navigates to `/clientes`, then the left panel (`data-testid="clientes-list-panel"`) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item (`data-testid="cliente-list-item"`) (FR2).
2. **AC2** — Given the client list is loaded, when the user types in the search field (`aria-label="Buscar clientes"`, placeholder "Buscar cliente..."), then the list filters in real time (no submit button, no network request) by Nombre or NIT/RUC (case-insensitive substring) (FR3, FR4), and results render in under 1 second at up to 500 records (NFR1).
3. **AC3** — Given there are no clients, when the user navigates to `/clientes`, then an `EmptyState` (`data-testid="empty-state"`, `aria-live="polite"`) is displayed instead of the list.
4. **AC4** — Given the backend is unavailable, when the initial `GET /api/v1/clientes` fetch fails, then an `ErrorPanel` (`data-testid="error-panel"`, "No se pudo cargar") with a "Reintentar" button is displayed, retry re-triggers the query, and the raw error/exception message is never rendered (NFR6).

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 new tests — pre-existing scaffold left untouched)

**File:** `e2e/tests/clientes/clientes-crud.spec.ts` (pre-existing, not modified by this ATDD pass)

Per Story 2.1's own Dev Notes ("Known Cross-Story Test Dependency"), this scaffold's `FR1`/`FR2` tests seed data via `ApiHelper.createCliente()`, which calls `POST /api/v1/clientes` — **Story 2.3's** scope, not this story's. Making it pass here would require building the create endpoint early and would duplicate Story 2.3's own validation/uniqueness ATDD coverage. Decision: **left as-is** (still RED, blocked on Story 2.3), and cross-checked instead of duplicated:

- Verified `e2e/pages/clientes.page.ts` locators/copy match what Task 4/5 must build: `clientes-list-panel` ✅, `cliente-list-item` ✅, placeholder `/buscar cliente/i` ✅, `empty-state` ✅, `cliente-detail-panel` ✅ (all reused verbatim by the new component tests below, so Story 2.3 will make the E2E spec runnable with zero rework here).
- This story's own ACs (1-4) are instead covered by the new component tests (MSW-mocked `GET`, no backend dependency) and a backend integration test that seeds via `AppDbContext` directly (bypassing the not-yet-built `POST`), exactly as the Dev Notes prescribe.

### API Tests (15 test executions across 21 methods)

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs` (151 lines, 11 test methods / 15 executions — 7 `[Fact]` + 4 `[Theory]` × 2 `InlineData` cases each)

- ✅ **Test:** `Create_SetsNombreFromArgument` / `Create_SetsNitFromArgument` / `Create_SetsTelefonoFromArgument` / `Create_SetsCiudadFromArgument`
  - **Status:** RED — `CS0234`, `SiesaAgents.Domain.Clientes` namespace doesn't exist
  - **Verifies:** AC1 (Task 1) — `ClienteEntity.Create` assigns all four fields
- ✅ **Test:** `Create_GeneratesNonEmptyGuidId`, `Create_GeneratesUniqueIdPerCall`
  - **Status:** RED — same compile error
  - **Verifies:** Task 1 — `Guid Id` is `Guid.NewGuid()`-generated and unique per call
- ✅ **Test:** `Create_SetsCreatedAtCloseToUtcNow`
  - **Status:** RED — same compile error
  - **Verifies:** Task 1 — `CreatedAt` is a `DateTimeOffset` set at creation time
- ✅ **Test (Theory ×2):** `Create_ThrowsArgumentException_WhenNombreIsEmptyOrWhitespace` / `...NitIsEmptyOrWhitespace` / `...TelefonoIsEmptyOrWhitespace` / `...CiudadIsEmptyOrWhitespace`
  - **Status:** RED — same compile error
  - **Verifies:** Task 1 — defense-in-depth `ArgumentException` on empty/whitespace required fields (full validation is Story 2.3 scope)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (192 lines, 6 tests)

- ✅ **Test:** `GetClientes_ReturnsOk_WhenTableIsEmpty`
  - **Status:** RED — `CS0234`/`CS0246` (`ClienteEntity`, `AppDbContext.Clientes` don't exist)
  - **Verifies:** AC1 (Task 2) — `200 OK` when the table is empty
- ✅ **Test:** `GetClientes_ReturnsEmptyArray_WhenTableIsEmpty`
  - **Status:** RED — same compile error
  - **Verifies:** AC1 — body is `[]` when empty
- ✅ **Test:** `GetClientes_ReturnsDirectArray_NotWrappedInDataProperty`
  - **Status:** RED — same compile error
  - **Verifies:** Dev Notes "API response shape" — root JSON is an array, never `{ data: [...] }`
- ✅ **Test:** `GetClientes_ReturnsSeededRecordCount_WhenDataExists`, `...ReturnsSeededNombre_WhenDataExists`, `...ReturnsSeededNit_WhenDataExists`
  - **Status:** RED — same compile error
  - **Verifies:** AC1 — seeded records (via `AppDbContext`, not `POST`) are returned with correct field values

### Component Tests (12 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (255 lines, 11 tests)

- ✅ **Test:** `[P0] renders one cliente-list-item per client returned` / `[P0] displays the client Nombre` / `[P0] displays the client NIT/RUC`
  - **Status:** RED — `Failed to resolve import "./ClienteListView"` (Vite import-analysis error, confirmed by running `npx vitest run`)
  - **Verifies:** AC1
- ✅ **Test:** `[P0] filters by Nombre (case-insensitive)` / `[P0] filters by NIT/RUC` / `[P1] no additional GET request while typing`
  - **Status:** RED — same import error
  - **Verifies:** AC2
- ✅ **Test:** `[P0] renders empty-state on empty array` / `[P1] empty-state has aria-live="polite"`
  - **Status:** RED — same import error
  - **Verifies:** AC3
- ✅ **Test:** `[P0] renders error-panel with "No se pudo cargar"` / `[P2] never renders raw backend error text` / `[P1] "Reintentar" re-triggers the query`
  - **Status:** RED — same import error
  - **Verifies:** AC4 / NFR6

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx` (65 lines, 1 test)

- ✅ **Test:** `[P1] filters 500 cached clients to a single match in under 1000ms`
  - **Status:** RED — same import error
  - **Verifies:** AC2 / NFR1

---

## Data Factories Created

### Cliente Factory (Frontend)

**File:** `frontend/src/test/factories/cliente.factory.ts`

**Exports:**

- `createCliente(overrides?)` — creates a single `Cliente` with unique Nombre/NIT/telefono
- `createClientes(count, overrides?)` — creates an array of `count` clients

**Deviation from `data-factories.md` noted explicitly:** the fragment recommends `@faker-js/faker`, but it is **not** an installed `frontend/package.json` dependency (verified during this pass) and adding one is out of scope for test authoring. The factory instead mirrors the project's existing `e2e/helpers/data.helper.ts` convention — a `Date.now()`-seeded counter guarantees collision-free values across calls within a run, which is the property that actually matters (parallel-safety), even without faker's randomness.

**Example Usage:**

```typescript
const cliente = createCliente({ nombre: 'Acme Corp' });
const clientes = createClientes(500); // 500 unique fixtures for the NFR1 perf test
```

### ClienteEntity "factory" (Backend)

No dedicated factory file — `ClienteEntity.Create(nombre, nit, telefono, ciudad)` **is** the factory (Domain-layer static creation method per the story's own design), used directly in both `ClienteEntityTests.cs` and `ClienteEndpointsTests.cs` with unique NITs generated inline via `UniqueNit()` (tick-based suffix) to avoid colliding with the `uk_clientes_nit` unique index across test runs.

---

## Fixtures Created

### MSW Server (Frontend)

**File:** `frontend/src/test/msw/server.ts`

- `server` — shared `setupServer()` instance (no default handlers) for all `frontend/src/modules/**` component tests.
  - **Setup:** each test file calls `server.listen({ onUnhandledRequest: 'error' })` in `beforeAll`, then registers its own `server.use(http.get(...))` handler **before** the component mounts (network-first pattern, `network-first.md`).
  - **Provides:** deterministic control over `GET /api/v1/clientes` responses (success, empty array, 500 failure) without a real backend.
  - **Cleanup:** `server.resetHandlers()` in `afterEach`, `server.close()` in `afterAll` — no per-test data to delete since MSW handlers are purely in-memory.

**Example Usage:**

```typescript
import { server } from '@/test/msw/server';
import { http, HttpResponse } from 'msw';

server.use(http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)));
```

### TestWebApplicationFactory (Backend, reused — not newly created)

Story 2.1 reuses the existing `backend/tests/SiesaAgents.IntegrationTests/TestWebApplicationFactory.cs` (from Story 1.3) as `IClassFixture<TestWebApplicationFactory>`. `ClienteEndpointsTests` performs its own inline auto-cleanup (no shared fixture needed): each seeding test deletes the rows it created in a `finally` block; the two "empty table" tests call a private `ClearClientesTableAsync()` helper before asserting.

---

## Mock Requirements

### Backend `GET /api/v1/clientes` (mocked for frontend component tests)

**Endpoint:** `GET /api/v1/clientes`

**Success response (200):**

```json
[{ "id": "...", "nombre": "Acme Corp", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-07-06T00:00:00Z" }]
```

**Empty response (200):**

```json
[]
```

**Failure response (500):**

```json
{ "detail": "boom" }
```

**Notes:** Real backend error mocking uses a deliberately technical-looking `detail` string (e.g. `"NpgsqlException: connection refused..."`) in one test specifically to assert that text is **never** rendered to the user (NFR6) — only the fixed `"No se pudo cargar"` copy should appear.

---

## Required data-testid Attributes

### `/clientes` view

- `clientes-list-panel` — 280px left panel wrapper containing the scrollable client list
- `cliente-list-item` — one per client row, must contain visible Nombre and NIT/RUC text
- `empty-state` — rendered by the shared `EmptyState` component, must carry `aria-live="polite"`
- `error-panel` — rendered by the shared `ErrorPanel` component, must contain the text "No se pudo cargar" and a button accessible by name `/reintentar/i`

### Required ARIA (no data-testid, queried by role/name per selector-resilience.md hierarchy)

- Search input: accessible name "Buscar clientes" (via `aria-label`), placeholder "Buscar cliente..."
- Search container: `role="search"`

**Implementation Example:**

```tsx
<div data-testid="clientes-list-panel" className="w-[280px] overflow-y-auto">
  <div role="search">
    <Input aria-label="Buscar clientes" placeholder="Buscar cliente..." onChange={...} />
  </div>
  {clientes.map((c) => (
    <div key={c.id} data-testid="cliente-list-item">
      <span>{c.nombre}</span>
      <span>{c.nit}</span>
    </div>
  ))}
</div>
```

**Note on layout assertions:** the exact 280px width and "scrollable" behavior are CSS/Tailwind concerns that cannot be reliably asserted against real computed styles under jsdom (no stylesheet engine runs in Vitest's environment). These component tests intentionally verify only content/behavior/ARIA; pixel-perfect layout is left to the pre-existing E2E page object (already targets the same `clientes-list-panel` testid) once Story 2.3 unblocks it.

---

## Implementation Checklist

### Test Group: AC1 — `ClienteEntityTests.cs` + `ClienteEndpointsTests.cs` (backend)

**Tasks to make these tests compile and pass:**

- [ ] Create `ClienteEntity` (Domain), `IClienteRepository` (Domain), `ClienteConfiguration` (Infrastructure), `DbSet<ClienteEntity> Clientes` on `AppDbContext`, `ClienteRepository` (Story Task 1)
- [ ] Run `dotnet ef migrations add CreateClientesTable` + `dotnet ef database update` (Story Task 1)
- [ ] Create `ClienteDto`, `GetClientesQuery`/Handler, `ClienteEndpoints.MapClienteEndpoints()`, register in `Program.cs` (Story Task 2)
- [ ] Run: `dotnet test backend/tests/SiesaAgents.UnitTests --filter FullyQualifiedName~ClienteEntityTests`
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ClienteEndpointsTests`
- [ ] ✅ All 21 backend test executions pass (or `ClienteEndpointsTests` soft-skips cleanly if PostgreSQL is unreachable)

**Estimated Effort:** 4 hours

---

### Test Group: AC1, AC2 — `ClienteListView.test.tsx` (list + search)

**Tasks to make these tests pass:**

- [ ] Create `Cliente` domain type, `IClienteRepository`, `clienteApiRepository`, `useClientes()` hook (Story Task 3)
- [ ] Create `ClientListItem.tsx` and `ClienteListView.tsx` with `data-testid="clientes-list-panel"` / `"cliente-list-item"`, `useState` search term, `useMemo` case-insensitive substring filter over Nombre/NIT (Story Task 4)
- [ ] Wire `ClienteListView` into `frontend/src/routes/_app/clientes.tsx` (Story Task 4)
- [ ] Add required data-testid/ARIA attributes: `clientes-list-panel`, `cliente-list-item`, `aria-label="Buscar clientes"`, `role="search"`
- [ ] Run: `npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] ✅ 11 tests pass (green phase)

**Estimated Effort:** 5 hours

---

### Test Group: AC3, AC4 — `ClienteListView.test.tsx` (EmptyState/ErrorPanel branches)

**Tasks to make these tests pass:**

- [ ] Create `EmptyState.tsx` (`data-testid="empty-state"`, `aria-live="polite"`) (Story Task 5)
- [ ] Create `ErrorPanel.tsx` (`data-testid="error-panel"`, message prop only — never `error.message`, siesa-ui-kit `Button` labeled "Reintentar" calling `onRetry`) (Story Task 5)
- [ ] Branch in `ClienteListView` on `useClientes()` query state: `isError` → `ErrorPanel`; empty success + no search → `EmptyState`; otherwise list (Story Task 5)
- [ ] Add required data-testid attributes: `empty-state`, `error-panel`
- [ ] Run: `npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] ✅ Remaining tests in the file pass (green phase)

**Estimated Effort:** 3 hours

---

### Test Group: AC2 / NFR1 — `ClienteListView.perf.test.tsx`

**Tasks to make this test pass:**

- [ ] Confirm the search filter is a single `useMemo` pass over the cached array (no nested loops, no debounce, no network call) (Story Task 4)
- [ ] Run: `npx vitest run src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx`
- [ ] ✅ Test passes in well under 1000ms (green phase)

**Estimated Effort:** 0.5 hours (verification only, assuming Task 4's `useMemo` approach is followed as specified)

---

## Running Tests

```bash
# Backend — all new Story 2.1 tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter FullyQualifiedName~ClienteEntityTests
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ClienteEndpointsTests

# Frontend — component + perf tests
cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx
cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx

# Frontend — headed/watch mode for debugging
cd frontend && npx vitest src/modules/crm/clientes/presentation/ClienteListView.test.tsx

# Full frontend suite (regression check)
cd frontend && npx vitest run
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 33 test executions (29 test methods) written across 4 new files, covering all 4 acceptance criteria (AC1-AC4) + NFR1
- ✅ `cliente.factory.ts` and shared MSW `server.ts` created with auto-cleanup (`resetHandlers`/`close`)
- ✅ Mock requirements documented (success/empty/failure `GET /api/v1/clientes` shapes)
- ✅ `data-testid`/ARIA requirements listed for DEV team
- ✅ Implementation checklist created, mapped to Story 2.1's own Tasks 1-6
- ✅ Pre-existing `e2e/tests/clientes/clientes-crud.spec.ts` reviewed and deliberately left untouched (Story 2.3 dependency), locators cross-checked against new tests to avoid rework later

**Verification (actually executed, not simulated):**

```
$ cd backend && dotnet build tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj
.../ClienteEntityTests.cs(2,19): error CS0234: The type or namespace name 'Domain' does not
  exist in the namespace 'SiesaAgents' (are you missing an assembly reference?)
Build FAILED. 1 Error(s)

$ cd backend && dotnet build tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj
.../ClienteEndpointsTests.cs(5,19): error CS0234: The type or namespace name 'Domain' does not
  exist in the namespace 'SiesaAgents'
.../ClienteEndpointsTests.cs(151,49): error CS0246: The type or namespace name 'ClienteEntity'
  could not be found
Build FAILED. 2 Error(s)

$ cd backend && dotnet build SiesaAgents.sln
  SiesaAgents.Domain -> .../SiesaAgents.Domain.dll        (0 errors)
  SiesaAgents.Infrastructure -> .../SiesaAgents.Infrastructure.dll  (0 errors)
  SiesaAgents.Application -> .../SiesaAgents.Application.dll        (0 errors)
  SiesaAgents.API -> .../SiesaAgents.API.dll               (0 errors)
  [only the two new Clientes test files fail — production code and Story 1.3's
   existing test files are unaffected]

$ cd frontend && npx vitest run src/modules/crm/clientes/presentation/
 FAIL  ClienteListView.test.tsx      Failed to resolve import "./ClienteListView"
 FAIL  ClienteListView.perf.test.tsx Failed to resolve import "./ClienteListView"
 Test Files  2 failed (2)
      Tests  no tests

$ cd frontend && npx vitest run   (full suite, regression check)
 Test Files  2 failed | 4 passed (6)
      Tests  17 passed (17)
 [the 2 new files fail to import ClienteListView as expected; all 4 pre-existing
  test files — AppNavigation, routing — still pass unaffected]
```

**Summary:**

- Total new test executions: 33 (15 backend unit + 6 backend integration + 11 component + 1 perf)
- Passing: 0 (expected)
- Failing: 33 (expected — 21 via C# compile error, 12 via Vite unresolved-import error)
- Status: ✅ RED phase verified for every new test; 0 regressions in pre-existing suites

**Expected Failure Messages:**

- Backend: `CS0234`/`CS0246` — missing `SiesaAgents.Domain.Clientes.*` namespace/types and `AppDbContext.Clientes`
- Frontend: `Failed to resolve import "./ClienteListView"` (Vite `vite:import-analysis` plugin)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Execute Story 2.1 Task 1 (Domain + migration) — this unblocks `ClienteEntityTests` compilation
2. Execute Task 2 (Query + endpoint) — this unblocks `ClienteEndpointsTests` compilation
3. Execute Tasks 3-4 (frontend domain/data layer + `ClienteListView`) — this unblocks `ClienteListView.test.tsx`/`.perf.test.tsx` compilation and should turn most AC1/AC2 tests green
4. Execute Task 5 (`EmptyState`/`ErrorPanel`) — turns the remaining AC3/AC4 tests green
5. Run the full test group after each task; do not move to the next task until the current group's tests pass
6. When all 27 new tests pass, verify the pre-existing `clientes-crud.spec.ts` locators still line up (no code change expected — it remains blocked on Story 2.3)

**Key Principles:**

- One test group at a time, in Task order (backend groups first — they gate nothing on the frontend, but keeping story tasks sequential avoids context switching)
- Minimal implementation (don't build Story 2.2-2.6 features early — e.g. no detail panel logic, no sort, no create/edit/delete)
- Run tests frequently

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 27 tests pass (or `ClienteEndpointsTests` soft-skips cleanly with a PostgreSQL-unreachable reason)
2. Review `ClienteListView`'s `useMemo` filter for readability/duplication now that both AC2 and the perf test cover it
3. Ensure tests still pass after each refactor
4. Ready for code review and story approval

---

## Next Steps

1. Share this checklist and the four new test files with the dev workflow (manual handoff)
2. Start PostgreSQL locally before attempting the GREEN phase for `ClienteEndpointsTests`
3. Begin implementation using the Implementation Checklist above, working backend Task 1 → Task 2 → frontend Task 3 → Task 4 → Task 5
4. When all tests pass, refactor code for quality
5. Update `sprint-status.yaml` entry `2-1-client-list-search` to `done` when complete

---

## Knowledge Base References Applied

- **fixture-architecture.md** — MSW `setupServer()` shared instance with `listen`/`resetHandlers`/`close` lifecycle (JS analogue of Playwright's `test.extend()` auto-cleanup); backend `ClienteEndpointsTests` applies the same auto-cleanup principle manually via `finally` blocks (xUnit has no native fixture-with-`use()` equivalent)
- **data-factories.md** — `createCliente`/`createClientes` factory functions with override support; documented deviation (no faker dependency installed) and the counter-based alternative that still guarantees collision-free values
- **network-first.md** — every MSW handler registered via `server.use(...)` before `render()`, since TanStack Query fires its `GET` on mount; wildcard `*/api/v1/clientes` pattern used so the match is independent of `VITE_API_URL` resolution under Vitest's test mode
- **component-tdd.md** — Red-Green-Refactor loop applied to `ClienteListView`; tests kept isolated with a fresh `QueryClient` per test (no cache bleed between tests)
- **test-quality.md** — Given-When-Then comments throughout; the perf test isolated into its own file to keep the primary spec file under a reasonable length; one behavioral assertion per test (with narrow, justified exceptions where a single `waitFor` naturally covers one fact, e.g. "list has N items")
- **selector-resilience.md** — `data-testid` used for `clientes-list-panel`/`cliente-list-item`/`empty-state`/`error-panel` (Priority 1); ARIA (`getByRole('textbox', { name: /buscar clientes/i })`) used for the search input, which the story's own AC ties to `aria-label` rather than a testid (Priority 2 correctly applied, not a shortcut)
- **test-levels-framework.md** — Component level chosen as primary (per Story 2.1's own Dev Notes/Testing Standards Summary) over E2E, since the pre-existing E2E scaffold is explicitly blocked on Story 2.3's `POST` endpoint; API/Integration level chosen for the backend `GET` contract; no separate Unit-level frontend tests needed since `useClientes()` has no branching logic of its own beyond the query call

See `_bmad/bmm/testarch/tea-index.csv` for the full knowledge fragment index.

---

## Notes

- **`@faker-js/faker` is not installed** in `frontend/package.json`. The data factory documented above uses a counter-based approach instead, consistent with the project's pre-existing `e2e/helpers/data.helper.ts` convention. If the team later adopts faker project-wide, `cliente.factory.ts` can be swapped without touching any test call sites (same function signatures).
- **Layout/CSS assertions (280px width, scroll behavior) are intentionally out of component-test scope** — jsdom does not run a real stylesheet engine, so Tailwind-driven layout can only be meaningfully verified in a real browser. This is deferred to the E2E suite (already targets `clientes-list-panel`), once Story 2.3 unblocks it.
- **No backend test was added for AC4 (ErrorPanel)** — Story 2.1 Task 2 explicitly states the existing `ExceptionHandlingMiddleware` (Story 1.3) already covers unhandled-exception-to-Problem-Details conversion for this endpoint ("verify by inspection, do not duplicate"). AC4's user-facing behavior (ErrorPanel + retry + no raw error leak) is fully a frontend concern and is covered by the three AC4 component tests instead.
- The two backend test files (`ClienteEntityTests.cs`, `ClienteEndpointsTests.cs`) currently fail to **compile**, not just fail assertions — this is the same RED signature established in Story 1.3's ATDD pass and is expected until Story 2.1 Tasks 1-2 are implemented.
- `ClienteEndpointsTests` requires a reachable local PostgreSQL with the `CreateClientesTable` migration applied; each `[RequiresPostgresFact]` will report **Skipped** (not a false "Passed") if PostgreSQL is unreachable in the execution environment, per the project's established soft-skip convention (`RequiresPostgresFactAttribute`, introduced in Story 1.3).

---

## Contact

- Refer to `_bmad/bmm/testarch/tea-index.csv` for the full knowledge fragment index
- Story source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md`
- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Test design source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` (TC-E2-P1-04, TC-E2-P1-06, TC-E2-P2-03; TC-E2-P0-01/TC-E2-P1-05 remain blocked on Story 2.3 per the pre-existing E2E scaffold)

---

**Generated by BMad TEA Agent** - 2026-07-06
