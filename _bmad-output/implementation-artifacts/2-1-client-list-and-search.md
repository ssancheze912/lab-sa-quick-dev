# Story 2.1: Client List & Search

Status: draft

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px wide) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1). The filter is applied client-side over the TanStack Query cache — no additional API call is triggered.

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list. Clicking "Reintentar" calls `refetch()` from TanStack Query.

## Tasks / Subtasks

- [ ] Task 1 — Create `ClienteEntity` domain type and `IClienteRepository` contract (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface with fields: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with method `getAll(): Promise<Cliente[]>`

- [ ] Task 2 — Create infrastructure layer: API repository (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient` (Axios singleton from `src/shared/lib/apiClient.ts`) calling `GET /api/v1/clientes`; returns `Cliente[]`

- [ ] Task 3 — Create application layer: `useClientes` hook (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query `useQuery` with `queryKey: ['clientes']`, calling `clienteApiRepository.getAll()`; exports `{ data, isLoading, isError, refetch }`
  - [ ] Stale time: use global `QueryClient` config (`staleTime: 1000 * 60` from `src/shared/lib/queryClient.ts`)

- [ ] Task 4 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Fixed width 280px panel with vertical scroll (`overflow-y-auto`)
  - [ ] Render a search `<input>` at the top with `placeholder="Buscar por nombre o NIT/RUC"` and `aria-label="Buscar clientes"` — controlled by local `useState<string>('')`
  - [ ] Apply client-side filter via `useMemo`: filter `data` array where `nombre` or `nit` includes the `searchQuery` string (case-insensitive). Never pass search as a query param — `queryKey` stays `['clientes']`
  - [ ] Render filtered list using a `ClientListItem` component per client (see Task 5)
  - [ ] When `isLoading`: render skeleton placeholders using `react-loading-skeleton` (company standard — skeleton screens, not spinners)
  - [ ] When `isError`: render `ErrorPanel` component with `onRetry={refetch}` (see Task 6)
  - [ ] When data is loaded and `data.length === 0` (empty or filtered to zero): render `EmptyState` component (see Task 7)
  - [ ] Add `data-testid="cliente-list-view"` to the root element
  - [ ] Add `data-testid="search-input"` to the search input

- [ ] Task 5 — Create `ClientListItem` shared component (AC: #1)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx` (per architecture.md — shared component)
  - [ ] Props: `cliente: Cliente`, `isSelected?: boolean`, `onClick?: () => void`
  - [ ] Display `nombre` (bold) and `nit` (subdued text) in a single list item
  - [ ] Apply selected state visual with Siesa Blue `#0e79fd` / `bg-blue-50` when `isSelected`
  - [ ] Accessible: `role="button"`, `tabIndex={0}`, `aria-label` containing the client name in Spanish context
  - [ ] Add `data-testid="cliente-item"` to each item

- [ ] Task 6 — Create `ErrorPanel` shared component (AC: #4)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `onRetry: () => void`
  - [ ] Display a user-friendly error message in Spanish: "No se pudo cargar la información. Verifica tu conexión."
  - [ ] Render a "Reintentar" button that calls `onRetry` on click
  - [ ] Add `data-testid="error-panel"` and `data-testid="retry-button"` for testability

- [ ] Task 7 — Create `EmptyState` shared component (AC: #3)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `message: string` (optional, default: "Aún no hay clientes registrados. Crea el primero.")
  - [ ] Display `message` centered in the panel
  - [ ] Use Heroicons `UsersIcon` or similar for visual support
  - [ ] Add `data-testid="empty-state"` for testability

- [ ] Task 8 — Wire `ClienteListView` into the `/clientes` route (AC: #1, #2, #3, #4)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` (placeholder from Story 1.2) to render `ClienteListView` in the left 280px panel
  - [ ] The right panel remains an empty placeholder for Story 2.2 (`ClienteDetailView`)
  - [ ] Route file structure:
    ```tsx
    // src/routes/_app/clientes.tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
    
    export const Route = createFileRoute('/_app/clientes')({
      component: ClientesPage,
    })
    
    function ClientesPage() {
      return (
        <div className="flex h-full">
          <ClienteListView />
          {/* Right panel: empty placeholder — Story 2.2 */}
          <div className="flex-1" />
        </div>
      )
    }
    ```

- [ ] Task 9 — Backend: Create `ClienteEntity` domain entity (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Extends `Entity` base class (UUID `Id` from Story 1.1 `backend/src/SiesaAgents.Domain/Entities/Entity.cs`)
  - [ ] Fields: `Nombre (string)`, `NIT (string)`, `Telefono (string)`, `Ciudad (string)`, `CreatedAt (DateTimeOffset)`, `UpdatedAt (DateTimeOffset)`
  - [ ] Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory method
  - [ ] `DateTimeOffset` MANDATORY — NEVER `DateTime`
  - [ ] Add `IClienteRepository` interface to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — method: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)`

- [ ] Task 10 — Backend: Create `ClienteDto` and `GetClientesQuery` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with: `Guid Id`, `string Nombre`, `string NIT`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — empty record (no parameters needed)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — injects `IClienteRepository`; returns `IReadOnlyList<ClienteDto>` mapped from entities

- [ ] Task 11 — Backend: Create Infrastructure layer (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — implements `IEntityTypeConfiguration<ClienteEntity>`; configures table name `clientes`, unique index `uk_clientes_nit` on `NIT`; does NOT use `[Table]` or `[Column]` attributes — `ApplySnakeCaseNaming()` handles mapping
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository`; uses `ApplicationDbContext`; `GetAllAsync` returns `await _context.Clientes.AsNoTracking().ToListAsync(ct)`
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `backend/src/SiesaAgents.Infrastructure/Data/ApplicationDbContext.cs`
  - [ ] Apply `modelBuilder.ApplyConfiguration(new ClienteConfiguration())` in `OnModelCreating` BEFORE `ApplySnakeCaseNaming()`

- [ ] Task 12 — Backend: Create EF Core migration for `clientes` table (AC: #1)
  - [ ] Generate migration adding `clientes` table:
    ```bash
    dotnet ef migrations add AddClientesTable \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] If dotnet CLI unavailable: create migration file manually following existing `20260524000000_InitialCreate.cs` pattern
  - [ ] Migration `Up()` must create table with columns: `id uuid PK`, `nombre text`, `nit text`, `telefono text`, `ciudad text`, `created_at timestamptz`, `updated_at timestamptz`
  - [ ] Migration must add unique index `uk_clientes_nit` on `nit` column
  - [ ] Run `dotnet ef database update` to apply migration

- [ ] Task 13 — Backend: Create `GET /api/v1/clientes` endpoint (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — static class with `MapClienteEndpoints(this IEndpointRouteBuilder app)` extension method
  - [ ] Register endpoint: `app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) => Results.Ok(await handler.HandleAsync(ct)))`
  - [ ] Call `app.MapClienteEndpoints()` in `Program.cs` after middleware registration
  - [ ] Register `GetClientesQueryHandler` and `IClienteRepository → ClienteRepository` in `Program.cs` DI
  - [ ] Response: `200 OK` with `ClienteDto[]` (direct array — no wrapper object per architecture pattern)

- [ ] Task 14 — Write frontend unit/component tests (AC: #1–#4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`
    - [ ] Mock `GET /api/v1/clientes` via MSW returning 3 clients — assert hook returns them
    - [ ] Mock network error — assert `isError` is `true`
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`
    - [ ] TC-E2-P0-03: Search by name — mock 10 clients, type partial name, assert only matching items render, assert no additional network call (MSW handler count = 1) (R-004)
    - [ ] TC-E2-P0-04: Search by NIT/RUC — same pattern, filter by partial NIT, assert no API re-call (R-004)
    - [ ] TC-E2-P1-01: Empty state — mock `GET /api/v1/clientes` returning `[]`, assert `data-testid="empty-state"` in DOM (R-009)
    - [ ] TC-E2-P1-02: ErrorPanel + Retry — mock network error, assert `data-testid="error-panel"` visible, click `data-testid="retry-button"`, assert `GET /api/v1/clientes` called a second time (R-010)
    - [ ] Loading state — assert skeleton renders while `isLoading` is true
  - [ ] All tests use Vitest + RTL + MSW; follow Arrange / Act / Assert pattern

- [ ] Task 15 — Write backend unit tests (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - [ ] Test: `HandleAsync_ReturnsAllClientes_WhenRepositoryHasRecords` — arrange mock repo returning 2 entities; act; assert 2 DTOs with correct field mapping
    - [ ] Test: `HandleAsync_ReturnsEmptyList_WhenRepositoryIsEmpty` — arrange empty repo; act; assert empty list returned
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
    - [ ] Test: `Create_SetsAllFields_Correctly` — assert Nombre, NIT, Telefono, Ciudad set from factory params
    - [ ] Test: `Create_SetsId_AsNonEmptyGuid` — assert `Id != Guid.Empty`
    - [ ] Test: `Create_SetsCreatedAt_AsDateTimeOffset` — assert `CreatedAt` type is `DateTimeOffset`

## Dev Notes

### Architecture Context

Epic 1 (Stories 1.1–1.3) is complete. The backend solution, EF Core + PostgreSQL wiring, and frontend Vite + TanStack Router shell are all in place. Story 2.1 is the first story that adds domain entities and an API endpoint. It creates the foundation that Stories 2.2–2.6 build on.

**Key decisions from architecture.md:**

- **Search strategy**: Client-side filter over TanStack Query cache. `queryKey` stays `['clientes']` always. Filter applied via `useMemo` in `ClienteListView`. Never pass `?q=` query param to the API.
- **Left panel width**: 280px fixed, scrollable.
- **Module path**: `src/modules/crm/clientes/` with four Clean Architecture layers (domain / application / infrastructure / presentation).

### Frontend Stack for This Story

| Component | Detail |
|-----------|--------|
| TanStack Query | `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })` |
| Filter | `useMemo` over `data ?? []` filtering by `nombre` and `nit` (case-insensitive `toLowerCase()`) |
| Loading | `react-loading-skeleton` — skeleton bars matching list item height, NOT a spinner |
| Error | Custom `ErrorPanel` component with `onRetry={refetch}` |
| Empty | Custom `EmptyState` component |
| Icons | Heroicons (`UsersIcon` for EmptyState, already installed in Story 1.2) |
| Search state | Local `useState<string>('')` — NOT Zustand, NOT URL param |

### Filter Implementation (Critical — R-004 mitigation)

```typescript
// ClienteListView.tsx — search filter pattern
const [searchQuery, setSearchQuery] = useState('')
const { data, isLoading, isError, refetch } = useClientes()

const filteredClientes = useMemo(() => {
  if (!data) return []
  if (!searchQuery.trim()) return data
  const q = searchQuery.toLowerCase()
  return data.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

**The `queryKey` MUST stay `['clientes']` at all times. Never append the search term to the key or make a new fetch.**

### Backend Patterns

**`ClienteEntity.cs` pattern:**

```csharp
namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity : Entity
{
    public string Nombre { get; private set; } = string.Empty;
    public string NIT { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
            Nombre = nombre,
            NIT = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
```

**`ClienteConfiguration.cs` pattern:**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");
        builder.HasIndex(c => c.NIT).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

**`GET /api/v1/clientes` endpoint pattern:**

```csharp
// ClienteEndpoints.cs
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.HandleAsync(ct)))
            .WithName("GetClientes")
            .WithOpenApi();
        return app;
    }
}
```

**DI registration in `Program.cs`:**

```csharp
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
// ...
app.MapClienteEndpoints();
```

### API Response Shape

Per architecture.md format patterns:

```
GET /api/v1/clientes → 200 OK → direct array (no wrapper)
```

Response JSON:
```json
[
  {
    "id": "uuid-v7",
    "nombre": "Empresa Ejemplo S.A.",
    "nit": "900100200-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-05-24T10:30:00Z",
    "updatedAt": "2026-05-24T10:30:00Z"
  }
]
```

### Database Schema

```sql
-- Table: clientes (auto-named by ApplySnakeCaseNaming from ClienteEntity)
CREATE TABLE clientes (
    id          UUID          PRIMARY KEY DEFAULT uuidv7(),
    nombre      TEXT          NOT NULL,
    nit         TEXT          NOT NULL,
    telefono    TEXT          NOT NULL,
    ciudad      TEXT          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL,
    updated_at  TIMESTAMPTZ   NOT NULL
);
CREATE UNIQUE INDEX uk_clientes_nit ON clientes(nit);
```

EF Core auto-maps `ClienteEntity` property names to snake_case via `ApplySnakeCaseNaming()`. No manual `[Column]` or `[Table]` attributes.

### Previous Story Context (Story 1.1–1.3 Learnings)

- `dotnet` CLI may not be available — create migration files manually if needed, following the pattern in `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260524000000_InitialCreate.cs`
- `ApplicationDbContext` (not `AppDbContext`) is the name used in the codebase — stay consistent
- `EFCore.NamingConventions` package already referenced in `SiesaAgents.Infrastructure.csproj` — `ApplySnakeCaseNaming()` is available
- siesa-ui-kit `@1.0.203` is installed; `@heroicons/react@2.2.0` is installed (from Story 1.2)
- `react-loading-skeleton` is installed (from Story 1.1 `pnpm add react-loading-skeleton`)
- `queryClient` singleton lives at `frontend/src/shared/lib/queryClient.ts` with `staleTime: 1000 * 60`
- `apiClient` Axios instance lives at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL`

### UI Text (Spanish — Mandatory)

All user-facing text must be in Spanish per company standards:

| Label | Spanish value |
|-------|--------------|
| Search placeholder | `Buscar por nombre o NIT/RUC` |
| Search aria-label | `Buscar clientes` |
| Empty state message | `Aún no hay clientes registrados. Crea el primero.` |
| Error message | `No se pudo cargar la información. Verifica tu conexión.` |
| Retry button | `Reintentar` |

### Accessibility (WCAG 2.1 AA)

- Search `<input>` must have `aria-label="Buscar clientes"`
- Client list items: `role="button"` with `tabIndex={0}` and `onKeyDown` for Enter/Space activation
- Skeleton placeholders: `aria-busy="true"` on the list container while loading
- `ErrorPanel`: `role="alert"` on the error container

### Test References (from test-design-epic-2.md)

The following test cases from the Epic 2 test design are covered by Task 14 of this story:

| Test Case | Assertion |
|-----------|-----------|
| TC-E2-P0-03 | Search by name — client-side, no API re-call (R-004) |
| TC-E2-P0-04 | Search by NIT/RUC — client-side, no API re-call (R-004) |
| TC-E2-P1-01 | EmptyState visible when list is empty (R-009) |
| TC-E2-P1-02 | ErrorPanel + Reintentar triggers refetch (R-010) |

### Files to Create / Modify

#### Frontend (Create)

| File | Action |
|------|--------|
| `frontend/src/modules/crm/clientes/domain/Cliente.ts` | Create — TypeScript entity interface |
| `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` | Create — repository contract |
| `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` | Create — Axios implementation |
| `frontend/src/modules/crm/clientes/application/useClientes.ts` | Create — TanStack Query hook |
| `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` | Create — 280px panel with search + list |
| `frontend/src/shared/components/ClientListItem.tsx` | Create — single client list item |
| `frontend/src/shared/components/ErrorPanel.tsx` | Create — error state with retry |
| `frontend/src/shared/components/EmptyState.tsx` | Create — empty state |
| `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts` | Create — hook tests |
| `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` | Create — component + filter tests |

#### Frontend (Modify)

| File | Action |
|------|--------|
| `frontend/src/routes/_app/clientes.tsx` | Modify — replace placeholder with `ClienteListView` in 280px left panel |

#### Backend (Create)

| File | Action |
|------|--------|
| `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` | Create — domain entity |
| `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` | Create — repository interface |
| `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` | Create — response DTO |
| `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` | Create — CQRS query |
| `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` | Create — query handler |
| `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` | Create — EF Core config + unique index |
| `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` | Create — EF Core implementation |
| `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` | Create — GET /api/v1/clientes |
| `backend/src/SiesaAgents.Infrastructure/Data/Migrations/{timestamp}_AddClientesTable.cs` | Create — migration Up/Down |
| `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` | Create — handler unit tests |
| `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` | Create — entity unit tests |

#### Backend (Modify)

| File | Action |
|------|--------|
| `backend/src/SiesaAgents.Infrastructure/Data/ApplicationDbContext.cs` | Modify — add `DbSet<ClienteEntity> Clientes`; apply `ClienteConfiguration` before `ApplySnakeCaseNaming()` |
| `backend/src/SiesaAgents.API/Program.cs` | Modify — register `IClienteRepository`, `GetClientesQueryHandler`; call `app.MapClienteEndpoints()` |

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture search strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Search Strategy]
- Architecture frontend structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture API patterns: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Architecture query keys: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Company standards frontend: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- Company standards backend: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Company standards DB conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Test cases TC-E2-P0-03, TC-E2-P0-04, TC-E2-P1-01, TC-E2-P1-02: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- R-004 mitigation (client-side search, no API re-call): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#R-004]
- Story 1.1 learnings (dotnet CLI unavailable, manual migration): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Agent Record]
- Story 1.3 AppDbContext pattern: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#AppDbContext Pattern]
- NFR1 (search < 1s): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR1]
