# Story 2.1: Client List & Search

Status: ready

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients with `Nombre` and `NIT/RUC` visible per item, rendered by `ClienteListView`.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose `Nombre` or `NIT/RUC` match the input (case-insensitive), with no additional API call triggered (client-side filter over TanStack Query cache). Results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed in the left panel with a Spanish-language message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** `GET /api/v1/clientes` fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed in place of the list. Clicking "Reintentar" triggers `refetch()` on the TanStack Query `['clientes']` query.

5. **Given** the `/clientes` route is loaded, **When** the GET request to `/api/v1/clientes` is in-flight, **Then** skeleton placeholders (`react-loading-skeleton`) are displayed in the list area — no spinner.

## Tasks / Subtasks

- [ ] Task 1 — Define the `Cliente` domain entity and `IClienteRepository` interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface with fields: `id: string` (UUID), `nombre: string`, `nitRuc: string`, `telefono: string`, `ciudad: string`, `createdAt: string` (ISO 8601 DateTimeOffset)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>` method

- [ ] Task 2 — Implement the API repository (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository`, calls `GET /api/v1/clientes` via `apiClient` (Axios singleton from `src/shared/lib/apiClient.ts`), returns `Cliente[]`
  - [ ] Use `apiClient.get<Cliente[]>('/api/v1/clientes')` and return `response.data`

