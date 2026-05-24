---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: done
epic: 2
story: 1
storyKey: 2-1-client-list-search
createdAt: '2026-05-24'
completedAt: '2026-05-24'
---

# Story 2.1: Client List & Search

Status: done

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive substring match), **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes` and the API returns an empty array, **Then** an `EmptyState` component is displayed with a Spanish message guiding the user to create the first client (e.g., "No hay clientes aún. Crea el primero.").

4. **Given** the backend is unavailable when the page loads, **When** the `GET /api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component is displayed with a "Reintentar" button instead of the list, **And** clicking "Reintentar" triggers a new fetch attempt.

5. **Given** the client list renders, **When** the user observes each list item, **Then** each item shows at minimum the client's `Nombre` and `NIT/RUC`, and the item is keyboard-accessible and meets WCAG 2.1 AA.

6. **Given** the list has more items than the visible panel height, **When** the user scrolls within the panel, **Then** all items are reachable via scroll without a full page reload.

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1 — Create `ClienteEntity` and EF Core migration (AC: #1, #5)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with properties: `Id` (Guid, UUID PK), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset). Use private constructor + static `Create()` factory method per DDD pattern.
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with `GetAllAsync()`, `GetByIdAsync(Guid id)`, `CreateAsync(ClienteEntity)`, `UpdateAsync(ClienteEntity)`, `DeleteAsync(Guid id)` methods.
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`. Configure: table name (auto via snake_case), unique index `uk_clientes_nit` on `Nit`, required fields (`Nombre`, `Nit`, `Telefono`, `Ciudad`).
  - [ ] Register `ClienteEntity` `DbSet<ClienteEntity>` in `SiesaAgentsDbContext.cs`.
  - [ ] Create EF Core migration: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` (run from `backend/` directory).
  - [ ] Apply migration: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`.
  - [ ] Verify `clientes` table created in `siesa_agents_db` with `id uuid`, `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at` columns (all snake_case).

- [ ] Task 2 — Implement `GetClientesQueryHandler` and GET /api/v1/clientes endpoint (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` with: `Id` (Guid), `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset).
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (record with no parameters).
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — injects `IClienteRepository`, calls `GetAllAsync()`, maps to `IEnumerable<ClienteDto>`. Returns direct array (no wrapper).
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`. Use EF Core `SiesaAgentsDbContext` for all queries. `GetAllAsync()` returns `AsNoTracking()` list ordered by `CreatedAt` descending (default sort for API).
  - [ ] Register `IClienteRepository` → `ClienteRepository` in DI (in `Program.cs` or a dedicated extension method).
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — define `GET /api/v1/clientes` endpoint returning `200 OK` with `IEnumerable<ClienteDto>` (direct JSON array, no wrapper). Use `MapGet`.
  - [ ] Register `ClienteEndpoints.MapClienteEndpoints(app)` in `Program.cs`.

### Frontend Tasks

- [ ] Task 3 — Create domain layer for `clientes` module (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`.
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>` method.

- [ ] Task 4 — Create infrastructure layer (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository`. Calls `GET /api/v1/clientes` via `apiClient` (Axios singleton at `src/shared/lib/apiClient.ts`). Returns `Cliente[]`.

- [ ] Task 5 — Create `useClientes` TanStack Query hook (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```typescript
    // queryKey: ['clientes']
    // queryFn: calls clienteApiRepository.getAll()
    // staleTime: 60_000 (inherit from queryClient default)
    // Returns: { data, isLoading, isError, refetch }
    ```
  - [ ] Ensure the hook re-exports `refetch` so `ErrorPanel` can wire `onRetry`.

- [ ] Task 6 — Build `ClienteListView` presentation component (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`. This component:
    - Calls `useClientes()` to fetch client data.
    - Displays a skeleton loading state using `react-loading-skeleton` (3–5 placeholder rows) while `isLoading` is true.
    - On `isError`: renders `<ErrorPanel onRetry={refetch} />` (see Task 8).
    - On empty data (`data?.length === 0`): renders `<EmptyState />` (see Task 7).
    - On success: renders a scrollable list (`overflow-y-auto`) of `<ClientListItem>` components (see Task 9).
    - Contains a search `<input>` field at the top of the panel, labeled "Buscar por nombre o NIT/RUC" (`aria-label`).
    - Uses `useMemo` to filter the client array based on `searchQuery` state — matches on `nombre` or `nit` (case-insensitive, substring). NO additional `GET /api/v1/clientes` calls during typing.
    - `searchQuery` is local `useState<string>('')` — not Zustand, not URL params.
    - Panel width: `w-[280px] flex-shrink-0` (fixed 280px per architecture spec).
    - All user-facing text in Spanish: placeholder "Buscar por nombre o NIT/RUC", aria-label "Lista de clientes".
  - [ ] Replace `ClientesPlaceholderView` in `frontend/src/routes/_app/clientes.tsx` with this component (or embed it in the route render).

- [ ] Task 7 — Create `EmptyState` shared component (AC: #3)
  - [ ] Check siesa-ui-kit catalog for an `EmptyState` or `EmptyView` component. If available, use it. If not, create `frontend/src/shared/components/EmptyState.tsx`.
  - [ ] Component accepts: `message?: string` prop. Default message: "No hay clientes aún. Crea el primero."
  - [ ] Renders centered icon (e.g., `UserGroupIcon` from Heroicons) + message text + optional action slot.
  - [ ] Must include `data-testid="empty-state"`.

- [ ] Task 8 — Create `ErrorPanel` shared component (AC: #4)
  - [ ] Check siesa-ui-kit catalog for an `ErrorPanel` or `ErrorView` component. If available, use it. If not, create `frontend/src/shared/components/ErrorPanel.tsx`.
  - [ ] Component accepts: `onRetry: () => void` prop.
  - [ ] Renders: error icon + Spanish message ("No se pudo cargar la información.") + "Reintentar" button that calls `onRetry`.
  - [ ] Must include `data-testid="error-panel"` and `data-testid="retry-button"` on the button.

- [ ] Task 9 — Create `ClientListItem` shared component (AC: #1, #5)
  - [ ] Check siesa-ui-kit catalog for a list item component. If not found, create `frontend/src/shared/components/ClientListItem.tsx`.
  - [ ] Props: `{ id: string; nombre: string; nit: string; isSelected?: boolean; onClick: () => void }`.
  - [ ] Renders: client Nombre (bold), NIT/RUC (muted text below).
  - [ ] Applies visual highlight when `isSelected` is true (Siesa Blue `#0e79fd` left border or background).
  - [ ] Keyboard accessible: `role="button"`, `tabIndex={0}`, `onKeyDown` handles Enter/Space.
  - [ ] Must include `data-testid={`client-item-${id}`}`.

### Testing Tasks

- [ ] Task 10 — Backend unit tests for `ClienteEntity` and `GetClientesQueryHandler` (AC: all)
  - [ ] Create `tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`:
    - Test `ClienteEntity.Create()` creates entity with correct fields and non-empty Guid ID.
    - Test `CreatedAt` and `UpdatedAt` are `DateTimeOffset` (not `DateTime`).
  - [ ] Create `tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`:
    - Test handler returns `IEnumerable<ClienteDto>` mapped from repository data.
    - Use mock `IClienteRepository` returning a fixed list of 3 clients.

- [ ] Task 11 — Backend integration test for GET /api/v1/clientes (AC: #1)
  - [ ] Create `tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (add to existing file if created by prior story):
    - TC-E2-P1-01: `GET /api/v1/clientes` returns 200 OK with JSON array (no wrapper), each item has `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt` fields.
    - Precondition: 3 clients pre-seeded in TestContainers Postgres DB.
    - Use `WebApplicationFactory<Program>`.

- [ ] Task 12 — Frontend component tests (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts` — unit test for the hook with MSW: assert `GET /api/v1/clientes` called once, returns typed array.
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`:
    - TC-E2-P1-07: Renders 5 clients; typing "Alpha" filters list to matching items only; clearing input restores all 5. Assert no additional API calls during typing (MSW request count).
    - TC-E2-P1-08: MSW returns `[]` → `EmptyState` rendered with message, no list items.
    - TC-E2-P1-09: MSW returns network error → `ErrorPanel` with "Reintentar" button rendered. After updating MSW to return data and clicking "Reintentar", list loads correctly.
    - Skeleton loading state: while `isLoading`, skeleton placeholders are visible (not the list).
  - [ ] Create `frontend/src/shared/components/__tests__/EmptyState.test.tsx` — renders with default message and with custom message.
  - [ ] Create `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` — renders "Reintentar" button; clicking calls `onRetry`.
  - [ ] Create `frontend/src/shared/components/__tests__/ClientListItem.test.tsx` — renders Nombre and NIT; `isSelected` applies highlight class; Enter/Space keyboard events call `onClick`.

## Dev Notes

### Architecture Patterns

This story introduces the `clientes` module for the first time. It implements the frontend (list + search) and the backend API endpoint (`GET /api/v1/clientes`) along with the `ClienteEntity` and database migration.

**Clean Architecture layers to create:**
```
Frontend: domain → application → infrastructure → presentation
Backend:  Domain → Application → Infrastructure → API
```

All layers for `clientes` are stubbed with `.gitkeep` files (created in Story 1.2). This story fills them with real implementations.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory — check catalog before ANY custom component)
- **Install**: already installed in Story 1.2 — `pnpm add siesa-ui-kit`
- **Usage**: Check siesa-ui-kit catalog for `EmptyState`, `ErrorPanel`, `ListItem`, `SearchInput` equivalents before creating custom components.
- **Constraint**: Do NOT create custom UI components if a siesa-ui-kit equivalent exists.
- **Icons**: `UserGroupIcon` from `@heroicons/react/24/outline` for EmptyState; already installed.

### Frontend Architecture Patterns

**Search filter implementation (canonical):**
```typescript
// In ClienteListView.tsx
const [searchQuery, setSearchQuery] = useState('');

const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return data ?? [];
  const q = searchQuery.toLowerCase();
  return (data ?? []).filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}, [data, searchQuery]);
```

**Key constraints:**
- `searchQuery` is `useState` — NOT Zustand, NOT URL search params (architecture spec: "Client-side filter state (local React state, NO Zustand)")
- No debounce required — `useMemo` with 500 records runs in < 50ms
- Zero additional API calls during typing — filter operates on cached TanStack Query data

**TanStack Query hook pattern:**
```typescript
// useClientes.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export const useClientes = () =>
  useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  });
```

**Route integration:**
- The `ClienteListView` replaces `ClientesPlaceholderView` in `frontend/src/routes/_app/clientes.tsx`
- Route file: `frontend/src/routes/_app/clientes.tsx` — created in Story 1.2 with `createFileRoute('/_app/clientes')`

**Loading state (skeleton, not spinner):**
```typescript
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// While isLoading:
<div aria-label="Cargando clientes">
  {Array.from({ length: 5 }).map((_, i) => (
    <Skeleton key={i} height={56} className="mb-2" />
  ))}
</div>
```

### Backend Architecture Patterns

**ClienteEntity — DDD pattern (mandatory):**
```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }  // NEVER DateTime
    public DateTimeOffset UpdatedAt { get; private set; }  // NEVER DateTime

    private ClienteEntity() { }  // EF Core needs this

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

**ClienteConfiguration — EF Core (mandatory):**
```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
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
        // snake_case applied automatically via UseSnakeCaseNamingConvention() in OnModelCreating
        // NO [Column], [Table], or manual column name attributes
    }
}
```

**GET /api/v1/clientes endpoint pattern:**
```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(clientes);  // direct array — no wrapper
        });
    }
}
```

**API response shape — direct array (architecture spec):**
```json
[
  { "id": "uuid", "nombre": "Empresa Alpha", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "2026-03-12T10:30:00Z" },
  ...
]
```

**Error handling — backend:** `ExceptionHandlingMiddleware` (already implemented in Story 1.3) handles all uncaught exceptions → Problem Details RFC 7807. No additional error handling needed in endpoints for this story.

### Database Conventions

Per `company-standards.md` and `architecture.md`:
- Table: `clientes` (snake_case, plural — auto-applied by `UseSnakeCaseNamingConvention()`)
- Columns: `id uuid`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`
- PK: `id UUID DEFAULT gen_random_uuid()` (Guid in C#, mapped by EF Core)
- Unique: `uk_clientes_nit` on `nit`
- NO manual `[Column]` or `[Table]` attributes — rely entirely on `UseSnakeCaseNamingConvention()`

**Important:** This is the first migration that creates a domain table. Story 1.3 created the initial empty migration. This story adds `AddClientesTable` migration on top.

### Current Codebase State (Critical Context)

Story 1.2 created these stubs that this story builds upon:
- `frontend/src/routes/_app/clientes.tsx` — currently renders `<ClientesPlaceholderView />`. Replace with `<ClienteListView />`.
- `frontend/src/modules/crm/clientes/domain/.gitkeep` — directory exists, fill with `Cliente.ts` and `IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/.gitkeep` — directory exists, fill with `useClientes.ts`
- `frontend/src/modules/crm/clientes/infrastructure/.gitkeep` — directory exists, fill with `clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` — exists, will be superseded by `ClienteListView.tsx`
- `frontend/src/shared/lib/apiClient.ts` — Axios singleton already configured with `baseURL: import.meta.env.VITE_API_URL` (= `http://localhost:5000`)
- `frontend/src/shared/lib/queryClient.ts` — TanStack QueryClient already configured with `staleTime: 60_000`

Backend (Story 1.3):
- `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs` — `UseSnakeCaseNamingConvention()` active, `ApplyConfigurationsFromAssembly()` active. Add `DbSet<ClienteEntity>` here.
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already implemented and registered.
- `backend/src/SiesaAgents.API/Program.cs` — DbContext already registered with Npgsql + snake_case convention.
- Initial empty migration exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

### Project Structure After This Story

```
frontend/src/modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                          # Entity interface
│   └── IClienteRepository.ts              # Repository contract
├── application/
│   └── useClientes.ts                     # TanStack Query hook — queryKey: ['clientes']
├── infrastructure/
│   └── clienteApiRepository.ts            # Axios implementation
└── presentation/
    ├── ClientesPlaceholderView.tsx         # Existing — no longer used in route
    └── ClienteListView.tsx                 # NEW — list + search + empty + error states

frontend/src/shared/components/
├── EmptyState.tsx                          # NEW (or siesa-ui-kit equivalent)
├── ErrorPanel.tsx                          # NEW (or siesa-ui-kit equivalent)
└── ClientListItem.tsx                      # NEW (or siesa-ui-kit equivalent)

backend/src/SiesaAgents.Domain/Clientes/
├── Entities/ClienteEntity.cs              # NEW
└── Interfaces/IClienteRepository.cs       # NEW

backend/src/SiesaAgents.Application/Clientes/
├── DTOs/ClienteDto.cs                     # NEW
├── Queries/GetClientesQuery.cs            # NEW
└── Queries/GetClientesQueryHandler.cs     # NEW

backend/src/SiesaAgents.Infrastructure/
├── Data/Configurations/ClienteConfiguration.cs  # NEW
├── Migrations/{timestamp}_AddClientesTable.cs   # NEW
└── Repositories/ClienteRepository.cs           # NEW (partial — GetAllAsync + GetByIdAsync)

backend/src/SiesaAgents.API/Endpoints/
└── ClienteEndpoints.cs                    # NEW — GET /api/v1/clientes
```

### Testing Standards

**Frontend:**
- Vitest + React Testing Library + MSW
- Component tests: `renderWithProviders` wrapper with `QueryClient` + `MemoryRouter`
- MSW handlers: define in `src/tests/handlers/clienteHandlers.ts` or inline per test
- Assert request count: use `server.events` or a request spy to confirm zero extra `GET /api/v1/clientes` calls during search filtering
- Accessibility: use `@testing-library/jest-dom` `toBeInTheDocument`, check `aria-label` attributes

**Backend:**
- xUnit + `WebApplicationFactory<Program>` for integration tests
- TestContainers Postgres for integration tests (Epic 2 migration must be applied in test setup)
- Arrange / Act / Assert structure
- Coverage target: >80% for new code in this story

### Performance Notes

- Client-side filter over 500 items with `useMemo` runs in < 50ms — well within NFR1 (< 1s).
- No debounce needed at this scale. Add debounce only if performance measurements show need.
- `AsNoTracking()` on `GetAllAsync()` in `ClienteRepository` is mandatory for read-only queries.
- TanStack Query `staleTime: 60_000` prevents redundant refetches during the session.

### Related Test Cases (from test-design-epic-2.md)

Story 2.1 test cases to implement in this story:

| TC | Level | Priority | Description |
|----|-------|----------|-------------|
| TC-E2-P1-01 | API Integration | P1 | GET /api/v1/clientes returns all clients (200, direct array) |
| TC-E2-P1-07 | Component | P1 | Real-time search by Nombre and NIT/RUC, no extra API calls |
| TC-E2-P1-08 | Component | P1 | EmptyState when API returns `[]` |
| TC-E2-P1-09 | Component | P1 | ErrorPanel + Reintentar on network failure |
| TC-E2-P2-06 | E2E | P2 | Search < 1s with 500 records (NFR1) |

P2 test (TC-E2-P2-06) is informational for this story — defer to E2E test suite.

### Project Structure Notes

- Route `_app/clientes.tsx` uses TanStack Router `createFileRoute('/_app/clientes')`. Do NOT rename or move this file.
- The 280px left panel layout is defined at the route/view level — `ClienteListView` should receive its fixed width from the parent layout, or apply it internally with `className="w-[280px] flex-shrink-0 h-full overflow-y-auto"`.
- The right panel (client detail) is rendered by `_app/clientes.$clienteId.tsx` — this story does NOT implement that route. The route renders an empty/placeholder right panel for now.
- Story 2.2 will implement the detail panel and the `$clienteId` route. Story 2.1 only establishes the list.

### References

- Epic source and story AC: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture — frontend structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — search strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — "Search Strategy"]
- Architecture — ClienteListView path: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — state boundaries: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Architecture — TanStack Query keys: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Architecture — enforcement guidelines: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture — API response shapes: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Company standards — siesa-ui-kit P0 rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Company standards — DateTimeOffset mandatory: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Company standards — UUID PKs: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Company standards — DB conventions (snake_case, uk_ prefix): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Company standards — loading states (skeleton): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- Test design epic 2 — Story 2.1 test cases: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Story 2.1 — Client List & Search]
- Story 1.2 completion notes (codebase state): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md#Completion Notes List]
- Story 1.3 dev notes (DB context, migrations): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#Dev Notes]
- NFR1 (search < 1s): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR1]
- FR1, FR2, FR3, FR4: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Added `VITE_API_URL: 'http://localhost:5000'` to vitest `env` config to fix MSW URL matching in tests.
- Moq package was missing from UnitTests.csproj — installed version 4.20.72.
- Updated 3 Story 1.3 edge-case tests (`SiesaAgentsDbContextEdgeCaseTests`) that expected empty model/no DbSets/no configurations; they now assert the presence of `ClienteEntity` / `Clientes` DbSet / `ClienteConfiguration`.

