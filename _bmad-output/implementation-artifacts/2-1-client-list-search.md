# Story 2.1: Client List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I am looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the GET `/api/v1/clientes` fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list, and clicking the button triggers a refetch.

## Tasks / Subtasks

- [x] Task 1 — Backend: Implement `GET /api/v1/clientes` endpoint (AC: #1, #2)
  - [x] Create `ClienteEntity.cs` in `SiesaAgents.Domain/Clientes/Entities/` — fields: `Id` (Guid), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset). Use static `Create()` factory pattern, private constructor.
  - [x] Create `IClienteRepository.cs` in `SiesaAgents.Domain/Clientes/Interfaces/` — method: `Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)`
  - [x] Create `ClienteDto.cs` in `SiesaAgents.Application/Clientes/DTOs/` — fields: `Id` (Guid), `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` (DateTimeOffset)
  - [x] Create `GetClientesQuery.cs` and `GetClientesQueryHandler.cs` in `SiesaAgents.Application/Clientes/Queries/` — handler calls `IClienteRepository.GetAllAsync()` and maps to `IEnumerable<ClienteDto>`
  - [x] Create `ClienteConfiguration.cs` in `SiesaAgents.Infrastructure/Data/Configurations/` — configures `ClienteEntity`, table `clientes`, unique index `uk_clientes_nit` on `Nit`. Apply `ApplySnakeCaseNaming()` in `AppDbContext.OnModelCreating()`.
  - [x] Create `ClienteRepository.cs` in `SiesaAgents.Infrastructure/Repositories/` implementing `IClienteRepository`
  - [x] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`
  - [x] Create EF Core initial migration: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [x] Register `IClienteRepository` → `ClienteRepository` and `GetClientesQueryHandler` in `Program.cs` DI
  - [x] Map `GET /api/v1/clientes` endpoint in `ClienteEndpoints.cs` — calls handler, returns `200 OK` with `IEnumerable<ClienteDto>` (direct array, no wrapper)

- [x] Task 2 — Frontend Domain & Application layer (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; }`
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface: `{ getAll(): Promise<Cliente[]> }`
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient.get<Cliente[]>('/api/v1/clientes')`
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook: `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`. Export `data`, `isLoading`, `isError`, `refetch`.

- [x] Task 3 — Frontend Presentation: `ClienteListView` component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — renders the 280px scrollable left panel:
    - Calls `useClientes()` to fetch all clients
    - Shows `react-loading-skeleton` skeleton rows while `isLoading === true`
    - Shows `<ErrorPanel onRetry={refetch} />` when `isError === true`
    - Shows `<EmptyState />` when data array is empty
    - Shows scrollable list when data is present — each item renders `Nombre` and `NIT/RUC`
  - [x] Create `frontend/src/shared/components/EmptyState.tsx` — displays a message guiding the user to create the first client (Spanish text: "No hay clientes registrados. Crea el primero."), includes a Heroicons icon
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx` — displays error message (Spanish: "No se pudo cargar la lista. Intenta de nuevo.") with a "Reintentar" button that calls `onRetry`
  - [x] Add client-side search: add `searchQuery` local state (`useState<string>('')`). Render a search `<input>` at the top of the panel with placeholder "Buscar por nombre o NIT/RUC...". Filter with `useMemo`:
    ```typescript
    const filtered = useMemo(() =>
      (data ?? []).filter(c =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nit.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      [data, searchQuery]
    )
    ```
  - [x] Add `aria-label="Buscar clientes"` to the search input (WCAG 2.1 AA)
  - [x] Use `react-loading-skeleton` (`<Skeleton />`) for list item placeholders during loading