- [ ] Task 3 — Create `useClientes` application hook (AC: #1, #2, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Use `useQuery` from `@tanstack/react-query` with `queryKey: ['clientes']` and `queryFn` calling `clienteApiRepository.getAll()`
  - [ ] Return `{ data, isLoading, isError, refetch }` from the hook

- [ ] Task 4 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Import and call `useClientes()` hook
  - [ ] Manage `searchQuery: string` with `useState('')` for real-time filtering
  - [ ] Derive `filteredClientes` using `useMemo`: filter `data` array where `cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || cliente.nitRuc.toLowerCase().includes(searchQuery.toLowerCase())`
  - [ ] When `isLoading`: render skeleton placeholders using `react-loading-skeleton` (3 skeleton rows) — never a spinner
  - [ ] When `isError`: render `<ErrorPanel onRetry={refetch} />` (see Task 6)
  - [ ] When `!isLoading && !isError && filteredClientes.length === 0 && searchQuery === ''`: render `<EmptyState />` (see Task 5)
  - [ ] When `!isLoading && !isError && filteredClientes.length > 0`: render a `<ul>` with one `<ClienteListItem>` per filtered client
  - [ ] Apply `w-[280px] flex-shrink-0 flex flex-col h-full overflow-y-auto border-r border-slate-200` to the panel container
  - [ ] Search input: `<input type="search" placeholder="Buscar por nombre o NIT/RUC" />` with `onChange` updating `searchQuery`; apply TailwindCSS `w-full px-3 py-2 text-sm border border-slate-300 rounded-md` and `aria-label="Buscar clientes"`

- [ ] Task 5 — Create `EmptyState` shared component (AC: #3)
  - [ ] Check siesa-ui-kit for an `EmptyState` component before creating a custom one
  - [ ] If not available in siesa-ui-kit, create `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `title: string`, `description?: string`, `action?: React.ReactNode`
  - [ ] For Story 2.1, render with `title="Sin clientes"` and `description="Crea tu primer cliente para comenzar."`
  - [ ] Style: centered column layout, `text-slate-500`, Heroicons `UsersIcon` or similar from `@heroicons/react`

- [ ] Task 6 — Create `ErrorPanel` shared component (AC: #4)
  - [ ] Check siesa-ui-kit for an `ErrorPanel` component before creating a custom one
  - [ ] If not available in siesa-ui-kit, create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `onRetry: () => void`, `message?: string`
  - [ ] Render: error message in Spanish ("No se pudo cargar la información.") + `<button onClick={onRetry}>Reintentar</button>`
  - [ ] Button styled with primary color `#0e79fd`: `bg-[#0e79fd] text-white px-4 py-2 rounded-md text-sm`
  - [ ] Add `aria-label="Reintentar carga"` to the retry button

- [ ] Task 7 — Create `ClienteListItem` shared component (AC: #1)
  - [ ] Check siesa-ui-kit for a list item component before creating a custom one
  - [ ] If not available in siesa-ui-kit, create `frontend/src/shared/components/ClienteListItem.tsx`
  - [ ] Props: `cliente: Cliente`, `isActive: boolean`, `onClick: (id: string) => void`
  - [ ] Display `cliente.nombre` (bold, `text-sm font-medium text-slate-800`) and `cliente.nitRuc` (`text-xs text-slate-500`) in a two-line layout
  - [ ] Active state: `bg-[#0e79fd]/10 border-l-2 border-[#0e79fd]`
  - [ ] Hover state: `hover:bg-slate-50`
  - [ ] Full item is clickable: `<button role="listitem" onClick={() => onClick(cliente.id)} aria-label={Seleccionar cliente ${cliente.nombre}} className="...">` 
  - [ ] `w-full text-left px-4 py-3 flex flex-col gap-0.5`

- [ ] Task 8 — Replace placeholder `/clientes` route with real `ClienteListView` (AC: #1)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — replace the placeholder heading with the split-panel layout
  - [ ] Import `ClienteListView` from `../../modules/crm/clientes/presentation/ClienteListView`
  - [ ] Layout: `<div className="flex h-full">` with `<ClienteListView />` on the left and an `<Outlet />` / detail panel placeholder on the right (`<div className="flex-1">`)
  - [ ] The route component name must match the file (`export function ClientesRoute()` or default export per TanStack Router convention)
  - [ ] Export `Route` constant: `export const Route = createFileRoute('/_app/clientes')({ component: ClientesRoute })`

- [ ] Task 9 — Backend: Create `ClienteEntity` domain entity (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [ ] Fields: `Guid Id` (from base `Entity`), `string Nombre`, `string NitRuc`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Private constructor + static `Create(string nombre, string nitRuc, string telefono, string ciudad)` factory method
  - [ ] `Create` method validates that none of the required fields are null or whitespace (throws `ArgumentException` if violated)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with method: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)`

- [ ] Task 10 — Backend: Create `GetClientesQuery` and handler (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with `Guid Id`, `string Nombre`, `string NitRuc`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — empty record (no params)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — takes `IClienteRepository`, maps `ClienteEntity` → `ClienteDto`, returns `IReadOnlyList<ClienteDto>`

- [ ] Task 11 — Backend: Implement `ClienteRepository` in Infrastructure (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository`
  - [ ] Inject `SiesaAgentsDbContext` (or `AppDbContext` — match the existing context class name from Story 1.3)
  - [ ] `GetAllAsync`: `await _context.Clientes.AsNoTracking().OrderBy(c => c.Nombre).ToListAsync(cancellationToken)`

- [ ] Task 12 — Backend: Configure EF Core for `ClienteEntity` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — implements `IEntityTypeConfiguration<ClienteEntity>`
  - [ ] Map to table `clientes` (snake_case auto via `UseSnakeCaseNamingConvention()` — no `[Table]` attribute)
  - [ ] Configure unique index on `NitRuc`: `builder.HasIndex(c => c.NitRuc).IsUnique().HasDatabaseName("uk_clientes_nit_ruc")`
  - [ ] Configure `Nombre`, `NitRuc`, `Telefono`, `Ciudad` as required with max lengths: `HasMaxLength(200)` for Nombre, `HasMaxLength(50)` for NitRuc, `HasMaxLength(20)` for Telefono, `HasMaxLength(100)` for Ciudad
  - [ ] Register configuration in `SiesaAgentsDbContext.OnModelCreating` via `modelBuilder.ApplyConfigurationsFromAssembly(typeof(ClienteConfiguration).Assembly)` (if not already configured from Story 1.3)
  - [ ] Add `DbSet<ClienteEntity> Clientes { get; set; }` to `SiesaAgentsDbContext`

- [ ] Task 13 — Backend: Create `ClienteEndpoints` with `GET /api/v1/clientes` (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Define `MapClienteEndpoints(this WebApplication app)` extension method
  - [ ] Register endpoint: `app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) => Results.Ok(await handler.HandleAsync(ct)))`
  - [ ] Call `app.MapClienteEndpoints()` in `Program.cs`
  - [ ] Register DI: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()` and `builder.Services.AddScoped<GetClientesQueryHandler>()`

- [ ] Task 14 — Backend: EF Core migration for `clientes` table (AC: #1)
  - [ ] Run: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify generated migration creates `clientes` table with correct snake_case columns: `id`, `nombre`, `nit_ruc`, `telefono`, `ciudad`, `created_at`, `updated_at`
  - [ ] Verify unique index `uk_clientes_nit_ruc` is generated in the migration `Up()` method
  - [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` (deferred to developer environment if PostgreSQL unavailable in CI)

- [ ] Task 15 — Frontend and backend unit/component tests (AC: #1–#5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts` — unit test for `useClientes` hook using `renderHook` + MSW: (a) returns data on success, (b) returns `isError=true` on network failure, (c) uses `queryKey: ['clientes']`
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/-ClienteListView.test.tsx` (prefixed with `-` per TanStack Router routeFileIgnorePrefix convention)
    - [ ] TC-E2-P1-01: MSW returns 3 clients → assert all 3 rendered with Nombre + NIT/RUC
    - [ ] TC-E2-P1-02: type "Beta" in search → only matching client visible; clear search → all 3 visible
    - [ ] TC-E2-P1-03: type a NIT/RUC value → only matching client visible
    - [ ] TC-E2-P1-04: MSW returns `[]` → `EmptyState` renders with guidance text
    - [ ] TC-E2-P1-05: MSW returns network error → `ErrorPanel` renders with "Reintentar" button
    - [ ] Test: skeleton renders while loading (mock `isLoading=true`)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
    - [ ] `Create_ValidData_ReturnsEntity` — assert all fields set, `Id` is non-empty Guid, `CreatedAt` is `DateTimeOffset`
    - [ ] `Create_EmptyNombre_ThrowsArgumentException`
    - [ ] `Create_EmptyNitRuc_ThrowsArgumentException`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - [ ] Mock `IClienteRepository.GetAllAsync` returning 2 entities → assert handler returns 2 DTOs with correct field mapping

## Dev Notes

### Frontend: File Locations

```
frontend/src/modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                         # Entity interface
│   └── IClienteRepository.ts             # Repository contract
├── application/
│   ├── useClientes.ts                     # TanStack Query hook
│   └── useClientes.test.ts               # Hook unit tests
├── infrastructure/
│   └── clienteApiRepository.ts           # Axios GET /api/v1/clientes
└── presentation/
    ├── ClienteListView.tsx                # Left panel 280px
    └── -ClienteListView.test.tsx         # Component tests (prefixed with -)

frontend/src/shared/components/
├── EmptyState.tsx                         # Reusable empty state
├── ErrorPanel.tsx                         # Reusable error + retry
└── ClienteListItem.tsx                   # Client list row

frontend/src/routes/_app/clientes.tsx     # Replace placeholder with split-panel layout
```

### Frontend: `Cliente` Domain Type

```typescript
// frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string          // UUID
  nombre: string
  nitRuc: string
  telefono: string
  ciudad: string
  createdAt: string   // ISO 8601 DateTimeOffset string
}
```

### Frontend: `useClientes` Hook

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

### Frontend: Real-Time Search Pattern (useMemo)

```typescript
// Inside ClienteListView.tsx
const [searchQuery, setSearchQuery] = useState('')
const { data = [], isLoading, isError, refetch } = useClientes()

const filteredClientes = useMemo(
  () =>
    data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nitRuc.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  [data, searchQuery]
)
```

### Frontend: Skeleton Loading (not spinner)

```typescript
// react-loading-skeleton usage in ClienteListView
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// When isLoading:
<ul>
  {Array.from({ length: 3 }).map((_, i) => (
    <li key={i} className="px-4 py-3">
      <Skeleton height={14} width="70%" />
      <Skeleton height={12} width="40%" className="mt-1" />
    </li>
  ))}
</ul>
```

### Frontend: Panel Layout in Route

```typescript
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesRoute,
})

function ClientesRoute() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
```

### Backend: `ClienteEntity` Pattern

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public class ClienteEntity : Entity  // base Entity from Story 1.1
{
    public string Nombre { get; private set; } = string.Empty;
    public string NitRuc { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nitRuc, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nitRuc);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);

        return new ClienteEntity
        {
            Nombre = nombre.Trim(),
            NitRuc = nitRuc.Trim(),
            Telefono = telefono.Trim(),
            Ciudad = ciudad.Trim(),
        };
    }
}
```

### Backend: EF Core Table Name Convention

`UseSnakeCaseNamingConvention()` is already configured in `Program.cs` (Story 1.3). `ClienteEntity` → table `cliente_entities` would be the default. Override via `ClienteConfiguration`:

```csharp
builder.ToTable("clientes");
```

Explicitly map to `clientes` table name in `ClienteConfiguration.cs` to match the architecture.md specification.

### Backend: `GET /api/v1/clientes` Endpoint Contract

```
GET /api/v1/clientes
Response 200 OK:
[
  {
    "id": "uuid",
    "nombre": "Empresa Ejemplo",
    "nitRuc": "900111222",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z"
  }
]

Response 200 OK (empty list):
[]
```

JSON property names are camelCase (auto-serialized by .NET `JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase` — configure in `Program.cs` if not already set).

### Backend: DI Registration in Program.cs

```csharp
// Additions to Program.cs for Story 2.1
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
```

### Backend: Namespace for DbContext

Use the existing `SiesaAgentsDbContext` (created in Story 1.1 as `SiesaAgentsDbContext`, path `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs`). Add the `Clientes` DbSet:

```csharp
public DbSet<ClienteEntity> Clientes { get; set; }
```

### Testing Notes

- Component tests use `renderHook` + `QueryClientWrapper` (wrap in `QueryClientProvider` with a fresh `QueryClient` per test)
- MSW handler for this story: `http.get('/api/v1/clientes', () => HttpResponse.json([...]))` 
- Test files in `presentation/` must be prefixed with `-` (e.g., `-ClienteListView.test.tsx`) per TanStack Router `routeFileIgnorePrefix` convention established in Story 1.2
- Backend unit tests use xUnit with in-memory mock of `IClienteRepository` (no real DB required for unit tests)

### Critical Constraints from Test Design

Per `test-design-epic-2.md` section 10:
- `useClientes` must use `queryKey: ['clientes']` exactly — used by mutations in Stories 2.3–2.5 to invalidate the cache
- `ErrorPanel` must have a "Reintentar" button (exact Spanish text) that calls `refetch()` — required by TC-E2-P1-05
- Skeleton must be used for loading state — no spinner (company standard: `react-loading-skeleton`)
- Client-side filter must use `useMemo` — no API call on every keystroke (verified by TC-E2-P1-02, TC-E2-P1-03)
- `EmptyState` guidance text must be in Spanish (company standard: all user-facing text in Spanish)

### References

- Domain entity and repository pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- TanStack Query keys: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Client-side filter strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Left panel 280px width: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- EmptyState + ErrorPanel requirement: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1 AC]
- FR2 (scrollable client list), FR3 (search by name), FR4 (search by NIT/RUC): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- NFR1 (search < 1s with 500 records): [Source: _bmad-output/planning-artifacts/architecture.md#Project Context Analysis]
- Skeleton loading standard: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- Test cases TC-E2-P1-01 through TC-E2-P1-05: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#P1]
- EF Core snake_case naming: [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#EF Core Snake Case Naming Convention]
- Backend entity pattern (UUID, DateTimeOffset): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
