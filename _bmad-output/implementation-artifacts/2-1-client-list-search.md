# Story 2.1: Client List & Search

Status: draft

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px) renders a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive substring), and results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client. No list items are rendered.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list. Clicking "Reintentar" triggers a refetch and, on success, replaces the error panel with the client list.

## Tasks / Subtasks

- [ ] Task 1 — Define `Cliente` domain entity and repository interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string }`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`

- [ ] Task 2 — Implement infrastructure layer (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository`, calls `GET /api/v1/clientes` via `apiClient` from `src/shared/lib/apiClient.ts`

- [ ] Task 3 — Implement `useClientes` application hook (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook with `queryKey: ['clientes']`, `queryFn` delegates to `clienteApiRepository.getAll()`
  - [ ] Hook exposes `{ data, isLoading, isError, refetch }` from `useQuery`

- [ ] Task 4 — Build `ClienteListView` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Fixed-width container `w-[280px]` — left panel as per UX spec Direction F
  - [ ] Top section: search `Input` (siesa-ui-kit) with `placeholder="Buscar cliente..."` and `aria-label="Buscar cliente"` — triggers `setSearchQuery` on `onChange`
  - [ ] Client-side filter via `useMemo` over `useClientes` data — filters by `nombre` (case-insensitive) OR `nit` (case-insensitive substring); `useMemo` dependency array includes `clientes` data and `searchQuery`
  - [ ] Render each filtered client as a `ClientListItem` component (see Task 5) inside a scrollable `<ul>` — use `react-loading-skeleton` during loading state
  - [ ] When `data` is empty array: render `EmptyState` with message "No hay clientes aún. Crea el primero." and an `aria-label="Lista vacía de clientes"`
  - [ ] When `isError` is true: render `ErrorPanel` with a "Reintentar" button (`onClick={refetch}`) and `aria-label="Error al cargar clientes"`
  - [ ] When search returns no results (non-empty data but filtered list empty): render inline message "No se encontró ningún cliente para «{searchQuery}»"
  - [ ] All user-facing text in Spanish

- [ ] Task 5 — Build `ClientListItem` shared component (AC: #1)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [ ] Props: `{ id: string; nombre: string; nit: string; isSelected?: boolean; onClick: () => void }`
  - [ ] Renders `nombre` as primary text and `nit` as secondary text
  - [ ] Applies `bg-primary-50 text-primary-700` when `isSelected`, `hover:bg-slate-100` otherwise
  - [ ] Accessible: `role="listitem"`, `aria-selected={isSelected}`, `aria-label={nombre}`

- [ ] Task 6 — Build `EmptyState` shared component (AC: #3)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `{ message: string; 'aria-label'?: string }`
  - [ ] Renders message centered with `text-slate-500` styling using Heroicons empty illustration or a simple icon

- [ ] Task 7 — Build `ErrorPanel` shared component (AC: #4)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `{ onRetry: () => void; 'aria-label'?: string }`
  - [ ] Renders a Spanish error message "Ocurrió un error al cargar los datos." and a "Reintentar" `<button>` that calls `onRetry`
  - [ ] Button styled with `bg-primary-600 text-white` + minimum 44px touch target

- [ ] Task 8 — Wire `ClienteListView` into the `/clientes` route (AC: #1, #2, #3, #4)
  - [ ] Update `frontend/src/routes/clientes.tsx` — replace the placeholder `ClientesPage` stub with a layout that renders `<ClienteListView />` in the left panel (280px fixed) and a placeholder right panel (`flex-1`) for the client detail (to be implemented in Story 2.2)
  - [ ] Wrap the route component with the `QueryClientProvider` already provided by `src/app/providers/QueryProvider.tsx` (globally wired in `main.tsx` — no additional wrapping needed)
  - [ ] Route: `createFileRoute('/clientes')` — no changes to the route path

- [ ] Task 9 — Backend: define `ClienteEntity` and `IClienteRepository` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
    - Extends `Entity` from `Shared.Domain`
    - Properties: `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
    - Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory method
    - `Update(string nombre, string nit, string telefono, string ciudad)` method sets fields and `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — interface with `Task<IEnumerable<ClienteEntity>> GetAllAsync()` and `Task<ClienteEntity?> GetByIdAsync(Guid id)`

- [ ] Task 10 — Backend: `ClienteDto` and `GetClientesQuery` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — empty record `GetClientesQuery`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — injected `IClienteRepository`, maps entities to `ClienteDto[]`, returns array

- [ ] Task 11 — Backend: `ClienteRepository` and `AppDbContext` `DbSet` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository` using `AppDbContext`; `GetAllAsync()` returns `await _db.Clientes.ToListAsync()`; `GetByIdAsync(Guid id)` returns `await _db.Clientes.FindAsync(id)`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — `IEntityTypeConfiguration<ClienteEntity>`:
    - `builder.ToTable("clientes")` (EF Core will snake_case columns automatically via `ApplySnakeCaseNaming()`)
    - `builder.HasKey(c => c.Id)`
    - `builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`
  - [ ] Apply `ClienteConfiguration` in `OnModelCreating`: `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())` — or add explicitly before `ApplySnakeCaseNaming()`

- [ ] Task 12 — Backend: EF Core migration for `clientes` table (AC: #1)
  - [ ] Run `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [ ] Verify migration `Up()` creates table `clientes` with columns `id` (uuid PK), `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at` — all snake_case
  - [ ] Verify `uk_clientes_nit` unique index is created in the migration
  - [ ] Run `dotnet ef database update` to apply migration

- [ ] Task 13 — Backend: `GET /api/v1/clientes` endpoint (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with a static `MapClienteEndpoints(this WebApplication app)` extension method
  - [ ] Register `app.MapGet("/api/v1/clientes", ...)` handler — instantiates `GetClientesQueryHandler`, returns `Results.Ok(dtos)`
  - [ ] Register DI in `Program.cs`: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`
  - [ ] Call `app.MapClienteEndpoints()` in `Program.cs` after middleware setup
  - [ ] Response: HTTP 200 + JSON array of `ClienteDto` — direct array (no wrapper), camelCase keys (auto-serialized by .NET)

- [ ] Task 14 — Write frontend unit and component tests (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/__tests__/Cliente.test.ts` — verifies TypeScript interface shape (import check, no runtime logic)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts` — MSW returns 2 clients; asserts hook returns correct array
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` covering:
    - TC-E2-P1-01: Renders all clients with Nombre and NIT/RUC (MSW returns 2 clients)
    - TC-E2-P1-02: `EmptyState` rendered when `GET /api/v1/clientes` returns `[]`
    - TC-E2-P1-03: `ErrorPanel` rendered on network failure; "Reintentar" click triggers refetch and list appears
    - TC-E2-P1-04: Search by Nombre filters list (case-insensitive)
    - TC-E2-P1-05: Search by NIT/RUC filters list
    - TC-E2-P1-06: Performance — 500 clients filter completes in < 1000ms (`performance.now()` timing)
  - [ ] Create `frontend/src/shared/components/__tests__/ClientListItem.test.tsx` — renders nombre + nit, applies selected styles, calls onClick
  - [ ] Create `frontend/src/shared/components/__tests__/EmptyState.test.tsx` — renders message prop
  - [ ] Create `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` — renders "Reintentar" button, calls onRetry on click
  - [ ] All tests run via `pnpm test` with Vitest + RTL + MSW; zero failures

- [ ] Task 15 — Write backend unit tests (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs`:
    - `Create_SetsAllFields_Correctly` — verify factory assigns Nombre, Nit, Telefono, Ciudad and `CreatedAt` is `DateTimeOffset` (not `DateTime`)
    - `Update_ChangesFieldsAndUpdatedAt` — call `Update(...)` and assert new values + `UpdatedAt > CreatedAt`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`:
    - Mock `IClienteRepository` returning 3 entities; assert handler returns 3 `ClienteDto` objects with matching fields
  - [ ] All tests run via `dotnet test` with zero failures

## Dev Notes

### Frontend Architecture

**Module path:** `frontend/src/modules/crm/clientes/` — Clean Architecture layers (domain / application / infrastructure / presentation).

**Search strategy (NFR1 < 1s):** TanStack Query fetches all clients on mount (`queryKey: ['clientes']`). Filtering is entirely client-side with `useMemo`:

```typescript
const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return clientes ?? []
  const q = searchQuery.toLowerCase()
  return (clientes ?? []).filter(
    c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  )
}, [clientes, searchQuery])
```

This approach handles 500 records in < 50ms — well within NFR1 (< 1s). No debounce is required for useMemo itself; if desired, apply a 150ms debounce on `setSearchQuery` to reduce re-renders without impacting perceived speed.

**`useClientes` hook pattern:**
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

**`clienteApiRepository` pattern:**
```typescript
// frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
import { apiClient } from '@/shared/lib/apiClient'
import type { IClienteRepository } from '../domain/IClienteRepository'
import type { Cliente } from '../domain/Cliente'

export const clienteApiRepository: IClienteRepository = {
  getAll: () => apiClient.get<Cliente[]>('/api/v1/clientes').then(r => r.data),
}
```

**Route layout — split panel:**
```typescript
// frontend/src/routes/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      {/* Right panel — placeholder for Story 2.2 */}
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Selecciona un cliente para ver su detalle
      </div>
    </div>
  )
}
```

**Skeleton loading state:** Use `react-loading-skeleton` during `isLoading`:
```typescript
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Render 5 skeleton items while loading
{isLoading && Array.from({ length: 5 }).map((_, i) => (
  <li key={i} className="px-3 py-2"><Skeleton height={40} /></li>
))}
```

**State management:** `searchQuery` state lives in `ClienteListView` as local `useState` — not Zustand, not URL params. Sort state (Story 2.6) will also be local `useState`. This is consistent with the architecture decision: "Client-side filter state (local React state, NO Zustand)".

**All user-facing text in Spanish (mandatory):**
- Search placeholder: `"Buscar cliente..."`
- Empty state message: `"No hay clientes aún. Crea el primero."`
- No-results message: `"No se encontró ningún cliente para «{searchQuery}»"`
- Error message: `"Ocurrió un error al cargar los datos."`
- Retry button: `"Reintentar"`

**shadcn/ui `Input`:** If siesa-ui-kit `Input` is unavailable, install via MCP: `shadcn add input`. Apply `focus-visible:ring-2 focus-visible:ring-primary-600` for brand-consistent focus ring.

### Backend Architecture

**Entity pattern (mandatory):**
```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public class ClienteEntity : Entity
{
    public string Nombre { get; private set; } = default!;
    public string Nit { get; private set; } = default!;
    public string Telefono { get; private set; } = default!;
    public string Ciudad { get; private set; } = default!;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { } // EF Core required

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
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

**CRITICAL:** `DateTimeOffset` ALWAYS — NEVER `DateTime`. PostgreSQL stores as `timestamptz`.

**`ClienteConfiguration` (EF Core):**
```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired();
        builder.Property(c => c.Nit).IsRequired();
        builder.Property(c => c.Telefono).IsRequired();
        builder.Property(c => c.Ciudad).IsRequired();
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

`ApplySnakeCaseNaming()` in `AppDbContext.OnModelCreating` maps `Nombre → nombre`, `CreatedAt → created_at`, etc. automatically. No manual `[Column]` attributes.

**`GET /api/v1/clientes` endpoint:**
```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
public static class ClienteEndpoints
{
    public static WebApplication MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (IClienteRepository repo) =>
        {
            var clientes = await repo.GetAllAsync();
            var dtos = clientes.Select(c => new ClienteDto(
                c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt
            ));
            return Results.Ok(dtos);
        })
        .WithName("GetClientes")
        .WithTags("Clientes");

        return app;
    }
}
```

**API response shape:** Direct JSON array — no wrapper object. Auto-serialized by .NET in camelCase:
```json
[
  { "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "2026-05-23T10:30:00Z", "updatedAt": "2026-05-23T10:30:00Z" }
]
```

**DI registration in `Program.cs`:**
```csharp
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
// ...
app.MapClienteEndpoints();
```

**EF Core migration verification:** After running `dotnet ef migrations add AddClientesTable`, confirm the migration `Up()` creates:
- Table `clientes` with columns: `id` (uuid), `nombre` (text NOT NULL), `nit` (text NOT NULL), `telefono` (text NOT NULL), `ciudad` (text NOT NULL), `created_at` (timestamptz NOT NULL), `updated_at` (timestamptz NOT NULL)
- Unique index `uk_clientes_nit` on column `nit`

### Test Infrastructure Notes

**MSW handlers for frontend component tests:**
```typescript
// Add to frontend/src/mocks/handlers.ts (or test-specific handlers)
http.get('/api/v1/clientes', () =>
  HttpResponse.json([
    { id: '1', nombre: 'Cliente A', nit: '900111', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
    { id: '2', nombre: 'Cliente B', nit: '900222', telefono: '3002222222', ciudad: 'Medellín', createdAt: '2026-05-02T00:00:00Z', updatedAt: '2026-05-02T00:00:00Z' },
  ])
),
```

**Router wrapper for component tests:**
```typescript
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../../routeTree.gen'

const history = createMemoryHistory({ initialEntries: ['/clientes'] })
const router = createRouter({ routeTree, history })
render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)
```

**Performance test (TC-E2-P1-06) scaffold:**
```typescript
it('filters 500 clients in under 1000ms', async () => {
  const manyClientes = Array.from({ length: 500 }, (_, i) => ({
    id: `${i}`, nombre: `Cliente ${i}`, nit: `9${i.toString().padStart(8, '0')}`,
    telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  }))
  server.use(http.get('/api/v1/clientes', () => HttpResponse.json(manyClientes)))
  // render + type + measure with performance.now()
})
```

### Relevant Test Cases from Test Design Epic 2

The following test cases from `_bmad-output/implementation-artifacts/test-design-epic-2.md` are directly relevant to this story and must pass:

**P1 (must pass before story closes):**
- TC-E2-P1-01: Client list renders all clients with Nombre and NIT/RUC
- TC-E2-P1-02: EmptyState when no clients exist
- TC-E2-P1-03: ErrorPanel on backend failure + Reintentar triggers refetch
- TC-E2-P1-04: Real-time search filters by Nombre (case-insensitive)
- TC-E2-P1-05: Real-time search filters by NIT/RUC
- TC-E2-P1-06: Search performance with 500 records < 1 s

**P2 (should pass before epic complete):**
- TC-E2-P2-06: GET /api/v1/clientes returns 200 with full list (API Integration)

### Dependencies on Previous Stories

- **Story 1.1:** `apiClient.ts`, `queryClient.ts`, `QueryProvider.tsx`, `pnpm` workspace, TypeScript strict mode — all available.
- **Story 1.2:** `frontend/src/routes/clientes.tsx` stub already created — Task 8 updates it; `routeTree.gen.ts` will regenerate automatically on save.
- **Story 1.3:** `AppDbContext.cs` with `ApplySnakeCaseNaming()` exists — Task 11 adds `DbSet<ClienteEntity>` to it; `ExceptionHandlingMiddleware` already registered.

### Out of Scope for This Story

- Client creation form (Story 2.3) — "Nuevo cliente" button is NOT added in this story
- Client detail right panel (Story 2.2) — placeholder only
- Sort control (Story 2.6) — `SortControl` component is NOT wired in this story
- Backend `GET /api/v1/clientes/:id`, `POST`, `PUT`, `DELETE` endpoints (Stories 2.2–2.5)
- `ContactManager` integration (Epic 4)

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Architecture decisions (search strategy, query keys, folder structure): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture decisions (entity pattern, EF Core, snake_case): [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- UX spec (split panel 280px, search field, Direction F): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Test cases for this story: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-01 through TC-E2-P1-06, TC-E2-P2-06]
- Company standards (Clean Architecture, TypeScript strict, Spanish UI text, pnpm, siesa-ui-kit P0): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- FR1 (list clients), FR2 (search by name/NIT), NFR1 (< 1s search): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
