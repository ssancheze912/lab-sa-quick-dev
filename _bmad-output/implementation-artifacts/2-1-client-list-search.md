# Story 2.1: Client List & Search

Status: ready

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients, with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the GET `/api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list; clicking "Reintentar" triggers a refetch.

5. **Given** the client list renders, **When** the user has not set any sort preference, **Then** clients are displayed in "Más reciente" order (newest `createdAt` first) by default.

## Tasks / Subtasks

- [x] Task 1 — Create `ClienteEntity` domain type and `IClienteRepository` contract on the frontend (AC: #1)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` with interface: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` declaring `getAll(): Promise<Cliente[]>` and `getById(id: string): Promise<Cliente>`

- [x] Task 2 — Implement `clienteApiRepository` in the infrastructure layer (AC: #1, #4)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` implementing `IClienteRepository`
  - [x] Use `apiClient` from `src/shared/lib/apiClient.ts` — `GET /api/v1/clientes` for `getAll()`, `GET /api/v1/clientes/{id}` for `getById(id)`
  - [x] Export the repository as a singleton instance used by all hooks

- [x] Task 3 — Implement `useClientes` hook in the application layer (AC: #1, #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [x] Use `useQuery` from TanStack Query with `queryKey: ['clientes']` calling `clienteApiRepository.getAll()`
  - [x] Export `{ data, isLoading, isError, refetch }` — no transformation in this hook; filtering is done at the component level via `useMemo`

- [x] Task 4 — Create shared `EmptyState` component (AC: #3)
  - [x] Create `frontend/src/shared/components/EmptyState.tsx`
  - [x] Props: `title: string`, `description?: string`, `action?: React.ReactNode`
  - [x] Check siesa-ui-kit catalog for an equivalent component first; create custom only if absent
  - [x] Render a centered layout with the provided title, optional description, and optional CTA slot

- [x] Task 5 — Create shared `ErrorPanel` component (AC: #4)
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - [x] Props: `onRetry: () => void`, `message?: string`
  - [x] Check siesa-ui-kit catalog first; create custom only if absent
  - [x] Render error icon (Heroicons), default Spanish message "No se pudieron cargar los datos", and a "Reintentar" button that calls `onRetry`

- [x] Task 6 — Create shared `ClientListItem` component (AC: #1)
  - [x] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [x] Props: `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`
  - [x] Display `nombre` (primary text) and `nit` (secondary text)
  - [x] Apply selected state styling using brand primary `#0e79fd` / Tailwind `bg-blue-50 border-l-4 border-blue-600`
  - [x] Accessible: `role="button"`, `aria-pressed={isSelected}`, `aria-label={nombre}`

- [x] Task 7 — Implement `ClienteListView` presentation component (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [x] Layout: fixed-width 280px left panel (`w-[280px] h-full flex flex-col border-r border-slate-200`)
  - [x] Render a search `<input>` at the top with `placeholder="Buscar por nombre o NIT/RUC"` and `aria-label="Buscar clientes"`
  - [x] Controlled search state via `useState<string>('')` — `searchQuery`
  - [x] Filter logic: `useMemo` over `clientes` array; match `cliente.nombre` or `cliente.nit` case-insensitively against `searchQuery`
  - [x] Sort state via `useState<SortOption>('fecha-desc')` — sort applied via `useMemo` over filtered array (after filter, before render)
  - [x] Scrollable list container: `overflow-y-auto flex-1`
  - [x] Map filtered+sorted array to `<ClientListItem>` components
  - [x] When `isLoading`: render skeleton placeholders using `react-loading-skeleton` (3 skeleton rows)
  - [x] When `isError`: render `<ErrorPanel onRetry={refetch} />`
  - [x] When data is empty array (and not loading): render `<EmptyState title="Sin clientes" description="Aún no hay clientes registrados. Crea el primero." />`
  - [x] Props: `selectedClienteId?: string`, `onClienteSelect: (id: string) => void`

- [x] Task 8 — Update `/clientes` route to render `ClienteListView` (AC: #1)
  - [x] Replace placeholder content in `frontend/src/routes/_app/clientes.tsx` with the `ClienteListView`
  - [x] Wire `onClienteSelect` to navigate to `/clientes/$clienteId` via TanStack Router's `useNavigate`
  - [x] Pass `selectedClienteId` from `useParams()` or route search params so the active item is highlighted
  - [x] Right panel placeholder: render `<div className="flex-1">` with a siesa-ui-kit or Tailwind centered message "Selecciona un cliente para ver su detalle" when no clienteId is in the URL

- [x] Task 9 — Backend: Add `ClienteEntity` domain entity (AC: backend contract for #1)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [x] Fields: `Guid Id` (= `Guid.NewGuid()`), `string Nombre`, `string NIT`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt` (= `DateTimeOffset.UtcNow`), `DateTimeOffset UpdatedAt` (= `DateTimeOffset.UtcNow`)
  - [x] Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory method
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` declaring `Task<IEnumerable<ClienteEntity>> GetAllAsync()` (returns entities — IClientesDbContext interface created in Application to avoid circular dep)

- [x] Task 10 — Backend: Add `ClienteDto` and `GetClientesQuery` + handler (AC: backend contract for #1)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` with properties: `Guid Id`, `string Nombre`, `string NIT`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (empty record/class marker)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` calling `IClientesDbContext` and returning `IEnumerable<ClienteDto>`

- [x] Task 11 — Backend: Implement `ClienteRepository` and EF Core configuration (AC: backend contract for #1)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`
    - Table: `clientes` (or via naming convention — do not use `[Table]` attribute)
    - `HasIndex(x => x.NIT).IsUnique().HasDatabaseName("uk_clientes_nit")`
    - `Property(x => x.Nombre).IsRequired().HasMaxLength(200)`
    - `Property(x => x.NIT).IsRequired().HasMaxLength(50)`
    - `Property(x => x.Telefono).IsRequired().HasMaxLength(50)`
    - `Property(x => x.Ciudad).IsRequired().HasMaxLength(100)`
  - [x] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository` using `AppDbContext`
    - `GetAllAsync()`: `await _context.Clientes.OrderByDescending(c => c.CreatedAt).ToListAsync()` — map to `ClienteDto`
  - [x] Add `clientes` EF Core migration: created manually as `20260603000001_AddClientesTable.cs` (dotnet CLI unavailable)

- [x] Task 12 — Backend: Register services and expose `GET /api/v1/clientes` endpoint (AC: backend contract for #1, #4)
  - [x] Register `IClienteRepository` → `ClienteRepository` in `Program.cs` DI
  - [x] Register `GetClientesQueryHandler` in `Program.cs` DI
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with static extension method `MapClienteEndpoints(this WebApplication app)`
  - [x] Map `GET /api/v1/clientes` → calls `GetClientesQueryHandler.HandleAsync()` → returns `Results.Ok(clientes)` (200) or empty array `[]` (never 404)
  - [x] Call `app.MapClienteEndpoints()` in `Program.cs`

- [x] Task 13 — Write frontend unit and component tests (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`
    - Unit test: verify `queryKey` is `['clientes']` (TC-E2-P3-01)
    - Component test via `renderHook` with QueryClientProvider + MSW
  - [x] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`
    - TC-E2-P1-07: real-time search filters by nombre and NIT
    - TC-E2-P1-08: `EmptyState` rendered when `GET /api/v1/clientes` returns `[]`
    - TC-E2-P1-09: `ErrorPanel` rendered with "Reintentar" button when fetch returns 500
    - TC-E2-P1-14: default sort is "Más reciente" (newest client first)
    - TC-E2-P3-03: search keystrokes not dropped (type 5 chars, final filter matches)
    - TC-E2-P3-04: search renders in ≤ 150ms with 500 mock records
  - [x] Create `frontend/src/shared/components/__tests__/EmptyState.test.tsx` — renders title and description props
  - [x] Create `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` — renders "Reintentar" button and calls `onRetry`

- [x] Task 14 — Write backend unit tests (AC: backend contract)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - Unit test using EF Core InMemory: seed 3 `ClienteEntity` records → call handler → assert 3 DTOs returned with correct field mapping
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
    - Test: `ClienteEntity.Create(...)` sets all fields correctly, `Id` is non-empty Guid, `CreatedAt` is `DateTimeOffset`
  - [x] Add `TC-E2-P1-01` xUnit integration test in `SiesaAgents.IntegrationTests` if the project exists:
    - Seed 3 clients → `GET /api/v1/clientes` → assert 200 + JSON array with 3 elements
  - [x] Add `TC-E2-P2-07` xUnit integration test:
    - Empty DB → `GET /api/v1/clientes` → assert 200 + `[]`

## Dev Notes

### Architecture Context

This story creates the foundational module structure for the `clientes` domain. It establishes the frontend Clean Architecture layers (domain → application → infrastructure → presentation) and the backend CQRS query path (Query → Handler → Repository → EF Core). Only the `GET /api/v1/clientes` endpoint is implemented in this story; the full CRUD (POST, PUT, DELETE) is covered in Stories 2.3–2.5.

### Frontend: `Cliente` Domain Type

```typescript
// frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string   // ISO 8601 string from API
  updatedAt: string
}
```

### Frontend: `useClientes` Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  })
}
```

### Frontend: Real-time Search + Sort via `useMemo`

Search and sort are both client-side operations over the TanStack Query cache — NO additional API calls are triggered. Apply filter first, then sort:

```typescript
// Inside ClienteListView.tsx
const [searchQuery, setSearchQuery] = useState('')
const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')

const filtered = useMemo(() => {
  if (!clientes) return []
  const q = searchQuery.toLowerCase()
  return clientes.filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.nit.toLowerCase().includes(q)
  )
}, [clientes, searchQuery])

const sorted = useMemo(() => {
  return [...filtered].sort((a, b) => {
    switch (sortOption) {
      case 'nombre-asc':  return a.nombre.localeCompare(b.nombre)
      case 'nombre-desc': return b.nombre.localeCompare(a.nombre)
      case 'fecha-asc':   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'fecha-desc':
      default:            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
}, [filtered, sortOption])
```

`SortOption` type: `'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'`

The `SortControl` component lives at `src/shared/components/SortControl` (Story 2.6 creates it; in this story, use a simple `<select>` placeholder or leave sort hardcoded to `fecha-desc` if SortControl is not yet available).

### Frontend: Loading Skeleton Pattern

Use `react-loading-skeleton` (already installed in Story 1.1):

```typescript
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// While isLoading:
{Array.from({ length: 3 }).map((_, i) => (
  <div key={i} className="px-4 py-3 border-b border-slate-100">
    <Skeleton height={16} width="70%" />
    <Skeleton height={12} width="40%" className="mt-1" />
  </div>
))}
```

### Frontend: Route Structure for `/clientes`

The route `frontend/src/routes/_app/clientes.tsx` currently renders a placeholder. Replace it:

```typescript
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  const navigate = useNavigate()
  // selectedClienteId comes from nested route — pass undefined at list level
  return (
    <div className="flex h-full">
      <ClienteListView
        onClienteSelect={(id) => navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })}
      />
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Selecciona un cliente para ver su detalle
      </div>
    </div>
  )
}
```

**Note:** The `clientes.$clienteId.tsx` nested route (Story 2.2) will replace the right panel placeholder. This story only renders the left panel + placeholder right panel.

### Backend: `ClienteEntity` Pattern

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string NIT { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { }   // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
            Nombre = nombre,
            NIT = nit,
            Telefono = telefono,
            Ciudad = ciudad,
        };
    }

    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        Nombre = nombre;
        NIT = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
```

**CRITICAL**: Use `DateTimeOffset` — never `DateTime`. Use `Guid` for `Id` — never `int` or `string`.

### Backend: `ClienteConfiguration.cs` Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.NIT).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        builder.HasIndex(c => c.NIT)
               .IsUnique()
               .HasDatabaseName("uk_clientes_nit");
    }
}
```

After `ApplyConfigurationsFromAssembly` in `AppDbContext` and with `UseSnakeCaseNamingConvention()`, EF Core will map `ClienteEntity` → table `clientes`, `NIT` → column `nit`, `CreatedAt` → column `created_at`, etc. No `[Table]` or `[Column]` attributes needed.

### Backend: Migration Note

If `dotnet` CLI is not available in CI:
- Create migration file manually: `backend/src/SiesaAgents.Infrastructure/Data/Migrations/{timestamp}_AddClientesTable.cs`
- Up() must call `migrationBuilder.CreateTable("clientes", ...)` with columns: `id uuid`, `nombre varchar(200)`, `nit varchar(50)`, `telefono varchar(50)`, `ciudad varchar(100)`, `created_at timestamptz`, `updated_at timestamptz`
- Create unique index: `migrationBuilder.CreateIndex("uk_clientes_nit", "clientes", "nit", unique: true)`
- Follow the existing `20260603000000_InitialCreate.cs` structure in `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`
- Update `AppDbContextModelSnapshot.cs` to include the `clientes` entity

### Backend: `GET /api/v1/clientes` Endpoint

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync();
            return Results.Ok(clientes);
        })
        .WithName("GetClientes")
        .WithSummary("Get all clients");
    }
}
```

Register in `Program.cs`: `app.MapClienteEndpoints();`

### Backend: DI Registration

In `Program.cs`, add before `var app = builder.Build()`:

```csharp
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
```

### API Response Shape

Per architecture.md Format Patterns:
- `GET /api/v1/clientes` → 200 OK, direct JSON array (no wrapper object), empty `[]` when no clients
- Each item: `{ "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "..." }`
- .NET `DateTimeOffset` serializes to ISO 8601 with timezone by default — no custom serializer needed

### Testing: MSW Handler Pattern for `GET /api/v1/clientes`

```typescript
// In test files using MSW
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const mockClientes = [
  { id: '1', nombre: 'Banco Nacional', nit: '800100200-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  // ...
]

const server = setupServer(
  http.get('http://localhost:5000/api/v1/clientes', () => HttpResponse.json(mockClientes))
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Testing: `EmptyState` and `ErrorPanel` Behavior

- Empty list: `GET /api/v1/clientes` → `[]` — `EmptyState` must be rendered, not an empty `<ul>`
- Fetch error: `GET /api/v1/clientes` → `HttpResponse.error()` or `{ status: 500 }` — `ErrorPanel` must appear with "Reintentar" button; never display `error.message`
- Error isolation: `<ErrorPanel onRetry={refetch} />` where `refetch` is the TanStack Query refetch function — do NOT pass raw error text to UI

### Previous Story Context

- Story 1.1: `apiClient` singleton at `frontend/src/shared/lib/apiClient.ts` (Axios, `baseURL: import.meta.env.VITE_API_URL`). Already installed: `@tanstack/react-query`, `zustand`, `react-loading-skeleton`, `siesa-ui-kit`, `axios`, `zod`.
- Story 1.2: Routes `_app/clientes.tsx` and `_app/contactos.tsx` exist as placeholders. This story replaces `_app/clientes.tsx` with real content. `_app.tsx` pathless layout wraps the navigation shell.
- Story 1.3: `AppDbContext.cs` exists with `UseSnakeCaseNamingConvention()` in `OnModelCreating`. `ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` is called — adding `ClienteConfiguration.cs` to `Configurations/` is sufficient; no manual registration needed.
- `pnpm` is mandatory — do NOT use `npm` or `yarn`.
- `siesa-ui-kit` must be checked first for `EmptyState` and `ErrorPanel` equivalents; create custom only if absent. Document the decision in Dev Agent Record.

### Git Commit Convention

```
feat(story-2.1): implement client list panel with real-time search
```

### References

- Epic source and AC: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Frontend module structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Search strategy (client-side filter): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- TanStack Query keys canonical: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- API endpoint contracts: [Source: _bmad-output/planning-artifacts/architecture.md#API Communication Patterns]
- ClienteEntity naming and types: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- EmptyState + ErrorPanel anti-patterns: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- EF Core snake_case + configuration assembly scan: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- Test cases TC-E2-P1-01, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09, TC-E2-P1-14, TC-E2-P2-07, TC-E2-P3-01, TC-E2-P3-03, TC-E2-P3-04: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- NIT uniqueness constraint `uk_clientes_nit`: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Notes for Story Implementation Agents]
- Loading skeleton pattern: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Previous stories learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md, _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Vite 8 OXC rejects JSX in `.ts` files: resolved by adding custom `babelJsxInTsPlugin` with `enforce: 'pre'` in `vite.config.ts` using `@babel/core` + `@babel/preset-react` + `@babel/preset-typescript`
- Circular dependency Application ↔ Infrastructure: resolved by creating `IClientesDbContext` interface in Application project; `AppDbContext` implements it
- `IClienteRepository` in Domain was returning `IEnumerable<ClienteDto>`: changed to `IEnumerable<ClienteEntity>` to preserve Domain independence
- Factory import path mismatch (`../../../../shared/factories/` resolves to `src/modules/shared/`): resolved by creating re-export file `src/modules/shared/factories/cliente.factory.ts`
- Navigation test regression after route change: resolved by adding `QueryProvider` wrapper in `_app.tsx` and preserving `data-testid="clientes-view"` attribute
- Performance test TC-E2-P3-04 flaky with 500 items: resolved with pre-computed lowercase memos, `React.memo` on list components, and `useTransition` with deferred query state

### Completion Notes List

- siesa-ui-kit has no `EmptyState` or `ErrorPanel` equivalents; custom components created at `src/shared/components/`
- `IClientesDbContext` interface pattern used instead of direct `AppDbContext` reference in Application layer (Ports and Adapters)
- EF Core migration `20260603000001_AddClientesTable.cs` created manually (dotnet CLI unavailable in CI)
- All 91 frontend tests pass (2 skipped); backend tests implemented (dotnet CLI unavailable for execution)
- `useTransition` + `useMemo` pre-computation + `React.memo` applied to meet ≤150ms performance AC with 500 records

### File List

- `frontend/src/modules/crm/clientes/domain/Cliente.ts` (created)
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` (created)
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` (created)
- `frontend/src/modules/crm/clientes/application/useClientes.ts` (created)
- `frontend/src/shared/components/EmptyState.tsx` (created)
- `frontend/src/shared/components/ErrorPanel.tsx` (created)
- `frontend/src/shared/components/ClientListItem.tsx` (created)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (created)
- `frontend/src/routes/_app/clientes.tsx` (modified)
- `frontend/src/routes/_app.tsx` (modified — added QueryProvider)
- `frontend/src/modules/shared/factories/cliente.factory.ts` (created — re-export shim)
- `frontend/vite.config.ts` (modified — added babelJsxInTsPlugin)
- `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts` (created)
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` (created)
- `frontend/src/shared/components/__tests__/EmptyState.test.tsx` (created)
- `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` (created)
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (created)
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (created)
- `backend/src/SiesaAgents.Application/Interfaces/IClientesDbContext.cs` (created)
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` (created)
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (created)
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` (created)
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` (modified — added EF Core package ref)
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` (created)
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (modified — added Clientes DbSet, implements IClientesDbContext)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (created)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260603000001_AddClientesTable.cs` (created)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` (modified — added ClienteEntity)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (created)
- `backend/src/SiesaAgents.API/Program.cs` (modified — registered services and mapped endpoints)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (created)
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` (created)
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/GetClientesIntegrationTests.cs` (created)
