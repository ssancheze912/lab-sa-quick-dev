# Story 2.1: Client List & Search

Status: ready

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px) renders a scrollable list of all clients, each item showing Nombre and NIT/RUC.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, with results appearing in under 1 second for up to 500 records (NFR1), and no additional API call is triggered.

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create their first client, and no list items are rendered.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, and clicking "Reintentar" triggers a re-fetch.

5. **Given** the client list is loaded, **When** the user clears the search field after filtering, **Then** all clients are visible again.

## Tasks / Subtasks

- [ ] Task 1 — Define domain entity and repository interface for Cliente (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — export `Cliente` interface with fields: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — export `IClienteRepository` interface with `getAll(): Promise<Cliente[]>`

- [ ] Task 2 — Implement API repository (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient` (Axios instance at `src/shared/lib/apiClient.ts`); `getAll()` calls `GET /api/v1/clientes` and returns `Cliente[]`

- [ ] Task 3 — Create `useClientes` hook (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — uses `useQuery` from TanStack Query with `queryKey: ['clientes']`; calls `clienteApiRepository.getAll()`; returns `{ data, isLoading, isError, refetch }`
  - [ ] Hook does NOT expose raw `error.message` — callers use `isError` flag only

- [ ] Task 4 — Create `ClienteListPanel` presentation component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [ ] Renders the 280px-wide scrollable left panel using TailwindCSS v4
  - [ ] Uses `useClientes` hook to load data
  - [ ] While loading: render skeleton placeholders using `react-loading-skeleton` (NOT a spinner)
  - [ ] On error: render `<ErrorPanel onRetry={refetch} />` with "Reintentar" button (AC #4)
  - [ ] When data is empty array: render `<EmptyState />` with guiding message in Spanish (AC #3)
  - [ ] When data has items: render a scrollable list; each item shows `nombre` and `nit` (AC #1)
  - [ ] Include a `<input>` search field above the list with placeholder "Buscar por nombre o NIT/RUC..."
  - [ ] Filter logic: `useState<string>('')` for `searchQuery`; `useMemo` to filter by `nombre` or `nit` (case-insensitive); applied to the cached array — no new API call (AC #2, NFR1)
  - [ ] Each list item is clickable (stub handler for Story 2.2 integration); apply `aria-current="true"` on selected item
  - [ ] All user-facing text in Spanish

- [ ] Task 5 — Create shared `EmptyState` and `ErrorPanel` components (AC: #3, #4)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string` prop; renders the message and an optional `action` slot; accessible with `role="status"`
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void` prop; renders an error message in Spanish and a button labeled exactly "Reintentar"; accessible with `role="alert"`

- [ ] Task 6 — Update `/clientes` route to render `ClienteListPanel` (AC: #1–#5)
  - [ ] Replace the placeholder content in `frontend/src/routes/_app/clientes.tsx` with `<ClienteListPanel />`
  - [ ] Wrap in the split-panel layout shell (left panel 280px, right panel flex-1); right panel renders an empty placeholder for Story 2.2 detail view

- [ ] Task 7 — Backend: Define `ClienteEntity` domain entity (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Extends `Entity` base class (Guid PK, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`)
  - [ ] Properties: `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad` — all with `private set`
  - [ ] Private parameterless constructor + static `Create(string nombre, string nit, string telefono, string ciudad): ClienteEntity` factory method
  - [ ] `Update(string nombre, string nit, string telefono, string ciudad)` method for Story 2.4
  - [ ] NO `DateTime` — use `DateTimeOffset` exclusively

- [ ] Task 8 — Backend: Define `IClienteRepository` interface (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Methods: `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)`, `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`, `Task AddAsync(ClienteEntity cliente, CancellationToken ct)`, `Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)`, `Task DeleteAsync(Guid id, CancellationToken ct)`

- [ ] Task 9 — Backend: EF Core configuration and migration for `clientes` table (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — implements `IEntityTypeConfiguration<ClienteEntity>`
  - [ ] Map to table `clientes` (snake_case via `UseSnakeCaseNamingConvention` — no manual attribute needed)
  - [ ] Configure `uk_clientes_nit` unique index: `.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
  - [ ] Apply `modelBuilder.ApplyConfigurationsFromAssembly(...)` already configured in `AppDbContext.OnModelCreating`
  - [ ] Create EF Core migration: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [ ] Run `dotnet ef database update` to apply migration to `siesa_agents_db`

- [ ] Task 10 — Backend: DTO, Query, and Handler for listing clients (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — empty record query marker
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — calls `IClienteRepository.GetAllAsync()` and maps to `IEnumerable<ClienteDto>`

- [ ] Task 11 — Backend: `ClienteRepository` infrastructure implementation (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
  - [ ] Implements `IClienteRepository`; injected `AppDbContext`
  - [ ] `GetAllAsync`: `return await _context.Clientes.AsNoTracking().ToListAsync(ct)`
  - [ ] `GetByIdAsync`: `return await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)`
  - [ ] `AddAsync`: `await _context.Clientes.AddAsync(cliente, ct)`
  - [ ] `UpdateAsync`: `_context.Clientes.Update(cliente)`
  - [ ] `DeleteAsync`: find entity, `_context.Clientes.Remove(entity)`
  - [ ] Register `IClienteRepository → ClienteRepository` in DI in `Program.cs`

- [ ] Task 12 — Backend: `ClienteEndpoints` — GET /api/v1/clientes (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Register `GET /api/v1/clientes` endpoint (Minimal API — NO controllers)
  - [ ] Handler calls `GetClientesQueryHandler` and returns `Results.Ok(dtos)`
  - [ ] Register endpoint group in `Program.cs` via `app.MapClienteEndpoints()`
  - [ ] Response shape: direct JSON array (no wrapper), HTTP 200

- [ ] Task 13 — Unit tests: frontend (AC: #1–#5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
    - Test: `useClientes` returns data from MSW mock `GET /api/v1/clientes` → 3 clients
    - Test: `useClientes` sets `isError=true` on network failure
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx` (covers TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-04, TC-E2-P1-05, TC-E2-P2-06 from test design)
    - Test: renders 3 client items (Nombre + NIT visible per item) when API returns data
    - Test: renders `EmptyState` when API returns empty array
    - Test: renders `ErrorPanel` with "Reintentar" button on network error; clicking retries
    - Test: search by Nombre filters list client-side (no extra API call)
    - Test: search by NIT/RUC filters list client-side; clearing restores full list
    - Test: filter over 500 mock records completes in < 1000ms (NFR1)

- [ ] Task 14 — Backend integration test: GET /api/v1/clientes (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - Test: `GetClientesQueryHandler` returns empty list when no clients
    - Test: `GetClientesQueryHandler` maps entity fields to DTO fields correctly
  - [ ] Add API integration test in `backend/tests/SiesaAgents.UnitTests/` (or a new IntegrationTests project if not yet created) covering TC-E2-P1-17: `GET /api/v1/clientes` → 200 with correct shape

## Dev Notes

### Architecture Patterns

This story implements the **data display layer** for the client list using the Clean Architecture module pattern established in `architecture.md`. The frontend module is `src/modules/crm/clientes/` with the four canonical layers: `domain/`, `application/`, `infrastructure/`, `presentation/`.

**Client-side filter strategy (NFR1):**

```typescript
// ClienteListPanel.tsx — filter/sort applied over TanStack Query cache
const { data: clientes = [], isLoading, isError, refetch } = useClientes()
const [searchQuery, setSearchQuery] = useState('')

const filtered = useMemo(() => {
  if (!searchQuery.trim()) return clientes
  const q = searchQuery.toLowerCase()
  return clientes.filter(
    c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  )
}, [clientes, searchQuery])
```

No debounce is required at this scale (≤ 500 records). Filter runs synchronously in `useMemo` — stays under 50ms as confirmed in `architecture.md` data flow diagram.

**Split panel layout (route level):**

```tsx
// frontend/src/routes/_app/clientes.tsx
export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex h-full">
      <div className="w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 dark:border-slate-700">
        <ClienteListPanel />
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Right panel — detail view wired in Story 2.2 */}
        <Outlet />
      </div>
    </div>
  )
}
```

**TanStack Query key (canonical):**

```typescript
// useClientes.ts
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  })
}
```

### Backend Stack Details

- **Entity pattern** — private constructor + static `Create()` factory; no public setters:
  ```csharp
  public class ClienteEntity : Entity
  {
      public string Nombre { get; private set; } = string.Empty;
      public string Nit    { get; private set; } = string.Empty;
      public string Telefono { get; private set; } = string.Empty;
      public string Ciudad { get; private set; } = string.Empty;

      private ClienteEntity() { }

      public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
      {
          ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
          ArgumentException.ThrowIfNullOrWhiteSpace(nit);
          ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
          ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);
          return new ClienteEntity { Nombre = nombre, Nit = nit, Telefono = telefono, Ciudad = ciudad };
      }

      public void Update(string nombre, string nit, string telefono, string ciudad)
      {
          Nombre = nombre; Nit = nit; Telefono = telefono; Ciudad = ciudad;
          UpdatedAt = DateTimeOffset.UtcNow;
      }
  }
  ```
- **Primary keys**: `Guid` (inherited from `Entity` base — `public Guid Id { get; protected set; } = Guid.NewGuid()`)
- **Timestamps**: `DateTimeOffset` — NEVER `DateTime`
- **EF Core snake_case**: applied via `modelBuilder.UseSnakeCaseNamingConvention()` already configured in `AppDbContext.OnModelCreating`. No manual `[Column]` or `[Table]` attributes.
- **Unique constraint naming**: `uk_clientes_nit` per database conventions (`uk_{table}_{column}`)
- **Minimal API endpoint pattern**:
  ```csharp
  // ClienteEndpoints.cs
  public static class ClienteEndpoints
  {
      public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
      {
          var group = app.MapGroup("/api/v1/clientes");
          group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
              Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)));
          return app;
      }
  }
  ```
- **API response shape** for GET list: direct JSON array, HTTP 200 — no wrapper object
- **`DateTimeOffset` serialization**: ISO 8601 with timezone — `"2026-05-23T10:30:00Z"` via .NET default JSON serializer

### UI Implementation Requirements

- **Component library check order**: siesa-ui-kit first → shadcn/ui → custom. For `EmptyState` and `ErrorPanel`, build custom components if not present in siesa-ui-kit catalog (check catalog before building).
- **Loading skeletons**: `react-loading-skeleton` — render 3 skeleton rows at the list width while `isLoading === true`
- **Brand colors**: active/selected list item uses `#0e79fd` (Siesa Blue); list background `white` / `dark:slate-900`; border `slate-200` / `dark:slate-700`
- **All user-facing text in Spanish**: button labels, placeholders, error messages, ARIA labels
- **WCAG 2.1 AA**: search input has `aria-label="Buscar clientes"`; list has `role="list"`; each item has `role="listitem"`; error panel has `role="alert"`; empty state has `role="status"`

### Split-Panel Layout Context

The `/clientes` route already exists as a placeholder from Story 1.2 (`frontend/src/routes/_app/clientes.tsx`). This story replaces its placeholder content with the real split-panel layout. Story 2.2 will add the right-panel detail view; until then, the right panel renders empty / a placeholder.

The left panel is exactly 280px wide per the architecture spec and the UX design specification (split-panel Direction F). It must not flex or shrink.

### Previous Story Learnings (from Epic 1)

- **Package manager**: `pnpm` exclusively — never `npm` or `yarn`
- **siesa-ui-kit**: private registry may be unavailable; build custom components as fallback if needed
- **TypeScript strict mode**: `"strict": true` in `tsconfig.app.json` — no `any` types allowed; use `Cliente[]` not `any[]`
- **TailwindCSS v4**: use `@import "tailwindcss"` in `src/style.css`; utility classes directly in JSX
- **`routeTree.gen.ts`**: auto-generated by `@tanstack/router-plugin` on build — do NOT edit manually
- **dotnet SDK**: may not be available in sandbox; create migration files manually if needed, noting for developer to run `dotnet ef database update`
- **All user-facing text in Spanish**: verified by code-review in Story 1.2

### Project Structure — Files for This Story

**Frontend — new files:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`

**Frontend — modified files:**
- `frontend/src/routes/_app/clientes.tsx` — replace placeholder with split-panel layout + `<ClienteListPanel />`

**Backend — new files:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/{timestamp}_AddClientesTable.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

**Backend — modified files:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — add `DbSet<ClienteEntity> Clientes`
- `backend/src/SiesaAgents.API/Program.cs` — register `IClienteRepository → ClienteRepository` + `app.MapClienteEndpoints()`

### References

- Epic source and story acceptance criteria: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Frontend module structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Complete project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Client-side filter strategy + query keys: [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Diagram]
- Backend Clean Architecture layers: [Source: _bmad-output/planning-artifacts/architecture.md#Backend folder structure]
- Entity pattern (private constructor + UUID + DateTimeOffset): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Database conventions (snake_case, uk_ prefix): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Minimal API endpoint pattern (NO controllers): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- API response shapes (direct array, Problem Details): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- TanStack Query mandatory invalidation pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- UI component selection order (siesa-ui-kit → shadcn → custom): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Loading skeletons (react-loading-skeleton, not spinners): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- Brand colors (Siesa Blue #0e79fd, slate neutrals): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Test cases for this story: TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-04, TC-E2-P1-05, TC-E2-P2-06: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Previous story learnings: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#Completion Notes List]
- NFR1 (search < 1s / 500 records): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md]
- FR2 (scrollable client list), FR3 (search by name), FR4 (search by NIT/RUC): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

(to be filled by dev agent)

### Completion Notes List

(to be filled by dev agent)

### File List

(to be filled by dev agent)
