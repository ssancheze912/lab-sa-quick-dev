# Story 2.2: Client Detail View

Status: done

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
So that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`, rendered by `ClienteDetailView`. **And** the URL updates to `/clientes/:clienteId` without a page reload (FR30 deep linking).

2. **Given** the user accesses the URL `/clientes/:clienteId` directly (deep link), **When** the page loads, **Then** `GET /api/v1/clientes/{id}` is called and the correct client details are displayed in the right panel (FR30).

3. **Given** a `clienteId` in the URL does not exist in the system, **When** `GET /api/v1/clientes/{id}` returns 404, **Then** a not-found message ("Cliente no encontrado") is displayed gracefully in the right panel. The application shell remains visible and no unhandled JavaScript error is thrown.

4. **Given** the `/clientes/:clienteId` route loads, **When** `GET /api/v1/clientes/{id}` is in-flight, **Then** skeleton placeholders (`react-loading-skeleton`) are displayed in the right panel — no spinner.

## Tasks / Subtasks

- [x] Task 1 — Backend: Create `GetClienteByIdQuery` and handler (AC: #2, #3)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with `Guid Id`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — takes `IClienteRepository`, calls `GetByIdAsync(query.Id, ct)`, returns `ClienteDto?`; returns `null` when not found
  - [x] Add method to `IClienteRepository` interface: `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)`

- [x] Task 2 — Backend: Implement `GetByIdAsync` in `ClienteRepository` (AC: #2, #3)
  - [x] Add to `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    `await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken)`

- [x] Task 3 — Backend: Add `GET /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [x] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add:
    `app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) => { var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct); return dto is null ? Results.Problem(title: "Cliente no encontrado", statusCode: 404) : Results.Ok(dto); })`
  - [x] Register DI in `Program.cs`: `builder.Services.AddScoped<GetClienteByIdQueryHandler>()`

- [x] Task 4 — Frontend: Create `useCliente` application hook (AC: #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - [x] Use `useQuery` from `@tanstack/react-query` with `queryKey: ['clientes', id]` and `queryFn` calling `clienteApiRepository.getById(id)`
  - [x] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository` interface
  - [x] Implement `getById` in `clienteApiRepository.ts`: `apiClient.get<Cliente>(\`/api/v1/clientes/${id}\`)` → return `response.data`
  - [x] Return `{ data, isLoading, isError, error }` from the hook

- [x] Task 5 — Frontend: Create `ClienteDetailView` presentation component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [x] Accept `clienteId: string` as prop
  - [x] Import and call `useCliente(clienteId)` hook
  - [x] When `isLoading`: render skeleton placeholders (`react-loading-skeleton`) — 4 skeleton rows for Nombre, NIT/RUC, Teléfono, Ciudad — no spinner
  - [x] When `isError` (non-404): render `<ErrorPanel onRetry={refetch} />`
  - [x] When 404 (error with HTTP status 404): render not-found message `"Cliente no encontrado"` in a `<p data-testid="cliente-not-found">` element
  - [x] When data loaded: render a detail card with labeled fields:
    - `Nombre`: `<dt>Nombre</dt><dd>{data.nombre}</dd>`
    - `NIT/RUC`: `<dt>NIT/RUC</dt><dd>{data.nitRuc}</dd>`
    - `Teléfono`: `<dt>Teléfono</dt><dd>{data.telefono}</dd>`
    - `Ciudad`: `<dt>Ciudad</dt><dd>{data.ciudad}</dd>`
  - [x] Outer container: `<div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-auto">`
  - [x] Detect 404 from TanStack Query error: check `(error as AxiosError)?.response?.status === 404`
  - [x] All labels must be in Spanish

