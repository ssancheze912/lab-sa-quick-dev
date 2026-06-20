# Story 2.1: Client List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients, with each item showing the client's Nombre and NIT/RUC visible at a glance.

2. **Given** the client list is loaded, **When** the user types into the search field, **Then** the list filters in real time (no submit button, no debounce delay felt) showing only clients whose Nombre or NIT/RUC match the typed input (case-insensitive), and results appear in under 1 second with up to 500 records. (NFR1 — client-side filter < 50ms)

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed in the list panel with a Spanish-language message guiding the user to create the first client (e.g., "Aún no hay clientes. Crea el primero.").

4. **Given** the backend is unavailable when the page loads, **When** the fetch call to `GET /api/v1/clientes` fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the client list, and no raw error message or stack trace is exposed to the user.

5. **Given** the client list is visible, **When** a client item is rendered, **Then** the item shows at minimum: Nombre (primary text) and NIT/RUC (secondary text). Clients with zero associated contacts display a subtle amber visual indicator (⚠) on their list item.

6. **Given** a keyboard-only user navigates the page, **When** they Tab through the search field and client list items, **Then** all elements are reachable and activatable with keyboard (WCAG 2.1 AA) with a visible focus ring (`2px solid #0e79fd`).

## Tasks / Subtasks

