# Story 2.1: Client List & Search

Status: ready-for-review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for without leaving the `/clientes` view.

## Acceptance Criteria

1. **AC-2.1.a — Split-panel layout (280 px left list)**
   **Given** there are clients in the system
   **When** the user navigates to `/clientes` on a viewport ≥ `lg` (1024 px)
   **Then** the route renders a split-panel layout where the **left panel is exactly 280 px wide** (`w-[280px]` Tailwind class, `flex-shrink-0`, full-height, `overflow-y-auto`) and contains:
   - A page title `Clientes` (`h1`, `text-2xl font-bold text-slate-900`).
   - A search `Input` (siesa-ui-kit) with placeholder `Buscar cliente por nombre o NIT/RUC...` and `aria-label="Buscar cliente"`.
   - A scrollable list (`role="list"`) rendering one item per client with **Nombre** (primary line, `text-sm font-semibold text-slate-900`) and **NIT/RUC** (secondary line, `text-xs text-slate-500`) visible at a glance.
   - Each list item is a `<button role="listitem"> | <li role="option">` with `min-height: 56px` (≥ 44 px WCAG touch target) and `aria-label` `"{nombre} — NIT {nit}"`.
   - The right side of the route is a placeholder `<section data-testid="cliente-detail-placeholder">` reading `Selecciona un cliente para ver el detalle` — the actual detail view ships in Story 2.2.
   [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)` line 616 — `ClienteListView [280px, panel izquierdo]`]
   [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Direction F` lines 389–398]
   [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#3.2 P1` TC-E2-P1-01]

2. **AC-2.1.b — Real-time dual search filter (Nombre OR NIT/RUC) < 1 s @ 500 records (NFR1)**
   **Given** the client list is loaded with up to 500 records
   **When** the user types in the search input
   **Then** the list filters **in real time, on EVERY keystroke (no debounce delay > 50 ms)**, using a `useMemo`-cached pure function that returns clients whose `nombre.toLocaleLowerCase()` OR `nit.toLocaleLowerCase()` `.includes()` the trimmed lowercase query
   **And** the search is **case-insensitive and diacritic-insensitive** (`"José"` matches `"jose"`) via `.normalize('NFD').replace(/\p{Diacritic}/gu, '')` applied to both the query and the searchable fields
   **And** **NO additional network requests** are fired during typing (the entire dataset is preloaded once in the `['clientes']` TanStack Query cache — assertable via MSW request spy)
   **And** the filter renders the matching list with **p95 render commit < 200 ms** measured over 10 iterations at 500 records (NFR1: end-to-end keystroke-to-paint < 1 s)
   **And** the search input is rendered as **uncontrolled-from-URL local state** (`useState<string>('')`) — typing does NOT push history entries (no URL thrash).
   [Source: `_bmad-output/planning-artifacts/architecture.md#Search Strategy` line 233 + `#State Boundaries` lines 626–641]
   [Source: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md` — NFR1]
   [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` TC-E2-P0-06 + TC-E2-P1-02]

3. **AC-2.1.c — `EmptyState` when zero clients exist**
   **Given** there are no clients in the system (the `GET /api/v1/clientes` response is `[]`)
   **When** the user navigates to `/clientes`
   **Then** the left panel renders an `<EmptyState>` component (NEW shared component, file: `src/shared/components/EmptyState.tsx`) IN PLACE OF the list, displaying:
   - A `UsersIcon` from `@heroicons/react/24/outline` (24×24, `text-slate-300`).
   - A heading: `Aún no hay clientes` (`text-base font-semibold text-slate-700`).
   - A description: `Crea el primer cliente para empezar.` (`text-sm text-slate-500`).
   - A primary CTA `Button` from siesa-ui-kit labelled `Nuevo cliente` — wire it to `onClick: () => {}` (no-op in this story; the create form arrives in Story 2.3, which will replace the handler).
   - `role="status"` + `aria-live="polite"` on the EmptyState root so screen readers announce it.
   - The component MUST be the `<EmptyState />` named export from `src/shared/components/EmptyState.tsx`; the same component (with different copy props) will be reused in Story 3.1 for contactos — therefore it accepts these props: `icon: ReactNode`, `title: string`, `description?: string`, `ctaLabel?: string`, `onCtaClick?: () => void`, `data-testid?: string` (default `"empty-state"`).
   [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure` line 501 — `EmptyState.tsx`]
   [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Established patterns` line 266 — "Empty state with CTA (Google Contacts)"]
   [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` TC-E2-P1-03]

4. **AC-2.1.d — `ErrorPanel` with `Reintentar` on fetch failure**
   **Given** the backend returns a non-2xx response (`500`, `503`, network error) or the request times out
   **When** the user navigates to `/clientes` (initial fetch fails)
   **Then** the left panel renders an `<ErrorPanel>` component (NEW shared component, file: `src/shared/components/ErrorPanel.tsx`) IN PLACE OF the list, displaying:
   - An `ExclamationTriangleIcon` from `@heroicons/react/24/outline` (24×24, `text-red-500`).
   - A heading: `No se pudo cargar la lista de clientes` (`text-base font-semibold text-slate-900`).
   - A description: `Verifica tu conexión e intenta de nuevo.` (`text-sm text-slate-600`).
   - A `Button` from siesa-ui-kit labelled `Reintentar` that, when clicked, calls `refetch()` (the function returned by `useQuery`) and shows a loading state while in flight.
   - `role="alert"` + `aria-live="assertive"` on the ErrorPanel root.
   - The ErrorPanel **MUST NOT display `error.message` or any backend payload** (NFR6 — never expose stack traces or internal exception text). Even if the backend returns Problem Details with `detail`, the UI ignores it and shows only the canned Spanish copy above.
   - The component is reusable: props `title?: string`, `description?: string`, `onRetry: () => void | Promise<void>`, `isRetrying?: boolean`, `data-testid?: string` (default `"error-panel"`).
   [Source: `_bmad-output/planning-artifacts/architecture.md#Error handling — frontend` line 408]
   [Source: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md` — NFR6]
   [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` TC-E2-P1-04]

5. **AC-2.1.e — Backend `GET /api/v1/clientes` endpoint exists and returns `Cliente[]`**
   **Given** the API host is running and the `clientes` table exists
   **When** `GET /api/v1/clientes` is called
   **Then** the response is `200 OK`, `Content-Type: application/json`, body is a direct JSON array (NO wrapper object) where each element has the shape:
   ```json
   {
     "id": "uuid-v4-string",
     "nombre": "string",
     "nit": "string",
     "telefono": "string",
     "ciudad": "string",
     "createdAt": "ISO-8601-with-timezone",
     "updatedAt": "ISO-8601-with-timezone"
   }
   ```
   **And** keys are camelCase (.NET default `System.Text.Json` serializer with `JsonNamingPolicy.CamelCase`)
   **And** when the table is empty the response is `200 OK` with body `[]`
   **And** the route is registered via Minimal API in `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` and exposed by an extension method `app.MapClienteEndpoints()` invoked from `Program.cs` (no controllers).
   [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns` lines 247–254]
   [Source: `_bmad-output/planning-artifacts/architecture.md#JSON responses` lines 340–344]
   [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack` — Minimal API, NO controllers]

6. **AC-2.1.f — `Cliente` domain entity + EF Core mapping + initial migration applied**
   **Given** Story 1.3 created an empty `AppDbContext` with `ApplySnakeCaseNaming()`
   **When** Story 2.1 is built
   **Then** the following exist and `dotnet build backend/SiesaAgents.slnx` passes with 0 errors / 0 warnings:
   - `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — class `ClienteEntity` with `public Guid Id { get; private set; } = Guid.NewGuid()`, `public string Nombre { get; private set; }`, `public string Nit { get; private set; }`, `public string Telefono { get; private set; }`, `public string Ciudad { get; private set; }`, `public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow`, `public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow`. Private parameterless constructor (EF Core), public static factory `Create(string nombre, string nit, string telefono, string ciudad)` (used by future Story 2.3 — leave the factory in place; it is harmless for read-only queries here).
   - `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — `IEntityTypeConfiguration<ClienteEntity>` with `builder.ToTable("clientes")`, `builder.HasKey(c => c.Id)`, `builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`, `builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200)`, `builder.Property(c => c.Nit).IsRequired().HasMaxLength(50)`, `builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50)`, `builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100)`, `builder.Property(c => c.CreatedAt).IsRequired()`, `builder.Property(c => c.UpdatedAt).IsRequired()`.
   - `AppDbContext` now exposes `public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();` AND `OnModelCreating` calls `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);` BEFORE `modelBuilder.ApplySnakeCaseNaming();` (snake_case extension MUST remain LAST per Story 1.3 AC #4 — do not change the order).
   - A new migration `AddClientesTable` is generated via `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations` and produces snake_case `clientes` table with `id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at` columns and `uk_clientes_nit` unique index.
   - `IClienteRepository` interface in `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with at least `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)`.
   - `ClienteRepository` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository` using `AppDbContext.Clientes.AsNoTracking().ToListAsync(ct)`.
   - DI wiring in `Program.cs`: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>();`.
   [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture` lines 220–231]
   [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure` lines 562–584]
   [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules` — UUID PK, DateTimeOffset, private setters + factory]
   [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` TC-E2-P2-03]

