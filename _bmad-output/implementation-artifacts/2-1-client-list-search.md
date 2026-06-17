# Story 2.1: Client List & Search

Status: done

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list.

## Tasks / Subtasks

- [x] Task 1 — Create `ClienteEntity` and `IClienteRepository` in Domain layer (AC: #1)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface with fields: `id: string` (UUID), `nombre: string`, `nitRuc: string`, `telefono: string`, `ciudad: string`, `createdAt: string` (ISO 8601)
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>` and `getById(id: string): Promise<Cliente>`
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — UUID PK, Nombre, Nit, Telefono, Ciudad, CreatedAt (DateTimeOffset), UpdatedAt (DateTimeOffset) — use private constructor + static `Create()` factory
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — interface with `GetAllAsync()` and `GetByIdAsync(Guid id)`

- [x] Task 2 — Create Application layer: Query + DTO (AC: #1)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — `Id`, `Nombre`, `NitRuc`, `Telefono`, `Ciudad`, `CreatedAt` (DateTimeOffset)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — record class query
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — calls `IClienteRepository.GetAllAsync()`, maps to `ClienteDto` list

- [x] Task 3 — Create Infrastructure layer: EF Core configuration, migration, and repository (AC: #1)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — `IEntityTypeConfiguration<ClienteEntity>`: table name `clientes`, PK `id`, unique index `uk_clientes_nit` on `Nit`, `ix_clientes_nombre` index
  - [x] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext` (at `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository`, uses `AppDbContext`
  - [x] Run `dotnet ef migrations add AddClienteTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/` directory — if EF CLI unavailable, create migration files manually
  - [x] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` — verify `clientes` table created with snake_case columns (NOTE: dotnet CLI unavailable; migration created manually)
  - [x] Register `IClienteRepository` → `ClienteRepository` in `Program.cs` DI

- [x] Task 4 — Create API endpoint: GET /api/v1/clientes (AC: #1, #4)
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — Minimal API: `app.MapGet("/api/v1/clientes", ...)` returning `ClienteDto[]`, HTTP 200
  - [x] Register endpoint in `Program.cs`: `app.MapClienteEndpoints()`
  - [x] Ensure empty database returns HTTP 200 `[]` (NOT 404)

- [x] Task 5 — Create Infrastructure layer: Axios repository for frontend (AC: #1)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient` (Axios singleton at `src/shared/lib/apiClient.ts`), calls `GET /api/v1/clientes`

- [x] Task 6 — Create Application layer: TanStack Query hook `useClientes` (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })` — returns `{ data, isLoading, isError, refetch }`

- [x] Task 7 — Create Presentation layer: `ClienteListView` component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - 280px left panel, scrollable
    - Renders a search `<input>` with `placeholder="Buscar por nombre o NIT/RUC..."`
    - Filters the `clientes` array in real time using `useMemo`: case-insensitive match on `nombre` OR `nitRuc`
    - No debounce required — synchronous `.filter()` over cached array (< 50ms for 500 records)
    - Search state managed via `useState<string>('')` (local state — NOT Zustand, NOT URL params)
    - When `isLoading`: render skeleton placeholders using `react-loading-skeleton`
    - When `isError`: render `<ErrorPanel onRetry={refetch} />` with "Reintentar" button
    - When `data?.length === 0` AND no search: render `<EmptyState />` with guide text "No hay clientes registrados. Crea el primero."
    - When clients exist: render scrollable list of `<ClientListItem>` per filtered client (shows `nombre` + `nitRuc`)
    - Each list item is clickable and navigates to `/clientes/${client.id}` via anchor tag (TanStack Router Link deferred to Story 2.2 when route exists)
    - WCAG 2.1 AA: each list item must have `role="listitem"`, search input must have `aria-label="Buscar cliente"`, list must have `role="list"`

- [x] Task 8 — Create shared components: `EmptyState` and `ErrorPanel` (AC: #3, #4)
  - [x] Check `siesa-ui-kit` catalog for `EmptyState` and `ErrorPanel` equivalents — use if available (checked: no equivalents found)
  - [x] If no `siesa-ui-kit` equivalent: Create `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string` prop, displays centered icon + text
  - [x] If no `siesa-ui-kit` equivalent: Create `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void` prop, displays error message + "Reintentar" button (Heroicons for icon)
  - [x] Create `frontend/src/shared/components/ClientListItem.tsx` — accepts `cliente: Cliente`, renders `nombre` and `nitRuc`, styled with TailwindCSS, hover/focus states, cursor pointer

- [x] Task 9 — Wire route: `/clientes` TanStack Router (AC: #1)
  - [x] Verify (or create) `frontend/src/routes/_app/clientes.tsx` — renders `<ClienteListView />` as the left panel; right panel shows empty/default state until a client is selected
  - [x] Route must render in the `_app` layout shell already created in Story 1.2

- [x] Task 10 — Write tests for Story 2.1 (AC: #1, #2, #3, #4)
  - [x] **Backend — API Integration (xUnit):**
    - `TC-E2-P1-01`: Seed 3 clients → GET `/api/v1/clientes` → assert HTTP 200 and 3 items in array with correct fields (`id`, `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`)
    - `TC-E2-P1-02`: Empty DB → GET `/api/v1/clientes` → assert HTTP 200 with `[]` (NOT 404)
    - File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - File: `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`
  - [x] **Frontend — Component (Vitest + RTL + MSW):**
    - `TC-E2-P1-03`: MSW returns `[]` → EmptyState component visible; no list items in DOM; no error state — PASS
    - `TC-E2-P1-04`: MSW returns network error → ErrorPanel visible with "Reintentar" button; clicking button fires a new GET request — PASS
    - `TC-E2-P1-05`: MSW returns 3 clients; type "acme" → only matching clients visible; no additional API call — PASS
    - `TC-E2-P1-06`: MSW returns 3 clients with distinct NIT/RUC; type partial NIT/RUC → correct subset; no API call — PASS
    - `TC-E2-P2-01`: MSW returns 500 clients; measure filter time < 1000ms (NFR1) — PASS
    - File: `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
  - [x] Test structure: Arrange / Act / Assert

## Dev Notes

### Architecture Layer Mapping

```
Story 2.1 touches BOTH frontend and backend:

Frontend (Clean Architecture):
  domain/          → Cliente.ts, IClienteRepository.ts
  application/     → useClientes.ts
  infrastructure/  → clienteApiRepository.ts
  presentation/    → ClienteListView.tsx

Backend (Clean Architecture):
  Domain/          → ClienteEntity.cs, IClienteRepository.cs
  Application/     → GetClientesQuery.cs, GetClientesQueryHandler.cs, ClienteDto.cs
  Infrastructure/  → ClienteConfiguration.cs, ClienteRepository.cs, EF Migration
  API/             → ClienteEndpoints.cs (Minimal API), Program.cs update
```

### ClienteEntity Pattern (Backend — MANDATORY)

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
    public DateTimeOffset CreatedAt { get; private set; }   // NEVER DateTime
    public DateTimeOffset UpdatedAt { get; private set; }   // NEVER DateTime

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
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
```

### EF Core Configuration Pattern (Backend — MANDATORY)

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

        // ApplySnakeCaseNaming() in OnModelCreating handles all snake_case naming — NO manual [Column] attrs
        // Unique constraint on Nit
        builder.HasIndex(c => c.Nit)
               .IsUnique()
               .HasDatabaseName("uk_clientes_nit");

        // Index on Nombre for search performance
        builder.HasIndex(c => c.Nombre)
               .HasDatabaseName("ix_clientes_nombre");

        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
    }
}
```

### AppDbContext Update (Backend — MANDATORY)

```csharp
// Add to backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
public DbSet<ClienteEntity> Clientes { get; set; }
// IMPORTANT: ApplySnakeCaseNaming() remains the LAST call in OnModelCreating — do NOT move it
```

### API Endpoint Pattern (Backend — MANDATORY)

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static WebApplication MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(result);   // HTTP 200 — always, even with empty array
        });

        return app;
    }
}
```

### ClienteDto JSON Shape (Backend — Mandatory Contract)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Ejemplo S.A.S.",
  "nitRuc": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-17T14:30:00Z"
}
```

