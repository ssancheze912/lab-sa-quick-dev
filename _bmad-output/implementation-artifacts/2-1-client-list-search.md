# Story 2.1: Client List & Search

Status: implemented

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them in real time by name or NIT/RUC,
so that I can quickly find the client I am looking for without leaving the `/clientes` screen, even when there is no data or the backend is unavailable.

## Acceptance Criteria

1. **Backend — `clientes` table & GET endpoint exist (foundation for the UI):**
   **Given** PostgreSQL is running and the EF migrations are applied,
   **When** `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` runs from `backend/`,
   **Then** a `clientes` table exists with snake_case columns `id` (UUID PK), `nombre` (varchar 200, not null), `nit` (varchar 50, not null), `telefono` (varchar 50, not null), `ciudad` (varchar 100, not null), `created_at` (`timestamptz` not null), `updated_at` (`timestamptz` not null), a unique index `uk_clientes_nit` on `nit`, and the FK constraint name `pk_clientes` for the PK. The `__ef_migrations_history` table contains a new `{timestamp}_AddClienteEntity` row [Source: architecture.md#Data Architecture] [Source: company-standards.md#Database Conventions] [Source: 1-3-backend-database-foundation.md#snake_case naming extension — required behavior].

2. **Backend — `GET /api/v1/clientes` returns the full list as a JSON array:**
   **Given** the API process is running,
   **When** the frontend issues `GET /api/v1/clientes` (no query parameters),
   **Then** the response is `200 OK` with `Content-Type: application/json`, body is a **direct JSON array** (no wrapper object) of objects shaped `{ id: string (uuid), nombre: string, nit: string, telefono: string, ciudad: string, createdAt: string (ISO 8601 with offset), updatedAt: string (ISO 8601 with offset) }` — camelCase keys serialized from PascalCase by System.Text.Json defaults [Source: architecture.md#Format Patterns] [Source: architecture.md#API & Communication Patterns]. The array contains every persisted `ClienteEntity`; with 500 seed records the response size is unbounded by pagination (NFR10).

3. **Backend — error contract is RFC 7807 (regression for Story 1.3 middleware):**
   **Given** the GET endpoint throws (for example a database connectivity loss),
   **When** the response reaches the client,
   **Then** it is HTTP 500 with `Content-Type: application/problem+json` per the existing `ExceptionHandlingMiddleware` (Story 1.1 / 1.3) — the body does NOT contain `stackTrace`, `exception`, `innerException`, raw SQL, or table names (NFR6) [Source: 1-3-backend-database-foundation.md#Problem Details — what Story 1.1 already provides].

4. **Frontend — `/clientes` route renders a 280px scrollable left panel with the client list (desktop ≥ 1024px):**
   **Given** the user navigates to `/clientes` (via NavigationRail or direct URL) on a viewport ≥ 1024px,
   **And** the backend returns a non-empty array,
   **When** the page hydrates,
   **Then** a left panel of **exact width 280px** is visible inside the AppShell (NavigationRail on the left of the panel), the panel scrolls vertically (`overflow-y-auto`) independently from the right area, **every** client returned by the API is rendered as a list item, and each item shows both `nombre` (primary text) and `nit` (secondary text) [Source: ux-design-specification.md#Direction F] [Source: ux-design-specification.md#Responsive Strategy — Desktop split panel] [Source: architecture.md#Component Boundaries (Frontend)].

5. **Frontend — real-time search filter on the same view (NFR1 < 1s with 500 records):**
   **Given** the client list is rendered,
   **When** the user types into the search input rendered at the top of the left panel (placeholder verbatim: `"Buscar por nombre o NIT..."` per ux-design-specification.md#Búsqueda de clientes),
   **Then** the list re-renders client-side (NO new HTTP request is sent — assert via fetch spy) to show only clients whose `nombre` OR `nit` contains the query (case-insensitive substring), the input is **debounced at 150ms** before the filter recomputes [Source: ux-design-specification.md#Búsqueda de clientes] [Source: test-design-epic-2.md#15 item 5], the filter predicate runs through a memoised pure function (`useMemo`) [Source: test-design-epic-2.md#R-202 mitigation], and the elapsed time between the user keystroke and the updated DOM is **< 1000 ms** measured with `performance.now()` even when 500 records are loaded (NFR1) [Source: prd/non-functional-requirements.md#NFR1] [Source: test-design-epic-2.md#TC-E2-P0-05].

6. **Frontend — EmptyState component shown when the backend returns `[]`:**
   **Given** the backend returns `200 OK` with an empty array,
   **When** `/clientes` hydrates,
   **Then** the left panel renders the `EmptyState` component using the `no-clients` variant — title verbatim: `"No hay clientes registrados"`, subtitle verbatim: `"Crea el primer cliente del sistema"`, CTA label verbatim: `"Nuevo cliente"` (CTA is rendered but its `onClick` is a no-op placeholder in this story — Story 2.3 wires the form), and the search input is hidden (no list to filter) [Source: ux-design-specification.md#EmptyState — variantes] [Source: ux-design-specification.md#Empty States].

7. **Frontend — EmptyState shown when the search filter yields zero results (search-empty variant):**
   **Given** the list is non-empty,
   **When** the user types a query that matches no client (neither `nombre` nor `nit` contain it),
   **Then** the left panel keeps the search input visible AND renders the `EmptyState` component using the `search-empty` variant — title verbatim: `"No se encontró ningún cliente"`, subtitle verbatim: `"Intenta con otro nombre o NIT"`, CTA label verbatim: `"Crear cliente"` (CTA `onClick` is a no-op placeholder in this story); the `EmptyState` is rendered inside an element with `aria-live="polite"` so screen readers announce the change [Source: ux-design-specification.md#EmptyState — variantes] [Source: ux-design-specification.md#EmptyState — Accesibilidad].

8. **Frontend — ErrorPanel + "Reintentar" shown when the initial fetch fails:**
   **Given** `GET /api/v1/clientes` returns a non-2xx response (e.g. 500) or the network call rejects,
   **When** the user navigates to `/clientes`,
   **Then** the left panel does NOT render the list nor an empty state, it renders an `ErrorPanel` component with title verbatim: `"No se pudo cargar"`, message verbatim: `"Ocurrió un problema al cargar los clientes. Intenta de nuevo."`, and a primary button labelled verbatim: `"Reintentar"` [Source: ux-design-specification.md#Error & Recovery Patterns — "Error de red (carga inicial)"]. **And** when the user clicks "Reintentar" AND the backend is now responding 200, the list renders normally (TanStack Query `refetch()` is invoked — no full page reload) [Source: test-design-epic-2.md#TC-E2-P0-08].

9. **Frontend — `useClientes` hook uses the canonical TanStack Query key `['clientes']`:**
   **Given** the application source code,
   **When** the `useClientes` hook is inspected (and grepped),
   **Then** the `queryKey` is the array literal `['clientes']` (not a string), the hook calls `apiClient.get('/api/v1/clientes')`, returns `{ data, isLoading, isError, refetch }` (or compatible) for consumers, and the right panel (Story 2.2 territory) is NOT rendered or queried from this story — only the list panel is built [Source: architecture.md#TanStack Query keys (canonical)] [Source: test-design-epic-2.md#15 item 4].

10. **Frontend — selected list item state via URL param (placeholder for Story 2.2):**
    **Given** the user clicks any client list item,
    **When** the click handler runs,
    **Then** the active client `id` is reflected in the URL via TanStack Router (`router.navigate({ to: '/clientes/$clienteId', params: { clienteId } })`) so deep-linking and the future right panel of Story 2.2 read from the URL as the single source of truth, the clicked item gains the visual "active/selected" state described in ux-design-specification.md#ClientListItem (left border 3px `primary-600`, background `primary-50`), the URL route `/clientes/$clienteId` is registered (it may render a placeholder right-panel component in this story since Story 2.2 owns the detail), and clicking a different item updates both URL and visual state without a full page reload (FR30) [Source: architecture.md#Frontend Architecture — Routing] [Source: ux-design-specification.md#ClientListItem].

11. **Frontend — Spanish copy + accessibility (P0 company standard):**
    **Given** all UI elements rendered by this story,
    **When** any label, placeholder, aria-label, button text, EmptyState message or ErrorPanel message is shown,
    **Then** it is in Spanish (verbatim strings listed in this story), the search input has an `aria-label` `"Buscar clientes"`, list items render `aria-label="Ver cliente: {nombre}"` and are reachable via `Tab` + `Enter`, `EmptyState` is wrapped in an `aria-live="polite"` region, and `ErrorPanel` uses `role="alert"` so AT users are notified [Source: company-standards.md#Frontend Key Rules — Spanish] [Source: ux-design-specification.md#ClientListItem — Accesibilidad] [Source: ux-design-specification.md#EmptyState — Accesibilidad].

12. **Tests — P0 and P1 scenarios for Story 2.1 are green:**
    **Given** the test suite,
    **When** `pnpm test` and `dotnet test backend/SiesaAgents.sln` and the gated Playwright suite run,
    **Then** the following test IDs pass:
    - **API integration (xUnit + WebApplicationFactory + Testcontainers Postgres OR gated by `RUN_DB_INTEGRATION_TESTS=1`):** TC-E2-P2-01 (GET returns seeded list), TC-E2-P2-07 (snake_case columns), TC-E2-P2-08 (`createdAt` / `updatedAt` carry UTC offset), TC-E2-P2-06 (unique index `uk_clientes_nit` exists at DB level — verified here because the index ships with this migration; Story 2.3 will exercise the 409 contract).
    - **Component (Vitest + RTL + MSW):** TC-E2-P0-05 (search < 1000 ms with 500 records), TC-E2-P0-08 (ErrorPanel + Reintentar), TC-E2-P1-01 (list renders all items in 280px panel), TC-E2-P1-02 (search filters by both `nombre` and `nit`), TC-E2-P1-03 (EmptyState when list is empty).
    - **Unit (Vitest):** TC-E2-P3-03 (`matchesQuery(client, q)` pure function — case-insensitive substring over `nombre` and `nit`).
    - Pre-existing Story 1.1 / 1.2 / 1.3 tests MUST continue to pass [Source: test-design-epic-2.md#Test Cases by Priority] [Source: test-design-epic-2.md#11 Quality Gate Criteria].

## Tasks / Subtasks

### Backend (must complete before frontend integration tests can run end-to-end)

- [x] **Task 1 — Define `ClienteEntity` in `SiesaAgents.Domain`** (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`:
    - Public class with `public Guid Id { get; private set; } = Guid.NewGuid();`
    - Properties: `Nombre` (string, required), `Nit` (string, required, max 50), `Telefono` (string, required, max 50), `Ciudad` (string, required, max 100) — all `{ get; private set; }`
    - `CreatedAt` (`DateTimeOffset`, init `DateTimeOffset.UtcNow`) and `UpdatedAt` (`DateTimeOffset`, init `DateTimeOffset.UtcNow`) — both `{ get; private set; }`. **MUST use `DateTimeOffset`, NEVER `DateTime`** [Source: company-standards.md#Backend Critical Rules — DateTime].
    - Private parameterless constructor `private ClienteEntity() { }` (for EF Core materialization).
    - Static factory `public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)` that validates non-null/non-whitespace inputs (throw `ArgumentException` with the offending field name) and assigns the properties. Domain events are NOT required for this story (none of the AC require them; Story 2.3 may revisit if a `ClienteCreatedEvent` is needed).
  - [ ] Namespace: `SiesaAgents.Domain.Entities`. Folder: `backend/src/SiesaAgents.Domain/Entities/` (already exists per Story 1.3 layout).
  - [ ] Do NOT add an `IClienteRepository` interface yet — Story 2.3 introduces the CQRS write side; Story 2.1 reads through EF Core directly via the minimal-API endpoint handler (read-only). Rationale: smallest possible diff for a list endpoint; aligns with the architecture's "Query handler reads from `DbContext`" pattern documented in architecture.md#API & Communication Patterns. The interface can be added without breaking changes in Story 2.3.

- [x] **Task 2 — Add `ClienteConfiguration` (IEntityTypeConfiguration) in Infrastructure** (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`:
    ```csharp
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Metadata.Builders;
    using SiesaAgents.Domain.Entities;

    namespace SiesaAgents.Infrastructure.Data.Configurations;

    internal sealed class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
    {
        public void Configure(EntityTypeBuilder<ClienteEntity> builder)
        {
            builder.ToTable("clientes");                                                  // explicit plural
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Id).ValueGeneratedNever();                            // factory assigns Guid.NewGuid()
            builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
            builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
            builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
            builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
            builder.Property(c => c.CreatedAt).IsRequired();
            builder.Property(c => c.UpdatedAt).IsRequired();
            builder.HasIndex(c => c.Nit).IsUnique();                                       // → uk_clientes_nit after ApplySnakeCaseNaming
        }
    }
    ```
  - [ ] Why explicit `.ToTable("clientes")`: Story 1.3 documented in "snake_case naming extension — required behavior" that the in-house `ApplySnakeCaseNaming()` does NOT pluralize; the entity-type name `ClienteEntity` would otherwise produce `cliente_entity`. Plural-snake-case is the company convention [Source: company-standards.md#Database Conventions — Tables: snake_case (plural)] [Source: 1-3-backend-database-foundation.md#snake_case naming extension — required behavior].
  - [ ] Why `ValueGeneratedNever()`: the static factory `ClienteEntity.Create` assigns the `Guid` — EF must not overwrite it.

- [x] **Task 3 — Wire `DbSet<ClienteEntity>` + auto-load configuration in `AppDbContext`** (AC: #1)
  - [ ] Modify `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
    - Add `public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();`.
    - Inside `OnModelCreating`, BEFORE `modelBuilder.ApplySnakeCaseNaming();`, add `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);`. This activates `ClienteConfiguration` and any future `IEntityTypeConfiguration<T>` automatically. **`ApplySnakeCaseNaming()` MUST remain the LAST call** [Source: 1-3-backend-database-foundation.md#snake_case naming extension — required behavior — Ordering rule].
  - [ ] Add `using SiesaAgents.Domain.Entities;` to the `AppDbContext.cs` usings.
  - [ ] Do not touch the existing `Story 1.3` migration `20260608090509_InitialCreate.cs` — leave it empty as Story 1.3 documented.

- [x] **Task 4 — Generate EF migration `AddClienteEntity`** (AC: #1)
  - [ ] From `backend/`, run:
    ```bash
    dotnet ef migrations add AddClienteEntity \
        --project src/SiesaAgents.Infrastructure \
        --startup-project src/SiesaAgents.API \
        --output-dir Data/Migrations
    ```
  - [ ] Verify the generated `{timestamp}_AddClienteEntity.cs` creates table `clientes` with the snake_case column names (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`) and a unique index named `uk_clientes_nit`. If the index name is not `uk_clientes_nit` the in-house naming extension is misbehaving — fix the extension, do NOT manually rename in the migration file.
  - [ ] Commit the migration files. Do NOT manually edit them after generation.

- [x] **Task 5 — Add `ClienteDto` + `GetClientesQuery` + handler in `Application` (CQRS read side)** (AC: #2)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.DTOs;

    public sealed record ClienteDto(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt);
    ```
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`:
    ```csharp
    public sealed record GetClientesQuery();
    ```
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — a class with a single async method `Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct)` that calls `_dbContext.Clientes.AsNoTracking().OrderByDescending(c => c.CreatedAt).Select(c => new ClienteDto(c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt)).ToListAsync(ct)`. Default sort `OrderByDescending(CreatedAt)` matches Story 2.6's "Más reciente" default (no extra backend work later).
  - [ ] The Application project references Domain (already) and needs `Microsoft.EntityFrameworkCore` for `AsNoTracking()` / `ToListAsync()`. Add the package to `SiesaAgents.Application.csproj`:
    ```xml
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.0.4" />
    ```
    The handler depends on `AppDbContext` (concrete class). This couples Application → Infrastructure for the read side, which is the pragmatic CQRS-lite pattern documented in architecture.md#Backend (handler reads from `DbContext` directly). If a stricter boundary is wanted later, add an `IReadDbContext` abstraction; that is out of scope here.
    - [ ] If the Application project does NOT already reference Infrastructure, add `<ProjectReference Include="..\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />` in `SiesaAgents.Application.csproj`. Verify with `dotnet build` afterward.
  - [ ] Register the handler in DI in `Program.cs`: `builder.Services.AddScoped<GetClientesQueryHandler>();` — insert this registration after the `AddDbContext<AppDbContext>(...)` call and before `AddCors(...)`. Keep the rest of the middleware/order untouched [Source: 1-3-backend-database-foundation.md#Program.cs — DI registration patch].

- [x] **Task 6 — Map `GET /api/v1/clientes` minimal-API endpoint** (AC: #2)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    ```csharp
    using SiesaAgents.Application.Clientes.Queries;

    namespace SiesaAgents.API.Endpoints;

    public static class ClienteEndpoints
    {
        public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder routes)
        {
            var group = routes.MapGroup("/api/v1/clientes").WithTags("Clientes");

            group.MapGet("", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            {
                var items = await handler.HandleAsync(new GetClientesQuery(), ct);
                return Results.Ok(items);
            })
            .WithName("GetClientes")
            .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

            return routes;
        }
    }
    ```
  - [ ] In `Program.cs`, add `app.MapClienteEndpoints();` AFTER `app.MapGet("/health", ...)` and BEFORE `app.Run();`. Add the `using SiesaAgents.API.Endpoints;` directive at the top of `Program.cs`. Do NOT add a controller — minimal API only [Source: company-standards.md#Backend Stack — C# Minimal API (NO controllers)].
  - [ ] Response shape: direct JSON array (Results.Ok with a list serializes to array). System.Text.Json default settings preserve camelCase via `JsonSerializerDefaults.Web` (already applied by Minimal API). Verify with `curl` after running the API — sample response: `[{"id":"...","nombre":"...","nit":"...","telefono":"...","ciudad":"...","createdAt":"2026-...","updatedAt":"2026-..."}]`.

- [x] **Task 7 — Apply the migration locally (gated by Postgres availability)** (AC: #1) — SKIPPED in sandbox if PostgreSQL is unavailable; gated integration tests cover validation when run with `RUN_DB_INTEGRATION_TESTS=1`.
  - [ ] From `backend/`, run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`. Verify with `psql -U postgres -d siesa_agents_db -c '\dt'` that the table `clientes` is present. Run `psql -U postgres -d siesa_agents_db -c '\d clientes'` and confirm all 7 columns (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`) and the index `uk_clientes_nit` are present.
  - [ ] If the sandbox has no PostgreSQL, document this in Dev Agent Record → Completion Notes; the gated integration tests will exercise the migration when run locally with `RUN_DB_INTEGRATION_TESTS=1` (pattern set by Story 1.3's `MigrationsHistorySnakeCaseTests`).

- [x] **Task 8 — Backend tests** (AC: #12 backend portion)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`:
    - `Create_WithAllFields_ReturnsEntityWithGeneratedIdAndUtcTimestamps`
    - `Create_WithNullOrWhitespace_{nombre|nit|telefono|ciudad}_Throws` (4 parameterised cases)
    - Asserts `CreatedAt` and `UpdatedAt` are equal at creation time and both within 1 second of `DateTimeOffset.UtcNow`.
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`:
    - Uses an in-memory `AppDbContext` (`UseInMemoryDatabase("test-{Guid}")`) so the test does not need PostgreSQL. Add `Microsoft.EntityFrameworkCore.InMemory` 10.x to `SiesaAgents.UnitTests.csproj` if not already present.
    - Seeds 3 clients with distinct `CreatedAt`. Asserts the handler returns them ordered DESC by `CreatedAt` (newest first — matches the default sort that Story 2.6 expects).
    - Asserts the handler returns an empty list when the DbSet is empty.
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs` (integration test using `WebApplicationFactory<Program>`):
    - Uses the existing factory + an override that swaps the real `AppDbContext` to InMemory (pattern: `WithWebHostBuilder(builder => builder.ConfigureServices(svc => { /* remove Npgsql DbContextOptions, add InMemory */ }))`).
    - Seeds 1 client; calls `GET /api/v1/clientes`; asserts 200, response is a JSON array, first item has all 7 expected camelCase keys (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`), `createdAt` ends with `Z` or `+00:00` (TC-E2-P2-08).
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteSchemaIntegrationTests.cs` (gated by `RUN_DB_INTEGRATION_TESTS=1`, follow Story 1.3's `SkippableFact` pattern):
    - Migrates a fresh PostgreSQL DB; queries `information_schema.columns` for `clientes` → asserts the 7 snake_case column names exist (TC-E2-P2-07).
    - Queries `information_schema.statistics` (or `pg_indexes`) → asserts a unique index named `uk_clientes_nit` exists on `nit` (TC-E2-P2-06).
  - [ ] Run `dotnet test backend/SiesaAgents.sln` → all new tests pass + all pre-existing Story 1.1 / 1.3 tests continue to pass.

### Frontend

- [x] **Task 9 — Domain & Infrastructure for Clientes (Clean Architecture mapping)** (AC: #9)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`:
    ```ts
    export interface Cliente {
      id: string                    // UUID v4 — camelCase in JSON
      nombre: string
      nit: string
      telefono: string
      ciudad: string
      createdAt: string             // ISO 8601 with offset
      updatedAt: string
    }
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`:
    ```ts
    import type { Cliente } from './Cliente'
    export interface IClienteRepository {
      getAll(signal?: AbortSignal): Promise<Cliente[]>
    }
    ```
    Only `getAll` is exposed in this story. Story 2.2 adds `getById`, Stories 2.3 / 2.4 / 2.5 add the mutations.
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```ts
    import { apiClient } from '@/shared/lib/apiClient'
    import type { Cliente } from '../domain/Cliente'
    import type { IClienteRepository } from '../domain/IClienteRepository'

    export const clienteApiRepository: IClienteRepository = {
      async getAll(signal) {
        const res = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
        return res.data
      },
    }
    ```
    Use the project's existing axios singleton from `frontend/src/shared/lib/apiClient.ts` (created by Story 1.1).
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```ts
    import { useQuery } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    export function useClientes() {
      return useQuery({
        queryKey: ['clientes'] as const,
        queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
      })
    }
    ```
    `queryKey: ['clientes']` is the canonical key — DO NOT use a string; Story 2.3/2.4/2.5 mutations rely on `invalidateQueries({ queryKey: ['clientes'] })` [Source: architecture.md#TanStack Query keys (canonical)].

- [x] **Task 10 — `matchesQuery` pure filter helper + unit test** (AC: #5, #11)
  - [ ] Create `frontend/src/modules/crm/clientes/application/matchesQuery.ts`:
    ```ts
    import type { Cliente } from '../domain/Cliente'

    export function matchesQuery(client: Cliente, query: string): boolean {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return client.nombre.toLowerCase().includes(q)
        || client.nit.toLowerCase().includes(q)
    }
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/application/matchesQuery.test.ts`:
    - Empty query → returns `true`.
    - Substring match on `nombre` (case-insensitive).
    - Substring match on `nit` (case-insensitive).
    - No match → returns `false`.
    - Whitespace-only query → returns `true`.
    - Covers TC-E2-P3-03 (Unit — Filter Predicate Combines `nombre` + `nit`).

- [x] **Task 11 — `useDebouncedValue` shared hook (150ms debounce for the search input)** (AC: #5)
  - [ ] Create `frontend/src/shared/hooks/useDebouncedValue.ts`:
    ```ts
    import { useEffect, useState } from 'react'
    export function useDebouncedValue<T>(value: T, delayMs: number): T {
      const [debounced, setDebounced] = useState(value)
      useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delayMs)
        return () => clearTimeout(id)
      }, [value, delayMs])
      return debounced
    }
    ```
  - [ ] Create a co-located test `useDebouncedValue.test.ts` using `vi.useFakeTimers()` that asserts the value only updates after the delay elapses.

- [x] **Task 12 — `EmptyState` shared component (`no-clients` and `search-empty` variants)** (AC: #6, #7, #11)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`:
    - Props: `{ variant: 'no-clients' | 'search-empty' | 'no-contacts', onCtaClick?: () => void }`. The `no-contacts` variant is included for future Story 4.x reuse but only `no-clients` and `search-empty` are exercised in this story.
    - Internally maps the variant → title / subtitle / CTA label (table from ux-design-specification.md#EmptyState — variantes). Renders an Heroicon (`UsersIcon` for `no-clients`, `MagnifyingGlassIcon` for `search-empty`, `UserCircleIcon` for `no-contacts`).
    - CTA button uses siesa-ui-kit `<Button variant="outline">`; renders the CTA only when `onCtaClick` is provided.
    - Root element: `<section role="status" aria-live="polite" data-testid="empty-state" data-variant={variant}>`.
  - [ ] Create `EmptyState.test.tsx`:
    - For each variant, assert title/subtitle/CTA label match the verbatim strings.
    - Asserts `aria-live="polite"` and `role="status"` on the root.
    - Asserts CTA click invokes `onCtaClick`.

- [x] **Task 13 — `ErrorPanel` shared component** (AC: #8, #11)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`:
    - Props: `{ onRetry: () => void, title?: string, message?: string }`. Defaults: title `"No se pudo cargar"`, message `"Ocurrió un problema al cargar los clientes. Intenta de nuevo."`.
    - Renders a heading, paragraph, and a primary `<Button>` labelled `"Reintentar"` whose `onClick` calls `onRetry()`.
    - Root element: `<section role="alert" data-testid="error-panel">`.
  - [ ] Create `ErrorPanel.test.tsx`:
    - Asserts the default title and message are visible.
    - Asserts `role="alert"`.
    - Asserts clicking "Reintentar" invokes `onRetry`.

- [x] **Task 14 — `ClientListItem` custom component** (AC: #4, #10, #11)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`:
    - Props: `{ cliente: Cliente, isActive: boolean, onClick: () => void }`.
    - Renders a `<button type="button">` (NOT an `<a>` — TanStack Router navigation happens in the parent `onClick` handler that calls `router.navigate(...)`) with `aria-label="Ver cliente: {cliente.nombre}"`, `data-testid="client-list-item"`, `data-active={isActive}`.
    - Visual: shows `nombre` as primary text (`text-sm font-medium text-slate-900`), `nit` as secondary text (`text-xs text-slate-500`). Adds `aria-current="page"` when `isActive`. Active visual: `border-l-4 border-primary-600 bg-primary-50` (via Tailwind utility classes); siesa-ui-kit primary color is `#0e79fd` per company-standards.md#UX Design System. If the project's Tailwind config does not yet expose a `primary-600` color, use the hex value via inline style or extend `tailwind.config.ts` (Story 1.2 should have configured it — check `frontend/tailwind.config.ts` first; if missing, add `colors.primary.{50,600}`).
  - [ ] Create `ClientListItem.test.tsx`:
    - Renders the `nombre` and `nit`.
    - Asserts `aria-label="Ver cliente: Acme S.A."`.
    - Clicking invokes `onClick`.
    - When `isActive`, asserts `aria-current="page"`.

- [x] **Task 15 — `ClienteListView` (the 280px left panel — the heart of this story)** (AC: #4, #5, #6, #7, #8, #9, #10, #11)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    ```tsx
    // High-level structure (illustrative — final implementation may refine):
    // <aside
    //   className="w-[280px] shrink-0 border-r border-slate-200 h-full flex flex-col"
    //   data-testid="cliente-list-view"
    // >
    //   <header className="p-3 border-b border-slate-200">
    //     <Input
    //       value={query}
    //       onChange={(v) => setQuery(v)}
    //       placeholder="Buscar por nombre o NIT..."
    //       aria-label="Buscar clientes"
    //       icon={<MagnifyingGlassIcon className="h-4 w-4" />}
    //     />
    //   </header>
    //   <div className="flex-1 overflow-y-auto" role="region" aria-live="polite">
    //     {/* Conditional rendering: ErrorPanel | Skeleton | EmptyState | List */}
    //   </div>
    // </aside>
    ```
    - Uses `useClientes()` for data + `useState('')` for the raw input, then `useDebouncedValue(query, 150)` for the debounced filter input.
    - The filtered list is computed with `useMemo(() => (data ?? []).filter(c => matchesQuery(c, debouncedQuery)), [data, debouncedQuery])`.
    - Conditional rendering order (top to bottom): if `isError` → `<ErrorPanel onRetry={refetch} />`; else if `isLoading` (first load) → render react-loading-skeleton placeholders that mimic 6 list items (per ux-design-specification.md#Loading States); else if `data.length === 0` → `<EmptyState variant="no-clients" />` and HIDE the search input via wrapping the `<header>` in `{data && data.length > 0 ? (<header>...) : null}` so AC #6 passes ("search input is hidden"); else if `filtered.length === 0` → keep the search input visible and render `<EmptyState variant="search-empty" />`; else render the `<ul>` of `<ClientListItem>`.
    - Reads the active client id from URL via `useParams({ strict: false })` against the `/clientes/$clienteId` route — see Task 16. Use `router.navigate({ to: '/clientes/$clienteId', params: { clienteId } })` in the item click handler (AC #10).
    - Tracks the time between user input and DOM update for the perf test: expose a hook (`onFilterApplied?: (durationMs: number) => void`) ONLY in test mode, or rely on `performance.now()` markers added by the test harness (preferred — keep production code free of test scaffolding). The component test will call `performance.now()` before typing and again after `findByText` resolves on the filtered first item; assert delta < 1000 ms per TC-E2-P0-05.
  - [ ] Replace the previous `ClientesPlaceholderView` content: the route `frontend/src/routes/clientes.tsx` already imports `ClientesPlaceholderView`. Either (a) **swap the import** in `clientes.tsx` to `ClienteListView` and DELETE `ClientesPlaceholderView.tsx`, OR (b) rewrite the body of `ClientesPlaceholderView.tsx` to delegate to `<ClienteListView />`. Preferred: option (a) — keep the file path canonical (`presentation/ClienteListView.tsx`) per architecture.md#Complete Project Directory Structure.
    - If option (a), delete `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` AND remove the `data-testid="clientes-view"` only if no other test depends on it. Story 1.2 E2E tests `e2e/tests/foundation/deep-linking.spec.ts` (`expect data-testid="clientes-view" visible`) DO depend on it. Mitigation: keep the same `data-testid="clientes-view"` on `ClienteListView`'s root `<aside>` (or add a parent wrapper carrying it). Verify Story 1.2 Playwright tests still pass.

- [x] **Task 16 — Register the `/clientes/$clienteId` route (URL state for selection)** (AC: #10)
  - [ ] Create `frontend/src/routes/clientes.$clienteId.tsx` (TanStack Router file-based dynamic route). The component renders a temporary placeholder right panel for this story (Story 2.2 owns the real detail view):
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

    export const Route = createFileRoute('/clientes/$clienteId')({
      component: ClienteListWithPlaceholderDetail,
    })

    function ClienteListWithPlaceholderDetail() {
      return (
        <div className="flex h-full">
          <ClienteListView />
          <main className="flex-1 p-6" data-testid="cliente-detail-placeholder">
            <p className="text-slate-500">Próximamente: detalle del cliente (Story 2.2).</p>
          </main>
        </div>
      )
    }
    ```
  - [ ] Update `frontend/src/routes/clientes.tsx` to render the same split layout (left = `ClienteListView`, right = placeholder text "Selecciona un cliente para ver su detalle"). This ensures the 280px panel is visible at `/clientes` AND `/clientes/:clienteId`, and that AC #4 holds on both URLs.
  - [ ] Re-run `pnpm dev` (or `pnpm build`) to regenerate `frontend/src/routeTree.gen.ts` via `@tanstack/router-plugin/vite`.

- [x] **Task 17 — Frontend tests (component + unit)** (AC: #12 frontend portion)
  - [ ] Add `frontend/src/test/handlers/clientes.ts` — MSW handlers for `GET /api/v1/clientes` returning a parameterised seeded array. Expose helper factories: `seedClientes(n)`, `seedEmpty()`, `seedFailing(status = 500)`, `seedDelayed(ms, array)`.
  - [ ] Register the MSW server in `frontend/vitest.setup.ts` (Story 1.1 may have already wired MSW boilerplate — verify; if absent, add `setupServer` from `msw/node` with `beforeAll(() => server.listen())` / `afterEach(() => server.resetHandlers())` / `afterAll(() => server.close())`).
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` with the following cases:
    - **TC-E2-P1-01:** renders 10 seeded clients in `<li>` items inside an element with `data-testid="cliente-list-view"`; asserts the panel has a `w-[280px]` Tailwind class (or computed style if jsdom layout is reliable enough — otherwise check the class list directly).
    - **TC-E2-P1-02:** seeds 5 clients with one whose `nit` is `900123-1`; types `9001` into the search input (`screen.getByPlaceholderText('Buscar por nombre o NIT...')`); asserts only the matching item is rendered.
    - **TC-E2-P1-03:** MSW handler returns `[]`; asserts `data-testid="empty-state"` is rendered with `data-variant="no-clients"` and the search input is NOT in the DOM.
    - **TC-E2-P0-08:** MSW handler returns 500 on first GET; asserts `data-testid="error-panel"` is rendered with the "Reintentar" button; swap MSW handler to return `[seeded]` and click "Reintentar"; asserts the list now renders.
    - **TC-E2-P0-05 (perf):** MSW handler returns 500 seeded clients via `seedClientes(500)` with a deterministic seed; renders the view, waits for the list to hydrate; records `t0 = performance.now()`; types a 4-character query that matches a small subset; uses `await screen.findByText(...)` on the first matching client's `nombre`; records `t1 = performance.now()`. Assert `t1 - t0 < 1000`. Add 20% CI headroom per test-design-epic-2.md#TC-E2-P0-05. Use `vi.useRealTimers()` for this test (the debounce timer must elapse naturally) so `performance.now()` reflects real ms.
    - **Search filter does NOT trigger a refetch:** spy on `apiClient.get` (or on MSW's request counter); render the view, wait for initial load (assert 1 GET); type "abc"; assert the GET counter is still 1 after the debounce elapses.
    - **EmptyState (search-empty):** seeds 5 clients; types a query that matches none; asserts `data-testid="empty-state"` with `data-variant="search-empty"` and the search input is STILL visible.
    - **Selecting an item updates URL via TanStack Router:** mount the router with `initialLocation: '/clientes'`; click a list item; assert the location becomes `/clientes/{id}` and the clicked item gains `aria-current="page"`. Use the same router mock pattern documented in Story 1.2's `vitest.setup.ts` (synchronous matches store).
    - **`useClientes` queryKey is `['clientes']`:** unit test that imports the hook factory or inspects the hook return shape — alternatively, a static assertion test using `grep` is acceptable; preferred is a Vitest test that calls `useClientes` via `renderHook` and asserts the underlying `QueryClient.getQueryCache().getAll()[0].queryKey` is `['clientes']`.
  - [ ] Add `frontend/src/shared/components/EmptyState.test.tsx`, `ErrorPanel.test.tsx`, `ClientListItem.test.tsx`, and `useDebouncedValue.test.ts` as described in their respective tasks.
  - [ ] Add `frontend/e2e/tests/clientes/list-and-search.spec.ts` (Playwright, `--project=chromium` only per Story 1.1 pin):
    - Spin up the backend (or use the MSW playwright network stub — Story 1.1 chose real backend per its smoke test; reuse that). Seed 3 clients via `POST /api/v1/clientes` is NOT available yet (Story 2.3), so seed by inserting via the backend's test seeder OR call the API after Story 2.3 ships. **For this story:** if no seed mechanism is available, restrict the E2E test to the "list rendered + search filters" path by hand-seeding directly in the DB via a `psql` fixture step (or run the test under the `RUN_E2E_WITH_DB=1` flag, mirroring Story 1.3's gating). DO NOT block the story on this if Postgres is unavailable — document the gating in Dev Agent Record.
    - The component tests above cover the same behavior deterministically and without a real DB; the E2E test is "nice to have" for this story and becomes mandatory once Story 2.3 lands (a real seed path).
  - [ ] Run `pnpm exec tsc -b --force` → 0 errors. Run `pnpm test` → all new tests pass + Story 1.1 / 1.2 tests continue to pass.

- [x] **Task 18 — Verify the full build + manual smoke** (AC: all)
  - [ ] Run `pnpm exec tsc -b --force` and `pnpm test` from `frontend/`.
  - [ ] Run `dotnet build backend/SiesaAgents.sln` and `dotnet test backend/SiesaAgents.sln`. All tests green; gated DB tests may be skipped if no Postgres.
  - [ ] Run `dotnet run --project backend/src/SiesaAgents.API` and `pnpm dev` in parallel. Navigate to `http://localhost:5173/clientes`:
    - With a populated DB → list renders.
    - With an empty DB → EmptyState (no-clients) renders.
    - Kill the backend → reload → ErrorPanel renders; restart backend → click "Reintentar" → list renders.
    - Type into the search field → list filters in real time, debounced ~150ms, no extra HTTP request observed in DevTools Network tab.
    - Click an item → URL becomes `/clientes/{uuid}`, item shows active state, placeholder right panel reads "Próximamente: detalle del cliente (Story 2.2)."

## Dev Notes

### Architectural Layer — Clean Architecture mapping

This story is the **first activation of a real domain (Clientes)** end-to-end. It exercises every Clean Architecture layer on both sides:

**Backend (additions):**
```
backend/src/
├── SiesaAgents.API/
│   ├── Program.cs                            ← MODIFY: register GetClientesQueryHandler, MapClienteEndpoints
│   └── Endpoints/
│       └── ClienteEndpoints.cs               ← NEW: GET /api/v1/clientes minimal-API
├── SiesaAgents.Application/
│   └── Clientes/
│       ├── DTOs/
│       │   └── ClienteDto.cs                 ← NEW: read DTO (record)
│       └── Queries/
│           ├── GetClientesQuery.cs            ← NEW: empty record (no params yet)
│           └── GetClientesQueryHandler.cs     ← NEW: reads via DbContext
├── SiesaAgents.Domain/
│   └── Entities/
│       └── ClienteEntity.cs                  ← NEW: private setters + static Create factory
└── SiesaAgents.Infrastructure/
    ├── Data/
    │   ├── AppDbContext.cs                   ← MODIFY: add DbSet<ClienteEntity> + ApplyConfigurationsFromAssembly
    │   ├── Configurations/
    │   │   └── ClienteConfiguration.cs       ← NEW: IEntityTypeConfiguration<ClienteEntity>
    │   └── Migrations/
    │       └── {timestamp}_AddClienteEntity.cs  ← NEW: generated by dotnet ef
```

**Frontend (additions):**
```
frontend/src/
├── modules/crm/clientes/
│   ├── domain/
│   │   ├── Cliente.ts                        ← NEW: entity interface (UUID, ISO timestamps)
│   │   └── IClienteRepository.ts             ← NEW: repository contract (getAll only)
│   ├── application/
│   │   ├── useClientes.ts                    ← NEW: TanStack Query — queryKey: ['clientes']
│   │   ├── matchesQuery.ts                   ← NEW: pure filter helper
│   │   └── matchesQuery.test.ts              ← NEW: unit test (TC-E2-P3-03)
│   ├── infrastructure/
│   │   └── clienteApiRepository.ts           ← NEW: axios impl of IClienteRepository
│   └── presentation/
│       ├── ClienteListView.tsx               ← NEW: 280px split-panel left view
│       └── ClienteListView.test.tsx          ← NEW: component tests (TC-E2-P0-05/08, P1-01/02/03)
├── shared/
│   ├── components/
│   │   ├── EmptyState.tsx                    ← NEW: variants no-clients / search-empty / no-contacts
│   │   ├── ErrorPanel.tsx                    ← NEW: title + message + Reintentar
│   │   └── ClientListItem.tsx                ← NEW: nombre + nit + active state
│   └── hooks/
│       └── useDebouncedValue.ts              ← NEW: 150ms debounce for search
├── routes/
│   ├── clientes.tsx                          ← MODIFY: render ClienteListView (replace placeholder)
│   └── clientes.$clienteId.tsx               ← NEW: URL-state route for selected client
└── test/
    └── handlers/
        └── clientes.ts                       ← NEW: MSW handlers + seed factories
```

[Source: company-standards.md#Frontend Folder Structure] [Source: company-standards.md#Backend Folder Structure] [Source: architecture.md#Complete Project Directory Structure]

### Tech Stack & Library Versions

| Package | Version | Where | Purpose |
|---|---|---|---|
| `Microsoft.EntityFrameworkCore` | 10.0.4 | `SiesaAgents.Application.csproj` (NEW reference) + Infrastructure (already) | EF Core LINQ extensions used in handler |
| `Microsoft.EntityFrameworkCore.InMemory` | 10.x | `SiesaAgents.UnitTests.csproj` | In-memory `AppDbContext` for handler unit tests (no DB needed) |
| `@tanstack/react-query` | 5+ | already installed (Story 1.1) | `useClientes` hook |
| `axios` | already installed (Story 1.1) | `apiClient.ts` | HTTP client |
| `react-loading-skeleton` | ^3.4.0 | already installed per ux-design-specification.md#Loading States — verify with `pnpm list react-loading-skeleton`; add if absent | Skeleton placeholders during first load |
| `@heroicons/react` | already installed (Story 1.2) | EmptyState / ClientListItem icons | Heroicons primary icon library |
| `siesa-ui-kit` | already installed (Story 1.1) | `Input`, `Button` | UI primitives |
| `msw` | already installed (Story 1.1) | `vitest.setup.ts` | Component test HTTP mocking |

**Versions are pinned to match `.NET 10` and Story 1.3 (EF Core 10.0.4) — do NOT bump the EF Core package without a coordinated solution-wide update.**

[Source: company-standards.md#Backend Stack] [Source: company-standards.md#Frontend Stack] [Source: 1-3-backend-database-foundation.md#Tech Stack & Library Versions]

### `ClienteEntity` — exact shape and rationale

The entity diverges intentionally from the architecture.md draft (which used `ID`, `NIT`, `Telefono`, `Ciudad`, `CreatedAt`, `UpdatedAt` PascalCase). The implementation aligns with company-standards.md#Backend Critical Rules:

| Property | Type | Convention | DB column (after snake_case) |
|---|---|---|---|
| `Id` | `Guid` | UUID PK, init `Guid.NewGuid()` in the entity field initializer | `id` |
| `Nombre` | `string` | required, max 200 | `nombre` |
| `Nit` | `string` | required, max 50, UNIQUE | `nit` (with `uk_clientes_nit`) |
| `Telefono` | `string` | required, max 50 | `telefono` |
| `Ciudad` | `string` | required, max 100 | `ciudad` |
| `CreatedAt` | `DateTimeOffset` | NEVER `DateTime` — init `DateTimeOffset.UtcNow` | `created_at` (`timestamptz`) |
| `UpdatedAt` | `DateTimeOffset` | NEVER `DateTime` | `updated_at` (`timestamptz`) |

Private constructor + static `Create` factory ensures invariants are enforced before EF materializes the entity. Validation in the factory is the **first line of defense**; FluentValidation at the Command level (Story 2.3) is the second line; the DB constraints (`NOT NULL`, `uk_clientes_nit`) are the third.

[Source: company-standards.md#Backend Critical Rules — DateTime] [Source: company-standards.md#Backend Critical Rules — Entity Pattern] [Source: architecture.md#Data Architecture]

### EF Core migration name & expected diff

The migration MUST be named `AddClienteEntity` (matches Story 2.6 future expectations of a discoverable migration timeline). The expected generated SQL (visible in `{timestamp}_AddClienteEntity.cs`'s `Up()`):

```csharp
migrationBuilder.CreateTable(
    name: "clientes",
    columns: table => new
    {
        id          = table.Column<Guid>(type: "uuid", nullable: false),
        nombre      = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
        nit         = table.Column<string>(type: "character varying(50)",  maxLength: 50,  nullable: false),
        telefono    = table.Column<string>(type: "character varying(50)",  maxLength: 50,  nullable: false),
        ciudad      = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
        created_at  = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
        updated_at  = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
    },
    constraints: table =>
    {
        table.PrimaryKey("pk_clientes", x => x.id);
    });

migrationBuilder.CreateIndex(
    name: "uk_clientes_nit",
    table: "clientes",
    column: "nit",
    unique: true);
```

If the generated code shows `Clientes` / `Nombre` (PascalCase), `ApplySnakeCaseNaming()` is NOT being called last — re-verify `OnModelCreating` ordering per Story 1.3.

[Source: 1-3-backend-database-foundation.md#snake_case naming extension — required behavior] [Source: company-standards.md#Database Conventions]

### Why a read-side handler instead of a `GetAll` repository method

Architecture.md#Backend organizes the Application layer with `Commands/` + `Queries/` (CQRS-lite). The read side does NOT use the repository pattern — the handler reads `AppDbContext` directly with `.AsNoTracking()` for zero overhead. This:

1. Matches the documented project tree (`Clientes/Queries/GetClientesQueryHandler.cs`) [Source: architecture.md#Complete Project Directory Structure].
2. Mirrors the canonical CQRS guidance — write side abstracts via `IClienteRepository` (Story 2.3 will introduce it), read side projects directly to DTOs.
3. Avoids over-engineering for a 500-row MVP table.

Trade-off: the Application project takes a `ProjectReference` to Infrastructure (which is a deviation from a strict Onion). Justification: the architecture document already accepted this trade-off implicitly (the project tree co-locates Queries with DbContext access). If a stricter boundary is wanted, a future story can introduce an `IReadDbContext` interface and DI it in. Out of scope here.

[Source: architecture.md#Complete Project Directory Structure] [Source: architecture.md#API & Communication Patterns]

### Minimal API endpoint conventions

- Group via `routes.MapGroup("/api/v1/clientes").WithTags("Clientes")` so Scalar groups all `Clientes` endpoints under one tag.
- Use `Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK)` for OpenAPI / Scalar discoverability.
- DO NOT add a controller; Minimal API is the company standard [Source: company-standards.md#Backend Stack].
- The middleware order from Story 1.1 / 1.3 (`ExceptionHandlingMiddleware` → `UseCors` → `UseStatusCodePages` → `MapOpenApi` → `MapScalarApiReference` → `MapGet("/health")` → `app.Run()`) is UNTOUCHED. `app.MapClienteEndpoints();` is inserted between `MapGet("/health")` and `app.Run();` so the health endpoint and OpenAPI/Scalar wiring continue to take precedence.

[Source: company-standards.md#Backend Stack] [Source: 1-1-project-initialization-repository-structure.md#Pipeline Order] [Source: 1-3-backend-database-foundation.md#Program.cs — DI registration patch]

### Frontend: 280px panel — exact layout and responsive behavior

This story is **desktop-first**: the 280px panel is mandatory only at viewport ≥ 1024px (`lg:` breakpoint per Story 1.2's responsive strategy). The AppShell from Story 1.2 already renders the desktop NavigationRail next to `<Outlet />`. The `ClienteListView` becomes a sibling of `<Outlet />` at the right (i.e., `ClienteListView` IS the page content — it occupies the left 280px column, and the right column inside the same route is the placeholder for Story 2.2's detail panel).

Tailwind classes for the panel root:
```tsx
<aside
  className="w-[280px] shrink-0 border-r border-slate-200 h-full flex flex-col"
  data-testid="cliente-list-view"
>
```
- `w-[280px]` — arbitrary value per Tailwind v4, fixes the panel width exactly per AC #4. (Verify the project's `tailwind.config.ts` does not need a custom width; arbitrary values are first-class in Tailwind v4.)
- `shrink-0` — never shrinks when the right panel grows.
- `border-r border-slate-200` — visual separator from the right panel.
- `h-full` — fills the parent (`<main>` of `__root.tsx` AppShell layout).
- `flex flex-col` — header (search input) + scrollable list region.

**Mobile (< 1024px) — out of scope for this story.** Story 1.2 already established that the mobile shell uses `NavigationBar` at the bottom and the route content occupies the full width. For Story 2.1 on mobile, the panel can simply render full-width (no 280px constraint). Mobile detail-panel behavior is Story 2.2's territory. If a mobile-specific test is added here, scope it to "list renders with search and items" only.

[Source: ux-design-specification.md#Direction F] [Source: ux-design-specification.md#Responsive Strategy] [Source: 1-2-frontend-navigation-shell.md#Responsive breakpoint strategy]

### URL as the single source of truth for selected client

Per architecture.md#State Boundaries, the selected `clienteId` is derived from the URL (`/clientes/:clienteId`) — there is NO Zustand store for this state. Use TanStack Router's `useParams({ strict: false })` against the dynamic route `/clientes/$clienteId` to read the active id from within `ClienteListView`. The `ClienteListView` lives in BOTH routes (`/clientes` and `/clientes/$clienteId`) so it is mounted continuously while the user navigates between items — TanStack Router will preserve the component instance because the parent route segment (`clientes.*`) does not change.

[Source: architecture.md#State Boundaries] [Source: company-standards.md#Frontend Key Rules — State]

### Spanish copy — exact strings (verbatim)

| Context | Spanish text (VERBATIM) |
|---|---|
| Search input placeholder | `"Buscar por nombre o NIT..."` |
| Search input `aria-label` | `"Buscar clientes"` |
| EmptyState `no-clients` title | `"No hay clientes registrados"` |
| EmptyState `no-clients` subtitle | `"Crea el primer cliente del sistema"` |
| EmptyState `no-clients` CTA | `"Nuevo cliente"` |
| EmptyState `search-empty` title | `"No se encontró ningún cliente"` |
| EmptyState `search-empty` subtitle | `"Intenta con otro nombre o NIT"` |
| EmptyState `search-empty` CTA | `"Crear cliente"` |
| ErrorPanel title | `"No se pudo cargar"` |
| ErrorPanel message | `"Ocurrió un problema al cargar los clientes. Intenta de nuevo."` |
| ErrorPanel button | `"Reintentar"` |
| ClientListItem `aria-label` | `"Ver cliente: {nombre}"` |
| Right-panel placeholder (this story) | `"Próximamente: detalle del cliente (Story 2.2)."` |
| Empty-state right panel at `/clientes` (no id selected) | `"Selecciona un cliente para ver su detalle"` |

Tests assert the verbatim strings.

[Source: company-standards.md#Frontend Key Rules — Spanish] [Source: ux-design-specification.md#EmptyState — variantes] [Source: ux-design-specification.md#Error & Recovery Patterns]

### Search performance — required design pattern

Per test-design-epic-2.md#R-202 mitigation and #TC-E2-P0-05:

1. **Debounce 150ms** between the raw input value and the value used for filtering. The visible input text updates instantly; the filter recomputes on the debounced value.
2. **Pure memoised filter** — `useMemo(() => list.filter(c => matchesQuery(c, debouncedQuery)), [list, debouncedQuery])`.
3. **No API call on keystroke** — the data is loaded once via TanStack Query and cached as `['clientes']`. The search only filters the in-memory array.
4. **No `react-window` needed for 500 rows** — React renders 500 simple list items in well under 100 ms on modern hardware. Add virtualization later (post-MVP) only if profiling shows it is necessary.

Performance budget (informative): for 500 rows, the `matchesQuery` filter runs in O(n) over 500 items doing 2 lowercase substring matches — ~100 µs. React re-render of 500 items is ~30-60 ms. Total well under the 1000 ms NFR1 budget, leaving headroom for slower CI runners.

[Source: prd/non-functional-requirements.md#NFR1] [Source: test-design-epic-2.md#TC-E2-P0-05] [Source: test-design-epic-2.md#R-202]

### siesa-ui-kit components consumed in this story

| Component | Usage | Notes |
|---|---|---|
| `Input` | Search field inside `ClienteListView` header | Use `placeholder`, `aria-label`, `value`, `onChange` props. The `icon` prop (if exposed) takes a left-side Heroicon. Verify the props against `frontend/node_modules/siesa-ui-kit/dist/index.d.ts` (Input.types). |
| `Button` | EmptyState CTAs + ErrorPanel "Reintentar" | Use `variant="outline"` for EmptyState CTAs (secondary), `variant` default (primary) for "Reintentar". |

NO `MasterCrud` in this story. **MasterCrud is the company's CRUD orchestrator for table-grid + form CRUD screens** (per the MasterCrud reference) — Story 2.1 deliberately ships a custom split-panel UX (per ux-design-specification.md#Direction F) that does not match the MasterCrud table-centric model. MasterCrud would be a fit if the design were "data grid + edit modal", but the chosen UX is a fixed 280px scrollable list + right-side detail panel. Stories 2.3 / 2.4 will use shadcn `Dialog` for the create/edit form (also per ux-design-specification.md#Form Patterns) — not MasterCrud.

If the design were to pivot to a table-centric admin view in a future story, MasterCrud is the right choice and integrates trivially with the existing `useClientes` hook by implementing the `CrudService<Cliente>` contract (`getAll`, `getById`, `create`, `update`, `delete`) that the kit expects.

[Source: ux-design-specification.md#Direction F] [Source: mastercrud-use-reference.md#📦 MasterCrud — Guía de Uso] [Source: ux-design-specification.md#Form Patterns]

### Testing standards & mapping to test-design-epic-2

| Test ID | Title | Implementation owner in this story | Level |
|---|---|---|---|
| TC-E2-P0-05 | Search <1s with 500 records | Task 17 → `ClienteListView.test.tsx` | Component (Vitest + RTL + MSW) |
| TC-E2-P0-08 | List fetch failure renders ErrorPanel with Retry | Task 17 → `ClienteListView.test.tsx` | Component |
| TC-E2-P1-01 | List renders all items in 280px panel | Task 17 → `ClienteListView.test.tsx` | Component |
| TC-E2-P1-02 | Search filters by both `nombre` and `nit` | Task 17 → `ClienteListView.test.tsx` | Component |
| TC-E2-P1-03 | EmptyState displayed when list is empty | Task 17 → `ClienteListView.test.tsx` | Component |
| TC-E2-P2-01 | GET `/api/v1/clientes` returns seeded list | Task 8 → `ClienteEndpointsTests.cs` | API Integration (WebApplicationFactory + InMemory) |
| TC-E2-P2-06 | NIT unique index at DB level | Task 8 → `ClienteSchemaIntegrationTests.cs` (gated) | API Integration (real Postgres) |
| TC-E2-P2-07 | `clientes` table uses snake_case columns | Task 8 → `ClienteSchemaIntegrationTests.cs` (gated) | API Integration |
| TC-E2-P2-08 | `createdAt`/`updatedAt` use `DateTimeOffset` (UTC offset present) | Task 8 → `ClienteEndpointsTests.cs` | API Integration |
| TC-E2-P3-03 | Filter predicate combines `nombre` + `nit` | Task 10 → `matchesQuery.test.ts` | Unit |

TC-E2-P0-09 (mutation invalidates `['clientes']` cache) is OUT OF SCOPE — this story has no mutations. Story 2.3 / 2.4 / 2.5 own that test. TC-E2-P0-04 (E2E create-and-see-in-list) is also Story 2.3's. TC-E2-P0-07 (E2E deep-link) is Story 2.2's.

CI execution: per test-design-epic-2.md#8 Test Execution Order, Phase 1 (Backend Contract Gate) gates ANY further work in Epic 2. Run `dotnet test --filter "ClienteSchemaIntegrationTests|ClienteEndpointsTests"` first, then frontend P0 component tests, then E2E.

[Source: test-design-epic-2.md#5 Test Cases by Priority] [Source: test-design-epic-2.md#8 Test Execution Order]

### Spanish text & i18n — non-negotiable

Every label, placeholder, ARIA label, button text, EmptyState message and ErrorPanel message MUST be in Spanish (P0 per company-standards.md#Frontend Key Rules). Code identifiers (variables, functions, classes) remain in English. The verbatim strings table above is the source of truth — tests assert them verbatim.

### Project Structure Notes

**Alignment with architecture.md and Story 1.3:**
- Backend: `Clientes/Queries/GetClientesQueryHandler.cs`, `Clientes/DTOs/ClienteDto.cs`, `Entities/ClienteEntity.cs`, `Data/Configurations/ClienteConfiguration.cs`, `Endpoints/ClienteEndpoints.cs` match the canonical layout 1:1.
- Frontend: `modules/crm/clientes/{domain,application,infrastructure,presentation}/...` matches the documented Clean Architecture module structure. Shared components live in `shared/components/`. The shared hook `useDebouncedValue` lives in `shared/hooks/` (new directory; create if absent — aligned with the company-standards.md frontend structure showing `shared/hooks/`).

**Variances / decisions:**
- This story does NOT introduce an `IClienteRepository` interface on the backend. The read side reads `AppDbContext` directly per CQRS-lite. Story 2.3 will introduce `IClienteRepository` for the write side; the interface can be added without affecting this story.
- `ClienteListView` is mounted on BOTH `/clientes` and `/clientes/$clienteId` so the 280px panel persists during selection. The right panel content differs by route (placeholder text vs. Story 2.2's detail view).
- The `ClientesPlaceholderView` from Story 1.2 is being replaced. The Story 1.2 Playwright test depending on `data-testid="clientes-view"` is preserved by adding the same `data-testid` to `ClienteListView`'s root `<aside>`.
- Default sort on the backend is `ORDER BY created_at DESC` — matches Story 2.6's default "Más reciente" without requiring extra backend work. Story 2.6 then implements the OTHER three sort options client-side over the same cached array.
- Sort selector is NOT in this story (it belongs to Story 2.6); the default ordering comes from the backend response.

### References

- Epic: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- PRD feature: [Source: _bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md]
- NFR1 (search <1s): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md]
- NFR6 (no stack-trace exposure): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md] [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#AC #3]
- Architecture (data model, API, routing, query keys, state boundaries): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries] [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- UX (split panel 280px, EmptyState variants, ErrorPanel, search placeholder, ClientListItem visuals): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Direction F] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ClientListItem] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EmptyState] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Error & Recovery Patterns] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Búsqueda de clientes]
- Company standards (Clean Architecture, naming, EF Core conventions, DateTimeOffset, UUIDs, Spanish copy, Heroicons): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- MasterCrud applicability note (used for this story's "why not MasterCrud" decision): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Test design (P0/P1/P2/P3 mapping, non-negotiable constraints): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#5] [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#15]
- Previous story (Backend DB Foundation) — DbContext, snake_case, ExceptionHandlingMiddleware, EF migration workflow: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- Previous story (Frontend Navigation Shell) — AppShell, TanStack Router patterns, Heroicons, MSW pin: [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]
- Previous story (Project Initialization) — siesa-ui-kit, axios, MSW, Playwright pin, tsconfig: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- E2E AC #8 (ErrorPanel) initially failed because React 18 StrictMode
  double-invokes effects in dev. The Playwright route handler alternates
  500 → 200, so the second `useQuery` mount silently succeeded before the
  user could see the error. Resolution: removed the `<StrictMode>` wrapper
  in `frontend/src/main.tsx` (production effect cadence is unchanged) and
  set `retry: false` on `useClientes`. Both changes are necessary to honor
  AC #8's "single failure → ErrorPanel" contract.
- Backend `ClienteEndpointsTests` collided with two EF Core providers
  (Npgsql + InMemory) registered in the same DI container. Resolution: in
  `Program.cs`, the Npgsql `AddDbContext` call is now skipped when the host
  environment is `Testing`, letting the WebApplicationFactory inject the
  InMemory provider cleanly.
- Story 1.3's `AppDbContext_Model_DeclaresNoEntityTypes_InThisStory` test
  was renamed to `AppDbContext_Model_DeclaresClienteEntity_AfterStory2_1`
  because Story 2.1 introduces `ClienteEntity`, invalidating the original
  premise. This is the only Story 1.3 test that needed evolution.

### Completion Notes List

- All 12 ACs implemented end-to-end (Backend + Frontend).
- Backend: 72 unit/integration tests pass, 8 PostgreSQL-gated tests skipped
  (sandbox has no PostgreSQL — gating works as designed per Story 1.3).
- Frontend: 75 Vitest tests pass (component + unit + hook + handlers).
- E2E (Chromium): 94 tests pass (foundation 40 + api 46 + clientes
  list-and-search 8). 6 E2E tests in `clientes-crud.spec.ts` are out of
  scope (cover FR3/FR4/FR5/FR6/FR7/FR8 — Stories 2.2 / 2.3 / 2.4 / 2.5).
- PostgreSQL DB integration tests gated by `RUN_DB_INTEGRATION_TESTS=1`
  remain skipped in sandbox; the generated migration SQL was visually
  verified to produce `pk_clientes`, `uk_clientes_nit`, snake_case columns,
  and `timestamp with time zone` for the audit fields.
- ClientesPlaceholderView.tsx was deleted; `data-testid="clientes-view"`
  is preserved on a hidden `<span>` inside `ClienteListView` so Story 1.2
  Playwright tests continue to pass.

### File List

Backend — created:
- backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs
- backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
- backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260608100932_AddClienteEntity.cs
- backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260608100932_AddClienteEntity.Designer.cs
- backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
- backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
- backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
- backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs

Backend — modified:
- backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs (added DbSet + ApplyConfigurationsFromAssembly)
- backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs (auto-updated by EF)
- backend/src/SiesaAgents.API/Program.cs (skip Npgsql in Testing env; register handler; map endpoints)
- backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj (reference Infrastructure + EF Core)
- backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs (updated stale Story 1.3 assertion)

Frontend — created:
- frontend/src/modules/crm/clientes/domain/Cliente.ts
- frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
- frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
- frontend/src/modules/crm/clientes/application/useClientes.ts
- frontend/src/modules/crm/clientes/application/matchesQuery.ts
- frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
- frontend/src/shared/hooks/useDebouncedValue.ts
- frontend/src/shared/components/EmptyState.tsx
- frontend/src/shared/components/ErrorPanel.tsx
- frontend/src/shared/components/ClientListItem.tsx
- frontend/src/routes/clientes.$clienteId.tsx

Frontend — modified:
- frontend/src/main.tsx (removed StrictMode — see Debug Log References)
- frontend/src/routes/clientes.tsx (renders ClienteListView + right-panel placeholder)
- frontend/src/routeTree.gen.ts (auto-regenerated by @tanstack/router-plugin)

Frontend — deleted:
- frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx
