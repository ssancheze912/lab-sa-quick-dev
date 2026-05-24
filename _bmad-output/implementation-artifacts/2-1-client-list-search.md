# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I am looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list where each item displays the client's Nombre and NIT/RUC.

2. **Given** the client list is loaded, **When** the user types any characters into the search input field, **Then** the list filters in real time to show only clients whose Nombre or NIT/RUC contain the input string (case-insensitive), and results appear within 1 second with up to 500 records in the TanStack Query cache (NFR1).

3. **Given** there are no clients in the system (backend returns an empty array), **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed in the left panel with a Spanish message guiding the user to create the first client (e.g., "No hay clientes registrados. Crea el primero.").

4. **Given** the backend is unavailable when the page loads (network error or 5xx response), **When** the `GET /api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component is displayed in the left panel instead of the list, with a "Reintentar" button that triggers a refetch when clicked.

5. **Given** the `GET /api/v1/clientes` endpoint is called, **When** the request is processed by the backend, **Then** it returns HTTP 200 with a JSON array of client objects (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`) directly (no wrapper object), sourced from the `clientes` PostgreSQL table via `ClienteEntity` and `GetClientesQueryHandler`.

6. **Given** the client list view renders on any viewport, **When** it is inspected for accessibility, **Then** the search input has `aria-label="Buscar clientes"`, the list container has `role="list"`, and each list item has `role="listitem"` with an accessible label combining the client's Nombre and NIT/RUC in Spanish.

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1 — Define `ClienteEntity` in Domain layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Fields: `Guid Id` (UUID PK, `Guid.NewGuid()` default), `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory method
  - [ ] `UpdatedAt` initialized to `DateTimeOffset.UtcNow`; updated in the `Update()` method
  - [ ] Extend `Entity` base class from `Shared.Domain` (`public abstract class Entity { public Guid Id { get; protected set; } = Guid.NewGuid(); }`)

- [ ] Task 2 — Define `IClienteRepository` interface in Domain layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Methods: `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)`, `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)`
  - [ ] Add `Task AddAsync(ClienteEntity cliente, CancellationToken ct = default)`, `Task UpdateAsync(ClienteEntity cliente, CancellationToken ct = default)`, `Task DeleteAsync(Guid id, CancellationToken ct = default)` (needed by later stories; define now for completeness)

- [ ] Task 3 — Define `ClienteDto` and query objects in Application layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — empty record `GetClientesQuery : IRequest<IEnumerable<ClienteDto>>`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — injects `IClienteRepository`, calls `GetAllAsync`, maps each `ClienteEntity` to `ClienteDto`

- [ ] Task 4 — Implement EF Core configuration for `ClienteEntity` (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`
  - [ ] Configure table name `clientes` (EF Core snake_case via `ApplySnakeCaseNaming()` in `AppDbContext` handles column names — no manual `[Column]` attributes)
  - [ ] Configure `Nit` column as unique: `builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`
  - [ ] Ensure `AppDbContext.cs` includes `DbSet<ClienteEntity> Clientes` and registers `ClienteConfiguration` via `ApplyConfigurationsFromAssembly`

- [ ] Task 5 — Implement `ClienteRepository` in Infrastructure layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`
  - [ ] Inject `AppDbContext`; implement `GetAllAsync` returning `await _context.Clientes.ToListAsync(ct)` and `GetByIdAsync` using `FindAsync`
  - [ ] Implement stub bodies for `AddAsync`, `UpdateAsync`, `DeleteAsync` (to be completed in Stories 2.3–2.5; throw `NotImplementedException` for now)

- [ ] Task 6 — Create `GET /api/v1/clientes` Minimal API endpoint (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with static extension method `MapClienteEndpoints(this IEndpointRouteBuilder app)`
  - [ ] Register endpoint: `app.MapGet("/api/v1/clientes", async (IMediator mediator, CancellationToken ct) => { var result = await mediator.Send(new GetClientesQuery(), ct); return Results.Ok(result); }).WithName("GetClientes").WithTags("Clientes")`
  - [ ] Register in `Program.cs`: `app.MapClienteEndpoints()`
  - [ ] Register `IClienteRepository` → `ClienteRepository` in DI: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`
  - [ ] Register MediatR handler assembly: `builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(GetClientesQueryHandler).Assembly))`

