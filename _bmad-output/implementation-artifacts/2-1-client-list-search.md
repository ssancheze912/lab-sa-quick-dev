# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients with `nombre` and `nit` visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose `nombre` or `nit` (NIT/RUC) match the input (case-insensitive), **And** results appear in under 1 second for up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, **And** clicking "Reintentar" calls `refetch()` on the TanStack Query.

5. **Given** the client list loads successfully, **When** the user has not typed anything in the search field, **Then** all clients are shown sorted by default order "Más reciente" (creation date descending) — SortControl default is deferred to Story 2.6; this story must not break that default.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Add `ClienteEntity` to Domain layer (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with fields: `Id` (Guid), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
  - [ ] Use `private` constructor + static `Create()` factory pattern (company standard)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with `GetAll()` and `GetById()` signatures

- [ ] Task 2 — Backend: Add EF Core configuration and migration (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`
  - [ ] Configure unique index `uk_clientes_nit` on `Nit` field
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
  - [ ] Create EF Core migration `AddClienteEntity` — verifies table `clientes` with snake_case columns and `uk_clientes_nit` index
  - [ ] Run `dotnet ef database update` to apply migration

- [ ] Task 3 — Backend: Implement CQRS Query for GET /clientes (AC: #1, #2)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (record with optional `string? Search` parameter)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — returns `IEnumerable<ClienteDto>` from repository
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` with fields: `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt`, `UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository` using `AppDbContext`
  - [ ] Register repository and query handler in DI (`Program.cs`)

- [ ] Task 4 — Backend: Add GET /clientes endpoint (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Map `GET /api/v1/clientes` — dispatches `GetClientesQuery`, returns `200 OK` with direct JSON array
  - [ ] Optional: accept `?q=` query parameter for server-side search fallback (architecture doc specifies client-side filter is primary; backend endpoint MAY support `?q=` for future use — implement it per architecture contract)
  - [ ] Register endpoint group in `Program.cs`

- [ ] Task 5 — Frontend: Add domain types and repository interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`

- [ ] Task 6 — Frontend: Add Axios repository implementation (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` implementing `IClienteRepository`
  - [ ] Uses `apiClient` (Axios singleton from `frontend/src/shared/lib/apiClient.ts`)
  - [ ] `GET /api/v1/clientes` — returns `Cliente[]`

- [ ] Task 7 — Frontend: Add TanStack Query hook `useClientes` (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Query key: `['clientes']`
  - [ ] Exposes `{ data, isLoading, isError, refetch }`

- [ ] Task 8 — Frontend: Create `ClienteListPanel` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [ ] 280px fixed-width left panel, full-height scrollable list
  - [ ] Renders a search `<input>` at the top (controlled, Spanish placeholder: "Buscar por nombre o NIT/RUC…")
  - [ ] Client-side filter via `useMemo`: filters `data` array by `nombre` or `nit` containing the search string (case-insensitive, `toLowerCase()`)
  - [ ] Each item: renders `ClientListItem` showing `nombre` and `nit`
  - [ ] Loading state: use `react-loading-skeleton` skeleton placeholders (not a spinner) — render 5 skeleton rows while `isLoading === true`
  - [ ] Empty state: render `<EmptyState>` component when list is empty after loading
  - [ ] Error state: render `<ErrorPanel onRetry={refetch}>` when `isError === true`
  - [ ] Use Heroicons for any icons (e.g., search icon in the input)
  - [ ] All user-facing text in Spanish: "Buscar por nombre o NIT/RUC…", "No hay clientes registrados", "Crear el primer cliente", "Error al cargar los clientes", "Reintentar"
  - [ ] Check siesa-ui-kit catalog for `SearchInput`, `ListItem`, `EmptyState`, `ErrorPanel` equivalents BEFORE creating custom components

- [ ] Task 9 — Frontend: Create or reuse `EmptyState` shared component (AC: #3)
  - [ ] Check if `frontend/src/shared/components/EmptyState.tsx` already exists (from Story 1.2)
  - [ ] If not: create it — accepts `title: string`, `description?: string`, `action?: ReactNode` props
  - [ ] First check siesa-ui-kit for an equivalent EmptyState component

- [ ] Task 10 — Frontend: Create or reuse `ErrorPanel` shared component (AC: #4)
  - [ ] Check if `frontend/src/shared/components/ErrorPanel.tsx` already exists
  - [ ] If not: create it — accepts `message?: string`, `onRetry?: () => void` props
  - [ ] "Reintentar" button calls `onRetry` when clicked
  - [ ] First check siesa-ui-kit for an equivalent component

- [ ] Task 11 — Frontend: Create `ClientListItem` shared component (AC: #1)
  - [ ] Check if `frontend/src/shared/components/ClientListItem.tsx` already exists
  - [ ] If not: create it — accepts `cliente: Cliente`, renders `nombre` (bold) and `nit` (muted text), full-width clickable area
  - [ ] First check siesa-ui-kit for an equivalent list-item component

- [ ] Task 12 — Frontend: Wire `ClienteListPanel` into the `/clientes` route (AC: #1)
  - [ ] Verify `frontend/src/routes/_app/clientes.tsx` exists (created in Story 1.2 or equivalent)
  - [ ] If not: create the route file with the split-panel layout (left: `ClienteListPanel` at 280px, right: placeholder / empty state panel)
  - [ ] Route must be accessible at `/clientes`
  - [ ] Ensure TanStack Router file-based routing is used (no manual route registration)

- [ ] Task 13 — Frontend: Write Vitest unit tests (AC: #1, #2, #3, #4)
  - [ ] `frontend/src/modules/crm/clientes/application/useClientes.test.ts` — mock `clienteApiRepository`, assert query key `['clientes']`
  - [ ] `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`:
    - TC-E2-P1-05: Filter renders within 1000ms with 500 mock records
    - TC-E2-P1-06: Empty state displayed when MSW returns `[]`
    - TC-E2-P1-07: ErrorPanel with "Reintentar" shown on MSW 500 → retry → success shows list
  - [ ] Use MSW 2+ for API mocking, `@testing-library/react`, `@testing-library/jest-dom`

- [ ] Task 14 — Backend: Write xUnit unit + integration tests (AC: #1, #4)
  - [ ] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — mock repository, assert DTO mapping
  - [ ] `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - TC-E2-P1-01: `GET /api/v1/clientes` returns 200 with array, each item has all fields, `createdAt` is ISO 8601 UTC offset
    - TC-E2-P2-07: `GET /api/v1/clientes?q=Alpha` filters by name; `?q=111` filters by NIT (if server-side search is implemented)

## Dev Notes

### Architecture Patterns

This story implements the **read-only half of the Clientes CRUD** (list + search). It touches all four Clean Architecture layers on the frontend and backend. No mutations are introduced — those belong to Stories 2.3–2.5.

**Data flow (frontend):**
```
Route _app/clientes.tsx
  └── ClienteListPanel
        └── useClientes (TanStack Query ['clientes'])
              └── clienteApiRepository.getAll()
                    └── Axios GET /api/v1/clientes
                          └── Backend API
```

**Data flow (backend):**
```
GET /api/v1/clientes
  └── ClienteEndpoints.MapGet (Minimal API)
        └── GetClientesQueryHandler
              └── ClienteRepository.GetAll()
                    └── AppDbContext.Clientes (EF Core 10)
                          └── PostgreSQL clientes table
```

**Search strategy (per architecture.md):**
- Client-side filtering via `useMemo` over TanStack Query cached array
- Filter condition: `nombre.toLowerCase().includes(q)` OR `nit.toLowerCase().includes(q)`
- Target: < 50ms for 500 records — well within the NFR1 1-second budget
- No additional API call when the search input changes (NFR1 + architecture mandate)
- Backend endpoint MAY accept `?q=` for future use but frontend ignores it in MVP

### Tech Stack & Libraries

| Layer | Library | Version | Purpose |
|-------|---------|---------|---------|
| Frontend | React | 18+ | UI components |
| Frontend | TypeScript | 5+ (strict) | No `any` |
| Frontend | TanStack Query | 5+ | Server state — `useQuery(['clientes'])` |
| Frontend | TanStack Router | 1+ | File-based routing `/clientes` route |
| Frontend | Axios | latest | HTTP client (via `apiClient.ts` singleton) |
| Frontend | react-loading-skeleton | latest | Skeleton loading placeholders (not spinners) |
| Frontend | Heroicons | latest | Search icon in input, empty state icon |
| Frontend | siesa-ui-kit | latest | Check for SearchInput, ListItem, EmptyState, ErrorPanel FIRST |
| Frontend | TailwindCSS | v4 | Styling (slate-* for neutrals, `#0e79fd` for primary) |
| Frontend | Vitest + RTL + MSW | latest | Tests |
| Backend | .NET | 10 | Framework |
| Backend | C# Minimal API | - | `GET /api/v1/clientes` endpoint |
| Backend | EF Core 10 | - | `ClienteEntity` → `clientes` table via `AppDbContext` |
| Backend | EF Core NamingConventions | latest | `UseSnakeCaseNamingConvention()` (already applied in `AppDbContext`) |
| Backend | Npgsql | 10.x | PostgreSQL provider |
| Backend | xUnit | 2+ | Tests |

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory per company standards and architecture.md)
- **Install**: `npm install siesa-ui-kit` (ensure dependency present in `frontend/package.json`)
- **Usage**: Check siesa-ui-kit catalog for `SearchInput`, `ListItem`, `EmptyState`, `ErrorPanel` BEFORE creating any custom component. Do NOT create a custom component if a kit equivalent exists.
- **Constraint**: Do not override or wrap kit components unless strictly required by the story's specific UX requirements.

### Critical Implementation Constraints

1. **UUID Primary Keys** (mandatory): `ClienteEntity.Id` must be `Guid` with `Guid.NewGuid()` default — NEVER `int` or sequential ID.
2. **DateTimeOffset** (mandatory): `CreatedAt` and `UpdatedAt` on `ClienteEntity` must use `DateTimeOffset.UtcNow` — NEVER `DateTime`.
3. **snake_case naming**: `UseSnakeCaseNamingConvention()` is already the last call in `AppDbContext.OnModelCreating` (from Story 1.3). Do NOT add `[Column]` or `[Table]` attributes — rely on the convention.
4. **`uk_clientes_nit` unique index** MUST be created in the EF Core migration `ClienteConfiguration.cs`. This is required for R-001, R-009 test cases (TC-E2-P0-01, TC-E2-P2-03).
5. **API response shape**: `GET /api/v1/clientes` returns a direct JSON array (no wrapper object). Each element is a `ClienteDto` with camelCase fields (auto-serialized by .NET).
6. **No Swagger**: `Program.cs` already registers Scalar. NEVER add `app.UseSwagger()`.
7. **Error handling**: `ExceptionHandlingMiddleware` is already configured (Story 1.3). Any unhandled exception → Problem Details RFC 7807. Do NOT add custom error handling outside that middleware.
8. **All user-facing text in Spanish**: labels, placeholders, error messages, empty state text — no English strings in the UI.
9. **Skeleton, not spinner**: Loading state MUST use `react-loading-skeleton` skeleton rows — not `<Spinner>` or `loading...` text.
10. **TanStack Query key**: `['clientes']` — exactly this array key. No string keys (`"clientes"` is an anti-pattern per architecture enforcement guidelines).

### `ClienteEntity` Reference Implementation

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

    private ClienteEntity() { } // Required by EF Core

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
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
```

### `ClienteConfiguration` Reference Implementation

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
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        // uk_clientes_nit — MANDATORY (prevents duplicate NIT, required by TC-E2-P0-01, TC-E2-P2-03)
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

### `GET /api/v1/clientes` Endpoint Reference

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (string? q, IGetClientesQueryHandler handler) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(q));
            return Results.Ok(result);
        });

        return app;
    }
}
```

### `useClientes` Hook Reference

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  });
}
```

### `ClienteListPanel` Filter Reference

```typescript
// Filtering pattern in ClienteListPanel.tsx (key part)
const filtered = useMemo(() => {
  if (!search.trim()) return data ?? [];
  const q = search.toLowerCase();
  return (data ?? []).filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}, [data, search]);
```

### Project Structure Notes

Files to create or modify in this story:

```
backend/
  src/
    SiesaAgents.Domain/
      Clientes/
        Entities/
          ClienteEntity.cs                     ← CREATE
        Interfaces/
          IClienteRepository.cs                ← CREATE
    SiesaAgents.Application/
      Clientes/
        Queries/
          GetClientesQuery.cs                  ← CREATE
          GetClientesQueryHandler.cs           ← CREATE (+ interface)
        DTOs/
          ClienteDto.cs                        ← CREATE
    SiesaAgents.Infrastructure/
      Data/
        AppDbContext.cs                        ← MODIFY: add DbSet<ClienteEntity>
        Configurations/
          ClienteConfiguration.cs             ← CREATE
      Migrations/
        <timestamp>_AddClienteEntity.cs       ← GENERATE via dotnet ef
      Repositories/
        ClienteRepository.cs                  ← CREATE
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs                   ← CREATE
      Program.cs                              ← MODIFY: register endpoint group + DI
  tests/
    SiesaAgents.UnitTests/
      Application/
        Clientes/
          GetClientesQueryHandlerTests.cs     ← CREATE
    SiesaAgents.IntegrationTests/
      ClienteEndpointsTests.cs               ← CREATE (GET list + filter variants)

frontend/
  src/
    modules/
      crm/
        clientes/
          domain/
            Cliente.ts                        ← CREATE
            IClienteRepository.ts             ← CREATE
          application/
            useClientes.ts                    ← CREATE
            useClientes.test.ts               ← CREATE
          infrastructure/
            clienteApiRepository.ts           ← CREATE
          presentation/
            ClienteListPanel.tsx              ← CREATE
            ClienteListPanel.test.tsx         ← CREATE
    shared/
      components/
        EmptyState.tsx                        ← CREATE if not exists
        ErrorPanel.tsx                        ← CREATE if not exists
        ClientListItem.tsx                    ← CREATE if not exists
    routes/
      _app/
        clientes.tsx                          ← CREATE if not exists (split-panel layout)
```

- `SiesaAgents.Domain` and `SiesaAgents.Application` must NOT reference `SiesaAgents.Infrastructure` (Clean Architecture dependency rule).
- `ContactoEntity` is NOT touched in this story — it belongs to Epic 3.

### Testing Standards

**Frontend (Vitest + RTL + MSW):**
- Co-locate test files alongside source: `useClientes.test.ts` next to `useClientes.ts`
- All component tests must render in isolation (no global router state unless TanStack Router test wrapper is used)
- MSW 2+ server setup in a shared `src/shared/lib/test-utils/mswServer.ts`
- Accessibility check: use `@axe-core/react` or jest-axe on `ClienteListPanel` (WCAG 2.1 AA)
- Reference test cases: TC-E2-P1-05 (filter performance), TC-E2-P1-06 (empty state), TC-E2-P1-07 (error + retry)

**Backend (xUnit):**
- Unit tests: `GetClientesQueryHandlerTests.cs` — mock `IClienteRepository`, assert DTO fields match entity values, assert `CreatedAt` is `DateTimeOffset`
- Integration tests: `WebApplicationFactory<Program>` in-process testing; `TestContainers` (PostgreSQL) for data integrity tests
- Test structure: Arrange / Act / Assert strictly
- Coverage target: > 80% for new application and domain code

### Previous Story Learnings (from Story 1.2 and 1.3)

- Story 1.2 code review failed because siesa-ui-kit `NavigationRail`/`NavigationBar` were NOT used (custom nav built instead). **This story MUST check siesa-ui-kit for every UI component before building custom ones.**
- Story 1.2 had 20/25 Vitest tests failing because RTL `render` was not called. Ensure all component tests have `render(...)` in the Arrange phase.
- Story 1.3 confirmed: `AppDbContext` uses `UseSnakeCaseNamingConvention()` as the last call in `OnModelCreating`. Do not change this order when adding `ClienteConfiguration`.
- Story 1.3 used preview packages (`EF Core 10.0.0-preview.5`, `Npgsql 10.0.0-preview.1`). Use the same versions for consistency; check `SiesaAgents.Infrastructure.csproj` for the exact versions before adding packages.
- Story 1.3 noted: `dotnet ef database update` must be run locally by developer with a running PostgreSQL instance — migrations cannot be auto-applied in the CI environment.

### Git History Context

Recent commits show:
- `feat: add TEA test design for Epic 2` — test design document is available at `_bmad-output/implementation-artifacts/test-design-epic-2.md`
- Story 1.3 (backend foundation) is in `review` status — `AppDbContext`, `ExceptionHandlingMiddleware`, and EF Core migrations baseline are implemented
- No prior client entities exist — this story introduces `ClienteEntity` and `clientes` table for the first time

### References

- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Data Architecture", "Frontend Architecture", "API & Communication Patterns", "Implementation Patterns & Consistency Rules", "Enforcement Guidelines"
- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.1 section
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — TC-E2-P1-01, TC-E2-P1-05, TC-E2-P1-06, TC-E2-P1-07, TC-E2-P2-07
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — "Frontend Stack", "Backend Stack", "Database Conventions", "Backend Critical Rules"
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — MasterCrud is NOT applicable to this story (this is a custom split-panel list view, not a tabular CRUD grid orchestrator). The architecture spec defines `ClienteListPanel` as a custom 280px left-panel component.
- UX design: `_bmad-output/planning-artifacts/ux-design-specification.md` — "Search-first UX", "Effortless Interactions", "Core User Experience"
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md` — FR1–FR8

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
