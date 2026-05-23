# Story 2.1: Client List & Search

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px wide) shows a scrollable list of all clients **And** each item displays the client's Nombre and NIT/RUC.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input **And** results appear in under 1 second with up to 500 records (NFR1) **And** no additional API call is made during typing — filtering is client-side.

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list **And** clicking "Reintentar" retries the API call.

## Tasks / Subtasks

- [x] Task 1 — Define `ClienteEntity` domain model and `IClienteRepository` contract (AC: 1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface with fields: `id` (string UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (string ISO 8601), `updatedAt` (string ISO 8601)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(search?: string): Promise<Cliente[]>`

- [x] Task 2 — Implement `clienteApiRepository` in the infrastructure layer (AC: 1, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Use the Axios `apiClient` singleton (`frontend/src/shared/lib/apiClient.ts`)
  - [ ] Implement `getAll(search?: string)` → `GET /api/v1/clientes` (no `?search=` param — filtering is client-side)
  - [ ] Implement `IClienteRepository`

- [x] Task 3 — Implement `useClientes` TanStack Query hook (AC: 1, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Use `useQuery` with `queryKey: ['clientes']`
  - [ ] Call `clienteApiRepository.getAll()`
  - [ ] Return `{ data, isLoading, isError, refetch }` — expose `refetch` for the ErrorPanel retry action
  - [ ] `staleTime`: 5 minutes (aligned with `queryClient.ts` default)

- [x] Task 4 — Implement `ClienteListPanel` presentation component (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [ ] Fixed width: `w-[280px]` (Tailwind) with `overflow-y-auto` for scroll
  - [ ] Search input at top: `placeholder="Buscar por nombre o NIT/RUC"`, `aria-label="Buscar clientes"`
  - [ ] Filter logic: `useMemo` over the TanStack Query cached array — match `nombre` or `nit` (case-insensitive) against `searchQuery` local state
  - [ ] Render list of `ClientListItem` components (one per filtered result)
  - [ ] Show `EmptyState` when `data` is loaded and empty (no clients exist)
  - [ ] Show `ErrorPanel` with `onRetry={refetch}` when `isError === true`
  - [ ] Show react-loading-skeleton placeholders when `isLoading === true` (3 skeleton rows)

- [x] Task 5 — Create `ClientListItem` shared component (AC: 1)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [ ] Props: `nombre: string`, `nit: string`, `isActive?: boolean`
  - [ ] Display `nombre` (primary text) and `nit` (secondary text, smaller, muted)
  - [ ] Apply active/hover state styling using Tailwind + Siesa Blue `#0e79fd`
  - [ ] ARIA: `role="listitem"`, `aria-current={isActive ? 'true' : undefined}`

- [x] Task 6 — Create `EmptyState` shared component (AC: 3)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` (if not already present from Story 1.x)
  - [ ] Props: `title: string`, `description?: string`, `action?: React.ReactNode`
  - [ ] Center-aligned in panel, Heroicon illustration (e.g., `UsersIcon` large), Spanish text
  - [ ] Default message: `"No hay clientes registrados"` with description `"Crea el primer cliente para comenzar."`

- [x] Task 7 — Create `ErrorPanel` shared component (AC: 4)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `message?: string`, `onRetry?: () => void`
  - [ ] Default message: `"No se pudo cargar la información"`
  - [ ] Show "Reintentar" button that calls `onRetry` if provided
  - [ ] Heroicons `ExclamationCircleIcon` for visual cue
  - [ ] WCAG 2.1 AA: button accessible via keyboard, visible focus ring

- [x] Task 8 — Wire `ClienteListPanel` into the `/clientes` route (AC: 1)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — replace placeholder with `ClienteListPanel`
  - [ ] Route renders a two-panel layout: `ClienteListPanel` (280px left) + right panel `<Outlet />` or placeholder for upcoming Story 2.2

- [x] Task 9 — Backend: define `ClienteEntity` and EF Core configuration (AC: 1, 4)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
    - Fields: `Id` (Guid, UUID), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
    - Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory
    - `Update(string nombre, string nit, string telefono, string ciudad)` method sets `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct);`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — `IEntityTypeConfiguration<ClienteEntity>`, unique index on `Nit` (`uk_clientes_nit`), index on `Nombre` (`ix_clientes_nombre`)
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
  - [ ] Run EF Core migration: `dotnet ef migrations add AddClienteEntity --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`

- [x] Task 10 — Backend: implement CQRS query and handler (AC: 1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — record with no parameters
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — calls `IClienteRepository.GetAllAsync()`, maps to `ClienteDto`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — `{ Guid Id, string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt }`
  - [ ] Register `IClienteRepository` → `ClienteRepository` in DI (Program.cs)

- [x] Task 11 — Backend: implement `ClienteRepository` (AC: 1, 4)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
  - [ ] Implement `IClienteRepository`; use `AppDbContext`
  - [ ] `GetAllAsync`: `return await _context.Clientes.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct);`

- [x] Task 12 — Backend: expose `GET /api/v1/clientes` endpoint (AC: 1, 4)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] `MapGet("/api/v1/clientes", ...)` → dispatches `GetClientesQuery`, returns `200 OK` with `ClienteDto[]`
  - [ ] Register in `Program.cs`: `app.MapClienteEndpoints()`
  - [ ] Response format: direct JSON array (no wrapper object) — per architecture contract

- [x] Task 13 — Write frontend unit tests (AC: 2)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`
    - UNIT-C-FE-01: `useClientes` returns data from `clienteApiRepository.getAll()` on success
    - UNIT-C-FE-02: `useClientes` exposes `isError = true` when repository throws
  - [ ] Create `frontend/src/shared/components/__tests__/EmptyState.test.tsx`
    - UNIT-C-FE-03: `EmptyState` renders title and description props
  - [ ] Create `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx`
    - UNIT-C-FE-04: `ErrorPanel` renders "Reintentar" button and calls `onRetry` on click

