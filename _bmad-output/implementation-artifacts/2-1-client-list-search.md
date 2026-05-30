# Story 2.1: Client List & Search

Status: done

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system **When** the user navigates to `/clientes` **Then** the left panel (280px fixed width) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded **When** the user types in the search field **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive, Unicode-normalized) **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system **When** the user navigates to `/clientes` **Then** an `EmptyState` component is displayed with a Spanish message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads **When** the fetch fails **Then** an `ErrorPanel` component is displayed with a "Reintentar" button instead of the list, and clicking "Reintentar" calls `refetch()` from TanStack Query.

5. **Given** the client list is loaded **When** `GET /api/v1/clientes` is called **Then** it returns a direct JSON array (not wrapped in an object), and each item contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

## Tasks / Subtasks

### Backend

- [ ] Task 1 — Create `ClienteEntity` in Domain layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Fields: `Guid Id`, `string Nombre`, `string NIT`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory method
  - [ ] `Id = Guid.NewGuid()`, `CreatedAt = DateTimeOffset.UtcNow`, `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] NEVER use `DateTime` — always `DateTimeOffset`

- [ ] Task 2 — Create `IClienteRepository` interface in Domain layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Methods: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)`, `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`

- [ ] Task 3 — Create `ClienteDto` in Application layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
  - [ ] Properties: `Guid Id`, `string Nombre`, `string NIT`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`

- [ ] Task 4 — Create `GetClientesQuery` + Handler in Application layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (record)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
  - [ ] Handler calls `IClienteRepository.GetAllAsync()` and maps entities to `ClienteDto` list
  - [ ] Return type: `IReadOnlyList<ClienteDto>`

- [ ] Task 5 — Create `ClienteConfiguration` in Infrastructure layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
  - [ ] Implement `IEntityTypeConfiguration<ClienteEntity>`
  - [ ] Configure: `HasKey(x => x.Id)`, `Property(x => x.NIT).HasMaxLength(50).IsRequired()`, unique index `HasIndex(x => x.NIT).IsUnique().HasDatabaseName("uk_clientes_nit")`
  - [ ] `Property(x => x.Nombre).HasMaxLength(200).IsRequired()`
  - [ ] `Property(x => x.Telefono).HasMaxLength(50).IsRequired()`
  - [ ] `Property(x => x.Ciudad).HasMaxLength(100).IsRequired()`
  - [ ] `ApplySnakeCaseNaming()` is already applied in `AppDbContext.OnModelCreating` — NO manual `[Column]` attributes

- [ ] Task 6 — Add `DbSet<ClienteEntity>` to `AppDbContext` and create migration (AC: #5)
  - [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Add `public DbSet<ClienteEntity> Clientes { get; set; }`
  - [ ] Register `ClienteConfiguration` via `modelBuilder.ApplyConfigurationsFromAssembly` (already set up)
  - [ ] Create EF Core migration: `dotnet ef migrations add AddClienteEntity --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
  - [ ] Apply migration: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`

- [ ] Task 7 — Create `ClienteRepository` in Infrastructure layer (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
  - [ ] Implement `IClienteRepository`
  - [ ] `GetAllAsync`: `return await _context.Clientes.AsNoTracking().ToListAsync(ct)`
  - [ ] `GetByIdAsync`: `return await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)`

- [ ] Task 8 — Register services in `Program.cs` (AC: #5)
  - [ ] Register `IClienteRepository` → `ClienteRepository` (scoped)
  - [ ] Register `GetClientesQueryHandler` (scoped) or use MediatR pattern if already wired
  - [ ] Add `builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly())` if not already registered

- [ ] Task 9 — Create `ClienteEndpoints.cs` with `GET /api/v1/clientes` (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Map: `app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) => Results.Ok(await handler.Handle(new GetClientesQuery(), ct)))`
  - [ ] Response: direct JSON array — no wrapper object (per architecture.md format pattern)
  - [ ] Register via `app.MapClienteEndpoints()` extension method in `Program.cs`

- [ ] Task 10 — Backend unit test: `GetClientesQueryHandler` (AC: #5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
  - [ ] Test: empty repository → returns empty list
  - [ ] Test: repository with 3 clients → returns all 3 as `ClienteDto` with correct field mapping
  - [ ] Use NSubstitute/Moq for `IClienteRepository`
  - [ ] Structure: Arrange / Act / Assert

- [ ] Task 11 — Backend integration test: `GET /api/v1/clientes` (AC: #5)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`
  - [ ] TC-E2-P1-01: Seed 3 clients → `GET /api/v1/clientes` → 200, array length = 3, each item has `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`
  - [ ] Verify `id` is UUID (non-empty Guid)
  - [ ] Verify `createdAt` is ISO 8601 with timezone

