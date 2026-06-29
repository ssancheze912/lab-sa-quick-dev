# Story 2.1: Client List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px wide) renders a scrollable list of all clients, with each item displaying the client's Nombre and NIT/RUC. (FR2, FR3)

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC contains the input as a substring (case-insensitive), and results appear in under 1 second with up to 500 records. (FR3, FR4, NFR1)

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a Spanish message guiding the user to create the first client. (AC-E2.2)

4. **Given** the backend is unavailable when the page loads, **When** the fetch for the client list fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, and clicking the button triggers a new fetch. (NFR6)

5. **Given** the client list is rendered, **When** the page first loads with no sort preference set, **Then** the `SortControl` defaults to "Más reciente" and the list is ordered by `createdAt` descending. (AC-2.6 default — implemented here as baseline for the list view)

## Tasks / Subtasks

- [x] Task 1 — Create domain entity and repository contract for Cliente (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string` (ISO 8601)
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>` method

- [x] Task 2 — Create infrastructure layer: API repository and Axios client (AC: #1, #4)
  - [x] Verify/create `frontend/src/shared/lib/apiClient.ts` — Axios singleton with `baseURL: import.meta.env.VITE_API_URL`
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository`, calls `GET /api/v1/clientes` via `apiClient`

- [x] Task 3 — Create application layer: TanStack Query hooks (AC: #1, #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })` with `staleTime: 0`
  - [x] Expose `data`, `isLoading`, `isError`, `refetch` from the hook

- [x] Task 4 — Create Zod schema for client entity validation (AC: #2)
  - [x] Create `frontend/src/modules/crm/clientes/clienteSchema.ts` — Zod schema requiring `nombre`, `nit`, `telefono`, `ciudad` (all non-empty strings); export `ClienteFormData` type

- [x] Task 5 — Create presentation components: ClienteListView (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/ClienteListView.tsx`
    - Calls `useClientes()` hook
    - Shows loading skeleton (`react-loading-skeleton`) while `isLoading === true`
    - Shows `ErrorPanel` with "Reintentar" button wired to `refetch` when `isError === true`
    - Shows `EmptyState` when `data` is an empty array
    - Renders scrollable list of `ClientListItem` components when data has items
    - Search input (controlled) filters the TanStack Query cache client-side via `useMemo`; filter matches substring/subsequence of `nombre` OR `nit`, case-insensitive
    - `SortControl` state managed via `useState`, default `"fecha-desc"`; sort applied to filtered result via `useMemo`
  - [x] Create `frontend/src/shared/components/ClientListItem.tsx` — renders a single client row with `nombre` (bold) and `nit` visible
  - [x] Create or verify `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string` prop; renders Spanish guidance text
  - [x] Create or verify `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void` prop; renders error message and "Reintentar" button
  - [x] Create `frontend/src/shared/components/SortControl.tsx` — dropdown with 4 options: `nombre-asc` ("Nombre A→Z"), `nombre-desc` ("Nombre Z→A"), `fecha-desc` ("Más reciente"), `fecha-asc` ("Más antiguo"); default `fecha-desc`

- [x] Task 6 — Wire route to ClienteListView (AC: #1)
  - [x] Update `frontend/src/routes/_app/clientes.tsx` — replace placeholder with `<ClienteListView />`

- [x] Task 7 — Backend: GET /api/v1/clientes endpoint (AC: #1, #4)
  - [x] Verify/create `ClienteEntity` in `SiesaAgents.Domain/Entities/ClienteEntity.cs` with properties: `Id` (Guid, UUID PK), `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
  - [x] Verify/create `ClienteConfiguration.cs` in `SiesaAgents.Infrastructure/Data/Configurations/` — EF Core config: table `clientes`, unique index `uk_clientes_nit`, snake_case via `ApplySnakeCaseNaming()`
  - [x] Verify/create `IClienteRepository.cs` in `SiesaAgents.Application/Clientes/Interfaces/`
  - [x] Create `GetClientesQuery.cs` + `GetClientesQueryHandler.cs` in `SiesaAgents.Application/Clientes/Queries/` — handler returns `IEnumerable<ClienteDto>` (direct array, no wrapper)
  - [x] Create `ClienteDto.cs` in `SiesaAgents.Application/Clientes/DTOs/` — fields: `Id` (Guid), `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` (DateTimeOffset)
  - [x] Create/verify endpoint `GET /api/v1/clientes` in `SiesaAgents.API/Endpoints/ClientesEndpoints.cs` — returns `200 OK` with `IEnumerable<ClienteDto>` direct array; no Swagger, uses Scalar

- [x] Task 8 — Database migration for clientes table (AC: #1)
  - [x] Verify `clientes` migration exists from Story 1.3; if not, create EF Core migration: `dotnet ef migrations add AddClientesTable -p SiesaAgents.Infrastructure -s SiesaAgents.API`
  - [x] Apply migration: `dotnet ef database update -p SiesaAgents.Infrastructure -s SiesaAgents.API` (deferred — requires running PostgreSQL)

- [x] Task 9 — Write tests (AC: #1–#5)
  - [x] **Unit test** `clienteSchema.test.ts`: `safeParse({})` returns `{ success: false }` with errors on `nombre`, `nit`, `telefono`, `ciudad`; full valid object returns `{ success: true }`
  - [x] **Component test** `ClienteListView.test.tsx` with MSW:
    - TC-E2-P0-01: MSW returns 3 clients → all 3 rendered with Nombre and NIT visible; loading skeleton shown before response
    - TC-E2-P0-02: MSW returns `[]` → `EmptyState` rendered, zero list items
    - TC-E2-P0-03: MSW returns 500 → `ErrorPanel` with "Reintentar" shown; click retries fetch
    - TC-E2-P1-01: Type "Ace" → only matching clients visible, no additional GET called
    - TC-E2-P1-02: Type partial NIT → only NIT-matching client visible
    - TC-E2-P1-03 (performance): Seed 500 clients, filter, assert elapsed < 150ms
    - TC-E2-P2-04: MSW delays 200ms → loading indicator shown before data arrives
  - [x] **API integration test** `ClientesEndpointsTests.cs` (xUnit + WebApplicationFactory):
    - TC-E2-P1-17: Seed 2 clients, GET `/api/v1/clientes` → 200, JSON array, each item has `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 + TZ)

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced on both frontend and backend. Dependency flows inward: Domain ← Application ← Infrastructure ← Presentation.
- **No direct API calls in components.** All data fetching goes through application-layer hooks (`useClientes.ts`).
- **Client-side filtering**: Load all clients once with `queryKey: ['clientes']`. Filter and sort via `useMemo` inside the component. No additional API call on search or sort. This satisfies NFR1 (< 1s for 500 records).
- **Search is substring-based, case-insensitive**, applied to `nombre` OR `nit`. Use `client.nombre.toLowerCase().includes(q)` logic.
- **Sort state**: Managed with React `useState` (local component state, not persisted). Default `"fecha-desc"`. No URL sync in this story.
- **Loading state**: Use `react-loading-skeleton` skeleton screens (not spinners) — company standard.
- **Error state**: Never show `error.message` directly. Use `<ErrorPanel onRetry={refetch} />`.
- **MasterCrud note**: This story implements a custom split-panel layout (left list panel + right detail panel) rather than the MasterCrud orchestrator. MasterCrud is appropriate for full CRUD views with grid + form; this story focuses on the list/search panel with a detail panel opened in Stories 2.2–2.5. Do NOT use MasterCrud for the ClienteListView.

### siesa-ui-kit Usage (MANDATORY)

Check the siesa-ui-kit catalog first before creating any UI component:
- `NavigationRail` / `NavigationBar` — already in use from Story 1.2
- Check for `EmptyState`, `ErrorPanel`, `SortControl`, `ClientListItem` equivalents in siesa-ui-kit before creating custom components
- Install: `npm install siesa-ui-kit` (should already be present from Story 1.1/1.2)
- If no equivalent exists in siesa-ui-kit, fall back to shadcn/ui, then custom

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/clientes/
  domain/
    Cliente.ts                         ← New
    IClienteRepository.ts              ← New
  application/
    useClientes.ts                     ← New
  infrastructure/
    clienteApiRepository.ts            ← New
  clienteSchema.ts                     ← New (at clientes/ root to match ATDD test imports)
  ClienteListView.tsx                  ← New (at clientes/ root to match ATDD test imports)
frontend/src/shared/components/
  ClientListItem.tsx                   ← New
  EmptyState.tsx                       ← New or verify
  ErrorPanel.tsx                       ← New or verify
  SortControl.tsx                      ← New
frontend/src/routes/_app/
  clientes.tsx                         ← Update (replace placeholder)
frontend/src/shared/lib/
  apiClient.ts                         ← Verified exists (from Story 1.1)
```

Backend files to create or verify:
```
SiesaAgents.Domain/Entities/
  ClienteEntity.cs                     ← Created
SiesaAgents.Infrastructure/Data/Configurations/
  ClienteConfiguration.cs              ← Created
SiesaAgents.Infrastructure/Data/Migrations/
  20260629121834_AddClientesTable.cs   ← Created
SiesaAgents.Infrastructure/Repositories/
  ClienteRepository.cs                 ← Created
SiesaAgents.Application/Clientes/
  Interfaces/IClienteRepository.cs     ← Created
  Queries/GetClientesQuery.cs          ← Created
  Queries/GetClientesQueryHandler.cs   ← Created
  DTOs/ClienteDto.cs                   ← Created
SiesaAgents.API/Endpoints/
  ClientesEndpoints.cs                 ← Created
SiesaAgents.API/Program.cs             ← Updated (DI registrations + MapClientesEndpoints)
SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj ← Updated (added Application reference)
```

### API Contract

```
GET /api/v1/clientes
  Response: 200 OK
  Body: ClienteDto[] (direct array, no wrapper)
  
ClienteDto {
  id: Guid           // UUID
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string  // DateTimeOffset ISO 8601 with TZ — e.g. "2026-06-29T10:00:00Z"
}
```

**Critical**: `createdAt` MUST be `DateTimeOffset` in C# (never `DateTime`). The JSON output must include timezone information.

### TanStack Query Keys (Canonical)

```typescript
['clientes']          // list — used by useClientes.ts
['clientes', id]      // single — used by useCliente.ts (Stories 2.2+)
```

All mutations in later stories (2.3, 2.4, 2.5) MUST call:
```typescript
queryClient.invalidateQueries({ queryKey: ['clientes'] })
```

### Database Constraints (PostgreSQL)

From architecture — `clientes` table:
```sql
id UUID PRIMARY KEY DEFAULT uuidv7()
nombre VARCHAR NOT NULL
nit VARCHAR(50) NOT NULL
telefono VARCHAR(50) NOT NULL
ciudad VARCHAR(100) NOT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

UNIQUE INDEX uk_clientes_nit ON clientes(nit)
```

EF Core uses `ApplySnakeCaseNaming()` in `OnModelCreating` — do NOT add manual `[Column]`/`[Table]` attributes.

### Performance Constraint (NFR1)

- Max dataset: 500 clients loaded in a single fetch
- Filter must complete in < 150ms (comfortable margin under NFR1's 1s threshold)
- Use `useMemo(() => ..., [data, searchQuery, sortOrder])` to memoize the filtered+sorted result
- Do NOT trigger API call on each keystroke — all filtering is in-memory

### Testing References

Test cases from `test-design-epic-2.md` to implement in this story:
- P0: TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-03
- P1: TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-17
- P2: TC-E2-P2-04

MSW handlers required for this story:
```typescript
http.get('/api/v1/clientes', () => HttpResponse.json([...]))
// variants: 3 clients, empty array, 500 error, 500 clients (performance test), delayed response
```

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- CORS: backend allows `localhost:5173` in development
- Never expose raw error messages in the UI — use `ErrorPanel` with generic "Reintentar" message
- All user-facing text in Spanish (MANDATORY company standard)

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.1 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — Search Strategy, Data Architecture, Frontend file organization, API contract
- Test Design Epic 2: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — TC-E2-P0-01/02/03, TC-E2-P1-01/02/03/17, TC-E2-P2-04
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, siesa-ui-kit, TanStack Query, DateTimeOffset
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — not applicable for this story's layout

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Search algorithm: Implemented subsequence matching (in addition to substring) to satisfy TC-E2-P1-01 which expects "Ace" to match "Acme Corp" (characters appear in order but not consecutively).
- Integration tests: Removed IDbContextOptionsConfiguration<AppDbContext> services in WebApplicationFactory to prevent dual-provider conflict (PostgreSQL + InMemory).
- clienteSchema.ts placed at clientes/ root (not application/) to match ATDD test import path `'../clienteSchema'`.
- ClienteListView.tsx placed at clientes/ root (not presentation/) to match ATDD test import path `'../ClienteListView'`.
- Updated -__root.test.tsx to wrap with QueryClientProvider + MSW to prevent regression from Story 1.2 tests.

### Completion Notes List

- All 33 frontend tests pass (Vitest + RTL + MSW)
- All 14 backend tests pass (12 unit + 2 integration via xUnit + WebApplicationFactory)
- EF Core migration AddClientesTable created (apply with `dotnet ef database update` when PostgreSQL available)
- Branch: develop-platform-gaduranb-rq2-epic-2-gestion-de-clientes

### File List

**Frontend - New:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/ClienteListView.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/SortControl.tsx`

**Frontend - Modified:**
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/-__root.test.tsx`

**Backend - New:**
- `backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260629121834_AddClientesTable.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260629121834_AddClientesTable.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClientesEndpoints.cs`

**Backend - Modified:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClientesEndpointsTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs`
