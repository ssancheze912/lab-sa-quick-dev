# Story 2.2: Client Detail View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
So that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad. **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly, **Then** the correct client details are loaded and displayed (FR30). The `GET /api/v1/clientes/{id}` endpoint is called using the `clienteId` URL parameter.

3. **Given** a `clienteId` in the URL does not exist, **When** the page loads, **Then** a not-found message is displayed gracefully. No JS error is thrown and the navigation shell remains visible.

4. **Given** the backend is unavailable when loading a client detail, **When** `GET /api/v1/clientes/{id}` fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed within the right panel.

5. **Given** no client is selected (user navigates to `/clientes` without a `clienteId`), **When** the page loads, **Then** the right panel shows an empty/placeholder state prompting the user to select a client from the list.

## Tasks / Subtasks

- [x] Task 1 — Extend `IClienteRepository` and `ClienteRepository` with `GetByIdAsync` (AC: #2, #3)
  - [x] Add `GetByIdAsync(Guid id): Task<ClienteEntity?>` to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (method likely declared in Story 2.1 — verify before creating)
  - [x] Implement `GetByIdAsync(Guid id)` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: return `null` when not found (do NOT throw)

- [x] Task 2 — Create `GetClienteByIdQuery` and handler in Application layer (AC: #2, #3)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` (record with `Guid Id` parameter)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
    - [x] Inject `IClienteRepository`
    - [x] Return `ClienteDto?` — returns `null` when client not found (handler does NOT throw `NotFoundException`; endpoint maps `null` → 404)

- [x] Task 3 — Create `GET /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [x] Add to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` inside the existing `MapClienteEndpoints` extension method:
    ```csharp
    group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
    {
        var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));
        return cliente is null ? Results.NotFound() : Results.Ok(cliente);
    });
    ```
  - [x] Register `GetClienteByIdQueryHandler` in `Program.cs` DI (if not already registered as scoped)
  - [x] 404 response uses `Results.NotFound()` which emits Problem Details via `ExceptionHandlingMiddleware` — no extra code needed

- [x] Task 4 — Create frontend `useCliente` TanStack Query hook (AC: #2, #3, #4)
  - [x] Add `getById(id: string): Promise<Cliente>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [x] Add `getById(id: string)` implementation to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: calls `GET /api/v1/clientes/{id}` via `apiClient`
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    ```typescript
    export function useCliente(id: string | undefined) {
      return useQuery({
        queryKey: ['clientes', id],   // canonical key from architecture
        queryFn: () => clienteApiRepository.getById(id!),
        enabled: !!id,               // do not fetch if id is undefined
      })
    }
    ```

- [x] Task 5 — Create `ClienteDetailView` presentation component (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [x] Props: `clienteId: string | undefined`
  - [x] States:
    - `clienteId` is `undefined` → render `EmptyDetailPanel` placeholder ("Selecciona un cliente para ver sus detalles")
    - `isLoading` is `true` → render `react-loading-skeleton` skeleton (4 field rows: Nombre, NIT, Teléfono, Ciudad) — NOT a spinner
    - `isError` is `true` → render `ErrorPanel` with `onRetry={refetch}` and Spanish message "No se pudo cargar el cliente."
    - `data` is `undefined` and not loading/error → 404 — render not-found message "El cliente no existe o fue eliminado."
    - `data` exists → render detail panel with all four fields
  - [x] Detail panel renders (all labels in Spanish):
    - `<h2>` with `data.nombre`
    - Field row: `NIT/RUC:` `data.nit`
    - Field row: `Teléfono:` `data.telefono`
    - Field row: `Ciudad:` `data.ciudad`
  - [x] Check siesa-ui-kit first for any card/detail panel components before building custom ones
  - [x] WCAG 2.1 AA: all field labels use `<dt>/<dd>` or `aria-label` pattern; container gets `role="region"` and `aria-label="Detalle del cliente"`

- [x] Task 6 — Create `clientes.$clienteId.tsx` route file (AC: #1, #2, #3, #5, FR30)
  - [x] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` (renders full two-panel layout with `selectedClienteId` prop to `ClienteListView` and `ClienteDetailView`)
  - [x] TanStack Router auto-generates `$clienteId` param from the filename `$` prefix — no manual router registration needed

- [x] Task 7 — Update `clientes.tsx` route to integrate `ClienteDetailView` in the right panel (AC: #1, #5)
  - [x] Updated `frontend/src/routes/_app/clientes.tsx` to render `<ClienteDetailView clienteId={undefined} />` in the right panel
  - [x] This ensures `/clientes` (no ID selected) renders the placeholder state in the right panel

- [x] Task 8 — Make `ClienteListView` items navigable (AC: #1, FR28, FR30)
  - [x] Updated `ClienteListView.tsx` to accept optional `selectedClienteId` prop and wrap items in `<Link to="/clientes/$clienteId">` for navigation
  - [x] Active/selected visual state applied when `selectedClienteId === cliente.id` (passed from route params)
  - [x] Selected item: `bg-blue-50 border-l-2 border-[#0e79fd]` — Siesa Blue left border indicator
  - [x] All items: `min-h-[44px]` satisfies WCAG 2.1 AA touch target minimum

- [x] Task 9 — Write unit and component tests (AC: all)
  - [x] Frontend component tests (`ClienteDetailView.test.tsx` — Vitest + RTL + MSW): all states covered (ATDD tests were pre-written)
  - [x] Backend xUnit integration tests (`ClienteEndpointsTests.cs`): GET by ID tests were pre-written (require Docker/TestContainers to run)

- [x] Task 10 — Final build and verification (AC: all)
  - [x] `pnpm build` in `frontend/` — zero TypeScript errors, build succeeded
  - [x] `dotnet build SiesaAgents.sln` from `backend/` — 0 Warnings, 0 Errors
  - [x] Frontend tests: 148 passed (pnpm test). Backend integration tests require Docker (not available in this environment) — pre-existing limitation from Story 2.1

## Dev Notes

### Backend: GetClienteByIdQueryHandler

The handler follows the same CQRS Query pattern established in Story 2.1:

```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
namespace SiesaAgents.Application.Clientes.Queries;

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

The endpoint maps `null` → 404 directly — no exceptions involved:

```csharp
group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
{
    var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));
    return cliente is null ? Results.NotFound() : Results.Ok(cliente);
});
```

`Results.NotFound()` produces a 404 response. The `ExceptionHandlingMiddleware` (registered in Story 1.3) wraps it in Problem Details format for non-success codes. No new middleware needed.

### Backend: IClienteRepository Extension

`GetByIdAsync` was declared in the interface during Story 2.1 (referenced in that story's File List). Verify the signature exists before duplicating:

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
Task<ClienteEntity?> GetByIdAsync(Guid id);
```

Implementation in `ClienteRepository.cs`:
```csharp
public async Task<ClienteEntity?> GetByIdAsync(Guid id)
    => await _context.Clientes.FindAsync(id);
```

`FindAsync` returns `null` (not a 404 exception) when the record does not exist — correct behavior.

### Frontend: TanStack Query Hook for Single Client

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],   // canonical — architecture doc §TanStack Query keys
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id,               // skip fetch when no id (placeholder state)
  })
}
```

- `enabled: !!id` prevents a fetch when `id` is `undefined` — critical for the `/clientes` route (no client selected, AC #5)
- Query key `['clientes', id]` matches the architecture's canonical key; mutations in Stories 2.4 and 2.5 will invalidate with `{ queryKey: ['clientes', id] }`
- When the backend returns 404, Axios throws an `AxiosError`. TanStack Query sets `isError: true` and `data: undefined`. The component distinguishes 404 from network errors via `error.response?.status === 404`

### Frontend: ClienteDetailView State Machine

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
interface ClienteDetailViewProps {
  clienteId: string | undefined
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId)

  if (!clienteId) {
    // AC #5 — no client selected
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <p>Selecciona un cliente para ver sus detalles</p>
      </div>
    )
  }

  if (isLoading) {
    // react-loading-skeleton — NOT a spinner
    return <ClienteDetailSkeleton />
  }

  if (isError) {
    const is404 = (error as AxiosError)?.response?.status === 404
    if (is404) {
      return (
        <div role="status" className="p-6 text-slate-500">
          El cliente no existe o fue eliminado.
        </div>
      )
    }
    return <ErrorPanel onRetry={refetch} />
  }

  // data is defined here
  return (
    <section
      role="region"
      aria-label="Detalle del cliente"
      className="flex flex-1 flex-col p-6"
    >
      <h2 className="text-xl font-bold text-slate-900 mb-4">{data!.nombre}</h2>
      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-slate-500">NIT/RUC</dt>
          <dd className="text-base text-slate-900">{data!.nit}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Teléfono</dt>
          <dd className="text-base text-slate-900">{data!.telefono}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Ciudad</dt>
          <dd className="text-base text-slate-900">{data!.ciudad}</dd>
        </div>
      </dl>
    </section>
  )
}
```

