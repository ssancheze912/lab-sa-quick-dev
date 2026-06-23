# Story 2.1: Client List & Search

Status: ready-for-dev

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **AC1 (Client list rendered):** Given there are clients in the system, when the user navigates to `/clientes`, then the left panel (280px fixed width) renders a scrollable list of all clients displaying Nombre and NIT/RUC per item.

2. **AC2 (Real-time search by name or NIT/RUC):** Given the client list is loaded, when the user types in the search input field, then the list filters in real time showing only clients whose Nombre or NIT/RUC contains the input (case-insensitive), and results appear in under 1 second with up to 500 records (NFR1).

3. **AC3 (Empty state):** Given there are no clients in the system, when the user navigates to `/clientes`, then an `EmptyState` component is displayed inside the left panel with a message guiding the user to create the first client ("No hay clientes registrados. Crea el primero.").

4. **AC4 (Error panel on fetch failure):** Given the backend is unavailable when the page loads, when the `GET /api/v1/clientes` request fails, then an `ErrorPanel` with a "Reintentar" button is displayed instead of the client list, and clicking "Reintentar" re-triggers the query.

5. **AC5 (Loading skeleton):** Given the page is loading, when the `GET /api/v1/clientes` request is in flight, then skeleton placeholders (using `react-loading-skeleton`) are displayed in the left panel instead of a spinner.

6. **AC6 (Backend endpoint):** Given the frontend calls `GET /api/v1/clientes`, when the endpoint responds, then it returns a JSON array of client objects (`{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }`) with status 200 and no wrapper object (direct array).

7. **AC7 (Domain entity and DB migration):** Given this is the first story that introduces the Client domain, when the EF Core migration runs, then the `clientes` table exists in `siesa_agents_db` with columns: `id` (uuid PK, default uuidv7()), `nombre` (varchar not null), `nit` (varchar unique not null), `telefono` (varchar), `ciudad` (varchar), `created_at` (timestamptz not null), `updated_at` (timestamptz not null). The unique index `uk_clientes_nit` must exist.

8. **AC8 (Search does not trigger new API call):** Given the client list is loaded via TanStack Query, when the user types in the search field, then filtering is performed client-side over the cached array (useMemo) without issuing a new HTTP request (NFR1 — client-side filter over ≤ 500 records).

9. **AC9 (No detail panel on initial load):** Given the user navigates to `/clientes` without a specific client selected, when the page loads, then the right panel shows a default "selecciona un cliente de la lista" placeholder state (no detail content).

10. **AC10 (Accessibility):** Given the search input renders, when the page is inspected, then the input has `aria-label="Buscar cliente"` and the list items are accessible via keyboard navigation (Tab / Enter to select).

## Tasks / Subtasks

- [ ] Task 1 — Backend: Define ClienteEntity and configure EF Core (AC: 6, 7)
  - [ ] 1.1 Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — UUID PK (Guid, Guid.NewGuid()), Nombre (string), NIT (string), Telefono (string?), Ciudad (string?), CreatedAt (DateTimeOffset), UpdatedAt (DateTimeOffset). Use private constructor + static `Create()` factory pattern.
  - [ ] 1.2 Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with method signatures: `Task<IEnumerable<ClienteDto>> GetAllAsync(CancellationToken ct)` and `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`.
  - [ ] 1.3 Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`. Configure: table name (EF Core infers via snake_case — do NOT set manually), PK, unique index `uk_clientes_nit` on `NIT`, required fields (`Nombre`, `NIT`). Do NOT use `[Column]` or `[Table]` attributes — rely on `ApplySnakeCaseNaming()`.
  - [ ] 1.4 Add `DbSet<ClienteEntity> Clientes { get; set; }` to `SiesaAgentsDbContext` and call `modelBuilder.ApplyConfiguration(new ClienteConfiguration())` in `OnModelCreating` before `ApplySnakeCaseNaming()`.
  - [ ] 1.5 Run EF Core migration: `dotnet ef migrations add AddClienteEntity --project backend/src/SiesaAgents.Infrastructure --startup-project backend/src/SiesaAgents.API --output-dir Data/Migrations`
  - [ ] 1.6 Apply migration: `dotnet ef database update --project backend/src/SiesaAgents.Infrastructure --startup-project backend/src/SiesaAgents.API`

- [ ] Task 2 — Backend: Application layer — GetClientes query (AC: 6)
  - [ ] 2.1 Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — properties: `Guid Id`, `string Nombre`, `string NIT`, `string? Telefono`, `string? Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`.
  - [ ] 2.2 Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (record with no properties — list all).
  - [ ] 2.3 Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — inject `IClienteRepository`, return `IEnumerable<ClienteDto>` using a simple projection from entity to DTO. No pagination (MVP).
  - [ ] 2.4 Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`. `GetAllAsync` → `_context.Clientes.AsNoTracking().Select(c => new ClienteDto { ... }).ToListAsync(ct)`.
  - [ ] 2.5 Register `IClienteRepository` → `ClienteRepository` as scoped in `Program.cs`. Register `GetClientesQueryHandler` as scoped.

