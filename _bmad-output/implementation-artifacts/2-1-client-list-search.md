# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system **When** the user navigates to `/clientes` **Then** the left panel (280px fixed width) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded **When** the user types in the search field **Then** the list filters in real time (client-side, no additional API call) showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system **When** the user navigates to `/clientes` and the API returns an empty array **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client. No list items or loading skeleton are visible.

4. **Given** the backend is unavailable when the page loads **When** the fetch fails (network error or 5xx) **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list. Clicking "Reintentar" triggers a new GET `/api/v1/clientes` request.

5. **Given** the client list is loaded **When** the user clears the search field **Then** the full list of clients is displayed again without a new API call.

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1 — Create `ClienteEntity` in Domain layer (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with: `Id` (Guid, UUID PK), `Nombre` (string), `Nit` (string, unique), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset). Use private constructor + static `Create()` factory. Base class inherits from `Entity` (already in Domain from Story 1.1).
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)` and `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`.

- [ ] Task 2 — EF Core configuration and migration for `clientes` table (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`. Configure: table name `clientes` (EF snake_case auto-applied), unique index `uk_clientes_nit` on `Nit` column, `Nombre`/`Nit`/`Telefono`/`Ciudad` as required (non-nullable). Do NOT add `[Column]` or `[Table]` attributes — rely on `UseSnakeCaseNamingConvention()` from Story 1.3.
  - [ ] Register `DbSet<ClienteEntity> Clientes` in `AppDbContext`.
  - [ ] Run EF Core migration: `dotnet ef migrations add AddClienteTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`. Verify migration `Up()` creates `clientes` table with all columns and the `uk_clientes_nit` unique index.
  - [ ] Run `dotnet ef database update` to apply migration to `siesa_agents_db`.

- [ ] Task 3 — Application layer: Query + DTO + Repository implementation (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (empty record).
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`: inject `IClienteRepository`, call `GetAllAsync()`, map to `IReadOnlyList<ClienteDto>`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`: `Id` (Guid), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset).
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`. Use `AppDbContext`. Implement `GetAllAsync()` with `AsNoTracking()` and `ToListAsync()`.
  - [ ] Register `IClienteRepository → ClienteRepository` and `GetClientesQueryHandler` in DI in `Program.cs`.

- [ ] Task 4 — Minimal API endpoint: GET /api/v1/clientes (AC: #1, #2, #4)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`. Map: `GET /api/v1/clientes` → dispatches `GetClientesQuery` → returns `200 OK` with `IReadOnlyList<ClienteDto>` as JSON array (direct array, no wrapper). Errors handled by `ExceptionHandlingMiddleware` (already in place from Story 1.3).
  - [ ] Register endpoint group in `Program.cs` using `app.MapClienteEndpoints()`.
  - [ ] Confirm CORS policy `DevCors` covers the new endpoint (inherited from Story 1.1 `app.UseCors("DevCors")` — no additional action needed).