- [x] Task 14 — Write backend unit tests (AC: 1, 4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Handlers/GetClientesQueryHandlerTests.cs`
    - UNIT-B-01: Handler returns all clients as `ClienteDto[]` when repository returns data
    - UNIT-B-02: Handler returns empty array when repository returns no records

## Dev Notes

### Architecture Context

This story is the first story of Epic 2. It builds on the foundation from Epic 1 (Stories 1.1, 1.2, 1.3) and introduces:
- The `ClienteEntity` domain entity (backend) and `Cliente` TypeScript interface (frontend)
- The first working API endpoint: `GET /api/v1/clientes`
- The `ClienteListPanel` as the left-side panel (280px) of the split-panel Clientes view

**Depends on:**
- Story 1.1 — Frontend project initialized (Vite, React, TanStack Router, TanStack Query, Axios, shadcn/ui)
- Story 1.2 — `/clientes` route exists as a placeholder at `frontend/src/routes/_app/clientes.tsx`
- Story 1.3 — `AppDbContext` exists with `ApplySnakeCaseNaming()`, `ExceptionHandlingMiddleware` active, `siesa_agents_db` connected

**Provides for:** Story 2.2 (Client Detail View) will add the right panel on the same `/clientes` route, displaying detail when a client is clicked in the list.

**Search strategy (from architecture.md):** All records are loaded on mount via TanStack Query (`queryKey: ['clientes']`). Filtering is 100% client-side using `useMemo` over the cached array — no `?search=` query parameter is sent to the backend. This guarantees sub-150ms filter response time for up to 500 records (NFR1).

### Frontend File Locations

```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts                         # TypeScript entity interface
      IClienteRepository.ts              # Repository contract
    application/
      useClientes.ts                     # TanStack Query hook — queryKey: ['clientes']
    infrastructure/
      clienteApiRepository.ts            # Axios impl of IClienteRepository
    presentation/
      ClienteListPanel.tsx               # 280px left panel — list + search
  shared/components/
    ClientListItem.tsx                   # Reusable list item (nombre + nit)
    EmptyState.tsx                       # Empty state component
    ErrorPanel.tsx                       # Error + retry component
```

### `Cliente` TypeScript Interface

```typescript
// frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string;           // UUID
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;    // ISO 8601 with timezone — DateTimeOffset serialized
  updatedAt: string;
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

### `ClienteListPanel` Search Filter Pattern

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx
const [searchQuery, setSearchQuery] = useState('')
const { data = [], isLoading, isError, refetch } = useClientes()

const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return data
  const lower = searchQuery.toLowerCase()
  return data.filter(
    c => c.nombre.toLowerCase().includes(lower) || c.nit.toLowerCase().includes(lower)
  )
}, [data, searchQuery])
```

**Key rules:**
- `data` defaults to `[]` to avoid null checks — `useQuery` returns `undefined` until loaded
- `useMemo` re-runs only when `data` or `searchQuery` changes
- No debounce needed — client-side filter over ≤ 500 objects is instantaneous

### Backend: `ClienteEntity` Pattern

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

    private ClienteEntity() { } // EF Core constructor

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

**Critical rules (company standards):**
- `DateTimeOffset` — NEVER `DateTime`
- `Guid` UUID primary key — NEVER `int` or `string`
- Private constructor for EF Core; public factory via `Create()`
- EF Core + `ApplySnakeCaseNaming()` will map `CreatedAt` → `created_at` automatically — NO `[Column]` attributes

### Backend: `ClienteConfiguration` Pattern

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

        // Unique index on NIT — enforces FR7 (uniqueness)
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");

        // Index for search performance
        builder.HasIndex(c => c.Nombre).HasDatabaseName("ix_clientes_nombre");
    }
}
```