- [ ] Task 3 — Backend: API endpoint GET /api/v1/clientes (AC: 6)
  - [ ] 3.1 Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with a static class `ClienteEndpoints`. Add extension method `MapClienteEndpoints(this WebApplication app)`.
  - [ ] 3.2 Implement `GET /api/v1/clientes` endpoint inside `MapClienteEndpoints`: inject `GetClientesQueryHandler`, call `handler.HandleAsync(new GetClientesQuery(), ct)`, return `Results.Ok(clientes)` (direct array, no wrapper). HTTP 200.
  - [ ] 3.3 Register `app.MapClienteEndpoints()` in `Program.cs`.
  - [ ] 3.4 Confirm Scalar API docs (`app.MapScalarApiReference()`) still registered. Do NOT add Swagger.

- [ ] Task 4 — Frontend: Domain layer — Cliente entity and repository interface (AC: 1, 2, 8)
  - [ ] 4.1 Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono?: string; ciudad?: string; createdAt: string; updatedAt: string; }`.
  - [ ] 4.2 Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`.

- [ ] Task 5 — Frontend: Infrastructure layer — API repository (AC: 6)
  - [ ] 5.1 Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` implementing `IClienteRepository`. Use the shared Axios instance from `frontend/src/shared/lib/apiClient.ts`. `getAll()` → `GET /api/v1/clientes` → returns `Cliente[]`.

- [ ] Task 6 — Frontend: Application layer — useClientes hook (AC: 1, 2, 5, 8)
  - [ ] 6.1 Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook: `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`. Exposes `data`, `isLoading`, `isError`, `refetch`.
  - [ ] 6.2 Create `frontend/src/modules/crm/clientes/application/useClienteSearch.ts` — custom hook accepting `clientes: Cliente[]` and `query: string`, returning `useMemo(() => clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)), [clientes, query])`. No new API call on filter.

- [ ] Task 7 — Frontend: Presentation layer — ClienteListPanel component (AC: 1, 2, 3, 4, 5, 9, 10)
  - [ ] 7.1 Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`. This is the 280px left panel. Props: `selectedId?: string`, `onSelect: (id: string) => void`. Internally uses `useClientes()` and local `useState<string>` for `searchQuery`.
  - [ ] 7.2 Implement loading state: when `isLoading === true`, render `<Skeleton count={8} height={56} />` from `react-loading-skeleton` (no spinner).
  - [ ] 7.3 Implement error state: when `isError === true`, render `<ErrorPanel message="No se pudo cargar la lista de clientes." onRetry={refetch} />`. The "Reintentar" button calls `refetch()`.
  - [ ] 7.4 Implement empty state: when `data` is empty array, render `<EmptyState message="No hay clientes registrados. Crea el primero." />`.
  - [ ] 7.5 Implement search input: `<input type="text" aria-label="Buscar cliente" placeholder="Buscar por nombre o NIT/RUC..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />`. Use TailwindCSS v4 for styling (Siesa Blue: `#0e79fd` focus ring, `slate-*` for borders/backgrounds).
  - [ ] 7.6 Implement client list: map `filteredClientes` (from `useClienteSearch`) to `<ClientListItem>` components. Each item is keyboard-focusable and calls `onSelect(cliente.id)` on click/Enter.
  - [ ] 7.7 Create or reuse `frontend/src/shared/components/ClientListItem.tsx` — renders `nombre` (bold, `slate-900`) and `nit` (small, `slate-500`). Highlighted state when `id === selectedId`. Accessible with `role="button"` and `tabIndex={0}`.
  - [ ] 7.8 Create or reuse `frontend/src/shared/components/EmptyState.tsx` if not already created by Story 1.2. Props: `message: string`, optional `icon?: ReactNode`.
  - [ ] 7.9 Create or reuse `frontend/src/shared/components/ErrorPanel.tsx` — Props: `message: string`, `onRetry: () => void`. Renders the message and a "Reintentar" button.

