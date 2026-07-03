# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-07-03
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest+RTL+MSW) + API Integration (xUnit) + Unit (xUnit)

---

## Story Summary

Story 2.1 introduces the first business surface of Epic 2: the `/clientes` master-detail view with a 280 px left panel showing a scrollable, searchable list of clients (real-time client-side filter, debounced), plus the backend `ClienteEntity`, EF Core configuration/migration, and the `GET /api/v1/clientes` Minimal API endpoint. The story also delivers the shared `EmptyState` and `ErrorPanel` primitives.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for.

---

## Acceptance Criteria (Story 2.1)

1. **AC #1** — Desktop `/clientes` renders a 280 px left panel (`w-[280px] flex-shrink-0`) with scrollable list; each item shows `nombre` + `NIT/RUC`; data fetched via TanStack Query key `['clientes']`.
2. **AC #2** — Search input filters the cached list in real time (~150 ms debounce, accent-insensitive, `nombre` OR `nitRuc` substring); no additional API call is triggered; 500-item render + filter completes in < 1 s.
3. **AC #3** — Empty response renders `<EmptyState>` in Spanish; list container + skeleton are NOT rendered concurrently.
4. **AC #4** — Backend failure renders `<ErrorPanel>` with a Spanish `Reintentar` button; clicking calls `refetch()`; raw error / status codes never leak (NFR6).
5. **AC #5** — `react-loading-skeleton` placeholder is visible while `isLoading`; dismissed on resolve.
6. **AC #6** — `AddClientes` migration creates the `clientes` table with snake_case columns exactly `id, nombre, nit_ruc, telefono, ciudad, created_at, updated_at`, primary key `pk_clientes` on `id`, and unique index `uk_clientes_nit_ruc` on `nit_ruc`; NO `contactos` table.
7. **AC #7** — `GET /api/v1/clientes` returns 200 with a JSON array (no envelope); each item has camelCase fields `id`, `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`, `updatedAt`; timestamps are ISO-8601 with offset (`DateTimeOffset`); empty table returns `[]` (not `null`); endpoint is registered as Minimal API via `MapGroup("/api/v1/clientes")`.
8. **AC #8** — `ClienteEntity` at `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` declares `Guid Id`, `string Nombre/NitRuc/Telefono/Ciudad`, `DateTimeOffset CreatedAt/UpdatedAt`. Reflection asserts `CreatedAt` type is `DateTimeOffset`. No `DateTime` property exists.
9. **AC #9** — `tsc -b` (frontend) + `dotnet build` (backend) → 0 errors, 0 warnings; no `any` casts in new TS code.
10. **AC #10** — TC-E2-P1-01 / TC-E2-P1-02 / TC-E2-P1-03 / TC-E2-P1-11 / TC-E2-P2-01 / TC-E2-P2-02 all pass (or `Skip`-guarded for Docker-less sandbox).
11. **AC #11** — All user-facing text in Spanish; code identifiers in English.

---

## Failing Tests Created (RED Phase)

### Component Tests (Vitest + React Testing Library + MSW)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (~330 lines) — **14 tests**