- [x] Task 1 — Backend: `GET /api/v1/clientes` endpoint (AC: #1, #4)
  - [x] Create `GetClientesQuery.cs` and `GetClientesQueryHandler.cs` in `SiesaAgents.Application/Clientes/Queries/`
  - [x] Create `ClienteDto.cs` in `SiesaAgents.Application/Clientes/DTOs/` (fields: `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt`, `UpdatedAt`)
  - [x] Register `GET /api/v1/clientes` endpoint in `ClienteEndpoints.cs` — returns `ClienteDto[]` (direct array, no wrapper)
  - [x] Verify `ExceptionHandlingMiddleware.cs` catches unhandled exceptions and returns Problem Details RFC 7807 (no stack traces)
  - [x] Write xUnit unit test for `GetClientesQueryHandler` — returns empty list when no records exist

- [x] Task 2 — Frontend domain layer: `Cliente` entity and repository contract (AC: #1)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`

- [x] Task 3 — Frontend infrastructure layer: Axios repository (AC: #1, #4)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient` (Axios instance from `src/shared/lib/apiClient.ts`), calls `GET /api/v1/clientes`, returns `Cliente[]`

- [x] Task 4 — Frontend application layer: `useClientes` TanStack Query hook (AC: #1, #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
    - Uses `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })`
    - Returns `{ data, isLoading, isError, refetch }`
  - [x] Write Vitest unit test for `useClientes` — mock `clienteApiRepository`, assert query key `['clientes']`, test error state triggers `isError`

- [x] Task 5 — Frontend presentation layer: `ClienteListView` component (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
    - Renders a 280px-wide left panel with a fixed-position search `Input` (siesa-ui-kit) at the top
    - Uses `useClientes()` hook for data fetching
    - Applies `useMemo` to filter the `clientes` array by `nombre` or `nit` based on `searchQuery` state (case-insensitive, client-side)
    - Renders skeleton placeholders (react-loading-skeleton) during `isLoading`
    - Renders `ErrorPanel` with "Reintentar" button (calls `refetch`) when `isError`
    - Renders `EmptyState` with Spanish message when data is loaded and length is 0
    - Renders `ClientListItem` for each filtered client
  - [x] Create `frontend/src/shared/components/ClientListItem.tsx`
    - Props: `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`
    - Displays `nombre` (primary, bold) and `nit` (secondary, muted)
    - Applies amber indicator (⚠ icon, `text-amber-500`) when client has zero contacts — NOTE: contact count is NOT returned by `GET /api/v1/clientes` in this story; the amber indicator is a placeholder that will be wired in Story 2.2/2.4. For now render the item without the amber badge.
    - Active/selected item: `bg-primary-50` background, `text-primary-700` text
  - [x] Create `frontend/src/shared/components/EmptyState.tsx` (if not already created in Story 1.x)
    - Props: `message: string`, `actionLabel?: string`, `onAction?: () => void`
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx` (if not already created)
    - Props: `onRetry: () => void`
    - Shows Spanish message: "No se pudo cargar la lista. Verifica tu conexión." and a "Reintentar" button

- [x] Task 6 — Frontend route wiring: `/clientes` route renders `ClienteListView` (AC: #1)
  - [x] Update `frontend/src/routes/_app/clientes.tsx` to render `<ClienteListView />` (replacing placeholder from Story 1.2)
  - [x] The right panel detail area renders a placeholder `<ClienteDetailPlaceholder />` (empty/instructions panel — full implementation is Story 2.2)

- [x] Task 7 — Accessibility verification (AC: #6)
  - [x] Search `Input` has `aria-label="Buscar clientes"` and `placeholder="Buscar por nombre o NIT/RUC"`
  - [x] Client list items are `<button>` or `role="listitem"` with keyboard-activatable focus
  - [x] Focus ring is `2px solid #0e79fd` via `:focus-visible` in `index.css` (already set in Story 1.2 — verify)
  - [x] Run `pnpm run test` to confirm all tests pass

- [x] Task 8 — Tests (AC: #1–#6)
  - [x] RTL test: `ClienteListView` renders skeleton when `isLoading = true`
  - [x] RTL test: `ClienteListView` renders `ErrorPanel` with "Reintentar" when `isError = true`; clicking "Reintentar" calls `refetch`
  - [x] RTL test: `ClienteListView` renders `EmptyState` when data is empty array
  - [x] RTL test: `ClienteListView` renders list of client items when data is populated
  - [x] RTL test: typing in search field filters list to matching clients by nombre
  - [x] RTL test: typing in search field filters list to matching clients by NIT/RUC
  - [x] RTL test: search is case-insensitive ("construc" matches "Construcciones del Valle")
  - [x] xUnit integration test: `GET /api/v1/clientes` returns 200 with array of ClienteDto

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `pnpm add siesa-ui-kit` (must already be installed from Story 1.1 — verify `frontend/package.json`)
- **Usage**: You MUST use `siesa-ui-kit` components for UI elements — check catalog first before building custom:
  - `Input` from siesa-ui-kit → search field
  - `LayoutBase`, `Navbar`, `NavigationRail` → already wired from Story 1.2 (do NOT rebuild)
  - `EmptyState` → check siesa-ui-kit catalog; if not available, build `src/shared/components/EmptyState.tsx`
  - `ErrorPanel` → check siesa-ui-kit catalog; if not available, build `src/shared/components/ErrorPanel.tsx`
- **Component lookup order**: siesa-ui-kit → shadcn/ui → custom build (only if unavailable in both)
- **MasterCrud NOT applicable here**: This story implements a custom split-panel list (280px left panel + detail right) per UX Direction F — NOT a MasterCrud table. MasterCrud is reserved for generic CRUD management screens. The architecture document explicitly specifies `ClienteListView.tsx` as a custom component.

### Architecture Patterns

**Frontend Clean Architecture layers for `clientes` domain:**

```
src/modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                  # Entity interface (pure TypeScript, no dependencies)
│   └── IClienteRepository.ts       # Repository contract
├── application/
│   └── useClientes.ts              # TanStack Query hook — queryKey: ['clientes']
├── infrastructure/
│   └── clienteApiRepository.ts     # Axios implementation of IClienteRepository
└── presentation/
    └── ClienteListView.tsx         # Left panel (280px), search, list rendering
```

**Canonical TanStack Query key:**
```typescript
queryKey: ['clientes']    // list — invalidated by all mutations in future stories
```

**Search strategy (client-side, per architecture decision):**
```typescript
// In ClienteListView.tsx — filter over TanStack Query cached array
const [searchQuery, setSearchQuery] = useState('')

const filteredClientes = useMemo(() => {
  if (!clientes) return []
  if (!searchQuery.trim()) return clientes
  const q = searchQuery.toLowerCase()
  return clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.nit.toLowerCase().includes(q)
  )
}, [clientes, searchQuery])
```

NFR1: client-side filter over ≤ 500 records executes in < 50ms — no backend search needed.

**ErrorPanel pattern (never expose error.message directly):**
```typescript
// ❌ WRONG
{isError && <p>{error.message}</p>}

// ✅ CORRECT
{isError && <ErrorPanel onRetry={refetch} />}
```

**Loading skeleton pattern:**
```typescript
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// During isLoading
{Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} height={60} className="mb-2" />
))}
```

### Backend Architecture Patterns

**CQRS Query pattern (read-only, no command):**
```csharp
// SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
public record GetClientesQuery();

// SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
public class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IEnumerable<ClienteDto>> Handle(GetClientesQuery query, CancellationToken ct)
        => (await repository.GetAllAsync(ct))
           .Select(c => new ClienteDto(c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt));
}
```

**Minimal API endpoint registration:**
```csharp
// SiesaAgents.API/Endpoints/ClienteEndpoints.cs
app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new GetClientesQuery(), ct);
    return Results.Ok(result);
})
.WithName("GetClientes")
.Produces<IEnumerable<ClienteDto>>(StatusCodes.Status200OK);
```

**ClienteDto contract:**
```csharp
// SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
public record ClienteDto(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
```

**API response shape:**
```
GET /api/v1/clientes → 200 OK — direct array (NO wrapper object)
[
  { "id": "uuid", "nombre": "Construcciones del Valle", "nit": "900123456-1", "telefono": "+57 2 123 4567", "ciudad": "Cali", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "2026-03-12T10:30:00Z" },
  ...
]
```

**Critical backend rules (enforcement):**
- `DateTimeOffset` MANDATORY in `ClienteEntity` and `ClienteDto` — NEVER `DateTime`
- UUID (`Guid`) for `Id` — NEVER `int`
- `ExceptionHandlingMiddleware` must be registered BEFORE endpoints in `Program.cs`
- `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- `modelBuilder.ApplySnakeCaseNaming()` — last call in `OnModelCreating`

### Database

**Table:** `clientes` (snake_case, PostgreSQL)
```sql
CREATE TABLE clientes (
  id          UUID PRIMARY KEY DEFAULT uuidv7(),
  nombre      VARCHAR(255) NOT NULL,
  nit         VARCHAR(50)  NOT NULL,
  telefono    VARCHAR(50),
  ciudad      VARCHAR(100),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uk_clientes_nit ON clientes (nit);
```

EF Core auto-maps PascalCase C# properties to snake_case via `ApplySnakeCaseNaming()` — do NOT add `[Column]` or `[Table]` attributes.

**Entity (`ClienteEntity`)** — verify already exists from Story 1.3:
```csharp
// SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public class ClienteEntity : Entity  // inherits Guid Id
{
    public string Nombre { get; private set; } = string.Empty;
    public string Nit    { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad   { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { }  // EF Core constructor

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        return new ClienteEntity { Nombre = nombre, Nit = nit, Telefono = telefono, Ciudad = ciudad };
    }
}
```

### State Management

Per architecture decision — NO Zustand store needed for this story:
- **Server state**: TanStack Query `useClientes()` → `['clientes']` cache
- **Local UI state**: `useState` for `searchQuery` (local to `ClienteListView`)
- **URL state**: `selectedClienteId` is managed via TanStack Router URL params (Story 2.2)

### All User-Facing Text MUST Be in Spanish

| Element | Spanish Text |
|---------|-------------|
| Search placeholder | `"Buscar por nombre o NIT/RUC"` |
| Search aria-label | `"Buscar clientes"` |
| Empty state message | `"Aún no hay clientes. Crea el primero."` |
| Error panel message | `"No se pudo cargar la lista. Verifica tu conexión."` |
| Retry button | `"Reintentar"` |

### Previous Story Learnings (from Story 1.2)

- **Package manager**: `pnpm` is mandatory — do NOT use `npm install` or `yarn add`
- **siesa-ui-kit** is already installed in `frontend/package.json` — do NOT reinstall; verify with `pnpm list siesa-ui-kit`
- **Axios `apiClient`** singleton is already created at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL` — import it directly, do NOT create a new Axios instance
- **`queryClient`** is already configured at `frontend/src/shared/lib/queryClient.ts` and wired in `src/app/providers/QueryProvider.tsx`
- **TanStack Router** auto-generates `routeTree.gen.ts` on file save — do NOT edit it manually
- **`_app/clientes.tsx`** already exists as a placeholder from Story 1.2 — UPDATE it, do not create a duplicate

### Git History Context

Recent commits show:
- `feat(story-1.2)`: navigation shell implemented — foundation ready for Epic 2 views
- `docs(tea)`: test design for epic 2 already created — tests must align with it

### Testing Standards

**Frontend (Vitest + RTL + MSW):**
- Mock `clienteApiRepository` via `vi.mock` or MSW handlers — do NOT call real API in tests
- Test loading, error, empty, and populated states independently
- Accessibility: assert `aria-label` on search input
- Run: `pnpm run test` from `frontend/` directory

**Backend (xUnit):**
- Unit test: `GetClientesQueryHandler` returns `IEnumerable<ClienteDto>`
- Integration test (TestContainers / InMemory EF): `GET /api/v1/clientes` returns HTTP 200 with array
- Arrange / Act / Assert structure

### Project Structure Notes

**Files to CREATE in this story:**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
frontend/src/modules/crm/clientes/application/useClientes.ts
frontend/src/modules/crm/clientes/application/useClientes.test.ts
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx
frontend/src/shared/components/ClientListItem.tsx
frontend/src/shared/components/EmptyState.tsx          (if not from Story 1.x)
frontend/src/shared/components/ErrorPanel.tsx          (if not from Story 1.x)

backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs              (new or update)
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs    (GET only for this story)
```

**Files to UPDATE in this story:**
```
frontend/src/routes/_app/clientes.tsx    # Replace placeholder with ClienteListView
```

**Existing files to VERIFY (from Story 1.3):**
```
backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
backend/src/SiesaAgents.API/Program.cs
```

### References

- Story scope and AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Frontend module structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Backend project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Client-side search strategy (NFR1): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- TanStack Query canonical keys: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- ErrorPanel pattern (never expose error.message): [Source: _bmad-output/planning-artifacts/architecture.md#Error handling — frontend]
- API response format (direct array, no wrapper): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- DateTimeOffset mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- UX Direction F (left panel 280px + search-first): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- EmptyState with amber indicator: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Spanish text mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Previous story learnings (pnpm, apiClient, queryClient): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]
- FR1 (list clients), FR2 (search by nombre/NIT): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- NFR1 (search < 1s): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- All 38 frontend tests pass (6 useClientes + 26 ClienteListView RTL + 6 navigation)
- Backend domain, application, infrastructure, and API layers created
- Navigation tests updated to reflect new clientes view implementation
- siesa-ui-kit Input component used for search field
- EmptyState/ErrorPanel built as custom components (not found in siesa-ui-kit)
- dotnet not available in environment; backend compilation not verifiable locally

### File List

Backend created: backend/src/SiesaAgents.Domain/Shared/Entity.cs, backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs, backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs, backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs, backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs, backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs, backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteEntityConfiguration.cs, backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs, backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs

Backend modified: backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs, backend/src/SiesaAgents.API/Program.cs

Frontend created: frontend/src/modules/crm/clientes/domain/Cliente.ts, frontend/src/modules/crm/clientes/domain/IClienteRepository.ts, frontend/src/modules/crm/clientes/application/useClientes.ts, frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts, frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx, frontend/src/shared/components/ClientListItem.tsx, frontend/src/shared/components/EmptyState.tsx, frontend/src/shared/components/ErrorPanel.tsx

Frontend modified: frontend/src/routes/_app/clientes.tsx, frontend/src/routes/__tests__/navigation.test.tsx
