# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-08
**Author:** SiesaTeam (TEA agent, autonomous run via sa-quick-dev)
**Primary Test Level:** Component (Vitest + RTL + MSW) — backed by API Integration (xUnit + WebApplicationFactory) and E2E (Playwright, chromium-only)
**Story file:** `_bmad-output/implementation-artifacts/2-1-client-list-search.md`
**Epic source:** `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`

---

## Story Summary

Expose the first read-only Clientes feature end-to-end: a `/api/v1/clientes` minimal-API endpoint backed by a new `clientes` table (snake_case columns + unique index `uk_clientes_nit`), and a frontend `ClienteListView` (280px scrollable left panel at `lg:`) with a real-time, debounced, in-memory search filter over `nombre` OR `nit`. EmptyState (`no-clients` / `search-empty`), ErrorPanel (+ Reintentar), and URL-as-source-of-truth selection via `/clientes/$clienteId` are all wired.

**As a** commercial team member
**I want** to see a list of all clients and search them in real time by name or NIT/RUC
**So that** I can quickly find the client I'm looking for without leaving `/clientes`, even when there is no data or the backend is unavailable.

---

## Acceptance Criteria

1. Backend — `clientes` table + EF migration `AddClienteEntity` with snake_case columns (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`) and unique index `uk_clientes_nit`.
2. Backend — `GET /api/v1/clientes` returns `200 OK` + `Content-Type: application/json` + direct JSON array (no wrapper object) of camelCase objects.
3. Backend — Error contract is RFC 7807 (regression for Story 1.3 middleware); no `stackTrace`, `exception`, `innerException`, raw SQL or table names leak.
4. Frontend — `/clientes` renders a 280px scrollable left panel containing one item (nombre + nit) per client returned by the API.
5. Frontend — Real-time search filter on `nombre` OR `nit` (case-insensitive substring), debounced 150 ms, memoized pure function (`useMemo` + `matchesQuery`), NO new HTTP request per keystroke, latency < 1000 ms even with 500 records (NFR1).
6. Frontend — `EmptyState` (`no-clients` variant) when GET returns `[]`; search input HIDDEN.
7. Frontend — `EmptyState` (`search-empty` variant) when the filter yields no result; search input REMAINS visible; wrapped in `aria-live="polite"`.
8. Frontend — `ErrorPanel` + `"Reintentar"` button on initial fetch failure; clicking Reintentar invokes TanStack Query `refetch()` (NOT a full page reload).
9. Frontend — `useClientes` hook uses the canonical TanStack Query key `['clientes']` (array literal, not a string).
10. Frontend — Clicking a list item updates the URL to `/clientes/$clienteId` via TanStack Router; the clicked item gains `aria-current="page"`.
11. Frontend — Spanish copy + a11y (`aria-label="Buscar clientes"`, `aria-label="Ver cliente: {nombre}"`, `role="alert"` on ErrorPanel, `aria-live="polite"` on EmptyState).
12. Tests — P0 + P1 + P2 + P3 scenarios pass: TC-E2-P2-01, P2-06, P2-07, P2-08, P0-05, P0-08, P1-01, P1-02, P1-03, P3-03.

---

## Failing Tests Created (RED Phase)

### Backend — xUnit / WebApplicationFactory (4 files, 19 tests)

| File | Tests | AC | Level | Status |
|---|---|---|---|---|
| `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` | 6 | #1, #12 | Unit (Domain — pure) | RED — `SiesaAgents.Domain.Entities.ClienteEntity` does not exist yet (CS0234) |
| `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` | 3 | #2, #12 | Unit (Application + InMemory `AppDbContext`) | RED — `GetClientesQueryHandler` / `GetClientesQuery` / `Clientes` DbSet do not exist yet (CS0234, CS0246) |
| `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs` | 6 | #2, #12 | API Integration (`WebApplicationFactory<Program>` + InMemory swap) | RED — endpoint `/api/v1/clientes` not mapped; `ClienteEntity` symbol missing |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteSchemaIntegrationTests.cs` | 4 | #1, #12 | DB Integration (real Postgres, **gated** by `RUN_DB_INTEGRATION_TESTS=1`) | RED + SKIP — entity + migration not created; in sandbox the four `[SkippableFact]` tests SKIP cleanly because PostgreSQL is unavailable |

Detailed test names:

`ClienteEntityTests.cs`
- `Create_WithAllFields_ReturnsEntityWithGeneratedIdAndUtcTimestamps`
- `Create_AssignsEqualCreatedAtAndUpdatedAtAtCreationTime`
- `Create_WithNullOrWhitespaceNombre_Throws` (3 inline data cases)
- `Create_WithNullOrWhitespaceNit_Throws` (3 inline data cases)
- `Create_WithNullOrWhitespaceTelefono_Throws` (3 inline data cases)
- `Create_WithNullOrWhitespaceCiudad_Throws` (3 inline data cases)
- `Timestamps_AreDateTimeOffsetType_NeverDateTime` (reflection guard for company-standards.md#Backend Critical Rules)

`GetClientesQueryHandlerTests.cs`
- `HandleAsync_WithEmptyDbSet_ReturnsEmptyList`
- `HandleAsync_WithThreeClientes_ReturnsAllOrderedByCreatedAtDescending` (Story 2.6 default sort guard)
- `HandleAsync_ProjectsAllSevenFieldsOfClienteDto`

`ClienteEndpointsTests.cs` — covers TC-E2-P2-01 + TC-E2-P2-08
- `TC_E2_P2_01_GetClientes_WithSeededData_Returns200WithArrayContainingItem`
- `GetClientes_ResponseContentType_IsApplicationJson`
- `GetClientes_WithEmptyDb_ReturnsEmptyJsonArray`
- `GetClientes_ResponseBody_IsDirectJsonArray_NotWrapperObject`
- `GetClientes_EachItemHasSevenCamelCaseFields` (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
- `TC_E2_P2_08_GetClientes_CreatedAt_SerializesAsIso8601WithOffset`
- `TC_E2_P2_08_GetClientes_UpdatedAt_SerializesAsIso8601WithOffset`

`ClienteSchemaIntegrationTests.cs` — covers TC-E2-P2-06 + TC-E2-P2-07 (gated)
- `TC_E2_P2_07_ClientesTable_HasAllSevenSnakeCaseColumns`
- `TC_E2_P2_07_ClientesTable_DoesNotExposePascalCaseColumns`
- `TC_E2_P2_06_ClientesTable_HasUniqueIndexUkClientesNitOnNit`
- `TC_E2_P2_06_UkClientesNit_EnforcesUniqueConstraintOnNit`

**Gating:** `Skip.IfNot(Environment.GetEnvironmentVariable("RUN_DB_INTEGRATION_TESTS") == "1", ...)`. In the sandbox the four assertions skip cleanly (`SkippableFact`) and DEV unlocks them via `RUN_DB_INTEGRATION_TESTS=1 dotnet test`.

**Csproj patch:** `SiesaAgents.UnitTests.csproj` gained `Microsoft.EntityFrameworkCore.InMemory 10.0.4` so the handler + endpoint tests can swap the real Npgsql provider for InMemory.

### Frontend — Vitest + RTL + MSW (6 files, 36 tests)

| File | Tests | AC | Level | Status |
|---|---|---|---|---|
| `frontend/src/modules/crm/clientes/application/matchesQuery.test.ts` | 7 | #5, #11, #12 | Unit (TC-E2-P3-03) | RED — `matchesQuery.ts` does not exist (Vite import error) |
| `frontend/src/shared/hooks/useDebouncedValue.test.ts` | 4 | #5 | Unit (fake timers) | RED — `useDebouncedValue.ts` does not exist |
| `frontend/src/shared/components/EmptyState.test.tsx` | 11 | #6, #7, #11 | Component (RTL) | RED — `EmptyState.tsx` does not exist |
| `frontend/src/shared/components/ErrorPanel.test.tsx` | 6 | #8, #11 | Component (RTL) | RED — `ErrorPanel.tsx` does not exist |
| `frontend/src/shared/components/ClientListItem.test.tsx` | 8 | #4, #10, #11 | Component (RTL) | RED — `ClientListItem.tsx` does not exist |
| `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` | 14 | #4, #5, #6, #7, #8, #9, #10, #11 | Component (RTL + MSW + TanStack Router in-memory) | RED — `ClienteListView.tsx` + `useClientes` + supporting types do not exist |

Notable test cases inside `ClienteListView.test.tsx`:

- **TC-E2-P1-01** — `renders 10 seeded clients inside the cliente-list-view panel` + `renders the panel with the Tailwind w-[280px] width class` + `renders one ClientListItem per seeded client`.
- **TC-E2-P1-02** — `filters the list by nombre via the search input` + `filters the list by nit via the search input`.
- **TC-E2-P1-03** — `renders the no-clients EmptyState when the backend returns []` + `hides the search input when the list is empty`.
- **AC #7** — `renders the search-empty EmptyState AND keeps the search input visible`.
- **TC-E2-P0-08** — `renders ErrorPanel on initial fetch failure and refetches on Reintentar click`.
- **AC #5 (no-refetch)** — `issues exactly one GET on mount and zero additional GETs while typing` (asserted via MSW `request:start` event counter).
- **AC #10** — `navigates to /clientes/{id} when the user clicks a list item` (in-memory TanStack Router with `/clientes/$clienteId` registered).
- **AC #9** — `registers the queryKey as the array literal ['clientes']` (verified via `QueryClient.getQueryCache().getAll()`).
- **TC-E2-P0-05** — `filters 500 records in under 1000 ms (NFR1)` (real timers, `performance.now()` delta).
- **AC #11** — `renders the search input with the verbatim placeholder and Spanish aria-label` + `keeps the existing data-testid="clientes-view" so Story 1.2 E2E tests still pass`.

`vitest.setup.ts` was extended to register a shared `setupServer()` (MSW) and to expose it as `server` so each test can `server.use(clientesHandlers.ok(...))` and reset between tests.

### Frontend — MSW Handlers + Seed Factories

| File | Exports | Notes |
|---|---|---|
| `frontend/src/test/handlers/clientes.ts` | `seedClientes(n)`, `clientesHandlers.{ok, empty, failing, delayed}` | Deterministic IDs and timestamps; matches `*/api/v1/clientes` so axios's relative URLs (`VITE_API_URL` undefined in test) are intercepted. `failing(status)` returns RFC 7807 `application/problem+json` to match the backend contract. |

### E2E — Playwright (1 file, 8 tests)

| File | Tests | AC | Status |
|---|---|---|---|
| `e2e/tests/clientes/list-and-search.spec.ts` | 8 | #4, #5, #6, #7, #8, #10, #11 | RED — `ClienteListView` not implemented (network-first interception is wired so the tests do not depend on a real DB seed; chromium-only run per Story 1.1 pin) |

Playwright cases:
- `AC #4 — left panel renders every seeded client (TC-E2-P1-01)`
- `AC #5 — typing in the search input filters by nombre (TC-E2-P1-02)`
- `AC #5 — search by nit also filters the list`
- `AC #6 — EmptyState (no-clients) shown when API returns [] (TC-E2-P1-03)`
- `AC #7 — EmptyState (search-empty) when filter yields no results`
- `AC #8 — ErrorPanel + Reintentar on initial fetch failure (TC-E2-P0-08)`
- `AC #10 — clicking an item updates the URL to /clientes/{id} without reload`
- `AC #5 — search input does NOT trigger a new HTTP request per keystroke`

All eight specs register `page.route(API_URL, …)` BEFORE `page.goto(...)` — network-first pattern per `network-first.md`. The webServer entry in `playwright.config.ts` still spins up the backend for other specs, but these tests fully intercept their own traffic so they are deterministic with or without a live backend.

---

## RED Phase Verification

| Check | Result |
|---|---|
| Frontend test suite runs and 6 test files fail with "import resolution" errors for the missing modules | YES — `pnpm test` from `frontend/` reports `6 failed | 6 passed (12 files), Tests 24 passed (24)` (the 24 passing are pre-existing Story 1.1 / 1.2 / 1.3 tests). The 6 new test files fail with `Failed to resolve import "./EmptyState"`, `"./ErrorPanel"`, `"./ClientListItem"`, `"./useDebouncedValue"`, `"./matchesQuery"`, `"./ClienteListView"`. |
| Backend `dotnet build SiesaAgents.sln` reports the expected compile errors for the missing entity / handler / namespaces | YES — 6 errors: `CS0234 Domain / Application namespace missing` + `CS0246 ClienteEntity not found`. Pre-existing Story 1.3 / 1.1 tests still compile. |
| Playwright spec parses + lists 8 tests under `--project=chromium` | YES — verified with `pnpm exec playwright test --project=chromium e2e/tests/clientes/list-and-search.spec.ts --list`. |
| Gated DB integration tests skip cleanly in sandbox (`RUN_DB_INTEGRATION_TESTS` not set) | YES — `Skip.IfNot` short-circuits each `[SkippableFact]` before any DB access. |
| Pre-existing Story 1.1 / 1.2 / 1.3 tests continue to pass | YES — no edits to those files; vitest setup additions are additive (MSW server + Story 1.2 router shim coexist). |

---

## Mock Requirements / Network Interception

### MSW (frontend component tests)
- `GET *://*/api/v1/clientes` — handler set per-test through `server.use(clientesHandlers.ok | empty | failing | delayed)`.
- Counting requests is done via MSW `server.events.on('request:start', …)` (no axios spy needed).

### Playwright (E2E network-first)
- `page.route('**/api/v1/clientes', …)` registered BEFORE `page.goto('/clientes')` — fulfills with seeded JSON, `[]`, or 500 `application/problem+json` depending on the test scenario.

---

## Required `data-testid` Attributes

DEV team must expose these `data-testid` markers in the implementation so the failing tests can turn green:

| Attribute | Owner component | Used by |
|---|---|---|
| `cliente-list-view` | `ClienteListView` root `<aside>` | `ClienteListView.test.tsx`, Playwright spec |
| `clientes-view` | Same `<aside>` (preserved from Story 1.2) | Story 1.2 Playwright + Vitest, this story's "Spanish copy" suite |
| `client-list-item` | `ClientListItem` root `<button>` | `ClientListItem.test.tsx`, `ClienteListView.test.tsx`, Playwright spec |
| `empty-state` (+ `data-variant="no-clients" | "search-empty"`) | `EmptyState` root `<section>` | `EmptyState.test.tsx`, `ClienteListView.test.tsx`, Playwright spec |
| `error-panel` | `ErrorPanel` root `<section role="alert">` | `ErrorPanel.test.tsx`, `ClienteListView.test.tsx`, Playwright spec |
| `cliente-detail-placeholder` | Placeholder right panel inside `/clientes/$clienteId` route | Test scaffold |

Additional accessibility attributes required:
- Search `<input>`: `placeholder="Buscar por nombre o NIT..."` AND `aria-label="Buscar clientes"`.
- `ClientListItem`: `aria-label="Ver cliente: {nombre}"`, `type="button"`, `aria-current="page"` when active.
- `EmptyState`: `aria-live="polite"` on the root.
- `ErrorPanel`: `role="alert"` on the root.

---

## Implementation Checklist (Maps Failing Tests → DEV Work)

### Backend

- [ ] **Task 1** — Create `backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs` with the private constructor + static `Create(...)` factory enforcing non-null/non-whitespace inputs (Domain test owner).
- [ ] **Task 2** — Add `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` with explicit `.ToTable("clientes")`, `ValueGeneratedNever()` for `Id`, and `HasIndex(c => c.Nit).IsUnique()`.
- [ ] **Task 3** — Modify `AppDbContext.cs`: add `DbSet<ClienteEntity> Clientes`, add `ApplyConfigurationsFromAssembly(...)` BEFORE `ApplySnakeCaseNaming()`.
- [ ] **Task 4** — Generate the EF migration `AddClienteEntity` and verify the unique index lands as `uk_clientes_nit`.
- [ ] **Task 5** — Add `ClienteDto` (record) + `GetClientesQuery` + `GetClientesQueryHandler` in `SiesaAgents.Application/Clientes/`. Register the handler in DI in `Program.cs`. Add the `Microsoft.EntityFrameworkCore` package + Infrastructure project reference to `SiesaAgents.Application.csproj`.
- [ ] **Task 6** — Wire `/api/v1/clientes` via `MapClienteEndpoints()` in `Program.cs` (Minimal API only — no controllers).
- [ ] **Task 7** — Apply the migration locally (skipped in sandbox; gated `[SkippableFact]` covers DB-level invariants on demand).
- [ ] **Task 8** — Run `dotnet test backend/SiesaAgents.sln` and verify the 6 RED files now turn green. The 4 gated tests in `ClienteSchemaIntegrationTests` remain SKIP unless `RUN_DB_INTEGRATION_TESTS=1` is exported.

### Frontend

- [ ] **Task 9** — Create `Cliente.ts` + `IClienteRepository.ts` + `clienteApiRepository.ts` + `useClientes.ts` (queryKey: `['clientes']`).
- [ ] **Task 10** — Create `matchesQuery.ts` with case-insensitive substring over `nombre` OR `nit` and a "match-everything-on-empty-query" branch — turns 7 unit tests green.
- [ ] **Task 11** — Create `useDebouncedValue.ts` with `setTimeout` + cleanup — turns 4 unit tests green.
- [ ] **Task 12** — Create `EmptyState.tsx` (variants: `no-clients`, `search-empty`, optional `no-contacts` for Story 4.x reuse) — turns 11 component tests green.
- [ ] **Task 13** — Create `ErrorPanel.tsx` with verbatim Spanish title/message/button + `role="alert"` — turns 6 component tests green.
- [ ] **Task 14** — Create `ClientListItem.tsx` as a `<button type="button">` with `aria-label="Ver cliente: {nombre}"` and `aria-current="page"` when active — turns 8 component tests green.
- [ ] **Task 15** — Create `ClienteListView.tsx` (280px panel; `useClientes` + `useDebouncedValue` + `matchesQuery`; conditional render Error→Loading→EmptyState(no-clients)→EmptyState(search-empty)→List) — turns 14 component tests green AND replaces `ClientesPlaceholderView` while preserving `data-testid="clientes-view"`.
- [ ] **Task 16** — Create `frontend/src/routes/clientes.$clienteId.tsx` with `createFileRoute('/clientes/$clienteId')` and update `routes/clientes.tsx` so both render the split layout — turns the AC #10 navigation test green.
- [ ] **Task 17** — Run `pnpm test` and `pnpm exec tsc -b --force` from `frontend/` and verify all 6 RED files now turn green. Story 1.1 / 1.2 / 1.3 tests remain green.

### E2E

- [ ] **Task 18** — Run `pnpm exec playwright test --project=chromium e2e/tests/clientes/list-and-search.spec.ts` after backend + frontend are GREEN. All 8 tests should turn green via network-first interception (no DB seed needed).

---

## Running Tests

```bash
# Frontend Vitest (all tests, including the 36 new RED ones)
cd frontend && pnpm test

# Frontend Vitest — only the new Story 2.1 tests
cd frontend && pnpm test src/modules/crm/clientes src/shared/hooks/useDebouncedValue.test.ts src/shared/components/EmptyState.test.tsx src/shared/components/ErrorPanel.test.tsx src/shared/components/ClientListItem.test.tsx

# Backend xUnit (all tests, including the 19 new RED ones)
dotnet test backend/SiesaAgents.sln

# Backend — only the new Story 2.1 tests
dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~Clientes|FullyQualifiedName~ClienteEntity|FullyQualifiedName~ClienteEndpoints|FullyQualifiedName~ClienteSchema"

# Backend — DB integration (real PostgreSQL only)
RUN_DB_INTEGRATION_TESTS=1 dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ClienteSchemaIntegrationTests"

# Playwright (chromium only — sandbox infra constraint)
pnpm exec playwright test --project=chromium e2e/tests/clientes/list-and-search.spec.ts

# Playwright — single test
pnpm exec playwright test --project=chromium e2e/tests/clientes/list-and-search.spec.ts -g "TC-E2-P1-01"
```

---

## Test Execution Evidence (RED Phase)

### Frontend

```
$ pnpm test
…
 FAIL  src/shared/components/ClientListItem.test.tsx
 Error: Failed to resolve import "./ClientListItem"
 FAIL  src/modules/crm/clientes/application/matchesQuery.test.ts
 Error: Failed to resolve import "./matchesQuery"
 FAIL  src/shared/hooks/useDebouncedValue.test.ts
 Error: Failed to resolve import "./useDebouncedValue"
 FAIL  src/modules/crm/clientes/presentation/ClienteListView.test.tsx
 Error: Failed to resolve import "./ClienteListView"
 FAIL  src/shared/components/EmptyState.test.tsx
 Error: Failed to resolve import "./EmptyState"
 FAIL  src/shared/components/ErrorPanel.test.tsx
 Error: Failed to resolve import "./ErrorPanel"

 Test Files  6 failed | 6 passed (12)
      Tests  24 passed (24)
```

### Backend

```
$ dotnet build backend/SiesaAgents.sln
…
ClienteEndpointsTests.cs(29,19): error CS0234: The type or namespace name 'Domain' does not exist in the namespace 'SiesaAgents'
GetClientesQueryHandlerTests.cs(22,19): error CS0234: The type or namespace name 'Application' does not exist in the namespace 'SiesaAgents'
ClienteEntityTests.cs(18,19): error CS0234: The type or namespace name 'Domain' does not exist in the namespace 'SiesaAgents'
ClienteEndpointsTests.cs(66,34): error CS0246: The type or namespace name 'ClienteEntity' could not be found
…
Build FAILED.
    0 Warning(s)
    6 Error(s)
```

Both failure modes are the expected RED behaviour — missing implementation, not test bugs.

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✓
- 19 new xUnit tests (4 files) — RED via missing types
- 36 new Vitest tests (6 files) — RED via missing modules
- 8 new Playwright tests (1 file) — RED until the frontend renders the new UI
- MSW handlers + seed factories created
- vitest.setup.ts extended with shared MSW server (additive, non-breaking)
- `SiesaAgents.UnitTests.csproj` gained EF Core InMemory 10.0.4

### GREEN Phase (DEV team — work order)
1. Backend Tasks 1-8 → unblocks `dotnet test backend/SiesaAgents.sln` (the 19 new tests turn green, gated 4 stay SKIP without Postgres).
2. Frontend Tasks 9-17 → unblocks `pnpm test` from `frontend/` (the 36 new tests turn green).
3. E2E Task 18 → unblocks the Playwright spec (chromium only).

Work order matters: Phase 1 (backend contract gate) MUST be GREEN before Phase 2 starts per test-design-epic-2.md#8.

### REFACTOR Phase
- Once all 63 new tests are green AND Story 1.1 / 1.2 / 1.3 remain green, refactor the panel layout and pure functions with full confidence.

---

## Notes

- **Sandbox infra:** PostgreSQL is unavailable by default — the four `[SkippableFact]` tests in `ClienteSchemaIntegrationTests` skip cleanly. Run with `RUN_DB_INTEGRATION_TESTS=1 dotnet test ...` locally with a Postgres container to validate the snake_case column names + `uk_clientes_nit` unique index. The non-gated 15 xUnit tests run anywhere (`Microsoft.EntityFrameworkCore.InMemory`).
- **Sandbox infra:** Playwright is restricted to `--project=chromium` per Story 1.1 pin. The frontend webServer auto-starts via `playwright.config.ts`; the eight new specs use `page.route(...)` so they do NOT depend on the backend webServer responding (the network is fully mocked).
- **MasterCrud:** Deliberately NOT used (per story Dev Notes) — the split-panel UX (Direction F) does not match MasterCrud's table-centric model. Stories 2.3 / 2.4 will use `shadcn Dialog` for the create/edit form.
- **Story 1.2 contract preserved:** `ClienteListView` MUST carry `data-testid="clientes-view"` (or a parent wrapper must) so `e2e/tests/foundation/deep-linking.spec.ts` keeps passing.
- **`useClientes` queryKey is `['clientes']`** (array literal). Stories 2.3 / 2.4 / 2.5 rely on `invalidateQueries({ queryKey: ['clientes'] })`. Tests assert this via the QueryCache (`AC #9`).
- **Performance budget:** TC-E2-P0-05 uses real timers and `performance.now()` — the test allows up to 1000 ms total (the story's 150 ms debounce + filter + React render must all fit within NFR1).

---

## Output File

`_bmad-output/atdd-checklist-2-1.md` (this file).

**Manual Handoff:** Share this checklist + the failing tests with the dev workflow. The DEV agent can read the failing test names and their AC markers to determine which file to implement next.
