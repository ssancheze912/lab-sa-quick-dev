# Story 2.2: Client Detail View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad (FR3).

2. **Given** a client is selected, **When** the detail panel renders, **Then** the URL updates to `/clientes/:clienteId` reflecting the selected client's UUID (FR30 deep linking).

3. **Given** the user accesses the URL `/clientes/:clienteId` directly, **When** the page loads, **Then** the correct client details are fetched via `GET /api/v1/clientes/{id}` and displayed in the right panel (FR30).

4. **Given** a `clienteId` in the URL does not exist (404 from backend), **When** the page loads or the user navigates to that URL, **Then** a not-found message ("Cliente no encontrado") is displayed gracefully in the right panel — no stack traces or technical details exposed (NFR6).

5. **Given** the backend is unavailable when fetching the client detail, **When** the `GET /api/v1/clientes/{id}` call fails with a network or server error, **Then** an `ErrorPanel` with a "Reintentar" button is displayed in the right panel, and the list panel remains functional.

6. **Given** the detail is loading, **When** the `useCliente(id)` query is in `isLoading` state, **Then** skeleton placeholders are displayed in the right panel using `react-loading-skeleton` (no spinner).

7. **Given** the backend entity and EF Core configuration are in place, **When** `GET /api/v1/clientes/{id}` is called with a valid UUID, **Then** the endpoint returns a JSON object with fields `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt` with HTTP 200; for an unknown UUID it returns HTTP 404 in Problem Details RFC 7807 format.

## Tasks / Subtasks

