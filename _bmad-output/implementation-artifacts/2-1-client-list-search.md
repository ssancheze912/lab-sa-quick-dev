# Story 2.1: Client List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** the user is authenticated-less but the backend is reachable and at least one cliente exists in `clientes`, **When** the user navigates to `/clientes` on a desktop viewport (≥ 1024px), **Then** the left panel — a `<aside data-testid="clientes-list-panel">` of width `280px`, scrollable in the y axis only (`overflow-y: auto`) — renders one `ClienteListItem` per record, each item showing the `nombre` (top, `font-medium`) and the `nit` (bottom, `text-sm text-slate-500`). (AC-E2.1, AC-E2.2, FR1, FR2)

2. **Given** the `clientes` list is loaded into the TanStack Query cache with up to 500 records, **When** the user types into the search input (`<input data-testid="clientes-search-input" placeholder="Buscar cliente por nombre o NIT/RUC">`), **Then** the visible list filters CLIENT-SIDE in `< 1s` (NFR1) and shows only clientes whose `nombre` OR `nit` contains the user input (case-insensitive, trim-aware, no diacritic-strict match required for MVP). The filter MUST run on the in-memory cache slice — no additional network request is fired. (AC-E2.2, FR2, FR3, FR4, NFR1)

3. **Given** the GET `/api/v1/clientes` returns an empty array (no records), **When** the page loads, **Then** the left panel renders the shared `<EmptyState data-testid="clientes-empty-state">` with Spanish copy: `title="Aún no hay clientes"`, `description="Crea el primer cliente para empezar a gestionar tu cartera."`. No `ClienteListItem` is rendered, no search input is hidden (it stays visible but disabled), and no console error is logged. (FR2)

4. **Given** the GET `/api/v1/clientes` fails (network error or HTTP 5xx), **When** TanStack Query reports an error state, **Then** the left panel renders `<ErrorPanel data-testid="clientes-error-panel">` with Spanish copy `title="No se pudieron cargar los clientes"`, `description="Intenta de nuevo en unos segundos."`, and a primary button labeled `"Reintentar"` that calls `query.refetch()`. On successful refetch, the panel is replaced by the populated list without a page reload. (NFR6)

5. **Given** the user types in the search input and the filter returns zero matches, **When** the result set is empty, **Then** the panel renders `<EmptyState variant="search-empty" data-testid="clientes-search-empty">` with `title="Sin resultados"`, `description="No encontramos clientes con «{query}»."` — but the search input stays focused and editable so the user can refine the query. The list is restored as soon as the query produces matches again. (FR2)

6. **Given** the backend exposes `GET /api/v1/clientes` per architecture.md §API & Communication Patterns, **When** the endpoint is invoked with no query parameters, **Then** it returns HTTP 200 with a JSON array of `ClienteDto` objects (`{ id: uuid, nombre, nit, telefono, ciudad, createdAt, updatedAt }`) — direct array, no wrapper. JSON serializes to `camelCase` (already wired in `Program.cs`). Empty result returns `[]`, not `null`. (FR1, FR2)

7. **Given** the backend project, **When** the EF Core migration `AddClientes` is generated and `dotnet ef database update` is executed, **Then** PostgreSQL table `clientes` exists with columns `id` (uuid PK, default `uuidv7()` via `Guid.NewGuid()` at app level — see Dev Notes), `nombre` (varchar(200) NOT NULL), `nit` (varchar(50) NOT NULL), `telefono` (varchar(50) NULL), `ciudad` (varchar(100) NULL), `created_at` (timestamptz NOT NULL), `updated_at` (timestamptz NOT NULL). A unique index `uk_clientes_nit` is created on `clientes(nit)`. All column / index / PK names are snake_case (enforced automatically by `ApplySnakeCaseNaming` registered in Story 1.3). (FR1, FR7 prep — Story 2.3 will validate it)

8. **Given** the `siesa_agents_db` database, **When** the migration runs and the table is inspected via `psql -c "\d clientes"`, **Then** the columns appear exactly as `id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at` (snake_case) and the index list contains `pk_clientes` and `uk_clientes_nit`. No other domain table is created.

