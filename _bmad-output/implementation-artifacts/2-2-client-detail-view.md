# Story 2.2: Client Detail View

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad.
   **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly, **Then** the correct client details are loaded from `GET /api/v1/clientes/:id` and displayed without a redirect (FR30).

3. **Given** a `clienteId` in the URL does not exist on the backend, **When** the page loads and the API returns 404, **Then** a not-found message ("Cliente no encontrado.") is displayed gracefully in the right panel — no crash or blank screen.

## Tasks / Subtasks

- [x] Task 1 — Backend: Implement `GET /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [x] Create `GetClienteByIdQuery.cs` in `backend/src/SiesaAgents.Application/Clientes/Queries/` — property: `Guid Id`
  - [x] Create `GetClienteByIdQueryHandler.cs` in `backend/src/SiesaAgents.Application/Clientes/Queries/` — calls `IClienteRepository.GetByIdAsync(id, ct)`, returns `ClienteDto` or `null`; throws domain exception when null to trigger 404
  - [x] Add `GetByIdAsync(Guid id, CancellationToken ct)` method to `IClienteRepository.cs` in `backend/src/SiesaAgents.Domain/Clientes/Interfaces/`
  - [x] Implement `GetByIdAsync` in `ClienteRepository.cs` in `backend/src/SiesaAgents.Infrastructure/Repositories/` — EF Core `FirstOrDefaultAsync` by `id`
  - [x] Map `GET /api/v1/clientes/{id}` in `ClienteEndpoints.cs` (`backend/src/SiesaAgents.API/Endpoints/`) — calls handler; returns `200 OK` with `ClienteDto` on success, `404 Problem Details` when not found
  - [x] Register `GetClienteByIdQueryHandler` in `Program.cs` DI

- [x] Task 2 — Frontend Domain & Application layer (AC: #2)
  - [x] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts` in `frontend/src/modules/crm/clientes/domain/`
  - [x] Implement `getById` in `clienteApiRepository.ts` in `frontend/src/modules/crm/clientes/infrastructure/` — `apiClient.get<Cliente>(\`/api/v1/clientes/${id}\`)`
  - [x] Create `useCliente.ts` in `frontend/src/modules/crm/clientes/application/` — TanStack Query hook: `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`. Export `data`, `isLoading`, `isError`, `error`.