### Backend: `GET /api/v1/clientes` Endpoint

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .Produces<ClienteDto[]>(StatusCodes.Status200OK);
    }
}
```

**Response contract (direct array, no wrapper):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Construcciones del Valle",
    "nit": "900123456-1",
    "telefono": "+57 1 234 5678",
    "ciudad": "Bogotá",
    "createdAt": "2026-05-20T10:30:00Z",
    "updatedAt": "2026-05-20T10:30:00Z"
  }
]
```

### EF Core Migration Command

Run from `backend/` directory after adding `DbSet<ClienteEntity>` to `AppDbContext`:

```bash
dotnet ef migrations add AddClienteEntity \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

This creates the `clientes` table with columns: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at` (snake_case via `ApplySnakeCaseNaming()`).

### Loading State — Skeleton Pattern

```typescript
// Inside ClienteListPanel — use react-loading-skeleton (company standard for placeholders)
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

if (isLoading) {
  return (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1 p-3">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      ))}
    </div>
  )
}
```

**Note:** Use skeleton screens, NOT spinners — per company standards.

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/clientes/clientes-list.spec.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-C-01 | P0 | AC1 | List panel renders all clients returned by API on page load |
| E2E-C-02 | P0 | AC2 | Typing in search input filters list to matching clients (by Nombre) in real time without new API calls |
| E2E-C-03 | P1 | AC2 | Typing NIT in search input filters list to matching clients (by NIT/RUC) |
| E2E-C-04 | P1 | AC2 | Clearing search input after filtering restores full client list |
| E2E-C-05 | P2 | AC3 | EmptyState component is visible when no clients exist in the system |
| E2E-C-06 | P2 | AC4 | ErrorPanel with "Reintentar" button is shown when API returns 500 on load |

**Implementation notes (from test-design-epic-2.md):**
- E2E-C-02: Use `page.route('**/api/v1/clientes', ...)` to assert only 1 GET call is made on page load; subsequent filter is client-side.
- E2E-C-05: Mock empty array response via `page.route()`.
- E2E-C-06: Use `page.route('**/api/v1/clientes', route => route.fulfill({ status: 500 }))` before navigation.

**API Integration Tests — `e2e/tests/clientes/clientes-api.spec.ts`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| API-C-07 | P1 | GET `/api/v1/clientes` returns array; each item has `id`, `nombre`, `nit` fields |

**Frontend Unit Tests (Vitest + RTL):**