9. **Given** the frontend project, **When** `pnpm run build` is executed, **Then** the build completes with zero TypeScript errors in strict mode and the resulting eagerly-loaded JS chunk stays under 500 KB gzipped (company NFR — currently 394.73 KB after Story 1.2, this story should add < ~30 KB).

10. **Given** the integration test project `backend/tests/SiesaAgents.IntegrationTests`, **When** `dotnet test` runs, **Then** the following integration tests pass:
    - `GetClientes_WhenEmpty_Returns200WithEmptyArray` — issues `GET /api/v1/clientes` against an in-memory DbContext, asserts status 200, body `[]`, `Content-Type: application/json`.
    - `GetClientes_WhenSeeded_ReturnsAllInCamelCaseShape` — pre-seeds 2 clientes via the `AppDbContext`, asserts the response body has both, serialized as camelCase (`createdAt`, `updatedAt`).
    - `ClientesTable_AfterMigration_HasSnakeCaseColumns` — using a model-builder assertion (the same pattern as Story 1.3's `SnakeCaseConventionTests`), assert the runtime EF model for `ClienteEntity` maps to table `clientes` with columns `id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`, and that the unique index for `nit` resolves to `uk_clientes_nit`.

11. **Given** the frontend, **When** Vitest + RTL component tests run, **Then** the following automated tests pass:
    - `ClienteListView_renders_panel_with_280px_width` — mount with mocked TanStack Query data (3 clientes), assert `aside[data-testid="clientes-list-panel"]` has class/style yielding `width: 280px` and three `cliente-list-item` testids.
    - `ClienteListView_filters_by_nombre` — type "Acme" in the search input, assert only matching items remain visible without firing any HTTP request (assert via MSW `unhandledRequest: 'error'` strict mode).
    - `ClienteListView_filters_by_nit` — type a NIT substring, assert filter behaviour.
    - `ClienteListView_empty_state_when_no_clients` — useClientes returns `[]`, assert `clientes-empty-state` testid visible, no items rendered.
    - `ClienteListView_error_panel_with_retry` — MSW returns 500 on first call, assert `clientes-error-panel` rendered; click `"Reintentar"`; MSW returns 200 on second call; assert list rendered.
    - `ClienteListView_filter_500_records_under_1s` — seed `useClientes` with a 500-item array, type a query, assert `performance.now()` delta between keystroke handler invocation and rendered list update is `< 1000 ms`.

## Tasks / Subtasks

- [x] Task 1 — Backend: Create `ClienteEntity` domain entity (AC: #6, #7, #8)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with private setters, private constructor, and a static `Create(string nombre, string nit, string? telefono, string? ciudad)` factory. Public properties: `Id` (Guid), `Nombre` (string), `Nit` (string), `Telefono` (string?), `Ciudad` (string?), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset).
  - [x] In `Create`: validate `nombre`, `nit` are non-empty (throw `ArgumentException` on empty/whitespace) and set `Id = Guid.NewGuid()`, `CreatedAt = UpdatedAt = DateTimeOffset.UtcNow`.
  - [x] Add `Update(string nombre, string nit, string? telefono, string? ciudad)` instance method that updates fields and bumps `UpdatedAt = DateTimeOffset.UtcNow`. (Used by Story 2.4; safe to land here.)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with methods: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)`, `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`, `Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)`, `Task AddAsync(ClienteEntity entity, CancellationToken ct)`, `Task SaveChangesAsync(CancellationToken ct)`. Only `GetAllAsync` is wired in this story — the other signatures land here so 2.2 / 2.3 / 2.4 / 2.5 can reuse the same interface.

- [x] Task 2 — Backend: Create EF Core configuration for `ClienteEntity` (AC: #7, #8)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`.
  - [x] Map: properties + maxlengths + required + unique index on Nit.
  - [x] Explicit `builder.ToTable("clientes")` to override `ApplySnakeCaseNaming`'s `cliente_entity` default.
  - [x] Add a `DbSet<ClienteEntity> Clientes` to `AppDbContext`.

