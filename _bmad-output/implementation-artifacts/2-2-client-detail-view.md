# Story 2.2: Client Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad. **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (deep link), **Then** the correct client details are loaded and displayed from `GET /api/v1/clientes/:id` (FR30).

3. **Given** a `clienteId` in the URL does not exist in the backend, **When** the page loads, **Then** a not-found message is displayed in Spanish (e.g., "No se encontró este cliente.") without exposing stack traces or raw error messages.

4. **Given** the backend is unavailable when fetching a single client, **When** the `GET /api/v1/clientes/:id` call fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed in the right panel.

5. **Given** the user navigates to `/clientes` (root, no client selected), **When** no client item has been clicked, **Then** the right panel displays a neutral placeholder state with a Spanish instruction (e.g., "Selecciona un cliente para ver sus detalles.").

6. **Given** the client detail is visible, **When** the user presses Tab to navigate, **Then** all interactive elements (client fields displayed, action area) meet WCAG 2.1 AA keyboard accessibility with a visible focus ring (`2px solid #0e79fd`).

## Tasks / Subtasks

- [ ] Task 1 — Backend: `GET /api/v1/clientes/:id` endpoint (AC: #2, #3, #4)
  - [ ] Create `GetClienteByIdQuery.cs` in `backend/src/SiesaAgents.Application/Clientes/Queries/`
  - [ ] Create `GetClienteByIdQueryHandler.cs` — returns `ClienteDto` or throws `NotFoundException` if not found
  - [ ] Register `GET /api/v1/clientes/{id}` endpoint in `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — returns `ClienteDto` or `404 Problem Details`
  - [ ] Verify `ExceptionHandlingMiddleware.cs` maps `NotFoundException` → 404 Problem Details RFC 7807 (no stack traces)
  - [ ] Write xUnit unit test for `GetClienteByIdQueryHandler` — returns `ClienteDto` when record exists; throws `NotFoundException` when not found

- [ ] Task 2 — Frontend domain layer: extend `IClienteRepository` (AC: #2)
  - [ ] Add `getById(id: string): Promise<Cliente>` method signature to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`

- [ ] Task 3 — Frontend infrastructure layer: implement `getById` in Axios repository (AC: #2, #4)
  - [ ] Add `getById` implementation to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — calls `GET /api/v1/clientes/:id`, returns `Cliente`

- [ ] Task 4 — Frontend application layer: `useCliente(id)` TanStack Query hook (AC: #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
    - Uses `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`
    - Returns `{ data, isLoading, isError, error, refetch }`
  - [ ] Write Vitest unit test for `useCliente` — mock repository, assert query key `['clientes', id]`, test disabled when `id` is null/undefined, test error state triggers `isError`

- [ ] Task 5 — Frontend presentation layer: `ClienteDetailView` component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
    - Accepts `clienteId: string | null` as prop (passed from route)
    - If `clienteId` is null/undefined: renders `<ClienteDetailPlaceholder />` (placeholder state with Spanish message)
    - If `clienteId` is set: invokes `useCliente(clienteId)` hook
    - Renders skeleton placeholders (react-loading-skeleton) during `isLoading`
    - Renders `ErrorPanel` with "Reintentar" button (calls `refetch`) when `isError`
    - Renders not-found message in Spanish ("No se encontró este cliente.") when error status is 404
    - Renders client details section showing: Nombre, NIT/RUC, Teléfono, Ciudad using siesa-ui-kit components
  - [ ] Create `frontend/src/shared/components/ClienteDetailPlaceholder.tsx` (if not already created in Story 2.1)
    - Renders a neutral state with Spanish instruction: "Selecciona un cliente para ver sus detalles."
    - Accessible with `role="status"` or equivalent ARIA

- [ ] Task 6 — Frontend route wiring: URL sync with TanStack Router (AC: #1, #2, #5)
  - [ ] Verify `frontend/src/routes/_app/clientes.$clienteId.tsx` exists (from architecture plan); create if missing
    - Route path: `/clientes/$clienteId`
    - Reads `clienteId` from route params via `useParams()`
    - Renders `<ClienteDetailView clienteId={clienteId} />`
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` to:
    - Use TanStack Router `useNavigate()` to push `/clientes/:clienteId` when a client item is clicked
    - Detect active `clienteId` from URL and pass `isSelected` prop to `ClientListItem`
    - Render `<ClienteDetailPlaceholder />` in the right panel when no client is selected (no `clienteId` in URL)
    - Render `<Outlet />` (or equivalent) for the nested `$clienteId` route in the right panel

- [ ] Task 7 — Accessibility verification (AC: #6)
  - [ ] Client detail fields have appropriate `aria-label` or semantic HTML labels
  - [ ] `ClienteDetailPlaceholder` uses `role="status"` or descriptive ARIA
  - [ ] Focus ring is `2px solid #0e79fd` via `:focus-visible` (already set in Story 1.2 — verify)
  - [ ] Run `pnpm run test` from `frontend/` to confirm all tests pass

- [ ] Task 8 — Tests (AC: #1–#6)
  - [ ] RTL test: `ClienteDetailView` renders placeholder when `clienteId` is null
  - [ ] RTL test: `ClienteDetailView` renders skeleton when `isLoading = true`
  - [ ] RTL test: `ClienteDetailView` renders `ErrorPanel` with "Reintentar" when `isError = true`; clicking "Reintentar" calls `refetch`
  - [ ] RTL test: `ClienteDetailView` renders not-found message when error is 404
  - [ ] RTL test: `ClienteDetailView` renders Nombre, NIT, Teléfono, Ciudad when data is loaded
  - [ ] RTL test: clicking a `ClientListItem` navigates to `/clientes/:clienteId` (assert `useNavigate` or router mock)
  - [ ] xUnit unit test: `GetClienteByIdQueryHandler` returns `ClienteDto` for existing client
  - [ ] xUnit unit test: `GetClienteByIdQueryHandler` throws `NotFoundException` for non-existent `clienteId`
  - [ ] xUnit integration test: `GET /api/v1/clientes/{id}` returns 200 with `ClienteDto` for existing client
  - [ ] xUnit integration test: `GET /api/v1/clientes/{id}` returns 404 Problem Details for non-existent id

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Verify installed**: `pnpm list siesa-ui-kit` from `frontend/` — do NOT reinstall (already present from Story 1.1)
- **Usage**: Check siesa-ui-kit catalog first for any detail view component, card, or display field component
- **Component lookup order**: siesa-ui-kit → shadcn/ui → custom build (only if unavailable in both)
- **MasterCrud NOT applicable here**: This story implements the detail panel of a custom split-panel layout per UX Direction F — NOT a MasterCrud table/form. The read-only client detail view is a custom `ClienteDetailView.tsx` component.

### Architecture Patterns

**Frontend Clean Architecture layers for this story:**

```
frontend/src/modules/crm/clientes/
├── domain/
│   └── IClienteRepository.ts       # Add getById(id: string): Promise<Cliente>
├── application/
│   └── useCliente.ts               # TanStack Query hook — queryKey: ['clientes', id]
├── infrastructure/
│   └── clienteApiRepository.ts     # Add getById() using GET /api/v1/clientes/:id
└── presentation/
    └── ClienteDetailView.tsx        # Right panel — reads clienteId from prop, renders detail

frontend/src/shared/components/
└── ClienteDetailPlaceholder.tsx    # Neutral state — "Selecciona un cliente..."

frontend/src/routes/_app/
├── clientes.tsx                    # UPDATE: wire click → navigate to /clientes/:clienteId
└── clientes.$clienteId.tsx         # CREATE/VERIFY: renders ClienteDetailView with clienteId param
```

**Canonical TanStack Query key for single client:**
```typescript
queryKey: ['clientes', id]    // single — matches architecture.md State Boundaries
```

**`useCliente` hook pattern:**
```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCliente(id: string | null | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id,
  })
}
```

**TanStack Router navigation pattern (from `clientes.tsx`):**
```typescript
// When a ClientListItem is clicked
const navigate = useNavigate()
const handleSelectCliente = (clienteId: string) => {
  navigate({ to: '/clientes/$clienteId', params: { clienteId } })
}
```

**TanStack Router param reading (in `clientes.$clienteId.tsx`):**
```typescript
// Route file: src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailViewRoute,
})

function ClienteDetailViewRoute() {
  const { clienteId } = Route.useParams()
  return <ClienteDetailView clienteId={clienteId} />
}
```

**Nested layout pattern (split panel in `clientes.tsx`):**
```typescript
// clientes.tsx — left panel (280px) + right panel (Outlet or detail placeholder)
// When at /clientes with no clienteId: right panel shows ClienteDetailPlaceholder
// When at /clientes/:clienteId: right panel renders via nested Outlet
import { Outlet, useMatchRoute } from '@tanstack/react-router'

// Check if nested clienteId route is active
const matchRoute = useMatchRoute()
const hasDetail = matchRoute({ to: '/clientes/$clienteId', fuzzy: true })
```

**Not-found handling (404 vs generic error):**
```typescript
// ClienteDetailView.tsx
import type { AxiosError } from 'axios'

const { data, isLoading, isError, error, refetch } = useCliente(clienteId)

const is404 = isError && (error as AxiosError)?.response?.status === 404

if (is404) {
  return <p className="text-slate-500 text-sm p-4">No se encontró este cliente.</p>
}
if (isError) {
  return <ErrorPanel onRetry={refetch} />
}
```

**Loading skeleton pattern (same as Story 2.1):**
```typescript
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// During isLoading
{Array.from({ length: 4 }).map((_, i) => (
  <Skeleton key={i} height={40} className="mb-3" />
))}
```

### Backend Architecture Patterns

**CQRS Query — GetClienteById:**
```csharp
// SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs
public record GetClienteByIdQuery(Guid Id);

// SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
public class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> Handle(GetClienteByIdQuery query, CancellationToken ct)
    {
        var cliente = await repository.GetByIdAsync(query.Id, ct)
            ?? throw new NotFoundException($"Cliente {query.Id} no encontrado.");
        return new ClienteDto(cliente.Id, cliente.Nombre, cliente.Nit, cliente.Telefono, cliente.Ciudad, cliente.CreatedAt, cliente.UpdatedAt);
    }
}
```

**Minimal API endpoint registration (add to existing `ClienteEndpoints.cs`):**
```csharp
app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new GetClienteByIdQuery(id), ct);
    return Results.Ok(result);
})
.WithName("GetClienteById")
.Produces<ClienteDto>(StatusCodes.Status200OK)
.Produces<ProblemDetails>(StatusCodes.Status404NotFound);
```

**NotFoundException mapping in ExceptionHandlingMiddleware:**
```csharp
// ExceptionHandlingMiddleware.cs — verify NotFoundException → 404 Problem Details
// Pattern expected (if not already implemented):
NotFoundException ex => new ProblemDetails
{
    Status = StatusCodes.Status404NotFound,
    Title = "Recurso no encontrado",
    Detail = ex.Message
}
```

**`IClienteRepository` — add `GetByIdAsync`:**
```csharp
// SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
```

**API response shape:**
```
GET /api/v1/clientes/{id} → 200 OK — direct ClienteDto object (no wrapper)
GET /api/v1/clientes/{id} (not found) → 404 Problem Details RFC 7807
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Recurso no encontrado",
  "status": 404,
  "detail": "Cliente {id} no encontrado."
}
```

### State Management

Per architecture decision — NO Zustand store needed for this story:
- **Server state**: TanStack Query `useCliente(id)` → `['clientes', id]` cache
- **URL state**: `clienteId` stored in TanStack Router URL path param (`/clientes/$clienteId`)
- **No local state** needed for detail view itself — all driven by URL and TanStack Query

### All User-Facing Text MUST Be in Spanish

| Element | Spanish Text |
|---------|-------------|
| Placeholder (no client selected) | `"Selecciona un cliente para ver sus detalles."` |
| Not-found message | `"No se encontró este cliente."` |
| Error panel message (inherited) | `"No se pudo cargar los datos. Verifica tu conexión."` |
| Retry button (inherited) | `"Reintentar"` |
| Detail field labels | `"Nombre"`, `"NIT/RUC"`, `"Teléfono"`, `"Ciudad"` |

### Previous Story Learnings (from Story 2.1)

- **Package manager**: `pnpm` is mandatory — do NOT use `npm install` or `yarn add`
- **siesa-ui-kit** is already installed — verify with `pnpm list siesa-ui-kit` before any install attempt
- **Axios `apiClient`** singleton is at `frontend/src/shared/lib/apiClient.ts` — import directly, do NOT create a new Axios instance
- **`queryClient`** is wired in `frontend/src/app/providers/QueryProvider.tsx` — no additional setup needed
- **TanStack Router** auto-generates `routeTree.gen.ts` on file save — do NOT edit manually; creating `clientes.$clienteId.tsx` will auto-register the route
- **`_app/clientes.tsx`** must be updated to handle navigation to `/clientes/:clienteId` using TanStack Router `useNavigate` — do NOT use `window.location` or React Router
- **`ErrorPanel`** and **`EmptyState`** are already created at `frontend/src/shared/components/` — reuse them, do NOT duplicate
- **`ClientListItem`** already supports `isSelected` prop — verify and wire `isSelected` based on current URL `clienteId`
- **`react-loading-skeleton`** is already installed — reuse the same skeleton pattern from `ClienteListView.tsx`
- **dotnet** may not be available in local environment — backend compilation may only be verifiable in CI

### Git History Context

Recent commits:
- `fix(review)`: code review corrections for story 2.1 — apply same quality patterns
- `feat(story-2.1)`: client list & search fully implemented — `ClienteListView`, `useClientes`, `clienteApiRepository` already exist
- `feat(atdd)`: ATDD specs for story 2.1 already created — tests for 2.2 must follow same style
- `docs(tea)`: test design for epic 2 was created before implementation — follow it for consistency

### Testing Standards

**Frontend (Vitest + RTL + MSW):**
- Mock `clienteApiRepository.getById` via `vi.mock` — do NOT call real API in tests
- Test all states independently: placeholder (no id), loading, error (generic), error (404), populated
- For router param tests, wrap component in `MemoryRouter` / TanStack Router test utilities
- Accessibility: assert ARIA attributes on placeholder and not-found states
- Run: `pnpm run test` from `frontend/` directory

**Backend (xUnit):**
- Unit test: `GetClienteByIdQueryHandler` returns `ClienteDto` when found
- Unit test: `GetClienteByIdQueryHandler` throws `NotFoundException` when not found
- Integration test (TestContainers / InMemory EF): `GET /api/v1/clientes/{id}` returns 200 with body
- Integration test: `GET /api/v1/clientes/{nonExistentId}` returns 404 Problem Details
- Arrange / Act / Assert structure strictly

### Project Structure Notes

**Files to CREATE in this story:**
```
frontend/src/modules/crm/clientes/application/useCliente.ts
frontend/src/modules/crm/clientes/application/useCliente.test.ts
frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx
frontend/src/shared/components/ClienteDetailPlaceholder.tsx
frontend/src/routes/_app/clientes.$clienteId.tsx          (if not created in Story 1.2)

backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsGetByIdTests.cs
```

**Files to UPDATE in this story:**
```
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts         # Add getById
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts  # Implement getById
frontend/src/routes/_app/clientes.tsx                                    # Wire click → navigate
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs               # Add GET /{id} endpoint
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs # Add GetByIdAsync
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs # Implement GetByIdAsync
```

**Existing files to VERIFY (from Story 2.1):**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts                     # Entity interface — no changes needed
frontend/src/modules/crm/clientes/application/useClientes.ts            # List hook — no changes needed
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts # Verify getAll exists; add getById
frontend/src/shared/components/ClientListItem.tsx                        # Verify isSelected prop exists
frontend/src/shared/components/ErrorPanel.tsx                           # Reuse directly
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs   # Verify NotFoundException → 404
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs        # Reuse without modification
```

### References

- Story scope and AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- FR3 (view client detail): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- FR30 (deep linking via URL): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- TanStack Query key `['clientes', id]`: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Route file `clientes.$clienteId.tsx`: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- `ClienteDetailView` component path: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Split panel UX layout (Direction F): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Error handling (Problem Details RFC 7807): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Never expose error.message directly: [Source: _bmad-output/planning-artifacts/architecture.md#Error handling — frontend]
- DateTimeOffset mandate (backend): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Spanish text mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Previous story learnings (pnpm, siesa-ui-kit, ErrorPanel): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Skeleton loading pattern: [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- WCAG 2.1 AA focus ring standard: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