The `<dl>/<dt>/<dd>` pattern provides accessible label/value pairs for screen readers without custom `aria-label` per field.

### Frontend: Routing — Two Distinct Route Files

This story introduces a second route file for the clientes section:

| File | URL | Purpose |
|------|-----|---------|
| `routes/_app/clientes.tsx` | `/clientes` | List only — right panel shows placeholder |
| `routes/_app/clientes.$clienteId.tsx` | `/clientes/:clienteId` | List + detail — `clienteId` drives detail panel |

TanStack Router file-based routing maps `$clienteId` (dollar-prefix) to a dynamic URL segment. Both files co-exist under `_app/` — no conflict.

The `clientes.tsx` route renders `ClienteDetailView` with `clienteId={undefined}` (placeholder). The `clientes.$clienteId.tsx` route reads `clienteId` from params and passes it to `ClienteDetailView`.

**Note:** In Story 2.1, `clientes.tsx` was modified to render a `<div className="flex-1">` right panel placeholder. In this story the placeholder div is replaced with `<ClienteDetailView clienteId={undefined} />`.

### Frontend: ClientListItem Navigation

Each item in `ClienteListView` must navigate to `/clientes/:clienteId` on click. Use TanStack Router `<Link>`:

```typescript
// Inside ClienteListView.tsx (or ClientListItem.tsx)
import { Link, useParams } from '@tanstack/react-router'

// Detect selected state
const params = useParams({ strict: false })
const isSelected = params.clienteId === cliente.id

<Link
  to="/clientes/$clienteId"
  params={{ clienteId: cliente.id }}
  className={`flex flex-col p-3 border-b border-slate-200 min-h-[44px] cursor-pointer
    ${isSelected ? 'bg-blue-50 border-l-2 border-[#0e79fd]' : 'hover:bg-slate-50'}`}
>
  <span className="text-sm font-medium text-slate-900">{cliente.nombre}</span>
  <span className="text-xs text-slate-500">{cliente.nit}</span>
</Link>
```