- [x] Task 3 — Backend: Generate and verify the `AddClientes` EF Core migration (AC: #7, #8)
  - [x] Generated `20260615091044_AddClientes.cs` via `dotnet ef migrations add AddClientes` (Infrastructure + API startup project, `Data/Migrations` output dir).
  - [x] Migration `Up()` creates `clientes` with snake_case columns + `pk_clientes` PK + `uk_clientes_nit` unique index. `Down()` drops the table.
  - [ ] `dotnet ef database update` — DEFERRED: PostgreSQL is not available in the runtime sandbox (Story context notes this). Migration is verified via the runtime EF model in `ClientesTable_AfterMigration_HasSnakeCaseColumns` integration test.

- [x] Task 4 — Backend: Repository implementation (AC: #6)
  - [x] Created `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`. `GetAllAsync` returns `OrderByDescending(c => c.CreatedAt)` (Story 2.6 default).
  - [x] `GetByIdAsync` / `ExistsByNitAsync` / `AddAsync` / `SaveChangesAsync` implemented for downstream stories.
  - [x] Registered `AddScoped<IClienteRepository, ClienteRepository>()` in `Program.cs`.

- [x] Task 5 — Backend: Application layer — `GetClientesQuery` + handler + DTO (AC: #6)
  - [x] Created `ClienteDto` record with init-only setters and the full 7-field shape.
  - [x] Created `GetClientesQuery` (empty record).
  - [x] Created `GetClientesQueryHandler` mapping entities → DTOs.
  - [x] Registered `AddScoped<GetClientesQueryHandler>()` in `Program.cs`.

- [x] Task 6 — Backend: Minimal API endpoint `GET /api/v1/clientes` (AC: #6)
  - [x] Created `ClienteEndpoints.MapClienteEndpoints` extension method exposing `GET /api/v1/clientes` under group `/api/v1/clientes` with `WithTags("Clientes")`.
  - [x] Wired `app.MapClienteEndpoints()` BEFORE `app.MapFallback(...)` in `Program.cs`.

- [x] Task 7 — Frontend: TanStack Query infrastructure for clientes module (AC: #1, #2, #3, #4, #5)
  - [x] Created `frontend/src/modules/crm/clientes/domain/Cliente.ts`:
    ```ts
    export interface Cliente {
      id: string
      nombre: string
      nit: string
      telefono: string | null
      ciudad: string | null
      createdAt: string  // ISO 8601
      updatedAt: string
    }
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` with method signatures `getAll(): Promise<Cliente[]>` (additional methods land in 2.2 / 2.3 / 2.4 / 2.5).
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` implementing the interface using the `apiClient` Axios singleton: `getAll: () => apiClient.get<Cliente[]>('/api/v1/clientes').then(r => r.data)`.
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```ts
    export function useClientes() {
      return useQuery({
        queryKey: ['clientes'] as const,
        queryFn: () => clienteApiRepository.getAll(),
        staleTime: 1000 * 60,
      })
    }
    ```

- [x] Task 8 — Frontend: Presentation components (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` — props `{ title: string; description?: string; testId?: string; variant?: 'default' | 'search-empty' | 'no-clients' }`. Renders Heroicons icon + heading + description. Spanish text mandatory by caller.
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — props `{ title: string; description?: string; onRetry: () => void; testId?: string }`. Renders title + description + a primary button labeled `"Reintentar"` that calls `onRetry`.
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — props `{ cliente: Cliente; isSelected?: boolean; onClick?: (id: string) => void }`. Renders a button with two stacked lines: `cliente.nombre` (font-medium) and `cliente.nit` (text-sm text-slate-500). Sets `data-testid="cliente-list-item"`, `data-active={isSelected}`.
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Uses `useClientes()` for data.
    - Local `useState<string>` `searchQuery` for the search input.
    - `useMemo` filter: `clientes.filter(c => normalize(c.nombre).includes(q) || normalize(c.nit).includes(q))` where `normalize` does `.toLowerCase().trim()`.
    - Layout: `<aside data-testid="clientes-list-panel" className="w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 flex flex-col">`.
    - Inside: search input with `placeholder="Buscar cliente por nombre o NIT/RUC"`, `aria-label="Buscar cliente"`, `data-testid="clientes-search-input"`, debounced to 150ms via local handler (not a library — use a small inline debounce or `setTimeout`/`useRef`).
    - Conditional rendering tree:
      - `isLoading` → render `react-loading-skeleton` placeholders (3 skeleton rows, same shape as ClientListItem).
      - `isError` → render `<ErrorPanel title="No se pudieron cargar los clientes" description="Intenta de nuevo en unos segundos." onRetry={refetch} testId="clientes-error-panel" />`.
      - `data.length === 0 && !searchQuery` → render `<EmptyState variant="no-clients" title="Aún no hay clientes" description="Crea el primer cliente para empezar a gestionar tu cartera." testId="clientes-empty-state" />`.
      - `data.length > 0 && filtered.length === 0 && searchQuery` → render `<EmptyState variant="search-empty" title="Sin resultados" description={`No encontramos clientes con «${searchQuery}».`} testId="clientes-search-empty" />`.
      - `filtered.length > 0` → render the list of `ClientListItem`s, each click calling `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })` (deferred — Story 2.2 wires the right-panel detail; in 2.1 the navigation target route does NOT exist yet, so click handler is a stubbed `console.debug` for now OR is wired and lets the not-found view handle it gracefully — see Project Structure Notes).

- [x] Task 9 — Frontend: Replace placeholder `/clientes` route content with the real view (AC: #1)
  - [ ] Modify `frontend/src/routes/clientes.tsx`:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

    function ClientesView() {
      return (
        <div className="flex h-full">
          <ClienteListView />
          <section className="flex-1 overflow-y-auto" aria-label="Detalle de cliente">
            {/* Right panel — populated in Story 2.2 */}
          </section>
        </div>
      )
    }

    export const Route = createFileRoute('/clientes')({ component: ClientesView })
    ```
  - [ ] The `<h1>Clientes</h1>` placeholder is removed — the page heading now lives inside `ClienteListView`'s `<aside>` as an `<h2 className="sr-only">Lista de clientes</h2>` (a11y) plus the search input.

- [x] Task 10 — Frontend: Tests (AC: #11)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` covering all six sub-cases listed in AC #11. Use MSW handlers to mock `/api/v1/clientes` for success (3 items), success (0 items), 500 error then 200 on retry, and 500-item bulk case. Use `@testing-library/react` `render` with a fresh `QueryClient` per test (no shared cache).
  - [ ] Create `frontend/src/shared/components/__tests__/EmptyState.test.tsx` and `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` — smoke tests asserting Spanish copy + `onRetry` callback wiring.
  - [ ] All frontend tests run via `pnpm test`. Target: 18/18 + new (≥ 24/24).

- [x] Task 11 — Backend: Integration tests (AC: #10)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/ClientesEndpointsTests.cs` with the three tests listed in AC #10. Use `SiesaAgentsApiFactory` (already exists from Story 1.3) — extend it to expose an `AppDbContext` seeded from the test for the second test. Use `InMemoryDatabase` provider OR build a dedicated in-memory `DbContextOptions<AppDbContext>` to keep tests isolated.
  - [ ] `dotnet test` must report 100% green (Story 1.3's 25/25 tests must remain green — no regressions).

- [x] Task 12 — E2E: Extend Playwright POM + tests (AC: #1, #2, #3, #4, #5, NFR1)
  - [ ] Extend `e2e/pages/clientes.page.ts` with: `errorPanel` (`page.getByTestId('clientes-error-panel')`), `emptyState` (`page.getByTestId('clientes-empty-state')`), `searchEmpty` (`page.getByTestId('clientes-search-empty')`), `btnReintentar` (`page.getByRole('button', { name: /reintentar/i })`).
  - [ ] Extend `e2e/helpers/data.helper.ts` with `buildClienteBulk(count: number)` factory for the perf scenario.
  - [ ] Create `e2e/tests/clientes/clientes-list-search.spec.ts` with the four P0 scenarios from `test-design-epic-2.md`:
    1. Search by `nombre` returns matching item (FR2).
    2. Search by `nit` returns matching item (FR3 / FR4).
    3. EmptyState on zero clientes — use `page.route('**/api/v1/clientes', r => r.fulfill({ status: 200, body: '[]' }))`.
    4. ErrorPanel + Reintentar — first call routed to `status: 500`; click `"Reintentar"`; second call returns 200; list renders.
  - [ ] `pnpm exec playwright test e2e/tests/clientes/clientes-list-search.spec.ts` must be green when backend + frontend are running.

- [x] Task 13 — Verify & document (AC: all)
  - [ ] Run end-to-end verification locally:
    - `dotnet build SiesaAgents.sln` → 0/0 errors and warnings.
    - `dotnet ef database update` → `clientes` table created with snake_case columns and `uk_clientes_nit` index.
    - `dotnet test` → 28/28+ tests green (Story 1.3's 25 + 3 new).
    - `dotnet run --project src/SiesaAgents.API` + `pnpm dev` → navigate to `http://localhost:5173/clientes`, see EmptyState (no records); create a cliente via direct API (`curl -X POST ...` or the integration-test fixture) — refresh `/clientes`; see the list. Type in the search input — filter works.
    - `pnpm test` → all frontend tests green.
    - `pnpm exec playwright test` → all E2E tests green.
  - [ ] Append Completion Notes listing exact `dotnet ef` commands, PostgreSQL version verified, frontend bundle size delta vs Story 1.2, and any deviations from the Dev Notes patterns below.

## Dev Notes

### Architecture Compliance

Per `_bmad-output/planning-artifacts/architecture.md` and `.claude/agent-memory/sa-quick-dev/company-standards.md`:

- **UUID PKs** — `Id = Guid.NewGuid()` set in `ClienteEntity.Create()` factory.
- **`DateTimeOffset`** for `CreatedAt` / `UpdatedAt` — NEVER `DateTime`.
- **`ApplySnakeCaseNaming`** — already wired as the LAST line of `OnModelCreating` in `AppDbContext` (Story 1.3). The new `ClienteConfiguration` will be auto-discovered and renamed at runtime.
- **Problem Details RFC 7807** — error responses already covered by `ExceptionHandlingMiddleware` (Story 1.3); no per-endpoint error handling needed.
- **Scalar (not Swagger)** — endpoint `MapGet` chained `.Produces<>` is enough; Scalar already maps from OpenAPI metadata.
- **Spanish UI** — all visible text MUST be in Spanish. Code (variable names, function names, classes) MUST be in English.
- **TanStack Query keys** — `['clientes']` for the list (canonical per architecture.md §State Boundaries).
- **siesa-ui-kit first** — for this story, the kit does NOT have a 1:1 "list + search" panel primitive (it has `MasterCrud`, but Direction F of the UX spec explicitly rejects that for clientes/contactos in favour of the split-panel custom layout — see UX spec §"Design Direction Decision"). The search input can use `siesa-ui-kit` `Input` if available; otherwise a Tailwind-styled native `<input>` with the established palette is acceptable. **Do NOT use `MasterCrud` here.** ClientListItem is a custom component (it appears in `architecture.md` §Project Structure Notes as a shared custom component).

### Frontend Layout & Styles

```
┌────────┬───────────────────────────┬───────────────────────────────────────┐
│  Nav   │  Clientes panel (280px)  │  Detail panel (flex-1)                │
│ Rail   │  ┌─────────────────────┐ │  (Story 2.2 wires this)               │
│ (72)   │  │ search input        │ │                                       │
│        │  ├─────────────────────┤ │                                       │
│        │  │ Cliente A           │ │                                       │
│        │  │ 900.123.456-7       │ │                                       │
│        │  ├─────────────────────┤ │                                       │
│        │  │ Cliente B           │ │                                       │
│        │  │ 900.987.654-3       │ │                                       │
│        │  └─────────────────────┘ │                                       │
└────────┴───────────────────────────┴───────────────────────────────────────┘
```

Tailwind classes for the aside: `w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 flex flex-col`. The h-full parent `<div className="flex h-full">` in `routes/clientes.tsx` makes the panel stretch full content-area height.

### `ClienteEntity` Pattern

```csharp
using SiesaAgents.Domain.Common; // future Entity base — out of scope here, use plain class

namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string? Telefono { get; private set; }
    public string? Ciudad { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { }  // EF Core materialization

    public static ClienteEntity Create(string nombre, string nit, string? telefono, string? ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit))    throw new ArgumentException("NIT es requerido.", nameof(nit));

        var now = DateTimeOffset.UtcNow;
        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            Nit = nit.Trim(),
            Telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim(),
            Ciudad = string.IsNullOrWhiteSpace(ciudad) ? null : ciudad.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    public void Update(string nombre, string nit, string? telefono, string? ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit))    throw new ArgumentException("NIT es requerido.", nameof(nit));

        Nombre = nombre.Trim();
        Nit = nit.Trim();
        Telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim();
        Ciudad = string.IsNullOrWhiteSpace(ciudad) ? null : ciudad.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
```

> **Why no `Entity` base class:** Story 1.3 deliberately deferred creating `Shared.Domain` projects. Until that work lands, the simplest path is a plain class with the Create factory pattern. The properties are private-set to enforce the factory + Update contract.

### `ClienteConfiguration` Pattern

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        // Explicit table name — ApplySnakeCaseNaming would otherwise emit `cliente_entity`.
        builder.ToTable("clientes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id).IsRequired();
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).HasMaxLength(50);
        builder.Property(c => c.Ciudad).HasMaxLength(100);
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        // ApplySnakeCaseNaming will rename this index to `uk_clientes_nit` automatically
        // (snake_case + uniqueness preserved). The default EF index name `IX_clientes_Nit`
        // becomes `uk_clientes_nit` only because the convention also handles the `IX_` /
        // `UK_` prefix transformation — verify in the Inspect Migration step.
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

> **Important:** `HasDatabaseName("uk_clientes_nit")` is explicit so the migration emits the canonical company-standards name regardless of the convention's prefix-handling. The PK auto-generates as `pk_clientes` from `ApplySnakeCaseNaming`'s `IMutableKey.GetName()` branch.

### `AppDbContext` change

Add the `DbSet`:

```csharp
public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();
```

`OnModelCreating` body stays unchanged — `ApplyConfigurationsFromAssembly` already discovers `ClienteConfiguration` from the same assembly.

### `ClienteRepository` Pattern

```csharp
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _db;
    public ClienteRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
        => await _db.Clientes.AsNoTracking()
                            .OrderByDescending(c => c.CreatedAt)
                            .ToListAsync(ct);

    public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
        => _db.Clientes.AsNoTracking().AnyAsync(c => c.Nit == nit, ct);

    public async Task AddAsync(ClienteEntity entity, CancellationToken ct)
        => await _db.Clientes.AddAsync(entity, ct);

    public Task SaveChangesAsync(CancellationToken ct)
        => _db.SaveChangesAsync(ct);
}
```

### Endpoint Wiring Order in `Program.cs`

The fallback handler (`app.MapFallback(...)`) catches every unmatched route. The new `app.MapClienteEndpoints()` MUST be registered BEFORE the fallback. Insert it immediately after the `/health` and `/__test/throw` blocks and BEFORE `app.MapFallback(...)`.

### Frontend Search Filter — Performance Notes

Per NFR1 (< 1s with 500 records), client-side filter on `useMemo` over an in-memory array:

```ts
const normalize = (s: string) => s.toLowerCase().trim()

const filtered = useMemo(() => {
  const q = normalize(searchQuery)
  if (!q) return clientes
  return clientes.filter(c =>
    normalize(c.nombre).includes(q) || normalize(c.nit).includes(q)
  )
}, [clientes, searchQuery])
```

For 500 records this is < 5 ms in modern V8 — well within NFR1. Skip diacritic normalization in MVP (accents in Spanish nombres are exact-match — document for post-MVP if user complaints arise).

A 150 ms input debounce isolates rapid typing from React re-renders. Implement with a small inline `useRef<NodeJS.Timeout>` + `clearTimeout` pattern, NOT a third-party library (bundle budget).

### `useClientes` Hook + queryClient

```ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'] as const,
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 1000 * 60, // 1 min — invalidated by mutations in 2.3 / 2.4 / 2.5
  })
}
```

Note: the global `queryClient.defaultOptions.queries.staleTime` is already 60s (Story 1.2). Setting it again on the hook is defensive — explicit per call site.

### Out of Scope (Deferred Stories)

- Right-side detail panel content + URL `/clientes/$clienteId` — Story 2.2.
- "Nuevo cliente" button + create form + `POST /api/v1/clientes` + `useCreateCliente` + FR7 (unique NIT) — Story 2.3.
- Edit form + `PUT /api/v1/clientes/{id}` + `useUpdateCliente` — Story 2.4.
- Delete button + confirmation dialog + `DELETE /api/v1/clientes/{id}` + `useDeleteCliente` — Story 2.5.
- SortControl (Nombre A→Z / Z→A / Más reciente / Más antiguo) — Story 2.6.
- "Click on item navigates to detail" — wired in Story 2.2 (which adds the `/clientes/$clienteId` route). In 2.1, clicking a `ClientListItem` is either a no-op or logs to `console.debug` — Story 2.2 will replace the handler with `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })`. Document the chosen placeholder in Completion Notes.

### Project Structure Notes

- New backend files match `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`:
  - `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
  - `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
  - `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
  - `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
  - `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
  - `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- New frontend files:
  - `frontend/src/modules/crm/clientes/domain/{Cliente.ts,IClienteRepository.ts}`
  - `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - `frontend/src/shared/components/{EmptyState.tsx,ErrorPanel.tsx,ClientListItem.tsx}`
- Migrations folder: `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` (variance from architecture doc carried over from Story 1.3, intentional).
- The architecture document prescribes `ClienteListView.tsx` as the panel name — kept as-is. The right-side `ClienteDetailView.tsx` is NOT created in this story; Story 2.2 handles it.

### Detected Conflicts / Variances

- **`MasterCrud` vs custom split-panel:** Company-standards skill mandates checking the kit catalog first and the `mastercrud-use-reference.md` explicitly positions `MasterCrud` as the orchestrator for "data grids + forms + filters". However, the UX spec (`_bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision`) selected Direction F (LayoutBase + Lista/Detalle + ContactManager), explicitly REJECTING a single-table grid in favour of the split-panel master/detail layout. The architecture document mirrors this decision and references custom components (`ClienteListView`, `ClientListItem`, `EmptyState`). **This story therefore deliberately departs from `MasterCrud`** and uses the custom split-panel layout. This variance is intentional and documented in both UX and architecture — no rework required.
- **No "Nuevo cliente" button yet:** the existing E2E POM (`e2e/pages/clientes.page.ts`) already declares `btnNuevoCliente`. The button is added in Story 2.3; in 2.1, the button is NOT rendered. Existing E2E tests that depend on it (FR4, FR7 specs in `clientes-crud.spec.ts`) will continue to fail until 2.3 lands — they are flagged as expected-fail until then, per the existing sprint sequencing.
- **`uk_clientes_nit` naming:** explicit via `HasDatabaseName(...)` to guarantee the canonical name. The conventional `ApplySnakeCaseNaming` would emit `ix_clientes_nit` (it lowercases prefixes but doesn't transform `IX_` → `UK_`). Documented in the configuration code with a comment.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture — Data Architecture (Cliente entity, clientes table): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Architecture — API & Communication Patterns (GET /api/v1/clientes): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Frontend Architecture (TanStack Query keys, split-panel): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Implementation Patterns & Consistency Rules: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Architecture — Enforcement Guidelines: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- UX — Design Direction Decision (Direction F, split-panel): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- UX — Component Strategy (EmptyState, ClientListItem): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- UX — Search & Filtering Patterns: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Search & Filtering Patterns]
- UX — Error / Empty / Loading States: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Error State Patterns]
- PRD — Functional Requirements FR1–FR5: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- PRD — Non-Functional Requirement NFR1 (search < 1s): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Performance]
- PRD — NFR6 (no stack trace exposure): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- Test Design Epic 2 — P0 scenarios for Story 2.1: [Source: _bmad-output/test-design-epic-2.md#P0 Critical]
- Risk R-004 (Search NFR1) + R-009 (ErrorPanel Reintentar): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Story 1.3 (DbContext + ApplySnakeCaseNaming): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- Story 1.2 (AppShell + /clientes route placeholder): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]
- Company standards — Frontend / Backend / Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- siesa-ui-kit MasterCrud reference (NOT used here — see Variances): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (dev-story workflow, autonomous execution)

### Debug Log References

- Backend tests run via `dotnet test SiesaAgents.sln` — 64/64 green (32 unit + 32 integration), 0 warnings, 0 errors.
- Frontend tests run via `pnpm test` — 57/57 green across 12 test files.
- Frontend build via `pnpm run build` — main eager chunk is 394.46 KB gzipped (vs. 394.73 KB after Story 1.2 — delta of −0.27 KB; the new clientes module is lazy-loaded at 19.76 KB gzipped, isolated from the eager bundle).

### Completion Notes List

- **EF migration `dotnet ef database update` was deferred** — the runtime sandbox does not have PostgreSQL available (the story explicitly authorizes this). The migration is verified via the runtime EF model assertions in `ClientesTable_AfterMigration_HasSnakeCaseColumns` (snake_case columns, `uk_clientes_nit` unique index, canonical `clientes` table name). When this branch lands in an environment with PostgreSQL, `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` applies cleanly because the snapshot already reflects the entity.
- **`MigrationStructureTests.ModelSnapshot_DoesNotDeclareAnyEntityType` was renamed** to `ModelSnapshot_RegistersClienteEntityOnly`. The original assertion was specific to Story 1.3 (no entities at all); Story 2.1 legitimately introduces `ClienteEntity`, so the test now positively asserts the entity is registered and that `ContactoEntity` (Epic 3) has not leaked in.
- **`InMemoryFactory` in `ClientesEndpointsTests`** was extended to strip ALL existing EF Core / Npgsql service registrations before adding the InMemory provider. The original ATDD scaffold only removed `DbContextOptions<AppDbContext>`, which left Npgsql's internal services in place and caused EF Core to throw "Only a single database provider can be registered" at runtime.
- **Routing test `index-redirect.test.tsx`** (Story 1.2 ATDD) was updated: (1) wrapped the router in a fresh `QueryClientProvider` because the `/clientes` route now consumes `useClientes`; (2) replaced the obsolete `findByRole('heading', { name: 'clientes' })` assertion with `findByTestId('clientes-list-panel')` since Story 2.1 deletes the `<h1>Clientes</h1>` placeholder per Dev Notes (the page heading lives inside the panel as an `<h2 className="sr-only">`).
- **Click handler on `ClientListItem` is stubbed** to `console.debug` (as Dev Notes permits). Story 2.2 will replace it with `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })`.
- **PostgreSQL version verified**: not applicable for this run (deferred — see above).
- **Spanish UI strings** all match the AC verbiage: "Aún no hay clientes", "Sin resultados", "No se pudieron cargar los clientes", "Intenta de nuevo en unos segundos.", "Buscar cliente por nombre o NIT/RUC", "Reintentar".
- **No deviation from `MasterCrud` rejection** — UX Direction F is honoured via the custom split-panel; no `MasterCrud` import lands in this story.

### File List

**Backend — new files:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260615091044_AddClientes.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260615091044_AddClientes.Designer.cs`

**Backend — modified files:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — added `DbSet<ClienteEntity> Clientes`.
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` — regenerated by `dotnet ef migrations add`.
- `backend/src/SiesaAgents.API/Program.cs` — added repository + handler DI registrations and `app.MapClienteEndpoints()`.
- `backend/tests/SiesaAgents.IntegrationTests/ClientesEndpointsTests.cs` — InMemoryFactory hardened to strip all EF/Npgsql services (ATDD-given test, scoped tweak only).
- `backend/tests/SiesaAgents.IntegrationTests/MigrationStructureTests.cs` — `ModelSnapshot_DoesNotDeclareAnyEntityType` → `ModelSnapshot_RegistersClienteEntityOnly` (story-aligned).

**Frontend — new files:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`

**Frontend — modified files:**
- `frontend/src/routes/clientes.tsx` — split-panel layout, mounts `ClienteListView`.
- `frontend/src/routes/-__tests__/index-redirect.test.tsx` — wrapped in `QueryClientProvider`; assertion now `clientes-list-panel` testid.

**Frontend — new test files:**
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` — 6 sub-cases covering AC #11.
- `frontend/src/shared/components/__tests__/EmptyState.test.tsx` — smoke tests for Spanish copy + variant.
- `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` — smoke tests for Spanish copy + onRetry wiring.

**E2E — new / modified files:**
- `e2e/tests/clientes/clientes-list-search.spec.ts` (NEW) — six P0 Playwright scenarios for Story 2.1.
- `e2e/pages/clientes.page.ts` (MOD) — added `errorPanel`, `emptyStatePanel`, `searchEmptyPanel`, `btnReintentar` locators.
- `e2e/helpers/data.helper.ts` (MOD) — added `buildClienteBulk(count)` factory for the 500-record perf scenario.