- [ ] Task 5 — Backend unit tests (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`:
    - Test: `Create_WithValidArgs_ReturnsEntityWithCorrectProperties` — assert `Id != Guid.Empty`, `Nombre`, `Nit`, `CreatedAt` is `DateTimeOffset` (not default).
    - Test: `Create_WithEmptyNombre_ThrowsDomainException`.
    - Test: `Create_WithEmptyNit_ThrowsDomainException`.
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`:
    - Test: `Handle_ReturnsMappedClienteDtos` — mock `IClienteRepository` returning 2 entities, assert handler returns 2 DTOs with correct field values.
    - Test: `Handle_WhenRepositoryEmpty_ReturnsEmptyList`.

- [ ] Task 6 — Backend integration tests for GET /api/v1/clientes (AC: #1, #4)
  - [ ] In `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`, add:
    - Test: `GetClientes_WithSeededData_Returns200AndJsonArray` — seed 3 clients, GET `/api/v1/clientes`, assert 200, JSON array length 3, each object has `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 with timezone). Corresponds to TC-E2-P2-01.
    - Test: `GetClientes_WhenEmpty_Returns200AndEmptyArray` — no seed, GET `/api/v1/clientes`, assert 200 and empty array `[]`.

### Frontend Tasks

- [ ] Task 7 — Domain layer: `Cliente` entity interface and repository contract (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`:
    ```typescript
    export interface Cliente {
      id: string;
      nombre: string;
      nit: string;
      telefono: string;
      ciudad: string;
      createdAt: string; // ISO 8601
    }
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`:
    ```typescript
    export interface IClienteRepository {
      getAll(): Promise<Cliente[]>;
    }
    ```

- [ ] Task 8 — Infrastructure layer: Axios repository implementation (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`. Implement `IClienteRepository`. Use the shared `apiClient` (Axios singleton from `frontend/src/shared/lib/apiClient.ts` — already created in Story 1.2). Call `GET /api/v1/clientes`. Return typed `Cliente[]`.

- [ ] Task 9 — Application layer: `useClientes` TanStack Query hook (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```typescript
    import { useQuery } from '@tanstack/react-query';
    import { clienteApiRepository } from '../../infrastructure/clienteApiRepository';

    export function useClientes() {
      return useQuery({
        queryKey: ['clientes'],
        queryFn: () => clienteApiRepository.getAll(),
        staleTime: 30_000,
      });
    }
    ```
  - [ ] The hook exposes `{ data, isLoading, isError, refetch }` — do NOT add extra abstractions.

- [ ] Task 10 — Shared components: `EmptyState` and `ErrorPanel` (AC: #3, #4)
  - [ ] Check siesa-ui-kit for an existing empty state component before creating custom. If not available, create `frontend/src/shared/components/EmptyState.tsx`:
    - Props: `message: string`, `description?: string`. Renders an icon + heading + description. All text in Spanish. WCAG 2.1 AA — use `role="status"` or appropriate ARIA.
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`:
    - Props: `onRetry: () => void`. Renders error message in Spanish + "Reintentar" button. On click, calls `onRetry()`. WCAG 2.1 AA — button must have descriptive label. Uses Heroicons for error icon.

- [ ] Task 11 — Shared component: `ClientListItem` (AC: #1)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`:
    - Props: `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`.
    - Displays `nombre` (primary text) and `nit` (secondary text).
    - Highlights when `isSelected`. Keyboard accessible (`role="button"` or `<button>`).
    - Uses TailwindCSS v4 + company design tokens (Siesa Blue `#0e79fd` for selected state, `slate-*` for neutrals).

- [ ] Task 12 — Presentation layer: `ClienteListView` component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Uses `useClientes()` hook.
    - **Loading state:** Renders skeleton placeholders using `react-loading-skeleton` (NOT a spinner). Show 5 skeleton items.
    - **Error state:** Renders `<ErrorPanel onRetry={refetch} />`.
    - **Empty state:** Renders `<EmptyState message="No hay clientes registrados" description="Crea el primer cliente para comenzar" />`.
    - **Data state:** Renders a fixed-width (280px) left panel with `overflow-y: auto` containing a list of `<ClientListItem>` components.
    - **Search field:** `<input type="search">` at the top of the panel. Controlled with local `useState<string>('')`. Label in Spanish. Placeholder: "Buscar por nombre o NIT/RUC".
    - **Filtering:** Uses `useMemo` to filter `data` array client-side. Filter logic: case-insensitive match on `nombre` or `nit` containing the search term. No debounce needed (< 50ms for 500 records per architecture decision).
    - **State independence:** `searchQuery` state is completely independent from any sort state (defined in Story 2.6). Do NOT couple them.

- [ ] Task 13 — Route integration: `/clientes` route (AC: #1)
  - [ ] Create or update `frontend/src/routes/_app/clientes.tsx` (TanStack Router file-based route). This is a pathless layout route (prefix `_app`).
    - Renders split-panel layout: left panel (`ClienteListView` at 280px) + right panel (placeholder for Story 2.2 — render an empty `<div>` with `flex-1`).
    - The route file itself is minimal — delegates to `ClienteListView` and a future `ClienteDetailPanel`.

- [ ] Task 14 — Frontend unit tests (AC: #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`:
    - Test: `returns list of clients from repository` — mock `clienteApiRepository.getAll()`, assert query returns data. Use Vitest.
  - [ ] Create `frontend/src/shared/components/EmptyState.test.tsx`:
    - Test: renders message prop correctly. axe accessibility check.
  - [ ] Create `frontend/src/shared/components/ErrorPanel.test.tsx`:
    - Test: renders Reintentar button. Test: clicking button calls `onRetry`. axe accessibility check.

- [ ] Task 15 — Frontend component tests with MSW (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`:
    - **TC-E2-P1-01:** MSW returns 3 clients → assert 3 list items rendered with nombre and nit visible.
    - **TC-E2-P1-02:** MSW returns 5 clients (3 with "Acero" in nombre) → type "Acero" → assert 3 visible, 2 hidden, no additional API call.
    - **TC-E2-P1-03:** MSW returns client with `nit: "900123456-1"` → type "900123456" → assert only that client visible.
    - **TC-E2-P1-04:** MSW returns `[]` → assert `EmptyState` component visible with guidance message.
    - **TC-E2-P1-05:** MSW returns network error → assert `ErrorPanel` with "Reintentar" button visible → click button → assert new GET request issued.
    - **TC-E2-P3-01 (P3):** MSW returns 500 clients → type search term → measure re-render with `performance.now()` → assert ≤ 1000ms.
  - [ ] Use MSW 2+ handlers. Import `server` from shared test setup (from Story 1.2 MSW setup).

## Dev Notes

### Architecture Alignment

This story activates the first domain entity and the first API endpoint of the project. It must follow the Clean Architecture layers exactly as defined in `_bmad-output/planning-artifacts/architecture.md`.

**Data flow for client list:**
```
GET /api/v1/clientes
  → ClienteEndpoints.cs
  → GetClientesQueryHandler.cs
  → ClienteRepository.cs (IClienteRepository)
  → AppDbContext.Clientes
  → PostgreSQL clientes table
  → IReadOnlyList<ClienteDto>
  → 200 OK JSON array
```

**Frontend data flow:**
```
ClienteListView.tsx
  → useClientes() [TanStack Query, queryKey: ['clientes']]
  → clienteApiRepository.getAll()
  → GET /api/v1/clientes
  → Cliente[]
  → useMemo filter (searchQuery)
  → Rendered list
```

### Backend Implementation Details

**ClienteEntity pattern (company standard — mandatory):**
```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public class ClienteEntity : Entity  // Entity base from Story 1.1 — provides Id (Guid) + DateTimeOffset timestamps
{
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;

    private ClienteEntity() { }  // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre is required.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit)) throw new ArgumentException("NIT is required.", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono)) throw new ArgumentException("Telefono is required.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad is required.", nameof(ciudad));

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

**NEVER use `DateTime` — always `DateTimeOffset`.** [Source: company-standards.md#Backend Critical Rules]

**EF Core configuration (snake_case is automatic — do NOT add `[Column]` attributes):**
```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(20);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

**AppDbContext — add DbSet:**
```csharp
public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();
```

**ClienteRepository:**
```csharp
public class ClienteRepository(AppDbContext context) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
        => await context.Clientes.AsNoTracking().ToListAsync(ct);

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
}
```

**Minimal API endpoint:**
```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        });

        return app;
    }
}
```

**API response contract (GET /api/v1/clientes):**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombre": "Empresa ABC",
    "nit": "900123456-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-06-04T10:30:00Z"
  }
]
```
Direct array response — no wrapper object. [Source: architecture.md#Format Patterns]

**Error responses:** All errors are handled by `ExceptionHandlingMiddleware` (from Story 1.3). Returns Problem Details RFC 7807. NEVER expose stack traces or exception messages (NFR6). [Source: architecture.md#Authentication & Security]

**DI registration in Program.cs:**
```csharp
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
// ...after app.Build():
app.MapClienteEndpoints();
```

**API documentation:** Scalar is already registered from Story 1.1. No Swagger. `app.MapScalarApiReference()` must NOT be called again. [Source: company-standards.md#Backend Critical Rules]

### Frontend Implementation Details

**UI Library check order (company standard P0):**
1. siesa-ui-kit — check catalog before creating any component.
2. shadcn/ui (already installed via Story 1.1) — fallback.
3. Custom — only if no kit equivalent exists.

For this story: `EmptyState` and `ErrorPanel` must be checked against siesa-ui-kit first. `ClientListItem` is domain-specific — likely custom.

**Loading state — skeleton (NOT spinner):**
```typescript
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// In ClienteListView:
if (isLoading) {
  return (
    <div className="w-[280px] flex flex-col gap-2 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} height={56} borderRadius={8} />
      ))}
    </div>
  );
}
```

**Real-time search filtering (client-side, useMemo):**
```typescript
const filteredClientes = useMemo(() => {
  if (!data) return [];
  if (!searchQuery.trim()) return data;
  const q = searchQuery.toLowerCase();
  return data.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}, [data, searchQuery]);
```

No debounce is applied — architecture decision: ≤ 50ms for 500 records makes debounce unnecessary. [Source: architecture.md#Data Architecture]

**TanStack Query canonical key:**
```typescript
queryKey: ['clientes']  // Always array form — NEVER string 'clientes'
```
[Source: architecture.md#Process Patterns]

**State management for search:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
// Local useState only — no Zustand, no URL param for search (URL is reserved for selectedClienteId in Story 2.2)
```
[Source: architecture.md#State Boundaries]

**Left panel layout (280px fixed):**
```tsx
<div className="w-[280px] min-h-screen border-r border-slate-200 flex flex-col overflow-hidden">
  <div className="p-3 border-b border-slate-200">
    <input
      type="search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Buscar por nombre o NIT/RUC"
      aria-label="Buscar clientes"
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
    />
  </div>
  <div className="flex-1 overflow-y-auto">
    {filteredClientes.map((cliente) => (
      <ClientListItem
        key={cliente.id}
        cliente={cliente}
        isSelected={selectedId === cliente.id}
        onClick={() => handleClienteClick(cliente.id)}
      />
    ))}
  </div>
</div>
```

**All user-facing text in Spanish** (company standard P0): "Buscar por nombre o NIT/RUC", "No hay clientes registrados", "Reintentar", etc. Code variables, functions, and files remain in English. [Source: company-standards.md#Frontend Key Rules]

**TanStack Router route registration:**
The route `frontend/src/routes/_app/clientes.tsx` uses the `_app` pathless layout prefix. File-based routing is auto-discovered by `@tanstack/router-plugin`. No manual route registration is needed. [Source: architecture.md#Routing]

**Axios singleton (from Story 1.2):**
The `apiClient` Axios instance at `frontend/src/shared/lib/apiClient.ts` is already configured with `baseURL: import.meta.env.VITE_API_URL` and error interceptors. Import it directly — do NOT create a new Axios instance.

**Bundle budget:** Keep component bundle lean — no additional large dependencies. Current budget: < 500KB gzipped. [Source: company-standards.md#Frontend Key Rules]

### Testing Details

**Frontend test tooling:**
- Vitest 2+ + RTL + MSW 2+ (all installed from Story 1.2)
- `react-loading-skeleton` for skeleton — mock it in tests if needed
- MSW server setup shared from Story 1.2 test utilities

**Backend test tooling:**
- xUnit + EF Core InMemory (unit) + WebApplicationFactory (integration)
- TestContainers Postgres for integration tests that need real DB constraints

**Test case cross-references (from test-design-epic-2.md):**
- TC-E2-P1-01: ClienteListView renders list correctly
- TC-E2-P1-02: Real-time search by nombre (no API call)
- TC-E2-P1-03: Search by NIT/RUC
- TC-E2-P1-04: EmptyState when no clients
- TC-E2-P1-05: ErrorPanel + Reintentar on backend error
- TC-E2-P2-01: GET /api/v1/clientes integration test
- TC-E2-P3-01 (P3, defer if needed): Search performance with 500 records ≤ 1s

**Testing — Arrange/Act/Assert pattern (company standard):**
```typescript
// Example: TC-E2-P1-02
it('filters list by nombre without additional API call', async () => {
  // Arrange
  const spy = vi.fn();
  server.use(http.get('/api/v1/clientes', () => { spy(); return HttpResponse.json(mockClientes); }));
  render(<ClienteListView />);
  await screen.findByText('Acero Andino'); // wait for load (1 initial call)

  // Act
  const searchInput = screen.getByRole('searchbox');
  await userEvent.type(searchInput, 'Acero');

  // Assert
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.queryByText('Beta Ltda')).not.toBeInTheDocument();
  expect(spy).toHaveBeenCalledTimes(1); // no additional API call
});
```

**Accessibility (WCAG 2.1 AA):**
- Search input must have an accessible label (`aria-label` or `<label for>`).
- List items must be keyboard focusable and have correct ARIA roles.
- Error and empty state elements must use `role="status"` or `role="alert"` as appropriate.
- Run `axe` checks in P3 tests (TC-E2-P3-03).

### Project Structure Notes

**Files to create in this story:**

Backend:
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_AddClienteTable.cs`
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

Backend modified:
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (add `DbSet<ClienteEntity> Clientes`)
- `backend/src/SiesaAgents.API/Program.cs` (add DI registrations + `app.MapClienteEndpoints()`)

Frontend:
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/shared/components/EmptyState.test.tsx`
- `frontend/src/shared/components/ErrorPanel.test.tsx`

**Scope constraints (DO NOT create in this story):**
- `ClienteDetailView.tsx` — deferred to Story 2.2
- `ClienteForm.tsx` — deferred to Story 2.3
- `useCreateCliente.ts`, `useUpdateCliente.ts`, `useDeleteCliente.ts` — deferred to Stories 2.3–2.5
- `SortControl` component — deferred to Story 2.6
- `ContactoEntity.cs` / `ContactoConfiguration.cs` — deferred to Epic 3
- Any endpoint other than `GET /api/v1/clientes` — deferred to subsequent stories

### References

- Clean Architecture layers and file structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- API endpoints and response contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- TanStack Query canonical keys and mutation pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- State management boundaries (search = local useState): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Client-side filtering (useMemo, no debounce): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- FR1 (list clients), FR2 (search by nombre/NIT): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- NFR1 (search ≤ 1s / 500 records): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Entity pattern (private ctor + static Create()): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- DateTimeOffset (never DateTime): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- UUID primary keys: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- snake_case DB via UseSnakeCaseNamingConvention(): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- siesa-ui-kit check before custom components: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Loading states via react-loading-skeleton (not spinners): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- All user text in Spanish: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Test cases TC-E2-P1-01 through TC-E2-P1-05, TC-E2-P2-01, TC-E2-P3-01: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Notes for implementation agents (constraints 1, 3, 4, 5, 8, 10): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Notes for Story Implementation Agents]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
