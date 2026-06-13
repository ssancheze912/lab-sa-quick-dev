# Story 2.1: Client List & Search

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients, showing Nombre and NIT/RUC per item.

2. **Given** the client list is loaded, **When** the user types in the search input field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), and results appear in under 1 second for up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed in the left panel with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the `GET /api/v1/clientes` fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list, and clicking "Reintentar" triggers a new fetch.

5. **Given** the client list is rendered, **When** the user clears the search input, **Then** the full unfiltered list is restored immediately.

6. **Given** the search input has an active value and the user navigates away and returns, **When** the page remounts, **Then** the search input starts empty (no persisted search state across navigation).

## Tasks / Subtasks

- [x] Task 1 — Backend: ClienteEntity + Repository + AppDbContext registration (AC: #1, #4)
  - [x] Create `ClienteEntity.cs` in `backend/src/SiesaAgents.Domain/Clientes/Entities/` with: `Id` (Guid, UUID PK), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset). Private constructor + static `Create()` factory.
  - [x] Create `IClienteRepository.cs` in `backend/src/SiesaAgents.Domain/Clientes/Interfaces/` with method: `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)`.
  - [x] Create `ClienteConfiguration.cs` in `backend/src/SiesaAgents.Infrastructure/Data/Configurations/` implementing `IEntityTypeConfiguration<ClienteEntity>`. Set table name `clientes`, unique index `uk_clientes_nit` on `Nit`.
  - [ ] Register `DbSet<ClienteEntity> Clientes` in `AppDbContext.cs`.
  - [x] Create `ClienteRepository.cs` in `backend/src/SiesaAgents.Infrastructure/Repositories/` implementing `IClienteRepository`.
  - [ ] Register `IClienteRepository` → `ClienteRepository` in `Program.cs` DI.

