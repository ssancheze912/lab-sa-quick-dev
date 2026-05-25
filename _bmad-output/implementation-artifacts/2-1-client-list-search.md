# Story 2.1: Client List & Search

Status: pending

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px) renders a scrollable list of all clients with Nombre and NIT/RUC visible per item (FR1, FR2).

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (AC-E2.2, NFR1). No additional GET request is sent to the backend on each keystroke.

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client (variant `no-clients`).

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list; clicking "Reintentar" triggers a new fetch (NFR6).

5. **Given** the search field is cleared after a search, **When** the input becomes empty, **Then** the full client list is restored without triggering a new API call.

## Tasks / Subtasks

- [ ] Task 1 — Define `Cliente` domain entity and repository interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface with fields: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface declaring `getAll(): Promise<Cliente[]>` and `getById(id: string): Promise<Cliente>`

- [ ] Task 2 — Implement API client and repository (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios implementation of `IClienteRepository` calling `GET /api/v1/clientes` via the singleton `apiClient` from `src/shared/lib/apiClient.ts`

- [ ] Task 3 — Implement `useClientes` TanStack Query hook (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — `useQuery` hook with `queryKey: ['clientes']`, `queryFn` delegating to `clienteApiRepository.getAll()`, `staleTime: 0`
  - [ ] Export `data`, `isLoading`, `isError`, and `refetch` from the hook

- [ ] Task 4 — Implement `ClienteListView` component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] The component renders a fixed-width (280px on `lg:` and up, full-width on mobile) panel with a search `Input` (siesa-ui-kit) and a scrollable list below
  - [ ] Search input placeholder: `"Buscar por nombre o NIT..."`, `aria-label="Buscar clientes"`, wrapped in a `role="search"` container
  - [ ] Filtering logic: `useMemo` over the `useClientes` data array, matching `nombre.toLowerCase()` or `nit.toLowerCase()` against the lower-cased search term — no debounce required (client-side < 50ms for 500 records)
  - [ ] Search state managed with `useState<string>('')` local to the component (NOT Zustand)
  - [ ] When `isLoading`: render `react-loading-skeleton` placeholders matching `ClientListItem` shape (3 skeleton items)
  - [ ] When `isError`: render `ErrorPanel` (see Task 6) with `onRetry={refetch}`
  - [ ] When loaded and array is empty: render `EmptyState` variant `no-clients` (see Task 6)
  - [ ] When loaded with items: render a list of `ClientListItem` components (see Task 5)
  - [ ] `aria-busy="true"` on the list container while `isLoading` is true

- [ ] Task 5 — Implement `ClientListItem` shared component (AC: #1)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [ ] Props: `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`
  - [ ] Displays: `nombre` (bold, `text-sm font-semibold text-slate-800`), `nit` (`text-xs text-slate-500`)
  - [ ] States: default (`bg-white border border-slate-200`), hover (`bg-slate-50`), selected (`border-l-4 border-l-[#0e79fd] bg-[#eff6ff]`)
  - [ ] Accessibility: `role="button"`, `tabIndex={0}`, `aria-label="Ver cliente: {nombre}"`, keyboard handler for `Enter` and `Space`
  - [ ] Minimum height 44px for touch target compliance (WCAG 2.1 AA)

- [ ] Task 6 — Implement `EmptyState` and `ErrorPanel` shared components (AC: #3, #4)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`
    - [ ] Props: `variant: 'no-clients' | 'search-empty' | 'no-contacts'`, `onAction?: () => void`
    - [ ] `no-clients` variant: Heroicons `UsersIcon`, title `"No hay clientes registrados"`, subtitle `"Crea el primer cliente del sistema"`, CTA button `"Nuevo cliente"` (calls `onAction`)
    - [ ] `search-empty` variant: Heroicons `MagnifyingGlassIcon`, title `"No se encontró ningún cliente"`, subtitle `"Intenta con otro nombre o NIT"`, no CTA
    - [ ] `aria-live="polite"` on the container to announce changes to screen readers
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
    - [ ] Props: `message?: string`, `onRetry: () => void`
    - [ ] Default message: `"No se pudo cargar la información"`
    - [ ] Renders a "Reintentar" button (siesa-ui-kit `Button` outline) that calls `onRetry`
    - [ ] No raw error codes or stack traces exposed

- [ ] Task 7 — Wire `ClienteListView` into the `/clientes` route (AC: #1, #3, #4)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` to replace the placeholder with the split-panel layout:
    - `ClienteListView` (280px fixed on `lg:`, full-width stack on mobile)
    - A detail placeholder panel (flex-1) showing `"Selecciona un cliente para ver sus detalles"` — full panel implementation is Story 2.2
  - [ ] Pass `onClienteSelect` callback from the route to `ClienteListView`; the selected `clienteId` is stored in a `useState` local to the route component for now (Stories 2.2+ will use the URL param)
  - [ ] Layout: `flex flex-col lg:flex-row h-full` container, `ClienteListView` with `w-full lg:w-[280px] flex-shrink-0`

- [ ] Task 8 — Backend: `ClienteEntity` and EF Core configuration (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
    - [ ] Properties: `Guid Id` (UUID PK, `Guid.NewGuid()`), `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt` (UTC), `DateTimeOffset UpdatedAt` (UTC)
    - [ ] Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory method
    - [ ] NEVER use `DateTime` — only `DateTimeOffset`
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — interface declaring `Task<IEnumerable<ClienteEntity>> GetAllAsync()` and `Task<ClienteEntity?> GetByIdAsync(Guid id)`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — `IEntityTypeConfiguration<ClienteEntity>` configuring: table name `clientes`, PK `id`, unique index `uk_clientes_nit` on `nit`, `OnDelete` not applicable (no FK here)
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
  - [ ] Create and run EF Core migration: `dotnet ef migrations add AddClienteEntity --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations` from `backend/`

- [ ] Task 9 — Backend: `GetClientesQuery` and `GetClientesQueryHandler` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — record with no parameters
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — `IRequestHandler<GetClientesQuery, IEnumerable<ClienteDto>>` injecting `IClienteRepository`, returning `await _repo.GetAllAsync()` mapped to `ClienteDto`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`

- [ ] Task 10 — Backend: `ClienteRepository` EF Core implementation (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository` injecting `AppDbContext`, `GetAllAsync` returns `await _context.Clientes.OrderByDescending(c => c.CreatedAt).ToListAsync()`, `GetByIdAsync` returns `await _context.Clientes.FindAsync(id)`
  - [ ] Register `IClienteRepository → ClienteRepository` in `Program.cs` DI: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`

- [ ] Task 11 — Backend: `GET /api/v1/clientes` Minimal API endpoint (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — static class with `MapClienteEndpoints(this IEndpointRouteBuilder app)` extension method
  - [ ] Register `GET /api/v1/clientes` → calls `GetClientesQueryHandler`, returns `Results.Ok(dtos)` (direct array, no wrapper object per architecture contract)
  - [ ] Wire `app.MapClienteEndpoints()` in `Program.cs` after middleware
  - [ ] Response: HTTP 200, `Content-Type: application/json`, array of `ClienteDto` objects

- [ ] Task 12 — Unit and component tests (AC: #1–#5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
    - [ ] Test: hook returns data from MSW-mocked GET `/api/v1/clientes`
    - [ ] Test: hook returns `isError: true` on network failure
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
    - [ ] Test (TC-E2-P1-06): real-time search filters list by nombre without additional API call
    - [ ] Test (TC-E2-P1-07): real-time search filters list by NIT/RUC partial match
    - [ ] Test (TC-E2-P2-01): EmptyState rendered when GET returns empty array
    - [ ] Test (TC-E2-P2-02): ErrorPanel with "Reintentar" rendered on fetch failure; clicking retry triggers new fetch
    - [ ] Test (TC-E2-P2-09): 500-item list filtered in under 1000ms
    - [ ] Test: clearing search input restores full list
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
    - [ ] Test: `ClienteEntity.Create(...)` sets all fields correctly and `Id` is a non-empty Guid
    - [ ] Test: `CreatedAt` and `UpdatedAt` are `DateTimeOffset` (not `DateTime`)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - [ ] Test (TC-E2-P1-02): handler returns all seeded clients as `ClienteDto` list
  - [ ] Run `pnpm --dir frontend test` and `dotnet test backend/` and verify all new tests pass

## Dev Notes

### Domain Entity Pattern (Backend)

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { } // EF Core

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
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
```

### EF Core Configuration Pattern

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
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
        // ApplySnakeCaseNaming() in AppDbContext handles column naming automatically
    }
}
```

### Minimal API Endpoint Pattern

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(clientes);
        });

        return app;
    }
}
```

**Register in `Program.cs`:** `app.MapClienteEndpoints();`

### Frontend Domain Entity Interface

```typescript
// frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string  // ISO 8601 DateTimeOffset
  updatedAt: string  // ISO 8601 DateTimeOffset
}
```

### TanStack Query Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 0,
  })
}
```

### Client-Side Filtering Pattern (ClienteListView)

```typescript
// Inside ClienteListView.tsx — NO debounce, NO new API call
const [searchTerm, setSearchTerm] = useState('')

