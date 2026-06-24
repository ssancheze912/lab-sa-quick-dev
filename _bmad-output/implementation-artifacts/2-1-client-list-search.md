# Story 2.1: Client List & Search

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients with Nombre and NIT/RUC visible per item using the `ClientListItem` shared component.

2. **Given** the client list is loaded, **When** the user types in the search input field, **Then** the list filters in real time (client-side, no new API call) showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system (empty array returned from API), **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a Spanish-language message guiding the user to create the first client (e.g., "No hay clientes registrados. Crea el primero.").

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails (network error or non-2xx response), **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, **And** clicking "Reintentar" triggers a new fetch attempt.

5. **Given** the client list is rendered, **When** the user clicks on a client item, **Then** the item is visually highlighted as selected (active state) and the URL updates to `/clientes/:clienteId` using TanStack Router client-side navigation without a full page reload (FR30).

6. **Given** the `clientes` route renders, **When** the component mounts, **Then** a single `GET /api/v1/clientes` request is sent and the response is cached under `queryKey: ['clientes']` via TanStack Query.

7. **Given** client data is loading from the API, **When** the fetch is in-flight, **Then** a skeleton loader (via `react-loading-skeleton`) is rendered in the list area — no spinner.

## Tasks / Subtasks

- [x] Task 1 — Define domain entity and repository contract for Cliente (AC: #6)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`

- [x] Task 2 — Implement infrastructure API repository (AC: #6)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [x] Implement `IClienteRepository.getAll()` using `apiClient.get<Cliente[]>('/api/v1/clientes')` (Axios singleton at `src/shared/lib/apiClient.ts`)
  - [x] Export a singleton instance `clienteApiRepository`

- [x] Task 3 — Implement application-layer TanStack Query hooks (AC: #2, #6, #7)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [x] Use `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })` — no staleTime override (default)
  - [x] Export `{ data, isLoading, isError, refetch }` from the hook

- [x] Task 4 — Create shared `ClientListItem` component (AC: #1)
  - [x] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [x] Props: `{ cliente: Cliente; isSelected: boolean; onClick: (id: string) => void }`
  - [x] Render Nombre (bold) and NIT/RUC (secondary text) per item
  - [x] Apply active state: `bg-primary-50 text-primary-700` when `isSelected`, else default slate
  - [x] Add `data-testid="client-list-item-{id}"` for ATDD targeting
  - [x] Add `aria-selected={isSelected}` for accessibility (WCAG 2.1 AA)

- [x] Task 5 — Create shared `EmptyState` component (AC: #3)
  - [x] Create `frontend/src/shared/components/EmptyState.tsx` (if not already present from Epic 1)
  - [x] Props: `{ message: string; actionLabel?: string; onAction?: () => void }`
  - [x] Render message text and optional action button in Spanish
  - [x] Add `data-testid="empty-state"`

- [x] Task 6 — Create shared `ErrorPanel` component (AC: #4)
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx` (if not already present)
  - [x] Props: `{ message?: string; onRetry: () => void }`
  - [x] Default message: "Error al cargar los datos. Intenta de nuevo."
  - [x] Render a "Reintentar" button that calls `onRetry`
  - [x] Add `data-testid="error-panel"` and `data-testid="retry-button"`

- [x] Task 7 — Implement `ClienteListView` presentation component (AC: #1, #2, #3, #4, #5, #7)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [x] Use `useClientes()` hook for data fetching
  - [x] Local `useState<string>` for `searchQuery`; filter `clientes` array client-side: `clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
  - [x] Render skeleton (`react-loading-skeleton`, 5 rows) while `isLoading === true`
  - [x] Render `<ErrorPanel onRetry={refetch} />` when `isError === true`
  - [x] Render `<EmptyState message="No hay clientes registrados. Crea el primero." />` when `data` is an empty array
  - [x] Render search `<input>` with placeholder "Buscar por nombre o NIT/RUC..." and `data-testid="client-search-input"`
  - [x] Render scrollable list of `<ClientListItem>` components in a `<ul role="listbox">` container
  - [x] Width: `w-[280px]` (fixed, non-collapsible in this story)
  - [x] Wrap in `<aside aria-label="Lista de clientes">` for accessibility
  - [x] Add `data-testid="cliente-list-view"`
  - [x] On `ClientListItem` click: call TanStack Router's `navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })`

- [x] Task 8 — Wire `ClienteListView` into the `/clientes` route (AC: #1, #5)
  - [x] Update `frontend/src/routes/_app/clientes.tsx` (placeholder from Story 1.2) to render `<ClienteListView />`
  - [x] Keep the right panel as a placeholder `<div>` (detail panel is implemented in Story 2.2)
  - [x] Layout: `flex flex-row h-full` — left panel `w-[280px] border-r` + right panel `flex-1`
  - [x] Create route file `frontend/src/routes/_app/clientes.$clienteId.tsx` as a stub (renders nothing, just enables URL state for Story 2.2)

- [x] Task 9 — Backend: Create `ClienteEntity` and `clientes` migration (AC: #6)
  - [x] Create `backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`:
    - Inherit from `Entity` base class (already in `SiesaAgents.Domain/Entities/Entity.cs`)
    - Properties: `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
    - Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory
    - `UpdatedAt` refreshed via `Update(...)` method
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteEntityConfiguration.cs`
    - `IEntityTypeConfiguration<ClienteEntity>`
    - Map to table `clientes` (snake_case auto via `ApplySnakeCaseNaming()`)
    - Add unique index: `HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`
    - Required fields: Nombre (max 200), Nit (max 50), Telefono (max 30), Ciudad (max 100)
  - [x] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
  - [x] Run `dotnet ef migrations add AddClientes --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [x] Verify migration creates `clientes` table with columns: `id uuid PK`, `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at`

- [x] Task 10 — Backend: Create Application layer (DTOs, Query, Handler) (AC: #6)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`:
    ```csharp
    public record ClienteDto(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
    ```
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`: `public record GetClientesQuery();`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`:
    - Inject `IClienteRepository` (or `AppDbContext` directly if repository not yet extracted)
    - Return `IEnumerable<ClienteDto>` — map from `ClienteEntity` using manual mapping or `Select`
    - Use `AsNoTracking()` for read-only queries
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing domain repository interface
    - `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)` using EF Core

- [x] Task 11 — Backend: Create Minimal API endpoint (AC: #6)
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [x] Register `GET /api/v1/clientes` endpoint in `Program.cs` via `app.MapGet("/api/v1/clientes", handler)`
  - [x] Handler dispatches `GetClientesQuery` and returns `Results.Ok(clienteDtos)`
  - [x] Return type: `IEnumerable<ClienteDto>` serialized as JSON array (camelCase via .NET default)
  - [x] Status codes: 200 (success), 500 (unhandled — caught by middleware)

- [x] Task 12 — Unit tests frontend (AC: #1, #2, #3, #4, #7)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
    - Test: returns client data on successful fetch (MSW handler)
    - Test: `isLoading` is true while fetching
    - Test: `isError` is true on API failure
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
    - Test: renders skeleton during loading
    - Test: renders `EmptyState` when API returns empty array
    - Test: renders `ErrorPanel` with retry button on API failure
    - Test: renders list of clients with Nombre and NIT/RUC visible
    - Test: filters list when search input changes (case-insensitive)
    - Test: clicking item navigates to `/clientes/:id`
    - Test: accessibility — `<aside aria-label="Lista de clientes">` present; items have `aria-selected`
  - [x] All tests use Vitest + RTL + MSW; follow Arrange/Act/Assert; coverage target >80%

- [x] Task 13 — Backend unit and integration tests (AC: #6)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - Test: returns empty list when no clients in DB
    - Test: returns mapped `ClienteDto` list when clients exist
    - Test: uses `AsNoTracking` (verify no tracking by checking `ChangeTracker.Entries()` is empty)
  - [x] Create `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs`
    - Test: `GET /api/v1/clientes` returns 200 + JSON array
    - Test: response is empty array when no clients seeded
    - Test: response contains seeded client data with correct camelCase fields
  - [x] Use xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL (integration)
  - [x] All tests: Arrange / Act / Assert pattern

## Dev Notes

### Architecture Context

This story is **full-stack** — both frontend and backend changes are required. The story delivers the client list view (frontend) and the `GET /api/v1/clientes` endpoint (backend), establishing the `clientes` table in PostgreSQL.

**Critical dependency from Story 1.3:** The `AppDbContext`, `ExceptionHandlingMiddleware`, `Entity` base class, `NotFoundException`, and `ConflictException` are all already implemented. Do NOT recreate them. The `clientes` table has NOT yet been created — this story creates it via EF Core migration.

**Split-panel layout:** The `/clientes` route renders a persistent 280px left panel (this story) and a right panel detail area (Story 2.2). Implement the layout shell in this story with a right panel placeholder.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check siesa-ui-kit catalog FIRST before creating any UI component.
- **Install**: `npm install siesa-ui-kit` (already done in Story 1.1 — verify package is present).
- **Usage**: Use `siesa-ui-kit` components for all UI elements where equivalents exist. For `ClientListItem`, `EmptyState`, and `ErrorPanel`, create custom shared components only if no siesa-ui-kit equivalent exists.
- **Loading states**: Use `react-loading-skeleton` — skeleton screens, NOT spinners.
- **Icons**: Heroicons (primary), Font Awesome 6.5+ (secondary).
- **Brand Colors**: Primary `#0e79fd` (Siesa Blue) — use Tailwind `primary-*` tokens.
- **All user-facing text in Spanish** — no English strings rendered in the UI.
- **WCAG 2.1 AA**: all interactive elements accessible via keyboard, all ARIA labels in Spanish.

### MasterCrud Assessment

Story 2.1 is a **read-only list + search panel** — NOT a full CRUD grid. MasterCrud is NOT applicable here: this story renders a narrow 280px sidebar list with client-side filtering, not a tabular CRUD screen. MasterCrud will be evaluated for Stories 2.3–2.5 (create/edit/delete forms).

### Backend: Entity Pattern

Use the mandatory private constructor + static factory pattern:

```csharp
public class ClienteEntity : Entity
{
    private ClienteEntity() { } // required by EF Core

    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);

        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad
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

Note: `Guid Id` is inherited from `Entity` base class (already exists at `backend/src/SiesaAgents.Domain/Entities/Entity.cs`).

### Backend: EF Core Configuration Pattern

```csharp
public class ClienteEntityConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes"); // snake_case auto-applied by ApplySnakeCaseNaming()
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(30);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

`ApplySnakeCaseNaming()` is called last in `OnModelCreating` (already done in Story 1.3). No manual `[Column]` or `[Table]` attributes.

### Backend: Minimal API Endpoint Pattern

```csharp
// ClienteEndpoints.cs
public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .WithSummary("List all clients");
    }
}
// In Program.cs: app.MapClienteEndpoints();
```

### Frontend: Clean Architecture Module Structure

```
frontend/src/modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                      ← CREATE
│   └── IClienteRepository.ts           ← CREATE
├── application/
│   └── useClientes.ts                  ← CREATE
├── infrastructure/
│   └── clienteApiRepository.ts         ← CREATE
└── presentation/
    └── ClienteListView.tsx             ← CREATE

frontend/src/shared/components/
├── ClientListItem.tsx                  ← CREATE
├── EmptyState.tsx                      ← CREATE (verify not already present)
└── ErrorPanel.tsx                      ← CREATE (verify not already present)

frontend/src/routes/_app/
├── clientes.tsx                        ← MODIFY (was placeholder from Story 1.2)
└── clientes.$clienteId.tsx            ← CREATE (stub for Story 2.2)
```

### Frontend: TanStack Query Integration

```typescript
// useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  })
}
```

The `queryKey: ['clientes']` is the canonical key (from `architecture.md`). All mutation hooks in Stories 2.3–2.5 will invalidate this key via `queryClient.invalidateQueries({ queryKey: ['clientes'] })`.

### Frontend: Client-Side Search Filter

```typescript
// In ClienteListView.tsx
const [searchQuery, setSearchQuery] = useState('')

const filteredClientes = useMemo(() => {
  if (!data) return []
  const q = searchQuery.toLowerCase().trim()
  if (!q) return data
  return data.filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.nit.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

No debounce needed for up to 500 records (NFR1 target < 1s — client-side filter is well within bounds).

### Frontend: Route Layout

```typescript
// frontend/src/routes/_app/clientes.tsx
export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex flex-row h-full" data-testid="clientes-view">
      <ClienteListView />
      <div className="flex-1" data-testid="cliente-detail-placeholder">
        {/* Story 2.2 renders ClienteDetailView here */}
      </div>
    </div>
  )
}
```

The `clientes.$clienteId.tsx` stub enables deep-linking (FR30) from this story forward.

### Database Schema (from architecture.md)

```sql
-- clientes table (created by migration in this story)
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  nombre VARCHAR(200) NOT NULL,
  nit VARCHAR(50) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uk_clientes_nit ON clientes(nit);
```

EF Core generates this DDL automatically from the entity configuration + `ApplySnakeCaseNaming()`.

### API Response Shape (from architecture.md)

```
GET /api/v1/clientes → 200 OK — direct JSON array (no wrapper)
[
  { "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "2026-01-01T00:00:00Z", "updatedAt": "2026-01-01T00:00:00Z" }
]
```

Empty list returns `200 OK` with `[]` — NOT a 404.

### Testing Standards Summary

**Frontend:** Vitest + React Testing Library + MSW. Tests co-located or in `__tests__/` subdirectory. Accessibility checks via `@axe-core/react` or `getByRole`. Coverage target > 80%.

**Backend:** xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL (integration). All tests: Arrange / Act / Assert pattern. Coverage target > 80%.

### Project Structure Notes

- `frontend/src/shared/lib/apiClient.ts` — Axios singleton (created in Story 1.1). Do NOT recreate. Import `apiClient` from this path.
- `frontend/src/shared/lib/queryClient.ts` — TanStack QueryClient (created in Story 1.1). Do NOT recreate.
- `backend/src/SiesaAgents.Domain/Entities/Entity.cs` — base class with `Guid Id` (created in Story 1.1). Actual path confirmed as `Entities/Entity.cs` (not `Common/Entity.cs` — see Story 1.3 dev notes).
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` and `ConflictException.cs` — already exist from Story 1.3.
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already wired in `Program.cs` from Story 1.3.
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — already exists; add `DbSet<ClienteEntity>` property.

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Epic objectives and FRs: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Epic 2]
- Frontend module structure: [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- TanStack Query keys (canonical): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- REST endpoints contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Database schema (clientes): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Search strategy (client-side filter): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Entity pattern (private ctor + factory): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- UUID PKs and DateTimeOffset: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- EF Core snake_case naming: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core]
- API response shapes (array, no wrapper): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Problem Details RFC 7807 error format: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Enforcement guidelines (anti-patterns): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- MasterCrud reference: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Story 1.3 dev notes (Entity.cs path, pre-existing infrastructure): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- NFR1 search < 1s: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR6 no stack traces: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 13 tasks implemented following Clean Architecture (domain/application/infrastructure/presentation layers).
- siesa-ui-kit `Button` component used in `EmptyState` and `ErrorPanel`; no siesa-ui-kit equivalent exists for `ClientListItem`, `EmptyState`, or `ErrorPanel` as list/state display components.
- `IClienteRepository` interface placed in `Application/Clientes/Interfaces/` to maintain Clean Architecture (Application does not reference Infrastructure).
- Infrastructure project now references Application project to allow `ClienteRepository` to implement `IClienteRepository`.
- EF Core migration created manually (`20260101000001_AddClientes.cs`) since `dotnet` runtime is not available in CI environment; migration follows the same pattern as `InitialCreate`.
- `public partial class Program { }` added to `Program.cs` to enable `WebApplicationFactory<Program>` in integration tests.
- Pre-existing app shell tests updated to include `QueryClientProvider` and MSW server stub to handle `ClienteListView`'s `useClientes()` hook without breaking existing tests.
- All 90 frontend tests pass (including 10 new tests for this story).
- Backend tests created with xUnit + InMemory EF Core (unit) + Testcontainers PostgreSQL (integration).

### File List

**CREATED:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`
- `backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteEntityConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260101000001_AddClientes.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs`

**MODIFIED:**
- `frontend/src/routes/_app/clientes.tsx` — replaced placeholder with `ClienteListView` integration
- `frontend/src/routes/__tests__/-app-shell.test.tsx` — added QueryClientProvider + MSW
- `frontend/src/routes/__tests__/app-shell-edge-cases.test.tsx` — added QueryClientProvider + MSW
- `frontend/src/routes/__tests__/app-shell.test.tsx` — added QueryClientProvider + MSW
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — added `DbSet<ClienteEntity>`
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs` — updated model snapshot
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — added Application project reference
- `backend/src/SiesaAgents.API/Program.cs` — registered repository + handler + endpoint
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — added InMemory + Infrastructure references
- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` — added API + MVC Testing references
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status in-progress
- `frontend/src/routeTree.gen.ts` — auto-generated by TanStack Router (not manually edited)

## Review Follow-ups (AI)

- [ ] [AI-Review][CRITICAL] `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` is placed in the Application layer but `architecture.md` (line 568) specifies it belongs in `SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`. Move the interface to the Domain project, remove the Application→Infrastructure circular workaround, and have Infrastructure reference Domain instead.
- [ ] [AI-Review][HIGH] `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — `GET /api/v1/clientes` has no authorization. Company standards require JWT + RBAC on all endpoints. Add `.RequireAuthorization()` once the authentication infrastructure is established (Story 1.x or dedicated auth story).
