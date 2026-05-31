# Story 2.1: Client List & Search

Status: ready

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px wide) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), and results appear in under 1 second with up to 500 records (NFR1). No additional API call is triggered during typing — filtering is client-side over the TanStack Query cache.

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a Spanish message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list. Clicking "Reintentar" triggers a new fetch.

5. **Given** the backend returns client data, **When** `GET /api/v1/clientes` is called, **Then** the response is a direct JSON array (not wrapped) where each item contains `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (DateTimeOffset ISO 8601), `updatedAt` (DateTimeOffset ISO 8601).

## Tasks / Subtasks

- [ ] Task 1 — Create `ClienteEntity` in Domain layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Fields: `Id` (Guid, `= Guid.NewGuid()`), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset, `= DateTimeOffset.UtcNow`), `UpdatedAt` (DateTimeOffset, `= DateTimeOffset.UtcNow`)
  - [ ] Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory method
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with `GetAllAsync()` and `GetByIdAsync(Guid id)` methods (write methods deferred to Stories 2.3, 2.4, 2.5)

- [ ] Task 2 — Add `ClienteEntity` to Infrastructure layer (AC: #5)
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`
    - [ ] `ToTable("clientes")` — override auto-pluralized entity name
    - [ ] `HasKey(c => c.Id)` with column `id`
    - [ ] `HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")` — required for 409 NIT conflict (Story 2.3; add now to prevent migration conflicts)
    - [ ] All string properties mapped with appropriate `IsRequired()` constraints
  - [ ] Create EF Core migration: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`

- [ ] Task 3 — Create `GetClientesQuery` in Application layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (record or class — no fields needed)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
    - [ ] Inject `IClienteRepository`
    - [ ] Returns `IEnumerable<ClienteDto>`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` with properties: `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository` using `AppDbContext`; `GetAllAsync()` returns all clients ordered by `CreatedAt` descending