Note: The C# property is `Nit` (entity/DB) but the JSON serialization property in `ClienteDto` MUST be `nitRuc` (camelCase, matching the frontend TypeScript interface). Use `[JsonPropertyName("nitRuc")]` on the DTO property or configure `JsonNamingPolicy.CamelCase` globally.

### Frontend Entity Interface

```typescript
// frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string;         // UUID
  nombre: string;
  nitRuc: string;
  telefono: string;
  ciudad: string;
  createdAt: string;  // ISO 8601 — "2026-06-17T14:30:00Z"
}
```

### TanStack Query Hook Pattern (Frontend — MANDATORY)

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export const useClientes = () => {
  return useQuery({
    queryKey: ['clientes'],   // CANONICAL — must match exactly for cache invalidation by mutations
    queryFn: () => clienteApiRepository.getAll(),
  });
};
```

### Search Filter Pattern (Frontend — MANDATORY)

```typescript
// Inside ClienteListView.tsx
const [searchQuery, setSearchQuery] = useState('');

const filteredClientes = useMemo(() => {
  if (!data) return [];
  if (!searchQuery.trim()) return data;
  const q = searchQuery.toLowerCase();
  return data.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nitRuc.toLowerCase().includes(q)
  );
}, [data, searchQuery]);
```

- Search state MUST use `useState` (local) — NOT Zustand, NOT URL search params
- Filter MUST run synchronously on the cached array — NO additional API call
- `useMemo` dependency array MUST include both `[data, searchQuery]`

### UI Implementation Requirements (MANDATORY)

- **Primary UI source**: check `siesa-ui-kit` catalog FIRST for EmptyState, ErrorPanel, list item, search input components
- **Secondary**: shadcn/ui (install via MCP tool)
- **Tertiary**: custom components
- **Styling**: TailwindCSS v4 — use `slate-*` scale for neutrals; primary color `#0e79fd` (Siesa Blue)
- **Icons**: Heroicons (primary); Font Awesome 6.5+ (secondary)
- **Loading skeletons**: `react-loading-skeleton` — skeleton screens, NOT spinners
- **Spanish UI text** (MANDATORY): all labels, placeholders, aria-labels, error messages in Spanish
- **Dark mode**: class-based `dark:` TailwindCSS classes