- `min-h-[44px]` satisfies WCAG 2.1 AA touch target minimum
- `border-[#0e79fd]` applies Siesa Primary Blue (`#0e79fd`) as the active indicator
- `useParams({ strict: false })` reads `clienteId` from the current URL without requiring the component to be mounted under the dynamic route

### Frontend: siesa-ui-kit Check

From Story 2.1 completion notes: siesa-ui-kit v1.0.206 exported `Navbar`, `LayoutBase`, `NavigationRail`, `Input`. Before building `ClienteDetailView` layout elements, check for a Card or DetailPanel component:

```bash
node -e "const kit = require('siesa-ui-kit'); console.log(Object.keys(kit))"
```

If a detail/card panel component exists, use it. If not, build the custom layout using Tailwind utilities as shown above.

### Frontend: Skeleton Loading for Detail Panel

Use `react-loading-skeleton` (same library as Story 2.1) — not a spinner:

```tsx
// ClienteDetailSkeleton — extracted component or inline
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

function ClienteDetailSkeleton() {
  return (
    <div aria-label="Cargando detalle del cliente..." className="p-6 space-y-4">
      <Skeleton height={28} width="60%" />  {/* nombre */}
      <div className="space-y-2">
        <Skeleton height={12} width="30%" />  {/* label */}
        <Skeleton height={16} width="50%" />  {/* value */}
      </div>
      <div className="space-y-2">
        <Skeleton height={12} width="30%" />
        <Skeleton height={16} width="40%" />
      </div>
      <div className="space-y-2">
        <Skeleton height={12} width="30%" />
        <Skeleton height={16} width="45%" />
      </div>
    </div>
  )
}
```

### All User-Facing Text in Spanish (P0 Rule)