- [ ] Task 4 — Create `GET /api/v1/clientes` endpoint (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with `MapClienteEndpoints(WebApplication app)` extension method
  - [ ] Register `GET /api/v1/clientes` → invokes `GetClientesQueryHandler`, returns 200 with direct array response
  - [ ] Register `ClienteEndpoints` in `Program.cs`: `app.MapClienteEndpoints()`
  - [ ] Register `IClienteRepository` → `ClienteRepository` as scoped in `Program.cs`
  - [ ] Register `GetClientesQueryHandler` (or use direct instantiation in endpoint) in DI

- [ ] Task 5 — Create frontend domain + infrastructure layer (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface with fields: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient` (Axios singleton at `src/shared/lib/apiClient.ts`); calls `GET /api/v1/clientes`

- [ ] Task 6 — Create `useClientes` TanStack Query hook (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Query key: `['clientes']` (array, never string)
  - [ ] Uses `clienteApiRepository.getAll()` as `queryFn`
  - [ ] `staleTime: 1000 * 60` (inherits from `queryClient` default)
  - [ ] Returns `{ data, isLoading, isError, refetch }` — `refetch` exposed for "Reintentar" button

- [ ] Task 7 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Fixed-width left panel: `w-[280px]` (Tailwind) with `overflow-y-auto`
  - [ ] Search input at the top: `placeholder="Buscar cliente..."` — uses local `useState` for `searchQuery`
  - [ ] Client-side real-time filter via `useMemo`: filters by `nombre` and `nit` (case-insensitive `.toLowerCase().includes()`) — NO additional API call
  - [ ] Each list item shows `nombre` and `nit` — use `ClientListItem` shared component (create if it does not exist at `src/shared/components/ClientListItem.tsx`)
  - [ ] Loading state: `react-loading-skeleton` skeleton placeholders (NOT a spinner) while `isLoading` is true
  - [ ] Empty state (zero clients returned by API): render `EmptyState` shared component (`src/shared/components/EmptyState.tsx`) with Spanish guidance message "No hay clientes aún. Crea el primero."
  - [ ] Error state: render `ErrorPanel` component with a "Reintentar" button that calls `refetch()` on click
  - [ ] Check siesa-ui-kit first for `EmptyState`, `ErrorPanel`, `Input` components before creating custom ones

- [ ] Task 8 — Wire `ClienteListView` into the `/clientes` route (AC: #1, #2, #3, #4)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` (currently a placeholder from Story 1.2) to render `ClienteListView` in the left panel
  - [ ] The `/clientes` route renders a two-column layout: `ClienteListView` (280px, left) + right panel placeholder `<div>` (flex-1, right) — right panel detail is implemented in Story 2.2
  - [ ] Wrap the page in `QueryClientProvider` (already provided globally via `QueryProvider` in `main.tsx` — no additional wrapping needed)

- [ ] Task 9 — Write unit and component tests (AC: all)
  - [ ] Frontend unit test (`useClientes.test.ts` or `clienteSchema.test.ts` — Vitest): verify `useClientes` hook fetches data and returns correctly typed `Cliente[]`
  - [ ] Frontend component test (`ClienteListView.test.tsx` — Vitest + RTL + MSW):
    - [ ] Renders client list with Nombre and NIT visible when MSW returns 2 clients (TC-E2-P1-04)
    - [ ] Real-time search filter by Nombre (type "Alpha" → only matching client visible) (TC-E2-P1-05 partial)
    - [ ] Real-time search filter by NIT (type "222" → only matching client visible) (TC-E2-P1-05 partial)
    - [ ] Renders `EmptyState` when MSW returns `[]` (TC-E2-P1-06)
    - [ ] Renders `ErrorPanel` with "Reintentar" button when MSW returns network error; clicking "Reintentar" triggers new fetch (TC-E2-P1-07)
    - [ ] No additional fetch triggered during typing (assert MSW call count = 1 after typing)
  - [ ] Backend xUnit integration test (`ClienteEndpointsTests.cs` — using `WebApplicationFactory` + TestContainers):
    - [ ] `GET /api/v1/clientes` returns 200 with direct JSON array when 3 clients pre-seeded (TC-E2-P1-01)
    - [ ] Response items contain `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`
    - [ ] `createdAt` and `updatedAt` are valid `DateTimeOffset` ISO 8601 strings

- [ ] Task 10 — Final build and verification (AC: all)
  - [ ] `pnpm build` in `frontend/` — zero TypeScript errors, bundle under 500KB gzip
  - [ ] `dotnet build SiesaAgents.sln` from `backend/` — 0 Warnings, 0 Errors
  - [ ] All new tests pass: `pnpm test` (frontend) and `dotnet test` (backend)

## Dev Notes

### Backend: Entity and Repository Pattern

`ClienteEntity` follows the mandatory pattern from company standards and architecture:

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { } // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad
        };
    }
}
```

Critical rules:
- **UUID PKs**: `Guid Id = Guid.NewGuid()` — NEVER int or string PK
- **DateTimeOffset**: ALWAYS `DateTimeOffset` for `CreatedAt` and `UpdatedAt` — NEVER `DateTime`
- **Private constructor**: Required for EF Core materialization; `Create()` factory for application code

### Backend: EF Core Configuration

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
        builder.ToTable("clientes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).IsRequired();
        builder.Property(c => c.Nit).IsRequired();
        builder.Property(c => c.Telefono).IsRequired();
        builder.Property(c => c.Ciudad).IsRequired();

        // Required for 409 NIT uniqueness (Stories 2.3, 2.4)
        builder.HasIndex(c => c.Nit)
               .IsUnique()
               .HasDatabaseName("uk_clientes_nit");
    }
}
```

`ApplySnakeCaseNaming()` (via `UseSnakeCaseNamingConvention()` on DbContextOptionsBuilder in `Program.cs`) auto-converts all PascalCase property names to `snake_case` columns. No `[Column]` or `[Table]` attributes needed. The `ToTable("clientes")` call overrides the auto-pluralized `cliente_entities` name.

### Backend: Minimal API Endpoint Pattern

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(clientes);
        });
    }
}
```

- NEVER use MVC controllers — Minimal API only (company standard)
- `GET /api/v1/clientes` → 200 OK + direct array (not wrapped in an object)
- Error responses use Problem Details RFC 7807 via `ExceptionHandlingMiddleware` (already registered from Story 1.1)

### Backend: API Response Shape

Per architecture document, format patterns for list endpoints:
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombre": "Empresa Ejemplo",
    "nit": "900123456-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-05-31T10:30:00Z",
    "updatedAt": "2026-05-31T10:30:00Z"
  }
]
```

- Direct array — no wrapper object
- Dates: ISO 8601 with timezone (never Unix timestamps) — `DateTimeOffset` serializes to this format automatically in .NET with default `System.Text.Json`
- JSON properties: camelCase (auto-handled by .NET Minimal API default serializer)

### Frontend: TypeScript Interface

```typescript
// frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}
```

No `any` types allowed — TypeScript strict mode is enforced.

### Frontend: TanStack Query Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],   // array form — NEVER string
    queryFn: () => clienteApiRepository.getAll(),
  })
}
```

- Query key `['clientes']` is canonical (defined in architecture) — must be an array
- All mutation hooks (Stories 2.3–2.5) will invalidate this same key: `invalidateQueries({ queryKey: ['clientes'] })`

### Frontend: Client-Side Search Filter Pattern

```typescript
// Inside ClienteListView.tsx
const [searchQuery, setSearchQuery] = useState('')