- [x] Task 3 — Frontend Presentation: `ClienteDetailView` component (AC: #1, #2, #3)
  - [x] Create `ClienteDetailView.tsx` in `frontend/src/modules/crm/clientes/presentation/` — component receives `clienteId: string` as prop:
    - Calls `useCliente(clienteId)`
    - Shows `react-loading-skeleton` skeleton blocks while `isLoading === true`
    - Shows "Cliente no encontrado." message when `isError === true` and HTTP status is 404 (check `error?.response?.status === 404`)
    - Shows `<ErrorPanel onRetry={refetch} />` for other error types (non-404 network/server errors)
    - Shows client detail card when `data` is present: renders Nombre, NIT/RUC, Teléfono, Ciudad fields with Spanish labels
  - [x] Use `data-testid="cliente-detail-panel"` on the root element for test selectors
  - [x] All field labels in Spanish: "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
  - [x] Apply Siesa brand colors: primary `#0e79fd`, neutrals via `slate-*` Tailwind classes
  - [x] Check siesa-ui-kit catalog before creating any custom sub-component

- [x] Task 4 — Frontend Route: wire `ClienteDetailView` into `/clientes/:clienteId` route (AC: #1, #2)
  - [x] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — TanStack Router file-based dynamic route. Export a `Route` using `createFileRoute('/clientes/$clienteId')`. Reads `clienteId` from `Route.useParams()`. Renders the split-panel layout: left panel (existing `ClienteListView` at 280px) + right flex panel (`ClienteDetailView` with the `clienteId` param).
  - [x] Update `frontend/src/routes/_app/clientes.tsx` (the parent `/clientes` route) to render the right panel in an empty/placeholder state when no client is selected — do NOT break existing ClienteListView behavior.
  - [x] Clicking a client item in `ClienteListView` must navigate to `/clientes/{clienteId}` — use TanStack Router `<Link to="/clientes/$clienteId" params={{ clienteId: c.id }}>` wrapping each list item, or `router.navigate()` on item click. Remove any placeholder comment left in Story 2.1 for Story 2.2.

- [x] Task 5 — Frontend Unit & Component Tests (AC: #1, #2, #3)
  - [x] `useCliente.test.ts` (co-located with `useCliente.ts`) — unit test:
    - MSW handler returns valid `ClienteDto`; assert hook returns correct `Cliente` data
    - MSW handler returns 404; assert `isError === true`
    - Hook is disabled when `id` is `undefined`
  - [x] `ClienteDetailView.test.tsx` (co-located with `ClienteDetailView.tsx`) — component tests:
    - Renders skeleton while loading (MSW delayed response for `GET /api/v1/clientes/:id`)
    - Renders all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) when MSW returns valid `ClienteDto`
    - Renders "Cliente no encontrado." when MSW returns 404
    - Renders `<ErrorPanel>` with "Reintentar" for non-404 MSW 500 error
  - [x] Route test: `clientes.$clienteId.tsx` renders `ClienteDetailView` with correct `clienteId` param

- [x] Task 6 — Backend xUnit Integration Tests (AC: #2, #3)
  - [x] `GetClienteByIdTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`:
    - Happy path: `GET /api/v1/clientes/{existingId}` → 200 with correct `ClienteDto` fields
    - Not found: `GET /api/v1/clientes/{nonexistentUuid}` → 404 Problem Details (no `stackTrace` key in body)
    - Response shape: assert returned object contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` fields

## Dev Notes

### Architecture Patterns

This story implements the **read detail side** of the Client domain. No mutations are introduced. The architecture follows Clean Architecture + DDD across all layers.

**TanStack Query key:** `['clientes', id]` — single client. Canonical key per `architecture.md` TanStack Query Keys section. This key is distinct from `['clientes']` (list) to allow targeted cache invalidation in future mutation stories (2.3, 2.4, 2.5).

**Backend note (from Story 2.1 dev notes):** The environment runs .NET 8 (not .NET 10). All architecture patterns remain identical. Use .NET 8-compatible NuGet package versions.

**Route naming convention (TanStack Router):** Dynamic segment uses `$` prefix — file must be named `clientes.$clienteId.tsx`. The param is accessed via `Route.useParams().clienteId`.

**Split-panel layout:** The parent `/clientes` route (`_app/clientes.tsx`) renders both panels. Story 2.1 left a placeholder in the right panel for this story. This story wires the right panel to `ClienteDetailView` and adds the child route `_app/clientes.$clienteId.tsx` for the deep-link scenario.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: already installed via `pnpm add siesa-ui-kit` in Story 1.1
- **Usage**: Check `siesa-ui-kit` catalog before creating any custom component.
- **Constraint**: Do not create custom components if a `siesa-ui-kit` equivalent exists.
- **MasterCrud**: NOT applicable for this story. `ClienteDetailView` is a read-only detail display panel — no CRUD data-grid orchestrator is needed. MasterCrud applies to full CRUD screens (create + edit + delete + table grid).
- **Icons**: Heroicons (primary per company standards) — import from `@heroicons/react/24/outline`.
- **Loading states**: use `react-loading-skeleton` (skeleton screens, not spinners — company standard).

### All user-facing text MUST be in Spanish

Examples:
- Not-found message: `"Cliente no encontrado."`
- Field label Nombre: `"Nombre"`
- Field label NIT/RUC: `"NIT/RUC"`
- Field label Teléfono: `"Teléfono"`
- Field label Ciudad: `"Ciudad"`
- ErrorPanel message: `"No se pudo cargar el cliente. Intenta de nuevo."`
- ErrorPanel button: `"Reintentar"`

### API Contract

```
GET /api/v1/clientes/{id}
  Response 200: ClienteDto (single object, no wrapper)
  {
    "id": "uuid",
    "nombre": "string",
    "nit": "string",
    "telefono": "string",
    "ciudad": "string",
    "createdAt": "2026-03-12T10:30:00Z"
  }

  Response 404: Problem Details RFC 7807
  {
    "status": 404,
    "title": "Not Found",
    "detail": "Cliente no encontrado."
  }
```

### Frontend File Structure

New files to create:

```
frontend/src/
  routes/
    _app/
      clientes.$clienteId.tsx          # /clientes/:clienteId — deep-link route
  modules/crm/clientes/
    application/
      useCliente.ts                    # TanStack Query hook — queryKey: ['clientes', id]
      useCliente.test.ts               # Unit test (co-located)
    presentation/
      ClienteDetailView.tsx            # Right panel — detail display
      ClienteDetailView.test.tsx       # Component test (co-located)
```

Files to modify:

```
frontend/src/
  routes/
    _app/
      clientes.tsx                     # Add right panel with ClienteDetailView (or empty state)
  modules/crm/clientes/
    domain/
      IClienteRepository.ts            # Add getById(id): Promise<Cliente>
    infrastructure/
      clienteApiRepository.ts          # Implement getById
    presentation/
      ClienteListView.tsx              # Wrap items in TanStack Router <Link> to /clientes/$clienteId
```

### Backend File Structure

New files to create:

```
backend/src/
  SiesaAgents.Application/Clientes/
    Queries/
      GetClienteByIdQuery.cs
      GetClienteByIdQueryHandler.cs
  SiesaAgents.Domain/
    Exceptions/
      NotFoundException.cs
backend/tests/SiesaAgents.UnitTests/
  Application/Clientes/
    GetClienteByIdTests.cs
```

Files to modify:

```
backend/src/
  SiesaAgents.Domain/Clientes/
    Interfaces/IClienteRepository.cs   # Add GetByIdAsync method
  SiesaAgents.Infrastructure/
    Repositories/ClienteRepository.cs  # Implement GetByIdAsync
  SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs      # Add GET /api/v1/clientes/{id} endpoint
    Middleware/ExceptionHandlingMiddleware.cs  # Add NotFoundException → 404 mapping
    Program.cs                         # Register GetClienteByIdQueryHandler
```

### Backend Critical Rules

- `ClienteEntity.Id` → `Guid` (UUID) — query by `id` using `FirstOrDefaultAsync(c => c.Id == id)`
- Return `null` from `GetByIdAsync` when not found; handler throws domain/not-found exception → `ExceptionHandlingMiddleware` maps to 404 Problem Details
- Error format: Problem Details RFC 7807 (enforced by existing `ExceptionHandlingMiddleware`)
- No `stackTrace` key must appear in 404 response body (NFR6)
- Register `Scalar` in `Program.cs` — NEVER `app.UseSwagger()`

### Risk Coverage (from test-design-epic-2.md)

| Risk | Score | Mitigation in this story |
|------|-------|--------------------------|
| R-207 — TanStack Router deep link fails | 4 | Route `clientes.$clienteId.tsx` + component test: navigate directly to `/clientes/{uuid}`, assert `ClienteDetailView` renders with correct data |
| R-202 — Optimistic invalidation missing | 9 | No mutations in this story, but `queryKey: ['clientes', id]` must match exactly so Stories 2.3/2.4 `invalidateQueries` work correctly |

### Testing Standards for This Story

Per `test-design-epic-2.md` Story 2.2 matrix:

| Level | Count | Scenarios |
|-------|-------|-----------|
| E2E (Playwright) | 1 | After click, URL updates to `/clientes/{uuid}`; assert client data visible |
| API Integration (xUnit) | 2 | GET 200 happy path; GET 404 unknown id |
| Component (Vitest + RTL + MSW) | 4 | Renders skeleton; renders all fields; 404 not-found message; ErrorPanel for non-404 |
| Unit (Vitest) | 0 | No pure logic to test separately |

Test fixtures needed:
- `clienteFactory()` — reuse existing fixture from Story 2.1 (single `ClienteDto` with randomized UUID, nombre, nit, telefono, ciudad)
- MSW handler: `GET /api/v1/clientes/:id → 200` with `clienteFactory()` response
- MSW handler: `GET /api/v1/clientes/:id → 404` with Problem Details body
- MSW handler: `GET /api/v1/clientes/:id → 500` with error body

### Project Structure Notes

- `frontend/src/routes/_app.tsx` (pathless layout) and `frontend/src/routes/_app/clientes.tsx` already exist from Stories 1.2 and 2.1 — do NOT recreate them.
- `frontend/src/shared/lib/apiClient.ts` and `frontend/src/shared/lib/queryClient.ts` were created in Story 1.1 — reuse them.
- `ClienteListView.tsx` was created in Story 2.1 — modify only to wrap items in a TanStack Router `<Link>` for navigation.
- `AppDbContext.cs`, `ClienteRepository.cs`, and `ClienteEndpoints.cs` exist from Story 2.1 — modify them to add the `GetById` capability.
- `queryClient.ts` already has `retry: 0` set (from Story 2.1 fix) — 404 errors will surface immediately without retry backoff.

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.2]
- Architecture decisions (routing, query keys, API contract, split-panel layout, file structure): [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture, API & Communication Patterns, Complete Project Directory Structure, Component Boundaries, State Boundaries]
- Company standards (stack, folder structure, naming, rules): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- Test design matrix and risks: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — Story 2.2, Risk Matrix R-207]
- MasterCrud reference: [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`] — NOT applicable to this story (read-only detail panel, no CRUD orchestrator needed)
- Previous story learnings: [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — Dev Notes, Debug Log References, Completion Notes List]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `ClienteListView` test fix: added `RouterContextProvider` wrapper because `<Link>` from TanStack Router requires router context. Used `RouterContextProvider` (not `RouterProvider`) to wrap just the component under test.
- `clientes.tsx` fix: restored `<h1 className="sr-only">Clientes</h1>` which was inadvertently removed. This element is tested by the existing `_app.test.tsx` `renders navigation with Clientes label` test.
- `ClienteDetailView.test.tsx` C-02 fix: `nombre` appears twice in the rendered output (heading h2 + field dd). Changed `getByText` to `getAllByText(...).length > 0` assertion.
- `ExceptionHandlingMiddleware.cs`: added `NotFoundException` catch block before the generic `Exception` catch to map domain not-found exceptions to 404 Problem Details.

### Completion Notes List

- All 6 tasks implemented. Backend: `GetClienteByIdQuery`, `GetClienteByIdQueryHandler`, `NotFoundException`, `GetByIdAsync` in repo and interface, new GET endpoint, DI registration. Frontend: `getById` in domain + infra, `useCliente` hook, `ClienteDetailView` component, route wiring, `ClienteListView` navigation links.
- siesa-ui-kit checked — only `FormCacheSelector` available; no detail panel component exists. Custom Tailwind + `react-loading-skeleton` used per company standards.
- 43 backend tests passing (43/43), 25 frontend tests passing (25/25).
- `queryKey: ['clientes', id]` distinct from `['clientes']` list key — correct for future invalidation in stories 2.3/2.4.
- `NotFoundException` domain class created at `SiesaAgents.Domain/Exceptions/NotFoundException.cs` — maps to 404 Problem Details via updated middleware.

### File List

**New Files Created:**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdTests.cs`
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Modified Files:**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`
- `frontend/src/routes/_app/clientes.tsx`