Covers ACs #1, #2, #3, #4, #5, #11 via a `<QueryClientProvider>` wrapping `<ClienteListView>` and an MSW `setupServer` that swaps handlers per test.

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 1 | should render all 500 clients on initial load | RED — `ClienteListView` module does not exist | TC-E2-P1-01, AC #1 |
| 2 | should render the search input with Spanish placeholder | RED — component missing | TC-E2-P1-01, AC #2, AC #11 |
| 3 | should filter visible list to items matching "Cliente 42" after typing | RED — component missing | TC-E2-P1-01, AC #2 |
| 4 | should complete the search → filtered DOM update in under 1 second (NFR1) | RED — component missing | TC-E2-P1-01, NFR1 |
| 5 | should NOT trigger a second GET on keystrokes (client-side filtering) | RED — component missing | TC-E2-P1-01, AC #2 |
| 6 | should render the EmptyState when the API returns [] | RED — `EmptyState.tsx` missing | TC-E2-P1-02, AC #3 |
| 7 | should NOT render the list container when the API returns [] | RED — component missing | TC-E2-P1-02, AC #3 |
| 8 | should NOT render a loading skeleton once the empty response resolves | RED — component missing | TC-E2-P1-02, R12 mitigation |
| 9 | should render Spanish copy in the EmptyState | RED — component missing | TC-E2-P1-02, AC #11 |
| 10 | should render the ErrorPanel when GET fails with 500 | RED — `ErrorPanel.tsx` missing | TC-E2-P1-03, AC #4 |
| 11 | should expose a "Reintentar" button inside the ErrorPanel | RED — component missing | TC-E2-P1-03, AC #4, AC #11 |
| 12 | should refetch and render the list when Reintentar is clicked | RED — component missing | TC-E2-P1-03, AC #4 |
| 13 | should NOT expose raw HTTP status or error.message to the user (NFR6) | RED — component missing | TC-E2-P1-03, NFR6 |
| 14 | should render the loading skeleton before the query resolves | RED — component missing | AC #5 |
| 15 | should dismiss the skeleton once the query resolves with data | RED — component missing | AC #5 |
| 16 | should mount the cliente-list-panel wrapper at desktop viewport | RED — component missing | AC #1 |

**MSW handlers file:** `frontend/src/test/handlers/clientes.ts` (~80 lines) — factory + `list` / `empty` / `error` / `listDelayed` handlers, deterministic `makeCliente` factory, and a `resetClienteFactoryCounter` helper.

### API Integration Tests (xUnit + WebApplicationFactory + Testcontainers Postgres)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (~210 lines) — **3 tests** (TC-E2-P1-11)

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 1 | GetClientes_returns_200_with_empty_array_when_no_rows_exist | RED — endpoint missing | TC-E2-P1-11, AC #7 |
| 2 | GetClientes_returns_200_with_camelCase_fields_when_rows_exist | RED — endpoint + entity missing | TC-E2-P1-11, AC #7 |
| 3 | GetClientes_serialises_createdAt_as_ISO8601_with_offset | RED — entity missing | TC-E2-P1-11, AC #7 |

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClientesMigrationTests.cs` (~170 lines) — **3 tests** (TC-E2-P2-01)

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 4 | AddClientes_migration_creates_snake_case_columns_only | RED — migration missing | TC-E2-P2-01, AC #6 |
| 5 | AddClientes_migration_creates_unique_index_on_nit_ruc | RED — migration missing | TC-E2-P2-01, AC #6 |
| 6 | AddClientes_migration_does_not_create_contactos_table | RED — migration missing | AC #6 scope guard |

**Docker unavailable** in the sandbox — all six Testcontainers-based tests are `[SkippableFact]` and self-skip via the `_dockerAvailable` probe (mirrors the Story 1.3 pattern in `EfCoreMigrationTests`). CI or a local dev machine with Docker will exercise them for real.

### Unit Tests (xUnit)

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs` (~85 lines) — **5 tests** (TC-E2-P2-02)

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 7 | ClienteEntity_CreatedAt_property_type_is_DateTimeOffset | RED — entity missing | TC-E2-P2-02, AC #8 |
| 8 | ClienteEntity_UpdatedAt_property_type_is_DateTimeOffset | RED — entity missing | AC #8 |
| 9 | ClienteEntity_has_no_naive_DateTime_properties | RED — entity missing | AC #8, R13 |
| 10 | ClienteEntity_Id_is_Guid | RED — entity missing | AC #8 |
| 11 | ClienteEntity_declares_all_required_domain_properties | RED — entity missing | AC #8 |

The unit test file runs everywhere (no external dependencies), so R13 stays covered even when the migration tests self-skip.

### E2E Tests