const filteredClientes = useMemo(() => {
  if (!data) return []
  const q = searchQuery.toLowerCase()
  if (!q) return data
  return data.filter(
    c =>
      c.nombre.toLowerCase().includes(q) ||
      c.nit.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

- `useMemo` derives filtered list from TanStack Query cache — no additional API call
- Filtering is case-insensitive (`toLowerCase()`)
- State: local `useState` — do NOT use Zustand for search query (architecture decision: URL or local state only for client-side filters)
- Performance: client-side filter over ≤ 500 records is < 50ms (well within NFR1 1s budget)

### Frontend: Loading State

Use `react-loading-skeleton` for placeholder during initial load — NOT a spinner. Per company standards, skeleton screens are mandatory for loading states.

```tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Inside ClienteListView.tsx when isLoading:
{isLoading && Array.from({ length: 5 }).map((_, i) => (
  <div key={i} className="p-3 border-b border-slate-200">
    <Skeleton height={16} width="70%" />
    <Skeleton height={12} width="40%" className="mt-1" />
  </div>
))}
```

### Frontend: EmptyState and ErrorPanel Components

Check siesa-ui-kit first for these components. If not available in siesa-ui-kit, create custom components at:
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`

Minimum implementation for `EmptyState`:
```tsx
// All user-facing text MUST be in Spanish
interface EmptyStateProps {
  message: string
  hint?: string
}
```

Minimum implementation for `ErrorPanel`:
```tsx
interface ErrorPanelProps {
  onRetry: () => void
}
// Renders: error message (Spanish) + "Reintentar" button
```

### Frontend: Routing Integration

`frontend/src/routes/_app/clientes.tsx` currently renders a placeholder from Story 1.2. This file must be updated to render the real two-panel layout:

```tsx
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <div className="flex-1">
        {/* Right panel — ClienteDetailView added in Story 2.2 */}
      </div>
    </div>
  )
}
```

- Route file uses `createFileRoute` (TanStack Router file-based routing — no manual router config)
- Left panel fixed at 280px, right panel `flex-1`

### Frontend: Folder Structure for this Story

```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts                    # NEW — TypeScript entity interface
      IClienteRepository.ts         # NEW — Repository contract
    application/
      useClientes.ts                # NEW — TanStack Query hook
    infrastructure/
      clienteApiRepository.ts       # NEW — Axios implementation
    presentation/
      ClienteListView.tsx           # NEW — Left panel with search + list
  shared/components/
    EmptyState.tsx                  # NEW (if not in siesa-ui-kit)
    ErrorPanel.tsx                  # NEW (if not in siesa-ui-kit)
    ClientListItem.tsx              # NEW — Single client item component
  routes/_app/
    clientes.tsx                    # MODIFIED — replace placeholder with real layout

backend/src/
  SiesaAgents.Domain/Clientes/
    Entities/
      ClienteEntity.cs              # NEW
    Interfaces/
      IClienteRepository.cs         # NEW
  SiesaAgents.Application/Clientes/
    Queries/
      GetClientesQuery.cs           # NEW
      GetClientesQueryHandler.cs    # NEW
    DTOs/
      ClienteDto.cs                 # NEW
  SiesaAgents.Infrastructure/
    Data/
      Configurations/
        ClienteConfiguration.cs     # NEW
      Migrations/
        {timestamp}_AddClientesTable.cs  # NEW (auto-generated)
    Repositories/
      ClienteRepository.cs          # NEW
  SiesaAgents.API/
    Endpoints/
      ClienteEndpoints.cs           # NEW
    Program.cs                      # MODIFIED — register ClienteEndpoints + IClienteRepository

tests/
  SiesaAgents.UnitTests/
    Application/Clientes/           # NEW — xUnit tests for QueryHandler
  SiesaAgents.IntegrationTests/
    ClienteEndpointsTests.cs        # NEW — xUnit integration tests (GET /api/v1/clientes)
```

### Frontend: siesa-ui-kit Check

Before creating any custom component, verify siesa-ui-kit availability:
```bash
# Check what is exported
node -e "const kit = require('siesa-ui-kit'); console.log(Object.keys(kit))"
```

From Story 1.2 notes: siesa-ui-kit v1.0.206 is available. `Navbar`, `LayoutBase`, `NavigationRail` are confirmed exported. Check for `Input`, `EmptyState`, `ErrorPanel`, `Skeleton` — use them if available.

### Backend: DI Registration in Program.cs

Add to `Program.cs` before `var app = builder.Build()`:

```csharp
// Repositories
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

// Query Handlers
builder.Services.AddScoped<GetClientesQueryHandler>();
```

After `var app = builder.Build()`:

```csharp
app.MapClienteEndpoints();
```

Required usings:
```csharp
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Repositories;
using SiesaAgents.API.Endpoints;
```

### All User-Facing Text in Spanish (P0 Rule)

| Element | Text |
|---------|------|
| Search placeholder | `"Buscar cliente..."` |
| EmptyState message | `"No hay clientes aún. Crea el primero."` |
| ErrorPanel message | `"No se pudo cargar la lista de clientes."` |
| ErrorPanel button | `"Reintentar"` |
| Loading ARIA label | `aria-label="Cargando clientes..."` |
| Search ARIA label | `aria-label="Buscar clientes"` |

No English text in any user-facing element. Code (variables, functions, types) remains in English.

### WCAG 2.1 AA Compliance

- Search field: `aria-label="Buscar clientes"`, focus ring `2px solid #0e79fd`
- Client list items: minimum 44px touch target height for mobile
- EmptyState and ErrorPanel: `role="status"` or `role="alert"` as appropriate
- Skeleton loading: `aria-label="Cargando clientes..."` on the container

### Testing Pattern References

From `test-design-epic-2.md`:
- **TC-E2-P1-01** (xUnit): `GET /api/v1/clientes` returns 200 + array with all 3 seeded clients
- **TC-E2-P1-04** (Vitest+RTL): Renders Nombre and NIT per list item
- **TC-E2-P1-05** (Vitest+RTL): Real-time filter by Nombre and NIT, no extra fetch
- **TC-E2-P1-06** (Vitest+RTL): EmptyState rendered when API returns `[]`
- **TC-E2-P1-07** (Vitest+RTL): ErrorPanel + "Reintentar" on network error, retry triggers refetch

Backend tests require `WebApplicationFactory<Program>` + TestContainers (Postgres) per test design. If `SiesaAgents.IntegrationTests` project does not yet exist, create it:
```bash
dotnet new xunit -n SiesaAgents.IntegrationTests -o tests/SiesaAgents.IntegrationTests
dotnet sln add tests/SiesaAgents.IntegrationTests
dotnet add tests/SiesaAgents.IntegrationTests reference src/SiesaAgents.API
dotnet add tests/SiesaAgents.IntegrationTests package Microsoft.AspNetCore.Mvc.Testing
dotnet add tests/SiesaAgents.IntegrationTests package Testcontainers.PostgreSql
dotnet add tests/SiesaAgents.IntegrationTests package FluentAssertions
```

### Previous Story Context

From Story 1.1 and 1.3 Completion Notes:
- `pnpm` is the mandatory package manager — frontend lockfile is `frontend/pnpm-lock.yaml`
- `siesa-ui-kit` v1.0.206 is available in the npm registry (`pnpm add siesa-ui-kit`)
- `apiClient` Axios instance already exists at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL`
- `queryClient` already configured at `frontend/src/shared/lib/queryClient.ts` with `staleTime: 1000 * 60`
- `AppDbContext` exists at `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — add `DbSet<ClienteEntity>` here
- `UseSnakeCaseNamingConvention()` is already applied on DbContextOptionsBuilder in `Program.cs`
- `ExceptionHandlingMiddleware` already registered in `Program.cs` — no changes needed for error handling
- Initial migration `InitialCreate` already applied to `siesa_agents_db` — new migration `AddClientesTable` will be stacked on top
- `dotnet build SiesaAgents.sln` must continue to pass with 0 Warnings, 0 Errors
- Route `frontend/src/routes/_app/clientes.tsx` exists as a placeholder — MUST be modified, not deleted

### References

- Epic source and Story 2.1 ACs: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture — ClienteEntity, search strategy, query keys: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Architecture — REST endpoint contracts: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Frontend folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Enforcement guidelines (UUID, DateTimeOffset, snake_case, Scalar, Spanish): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- UX spec — ClienteListView 280px left panel, search-first UX: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Chosen Direction]
- UX spec — EmptyState + ErrorPanel + loading skeleton: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Opportunities]
- Test design (TC-E2-P1-01, TC-E2-P1-04 through TC-E2-P1-07): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#P1]
- NFR1 (search < 1s / 500 records): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- FR1 (list clients), FR2 (search by name/NIT): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Company standards — Clean Architecture, DDD, UUID PKs, DateTimeOffset, snake_case: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — siesa-ui-kit P0 mandatory, Spanish UI text: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Previous story context (apiClient, queryClient, AppDbContext): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]
- Previous story context (siesa-ui-kit v1.0.206, route placeholder): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md#Completion Notes List]
- Previous story context (UseSnakeCaseNamingConvention, migrations): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#Completion Notes List]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