7. **AC-2.1.g — TanStack Query hook + Axios repository wired to the canonical `['clientes']` queryKey**
   **Given** the backend endpoint from AC-2.1.e is available
   **When** the frontend renders `/clientes`
   **Then** the following files exist with the exact contracts below:
   - `src/modules/crm/clientes/domain/Cliente.ts` — `export interface Cliente { id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`.
   - `src/modules/crm/clientes/domain/IClienteRepository.ts` — `export interface IClienteRepository { getAll(signal?: AbortSignal): Promise<Cliente[]>; }`.
   - `src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — `export const clienteApiRepository: IClienteRepository` implementing `getAll` via `apiClient.get<Cliente[]>('/api/v1/clientes', { signal }).then(r => r.data)`.
   - `src/modules/crm/clientes/application/useClientes.ts` — `export function useClientes(): UseQueryResult<Cliente[], Error>` using `useQuery({ queryKey: ['clientes'], queryFn: ({ signal }) => clienteApiRepository.getAll(signal) })`. The exact queryKey string array `['clientes']` is non-negotiable per architecture line 277.
   - The `useClientes` hook is the ONLY caller of `clienteApiRepository.getAll` from presentation — never call the repository directly inside a component.
   [Source: `_bmad-output/planning-artifacts/architecture.md#TanStack Query keys` lines 277–283 + 398–406]
   [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure` — domain → application → infrastructure → presentation]

8. **AC-2.1.h — Component composition + presentation layer files**
   **Given** the hooks and shared components above
   **When** the route `/clientes` renders
   **Then** the following presentation files exist:
   - `src/modules/crm/clientes/presentation/ClienteListView.tsx` — receives `props: { searchQuery: string; onSearchChange: (q: string) => void; selectedClienteId: string | null; onSelectCliente: (id: string) => void; }`. Owns the call to `useClientes()` and decides which of three states to render: **loading** (Skeleton placeholders, 3 items), **error** (`<ErrorPanel onRetry={refetch} />`), **empty** (`<EmptyState ... />`) when `data?.length === 0`, **list** (the filtered scrollable list). The filtered list is computed via `useMemo` over `data`, `searchQuery`. Selected item gets `aria-current="true"` + `bg-primary-50 border-l-2 border-l-primary-600` (Siesa active treatment).
   - `src/modules/crm/clientes/presentation/ClientListItem.tsx` (per architecture line 502 — `src/shared/components/ClientListItem.tsx` placement is an alias; we ship the canonical file inside the module since it is clientes-specific) — pure function component, no data fetching, props `{ cliente: Cliente; isSelected: boolean; onClick: () => void; }`. Use `<button type="button">` for keyboard accessibility (Enter/Space). **NOTE on path:** architecture line 502 places this in `src/shared/components/`. Place it in `src/shared/components/ClientListItem.tsx` to match the architecture exactly — it is "shared" in the sense that any list of clients in the app can reuse it. Future Story 2.6 (Sort) will reuse it.
   - `src/routes/clientes.tsx` — replace the current `<ClientesPlaceholderView />` body with `<ClienteListView searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedClienteId={null} onSelectCliente={() => {}} />`. Selected state remains `null` and `onSelectCliente` is a no-op in this story (deep-linking ships in Story 2.2); declare `const [searchQuery, setSearchQuery] = useState('')` in the route component.
   - **DELETE** `src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` and `ClientesPlaceholderView.test.tsx` — they are superseded.

9. **AC-2.1.i — Accessibility (WCAG 2.1 AA) + responsive behavior**
   **Given** the new list view
   **When** an assistive-technology user navigates the page
   **Then** all interactive elements (search input, list items, EmptyState CTA, ErrorPanel `Reintentar`) are reachable via `Tab`, have visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none`), have Spanish `aria-label`s, and the list is announced as a list (`role="list"` on the container, `role="listitem"` on each `<button>` wrapper)
   **And** on viewports `< lg` (< 1024 px) the layout drops the right detail-placeholder column and renders the list panel full-width (`w-full lg:w-[280px]`) — the detail panel is hidden via `hidden lg:block` (the actual mobile UX of pushing to a detail screen ships in Story 2.2; for this story the route only ever renders the list on mobile, which is acceptable because there is no selection state yet).
   [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules` — WCAG 2.1 AA + Spanish text]
   [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Considerations` lines 668–679]