Story 2.1 does not introduce a new E2E spec — the pre-existing `e2e/tests/clientes/clientes-crud.spec.ts` (owned by the Epic 2 test framework) covers the smoke path against the real backend. Per the story's Task 11, its FR1 and FR2 cases will transition from RED to GREEN once the frontend markup + backend endpoint land.

**Note on selector alignment**: The pre-existing `ClientesPage` page object references `page.getByTestId('clientes-list-panel')` (plural), while the story mandates `cliente-list-panel` (singular). The story explicitly instructs the DEV to align markup to the page object contract; this ATDD spec uses the singular `cliente-list-panel` per the story's Task 8 spec, which is the authoritative source for Story 2.1 selectors. If a mismatch surfaces during GREEN, adjust the page object to match — the test-design of Epic 2 identifies `cliente-list-item`, `cliente-list-search`, `cliente-list` as canonical.

---

## Total Test Count

- Component tests: **16** (all RED)
- API integration tests: **6** (all RED, Docker-guarded)
- Unit tests: **5** (all RED)
- **Grand total: 27 new failing tests**

---

## Data Factories Created

### `makeCliente` (frontend)

**File:** `frontend/src/test/handlers/clientes.ts`

**Exports:**
- `makeCliente(overrides?)` — deterministic Cliente factory with Spanish domain defaults (`Bogotá`, Colombia-style NIT, ISO-8601+offset timestamps). Counter-based unique ID + NIT/RUC.
- `resetClienteFactoryCounter()` — resets the module-level counter for tests that depend on stable sequences.
- `clientesHandlers.list(data)` — MSW handler returning `data` on `GET /api/v1/clientes`.
- `clientesHandlers.empty()` — MSW handler returning `[]`.
- `clientesHandlers.error(status)` — MSW handler returning an HTTP error.
- `clientesHandlers.listDelayed(data, ms)` — MSW handler with an artificial delay (used to exercise the loading skeleton).

**Example:**
```typescript
const fixture = Array.from({ length: 500 }, (_, i) =>
  makeCliente({ nombre: `Cliente ${i}`, nitRuc: `NIT-${i}` }),
)
server.use(clientesHandlers.list(fixture))
```

### Backend entity seeding

Direct `AppDbContext` insert of `ClienteEntity` — no faker/factory helper (the surface is small; the integration tests hand-roll 3 rows).

---

## Fixtures Created

- **MSW `setupServer`** — instantiated at the top of the component test file (network-first pattern, handlers swapped per test).
- **`makeQueryClient()`** — helper inside the component test file that creates a fresh TanStack `QueryClient` per test with retries + gcTime disabled for determinism.
- **`renderWithClient(ui)`** — wraps `render()` with `<QueryClientProvider>`.

No cross-suite Playwright fixture is required — Story 2.1's E2E path reuses the existing `base.fixture.ts`.

---

## Mock Requirements

**MSW request handlers** (`frontend/src/test/handlers/clientes.ts`):

| Handler | Endpoint | Response | Purpose |
|---------|----------|----------|---------|
| `list(data)` | `GET */api/v1/clientes` | `200 [data]` | Happy path — populated list |
| `empty()` | `GET */api/v1/clientes` | `200 []` | EmptyState render |
| `error(status)` | `GET */api/v1/clientes` | `status` (null body) | ErrorPanel render |
| `listDelayed(data, ms)` | `GET */api/v1/clientes` | `200 [data]` after `ms` | Skeleton state |

**Backend integration tests** — no mocks. `WebApplicationFactory<Program>` + Testcontainers Postgres provides a real DB.

---

## Required `data-testid` Attributes

### `ClienteListView` (`frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`)

- `cliente-list-panel` — outer `<aside>` (280 px, `hidden lg:flex`).
- `cliente-list-search` — search input.
- `cliente-list` — scrollable list container (`<ul>` or `<div>`).
- `cliente-list-skeleton` — `react-loading-skeleton` wrapper visible while `isLoading`.

### `ClientListItem` (`frontend/src/shared/components/ClientListItem.tsx`)