- [x] Task 6 — Frontend: Create `/clientes/$clienteId` route (AC: #1, #2, #3)
  - [x] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`
  - [x] Export `Route` constant: `export const Route = createFileRoute('/_app/clientes/$clienteId')({ component: ClienteDetailRoute })`
  - [x] `ClienteDetailRoute` reads `clienteId` from route params via `Route.useParams()`
  - [x] Renders `<ClienteDetailView clienteId={clienteId} />`
  - [x] Update `frontend/src/routes/_app/clientes.tsx` — replace the `<div className="flex-1">` placeholder with `<Outlet />` if not already an `<Outlet />`; confirm the right panel area renders `<Outlet />` so the nested `$clienteId` route renders inside it

- [x] Task 7 — Frontend: Update `ClienteListItem` to navigate on click (AC: #1)
  - [x] In `frontend/src/shared/components/ClienteListItem.tsx`, ensure `onClick` handler updates the URL to `/clientes/${cliente.id}` using TanStack Router's `navigate` or the parent's `onClick` callback
  - [x] In `ClienteListView.tsx`, wire `ClienteListItem` `onClick` to `navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })` using `useNavigate` from `@tanstack/react-router`
  - [x] Track `selectedClienteId` (from current URL params using `useParams`) to set `isActive` on the matching `ClienteListItem`

- [x] Task 8 — Frontend and backend unit/component tests (AC: #1–#4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
    - [x] TC: MSW returns client by id → `data` contains client, `isLoading` false, `isError` false
    - [x] TC: MSW returns 404 → `isError` is true with status 404
    - [x] TC: `queryKey` is exactly `['clientes', id]`
  - [x] Create `frontend/src/modules/crm/clientes/presentation/-ClienteDetailView.test.tsx`
    - [x] TC-E2-P1-06a: Click on client item in list → right panel shows `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`
    - [x] TC-E2-P1-06b: Click on client item → URL updates to `/clientes/{clienteId}` (no page reload)
    - [x] TC-E2-P1-08a: Navigate to `/clientes/00000000-0000-0000-0000-000000000000` → "Cliente no encontrado" message rendered in right panel
    - [x] TC-E2-P1-08b: Navigate to invalid id → no unhandled JS error, navigation shell still visible
    - [x] TC (skeleton): While loading, skeleton rows rendered, no `role="status"` spinner present
    - [x] TC: `data-testid="cliente-detail-panel"` present on container
    - [x] TC: `data-testid="cliente-not-found"` present when 404
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
    - [x] TC: Repository returns entity → handler returns `ClienteDto` with all fields mapped correctly
    - [x] TC: Repository returns `null` → handler returns `null`
    - [x] TC: Repository called exactly once with correct id
  - [x] API Integration test (TC-E2-P2-02): `GET /api/v1/clientes/{id}` returns 200 with correct `ClienteDto`
  - [x] API Integration test (TC-E2-P2-03): `GET /api/v1/clientes/00000000-0000-0000-0000-000000000000` returns 404 `application/problem+json` without stack trace

## Dev Notes

### Frontend: File Locations

```
frontend/src/modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                          # Existing — add no changes needed (interface already has all fields)
│   └── IClienteRepository.ts              # Add: getById(id: string): Promise<Cliente>
├── application/
│   ├── useClientes.ts                      # Existing — no changes
│   └── useCliente.ts                       # NEW — queryKey: ['clientes', id]
├── infrastructure/
│   └── clienteApiRepository.ts            # Add: getById implementation
└── presentation/
    ├── ClienteListView.tsx                 # Update: wire onClick to navigate, track selectedClienteId via URL
    ├── ClienteDetailView.tsx               # NEW — right panel detail card
    └── -ClienteDetailView.test.tsx        # NEW — component tests (prefixed with -)

frontend/src/routes/_app/
├── clientes.tsx                            # Update: confirm <Outlet /> in right panel
└── clientes.$clienteId.tsx                # NEW — nested route for detail view
```

### Frontend: `useCliente` Hook

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id),
    enabled: !!id,
  })
}
```

### Frontend: 404 Detection Pattern

```typescript
// Inside ClienteDetailView.tsx
import type { AxiosError } from 'axios'

const { data, isLoading, isError, error, refetch } = useCliente(clienteId)
const isNotFound = isError && (error as AxiosError)?.response?.status === 404

if (isLoading) { /* skeleton */ }
if (isNotFound) { return <p data-testid="cliente-not-found">Cliente no encontrado</p> }
if (isError) { return <ErrorPanel onRetry={refetch} /> }
```

### Frontend: Route Navigation on Click

```typescript
// Inside ClienteListView.tsx
import { useNavigate, useParams } from '@tanstack/react-router'

const navigate = useNavigate()
const { clienteId: selectedClienteId } = useParams({ strict: false })

// Pass to ClienteListItem:
<ClienteListItem
  key={cliente.id}
  cliente={cliente}
  isActive={cliente.id === selectedClienteId}
  onClick={(id) => navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })}
/>
```

### Frontend: Nested Route File (`clientes.$clienteId.tsx`)

```typescript
// frontend/src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailRoute,
})

function ClienteDetailRoute() {
  const { clienteId } = Route.useParams()
  return <ClienteDetailView clienteId={clienteId} />
}
```

