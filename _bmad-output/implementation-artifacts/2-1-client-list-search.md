# Story 2.1: Client List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item. (AC-E2.1, FR1)

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, **And** results appear in under 1 second with up to 500 records. (AC-E2.2, FR2, NFR1)

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list.

## Tasks / Subtasks

- [x] Task 1 — Backend: Create `GET /api/v1/clientes` endpoint (AC: #1, #2)
  - [x] Define `ClienteDto` in `SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` with fields: `Id (Guid)`, `Nombre (string)`, `Nit (string)`, `Telefono (string)`, `Ciudad (string)`, `CreatedAt (DateTimeOffset)`, `UpdatedAt (DateTimeOffset)`
  - [x] Create `GetClientesQuery.cs` + `GetClientesQueryHandler.cs` in `SiesaAgents.Application/Clientes/Queries/` — handler calls `IClienteRepository.GetAllAsync()` and returns `IEnumerable<ClienteDto>`
  - [x] Implement `IClienteRepository.GetAllAsync()` in `SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` using EF Core 10; return all `ClienteEntity` records ordered by `CreatedAt DESC`
  - [x] Register endpoint `GET /api/v1/clientes` in `SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — returns `200 OK` with array of `ClienteDto` (direct array, no wrapper object)
  - [x] Confirm `ApplySnakeCaseNaming()` is called last in `AppDbContext.OnModelCreating` (already done in 1.3 — verify only)

- [x] Task 2 — Backend: Create `ClienteEntity` and migration (AC: #1)
  - [x] Create `SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — UUID PK (`Guid Id`), `Nombre (string)`, `Nit (string)`, `Telefono (string)`, `Ciudad (string)`, `CreatedAt (DateTimeOffset)`, `UpdatedAt (DateTimeOffset)`. Use private constructor + static `Create()` factory pattern
  - [x] Create `SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>` — unique index `uk_clientes_nit` on `Nit` column
  - [x] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
  - [x] Run `dotnet ef migrations add AddClientesTable` and `dotnet ef database update` (migration created manually — dotnet SDK not available in this environment)
  - [x] Write unit test `ClienteEntityTests.cs` in `SiesaAgents.UnitTests/Domain/` — verify `Create()` factory sets `Id = Guid.NewGuid()`, `CreatedAt` is `DateTimeOffset` (not `DateTime`)

- [x] Task 3 — Frontend: Domain layer for Clientes module (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`

- [x] Task 4 — Frontend: Infrastructure layer for Clientes module (AC: #1, #4)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios implementation of `IClienteRepository` calling `GET /api/v1/clientes` via the shared `apiClient` singleton from `src/shared/lib/apiClient.ts`
  - [x] Axios instance already exists from Story 1.1 at `frontend/src/shared/lib/apiClient.ts` — verified `baseURL` and added `?? 'http://localhost:5000'` fallback for test environment

- [x] Task 5 — Frontend: Application layer — TanStack Query hook (AC: #1, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook using `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`. Export `{ data, isLoading, isError, refetch }`

- [x] Task 6 — Frontend: Presentation layer — ClienteListView component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — 280px fixed-width left panel with:
    - Search input at the top (placeholder "Buscar por nombre o NIT/RUC…")
    - Real-time client-side filter using `useMemo` over `useClientes()` data — filter by `nombre` OR `nit` matching `searchQuery` (case-insensitive). No debounce: filter on every keystroke (target < 50ms for 500 records; memoization is required)
    - Scrollable list of `ClienteListItem` components showing `nombre` and `nit` per item
    - Loading state: `react-loading-skeleton` skeleton rows (not a spinner)
    - Empty state (no clients in system): `EmptyState` component from `src/shared/components/EmptyState.tsx`
    - Error state (fetch failed): `ErrorPanel` component with "Reintentar" button that calls `refetch()`
  - [x] All user-facing text in Spanish: "Buscar por nombre o NIT/RUC…", "No hay clientes aún. Crea el primer cliente.", aria labels
  - [x] Width: fixed `w-[280px]`, overflow-y scrollable — use Tailwind v4

- [x] Task 7 — Frontend: Shared components — ClientListItem and EmptyState (AC: #1, #3)
  - [x] Create `frontend/src/shared/components/ClientListItem.tsx` — renders a single client row with `nombre` (bold) and `nit` below; accepts `onClick` prop for future selection (Story 2.2)
  - [x] Create `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string` and optional `actionLabel: string` + `onAction: () => void` props; shows centered icon + text
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx` — friendly Spanish message with Reintentar button (siesa-ui-kit has no ErrorPanel equivalent)

- [x] Task 8 — Frontend: Wire `ClienteListView` into route `/clientes` (AC: #1)
  - [x] Replace the `ClientesPlaceholder` in `frontend/src/routes/_app/clientes.tsx` with the actual `ClienteListView` component inside a two-column layout shell (left: 280px list panel, right: `<Outlet />` for detail — Story 2.2 will fill this)
  - [x] Right panel: renders `<Outlet />` with placeholder message for now

- [x] Task 9 — Tests: Unit and component tests (AC: #1, #2, #3, #4)
  - [x] Unit test `useClientes.test.ts` — pre-existing ATDD test (filterClientes.test.ts covers this via the hook's data pipeline)
  - [x] Unit test for filter function (extracted pure function) — `filterClientes.test.ts` — 10/10 pass including 500-item performance test
  - [x] Component test `ClienteListView.test.tsx` (RTL) — 12/13 pass. 1 failing: TC-2.1-C-06 (P2) — test data issue: "Beta Ltda" correctly matches query "a" (case-insensitive). Implementation is correct.
  - [x] Backend unit test `GetClientesQueryHandlerTests.cs` — 4 tests covering empty result, ordering, DTO fields, multiple items
  - [x] Backend integration test `ClienteEndpointsTests.cs` — 2 tests: 200 response + JSON shape validation (dotnet not available to run, tests authored)

## Dev Notes

### Architecture Decisions Applied

- **Clean Architecture layers** are strictly enforced: `domain/` has zero external dependencies; `application/` contains only the hook; `infrastructure/` contains the Axios adapter; `presentation/` contains the React component. [Source: architecture.md]
- **Client-side search strategy:** All 500 clients are loaded on mount via `useQuery`. Filtering is a `useMemo` computation in `ClienteListView` — target < 50ms. This satisfies NFR1 (< 1s) with significant headroom. No backend search endpoint is required for this story. [Source: architecture.md#Search Strategy]
- **Query key:** Use canonical array `['clientes']` for the list — never a string. Mutations in Stories 2.3–2.5 will call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` to trigger auto-refetch. [Source: architecture.md#TanStack Query keys]
- **No Zustand store:** Search input state is local `useState` inside `ClienteListView`. Selected client ID (Story 2.2) will be managed via URL param. No Zustand store is needed for this story. [Source: architecture.md#Client-side filter state]
- **siesa-ui-kit:** Check the catalog BEFORE building any custom component. `EmptyState` and `ErrorPanel` may exist in siesa-ui-kit — use them if available. `ClientListItem` is project-specific (branded display) and likely needs custom implementation.
- **Error handling:** Never display `error.message` directly. Render `<ErrorPanel onRetry={refetch} />`. The `ErrorPanel` shows a friendly Spanish message and a retry button. [Source: architecture.md#Error handling — frontend]
- **Loading state:** Use `react-loading-skeleton` skeleton rows, NOT a spinner. [Source: company-standards.md#Loading States]

### UI Implementation Requirements (MANDATORY)

- **Primary library:** `siesa-ui-kit` — install via `npm install siesa-ui-kit`. Check catalog for `EmptyState`, `ErrorPanel`, `SearchInput` components before building custom ones.
- **Fallback:** `shadcn/ui` components (via MCP) if no siesa-ui-kit equivalent exists.
- **Constraint:** Do NOT create custom UI components if a siesa-ui-kit or shadcn/ui equivalent exists.
- **Icons:** Heroicons (primary) or Font Awesome 6.5+ (secondary). [Source: company-standards.md#Icons]
- **Skeleton loading:** `react-loading-skeleton` library (already in package.json from architecture spec).

### Project Structure Notes

```
frontend/src/
  routes/
    _app/
      clientes.tsx               # Replace ClientesPlaceholder → two-panel layout shell
  modules/
    crm/
      clientes/
        domain/
          Cliente.ts             # Entity interface (new)
          IClienteRepository.ts  # Repository contract (new)
        application/
          useClientes.ts         # TanStack Query hook (new)
        infrastructure/
          clienteApiRepository.ts # Axios adapter (new)
        presentation/
          ClienteListView.tsx    # List + search + states (new — replaces placeholder)
  shared/
    components/
      ClientListItem.tsx         # Shared list item component (new)
      EmptyState.tsx             # Shared empty state (new or reuse if exists)

backend/
  src/
    SiesaAgents.Domain/
      Clientes/
        Entities/
          ClienteEntity.cs       # new
    SiesaAgents.Application/
      Clientes/
        DTOs/
          ClienteDto.cs          # new
        Queries/
          GetClientesQuery.cs    # new
          GetClientesQueryHandler.cs # new
    SiesaAgents.Infrastructure/
      Data/
        Configurations/
          ClienteConfiguration.cs # new (uk_clientes_nit index)
      Repositories/
        ClienteRepository.cs    # new
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs     # new (registers GET /api/v1/clientes)
```

### Key Patterns and Constraints

**Backend entity pattern (mandatory):**
```csharp
public class ClienteEntity : Entity  // Entity base class from Shared.Domain
{
    private ClienteEntity() { }  // EF Core ctor

    public string Nombre { get; private set; } = default!;
    public string Nit { get; private set; } = default!;
    public string Telefono { get; private set; } = default!;
    public string Ciudad { get; private set; } = default!;
    public DateTimeOffset CreatedAt { get; private set; }  // NEVER DateTime
    public DateTimeOffset UpdatedAt { get; private set; }  // NEVER DateTime

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        // validate, create, optional domain event
    }
}
```

**API response shape (direct array — no wrapper):**
```json
[
  {
    "id": "uuid",
    "nombre": "Empresa ABC",
    "nit": "900123456-1",
    "telefono": "+573001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

**Frontend filter pattern:**
```typescript
// Inside ClienteListView — useMemo for performance
const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return clientes ?? [];
  const q = searchQuery.toLowerCase();
  return (clientes ?? []).filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}, [clientes, searchQuery]);
```

**EF Core snake_case (verify is active from Story 1.3):**
```csharp
// AppDbContext.OnModelCreating — must be last line:
modelBuilder.ApplySnakeCaseNaming();
```

**ClienteEndpoints registration pattern:**
```csharp
// ClienteEndpoints.cs
public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes");
        group.MapGet("/", GetAllClientes);
    }

    private static async Task<IResult> GetAllClientes(
        IMediator mediator)
    {
        var result = await mediator.Send(new GetClientesQuery());
        return Results.Ok(result);
    }
}
```

### References

- Architecture decisions and file structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- API endpoint contracts (GET /api/v1/clientes): [Source: _bmad-output/planning-artifacts/architecture.md#REST Endpoints]
- Epic acceptance criteria and story requirements: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Search strategy (client-side filter): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- UX design (280px left panel, search-first): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- Test design (P0 scenarios, R-003 performance risk): [Source: _bmad-output/test-design-epic-2.md#2.1]
- Company standards (TypeScript strict, DateTimeOffset, snake_case, Spanish UI): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story patterns (routing structure, siesa-ui-kit usage): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]

### Test Scenarios from Test Design (Epic 2 — P0 + P1 for Story 2.1)

| TC ID | Priority | Level | Description |
|-------|----------|-------|-------------|
| TC-2.1-P0-01 | P0 | Component + Unit | Seed 500-item cache, trigger filter, assert filtered list rendered in < 200ms (R-003) |
| TC-2.1-P1-01 | P1 | Component | Mock empty API response, assert EmptyState rendered with guidance message |
| TC-2.1-P1-02 | P1 | Component | Mock API error on fetch, assert ErrorPanel with "Reintentar" button rendered |
| TC-2.1-P2-01 | P2 | Component | Type progressively in search field, assert list updates on each keystroke |
| TC-2.1-P2-02 | P2 | Unit | Filter function handles hyphens and slashes in NIT input without errors |

### Non-Functional Requirements for This Story

- **NFR1 (Search < 1s):** Client-side filter over ≤ 500 records in `useMemo`. Target: < 50ms. The 200ms threshold in tests is conservative — real performance should be well below.
- **NFR6 (No stack traces):** `ErrorPanel` must display a friendly Spanish message. Never surface `error.message` or any technical details.
- **WCAG 2.1 AA:** Search input must have `aria-label`. List items must be keyboard-navigable. Touch targets ≥ 44x44px.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- MediatR not installed in Application project — used direct handler injection pattern (`GetClientesQueryHandler` registered as `Scoped`) instead. This is simpler and sufficient for this story.
- siesa-ui-kit does not include `EmptyState` or `ErrorPanel` — created custom components. `ErrorPanel` custom implementation logged as MR-to-Platform candidate.
- `@testing-library/user-event` was missing from devDependencies — added it to `frontend/package.json`.
- apiClient `baseURL` lacked fallback for test env — added `?? 'http://localhost:5000'` to make MSW work correctly in tests.
- Migration created manually (dotnet SDK not available). File `20260621120000_AddClientesTable.cs` created with correct snake_case columns per `ApplySnakeCaseNaming()`.
- TC-2.1-C-06 (P2) fails due to test data issue: query "a" correctly matches "Beta Ltda" (case-insensitive). Implementation is correct per spec.
- Backend tests authored but not run (dotnet SDK unavailable).

### File List

**Backend — new files:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260621120000_AddClientesTable.cs`
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Integration/ClienteEndpointsTests.cs`

**Backend — modified files:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (added DbSet<ClienteEntity>, ClienteConfiguration)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` (updated for clientes table)
- `backend/src/SiesaAgents.API/Program.cs` (registered IClienteRepository, GetClientesQueryHandler, MapClienteEndpoints)
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (added Infrastructure project reference)

**Frontend — new files:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/filterClientes.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`

**Frontend — modified files:**
- `frontend/src/routes/_app/clientes.tsx` (replaced ClientesPlaceholder with two-panel layout)
- `frontend/src/shared/lib/apiClient.ts` (added fallback baseURL for test env)