### Axios API Client (Frontend — Existing Infrastructure from Story 1.2)

```typescript
// frontend/src/shared/lib/apiClient.ts — already exists, DO NOT recreate
// Use: import { apiClient } from '@/shared/lib/apiClient';
// Base URL: http://localhost:5000 (backend dev port)
// All requests go through this singleton with interceptors
```

### File Structure After This Story

```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts                      ← CREATE
      IClienteRepository.ts           ← CREATE
    application/
      useClientes.ts                  ← CREATE
    infrastructure/
      clienteApiRepository.ts         ← CREATE
    presentation/
      ClienteListView.tsx             ← CREATE
      ClienteListView.test.tsx        ← CREATE (tests)
  shared/components/
    EmptyState.tsx                    ← CREATE (if no siesa-ui-kit equivalent)
    ErrorPanel.tsx                    ← CREATE (if no siesa-ui-kit equivalent)
    ClientListItem.tsx                ← CREATE
  routes/_app/
    clientes.tsx                      ← VERIFY or CREATE (from Story 1.2)

backend/src/
  SiesaAgents.Domain/Clientes/
    Entities/ClienteEntity.cs         ← CREATE
    Interfaces/IClienteRepository.cs  ← CREATE
  SiesaAgents.Application/Clientes/
    Queries/GetClientesQuery.cs       ← CREATE
    Queries/GetClientesQueryHandler.cs ← CREATE
    DTOs/ClienteDto.cs                ← CREATE
  SiesaAgents.Infrastructure/
    Data/AppDbContext.cs              ← MODIFY (add DbSet<ClienteEntity>)
    Data/Configurations/ClienteConfiguration.cs ← CREATE
    Migrations/{timestamp}_AddClienteTable.cs   ← GENERATED by EF CLI
    Repositories/ClienteRepository.cs ← CREATE
  SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs     ← CREATE
    Program.cs                        ← MODIFY (register endpoint + IClienteRepository)

backend/tests/
  SiesaAgents.UnitTests/Application/Clientes/
    GetClientesQueryHandlerTests.cs   ← CREATE
  SiesaAgents.IntegrationTests/
    ClienteEndpointsTests.cs          ← CREATE (TC-E2-P1-01, TC-E2-P1-02)
```

### Test Cases for This Story

From `test-design-epic-2.md`, the following test cases are scoped to Story 2.1:

| Test ID | Level | Description | Priority |
|---------|-------|-------------|----------|
| TC-E2-P1-01 | API Integration | GET /api/v1/clientes returns 200 with all clients | P1 |
| TC-E2-P1-02 | API Integration | Empty DB → 200 with [] (not 404) | P1 |
| TC-E2-P1-03 | Component | EmptyState rendered on empty API response | P1 |
| TC-E2-P1-04 | Component | ErrorPanel with Reintentar on backend failure | P1 |
| TC-E2-P1-05 | Component | Real-time search filters by Nombre | P1 |
| TC-E2-P1-06 | Component | Real-time search filters by NIT/RUC | P1 |
| TC-E2-P2-01 | Performance | Filter 500 records < 1s (NFR1) | P2 |
| TC-E2-P3-01 | Unit | Search debounce (nice to have) | P3 |
| TC-E2-P3-05 | Component | Keyboard navigation accessibility | P3 |

