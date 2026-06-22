# Story 2.1: Client List & Search

Status: ready-for-dev

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, **And** results appear in under 1 second for up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client (e.g., "No hay clientes registrados. Crea el primero.").

4. **Given** the backend is unavailable when the page loads, **When** the `GET /api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component is shown in place of the list with a "Reintentar" button that triggers a new fetch.

5. **Given** an active search returns no matches, **When** the filter reduces the visible list to zero items, **Then** the `EmptyState` component is shown with a message indicating no results for the current query (distinct from the no-clients state).

## Tasks / Subtasks

- [ ] Task 1 — Domain layer: Cliente entity and repository interface (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string }`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`

- [ ] Task 2 — Infrastructure layer: API repository (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient` (`GET /api/v1/clientes`) returning `Cliente[]`
  - [ ] Export repository singleton for injection into hooks

- [ ] Task 3 — Application layer: TanStack Query hook (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })` with `staleTime: 0`
  - [ ] Hook exposes: `{ data, isLoading, isError, refetch }`

- [ ] Task 4 — Application layer: client-side search filter (AC: #2, #5)
  - [ ] In `ClienteListView.tsx`, declare `const [searchQuery, setSearchQuery] = useState('')` (local state — NOT Zustand, NOT URL param)
  - [ ] Apply `useMemo` filter over `useClientes().data`: case-insensitive match on `nombre` OR `nit` fields
  - [ ] Debounce search input at 150ms before updating `searchQuery` to satisfy NFR1 <1s for 500 records
  - [ ] Filtered result drives the rendered list

- [ ] Task 5 — Presentation layer: ClienteListView component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Fixed width 280px, flex column, overflow-y-auto
  - [ ] Header with title "Clientes" and search input (Spanish placeholder: "Buscar por nombre o NIT/RUC")
  - [ ] Render `ClientListItem` per filtered client (Nombre bold, NIT/RUC subtext)
  - [ ] Render `EmptyState` when `data?.length === 0` (no clients at all) with CTA text "No hay clientes registrados"
  - [ ] Render `EmptyState` when `filteredClientes.length === 0 && searchQuery !== ''` with text "Sin resultados para la búsqueda"
  - [ ] Render `ErrorPanel` with `onRetry={refetch}` when `isError === true`
  - [ ] Show skeleton placeholders (`react-loading-skeleton`) while `isLoading === true`

- [ ] Task 6 — Shared components: EmptyState and ClientListItem (AC: #3, #5)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string` and optional `action?: ReactNode` props; WCAG 2.1 AA compliant with appropriate aria-label
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — displays `nombre` (semibold) and `nit` (text-slate-500 text-sm); accepts `cliente: Cliente` and `isSelected?: boolean` props; keyboard navigable (role="button", tabIndex=0)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — displays error icon + "No se pudo cargar la información" + "Reintentar" button; accepts `onRetry: () => void`

