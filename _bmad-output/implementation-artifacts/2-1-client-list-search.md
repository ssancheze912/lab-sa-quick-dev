# Story 2.1: Client List & Search

Status: ready-for-dev

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** the backend is up and the `siesa_agents_db` database has been migrated, **When** the developer runs `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`, **Then** a new EF Core migration creates the `clientes` PostgreSQL table with columns `id` (uuid PK), `nombre` (text NOT NULL), `nit` (text NOT NULL), `telefono` (text NOT NULL), `ciudad` (text NOT NULL), `created_at` (`timestamp with time zone` NOT NULL DEFAULT `NOW()`), `updated_at` (`timestamp with time zone` NOT NULL DEFAULT `NOW()`), and applies the unique index `uk_clientes_nit` on `nit` and the PostgreSQL extension + GIN trigram index `ix_clientes_nombre_trgm` on `nombre` using `pg_trgm` (per Test Design R3 mitigation for NFR1). All names are snake_case (no PascalCase). (Scope note: Story 1.3 explicitly deferred this table to Story 2.1.) [AC-2.1.a]

2. **Given** the `clientes` migration has run, **When** the developer issues `GET http://localhost:5000/api/v1/clientes`, **Then** the backend returns `200 OK` with a JSON array (`Content-Type: application/json`) of `ClienteDto` items shaped as `{ id: string-uuid, nombre: string, nitRuc: string, telefono: string, ciudad: string, createdAt: string-iso8601, updatedAt: string-iso8601 }`. When the table is empty, an empty array `[]` is returned (NOT `null`, NOT `204`). When `?search=` is appended, results are filtered case-insensitively on `nombre` OR `nit` containing the search fragment, p95 response time < 1s with 500 records (NFR1). (Note: the search endpoint exists as a fallback; the frontend filters client-side per architecture decision.) [AC-2.1.b, NFR1]

3. **Given** the user navigates to `/clientes` and clients exist in the system, **When** the `ClienteListView` mounts inside `/clientes`, **Then** a left-hand panel exactly `280px` wide (Tailwind `w-[280px]`) renders a vertically scrollable list (`overflow-y-auto`) of clients. Each list item shows `Nombre` (primary text, `font-medium`) and `NIT/RUC` (secondary text, `text-sm text-muted-foreground`) and is reachable via Tab + Enter (`role="button"`, `aria-label="Ver cliente: {nombre}"`). Selecting an item highlights it (`primary-50` background + 3px `primary-600` left border per UX spec). The right panel renders an inline empty placeholder ("Selecciona un cliente para ver sus detalles") — the actual detail view is delivered in Story 2.2. [Story 2.1 AC1]

4. **Given** the client list is loaded and contains at least two clients, **When** the user types any string into the search `Input` (siesa-ui-kit `Input` with `placeholder="Buscar por nombre o NIT/RUC"`), **Then** the visible list filters in real time to clients whose `nombre` OR `nitRuc` contains the typed string case-insensitively. The filter runs entirely client-side over the TanStack Query cache (no additional `GET /api/v1/clientes` request fired; assert via MSW spy in tests). The filter is debounced 150ms and the time from `input` event to filtered DOM render MUST be `< 1s` with a 500-record fixture (NFR1; target < 200ms). The search input value is the source of truth — it lives in local `useState` and is NOT pushed into Zustand. [Story 2.1 AC2, NFR1, R3]

5. **Given** the search yields zero matches OR the backend returns an empty `[]`, **When** the list region renders, **Then** an `EmptyState` component (custom component built in this story under `src/shared/components/EmptyState/`) is shown in place of the list, using the variant copy from the UX spec:
   - `no-clients` (backend returned `[]`): title `"No hay clientes registrados"`, subtitle `"Crea el primer cliente del sistema"`, CTA `"Nuevo cliente"` (the CTA is rendered but non-functional in Story 2.1 — `onClick` is a no-op; full wiring lands in Story 2.3).
   - `search-empty` (filtered set is empty but the cache is not): title `"No se encontró ningún cliente"`, subtitle `"Intenta con otro nombre o NIT"`, no CTA in Story 2.1.
   The container carries `aria-live="polite"` so screen readers announce the state transition. [Story 2.1 AC3, R12]

6. **Given** the backend is unreachable OR returns a non-2xx status when the page first loads, **When** TanStack Query reports `status === 'error'`, **Then** an `ErrorPanel` component (custom component built in this story under `src/shared/components/ErrorPanel/`) renders in place of the list, with:
   - title `"No pudimos cargar los clientes"`,
   - subtitle `"Verifica tu conexión e intenta nuevamente"`,
   - a single primary `Button` labeled `"Reintentar"` that calls `refetch()` from the same `useClientes` hook.
   The component MUST NOT display `error.message`, the HTTP status code, the URL, or any Problem Details `detail`/`type`/`instance` fields (NFR6). Clicking "Reintentar" re-runs the query; if the second attempt succeeds, the list renders normally and the `ErrorPanel` is removed. [Story 2.1 AC4, R8, NFR6]

7. **Given** TanStack Query is fetching the list for the first time (`status === 'pending'`), **When** the panel renders, **Then** 5 `react-loading-skeleton` placeholders are displayed in the list region (`role="status"` + `aria-busy="true"` + `aria-label="Cargando clientes"`). Skeletons are replaced by either the list, the `EmptyState`, or the `ErrorPanel` once the query settles. Spinners are NOT used. [Architecture §Loading States, company-standards.md §UX Design System]