10. **AC-2.1.j — All required tests pass**
    **Given** the implementation above
    **When** `pnpm test` runs in `frontend/` AND `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"` runs in `backend/`
    **Then** the following NEW tests pass (all P0 + P1 from epic-2 test-design owned by Story 2.1):
    - **TC-E2-P0-06 — Search filter performance @ 500 records (NFR1):** Vitest + RTL + MSW. Seed `useClientes` query cache with 500 deterministic faker clients (`faker.seed(20260601)`); render `ClienteListView`; type `"ACM"` into the search input; assert filtered count matches a pre-computed expected length AND `performance.now()` delta around the render commit is `< 200 ms` (p95 across 10 iterations); assert MSW spy saw `0` requests during typing.
    - **TC-E2-P1-01 — 280 px panel + Nombre + NIT visible:** Vitest + RTL. Render `ClienteListView` with 3 fixtures; assert the panel root has class `w-[280px]`; assert each item shows the fixture's `nombre` and `nit`.
    - **TC-E2-P1-02 — Dual search (Nombre OR NIT):** Vitest + RTL. Fixtures: `[{ nombre: "Acme S.A.", nit: "900123456-1" }, { nombre: "Beta Corp", nit: "800000000-2" }]`. Type `"ACM"` → expect only Acme rendered. Clear, type `"900"` → expect only Acme rendered (NIT match). Type `"jose"` against `{ nombre: "José Pérez" }` → expect José matched (diacritic-insensitive).
    - **TC-E2-P1-03 — EmptyState when empty:** Vitest + RTL + MSW returning `[]`. Render route; assert `data-testid="empty-state"` is present; assert it contains the Spanish copy `Aún no hay clientes` and a CTA button `Nuevo cliente`.
    - **TC-E2-P1-04 — ErrorPanel + Reintentar:** Vitest + RTL + MSW. First request returns `500 application/problem+json` (Problem Details). Render route; assert `data-testid="error-panel"` is present; assert the body contains `No se pudo cargar la lista de clientes` and the Spanish CTA `Reintentar`; assert NEITHER `error.message`, `stackTrace`, nor `Problem Details detail` text appears in the DOM. Swap MSW handler to return success; click `Reintentar`; assert second fetch fires; assert list renders.
    - **Backend `GET /api/v1/clientes` integration test** (`backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`) using `WebApplicationFactory<Program>`: hits `/api/v1/clientes` and asserts `200 OK`, body is an array (`200` + `[]` when empty). Mark `[Trait("Category", "Api")]`.
    - **Backend `ClienteEntityTests` unit test** (`backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`): asserts `Create("Acme", "900-1", "+57 1 222", "Bogotá")` produces a `ClienteEntity` with a non-empty `Guid Id`, the four field values, and `CreatedAt`/`UpdatedAt` set to a `DateTimeOffset` close to `UtcNow` (within 5 s).
    - **Backend `ClienteConfigurationTests` unit test** (`backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs`): builds an in-memory `ModelBuilder`, applies `ClienteConfiguration` + `ApplySnakeCaseNaming()`, asserts the entity table name is `clientes` and that `uk_clientes_nit` unique index exists on column `nit`.
    - **DB-trait integration test** (QA-owned, `[Trait("Category","Db")]`, MAY be added by QA in a follow-up — Story 2.1 does NOT need to ship the TestContainers test): asserts the `clientes` table exists post-migration with the column shapes from AC-2.1.f. Story 2.1 only ensures the migration files compile and the in-memory snapshot test above passes.

## Tasks / Subtasks

- [x] **Task 1 — Backend domain entity + EF Core configuration (AC #6)**
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` per the spec in AC-2.1.f (UUID PK, private setters, public static `Create` factory, `DateTimeOffset` for timestamps).
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)`.
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` per AC-2.1.f.
  - [ ] Update `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`: add `public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();`. Inside `OnModelCreating`, BEFORE `modelBuilder.ApplySnakeCaseNaming();`, add `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);`. Keep `ApplySnakeCaseNaming()` as the LAST call (Story 1.3 AC #4).
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository` with `_db.Clientes.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct)` (order by `CreatedAt DESC` to match the default sort order documented in Story 2.6 — clients also re-sort on the client; ordering server-side is a cheap default).
  - [ ] In `Program.cs`, register the repository: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>();` (place after `AddDbContext`, before `var app = builder.Build();`).
  - [ ] Add `<ProjectReference Include="..\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />` to `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` IF not already present (Story 1.3 already added `Infrastructure.Data` usage, so the project reference may already exist — verify).
  - [ ] Add `<ProjectReference Include="..\SiesaAgents.Domain\SiesaAgents.Domain.csproj" />` to `SiesaAgents.API.csproj` IF not already present.

- [x] **Task 2 — Backend EF Core migration `AddClientesTable` (AC #6)**
  - [ ] From `backend/`, run: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`.
  - [ ] Verify the generated `Up()` body calls `migrationBuilder.CreateTable(name: "clientes", ...)` with columns `id` (uuid PK), `nombre`, `nit`, `telefono`, `ciudad` (text/varchar with maxLength), `created_at`, `updated_at` (`timestamptz`); creates unique index `uk_clientes_nit` on column `nit`.
  - [ ] Verify `Down()` body drops the `clientes` table and the unique index.
  - [ ] Verify `AppDbContextModelSnapshot.cs` is updated to include the `ClienteEntity` model.
  - [ ] Do NOT run `dotnet ef database update` in this environment (no live Postgres in dev container) — the migration must compile and the snapshot must round-trip cleanly. The DB-touching test is QA-owned (Category=Db).

- [x] **Task 3 — Backend Minimal API endpoint `GET /api/v1/clientes` (AC #5)**
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with:
    ```csharp
    public static class ClienteEndpoints
    {
        public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

            group.MapGet("/", async (IClienteRepository repo, CancellationToken ct) =>
            {
                var clientes = await repo.GetAllAsync(ct);
                // Project to a DTO that exposes camelCase JSON and an ISO-8601 timestamp string
                var dto = clientes.Select(c => new ClienteListItemDto(
                    c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt));
                return Results.Ok(dto);
            });

            return app;
        }

        public sealed record ClienteListItemDto(
            Guid Id,
            string Nombre,
            string Nit,
            string Telefono,
            string Ciudad,
            DateTimeOffset CreatedAt,
            DateTimeOffset UpdatedAt);
    }
    ```
  - [ ] In `Program.cs`, after the dev-only `/api/v1/test-error` block, add `app.MapClienteEndpoints();`. Add `using SiesaAgents.API.Endpoints;` to the using block.
  - [ ] Do NOT add OpenAPI metadata customizations beyond `WithTags("Clientes")` — Scalar picks up the default minimal-API metadata.
  - [ ] **DO NOT** add a search query parameter (`?q=`) to the endpoint in this story. Search is **100 % client-side** per architecture (line 233). Adding a `?q` would create an unused code path that contradicts NFR1's strategy.

- [x] **Task 4 — Backend tests (AC #10 — backend half)**
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` per spec in AC-2.1.j.
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs` per spec in AC-2.1.j. Use `new ModelBuilder()` (test-only API on EF Core 10) + apply `ClienteConfiguration` directly via `new ClienteConfiguration().Configure(builder.Entity<ClienteEntity>())`, then call `ApplySnakeCaseNaming()` and inspect `modelBuilder.Model.FindEntityType(typeof(ClienteEntity))!.GetTableName()` etc.
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    ```csharp
    [Trait("Category", "Api")]
    public class ClienteEndpointsTests(WebApplicationFactory<Program> factory)
        : IClassFixture<WebApplicationFactory<Program>>
    {
        [Fact]
        public async Task GetClientes_ReturnsEmptyArray_WhenNoData()
        {
            // Use InMemory provider via custom factory to avoid touching Postgres.
            // See ProblemDetailsTests for the pattern: override services with
            // builder.WithWebHostBuilder(b => b.ConfigureServices(...)).
        }
    }
    ```
    **Implementation note:** override `AddDbContext<AppDbContext>` to use `UseInMemoryDatabase("clientes-tests")` so the integration test does not require Postgres. This keeps the test in `Category=Api` (the `Db` category remains reserved for TestContainers-Postgres tests added by QA).
  - [ ] Run `dotnet build backend/SiesaAgents.slnx` — must exit 0 with 0 errors and 0 warnings.
  - [ ] Run `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"` — all tests (existing + new) must be green.

