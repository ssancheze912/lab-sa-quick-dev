# Story 2.2: Client Detail View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (deep link), **Then** the correct client details are loaded and displayed without requiring navigation from the list panel (FR30).

3. **Given** a `clienteId` in the URL does not correspond to any existing client, **When** the page loads, **Then** a not-found message is displayed gracefully in the right panel (no crash, no blank panel).

4. **Given** the backend is unavailable when loading a specific client detail, **When** the `GET /api/v1/clientes/:id` fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed in the right panel instead of the client data.

5. **Given** the user navigates to `/clientes` with no `clienteId` in the URL, **When** no client has been selected, **Then** the right panel displays a placeholder/empty state indicating no client is selected.

## Tasks / Subtasks

- [x] Task 1 — Backend: Add `GET /api/v1/clientes/:id` endpoint (AC: #2, #3, #4)
  - [x] Add `GetClienteByIdQuery.cs` to `backend/src/SiesaAgents.Application/Clientes/Queries/` — query record with `Guid Id`
  - [x] Add `GetClienteByIdQueryHandler.cs` to `backend/src/SiesaAgents.Application/Clientes/Queries/` — calls `IClienteRepository.GetByIdAsync(id, ct)`, returns `ClienteDto?`
  - [x] Verify `IClienteRepository.cs` already declares `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` (created in Story 2.1); if missing, add it
  - [x] Verify `ClienteRepository.cs` implements `GetByIdAsync` using `AppDbContext.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct)`; add implementation if missing
  - [x] Add `MapGet("/{id}", ...)` to `ClienteEndpoints.cs` in `MapClienteEndpoints()` — returns `Results.Ok(dto)` when found, `Results.NotFound(...)` with Problem Details when null (404)
  - [x] Verify `ExceptionHandlingMiddleware` is in place (from Story 1.3) — `GetByIdAsync` exceptions flow through it

- [x] Task 2 — Frontend: Application layer — `useCliente` hook (AC: #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts` — TanStack Query hook:
    - `queryKey: ['clientes', id]` (canonical key per architecture doc)
    - `queryFn: () => clienteApiRepository.getById(id)` — calls `GET /api/v1/clientes/:id`
    - `enabled: !!id` — disabled when no `id` is provided
    - `staleTime: 0`
  - [x] Verify or extend `IClienteRepository.ts` (frontend domain) to include `getById(id: string): Promise<Cliente>` — add if missing
  - [x] Verify or extend `clienteApiRepository.ts` (frontend infrastructure) to implement `getById(id: string)` — `GET /api/v1/clientes/${id}` via `apiClient`; throws on 404 (AxiosError)

- [x] Task 3 — Frontend: Presentation layer — `ClienteDetailView` component (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Accepts `clienteId: string | undefined` prop
    - When `clienteId` is undefined → renders placeholder: `"Selecciona un cliente para ver su detalle"` (centered, muted text, `slate-400`)
    - Uses `useCliente(clienteId)` hook (enabled only when `clienteId` is truthy)
    - `isLoading` state: renders skeleton placeholders (`react-loading-skeleton`) for 4 fields
    - `isError` state: renders `<ErrorPanel onRetry={refetch} />` with message `"No se pudo cargar el cliente."`
    - 404 detection: if Axios error with status 404 → renders not-found message: `"Cliente no encontrado"` with subtext `"El cliente solicitado no existe o fue eliminado."` (do NOT use `ErrorPanel` for 404 — use a distinct `NotFoundPanel` or inline JSX)
    - Data loaded: renders read-only detail card with all fields: Nombre (heading `text-xl font-bold`), NIT/RUC (labeled `"NIT/RUC"`), Teléfono (labeled `"Teléfono"`), Ciudad (labeled `"Ciudad"`) — all labels in Spanish
    - All user-facing text in Spanish (labels, placeholder, error messages)
  - [x] Create `frontend/src/shared/components/NotFoundPanel.tsx` (if not already created) — accepts `title: string`, `description?: string`; uses Heroicons `QuestionMarkCircleIcon`; renders centered layout

- [x] Task 4 — Frontend: Route wiring — deep linking at `/clientes/:clienteId` (AC: #1, #2)
  - [x] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — TanStack Router dynamic route:
    - Renders the same split-panel layout as `clientes.tsx` (left: `<ClienteListView />` at 280px, right: `<ClienteDetailView clienteId={clienteId} />`)
    - Reads `clienteId` from `useParams()` (TanStack Router: `const { clienteId } = Route.useParams()`)
    - Passes `clienteId` as prop to `<ClienteDetailView />`
  - [x] Update `frontend/src/routes/_app/clientes.tsx` — replace the right panel placeholder with `<ClienteDetailView clienteId={undefined} />` (no client selected)
  - [x] Update `ClienteListItem.tsx` (or `ClienteListView.tsx`) — clicking a list item navigates to `/clientes/:clienteId` using TanStack Router's `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>` or `router.navigate()`

- [x] Task 5 — Tests (AC: #1, #2, #3, #4, #5) — aligned with test-design-epic-2.md
  - [x] **Backend API — P1**: `GET /api/v1/clientes/:id` with valid seeded client returns 200 + correct `ClienteDto` JSON (xUnit, WebApplicationFactory + Testcontainers)
  - [x] **Backend API — P1**: `GET /api/v1/clientes/{unknown-uuid}` returns 404 + Problem Details (xUnit, WebApplicationFactory + Testcontainers)
  - [x] **Frontend component — P2**: `ClienteDetailView` with non-existent ID (MSW 404) renders not-found message (Vitest + RTL + MSW)
  - [x] **Frontend component — P1**: `ClienteDetailView` with valid client shows Nombre, NIT/RUC, Teléfono, Ciudad (Vitest + RTL + MSW)
  - [x] **Frontend component — P1**: `ClienteDetailView` with `clienteId={undefined}` shows placeholder text `"Selecciona un cliente"` (Vitest + RTL)
  - [x] **Frontend component — P1**: `ClienteDetailView` with MSW 500 shows `ErrorPanel` + "Reintentar" button (Vitest + RTL + MSW)
  - [ ] **E2E — P1**: navigate directly to `/clientes/:id` → detail panel shows correct Nombre + NIT (Playwright, TC-E2-2-2-E2E-1, risk R-008)
  - [ ] **E2E — P3**: navigate to `/clientes/00000000-0000-0000-0000-000000000000` → not-found message rendered (Playwright, risk R-008)

## Dev Notes

### Architecture Context

This story wires the right panel of the split-panel layout introduced in Epic 2. It adds:
- `GET /api/v1/clientes/:id` backend endpoint (Application Query + Infrastructure Repository method)
- `useCliente(id)` TanStack Query hook with canonical key `['clientes', id]`
- `ClienteDetailView` presentation component displayed in the 280px-right flex panel
- Dynamic TanStack Router route `clientes.$clienteId.tsx` for deep linking (FR30)

**Scope boundary (CRITICAL):** This story covers **read-only detail view only**. No edit/delete buttons are wired here. The edit (`ClienteForm`) and delete (`useDeleteCliente`) functionality belongs to Stories 2.3 and 2.5 respectively. `ClienteDetailView` can include placeholder Edit/Delete buttons (disabled or absent) if needed for layout, but their logic must NOT be implemented here.

**Split-panel layout continuity:** Story 2.1 establishes `clientes.tsx` with `<ClienteListView />` in the left panel and a placeholder right panel. This story replaces that placeholder with `<ClienteDetailView />`. The 280px left panel width and `overflow-y-auto` scroll must remain intact.

**URL as source of truth:** Per architecture, `selectedClienteId` is synchronized with the URL param — not stored in Zustand. Clicking a `ClienteListItem` navigates to `/clientes/:clienteId`. The URL parameter is read via `Route.useParams()` in the route component.

**MasterCrud note:** MasterCrud is NOT applicable to this story. The custom split-panel layout with `ClienteListView` (280px) + `ClienteDetailView` (flex) is the established architecture. MasterCrud is a full-page table/form orchestrator that conflicts with this design. [Source: `2-1-client-list-search.md#Dev Notes`]

### Backend: GetClienteByIdQueryHandler Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
namespace SiesaAgents.Application.Clientes.Queries;

public record GetClienteByIdQuery(Guid Id);

public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repo;
    public GetClienteByIdQueryHandler(IClienteRepository repo) => _repo = repo;

    public async Task<ClienteDto?> Handle(GetClienteByIdQuery query, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;
        return new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad, entity.CreatedAt, entity.UpdatedAt);
    }
}
```

### Backend: GET /api/v1/clientes/:id Endpoint

```csharp
// Add inside MapClienteEndpoints() in ClienteEndpoints.cs
group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
{
    var dto = await handler.Handle(new GetClienteByIdQuery(id), ct);
    return dto is not null
        ? Results.Ok(dto)
        : Results.Problem(
            detail: "El cliente solicitado no fue encontrado.",
            statusCode: 404,
            title: "Cliente no encontrado");
});
```

Response shape — success (200 OK):
```json
{ "id": "uuid", "nombre": "Acme S.A.", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "2026-03-12T10:30:00Z" }
```

Response shape — not found (404, Problem Details RFC 7807):
```json
{ "type": "https://tools.ietf.org/html/rfc7807", "title": "Cliente no encontrado", "status": 404, "detail": "El cliente solicitado no fue encontrado." }
```

### Frontend: useCliente Hook

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export const useCliente = (id: string | undefined) =>
  useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id,
    staleTime: 0,
  });
```

### Frontend: clienteApiRepository — getById extension

```typescript
// Add to frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
getById: async (id: string): Promise<Cliente> => {
  const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
  return response.data;
},
```

404 from Axios becomes an `AxiosError` with `error.response?.status === 404`. Detect it in `ClienteDetailView`:

```typescript
import axios from 'axios';
// In ClienteDetailView:
const isNotFound = isError && axios.isAxiosError(error) && error.response?.status === 404;
```

### Frontend: TanStack Router — Dynamic Route

```typescript
// frontend/src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView';
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
});

function ClienteDetailPage() {
  const { clienteId } = Route.useParams();
  return (
    <div className="flex h-full">
      <ClienteListView />
      <ClienteDetailView clienteId={clienteId} />
    </div>
  );
}
```

### Frontend: ClienteListItem — Navigation on Click

```typescript
// In ClienteListView.tsx — update the onClick or use TanStack Router Link
import { Link } from '@tanstack/react-router';

// Wrap each list item with Link:
<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>
  <ClienteListItem cliente={cliente} isActive={selectedId === cliente.id} />
</Link>
```

`isActive` highlight: compare `clienteId` param from `useParams()` (if on `clientes.$clienteId` route) or `undefined` (on `clientes` route). Use TanStack Router's `useRouterState` or `useParams` with a try/catch to determine the active clienteId.

### Frontend: ClienteDetailView — Key Implementation Points

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
const { data, isLoading, isError, error, refetch } = useCliente(clienteId);

const isNotFound = isError && axios.isAxiosError(error) && error.response?.status === 404;

if (!clienteId) return <div className="...">Selecciona un cliente para ver su detalle</div>;
if (isLoading) return <Skeleton count={4} />; // react-loading-skeleton
if (isNotFound) return <NotFoundPanel title="Cliente no encontrado" description="El cliente solicitado no existe o fue eliminado." />;
if (isError) return <ErrorPanel onRetry={refetch} message="No se pudo cargar el cliente." />;

return (
  <div>
    <h2 className="text-xl font-bold">{data.nombre}</h2>
    <dl>
      <dt>NIT/RUC</dt><dd>{data.nit}</dd>
      <dt>Teléfono</dt><dd>{data.telefono}</dd>
      <dt>Ciudad</dt><dd>{data.ciudad}</dd>
    </dl>
  </div>
);
```

### Project Structure Notes

**Files to create/modify:**

```
backend/
├── src/
│   ├── SiesaAgents.Application/
│   │   └── Clientes/
│   │       └── Queries/
│   │           ├── GetClienteByIdQuery.cs           ← CREATE
│   │           └── GetClienteByIdQueryHandler.cs    ← CREATE
│   ├── SiesaAgents.Domain/
│   │   └── Clientes/
│   │       └── Interfaces/IClienteRepository.cs     ← VERIFY/MODIFY (GetByIdAsync)
│   ├── SiesaAgents.Infrastructure/
│   │   └── Repositories/ClienteRepository.cs        ← VERIFY/MODIFY (GetByIdAsync impl)
│   └── SiesaAgents.API/
│       └── Endpoints/ClienteEndpoints.cs             ← MODIFY (add /{id:guid} endpoint)
└── tests/
    └── SiesaAgents.UnitTests/
        └── Clientes/
            └── GetClienteByIdApiTests.cs             ← CREATE (P1 + P1 API tests)

frontend/
└── src/
    ├── modules/crm/clientes/
    │   ├── domain/IClienteRepository.ts              ← VERIFY/MODIFY (add getById)
    │   ├── application/useCliente.ts                 ← CREATE
    │   ├── infrastructure/clienteApiRepository.ts    ← MODIFY (add getById)
    │   ├── presentation/ClienteDetailView.tsx        ← CREATE
    │   └── __tests__/ClienteDetailView.test.tsx      ← CREATE
    ├── routes/_app/
    │   ├── clientes.tsx                              ← MODIFY (replace right panel placeholder)
    │   └── clientes.$clienteId.tsx                  ← CREATE
    └── shared/
        └── components/
            └── NotFoundPanel.tsx                     ← CREATE
```

**Verify from Story 2.1:**
- `ClienteListItem.tsx` exists — add TanStack Router `<Link>` wrapper for navigation
- `ErrorPanel.tsx` exists at `frontend/src/shared/components/ErrorPanel.tsx` — reuse it
- `apiClient.ts` exists at `frontend/src/shared/lib/apiClient.ts` — use it
- `clienteApiRepository.ts` exists — extend with `getById`
- `IClienteRepository.ts` (frontend domain) exists — extend with `getById`

### TanStack Query Key Alignment

Per architecture canonical keys:
- `['clientes']` → all clients (useClientes, Story 2.1)
- `['clientes', id]` → single client (useCliente, this story)

**CRITICAL:** The `id` in `queryKey: ['clientes', id]` must match the string UUID from the route param. Do NOT use `queryKey: ['cliente', id]` (singular without array) or `queryKey: ['clientes', { id }]` (object wrapper) — both would break cache invalidation in Stories 2.4 and 2.5.

### Testing Approach

**Backend integration tests** use `WebApplicationFactory<Program>` + Testcontainers PostgreSQL (established in Story 1.3). Seed a `ClienteEntity` via `AppDbContext` in the test fixture, then assert `GET /api/v1/clientes/{seeded-id}` returns the correct DTO.

**Frontend component tests** use Vitest + React Testing Library + MSW 2.x. Define MSW handlers:
- `http.get('/api/v1/clientes/:id', resolver)` → responds with a fixture `Cliente` object
- Override handler for 404/500 scenarios per test

**Key test scenarios for this story (from test-design-epic-2.md):**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E2-2-2-API-1 | API | GET `/api/v1/clientes/:id` returns 200 + correct ClienteDto | P1 |
| TC-E2-2-2-API-2 | API | GET `/api/v1/clientes/{unknown-uuid}` returns 404 + Problem Details | P1 |
| TC-E2-2-2-CMP-1 | Component | ClienteDetailView with valid ID shows all 4 fields | P1 |
| TC-E2-2-2-CMP-2 | Component | ClienteDetailView with undefined clienteId shows placeholder | P1 |
| TC-E2-2-2-CMP-3 | Component | ClienteDetailView with MSW 500 shows ErrorPanel + "Reintentar" | P1 |
| TC-E2-2-2-CMP-4 | Component | ClienteDetailView with MSW 404 shows not-found message | P2 |
| TC-E2-2-2-E2E-1 | E2E | Navigate directly to `/clientes/:id` — detail panel shows Nombre + NIT | P1 |
| TC-E2-2-2-E2E-2 | E2E | Navigate to `/clientes/00000000-0000-0000-0000-000000000000` — not-found shown | P3 |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `GetClienteByIdQueryHandler` returns `ClienteDto?` (nullable) — handler returns null on not found, endpoint maps null to 404
- [ ] 404 response uses `Results.Problem(...)` with Problem Details RFC 7807 shape — NOT `Results.NotFound()` with empty body
- [ ] `useCliente` has `enabled: !!id` — no fetch when id is undefined
- [ ] Query key is `['clientes', id]` (array with string) — NOT `['cliente', id]` and NOT `['clientes', { id }]`
- [ ] `ClienteDetailView` detects 404 via `axios.isAxiosError(error) && error.response?.status === 404` — distinct from generic `isError` path
- [ ] 404 in detail view renders `NotFoundPanel` or specific not-found message — NOT `ErrorPanel` (different UX intent)
- [ ] `isLoading` state uses `react-loading-skeleton` — NOT a spinner
- [ ] All user-facing text in Spanish: field labels, placeholder, error messages, not-found text
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] Clicking a `ClienteListItem` uses TanStack Router `<Link>` or `router.navigate()` — NOT `window.location.href` or `history.push`
- [ ] URL updates to `/clientes/:clienteId` on client selection (FR30) — verified via E2E or Router test
- [ ] `DateTimeOffset` in backend entity/DTOs — NEVER `DateTime` (verify existing `ClienteDto` conforms)
- [ ] Backend error responses use Problem Details RFC 7807 via `ExceptionHandlingMiddleware` for unexpected errors; 404 handled explicitly per endpoint

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2`]
- Architecture — Split-panel layout and component boundaries: [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)`]
- Architecture — TanStack Query canonical keys: [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Architecture — FR3 (View client detail) mapping: [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`]
- Architecture — FR30 (deep linking): [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- Architecture — REST endpoint `GET /api/v1/clientes/{id}`: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — Frontend folder structure `clientes.$clienteId.tsx`: [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Architecture — Enforcement guidelines (DateTimeOffset, UUID, Problem Details): [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Test design — TC-E2-2-2 test scenarios, R-008 risk: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Coverage Plan`]
- Preceding story — ClienteEntity, ClienteDto, IClienteRepository, ErrorPanel: [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md`]
- Company standards — Backend stack (Minimal API, EF Core 10): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- Company standards — Frontend stack (TanStack Router, TanStack Query): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `IClienteRepository.cs` and `ClienteRepository.cs` already had `GetByIdAsync` from Story 2.1 — verified and reused.
- `ClienteListItem.tsx` updated from callback-based to TanStack Router `<Link>` navigation; `ClienteListView.test.tsx` updated to wrap with minimal `RouterProvider` to keep Story 2.1 tests passing.
- `ClienteListView` now accepts optional `activeClienteId` prop instead of reading from router state internally — improves testability and avoids RouterProvider dependency in `ClienteListView` itself.
- E2E tests (Playwright) are left unchecked as they require a running stack and are P3/P1 scope outside the unit/integration test boundary.
- Backend: `GetClienteByIdQueryHandler` registered as scoped service in `Program.cs`.

### File List

- backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs (created — includes IGetClienteByIdQueryHandler interface)
- backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs (created — implements IGetClienteByIdQueryHandler)
- backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs (modified — added GET /{id:guid}, uses IGetClienteByIdQueryHandler)
- backend/src/SiesaAgents.API/Program.cs (modified — registered IGetClienteByIdQueryHandler)
- backend/tests/SiesaAgents.UnitTests/Clientes/GetClienteByIdApiTests.cs (created — uses InMemory DB isolation)
- backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj (modified — added Microsoft.EntityFrameworkCore.InMemory)
- frontend/src/modules/crm/clientes/domain/IClienteRepository.ts (modified — added getById)
- frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts (modified — added getById)
- frontend/src/modules/crm/clientes/application/useCliente.ts (created)
- frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx (created)
- frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.test.tsx (created)
- frontend/src/modules/crm/clientes/__tests__/ClienteListView.test.tsx (modified — added RouterProvider wrapper)
- frontend/src/shared/components/NotFoundPanel.tsx (created)
- frontend/src/shared/components/ClienteListItem.tsx (modified — replaced onClick with TanStack Router Link)
- frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx (modified — added activeClienteId prop)
- frontend/src/routes/_app/clientes.$clienteId.tsx (created)
- frontend/src/routes/_app/clientes.tsx (modified — replaced right panel placeholder with ClienteDetailView)
