# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients with `Nombre` and `NIT/RUC` visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose `Nombre` or `NIT/RUC` match the input (case-insensitive), **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed inside the left panel with a Spanish-language message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component is displayed inside the left panel with a "Reintentar" button that triggers a refetch.

5. **Given** the backend `GET /api/v1/clientes` endpoint is called, **When** it responds successfully, **Then** it returns a JSON array of client objects, each with `id` (UUID), `nombre`, `nitRuc`, `telefono`, `ciudad`, and `creadoEn` (ISO 8601 DateTimeOffset).

6. **Given** the `clientes` table does not exist in the database, **When** `dotnet ef database update` is run, **Then** the migration creates the `clientes` table with columns: `id` (uuid PK), `nombre` (varchar, NOT NULL), `nit_ruc` (varchar, NOT NULL, unique), `telefono` (varchar), `ciudad` (varchar), `creado_en` (timestamptz NOT NULL), and the unique index `uk_clientes_nit_ruc`.

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1 — Define `ClienteEntity` in Domain layer (AC: #5, #6)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Properties: `Guid Id` (set in base or private set, default `Guid.NewGuid()`), `string Nombre`, `string NitRuc`, `string? Telefono`, `string? Ciudad`, `DateTimeOffset CreadoEn` — NEVER `DateTime`
  - [ ] Private constructor + static `Create(string nombre, string nitRuc, string? telefono, string? ciudad)` factory method that sets `CreadoEn = DateTimeOffset.UtcNow`
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)` method

- [ ] Task 2 — Create `ClienteDto` and `GetClientesQuery` in Application layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` with `Guid Id`, `string Nombre`, `string NitRuc`, `string? Telefono`, `string? Ciudad`, `DateTimeOffset CreadoEn`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (record or class, no parameters)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — injects `IClienteRepository`, calls `GetAllAsync`, maps to `IEnumerable<ClienteDto>`, returns it

- [ ] Task 3 — EF Core Infrastructure: `ClienteConfiguration` + `AppDbContext` `DbSet` + Migration (AC: #6)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`
    - [ ] Table: `clientes` (explicit via `.ToTable("clientes")` for clarity, though snake_case naming will also apply)
    - [ ] `Id` → UUID PK, `HasDefaultValueSql("gen_random_uuid()")` is optional since entity sets it
    - [ ] `Nombre` → required, `HasMaxLength(200)`
    - [ ] `NitRuc` → required, `HasMaxLength(50)`, unique index `uk_clientes_nit_ruc`
    - [ ] `Telefono` → optional, `HasMaxLength(50)`
    - [ ] `Ciudad` → optional, `HasMaxLength(100)`
    - [ ] `CreadoEn` → required, maps to `creado_en` (auto via snake_case naming convention)
  - [ ] Add `public DbSet<ClienteEntity> Clientes { get; set; }` to `AppDbContext.cs`
  - [ ] Register `ClienteConfiguration` in `OnModelCreating` via `modelBuilder.ApplyConfigurationsFromAssembly(...)` (already present — no change needed)
  - [ ] Run `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [ ] Verify migration creates `clientes` table with all columns and `uk_clientes_nit_ruc` unique index

- [ ] Task 4 — `ClienteRepository` in Infrastructure layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`
  - [ ] Inject `AppDbContext`; implement `GetAllAsync`: `return await _context.Clientes.AsNoTracking().ToListAsync(ct)`
  - [ ] Register `IClienteRepository → ClienteRepository` as scoped in `Program.cs`: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`

- [ ] Task 5 — `GET /api/v1/clientes` Minimal API endpoint (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Define extension method `MapClienteEndpoints(this WebApplication app)`
  - [ ] Register: `app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) => Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)))`
  - [ ] Call `app.MapClienteEndpoints()` in `Program.cs` after `var app = builder.Build()`
  - [ ] Verify response is `200 OK` with `Content-Type: application/json` and a JSON array (direct array, no wrapper object per architecture contract)

- [ ] Task 6 — Backend unit tests for `GetClientesQueryHandler` (AC: #5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
  - [ ] Mock `IClienteRepository` using `NSubstitute` or `Moq`; assert handler maps entities to `ClienteDto` correctly
  - [ ] Test: empty repository → returns empty list; repository with 2 clients → returns 2 DTOs with correct field mapping
  - [ ] Run `dotnet test` — all tests pass (extend existing suite, no regressions)

### Frontend Tasks

- [ ] Task 7 — Define `Cliente` domain entity and repository interface (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `id: string`, `nombre: string`, `nitRuc: string`, `telefono?: string`, `ciudad?: string`, `creadoEn: string` (ISO 8601 string)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`