- [x] **Task 5 — Frontend domain + infrastructure + application layers (AC #7)**
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` per AC-2.1.g.
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` per AC-2.1.g.
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` per AC-2.1.g. Use the existing `apiClient` from `@/shared/lib/apiClient`. Implementation:
    ```typescript
    import { apiClient } from '@/shared/lib/apiClient'
    import type { Cliente } from '../domain/Cliente'
    import type { IClienteRepository } from '../domain/IClienteRepository'

    export const clienteApiRepository: IClienteRepository = {
      async getAll(signal?: AbortSignal): Promise<Cliente[]> {
        const response = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
        return response.data
      },
    }
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```typescript
    import { useQuery, type UseQueryResult } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import type { Cliente } from '../domain/Cliente'

    export function useClientes(): UseQueryResult<Cliente[], Error> {
      return useQuery({
        queryKey: ['clientes'] as const,
        queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
      })
    }
    ```
    The `as const` on the queryKey preserves the canonical tuple type for downstream invalidation calls in Stories 2.3/2.4/2.5.
  - [ ] Create `frontend/src/modules/crm/clientes/application/normalizeText.ts` — a pure utility used by the search filter:
    ```typescript
    /**
     * Lowercase + diacritic-strip helper used by the client-side search filter.
     * Decoupled from React/TanStack so it can be unit-tested independently.
     */
    export function normalizeText(input: string): string {
      return input.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
    }
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/application/filterClientes.ts`:
    ```typescript
    import type { Cliente } from '../domain/Cliente'
    import { normalizeText } from './normalizeText'

    export function filterClientes(clientes: Cliente[], query: string): Cliente[] {
      const trimmed = query.trim()
      if (trimmed === '') return clientes
      const needle = normalizeText(trimmed)
      return clientes.filter((c) => {
        const haystack = `${normalizeText(c.nombre)} ${normalizeText(c.nit)}`
        return haystack.includes(needle)
      })
    }
    ```
    This pure function is the unit-of-test for TC-E2-P1-02 dual search. Unit-test it independently of the React tree.

- [x] **Task 6 — Frontend shared components: `EmptyState` + `ErrorPanel` (AC #3, #4)**
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` with the props in AC-2.1.c. Use Tailwind classes for layout. Default `role="status"` and `aria-live="polite"`. Default `data-testid="empty-state"`.
  - [ ] Create `frontend/src/shared/components/EmptyState.test.tsx` — render with all props; assert text content, CTA click handler is called, ARIA attributes.
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with the props in AC-2.1.d. Default `role="alert"` and `aria-live="assertive"`. Default `data-testid="error-panel"`. When `isRetrying` is true, the `Reintentar` button must be `disabled` and its visible label changes to `Reintentando...`. **Never** render `error.message` — the component does not even accept an `error` prop.
  - [ ] Create `frontend/src/shared/components/ErrorPanel.test.tsx` — render default copy; click Reintentar fires `onRetry`; `isRetrying` disables the button + changes label; assert NO leak of any string that could be a stack trace by rendering the component inside a wrapper that injects a malicious-looking string into the DOM via `console.error` spy assertion.
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx` per AC-2.1.h. Use a `<button type="button">` with `aria-current` set when `isSelected`. Item layout: vertical stack, `nombre` (`text-sm font-semibold text-slate-900`), `nit` (`text-xs text-slate-500`). Hover background `hover:bg-slate-50`; selected background `bg-primary-50 border-l-2 border-l-primary-600`. Min-height `56px`.
  - [ ] Create `frontend/src/shared/components/ClientListItem.test.tsx` — render with `isSelected: true` asserts `aria-current="true"` + active CSS; click fires `onClick`.

- [x] **Task 7 — Frontend `ClienteListView` + route wiring (AC #1, #2, #8, #9)**
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` orchestrating the four states (loading / error / empty / list). Use `useClientes()` to fetch; use `useMemo` over `data + searchQuery` to compute the filtered list with `filterClientes`. Render the siesa-ui-kit `Input` for the search box. The root container is `<aside aria-label="Lista de clientes" className="w-full lg:w-[280px] flex-shrink-0 h-full overflow-y-auto border-r border-slate-200 bg-slate-50">`. Loading state: render 3 `<Skeleton height={56} />` items from `react-loading-skeleton` (already installed and used in `ClientesPlaceholderView.tsx`).
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` covering TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-04. Mock `useClientes` via MSW handlers on the shared Axios instance OR by wrapping the component in a test `QueryClientProvider` and pre-warming the cache with `queryClient.setQueryData(['clientes'], fixtures)`. Use the second approach for the perf test (TC-E2-P0-06) to keep it deterministic — see Task 8.
  - [ ] Update `frontend/src/routes/clientes.tsx`:
    ```typescript
    import { createFileRoute } from '@tanstack/react-router'
    import { useState } from 'react'
    import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

    function ClientesRoute() {
      const [searchQuery, setSearchQuery] = useState('')
      return (
        <div className="flex h-full">
          <ClienteListView
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedClienteId={null}
            onSelectCliente={() => {}}
          />
          <section
            data-testid="cliente-detail-placeholder"
            className="hidden lg:flex flex-1 items-center justify-center text-slate-400"
          >
            Selecciona un cliente para ver el detalle
          </section>
        </div>
      )
    }

    export const Route = createFileRoute('/clientes')({
      component: ClientesRoute,
    })
    ```
  - [ ] Delete `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` and `ClientesPlaceholderView.test.tsx`. Remove any orphan imports.
  - [ ] Run `pnpm tsc -b` (or `pnpm build`) — must pass with no errors.

- [x] **Task 8 — Frontend NFR1 performance test (AC #2, #10 — TC-E2-P0-06)**
  - [ ] Create `frontend/src/modules/crm/clientes/application/__fixtures__/clientes.fixtures.ts` exporting `makeClientes(count: number, seed: number)` that uses a deterministic PRNG (write a 30-line LCG / Mulberry32 helper — do NOT add a `faker` dependency for one helper; the seed determinism is what TC-E2-P0-06 requires).
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx`:
    - Pre-warm `queryClient.setQueryData(['clientes'], makeClientes(500, 20260601))`.
    - Render `ClienteListView` with `searchQuery=""`.
    - Measure 10 iterations of typing `"ACM"` (use `act` + `userEvent.type`); record `performance.now()` delta around each `act`.
    - Assert `p95(deltas) < 200` AND `MSW request spy count === 0` during typing.
  - [ ] Create `frontend/src/modules/crm/clientes/application/filterClientes.test.ts` covering: case-insensitive nombre match, case-insensitive NIT match, diacritic-insensitive match (`José` ↔ `jose`), empty query returns input array, whitespace-only query returns input array.

- [x] **Task 9 — MSW + test infra updates (AC #10)**
  - [ ] Verify `msw` is already a dev dependency (it is, per `package.json`). If `src/test/handlers/` does not yet exist, create `frontend/src/test/handlers/clientes.handlers.ts` with named exports `clientesSuccessEmpty`, `clientesSuccessThree`, `clientesError500` returning `http.get('/api/v1/clientes', ...)` handlers (use `import { http, HttpResponse } from 'msw'`).
  - [ ] Create `frontend/src/test/utils/renderWithQuery.tsx` — a helper that wraps a component in a fresh `QueryClientProvider` with `retry: false` for tests. Re-use it from all the new test files.
  - [ ] Update `frontend/src/test/setup.ts` to start/stop an MSW `setupServer` once per Vitest run:
    ```typescript
    import '@testing-library/jest-dom/vitest'
    import { afterAll, afterEach, beforeAll } from 'vitest'
    import { setupServer } from 'msw/node'

    export const server = setupServer()

    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())
    ```
    Tests will call `server.use(...)` to register per-test handlers. Document this in a 2-line JSDoc comment in `setup.ts`. **Do NOT** add the MSW server to the production bundle — `setup.ts` is only loaded by Vitest (see `vitest.config.ts` line 15).
  - [ ] Add `VITE_API_URL=http://localhost:5000` to a new `frontend/.env.test` file so MSW intercepts the correct absolute URL when Axios builds the request URL. The existing `apiClient.ts` uses `import.meta.env.VITE_API_URL` — provide a sensible test value.

- [x] **Task 10 — Documentation & cleanup**
  - [ ] Update `backend/README.md`: append a section describing the new `GET /api/v1/clientes` endpoint and the migration command for `AddClientesTable`.
  - [ ] Run `pnpm test` in `frontend/` — all tests (existing + new) must pass. Existing tests to verify still pass: `apiClient.test.ts`, `queryClient.test.ts`, all `AppShell*.test.tsx`, `NotFoundView.test.tsx`, `ContactosPlaceholderView.test.tsx`. The deleted `ClientesPlaceholderView.test.tsx` is expected to NOT run anymore.
  - [ ] Run `dotnet build backend/SiesaAgents.slnx` AND `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"` — must exit 0.
  - [ ] Update the **File List** section below with everything created / modified / deleted.

## Dev Notes

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (v1.0.206 — already installed, see `frontend/package.json`)
- **Install**: `npm install siesa-ui-kit` is **NOT** required — dependency already present.
- **Usage**: You MUST use `siesa-ui-kit` components for all UI primitives in this story:
  - `Input` for the search field (`import { Input } from 'siesa-ui-kit'`).
  - `Button` for the EmptyState CTA and the ErrorPanel `Reintentar` action (`import { Button } from 'siesa-ui-kit'`).
- **Constraint**: Do NOT create custom Input/Button components — they exist in the kit. Custom components are only allowed for `EmptyState`, `ErrorPanel`, `ClientListItem`, `ClienteListView` (these are application-specific compositions, not primitives).
- **MasterCrud is NOT used in this story.** MasterCrud is the kit-level CRUD orchestrator (see `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`) and is intended for screens where the full CRUD experience is delegated to the kit. Story 2.1 ships a **bespoke split-panel layout** per the chosen UX direction (Direction F — `_bmad-output/planning-artifacts/ux-design-specification.md` lines 381–401) which deliberately exposes the list as a 280 px sidebar adjacent to a detail panel. The kit's `ContactManager` will be used in Story 2.2/2.3 onward for inline contact CRUD; clients themselves are managed through custom composition.

### Architecture Pattern — Clean Architecture + DDD (frontend & backend)

This story spans both layers. The dependency direction is identical on both sides:

```
Presentation ──► Application ──► Domain ◄── Infrastructure
                                    ▲
                            (Domain has zero deps)
```

**Frontend:**
- `domain/`: `Cliente.ts` (entity interface), `IClienteRepository.ts` (contract). **Zero React or TanStack imports.**
- `application/`: `useClientes.ts` (TanStack Query hook), `filterClientes.ts` + `normalizeText.ts` (pure utilities). Imports from `domain/` and `infrastructure/` (via the singleton repository). **Zero presentation imports.**
- `infrastructure/`: `clienteApiRepository.ts` — Axios implementation of `IClienteRepository`. Imports `apiClient` from `@/shared/lib/apiClient`.
- `presentation/`: `ClienteListView.tsx`. Imports from `application/` only.
- `src/shared/components/`: `EmptyState`, `ErrorPanel`, `ClientListItem` — reusable across modules. No domain knowledge in shared components (they accept all copy as props).

**Backend (additive to Story 1.3 foundation):**
- `SiesaAgents.Domain`: `Clientes/Entities/ClienteEntity.cs` + `Clientes/Interfaces/IClienteRepository.cs`. **Zero dependencies** on Application, Infrastructure, or API.
- `SiesaAgents.Application`: empty for this story (no Commands/Queries yet — the read endpoint is direct on the repository; CQRS arrives in Story 2.3 with the first write).
- `SiesaAgents.Infrastructure`: `Data/Configurations/ClienteConfiguration.cs` + `Repositories/ClienteRepository.cs`. References only `Domain` (Story 1.3 enforces this).
- `SiesaAgents.API`: `Endpoints/ClienteEndpoints.cs` (Minimal API extension method) + DI wire-up in `Program.cs`.

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Architecture: Clean Architecture + DDD`]
[Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]

### Why Search Is Client-Side (NFR1 strategy)

NFR1 mandates `< 1 s` keystroke-to-paint for up to 500 records. The architecture (line 233) decides this is solved by:

1. Loading the entire `clientes` table once on `/clientes` mount via `useQuery({ queryKey: ['clientes'] })` — a single REST call.
2. Filtering in memory with a `useMemo`-cached pure function on every keystroke (no debounce — 500 records × `.toLowerCase().includes()` is < 5 ms).
3. Letting TanStack Query's `staleTime: 60s` (from `queryClient.ts`) deduplicate subsequent navigations.

This means the backend endpoint **must not** accept a `?q=` parameter for now (it would be dead code). If the dataset ever grows beyond NFR10 (500), the FR27 hook can switch the queryKey to `['clientes', { q }]` and add a server query parameter without changing any presentation code.

[Source: `_bmad-output/planning-artifacts/architecture.md#Data Flow Diagram` lines 643–656]
[Source: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md` NFR1]

### Why EmptyState and ErrorPanel Are Shared

Both components are explicitly listed in `architecture.md` line 501 under `src/shared/components/`. The reason: the contactos module (Epic 3) will reuse the exact same EmptyState + ErrorPanel patterns. Building them as configurable shared components in this story:

- Locks the visual / accessibility contract in one place (one accessibility audit, one Storybook entry if added later).
- Forces presentation-layer code to be 100 % copy-driven (no business logic leaks into shared components).
- Sets up Story 3.1 to import them directly instead of re-implementing.

The contracts (props) above are deliberately conservative — `ctaLabel?: string` is optional so EmptyState can also be used without a CTA elsewhere (e.g., empty search results, if added in a later story).

[Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure` line 501]
[Source: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 264–268 — empty state with CTA pattern]

### NFR6 — `ErrorPanel` MUST NOT leak backend internals

Per `.claude/agent-memory/sa-quick-dev/company-standards.md#Security` and PRD NFR6, the frontend MUST NOT display:
- `error.message` from Axios/TanStack Query
- The `detail` field of a Problem Details response
- Stack traces, exception type names, or any string that looks like an SDK identifier

The chosen API for `ErrorPanel` enforces this **structurally** — the component does not accept an `error` prop at all. It accepts only `title?: string`, `description?: string`, `onRetry`, `isRetrying?: boolean`. The default Spanish copy is hardcoded. A code reviewer can grep for `error.message` in the diff and find zero hits in the presentation layer.

This pattern mirrors Story 1.3 Task 5 (Problem Details middleware — server-side) and extends it to the client side.

[Source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#Problem Details RFC 7807 (NFR6 — AC #3)`]
[Source: `_bmad-output/planning-artifacts/architecture.md#Error handling — frontend` line 408]

### Backend `AsNoTracking()` + default ordering

The repository uses `.AsNoTracking()` because the list endpoint is a pure read with no entity-graph manipulation downstream. This reduces EF Core memory pressure (no change-tracker entries for 500 records on every call).

Default ordering is `OrderByDescending(c => c.CreatedAt)` to match the "Más reciente" default sort that Story 2.6 establishes. The frontend will re-sort client-side anyway (Story 2.6), but having a sensible server default keeps `curl` and Scalar previews readable.

[Source: `_bmad-output/planning-artifacts/architecture.md#Sort Client List` (Story 2.6) — "default sort order is Más reciente"]

### EF Core 10 — Configuration discovery

The architecture (line 504) places `IEntityTypeConfiguration<T>` files under `SiesaAgents.Infrastructure/Data/Configurations/`. To wire them in, `OnModelCreating` must call `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);` ONCE — **before** `ApplySnakeCaseNaming()` (Story 1.3 AC #4 mandate). This change to `AppDbContext.cs` is the single edit; future entity configurations (e.g., Story 3.1 `ContactoConfiguration`) are auto-picked-up.

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);   // NEW in Story 2.1
    modelBuilder.ApplySnakeCaseNaming();                                            // MUST remain LAST
}
```

[Source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#`ApplySnakeCaseNaming()` Implementation Contract`]
[Source: `_bmad-output/planning-artifacts/architecture.md` lines 575–580]

### Frontend `Input` from siesa-ui-kit — usage shape

The kit exports `Input` (verified in `frontend/node_modules/siesa-ui-kit/dist/index.d.ts`). Use it as:

```typescript
import { Input } from 'siesa-ui-kit'

<Input
  type="search"
  value={searchQuery}
  onChange={(e) => onSearchChange(e.target.value)}
  placeholder="Buscar cliente por nombre o NIT/RUC..."
  aria-label="Buscar cliente"
  data-testid="cliente-search-input"
/>
```

If the kit's `Input` does not surface an exact `onChange` signature compatible with the above, fall back to wrapping it in a thin adapter — but FIRST inspect `dist/index.d.ts` to confirm the prop names. **DO NOT** create a custom `<input>` element — that would violate the UI mandate.

### Testing standards summary

**Frontend (Vitest + RTL + MSW):**
- Co-locate `.test.tsx` next to the file under test (matches existing pattern — `apiClient.test.ts` next to `apiClient.ts`).
- Use `setupServer` from `msw/node` (MSW v2 API — already installed at ^2.14.6). The setup snippet in Task 9 is the canonical pattern.
- Use `userEvent.setup()` from `@testing-library/user-event` for typing simulation (matches Story 1.2 tests).
- For the perf test (TC-E2-P0-06), do NOT rely on MSW — pre-warm the cache via `queryClient.setQueryData(['clientes'], fixtures)`. MSW is only needed for the error / empty / refetch tests.

**Backend (xUnit):**
- Unit tests for `ClienteEntity` and `ClienteConfiguration` live in `tests/SiesaAgents.UnitTests/` (Domain + Infrastructure subfolders, mirroring `src/`).
- Integration test for `GET /api/v1/clientes` lives in `tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`, trait `Category=Api`, uses `WebApplicationFactory<Program>` with the InMemory provider override (no Postgres). This keeps Story 2.1 CI-green without TestContainers/Docker.

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Testing Standards`]
[Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#3.1 P0` + `#3.2 P1`]

### Source tree components to touch

**Frontend — NEW files:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/normalizeText.ts`
- `frontend/src/modules/crm/clientes/application/filterClientes.ts`
- `frontend/src/modules/crm/clientes/application/filterClientes.test.ts`
- `frontend/src/modules/crm/clientes/application/__fixtures__/clientes.fixtures.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/EmptyState.test.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ErrorPanel.test.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/shared/components/ClientListItem.test.tsx`
- `frontend/src/test/handlers/clientes.handlers.ts`
- `frontend/src/test/utils/renderWithQuery.tsx`
- `frontend/.env.test`

**Frontend — MODIFIED files:**
- `frontend/src/routes/clientes.tsx` (replace `ClientesPlaceholderView` with `ClienteListView`)
- `frontend/src/test/setup.ts` (add MSW setupServer)

**Frontend — DELETED files:**
- `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.test.tsx`

**Backend — NEW files:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/{timestamp}_AddClientesTable.cs` (auto-generated)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/{timestamp}_AddClientesTable.Designer.cs` (auto-generated)
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

**Backend — MODIFIED files:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (add `DbSet<ClienteEntity>` + `ApplyConfigurationsFromAssembly` call)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` (auto-updated by `dotnet ef`)
- `backend/src/SiesaAgents.API/Program.cs` (register `IClienteRepository` + call `MapClienteEndpoints`)
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` (add ProjectReference to Domain if missing)
- `backend/README.md` (document new endpoint + migration)

### Project Structure Notes

- The architecture (line 480) places the list panel component at `presentation/ClienteListView.tsx`. This story names it **exactly** `ClienteListView.tsx` (singular `Cliente`) — different from `ClienteListPanel` mentioned informally in line 333. The canonical name from `architecture.md` line 480 wins.
- `ClientListItem.tsx` lives in `src/shared/components/` (architecture line 502) — NOT in the clientes module. This is deliberate: future Story 2.6 (Sort) and possibly Story 4.x (orphan filters) will reuse it from contexts outside the clientes module. The component is "shared" in the sense that it knows nothing about how to fetch a client; it just renders one.
- `EmptyState` and `ErrorPanel` are shared (line 501) — same rationale. Story 3.1 (Contactos List & Search) will import them directly.
- The Application layer for clientes is empty of Commands/Queries in this story (no CQRS yet — read endpoint is direct repository call). CQRS arrives in Story 2.3. This is acceptable because architecture line 362 calls for `Commands/Queries` only when there is something to command/query — a no-arg list endpoint does not justify a `GetClientesQuery` ceremony in MVP. Stories 2.3 / 2.4 will introduce both.

### Previous Story Learnings (from Stories 1.1, 1.2, 1.3)

- **Story 1.1:** Established `frontend/` and `backend/` workspaces, `SiesaAgents.slnx` (modern XML solution format), Scalar API docs (never Swagger).
- **Story 1.2:** Established `AppShell` composing `Navbar` + `NavigationRailGroup` (desktop) + `NavigationBar` (mobile) from siesa-ui-kit. Set the pattern that route children render inside a single `<main>` shared by both viewports. **Story 2.1's route renders inside that single `<main>`** — do not introduce a second top-level layout wrapper.
- **Story 1.3:** Established `AppDbContext`, snake_case naming via `ModelBuilderSnakeCaseExtensions`, snake_case history table via `SnakeCaseNpgsqlHistoryRepository`, dev-only `/api/v1/test-error` for Problem Details smoke testing. **Story 2.1 reuses every one of those primitives** — do not re-implement or modify them. The only `AppDbContext` change in this story is the `DbSet<ClienteEntity>` add and the `ApplyConfigurationsFromAssembly` line.
- **Test discipline:** Stories 1.1–1.3 maintained 0 warnings on `dotnet build` and 0 failing unit/integration tests. Story 2.1 must continue this — pre-flight `pnpm test` AND `dotnet test --filter "Category!=Db"` before requesting review.
- **`WebApplicationFactory<Program>` pattern:** Story 1.3 added `public partial class Program;` to `Program.cs`. Reuse this — do NOT redefine it.

[Source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`]
[Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`]
[Source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`]

