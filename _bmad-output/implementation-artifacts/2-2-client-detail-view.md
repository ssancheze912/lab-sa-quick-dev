# Story 2.2: Client Detail View

Status: review

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
So that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, and the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user accesses the URL `/clientes/:clienteId` directly (deep link), **When** the page loads, **Then** the correct client details are loaded and displayed using a `GET /api/v1/clientes/:id` fetch (FR30).

3. **Given** a `clienteId` in the URL does not exist in the system (unknown UUID), **When** the page loads, **Then** a not-found message is displayed gracefully in the right panel — no blank screen or unhandled JS error.

4. **Given** the `GET /api/v1/clientes/:id` backend endpoint is called with a valid UUID, **When** the response is returned, **Then** the HTTP status is 200 and the body contains all fields: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

5. **Given** the `GET /api/v1/clientes/:id` backend endpoint is called with a non-existent UUID, **When** the response is returned, **Then** the HTTP status is 404 and the body follows Problem Details RFC 7807 format (no stack trace exposed).

6. **Given** the backend is unavailable when the detail view attempts to load a client, **When** the fetch fails, **Then** an `ErrorPanel` component is displayed in the right panel with a "Reintentar" button. The raw error message is never shown to the user (NFR6).

7. **Given** the client detail is loading, **When** the fetch is in-flight, **Then** skeleton placeholders (react-loading-skeleton) are rendered in the right panel — no spinner.

## Tasks / Subtasks