- [ ] Task 8 — Create `clienteApiRepository` in infrastructure layer (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Import `apiClient` from `src/shared/lib/apiClient.ts` (Axios instance already established in Story 1.1)
  - [ ] Implement `IClienteRepository.getAll`: `const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes'); return data`

- [ ] Task 9 — Create `useClientes` TanStack Query hook (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Use `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`
  - [ ] Export `{ data: clientes, isLoading, isError, refetch }` — consumers use these to drive UI states

- [ ] Task 10 — Create `ClienteListItem` shared component (AC: #1)
  - [ ] Create `frontend/src/shared/components/ClienteListItem.tsx`
  - [ ] Props: `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`
  - [ ] Render: `nombre` as primary text, `nitRuc` as secondary text below it, highlight when `isSelected`
  - [ ] Use siesa-ui-kit components if a list item / card primitive is available; otherwise build with TailwindCSS
  - [ ] Tailwind classes for selected state: `bg-blue-50 border-l-4 border-[#0e79fd]` (Siesa Blue)
  - [ ] WCAG 2.1 AA: minimum touch target 44×44px, `role="button"`, `aria-selected={isSelected}`, `aria-label` with client name

- [ ] Task 11 — Create `EmptyState` shared component (AC: #3)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` (reusable for Clientes and Contactos)
  - [ ] Props: `message: string`, `description?: string`
  - [ ] Render a centered layout with a Heroicon (e.g., `UserGroupIcon`) and the provided `message` in Spanish
  - [ ] This component is reused across Epic 2 and Epic 3

- [ ] Task 12 — Create `ErrorPanel` shared component (AC: #4)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` (reusable)
  - [ ] Props: `onRetry: () => void`
  - [ ] Render an error message in Spanish (e.g., "No se pudo cargar la información") and a "Reintentar" button that calls `onRetry`
  - [ ] Use Heroicon `ExclamationTriangleIcon` for visual indicator

- [ ] Task 13 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Fixed width 280px, `overflow-y-auto`, full height panel
  - [ ] Include a search `<input>` field with `placeholder="Buscar por nombre o NIT/RUC"` and `aria-label="Buscar clientes"`
  - [ ] Local state: `const [searchQuery, setSearchQuery] = useState('')`
  - [ ] Use `useMemo` to filter `clientes` array client-side: match `nombre` or `nitRuc` against `searchQuery` (case-insensitive via `.toLowerCase()`) — NFR1 compliance (< 50ms for 500 records)
  - [ ] Render states:
    - `isLoading`: render skeleton placeholders using `react-loading-skeleton` (3–5 rows) — NOT spinners
    - `isError`: render `<ErrorPanel onRetry={refetch} />`
    - filtered list empty (search with no matches): render `<EmptyState message="No se encontraron clientes" />`
    - no clients at all (data is empty array): render `<EmptyState message="Aún no hay clientes registrados" description="Crea el primer cliente para comenzar" />`
    - otherwise: render scrollable list of `<ClienteListItem>` components

- [ ] Task 14 — Wire `ClienteListView` into the `/clientes` route (AC: #1, #2, #3, #4)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — replace placeholder component with a layout that renders `<ClienteListView>` in the left 280px panel
  - [ ] Right panel: render a placeholder `<div>` (detail panel — implemented in Story 2.2)
  - [ ] Layout: `<div className="flex h-full">` with `<ClienteListView className="w-[280px] shrink-0" />` and `<div className="flex-1">` for the detail area
  - [ ] Wrap the route component inside `<QueryClientProvider>` if not already provided by `src/app/providers/` (verify from Story 1.1 setup)

- [ ] Task 15 — Frontend tests (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
    - [ ] Mock `clienteApiRepository.getAll` with MSW or `vi.mock`
    - [ ] Assert: returns array of `Cliente` on success; `isError` is true on fetch failure
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
    - [ ] Render with mocked `useClientes` returning 3 clients → assert 3 `ClienteListItem` elements rendered
    - [ ] Simulate typing in search input → assert filtered results (only matching items visible)
    - [ ] Render with empty list → assert `EmptyState` is visible
    - [ ] Render with error state → assert `ErrorPanel` with "Reintentar" button is visible; simulate click → `refetch` called
    - [ ] Render with `isLoading=true` → assert skeleton placeholders are rendered (no list items)
  - [ ] Run `pnpm exec vitest run` — all tests pass with zero TypeScript strict errors

## Dev Notes

### Architecture Patterns Applied

This story follows the Clean Architecture + DDD pattern for both frontend and backend as defined in `_bmad-output/planning-artifacts/architecture.md`.

**Frontend module structure touched:**
```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts                        # NEW — domain entity interface
      IClienteRepository.ts             # NEW — repository contract
    application/
      useClientes.ts                    # NEW — TanStack Query hook (queryKey: ['clientes'])
      useClientes.test.ts               # NEW — unit test
    infrastructure/
      clienteApiRepository.ts           # NEW — Axios implementation of IClienteRepository
    presentation/
      ClienteListView.tsx               # NEW — 280px left panel component
      ClienteListView.test.tsx          # NEW — component tests
  shared/components/
    ClienteListItem.tsx                 # NEW — reusable list item
    EmptyState.tsx                      # NEW — reusable empty state (used across Epics 2 and 3)
    ErrorPanel.tsx                      # NEW — reusable error panel
  routes/_app/
    clientes.tsx                        # MODIFIED — replace placeholder with ClienteListView
```

**Backend structure touched:**
```
backend/
  src/SiesaAgents.Domain/Clientes/
    Entities/ClienteEntity.cs           # NEW
    Interfaces/IClienteRepository.cs    # NEW
  src/SiesaAgents.Application/Clientes/
    DTOs/ClienteDto.cs                  # NEW
    Queries/GetClientesQuery.cs         # NEW
    Queries/GetClientesQueryHandler.cs  # NEW
  src/SiesaAgents.Infrastructure/
    Data/
      AppDbContext.cs                   # MODIFIED — add DbSet<ClienteEntity>
      Configurations/ClienteConfiguration.cs  # NEW
      Migrations/                       # NEW migration file: AddClientesTable
    Repositories/ClienteRepository.cs   # NEW
  src/SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs       # NEW
    Program.cs                          # MODIFIED — register IClienteRepository + MapClienteEndpoints
  tests/SiesaAgents.UnitTests/Application/Clientes/
    GetClientesQueryHandlerTests.cs     # NEW
```

### Key Technical Decisions

**Search Strategy (NFR1 — < 1s with 500 records):**
- All clients are loaded once via `GET /api/v1/clientes` and cached by TanStack Query (`queryKey: ['clientes']`)
- Client-side filter using `useMemo` over the cached array — executes in < 50ms for 500 records
- No additional API calls triggered per search keystroke
- Source: `architecture.md` → Data Architecture → Search Strategy

**State Management:**
- `clientes` list: TanStack Query server state (`queryKey: ['clientes']`)
- `searchQuery`: local `useState` inside `ClienteListView` — NOT Zustand (client-side filter, ephemeral)
- No Zustand store needed in this story per architecture decision

**Loading States:**
- Use `react-loading-skeleton` for skeleton screens — NOT spinners (company standard, see `company-standards.md` → UX Design System → Loading States)

**UI Components Priority:**
1. Check siesa-ui-kit first (NavigationRail already used in Story 1.2)
2. shadcn/ui via MCP if no siesa-ui-kit equivalent
3. Custom with TailwindCSS v4 as last resort
- `EmptyState` and `ErrorPanel` are likely custom (no direct kit equivalent for these specific patterns)

**No MasterCrud usage:** This story uses a custom 280px scrollable panel layout, not the MasterCrud grid component. MasterCrud is for full-page CRUD grids with pagination. The split-panel list is purpose-built per UX spec.

**Backend entity pattern:**
```csharp
// ClienteEntity — private constructor + static factory (company standard)
public sealed class ClienteEntity
{
    private ClienteEntity() { }

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string NitRuc { get; private set; } = string.Empty;
    public string? Telefono { get; private set; }
    public string? Ciudad { get; private set; }
    public DateTimeOffset CreadoEn { get; private set; }  // NEVER DateTime

    public static ClienteEntity Create(string nombre, string nitRuc, string? telefono, string? ciudad)
    {
        return new ClienteEntity
        {
            Nombre = nombre,
            NitRuc = nitRuc,
            Telefono = telefono,
            Ciudad = ciudad,
            CreadoEn = DateTimeOffset.UtcNow
        };
    }
}
```

**API endpoint contract:**
```
GET /api/v1/clientes
Response: 200 OK
Content-Type: application/json
Body: [
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombre": "Empresa ABC",
    "nitRuc": "900123456-1",
    "telefono": "+57 601 1234567",
    "ciudad": "Bogotá",
    "creadoEn": "2026-03-12T10:30:00Z"
  }
]
```
- Direct JSON array (no wrapper object)
- JSON property names: camelCase (auto-serialized by .NET)
- `creadoEn`: ISO 8601 with UTC timezone — NEVER Unix timestamps

**Database migration (EFCore.NamingConventions):**
- `EFCore.NamingConventions` v9 applies snake_case automatically via `UseSnakeCaseNamingConvention()` in `Program.cs` DI registration (already established in Story 1.3)
- `ApplySnakeCaseNaming()` is called last in `OnModelCreating` — no manual `[Column]`/`[Table]` attributes needed
- The `nit_ruc` column name is derived automatically from `NitRuc` property; unique index `uk_clientes_nit_ruc` must be configured explicitly in `ClienteConfiguration.cs`

**Critical pattern from Story 1.3 (EF Core naming):**
```csharp
// AppDbContext.cs — already established, DO NOT change
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    modelBuilder.ApplySnakeCaseNaming();  // MUST be last
}
```

**CORS:** Frontend dev port 5173 is already allowed in backend `Program.cs` (established in Story 1.1). No changes needed.

**Error handling — backend:**
- `ExceptionHandlingMiddleware` already handles all unhandled exceptions → Problem Details RFC 7807 (Story 1.3)
- No additional error middleware needed in this story

**Error handling — frontend:**
- Never display `error.message` directly to the user
- Use `<ErrorPanel onRetry={refetch} />` for load failures

### Project Structure Notes

- `clientes.tsx` route currently exports a placeholder component (Story 1.2). This story replaces the placeholder with the real `ClienteListView` wired left panel.
- `apiClient.ts` (Axios singleton with `baseURL: import.meta.env.VITE_API_URL`) was established in Story 1.1 — import it directly.
- `queryClient.ts` and `QueryClientProvider` wrap was established in Story 1.1 — no additional setup needed.
- `react-loading-skeleton` must be verified as installed. If not: `pnpm add react-loading-skeleton`.

### UI Behavior Details

- Left panel width: exactly 280px (`w-[280px]`), fixed, not resizable
- Panel is `overflow-y-auto` and `h-full` relative to its parent flex container
- Search input: positioned at the top of the panel, above the scrollable list area
- Item visual on hover: `hover:bg-slate-50` (Tailwind slate-* scale per company standards)
- Selected item: `bg-blue-50 border-l-4 border-[#0e79fd]` (Siesa Blue `#0e79fd`)
- Typography: Inter font (inherited from global styles); `nombre` as `text-sm font-medium`, `nitRuc` as `text-xs text-slate-500`
- Dark mode: supported via `dark:` TailwindCSS classes; `darkMode: 'class'` per company standard

### References

- Architecture decisions: [`_bmad-output/planning-artifacts/architecture.md`] — Search Strategy, Data Architecture, Frontend/Backend Structure, Naming Patterns
- Epic requirements: [`_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`] — Story 2.1 AC, Epic AC-E2.1, AC-E2.2
- Company standards: [`.claude/agent-memory/sa-quick-dev/company-standards.md`] — Backend Critical Rules, Database Conventions, Frontend Key Rules, UX Design System
- Story 1.3 learnings: [`_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`] — EF Core naming convention setup, AppDbContext pattern, ExceptionHandlingMiddleware
- Story 1.2 learnings: [`_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`] — TanStack Router file conventions, siesa-ui-kit usage, route structure
- MasterCrud reference: [`_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`] — Not applicable for this story (split-panel list, not a CRUD grid)
- NFR1 (search < 1s with 500 records): covered by client-side filter, architecture.md NFR table
- NFR6 (no stack traces): ExceptionHandlingMiddleware from Story 1.3 already covers this

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