## Tasks / Subtasks

- [ ] **Task 1 — Backend: Domain entity `ClienteEntity`** (AC: #1, #2)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` as a sealed class with private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory.
  - [ ] Properties: `Guid Id` (default `Guid.NewGuid()`), `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt` (all setters `private`). Use `DateTimeOffset` — NEVER `DateTime`.
  - [ ] Add an `Update(string nombre, string nit, string telefono, string ciudad)` method that mutates fields and bumps `UpdatedAt = DateTimeOffset.UtcNow` (used by Story 2.4, but defining it here keeps the entity immutable from the outside in this story).
  - [ ] Domain validation in `Create`/`Update`: throw `ArgumentException` if any of the four required strings is null, empty, or whitespace (business rule FR8). Length caps: `nombre` ≤ 200, `nit` ≤ 50, `telefono` ≤ 50, `ciudad` ≤ 100.
  - [ ] Remove `.gitkeep` from `Domain/Clientes/Entities/`.

- [ ] **Task 2 — Backend: Repository contract** (AC: #1, #2)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` exposing: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? search, CancellationToken ct)`, `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`, `Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)` (Story 2.3 needs this — define here so the contract is stable), `Task AddAsync(ClienteEntity entity, CancellationToken ct)`, `Task UpdateAsync(ClienteEntity entity, CancellationToken ct)`, `Task DeleteAsync(ClienteEntity entity, CancellationToken ct)`. Story 2.1 only USES `GetAllAsync`; the others are defined so subsequent stories don't break the interface.
  - [ ] Remove `.gitkeep` from `Domain/Clientes/Interfaces/`.

- [ ] **Task 3 — Backend: EF Core configuration** (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`.
  - [ ] Inside `Configure`:
    - `builder.ToTable("clientes")` — explicit table name (snake_case-naming convention already in `AppDbContext`, but explicit here keeps the config self-documenting; the convention will still re-emit columns in snake_case).
    - `builder.HasKey(c => c.Id)` named `pk_clientes`.
    - `builder.Property(c => c.Id).ValueGeneratedNever()` (we assign `Guid.NewGuid()` in the entity factory).
    - Configure each `string` property with `.IsRequired().HasMaxLength(...)` matching the domain caps (`Nombre` 200, `Nit` 50, `Telefono` 50, `Ciudad` 100).
    - Configure `CreatedAt` and `UpdatedAt` with `.HasDefaultValueSql("NOW()")` (Postgres) — `timestamp with time zone`.
    - `builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")` — backs the FR7 NIT-uniqueness rule (the duplicate-NIT 409 is wired in Story 2.3, but the index itself is required by R2 mitigation and must be created now).
    - `builder.HasIndex(c => c.Nombre).HasDatabaseName("ix_clientes_nombre_trgm").HasMethod("gin").HasOperators("gin_trgm_ops")` — GIN trigram index for fast `ILIKE` search (R3 mitigation; NFR1 budget). Wrap in `EFCore.NamingConventions`-compatible API: use `.HasMethod("gin").HasOperators("gin_trgm_ops")` from the Npgsql provider.
  - [ ] Register the `pg_trgm` extension in `AppDbContext.OnModelCreating` ONCE: `modelBuilder.HasPostgresExtension("pg_trgm");` placed AFTER `base.OnModelCreating` and AFTER `ApplyConfigurationsFromAssembly` but BEFORE `ApplySnakeCaseNaming()`. The `ApplySnakeCaseNaming()` call MUST remain LAST per Story 1.3 contract.
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext` so EF can track the entity.

- [ ] **Task 4 — Backend: Repository implementation** (AC: #2)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository` using `AppDbContext`.
  - [ ] `GetAllAsync(string? search, CancellationToken ct)` returns `await _db.Clientes.AsNoTracking().Where(c => string.IsNullOrWhiteSpace(search) || EF.Functions.ILike(c.Nombre, $"%{search}%") || EF.Functions.ILike(c.Nit, $"%{search}%")).OrderByDescending(c => c.CreatedAt).ToListAsync(ct)` (default ordering "Más reciente" per Story 2.6 default). The `ILIKE` uses Npgsql's `EF.Functions.ILike` extension — the `pg_trgm` GIN index makes both predicates indexable.
  - [ ] `GetByIdAsync` uses `AsNoTracking().SingleOrDefaultAsync(c => c.Id == id, ct)`.
  - [ ] `ExistsByNitAsync(string nit, CancellationToken ct)` uses `AsNoTracking().AnyAsync(c => c.Nit == nit, ct)`.
  - [ ] `AddAsync` / `UpdateAsync` / `DeleteAsync` use `_db.Clientes.Add` / `Update` / `Remove` + `await _db.SaveChangesAsync(ct)`.
  - [ ] Remove `.gitkeep` from `Infrastructure/Repositories/`.
  - [ ] Register the repository in `InfrastructureServiceCollectionExtensions.AddInfrastructure`: `services.AddScoped<IClienteRepository, ClienteRepository>();`.

- [ ] **Task 5 — Backend: Application layer query (CQRS)** (AC: #2)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` as a record `public sealed record GetClientesQuery(string? Search)`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` exposing `Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct)` that delegates to `IClienteRepository.GetAllAsync` and maps each `ClienteEntity` to `ClienteDto`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` as a record with all fields listed in AC #2 (camelCase JSON via .NET defaults).
  - [ ] Register the handler in `InfrastructureServiceCollectionExtensions` (or a new `ApplicationServiceCollectionExtensions` if it doesn't exist — create it under `SiesaAgents.Application/ApplicationServiceCollectionExtensions.cs` and call it from `Program.cs` alongside `AddInfrastructure`).
  - [ ] Remove `.gitkeep` from `Application/Clientes/`.

- [ ] **Task 6 — Backend: Minimal API endpoint** (AC: #2)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` exposing a static `MapClienteEndpoints(this IEndpointRouteBuilder)` method.
  - [ ] Register the route group `app.MapGroup("/api/v1/clientes")` and add `MapGet("/", async (string? search, GetClientesQueryHandler handler, CancellationToken ct) => Results.Ok(await handler.HandleAsync(new GetClientesQuery(search), ct))).WithName("GetClientes").WithOpenApi();`.
  - [ ] Wire `app.MapClienteEndpoints();` in `Program.cs` AFTER `app.UseCors("DevCors")` and BEFORE `app.Run()`.

- [ ] **Task 7 — Backend: EF Core migration** (AC: #1)
  - [ ] Run `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Migrations` from `backend/`.
  - [ ] Inspect the generated migration to confirm: `CreateTable("clientes")` with all snake_case columns, `pk_clientes` primary key, `uk_clientes_nit` unique index, `ix_clientes_nombre_trgm` GIN index using `gin_trgm_ops`, and that the migration also issues `migrationBuilder.AlterDatabase(...).Annotation("Npgsql:PostgresExtension:pg_trgm", ",,")` (the EF Core 10 + Npgsql way of declaring the extension).
  - [ ] If `dotnet ef` is unavailable in the sandbox, author the migration files manually using the Story 1.3 pattern. Validate by an integration test (Task 9) that boots a Postgres 18 Testcontainer and asserts the schema.

- [ ] **Task 8 — Backend: Validators stub** (AC: #1)
  - [ ] Add an empty `backend/src/SiesaAgents.Application/Clientes/Validators/.gitkeep` so the directory pre-exists for Stories 2.3/2.4. No validator class is created in this story (no write endpoints).

- [ ] **Task 9 — Backend: Integration & unit tests** (AC: #1, #2)
  - [ ] **Unit (xUnit, no DB):** `tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` — `Create` accepts valid inputs, throws on null/empty/whitespace for each required field, enforces length caps, sets `CreatedAt`/`UpdatedAt` to `DateTimeOffset.UtcNow`.
  - [ ] **Unit (xUnit, no DB):** `tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — mocks `IClienteRepository`, asserts the handler delegates `Search` correctly and maps to `ClienteDto`.
  - [ ] **Integration (xUnit + Testcontainers Postgres 18):** `tests/SiesaAgents.IntegrationTests/Api/ClientesEndpointTests.cs` — boots `WebApplicationFactory<Program>` over a Testcontainers Postgres, applies migrations via `MigrateAsync`, then:
    - `GET /api/v1/clientes` on an empty DB returns `200` and body `[]`.
    - After seeding 3 clients via the DbContext, `GET /api/v1/clientes` returns 3 items in `createdAt`-desc order.
    - `GET /api/v1/clientes?search=acme` filters case-insensitively on both `nombre` and `nit` (seed one client whose `nit` matches, assert it's returned).
    - Content-Type is `application/json` and each item's keys are camelCase (`id`, `nombre`, `nitRuc`, …).
  - [ ] **Integration (TC-E2-P0-04 — API leg):** `tests/SiesaAgents.IntegrationTests/Api/ClientesSearchPerformanceTests.cs` — seeds 500 clients (Bogus / Faker.NET), then runs 20 iterations of `GET /api/v1/clientes?search=<random fragment>`; assert p95 < 1000ms (NFR1, R3). Use `Stopwatch` and a sorted-array p95.
  - [ ] **Integration (schema):** `tests/SiesaAgents.IntegrationTests/Data/ClientesSchemaTests.cs` — boots a Postgres Testcontainer, applies migrations, then queries `information_schema.columns` and `pg_indexes` to assert: table `clientes` exists, all columns are snake_case, `uk_clientes_nit` UNIQUE index exists, `ix_clientes_nombre_trgm` GIN index exists, `pg_trgm` extension is installed.

- [ ] **Task 10 — Frontend: Domain types** (AC: #3-#7)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` exporting `interface Cliente { id: string; nombre: string; nitRuc: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string }` (mirrors backend `ClienteDto`; dates are ISO 8601 strings).
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` exporting `interface IClienteRepository { getAll(search?: string): Promise<Cliente[]> }` (only the read contract — write methods are added in 2.3/2.4/2.5).

- [ ] **Task 11 — Frontend: Infrastructure repository** (AC: #6)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` exporting `clienteApiRepository: IClienteRepository` that calls `apiClient.get<Cliente[]>('/api/v1/clientes', { params: search ? { search } : undefined }).then(r => r.data)`.
  - [ ] No Story 2.1 code uses the `search` query param (we filter client-side), but expose it on the repo so the contract is complete.

- [ ] **Task 12 — Frontend: TanStack Query hook** (AC: #4, #6, #7)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` exporting a `useClientes()` hook that wraps `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`.
  - [ ] Return shape from the hook MUST expose at least `data`, `status`, `error`, `refetch` so that consumers can drive the loading / empty / error / success branches.
  - [ ] No `staleTime` override here — inherits the 60s default from `queryClient.ts`.

- [ ] **Task 13 — Frontend: Shared components — `EmptyState`** (AC: #5)
  - [ ] Create `frontend/src/shared/components/EmptyState/EmptyState.tsx` accepting `{ variant: 'no-clients' | 'search-empty' | 'no-contacts'; onAction?: () => void }` (other variants are stubbed for Stories 2.3 and Epic 3).
  - [ ] Map variant → `{ title, subtitle, ctaLabel? }` per the UX spec table. Render Heroicon `UsersIcon` for `no-clients`, `MagnifyingGlassIcon` for `search-empty`.
  - [ ] Wrap content in `<div role="status" aria-live="polite">`.
  - [ ] If `ctaLabel` and `onAction` are both provided, render a siesa-ui-kit `<Button variant="outline">{ctaLabel}</Button>`. (Story 2.1 wires `no-clients` to a no-op `onAction`; Story 2.3 replaces it with the real "Nuevo cliente" handler.)
  - [ ] Export `EmptyState` from a barrel file `frontend/src/shared/components/EmptyState/index.ts`.
  - [ ] Add colocated `EmptyState.test.tsx` asserting title/subtitle copy per variant and CTA visibility.

- [ ] **Task 14 — Frontend: Shared components — `ErrorPanel`** (AC: #6)
  - [ ] Create `frontend/src/shared/components/ErrorPanel/ErrorPanel.tsx` accepting `{ onRetry: () => void }`. Props MUST NOT accept the underlying error object (NFR6 — components have no way to leak technical detail).
  - [ ] Render: icon (`ExclamationTriangleIcon` Heroicon), `<h2>"No pudimos cargar los clientes"</h2>`, `<p>"Verifica tu conexión e intenta nuevamente"</p>`, `<Button onClick={onRetry}>Reintentar</Button>` (siesa-ui-kit `Button`).
  - [ ] Add colocated `ErrorPanel.test.tsx` asserting the exact copy and that clicking "Reintentar" calls `onRetry` exactly once.
  - [ ] Export from `frontend/src/shared/components/ErrorPanel/index.ts`.

- [ ] **Task 15 — Frontend: Shared components — `ClientListItem`** (AC: #3)
  - [ ] Create `frontend/src/shared/components/ClientListItem/ClientListItem.tsx` accepting `{ cliente: Cliente; isSelected: boolean; onSelect: (id: string) => void }`.
  - [ ] Render a `<button>` (NOT a `<div>` — accessibility) with `aria-label={`Ver cliente: ${cliente.nombre}`}`, `data-testid={`client-list-item-${cliente.id}`}`, `aria-current={isSelected ? 'true' : undefined}`.
  - [ ] Visual: full width, vertical padding `py-3 px-4`, border-bottom `border-slate-200`. When `isSelected`: `bg-primary-50` + `border-l-[3px] border-l-primary-600`. On hover: `bg-slate-50`.
  - [ ] Inside, show `<span class="font-medium">{nombre}</span>` and `<span class="text-sm text-muted-foreground">{nitRuc}</span>` stacked vertically.
  - [ ] No badges (contact-count, ⚠) in Story 2.1 — those land in Epic 4.
  - [ ] Add colocated `ClientListItem.test.tsx` asserting render output, accessibility attributes, and click handler.

- [ ] **Task 16 — Frontend: Presentation layer — `ClienteListView`** (AC: #3, #4, #5, #6, #7)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`.
  - [ ] Local state: `const [searchQuery, setSearchQuery] = useState('')` and `const [debounced] = useState(...)` (use a simple `useDeferredValue` or a 150ms `useEffect`-based debounce — pick the one that is testable). The debounce MUST be 150ms.
  - [ ] Selected-id state comes from the route — read `useParams({ strict: false })` (TanStack Router) so the same component works on `/clientes` and `/clientes/$clienteId` (Story 2.2). On `/clientes` (no id), nothing is highlighted.
  - [ ] Call `const { data, status, error, refetch } = useClientes()`.
  - [ ] Build `const filtered = useMemo(...)` over `data ?? []`, predicate `nombre.toLowerCase().includes(q) || nitRuc.toLowerCase().includes(q)`.
  - [ ] Render branches in order:
    1. `status === 'pending'` → 5 `react-loading-skeleton` items inside a `<div role="status" aria-busy="true" aria-label="Cargando clientes">`.
    2. `status === 'error'` → `<ErrorPanel onRetry={refetch} />`.
    3. `data && data.length === 0` → `<EmptyState variant="no-clients" onAction={() => {/* no-op in 2.1 */}} />`.
    4. `filtered.length === 0` (cache non-empty, search-narrowed) → `<EmptyState variant="search-empty" />`.
    5. Else → render the list of `<ClientListItem>` items inside a `<ul role="listbox" aria-label="Lista de clientes">`.
  - [ ] Wrap the entire panel in `<aside data-testid="client-list-panel" class="w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white">…</aside>` — the `w-[280px]` is exact, per Story 2.1 AC1 and TC-E2-P1-08.
  - [ ] The `Input` search component is siesa-ui-kit `Input` with `placeholder="Buscar por nombre o NIT/RUC"`, `aria-label="Buscar clientes"`, `data-testid="client-search-input"`. It sits sticky at the top of the aside (`sticky top-0 bg-white p-3 z-10`).
  - [ ] On `<ClientListItem onSelect={id => navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })}>` — but in Story 2.1 the route `/clientes/$clienteId` doesn't exist yet (Story 2.2 introduces it). Workaround: for now, navigate to `/clientes` with a search param `?selected={id}`. Selection visual highlight is driven by `selected === item.id` comparing against the search param. (This is the simplest forward-compatible path — Story 2.2 will lift the selection into a real route param.) Document this in Completion Notes if the implementer chooses differently.

- [ ] **Task 17 — Frontend: Wire `ClienteListView` into the `/clientes` route** (AC: #3)
  - [ ] Replace `frontend/src/routes/clientes.tsx` body with a 2-pane layout:
    ```tsx
    function ClientesPage() {
      return (
        <div className="flex h-[calc(100vh-64px)]">
          <ClienteListView />
          <section className="flex-1 p-6">
            <p className="text-muted-foreground">Selecciona un cliente para ver sus detalles</p>
          </section>
        </div>
      )
    }
    ```
    (The right-pane placeholder is intentional — the real detail view ships in Story 2.2.)
  - [ ] Import path: `import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'`. If the `@` alias isn't configured yet, use the relative path; check `vite.config.ts` to confirm.

- [ ] **Task 18 — Frontend: MSW handlers + component tests** (AC: #3-#7)
  - [ ] Create `frontend/src/mocks/handlers/clientes.ts` exporting a `clienteHandlers` factory (default: 3-client list) and a 500-record fixture for NFR1 (`clienteHandlers500`).
  - [ ] Create `frontend/src/mocks/server.ts` (if it doesn't exist) using `setupServer` from MSW; wire it in `frontend/src/test-setup.ts` via `beforeAll(() => server.listen())`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`.
  - [ ] Colocate tests next to the source files (`ClienteListView.test.tsx`, `useClientes.test.tsx`).
  - [ ] Test cases to author (P0/P1 from `test-design-epic-2.md`):
    - TC-E2-P1-08 — left panel computed width is exactly `280px` (use `getComputedStyle` in jsdom or a JS check on the `width` style/class — verify via the rendered class `w-[280px]` and/or `getBoundingClientRect` if available).
    - TC-E2-P2-01 — backend returns `[]` → `EmptyState` variant `no-clients` renders.
    - TC-E2-P1-07 — initial GET fails with 500 → `ErrorPanel` renders → reconfigure handler to return 200 → click "Reintentar" → list renders, `ErrorPanel` gone. Assert `refetch` was called.
    - TC-E2-P2-04 — search filter matches both `nombre` and `nitRuc` (case-insensitive, partial). MSW spy: assert NO additional `GET /api/v1/clientes` requests fire when the user types.
    - TC-E2-P0-04 (UI leg) — render with the 500-record fixture, programmatically type, measure time-to-render with `performance.now()`; assert `< 1000ms` (NFR1; target < 200ms after debounce).
    - Skeleton-on-pending — render with a delayed handler, assert 5 skeleton items with `role="status"` are visible during the pending state.
  - [ ] Add an `ErrorPanel.test.tsx` and `EmptyState.test.tsx` per Tasks 13/14.
  - [ ] Run `pnpm test` from `frontend/`; all colocated tests must pass before marking the story `review`.

- [ ] **Task 19 — Frontend: Lint + build gate** (AC: all)
  - [ ] `pnpm exec tsc -b` exits 0 (TypeScript strict, no `any`).
  - [ ] `pnpm run lint` exits 0 (oxlint; allow only the `only-export-components` warnings that already exist on TanStack route files).
  - [ ] `pnpm run build` produces `dist/` with the main JS bundle under 500 KB gzipped (company budget).

- [ ] **Task 20 — Backend build + test gate** (AC: #1, #2)
  - [ ] `dotnet build backend/SiesaAgents.sln` exits 0 with zero warnings.
  - [ ] `dotnet test backend/SiesaAgents.sln` — all unit and integration tests pass (including the new `ClientesEndpointTests`, `ClientesSearchPerformanceTests`, `ClientesSchemaTests`, `ClienteEntityTests`, `GetClientesQueryHandlerTests`).
  - [ ] `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/` produces a `clientes` table on a local PostgreSQL 18 instance (Docker one-liner from `backend/README.md`). If `dotnet ef` is unavailable in the sandbox, document it in Completion Notes — `MigrationsIntegrationTests` already covers `MigrateAsync` against a Testcontainer in CI.

## Dev Notes

### Architectural placement — Clean Architecture + DDD

This story spans **both** the **backend** (Domain + Application + Infrastructure + API layers, all four layers touched) and the **frontend** (Domain + Application + Infrastructure + Presentation + Shared layers).

**Backend new/modified files** (per architecture.md §Complete Project Directory Structure):
- `Domain/Clientes/Entities/ClienteEntity.cs` — NEW (sealed, private ctor + `Create` factory + `Update` method, `DateTimeOffset`, `Guid` PK)
- `Domain/Clientes/Interfaces/IClienteRepository.cs` — NEW (full read+write contract)
- `Infrastructure/Data/Configurations/ClienteConfiguration.cs` — NEW (table mapping + unique NIT + GIN trigram index)
- `Infrastructure/Data/AppDbContext.cs` — MODIFY (add `DbSet<ClienteEntity>` + register `pg_trgm` extension)
- `Infrastructure/Repositories/ClienteRepository.cs` — NEW (EF Core implementation, `AsNoTracking` reads, ILIKE search)
- `Infrastructure/InfrastructureServiceCollectionExtensions.cs` — MODIFY (register repository)
- `Infrastructure/Migrations/{timestamp}_AddClientesTable.cs` — NEW (auto-generated)
- `Application/Clientes/Queries/GetClientesQuery.cs` + `GetClientesQueryHandler.cs` — NEW (CQRS read side)
- `Application/Clientes/DTOs/ClienteDto.cs` — NEW
- `Application/ApplicationServiceCollectionExtensions.cs` — NEW (optional; or fold into `AddInfrastructure`)
- `API/Endpoints/ClienteEndpoints.cs` — NEW (`MapGet /api/v1/clientes`)
- `API/Program.cs` — MODIFY (call `app.MapClienteEndpoints()`)

**Frontend new/modified files**:
- `modules/crm/clientes/domain/Cliente.ts` — NEW (entity interface)
- `modules/crm/clientes/domain/IClienteRepository.ts` — NEW (read contract)
- `modules/crm/clientes/infrastructure/clienteApiRepository.ts` — NEW (Axios)
- `modules/crm/clientes/application/useClientes.ts` — NEW (TanStack Query)
- `modules/crm/clientes/presentation/ClienteListView.tsx` — NEW
- `shared/components/EmptyState/EmptyState.tsx` (+ `index.ts` + test) — NEW
- `shared/components/ErrorPanel/ErrorPanel.tsx` (+ `index.ts` + test) — NEW
- `shared/components/ClientListItem/ClientListItem.tsx` (+ `index.ts` + test) — NEW
- `routes/clientes.tsx` — MODIFY (drop placeholder, mount `ClienteListView` + right-pane placeholder)
- `mocks/handlers/clientes.ts` + `mocks/server.ts` — NEW (MSW handlers + server)
- `test-setup.ts` — MODIFY (wire MSW server lifecycle)

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory) — already installed at `^1.0.245`.
- **Install**: NO new install needed — `siesa-ui-kit`, `@heroicons/react`, `react-loading-skeleton` are already runtime dependencies (`frontend/package.json`).
- **Usage**: You MUST use `siesa-ui-kit` components for `Input` (search) and `Button` (Reintentar / Nuevo cliente CTA). The `Card`, `Badge`, `Avatar`, `DescriptionList`, `Dropdown` exports are also available — do NOT replicate them.
- **`MasterCrud` is NOT used in Story 2.1.** Although `MasterCrud` is the standard CRUD orchestrator for siesa-ui-kit, the UX direction for Siesa-Agents is the dual-panel layout (list 280px + detail flex) per `architecture.md §Frontend Architecture` and `ux-design-specification.md §Phase 2`. `MasterCrud` would replace the entire layout with its own table+form shell and conflict with that decision. Document the override here: **Architecture-level decision overrides MasterCrud default. Custom dual-panel composition + `ClientListItem` is intentional.**
- **Custom components** (`EmptyState`, `ErrorPanel`, `ClientListItem`) are explicitly authorized by the UX spec (§Custom Components — Priority 3) and are built by composing siesa-ui-kit + Heroicons + Tailwind. NO hardcoded hex colors — use Tailwind token classes (`bg-primary-50`, `text-muted-foreground`, `border-slate-200`, etc.).
- **All user-facing text in Spanish**: "Buscar por nombre o NIT/RUC", "Cargando clientes", "No hay clientes registrados", "Crea el primer cliente del sistema", "Nuevo cliente", "No se encontró ningún cliente", "Intenta con otro nombre o NIT", "No pudimos cargar los clientes", "Verifica tu conexión e intenta nuevamente", "Reintentar", "Selecciona un cliente para ver sus detalles", "Ver cliente: {nombre}", "Lista de clientes". Code identifiers stay in English.
- **WCAG 2.1 AA**: `aria-label` on every interactive element, visible focus rings (Siesa tokens already comply), tap targets ≥ 44×44 px on mobile (test against `min-h-[44px]` on `ClientListItem`).

### Search & filter strategy (architecture decision)

Per `architecture.md §Data Architecture > Search Strategy`:
- The frontend fires ONE `GET /api/v1/clientes` (no `search` param) on mount → result cached by `queryKey: ['clientes']`.
- All filtering is done **client-side in `useMemo`** over the cached array — the backend `?search=` endpoint exists as a fallback and is exercised by the API integration tests but is NOT used by the frontend Story 2.1 flow.
- Rationale: NFR10 caps the dataset at 500 records; client-side `useMemo` filter runs in < 50ms on that volume. This eliminates network round-trip latency from the search UX.

### Performance budget enforcement

NFR1 requires `< 1s` from keystroke to rendered filtered list with 500 records.
- **Frontend**: 150ms debounce + `useMemo` predicate + React's automatic re-render batching. Target: `< 200ms` p95.
- **Backend**: `pg_trgm` GIN index on `nombre` + B-tree implicit on `nit` (via unique index) makes `ILIKE '%fragment%'` p95 `< 1s` at 500 rows. Verified by `ClientesSearchPerformanceTests` (TC-E2-P0-04 API leg).

If the UI test sometimes exceeds `< 1000ms` in CI under heavy load, treat it as a flake threshold but do NOT raise the budget — investigate render path (avoid list virtualization until needed; React 19 is already in use, no extra optimization required at 500 rows).

### Error handling — strict NFR6 contract

- **Backend**: `ExceptionHandlingMiddleware` (Story 1.3) returns Problem Details RFC 7807 with `detail = null` — already conformant. Story 2.1 does NOT add new error mappers; the duplicate-NIT 409 mapping is the only one Story 2.3 will add. For `GET /api/v1/clientes` failures (unlikely beyond DB connectivity), the existing 500 Problem Details response is used.
- **Frontend**: `ErrorPanel` is the ONLY surface for load-time errors and MUST NOT receive an error object. Component types prevent leakage by construction: `ErrorPanelProps = { onRetry: () => void }`. Network errors during the initial GET are surfaced to the user with generic Spanish copy ("Verifica tu conexión…"). Toasts are reserved for mutation errors (Stories 2.3/2.4/2.5).

### Anti-patterns to avoid

```
DateTime in entities                       → DateTimeOffset (MANDATORY — Story 1.3 contract reaffirmed)
PascalCase column names                    → snake_case via ApplySnakeCaseNaming() (already configured)
Storing search query in Zustand            → local useState (URL is source of truth for routing; search is ephemeral)
Server-side pagination in 2.1              → NOT in scope; NFR10 cap is 500 records
Generic <div> for ClientListItem           → <button> with role + aria-label (a11y mandate)
react-loading-skeleton spinner             → ALWAYS skeletons, never spinners (company UX rule)
Hardcoded hex colors                       → Tailwind tokens (primary-50, slate-200, …)
Leaking error.message to UI                → ErrorPanel never receives the error object
Forced fetch on every keystroke            → Client-side useMemo filter — assert via MSW spy
ContactManager / MasterCrud composition    → N/A in 2.1; custom dual-panel is the architecture decision
```

### Testing standards

- **Backend** (xUnit per company-standards.md):
  - Unit tests for `ClienteEntity` factory rules and `GetClientesQueryHandler` (mocked repository).
  - Integration tests via `WebApplicationFactory<Program>` + Testcontainers Postgres 18 (pattern from Story 1.3's `MigrationsIntegrationTests`).
  - Performance test seeds 500 clients via Bogus, `Stopwatch`-measured p95 across 20 iterations < 1000ms (NFR1).
  - Coverage target > 80%.
- **Frontend** (Vitest + RTL + MSW + jsdom):
  - Component tests colocated with the source file.
  - MSW server lifecycle wired via `setupFiles` (`test-setup.ts`).
  - Performance assertion in jsdom uses `performance.now()` around the input-event → filtered-render boundary.
  - Layout assertion for the 280px panel uses the rendered class `w-[280px]` + `getBoundingClientRect()`.
  - E2E tests (TC-E2-P0-04 UI leg + TC-E2-P2-04) live alongside the existing Playwright suite under `e2e/tests/clientes/`; execution stays blocked until the workspace-root Playwright runner is installed (same gap noted in Story 1.2). The component-level coverage above is the gate for Story 2.1.

### Test-design alignment

| TC ID | Level | AC | File(s) |
|-------|-------|-----|---------|
| TC-E2-P0-04 (API leg) | API Integration | #2 | `ClientesSearchPerformanceTests.cs` |
| TC-E2-P0-04 (UI leg)  | Component | #4 | `ClienteListView.test.tsx` |
| TC-E2-P1-07 | Component | #6 | `ClienteListView.test.tsx` (refetch path) |
| TC-E2-P1-08 | Component | #3 | `ClienteListView.test.tsx` (panel-width assertion) |
| TC-E2-P2-01 | Component | #5 | `ClienteListView.test.tsx` (EmptyState `no-clients`) |
| TC-E2-P2-04 (unit + component) | Unit / Component | #4 | filter-predicate test + `ClienteListView.test.tsx` |

All Story 2.1 P0/P1/P2 tests scoped to the list+search view are covered.

### Project Structure Notes — files in scope

```
backend/
├── src/
│   ├── SiesaAgents.Domain/
│   │   └── Clientes/
│   │       ├── Entities/ClienteEntity.cs                          ← NEW
│   │       └── Interfaces/IClienteRepository.cs                   ← NEW
│   ├── SiesaAgents.Application/
│   │   ├── ApplicationServiceCollectionExtensions.cs              ← NEW (optional, see Task 5)
│   │   └── Clientes/
│   │       ├── DTOs/ClienteDto.cs                                 ← NEW
│   │       ├── Queries/GetClientesQuery.cs                        ← NEW
│   │       ├── Queries/GetClientesQueryHandler.cs                 ← NEW
│   │       └── Validators/.gitkeep                                ← NEW (placeholder for 2.3/2.4)
│   ├── SiesaAgents.Infrastructure/
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs                                    ← MODIFY (DbSet + pg_trgm)
│   │   │   └── Configurations/ClienteConfiguration.cs             ← NEW
│   │   ├── Migrations/{ts}_AddClientesTable.cs                    ← NEW
│   │   ├── Migrations/AppDbContextModelSnapshot.cs                ← MODIFY (auto-update)
│   │   ├── Repositories/ClienteRepository.cs                      ← NEW
│   │   └── InfrastructureServiceCollectionExtensions.cs           ← MODIFY (register repo)
│   └── SiesaAgents.API/
│       ├── Endpoints/ClienteEndpoints.cs                          ← NEW
│       └── Program.cs                                              ← MODIFY (MapClienteEndpoints)
└── tests/
    ├── SiesaAgents.UnitTests/
    │   ├── Domain/ClienteEntityTests.cs                           ← NEW
    │   └── Application/Clientes/GetClientesQueryHandlerTests.cs   ← NEW
    └── SiesaAgents.IntegrationTests/
        ├── Api/ClientesEndpointTests.cs                           ← NEW
        ├── Api/ClientesSearchPerformanceTests.cs                  ← NEW
        └── Data/ClientesSchemaTests.cs                            ← NEW

frontend/
├── src/
│   ├── modules/crm/clientes/
│   │   ├── domain/Cliente.ts                                       ← NEW
│   │   ├── domain/IClienteRepository.ts                            ← NEW
│   │   ├── application/useClientes.ts                              ← NEW
│   │   ├── application/useClientes.test.ts                        ← NEW
│   │   ├── infrastructure/clienteApiRepository.ts                  ← NEW
│   │   ├── infrastructure/clienteApiRepository.test.ts            ← NEW
│   │   └── presentation/
│   │       ├── ClienteListView.tsx                                 ← NEW
│   │       └── ClienteListView.test.tsx                            ← NEW
│   ├── shared/components/
│   │   ├── EmptyState/EmptyState.tsx                               ← NEW
│   │   ├── EmptyState/EmptyState.test.tsx                          ← NEW
│   │   ├── EmptyState/index.ts                                     ← NEW
│   │   ├── ErrorPanel/ErrorPanel.tsx                               ← NEW
│   │   ├── ErrorPanel/ErrorPanel.test.tsx                          ← NEW
│   │   ├── ErrorPanel/index.ts                                     ← NEW
│   │   ├── ClientListItem/ClientListItem.tsx                       ← NEW
│   │   ├── ClientListItem/ClientListItem.test.tsx                  ← NEW
│   │   └── ClientListItem/index.ts                                 ← NEW
│   ├── mocks/
│   │   ├── handlers/clientes.ts                                    ← NEW
│   │   └── server.ts                                                ← NEW
│   ├── routes/clientes.tsx                                          ← MODIFY (mount ClienteListView)
│   └── test-setup.ts                                                ← MODIFY (MSW lifecycle)
```

**Conflict check vs. existing files:**
- `frontend/src/routes/clientes.tsx` is the placeholder from Story 1.2 — explicitly modified here. No deletion of Story 1.2 routes.
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` is modified additively (adds `DbSet<ClienteEntity>` + `pg_trgm` extension). The mandatory `ApplySnakeCaseNaming()`-last rule from Story 1.3 is preserved.
- `backend/src/SiesaAgents.Infrastructure/InfrastructureServiceCollectionExtensions.cs` is modified additively (adds `services.AddScoped<IClienteRepository, ClienteRepository>()`).
- `backend/src/SiesaAgents.API/Program.cs` is modified additively (calls `app.MapClienteEndpoints()` before `app.Run()`).

**Detected variance vs. architecture.md §Frontend folder structure:** Architecture references `_app/clientes.$clienteId.tsx` (pathless layout group). Story 1.2 chose the flat layout (`clientes.tsx` at the top level) and documented the variance. Story 2.1 inherits that choice — no `_app` layout group is introduced. Future stories that need per-section auth boundaries (out of MVP scope) can lift the shell into `_app.tsx` later.

### References

- Epic source (Story 2.1 + scope note inheriting the `clientes` table from 1.3): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture — dual-panel layout, query keys, search strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — data model (Cliente entity shape, `clientes` table columns): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Architecture — naming patterns (snake_case, UUID PKs, `DateTimeOffset`): [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Architecture — REST endpoints inventory: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- UX spec — Phase 2 client list panel + EmptyState variants + ClientListItem: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Phase 2 — Client list panel (280px)]
- UX spec — siesa-ui-kit priority hierarchy + Custom components decision: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Implementation Strategy]
- PRD NFR1 (search < 1s, 500 records): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR1]
- PRD NFR6 (no internal detail leakage): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- PRD FRs FR1/FR2/FR3 (list + search by name/NIT): [Source: _bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md]
- Test design Epic 2 (TC-E2-P0-04, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P2-01, TC-E2-P2-04, R3, R8, R12): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Story 1.2 baseline (frontend routing + LayoutBase + clientes route placeholder): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]
- Story 1.3 baseline (AppDbContext + `ApplySnakeCaseNaming()` last + empty initial migration + scope note deferring `clientes` table to 2.1): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- Company standards — Clean Architecture + DDD + stack versions + DB conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — `MasterCrud` API contract (NOT used in 2.1, see UI requirements override): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