- [ ] Task 7 — EF Core migration for `clientes` table (AC: #5)
  - [ ] Run `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [ ] Verify migration creates `clientes` table with columns: `id UUID PK DEFAULT uuidv7()`, `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at`
  - [ ] Run `dotnet ef database update` to apply migration to `siesa_agents_db`

- [ ] Task 8 — Backend unit tests (AC: #5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
  - [ ] Test: handler calls `GetAllAsync` on repository and maps result to `IEnumerable<ClienteDto>`
  - [ ] Test: handler returns empty enumerable when repository returns empty list
  - [ ] Use Moq or NSubstitute to mock `IClienteRepository`; structure: Arrange / Act / Assert

- [ ] Task 9 — Backend integration test for GET endpoint (AC: #5)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`
  - [ ] Test `GET /api/v1/clientes` returns 200 and JSON array when DB has seeded clients
  - [ ] Test `GET /api/v1/clientes` returns 200 and empty array `[]` when `clientes` table is empty
  - [ ] Use `WebApplicationFactory<Program>` + PostgreSQL TestContainers (company testing standard)
  - [ ] Assert response `id` field matches UUID v4/v7 regex (risk R-008 mitigation)

### Frontend Tasks

- [ ] Task 10 — Define `Cliente` domain entity interface (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`
  - [ ] Export: `export interface Cliente { id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`

- [ ] Task 11 — Define `IClienteRepository` contract (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [ ] Export: `export interface IClienteRepository { getAll(): Promise<Cliente[]>; }`
  - [ ] Add `getById`, `create`, `update`, `delete` stubs (needed by later stories)

- [ ] Task 12 — Implement `clienteApiRepository` in Infrastructure layer (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Implement `IClienteRepository` using the shared Axios instance from `src/shared/lib/apiClient.ts`
  - [ ] `getAll`: `GET /api/v1/clientes` → returns `Cliente[]`
  - [ ] Export a singleton instance: `export const clienteApiRepository = new ClienteApiRepository()`

- [ ] Task 13 — Implement `useClientes` TanStack Query hook (AC: #1, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Use `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`
  - [ ] Return `{ data, isLoading, isError, refetch }` — no additional transformation
  - [ ] `staleTime`: `0` (always fresh on mount per FR27 requirement)

- [ ] Task 14 — Create `ClientListItem` shared component (AC: #1, #6)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [ ] Props: `{ cliente: Cliente; isSelected: boolean; onClick: () => void }`
  - [ ] Render: Nombre as primary text, NIT/RUC as secondary text (smaller, muted)
  - [ ] Apply active/selected visual state using TailwindCSS (e.g., `bg-blue-50 border-l-2 border-blue-600` when `isSelected`)
  - [ ] Accessibility: `role="listitem"`, `aria-label={cliente.nombre + ', NIT/RUC: ' + cliente.nit}`, `aria-current={isSelected ? 'true' : undefined}`
  - [ ] Brand color for selection accent: `#0e79fd` (Siesa Blue) via Tailwind `text-[#0e79fd]` or equivalent token

- [ ] Task 15 — Create `EmptyState` shared component (AC: #3)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `{ message: string; actionLabel?: string; onAction?: () => void }`
  - [ ] Renders centered text message and optional action button using shadcn/ui `Button` component
  - [ ] Default message for clients: passed from caller ("No hay clientes registrados. Crea el primero.")
  - [ ] Accessible: `role="status"` on container

- [ ] Task 16 — Create `ErrorPanel` shared component (AC: #4)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `{ message?: string; onRetry: () => void }`
  - [ ] Default message: "No se pudo cargar la información. Verifica tu conexión."
  - [ ] Renders Heroicons `ExclamationTriangleIcon` + message + shadcn/ui `Button` labeled "Reintentar"
  - [ ] Accessible: `role="alert"` on container

- [ ] Task 17 — Implement `ClienteListView` presentation component (AC: #1, #2, #3, #4, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Fixed width `w-[280px]` left panel with `overflow-y-auto` scroll and full height
  - [ ] Top section: search `<input>` with `placeholder="Buscar por nombre o NIT/RUC"` and `aria-label="Buscar clientes"`
  - [ ] Use `useState<string>('')` for `searchQuery` (local state — no Zustand, no URL param per architecture)
  - [ ] Use `useMemo` to filter `clientes` array: filter by `cliente.nombre.toLowerCase().includes(q)` OR `cliente.nit.toLowerCase().includes(q)` where `q = searchQuery.toLowerCase().trim()`
  - [ ] If `isLoading`: render `react-loading-skeleton` skeleton rows (3–5 rows) — no spinner (company standard)
  - [ ] If `isError`: render `<ErrorPanel onRetry={refetch} />`
  - [ ] If `!isLoading && !isError && filteredClientes.length === 0 && searchQuery === ''`: render `<EmptyState message="No hay clientes registrados. Crea el primero." />`
  - [ ] If `!isLoading && !isError && filteredClientes.length === 0 && searchQuery !== ''`: render `<EmptyState message="No se encontraron clientes con ese criterio." />`
  - [ ] Otherwise: render `<ul role="list">` with a `<ClientListItem>` per filtered client
  - [ ] Props: `{ selectedClienteId?: string; onClienteSelect: (id: string) => void }`

- [ ] Task 18 — Wire `ClienteListView` into the `/clientes` route (AC: #1, #2, #3, #4)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — replace `ClientesPlaceholder` with the split-panel layout
  - [ ] Render `<ClienteListView>` in the left panel (280px) alongside a right panel placeholder (`<div className="flex-1">`) for the detail view (Story 2.2)
  - [ ] Manage `selectedClienteId` via TanStack Router search params (URL is source of truth — architecture spec)
  - [ ] Pass `onClienteSelect` callback that navigates to `/clientes/$clienteId` (Story 2.2 will handle this; for now update the URL param)

- [ ] Task 19 — Frontend component tests (AC: #1, #2, #3, #4, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
  - [ ] Test: renders skeleton when `isLoading` is true (mock `useClientes`)
  - [ ] Test: renders `ErrorPanel` with "Reintentar" button when `isError` is true; clicking retry calls `refetch`
  - [ ] Test: renders `EmptyState` when data array is empty and no search query active
  - [ ] Test: renders list items when data contains clients
  - [ ] Test: typing in search input filters the list in real time (useMemo filter — mock `useClientes` returning 3 clients; type partial Nombre/NIT, assert correct items visible)
  - [ ] Test: typing a query with no match renders `EmptyState` with "no se encontraron" message
  - [ ] Accessibility: use `axe` via `@axe-core/react` to assert no WCAG 2.1 AA violations on the rendered component
  - [ ] Use MSW to mock `GET /api/v1/clientes` for integration-level tests

- [ ] Task 20 — Frontend unit test for `useClientes` hook (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
  - [ ] Test: hook returns data from mocked API call (MSW handler for `GET /api/v1/clientes`)
  - [ ] Test: hook exposes `isError: true` when API returns 500
  - [ ] Wrap in `QueryClientWrapper` test utility

## Dev Notes

### Architecture Patterns

This story implements the first slice of the Clean Architecture + DDD frontend module (`src/modules/crm/clientes/`) and the corresponding backend CQRS read path. It establishes the data layer foundation used by all subsequent Client Management stories (2.2–2.6).

**Frontend architecture flow:**
```
Route: _app/clientes.tsx
  └── ClienteListView.tsx            [presentation]
        └── useClientes.ts           [application — TanStack Query]
              └── clienteApiRepository.ts  [infrastructure — Axios]
                    └── GET /api/v1/clientes
```

**Backend CQRS flow:**
```
ClienteEndpoints.cs (Minimal API)
  └── MediatR → GetClientesQueryHandler.cs  [application]
        └── IClienteRepository.GetAllAsync  [domain interface]
              └── ClienteRepository.cs      [infrastructure — EF Core]
                    └── AppDbContext.Clientes [PostgreSQL clientes table]
```

### Search Strategy

Client-side `useMemo` filter over the TanStack Query cache — no additional backend search endpoint required for this story. This satisfies NFR1 (< 1s with 500 records) because client-side array filter over 500 items takes < 50ms in modern browsers. The `debounce` is NOT needed — `useMemo` is synchronous and `useState` re-renders are batched. Do NOT add a `?q=` query param to the API call in this story.

### State Management

- `searchQuery: string` — `useState` (local, resets on unmount)
- `selectedClienteId: string | null` — TanStack Router search param (URL is source of truth per architecture spec)
- No Zustand store needed for this story

### Key Files to Create

**Frontend:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`

**Files to modify:**
- `frontend/src/routes/_app/clientes.tsx` — replace placeholder with split-panel layout

**Backend:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

**Files to modify:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — add `DbSet<ClienteEntity> Clientes`
- `backend/src/SiesaAgents.API/Program.cs` — register DI and map endpoints

### Backend Entity Pattern

```csharp
// ClienteEntity.cs — mandatory pattern from company standards
public class ClienteEntity : Entity
{
    private ClienteEntity() { } // EF Core requires parameterless constructor

    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        // Validate not null/empty here
        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad
        };
    }
}
// NEVER use DateTime — always DateTimeOffset (company standard)
// EF Core + ApplySnakeCaseNaming() auto-maps: Nombre → nombre, CreatedAt → created_at
```

### API Response Contract

```
GET /api/v1/clientes
Response 200: ClienteDto[]  (direct array, no wrapper object)

[
  {
    "id": "018f1a2b-3c4d-7e5f-a6b7-c8d9e0f1a2b3",
    "nombre": "Acme Colombia S.A.S.",
    "nit": "900123456-7",
    "telefono": "+57 601 234 5678",
    "ciudad": "Bogotá",
    "createdAt": "2026-05-24T10:30:00Z",
    "updatedAt": "2026-05-24T10:30:00Z"
  }
]
```

Dates in ISO 8601 with timezone. `id` must be a UUID (v4 or v7). JSON property names in camelCase (.NET auto-serialization).

### Loading State

Use `react-loading-skeleton` for skeleton rows — NOT a spinner. This is a company UX standard. Example:

```tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

if (isLoading) {
  return <div className="p-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={56} />)}</div>
}
```

### Accessibility Requirements (WCAG 2.1 AA)

- Search input: `aria-label="Buscar clientes"`, `type="search"`
- List container: `role="list"`
- Each item: `role="listitem"`, `aria-label="{nombre}, NIT/RUC: {nit}"`, `aria-current="true"` when selected
- ErrorPanel container: `role="alert"`
- EmptyState container: `role="status"`
- All user-facing text MUST be in Spanish

### siesa-ui-kit Check

This story involves list UI with search, empty state, and error state. Before creating custom components:

1. Check `siesa-ui-kit` catalog for `EmptyState` and `ErrorPanel` equivalents.
2. If equivalents exist in siesa-ui-kit, use them directly instead of creating custom components.
3. `ClientListItem` is a domain-specific component — create custom in `src/shared/components/`.
4. Use shadcn/ui `Button` for the "Reintentar" and EmptyState action buttons.
5. MasterCrud is NOT applicable to this story — it orchestrates full CRUD grids, not split-panel list views with custom detail panels.

### Testing Standards Reference

- Frontend: Vitest + RTL + MSW (company standard)
- Backend: xUnit + EF Core InMemory (unit) + PostgreSQL TestContainers (integration)
- Coverage target: > 80%
- Test structure: Arrange / Act / Assert

Risk R-003 (search performance with 500 records) should be validated with a performance assertion in the component test:

```tsx
const start = performance.now()
fireEvent.change(searchInput, { target: { value: 'acm' } })
expect(performance.now() - start).toBeLessThan(1000)
```

### Project Structure Notes

- This story creates the `src/modules/crm/clientes/` module from scratch. All four Clean Architecture layers must be created: `domain/`, `application/`, `infrastructure/`, `presentation/`.
- `ClientListItem`, `EmptyState`, and `ErrorPanel` belong in `src/shared/components/` because they will be reused in Epic 3 (Contacts) and later epics.
- The backend `Clientes/` domain folder must be created inside all four project layers following the structure in `architecture.md`.
- `_app/clientes.tsx` currently renders a placeholder (`ClientesPlaceholder`) from Story 1.2 — replace it while preserving the `createFileRoute('/_app/clientes')` export.

### References

- Architecture decisions and folder structure: [Source: `_bmad-output/planning-artifacts/architecture.md`]
- Epic 2 story requirements and AC: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1`]
- Test scenarios and risk matrix: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#Risk R-001 through R-010`]
- Company standards — backend entity pattern: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- Company standards — loading states: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Loading States`]
- Company standards — frontend folder structure: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure`]
- MasterCrud reference (not applicable to this story): [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- Story 1.2 navigation shell (existing `/clientes` route): [Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`]
- Story 1.3 backend database foundation (AppDbContext, snake_case setup): [Source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