- `cliente-list-item` — each `<li>` in the list.

### `EmptyState` (`frontend/src/shared/components/EmptyState.tsx`)

- `empty-state` — root container; Spanish copy `"Aún no hay clientes"`.

### `ErrorPanel` (`frontend/src/shared/components/ErrorPanel.tsx`)

- `error-panel` — root container.
- `error-panel-retry` — the siesa-ui-kit `Button` labelled `"Reintentar"`.

**Implementation example:**
```tsx
<aside data-testid="cliente-list-panel" className="hidden lg:flex w-[280px] flex-shrink-0 flex-col border-r border-slate-200 h-full">
  <div className="p-3 border-b border-slate-200">
    <Input data-testid="cliente-list-search" placeholder="Buscar cliente…" aria-label="Buscar cliente por nombre o NIT/RUC" />
  </div>
  <div className="flex-1 overflow-y-auto">
    {isLoading && <div data-testid="cliente-list-skeleton"><Skeleton count={6} height={48} /></div>}
    {isError && <ErrorPanel onRetry={refetch} />}
    {data?.length === 0 && !isLoading && <EmptyState title="Aún no hay clientes" description="Cuando registres el primero aparecerá aquí." />}
    {data && data.length > 0 && (
      <ul data-testid="cliente-list">
        {filtered.map((cliente) => (
          <ClientListItem key={cliente.id} cliente={cliente} />
        ))}
      </ul>
    )}
  </div>
</aside>
```

---

## Implementation Checklist

### Test 1–5 (AC #1, #2 — list + search): `ClienteListView.test.tsx` TC-E2-P1-01

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` interface (id, nombre, nitRuc, telefono, ciudad, createdAt, updatedAt).
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` with `getAll(signal?): Promise<Cliente[]>`.
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` using `apiClient.get`.
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` with `queryKey: ['clientes']`, `staleTime: 30_000`.
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — 280 px `<aside>`, search input with 150 ms debounce (`useDeferredValue` or custom), `useMemo` filter with accent-insensitive normalise, render list of `ClientListItem`.
- [ ] Add `data-testid` values: `cliente-list-panel`, `cliente-list-search`, `cliente-list`, `cliente-list-skeleton`, `cliente-list-item`.
- [ ] Run: `pnpm --filter frontend test -- ClienteListView.test.tsx --run --reporter=verbose`
- [ ] Expected: tests 1–5 GREEN.

### Test 6–9 (AC #3 — EmptyState): TC-E2-P1-02

- [ ] Create `frontend/src/shared/components/EmptyState.tsx` with `data-testid="empty-state"` and Spanish copy.
- [ ] Guard render with `data?.length === 0 && !isLoading` inside `ClienteListView`.
- [ ] Expected: tests 6–9 GREEN.

### Test 10–13 (AC #4 — ErrorPanel + Reintentar): TC-E2-P1-03

- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with `data-testid="error-panel"` + a `Button` `data-testid="error-panel-retry"` labelled `Reintentar`. Static Spanish `title` / `description` — NO `error.message` leak.
- [ ] Wire `<ErrorPanel onRetry={refetch} />` inside `ClienteListView` under the `isError` branch.
- [ ] Expected: tests 10–13 GREEN.

### Test 14–15 (AC #5 — Skeleton)

- [ ] Wrap the `isLoading` branch in `<div data-testid="cliente-list-skeleton"><Skeleton count={6} height={48} /></div>`.
- [ ] Expected: tests 14–15 GREEN.

### Test 16 (AC #1 — panel wrapper)

- [ ] Ensure the outer `<aside>` has `data-testid="cliente-list-panel"` and Tailwind `hidden lg:flex w-[280px] flex-shrink-0 …`.
- [ ] Expected: test 16 GREEN.