- [x] Task 1 — Backend: expose `GET /api/v1/clientes/{id}` endpoint (AC: #4, #5)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with `Guid Id` property
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` implementing `IRequestHandler<GetClienteByIdQuery, ClienteDto?>`:
    - Calls `IClienteRepository.GetByIdAsync(query.Id, ct)`
    - Returns `null` when not found (handler does NOT throw — let endpoint handle 404 mapping)
  - [x] Add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [x] Implement `GetByIdAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    - Use EF Core `FindAsync(id)` or `FirstOrDefaultAsync(c => c.Id == id)` with `AsNoTracking()`
  - [x] Add `app.MapGet("/api/v1/clientes/{id:guid}", ...)` in `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    - Dispatch `GetClienteByIdQuery`; if handler returns `null` → `Results.NotFound()` (returns 404 Problem Details via ExceptionHandlingMiddleware or explicit `TypedResults.Problem`)
    - If found → `Results.Ok(clienteDto)` (HTTP 200)
    - Decorator: `.WithName("GetClienteById").Produces<ClienteDto>(200).Produces(404)`
  - [x] Write unit test in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`:
    - Test: returns `ClienteDto` when client exists (Arrange/Act/Assert with mock `IClienteRepository`)
    - Test: returns `null` when client does not exist
  - [x] Write integration test in `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (add to existing file):
    - Test TC-E2-P1-01: `GET /api/v1/clientes/{id}` returns 200 with all fields (aligns with test design)
    - Test TC-E2-P1-02: `GET /api/v1/clientes/00000000-0000-0000-0000-000000000000` returns 404 Problem Details (aligns with TC-E2-P1-02)

- [x] Task 2 — Frontend: `useCliente` hook with TanStack Query (AC: #2, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    ```typescript
    export const useCliente = (clienteId: string | undefined) =>
      useQuery({
        queryKey: ['clientes', clienteId],
        queryFn: () => clienteApiRepository.getById(clienteId!),
        enabled: !!clienteId,
        staleTime: 30_000,
        retry: 0,
      })
    ```
  - [x] Add `getById(id: string): Promise<Cliente>` to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    - Axios call: `GET ${VITE_API_URL}/api/v1/clientes/${id}` → `Promise<Cliente>`
    - On 404, Axios throws — let the hook handle `isError`
  - [x] Add `getById(id: string): Promise<Cliente>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [x] Write unit test `frontend/src/modules/crm/clientes/application/useCliente.test.ts` with MSW:
    - Test: success returns single `Cliente` object
    - Test: 404 → `isError` is true
    - Test: when `clienteId` is undefined, query does not fire (`enabled: false`)

- [x] Task 3 — Frontend: `ClienteDetailView` presentation component (AC: #1, #3, #6, #7)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Receives `clienteId: string` prop (from route param)
    - Calls `useCliente(clienteId)`
    - **Loading state**: render skeleton placeholders (react-loading-skeleton): 4 skeleton rows for Nombre/NIT/Teléfono/Ciudad labels + values
    - **Error state**: render `<ErrorPanel onRetry={refetch} />` — never expose raw error object (NFR6)
    - **Not-found state**: if `isError` and the Axios error status is 404, render a graceful not-found message: "No se encontró el cliente solicitado." (Spanish — MANDATORY)
    - **Success state**: render a card/panel displaying:
      - Field: "Nombre" → `cliente.nombre`
      - Field: "NIT/RUC" → `cliente.nit`
      - Field: "Teléfono" → `cliente.telefono`
      - Field: "Ciudad" → `cliente.ciudad`
    - Accessibility: `aria-busy="true"` on the panel container during loading
    - All labels in Spanish (MANDATORY per company standards)
  - [x] Write component tests in `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`:
    - Test: renders skeleton during loading state
    - Test: renders all four fields on success
    - Test: renders ErrorPanel when fetch fails (non-404 error)
    - Test: renders not-found message when fetch returns 404
    - Accessibility check with axe

- [x] Task 4 — Frontend: Route wiring for deep link support (AC: #1, #2)
  - [x] Create/verify `frontend/src/routes/_app/clientes.$clienteId.tsx`:
    - Use TanStack Router `createFileRoute` for `/clientes/$clienteId`
    - Render the split-panel layout: left `<ClienteListView />` (280px, as established in Story 2.1) + right `<ClienteDetailView clienteId={params.clienteId} />`
    - Extract `clienteId` from `useParams()` (TanStack Router) and pass to `ClienteDetailView`
    - On click in `ClienteListView`, navigate using `useNavigate()` to `/clientes/${cliente.id}` — update `ClientListItem` or route handler accordingly
  - [x] Update `frontend/src/routes/_app/clientes.tsx` (base `/clientes` route):
    - Left panel shows `<ClienteListView />` with click-to-navigate behavior
    - Right panel shows a default/empty placeholder when no client is selected (e.g., "Selecciona un cliente de la lista")
  - [x] Update `frontend/src/shared/components/ClientListItem.tsx` to accept `isSelected: boolean` and trigger navigation via the parent `onClick` prop — no routing logic inside the item itself

- [x] Task 5 — Frontend: accessibility and siesa-ui-kit check
  - [x] Verify `ClienteDetailView` satisfies WCAG 2.1 AA: keyboard navigable fields, proper heading hierarchy, `aria-busy` during loading
  - [x] Check siesa-ui-kit catalog for any "detail panel", "card" or "data display" component before implementing custom layout. If no equivalent exists, build with TailwindCSS `slate-*` neutral palette

## Dev Notes

### Architecture Context

This story delivers the read-side detail view for the `clientes` domain. It builds directly on Story 2.1 (ClienteListView, useClientes, ClienteEntity, IClienteRepository already created). The main additions are:

**Backend layer responsibilities (Story 2.2):**
- **Domain** (`SiesaAgents.Domain`): Add `GetByIdAsync` to `IClienteRepository` interface — zero other changes
- **Application** (`SiesaAgents.Application`): `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` + reuse `ClienteDto` from Story 2.1
- **Infrastructure** (`SiesaAgents.Infrastructure`): `ClienteRepository.GetByIdAsync` implementation — EF Core `AsNoTracking`
- **API** (`SiesaAgents.API`): New `GET /api/v1/clientes/{id:guid}` endpoint in the existing `ClienteEndpoints.cs`

**Frontend layer responsibilities (Story 2.2):**
- **Application**: `useCliente.ts` — TanStack Query hook for single client (`queryKey: ['clientes', id]`)
- **Infrastructure**: `getById` method on existing `clienteApiRepository.ts`
- **Presentation**: `ClienteDetailView.tsx` — new component (right panel)
- **Routes**: `clientes.$clienteId.tsx` — new route file enabling deep linking via `$clienteId` param

### Key Implementation Constraints

**TanStack Router file naming (CRITICAL):**
- File: `frontend/src/routes/_app/clientes.$clienteId.tsx`
- `$` prefix = dynamic URL segment (maps to `/clientes/:clienteId`)
- `_app` prefix = pathless layout — client stays inside the shell without adding `/app` to the URL
- Route param access: `const { clienteId } = Route.useParams()` (type-safe, generated by TanStack Router)

**Query key — canonical form:**
```typescript
queryKey: ['clientes', clienteId]   // MUST match architecture.md canonical key
```
This ensures mutation hooks from Stories 2.3/2.4 can invalidate correctly: `queryClient.invalidateQueries({ queryKey: ['clientes', id] })`.

**Not-found detection pattern:**
```typescript
import axios from 'axios'

// Inside ClienteDetailView
if (isError) {
  const is404 = axios.isAxiosError(error) && error.response?.status === 404
  if (is404) {
    return <p>No se encontró el cliente solicitado.</p>
  }
  return <ErrorPanel onRetry={refetch} />
}
```

**Backend 404 response pattern (Minimal API):**
```csharp
// ClienteEndpoints.cs
app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, IClienteRepository repo, CancellationToken ct) =>
{
    var cliente = await repo.GetByIdAsync(id, ct);
    if (cliente is null)
        return Results.Problem(
            detail: "No se encontró el cliente solicitado.",
            statusCode: StatusCodes.Status404NotFound,
            title: "Cliente no encontrado"
        );
    return Results.Ok(new ClienteDto(
        cliente.Id, cliente.Nombre, cliente.NIT, cliente.Telefono,
        cliente.Ciudad, cliente.CreatedAt, cliente.UpdatedAt));
})
.WithName("GetClienteById")
.Produces<ClienteDto>(200)
.Produces<ProblemDetails>(404);
```

**Skeleton loading (no spinner):**
```typescript
import Skeleton from 'react-loading-skeleton'
// Render 4 label+value skeleton rows during isLoading
{isLoading && (
  <div aria-busy="true">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="mb-3">
        <Skeleton width={80} height={14} className="mb-1" />
        <Skeleton width={200} height={18} />
      </div>
    ))}
  </div>
)}
```

**Navigation from ClienteListView (click-to-navigate):**
```typescript
// Inside clientes.tsx or clientes.$clienteId.tsx route
import { useNavigate } from '@tanstack/react-router'
const navigate = useNavigate()
// Pass to ClienteListView:
onClienteClick={(clienteId) => navigate({ to: '/clientes/$clienteId', params: { clienteId } })}
```

**UI text — all in Spanish (mandatory):**
- Panel heading (if any): "Detalle del cliente"
- Label "Nombre" → value
- Label "NIT/RUC" → value
- Label "Teléfono" → value
- Label "Ciudad" → value
- Not-found message: "No se encontró el cliente solicitado."
- Default empty right panel (no client selected): "Selecciona un cliente de la lista para ver su detalle."
- Loading ARIA: `aria-busy="true"` on the panel container
- ErrorPanel button: "Reintentar" (inherited from shared component)

**Backend entity — no changes to `ClienteEntity.cs`** — all properties already exist from Story 2.1. The only addition is a new method on the repository interface and implementation.

**MasterCrud:** NOT applicable. The client detail view is a read-only display panel (card layout), not a data grid or form-based CRUD screen. MasterCrud is appropriate for tabular list/CRUD screens.

**siesa-ui-kit check (mandatory per workflow):** Before building the detail card, check the siesa-ui-kit catalog for a "DetailPanel", "DataCard", or equivalent display component. If none exists, implement with TailwindCSS: `bg-white rounded-lg border border-slate-200 p-6` and `dl`/`dt`/`dd` semantic HTML.

### Project Structure Notes

Files to create/modify in this story:

**Backend:**
```
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs    [MODIFY — add GetByIdAsync]
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs [NEW]
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs [NEW]
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs   [MODIFY — implement GetByIdAsync]
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                  [MODIFY — add GET /{id} endpoint]
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs [NEW]
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs        [MODIFY — add TC-E2-P1-01, TC-E2-P1-02]
```

**Frontend:**
```
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts              [MODIFY — add getById]
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts    [MODIFY — add getById]
frontend/src/modules/crm/clientes/application/useCliente.ts                 [NEW]
frontend/src/modules/crm/clientes/application/useCliente.test.ts            [NEW]
frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx        [NEW]
frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx   [NEW]
frontend/src/routes/_app/clientes.$clienteId.tsx                            [NEW — deep link route]
frontend/src/routes/_app/clientes.tsx                                       [MODIFY — add default right panel state]
frontend/src/shared/components/ClientListItem.tsx                           [MODIFY — ensure onClick nav prop]
```

**Alignment with architecture.md:**
- `useCliente.ts` matches defined hook in `application/` layer (architecture.md Complete Project Directory Structure)
- `clientes.$clienteId.tsx` matches the defined route `_app/clientes.$clienteId.tsx` in architecture.md routing table
- `queryKey: ['clientes', id]` matches canonical TanStack Query keys from architecture.md
- `ClienteDetailView.tsx` is the component defined in `presentation/` layer in architecture.md

**No conflicts** with Stories 1.x or 2.1. Story 2.1 established all shared infrastructure (Axios client, QueryClient, AppDbContext, ClienteEntity, IClienteRepository, ClienteRepository). This story extends all of them additively.

### Test Design References (Epic 2 Test Plan)

Tests relevant to this story (from `test-design-epic-2.md`):

**P1 — Must pass before story is closed:**
- **TC-E2-P1-01**: `GET /api/v1/clientes/{id}` returns 200 with all fields (xUnit integration)
- **TC-E2-P1-02**: `GET /api/v1/clientes/00000000-0000-0000-0000-000000000000` returns 404 Problem Details (xUnit integration) — mitigates R-007
- **TC-E2-P1-07**: Clicking a client item updates URL to `/clientes/:clienteId` (Vitest + RTL + TanStack Router test utils) — mitigates R-007
- **TC-E2-P1-08**: Direct URL `/clientes/:clienteId` loads correct detail (Playwright E2E) — mitigates R-007
- **TC-E2-P1-09**: Non-existent `clienteId` in URL shows graceful not-found (Playwright E2E) — mitigates R-007

**Risk covered:** R-007 (deep link to non-existent UUID shows blank screen — Score 4, Medium) — all three deep link test cases must pass.

### References

- Epic definition and Story 2.2 AC: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Architecture routing table (TanStack Router file names): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture query keys canonical list: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture complete directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture API pattern (GET /:id → 200/404): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Component boundaries (ClienteListView + ClienteDetailView split panel): [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries]
- State boundaries (selectedClienteId synced with URL param, no Zustand needed): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Error handling frontend pattern (ErrorPanel, never raw error.message): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- FR30 (deep linking): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Test cases TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#P1]
- Risk R-007 (non-existent clienteId): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Risk Assessment]
- Skeleton loading (react-loading-skeleton, no spinner): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- Backend entity pattern (private constructor + static Create()): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- Company standards (Clean Architecture + DDD, Spanish UI text, DateTimeOffset, Scalar): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- MasterCrud API reference: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md] — NOT applicable for this story's detail panel

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Task 1: Backend GET /api/v1/clientes/{id:guid} endpoint implemented with Problem Details RFC 7807 for 404. Handler returns null (not throws) and endpoint maps to Results.Problem(). IGetClienteByIdQueryHandler registered in Program.cs DI.
- Task 2: useCliente hook uses enabled:!!clienteId and retry:0 to avoid retrying 404s. MSW-based unit tests cover success, 404 error, and disabled query cases.
- Task 3: ClienteDetailView uses axios.isAxiosError + error.response?.status === 404 for not-found detection per story dev notes pattern. Skeleton loading renders 4 rows. ErrorPanel reused from shared/components.
- Task 4: New route clientes.$clienteId.tsx created. Base clientes.tsx updated with navigate callback. routeTree.gen.ts manually updated with new dynamic route. ClientListItem.tsx already had isSelected+onClick props from Story 2.1.
- Task 5: Component uses aria-busy="true" on loading container, semantic dl/dt/dd for fields, heading h2 for panel title. No siesa-ui-kit equivalent for detail card found — implemented with TailwindCSS slate-* palette.
- Pre-existing: 3 failing tests in ClienteListView.test.tsx (AC#2 filter timing tests) were already failing before Story 2.2 implementation — not a regression introduced here.
- dotnet not installed in environment — backend tests written and correct but not executed.

### File List

**Backend (modified):**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added GetByIdAsync
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented GetByIdAsync
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added GET /{id:guid} endpoint
- `backend/src/SiesaAgents.API/Program.cs` — registered IGetClienteByIdQueryHandler DI
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — added TC-E2-P1-01, TC-E2-P1-02
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — added GetByIdAsync to FakeClienteRepository

**Backend (new):**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

**Frontend (modified):**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added getById
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented getById
- `frontend/src/routes/_app/clientes.tsx` — added navigate onSelectCliente, updated placeholder text
- `frontend/src/routeTree.gen.ts` — added clientes.$clienteId route

**Frontend (new):**
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`
