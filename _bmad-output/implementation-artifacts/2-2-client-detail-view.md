---
stepsCompleted: [1, 2, 3, 4, 5]
status: ready
epic: 2
story: 2
storyKey: 2-2-client-detail-view
createdAt: '2026-05-24'
---

# Story 2.2: Client Detail View

Status: ready

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly, **Then** the correct client details are loaded and displayed (FR30 deep linking).

3. **Given** a `clienteId` in the URL does not exist, **When** the page loads and `GET /api/v1/clientes/:clienteId` returns 404, **Then** a not-found message ("Cliente no encontrado.") is displayed gracefully in the right panel, and no JavaScript error is thrown.

4. **Given** the client list is displayed and a client is selected, **When** the user observes the client list, **Then** the selected client item is visually highlighted (Siesa Blue `#0e79fd` left border or background).

5. **Given** a client detail is loaded, **When** the user observes the right panel, **Then** all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) are visible and meet WCAG 2.1 AA accessibility requirements.

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1 — Implement `GetClienteByIdQueryHandler` and `GET /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with `Guid Id` parameter.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — injects `IClienteRepository`, calls `GetByIdAsync(query.Id)`, returns `ClienteDto` or `null`. Returns `null` when the entity is not found.
  - [ ] Verify `IClienteRepository` already declares `GetByIdAsync(Guid id)` (added in Story 2.1). If not, add it now.
  - [ ] Verify `ClienteRepository.GetByIdAsync(Guid id)` is implemented in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` using `AsNoTracking().FirstOrDefaultAsync(c => c.Id == id)`. Implement if missing.
  - [ ] Add `GET /{id}` route to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    ```csharp
    group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
    {
        var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));
        return cliente is null ? Results.NotFound() : Results.Ok(cliente);
    });
    ```
  - [ ] Register `GetClienteByIdQueryHandler` in DI in `Program.cs` (if not already registered as part of Story 2.1 handler registration).
  - [ ] Verify `ExceptionHandlingMiddleware` already converts uncaught exceptions to Problem Details RFC 7807 — no extra error handling needed in the endpoint.

### Frontend Tasks

