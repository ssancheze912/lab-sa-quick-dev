# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) — secondary E2E (Playwright) + API Integration (xUnit + Testcontainers)

---

## Story Summary

As a commercial team member, I want to see a list of all clients and search them by name or NIT/RUC, so that I can quickly find the client I'm looking for.

**As a** commercial team member
**I want** to see a list of all clients and filter them client-side by Nombre or NIT/RUC
**So that** I can quickly find the client I am looking for without server round-trips

---

## Acceptance Criteria

1. AC #1 — Backend migration creates `clientes` table with snake_case columns + `uk_clientes_nit` unique index + `ix_clientes_nombre_trgm` GIN trigram index + `pg_trgm` extension.
2. AC #2 — `GET /api/v1/clientes` returns `200` with a `ClienteDto[]`; `[]` for empty DB; `?search=` filters case-insensitively over `nombre` OR `nit`.
3. AC #3 — `/clientes` renders a 280 px left panel with a scrollable list of `ClientListItem` (Nombre + NIT/RUC).
4. AC #4 — Real-time client-side filter (150 ms debounce) over the TanStack Query cache; no extra fetch fires when typing; renders < 1 s with 500 records (NFR1).
5. AC #5 — `EmptyState` variants `no-clients` (empty backend) and `search-empty` (filtered-out cache).
6. AC #6 — `ErrorPanel` with `Reintentar` when the initial GET fails; no technical detail leaks (NFR6).
7. AC #7 — 5 skeleton placeholders during the pending state inside a `role="status"` / `aria-busy="true"` region.

---

## Failing Tests Created (RED Phase)

### E2E Tests (8 tests)

**File:** `e2e/tests/clientes/list-search.atdd.spec.ts`

- AC #3 — left panel exposes `data-testid="client-list-panel"` with width 280 px
- AC #3 — each client list item renders Nombre and NIT/RUC
- AC #4 — typing in search filters by Nombre client-side (no extra GET)
- AC #4 — search input also matches by NIT/RUC, case-insensitively
- AC #5 — empty backend → `data-testid="empty-state-no-clients"` with UX-spec copy
- AC #5 — non-empty cache + unmatchable query → `data-testid="empty-state-search-empty"`
- AC #6 — first GET 500 → `data-testid="error-panel"` → Reintentar → list renders + NFR6 leak check
- AC #7 — 5 skeleton placeholders during the pending state

### API Integration Tests (6 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Api/ClientesEndpointAtddTests.cs`

- `GetClientes_EmptyDatabase_Returns200WithEmptyArray`
- `GetClientes_WithSeededRows_ReturnsClienteDtoShapeWithCamelCase` (asserts `nitRuc`, `createdAt`, …)
- `GetClientes_ReturnsClientsOrderedByCreatedAtDesc`
- `GetClientes_WithSearchParam_FiltersOnNombreCaseInsensitively`
- `GetClientes_WithSearchParam_FiltersOnNitCaseInsensitively`
- `GetClientes_WithBlankSearchParam_ReturnsAllRows`

### Schema Integration Tests (5 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/ClientesSchemaAtddTests.cs`

- `Migrate_CreatesClientesTable_WithSnakeCaseColumns`
- `Migrate_CreatesUniqueIndexOnNit` (`uk_clientes_nit`)
- `Migrate_CreatesGinTrigramIndexOnNombre` (`ix_clientes_nombre_trgm` using `gin_trgm_ops`)
- `Migrate_InstallsPgTrgmExtension`
- `Migrate_ClientesTableHasUuidPrimaryKey`

### Backend Unit Tests (Domain — 11 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityAtddTests.cs`

- `Create_WithValidFields_ReturnsEntityWithGeneratedIdAndTimestamps`
- `Create_WithMissingNombre/Nit/Telefono/Ciudad_ThrowsArgumentException` (4 × 3 theory rows = 12 cases)
- `Create_WithNombreOver200Chars_ThrowsArgumentException`
- `Create_WithNitOver50Chars_ThrowsArgumentException`
- `Create_WithTelefonoOver50Chars_ThrowsArgumentException`
- `Create_WithCiudadOver100Chars_ThrowsArgumentException`
- `Entity_CreatedAt_IsDateTimeOffset_NotDateTime`

### Backend Unit Tests (Application — 4 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerAtddTests.cs`

- `HandleAsync_NoSearch_DelegatesNullToRepositoryAndReturnsMappedDtos`
- `HandleAsync_WithSearch_PassesFragmentToRepository`
- `HandleAsync_EmptyRepository_ReturnsEmptyList`
- `HandleAsync_MapsEntityFieldsToDtoFields` (asserts `entity.Nit` → `dto.NitRuc`)

### Component Tests (Vitest + RTL + MSW — 30+ tests across 4 files)

- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (10 tests)
  - Skeletons during pending (AC #7)
  - 280 px panel (TC-E2-P1-08 / AC #3)
  - Items show Nombre + NIT/RUC (AC #3)
  - Search filter by Nombre — no extra fetch (TC-E2-P2-04 / AC #4)
  - Search filter by NIT (AC #4)
  - Empty backend → `no-clients` EmptyState (TC-E2-P2-01 / AC #5)
  - Empty filter → `search-empty` EmptyState (AC #5)
  - Initial GET 500 → ErrorPanel → Reintentar → recovers (TC-E2-P1-07 / AC #6)
  - NFR6 — ErrorPanel does not leak detail
  - Search renders in < 1 s with 500 fixtures (TC-E2-P0-04 UI leg)
  - Search input placeholder + aria-label
- `frontend/src/modules/crm/clientes/application/useClientes.test.tsx` (3 tests)
- `frontend/src/shared/components/EmptyState/EmptyState.test.tsx` (6 tests)
- `frontend/src/shared/components/ErrorPanel/ErrorPanel.test.tsx` (5 tests)
- `frontend/src/shared/components/ClientListItem/ClientListItem.test.tsx` (6 tests)

---

## Data Factories / Fixtures Created

### `buildClienteFixture` + `buildClienteFixtures` + handler helpers

**File:** `frontend/src/mocks/handlers/clientes.ts`

**Exports:**

- `buildClienteFixture(overrides?)` — generates one `ClienteDto`-shaped fixture
- `buildClienteFixtures(count)` — generates an array of N fixtures
- `clienteHandlers(fixtures?)` — MSW handler returning the provided fixtures (default 3)
- `clienteHandlersEmpty()` — MSW handler returning `[]`
- `clienteHandlers500()` — MSW handler returning 500 fixtures (NFR1)
- `clienteHandlersError()` — MSW handler returning a 500 Problem Details body

### MSW server (test-only)

**File:** `frontend/src/mocks/server.ts` — wired into `frontend/src/test-setup.ts` via `beforeAll/afterEach/afterAll`. Honors per-suite `server.use(...)` overrides.

### Backend seeding

The API integration tests seed rows directly through ADO.NET against the snake_case schema so they do not depend on the (yet-to-exist) `ClienteEntity`. Once the entity ships, the same seeder still works because it targets the snake_case columns.

The existing E2E `buildCliente()` factory (`e2e/helpers/data.helper.ts`) is reused.

---

## Mock Requirements

| Service | Endpoint | Test handler | Notes |
|---------|----------|--------------|-------|
| `GET /api/v1/clientes` | success | `clienteHandlers(fixtures)` | Default 3-row payload, camelCase |
| `GET /api/v1/clientes` | empty | `clienteHandlersEmpty()` | Drives `no-clients` EmptyState |
| `GET /api/v1/clientes` | 500 | `clienteHandlersError()` | Drives ErrorPanel + Reintentar |
| `GET /api/v1/clientes` | NFR1 | `clienteHandlers500()` | 500-row payload for perf test |

No real backend mock is needed — Playwright E2E tests use `page.route` interception inline (see test file).

---

## Required data-testid Attributes

These attributes MUST be added to the UI implementation. Tests will remain RED until they exist.

### ClienteListView (`/clientes`)

- `client-list-panel` — root `<aside>` of the 280 px list panel
- `client-search-input` — siesa-ui-kit `<Input>` for the search query
- `client-list-skeleton` — skeleton container with `role="status"` / `aria-busy="true"` / `aria-label="Cargando clientes"`
- `client-list-skeleton-item` — each of the 5 skeleton placeholders

### ClientListItem

- `client-list-item-{id}` — each item, rendered as a `<button>` with `aria-label="Ver cliente: {nombre}"`

### EmptyState

- `empty-state-no-clients` — variant `no-clients` root
- `empty-state-search-empty` — variant `search-empty` root

### ErrorPanel

- `error-panel` — root container
- `error-panel-retry` — the Reintentar button (also reachable by accessible name)

---

## Implementation Checklist

### Test: ClienteEntity contract (RED → GREEN)

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with sealed class, private ctor, static `Create()` factory, `Update()` method
- [ ] Use `DateTimeOffset` for `CreatedAt`/`UpdatedAt` — never `DateTime`
- [ ] Enforce required-field validation (FR8) + length caps in `Create()`
- [ ] Remove `.gitkeep` from `Domain/Clientes/Entities/`
- [ ] Run `dotnet test backend/tests/SiesaAgents.UnitTests/`
- [ ] All `ClienteEntityAtddTests` pass

### Test: IClienteRepository + GetClientesQueryHandler

- [ ] Create `IClienteRepository` in `Domain/Clientes/Interfaces/`
- [ ] Create `ClienteDto` record in `Application/Clientes/DTOs/` (field name `NitRuc` mapped from `Nit`)
- [ ] Create `GetClientesQuery` + `GetClientesQueryHandler`
- [ ] Wire DI registration
- [ ] Run unit tests; `GetClientesQueryHandlerAtddTests` pass

### Test: clientes schema migration

- [ ] Create `ClienteConfiguration` (`Infrastructure/Data/Configurations/`) with `HasIndex` for `uk_clientes_nit` + GIN trigram on `Nombre`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Register `pg_trgm` extension via `modelBuilder.HasPostgresExtension("pg_trgm")` BEFORE `ApplySnakeCaseNaming()`
- [ ] Run `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Run integration tests; `ClientesSchemaAtddTests` pass

### Test: GET /api/v1/clientes endpoint

- [ ] Create `ClienteRepository` in `Infrastructure/Repositories/` (uses `EF.Functions.ILike`)
- [ ] Create `ClienteEndpoints.cs` in `API/Endpoints/`
- [ ] Wire `app.MapClienteEndpoints()` in `Program.cs`
- [ ] Run integration tests; `ClientesEndpointAtddTests` pass

### Test: Frontend — useClientes hook

- [ ] Create `Cliente.ts` + `IClienteRepository.ts` in `modules/crm/clientes/domain/`
- [ ] Create `clienteApiRepository.ts` in `modules/crm/clientes/infrastructure/`
- [ ] Create `useClientes.ts` (wraps `useQuery`)
- [ ] Run `pnpm --filter frontend test`; `useClientes.test.tsx` passes

### Test: Frontend — EmptyState + ErrorPanel + ClientListItem

- [ ] Create `shared/components/EmptyState/EmptyState.tsx` (variants + a11y region + CTA)
- [ ] Create `shared/components/ErrorPanel/ErrorPanel.tsx` (props limited to `{ onRetry }`)
- [ ] Create `shared/components/ClientListItem/ClientListItem.tsx` (`<button>` + aria-label + data-testid)
- [ ] Add barrel `index.ts` for each
- [ ] All colocated component tests pass

### Test: Frontend — ClienteListView

- [ ] Create `modules/crm/clientes/presentation/ClienteListView.tsx`
- [ ] Implement the 5 render branches: pending → error → no-clients → search-empty → list
- [ ] Wire the search input with `useState` + 150 ms debounce + `useMemo` filter (client-side, no fetch)
- [ ] Wrap in `<aside data-testid="client-list-panel" className="w-[280px] …">`
- [ ] Update `frontend/src/routes/clientes.tsx` to mount `ClienteListView` + right-pane placeholder
- [ ] All `ClienteListView.test.tsx` tests pass

### Test: E2E

- [ ] All backend + frontend implementation in place, dev server runnable
- [ ] Run `pnpm exec playwright test e2e/tests/clientes/list-search.atdd.spec.ts`
- [ ] All 8 E2E scenarios pass

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All tests created, located alongside source paths
- MSW server + handlers wired into Vitest setup
- NSubstitute + FluentAssertions added to backend UnitTests csproj
- Expected outcome: every test fails because the corresponding component / endpoint / entity does NOT yet exist

### GREEN Phase (Dev Team)

1. Start with the Domain entity (`ClienteEntity`) — fastest feedback loop
2. Move outward through Repository → Query Handler → Endpoint → Migration
3. Switch to the Frontend; start with `useClientes` hook + `EmptyState`/`ErrorPanel` shared components
4. Compose `ClienteListView`; the route mount is the last step
5. Finally run the E2E suite

### REFACTOR Phase

- Tests are the safety net — refactor freely once green
- Common candidates: extract debounce into a `useDebouncedValue` hook, hoist the search predicate into a pure helper unit-tested separately

---

## Running Tests

```bash
# Backend — Domain + Application unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/

# Backend — API + Schema integration tests (Testcontainers Postgres 18)
dotnet test backend/tests/SiesaAgents.IntegrationTests/

# Frontend — Vitest (component + hook)
pnpm --filter frontend test

# E2E — Playwright (requires backend + frontend running)
pnpm exec playwright test e2e/tests/clientes/list-search.atdd.spec.ts
```

---

## Knowledge Base References Applied

- `network-first.md` — every E2E test uses `page.route(...)` BEFORE `page.goto(...)`
- `data-factories.md` — `buildClienteFixture` + `buildClienteFixtures` use random ids + fields; tests override only what they assert on
- `fixture-architecture.md` — MSW server wired via `setupFiles`; per-suite `server.use(...)` is the composable layer
- `component-tdd.md` — RTL + MSW for branches (`pending` / `success` / `empty` / `error` / `search-empty`)
- `test-quality.md` — Given-When-Then, single behavioural assertion focus per test, deterministic via MSW
- `selector-resilience.md` — `data-testid` everywhere; ARIA names where they map to user intent

---

## Notes

- Story 2.1 introduces both backend (Domain + App + Infra + API) and frontend (Domain + App + Infra + Presentation + Shared) artifacts. Tests are colocated at each level; the ATDD checklist groups them by acceptance criterion for the dev agent.
- Several tests reference the `clientes` table directly via ADO.NET. This is intentional: it makes the API integration tests independent of the (yet-to-be-written) `ClienteEntity`, so the migration step can land before the domain entity is fully fleshed out.
- The 500-record perf assertion uses jsdom's `performance.now()`. The < 1 s threshold is a hard NFR gate (NFR1); the design target is `< 200 ms` after the 150 ms debounce.
- No `MasterCrud` composition is used in Story 2.1 — the custom dual-panel layout is the architectural decision (see story Dev Notes).

---

**Generated by BMad TEA Agent** — 2026-06-29