- [ ] Task 8 — Frontend: Route integration (AC: 1, 9)
  - [ ] 8.1 Update `frontend/src/routes/_app/clientes.tsx` to render the split-panel layout: left panel (`ClienteListPanel`, `w-[280px] flex-shrink-0`) + right panel (`flex-1`) showing the default placeholder when no client is selected. Use `flex h-full` on the container.
  - [ ] 8.2 Implement route-level `selectedClienteId` state synced to TanStack Router search params (e.g., `?clienteId=xxx`). Pass `selectedId` and `onSelect` as props to `ClienteListPanel`. When `selectedId` is set, render the right panel placeholder; client detail is covered in Story 2.2.
  - [ ] 8.3 Verify `frontend/src/routes/_app.tsx` shell layout provides correct height context (`h-full` or `min-h-screen`) so the split panel fills the viewport.

- [ ] Task 9 — Tests (AC: 1, 2, 3, 4, 5, 8)
  - [ ] 9.1 Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts` — Vitest + MSW. Test: on success returns `Cliente[]`; on network error `isError` is true.
  - [ ] 9.2 Create `frontend/src/modules/crm/clientes/application/useClienteSearch.test.ts` — unit test: filters by nombre (case-insensitive), filters by NIT, returns all when query is empty, returns empty when no match.
  - [ ] 9.3 Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx` — RTL + MSW. Test: renders skeleton on loading; renders EmptyState when no clients; renders ErrorPanel on error; renders list items when data loads; filters list on search input change; no new fetch on search (spy on fetch calls).
  - [ ] 9.4 Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — xUnit. Test: returns empty list when no clients; returns mapped DTOs when clients exist. Use EF Core InMemory + mock `IClienteRepository`. Arrange / Act / Assert pattern.
  - [ ] 9.5 Create `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — xUnit + TestContainers (PostgreSQL). Test: `GET /api/v1/clientes` returns 200 with direct array; endpoint responds with correct Content-Type `application/json`.

## Dev Notes

### Architecture Context

This story introduces the full Clean Architecture stack for the `clientes` domain — both frontend and backend. It is the first story in Epic 2 and must establish all the foundational files that Stories 2.2–2.6 will extend.

The UI layout is a **split-panel design** (not MasterCrud). The architecture specifies a fixed 280px left panel (`ClienteListPanel`) and a flexible right panel. MasterCrud is the siesa-ui-kit orchestrator for standard CRUD grids; this story uses a custom split-panel that matches the UX specification's "Direction F — two-panel layout". Do NOT use `<MasterCrud>` here — the layout is intentionally bespoke.

**Search Strategy (mandatory):** TanStack Query loads all clients on mount with `queryKey: ['clientes']`. Client-side filtering via `useMemo` handles NFR1 (< 1s with 500 records — actual < 50ms). No search query parameter is sent to the backend in this story.

**State management:** `searchQuery` is local `useState` in `ClienteListPanel`. `selectedClienteId` is a TanStack Router search param on the `/clientes` route (not Zustand — URL is source of truth per architecture decision).

[Source: architecture.md#Frontend Architecture, architecture.md#State Boundaries]

### Backend Domain Entity Pattern

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string NIT { get; private set; } = string.Empty;
    public string? Telefono { get; private set; }
    public string? Ciudad { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { } // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string? telefono = null, string? ciudad = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);

        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            NIT = nit.Trim(),
            Telefono = telefono?.Trim(),
            Ciudad = ciudad?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
```

**CRITICAL:** Use `DateTimeOffset` — NEVER `DateTime`. Use `Guid.NewGuid()` for ID. Private constructor required by EF Core. Static `Create()` factory is mandatory per company standards.

[Source: company-standards.md#Backend Critical Rules — Entity Pattern, architecture.md#Data Architecture]

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
        // EF Core + ApplySnakeCaseNaming() handles table/column naming automatically.
        // Table will be: clientes | Columns: id, nombre, nit, telefono, ciudad, created_at, updated_at
        // DO NOT set HasColumnName or ToTable manually.

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.NIT).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).HasMaxLength(30);
        builder.Property(c => c.Ciudad).HasMaxLength(100);

        // Unique constraint on NIT
        builder.HasIndex(c => c.NIT)
               .IsUnique()
               .HasDatabaseName("uk_clientes_nit");
    }
}
```

[Source: company-standards.md#Database Conventions, architecture.md#Data Architecture]

### SiesaAgentsDbContext Update

Add to `SiesaAgentsDbContext.cs` (inside the `OnModelCreating` override, BEFORE `ApplySnakeCaseNaming()`):

```csharp
public DbSet<ClienteEntity> Clientes { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.ApplyConfiguration(new ClienteConfiguration());

    // MANDATORY: Must be the last call.
    modelBuilder.UseSnakeCaseNamingConvention();
}
```

[Source: story-1-3#Dev Notes — SiesaAgentsDbContext Implementation, company-standards.md#EF Core]

### API Endpoint Pattern

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes")
                       .WithTags("Clientes");

        group.MapGet("/", async (
            GetClientesQueryHandler handler,
            CancellationToken ct) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(clientes); // Returns direct array — no wrapper object
        });
    }
}
```