- [x] Task 1 — Create `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` (AC: #3, #7)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with `Guid Id` parameter
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — injects `IClienteRepository`, calls `GetByIdAsync(query.Id, ct)`, returns `ClienteDto?`; throws `NotFoundException` (or returns null) when not found
  - [x] Register handler in DI: `builder.Services.AddScoped<GetClienteByIdQueryHandler>()` in `Program.cs`

- [x] Task 2 — Add `GET /api/v1/clientes/{id}` endpoint (AC: #3, #7)
  - [x] Add `app.MapGet("/api/v1/clientes/{id:guid}", ...)` inside `ClienteEndpoints.MapClienteEndpoints()`
  - [x] If handler returns `null` → `Results.Problem(title: "Cliente no encontrado", statusCode: 404)` (Problem Details RFC 7807)
  - [x] If handler returns a `ClienteDto` → `Results.Ok(dto)` (HTTP 200)
  - [x] Tag the endpoint with `"Clientes"` for Scalar documentation

- [x] Task 3 — Create `useCliente(id)` TanStack Query hook (AC: #3, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - [x] Use `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`
  - [x] `enabled: !!id` ensures no fetch when no client is selected

- [x] Task 4 — Add `getById` to `IClienteRepository` and `clienteApiRepository` (AC: #3, #7)
  - [x] Verify `IClienteRepository.ts` exports a `getById(id: string): Promise<Cliente>` method (already declared in domain — confirm or add)
  - [x] Add implementation in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: `GET /api/v1/clientes/${id}`, return `response.data as Cliente`
  - [x] If Axios receives 404, let the error propagate to TanStack Query's `isError` state — do not swallow

- [x] Task 5 — Create `ClienteDetailPanel` presentation component (AC: #1, #2, #4, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
  - [x] Props: none — reads `clienteId` from TanStack Router's `useParams()` (route param `$clienteId`)
  - [x] Uses `useCliente(clienteId)` hook internally
  - [x] Loading state: renders skeleton rows via `react-loading-skeleton` (4 rows: Nombre, NIT/RUC, Teléfono, Ciudad)
  - [x] Error state (non-404): renders `<ErrorPanel onRetry={refetch} />` with fixed message (NFR6)
  - [x] Not-found state (404): renders inline "Cliente no encontrado" message — no `ErrorPanel`, no retry button
  - [x] Success state: renders a read-only detail card with labeled fields in Spanish:
    - "Nombre" → `cliente.nombre`
    - "NIT/RUC" → `cliente.nit`
    - "Teléfono" → `cliente.telefono`
    - "Ciudad" → `cliente.ciudad`
  - [x] WCAG 2.1 AA: each field uses a `<dl>/<dt>/<dd>` or equivalent semantic structure; labels are visually distinct from values
  - [x] Styling: TailwindCSS, `slate-*` for neutrals, `#0e79fd` Siesa Blue for section accents

- [x] Task 6 — Wire `ClienteDetailPanel` into the `/clientes/$clienteId` route (AC: #1, #2, #3, #4)
  - [x] Update (or create) `frontend/src/routes/_app/clientes.$clienteId.tsx`
  - [x] Import `ClienteDetailPanel` and render it in the right panel area of the two-panel layout
  - [x] Ensure `ClienteListPanel` (left, 280px) remains visible when a client is selected — the layout is a persistent split panel, NOT a navigation replacement
  - [x] `ClientListItem` in `ClienteListPanel` must navigate to `/clientes/$clienteId` on click (update `ClienteListPanel.tsx` onClick handler to use TanStack Router's `navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })`)
  - [x] Highlight the selected item in `ClienteListPanel` — compare `cliente.id` with the current route param; apply active styling (border-left `#0e79fd`, bg highlight)

- [x] Task 7 — Write backend unit tests (AC: #7)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
    - [x] Test: existing ID → returns correct `ClienteDto` mapping
    - [x] Test: unknown ID → handler returns null / throws (per chosen pattern)
  - [x] Structure: Arrange / Act / Assert; mock `IClienteRepository`

- [x] Task 8 — Write frontend unit tests (AC: #1, #3, #4, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
    - [x] MSW handler for `GET /api/v1/clientes/:id` — success path returns valid `Cliente`
    - [x] MSW handler for `GET /api/v1/clientes/:id` — 404 path
    - [x] Verify hook returns `data` on success; `isError` on 404/error
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`
    - [x] Render: loading state → skeletons present, no client data visible
    - [x] Render: success state → all 4 fields (Nombre, NIT/RUC, Teléfono, Ciudad) visible in Spanish
    - [x] Render: 404 state → "Cliente no encontrado" visible; ErrorPanel NOT rendered
    - [x] Render: network error state → `ErrorPanel` with retry button rendered
    - [x] Accessibility check via `axe`

## Dev Notes

### Architecture Context

This story implements the right panel of the split-panel `/clientes` view. The left panel (`ClienteListPanel`) was built in Story 2.1. The route `clientes.$clienteId.tsx` is where the full two-panel layout composes both panels together.

Per architecture decision (FR30): the URL `/clientes/:clienteId` is the source of truth for the selected client. TanStack Router's file-based routing maps `$clienteId` as the dynamic segment.

No Zustand store is needed — `selectedClienteId` is the URL param.

### Backend Pattern — `GetClienteByIdQueryHandler`

```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repo;
    public GetClienteByIdQueryHandler(IClienteRepository repo) => _repo = repo;

    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;
        return new ClienteDto
        {
            Id        = entity.Id,
            Nombre    = entity.Nombre,
            Nit       = entity.Nit,
            Telefono  = entity.Telefono,
            Ciudad    = entity.Ciudad,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
    }
}
```

### Backend Pattern — Endpoint Registration

```csharp
// Add inside ClienteEndpoints.MapClienteEndpoints() in ClienteEndpoints.cs
app.MapGet("/api/v1/clientes/{id:guid}", async (
    Guid id,
    GetClienteByIdQueryHandler handler,
    CancellationToken ct) =>
{
    var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
    return dto is null
        ? Results.Problem(title: "Cliente no encontrado", statusCode: 404)
        : Results.Ok(dto);
})
.WithTags("Clientes");
```

Response shape — success (HTTP 200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa ABC",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-03-12T10:30:00Z"
}
```

Response shape — not found (HTTP 404, Problem Details RFC 7807):
```json
{
  "type": "https://httpstatuses.com/404",
  "title": "Cliente no encontrado",
  "status": 404
}
```

### Frontend Pattern — `useCliente` Hook

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id,
  })
}
```

### Frontend Pattern — `clienteApiRepository.getById`

```typescript
// Add to frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
async getById(id: string): Promise<Cliente> {
  const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
  return response.data
},
```

### Frontend Pattern — `ClienteDetailPanel`

```tsx
// frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useParams } from '@tanstack/react-router'
import { useCliente } from '../application/useCliente'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

export function ClienteDetailPanel() {
  const { clienteId } = useParams({ from: '/_app/clientes/$clienteId' })
  const { data: cliente, isLoading, isError, error, refetch } = useCliente(clienteId)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton height={12} width="30%" className="mb-1" />
            <Skeleton height={18} width="60%" />
          </div>
        ))}
      </div>
    )
  }

  // 404 — not found
  if (isError && (error as any)?.response?.status === 404) {
    return (
      <div className="p-6 text-slate-500 text-sm">
        Cliente no encontrado
      </div>
    )
  }

  // other errors
  if (isError) {
    return <ErrorPanel onRetry={refetch} />
  }

  if (!cliente) return null

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-6">{cliente.nombre}</h2>
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
          <dd className="mt-1 text-sm text-slate-800">{cliente.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
          <dd className="mt-1 text-sm text-slate-800">{cliente.nit}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd className="mt-1 text-sm text-slate-800">{cliente.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
          <dd className="mt-1 text-sm text-slate-800">{cliente.ciudad}</dd>
        </div>
      </dl>
    </div>
  )
}
```

### Frontend Pattern — Route File `clientes.$clienteId.tsx`

```tsx
// frontend/src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ClienteListPanel } from '@/modules/crm/clientes/presentation/ClienteListPanel'
import { ClienteDetailPanel } from '@/modules/crm/clientes/presentation/ClienteDetailPanel'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClientesDetailRoute,
})