- [ ] Task 2 — Create `useCliente` TanStack Query hook (AC: #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    ```typescript
    // queryKey: ['clientes', id]
    // queryFn: calls clienteApiRepository.getById(id)
    // enabled: !!id
    // Returns: { data, isLoading, isError }
    ```
  - [ ] Add `getById(id: string): Promise<Cliente>` method to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`.
  - [ ] Implement `getById(id: string)` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — calls `GET /api/v1/clientes/:id` via `apiClient`. Throws on 404 so TanStack Query sets `isError = true`.

- [ ] Task 3 — Create `ClienteDetailView` presentation component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`. This component:
    - Receives `clienteId: string` as prop (provided by the route).
    - Calls `useCliente(clienteId)` to fetch the client detail.
    - Displays a skeleton loading state using `react-loading-skeleton` (4 field placeholders) while `isLoading` is true.
    - On `isError` (including 404): renders a not-found message in Spanish ("Cliente no encontrado.") inside the right panel — no `ErrorPanel` with retry for this case, just a simple inline message.
    - On success: renders the four fields in a readable layout:
      - **Nombre** (field label "Nombre" + value)
      - **NIT/RUC** (field label "NIT/RUC" + value)
      - **Teléfono** (field label "Teléfono" + value)
      - **Ciudad** (field label "Ciudad" + value)
    - All labels use Spanish. Code uses English variable/function names.
    - Must include `data-testid="cliente-detail-view"` on the root element.
    - Must include `data-testid="not-found-message"` on the not-found message element.
    - Meets WCAG 2.1 AA: use semantic HTML (`<dl>/<dt>/<dd>` or `<section>` with heading), appropriate `aria-label`.

- [ ] Task 4 — Create / update TanStack Router route `clientes.$clienteId.tsx` (AC: #1, #2)
  - [ ] Verify `frontend/src/routes/_app/clientes.$clienteId.tsx` exists (stubbed in Story 1.2). If not, create it.
  - [ ] Update the route file to use `createFileRoute('/_app/clientes/$clienteId')` with TanStack Router.
  - [ ] In the route component, read `clienteId` from route params via `useParams()` or the route's typed params accessor.
  - [ ] Render `<ClienteDetailView clienteId={clienteId} />` in the right panel area.
  - [ ] Route file path: `frontend/src/routes/_app/clientes.$clienteId.tsx`.

- [ ] Task 5 — Wire `ClientListItem` selection to navigation in `ClienteListView` (AC: #1, #4)
  - [ ] In `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`, update each `<ClientListItem>` `onClick` handler to navigate to `/clientes/${cliente.id}` using TanStack Router's `useNavigate()`.
  - [ ] Pass `isSelected={currentClienteId === cliente.id}` to each `<ClientListItem>`, where `currentClienteId` is read from the current URL params (use `useParams()` or `useRouteContext()` from TanStack Router — the value is `undefined` when on `/clientes` with no selection).
  - [ ] The `ClientListItem` component (created in Story 2.1) already handles the visual highlight when `isSelected` is true — no change to that component needed.

### Testing Tasks

- [ ] Task 6 — Backend integration test for `GET /api/v1/clientes/{id}` (AC: #2, #3)
  - [ ] Add to `tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - **TC-E2-P1-02a:** `GET /api/v1/clientes/{known-id}` with a pre-seeded client returns HTTP 200 with full `ClienteDto` object (all 7 fields: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`).
    - **TC-E2-P1-02b:** `GET /api/v1/clientes/{non-existent-uuid}` returns HTTP 404 with `Content-Type: application/problem+json` and no stack trace in body.
  - [ ] Use `WebApplicationFactory<Program>` + TestContainers Postgres (same setup as Story 2.1 integration tests).

- [ ] Task 7 — Backend unit test for `GetClienteByIdQueryHandler` (AC: #2, #3)
  - [ ] Create or extend `tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`:
    - Test handler returns `ClienteDto` with correct field mapping when repository returns an entity.
    - Test handler returns `null` when repository returns `null`.
    - Use mock `IClienteRepository`.

- [ ] Task 8 — Frontend component tests for `ClienteDetailView` (AC: #1, #2, #3, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`:
    - **TC-E2-P1-06a:** MSW returns a client for `GET /api/v1/clientes/{id}` → all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) are rendered. Assert `data-testid="cliente-detail-view"` is present.
    - **TC-E2-P1-06b:** MSW returns 404 for `GET /api/v1/clientes/{non-existent-id}` → `data-testid="not-found-message"` is rendered with "Cliente no encontrado." text. No JavaScript error thrown.
    - **TC-E2-P1-06c:** While loading (`isLoading`), skeleton placeholders are visible (not the fields).
    - Accessibility: run `axe` on the rendered component — zero violations.
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.test.ts`:
    - MSW returns a client for `GET /api/v1/clientes/{id}` → hook resolves with typed `Cliente` object.
    - MSW returns 404 → hook `isError` is `true`.

## Dev Notes

### Architecture Patterns

This story adds the client detail panel and implements the `GET /api/v1/clientes/{id}` backend endpoint. It builds on the `clientes` module infrastructure established in Story 2.1 (entity, repository, migrations, shared components).

**Clean Architecture additions:**
```
Frontend: application (useCliente.ts) → presentation (ClienteDetailView.tsx) → route (clientes.$clienteId.tsx)
Backend:  Application (GetClienteByIdQuery + Handler) → API (GET /{id} endpoint extension)
```

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory — check catalog before ANY custom component)
- **Not-found state**: Simple inline message ("Cliente no encontrado.") — NOT the shared `ErrorPanel` component (which is for fetch/network errors, not 404 business cases).
- **Loading state**: `react-loading-skeleton` with 4 field-height skeletons (not a spinner). Already installed from Story 2.1.
- **Detail layout**: Prefer `<dl>/<dt>/<dd>` semantic HTML for label-value pairs, or a shadcn/ui card layout if available in the installed components. Check siesa-ui-kit first.
- **Icons**: Not required for this story's detail view.

### Frontend Architecture Patterns

**`useCliente` hook (canonical):**
```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export const useCliente = (id: string) =>
  useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id),
    enabled: !!id,
  });