Response shape: `[{ "id": "uuid", "nombre": "...", "nit": "...", "telefono": null, "ciudad": null, "createdAt": "2026-06-23T...", "updatedAt": "2026-06-23T..." }]`

[Source: architecture.md#API & Communication Patterns, architecture.md#Format Patterns]

### Frontend Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 30_000, // 30s — list data, not real-time
  });
}

// frontend/src/modules/crm/clientes/application/useClienteSearch.ts
import { useMemo } from 'react';
import type { Cliente } from '../domain/Cliente';

export function useClienteSearch(clientes: Cliente[], query: string): Cliente[] {
  return useMemo(() => {
    if (!query.trim()) return clientes;
    const q = query.toLowerCase();
    return clientes.filter(
      c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
    );
  }, [clientes, query]);
}
```

[Source: architecture.md#Frontend Architecture — TanStack Query keys, architecture.md#Data Flow Diagram]

### UI Implementation Requirements (MANDATORY)

- **Primary library**: `siesa-ui-kit` — check its catalog first before creating any custom UI component.
- **Skeleton loading**: Use `react-loading-skeleton` — skeleton screens, NOT spinners (company standard).
- **All user-facing text in Spanish**: labels, placeholders, messages, ARIA labels, error messages.
- **Siesa Blue**: `#0e79fd` for focus rings, active states, and primary interactive elements.
- **Neutrals**: `slate-*` Tailwind scale for borders, backgrounds, and secondary text.
- **Dark mode**: class-based (`dark:` Tailwind prefix) — supported by siesa-ui-kit natively.
- **Accessibility**: WCAG 2.1 AA — all interactive elements must have ARIA labels and keyboard support.