### Git & Commit Pattern (from Stories 1.1 / 1.2 / 1.3)

- Commit cadence: one cohesive commit per task (e.g., `feat(story-2.1): add ClienteEntity + EF Core mapping + AddClientesTable migration`).
- Run `dotnet build && dotnet test --filter "Category!=Db"` and `pnpm test` BEFORE pushing.
- Use Conventional Commits (`feat`, `test`, `docs`, `fix`, `chore`) with story scope (`(story-2.1)`).
- Recent recent epic commits in this repo (verified via `git log --oneline -10`):
  - `3500c3d test(epic-2): add test design plan and mark epic-2 in-progress`
  - `189206b feat(story-1.3): implement EF Core foundation with snake_case naming`
  - `84f47f1 test(story-1.3): add ATDD failing tests for backend database foundation`

### Test Strategy & TEA Traceability

| Test ID | Level | AC | Owner | Notes |
|---|---|---|---|---|
| TC-E2-P0-06 | Component perf (Vitest + RTL) | #2 — NFR1 search < 1 s @ 500 | Frontend DEV | Pre-warm cache; assert p95 < 200 ms + 0 MSW requests during typing |
| TC-E2-P1-01 | Component (Vitest + RTL) | #1 — 280 px panel + Nombre + NIT | Frontend DEV | Render 3 fixtures, assert panel `w-[280px]` + visible fields |
| TC-E2-P1-02 | Component (Vitest + RTL) | #2 — dual search nombre OR NIT (+ diacritics) | Frontend DEV | Type "ACM" → Acme; type "900" → Acme by NIT; type "jose" → José |
| TC-E2-P1-03 | Component (Vitest + RTL + MSW) | #3 — EmptyState when zero | Frontend DEV | MSW returns `[]`, assert `empty-state` testid + Spanish copy |
| TC-E2-P1-04 | Component (Vitest + RTL + MSW) | #4 — ErrorPanel + Reintentar (NFR6) | Frontend DEV | MSW returns 500; assert `error-panel` testid; click Reintentar → swap to success → list renders |
| (Backend) | xUnit unit | #6 — `ClienteEntity` factory | Backend DEV | `Create(...)` produces non-empty `Guid`, fields set, `CreatedAt`/`UpdatedAt` ≈ UtcNow |
| (Backend) | xUnit unit | #6 — `ClienteConfiguration` + snake_case | Backend DEV | In-memory `ModelBuilder`, assert table `clientes`, unique index `uk_clientes_nit` on `nit` |
| (Backend) | xUnit integration (`Category=Api`) | #5 — `GET /api/v1/clientes` returns array | Backend DEV | `WebApplicationFactory<Program>` + InMemory provider; assert 200 + `[]` when empty |
| TC-E2-P2-03 (deferred to QA) | xUnit integration (`Category=Db`) | #6 — schema in Postgres | QA | TestContainers-Postgres, assert `pg_indexes` has `uk_clientes_nit`; assert `created_at` is `timestamptz` |

[Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md`]

### Code & Convention Rules (NON-NEGOTIABLE)

**Backend:**
- `Guid` (UUID) for the PK — `public Guid Id { get; private set; } = Guid.NewGuid();`.
- `DateTimeOffset` for ALL timestamps — never `DateTime`.
- Private setters + public static `Create` factory pattern (entity invariants enforced in the factory). Even though the factory is unused in this read-only story, it MUST exist now so Story 2.3 can call it.
- `IEntityTypeConfiguration<T>` for all entity mappings — never use `[Column]` / `[Table]` attributes (snake_case extension handles renaming).
- `AsNoTracking()` on all read-only queries.
- Minimal API endpoints registered via `app.MapXxxEndpoints()` extension methods — never controllers. `WithTags("Clientes")` for Scalar grouping.
- `<Nullable>enable</Nullable>` is mandatory on every project; never use `!` null-forgiving operator without a comment.

**Frontend:**
- `TypeScript strict` — never `any`.
- All user-facing strings in Spanish (placeholders, labels, ARIA labels, error messages, empty-state copy).
- Component / interface names in English (`Cliente`, `ClienteListView`, `useClientes`). Variable / function names in English. Strings shown to users in Spanish.
- TanStack Query keys MUST match the canonical array literal `['clientes']` (architecture line 277). Do not use template strings or dynamic concatenation.
- Co-locate tests next to source: `Foo.tsx` + `Foo.test.tsx`.
- Use the `@/` path alias for absolute imports (configured in `vite.config.ts` and `vitest.config.ts`).
- Never use `localStorage`/`sessionStorage` for client data (none needed here).
- 44 px minimum touch targets on all interactive elements (WCAG 2.1 AA).

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules` + `#Frontend Key Rules`]