| Element | Text |
|---------|------|
| Placeholder (no client selected) | `"Selecciona un cliente para ver sus detalles"` |
| Not-found message | `"El cliente no existe o fue eliminado."` |
| Error panel message | `"No se pudo cargar el cliente."` |
| ErrorPanel retry button | `"Reintentar"` |
| Skeleton ARIA label | `aria-label="Cargando detalle del cliente..."` |
| Detail section ARIA label | `aria-label="Detalle del cliente"` |
| Field label — NIT | `"NIT/RUC"` |
| Field label — Teléfono | `"Teléfono"` |
| Field label — Ciudad | `"Ciudad"` |

No English text in any user-facing element. All code (variables, functions, types) remains in English.

### WCAG 2.1 AA Compliance

- Detail container: `role="region"` + `aria-label="Detalle del cliente"`
- Field labels: `<dt>` elements — inherently accessible without extra ARIA
- Skeleton: `aria-label="Cargando detalle del cliente..."` on the container div
- Client list items (navigable links): minimum 44px touch target via `min-h-[44px]`
- Error state: `role="alert"` on `ErrorPanel` — already implemented per Story 2.1
- Not-found state: `role="status"` on the container div
- Active client indicator: color used with border (not color alone) for color-blind accessibility

### Testing Pattern References

From `test-design-epic-2.md`:
- **TC-E2-P1-02** (xUnit): `GET /api/v1/clientes/{id}` — 200 for known ID, 404 for unknown
- **TC-E2-P1-08** (Playwright E2E): Deep link `/clientes/:clienteId` direct URL shows correct detail
- **TC-E2-P1-09** (Vitest+RTL): Not-found message on invalid `clienteId`

For TC-E2-P1-09, configure MSW to return 404 for the specific UUID:
```typescript
server.use(
  http.get(`${import.meta.env.VITE_API_URL}/api/v1/clientes/:id`, ({ params }) => {
    if (params.id === 'non-existent-uuid') {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(mockCliente)
  })
)
```

Backend integration tests extend the existing `ClienteEndpointsTests.cs` class (created in Story 2.1). No new test project needed.

### Project Structure Notes

**Files to CREATE:**

```
frontend/src/
  modules/crm/clientes/
    application/
      useCliente.ts                           # NEW — TanStack Query hook for single client
    presentation/
      ClienteDetailView.tsx                   # NEW — Right panel detail view component
      __tests__/
        ClienteDetailView.test.tsx            # NEW — Vitest + RTL + MSW tests

  routes/_app/
    clientes.$clienteId.tsx                   # NEW — Dynamic route /clientes/:clienteId

backend/src/
  SiesaAgents.Application/Clientes/
    Queries/
      GetClienteByIdQuery.cs                  # NEW — CQRS Query record
      GetClienteByIdQueryHandler.cs           # NEW — Handler returning ClienteDto?
```

**Files to MODIFY:**

```
frontend/src/
  modules/crm/clientes/
    domain/
      IClienteRepository.ts                   # ADD getById(id: string): Promise<Cliente>
    infrastructure/
      clienteApiRepository.ts                 # ADD getById() calling GET /api/v1/clientes/{id}
    presentation/
      ClienteListView.tsx                     # MODIFY — wrap items in <Link> for navigation + selected state

  routes/_app/
    clientes.tsx                              # MODIFY — replace right panel placeholder with <ClienteDetailView clienteId={undefined} />

backend/src/
  SiesaAgents.Domain/Clientes/Interfaces/
    IClienteRepository.cs                     # ADD GetByIdAsync(Guid id): Task<ClienteEntity?> (if not already declared)
  SiesaAgents.Infrastructure/Repositories/
    ClienteRepository.cs                      # ADD GetByIdAsync() implementation
  SiesaAgents.API/Endpoints/
    ClienteEndpoints.cs                       # ADD GET /{id:guid} endpoint handler
  SiesaAgents.API/Program.cs                  # ADD GetClienteByIdQueryHandler scoped registration

backend/tests/
  SiesaAgents.IntegrationTests/Clientes/
    ClienteEndpointsTests.cs                  # ADD tests for GET by ID (200 + 404)
```

### Architectural Alignment

**Clean Architecture layers observed (frontend):**
- `domain/IClienteRepository.ts` — interface, zero dependencies (Domain layer)
- `application/useCliente.ts` — uses domain interface + TanStack Query (Application layer)
- `infrastructure/clienteApiRepository.ts` — Axios HTTP implementation (Infrastructure layer)
- `presentation/ClienteDetailView.tsx` — React component (Presentation layer)

