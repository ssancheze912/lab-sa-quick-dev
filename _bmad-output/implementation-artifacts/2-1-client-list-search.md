# Story 2.1: Client List & Search

Status: ready-for-dev

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients, showing Nombre and NIT/RUC per item, within 2 seconds of page load (NFR2).

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time (debounce ≤ 150ms) showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), and results appear in under 1 second with up to 500 records (NFR1). No additional API call is triggered during typing — filtering operates over the TanStack Query cache.

3. **Given** there are no clients in the system (empty array returned by the API), **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client ("No hay clientes registrados. Crea el primero.").

4. **Given** the backend is unavailable when the page loads, **When** the `GET /api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component is displayed with a "Reintentar" button that triggers a manual refetch. The raw error message is never shown to the user (NFR6).

5. **Given** the client list is loaded, **When** no search text is entered, **Then** all clients are displayed in the default order (most recently created first, matching the default sort "Más reciente" from Story 2.6).

6. **Given** the user has typed a search query and the filtered list is empty, **When** no clients match the search text, **Then** a "no results" inline state is shown within the panel (e.g., "Sin resultados para '{{query}}'") and the EmptyState component is NOT shown (EmptyState is reserved for zero records in the system).

## Tasks / Subtasks

- [ ] Task 1 — Backend: expose `GET /api/v1/clientes` endpoint (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with properties: `Guid Id`, `string Nombre`, `string NIT`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt` — use `private` constructor + `static Create()` factory; `Id = Guid.NewGuid()`, `CreatedAt = DateTimeOffset.UtcNow`
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with method: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` with fields: `Guid Id`, `string Nombre`, `string NIT`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (record, no params) and `GetClientesQueryHandler.cs` implementing `IRequestHandler<GetClientesQuery, IReadOnlyList<ClienteDto>>`; maps entities to DTOs
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`; use `AppDbContext`, EF Core `AsNoTracking().ToListAsync()`
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`; apply `ClienteConfiguration` via `ApplyConfigurationsFromAssembly`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`: table `clientes`, PK `id`, unique index `uk_clientes_nit` on `NIT`, NOT NULL on `Nombre`/`NIT`/`Telefono`/`Ciudad`, `ON DELETE CASCADE` not required for client
  - [ ] Run `dotnet ef migrations add AddClienteEntity` from `backend/` — migration creates `clientes` table with snake_case columns (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`)
  - [ ] Register `IClienteRepository` → `ClienteRepository` in DI (`Program.cs`)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with `MapClienteEndpoints(app)` extension; add `app.MapGet("/api/v1/clientes", ...)` returning `IReadOnlyList<ClienteDto>` (HTTP 200); dispatch `GetClientesQuery` via MediatR or direct handler injection
  - [ ] Wire `app.MapClienteEndpoints()` in `Program.cs`
  - [ ] Verify CORS allows `http://localhost:5173` for development

- [ ] Task 2 — Frontend: `useClientes` hook with TanStack Query (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string }`
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios call: `GET ${VITE_API_URL}/api/v1/clientes` → `Promise<Cliente[]>`
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook:
    ```typescript
    export const useClientes = () =>
      useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll, staleTime: 30_000 })
    ```
  - [ ] Write unit tests `useClientes.test.ts` with MSW handlers mocking `GET /api/v1/clientes`; test: success returns array, error triggers `isError` state (Vitest + RTL)

- [ ] Task 3 — Frontend: `ClienteListView` presentation component (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Fixed-width left panel (`w-[280px] h-full flex flex-col border-r border-slate-200`)
    - Panel header with title "Clientes" and search input (`<input placeholder="Buscar por nombre o NIT/RUC..." aria-label="Buscar clientes" />`)
    - Calls `useClientes()` — handles `isLoading`, `isError`, `data` states
    - `isLoading`: render skeleton list (react-loading-skeleton, 6 skeleton items)
    - `isError`: render `<ErrorPanel onRetry={refetch} />` (AC#4)
    - Client-side filter: `useMemo(() => data?.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)), [data, searchQuery])` where `q = searchQuery.toLowerCase().trim()`
    - `data` is empty array: render `<EmptyState message="No hay clientes registrados. Crea el primero." />`
    - Filtered array empty AND search query not empty: render inline "Sin resultados para '{{searchQuery}}'" message (NOT EmptyState)
    - Otherwise: render `<ul>` with one `<ClientListItem>` per client
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string`, `action?: ReactNode`; displays centered icon + message + optional action button
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void`; displays error message in Spanish + "Reintentar" button; NEVER exposes raw error object
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — accepts `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`; renders Nombre (bold) + NIT/RUC (secondary text); applies selected state styling (`bg-blue-50 border-l-2 border-[#0e79fd]`)
  - [ ] Write component tests for `ClienteListView`: render with data, render EmptyState when empty, render ErrorPanel on error, filter behavior on input change (Vitest + RTL + axe accessibility check)

- [ ] Task 4 — Frontend: Route wiring (AC: #1)
  - [ ] Verify/create `frontend/src/routes/_app/clientes.tsx` — renders the split-panel layout: `ClienteListView` (left 280px) + placeholder/outlet (right, flex-1) for ClienteDetailView (Story 2.2)
  - [ ] Ensure `_app.tsx` layout wraps routes properly (NavigationRail + main content area)
  - [ ] Verify `QueryClientProvider` and `RouterProvider` are present in `frontend/src/main.tsx` / `frontend/src/app/providers/`

- [ ] Task 5 — Backend: Unit and Integration tests (AC: #1, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`:
    - Test: returns empty list when no clients exist
    - Test: returns mapped DTOs for existing clients
    - Use in-memory mock repository (xUnit `[Fact]`, Arrange/Act/Assert)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - Test `GET /api/v1/clientes` → HTTP 200 + JSON array
    - Test `GET /api/v1/clientes` with empty DB → HTTP 200 + empty array `[]`
    - Use `WebApplicationFactory<Program>` + EF Core InMemory provider

## Dev Notes

### Architecture Context

This story delivers the read side of the `clientes` domain: `GET /api/v1/clientes` backend endpoint + `ClienteListView` React component with real-time client-side search. It is a prerequisite for all other Epic 2 stories.

**Backend layer responsibilities:**
- **Domain** (`SiesaAgents.Domain`): `ClienteEntity` + `IClienteRepository` — zero dependencies
- **Application** (`SiesaAgents.Application`): `GetClientesQuery` + `GetClientesQueryHandler` + `ClienteDto` — CQRS read path
- **Infrastructure** (`SiesaAgents.Infrastructure`): `ClienteRepository` + `ClienteConfiguration` + EF Core migration
- **API** (`SiesaAgents.API`): `ClienteEndpoints.cs` minimal API endpoint, DI wiring

**Frontend layer responsibilities:**
- **Domain**: `Cliente.ts` entity interface + `IClienteRepository.ts` contract
- **Application**: `useClientes.ts` TanStack Query hook (queryKey `['clientes']`)
- **Infrastructure**: `clienteApiRepository.ts` Axios implementation
- **Presentation**: `ClienteListView.tsx` + shared components (`EmptyState`, `ErrorPanel`, `ClientListItem`)

### Key Implementation Constraints

**Search strategy (NFR1 — < 1 second):**
- TanStack Query fetches all clients on mount: `queryKey: ['clientes']`
- Client-side filter via `useMemo` operates on the cached array — NO additional API call during typing
- `useMemo` dependency array: `[data, searchQuery]`
- Max dataset MVP: 500 records — client-side filter completes in < 50ms

**State management:**
- `searchQuery: string` — local `useState` in `ClienteListView` (never Zustand for this)
- `selectedClienteId` — managed by TanStack Router URL param in Story 2.2 (not in scope here)
- No Zustand store needed for this story

**Backend entity pattern:**
```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public sealed class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string NIT { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { }  // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        return new ClienteEntity { Nombre = nombre, NIT = nit, Telefono = telefono, Ciudad = ciudad };
    }
}
```

**EF Core configuration:**
```csharp
// ClienteConfiguration.cs — EF Core auto-maps PascalCase → snake_case via ApplySnakeCaseNaming()
// NO manual [Column] or [Table] attributes
builder.ToTable("clientes");
builder.HasKey(c => c.Id);
builder.HasIndex(c => c.NIT).IsUnique().HasDatabaseName("uk_clientes_nit");
builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
builder.Property(c => c.NIT).IsRequired().HasMaxLength(50);
builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
```

**Minimal API endpoint pattern:**
```csharp
// ClienteEndpoints.cs
app.MapGet("/api/v1/clientes", async (IClienteRepository repo, CancellationToken ct) =>
{
    var clientes = await repo.GetAllAsync(ct);
    return Results.Ok(clientes.Select(c => new ClienteDto(c.Id, c.Nombre, c.NIT, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt)));
})
.WithName("GetClientes")
.Produces<IReadOnlyList<ClienteDto>>(200);
```

**TanStack Query hook:**
```typescript
// useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export const useClientes = () =>
  useQuery({
    queryKey: ['clientes'],
    queryFn: clienteApiRepository.getAll,
    staleTime: 30_000,
  })
```

**Client-side filter pattern:**
```typescript
const [searchQuery, setSearchQuery] = useState('')
const filtered = useMemo(() => {
  if (!data) return []
  const q = searchQuery.toLowerCase().trim()
  if (!q) return data
  return data.filter(
    c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

**Error handling:**
- Frontend: `<ErrorPanel onRetry={refetch} />` — NEVER renders `error.message` directly
- Backend: `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 — already wired from Story 1.1; verify it is the FIRST middleware in `Program.cs`

**UI text — all in Spanish (mandatory):**
- Panel title: "Clientes"
- Search placeholder: "Buscar por nombre o NIT/RUC..."
- Search ARIA label: "Buscar clientes"
- EmptyState message: "No hay clientes registrados. Crea el primero."
- No results inline: "Sin resultados para '{{query}}'"
- ErrorPanel: "No se pudo cargar la lista de clientes." + button "Reintentar"
- Loading ARIA: `aria-busy="true"` on the list container

**Skeleton loading:** Use `react-loading-skeleton` (already in frontend dependencies from Story 1.1). Render 6 `<Skeleton>` items during `isLoading` state — NO spinner.

**siesa-ui-kit check:** This story's custom components (`EmptyState`, `ErrorPanel`, `ClientListItem`) are project-specific wrappers not covered by siesa-ui-kit or shadcn/ui catalog for this use case. Build as custom components in `src/shared/components/`. Check siesa-ui-kit catalog for any search input or list item component before implementing.

**MasterCrud:** NOT applicable for this story. Story 2.1 implements a custom split-panel list (280px fixed left panel) per the UX spec and architecture. MasterCrud is appropriate for tabular CRUD screens — the clientes left panel is a lightweight scrollable list with inline search, not a data grid.

### Project Structure Notes

Files to create/modify in this story:

**Backend:**
```
backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs         [NEW]
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs  [NEW]
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs            [NEW]
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs   [NEW]
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs [NEW]
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs                [MODIFY — add DbSet<ClienteEntity>]
backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs [NEW]
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs   [NEW]
backend/src/SiesaAgents.Infrastructure/Migrations/[timestamp]_AddClienteEntity.cs [NEW — generated]
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                  [NEW]
backend/src/SiesaAgents.API/Program.cs                                     [MODIFY — register DI + MapClienteEndpoints]
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs [NEW]
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs        [NEW]
```

**Frontend:**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts                        [NEW]
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts   [NEW]
frontend/src/modules/crm/clientes/application/useClientes.ts               [NEW]
frontend/src/modules/crm/clientes/application/useClientes.test.ts          [NEW]
frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx         [NEW]
frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx    [NEW]
frontend/src/shared/components/EmptyState.tsx                              [NEW]
frontend/src/shared/components/ErrorPanel.tsx                              [NEW]
frontend/src/shared/components/ClientListItem.tsx                          [NEW]
frontend/src/routes/_app/clientes.tsx                                      [MODIFY — wire ClienteListView]
```

**Alignment with architecture.md structure:**
- `src/modules/crm/clientes/` follows the defined module structure (domain/application/infrastructure/presentation)
- `src/shared/components/` for reusable EmptyState and ErrorPanel (per architecture.md: `src/shared/components/`)
- Route file `_app/clientes.tsx` matches the defined TanStack Router path

**No conflicts detected** with stories 1.1, 1.2, 1.3. Story 1.3 established `AppDbContext` with empty DbSets — this story adds the first `DbSet<ClienteEntity>`.

### References

- Epic definition and AC: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture decisions (routes, modules, query keys, search strategy): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture file structure (complete directory tree): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Naming conventions (snake_case DB, PascalCase C#, camelCase TS): [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Anti-patterns (DateTime → DateTimeOffset, Swagger → Scalar): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Data flow for client-side filter: [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Diagram]
- State boundaries (local useState for search, no Zustand needed): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- TanStack Query mutation pattern (for invalidation reference): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- FR coverage: FR1 (list clients) + FR2 (search by name/NIT): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- NFR1 (< 1s search), NFR2 (< 2s CRUD update): [Source: _bmad-output/planning-artifacts/architecture.md#Non-Functional Requirements]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Test risk R-001 (client-side filter + no extra fetches): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#R-003]
- Company standards (Clean Architecture + DDD, UI Spanish): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- MasterCrud API reference: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md] — NOT applicable for this story's panel layout

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