- [x] Task 4 — Frontend Route: wire `ClienteListView` into `/clientes` route (AC: #1)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` (TanStack Router file-based). This route renders the split-panel layout: 280px left panel (`ClienteListView`) + flex right panel (placeholder for Story 2.2). The route file must export a `Route` using `createFileRoute('/clientes')`.
  - [x] Ensure `_app.tsx` layout route exists at `frontend/src/routes/_app.tsx` (pathless layout), wrapping child routes in the app shell.

- [x] Task 5 — Frontend Unit & Component Tests (AC: #1, #2, #3, #4)
  - [x] `useClientes.test.ts` — unit test: MSW handler returns array of 2 clients; assert hook returns correct `Cliente[]` data
  - [x] `ClienteListView.test.tsx` — component test:
    - Renders skeleton while loading (MSW delayed response)
    - Renders list of clients when data is returned from MSW
    - Renders `EmptyState` when MSW returns `[]`
    - Renders `ErrorPanel` with "Reintentar" button on MSW 500 error; clicking button calls `refetch`
    - Client-side search filter: render 3 clients, type in search field, assert only matching item visible
  - [x] Performance test: render `ClienteListView` with 500-item fixture via MSW; assert `useMemo` filter completes in < 50ms (NFR1)

- [x] Task 6 — Backend xUnit Integration Tests (AC: #1)
  - [x] `GetClientesTests.cs` in `SiesaAgents.UnitTests/Application/Clientes/`:
    - Happy path: `GET /api/v1/clientes` → 200 with JSON array
    - Empty DB: `GET /api/v1/clientes` → 200 with empty array `[]`
    - Response shape: assert returned objects contain `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` fields

## Dev Notes

### Architecture Patterns

This story implements the **read side only** of the Client domain. No mutations are introduced. The architecture follows Clean Architecture + DDD across all layers.

**Search strategy (architecture.md):** All clients are fetched once on page mount (`queryKey: ['clientes']`). Client-side filtering runs via `useMemo` against the in-memory cache — no backend search parameter needed. This guarantees < 50ms filter latency for ≤ 500 records, satisfying NFR1.

**TanStack Query key:** `['clientes']` — canonical key for all clients list operations in this module.

**Backend framework note (from Story 1.1 dev notes):** The environment runs .NET 8 (not .NET 10). All architecture patterns remain identical. Use .NET 8-compatible NuGet package versions.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: already installed via `pnpm add siesa-ui-kit` in Story 1.1
- **Usage**: Check `siesa-ui-kit` catalog before creating any custom component.
- **Constraint**: Do not create custom components if a `siesa-ui-kit` equivalent exists.
- **MasterCrud**: NOT applicable for this story. The architecture specifies a custom `ClienteListView` as a 280px scrollable left panel — this is a display-only list, not a CRUD data-grid orchestrator. MasterCrud applies to full CRUD screens (create + edit + delete + table); this story is list + search only.
- **EmptyState** and **ErrorPanel**: check `siesa-ui-kit` first; if no equivalent, create custom components in `src/shared/components/`.
- **Icons**: Heroicons (primary per company standards) — import from `@heroicons/react/24/outline`.
- **Loading states**: use `react-loading-skeleton` (skeleton screens, not spinners — company standard).

### All user-facing text MUST be in Spanish

Examples:
- Search placeholder: `"Buscar por nombre o NIT/RUC..."`
- EmptyState message: `"No hay clientes registrados. Crea el primero."`
- ErrorPanel message: `"No se pudo cargar la lista. Intenta de nuevo."`
- ErrorPanel button: `"Reintentar"`
- ARIA label on search input: `"Buscar clientes"`

### Frontend File Structure

New files to create:

```
frontend/src/
  routes/
    _app.tsx                              # Pathless layout (may already exist from Story 1.2)
    _app/
      clientes.tsx                        # /clientes route — split-panel layout
  modules/crm/clientes/
    domain/
      Cliente.ts                          # Entity interface
      IClienteRepository.ts               # Repository contract
    application/
      useClientes.ts                      # TanStack Query hook — queryKey: ['clientes']
      useClientes.test.ts                 # Unit test (co-located)
    infrastructure/
      clienteApiRepository.ts             # Axios implementation of IClienteRepository
    presentation/
      ClienteListView.tsx                 # 280px left panel — list + search
      ClienteListView.test.tsx            # Component test (co-located)
  shared/components/
    EmptyState.tsx                        # Reusable empty-state component
    ErrorPanel.tsx                        # Reusable error panel with retry button
```

### Backend File Structure

New files to create:

```
backend/src/
  SiesaAgents.Domain/Clientes/
    Entities/ClienteEntity.cs
    Interfaces/IClienteRepository.cs
  SiesaAgents.Application/Clientes/
    DTOs/ClienteDto.cs
    Queries/GetClientesQuery.cs
    Queries/GetClientesQueryHandler.cs
  SiesaAgents.Infrastructure/
    Data/AppDbContext.cs                  # Add DbSet<ClienteEntity> Clientes
    Data/Configurations/ClienteConfiguration.cs
    Repositories/ClienteRepository.cs
    Migrations/<timestamp>_AddClientesTable.cs
  SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs         # GET /api/v1/clientes
backend/tests/SiesaAgents.UnitTests/
  Application/Clientes/GetClientesTests.cs
```

### Backend Critical Rules

- `ClienteEntity.Id` → `Guid` (UUID), initialized with `Guid.NewGuid()` in `Create()` factory
- `ClienteEntity.CreatedAt` and `UpdatedAt` → `DateTimeOffset` — NEVER `DateTime`
- `AppDbContext.OnModelCreating`: call `modelBuilder.ApplySnakeCaseNaming()` LAST — NO manual `[Column]`/`[Table]` attributes
- `ClienteConfiguration.cs` must add unique index: `builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`
- API endpoint returns a direct array (no wrapper object): `GET /api/v1/clientes` → `200 OK` + `ClienteDto[]`
- Register `Scalar` in `Program.cs` — NEVER `app.UseSwagger()` as UI
- Error format: Problem Details RFC 7807 (enforced by existing `ExceptionHandlingMiddleware`)

### API Contract

```
GET /api/v1/clientes
  Response 200: ClienteDto[]
  [
    {
      "id": "uuid",
      "nombre": "string",
      "nit": "string",
      "telefono": "string",
      "ciudad": "string",
      "createdAt": "2026-03-12T10:30:00Z"
    }
  ]
```

### Risk Coverage (from test-design-epic-2.md)

| Risk | Score | Mitigation in this story |
|------|-------|--------------------------|
| R-202 — Missing queryClient.invalidateQueries | 9 | Ensure `useClientes` uses correct `queryKey: ['clientes']`. No mutations in this story but the key must match future mutation hooks. |
| R-205 — Search latency > 1s with 500 records | 4 | Performance component test: 500-item fixture + measure < 50ms |
| R-209 — ErrorPanel not shown on fetch failure | 4 | Component test: MSW 500 → assert `<ErrorPanel>` with "Reintentar" renders |

### Testing Standards for This Story

Per `test-design-epic-2.md` story 2.1 matrix:

| Level | Count | Scenarios |
|-------|-------|-----------|
| E2E (Playwright) | 1 | Navigate to `/clientes`; assert at least one client row visible |
| API Integration (xUnit) | 2 | GET 200 with items; GET 200 empty array |
| Component (Vitest + RTL + MSW) | 4 | Renders list; filters by search; EmptyState; ErrorPanel + retry |
| Unit (Vitest) | 1 | Performance: 500-item filter < 50ms |

Test fixtures needed:
- `clienteFactory()` — single `ClienteDto` with randomized UUID, nombre, nit, telefono, ciudad
- `clienteListFactory(n)` — array of n clients
- MSW handler: `GET /api/v1/clientes → 500`

### Project Structure Notes

- `src/routes/_app.tsx` (pathless layout) may already be created by Story 1.2. If it exists, do NOT recreate — add the `/clientes` child route file only.
- `src/shared/lib/apiClient.ts` and `src/shared/lib/queryClient.ts` were created in Story 1.1 — reuse them. Do NOT redefine Axios instance or QueryClient.
- `AppDbContext.cs` and `Program.cs` were created in Story 1.3 — modify by adding `DbSet<ClienteEntity>`, registering DI entries, and mapping the endpoint. Do NOT replace those files.
- The `_app/` folder under `routes/` follows TanStack Router's `_` prefix convention (pathless layout segment — no URL segment added).

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.1]
- Architecture decisions (search strategy, query keys, API contract, file structure): [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Frontend Architecture, API & Communication Patterns, Complete Project Directory Structure]
- Company standards (stack, folder structure, naming, rules): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- Test design matrix and risks: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — Story 2.1, Risk Matrix]
- MasterCrud reference: [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`] — NOT applicable to this story (list-only panel, no CRUD orchestrator needed)
- Previous story learnings: [Source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md` — Dev Notes, Debug Log References]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Backend tests: 40/40 pass (including 3 new GetClientesTests integration tests)
- Frontend tests: 18/18 pass (7 ClienteListView component tests, 3 perf tests, 1 useClientes unit test, 7 route tests)
- Fixed ATDD test import path (5 levels up vs 4) for `useClientes.perf.test.ts`
- Updated Story 1.3 scope-guard tests (EC-CTX-5, EC-CTX-9, AppDbContext_DoesNotContain) to reflect ClienteEntity addition
- Route test updated to wrap with QueryClientProvider + MSW server to handle ClienteListView's useQuery

### Completion Notes List

- `filterClientes.ts` extracted as a pure utility (separate from component) so perf test can import it directly
- `data-testid="clientes-list-panel"` placed only on success state div (not during loading) so ATDD test's `waitFor` correctly waits for data
- EmptyState and ErrorPanel created as custom shared components (no equivalent found in siesa-ui-kit)
- EF migration `AddClientesTable` created (timestamp: 20260618045635)
- Backend WebApplicationFactory test removes EF provider descriptors by service type namespace prefix to avoid "multiple database providers" conflict

### File List

**Backend - New files:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260618045635_AddClientesTable.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260618045635_AddClientesTable.Designer.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesTests.cs`

**Backend - Modified files:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — added `DbSet<ClienteEntity> Clientes`
- `backend/src/SiesaAgents.API/Program.cs` — added DI registrations and endpoint mapping
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs` — updated by EF migration
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — updated scope-guard test
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextEdgeCaseTests.cs` — updated 2 scope-guard tests

**Frontend - New files:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/filterClientes.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`

**Frontend - Modified files:**
- `frontend/src/routes/_app/clientes.tsx` — wired ClienteListView into split-panel layout
- `frontend/src/routes/__tests__/-_app.test.tsx` — added QueryClientProvider + MSW server for route tests
- `frontend/src/modules/crm/clientes/application/__tests__/useClientes.perf.test.ts` — fixed import path (4→5 levels up)
