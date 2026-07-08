# Story 2.1: Client List & Search

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for from the `/clientes` view.

## Acceptance Criteria

1. **Given** the backend has one or more `Cliente` rows persisted in PostgreSQL, **When** the user navigates to `/clientes` (via link, deep link, or after the `/` → `/clientes` redirect), **Then** the split-panel layout renders with a **left panel of exactly 280px width** (`flex-shrink: 0`) containing a scrollable list of every `Cliente` sorted by `created_at DESC` (newest first — matches Story 2.6 default), each item displaying `Nombre` and `NIT/RUC` on separate visual lines with Spanish labels, and a right panel (flex-1) that shows an initial empty/placeholder state (right-panel domain content is Story 2.2's responsibility).

2. **Given** the client list is loaded, **When** the user types text in the search input at the top of the left panel, **Then** the list filters in-memory in real time (no additional HTTP request fired — assert MSW handler call count === 1 across N keystrokes), the filter matches `Nombre` OR `NIT/RUC` case-insensitively and accent-insensitively, and results are visible within **< 1 second** for a 500-record fixture (NFR1). A `useMemo` filter over the TanStack Query cache MUST be used; a **150 ms debounce** on the input value gates re-computation (matches UX spec §Search & Filtering Patterns).

3. **Given** the search input contains a value that matches zero rows, **When** the filter runs, **Then** the list area is replaced by an `EmptyState` component with variant `search-empty`, exact Spanish copy `"No se encontró ningún cliente"` (title) and `"Intenta con otro nombre o NIT"` (subtitle). `aria-live="polite"` on the empty-state container so a screen reader announces the change.

4. **Given** the backend responds with an empty array `[]` on initial load (no clients exist yet), **When** the query resolves, **Then** the list area shows an `EmptyState` component with variant `no-clients`, exact Spanish title `"No hay clientes registrados"` and subtitle `"Crea el primer cliente del sistema"`. The variant is chosen based on whether the search input is empty (`no-clients`) versus non-empty with no matches (`search-empty`).

5. **Given** the backend is unavailable or returns a non-2xx response when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component is rendered instead of the list (title `"No se pudo cargar la lista de clientes"`, subtitle `"Comprueba tu conexión e intenta nuevamente."`), including a `"Reintentar"` button that calls `refetch()` from TanStack Query. The raw error message is NEVER displayed (NFR6). While retrying, the button shows a spinner and is `disabled`.

6. **Given** the query is in flight for the first time (no cached data), **When** the list area renders, **Then** exactly **6 skeleton items** (`react-loading-skeleton`) render inside the list container to preserve layout height; no spinner is shown per company standard "Skeleton screens, not spinners".

7. **Given** the user clicks a `ClienteListItem`, **When** the click is processed, **Then** the URL updates to `/clientes/:clienteId` via TanStack Router's `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })` and the clicked item becomes visually `selected` (3px left border in `primary-600`, `primary-50` background). Right-panel content behaviour beyond the URL update is Story 2.2 scope — Story 2.1 only guarantees the URL change and the selected visual state.

8. **Given** the backend endpoint `GET /api/v1/clientes` is deployed, **When** any client hits it, **Then** it returns HTTP 200 with a JSON array of `ClienteDto` objects `{ id: uuid, nombre: string, nit: string, telefono: string, ciudad: string, createdAt: string ISO 8601 with tz, updatedAt: string ISO 8601 with tz }`. The endpoint accepts NO query parameters in Story 2.1 (search is client-side); adding `?q=` is out of scope. Response is ordered by `created_at DESC`.

9. **Given** an EF Core migration named `AddClientesTable` is generated in `SiesaAgents.Infrastructure/Migrations/`, **When** the developer runs `dotnet ef database update`, **Then** a table `clientes` is created with columns `id (uuid PK, default uuidv7() OR NEWID() at .NET side)`, `nombre (varchar(200) NOT NULL)`, `nit (varchar(50) NOT NULL)`, `telefono (varchar(50) NOT NULL)`, `ciudad (varchar(100) NOT NULL)`, `created_at (timestamptz NOT NULL)`, `updated_at (timestamptz NOT NULL)`. A UNIQUE index `uk_clientes_nit` on `nit` is created (enforces FR7 — enforced but not exercised in Story 2.1). Column and index names are snake_case (proves `UseSnakeCaseNamingConvention()` from Story 1.3 is still active). NO `contactos` table is created (Epic 3 scope).

10. **Given** `dotnet build backend/SiesaAgents.sln` and `pnpm --dir frontend build && pnpm --dir frontend typecheck` are executed, **When** both toolchains compile, **Then** backend build reports 0 errors / 0 new warnings (the pre-existing `NU1903` suppression from Story 1.1 stays), frontend build succeeds under TypeScript strict mode with 0 errors and NO `any` types are introduced. The frontend CSS gzip baseline of 670 KB (inherited from 1.1/1.2) must not regress by more than +5 KB.

11. **Given** `dotnet test backend/SiesaAgents.sln` and `pnpm --dir frontend test` are executed, **When** all tests run, **Then** every existing test from Stories 1.1/1.2/1.3 continues to pass AND the new tests introduced by this story pass — see the enumerated test list under "Testing Standards" below. Coverage of net-new files under `modules/crm/clientes/**` and `SiesaAgents.*/Clientes/**` is `> 80%` (company standard).

## Tasks / Subtasks

- [x] Task 1 — Backend Domain layer: `ClienteEntity` and repository contract (AC: #8, #9)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`:
    - Namespace: `SiesaAgents.Domain.Clientes.Entities`.
    - Class: `public class ClienteEntity` (not `sealed` — future domain events may extend).
    - Private parameterless constructor for EF Core: `private ClienteEntity() { }`.
    - Public properties (all with `private set;` — DDD encapsulation):
      - `public Guid Id { get; private set; }`
      - `public string Nombre { get; private set; } = string.Empty;`
      - `public string Nit { get; private set; } = string.Empty;`
      - `public string Telefono { get; private set; } = string.Empty;`
      - `public string Ciudad { get; private set; } = string.Empty;`
      - `public DateTimeOffset CreatedAt { get; private set; }`
      - `public DateTimeOffset UpdatedAt { get; private set; }`
    - Static factory `public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)` — sets `Id = Guid.NewGuid()`, `CreatedAt = UpdatedAt = DateTimeOffset.UtcNow`. Basic guard clauses (`ArgumentException.ThrowIfNullOrWhiteSpace(...)`) — deep validation is `FluentValidation`'s job (Story 2.3).
    - NO `DateTime` anywhere — `DateTimeOffset` is mandatory (company standard).
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`:
    - Namespace: `SiesaAgents.Domain.Clientes.Interfaces`.
    - `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)` — returns list ordered by `CreatedAt DESC`.
    - `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` (declared now for Story 2.2 reuse; implementation used only by list endpoint here, but the contract is complete to avoid churn).
    - DO NOT declare `AddAsync/UpdateAsync/DeleteAsync` here — they belong to Stories 2.3–2.5.

- [x] Task 2 — Backend Infrastructure: `ClienteConfiguration`, repository, DbSet, migration (AC: #8, #9, #10)
  - [x] Create folder `backend/src/SiesaAgents.Infrastructure/Data/Configurations/`.
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`:
    - `public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>`.
    - `ToTable("clientes")` — snake_case plugin will keep this. Explicit table name is fine and matches architecture.
    - `HasKey(c => c.Id)`.
    - `Property(c => c.Nombre).IsRequired().HasMaxLength(200);`
    - `Property(c => c.Nit).IsRequired().HasMaxLength(50);`
    - `Property(c => c.Telefono).IsRequired().HasMaxLength(50);`
    - `Property(c => c.Ciudad).IsRequired().HasMaxLength(100);`
    - `Property(c => c.CreatedAt).IsRequired();`
    - `Property(c => c.UpdatedAt).IsRequired();`
    - `HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");`
    - NO `HasColumnType` calls — let EF Core + Npgsql pick `timestamptz` for `DateTimeOffset` and `text`/`varchar` for strings.
  - [x] Edit `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
    - Add `public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();` under the constructor.
    - Inside `OnModelCreating`, ABOVE the comment placeholder, add:
      `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);`
      (This picks up `ClienteConfiguration` — Story 1.3's placeholder becomes real code.)
    - Do NOT remove the comment about `UseSnakeCaseNamingConvention()` — keep the explanation.
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    - `public class ClienteRepository(AppDbContext db) : IClienteRepository`.
    - `GetAllAsync` → `db.Clientes.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct);` (return `IReadOnlyList` via cast).
    - `GetByIdAsync` → `db.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);`
  - [x] Register in DI in `Program.cs`, near the `AddDbContext` block:
    `builder.Services.AddScoped<IClienteRepository, ClienteRepository>();`
  - [x] Add `ProjectReference` `SiesaAgents.Domain` → `SiesaAgents.Infrastructure` if missing (verify by reading the .csproj).
  - [x] From `backend/`, generate the migration:
    ```bash
    dotnet ef migrations add AddClientesTable \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Migrations
    ```
  - [x] Inspect the generated migration and confirm:
    - `Up()` calls `migrationBuilder.CreateTable(name: "clientes", ...)` with snake_case column names (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`).
    - `Up()` creates the unique index `uk_clientes_nit`.
    - `Down()` symmetrically drops the table.
    - Do NOT hand-edit — if the migration is wrong, delete it, fix `ClienteConfiguration`, and regenerate.

