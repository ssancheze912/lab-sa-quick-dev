# Story 2.1: Client List & Search

Status: ready

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item, rendered inside `ClienteListView`.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC contain the input (case-insensitive), and results appear in under 1 second even with 500 records (NFR1).

3. **Given** the user clears the search field, **When** the input becomes empty, **Then** the full client list is restored without triggering a new API call.

4. **Given** there are no clients in the system (API returns `[]`), **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed in the left panel with the message "No hay clientes registrados. Crea el primero." — no skeleton, no error.

5. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component is displayed with the message "Error al cargar los clientes." and a "Reintentar" button that triggers a refetch on click.

6. **Given** the client list is loading for the first time, **When** data has not yet arrived, **Then** a skeleton placeholder (react-loading-skeleton) is displayed in the left panel instead of the list or empty state.

## Tasks / Subtasks

- [ ] Task 1 — Define domain entity and repository interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface with fields: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`

- [ ] Task 2 — Implement infrastructure API repository (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient` (Axios singleton from `src/shared/lib/apiClient.ts`) calling `GET /api/v1/clientes`
  - [ ] Export a singleton instance `clienteApiRepository` for use by hooks

- [ ] Task 3 — Implement `useClientes` application hook (AC: #1, #2, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook with `queryKey: ['clientes']`, calling `clienteApiRepository.getAll()`, `staleTime: 1000 * 60`
  - [ ] Hook exposes: `{ data: Cliente[] | undefined, isLoading, isError, refetch }`

- [ ] Task 4 — Create shared `EmptyState` component (AC: #4)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` — accepts props: `message: string`, optional `action?: React.ReactNode`
  - [ ] Renders a centered layout with a Heroicons `InboxIcon` (or `FolderOpenIcon`), the message text in Spanish, and optionally an action button
  - [ ] Apply WCAG 2.1 AA: `role="status"` and `aria-label` matching message text
  - [ ] All text in Spanish

- [ ] Task 5 — Create shared `ErrorPanel` component (AC: #5)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — accepts props: `message: string`, `onRetry: () => void`
  - [ ] Renders a centered layout with a Heroicons `ExclamationTriangleIcon`, the message text, and a "Reintentar" button wired to `onRetry`
  - [ ] Apply WCAG 2.1 AA: `role="alert"` on the container, button has accessible text

- [ ] Task 6 — Create `ClienteListItem` component (AC: #1)
  - [ ] Create `frontend/src/shared/components/ClienteListItem.tsx` — accepts props: `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`
  - [ ] Renders Nombre (bold, truncated with `truncate`) and NIT/RUC (smaller, slate-500) per item
  - [ ] Apply active/selected styling: `bg-blue-50 border-l-4 border-[#0e79fd]` when `isSelected`, `hover:bg-slate-50` otherwise
  - [ ] Apply WCAG 2.1 AA: `role="option"`, `aria-selected={isSelected}`, keyboard accessible via `tabIndex` and `onKeyDown` Enter handler

- [ ] Task 7 — Implement `ClienteListView` presentation component (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] Layout: fixed 280px left panel with `overflow-y-auto`, `border-r border-slate-200`, `bg-white`
  - [ ] Header: panel title "Clientes" (h2) and search input (`<input type="search">`) with placeholder "Buscar por nombre o NIT..."
  - [ ] Search input uses `onChange` to update local `searchQuery` state (`useState<string>('')`)
  - [ ] Filtered list computed via `useMemo`: filters `data` array where `nombre` or `nit` includes `searchQuery` (case-insensitive via `.toLowerCase()`)
  - [ ] Loading state: render `<Skeleton count={8} height={56} />` from `react-loading-skeleton` when `isLoading`
  - [ ] Error state: render `<ErrorPanel message="Error al cargar los clientes." onRetry={refetch} />` when `isError`
  - [ ] Empty state (no data): render `<EmptyState message="No hay clientes registrados. Crea el primero." />` when `!isLoading && !isError && data?.length === 0`
  - [ ] Empty search result: render a message "Sin resultados para '{searchQuery}'" when filtered array is empty but `data.length > 0`
  - [ ] List renders `<ClienteListItem>` for each filtered client, passing `isSelected` (based on `selectedClienteId` prop) and `onClick`
  - [ ] Accepts props: `selectedClienteId: string | null`, `onClienteSelect: (id: string) => void`
  - [ ] Search input has `aria-label="Buscar cliente"` and the list container has `role="listbox"` and `aria-label="Lista de clientes"`

- [ ] Task 8 — Wire `ClienteListView` into the `/clientes` route (AC: #1–#6)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — replace `ClientesPlaceholder` with a layout that renders `<ClienteListView>` on the left panel (280px) and a right panel placeholder (`<div>`) filling the remaining space
  - [ ] Layout: `flex h-full` — left: `w-[280px] flex-shrink-0`, right: `flex-1`
  - [ ] `selectedClienteId` is read from the current URL (no TanStack Router param at this story level — use `null` for now as detail view is Story 2.2)
  - [ ] `onClienteSelect` is a no-op stub for now (navigation to detail will be wired in Story 2.2)

- [ ] Task 9 — Backend: `ClienteEntity` domain entity (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — `public class ClienteEntity` with private constructor + static `Create()` factory
  - [ ] Fields: `public Guid Id { get; private set; } = Guid.NewGuid()`, `public string Nombre { get; private set; }`, `public string Nit { get; private set; }`, `public string Telefono { get; private set; }`, `public string Ciudad { get; private set; }`, `public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow`, `public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow`
  - [ ] Static `Create(string nombre, string nit, string telefono, string ciudad)` factory validates no field is null/empty before constructing; throws `ArgumentException` if validation fails
  - [ ] Add `Update(string nombre, string nit, string telefono, string ciudad)` method for edits (sets `UpdatedAt = DateTimeOffset.UtcNow`)

- [ ] Task 10 — Backend: `IClienteRepository` interface (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Methods: `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)`, `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)`, `Task AddAsync(ClienteEntity entity, CancellationToken ct)`, `Task UpdateAsync(ClienteEntity entity, CancellationToken ct)`, `Task DeleteAsync(Guid id, CancellationToken ct)`, `Task<bool> NitExistsAsync(string nit, CancellationToken ct)`

- [ ] Task 11 — Backend: EF Core `ClienteConfiguration` and migration (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — implements `IEntityTypeConfiguration<ClienteEntity>`
  - [ ] Configure: `ToTable("clientes")`, `HasKey(x => x.Id)`, all required string columns (Nombre, Nit, Telefono, Ciudad) as `IsRequired()`, unique index `uk_clientes_nit` on `Nit`, standard index `ix_clientes_nombre` on `Nombre`
  - [ ] Add `DbSet<ClienteEntity> Clientes { get; set; }` to `AppDbContext`
  - [ ] Create EF Core migration `20260614000000_AddClienteEntity` (or generate via `dotnet ef migrations add AddClienteEntity`)

- [ ] Task 12 — Backend: `ClienteRepository` infrastructure implementation (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository`
  - [ ] `GetAllAsync`: `return await _context.Clientes.OrderByDescending(c => c.CreatedAt).ToListAsync(ct)`
  - [ ] `NitExistsAsync`: `return await _context.Clientes.AnyAsync(c => c.Nit == nit, ct)`
  - [ ] All other CRUD methods wired to `AppDbContext`

- [ ] Task 13 — Backend: `GetClientesQuery` and handler (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — record `GetClientesQuery`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — calls `IClienteRepository.GetAllAsync()` and maps to `IEnumerable<ClienteDto>`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`

- [ ] Task 14 — Backend: `GET /api/v1/clientes` endpoint (AC: #1, #5)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with static class `ClienteEndpoints`
  - [ ] `MapClienteEndpoints(this WebApplication app)` extension method
  - [ ] Wire endpoint: `app.MapGet("/api/v1/clientes", async (IClienteRepository repo, CancellationToken ct) => Results.Ok(await repo.GetAllAsync(ct)))` — returns `200 OK` with `ClienteDto[]`
  - [ ] Register `IClienteRepository` → `ClienteRepository` in `Program.cs` DI: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`
  - [ ] Call `app.MapClienteEndpoints()` in `Program.cs` after middleware registration

- [ ] Task 15 — Unit tests: frontend (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/__tests__/Cliente.test.ts` — validates TypeScript interface shape (type-level, compile check)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts` — Vitest + MSW: mock `GET /api/v1/clientes` returning 3 clients → assert hook returns array of 3; mock 500 response → assert `isError` is true
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` — Vitest + RTL + MSW:
    - Loading state: assert skeleton is rendered while loading
    - Populated list: MSW returns 3 clients → assert 3 `ClienteListItem` rendered
    - Real-time search: render with 5 clients → type "Garcia" → assert only matching items visible
    - Empty state: MSW returns `[]` → assert `EmptyState` rendered with correct message
    - Error state: MSW returns 500 → assert `ErrorPanel` rendered with "Reintentar" button
    - Retry: click "Reintentar" → assert `refetch` triggered (spy)
  - [ ] Create `frontend/src/shared/components/__tests__/EmptyState.test.tsx` — RTL: renders message, renders action slot, has `role="status"`
  - [ ] Create `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` — RTL: renders message, renders button "Reintentar", calls `onRetry` on click, has `role="alert"`
  - [ ] Create `frontend/src/shared/components/__tests__/ClienteListItem.test.tsx` — RTL: renders Nombre and NIT, applies selected class when `isSelected`, calls `onClick` on click and Enter key

- [ ] Task 16 — Unit tests: backend (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` — xUnit:
    - `Create_WithValidParams_SetsAllProperties`
    - `Create_WithEmptyNombre_ThrowsArgumentException`
    - `Create_WithEmptyNit_ThrowsArgumentException`
    - `Create_WithEmptyTelefono_ThrowsArgumentException`
    - `Create_WithEmptyCiudad_ThrowsArgumentException`
    - `Update_ChangesFieldsAndUpdatesTimestamp`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — xUnit with mock `IClienteRepository`: returns 2 entities → handler returns 2 DTOs with correct field mapping

## Dev Notes

### Architecture Context

This story builds on the shells from Epic 1. The full `frontend/` Vite project and `backend/` .NET solution already exist. All new code follows Clean Architecture layers per `architecture.md`.

**Frontend module path:** `frontend/src/modules/crm/clientes/`

**Frontend shared components path:** `frontend/src/shared/components/`

**Backend solution layer paths:**
- Domain: `backend/src/SiesaAgents.Domain/Clientes/`
- Application: `backend/src/SiesaAgents.Application/Clientes/`
- Infrastructure: `backend/src/SiesaAgents.Infrastructure/`
- API Endpoints: `backend/src/SiesaAgents.API/Endpoints/`

### Client Entity (TypeScript)

```typescript
// frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}
```

### `useClientes` Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { Cliente } from '../domain/Cliente'

export function useClientes() {
  return useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 1000 * 60,
  })
}
```

### `ClienteListView` Search Filter Pattern

```typescript
// Local state — NOT Zustand (per architecture.md: client-side filter uses useState)
const [searchQuery, setSearchQuery] = useState<string>('')

const filteredClientes = useMemo(() => {
  if (!data) return []
  if (!searchQuery.trim()) return data
  const q = searchQuery.toLowerCase()
  return data.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

No debounce required — per architecture decision, client-side filtering over ≤500 records is fast enough (< 50ms) to run synchronously on every keystroke. NFR1 (< 1s) is satisfied without debounce.

### Left Panel Layout

```tsx
// 280px fixed-width left panel — matches architecture.md spec
<div className="w-[280px] flex-shrink-0 flex flex-col h-full border-r border-slate-200 bg-white overflow-hidden">
  <div className="p-4 border-b border-slate-100">
    <h2 className="text-sm font-semibold text-slate-700 mb-3">Clientes</h2>
    <input
      type="search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Buscar por nombre o NIT..."
      aria-label="Buscar cliente"
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
    />
  </div>
  <div role="listbox" aria-label="Lista de clientes" className="flex-1 overflow-y-auto">
    {/* items rendered here */}
  </div>
</div>
```

### Backend `ClienteEntity` Pattern

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

    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit)) throw new ArgumentException("NIT es requerido.", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono)) throw new ArgumentException("Teléfono es requerido.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad es requerida.", nameof(ciudad));

        return new ClienteEntity
        {
            Nombre = nombre.Trim(),
            Nit = nit.Trim(),
            Telefono = telefono.Trim(),
            Ciudad = ciudad.Trim(),
        };
    }

    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit)) throw new ArgumentException("NIT es requerido.", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono)) throw new ArgumentException("Teléfono es requerido.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad es requerida.", nameof(ciudad));

        Nombre = nombre.Trim();
        Nit = nit.Trim();
        Telefono = telefono.Trim();
        Ciudad = ciudad.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
```

### Backend `ClienteConfiguration` (EF Core)

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Nit).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Ciudad).IsRequired().HasMaxLength(100);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Unique index on NIT (uk_clientes_nit) — enforces FR7
        builder.HasIndex(x => x.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
        // Search index on Nombre
        builder.HasIndex(x => x.Nombre).HasDatabaseName("ix_clientes_nombre");
    }
}
```

`EFCore.NamingConventions` via `UseSnakeCaseNamingConvention()` in `AppDbContext.OnModelCreating` handles all column name snake_case conversion automatically. Do NOT add `[Column]` or `[Table]` attributes.

### GET /api/v1/clientes Endpoint Pattern

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
public static class ClienteEndpoints
{
    public static WebApplication MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (IClienteRepository repo, CancellationToken ct) =>
        {
            var clientes = await repo.GetAllAsync(ct);
            var dtos = clientes.Select(c => new ClienteDto(
                c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt));
            return Results.Ok(dtos);
        });
        return app;
    }
}
```

Note: `GetClientesQueryHandler` mediates between endpoint and repository. The endpoint calls the handler (or repository directly for this simple query — either approach is valid per architecture). Use the CQRS handler pattern (`GetClientesQueryHandler`) to keep endpoints thin.

### API Response Contract

```json
// GET /api/v1/clientes → 200 OK
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombre": "Empresa ABC",
    "nit": "900123456-7",
    "telefono": "601 234 5678",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

- Direct array — no wrapper object (per architecture.md Format Patterns)
- `camelCase` fields (auto-serialized by .NET JSON serializer)
- Dates: ISO 8601 with timezone

### Error Handling

Frontend — never expose `error.message` directly to the user:
- Load failure → `<ErrorPanel message="Error al cargar los clientes." onRetry={refetch} />`
- Empty array → `<EmptyState message="No hay clientes registrados. Crea el primero." />`

Backend — `ExceptionHandlingMiddleware` already registered from Story 1.1 handles all unhandled exceptions → Problem Details RFC 7807. No additional error handling needed in the endpoint for Story 2.1 scope.

### Brand Colors & Styling

- Primary brand color: `#0e79fd` (Siesa Blue) — used for selected item border and focus rings
- Neutral text: `text-slate-700` (primary), `text-slate-500` (secondary/NIT)
- Panel border: `border-slate-200`
- Selected item: `bg-blue-50 border-l-4 border-[#0e79fd]`
- Hover state: `hover:bg-slate-50`
- Font: Inter (loaded via project CSS)

### UI Text in Spanish (mandatory)

| Component | Text |
|-----------|------|
| Panel heading | Clientes |
| Search placeholder | Buscar por nombre o NIT... |
| Search aria-label | Buscar cliente |
| List aria-label | Lista de clientes |
| Empty state message | No hay clientes registrados. Crea el primero. |
| Error panel message | Error al cargar los clientes. |
| Retry button | Reintentar |
| Empty search result | Sin resultados para '{searchQuery}' |

### Scope Boundaries

Explicitly OUT OF SCOPE for Story 2.1:
- Client detail panel (right panel) — Story 2.2
- Create/edit/delete client form — Stories 2.3, 2.4, 2.5
- Sort control — Story 2.6
- Contact management — Epic 3
- Backend endpoints: POST, PUT, DELETE — deferred to Stories 2.3–2.5
- Authentication — deferred post-MVP

The `onClienteSelect` prop on `ClienteListView` is a no-op stub in this story. Navigation to the detail view will be wired in Story 2.2.

### Dependency on Previous Stories

- Story 1.1: `frontend/src/shared/lib/apiClient.ts` (Axios singleton), `frontend/src/shared/lib/queryClient.ts`, `frontend/src/app/providers/QueryProvider.tsx` — all must exist
- Story 1.2: `frontend/src/routes/_app/clientes.tsx` exists as placeholder — update this file (do NOT recreate)
- Story 1.3: `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with `UseSnakeCaseNamingConvention()` — add `DbSet<ClienteEntity>` to this existing file

### Test Patterns

**Frontend component test with MSW:**
```typescript
// Example: ClienteListView.test.tsx
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const server = setupServer(
  http.get('http://localhost:5000/api/v1/clientes', () =>
    HttpResponse.json([
      { id: '1', nombre: 'Empresa ABC', nit: '900-1', telefono: '601', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: '2', nombre: 'Garcia & Co', nit: '800-2', telefono: '602', ciudad: 'Medellín', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ])
  )
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**Backend unit test pattern (xUnit, Arrange/Act/Assert):**
```csharp
[Fact]
public void Create_WithEmptyNombre_ThrowsArgumentException()
{
    // Arrange
    // Act & Assert
    var ex = Assert.Throws<ArgumentException>(() =>
        ClienteEntity.Create(string.Empty, "900-1", "601", "Bogotá"));
    Assert.Contains("Nombre", ex.Message);
}
```

### References

- Domain entity + repository interface: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Frontend folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Query key `['clientes']`: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Client-side filter pattern (useMemo, no debounce): [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Diagram]
- EF Core snake_case naming: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- `uk_clientes_nit` unique index: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- GET /api/v1/clientes endpoint: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Error panel + empty state components: [Source: _bmad-output/planning-artifacts/architecture.md#Error handling — frontend]
- Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Brand colors + typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- All UI text in Spanish: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- DateTimeOffset mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Test risks and strategy: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#2. Risk Assessment]