### Test 1–3 (AC #7 — endpoint): `ClienteEndpointsTests.cs` TC-E2-P1-11

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (Guid Id, Nombre, NitRuc, Telefono, Ciudad, DateTimeOffset CreatedAt/UpdatedAt).
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with `GetAllAsync(ct)`.
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext` and enable `ApplyConfigurationsFromAssembly(...)` before `ApplySnakeCaseNaming()`.
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — `ToTable("Clientes")`, key on `Id`, IsRequired on all string fields, `HasIndex(NitRuc).IsUnique()`.
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` with `AsNoTracking().OrderByDescending(CreatedAt).ToListAsync(ct)`.
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` (record with 7 fields).
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` + `GetClientesQueryHandler.cs`.
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with `MapGroup("/api/v1/clientes").MapGet(...)`.
- [ ] Update `Program.cs` — register repo + handler in DI, add `app.MapClienteEndpoints()` after CORS/OpenAPI/Scalar.
- [ ] Expected: tests 1–3 GREEN when Docker is available; `Skip` otherwise.

### Test 4–6 (AC #6 — migration): `ClientesMigrationTests.cs` TC-E2-P2-01

- [ ] From `backend/`, run: `dotnet ef migrations add AddClientes --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
- [ ] Inspect the generated `*_AddClientes.cs` — verify snake_case columns + `uk_clientes_nit_ruc` unique index + `pk_clientes` PK; no `contactos` table.
- [ ] Expected: tests 4–6 GREEN when Docker is available; `Skip` otherwise. Manual verification via `psql -c "\d clientes"` when Docker is off.

### Test 7–11 (AC #8 — entity): `ClienteEntityTests.cs` TC-E2-P2-02

- [ ] Ensure `ClienteEntity.CreatedAt` and `ClienteEntity.UpdatedAt` are declared as `DateTimeOffset`.
- [ ] Ensure `Id` is `Guid`.
- [ ] Ensure no `DateTime` (naive) property leaks in.
- [ ] Expected: tests 7–11 GREEN — runs everywhere, no Docker needed.

---

## Running Tests

```bash
# ---- Frontend (Vitest) ----
# All tests
pnpm --filter frontend test

# Only Story 2.1 component tests
pnpm --filter frontend test -- ClienteListView.test.tsx

# ---- Backend (xUnit) ----
# All tests (Testcontainers ones self-skip if Docker unavailable)
dotnet test backend/SiesaAgents.sln

# Only Story 2.1 endpoint tests
dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ClienteEndpointsTests"

# Only Story 2.1 migration tests
dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ClientesMigrationTests"

# Only Story 2.1 entity unit tests (no Docker dependency)
dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ClienteEntityTests"

# ---- E2E (Playwright) — pre-existing spec ----
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/clientes/clientes-crud.spec.ts --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- 27 new tests written and failing (16 component + 6 integration + 5 unit).
- Component tests use MSW `setupServer` + fresh `QueryClient` per test — deterministic, isolated, no shared state.
- Integration tests use Testcontainers Postgres + `WebApplicationFactory<Program>` with the Docker-availability probe (Story 1.3 pattern).
- Entity unit tests use pure reflection — run everywhere, guard R13 even without Docker.
- All selectors are `data-testid`; no CSS classes, no XPath, no text-only matching for interactive elements.
- All assertions are atomic (one behavioural claim per test). Given-When-Then structure is applied consistently.

### GREEN Phase (DEV — Next Steps)

Work top-to-bottom through the implementation checklist:

1. **Task 1 (Domain entity)** → unblocks all `ClienteEntity*` tests (7–11).
2. **Task 2 + 3 (DbContext + migration)** → unblocks `ClientesMigrationTests` (4–6).
3. **Task 4 (Endpoint pipeline)** → unblocks `ClienteEndpointsTests` (1–3).
4. **Task 6 (FE domain/app/infra layers)** → foundation for the component tests.
5. **Task 7 (EmptyState + ErrorPanel)** → unblocks tests 6–13.
6. **Task 8 (ClienteListView + ClientListItem)** → unblocks tests 1–5 + 14–16.
7. **Task 9 (Route mount)** → E2E path integration.
8. **Task 10 (Frontend test wiring)** — already scaffolded by this ATDD workflow (MSW handlers file exists).
9. **Task 12 (Verification)** → run all suites.