const filteredClientes = useMemo(() => {
  if (!clientes) return []
  const term = searchTerm.toLowerCase().trim()
  if (!term) return clientes
  return clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(term) ||
      c.nit.toLowerCase().includes(term)
  )
}, [clientes, searchTerm])
```

### Split-Panel Layout (Route Level)

```typescript
// frontend/src/routes/_app/clientes.tsx
// Desktop: [ClienteListView 280px] | [Detail panel flex-1]
// Mobile: stacked single column
<div className="flex flex-col lg:flex-row h-full overflow-hidden">
  <div className="w-full lg:w-[280px] flex-shrink-0 border-r border-slate-200 overflow-y-auto">
    <ClienteListView onClienteSelect={setSelectedId} selectedId={selectedId} />
  </div>
  <div className="flex-1 overflow-y-auto">
    {/* Story 2.2 will implement the detail panel */}
    {selectedId ? (
      <p className="p-6 text-slate-500">Cargando detalle...</p>
    ) : (
      <p className="p-6 text-slate-500">Selecciona un cliente para ver sus detalles</p>
    )}
  </div>
</div>
```

### EmptyState Component

```typescript
// frontend/src/shared/components/EmptyState.tsx
import { UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type EmptyStateVariant = 'no-clients' | 'search-empty' | 'no-contacts'

interface EmptyStateProps {
  variant: EmptyStateVariant
  onAction?: () => void
}

const config: Record<EmptyStateVariant, { icon: React.ComponentType<{ className?: string }>, title: string, subtitle: string, cta?: string }> = {
  'no-clients': { icon: UsersIcon, title: 'No hay clientes registrados', subtitle: 'Crea el primer cliente del sistema', cta: 'Nuevo cliente' },
  'search-empty': { icon: MagnifyingGlassIcon, title: 'No se encontró ningún cliente', subtitle: 'Intenta con otro nombre o NIT' },
  'no-contacts': { icon: UsersIcon, title: 'Este cliente no tiene contactos', subtitle: 'Agrega el primer contacto para este cliente', cta: 'Agregar contacto' },
}
```

### API Response Shape (Direct Array)

```
GET /api/v1/clientes → HTTP 200, Content-Type: application/json
Body: [
  { "id": "uuid", "nombre": "ACME S.A.", "nit": "900123456-1", "telefono": "6014567890", "ciudad": "Bogotá", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "2026-03-12T10:30:00Z" },
  ...
]
```

No wrapper object — direct array per architecture contract.

### Testing Approach

- **Frontend:** Vitest + RTL + MSW. MSW mocks `GET /api/v1/clientes`. All component tests use `QueryClientProvider` wrapper.
- **Backend unit:** xUnit + EF Core InMemory (`Microsoft.EntityFrameworkCore.InMemory`). Tests in `SiesaAgents.UnitTests`.
- **Test structure:** Arrange / Act / Assert per company standard.
- **P0 tests for this story:** TC-E2-P1-02 (GetClientesQueryHandler), TC-E2-P1-06 (real-time search no API call), TC-E2-P1-07 (search by NIT), TC-E2-P2-01 (EmptyState), TC-E2-P2-02 (ErrorPanel + retry), TC-E2-P2-09 (500-record filter < 1s).

### skeleton Loading Pattern

```typescript
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Inside ClienteListView, isLoading branch:
Array.from({ length: 3 }).map((_, i) => (
  <div key={i} className="p-3 border border-slate-200 rounded-md">
    <Skeleton width="70%" height={16} />
    <Skeleton width="50%" height={12} className="mt-1" />
  </div>
))
```

### WCAG 2.1 AA Compliance

- Search field: `aria-label="Buscar clientes"` + `role="search"` on container
- `aria-busy="true"` on list container while loading
- `aria-live="polite"` on EmptyState and ErrorPanel containers
- `ClientListItem`: `role="button"`, `tabIndex={0}`, `aria-label="Ver cliente: {nombre}"`, keyboard events for `Enter` + `Space`
- All user-facing text in Spanish: labels, placeholders, empty states, error messages
- Minimum touch target 44px (WCAG 2.1 AA)

### Dependencies on Previous Stories

- Story 1.1: `pnpm`, Vite 7, React 18, TanStack Query, `src/shared/lib/apiClient.ts`, `src/shared/lib/queryClient.ts`, `src/app/providers/QueryProvider.tsx` all initialized.
- Story 1.2: TanStack Router file-based routing active; `src/routes/_app/clientes.tsx` exists as placeholder — update in Task 7.
- Story 1.3: `AppDbContext` configured with `ApplySnakeCaseNaming()`; `ExceptionHandlingMiddleware` registered; EF Core + PostgreSQL dependency available.
- Backend migration from Story 1.3 creates empty `InitialCreate` — this story adds `AddClienteEntity` migration on top.

### Critical Implementation Constraints (from test-design-epic-2.md)

1. `useClientes` must use `queryKey: ['clientes']` (canonical key — array form, NOT string).
2. Search filtering MUST use `useMemo` — never fire `GET /api/v1/clientes?q=...` on keystroke (TC-E2-P1-06).
3. `ErrorPanel` must call `refetch` from `useClientes` when "Reintentar" is clicked — NOT a full page reload.
4. `EmptyState` aria-live container must announce changes to screen readers.
5. `ClienteEntity.CreatedAt` and `UpdatedAt` must be `DateTimeOffset` — NEVER `DateTime`.
6. Unique index on `nit` column (`uk_clientes_nit`) must be defined in `ClienteConfiguration` — required for Story 2.3 duplicate NIT detection (TC-E2-P0-06).

### References

- Search strategy (client-side filter): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Search Strategy]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- TanStack Query keys (canonical): [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Split-panel layout dimensions: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design]
- EmptyState component spec: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy — EmptyState]
- ClientListItem component spec: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy — ClientListItem]
- API response shapes: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- ClienteEntity DB table spec: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — PostgreSQL tables]
- Test cases: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md — TC-E2-P1-02, TC-E2-P1-06, TC-E2-P1-07, TC-E2-P2-01, TC-E2-P2-02, TC-E2-P2-09]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Backend DateTimeOffset rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- EF Core naming conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]

## Dev Agent Record

### Agent Model Used

N/A

### Debug Log References

N/A

### Completion Notes List

N/A

### File List

N/A