### Frontend

- [ ] Task 12 — Create `Cliente` domain entity interface (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`
  - [ ] Interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string }`

- [ ] Task 13 — Create `IClienteRepository` interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [ ] Method: `getAll(): Promise<Cliente[]>`

- [ ] Task 14 — Create `clienteApiRepository` in Infrastructure layer (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Implement `IClienteRepository`
  - [ ] `getAll()`: calls `GET /api/v1/clientes` via `apiClient` (Axios singleton from `src/shared/lib/apiClient.ts`)
  - [ ] Returns `response.data` (direct array)

- [ ] Task 15 — Create `useClientes` hook in Application layer (AC: #1, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Use `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })`
  - [ ] Export: `{ data, isLoading, isError, refetch }`

- [ ] Task 16 — Create `filterClientes` pure utility function (AC: #2)
  - [ ] Inside `useClientes.ts` or a colocated `clienteFilter.ts`
  - [ ] Signature: `filterClientes(clientes: Cliente[], query: string): Cliente[]`
  - [ ] Normalize both query and fields using `String.prototype.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()`
  - [ ] Match against `nombre` and `nit` fields
  - [ ] Uses `useMemo` in the component — filter function itself is a pure function

- [ ] Task 17 — Create `ClienteListItem` shared component (AC: #1)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [ ] Props: `{ cliente: Cliente; isSelected?: boolean; onClick: () => void }`
  - [ ] Display: `nombre` (primary, bold) and `nit` (secondary, slate-500)
  - [ ] Selected state: `bg-primary-50 text-primary-700` (Siesa brand tokens per architecture.md)
  - [ ] ARIA: `role="button"`, `aria-current` when selected, Spanish `aria-label`
  - [ ] WCAG 2.1 AA compliant (min 44px touch target, focus ring)

- [ ] Task 18 — Create `EmptyState` shared component (AC: #3)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `{ message: string; description?: string }`
  - [ ] Icon: Heroicons `UsersIcon` in `slate-300` (large)
  - [ ] Text in Spanish: "No hay clientes registrados" / "Crea el primer cliente para comenzar"
  - [ ] Centered layout with `slate-100` background area

- [ ] Task 19 — Create `ErrorPanel` shared component (AC: #4)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `{ onRetry: () => void }`
  - [ ] Icon: Heroicons `ExclamationCircleIcon` in `red-400`
  - [ ] Text: "No se pudo cargar la información"
  - [ ] Button: "Reintentar" — calls `onRetry` prop
  - [ ] WCAG: button has `aria-label="Reintentar carga"`

- [ ] Task 20 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Layout: fixed 280px left panel, full height, `border-r border-slate-200`
  - [ ] Header: "Clientes" heading + search input
  - [ ] Search input: `placeholder="Buscar por nombre o NIT/RUC"`, `aria-label="Buscar clientes"`, debounce 150ms
  - [ ] Use `useClientes()` hook for data fetching
  - [ ] Use `useMemo` with `filterClientes(clientes, searchQuery)` for filtered list
  - [ ] `isLoading`: render skeleton placeholders via `react-loading-skeleton` (not a spinner per company standard)
  - [ ] `isError`: render `<ErrorPanel onRetry={refetch} />`
  - [ ] `data.length === 0 && !searchQuery`: render `<EmptyState>`
  - [ ] `filteredClientes.length === 0 && searchQuery`: render empty search result message ("Sin resultados para '[query]'")
  - [ ] Scrollable list area: `overflow-y-auto`
  - [ ] Each item: `<ClientListItem>` with `isSelected` based on URL param

- [ ] Task 21 — Update route `_app/clientes.tsx` to render `ClienteListView` (AC: #1)
  - [ ] Open `frontend/src/routes/_app/clientes.tsx`
  - [ ] Replace placeholder with layout: `ClienteListView` (280px left) + `<Outlet />` or detail placeholder (flex right)
  - [ ] Route still at `/clientes` — TanStack Router file-based (`_app/clientes.tsx`)
  - [ ] Create nested route `_app/clientes.$clienteId.tsx` as placeholder for Story 2.2 detail panel

- [ ] Task 22 — Frontend component tests (AC: #1–#4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
  - [ ] TC-E2-P1-07: filter by Nombre — "ana" matches "Ana García", hides "Pedro Pérez"; no extra API call
  - [ ] TC-E2-P1-08: filter by NIT — partial NIT matches only the correct client
  - [ ] TC-E2-P1-09: MSW returns `[]` → `EmptyState` renders
  - [ ] TC-E2-P1-10: MSW returns network error → `ErrorPanel` renders with "Reintentar" → click retriggers fetch
  - [ ] TC-E2-P1-16: 500 mock records → filter completes < 50ms
  - [ ] Use MSW 2+ handlers in `src/__mocks__/handlers/clientes.ts`
  - [ ] Wrap in `QueryClientProvider` + TanStack Router test utilities

- [ ] Task 23 — Frontend unit tests for filter function (AC: #2)
  - [ ] Create `frontend/src/modules/crm/clientes/application/clienteFilter.test.ts`
  - [ ] TC-E2-P1-17: assert filter("garcia") matches `{ nombre: "García López" }`, filter("GARCIA") matches, filter("900") matches on NIT, filter("xyz") returns no match
  - [ ] Test case-insensitive + accented character normalization

## Dev Notes

### Architecture Context

This story is **frontend-heavy** with backend foundation work. It introduces:
- `ClienteEntity` in the backend domain (first domain entity in the project)
- `GET /api/v1/clientes` endpoint (first REST endpoint)
- `ClienteListView` component (280px left panel)
- `useClientes` hook (TanStack Query over `['clientes']` key)
- `EmptyState` and `ErrorPanel` shared components
- `filterClientes` pure function with Unicode normalization (required for NFR1 + AC-E2.2)

**Story scope boundary:** This story creates the list, search, empty state and error state only. Detail view (panel right) is Story 2.2. Create/Edit/Delete forms are Stories 2.3–2.5. Sorting is Story 2.6. The nested route `_app/clientes.$clienteId.tsx` is created here as a placeholder (empty right panel) to support the split-panel URL structure defined in architecture.md.

### Backend Entity Pattern (MANDATORY)

```csharp
// ClienteEntity — ONLY pattern allowed per company standards
public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string NIT { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }   // NEVER DateTime
    public DateTimeOffset UpdatedAt { get; private set; }   // NEVER DateTime

    private ClienteEntity() { }  // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            NIT = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
```

### EF Core Configuration Pattern

```csharp
// ClienteConfiguration.cs
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
        builder.Property(x => x.NIT).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Telefono).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Ciudad).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.NIT).IsUnique().HasDatabaseName("uk_clientes_nit");
        // ApplySnakeCaseNaming() converts all to snake_case automatically — NO [Column] attributes
    }
}
```

### API Endpoint Pattern

```csharp
// ClienteEndpoints.cs — Minimal API, NO controllers
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new GetClientesQuery(), ct)));
        return app;
    }
}
// Response: direct JSON array, not { data: [], meta: {} }
```

### Frontend Hook Pattern (TanStack Query)

```typescript
// useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: clienteApiRepository.getAll,
  })
}
```

### Filter Function Pattern (NFR1 compliance)

```typescript
// filterClientes — MUST use Unicode normalization for accent-insensitive search
function normalize(str: string): string {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function filterClientes(clientes: Cliente[], query: string): Cliente[] {
  if (!query.trim()) return clientes
  const q = normalize(query)
  return clientes.filter(
    (c) => normalize(c.nombre).includes(q) || normalize(c.nit).includes(q)
  )
}
// Used in ClienteListView via useMemo:
// const filtered = useMemo(() => filterClientes(clientes ?? [], searchQuery), [clientes, searchQuery])
```

### ClienteListView Layout Pattern

```tsx
// ClienteListView.tsx — 280px fixed left panel per architecture.md
export function ClienteListView() {
  const { data: clientes, isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')
  const filtered = useMemo(() => filterClientes(clientes ?? [], searchQuery), [clientes, searchQuery])

  if (isLoading) return <ClienteListSkeleton />  // react-loading-skeleton, NOT a spinner
  if (isError) return <ErrorPanel onRetry={refetch} />

  return (
    <div className="w-[280px] shrink-0 h-full flex flex-col border-r border-slate-200">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Clientes</h2>
        <input
          type="search"
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2 w-full ..."
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !searchQuery
          ? <EmptyState message="No hay clientes registrados" description="Crea el primer cliente para comenzar" />
          : filtered.map((c) => <ClientListItem key={c.id} cliente={c} onClick={() => {/* navigate */}} />)
        }
      </div>
    </div>
  )
}
```

### UI Component Hierarchy (Company Standard: siesa-ui-kit first)

For this story, the required components (`EmptyState`, `ErrorPanel`, `ClientListItem`) are custom components — check `siesa-ui-kit` catalog first for any generic equivalents (e.g., an EmptyState primitive). If siesa-ui-kit provides an equivalent, use it. Otherwise build custom as specified.

- `siesa-ui-kit` is installed — verify import paths before assuming component names
- Heroicons for icons (`UsersIcon`, `ExclamationCircleIcon`)
- TailwindCSS v4 for styling — use `@import "tailwindcss"` in `src/index.css`, NOT `tailwind.config.js`
- Loading: `react-loading-skeleton` (skeleton screens, NOT spinners per company standard)

### UI Implementation Requirements (MANDATORY)

- **UI Library**: `siesa-ui-kit` (P0 — check catalog before creating any custom UI)
- **Fallback**: `shadcn/ui` (via MCP) then custom (last resort)
- All user-facing text MUST be in Spanish (labels, placeholders, ARIA labels, error messages)
- Code (variables, functions, TypeScript types) MUST be in English

### Database Table Result (After Migration)

```sql
-- Table: clientes (auto-generated by EF Core + ApplySnakeCaseNaming)
-- id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
-- nombre     VARCHAR(200) NOT NULL
-- nit        VARCHAR(50) NOT NULL
-- telefono   VARCHAR(50) NOT NULL
-- ciudad     VARCHAR(100) NOT NULL
-- created_at TIMESTAMPTZ NOT NULL
-- updated_at TIMESTAMPTZ NOT NULL
-- UNIQUE INDEX: uk_clientes_nit ON clientes(nit)
```

### State Management Rules

- `searchQuery`: local React `useState` — NOT Zustand (per architecture.md: "Client-side filter state (local React state, NO Zustand)")
- Server data: TanStack Query `['clientes']` — canonical query key for all client list consumers
- URL state: `selectedClienteId` synced with TanStack Router URL param (added in Story 2.2)
- No Zustand store needed for this story

### Testing Strategy for This Story (from test-design-epic-2.md)

Tests specifically required for Story 2.1:

| Test ID | Level | Focus |
|---------|-------|-------|
| TC-E2-P1-01 | API Integration | GET /api/v1/clientes → 200 + array |
| TC-E2-P1-07 | Component | Real-time filter by Nombre |
| TC-E2-P1-08 | Component | Real-time filter by NIT |
| TC-E2-P1-09 | Component | EmptyState on empty list |
| TC-E2-P1-10 | Component | ErrorPanel + Reintentar |
| TC-E2-P1-16 | Unit | Filter performance (500 records < 50ms) |
| TC-E2-P1-17 | Unit | Case-insensitive + Unicode normalization |

Framework: Vitest + React Testing Library + MSW 2+ (frontend), xUnit + WebApplicationFactory (backend)

### Previous Story Learnings

- Package manager is `pnpm` — NOT npm. All install commands use `pnpm add` / `pnpm add -D`
- `siesa-ui-kit/styles.css` must be imported in `main.tsx` (done in Story 1.1/1.2)
- `AppDbContext` is already configured with `ApplySnakeCaseNaming()` as the last call in `OnModelCreating` — do NOT add it again; just add `DbSet<ClienteEntity>` and apply `ClienteConfiguration`
- `ExceptionHandlingMiddleware` is registered first in the pipeline (Story 1.3) — all unhandled exceptions already return Problem Details RFC 7807
- Backend root is at `backend/`, frontend root is at `frontend/` — all paths are relative to their respective roots
- TanStack Router auto-generates `routeTree.gen.ts` — do NOT manually edit it
- TypeScript strict mode enforced — no `any` types allowed
- TailwindCSS v4 — use `@import "tailwindcss"` in CSS, NOT `tailwind.config.js`

### Project Structure Notes

Files to create/modify:

```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts                          ← CREATE
      IClienteRepository.ts               ← CREATE
    application/
      useClientes.ts                      ← CREATE (+ filterClientes function)
      clienteFilter.test.ts               ← CREATE (unit tests for filter)
    infrastructure/
      clienteApiRepository.ts             ← CREATE
    presentation/
      ClienteListView.tsx                 ← CREATE
      ClienteListView.test.tsx            ← CREATE
  shared/components/
    ClientListItem.tsx                    ← CREATE
    EmptyState.tsx                        ← CREATE
    ErrorPanel.tsx                        ← CREATE
  routes/_app/
    clientes.tsx                          ← MODIFY (replace placeholder with ClienteListView layout)
    clientes.$clienteId.tsx              ← CREATE (empty placeholder for Story 2.2)

backend/src/
  SiesaAgents.Domain/Clientes/
    Entities/ClienteEntity.cs             ← CREATE
    Interfaces/IClienteRepository.cs      ← CREATE
  SiesaAgents.Application/Clientes/
    Queries/GetClientesQuery.cs           ← CREATE
    Queries/GetClientesQueryHandler.cs    ← CREATE
    DTOs/ClienteDto.cs                    ← CREATE
  SiesaAgents.Infrastructure/
    Data/AppDbContext.cs                  ← MODIFY (add DbSet<ClienteEntity>)
    Data/Configurations/
      ClienteConfiguration.cs            ← CREATE
    Data/Migrations/
      <timestamp>_AddClienteEntity.cs    ← CREATE (via dotnet ef migrations add)
    Repositories/ClienteRepository.cs    ← CREATE
  SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs        ← CREATE
    Program.cs                           ← MODIFY (register IClienteRepository, handlers, map endpoints)

backend/tests/
  SiesaAgents.UnitTests/Application/Clientes/
    GetClientesQueryHandlerTests.cs      ← CREATE
  SiesaAgents.IntegrationTests/
    ClienteEndpointsTests.cs             ← CREATE (TC-E2-P1-01)
```

No other existing files should be modified.

### References

- Entity pattern (UUID PK, DateTimeOffset, private constructor + Create()): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- `ApplySnakeCaseNaming()` and `uk_clientes_nit` unique index: [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- `GET /api/v1/clientes` direct array response format: [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- TanStack Query key `['clientes']`: [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- `filterClientes` Unicode normalization mandate: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#Notes for Story Implementation Agents`, point 7]
- `ClienteListView` 280px panel: [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)`]
- `EmptyState` and `ErrorPanel` named in architecture: [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Client-side filter (not Zustand): [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- `react-loading-skeleton` for loading state (not spinners): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Loading States`]
- Heroicons as primary icon set: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Icons`]
- Spanish user-facing text, English code: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]
- Story requirements: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1`]
- Test cases for this story: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-01, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09, TC-E2-P1-10, TC-E2-P1-16, TC-E2-P1-17`]
- Previous story infrastructure (AppDbContext, EF Core, Middleware): [Source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`]
- Navigation shell (routes structure): [Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Code review completed by code-review workflow (claude-sonnet-4-6)
- Auto-corrected: Program.cs missing DI registration for IClienteRepository, GetClientesQueryHandler, and MapClienteEndpoints call
- Auto-corrected: frontend/src/routes/_app/clientes.tsx was still a placeholder — replaced with ClientesLayout rendering ClienteListView + Outlet
- Auto-corrected: ClienteListView empty-search condition bug — EmptyState was shown for both truly empty list and zero search results; now shows distinct "Sin resultados" message
- Auto-corrected: Created missing clientes.$clienteId.tsx route placeholder (Task 21)
- Auto-corrected: Created GetClientesQueryHandlerTests.cs (Task 10) and added NSubstitute to unit test csproj
- Integration test (ClienteEndpointsTests.cs) relies on a live PostgreSQL DB — not isolated with test containers; acceptable for current project stage but flagged

### File List

backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260530000001_AddClienteEntity.cs
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
backend/src/SiesaAgents.API/Program.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs
backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs
frontend/src/modules/crm/clientes/domain/Cliente.ts
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
frontend/src/modules/crm/clientes/application/useClientes.ts
frontend/src/modules/crm/clientes/application/filterClientes.ts
frontend/src/modules/crm/clientes/application/clienteFilter.ts
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx
frontend/src/modules/crm/clientes/application/clienteFilter.test.ts
frontend/src/modules/crm/clientes/application/clienteFilter.edge.test.ts
frontend/src/shared/components/ClientListItem.tsx
frontend/src/shared/components/EmptyState.tsx
frontend/src/shared/components/ErrorPanel.tsx
frontend/src/routes/_app/clientes.tsx
frontend/src/routes/_app/clientes.$clienteId.tsx
frontend/src/__mocks__/handlers/clientes.ts