function ClientesDetailRoute() {
  return (
    <div className="flex h-full">
      <ClienteListPanel />
      <div className="flex-1 overflow-y-auto border-l border-slate-200">
        <ClienteDetailPanel />
      </div>
    </div>
  )
}
```

### `ClienteListPanel` — Navigation Update

In `ClienteListPanel.tsx`, the onClick of each `ClientListItem` must navigate to the detail route. Use TanStack Router's `useNavigate`:

```tsx
import { useNavigate, useParams } from '@tanstack/react-router'

// Inside ClienteListPanel:
const navigate = useNavigate()
// Attempt to read current clienteId from URL for active highlighting
// (use a try/catch or conditional — this component also renders at /clientes without a param)
const params = useParams({ strict: false })
const selectedClienteId = params?.clienteId

// In ClientListItem onClick:
onClick={() => navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })}

// Pass isSelected to ClientListItem:
isSelected={cliente.id === selectedClienteId}
```

### State Management Boundaries

| State | Where | Why |
|-------|-------|-----|
| `cliente` server data | TanStack Query `['clientes', id]` | Server state, invalidated on mutations |
| `selectedClienteId` | URL param (`/clientes/$clienteId`) | FR30 deep linking — source of truth is URL |
| Loading/error UI state | `isLoading`, `isError` from `useCliente` | Derived from TanStack Query |

No Zustand store needed for this story.

### Brand Colors & Styling

- Active list item: left border `border-l-2 border-[#0e79fd]`, background `bg-blue-50`
- Inactive list item: `border-l-2 border-transparent`
- Detail panel background: `bg-white`
- Section headings: `text-slate-800 font-bold`
- Field labels: `text-slate-500 text-xs uppercase tracking-wide`
- Field values: `text-slate-800 text-sm`
- Panel divider: `border-l border-slate-200`

### 404 vs Network Error Detection

TanStack Query surfaces Axios errors via `error`. To distinguish 404 from other errors, check `(error as AxiosError)?.response?.status === 404`. Import `AxiosError` from `axios` for strict typing — do not use `any`.

```typescript
import type { AxiosError } from 'axios'

const is404 = isError && (error as AxiosError)?.response?.status === 404
```

### siesa-ui-kit Considerations

This story implements a read-only detail panel (no form, no data grid). The `MasterCrud` component is NOT applicable here — MasterCrud is for CRUD screens with data grids and form management. This story uses a custom `ClienteDetailPanel` with a `<dl>` semantic structure per the architecture's component boundaries.

Future stories (2.3 Edit Client, 2.4 Create Client) may leverage `MasterCrud` or the `renderForm` prop if appropriate. The edit/create form is explicitly out of scope for this story.

### Testing Standards

**Backend (xUnit):**
- `GetClienteByIdQueryHandlerTests.cs`: mock `IClienteRepository` with `Moq`/`NSubstitute`
  - `HandleAsync_ExistingId_ReturnsMappedClienteDto`
  - `HandleAsync_UnknownId_ReturnsNull`
- Structure: Arrange / Act / Assert; cover `DateTimeOffset` field mapping

**Frontend (Vitest + RTL):**
- MSW handlers in test setup: `GET /api/v1/clientes/:id` — success, 404, network error
- `useCliente.test.ts`: enabled only when id provided; fetches correct endpoint
- `ClienteDetailPanel.test.tsx`:
  - Loading: skeletons visible
  - Success: 4 Spanish-labeled fields rendered correctly
  - 404: "Cliente no encontrado" text; no ErrorPanel
  - Network error: `ErrorPanel` rendered with retry button
  - Accessibility: `axe` check passes (WCAG 2.1 AA)
- Test files co-located alongside source files

### Project Structure — Files to Create/Modify

**Backend — Create:**
```
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs
```

**Backend — Modify:**
```
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs  ← add GET /api/v1/clientes/{id:guid}
backend/src/SiesaAgents.API/Program.cs                     ← register GetClienteByIdQueryHandler
```

**Frontend — Create:**
```
frontend/src/modules/crm/clientes/application/useCliente.ts
frontend/src/modules/crm/clientes/application/useCliente.test.ts
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx
frontend/src/routes/_app/clientes.$clienteId.tsx
```

**Frontend — Modify:**
```
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts  ← add getById()
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx        ← add navigation + active highlight
```

### Scope Constraints

**DO NOT implement in this story:**
- Edit/update client form (`ClienteForm.tsx`) — belongs to Story 2.3
- Create client form — belongs to Story 2.3
- Delete client action — belongs to Story 2.5
- `ContactManager` wiring — belongs to Story 4.1
- `useContactosByCliente` or any contact-related queries — belong to Epic 3 / Epic 4

### References

- Detail view route definition: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture → Routing]
- `GET /api/v1/clientes/{id}` endpoint contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns → REST Endpoints]
- TanStack Query key `['clientes', id]`: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- FR3 (view client detail): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- FR30 (deep linking): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview → Navigation]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- Problem Details RFC 7807 format: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- `ClienteEntity` domain pattern (private constructor, DateTimeOffset): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes → Backend Domain Entity Pattern]
- `clienteApiRepository` Axios pattern: [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes → Infrastructure API Repository]
- Skeleton loading pattern: [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes → Skeleton Loading Pattern]
- Brand colors and styling: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Company standards — Clean Architecture, TanStack Query, TypeScript strict: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- AC-E2.3 (view and edit client detail): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Backend files (GetClienteByIdQuery, GetClienteByIdQueryHandler, endpoint, DI registration) were already fully implemented from prior work.
- Frontend files (useCliente.ts, clienteApiRepository.ts getById, ClienteDetailPanel.tsx, clientes.$clienteId.tsx) were already implemented.
- ClienteListPanel.tsx was missing navigation (useNavigate + useParams) and active item highlighting — added in this session.
- Fixed missing `@/` path alias in vite.config.ts, vitest.config.ts, and tsconfig.app.json (ClienteDetailPanel.tsx used `@/shared/components/ErrorPanel` but the alias was not configured).
- All 114 backend tests and 141 frontend tests pass.

### File List

**Backend — existing (verified complete):**
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `/home/user/lab-sa-quick-dev/backend/src/SiesaAgents.API/Program.cs`
- `/home/user/lab-sa-quick-dev/backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

**Frontend — modified:**
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- `/home/user/lab-sa-quick-dev/frontend/vite.config.ts`
- `/home/user/lab-sa-quick-dev/frontend/vitest.config.ts`
- `/home/user/lab-sa-quick-dev/frontend/tsconfig.app.json`

**Frontend — existing (verified complete):**
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/clientes/application/useCliente.ts`
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/routes/_app/clientes.$clienteId.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/clientes/application/__tests__/useCliente.unit.test.ts`
- `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailPanel.unit.test.ts`