| Test ID | Priority | File | Description |
|---------|----------|------|-------------|
| UNIT-C-FE-01 | P1 | `useClientes.test.ts` | Returns client data from repository on success |
| UNIT-C-FE-02 | P1 | `useClientes.test.ts` | Exposes `isError = true` when fetch throws |
| UNIT-C-FE-03 | P1 | `EmptyState.test.tsx` | Renders title and description props |
| UNIT-C-FE-04 | P1 | `ErrorPanel.test.tsx` | Renders "Reintentar" and calls `onRetry` on click |

**Backend Unit Tests (xUnit):**

| Test ID | Priority | File | Description |
|---------|----------|------|-------------|
| UNIT-B-01 | P1 | `GetClientesQueryHandlerTests.cs` | Handler returns `ClienteDto[]` when repository returns data |
| UNIT-B-02 | P1 | `GetClientesQueryHandlerTests.cs` | Handler returns empty array when repository has no records |

### Key Anti-Patterns to Avoid

```
❌ debouncing search input         → useMemo over in-memory array, no debounce needed
❌ sending ?search= to API         → client-side filter only (architecture.md decision)
❌ string queryKey                 → use array: ['clientes']
❌ DateTime in ClienteEntity       → DateTimeOffset mandatory
❌ int/string PK                   → Guid (UUID) mandatory
❌ [Column("created_at")] attr     → ApplySnakeCaseNaming() handles this automatically
❌ spinner for loading state       → react-loading-skeleton (skeleton screens)
❌ English UI text                 → all user-facing text in Spanish
❌ exposing error.message to user  → use ErrorPanel with generic message
❌ app.UseSwagger()                → already using Scalar, no change
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.1 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Data Architecture" (ClienteEntity), "Search Strategy" (client-side filter), "Frontend Architecture" (route structure, query keys), "API & Communication Patterns" (GET /api/v1/clientes), "Implementation Patterns & Consistency Rules"
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — E2E-C-01 through E2E-C-06, API-C-07, risk R1 (search), risk R9 (EmptyState), risk R11 (ErrorPanel)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md` — FR1–FR8
- UX spec: `_bmad-output/planning-artifacts/ux-design-specification.md` — "Search-first UX" principle, Direction F (280px left panel), real-time search < 150ms
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack, Backend Stack, Database Conventions, Backend Critical Rules
- Predecessor stories: `_bmad-output/implementation-artifacts/stories/1-1-project-initialization-repository-structure.md`, `_bmad-output/implementation-artifacts/stories/1-2-frontend-navigation-shell.md`, `_bmad-output/implementation-artifacts/stories/1-3-backend-database-foundation.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- E2E tests E2E-C-01 to C-04 required POST/DELETE endpoints for test data setup — added minimal CreateClienteCommand/Handler and DeleteAsync
- E2E-C-05: EmptyState description changed to avoid strict locator violation (2 elements matching regex)

### Completion Notes List

- All 6 E2E tests in clientes-list.spec.ts GREEN
- Both API tests in clientes-api.spec.ts GREEN
- 49 frontend unit tests GREEN (including 4 new: UNIT-C-FE-01 to FE-04)
- 2 backend unit tests GREEN (UNIT-B-01, UNIT-B-02)
- EF Core migration AddClienteEntity applied to siesa_agents_db
- POST/DELETE endpoints added to support E2E test data setup (prerequisite for Story 2.3)

### File List

**To create (frontend):**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts`
- `frontend/src/shared/components/__tests__/EmptyState.test.tsx`
- `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx`

**To create (backend):**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/tests/SiesaAgents.UnitTests/Handlers/GetClientesQueryHandlerTests.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` (auto-generated)

**To modify:**
- `frontend/src/routes/_app/clientes.tsx` — replace placeholder with `ClienteListPanel` two-panel layout
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — add `DbSet<ClienteEntity> Clientes`
- `backend/src/SiesaAgents.API/Program.cs` — register `IClienteRepository`, `GetClientesQueryHandler`, call `app.MapClienteEndpoints()`
