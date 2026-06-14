# Story 2.2: Client Detail View

Status: draft

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
So that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, and the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on `/clientes` with no client selected, **When** the right panel is displayed, **Then** a placeholder message "Selecciona un cliente para ver sus detalles." is shown in the right panel.

3. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (deep link), **Then** the correct client details are loaded and displayed without requiring prior navigation through the list (FR30).

4. **Given** a `clienteId` in the URL does not exist in the system, **When** the page loads, **Then** a not-found message "Cliente no encontrado." is displayed gracefully in the right panel — no crash, no blank screen, no console error.

5. **Given** the client detail is loading after selection, **When** data has not yet arrived, **Then** a skeleton placeholder is displayed in the right panel instead of the detail content.

6. **Given** a client is selected and the detail is visible, **When** the user clicks a different client in the list, **Then** the right panel updates to show the new client's details and the URL updates to `/clientes/:newClienteId`.

## Tasks / Subtasks

- [ ] Task 1 — Add `getById` method to `IClienteRepository` interface (AC: #3)
  - [ ] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `getById(id: string): Promise<Cliente | null>`
  - [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `getById` calling `GET /api/v1/clientes/:id` via `apiClient`; return `null` on 404

- [ ] Task 2 — Implement `useCliente` application hook (AC: #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts` — TanStack Query hook with `queryKey: ['clientes', id]`, calling `clienteApiRepository.getById(id)`, `staleTime: 1000 * 60`, `enabled: !!id`
  - [ ] Hook exposes: `{ data: Cliente | null | undefined, isLoading, isError, refetch }`

- [ ] Task 3 — Create `ClienteDetailView` presentation component (AC: #1, #2, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [ ] Props: `clienteId: string | null`
  - [ ] Layout: `flex-1 flex flex-col h-full bg-white overflow-y-auto p-6`
  - [ ] No client selected state (`clienteId === null`): render placeholder `<div>` with message "Selecciona un cliente para ver sus detalles." centered, `text-slate-400`, `role="status"`
  - [ ] Loading state (`isLoading`): render skeleton placeholder (`react-loading-skeleton`) for the detail fields
  - [ ] Not-found state (`data === null && !isLoading`): render `<div role="status">` with message "Cliente no encontrado." — centered, `text-slate-500`
  - [ ] Detail state (`data` is a `Cliente`): render all 4 fields (Nombre, NIT/RUC, Teléfono, Ciudad) with labels in Spanish
  - [ ] Detail field layout: label (`text-xs font-medium text-slate-500 uppercase tracking-wide`) above value (`text-base text-slate-800`)
  - [ ] Apply WCAG 2.1 AA: `<article aria-label={`Detalle del cliente ${data.nombre}`}` wrapping the detail content; each field group uses `<dl>/<dt>/<dd>` semantics
  - [ ] All user-facing text in Spanish

- [ ] Task 4 — Create TanStack Router route for `/clientes/:clienteId` (AC: #1, #3)
  - [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — TanStack Router file-based route (dynamic segment `$clienteId`)
  - [ ] Route component reads `clienteId` from `useParams()` (TanStack Router: `const { clienteId } = Route.useParams()`)
  - [ ] Render the master-detail layout: left panel `<ClienteListView>` (280px) + right panel `<ClienteDetailView clienteId={clienteId} />`
  - [ ] `onClienteSelect` on `<ClienteListView>` calls `navigate({ to: '/clientes/$clienteId', params: { clienteId: selectedId } })`
  - [ ] `selectedClienteId` prop passed to `<ClienteListView>` is `clienteId` from route params

- [ ] Task 5 — Update `/clientes` route to wire client selection navigation (AC: #1, #2)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — `onClienteSelect` stub replaced with `navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })`
  - [ ] Right panel now renders `<ClienteDetailView clienteId={null} />` (placeholder state — no client selected)
  - [ ] `selectedClienteId` passed to `<ClienteListView>` as `null` when on `/clientes` base route

- [ ] Task 6 — Backend: `GET /api/v1/clientes/{id}` endpoint (AC: #3, #4)
  - [ ] Add `GetClienteByIdQuery.cs` to `backend/src/SiesaAgents.Application/Clientes/Queries/` — record `GetClienteByIdQuery(Guid Id)`
  - [ ] Add `GetClienteByIdQueryHandler.cs` — calls `IClienteRepository.GetByIdAsync(id, ct)`; returns `ClienteDto?`
  - [ ] Add endpoint to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    ```csharp
    app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, IClienteRepository repo, CancellationToken ct) => {
        var entity = await repo.GetByIdAsync(id, ct);
        return entity is null
            ? Results.NotFound(new { title = "Cliente no encontrado.", status = 404 })
            : Results.Ok(new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad, entity.CreatedAt, entity.UpdatedAt));
    });
    ```
  - [ ] `IClienteRepository.GetByIdAsync(Guid id, CancellationToken ct)` is already declared in Story 2.1 — verify implementation in `ClienteRepository.cs`: `return await _context.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct)`

- [ ] Task 7 — Unit tests: frontend (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useCliente.test.ts` — Vitest + MSW:
    - Mock `GET /api/v1/clientes/:id` returning a client object → assert hook returns the correct `Cliente` with `isLoading: false`
    - Mock `GET /api/v1/clientes/:id` returning 404 → assert `data` is `null`
    - Mock 500 response → assert `isError` is `true`
    - Assert `queryKey` is `['clientes', id]`
    - Assert `enabled: false` when `id` is falsy (no fetch)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx` — Vitest + RTL + MSW:
    - No selection (`clienteId={null}`): assert placeholder "Selecciona un cliente para ver sus detalles." is rendered with `role="status"`
    - Loading state: assert skeleton is rendered while loading
    - Not-found state: MSW returns 404 → assert "Cliente no encontrado." message rendered without crash
    - Detail rendered: MSW returns a client → assert Nombre, NIT/RUC, Teléfono, Ciudad all visible
    - Switching clients: render with clienteId A → re-render with clienteId B → assert new client fields displayed
    - WCAG: assert `role="article"` or `aria-label` containing client name on detail container

- [ ] Task 8 — Unit tests: backend (AC: #3, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — xUnit:
    - `GetById_ExistingId_ReturnsClienteDto` — mock `IClienteRepository.GetByIdAsync` returning entity → assert DTO fields match
    - `GetById_NonExistentId_ReturnsNull` — mock returns `null` → assert handler returns `null`
  - [ ] Extend `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (or create if not exists):
    - `GET_ClienteById_ExistingId_Returns200WithClienteDto` — seed client → GET `/api/v1/clientes/{id}` → assert 200 + correct body
    - `GET_ClienteById_NonExistentId_Returns404ProblemDetails` — GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000` → assert 404 + `Content-Type: application/problem+json`

## Dev Notes

### Architecture Context

Story 2.2 builds on Story 2.1. All infrastructure (domain entity, repository interface + implementation, `useClientes` hook, `ClienteListView`, shared components, `GET /api/v1/clientes` endpoint) must already be in place.

**Frontend module path:** `frontend/src/modules/crm/clientes/`

**Frontend routes path:** `frontend/src/routes/_app/`

**Backend solution layer paths:**
- Application: `backend/src/SiesaAgents.Application/Clientes/Queries/`
- API Endpoints: `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`

### `useCliente` Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { Cliente } from '../domain/Cliente'

export function useCliente(id: string | null) {
  return useQuery<Cliente | null>({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    staleTime: 1000 * 60,
    enabled: !!id,
  })
}
```

### `clienteApiRepository.getById` Implementation

```typescript
// Extend frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
async getById(id: string): Promise<Cliente | null> {
  try {
    const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
    return response.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}
```

### `ClienteDetailView` Component Pattern

```tsx
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
import { useCliente } from '../application/useCliente'
import Skeleton from 'react-loading-skeleton'

interface ClienteDetailViewProps {
  clienteId: string | null
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading } = useCliente(clienteId)

  if (!clienteId) {
    return (
      <div
        role="status"
        className="flex-1 flex items-center justify-center text-slate-400 text-sm"
      >
        Selecciona un cliente para ver sus detalles.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6" data-testid="cliente-detail-skeleton">
        <Skeleton height={24} width="60%" className="mb-4" />
        <Skeleton count={4} height={48} className="mb-3" />
      </div>
    )
  }

  if (data === null) {
    return (
      <div
        role="status"
        className="flex-1 flex items-center justify-center text-slate-500 text-sm"
      >
        Cliente no encontrado.
      </div>
    )
  }

  return (
    <article
      aria-label={`Detalle del cliente ${data.nombre}`}
      className="flex-1 p-6 overflow-y-auto"
      data-testid="cliente-detail-view"
    >
      <dl className="space-y-5">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
          <dd className="text-base text-slate-800 mt-1">{data.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
          <dd className="text-base text-slate-800 mt-1">{data.nit}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd className="text-base text-slate-800 mt-1">{data.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
          <dd className="text-base text-slate-800 mt-1">{data.ciudad}</dd>
        </div>
      </dl>
    </article>
  )
}
```

### TanStack Router Route: `clientes.$clienteId.tsx`

```tsx
// frontend/src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
})

function ClienteDetailPage() {
  const { clienteId } = Route.useParams()
  const navigate = useNavigate()

  const handleClienteSelect = (id: string) => {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
  }

  return (
    <div className="flex h-full">
      <ClienteListView
        selectedClienteId={clienteId}
        onClienteSelect={handleClienteSelect}
      />
      <ClienteDetailView clienteId={clienteId} />
    </div>
  )
}
```

### Updated `/clientes` base route

```tsx
// frontend/src/routes/_app/clientes.tsx (update from Story 2.1 stub)
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  const navigate = useNavigate()

  const handleClienteSelect = (id: string) => {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
  }

  return (
    <div className="flex h-full">
      <ClienteListView
        selectedClienteId={null}
        onClienteSelect={handleClienteSelect}
      />
      <ClienteDetailView clienteId={null} />
    </div>
  )
}
```

### Backend `GET /api/v1/clientes/{id}` Endpoint

```csharp
// Extend backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, IClienteRepository repo, CancellationToken ct) =>
{
    var entity = await repo.GetByIdAsync(id, ct);
    if (entity is null)
        return Results.Problem(
            detail: "El cliente solicitado no existe.",
            statusCode: 404,
            title: "Cliente no encontrado."
        );
    var dto = new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad, entity.CreatedAt, entity.UpdatedAt);
    return Results.Ok(dto);
});
```

Note: `GetClienteByIdQueryHandler` mediates between the endpoint and the repository (CQRS pattern). The endpoint calls the handler, which calls the repository.

### API Response Contract

```json
// GET /api/v1/clientes/{id} → 200 OK
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Empresa ABC",
  "nit": "900123456-7",
  "telefono": "601 234 5678",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-03-12T10:30:00Z"
}

// GET /api/v1/clientes/{non-existent-id} → 404 Not Found
// Content-Type: application/problem+json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Cliente no encontrado.",
  "status": 404,
  "detail": "El cliente solicitado no existe."
}
```

### URL and Routing Pattern

- Base route `/clientes` → both panels rendered; right panel shows placeholder (no `clienteId` in URL)
- Detail route `/clientes/:clienteId` → both panels rendered; right panel shows detail or not-found
- TanStack Router file-based route segment: `$clienteId` (dollar prefix = dynamic)
- Deep linking: navigating directly to `/clientes/some-uuid` fetches the client by ID via `useCliente(clienteId)` — no prior list load required

### State Boundaries for This Story

```
URL (TanStack Router param) ← Single source of truth for selectedClienteId
  ↓
clientes.tsx → selectedClienteId = null (no client selected)
clientes.$clienteId.tsx → selectedClienteId = clienteId from URL param

Server State (TanStack Query):
  ['clientes']        → list (from Story 2.1, unchanged)
  ['clientes', id]    → single client detail (NEW — this story)

Client State (local React state):
  None additional — URL is the source of truth (per architecture.md)
```

### Error Handling

**Frontend:**
- `clienteId` present but API returns 404 → `useCliente` returns `data: null` → `ClienteDetailView` renders "Cliente no encontrado." message
- API returns 5xx → `isError: true` → (for this story: show "Cliente no encontrado." as fallback; ErrorPanel with retry deferred to post-MVP refinement)
- Never expose `error.message` directly to the user

**Backend:**
- `GET /api/v1/clientes/{id}` with non-existent UUID → `Results.Problem(statusCode: 404)` → `Content-Type: application/problem+json`
- `ExceptionHandlingMiddleware` from Story 1.1 handles all unhandled exceptions globally — no additional middleware needed

### Brand Colors & Styling

- Detail label: `text-xs font-medium text-slate-500 uppercase tracking-wide`
- Detail value: `text-base text-slate-800`
- Placeholder / not-found message: `text-slate-400` (placeholder) / `text-slate-500` (not-found)
- Right panel background: `bg-white`
- Active selected item border in list: `border-l-4 border-[#0e79fd]` (inherited from `ClienteListItem` Story 2.1)

### UI Text in Spanish (mandatory)

| Context | Text |
|---------|------|
| Right panel placeholder (no selection) | Selecciona un cliente para ver sus detalles. |
| Not-found message | Cliente no encontrado. |
| Detail label — Nombre | Nombre |
| Detail label — NIT/RUC | NIT/RUC |
| Detail label — Teléfono | Teléfono |
| Detail label — Ciudad | Ciudad |

### `data-testid` Attributes Required

| Element | `data-testid` | Notes |
|---------|---------------|-------|
| Right panel detail container | `cliente-detail-view` | Only rendered when client data is present |
| Right panel skeleton | `cliente-detail-skeleton` | Rendered during loading |

### Scope Boundaries

Explicitly IN SCOPE for Story 2.2:
- `ClienteDetailView` component showing Nombre, NIT/RUC, Teléfono, Ciudad
- TanStack Router route `/clientes/:clienteId` (file: `clientes.$clienteId.tsx`)
- Deep link support: direct URL access loads client detail via `useCliente`
- Not-found graceful handling (404 from backend)
- URL update on client selection (navigate to detail route)
- Right panel placeholder when no client is selected
- Skeleton loading state in right panel
- `GET /api/v1/clientes/{id}` backend endpoint
- `useCliente` hook with `queryKey: ['clientes', id]`

Explicitly OUT OF SCOPE for Story 2.2:
- Edit / Create / Delete client actions — Stories 2.3, 2.4, 2.5
- Sort control — Story 2.6
- Contact management in detail — Epic 3 / Epic 4
- Authentication — deferred post-MVP

### Dependency on Previous Stories

- Story 1.1: `frontend/src/shared/lib/apiClient.ts` (Axios singleton), `frontend/src/shared/lib/queryClient.ts`, `frontend/src/app/providers/QueryProvider.tsx` — must exist
- Story 1.2: `frontend/src/routes/_app/clientes.tsx` exists — update `onClienteSelect` and add right panel; `frontend/src/routes/_app/clientes.$clienteId.tsx` must be CREATED (does not exist yet)
- Story 2.1: `Cliente.ts`, `IClienteRepository.ts`, `clienteApiRepository.ts`, `useClientes.ts`, `ClienteListView.tsx`, `ClienteListItem.tsx`, `EmptyState.tsx`, `ErrorPanel.tsx` — all must exist; `clienteApiRepository.ts` must be extended with `getById`; `IClienteRepository.ts` must be extended with `getById`; `GET /api/v1/clientes` endpoint — already exists

### Test Patterns

**Frontend component test with MSW (useCliente):**
```typescript
// frontend/src/modules/crm/clientes/application/__tests__/useCliente.test.ts
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderHook, waitFor } from '@testing-library/react'

const CLIENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

const server = setupServer(
  http.get(`http://localhost:5000/api/v1/clientes/${CLIENT_ID}`, () =>
    HttpResponse.json({
      id: CLIENT_ID,
      nombre: 'Empresa ABC',
      nit: '900123456-7',
      telefono: '601 234 5678',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })
  )
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**Backend integration test pattern (xUnit):**
```csharp
[Fact]
public async Task GetById_ExistingId_Returns200WithClienteDto()
{
    // Arrange
    var seeded = SeedCliente(_db);
    // Act
    var response = await _client.GetAsync($"/api/v1/clientes/{seeded.Id}");
    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    var dto = await response.Content.ReadFromJsonAsync<ClienteDto>();
    Assert.NotNull(dto);
    Assert.Equal(seeded.Nombre, dto!.Nombre);
}

[Fact]
public async Task GetById_NonExistentId_Returns404ProblemDetails()
{
    // Arrange
    var nonExistentId = Guid.Empty;
    // Act
    var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");
    // Assert
    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
}
```

### References

- Detail view routing pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — `/clientes/:id → ClienteDetailView`]
- TanStack Query key `['clientes', id]`: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- `selectedClienteId` as URL source of truth: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Deep linking (FR30): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- `GET /api/v1/clientes/{id}` endpoint: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Problem Details RFC 7807 (404 not found): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Brand colors + typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- All UI text in Spanish: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- DateTimeOffset mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Test risks TC-E2-P1-08, TC-E2-P1-05, TC-E2-P2-03, TC-E2-P2-04: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