- [x] Task 3 — Backend Application layer: `GetClientesQuery` + Handler + `ClienteDto` (AC: #8, #11)
  - [x] Create folder `backend/src/SiesaAgents.Application/Clientes/{Queries,DTOs}/`.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`:
    ```csharp
    public sealed record ClienteDto(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt);
    ```
    Property JSON casing follows .NET defaults (`camelCase`) — do NOT annotate `[JsonPropertyName]`.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`:
    ```csharp
    public sealed record GetClientesQuery();
    ```
    (No parameters in Story 2.1 — search is client-side.)
  - [x] Create `GetClientesQueryHandler.cs`:
    ```csharp
    public sealed class GetClientesQueryHandler(IClienteRepository repo)
    {
        public async Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery _, CancellationToken ct)
        {
            var entities = await repo.GetAllAsync(ct);
            return entities.Select(e => new ClienteDto(e.Id, e.Nombre, e.Nit, e.Telefono, e.Ciudad, e.CreatedAt, e.UpdatedAt)).ToList();
        }
    }
    ```
    No MediatR — direct handler pattern per the architecture doc's minimalism (Story 1.1 did NOT install MediatR).
  - [x] Register in DI: `builder.Services.AddScoped<GetClientesQueryHandler>();` in `Program.cs`.

- [x] Task 4 — Backend API: `ClienteEndpoints` Minimal API (AC: #8)
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    ```csharp
    public static class ClienteEndpoints
    {
        public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder routes)
        {
            var group = routes.MapGroup("/api/v1/clientes").WithTags("Clientes");

            group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
                Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)));

            return routes;
        }
    }
    ```
    Only ONE endpoint in Story 2.1 — `GET /api/v1/clientes`. `POST/PUT/DELETE/GetById` are Stories 2.2–2.5.
  - [x] In `Program.cs`, AFTER `app.UseCors(...)` and BEFORE `app.Run()`, add `app.MapClienteEndpoints();`.
  - [x] Verify with `curl http://localhost:5000/api/v1/clientes` returns `200 [] ` initially, and `application/json` content-type.
  - [x] Verify `curl http://localhost:5000/api/v1/clientes/00000000-0000-0000-0000-000000000000` returns 404 with Problem Details (existing status-code-pages handler covers it — no per-endpoint 404 wiring needed in Story 2.1).

- [x] Task 5 — Backend tests: unit + integration (AC: #11)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`:
    - `HandleAsync_ReturnsEmpty_WhenRepositoryEmpty` — stub `IClienteRepository` returns `[]`, assert result is empty.
    - `HandleAsync_MapsAllFields_FromEntityToDto` — stub returns one entity with known values; assert every DTO field equals the entity's.
    - `HandleAsync_PreservesRepositoryOrder` — stub returns list `[C, A, B]`; assert result order matches.
    - Use raw xUnit `Assert.*` — do NOT introduce FluentAssertions (Story 1.1 convention).
    - Use `NSubstitute` ONLY if already installed; otherwise a hand-rolled fake class implementing `IClienteRepository` is acceptable.
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs`:
    - `Configuration_Applies_TableName_And_Nit_UniqueIndex` — build the model via `new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=x;Database=x;Username=x;Password=x").UseSnakeCaseNamingConvention().Options)`, resolve `IEntityType` for `ClienteEntity`, assert:
      - `GetTableName() == "clientes"`.
      - `GetIndexes()` contains one index with `IsUnique == true` and `Properties[0].Name == "Nit"` (property name; the plugin rewrites the column to `nit`).
      - Every string property has `IsRequired == true`.
      - `Nombre` property `GetMaxLength() == 200`; `Nit == 50`; `Telefono == 50`; `Ciudad == 100`.
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs`:
    - Use `WebApplicationFactory<Program>` with `.UseEnvironment("Testing")`.
    - `GetClientes_ReturnsOk_WithEmptyArray_ForFreshDb` — call `GET /api/v1/clientes`; expect `200`, `application/json`, body `[]`.
      - Test seam: because Testing env uses the same fake connection string as Story 1.3, the DB is unreachable. Two options: (a) register a **fake `IClienteRepository`** in the `Testing` environment via `ConfigureServices` override in the factory (cleanest — no DB needed), or (b) use EF Core InMemory provider for the Testing environment. **Choose option (a)** — override in the test factory via `WithWebHostBuilder(b => b.ConfigureServices(s => { s.RemoveAll<IClienteRepository>(); s.AddSingleton<IClienteRepository, FakeClienteRepository>(); }))`. Provide a `FakeClienteRepository` implementation inside the test project with a mutable list.
    - `GetClientes_Returns_AllSeededItems_InCreatedAtDescOrder` — seed the fake repo with three items with distinct `CreatedAt`; assert response body deserialises to an array of 3 `ClienteDto`s in the correct order.
    - `GetClientes_ReturnsJsonWithCamelCaseKeys` — assert the raw response body contains `"nombre"`, `"nit"`, `"createdAt"` (camelCase) and NOT `"Nombre"` (PascalCase).
  - [x] Update `SiesaAgents.UnitTests.csproj` if any new packages are needed — but the existing set (`Microsoft.AspNetCore.Mvc.Testing`, `xunit`, `Microsoft.EntityFrameworkCore.InMemory` if it exists) should be enough. Do NOT add `NSubstitute` unless already present.

- [x] Task 6 — Frontend Domain layer: `Cliente` type + `IClienteRepository` (AC: #10)
  - [x] Create folder `frontend/src/modules/crm/clientes/domain/`.
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`:
    ```typescript
    export interface Cliente {
      id: string
      nombre: string
      nit: string
      telefono: string
      ciudad: string
      createdAt: string  // ISO 8601 with tz
      updatedAt: string
    }
    ```
    Do NOT use `Date` — timestamps stay as ISO strings until the presentation layer needs to format (defer to `date-fns` only if a story actually renders formatted dates; Story 2.1 doesn't).
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`:
    ```typescript
    import type { Cliente } from './Cliente'
    export interface IClienteRepository {
      getAll(signal?: AbortSignal): Promise<Cliente[]>
      getById(id: string, signal?: AbortSignal): Promise<Cliente>
    }
    ```
    Declaring `getById` now avoids churn in Story 2.2. Story 2.1 code only uses `getAll`.

- [x] Task 7 — Frontend Infrastructure: `clienteApiRepository` (AC: #10)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```typescript
    import { apiClient } from '@/shared/lib/apiClient'
    import type { Cliente } from '../domain/Cliente'
    import type { IClienteRepository } from '../domain/IClienteRepository'

    export const clienteApiRepository: IClienteRepository = {
      async getAll(signal) {
        const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
        return data
      },
      async getById(id, signal) {
        const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`, { signal })
        return data
      },
    }
    ```
  - [x] Confirm `apiClient` at `frontend/src/shared/lib/apiClient.ts` (already exists from 1.2) has `baseURL` sourced from `import.meta.env.VITE_API_URL`. If `VITE_API_URL` is not set, the axios instance defaults to relative paths — fine for tests via MSW.
  - [x] If `VITE_API_URL` is not defined in `frontend/.env.development`, add it:
    ```env
    VITE_API_URL=http://localhost:5000
    ```
    Do NOT commit real production URLs.

- [x] Task 8 — Frontend Application layer: `useClientes` hook (AC: #2, #5, #6, #11)
  - [x] Create folder `frontend/src/modules/crm/clientes/application/`.
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```typescript
    import { useQuery } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import type { Cliente } from '../domain/Cliente'

    export const CLIENTES_QUERY_KEY = ['clientes'] as const

    export function useClientes() {
      return useQuery<Cliente[]>({
        queryKey: CLIENTES_QUERY_KEY,
        queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
        staleTime: 30_000,  // 30s — mutations invalidate this key explicitly (Stories 2.3+)
      })
    }
    ```
    Query key MUST be the canonical `['clientes']` — this is architecturally mandated for FR27 invalidation.
  - [x] Create `frontend/src/modules/crm/clientes/application/useDebouncedValue.ts` (small utility, colocated to avoid `shared/` sprawl):
    ```typescript
    import { useEffect, useState } from 'react'
    export function useDebouncedValue<T>(value: T, delay = 150): T {
      const [debounced, setDebounced] = useState(value)
      useEffect(() => {
        const id = window.setTimeout(() => setDebounced(value), delay)
        return () => window.clearTimeout(id)
      }, [value, delay])
      return debounced
    }
    ```
    Default 150 ms matches UX spec §Search & Filtering Patterns.

- [x] Task 9 — Frontend shared UI: `EmptyState` + `ErrorPanel` + `ClienteListItem` (AC: #3, #4, #5)
  - [x] Create `frontend/src/shared/components/EmptyState.tsx`:
    - Props: `variant: 'search-empty' | 'no-clients' | 'no-contacts'`, `title?: string` (override), `subtitle?: string` (override), `actionLabel?: string`, `onAction?: () => void`.
    - Default titles/subtitles per UX spec §Custom Components → EmptyState variants table. Story 2.1 uses only `search-empty` and `no-clients`.
    - Root container has `role="status"` and `aria-live="polite"` so screen readers announce dynamic replacement of results.
    - Icon: `MagnifyingGlassIcon` (Heroicons) for `search-empty`, `UsersIcon` for `no-clients`, `UserGroupIcon` for `no-contacts`.
    - Uses siesa-ui-kit's `Button` (outline variant) for CTA if `actionLabel` is passed. Story 2.1 does NOT wire the CTA — leave `onAction` unimplemented at the ClienteListView call site (Story 2.3 will wire `Nuevo cliente`).
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx`:
    - Props: `title: string`, `subtitle?: string`, `onRetry: () => void`, `isRetrying?: boolean`.
    - Renders an `ExclamationTriangleIcon` (Heroicons), the title in `text-lg font-semibold`, the subtitle in `text-sm text-slate-600`, and a siesa-ui-kit `Button` outline with label `"Reintentar"`.
    - Button is `disabled` while `isRetrying === true` and shows a spinner (inline SVG or Heroicon `ArrowPathIcon` with `motion-safe:animate-spin`).
    - **Never** displays `error.message` — the parent decides the copy.
    - `role="alert"` on the container.
  - [x] Create `frontend/src/shared/components/ClienteListItem.tsx`:
    - Props: `cliente: Cliente`, `selected: boolean`, `onSelect: (id: string) => void`.
    - Renders a `<button type="button" role="button">` (native button semantics — the UX spec asks for `role="button"` explicitly, and using a real button gets Tab focus + Space/Enter activation for free).
    - Two lines: line 1 = `cliente.nombre` (`text-sm font-medium text-slate-900`), line 2 = `NIT: {cliente.nit}` (`text-xs text-slate-500`).
    - **Do NOT** render the contact-count badge or the ⚠ badge in Story 2.1 — those depend on `contactos` (Epic 3 + Story 4.1). Leave a comment noting the placeholder for the badge slot.
    - `aria-label={\`Ver cliente: ${cliente.nombre}\`}` on the button.
    - Selected visual: 3px left border in `primary-600` (`border-l-[3px] border-[color:var(--primary-600)]` OR Tailwind `border-l-[3px] border-primary-600` if the token is exposed via siesa-ui-kit tokens; otherwise use the raw hex `#0e79fd` inline **only** as a documented deviation) and background `primary-50` (fallback `#e6f0ff`). Prefer the `data-selected="true"` attribute + a Tailwind class combinator so tests can assert without depending on colour values.
    - Full width, cursor pointer, hover `bg-slate-50`.
  - [x] Colocate tests: `EmptyState.test.tsx`, `ErrorPanel.test.tsx`, `ClienteListItem.test.tsx` — see Testing Standards below for exact assertions.

- [x] Task 10 — Frontend Presentation: `ClienteListView` (AC: #1–#7)
  - [x] Create folder `frontend/src/modules/crm/clientes/presentation/`.
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Uses `useClientes()` for server state, `useState<string>` for the search input, `useDebouncedValue` for the filter trigger.
    - Renders (inside a `flex flex-col h-full` container):
      1. Header with siesa-ui-kit `Input` (search) — `placeholder="Buscar por nombre o NIT..."`, `aria-label="Buscar clientes"`, plus a "Nuevo cliente" siesa-ui-kit `Button` (disabled with `title="Disponible en Story 2.3"` — do NOT wire the action yet).
      2. List body — conditional rendering:
         - `isLoading` → 6 `Skeleton` items (`react-loading-skeleton` — already installed by 1.1/1.2 chain).
         - `isError` → `<ErrorPanel title="No se pudo cargar la lista de clientes" subtitle="Comprueba tu conexión e intenta nuevamente." onRetry={refetch} isRetrying={isFetching} />`.
         - Data available AND `filtered.length === 0` AND `debouncedSearch === ''` → `<EmptyState variant="no-clients" />`.
         - Data available AND `filtered.length === 0` AND `debouncedSearch !== ''` → `<EmptyState variant="search-empty" />`.
         - Data available AND `filtered.length > 0` → `<ul role="list">` of `ClienteListItem` — one per client.
    - Filter logic (client-side):
      ```typescript
      const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      const filtered = useMemo(() => {
        if (!debouncedSearch) return data ?? []
        const q = norm(debouncedSearch)
        return (data ?? []).filter(c => norm(c.nombre).includes(q) || norm(c.nit).includes(q))
      }, [data, debouncedSearch])
      ```
      This handles case-insensitive AND accent-insensitive matching (AC #2). The `useMemo` recomputes only when `data` or `debouncedSearch` change.
    - Selection state:
      - Derive `selectedId` from the current route: `useParams({ strict: false })?.clienteId` (TanStack Router). Deep linking to `/clientes/:clienteId` correctly marks that row.
      - `onSelect(id)` → `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })`.
    - Wrapper `<aside role="complementary" aria-label="Lista de clientes" className="w-[280px] flex-shrink-0 border-r border-slate-200 flex flex-col h-full overflow-hidden">` — the `w-[280px]` and `flex-shrink-0` classes are the hard spec from AC #1.
  - [x] Update `frontend/src/routes/clientes.tsx` to render the split-panel:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

    export const Route = createFileRoute('/clientes')({
      component: ClientesRoute,
    })

    function ClientesRoute() {
      return (
        <div data-testid="clientes-view" className="flex h-full min-h-0">
          <ClienteListView />
          <section aria-label="Detalle del cliente" className="flex-1 p-6">
            {/* Story 2.2 fills the right panel — Story 2.1 leaves it intentionally empty. */}
          </section>
        </div>
      )
    }
    ```
    Keep the `data-testid="clientes-view"` so `1-2-frontend-navigation-shell` tests remain green.
  - [x] Verify the placeholder `<h1>Clientes</h1>` from Story 1.2 no longer renders — the deep-link test in 1.2 asserted `data-testid="clientes-view"`, not the `<h1>`, so removing the heading is safe.

- [x] Task 11 — Frontend tests: unit, component, and (light) integration (AC: #1–#7, #11)
  - [x] `frontend/src/modules/crm/clientes/application/useClientes.test.ts` — MSW handler for `GET /api/v1/clientes` returning a 3-item fixture. Assert `useClientes()` returns `data.length === 3` after `waitFor`; second call returns cached data with 0 additional MSW hits within `staleTime`.
  - [x] `frontend/src/modules/crm/clientes/application/useDebouncedValue.test.ts` — `renderHook` + `vi.useFakeTimers`; assert value updates only after 150 ms.
  - [x] `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.test.ts` — MSW handler returns a well-formed array; assert `getAll()` resolves to the same array; assert URL is `/api/v1/clientes`.
  - [x] `frontend/src/shared/components/EmptyState.test.tsx` — for each of `search-empty` and `no-clients`, assert Spanish title/subtitle rendered, `role="status"`, `aria-live="polite"`.
  - [x] `frontend/src/shared/components/ErrorPanel.test.tsx` — assert `role="alert"`, title/subtitle rendered, button says `"Reintentar"`, clicking it calls `onRetry`, `isRetrying=true` disables the button and shows the spinner.
  - [x] `frontend/src/shared/components/ClienteListItem.test.tsx` — assert `nombre` + `NIT: {nit}` visible, `aria-label` matches, clicking calls `onSelect(cliente.id)`, `selected=true` sets `data-selected="true"` (test hook, not colours).
  - [x] `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`:
    - Test 1 — happy path: MSW returns 3 clients → the list renders 3 `ClienteListItem`s.
    - Test 2 — search filters by nombre: type `"aco"` → only "Acosta" survives.
    - Test 3 — search filters by NIT/RUC: type NIT digits → only the matching client survives.
    - Test 4 — accent-insensitive: fixture has `"Peña"`, search `"pen"` matches.
    - Test 5 — search-empty state: MSW returns 2 clients; type gibberish → `EmptyState search-empty` visible.
    - Test 6 — no-clients state: MSW returns `[]` → `EmptyState no-clients` visible.
    - Test 7 — error state: MSW returns 500 → `ErrorPanel` visible; clicking `Reintentar` calls `refetch` (MSW handler count increments).
    - Test 8 — loading skeletons: initial render (before MSW resolves) → 6 skeleton items visible; use `getAllByTestId('cliente-skeleton')` — add `data-testid="cliente-skeleton"` on the skeleton items.
    - Test 9 — MSW handler call count === 1 across N keystrokes (assert client-side filtering does not fire additional requests).
    - Test 10 — click `ClienteListItem` calls `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })` — assert via a spied `navigate` on `useNavigate()` OR a `MemoryHistory` inspection.
    - Test 11 — 280 px width and `flex-shrink-0` on the aside wrapper (assert via `toHaveClass('w-[280px]', 'flex-shrink-0')`).
    - Test 12 — search input has `placeholder="Buscar por nombre o NIT..."` and `aria-label="Buscar clientes"`.
  - [x] Update snapshot in `frontend/src/routes/routing.edge.test.tsx` if the `/clientes` route render is asserted — do NOT modify tests to accommodate broken behaviour; if a test breaks because it asserted the old placeholder `<h1>Clientes</h1>`, replace that assertion with a check for `data-testid="clientes-view"` (still emitted).
  - [x] Coverage target: `> 80%` on new files under `modules/crm/clientes/**` and `shared/components/EmptyState.tsx|ErrorPanel.tsx|ClienteListItem.tsx`. Run `pnpm test -- --coverage` locally before marking Task 12 done.

- [x] Task 12 — Verification, wrap-up, & scope sanity (AC: #10, #11)
  - [x] `dotnet build backend/SiesaAgents.sln` → 0 errors / 0 new warnings.
  - [x] `dotnet test backend/SiesaAgents.sln` → all tests pass (Story 1.x + new 2.1 tests).
  - [x] From `backend/`, run `dotnet ef migrations list --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` — expect exactly two entries: `InitialCreate` + `AddClientesTable`.
  - [x] `pnpm --dir frontend typecheck` → 0 errors.
  - [x] `pnpm --dir frontend test` → all tests pass (12+ new + previously-green suite).
  - [x] `pnpm --dir frontend build` → succeeds; check CSS gzip did not regress > +5 KB versus Story 1.2 baseline (670.16 KB).
  - [x] Do NOT run `dotnet ef database update` in CI. Manual step: developer with local PostgreSQL runs `dotnet ef database update` and confirms `psql -d siesa_agents_db -c '\dt'` shows `__ef_migrations_history` + `clientes`.
  - [x] Confirm the sprint-status update to `ready-for-dev` is handled by this workflow's step-06 — do NOT edit `sprint-status.yaml` inside `dev-story`.

## Dev Notes

### Architecture Pattern (Clean Architecture — all four layers, both sides)

Story 2.1 is the first "vertical" story of Epic 2 and touches every layer:

- **Backend Domain**: `ClienteEntity` + `IClienteRepository`.
- **Backend Application**: `GetClientesQuery` + `GetClientesQueryHandler` + `ClienteDto`.
- **Backend Infrastructure**: `ClienteConfiguration`, `ClienteRepository`, `AppDbContext.Clientes` DbSet, `AddClientesTable` migration.
- **Backend API**: `ClienteEndpoints.MapClienteEndpoints()` — `GET /api/v1/clientes` only.
- **Frontend Domain**: `Cliente` interface + `IClienteRepository`.
- **Frontend Application**: `useClientes()` hook + `useDebouncedValue()` utility.
- **Frontend Infrastructure**: `clienteApiRepository`.
- **Frontend Presentation**: `ClienteListView`, `ClienteListItem`, `EmptyState`, `ErrorPanel`.

**Explicit non-scope for this story:**

- No `POST/PUT/DELETE` endpoints (Stories 2.3–2.5).
- No client detail right-panel content — placeholder `<section>` only (Story 2.2).
- No `SortControl` (Story 2.6 — Story 2.1 uses the default `createdAt DESC` order).
- No `ContactoEntity`, no `contactos` table, no cascade FK (Epic 3 + Story 2.5).
- No `ContactManager` on the detail panel (Story 4.1 or later).
- No FluentValidation validators for POST/PUT (Story 2.3+).
- No Zod schema for the create/edit form (Story 2.3+).
- No `Nuevo cliente` action wiring — button rendered but disabled.
- No pagination — architecture explicitly loads all 500 records client-side per NFR10.
- No server-side search endpoint (`?q=` is expressly NOT added).
- No auth headers on `apiClient` — MVP has no auth.

### Tech Stack & Libraries (mandatory versions per company standards)

- **Backend**: .NET 10 · C# Minimal API · EF Core 10 · Npgsql 10.0.2 · `EFCore.NamingConventions 10.0.0-rc.2` · xUnit · `Microsoft.AspNetCore.Mvc.Testing` (all already installed by Stories 1.1/1.3).
- **Frontend**: React 19 · TypeScript 5+ strict (`~6.0.2` per current lockfile — no `any`) · TanStack Router 1.170+ · TanStack Query 5.101+ · Axios 1.18+ · `@heroicons/react` 2.2+ · `react-loading-skeleton` 3.5+ · siesa-ui-kit 1.0.256+ · Tailwind v4 (already wired).
- **Package manager**: `pnpm` (STRICT — never `npm install`, never `yarn`). Running `npm install` corrupts the lockfile — same warning surfaced in Story 1.2.
- **Do NOT add**: MediatR (not used — direct handlers), FluentAssertions (raw xUnit only), date-fns (not needed for 2.1 — dates stay as ISO strings), lodash (native ES only).

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 — already installed at `^1.0.256`).
- **Install (if missing)**: `pnpm add siesa-ui-kit@latest`. Do NOT `npm install`.
- **Usage**: You MUST use `siesa-ui-kit` components for `Input` (search) and `Button` (Nuevo cliente, Reintentar, EmptyState CTA).
- **Constraint**: Do NOT create a custom search input, button, or dialog if a kit equivalent exists. Verify the exported symbols in `frontend/node_modules/siesa-ui-kit/dist/index.d.ts` before writing custom.
- **`ClienteListItem` and `EmptyState` and `ErrorPanel`** are documented custom components per the UX spec (composition of primitives) — creating them is the correct call, NOT a violation of the "use the kit" rule.
- **Icons**: Heroicons `MagnifyingGlassIcon`, `UsersIcon`, `UserGroupIcon`, `ExclamationTriangleIcon`, `ArrowPathIcon` — all already reachable via `@heroicons/react/24/outline`.
- **Spanish text mandatory** for every visible string, `aria-label`, `placeholder`, toast, error message. Code (variables, functions, types) stays English.

### MasterCrud enforcement — INTENTIONALLY DEFERRED

`MasterCrud` from siesa-ui-kit is the highest-level CRUD orchestrator in the kit and the company standard requires applying its API contract "whenever the story involves a CRUD screen, data grid, or form-based UI".

**Story 2.1 explicitly does NOT use `MasterCrud`** for the following documented reasons:

1. The UX spec pinned "Direction F — LayoutBase + Lista/Detalle + ContactManager (siesa-ui-kit nativo)" as the chosen shell. It is a **split-panel list + detail**, NOT a paginated table + modal form flow, which is `MasterCrud`'s form-factor.
2. The architecture doc (line 480–498) prescribes `ClienteListView.tsx` + `ClienteDetailView.tsx` + `ClienteForm.tsx` as three separate components, and instances `ContactManager` (not `MasterCrud`) in the detail view.
3. Search is client-side over `TanStack Query` cache (< 50ms, ≤ 500 records — NFR1) — `MasterCrud` is server-paginated (`params.page/limit/search`), which conflicts with the ≤ 500 records + client-side filter architecture decision.
4. Story 2.6 explicitly requires client-side sort over the same cache (`no additional API call`), which `MasterCrud` also cannot do without adapter modification.
5. `MasterCrud` would collapse the split-panel layout into a table + modal form flow — a visible UX change from the approved Direction F.

**Trace-forward**: If a future epic adds a "Configuration" screen that IS a standard CRUD (dictionary tables, multi-company aware), `MasterCrud` becomes the correct choice. For Epic 2 clients, the composition of `Input` + custom `ClienteListItem` + kit `Button` is the architectural intent.

This deviation is authorised by the architecture doc; add it to the Change Log if `sa-code-review` re-flags it.

### Backend Critical Rules (per company standards)

- **UUID PK**: `Guid Id` — mandatory. Use `Guid.NewGuid()` in the entity factory (or defer to Postgres `uuidv7()` via `HasDefaultValueSql("uuidv7()")` if the DB extension is available — Story 2.1 uses `Guid.NewGuid()` server-side to keep the ID assignment predictable in tests).
- **`DateTimeOffset` only** — never `DateTime`. Enforced by the entity.
- **snake_case naming**: automatic via `UseSnakeCaseNamingConvention()` (Story 1.3). Do NOT add `[Column]` / `[Table]` attributes. Explicit `.HasDatabaseName("uk_clientes_nit")` is fine.
- **Scalar** for API docs — already configured in `Program.cs`. `MapClienteEndpoints()` calls `.WithTags("Clientes")` so the group appears grouped in the Scalar UI.
- **Problem Details RFC 7807** — inherited from Story 1.3's `ExceptionHandlingMiddleware`. Nothing in Story 2.1 raises unhandled exceptions on purpose; the middleware simply covers the accidental case.
- **No FluentValidation validators in this story** — Story 2.3 introduces the first validator (`CreateClienteRequestValidator`). Leaving the FV configuration untouched here is intentional.
- **Migration name**: `AddClientesTable` — matches architecture doc's future-naming example.

### Frontend Critical Rules (per company standards)

- **Zustand: NOT USED in Story 2.1**. Search input is `useState` (local). URL is source of truth for the selected client. Query cache is TanStack Query. Zustand only enters the codebase when cross-route ephemeral state exists (probably never in the MVP per architecture line 640: "Sin store Zustand necesario en MVP").
- **TanStack Query keys** — canonical `['clientes']` (list). Story 2.2 will introduce `['clientes', id]`; do NOT introduce it here.
- **Optimistic UI** — not applicable to a `GET` list. Story 2.3 introduces the first `useMutation` with `onSuccess: invalidateQueries(['clientes'])` pattern.
- **`Suspense` boundaries**: not required — `useQuery` returns `isLoading`, which we branch on manually. Adding `<Suspense>` here would preclude the AC #6 skeleton assertion.
- **All user-facing text in Spanish**. Every `title`, `aria-label`, `placeholder` in this story is Spanish. Code (variable names, functions, types, JSX prop names) is English.

### `ClienteListView` skeleton (illustrative)

```tsx
// frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import { Input, Button } from 'siesa-ui-kit'
import { useClientes } from '../application/useClientes'
import { useDebouncedValue } from '../application/useDebouncedValue'
import { ClienteListItem } from '@/shared/components/ClienteListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function ClienteListView() {
  const { data, isLoading, isError, isFetching, refetch } = useClientes()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 150)
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { clienteId?: string }
  const selectedId = params.clienteId ?? null

  const filtered = useMemo(() => {
    const list = data ?? []
    if (!debouncedSearch) return list
    const q = norm(debouncedSearch)
    return list.filter(c => norm(c.nombre).includes(q) || norm(c.nit).includes(q))
  }, [data, debouncedSearch])

  return (
    <aside
      role="complementary"
      aria-label="Lista de clientes"
      className="w-[280px] flex-shrink-0 border-r border-slate-200 flex flex-col h-full overflow-hidden"
    >
      <header className="p-3 border-b border-slate-200 space-y-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o NIT..."
          aria-label="Buscar clientes"
        />
        <Button variant="primary" disabled title="Disponible en Story 2.3" className="w-full">
          Nuevo cliente
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <ul className="p-3 space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} data-testid="cliente-skeleton">
                <Skeleton height={44} />
              </li>
            ))}
          </ul>
        )}

        {isError && (
          <ErrorPanel
            title="No se pudo cargar la lista de clientes"
            subtitle="Comprueba tu conexión e intenta nuevamente."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        )}

        {!isLoading && !isError && filtered.length === 0 && debouncedSearch === '' && (
          <EmptyState variant="no-clients" />
        )}

        {!isLoading && !isError && filtered.length === 0 && debouncedSearch !== '' && (
          <EmptyState variant="search-empty" />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <ul role="list" className="divide-y divide-slate-100">
            {filtered.map(c => (
              <li key={c.id}>
                <ClienteListItem
                  cliente={c}
                  selected={c.id === selectedId}
                  onSelect={(id) =>
                    void navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
```

Note: `siesa-ui-kit`'s `Input` and `Button` props may differ slightly from the above — reconcile against `frontend/node_modules/siesa-ui-kit/dist/**/*.d.ts` before finalising. Do NOT re-export or wrap them.

### `ClienteEndpoints` + `Program.cs` additions (illustrative)

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)))
             .WithName("GetClientes")
             .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

        return routes;
    }
}
```

```csharp
// backend/src/SiesaAgents.API/Program.cs — add near the DI section
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();

// … existing code …

app.UseCors(CorsPolicyName);
app.MapClienteEndpoints();  // NEW — after UseCors, before app.Run()
```

### Migration commands (must be run from `backend/`)

```bash
dotnet ef migrations add AddClientesTable \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Migrations

# Manual — on a dev machine with PostgreSQL 18+ running locally:
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Testing Standards

**Backend:**

- Framework: xUnit + `Microsoft.AspNetCore.Mvc.Testing` (already installed).
- Raw `Assert.*` — DO NOT introduce `FluentAssertions`.
- Fake repository pattern (hand-rolled class implementing `IClienteRepository`) is preferred over mocking libraries; only reach for `NSubstitute` if a test genuinely needs behaviour verification (`Received.InOrder`) — not the case in Story 2.1.
- Endpoint tests use `WebApplicationFactory<Program>` with `.UseEnvironment("Testing")` (matches Story 1.3 pattern). Override `IClienteRepository` to a `FakeClienteRepository` to avoid a live DB.
- Coverage target: `> 80%` on new backend files.

**Frontend:**

- Framework: Vitest + `@testing-library/react` + `@testing-library/jest-dom` + MSW (all installed).
- Use `renderWithProviders` (create it if not present) that wires `QueryClientProvider` + `RouterProvider` (`createMemoryHistory` + `createRouter`) around the tested component. If Story 1.2 already introduced such a helper (verify), reuse it — do NOT duplicate.
- MSW: define handlers per test with `server.use(http.get('/api/v1/clientes', ...))`. The MSW server should be set up in `frontend/src/test-setup.ts` once (verify — Story 1.2 may not have added it; if absent, add it now with `beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close());`).
- Assertions on ARIA + Spanish text: prefer `getByRole('button', { name: /reintentar/i })` over `getByText`; that shape catches both semantic role and localised label at once.
- `matchMedia` is polyfilled from Story 1.2 — no re-mock needed.
- Coverage target: `> 80%` on new frontend files.

**Location:**

- Backend: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/*Tests.cs`, `backend/tests/SiesaAgents.UnitTests/Infrastructure/*Tests.cs`, `backend/tests/SiesaAgents.UnitTests/Api/*Tests.cs`.
- Frontend: colocated `*.test.ts(x)` next to the source file. Component tests next to the component, hook tests next to the hook.

### File Structure (paths this story creates or edits)

```
backend/
  src/
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs                              # NEW
      Program.cs                                         # EDIT — DI + MapClienteEndpoints()
    SiesaAgents.Application/
      Clientes/
        Queries/
          GetClientesQuery.cs                            # NEW
          GetClientesQueryHandler.cs                     # NEW
        DTOs/
          ClienteDto.cs                                  # NEW
    SiesaAgents.Domain/
      Clientes/
        Entities/
          ClienteEntity.cs                               # NEW
        Interfaces/
          IClienteRepository.cs                          # NEW
    SiesaAgents.Infrastructure/
      Data/
        AppDbContext.cs                                  # EDIT — DbSet<Cliente> + ApplyConfigurationsFromAssembly
        Configurations/
          ClienteConfiguration.cs                        # NEW
      Migrations/
        <timestamp>_AddClientesTable.cs                  # NEW (auto-generated)
        <timestamp>_AddClientesTable.Designer.cs         # NEW (auto-generated)
        AppDbContextModelSnapshot.cs                     # EDIT (auto-regenerated)
      Repositories/
        ClienteRepository.cs                             # NEW
  tests/
    SiesaAgents.UnitTests/
      Api/
        ClienteEndpointsTests.cs                         # NEW
      Application/
        Clientes/
          GetClientesQueryHandlerTests.cs                # NEW
      Infrastructure/
        ClienteConfigurationTests.cs                     # NEW

frontend/
  .env.development                                       # EDIT (or create) — VITE_API_URL
  src/
    routes/
      clientes.tsx                                       # EDIT — render split-panel with ClienteListView
    modules/
      crm/
        clientes/                                        # NEW module tree
          domain/
            Cliente.ts                                   # NEW
            IClienteRepository.ts                        # NEW
          application/
            useClientes.ts                               # NEW
            useClientes.test.ts                          # NEW
            useDebouncedValue.ts                         # NEW
            useDebouncedValue.test.ts                    # NEW
          infrastructure/
            clienteApiRepository.ts                      # NEW
            clienteApiRepository.test.ts                 # NEW
          presentation/
            ClienteListView.tsx                          # NEW
            ClienteListView.test.tsx                     # NEW
    shared/
      components/
        EmptyState.tsx                                   # NEW
        EmptyState.test.tsx                              # NEW
        ErrorPanel.tsx                                   # NEW
        ErrorPanel.test.tsx                              # NEW
        ClienteListItem.tsx                              # NEW
        ClienteListItem.test.tsx                         # NEW
```

### Project Structure Notes

- Aligns with the architecture doc's target frontend tree (lines 451-505) and backend tree (lines 507-598). Everything Story 2.1 creates matches a path the architecture explicitly names — no invented directories.
- **Alias `@/`**: If Vite is not already configured to resolve `@/` to `src/`, add it to `vite.config.ts` and `tsconfig.json`. Story 1.1/1.2 tests import via `@/` in review-log examples, so it should already be present — verify with `grep -R "@/" frontend/src | head -5`.
- **Deviation**: The architecture doc places `ClientListItem` under `frontend/src/shared/components/` (line 501). This story keeps that placement even though the component is domain-specific to `Cliente`. Rationale: FR21 (Story 4.1) may re-use it inside `ContactManager`'s context. If in later stories it becomes obvious that no other module needs it, moving to `modules/crm/clientes/presentation/` is a mechanical refactor.
- **Deviation**: The architecture doc names the front-end folder `frontend/src/modules/crm/{clientes|contactos}/` (line 462). The company standards `README` uses `{module}/{domain}/{feature}` — those are compatible: `crm` = module, `clientes` = domain. Story 2.1 uses this two-level nesting; no `{feature}` folder is introduced since the "list" is not a separate feature from "clientes" as a domain.

### Contextual Intelligence

**Previous Story Learnings (1.1 + 1.2 + 1.3):**

- Story 1.1 established backend scaffolding, CORS, ProblemDetails, Scalar, and `public partial class Program;` for test factories — reuse everything.
- Story 1.1 suppressed `NU1903` on the API csproj — DO NOT remove.
- Story 1.2 established frontend scaffolding, TanStack Router file-based routes, `siesa-ui-kit` shell, deep-link tests, and a `matchMedia` polyfill in `test-setup.ts`. Route file `clientes.tsx` is a stub — this story replaces its body.
- Story 1.2's `deepLink.test.tsx` asserts `data-testid="clientes-view"` — Story 2.1 MUST preserve that attribute on the top-level `<div>` inside the route component.
- Story 1.2 review flagged the CSS gzip baseline is 670 KB (`siesa-ui-kit/styles.css` is imported wholesale). Story 2.1 must NOT add a second wholesale import; import only the components you use.
- Story 1.3 introduced `AppDbContext` empty with `UseSnakeCaseNamingConvention()` at DI-level. The `OnModelCreating` placeholder for `ApplyConfigurationsFromAssembly(...)` is the exact anchor this story fills.
- Story 1.3's `EFCore.NamingConventions 10.0.0-rc.2` is still an RC — no action required, but flag in Change Log if the migration behaves oddly.
- Story 1.3's `appsettings.Testing.json` uses a fake connection string. Story 2.1's endpoint tests should override `IClienteRepository` (not the DbContext), so the fake connection string remains harmless.
- Package manager is `pnpm` — never `npm install`. `dotnet-ef` is a global tool — not in project files.
- Story 1.2 review flagged an active/prefix bug in `useActiveNav.ts` (`/clientes` vs `/clientesX`). Story 2.1's route uses `/clientes/:clienteId`; the fix in 1.2 already handles nested URLs correctly (`pathname.startsWith('/clientes/')`).

**Git History Context:**

Recent commits (`git log --oneline -5`) confirm Epic 1 is done: 1.1 initialized the project, 1.2 wired the shell, 1.3 configured the database foundation. No branches exist for 2.1 yet. Follow the convention:
- Commit messages in English past tense: `feat(story-2.1): add cliente list view and search`.
- File-per-purpose, small commits per task.
- Spanish user-facing text, English code — same convention as 1.1/1.2/1.3.

**Latest Tech Info:**

- `@tanstack/react-query@5.101.2` — `useQuery({ queryKey, queryFn, staleTime })` API stable; `signal` in `queryFn` context supports request cancellation on unmount — use it. `refetch()` returns a promise; do NOT `await` in a click handler (use `void refetch()` per Story 1.2 style).
- `@tanstack/react-router@1.170.17` — `useParams({ strict: false })` returns partial params (untyped-safe); `useNavigate()` returns a function that returns a Promise. `router.navigate({ to: '/clientes/$clienteId', params })` is the typed nav — the route file `clientes.$clienteId.tsx` does NOT need to exist yet for Story 2.1 to compile (TanStack Router treats unknown route paths as type-only strings — but if strict types fail, add a temporary `/clientes/$clienteId` route in Story 2.2). If typecheck fails on the navigate call in 2.1, add a minimal `frontend/src/routes/clientes.$clienteId.tsx` placeholder (returns empty section) as part of THIS story to unblock — mark it as "Story 2.2 will populate".
- `siesa-ui-kit@^1.0.256` — verified in Story 1.2 to export `LayoutBase`, `Navbar`, `NavigationRail*`, `NavigationBar`, `Input`, `Button`. Story 2.1 uses `Input` + `Button` — confirm the `Input` prop for controlled value/onChange matches typical React signature by inspecting `frontend/node_modules/siesa-ui-kit/dist/components/Input/Input.types.d.ts` before writing the JSX.
- `@heroicons/react@^2.2.0` — installed by Story 1.2 for `UsersIcon`, `IdentificationIcon`. Add `MagnifyingGlassIcon`, `UserGroupIcon`, `ExclamationTriangleIcon`, `ArrowPathIcon` — same package, no new dependency.
- `react-loading-skeleton@^3.5.0` — installed via architecture starter (verify). Default styling matches shadcn/slate palette.
- `msw@^2.15.0` — installed. Handlers use `http.get('/api/v1/clientes', () => HttpResponse.json([...], { status: 200 }))`.
- PostgreSQL `uuidv7()` extension is NOT installed by Story 1.3. Do NOT `HasDefaultValueSql("uuidv7()")` in `ClienteConfiguration` — server-side `Guid.NewGuid()` in the entity factory is sufficient and portable.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture — folder structure with `ClienteListView`/`ClienteDetailView`: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — REST endpoints (`GET /api/v1/clientes`): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — TanStack Query keys canonical `['clientes']`: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — search strategy (client-side filter over `useMemo`, ≤ 500 records): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] and [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Diagram]
- Architecture — Requirements-to-structure (FR1, FR2, NFR1): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- UX Spec — Direction F split-panel + 280 px client list panel: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Direction F — LayoutBase + Lista/Detalle + ContactManager (siesa-ui-kit nativo)]
- UX Spec — `ClientListItem` states (default/hover/selected/skeleton): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ClientListItem]
- UX Spec — `EmptyState` variants `search-empty` / `no-clients`: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EmptyState]
- UX Spec — Search patterns (150 ms debounce, real-time filter, "Buscar por nombre o NIT..."): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Búsqueda de clientes]
- UX Spec — Skeleton screens instead of spinners: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty States & Loading States] and [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- Test design Epic 2 (P0 R-011 invalidation, P1 R-003 search perf, P0 R-001 error exposure): [Source: _bmad-output/test-design-epic-2.md#P0 (Critical)]
- Company standards — Frontend/Backend stack, Clean Architecture + DDD layers, snake_case, UUID PK, `DateTimeOffset`, Spanish UI text: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — MasterCrud reference (documented deferral rationale above): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Previous story 1.2 (route shell + `data-testid="clientes-view"` contract): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]
- Previous story 1.3 (`AppDbContext` scaffold, `ApplyConfigurationsFromAssembly` marker, `Testing` env pattern): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Opus 4.7) — via sa-quick-dev orchestrator, dev-story workflow.

### Debug Log References

- Backend: `dotnet build backend/SiesaAgents.sln` → 0 errors / 0 warnings (NU1903 suppression preserved).
- Backend tests: `dotnet test backend/SiesaAgents.sln` → 63/63 passed (Story 1.x baseline + 15 new tests from Story 2.1).
- Frontend typecheck: `pnpm --dir frontend typecheck` → 0 errors.
- Frontend build: `pnpm --dir frontend build` → succeeded; CSS gzip 665.9 KB (vs. 670 KB baseline — no regression).
- Frontend tests: `pnpm --dir frontend test` → 134/134 passed across 25 test files.
- Migration generated: `dotnet ef migrations add AddClientesTable` → `20260708093854_AddClientesTable.cs` with `clientes` table, snake_case columns, unique index `uk_clientes_nit`.

### Completion Notes List

**Scope followed exactly:** only `GET /api/v1/clientes` on the backend; only the list panel + placeholder detail on the frontend. No POST/PUT/DELETE, no `contactos`, no `SortControl`, no validators, no Zustand.

**Deviations from the story task list (all inside the story's authorised envelope):**
1. Added `frontend/src/routes/clientes.$clienteId.tsx` placeholder route — the Dev Notes explicitly allow this (see "Latest Tech Info → `router.navigate({ to: '/clientes/$clienteId', ...})`"). Story 2.2 will populate it.
2. Converted `clientes.tsx` into a layout route rendering `<Outlet />` in the right panel so deep-linking to `/clientes/$clienteId` renders the list alongside a (currently empty) detail — required for AC #7 "the clicked item becomes visually `selected`".
3. Updated Story 1.3 tests (`AppDbContextTests`, `AppDbContextExpandedTests`, `MigrationTests`, `MigrationExpandedTests`) that codified pre-2.1 scope invariants ("zero DbSet<>", "single migration", "zero user entities") — replaced with post-2.1 equivalents that still guard the underlying intent (deterministic model, InitialCreate untouched, no accidental duplicates). This matches the story's own guidance under Task 11.
4. Updated Story 1.2 routing tests (`deepLink.test.tsx`, `routing.edge.test.tsx`, `index.test.tsx`) to wrap the router in a `QueryClientProvider` — required because `/clientes` now consumes `useClientes()`. Wrapping mirrors production (`main.tsx`) — not a scope creep.
5. Added `using Microsoft.AspNetCore.Hosting;` to the ATDD-generated `ClienteEndpointsTests.cs` so `UseEnvironment("Testing")` compiles — this was a missing import in the RED-phase file.
6. `ClienteListItem` uses raw hex `#0e79fd`/`#e6f0ff` for the selected border/background — the primary tokens are not exposed as Tailwind classes at project level (they live inside siesa-ui-kit's own CSS). Documented deviation matching the story's Task 9 note. Tests assert `data-selected="true"`, not colour values.

**Feature-specific shared artifacts:** no `_bmad-output/shared-artifacts/epic-02-*` folder exists; proceeded with the workflow-ext step-3 fallback.

### File List

**Backend — new files:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260708093854_AddClientesTable.cs` (+ Designer.cs)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`

**Backend — modified files:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (added `DbSet<ClienteEntity>` + `ApplyConfigurationsFromAssembly`)
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs` (auto-regenerated)
- `backend/src/SiesaAgents.API/Program.cs` (DI registration + `MapClienteEndpoints`)
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs` (added `using Microsoft.AspNetCore.Hosting;`)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` (updated scope assertions post-2.1)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextExpandedTests.cs` (updated scope assertions post-2.1)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationTests.cs` (updated scope assertions post-2.1)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationExpandedTests.cs` (updated scope assertions post-2.1)

**Frontend — new files:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/useDebouncedValue.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClienteListItem.tsx`
- `frontend/src/routes/clientes.$clienteId.tsx` (placeholder — Story 2.2 will populate)

**Frontend — modified files:**
- `frontend/src/routes/clientes.tsx` (split-panel with `<ClienteListView />` and `<Outlet />` in right panel)
- `frontend/src/routes/deepLink.test.tsx` (wrap in `QueryClientProvider` — /clientes now consumes useClientes)
- `frontend/src/routes/routing.edge.test.tsx` (wrap in `QueryClientProvider` + adjust one edge-case URL for the new `/clientes/$clienteId` route)
- `frontend/src/routes/index.test.tsx` (wrap in `QueryClientProvider`)
- `frontend/src/routeTree.gen.ts` (auto-regenerated to include `/clientes/$clienteId`)
