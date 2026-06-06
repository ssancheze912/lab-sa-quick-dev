# Story 2.1: Client List & Search

Status: ready-for-dev

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width on desktop ≥1024px) renders a scrollable list of all clients, **And** each list item shows the client's Nombre and NIT/RUC, **And** the panel header contains a search input with placeholder `"Buscar por nombre o NIT..."`.

2. **Given** the client list is loaded, **When** the user types any characters in the search field, **Then** the list filters in real time (no submit button required) showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), **And** results are visible within 1 second for up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** the `EmptyState` component (`variant="no-clients"`) is displayed with the message "No hay clientes registrados" and a "Nuevo cliente" CTA button.

4. **Given** a search returns no matching clients, **When** the search field contains text with no results, **Then** the `EmptyState` component (`variant="search-empty"`) is displayed with the message "No se encontró ningún cliente" and the hint "Intenta con otro nombre o NIT".

5. **Given** the backend is unavailable when the page loads, **When** the `GET /api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component is displayed instead of the list with a "Reintentar" button, **And** clicking "Reintentar" re-triggers the TanStack Query `refetch()`.

6. **Given** the client list is loading (first fetch in progress), **When** the component is mounting, **Then** skeleton placeholders (react-loading-skeleton) matching the shape of `ClientListItem` are rendered instead of real content, **And** the container has `aria-busy="true"`.

7. **Given** the application is on a mobile viewport (< 1024px), **When** the user navigates to `/clientes`, **Then** the client list takes full width in a single-column layout, **And** the search input is full-width at the top of the content area, **And** the left panel is the only visible view (detail panel is accessed by tapping a list item).

## Tasks / Subtasks

- [ ] Task 1 — Create `ClienteEntity` domain type and `IClienteRepository` interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — export interface `Cliente { id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — export interface `IClienteRepository { getAll(): Promise<Cliente[]>; }` (read methods only for this story)
  - [ ] TypeScript strict mode: no `any`, all fields typed

- [ ] Task 2 — Create `clienteApiRepository` infrastructure implementation (AC: #1, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Implement `IClienteRepository.getAll()` using the Axios singleton from `frontend/src/shared/lib/apiClient.ts`
  - [ ] `GET /api/v1/clientes` → returns `Cliente[]` (direct array per architecture contract)
  - [ ] Do NOT create a new Axios instance — use the shared `apiClient` singleton

- [ ] Task 3 — Create `useClientes` application hook (AC: #1, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [ ] Use TanStack Query `useQuery` with canonical key `['clientes']`
  - [ ] `queryFn` calls `clienteApiRepository.getAll()`
  - [ ] Export: `{ data: Cliente[] | undefined, isLoading, isError, refetch }`
  - [ ] Default `staleTime`: 0 (always refetch on mount — ensures FR27 compliance)

- [ ] Task 4 — Create `ClientListItem` shared component (AC: #1, #7)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`
  - [ ] Props: `{ cliente: Cliente; isSelected: boolean; onClick: () => void }`
  - [ ] Render: client Nombre (bold, `text-sm font-semibold`) + NIT/RUC (`text-xs text-slate-500`)
  - [ ] States: default (`bg-white border border-slate-200`), hover (`bg-slate-50`), selected (`border-l-4 border-l-[#0e79fd] bg-[#eff6ff]`)
  - [ ] Accessibility: `role="button"`, `aria-label="Ver cliente: {nombre}"`, `aria-pressed={isSelected}`, keyboard: `onKeyDown` handles `Enter` and `Space`
  - [ ] Touch target minimum height: 44px (`min-h-[44px]`)
  - [ ] Use `motion-safe:transition-colors` (respects `prefers-reduced-motion`)

- [ ] Task 5 — Create `EmptyState` shared component (AC: #3, #4)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`
  - [ ] Props: `{ variant: 'no-clients' | 'search-empty' | 'no-contacts'; onAction?: () => void }`
  - [ ] `no-clients`: Heroicon `UserGroupIcon` + "No hay clientes registrados" + "Crea el primer cliente del sistema" + CTA "Nuevo cliente"
  - [ ] `search-empty`: Heroicon `MagnifyingGlassIcon` + "No se encontró ningún cliente" + "Intenta con otro nombre o NIT" (no CTA)
  - [ ] Container: `aria-live="polite"` to announce result changes to screen readers
  - [ ] CTA uses siesa-ui-kit `Button` outline variant (no primary in empty state)

- [ ] Task 6 — Create `ErrorPanel` shared component (AC: #5)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
  - [ ] Props: `{ onRetry: () => void }`
  - [ ] Render: Heroicon `ExclamationTriangleIcon` + "No se pudo cargar la información" + siesa-ui-kit `Button` "Reintentar" (outline variant)
  - [ ] Do NOT display `error.message` or any technical detail

- [ ] Task 7 — Create `ClienteListPanel` presentation component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [ ] Use `useClientes()` hook for data fetching
  - [ ] Search state: `const [searchQuery, setSearchQuery] = useState('')` (local state, NOT Zustand)
  - [ ] Filtering logic: `useMemo` over `clientes` array — `cliente.nombre.toLowerCase().includes(q) || cliente.nit.toLowerCase().includes(q)` (case-insensitive, where `q = searchQuery.toLowerCase()`)
  - [ ] Render states: `isLoading` → skeleton (react-loading-skeleton), `isError` → `<ErrorPanel onRetry={refetch} />`, `filteredClientes.length === 0 && !searchQuery` → `<EmptyState variant="no-clients" />`, `filteredClientes.length === 0 && searchQuery` → `<EmptyState variant="search-empty" />`, otherwise → list of `<ClientListItem />`
  - [ ] Search input: siesa-ui-kit `Input` component (or shadcn `Input` fallback), full-width, `aria-label="Buscar clientes"`, `role="search"` on container, placeholder `"Buscar por nombre o NIT..."`
  - [ ] Panel dimensions: desktop `w-[280px] flex-shrink-0 h-full overflow-y-auto`, mobile `w-full`
  - [ ] Panel header: title "Clientes" (`text-sm font-semibold text-slate-700`) + search input
  - [ ] Selected client: receive `selectedClienteId: string | null` and `onSelectCliente: (id: string) => void` as props (URL sync done in the route)
  - [ ] Skeleton: render 6 × `<Skeleton height={60} />` items while loading

- [ ] Task 8 — Create `/clientes` route with split-panel layout (AC: #1, #7)
  - [ ] Create or update `frontend/src/routes/_app/clientes.tsx`
  - [ ] Import and render `<ClienteListPanel>` in the left panel (280px desktop)
  - [ ] Right panel: placeholder `<ClienteDetailPlaceholder />` (`<div>` with "Selecciona un cliente para ver su detalle") — detail implementation is Story 2.2
  - [ ] Layout: `<div className="flex h-full">` — left panel fixed width, right panel `flex-1 overflow-auto`
  - [ ] Mobile: `flex-col` on base, `flex-row` on `lg:` breakpoint
  - [ ] Selected cliente state: use TanStack Router search params (or `useState`) for `clienteId` — sync with URL in Story 2.2; for this story `selectedClienteId={null}` is acceptable
  - [ ] The route is nested under `_app` pathless layout (already created in Story 1.2)

- [ ] Task 9 — Backend: Create `ClienteEntity` and `clients` table migration (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
    - Fields: `public Guid Id { get; protected set; } = Guid.NewGuid()`, `public string Nombre { get; private set; }`, `public string Nit { get; private set; }`, `public string Telefono { get; private set; }`, `public string Ciudad { get; private set; }`, `public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow`, `public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow`
    - Private constructor + static `Create(string nombre, string nit, string telefono, string ciudad)` factory
    - NEVER use `DateTime` — always `DateTimeOffset`
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — interface with `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default);`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`:
    - Table name (snake_case auto via `ApplySnakeCaseNaming`): `clientes`
    - `Nit` column: unique index `uk_clientes_nit`
    - `Nombre` max length: 255, required
    - `Nit` max length: 50, required
    - `Telefono` max length: 50, required
    - `Ciudad` max length: 100, required
  - [ ] Add `DbSet<ClienteEntity> Clientes { get; set; }` to `AppDbContext.cs`
  - [ ] Apply configuration in `OnModelCreating`: `modelBuilder.ApplyConfiguration(new ClienteConfiguration()); modelBuilder.ApplySnakeCaseNaming();`
  - [ ] Create migration: `dotnet ef migrations add AddClientesTable -p backend/src/SiesaAgents.Infrastructure -s backend/src/SiesaAgents.API`

- [ ] Task 10 — Backend: Create `GetClientesQuery`, handler, and `ClienteDto` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with properties: `Guid Id, string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — record `GetClientesQuery()` (no parameters — returns all)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — injects `IClienteRepository`, calls `GetAllAsync()`, maps to `IEnumerable<ClienteDto>`
  - [ ] Register `GetClientesQueryHandler` in DI in `Program.cs`

- [ ] Task 11 — Backend: Create `ClienteRepository` and `GET /api/v1/clientes` endpoint (AC: #1, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`
    - `GetAllAsync`: `return await _context.Clientes.OrderByDescending(c => c.CreatedAt).ToListAsync(ct);`
    - Use EF Core 10 standard queries (no linq2db needed for simple list — NFR10 scale)
  - [ ] Register `IClienteRepository` → `ClienteRepository` in DI (`Program.cs`)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    - `GET /api/v1/clientes` → calls `GetClientesQueryHandler`, returns `200 OK` with `IEnumerable<ClienteDto>` (direct array, no wrapper object)
    - No authentication (MVP has no auth per architecture decision)
  - [ ] Register endpoint: `app.MapClienteEndpoints()` in `Program.cs`
  - [ ] Scalar is already configured in `Program.cs` — do NOT add Swagger

- [ ] Task 12 — Write frontend unit and component tests (AC: #1–#7)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
    - Test: returns `Cliente[]` on success (MSW mock for `GET /api/v1/clientes`)
    - Test: `isLoading` is true while fetching, `isError` true on network failure
    - Test: `refetch()` re-triggers the query
  - [ ] Create `frontend/src/shared/components/ClientListItem.test.tsx`
    - Test: renders Nombre and NIT/RUC
    - Test: `isSelected=true` applies selected styles (border-left + bg)
    - Test: `onClick` fires on click and on Enter/Space keyboard
    - Test: `aria-label` is correct, `aria-pressed` reflects `isSelected`
  - [ ] Create `frontend/src/shared/components/EmptyState.test.tsx`
    - Test: `variant="no-clients"` renders correct text and CTA
    - Test: `variant="search-empty"` renders correct text, no CTA
    - Test: `aria-live="polite"` present on container
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`
    - Test: renders skeleton while `isLoading=true` (MSW handler with delay)
    - Test: renders `ErrorPanel` with "Reintentar" on fetch failure
    - Test: renders full list when data returns 3 clients
    - Test: search field filters list in real time (type "Constr", assert only matching items visible)
    - Test: renders `EmptyState variant="no-clients"` when data is empty array and searchQuery is empty
    - Test: renders `EmptyState variant="search-empty"` when searchQuery has no matches
    - Test: search input has `aria-label="Buscar clientes"` (WCAG 2.1 AA)
    - Test: axe accessibility check (no critical/serious violations)

- [ ] Task 13 — Write backend unit tests (AC: #1)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - Test: returns empty `IEnumerable<ClienteDto>` when repository returns no entities
    - Test: maps `ClienteEntity` fields correctly to `ClienteDto` (Arrange/Act/Assert)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
    - Test: `ClienteEntity.Create()` sets all fields correctly
    - Test: `Id` is a non-empty Guid
    - Test: `CreatedAt` and `UpdatedAt` are `DateTimeOffset` (not `DateTime`)

## Dev Notes

### Architecture Mapping

This story implements FR1 (list all clients) and FR2 (search by name/NIT) from the PRD.

Clean Architecture layers involved:

```
Presentation:  ClienteListPanel.tsx, ClientListItem.tsx, EmptyState.tsx, ErrorPanel.tsx
Application:   useClientes.ts (TanStack Query hook)
Infrastructure: clienteApiRepository.ts (Axios → REST)
Domain:        Cliente.ts (interface), IClienteRepository.ts
```

Backend layers:

```
API:           GET /api/v1/clientes endpoint in ClienteEndpoints.cs
Application:   GetClientesQuery + GetClientesQueryHandler + ClienteDto
Domain:        ClienteEntity.cs, IClienteRepository.cs
Infrastructure: ClienteRepository.cs, ClienteConfiguration.cs, migration
```

### Search Implementation

Search is **client-side only** — no search API endpoint for this story. Architecture decision (architecture.md): TanStack Query loads all records on mount (`queryKey: ['clientes']`), filtering is a `useMemo` in the component (< 50ms for ≤500 records, NFR1 compliant).

```typescript
// In ClienteListPanel.tsx
const filteredClientes = useMemo(() => {
  if (!searchQuery) return clientes ?? []
  const q = searchQuery.toLowerCase()
  return (clientes ?? []).filter(
    c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  )
}, [clientes, searchQuery])
```

### TanStack Query Key

Canonical key per architecture: `['clientes']`. This key is invalidated by mutations in Stories 2.3–2.5.

```typescript
useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })
```

### File Structure

```
frontend/src/
  modules/crm/clientes/
    domain/
      Cliente.ts
      IClienteRepository.ts
    application/
      useClientes.ts
      useClientes.test.ts
    infrastructure/
      clienteApiRepository.ts
    presentation/
      ClienteListPanel.tsx
      ClienteListPanel.test.tsx
  shared/components/
    ClientListItem.tsx
    ClientListItem.test.tsx
    EmptyState.tsx
    EmptyState.test.tsx
    ErrorPanel.tsx
  routes/_app/
    clientes.tsx          ← Updated with split-panel layout

backend/src/
  SiesaAgents.Domain/Clientes/
    Entities/ClienteEntity.cs
    Interfaces/IClienteRepository.cs
  SiesaAgents.Application/Clientes/
    DTOs/ClienteDto.cs
    Queries/GetClientesQuery.cs
    Queries/GetClientesQueryHandler.cs
  SiesaAgents.Infrastructure/
    Data/Configurations/ClienteConfiguration.cs
    Repositories/ClienteRepository.cs
  SiesaAgents.API/Endpoints/
    ClienteEndpoints.cs

backend/tests/
  SiesaAgents.UnitTests/
    Application/Clientes/GetClientesQueryHandlerTests.cs
    Domain/ClienteEntityTests.cs
```

### Backend Entity Pattern

```csharp
// ClienteEntity.cs — mandatory pattern per company-standards.md
public class ClienteEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad
        };
    }
}
```

### API Response Contract

```
GET /api/v1/clientes
Response: 200 OK
Body: ClienteDto[] (direct array, no wrapper)
[
  { "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...",
    "createdAt": "2026-06-06T10:00:00Z", "updatedAt": "2026-06-06T10:00:00Z" }
]
```

Per architecture.md: JSON responses are camelCase (auto-serialized by .NET). `DateTimeOffset` values are ISO 8601 with timezone.

### Layout — Desktop Split Panel

```tsx
// frontend/src/routes/_app/clientes.tsx
<div className="flex h-full overflow-hidden">
  {/* Left panel — fixed width desktop */}
  <aside className="w-full lg:w-[280px] lg:flex-shrink-0 border-r border-slate-200 overflow-y-auto">
    <ClienteListPanel selectedClienteId={null} onSelectCliente={() => {}} />
  </aside>
  {/* Right panel — detail (Story 2.2) */}
  <main className="hidden lg:flex flex-1 items-center justify-center text-slate-400 text-sm">
    Selecciona un cliente para ver su detalle
  </main>
</div>
```

### Skeleton Loading Pattern

```tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// In ClienteListPanel while isLoading:
<div aria-busy="true">
  {Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="p-3 border-b border-slate-100">
      <Skeleton height={16} width="70%" />
      <Skeleton height={12} width="40%" className="mt-1" />
    </div>
  ))}
</div>
```

### siesa-ui-kit Component Usage

Per company standards, check siesa-ui-kit first:
- Search `Input` → use siesa-ui-kit `Input` component if available in installed version
- `Button` for "Reintentar" and "Nuevo cliente" CTA → use siesa-ui-kit `Button`
- If siesa-ui-kit does not export these components, fall back to shadcn/ui `Input` + `Button`

### EF Core snake_case

`modelBuilder.ApplySnakeCaseNaming()` auto-converts PascalCase to snake_case:
- `ClienteEntity` → table `clientes`
- `Nit` → column `nit`
- `CreatedAt` → column `created_at`

No manual `[Column]` or `[Table]` attributes — company standard enforced.

### CORS

`GET /api/v1/clientes` is a cross-origin request from `localhost:5173` (frontend) to `localhost:5000` (backend). CORS is already configured in `Program.cs` (Story 1.1) — no changes needed.

### Error Handling

Frontend: never display `error.message` or any technical detail. Use `<ErrorPanel onRetry={refetch} />` for load failures.

Backend: `ExceptionHandlingMiddleware` catches all exceptions → Problem Details RFC 7807. No stack traces exposed (NFR6).

### Accessibility Requirements

- Search input: `aria-label="Buscar clientes"` (Spanish), container `role="search"`
- Client list: `role="list"` on `<ul>`, `role="listitem"` / `role="button"` on each item
- Loading skeleton: `aria-busy="true"` on container
- Empty state: `aria-live="polite"` — screen reader announces result changes
- All interactive elements: minimum 44×44px touch target (WCAG 2.1 AA)
- Icon-only buttons: `aria-label` in Spanish
- All user-facing text in Spanish (company P0 rule)

### Brand / Design Tokens

Per company-standards.md:
- Primary: `#0e79fd` (Siesa Blue) — selected item border, focus rings, search focus
- Neutrals: `slate-*` Tailwind scale — backgrounds, borders, secondary text
- Dark mode: class-based (`dark:` prefix) — implement via Tailwind dark variants
- Selected item: `border-l-4 border-l-[#0e79fd] bg-[#eff6ff]` (primary-50 equivalent)

### References

- FR1, FR2 functional requirements: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- NFR1 (search < 1s, 500 records): [Source: _bmad-output/planning-artifacts/architecture.md#Non-Functional Requirements]
- Frontend folder structure (modules/crm/clientes): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- TanStack Query canonical keys: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Clean Architecture layers: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Architecture: Clean Architecture + DDD]
- ClienteListPanel (280px left panel) + split layout: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design]
- Backend entity pattern (private constructor + Create factory + DateTimeOffset): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- EF Core snake_case via ApplySnakeCaseNaming: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core]
- API response shapes (direct array GET list): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- EmptyState + ErrorPanel components: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- Search performance risk R-003: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Risk Assessment]
- CORS already configured (Story 1.1): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied]
- WCAG 2.1 AA accessibility: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Skeleton loading states: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