```

**`clienteApiRepository.getById` (canonical):**
```typescript
// Throws on non-2xx so TanStack Query marks isError = true on 404
getById: async (id: string): Promise<Cliente> => {
  const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
  return data;
},
```

**Not-found handling — frontend:**
```typescript
// In ClienteDetailView.tsx
if (isError) {
  return (
    <div data-testid="not-found-message" className="p-4 text-slate-500">
      Cliente no encontrado.
    </div>
  );
}
```

**Route integration — TanStack Router file-based:**
```typescript
// frontend/src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailViewRoute,
});

function ClienteDetailViewRoute() {
  const { clienteId } = Route.useParams();
  return <ClienteDetailView clienteId={clienteId} />;
}
```

**Navigation from list (TanStack Router):**
```typescript
// In ClienteListView.tsx — update onClick on ClientListItem
import { useNavigate, useParams } from '@tanstack/react-router';

const navigate = useNavigate();
const { clienteId: currentClienteId } = useParams({ strict: false });

// Inside the list render:
<ClientListItem
  key={cliente.id}
  id={cliente.id}
  nombre={cliente.nombre}
  nit={cliente.nit}
  isSelected={currentClienteId === cliente.id}
  onClick={() => navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })}
/>
```

**State boundaries (per architecture.md):**
- `selectedClienteId` is NOT Zustand state — it is derived from the URL (`/clientes/:clienteId`).
- `useCliente(id)` caches with key `['clientes', id]` — separate from `['clientes']` list cache.

**Loading state (skeleton):**
```typescript
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// While isLoading in ClienteDetailView:
<div aria-label="Cargando detalle del cliente">
  {Array.from({ length: 4 }).map((_, i) => (
    <Skeleton key={i} height={40} className="mb-3" />
  ))}
</div>
```

### Backend Architecture Patterns

**`GetClienteByIdQueryHandler` — CQRS pattern (mandatory):**
```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query)
    {
        var entity = await _repository.GetByIdAsync(query.Id);
        if (entity is null) return null;

        return new ClienteDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            Nit = entity.Nit,
            Telefono = entity.Telefono,
            Ciudad = entity.Ciudad,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
    }
}
```

**`GET /{id}` endpoint (Minimal API, mandatory):**
```csharp
// Addition to backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
{
    var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));
    return cliente is null ? Results.NotFound() : Results.Ok(cliente);
});
```

**404 response — Problem Details (auto-handled by ExceptionHandlingMiddleware):**
`Results.NotFound()` returns HTTP 404 with `Content-Type: application/problem+json` — the existing `ExceptionHandlingMiddleware` ensures all non-success responses are Problem Details RFC 7807 compliant. No additional error handling needed.

**`GetClienteByIdQuery` record:**
```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs
public record GetClienteByIdQuery(Guid Id);
```

### Current Codebase State (Critical Context)

Story 2.1 established these artifacts this story depends on:

- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — declares `GetByIdAsync(Guid id)` — verify this method exists.
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `GetByIdAsync` — verify this method exists; implement if Story 2.1 only added `GetAllAsync`.
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — currently has `GET /` endpoint only. Add `GET /{id:guid}` here.
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — already created in Story 2.1. Reuse as-is.
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` — entity interface exists. Add `getById` to `IClienteRepository.ts`.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios repository exists. Add `getById` method.
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — list component exists. Update `onClick` and `isSelected` logic.
- `frontend/src/routes/_app/clientes.tsx` — left-panel route. No changes needed in this story.
- `frontend/src/routes/_app/clientes.$clienteId.tsx` — may exist as stub from Story 1.2 or needs to be created. Implement fully in this story.
- `frontend/src/shared/components/ClientListItem.tsx` — already handles `isSelected` visual highlight. No changes needed.
- `frontend/src/shared/lib/apiClient.ts` — Axios singleton configured. Use as-is.
- `frontend/src/shared/lib/queryClient.ts` — TanStack QueryClient configured with `staleTime: 60_000`. Use as-is.

