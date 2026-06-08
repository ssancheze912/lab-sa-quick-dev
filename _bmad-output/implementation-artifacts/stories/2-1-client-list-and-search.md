# Story 2.1: Client List & Search

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **when** the user navigates to `/clientes`, **then** the left panel (280px) renders a scrollable list of all clients, each item showing Nombre and NIT/RUC.

2. **Given** the client list is loaded, **when** the user types in the search field ("Buscar cliente..."), **then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).

3. **Given** a search filter is active, **when** the user clears the search field, **then** the full client list is restored without a new API call.

4. **Given** there are no clients in the system, **when** the user navigates to `/clientes`, **then** an `EmptyState` component is displayed with a message in Spanish guiding the user to create the first client.

5. **Given** the backend is unavailable when the page loads, **when** the fetch fails, **then** an `ErrorPanel` is displayed with a "Reintentar" button in place of the list.

6. **Given** the client list is displayed, **when** the page is inspected with an accessibility tool, **then** the search input has an accessible label in Spanish and there are no axe `critical` or `serious` violations (WCAG 2.1 AA).

## Tasks / Subtasks

- [ ] Task 1 — Backend: define `ClienteEntity` and `clientes` migration (AC: 1)
  - [ ] 1.1 Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — UUID PK (`Guid Id`), `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`. Use private constructor + static `Create()` factory.
  - [ ] 1.2 Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — declare `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)`.
  - [ ] 1.3 Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — implement `IEntityTypeConfiguration<ClienteEntity>`, configure table name `clientes`, unique index `uk_clientes_nit`, no manual `[Column]` attributes.
  - [ ] 1.4 Add `DbSet<ClienteEntity> Clientes { get; set; }` to `AppDbContext` and register `IClienteRepository` → `ClienteRepository` in DI.
  - [ ] 1.5 Run `dotnet ef migrations add AddClientes --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations` from `backend/`.
  - [ ] 1.6 Verify generated migration creates table `clientes` with columns `id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at` and unique index `uk_clientes_nit`.

- [ ] Task 2 — Backend: `GetClientes` query + endpoint (AC: 1, 2)
  - [ ] 2.1 Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — properties: `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`.
  - [ ] 2.2 Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` and `GetClientesQueryHandler.cs` — handler calls `IClienteRepository.GetAllAsync()` and maps entities to `ClienteDto` list. Returns `IReadOnlyList<ClienteDto>`.
  - [ ] 2.3 Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository`. `GetAllAsync` returns all clients ordered by `CreatedAt` descending.
  - [ ] 2.4 Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — register `GET /api/v1/clientes` endpoint that dispatches `GetClientesQuery` and returns `200 OK` with `ClienteDto[]`. Response is a direct array (no wrapper).
  - [ ] 2.5 Register `ClienteEndpoints.MapClienteEndpoints(app)` in `Program.cs`.

- [ ] Task 3 — Frontend: domain + infrastructure layer (AC: 1, 2)
  - [ ] 3.1 Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — export TypeScript interface `Cliente` with fields: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`.
  - [ ] 3.2 Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — export interface `IClienteRepository` with `getAll(): Promise<Cliente[]>`.
  - [ ] 3.3 Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository`. `getAll()` calls `GET /api/v1/clientes` via the shared `apiClient` Axios instance and returns `Cliente[]`.

- [ ] Task 4 — Frontend: application layer (AC: 1, 2, 3, 5)
  - [ ] 4.1 Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook with `queryKey: ['clientes']`, `queryFn` delegating to `clienteApiRepository.getAll()`. Returns `{ data, isLoading, isError, refetch }`.
  - [ ] 4.2 Filtering logic: accept `searchQuery: string` parameter and return `useMemo`-filtered array matching `nombre` or `nit` (case-insensitive). Filtering is client-side — no additional fetch.