[Source: company-standards.md#UX Design System, company-standards.md#Frontend Key Rules]

### ClienteListPanel Structure

```
/clientes route (_app/clientes.tsx)
├── div.flex.h-full
│   ├── ClienteListPanel [w-[280px] flex-shrink-0 border-r border-slate-200]
│   │   ├── search input [aria-label="Buscar cliente"]
│   │   ├── IF isLoading → <Skeleton count={8} height={56} />
│   │   ├── IF isError → <ErrorPanel onRetry={refetch} />
│   │   ├── IF data.length === 0 → <EmptyState message="..." />
│   │   └── ELSE → scrollable list of <ClientListItem> components
│   └── right panel [flex-1]
│       └── IF no selectedId → placeholder "Selecciona un cliente de la lista"
```

[Source: architecture.md#Component Boundaries (Frontend), architecture.md#Complete Project Directory Structure]

### Project Structure Notes

**New files to create (frontend):**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
frontend/src/modules/crm/clientes/application/useClientes.ts
frontend/src/modules/crm/clientes/application/useClienteSearch.ts
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx
frontend/src/shared/components/ClientListItem.tsx
frontend/src/shared/components/EmptyState.tsx          (create if not from Story 1.2)
frontend/src/shared/components/ErrorPanel.tsx
frontend/src/modules/crm/clientes/application/useClientes.test.ts
frontend/src/modules/crm/clientes/application/useClienteSearch.test.ts
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx
```

**Files to modify (frontend):**
```
frontend/src/routes/_app/clientes.tsx                  ← Add split-panel layout + ClienteListPanel
```

**New files to create (backend):**
```
backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs
```

**Files to modify (backend):**
```
backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs  ← Add DbSet<ClienteEntity> + Configuration
backend/src/SiesaAgents.API/Program.cs                               ← Register IClienteRepository, handlers, MapClienteEndpoints
```

**EF Core migration to generate:**
```
backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_AddClienteEntity.cs
```

### Anti-Patterns to Avoid

| Anti-pattern | Correct approach |
|---|---|
| `DateTime` in entity | Use `DateTimeOffset` |
| `[Column("nombre")]` attribute | Let `ApplySnakeCaseNaming()` handle it |
| Spinner on loading | `react-loading-skeleton` skeleton screens |
| English UI text | Spanish mandatory |
| `useQuery({ queryKey: 'clientes' })` | `queryKey: ['clientes']` (array) |
| Exposing `error.message` in UI | `<ErrorPanel>` with generic message |
| `app.UseSwagger()` | `app.MapScalarApiReference()` only |
| New HTTP fetch on search input | `useMemo` filter over cached data |

[Source: architecture.md#Enforcement Guidelines — Anti-patterns, company-standards.md#Backend Critical Rules]

### Previous Story Learnings

From Story 1.3 (completed):
- Backend root is `backend/` relative to repo root.
- `SiesaAgentsDbContext` exists at `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs`.
- `UseSnakeCaseNamingConvention()` must remain the last call in `OnModelCreating`.
- `ExceptionHandlingMiddleware` is already registered in `Program.cs`.
- Run all `dotnet ef` commands with explicit `--project` and `--startup-project` flags.
- `EFCore.NamingConventions` and `Npgsql.EntityFrameworkCore.PostgreSQL` packages are already installed in `SiesaAgents.Infrastructure.csproj`.

From Story 1.2 (completed, frontend shell):
- TanStack Router is configured with file-based routing under `frontend/src/routes/`.
- The `_app.tsx` shell layout provides the navigation rail. Verify it provides `h-full` context for split panel.
- `frontend/src/shared/lib/apiClient.ts` (Axios singleton) may already exist — verify before creating.
- Check if `EmptyState.tsx` was created in Story 1.2 before creating a new one.

[Source: story-1-3#Dev Notes, story-1-2 if available]

### Git History Context

Recent commits show active Epic 1 foundation work (backend DB, frontend shell, test coverage) has been completed. Epic 2 TEA test design artifact is already generated (`docs(tea): add test design for epic 2 client management`). The test design document should be consulted when writing tests.

[Source: git log]

### Key Constraints Checklist

| Constraint | Rule | Source |
|---|---|---|
| Entity PK | UUID (Guid.NewGuid()) | company-standards.md#Backend Critical Rules |
| Timestamps | DateTimeOffset — NEVER DateTime | company-standards.md#Backend Critical Rules |
| DB naming | snake_case via ApplySnakeCaseNaming() | company-standards.md#Database Conventions |
| UI text | Spanish mandatory | company-standards.md#Frontend Key Rules |
| Search | Client-side useMemo — no extra HTTP call | architecture.md#Search Strategy |
| Loading state | react-loading-skeleton (no spinners) | company-standards.md#Loading States |
| State | searchQuery → useState; selectedClienteId → URL search param | architecture.md#State Boundaries |
| API response | Direct array, no wrapper object | architecture.md#Format Patterns |
| Error format | Problem Details RFC 7807 from backend | company-standards.md#Backend Critical Rules |
| API docs | Scalar only | company-standards.md#Backend Critical Rules |
| Package manager | pnpm (frontend) | company-standards.md#Frontend Key Rules |

### References

- [Source: epic-02-gestion-de-clientes.md#Story 2.1] — User story, acceptance criteria, split-panel layout specification
- [Source: architecture.md#Data Architecture] — ClienteEntity fields, PostgreSQL schema (`clientes` table), uk_clientes_nit index
- [Source: architecture.md#Frontend Architecture] — Routing, TanStack Query keys, ClienteListView component mapping
- [Source: architecture.md#Component Boundaries (Frontend)] — Split-panel layout, 280px left panel
- [Source: architecture.md#State Boundaries] — searchQuery as local state, selectedClienteId as URL param
- [Source: architecture.md#API & Communication Patterns] — GET /api/v1/clientes endpoint
- [Source: architecture.md#Implementation Patterns & Consistency Rules] — Naming conventions, anti-patterns
- [Source: architecture.md#Requirements to Structure Mapping] — FR1 (useClientes.ts → ClienteListView.tsx), FR2 (useMemo filter)
- [Source: company-standards.md#Frontend Stack] — React 18+, TanStack Query 5+, Zustand 5+, TypeScript strict
- [Source: company-standards.md#Backend Stack] — .NET 10, EF Core 10, FluentValidation, xUnit
- [Source: company-standards.md#Database Conventions] — snake_case, UUID PKs, DateTimeOffset
- [Source: company-standards.md#Testing Standards] — Vitest + RTL + MSW (frontend), xUnit + InMemory + TestContainers (backend)
- [Source: company-standards.md#UX Design System] — Siesa Blue #0e79fd, slate-* neutrals, Inter font
- [Source: story-1-3#Dev Notes] — DbContext location, existing packages, dotnet ef commands
- [Source: mastercrud-use-reference.md] — MasterCrud API reference (NOT used in this story — split-panel layout per UX spec)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