### Completion Notes List

- siesa-ui-kit not installed in node_modules — created custom `EmptyState`, `ErrorPanel`, `ClientListItem` components per spec.
- `ClienteListView` replaces `ClientesPlaceholderView` in `frontend/src/routes/_app/clientes.tsx`.
- EF Core migration `AddClientesTable` created and verified: table `clientes` with snake_case columns, UUID PK, unique index `uk_clientes_nit`.
- All ACs implemented: list panel (280px), real-time filter (useMemo, no extra API calls), EmptyState, ErrorPanel + Reintentar, keyboard accessibility (WCAG 2.1 AA), scroll.

### File List

Backend:
- backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs (NEW)
- backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs (NEW)
- backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs (NEW)
- backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs (NEW)
- backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs (NEW)
- backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs (NEW)
- backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs (MODIFIED — added Clientes DbSet)
- backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs (NEW)
- backend/src/SiesaAgents.Infrastructure/Migrations/20260524091634_AddClientesTable.cs (NEW)
- backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs (NEW)
- backend/src/SiesaAgents.API/Program.cs (MODIFIED — registered IClienteRepository, GetClientesQueryHandler, MapClienteEndpoints)
- backend/tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextEdgeCaseTests.cs (MODIFIED — updated 3 stale Story 1.3 tests)

Frontend:
- frontend/src/modules/crm/clientes/domain/Cliente.ts (NEW)
- frontend/src/modules/crm/clientes/domain/IClienteRepository.ts (NEW)
- frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts (NEW)
- frontend/src/modules/crm/clientes/application/useClientes.ts (NEW)
- frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx (NEW)
- frontend/src/shared/components/EmptyState.tsx (NEW)
- frontend/src/shared/components/ErrorPanel.tsx (NEW)
- frontend/src/shared/components/ClientListItem.tsx (NEW)
- frontend/src/routes/_app/clientes.tsx (MODIFIED — replaced ClientesPlaceholderView with ClienteListView)
- frontend/vite.config.ts (MODIFIED — added VITE_API_URL env for tests)