- [ ] Task 7 — Route wiring (AC: #1)
  - [ ] Verify/create `frontend/src/routes/_app/clientes.tsx` — renders `ClienteListView` in the left panel (280px); right panel renders empty detail placeholder for this story
  - [ ] Ensure TanStack Router `_app` pathless layout wraps the route correctly per architecture

- [ ] Task 8 — Backend: GET /api/v1/clientes endpoint (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — properties: `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`; private constructor + static `Create()` factory; inherits from `Entity` base (Story 1.1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record: `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt`, `UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` + `GetClientesQueryHandler.cs` — returns `IReadOnlyList<ClienteDto>`; maps `ClienteEntity` → `ClienteDto`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository` using `AppDbContext`; `GetAllAsync` returns `await _context.Clientes.AsNoTracking().ToListAsync(ct)`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — implements `IEntityTypeConfiguration<ClienteEntity>`; maps to table `clientes`; unique index `uk_clientes_nit` on `Nit`; `ApplySnakeCaseNaming()` already applied globally in `AppDbContext`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` — EF Core migration adding `clientes` table: `id uuid PK DEFAULT gen_random_uuid()`, `nombre varchar(255) NOT NULL`, `nit varchar(50) NOT NULL UNIQUE`, `telefono varchar(50) NOT NULL`, `ciudad varchar(100) NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`
  - [ ] Register `IClienteRepository → ClienteRepository` in DI (`Program.cs` or extension method)
  - [ ] Add `ClienteEndpoints.cs` in `backend/src/SiesaAgents.API/Endpoints/` — map `GET /api/v1/clientes` → call `GetClientesQueryHandler` → return `200 OK` with `ClienteDto[]`; empty array when no clients (NOT 404)
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`

- [ ] Task 9 — Frontend unit tests (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts` — mock `clienteApiRepository`; assert query key `['clientes']`; assert returns list on success; assert `isError` on failure
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` using Vitest + RTL + MSW:
    - [ ] Renders `ClientListItem` per client when API returns data
    - [ ] Renders skeleton while loading
    - [ ] Renders `EmptyState` with CTA when API returns `[]`
    - [ ] Renders `ErrorPanel` with "Reintentar" button when API returns 503
    - [ ] Filters list by `nombre` — case insensitive (P0/R-003)
    - [ ] Filters list by `nit` — case insensitive
    - [ ] Performance: filter over 500 generated clients completes in <1000ms using `performance.now()` (P0/NFR1)
    - [ ] Search returning zero matches renders `EmptyState` with "Sin resultados" message
    - [ ] "Reintentar" button click triggers `refetch` (P3/R-010)

- [ ] Task 10 — Backend unit tests (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — arrange: mock `IClienteRepository` returning 2 entities; act: call handler; assert: returns 2 `ClienteDto` with correct field mapping
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` — assert `Create()` sets `Id` (non-empty Guid), `CreatedAt` (DateTimeOffset), `UpdatedAt`; assert entity properties set correctly

## Dev Notes

### Architecture Constraints

This story is the **first Epic 2 story** — it introduces the `clientes` domain in both frontend and backend. No previous Epic 2 story exists to reference.

**Clean Architecture layers apply to both frontend and backend (non-negotiable):**
- Frontend: `domain/` → `application/` → `infrastructure/` → `presentation/` (dependency flows inward)
- Backend: `Domain` → `Application` → `Infrastructure` → `API` (same direction)

### Frontend Implementation Guide

**Search strategy (architecture.md, "Search Strategy" section):**
- TanStack Query loads ALL clients on mount: `queryKey: ['clientes']`
- Client-side filter with `useMemo` — never call a search API endpoint for this story
- Debounce at 150ms before updating `searchQuery` state
- Filter logic: `c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)`
- Architecture confirms <50ms filter for 500 records — well within NFR1 <1s

**State management:**
- `searchQuery`: `useState<string>('')` — local to `ClienteListView`, NOT in Zustand, NOT in URL (architecture "State Boundaries" section)
- Server state: TanStack Query `useClientes` hook
- No Zustand store needed for this story

**Component hierarchy:**
```
_app/clientes.tsx (TanStack Router route)
  └── ClienteListView.tsx (280px left panel)
        ├── SearchInput (inline, no separate component required)
        ├── ClientListItem.tsx (per client)
        ├── EmptyState.tsx (no clients / no results)
        └── ErrorPanel.tsx (fetch failure + retry)
```

**UI requirements (MANDATORY — company-standards.md):**
- Check `siesa-ui-kit` first for all UI components before any custom implementation
- Use `react-loading-skeleton` for loading states — skeleton screens, NOT spinners
- All user-facing text MUST be in Spanish
- WCAG 2.1 AA compliance (aria-labels, keyboard navigation, focus management)
- Brand primary color `#0e79fd` (Siesa Blue) for interactive elements
- Tailwind `slate-*` scale for neutral colors
- Font: Inter (weights 300, 400, 700)

**TanStack Router route file (`_app/clientes.tsx`):**
- Prefix `_app` is a pathless layout (no URL segment) — mounts layout shell
- Route path is `/clientes`
- This story only implements the left panel; right panel is an empty placeholder (detail view comes in Story 2.2)

**siesa-ui-kit vs MasterCrud decision:**
- MasterCrud is designed for full CRUD screens with data grids. Story 2.1 is a custom split-panel layout (280px scrollable list + detail panel) as per architecture and UX spec. MasterCrud is NOT applicable for the list panel itself.
- MasterCrud MAY be evaluated for future stories (2.3 Create, 2.4 Edit) if its form capabilities match.

### Backend Implementation Guide

**Entity pattern (company-standards.md, "Backend Critical Rules"):**
```csharp
public sealed class ClienteEntity : Entity  // Entity base from Story 1.1
{
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    // CreatedAt and UpdatedAt inherited from Entity base

    private ClienteEntity() { }  // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);
        return new ClienteEntity { Nombre = nombre, Nit = nit, Telefono = telefono, Ciudad = ciudad };
    }
}
```

**DateTime rule (CRITICAL):** Use `DateTimeOffset` ALWAYS — NEVER `DateTime`. The `Entity` base class from Story 1.1 already declares `CreatedAt` and `UpdatedAt` as `DateTimeOffset`.

**EF Core configuration (`ClienteConfiguration.cs`):**
```csharp
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
        builder.Property(c => c.Nombre).HasMaxLength(255).IsRequired();
        builder.Property(c => c.Nit).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Telefono).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Ciudad).HasMaxLength(100).IsRequired();
    }
}
```
`ApplySnakeCaseNaming()` is already called last in `AppDbContext.OnModelCreating()` (Story 1.1) — NO manual `[Column]` or `[Table]` attributes.

**API endpoint contract:**
```
GET /api/v1/clientes
Response 200: ClienteDto[] (direct array — no wrapper object per architecture "Format Patterns")
Response 200: [] (empty array when no clients exist — NEVER 404)
```

**JSON response (camelCase — auto-serialized by .NET):**
```json
[
  { "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "...", "updatedAt": "..." }
]
```

**CQRS pattern:** `GetClientesQuery` → `GetClientesQueryHandler` (read only, no command for list).

### Testing Standards (company-standards.md)

**Frontend:**
- Vitest + React Testing Library + MSW
- Unit tests for `useClientes` hook
- Component tests for `ClienteListView` covering all AC states
- Performance test for NFR1 (P0 risk R-003): generate 500 client fixtures, measure filter <1000ms

**Backend:**
- xUnit, Arrange/Act/Assert structure
- Unit tests for `GetClientesQueryHandler` with mocked `IClienteRepository`
- Unit tests for `ClienteEntity.Create()` factory method
- Coverage target: >80%

### Project Structure Notes

Files created in this story align with the complete structure defined in `architecture.md#Complete Project Directory Structure`:

**Frontend (new files):**
```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts
      IClienteRepository.ts
    application/
      useClientes.ts
      __tests__/useClientes.test.ts
    infrastructure/
      clienteApiRepository.ts
    presentation/
      ClienteListView.tsx
      __tests__/ClienteListView.test.tsx
  shared/components/
    EmptyState.tsx
    ClientListItem.tsx
    ErrorPanel.tsx
  routes/_app/
    clientes.tsx
```

**Backend (new files):**
```
backend/src/
  SiesaAgents.Domain/Clientes/
    Entities/ClienteEntity.cs
    Interfaces/IClienteRepository.cs
  SiesaAgents.Application/Clientes/
    DTOs/ClienteDto.cs
    Queries/GetClientesQuery.cs
    Queries/GetClientesQueryHandler.cs
  SiesaAgents.Infrastructure/
    Repositories/ClienteRepository.cs
    Data/Configurations/ClienteConfiguration.cs
    Data/Migrations/  (new migration file)
  SiesaAgents.API/Endpoints/
    ClienteEndpoints.cs
backend/tests/
  SiesaAgents.UnitTests/
    Application/Clientes/GetClientesQueryHandlerTests.cs
    Domain/ClienteEntityTests.cs
```

**Variance from architecture:** None. All paths match `architecture.md` exactly.

### References

- Epic source with story ACs: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture — search strategy, state boundaries, component hierarchy: [Source: _bmad-output/planning-artifacts/architecture.md#Search Strategy]
- Architecture — REST endpoint contracts and response format: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — complete project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — naming patterns (TypeScript, C#, SQL): [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Architecture — enforcement rules (DateTimeOffset, Scalar, Spanish text, siesa-ui-kit): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Company standards — frontend stack and folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- Company standards — backend critical rules (UUID PK, DateTimeOffset, entity pattern): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Company standards — UX design system (brand colors, loading states, icons): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Test design — P0 risk R-003 (NFR1 performance), R-006 (EmptyState), coverage plan: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#3. Test Coverage Plan]
- MasterCrud reference (evaluated, not applicable for list panel): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