### Latest Tech Info (from `frontend/package.json` and `backend/*.csproj`)

| Library | Version (locked) | Notes |
|---|---|---|
| `react` | 19.2.6 | Functional components + hooks |
| `@tanstack/react-router` | 1.170.10 | File-based routing — auto-generated `routeTree.gen.ts` |
| `@tanstack/react-query` | 5.100.14 | `useQuery({ queryKey: [...] as const, queryFn })` |
| `axios` | 1.16.1 | `apiClient` singleton in `src/shared/lib/apiClient.ts` |
| `siesa-ui-kit` | 1.0.206 | Use `Input`, `Button` for primitives; exports verified in `node_modules/siesa-ui-kit/dist/index.d.ts` |
| `react-loading-skeleton` | 3.5.0 | Use for loading state inside `ClienteListView` |
| `msw` | 2.14.6 | v2 API: `import { http, HttpResponse } from 'msw'` |
| `vitest` | 4.1.8 | `jsdom` environment, globals enabled |
| `tailwindcss` | 4.3.0 | v4 — use `@tailwindcss/vite` plugin (already configured) |
| `@heroicons/react` | 2.2.0 | Outline icons for EmptyState (`UsersIcon`) and ErrorPanel (`ExclamationTriangleIcon`) |
| Microsoft.EntityFrameworkCore | 10.x | Already in Infrastructure (Story 1.3) |
| Npgsql.EntityFrameworkCore.PostgreSQL | 10.0.2 | Already in Infrastructure |
| Microsoft.EntityFrameworkCore.Design | 10.0.* | Already in API project (Story 1.3) |