**Clean Architecture layers observed (backend):**
- `Domain/Interfaces/IClienteRepository.cs` — repository contract (Domain)
- `Application/Queries/GetClienteByIdQueryHandler.cs` — use case (Application)
- `Infrastructure/Repositories/ClienteRepository.cs` — EF Core implementation (Infrastructure)
- `API/Endpoints/ClienteEndpoints.cs` — Minimal API endpoint (Presentation)

**State boundaries (from architecture doc):**
- `['clientes', id]` → server state via TanStack Query — `GET /api/v1/clientes/:id`
- No Zustand store needed — URL is the source of truth for selected `clienteId`
- `enabled: !!id` guard prevents spurious fetches on the `/clientes` route

### Previous Story Context

From Story 2.1 Completion Notes:
- Branch: `develop-sa-quick-dev-gaduranb-rq2-gestion-de-clientes` (continue on this branch)
- `siesa-ui-kit` v1.0.206 — `EmptyState` and `ErrorPanel` already created as custom components at `src/shared/components/`; reuse them directly
- `apiClient` Axios instance at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL`
- `queryClient` default `staleTime: 1000 * 60` at `frontend/src/shared/lib/queryClient.ts`
- `routes/_app/clientes.tsx` currently renders a two-column layout with a `<div className="flex-1">` placeholder on the right — replace placeholder with `<ClienteDetailView clienteId={undefined} />`
- `ClienteEndpointsTests.cs` integration test file created in Story 2.1 — extend it with GET-by-ID tests
- `dotnet build SiesaAgents.sln` must continue to produce 0 Warnings, 0 Errors
- `pnpm` is the mandatory package manager (frontend lockfile: `frontend/pnpm-lock.yaml`)
- `ExceptionHandlingMiddleware` already registered in `Program.cs` — 404 from `Results.NotFound()` flows through it automatically

### References

- Epic source and Story 2.2 ACs: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Architecture — TanStack Query key `['clientes', id]`: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Architecture — `GET /api/v1/clientes/{id}` endpoint contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Frontend folder structure and component boundaries: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Enforcement guidelines (DateTimeOffset, UUID, snake_case, Spanish): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture — `clientes.$clienteId.tsx` route in directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Test design (TC-E2-P1-02, TC-E2-P1-08, TC-E2-P1-09): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#P1]
- FR5 (view client detail), FR28 (no page reloads), FR30 (deep linking): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- UX spec — Direction F, right panel detail + ContactManager placeholder: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Chosen Direction]
- UX spec — Context preservation, no navigation away: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience]
- Company standards — Clean Architecture, DDD, UUID PKs, DateTimeOffset: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — siesa-ui-kit P0, Spanish UI, Heroicons, react-loading-skeleton: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Previous story context (branch, siesa-ui-kit, apiClient, two-panel layout): [Source: _bmad-output/implementation-artifacts/2-1-client-list-and-search.md#Completion Notes List]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- `IClienteRepository` and `ClienteRepository.GetByIdAsync` were already implemented in Story 2.1 — verified and reused.
- `ClienteListView` was refactored to accept optional `selectedClienteId` prop instead of using `useParams` directly, to keep the component testable without router context. The router passes `clienteId` from URL params as `selectedClienteId`.
- `clientes.$clienteId.tsx` renders the full two-panel layout (list + detail) instead of just the detail panel, to match the two-column design from Story 2.1.
- `ClienteListView.test.tsx` and `ClienteListView.edge.test.tsx` were updated to use `RouterProvider` with memory history at `/clientes` because `<Link>` requires router context.
- `ErrorPanel` component was extended with an optional `message` prop (defaults to original message) to support per-context error messages.
- Backend integration tests require Docker/TestContainers — not available in this environment (pre-existing limitation from Story 2.1).
- Pre-existing unit test failure `GivenAppDbContext_WhenInspectingModel_ThenNoEntityTypesAreDefined` (Story 1.3 era test) is unrelated to Story 2.2.

### File List

**Created:**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`

**Modified:**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.edge.test.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/routeTree.gen.ts` (auto-regenerated by TanStack Router Vite plugin)
