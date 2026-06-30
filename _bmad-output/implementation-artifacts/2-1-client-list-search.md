# Story 2.1: Client List & Search

Status: ready-for-dev

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients with `nombre` and `nit` visible per item.

2. **Given** the client list is loaded, **When** the user types in the search input field, **Then** the list filters in real time showing only clients whose `nombre` or `nit` match the input (case-insensitive), **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed inside the left panel with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the GET `/api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed inside the left panel instead of the list.

5. **Given** the `/clientes` route renders, **When** no client is selected, **Then** the right panel displays a neutral empty/default state (no detail content).

6. **Given** the client list is fetched successfully, **When** `useClientes` returns data, **Then** the `['clientes']` TanStack Query cache is populated and subsequent navigations within the session do not trigger redundant network requests (staleTime > 0).

## Tasks / Subtasks

- [ ] Task 1 — Define `Cliente` domain entity and repository interface (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>` and `getById(id: string): Promise<Cliente>`

- [ ] Task 2 — Implement `clienteApiRepository` in infrastructure layer (AC: #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` implementing `IClienteRepository`
  - [ ] `getAll()` calls `GET /api/v1/clientes` via the shared `apiClient` (Axios singleton at `frontend/src/shared/lib/apiClient.ts`)
  - [ ] `getById(id)` calls `GET /api/v1/clientes/{id}`
  - [ ] Export a singleton `clienteApiRepository` instance

- [ ] Task 3 — Implement `useClientes` TanStack Query hook (AC: #1, #4, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Use `useQuery` with `queryKey: ['clientes']` and `queryFn: () => clienteApiRepository.getAll()`
  - [ ] Set `staleTime: 30_000` (30 seconds) to avoid redundant re-fetches
  - [ ] Return `{ data, isLoading, isError, refetch }` — hook must expose `refetch` for the `ErrorPanel` retry handler

- [ ] Task 4 — Create `ClienteListItem` shared component (AC: #1)
  - [ ] Create `frontend/src/shared/components/ClienteListItem.tsx`
  - [ ] Props: `{ cliente: Cliente; isSelected: boolean; onClick: () => void }`
  - [ ] Display: `nombre` as primary text (bold, `text-sm`), `nit` as secondary text (`text-xs text-slate-500`)
  - [ ] Apply `bg-blue-50 border-l-4 border-[#0e79fd]` styles when `isSelected === true`
  - [ ] All user-facing text labels in Spanish (aria-label, title attributes)
  - [ ] Keyboard accessible: `role="button"`, `tabIndex={0}`, handles `Enter`/`Space` keydown

- [ ] Task 5 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Render a 280px fixed-width left panel with:
    - Search `<input>` with placeholder "Buscar por nombre o NIT..." (`aria-label="Buscar clientes"`)
    - Scrollable list of `ClienteListItem` components
    - `EmptyState` component when data is empty (zero clients or no search matches)
    - `ErrorPanel` component with `onRetry={refetch}` when `isError === true`
    - `react-loading-skeleton` skeleton rows (5 rows) while `isLoading === true`
  - [ ] Client-side filtering: `useMemo` over `data ?? []`, filtering by `nombre.toLowerCase().includes(q)` OR `nit.toLowerCase().includes(q)` where `q = searchQuery.toLowerCase()`
  - [ ] `searchQuery` state: `useState<string>('')` — local component state only (not Zustand, not URL param)
  - [ ] When a `ClienteListItem` is clicked, navigate to `/clientes/${cliente.id}` via TanStack Router `useNavigate`
  - [ ] Highlight the currently selected item using the current route param (`useParams`)

- [ ] Task 6 — Create `ClientesPage` route file for `/clientes` (AC: #1, #5)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` (TanStack Router file-based route)
  - [ ] Render a two-panel layout: left panel = `<ClienteListView />` (280px), right panel = flex-1 with a default empty state message "Selecciona un cliente para ver sus detalles"
  - [ ] Import and register the route in TanStack Router — ensure `routeTree.gen.ts` is regenerated after adding the file

- [ ] Task 7 — Backend: Define `ClienteEntity` and `IClienteRepository` in Domain layer (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
    - Properties: `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
    - Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory
    - `Id = Guid.NewGuid()`, `CreatedAt = DateTimeOffset.UtcNow`, `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
    - Methods: `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)`, `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`

- [ ] Task 8 — Backend: EF Core configuration and migration for `clientes` table (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`
    - Map to table `clientes`
    - Configure `Id` as UUID PK
    - Configure `Nit` as required, max length 50, unique index `uk_clientes_nit`
    - Configure `Nombre` as required, max length 200
    - Configure `Telefono` as required, max length 50
    - Configure `Ciudad` as required, max length 100
    - `ApplySnakeCaseNaming()` is applied globally via `AppDbContext.OnModelCreating` — do NOT add manual `[Column]`/`[Table]` attributes
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
  - [ ] Apply configuration: `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` in `OnModelCreating` before `ApplySnakeCaseNaming()`
  - [ ] Create and apply EF Core migration: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`

- [ ] Task 9 — Backend: `ClienteRepository` implementation (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`
  - [ ] `GetAllAsync`: `return await _context.Clientes.OrderBy(c => c.Nombre).ToListAsync(ct)`
  - [ ] `GetByIdAsync`: `return await _context.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct)`
  - [ ] Register in `Program.cs`: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`

- [ ] Task 10 — Backend: `GetClientesQuery` + Handler + DTO (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (empty record)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
    - Constructor: inject `IClienteRepository`
    - `Handle`: call `GetAllAsync`, map to `IEnumerable<ClienteDto>`, return
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
    - Properties: `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Register handler in DI: `builder.Services.AddScoped<GetClientesQueryHandler>()`

- [ ] Task 11 — Backend: `GET /api/v1/clientes` Minimal API endpoint (AC: #1, #4)
  - [ ] Add to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    - `app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) => Results.Ok(await handler.Handle(new GetClientesQuery(), ct)))`
    - Returns 200 with direct array of `ClienteDto` (no wrapper object per architecture)
  - [ ] Register `ClienteEndpoints` in `Program.cs`: `app.MapClienteEndpoints()`

- [ ] Task 12 — Tests: Backend unit tests for query handler (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
  - [ ] Mock `IClienteRepository`, test: handler returns correct list of `ClienteDto`
  - [ ] Test: empty repository returns empty array (not null)
  - [ ] Use xUnit + `NSubstitute` or `Moq` — Arrange/Act/Assert structure

- [ ] Task 13 — Tests: Frontend unit tests for `useClientes` hook and `ClienteListView` component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
    - MSW mock: intercept `GET /api/v1/clientes`, return mock array
    - Test: loading state, data state, error state
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
    - Test: renders skeleton while loading (AC: implied by loading state)
    - Test: renders client items when data is available (AC: #1)
    - Test: filters list when typing in search input (AC: #2)
    - Test: renders `EmptyState` when data is empty (AC: #3)
    - Test: renders `ErrorPanel` when fetch fails (AC: #4)
    - Test: `ErrorPanel` retry button calls refetch (AC: #4)
    - Accessibility: `axe` check passes on rendered component (WCAG 2.1 AA)

## Dev Notes

### Architecture Context

This story spans both **frontend** and **backend** layers. The frontend is the primary deliverable (user-visible feature); the backend provides the `GET /api/v1/clientes` endpoint consumed by `useClientes`.

**Clean Architecture layer responsibilities:**
- `domain/`: `Cliente.ts` (interface), `IClienteRepository.ts` — zero external dependencies
- `application/`: `useClientes.ts` (TanStack Query hook) — depends on domain interface only
- `infrastructure/`: `clienteApiRepository.ts` — depends on domain interface + Axios
- `presentation/`: `ClienteListView.tsx`, `ClientesPage` route — depends on application hooks

**State management decisions (from architecture.md):**
- `searchQuery`: `useState<string>('')` — local component state, NOT Zustand, NOT URL search param
- `selectedClienteId`: synchronized with URL param via TanStack Router (handled by the route, not this story)
- No Zustand store required for this story

### UI Implementation Requirements (MANDATORY)

This story involves UI components. The following siesa-ui-kit rules apply:

- **siesa-ui-kit** is the P0 mandatory UI library — check its catalog before creating any custom component
- **MasterCrud** from siesa-ui-kit is NOT applicable here: the client list uses a custom 280px split-panel layout (not a data grid with CRUD orchestration). The architecture explicitly defines `ClienteListView` as a custom component
- For the `EmptyState` and `ErrorPanel` components: use siesa-ui-kit equivalents if they exist, otherwise create custom implementations in `frontend/src/shared/components/`
- Heroicons (primary icon source) for search icon, error icon
- Brand color `#0e79fd` (Siesa Blue) for selected-item indicator (`border-[#0e79fd]`)
- Loading skeleton: `react-loading-skeleton` — skeleton screens, NOT spinners

**Installation check:**
```bash
# Verify siesa-ui-kit is installed
cat frontend/package.json | grep siesa-ui-kit
```

### Backend Entity Pattern (MANDATORY)

Per company standards — private constructor + static `Create()` factory:

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { } // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
```

**CRITICAL:** Use `DateTimeOffset` — NEVER `DateTime`. Use `Guid` for `Id` — never `int` or `string`.

### EF Core Configuration Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
        // snake_case mapping is handled globally by ApplySnakeCaseNaming() in AppDbContext
    }
}
```

### AppDbContext Update

```csharp
// Additions to backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    modelBuilder.ApplySnakeCaseNaming(); // MUST remain LAST
}
```

### API Response Contract

```
GET /api/v1/clientes
→ 200 OK
→ Content-Type: application/json
→ Body: ClienteDto[] (direct array, no wrapper object)

[
  {
    "id": "uuid",
    "nombre": "Empresa ABC",
    "nit": "900123456-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

### TanStack Query Key (CANONICAL)

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],   // CANONICAL key — do NOT change
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 30_000,
  })
}
```

### Client-Side Filtering Pattern (Architecture Decision)

Per architecture.md: filtering is performed client-side over the TanStack Query cache — no search endpoint triggered. This satisfies NFR1 (< 1s for 500 records).

```typescript
// Inside ClienteListView.tsx
const [searchQuery, setSearchQuery] = useState('')
const { data = [], isLoading, isError, refetch } = useClientes()

const filteredClientes = useMemo(() => {
  const q = searchQuery.toLowerCase().trim()
  if (!q) return data
  return data.filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.nit.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

### Frontend File Structure

Files to create or modify:

```
frontend/
└── src/
    ├── routes/
    │   └── _app/
    │       └── clientes.tsx                          ← CREATE: /clientes route
    ├── modules/
    │   └── crm/
    │       └── clientes/
    │           ├── domain/
    │           │   ├── Cliente.ts                    ← CREATE: entity interface
    │           │   └── IClienteRepository.ts         ← CREATE: repository contract
    │           ├── application/
    │           │   ├── useClientes.ts                ← CREATE: TanStack Query hook
    │           │   └── useClientes.test.ts           ← CREATE: hook unit tests
    │           ├── infrastructure/
    │           │   └── clienteApiRepository.ts       ← CREATE: Axios implementation
    │           └── presentation/
    │               ├── ClienteListView.tsx           ← CREATE: 280px left panel
    │               └── ClienteListView.test.tsx      ← CREATE: component tests
    └── shared/
        └── components/
            └── ClienteListItem.tsx                   ← CREATE: list item component
```

### Backend File Structure

Files to create or modify:

```
backend/
├── src/
│   ├── SiesaAgents.Domain/
│   │   └── Clientes/
│   │       ├── Entities/
│   │       │   └── ClienteEntity.cs                 ← CREATE
│   │       └── Interfaces/
│   │           └── IClienteRepository.cs            ← CREATE
│   ├── SiesaAgents.Application/
│   │   └── Clientes/
│   │       ├── Queries/
│   │       │   ├── GetClientesQuery.cs              ← CREATE
│   │       │   └── GetClientesQueryHandler.cs       ← CREATE
│   │       └── DTOs/
│   │           └── ClienteDto.cs                    ← CREATE
│   ├── SiesaAgents.Infrastructure/
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs                      ← MODIFY: add DbSet<ClienteEntity>
│   │   │   └── Configurations/
│   │   │       └── ClienteConfiguration.cs          ← CREATE
│   │   ├── Migrations/                              ← MODIFY: add AddClientesTable migration
│   │   └── Repositories/
│   │       └── ClienteRepository.cs                 ← CREATE
│   └── SiesaAgents.API/
│       ├── Program.cs                               ← MODIFY: register ClienteRepository + endpoint
│       └── Endpoints/
│           └── ClienteEndpoints.cs                  ← CREATE (or MODIFY if stub exists)
└── tests/
    └── SiesaAgents.UnitTests/
        └── Application/
            └── Clientes/
                └── GetClientesQueryHandlerTests.cs  ← CREATE
```

### Previous Story Learnings (from Story 1.3)

- Solution file is `SiesaAgents.slnx` (XML format, .NET 10) — use `dotnet build SiesaAgents.slnx`
- `AppDbContext` uses `UseSnakeCaseNamingConvention()` at `DbContextOptions` level (EFCore.NamingConventions v10.0.1)
- `ApplyConfigurationsFromAssembly` must be called BEFORE `ApplySnakeCaseNaming()` in `OnModelCreating`
- `ExceptionHandlingMiddleware` is already in place — backend errors will return Problem Details RFC 7807
- PostgreSQL connection: `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (from `appsettings.Development.json`)
- Frontend runs on port 5173, backend on port 5000/5001 — CORS is already configured for `localhost:5173`

### Git Context

Recent commits follow pattern: `feat(story-X.Y):`, `docs(story-X.Y):`, `fix(story-X.Y):`, `review(story-X.Y):`. Use `feat(story-2.1):` prefix for commits in this story.

### Testing Standards Summary

**Frontend (Vitest + RTL + MSW):**
- Co-locate tests: `useClientes.test.ts` alongside `useClientes.ts`
- MSW server intercepts network calls — no real HTTP requests in tests
- Include `axe` accessibility check in `ClienteListView.test.tsx`
- Coverage target: >80% for files introduced in this story

**Backend (xUnit):**
- Unit tests: mock `IClienteRepository` with NSubstitute or Moq
- Test file location: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`
- Arrange/Act/Assert structure — explicit and readable
- Run with: `dotnet test tests/SiesaAgents.UnitTests`

### Project Structure Notes

- Frontend routing uses TanStack Router **file-based** routing — adding `clientes.tsx` to `src/routes/_app/` automatically registers the `/clientes` route after `routeTree.gen.ts` regeneration (run `pnpm dev` or `pnpm tsr generate`)
- The `_app` prefix makes it a pathless layout route — `/clientes` is the correct URL (not `/_app/clientes`)
- No Zustand store is needed for this story — `searchQuery` is local `useState`, and selected client ID comes from URL params

### References

- Story 2.1 acceptance criteria: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- FR1 (list clients), FR2 (search by name/NIT): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- NFR1 (< 1s search): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- Client-side filtering strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- ClienteEntity UUID PK + DateTimeOffset: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- TanStack Query key `['clientes']`: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Frontend folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied]
- `ApplyConfigurationsFromAssembly` before `ApplySnakeCaseNaming`: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#AppDbContext Update]
- EF Core snake_case via `UseSnakeCaseNamingConvention()`: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#EF Core Configuration Pattern]
- Problem Details RFC 7807 error format: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- MasterCrud reference (not applicable — custom split panel): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