### Frontend: `clientes.tsx` Route Update

```typescript
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesRoute,
})

function ClientesRoute() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
```

### Frontend: `ClienteDetailView` Skeleton Loading

```typescript
// When isLoading in ClienteDetailView.tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

<div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-auto">
  <dl className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i}>
        <Skeleton height={12} width="30%" />
        <Skeleton height={16} width="60%" className="mt-1" />
      </div>
    ))}
  </dl>
</div>
```

### Frontend: `ClienteDetailView` Data Display

```typescript
// When data loaded in ClienteDetailView.tsx
<div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-auto">
  <h2 className="text-lg font-bold text-slate-800 mb-4">{data.nombre}</h2>
  <dl className="space-y-3">
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
      <dd className="text-sm text-slate-800 mt-0.5">{data.nitRuc}</dd>
    </div>
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
      <dd className="text-sm text-slate-800 mt-0.5">{data.telefono}</dd>
    </div>
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
      <dd className="text-sm text-slate-800 mt-0.5">{data.ciudad}</dd>
    </div>
  </dl>
</div>
```

### Backend: `IClienteRepository` Updated Contract

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
```

### Backend: `GetClienteByIdQueryHandler`

```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct = default)
    {
        var entity = await _repository.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;
        return new ClienteDto(entity.Id, entity.Nombre, entity.NitRuc, entity.Telefono, entity.Ciudad, entity.CreatedAt);
    }
}
```

### Backend: `GET /api/v1/clientes/{id}` Endpoint Contract

```
GET /api/v1/clientes/{id}
Response 200 OK:
{
  "id": "uuid",
  "nombre": "Empresa Ejemplo",
  "nitRuc": "900111222",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z"
}

Response 404 Not Found (application/problem+json):
{
  "status": 404,
  "title": "Cliente no encontrado"
}
```

JSON property names are camelCase (auto-serialized by .NET).

### Backend: `ClienteRepository` `GetByIdAsync` Implementation

```csharp
// Addition to ClienteRepository.cs
public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    => await _context.Clientes
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
```

### Backend: DI Registration Addition in Program.cs

```csharp
// Additions to Program.cs for Story 2.2
builder.Services.AddScoped<GetClienteByIdQueryHandler>();
```

### Required `data-testid` Attributes

| Component | `data-testid` | Location |
|-----------|---------------|----------|
| Detail panel container | `cliente-detail-panel` | `ClienteDetailView.tsx` — outer div |
| Not-found message | `cliente-not-found` | `ClienteDetailView.tsx` — `<p>` for 404 state |

### Testing Notes

- Component tests for `ClienteDetailView` use `renderHook` + `QueryClientWrapper` (wrap in `QueryClientProvider` with fresh `QueryClient` per test)
- MSW handlers for this story: `http.get('/api/v1/clientes/:id', ...)` returning either client data, 404, or network error
- Test files in `presentation/` must be prefixed with `-` (e.g., `-ClienteDetailView.test.tsx`) per TanStack Router `routeFileIgnorePrefix` convention
- For TC-E2-P1-06b (URL update), use TanStack Router test utilities to assert `router.state.location.pathname`
- Backend unit tests mock `IClienteRepository` — no real DB required
- 404 from `GET /api/v1/clientes/{id}` must return `application/problem+json` — handled by `ExceptionHandlingMiddleware` (Story 1.3) or inline `Results.Problem()`

### Critical Constraints from Test Design

Per `test-design-epic-2.md`:
- `useCliente` must use `queryKey: ['clientes', id]` exactly — canonical key per architecture
- 404 must be detected on the frontend via `(error as AxiosError)?.response?.status === 404` and shown as "Cliente no encontrado" — verified by TC-E2-P1-08
- Deep link to `/clientes/:clienteId` must render the correct client detail — verified by TC-E2-P1-07 (E2E)
- Backend 404 response must use `application/problem+json` without stack trace (NFR6) — verified by TC-E2-P2-03
- Skeleton loading (not spinner) is mandatory per company standard — verified in component tests

### References

- TanStack Router nested routes: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- TanStack Query keys `['clientes', id]`: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Deep linking FR30: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Navigation & Access]
- FR5 (view complete client detail): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- Route file `clientes.$clienteId.tsx`: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details RFC 7807 (404 response): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Skeleton loading standard (not spinner): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- Test cases TC-E2-P1-06, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P2-02, TC-E2-P2-03: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#P1]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