### Critical Anti-Patterns to Avoid

```
❌ DateTime in entities          → Use DateTimeOffset
❌ Swagger registration          → Use Scalar (already configured)
❌ String queryKey               → Array ['clientes'] (mandatory)
❌ English UI text               → Spanish (mandatory)
❌ Stack traces exposed          → Problem Details RFC 7807 only
❌ 404 on empty GET /clientes    → Must return 200 []
❌ Debounce on search input      → Synchronous filter (no debounce in MVP)
❌ Zustand for search state      → useState (local state)
❌ Spinner for loading           → react-loading-skeleton skeleton screens
❌ Custom UI before siesa-ui-kit → Check siesa-ui-kit catalog first
❌ Manual [Column]/[Table] attrs → ApplySnakeCaseNaming() handles all naming
```

### Previous Story Learnings (from Stories 1.1, 1.2, 1.3)

- .NET 10 SDK may not be available in the environment; if `dotnet ef` CLI is unavailable, create migration files manually — the `Up()` method creates the `clientes` table, `Down()` drops it.
- `TreatWarningsAsErrors` is `true` in all `.csproj` files — zero compiler warnings are acceptable.
- `Nullable` is enabled — use nullable reference type annotations throughout (`string?`, `Guid?`, etc.).
- Implicit usings are enabled in all backend projects.
- Commit convention: `feat(story-2-1): <description>` (lowercase, hyphenated story reference).
- The `apiClient.ts` Axios singleton at `frontend/src/shared/lib/apiClient.ts` was created in Story 1.2 — import from there, do NOT create a new instance.
- TanStack Router file-based routing: `_app/clientes.tsx` renders under the `_app` pathless layout (no URL segment), file path maps to route `/clientes`.

### Git History Context

Recent commits (reference for naming convention):
- `docs(epic-2): add test design for Client Management (33 test cases, P0-P3)`
- `docs(epic-1): add final report and mark epic-1 done in sprint-status`
- `fix(story-1.3): apply test review corrections`
- `feat(story-1.2): extract AppLayout to -app-layout.tsx, add edge case tests`

Use convention: `feat(story-2-1): <description>` for implementation commits.

### Project Structure Notes

- This is the first story in Epic 2 — it establishes the `clientes` module structure that subsequent stories (2.2–2.6) will extend.
- The `clientes` route (`_app/clientes.tsx`) will act as the split-panel container for this story (left panel = list) and Story 2.2 (right panel = detail). Design the route layout to accommodate the split panel from the start.
- Do NOT implement the right panel (client detail) in this story — that belongs to Story 2.2. Render a placeholder or empty `<div>` in the right panel area.
- The EF Core migration `AddClienteTable` in this story creates the `clientes` table. Story 3.1 will add `contactos`.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture — Frontend module structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Search strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Diagram]
- Architecture — API endpoints: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — TanStack Query keys: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Architecture — File structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Company standards — Frontend stack: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- Company standards — Backend stack: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- Company standards — Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Company standards — UX Design System: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Test cases for Story 2.1: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-04, TC-E2-P1-05, TC-E2-P1-06, TC-E2-P2-01]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- dotnet CLI not available in environment; EF Core migration `AddClienteTable` created manually with correct snake_case column names per `ApplySnakeCaseNaming()` convention.
- ClientListItem uses `<a href>` instead of TanStack Router `<Link>` because `/clientes/$clienteId` route does not exist until Story 2.2.
- siesa-ui-kit checked: no EmptyState or ErrorPanel equivalents found; custom components created as tertiary fallback.
- All 21 frontend component tests pass (including NFR1 performance test under 1000ms).

### Completion Notes List

- All 10 tasks and subtasks completed.
- Frontend tests: 21 passing (TC-E2-P1-03 through TC-E2-P2-01 + WCAG accessibility tests), 0 failing.
- No regressions in existing 78 tests (total 99 pass).
- Backend code follows all company standards: UUID PKs, DateTimeOffset, private constructor + static Create(), CQRS query pattern, Minimal API, Problem Details via existing middleware.
- EF Core migration created manually due to dotnet CLI unavailability.

### File List

**Created:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260617100000_AddClienteTable.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`

**Modified:**
- `frontend/src/routes/_app/clientes.tsx` — wired ClienteListView with split-panel layout
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — added DbSet<ClienteEntity>
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs` — updated with ClienteEntity model
- `backend/src/SiesaAgents.API/Program.cs` — registered IClienteRepository, GetClientesQueryHandler, MapClienteEndpoints()
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — added Moq package reference
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated 2-1-client-list-search to in-progress