Run the filtered command after each task and check off the boxes in this checklist.

### REFACTOR Phase (DEV — After All Tests Pass)

- Extract the 150 ms debounce into a shared `useDebouncedValue` hook if it will be reused in Stories 2.6 (sort).
- Consider extracting `normalizeForSearch` (`normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()`) into `src/shared/lib/text.ts` — will be needed again in future filter surfaces.
- Ensure `EmptyState` / `ErrorPanel` are used from `src/shared/components/` in Story 2.2's detail view — do not duplicate.

---

## Knowledge Base References Applied

- **test-quality.md** — one behavioural assertion per test; Given-When-Then structure; deterministic MSW handlers; fresh QueryClient per test.
- **selector-resilience.md** — data-testid selectors exclusively; no CSS class selectors; `role`+`name` only for accessibility assertions.
- **network-first.md** — MSW `server.use(...)` invoked BEFORE `render()` so intercepts are in place before the query runs.
- **data-factories.md** — `makeCliente` factory with overrides and a `resetCounter` helper; deterministic IDs; ISO-8601+offset timestamps.
- **fixture-architecture.md** — `renderWithClient` helper composes `QueryClientProvider` around the SUT; fresh `QueryClient` per test with `retry: false, gcTime: 0`.
- **timing-debugging.md** — no `setTimeout` waits in tests; `waitFor` and `findByTestId` for async DOM updates; `performance.now()` for NFR1 measurement.
- **component-tdd.md** — RED-phase generation; component isolated behind a query provider; skeleton assertion via delayed MSW response.
- **test-healing-patterns.md** — MSW handlers count requests to prove client-side filtering (no fetch on keystrokes) and to prove refetch on Reintentar.

---

## Test Execution Evidence

### Initial RED Verification (manual)

Not executed automatically by this workflow — the `sa-tea-atdd-run` sub-agent in the orchestration pipeline is responsible for running the suites and reporting the pass/fail counts. Expected RED counts:

- Vitest: 16 new tests fail (component, missing imports for `@/modules/crm/clientes/presentation/ClienteListView`).
- xUnit integration: 6 tests either fail (endpoint missing) or self-skip (Docker unavailable — expected in the sandbox).
- xUnit unit: 5 tests fail (`ClienteEntity` type does not exist yet).

---

## Notes

- **Docker unavailable** in the sandbox → all 6 Testcontainers-based tests self-skip via `SkippableFact` + `IsDockerAvailable()` probe. TC-E2-P2-02 (entity) stays covered by the pure-reflection unit tests.
- **Selector alignment**: the pre-existing `e2e/pages/clientes.page.ts` uses `clientes-list-panel` (plural). This ATDD spec uses `cliente-list-panel` (singular) per the story's Task 8 spec. During GREEN, the DEV should update the page object to align (the story is the authoritative source, not the outdated page object).
- **MSW request-counting pattern**: the "no additional fetch on keystroke" test and the "Reintentar refetch" test both instrument the handler with a local counter and assert against it — this is stronger than mocking a spy on the axios client and does not require internal knowledge of the transport.
- **No hard waits**: every async check uses `waitFor` or `findByTestId` with the default 1000 ms timeout. `performance.now()` is used only for the NFR1 measurement (does not gate test flow).
- **`onUnhandledRequest: 'error'`** on the MSW server ensures any missed handler surfaces as a test failure — no silent fallthroughs.
- **`e2e/pages/clientes.page.ts` mismatches**: `clientes-list-panel` (page object) vs. `cliente-list-panel` (story) — the story is authoritative; align the page object during GREEN. The E2E FR1/FR2 tests will need adjustment if the alignment reveals other drift.

---

**Generated by BMad TEA Agent (sa-tea-atdd) — 2026-07-03**