### Project Structure After This Story

```
frontend/src/modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                          # Existing — no change
│   └── IClienteRepository.ts              # MODIFIED — add getById(id: string): Promise<Cliente>
├── application/
│   ├── useClientes.ts                     # Existing — no change
│   └── useCliente.ts                      # NEW — queryKey: ['clientes', id]
├── infrastructure/
│   └── clienteApiRepository.ts            # MODIFIED — add getById method
└── presentation/
    ├── ClienteListView.tsx                 # MODIFIED — navigate + isSelected wiring
    ├── ClienteDetailView.tsx              # NEW — detail panel with 4 fields, loading, not-found
    └── ClientesPlaceholderView.tsx         # Existing — no longer used

frontend/src/routes/_app/
├── clientes.tsx                            # Existing — no change
└── clientes.$clienteId.tsx               # NEW or UPDATED — renders ClienteDetailView

backend/src/SiesaAgents.Application/Clientes/
├── Queries/GetClientesQuery.cs            # Existing — no change
├── Queries/GetClientesQueryHandler.cs     # Existing — no change
├── Queries/GetClienteByIdQuery.cs         # NEW
└── Queries/GetClienteByIdQueryHandler.cs  # NEW

backend/src/SiesaAgents.API/Endpoints/
└── ClienteEndpoints.cs                    # MODIFIED — add GET /{id:guid}
```

### Testing Standards

**Frontend (Vitest + RTL + MSW):**
- `renderWithProviders` wrapper with `QueryClient` + TanStack Router `MemoryRouter` with initial entry set to `/clientes/{id}`.
- MSW handler for `GET /api/v1/clientes/:id` — one handler returning a client, one returning 404.
- `axe` accessibility check on the rendered `ClienteDetailView`.
- Assert `data-testid="cliente-detail-view"` and `data-testid="not-found-message"` for targeted assertions.

**Backend (xUnit + WebApplicationFactory):**
- Use TestContainers Postgres for integration tests (same setup as Story 2.1).
- Seed one client before asserting `GET /api/v1/clientes/{id}` returns 200 + full DTO.
- Use a random UUID (not seeded) for the 404 test — assert Problem Details content type and no stack trace.

### Related Test Cases (from test-design-epic-2.md)

Story 2.2 test cases to implement in this story:

| TC | Level | Priority | Description |
|----|-------|----------|-------------|
| TC-E2-P1-02 | API Integration | P1 | GET /api/v1/clientes/{id} returns client or 404 |
| TC-E2-P1-05 | E2E (Playwright) | P1 | Deep link /clientes/{id} renders correct client detail |
| TC-E2-P1-06 | Component | P1 | Non-existent clienteId renders not-found message gracefully |

TC-E2-P1-05 (E2E) is informational for this story — defer to E2E test suite when Playwright environment is configured.

### References

- Epic source and story AC: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Architecture — routing: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — TanStack Query keys: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Architecture — state boundaries (URL as source of truth): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Architecture — API response shapes (direct object on GET single): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Architecture — component boundaries: [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)]
- Company standards — DateTimeOffset mandatory: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Company standards — loading states (skeleton): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- Company standards — Spanish UI text: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Company standards — siesa-ui-kit P0 rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Test design epic 2 — Story 2.2 test cases: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Story 2.2 — Client Detail View]
- FR3, FR5, FR30: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- R6, R8 risks: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Risk Assessment]
- Story 2.1 completion notes (codebase state): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Completion Notes List]