- [ ] Task 5 — Frontend: route and presentation layer (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 5.1 Create (or update placeholder) `frontend/src/routes/_app/clientes.tsx` — split-panel layout: left panel fixed 280px, right panel flex. Left panel renders `ClienteListPanel`.
  - [ ] 5.2 Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` — renders search input and list. Manages `searchQuery` via `useState`. Calls `useClientes(searchQuery)`. On `isLoading` → render skeleton list via `react-loading-skeleton`. On `isError` → render `ErrorPanel` with `onRetry={refetch}` (AC: 5). On empty data with no query → render `EmptyState`. Renders `ClienteListItem` per result.
  - [ ] 5.3 Create `frontend/src/shared/components/ClienteListItem.tsx` — displays `nombre` and `nit` per client. Selected item style: `primary-600` left border (3px), `primary-50` background.
  - [ ] 5.4 Create or reuse `frontend/src/shared/components/EmptyState.tsx` — displays icon, Spanish message, and optional CTA. For client list: "No hay clientes registrados. Crea el primero." with a "Nuevo cliente" button (disabled/stub in this story — wired in Story 2.3).
  - [ ] 5.5 Create or reuse `frontend/src/shared/components/ErrorPanel.tsx` — displays error icon, Spanish message "No se pudo cargar la lista de clientes. Intenta de nuevo.", and a "Reintentar" button that calls `onRetry`.
  - [ ] 5.6 Search input: siesa-ui-kit `Input` component, placeholder "Buscar cliente...", `aria-label="Buscar cliente"`, debounce 150ms. All text in Spanish.

- [ ] Task 6 — Backend unit tests (AC: 1, 2)
  - [ ] 6.1 Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` — verify `ClienteEntity.Create()` assigns a non-empty `Guid`, sets `Nombre`, `Nit`, `Telefono`, `Ciudad`, and sets `CreatedAt` as `DateTimeOffset`.
  - [ ] 6.2 Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — mock `IClienteRepository`, verify handler returns mapped `ClienteDto` list in correct order.
  - [ ] 6.3 All backend unit tests pass: `dotnet test tests/SiesaAgents.UnitTests`.

- [ ] Task 7 — Frontend unit and component tests (AC: 1–6)
  - [ ] 7.1 Create `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts` — use MSW to mock `GET /api/v1/clientes`. Verify hook returns client list, filters correctly by `nombre` and `nit`, returns empty array when no match.
  - [ ] 7.2 Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx` — verify: list renders on load, skeleton shown during loading, `ErrorPanel` with "Reintentar" shown on error, `EmptyState` shown when no clients, search input filters list.
  - [ ] 7.3 Accessibility assertion: no axe `critical` or `serious` violations on `ClienteListPanel` (AC: 6).
  - [ ] 7.4 All frontend tests pass: `pnpm run test --run`.

## Dev Notes

### Architecture Context

This story implements the first slice of Epic 2 (Client Management). It introduces `ClienteEntity` on the backend and the full client list + search experience on the frontend. No client creation, editing, or deletion is introduced here — those belong to Stories 2.3, 2.4, and 2.5.

The story touches both frontend and backend. The right panel (client detail) is a stub rendered by `clientes.$clienteId.tsx` — it will be fully implemented in Story 2.2.

**Frontend:** Clean Architecture module at `src/modules/crm/clientes/`. Filtering is client-side via `useMemo` over the TanStack Query cache. No search endpoint — `GET /api/v1/clientes` returns all clients and the frontend filters in memory (NFR1: < 1s with 500 records, actual < 50ms).

**Backend:** Single `GetClientes` query. No search parameter on the endpoint in this story. CQRS pattern: `GetClientesQuery` + `GetClientesQueryHandler` in `SiesaAgents.Application`. Repository implementation in `SiesaAgents.Infrastructure`.

### Domain Entity — `ClienteEntity`

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
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { }

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

**Critical rules:**
- `Guid` PK — never `int` or `string`
- `DateTimeOffset` — never `DateTime`
- Private constructor + `Create()` factory
- No `[Column]` or `[Table]` attributes — `EFCore.NamingConventions` handles snake_case automatically

### EF Core Configuration

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
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

**AppDbContext update — `OnModelCreating` order:**

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly); // BEFORE snake_case
    // ApplySnakeCaseNaming is handled via UseSnakeCaseNamingConvention() in DI (Program.cs)
}
```

### REST Endpoint Contract

```
GET /api/v1/clientes
Response: 200 OK — ClienteDto[]
```

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Construcciones del Valle",
    "nit": "900123456-7",
    "telefono": "601-2345678",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

Response is a direct JSON array — no wrapper object.

### Minimal API Endpoint Pattern

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        });
    }
}
```

### Frontend Domain Interface

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

### TanStack Query Hook with Client-Side Filtering

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { Cliente } from '../domain/Cliente'

export function useClientes(searchQuery: string = '') {
  const query = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  })

  const filtered = useMemo(() => {
    if (!query.data) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return query.data
    return query.data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q),
    )
  }, [query.data, searchQuery])

  return { ...query, data: filtered }
}
```

**Key rule:** `queryKey: ['clientes']` is the canonical key defined in architecture.md. Never use a string key.

### Route Structure

Per architecture.md, the clientes route uses a nested structure under the `_app` pathless layout:

```
frontend/src/routes/
  _app.tsx                    # Authenticated shell layout (pathless — no URL segment)
  _app/
    clientes.tsx              # /clientes — ClienteListPanel (left) + stub right panel
    clientes.$clienteId.tsx   # /clientes/:clienteId — Story 2.2
```

The left panel is always 280px fixed width on desktop. On mobile (< 1024px) the list is full width and the detail panel opens as an overlay or new screen.

### Component Lookup Order

Before creating any UI component:
1. Check siesa-ui-kit — use `Input`, `EmptyState`, `ErrorPanel`, `Skeleton` if they exist
2. Check shadcn/ui via MCP — install if needed
3. Build custom only if unavailable in both

**`EmptyState` and `ErrorPanel`** must be checked in siesa-ui-kit first. If they exist, use them directly without modification.

### Search Input

```typescript
// Debounced search — 150ms per UX spec
import { useState, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce' // or manual setTimeout

const [searchQuery, setSearchQuery] = useState('')
const debouncedSetSearch = useDebouncedCallback(setSearchQuery, 150)
```

All text in Spanish. Placeholder: `"Buscar cliente..."`. ARIA label: `"Buscar cliente"`.

### State Architecture

Per architecture.md "State Boundaries":

```
Server State (TanStack Query):
  ['clientes']  →  GET /api/v1/clientes  (single fetch on mount, cached)

Client-side filter (local React state — useState in ClienteListPanel):
  searchQuery: string  →  useMemo filter over cached ['clientes'] data

No Zustand store needed for this story.
```

### Database Schema (expected after migration)

```sql
-- Table: clientes
-- Columns (snake_case auto via EFCore.NamingConventions):
id         UUID PRIMARY KEY DEFAULT uuidv7()
nombre     VARCHAR(200) NOT NULL
nit        VARCHAR(50)  NOT NULL
telefono   VARCHAR(50)  NOT NULL
ciudad     VARCHAR(100) NOT NULL
created_at TIMESTAMPTZ  NOT NULL
updated_at TIMESTAMPTZ  NOT NULL

-- Unique index:
uk_clientes_nit ON clientes(nit)
```

### Scope Boundary (CRITICAL)

This story is READ-ONLY from the user's perspective. It implements:
- `ClienteEntity` definition and `clientes` migration
- `GET /api/v1/clientes` endpoint
- Frontend list + search + empty state + error state

It does NOT implement:
- Client creation → Story 2.3
- Client detail view → Story 2.2
- Client editing → Story 2.4
- Client deletion → Story 2.5
- Sort controls → Story 2.6

The right panel of `/clientes` is a placeholder `<div>` in this story. It will be replaced in Story 2.2.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1`] — acceptance criteria
- [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`] — `ClienteEntity` fields, `clientes` table schema, `uk_clientes_nit`
- [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`] — `GET /api/v1/clientes`, direct array response
- [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`] — `useClientes.ts`, `ClienteListView.tsx`, route `_app/clientes.tsx`
- [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`] — `['clientes']` query key, client-side filter via `useMemo`, no Zustand
- [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`] — snake_case DB, PascalCase C#, camelCase TS, Spanish UI
- [Source: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`] — `src/modules/crm/clientes/` folder layout
- [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`] — FR1 → `useClientes.ts` + `ClienteListView.tsx`; FR2 → client-side filter
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision`] — Direction F: 280px left panel, search-first layout
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Experience Mechanics`] — real-time filter, "Buscar cliente..." placeholder, EmptyState CTA
- [Source: `_bmad-output/planning-artifacts/prd/functional-requirements.md`] — FR1 (list), FR2 (search by nombre), FR3 (search by NIT), FR27 (changes immediate)
- [Source: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`] — NFR1 (< 1s search with 500 records), NFR6 (no stack traces)
- [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`] — UUID PKs, DateTimeOffset, snake_case DB, Spanish UI text, TanStack Query, Zod, Clean Architecture

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

None — story created, not yet implemented.

### File List

**To be created (frontend):**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- `frontend/src/shared/components/ClienteListItem.tsx`
- `frontend/src/shared/components/EmptyState.tsx` (check siesa-ui-kit first)
- `frontend/src/shared/components/ErrorPanel.tsx` (check siesa-ui-kit first)
- `frontend/src/routes/_app/clientes.tsx` (replace placeholder from Story 1.2)
- `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx`

**To be created (backend):**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_AddClientes.cs` (auto-generated)
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

**To be modified (backend):**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — add `DbSet<ClienteEntity> Clientes` + `ApplyConfigurationsFromAssembly`
- `backend/src/SiesaAgents.API/Program.cs` — register `IClienteRepository`, map `ClienteEndpoints`