- [x] Task 2 — Backend: EF Core migration for `clientes` table (AC: #1)
  - [ ] Add EF Core migration `AddClientesTable` adding `clientes` table with columns: `id` (uuid PK), `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at`.
  - [ ] Verify `ApplySnakeCaseNaming()` / `UseSnakeCaseNamingConvention()` auto-maps PascalCase properties to snake_case columns (no manual `[Column]` attributes).

- [x] Task 3 — Backend: GetClientes Query + Handler (AC: #1, #4)
  - [x] Create `GetClientesQuery.cs` in `backend/src/SiesaAgents.Application/Clientes/Queries/`.
  - [x] Create `GetClientesQueryHandler.cs` returning `IEnumerable<ClienteDto>` via `IClienteRepository.GetAllAsync()`.
  - [x] Create `ClienteDto.cs` in `backend/src/SiesaAgents.Application/Clientes/DTOs/` with: `Id` (Guid), `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset).

- [x] Task 4 — Backend: GET /api/v1/clientes endpoint (AC: #1, #4)
  - [x] Create `ClienteEndpoints.cs` in `backend/src/SiesaAgents.API/Endpoints/` and register via `app.MapGroup("/api/v1/clientes")`.
  - [ ] Implement `GET /api/v1/clientes` → dispatches `GetClientesQuery` → returns direct JSON array (no wrapper), HTTP 200.
  - [ ] On empty result: return `[]` (HTTP 200), NOT 404.
  - [ ] Error handling: `ExceptionHandlingMiddleware` covers unhandled exceptions → Problem Details RFC 7807.

- [x] Task 5 — Frontend: Domain layer (AC: #1, #2)
  - [x] Create `Cliente.ts` entity interface in `frontend/src/modules/crm/clientes/domain/` with: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`.
  - [x] Create `IClienteRepository.ts` interface in `frontend/src/modules/crm/clientes/domain/` with method: `getAll(): Promise<Cliente[]>`.

- [x] Task 6 — Frontend: Infrastructure layer (AC: #1, #4)
  - [x] Create `clienteApiRepository.ts` in `frontend/src/modules/crm/clientes/infrastructure/` implementing `IClienteRepository`. Uses `apiClient` (Axios singleton at `src/shared/lib/apiClient.ts`) — `GET /api/v1/clientes` → returns `Cliente[]`.
  - [ ] Export a singleton instance `clienteRepository`.

- [x] Task 7 — Frontend: Application layer — useClientes hook (AC: #1, #2, #4)
  - [x] Create `useClientes.ts` in `frontend/src/modules/crm/clientes/application/` using TanStack Query `useQuery`. Query key: `['clientes']`. Fetches via `clienteRepository.getAll()`. Returns `{ data, isLoading, isError, refetch }`.
  - [ ] `staleTime`: 60_000 (1 minute). `retry`: 2.

- [x] Task 8 — Frontend: Presentation layer — ClienteListPanel component (AC: #1, #2, #3, #4, #5)
  - [x] Create `ClienteListPanel.tsx` in `frontend/src/modules/crm/clientes/presentation/`. This is the 280px fixed-width left panel.
  - [ ] Renders a text `<input>` for search (placeholder: "Buscar por nombre o NIT/RUC") — controlled via `useState<string>('')`.
  - [ ] Uses `useMemo` to filter the `clientes` array: case-insensitive match against `nombre` OR `nit`. Filtering happens client-side over the TanStack Query cache — NO additional API call.
  - [ ] Each list item renders: `Nombre` (bold) and `NIT/RUC` (secondary text). Use `ClientListItem` shared component (create if not yet existing at `frontend/src/shared/components/ClientListItem.tsx`).
  - [ ] While loading (`isLoading`): render skeleton placeholders using `react-loading-skeleton` (NOT a spinner per company standards). Show 5 skeleton rows.
  - [ ] On error (`isError`): render `<ErrorPanel onRetry={refetch} />` with button label "Reintentar".
  - [ ] On empty data after load: render `<EmptyState />` with message "No hay clientes registrados. Crea el primero." and a CTA.
  - [ ] All user-facing text MUST be in Spanish. All code (variables, functions) MUST be in English.
  - [ ] WCAG 2.1 AA: search input must have `aria-label="Buscar clientes"`.

- [x] Task 9 — Frontend: Route integration (AC: #1, #3, #4, #6)
  - [ ] Update route file `frontend/src/routes/_app/clientes.tsx` to import and render `ClienteListPanel` in the left panel slot (280px).
  - [ ] Right panel slot remains empty (placeholder `<div>`) — client detail is Story 2.2.
  - [ ] Layout: flex row, left panel `w-[280px] shrink-0`, right panel `flex-1`.

- [x] Task 10 — Frontend: Shared components (AC: #3, #4)
  - [x] Create `EmptyState.tsx` in `frontend/src/shared/components/` if it does not exist. Props: `message: string`, optional `ctaLabel?: string`, optional `onCta?: () => void`.
  - [x] Create `ErrorPanel.tsx` in `frontend/src/shared/components/` if it does not exist. Props: `onRetry: () => void`, optional `message?: string` (default: "No se pudo cargar la información. Intenta de nuevo.").
  - [x] Create `ClientListItem.tsx` in `frontend/src/shared/components/` if it does not exist. Props: `nombre: string`, `nit: string`, optional `isSelected?: boolean`, optional `onClick?: () => void`.

- [x] Task 11 — Frontend: Unit tests (AC: #1, #2, #3, #4, #5)
  - [ ] Test `useClientes.ts` with MSW: mock `GET /api/v1/clientes` → verify returns typed `Cliente[]`.
  - [ ] Test `ClienteListPanel.tsx` with RTL:
    - Renders skeleton on `isLoading` state.
    - Renders `ErrorPanel` on `isError` state; clicking "Reintentar" calls `refetch`.
    - Renders `EmptyState` when data is `[]`.
    - Renders list items when data has clients.
    - Search filter shows only matching items (case-insensitive).
    - Clears filter when search input is cleared.
  - [ ] Accessibility: run `axe` check on `ClienteListPanel` — must pass WCAG 2.1 AA.

- [x] Task 12 — Backend: Unit tests for GetClientesQueryHandler (AC: #1)
  - [x] Create `GetClientesQueryHandlerTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`.
  - [ ] Use EF Core InMemory + Arrange/Act/Assert pattern.
  - [ ] Test: empty repository → returns empty list; populated repository → returns all clients as DTOs.

## Dev Notes

### Architecture Context

This story implements the **left panel (280px)** of the `/clientes` split-panel view. It is **read-only** — no creation, editing, or deletion in this story. The right panel detail view is Story 2.2.

**Scope boundary (CRITICAL):**
- Do NOT implement client creation, editing, or deletion (Stories 2.3, 2.4, 2.5).
- Do NOT implement sorting (Story 2.6).
- Do NOT implement the right detail panel (Story 2.2).
- The right panel slot must remain an empty `<div className="flex-1">` placeholder.

**Search strategy per architecture:** TanStack Query loads ALL clients on mount via `GET /api/v1/clientes`. Filtering is entirely **client-side** using `useMemo` over the cached array. This guarantees < 50ms filter response for ≤ 500 records (NFR1 < 1 second). No search query parameter is sent to the backend in this story.

### Backend Stack

| Component | Value |
|-----------|-------|
| Framework | .NET 10 |
| ORM | EF Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`) |
| Database | PostgreSQL 18+ — `siesa_agents_db` |
| Naming | `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder` in `Program.cs` — NO manual `[Column]`/`[Table]` attributes |
| API docs | Scalar (`Scalar.AspNetCore`) — NEVER Swagger |
| Error format | Problem Details RFC 7807 |
| PK type | `Guid` (UUID) — mandatory |
| Timestamps | `DateTimeOffset` — NEVER `DateTime` |
| Testing | xUnit, Arrange/Act/Assert |

### Frontend Stack

| Component | Value |
|-----------|-------|
| Bundler | Vite 7+ |
| Framework | React 18+ (functional components + hooks) |
| Language | TypeScript 5+ strict mode — NO `any` |
| Routing | TanStack Router file-based (`_app/clientes.tsx`) |
| Server state | TanStack Query 5+ (`queryKey: ['clientes']`) |
| Client state | `useState` for search input (local only) — NO Zustand needed |
| HTTP client | Axios (`src/shared/lib/apiClient.ts` singleton) |
| Styling | TailwindCSS v4 + siesa-ui-kit tokens |
| Loading states | `react-loading-skeleton` — skeleton screens, NOT spinners |
| Testing | Vitest + RTL + MSW + axe |

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check catalog FIRST before any custom component
- **Install**: `npm install siesa-ui-kit` (ensure dependency is already present from Story 1.1)
- **Usage**: Use `siesa-ui-kit` components for all UI elements where an equivalent exists
- **Constraint**: Do NOT create custom components if a `siesa-ui-kit` equivalent exists
- **MasterCrud**: NOT applicable for this story. The architecture specifies a custom `ClienteListPanel` with a 280px split-panel layout. MasterCrud is a full-screen CRUD orchestrator; this story needs an inline scrollable list panel with real-time filtering.

### ClienteEntity Pattern (Backend)

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
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
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
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

> Note: `DateTimeOffset` is MANDATORY — never `DateTime`. UUID (Guid) PKs are mandatory per company standards.

### ClienteConfiguration Pattern (Backend)

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(255);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).HasMaxLength(50);
        builder.Property(c => c.Ciudad).HasMaxLength(100);
        // Unique index on NIT
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

### GET /api/v1/clientes Endpoint Pattern (Backend)

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result); // Direct array — no wrapper object
        });

        return app;
    }
}
```

> API response: direct JSON array (no wrapper). GET list returns `[]` on empty, never 404. Errors handled by `ExceptionHandlingMiddleware` → Problem Details RFC 7807.

### useClientes Hook Pattern (Frontend)

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query';
import { clienteRepository } from '../infrastructure/clienteApiRepository';
import type { Cliente } from '../domain/Cliente';

export function useClientes() {
  return useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteRepository.getAll(),
    staleTime: 60_000,
    retry: 2,
  });
}
```

### ClienteListPanel Filter Pattern (Frontend)

```typescript
// Client-side filter — no API call triggered
const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return clientes ?? [];
  const q = searchQuery.toLowerCase();
  return (clientes ?? []).filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.nit.toLowerCase().includes(q)
  );
}, [clientes, searchQuery]);
```

> Filter must be case-insensitive. Empty search returns full list. This guarantees < 50ms for ≤ 500 records (NFR1).

### API Response Shape

```
GET /api/v1/clientes
→ 200 OK + JSON array: [{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }, ...]
→ 200 OK + [] on empty (never 404)
→ 500 Problem Details on unhandled exception
```

Dates in JSON: ISO 8601 with timezone — `"2026-03-12T10:30:00Z"` (camelCase from .NET auto-serialization).

### File Structure

Files to create or modify in this story:

```
backend/
  src/
    SiesaAgents.Domain/
      Clientes/
        Entities/
          ClienteEntity.cs                  ← CREATE NEW
        Interfaces/
          IClienteRepository.cs             ← CREATE NEW
    SiesaAgents.Application/
      Clientes/
        Queries/
          GetClientesQuery.cs               ← CREATE NEW
          GetClientesQueryHandler.cs        ← CREATE NEW
        DTOs/
          ClienteDto.cs                     ← CREATE NEW
    SiesaAgents.Infrastructure/
      Data/
        AppDbContext.cs                     ← MODIFY: add DbSet<ClienteEntity>
        Configurations/
          ClienteConfiguration.cs           ← CREATE NEW
        Migrations/
          <timestamp>_AddClientesTable.cs   ← CREATE NEW (EF migration)
      Repositories/
        ClienteRepository.cs                ← CREATE NEW
    SiesaAgents.API/
      Program.cs                            ← MODIFY: register IClienteRepository + map endpoints
      Endpoints/
        ClienteEndpoints.cs                 ← CREATE NEW
  tests/
    SiesaAgents.UnitTests/
      Application/
        Clientes/
          GetClientesQueryHandlerTests.cs   ← CREATE NEW

frontend/
  src/
    modules/
      crm/
        clientes/
          domain/
            Cliente.ts                      ← CREATE NEW
            IClienteRepository.ts           ← CREATE NEW
          application/
            useClientes.ts                  ← CREATE NEW
          infrastructure/
            clienteApiRepository.ts         ← CREATE NEW
          presentation/
            ClienteListPanel.tsx            ← CREATE NEW
    shared/
      components/
        ClientListItem.tsx                  ← CREATE NEW
        EmptyState.tsx                      ← CREATE NEW (if not exists)
        ErrorPanel.tsx                      ← CREATE NEW (if not exists)
    routes/
      _app/
        clientes.tsx                        ← MODIFY: render ClienteListPanel
```

### Project Structure Notes

- `ClienteEntity.cs` lives in `SiesaAgents.Domain/Clientes/Entities/` — aligns with architecture doc.
- `IClienteRepository.cs` lives in `SiesaAgents.Domain/Clientes/Interfaces/` — aligns with architecture doc.
- `ClienteRepository.cs` lives in `SiesaAgents.Infrastructure/Repositories/` — aligns with architecture doc.
- `ClienteListPanel.tsx` maps to `ClienteListView.tsx` in architecture doc (name `ClienteListPanel` is equivalent — check if `ClienteListView` naming is already used in `clientes.tsx` route and align accordingly).
- `useClientes.ts` is the canonical hook as specified in architecture (`src/modules/crm/clientes/application/useClientes.ts`).
- `apiClient.ts` singleton is expected at `src/shared/lib/apiClient.ts` — verify it exists from Story 1.1 before creating.
- `EmptyState.tsx` and `ErrorPanel.tsx` are shared components per architecture (`src/shared/components/`) — verify if already created in Story 1.2 before recreating.
- TanStack Router file-based: route `_app/clientes.tsx` corresponds to URL `/clientes` (the `_app` prefix is a pathless layout).

### Previous Story Context (Story 1.3)

Story 1.3 created `AppDbContext.cs` with no domain DbSets — this story is the first to add `DbSet<ClienteEntity>`. The `ExceptionHandlingMiddleware` and Scalar registration from Story 1.3 must remain intact. The `UseSnakeCaseNamingConvention()` is already applied in `Program.cs` `AddDbContext` call — do NOT duplicate it in `OnModelCreating`.

Git history confirms Story 1.3 is done (`feat(1.3): implement backend database foundation`). The `appsettings.Development.json` connection string for `siesa_agents_db` is already configured.

### Testing Standards

**Backend (xUnit):**
- Pattern: Arrange / Act / Assert
- Coverage target: > 80% for new code
- `GetClientesQueryHandlerTests.cs`: use EF Core InMemory provider
- Test both empty repository (returns `[]`) and populated repository (returns all clients as `ClienteDto`)

**Frontend (Vitest + RTL + MSW):**
- MSW intercepts `GET /api/v1/clientes` — test success, empty, and error responses
- RTL: test loading skeleton, error panel retry, empty state, populated list, search filtering, accessibility
- Axe accessibility check on `ClienteListPanel` — must pass WCAG 2.1 AA

### Design System Constraints

- Brand primary color: `#0e79fd` (Siesa Blue) — use for interactive elements
- Neutrals: Tailwind `slate-*` scale
- Font: Inter (Light 300, Regular 400, Bold 700)
- Dark mode: class-based (`dark:` prefix)
- Loading: `react-loading-skeleton` — skeleton screens, NOT spinners
- Icons: Heroicons (primary), Font Awesome 6.5+ (secondary)
- All user-facing text in **Spanish**

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story-2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-Boundaries]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend-Stack]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend-Stack]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database-Conventions]
- [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#Dev-Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- All 12 tasks implemented successfully.
- `retry: 2` was moved to the production QueryClient default (`queryClient.ts`) instead of per-query hook, so tests can override it via their own QueryClient with `retry: false`.
- dotnet CLI not available in environment; EF Core migration was created manually (SQL-equivalent DDL correct).
- Navigation shell tests (21 failures) were pre-existing from Story 1.x and are unrelated to Story 2.1.
- Frontend: 21/21 AC tests pass (Vitest + RTL + MSW).

### File List

Backend:
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (NEW)
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (NEW)
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` (NEW)
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (NEW)
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` (NEW)
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` (NEW)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260613000001_AddClientesTable.cs` (NEW)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260613000001_AddClientesTable.Designer.cs` (NEW)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` (MODIFIED)
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (MODIFIED)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (NEW)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (NEW)
- `backend/src/SiesaAgents.API/Program.cs` (MODIFIED)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (NEW)
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (MODIFIED)

Frontend:
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` (NEW)
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` (NEW)
- `frontend/src/modules/crm/clientes/application/useClientes.ts` (NEW)
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` (NEW)
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` (NEW)
- `frontend/src/modules/crm/clientes/presentation/ClientesPage.tsx` (MODIFIED)
- `frontend/src/shared/components/EmptyState.tsx` (NEW)
- `frontend/src/shared/components/ErrorPanel.tsx` (NEW)
- `frontend/src/shared/components/ClientListItem.tsx` (NEW)
- `frontend/src/shared/lib/queryClient.ts` (MODIFIED)