No external library upgrades are required for this story.

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1: Client List & Search`]
- Architecture (project layout, search strategy, API contract, query keys): [Source: `_bmad-output/planning-artifacts/architecture.md#Search Strategy`] · [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`] · [Source: `_bmad-output/planning-artifacts/architecture.md#TanStack Query keys`] · [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- UX (split-panel layout, search-first principle): [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Direction F`] · [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Core Interaction Design`]
- Test design (TC-E2-P0-06 + TC-E2-P1-01..04 + risk R-003): [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#3.1 P0`] · [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#3.2 P1`] · [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#Risk Map`]
- NFRs (NFR1 search, NFR6 error exposure, NFR10 scale): [Source: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`]
- Company standards (stack, Clean Arch, DateTimeOffset, UUID, Spanish text, siesa-ui-kit first): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- Previous story foundation (`AppDbContext`, snake_case, `Program.cs` DI, `WebApplicationFactory<Program>`): [Source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`]
- Previous story shell (`AppShell`, `<main>` single mount, route file pattern): [Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`]
- MasterCrud reference (acknowledged, NOT applied — see Dev Notes): [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- Integration test `ClienteEndpointsTests` initially failed with
  `InvalidOperationException: Services for database providers 'Npgsql...',
  'Microsoft.EntityFrameworkCore.InMemory' have been registered`. Resolved by
  also removing `IDbContextOptionsConfiguration<>` descriptors before
  registering the InMemory provider in the test fixture (avoids the dual-provider
  conflict without needing `UseInternalServiceProvider`).
- Story 1.3 unit tests `AppDbContextEdgeCasesTests.AppDbContext_HasNoPublicDbSetProperties_PerStory13ScopeNote`
  and `AppDbContextTests.AppDbContext_DoesNotExposeDomainTables_ScopeNoteForEpic1`
  became obsolete once Story 2.1 introduced the first `DbSet<ClienteEntity>` —
  rewritten as positive assertions (`Contains Clientes` / `Contains ClienteEntity`).
- ATDD test `ClienteListView.test.tsx` line 69 used `/\bw-\[280px\]\b/` which
  cannot match `lg:w-[280px]` followed by whitespace (`]` and ` ` are both
  non-word in JS regex, so the trailing `\b` never matches). Removed the trailing
  `\b` — intent preserved.

### Completion Notes List

- Backend build: 0 errors / 0 warnings.
- Backend tests (excluding `Category=Db`): 86 passing (62 unit + 24 integration).
- Frontend tests: 93 passing across 14 files.
- Frontend `pnpm build` succeeds; bundle warning (>500 KB) is pre-existing.
- EF Core migration `20260602104351_AddClientesTable` generated with snake_case
  columns + `uk_clientes_nit` unique index. NOT applied to a real DB (no live
  Postgres in this env — by design per Task 2).
- `ClienteListView` internally mirrors the parent `searchQuery` prop into local
  state so the search input filters even when the parent's `onSearchChange` is a
  no-op (required by the ATDD component tests that pass `() => {}`). Parent state
  remains the source of truth for hydration (Story 2.2 deep-linking will rely on
  this seam).
- Backend list endpoint is unauthenticated; auth ships in a later story.
- ContactosPlaceholderView and other non-Story-2.1 modules untouched.

### File List

**Backend — NEW:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260602104351_AddClientesTable.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260602104351_AddClientesTable.Designer.cs`

**Backend — MODIFIED:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (added `DbSet<ClienteEntity>` + `ApplyConfigurationsFromAssembly`)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` (auto-updated by `dotnet ef`)
- `backend/src/SiesaAgents.API/Program.cs` (registered `IClienteRepository` + `app.MapClienteEndpoints()`)
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` (added `SiesaAgents.Domain` ProjectReference)
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (fixture: also strip `IDbContextOptionsConfiguration<>` descriptors)
- `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextEdgeCasesTests.cs` (story-1.3 scope-note test → story-2.1 positive assertion)
- `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs` (story-1.3 scope-note test → story-2.1 positive assertion)
- `backend/README.md` (documented `GET /api/v1/clientes` + `AddClientesTable` migration)

**Frontend — NEW:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/normalizeText.ts`
- `frontend/src/modules/crm/clientes/application/filterClientes.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`

**Frontend — MODIFIED:**
- `frontend/src/routes/clientes.tsx` (wired `ClienteListView` + detail placeholder)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (fixed broken `\bw-\[280px\]\b` regex)

**Frontend — DELETED:**
- `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.test.tsx`
