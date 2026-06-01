# Story 2.1: Client List & Search

Status: done

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px) renders a scrollable list of all clients, each item showing Nombre and NIT/RUC (FR2, FR3, FR4).

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list, and no stack traces or technical details are shown to the user (NFR6).

5. **Given** the application is running, **When** `GET /api/v1/clientes` is called, **Then** the endpoint returns a JSON array of client objects with fields `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt` with HTTP 200.

6. **Given** the backend entity and EF Core configuration are in place, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all projects compile with zero errors and zero warnings, and `dotnet ef migrations add AddClientes` generates a migration that creates the `clientes` table with `id` (UUID PK), `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at` columns in snake_case.

## Tasks / Subtasks

- [x] Task 1 — Create `ClienteEntity` domain entity (AC: #5, #6)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with properties: `Id` (Guid, PK), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
  - [x] Use private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory method pattern
  - [x] Add `Update(string nombre, string nit, string telefono, string ciudad)` method that sets `UpdatedAt = DateTimeOffset.UtcNow`
  - [x] Verify: no `DateTime` — only `DateTimeOffset`; no `any` equivalent in C#

- [x] Task 2 — Create `IClienteRepository` interface (AC: #5, #6)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [x] Declare methods: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)`, `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`, `Task AddAsync(ClienteEntity cliente, CancellationToken ct)`, `Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)`, `Task DeleteAsync(Guid id, CancellationToken ct)`, `Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)`

- [x] Task 3 — Create EF Core configuration and add `DbSet` to `AppDbContext` (AC: #6)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`
  - [x] Configure table name `clientes`, PK `id`, unique index `uk_clientes_nit` on `Nit`, index `ix_clientes_nombre` on `Nombre`
  - [x] Add `DbSet<ClienteEntity> Clientes` property to `AppDbContext`
  - [x] Verify `UseSnakeCaseNamingConvention()` is the last call in `OnModelCreating` — no manual `[Column]` or `[Table]` attributes
  - [x] Run: `dotnet ef migrations add AddClientes --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`

- [x] Task 4 — Create `ClienteRepository` implementation (AC: #5, #6)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`
  - [x] Inject `AppDbContext` via constructor
  - [x] Use EF Core for standard CRUD; use `AsNoTracking()` for read-only queries
  - [x] Register `IClienteRepository → ClienteRepository` in `Program.cs` DI: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`

- [x] Task 5 — Create Application layer — DTOs, Query, and Handler for `GetClientes` (AC: #5)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` with properties matching API response: `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt`, `UpdatedAt`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — record with no parameters
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — injects `IClienteRepository`, returns `IReadOnlyList<ClienteDto>` mapped from entities
  - [x] Register handler in DI: `builder.Services.AddScoped<GetClientesQueryHandler>()`

- [x] Task 6 — Create `GET /api/v1/clientes` endpoint (AC: #5)
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with static `MapClienteEndpoints(this IEndpointRouteBuilder app)` extension method
  - [x] Register `app.MapGet("/api/v1/clientes", ...)` with tag `"Clientes"`
  - [x] Call `app.MapClienteEndpoints()` in `Program.cs`
  - [x] Verify HTTP 200 returns direct JSON array (no wrapper object per architecture standard)

- [x] Task 7 — Create frontend domain types (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`

- [x] Task 8 — Create infrastructure API repository (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [x] Use `apiClient` calling `GET /api/v1/clientes`
  - [x] Return `response.data` as `Cliente[]`

- [x] Task 9 — Create `useClientes` TanStack Query hook (AC: #1, #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [x] Use `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`

- [x] Task 10 — Create `ClienteListPanel` presentation component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [x] Width: 280px fixed; overflow-y scroll
  - [x] Integrate `useClientes` hook; display `react-loading-skeleton` skeleton rows while loading
  - [x] On `isError`: render `<ErrorPanel onRetry={refetch} />`
  - [x] On empty array: render `<EmptyState />`
  - [x] Client-side search with `useMemo` filter on `nombre` and `nit`
  - [x] Search input placeholder: "Buscar por nombre o NIT/RUC"; aria-label: "Buscar clientes"

- [x] Task 11 — Create `ClientListItem` shared component (AC: #1)
  - [x] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [x] Props: `cliente: Cliente`, `isSelected?: boolean`, `onClick?: () => void`
  - [x] WCAG 2.1 AA: `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space

- [x] Task 12 — Create `EmptyState` and `ErrorPanel` shared components (AC: #3, #4)
  - [x] Create `frontend/src/shared/components/EmptyState.tsx`
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx` — fixed message only (NFR6)

- [x] Task 13 — Wire `ClienteListPanel` into the `/clientes` route (AC: #1, #2, #3, #4)
  - [x] Updated `frontend/src/routes/_app/clientes.tsx` with two-panel flex layout

- [x] Task 14 — Write backend unit tests (AC: #5, #6)
  - [x] Create `tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
  - [x] Create `tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
  - [x] All 64 backend tests pass (0 failures)

- [x] Task 15 — Write frontend unit tests (AC: #1, #2, #3, #4)
  - [x] Pre-existing test files updated to correct module paths
  - [x] All 92 frontend tests pass (0 failures)

## Dev Notes

### Backend Domain Entity Pattern

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

    private ClienteEntity() { }   // Required by EF Core

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

    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
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
        builder.HasIndex(c => c.Nombre).HasDatabaseName("ix_clientes_nombre");
        // Column names are derived automatically via UseSnakeCaseNamingConvention()
        // DO NOT add [Column] or [Table] attributes
    }
}
```

### AppDbContext Update

```csharp
// Add to AppDbContext.cs
public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();
```

### EF Core Migration Command

```bash
# From backend/ directory
dotnet ef migrations add AddClientes \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### `GET /api/v1/clientes` Endpoint Pattern

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (
            GetClientesQueryHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithTags("Clientes");

        return app;
    }
}
```

Response shape (direct array, no wrapper):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Empresa ABC",
    "nit": "900123456-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

### Frontend Domain Interface

```typescript
// frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}
```

### `useClientes` Hook Pattern

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

### `ClienteListPanel` Search Pattern (Client-Side)

```typescript
// Within ClienteListPanel.tsx — useMemo client-side filter (NFR1 < 50ms for 500 records)
const [searchQuery, setSearchQuery] = useState('')

const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return clientes ?? []
  const q = searchQuery.toLowerCase()
  return (clientes ?? []).filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.nit.toLowerCase().includes(q)
  )
}, [clientes, searchQuery])
```

No new API call is triggered on search — all filtering happens in memory over the TanStack Query cache (architecture decision: client-side filter for ≤ 500 records).

### Skeleton Loading Pattern

```tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// While isLoading:
{Array.from({ length: 6 }).map((_, i) => (
  <div key={i} className="px-4 py-3">
    <Skeleton height={16} width="70%" />
    <Skeleton height={12} width="40%" className="mt-1" />
  </div>
))}
```

### Brand Colors & Styling

- Primary / active highlight: `#0e79fd` (Siesa Blue) — active `ClientListItem` border
- Neutrals: Tailwind `slate-*` scale (`slate-800` for main text, `slate-500` for secondary)
- Panel background: `bg-white` or `bg-slate-50`
- Panel width: `w-[280px] shrink-0`
- Overflow: `overflow-y-auto` on list container

### State Management Boundaries

Per architecture decisions:

| State | Where | Why |
|-------|-------|-----|
| `clientes[]` server data | TanStack Query `['clientes']` | Server state, invalidated on mutations |
| `searchQuery` | `useState` in `ClienteListPanel` | Local UI state, no cross-component sharing |
| Selected `clienteId` | URL param (`/clientes/:clienteId`) | FR30 deep linking — source of truth is URL |

No Zustand store needed for this story.

### Testing Standards

**Backend (xUnit):**
- `GetClientesQueryHandlerTests.cs`: mock `IClienteRepository` with `NSubstitute` or `Moq`, verify DTO mapping
- `ClienteEntityTests.cs`: pure unit tests, no database, verify domain logic and `DateTimeOffset` types
- Structure: Arrange / Act / Assert

**Frontend (Vitest + RTL):**
- MSW handlers for `GET /api/v1/clientes` in test setup
- `useClientes.test.ts`: verify query fetches and returns data; verify error state
- `ClienteListPanel.test.tsx`: render in data/empty/error/loading states; verify search filter logic; `axe` accessibility check
- Co-located test files alongside source files

### Project Structure — Files to Create

**Backend:**
```
backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs        (create)
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs (create)
backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs (create)
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs (create)
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs          (create)
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs (create)
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs (create)
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                (create)
backend/src/SiesaAgents.Infrastructure/Migrations/<timestamp>_AddClientes.cs (auto-generated)
```

**Backend — Files to Modify:**
```
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs  ← add DbSet<ClienteEntity>
backend/src/SiesaAgents.API/Program.cs                      ← register IClienteRepository + MapClienteEndpoints()
```

**Frontend:**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts                              (create)
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts                   (create)
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts          (create)
frontend/src/modules/crm/clientes/application/useClientes.ts                      (create)
frontend/src/modules/crm/clientes/application/useClientes.test.ts                 (create)
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx               (create)
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx          (create)
frontend/src/shared/components/ClientListItem.tsx                                  (create)
frontend/src/shared/components/EmptyState.tsx                                      (create)
frontend/src/shared/components/ErrorPanel.tsx                                      (create)
```

**Frontend — Files to Modify:**
```
frontend/src/routes/_app/clientes.tsx  ← replace ClientesPlaceholder with ClienteListPanel + two-panel layout
```

### Scope Constraints

**DO NOT create in this story:**
- `useCliente(id)` — belongs to Story 2.2 (client detail view)
- `useCreateCliente` / `useUpdateCliente` / `useDeleteCliente` — belong to Stories 2.3–2.5
- `ClienteForm.tsx` — belongs to Story 2.3
- `ClienteDetailView.tsx` — belongs to Story 2.2
- Right panel content beyond empty placeholder `<div>` — belongs to Story 2.2
- `ContactoEntity.cs` — belongs to Epic 3
- `GET /api/v1/clientes/{id}` endpoint — belongs to Story 2.2
- `ContactManager` wiring — belongs to Story 2.2

### References

- Client entity and repository structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Client-side search strategy (NFR1): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture → Search Strategy]
- TanStack Query canonical keys: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- FR2–FR4 (list + search requirements): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- NFR1 (search < 1s / 500 records): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Performance]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- Company database conventions (snake_case, UUID PK, DateTimeOffset): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- EF Core snake_case — `UseSnakeCaseNamingConvention()` last call: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#Dev Notes]
- AppDbContext pattern: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#AppDbContext Pattern]
- Axios singleton (`apiClient`): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes → Frontend Stack Details]
- Brand colors and loading states (react-loading-skeleton): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Epic acceptance criteria (AC-E2.1, AC-E2.2): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria]
- siesa-ui-kit P0 mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied → UI]
- Anti-patterns (DateTime → DateTimeOffset, Swagger → Scalar, English UI text): [Source: _bmad-output/planning-artifacts/architecture.md#Anti-patterns to avoid]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

**Backend — Created:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (pre-existing, verified correct)
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (pre-existing, verified correct)
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` (pre-existing, verified correct)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (pre-existing, verified correct)
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` (pre-existing, verified correct)
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (pre-existing, verified correct)
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` (pre-existing, verified correct)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (pre-existing, verified correct)
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260601060504_AddClientes.cs` (generated)
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` (created)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (created)

**Backend — Modified:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (pre-existing with DbSet<ClienteEntity>, verified correct)
- `backend/src/SiesaAgents.API/Program.cs` (pre-existing with DI registrations, verified correct)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextEdgeCasesTests.cs` (updated 2 tests for Story 2.1 entity count)

**Frontend — Created:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`

**Frontend — Modified:**
- `frontend/src/routes/_app/clientes.tsx` (replaced ClientesPlaceholder with two-panel layout)
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.unit.test.ts` (fixed import paths)
