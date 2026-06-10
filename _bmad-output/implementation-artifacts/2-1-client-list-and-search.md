# Story 2.1: Client List & Search

Status: ready

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list.

## Tasks / Subtasks

- [ ] Task 1 — Create `Cliente` domain entity and repository interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string }`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>` and `getById(id: string): Promise<Cliente>`

- [ ] Task 2 — Create infrastructure layer: API repository and client (AC: #1, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository`, calls `GET /api/v1/clientes` via the shared `apiClient` Axios instance from `src/shared/lib/apiClient.ts`
  - [ ] Ensure `apiClient` base URL is read from `import.meta.env.VITE_API_URL` (already set in `src/shared/lib/apiClient.ts` from Story 1.1)

- [ ] Task 3 — Create `useClientes` application hook (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook: `queryKey: ['clientes']`, `queryFn: clienteApiRepository.getAll`, `staleTime: 0`
  - [ ] The hook returns: `{ data: Cliente[] | undefined, isLoading, isError, refetch }`
  - [ ] Export a `useClientesFiltrados(searchQuery: string)` function (or implement within the hook file) using `useMemo` to filter `data` by matching `nombre` or `nit` (case-insensitive) against `searchQuery`; returns the filtered array

- [ ] Task 4 — Create shared `EmptyState` component (AC: #3)
  - [ ] Check `siesa-ui-kit` catalog first — if an empty state component exists, use it; otherwise create `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `{ message: string; actionLabel?: string; onAction?: () => void }`
  - [ ] Renders a centered container with a Heroicons icon (e.g., `UserGroupIcon`), the `message` text, and an optional action button
  - [ ] All text content in Spanish; add `data-testid="empty-state"` to the root element
  - [ ] WCAG 2.1 AA: icon has `aria-hidden="true"`, text is readable at minimum contrast ratio

- [ ] Task 5 — Create shared `ErrorPanel` component (AC: #4)
  - [ ] Check `siesa-ui-kit` catalog first — if an error panel component exists, use it; otherwise create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `{ onRetry: () => void }`
  - [ ] Renders a message "No se pudieron cargar los datos." and a "Reintentar" button calling `onRetry`
  - [ ] Add `data-testid="error-panel"` to root element; button has `data-testid="retry-button"`
  - [ ] Never renders `error.message` directly to the user

- [ ] Task 6 — Create `ClientListItem` shared component (AC: #1)
  - [ ] Check `siesa-ui-kit` catalog first — if a list item component exists, use it; otherwise create `frontend/src/shared/components/ClientListItem.tsx`
  - [ ] Props: `{ cliente: Cliente; isSelected?: boolean; onClick: () => void }`
  - [ ] Renders `nombre` (primary text) and `nit` (secondary text) per item
  - [ ] Applies active/selected styling using Siesa brand colors (`primary-50` background, `primary-700` text) when `isSelected` is true
  - [ ] Add `data-testid="client-list-item"` to root element; `aria-selected` attribute reflects `isSelected`

- [ ] Task 7 — Create `ClienteListPanel` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [ ] Fixed width: `w-[280px]` (TailwindCSS v4), full height, scrollable (`overflow-y-auto`)
  - [ ] Contains a search `<input>` with `placeholder="Buscar por nombre o NIT/RUC"` and `data-testid="search-input"`; controlled via local `useState<string>('')`
  - [ ] On `isLoading` → renders skeleton placeholders using `react-loading-skeleton` (NOT spinners); add `data-testid="loading-skeleton"`
  - [ ] On `isError` → renders `<ErrorPanel onRetry={refetch} />`
  - [ ] On empty `data` (zero clients) → renders `<EmptyState message="No hay clientes registrados. Crea el primero." />`
  - [ ] On data present + filtered results → renders a scrollable list of `<ClientListItem>` components
  - [ ] Search filtering: uses `useMemo` to derive filtered list from `data` and `searchQuery` — NO additional API call
  - [ ] `ClientListItem` `isSelected` is `true` when its `cliente.id` matches the current `clienteId` URL param (read via TanStack Router `useParams`)
  - [ ] Clicking a `ClientListItem` navigates to `/clientes/:clienteId` via TanStack Router `useNavigate` (FR28, no page reload)
  - [ ] Styling: TailwindCSS v4, Inter font, Siesa brand colors; user-facing text in Spanish

- [ ] Task 8 — Wire `ClienteListPanel` into the `/clientes` route (AC: #1, #2, #3, #4)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `<ClienteListPanel />` in the left panel (280px)
  - [ ] The right panel renders a placeholder `<div data-testid="cliente-detail-placeholder">Selecciona un cliente</div>` (detail panel content is Story 2.2)
  - [ ] Layout: `flex h-full` container — left panel `w-[280px] border-r` + right panel `flex-1` (consistent with architecture split-panel spec)
  - [ ] Route file uses `createFileRoute('/clientes')` — TanStack Router file-based routing

- [ ] Task 9 — Write unit and component tests (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`:
    - Test T2.1-004: search by Nombre filters list in real time (useMemo filter returns correct subset)
    - Test T2.1-005: search by NIT/RUC filters list correctly
    - Test T2.1-006 (P3): filter 500 mock clients in under 100ms using `performance.now()`
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`:
    - Test T2.1-001: list renders with Nombre + NIT/RUC visible per item (MSW: mock `GET /api/v1/clientes` with 3 clients)
    - Test T2.1-002: `EmptyState` shown when API returns empty array
    - Test T2.1-003: `ErrorPanel` + "Reintentar" button shown on fetch failure (MSW: network error)
    - Test T2.1-007 (P3): clearing search input restores full list
  - [ ] All tests use Vitest + React Testing Library + MSW
  - [ ] Test `QueryClient` configured with `retry: 0` and `staleTime: 0` to prevent caching interference

- [ ] Task 10 — Backend: `GET /api/v1/clientes` endpoint (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`; static `Create()` factory; base class `Entity` from `SiesaAgents.Domain`
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` and `GetClientesQueryHandler.cs` — returns `IEnumerable<ClienteDto>`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — EF Core `DbContext` with `DbSet<ClienteEntity>` Clientes; apply `modelBuilder.ApplySnakeCaseNaming()` as LAST call in `OnModelCreating`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — `IEntityTypeConfiguration<ClienteEntity>`: table `clientes`, PK `id`, unique index `uk_clientes_nit` on `Nit`, `CreatedAt` and `UpdatedAt` with default value
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `IClienteRepository`, uses EF Core `AppDbContext`; `GetAllAsync` returns `await _context.Clientes.AsNoTracking().ToListAsync(ct)`
  - [ ] Register `AppDbContext` in `Program.cs` with Npgsql provider reading `ConnectionStrings:DefaultConnection`; register `IClienteRepository` → `ClienteRepository` as scoped
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — Minimal API: `app.MapGet("/api/v1/clientes", ...)` calls `GetClientesQueryHandler`, returns `200 OK` with `IEnumerable<ClienteDto>` (direct array, no wrapper)
  - [ ] Create EF Core migration: `dotnet ef migrations add AddClienteEntity -p src/SiesaAgents.Infrastructure -s src/SiesaAgents.API`

- [ ] Task 11 — Backend unit test: `GetClientesQueryHandler` (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
  - [ ] Test: handler returns empty list when repository returns no clients
  - [ ] Test: handler returns `ClienteDto` list mapped from `ClienteEntity` list
  - [ ] Uses xUnit + Moq (or NSubstitute) to mock `IClienteRepository`
  - [ ] Structure: Arrange / Act / Assert

## Dev Notes

### Architecture Context

This story implements the client list view that forms the left panel of the split-panel layout at `/clientes`. Per the architecture document, the right panel (client detail) is implemented in Story 2.2. This story only delivers the left panel and an empty right-panel placeholder.

**Frontend module path:** `src/modules/crm/clientes/` following Clean Architecture + DDD layers: `domain/`, `application/`, `infrastructure/`, `presentation/`.

**Route:** `frontend/src/routes/_app/clientes.tsx` uses TanStack Router `createFileRoute('/clientes')`. The `_app` prefix is a pathless layout route (no URL segment).

### Search Strategy

Per architecture decision, search is **client-side only** for MVP (up to 500 records). The `useClientes` hook fetches all clients once (`queryKey: ['clientes']`). The `ClienteListPanel` uses `useMemo` to derive a filtered array from the cached data and the `searchQuery` string. No additional API call is made on search input — this satisfies NFR1 (< 1s with 500 records) with sub-100ms performance.

```typescript
// useMemo filter pattern (in ClienteListPanel or co-located utility)
const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return data ?? []
  const q = searchQuery.toLowerCase()
  return (data ?? []).filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

### TanStack Query Key

Canonical query key for the full clients list: `['clientes']`. This key will be invalidated by mutation hooks in Stories 2.3, 2.4, and 2.5 to implement FR27 (immediate list update).

```typescript
// useClientes.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: clienteApiRepository.getAll,
    staleTime: 0,
  })
}
```

### Backend Entity Pattern

Per company standards, `ClienteEntity` must use a private constructor and a static `Create()` factory method:

```csharp
public class ClienteEntity : Entity
{
    private ClienteEntity() { }

    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        // Validate non-null, non-empty
        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
        };
    }
}
```

### EF Core Configuration Rules

- `DateTimeOffset` ALWAYS — NEVER `DateTime`
- `ApplySnakeCaseNaming()` MUST be the last call in `OnModelCreating`
- No manual `[Column]` or `[Table]` attributes — automatic snake_case conversion
- Unique index on `nit` column: `uk_clientes_nit`

```csharp
// ClienteConfiguration.cs
builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
```

### API Response Format

`GET /api/v1/clientes` returns a direct JSON array (no wrapper object):

```json
[
  { "id": "uuid", "nombre": "Empresa ABC", "nit": "123456789", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-06-10T10:00:00Z", "updatedAt": "2026-06-10T10:00:00Z" }
]
```

Empty list returns `200 OK` with `[]` — never a `404`.

### Error Handling

- **Frontend load failure:** TanStack Query `isError` → render `<ErrorPanel onRetry={refetch} />`. Never display `error.message` directly.
- **Backend errors:** `ExceptionHandlingMiddleware` (already in place from Story 1.1) returns Problem Details RFC 7807.

### Loading State

Use `react-loading-skeleton` for skeleton placeholders while `isLoading` is true — NOT spinners. Per company standards: skeleton screens, not spinners.

### UI Components Checklist

Before creating any custom component, check in this order:
1. `siesa-ui-kit` catalog — use native component if available
2. `shadcn/ui` via MCP (if not in siesa-ui-kit)
3. Custom component only as last resort

Components needed: `EmptyState`, `ErrorPanel`, `ClientListItem`, search `<input>`. The search input can be a plain styled HTML input using TailwindCSS v4.

### Styling

- Brand primary color: `#0e79fd` (Siesa Blue) — TailwindCSS class: `text-primary-700`, `bg-primary-50`
- Neutrals: Tailwind `slate-*` scale
- Font: Inter (weights 300, 400, 700)
- Dark mode: class-based (`dark:` prefix)
- Panel width: `w-[280px]` (fixed), full height `h-full`, scrollable `overflow-y-auto`

### Test Setup

All component tests must wrap the component under test with:
- `QueryClientProvider` using a test `QueryClient` configured with `retry: 0` and `staleTime: 0`
- TanStack Router test utilities (`createMemoryHistory`, `createRouter`) for route-dependent components

MSW handlers required for this story (create in `frontend/src/test/handlers/clientes.ts`):
```typescript
http.get('/api/v1/clientes', () => HttpResponse.json([/* mock data */]))
```

### References

- Architecture split-panel layout and search strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- TanStack Query keys and mutation invalidation patterns: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- FR1, FR2, FR3, FR4 (client list and search): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- NFR1 (search < 1s with 500 records): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md]
- Test scenarios T2.1-001 through T2.1-007: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Story 2.1: Client List & Search]
- Risks R-003, R-004: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#2. Risk Assessment]
- Epic acceptance criteria AC-E2.1, AC-E2.2: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md]
- Company stack standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Backend entity pattern and DB conventions: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
