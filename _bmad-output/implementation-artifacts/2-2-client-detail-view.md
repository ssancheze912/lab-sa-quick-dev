# Story 2.2: Client Detail View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel renders the complete client details showing: Nombre, NIT/RUC, Teléfono, and Ciudad. (AC-E2.3, FR5, FR3)

2. **Given** the user clicks a client item, **When** the right panel loads, **Then** the URL updates to `/clientes/:clienteId` (deep linking per FR30), reflecting the selected client's UUID.

3. **Given** the user accesses the URL `/clientes/:clienteId` directly (deep link), **When** the page loads, **Then** the correct client details are fetched from `GET /api/v1/clientes/{id}` and displayed in the right panel. (FR30)

4. **Given** a `clienteId` in the URL does not correspond to any existing client, **When** the page loads or the API returns 404, **Then** a not-found message is displayed gracefully in the right panel with no JavaScript crash or blank screen. (R-E2-07)

5. **Given** no client has been selected yet and the user is on `/clientes`, **When** the right panel has no active selection, **Then** the right panel displays an empty/default state (placeholder or EmptyState component with a Spanish prompt to select a client). (UX — default state)

6. **Given** the client list is loaded and the user clicks a client item, **When** the detail renders, **Then** a `GET /api/v1/clientes/{id}` request is triggered using `queryKey: ['clientes', clienteId]`. (architecture — separate per-client query)

## Tasks / Subtasks

- [ ] Task 1 — Create `useCliente` application hook (AC: #3, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
    - Uses `useQuery({ queryKey: ['clientes', clienteId], queryFn: () => clienteApiRepository.getById(clienteId), enabled: !!clienteId })`
    - Exposes `data`, `isLoading`, `isError` from the hook
    - `getById(id: string): Promise<Cliente>` must be added to `IClienteRepository.ts` and implemented in `clienteApiRepository.ts` (calls `GET /api/v1/clientes/{id}`)

- [ ] Task 2 — Extend infrastructure layer: add `getById` to API repository (AC: #3, #6)
  - [ ] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `getById(id: string): Promise<Cliente>` method signature
  - [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `getById`: calls `GET /api/v1/clientes/{id}` via `apiClient`; throws on 404 (let TanStack Query handle `isError`)

- [ ] Task 3 — Create `ClienteDetailView` presentation component (AC: #1, #2, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
    - Accepts `clienteId: string | null` as prop
    - When `clienteId` is null/undefined → renders EmptyState with Spanish prompt "Selecciona un cliente para ver sus detalles"
    - When `clienteId` is set → calls `useCliente(clienteId)`; shows skeleton while loading; shows not-found message if `isError` (404); renders Nombre, NIT/RUC, Teléfono, Ciudad when `data` resolves
    - Uses `react-loading-skeleton` for loading state (skeleton screens, not spinners — company standard)
    - Uses siesa-ui-kit components (check catalog first); fall back to shadcn/ui, then custom
    - All user-facing labels in Spanish: "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
    - Not-found message in Spanish: "Cliente no encontrado"

- [ ] Task 4 — Update route to wire `ClienteDetailView` with URL param and list selection (AC: #1, #2, #3, #4, #5)
  - [ ] Create/update `frontend/src/routes/_app/clientes.$clienteId.tsx` — TanStack Router dynamic route for `/clientes/:clienteId`
    - Reads `clienteId` param from route; passes it to `ClienteDetailView`
    - Renders split-panel layout: `ClienteListView` (280px left) + `ClienteDetailView` (flex right)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — render split-panel layout with `ClienteListView` on left (no client selected → `ClienteDetailView` receives `clienteId={null}`)
  - [ ] Update `ClienteListView.tsx` — wire `onClick` on each `ClientListItem` to navigate to `/clientes/:clienteId` via TanStack Router `useNavigate` or `<Link to="/clientes/$clienteId" params={{ clienteId: client.id }}>` pattern

- [ ] Task 5 — Backend: GET /api/v1/clientes/{id} endpoint (AC: #3, #4)
  - [ ] Verify/create `GetClienteByIdQuery.cs` + `GetClienteByIdQueryHandler.cs` in `SiesaAgents.Application/Clientes/Queries/`
    - Handler: fetch by UUID; return `ClienteDto` if found; throw domain exception mapped to 404 if not found
  - [ ] Verify/create endpoint `GET /api/v1/clientes/{id}` in `SiesaAgents.API/Endpoints/ClientesEndpoints.cs`
    - Returns `200 OK` + `ClienteDto` (direct object, no wrapper) on success
    - Returns `404 Not Found` + Problem Details RFC 7807 when client does not exist
    - Uses Scalar docs (never Swagger)

- [ ] Task 6 — Write tests (AC: #1–#6)
  - [ ] **Unit test** `useCliente.test.ts`:
    - When `clienteId` is undefined → `useQuery` is NOT enabled (assert `enabled: false` path skipped)
  - [ ] **Component test** `ClienteDetailView.test.tsx` with MSW:
    - TC-E2-P1-04: MSW returns client with all 4 fields → click list item → right panel shows Nombre, NIT/RUC, Teléfono, Ciudad; URL updated to `/clientes/:clienteId`
    - AC #5: Render with no `clienteId` → EmptyState with Spanish prompt rendered
    - AC #4: MSW returns 404 for unknown ID → not-found message "Cliente no encontrado" rendered, no crash
    - Loading skeleton shown while fetch is in-flight (MSW delayed response)
  - [ ] **E2E test** `TC-E2-P1-05`: Navigate directly to `http://localhost:5173/clientes/{knownClientId}` → assert client detail renders with correct Nombre, no blank screen
  - [ ] **E2E test** `TC-E2-P1-06`: Navigate to `http://localhost:5173/clientes/00000000-0000-0000-0000-000000000000` → assert not-found message rendered, navigation shell still visible, no JS crash
  - [ ] **API integration test** `TC-E2-P2-09` (xUnit + WebApplicationFactory):
    - GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000` → assert 404 + Problem Details body with `status: 404`

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. Dependency flows inward: Domain ← Application ← Infrastructure ← Presentation.
- **No direct API calls in components.** The `ClienteDetailView` calls only `useCliente(clienteId)` — the hook encapsulates all data access.
- **Deep linking (FR30):** TanStack Router's file-based routing handles `/clientes/:clienteId` via `clientes.$clienteId.tsx`. The `clienteId` param is read with `useParams()` or the route loader, then passed down to `ClienteDetailView`. No manual URL parsing.
- **Two-query pattern:** Story 2.1 uses `queryKey: ['clientes']` for the list. This story adds `queryKey: ['clientes', clienteId]` for the single-item detail — distinct keys, no conflict.
- **`enabled` guard:** `useQuery` MUST have `enabled: !!clienteId` to avoid firing with `null` or `undefined`.
- **Loading state:** Use `react-loading-skeleton` skeleton screens (not spinners). Company standard.
- **Error state:** Never show `error.message` directly. Use a Spanish not-found message ("Cliente no encontrado") for 404; use `<ErrorPanel onRetry={refetch} />` only for network errors (5xx).
- **MasterCrud note:** This story is a read-only detail panel — NOT a CRUD screen. MasterCrud is NOT applicable here. Do not use MasterCrud for `ClienteDetailView`.
- **Navigation from list:** Clicking a `ClientListItem` must use TanStack Router navigation (not `window.location`). Use `<Link to="/clientes/$clienteId" params={{ clienteId: client.id }}>` wrapping each list item, or `useNavigate()` on click.
- **Split-panel layout:** Left panel is `ClienteListView` fixed at 280px. Right panel is `ClienteDetailView` taking remaining flex space. Both panels coexist in the same route/view — the list does NOT disappear when a client is selected.

### siesa-ui-kit Usage (MANDATORY)

Check the siesa-ui-kit catalog BEFORE creating any UI component:
- Look for a detail panel / card component in siesa-ui-kit for the client detail display
- Check for a field-label component for the Nombre / NIT/RUC / Teléfono / Ciudad rows
- `EmptyState` component: check if siesa-ui-kit has one (was checked in Story 2.1 — if custom was created, reuse it from `src/shared/components/EmptyState.tsx`)
- Install: `npm install siesa-ui-kit` (must already be present from Story 1.1)
- If no siesa-ui-kit equivalent exists → fall back to shadcn/ui → custom

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/clientes/
  domain/
    IClienteRepository.ts              ← Update: add getById method
  application/
    useCliente.ts                      ← New
  infrastructure/
    clienteApiRepository.ts            ← Update: implement getById
  presentation/
    ClienteDetailView.tsx              ← New
    ClienteListView.tsx                ← Update: add onClick navigation per list item
frontend/src/routes/_app/
  clientes.tsx                         ← Update: add right panel with ClienteDetailView (clienteId=null)
  clientes.$clienteId.tsx              ← New or verify: dynamic route, renders split panel
```

Backend files to create or verify:
```
SiesaAgents.Application/Clientes/
  Queries/GetClienteByIdQuery.cs       ← New or verify
  Queries/GetClienteByIdQueryHandler.cs ← New or verify
SiesaAgents.API/Endpoints/
  ClientesEndpoints.cs                 ← Update: add GET /api/v1/clientes/{id} endpoint
```

### API Contract

```
GET /api/v1/clientes/{id}
  Response success: 200 OK
  Body: ClienteDto (direct object, no wrapper)

  Response not found: 404 Not Found
  Body: Problem Details RFC 7807
    { "status": 404, "title": "Not Found", "detail": "Cliente con ID {id} no encontrado." }

ClienteDto {
  id: Guid           // UUID
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string  // DateTimeOffset ISO 8601 with TZ — e.g. "2026-06-29T10:00:00Z"
}
```

**Critical**: 404 must return Problem Details (RFC 7807) — never a raw exception or empty response.

### TanStack Query Keys (Canonical)

```typescript
['clientes']               // list — useClientes.ts (Story 2.1)
['clientes', clienteId]    // single — useCliente.ts (this story)
```

All mutations in later stories (2.3, 2.4, 2.5) MUST call:
```typescript
queryClient.invalidateQueries({ queryKey: ['clientes'] })
// optionally also invalidate: queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] })
```

### TanStack Router Pattern for Deep Linking

```typescript
// routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router'
import ClienteDetailView from '../../modules/crm/clientes/presentation/ClienteDetailView'
import ClienteListView from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClientesDetailRoute,
})

function ClientesDetailRoute() {
  const { clienteId } = Route.useParams()
  return (
    <div style={{ display: 'flex' }}>
      <ClienteListView style={{ width: 280 }} />
      <ClienteDetailView clienteId={clienteId} style={{ flex: 1 }} />
    </div>
  )
}
```

### useCliente Hook Pattern

```typescript
// application/useCliente.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCliente(clienteId: string | null | undefined) {
  return useQuery({
    queryKey: ['clientes', clienteId],
    queryFn: () => clienteApiRepository.getById(clienteId!),
    enabled: !!clienteId,
  })
}
```

### Testing Test Cases Covered by This Story

From `test-design-epic-2.md`:
- **P1:** TC-E2-P1-04 (detail renders all fields on click), TC-E2-P1-05 (deep link loads correct detail), TC-E2-P1-06 (deep link to non-existent ID shows not-found)
- **P2:** TC-E2-P2-09 (API GET /{id} returns 404 for non-existent ID)

MSW handlers required for component tests in this story:
```typescript
http.get('/api/v1/clientes/:clienteId', ({ params }) => {
  const client = mockClients.find(c => c.id === params.clienteId)
  if (!client) return new HttpResponse(null, { status: 404 })
  return HttpResponse.json(client)
})
```

### Performance Notes

- The `GET /api/v1/clientes/{id}` fetch is triggered only once per `clienteId` (TanStack Query caches by key `['clientes', clienteId]`). If the same client is re-selected, cached data is used — no duplicate fetch.
- `staleTime` should match or exceed what `useClientes` uses to avoid unnecessary re-fetches when switching between list and detail.

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- Never expose `error.message` or backend stack traces in the UI — use "Cliente no encontrado" for 404, `<ErrorPanel>` for network errors
- All user-facing text in Spanish (MANDATORY company standard)
- CORS: backend allows `localhost:5173` in development

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.2 AC
- Previous story: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — established `ClienteListView`, `ClientListItem`, `IClienteRepository`, `clienteApiRepository`, `useClientes`, `EmptyState`, `ErrorPanel`, TanStack Query key `['clientes']`
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — Routing, Frontend Architecture, Component Boundaries, State Boundaries, API contract, Query keys, Data flow
- Test Design Epic 2: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — TC-E2-P1-04, TC-E2-P1-05, TC-E2-P1-06, TC-E2-P2-09
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, TanStack Router, TanStack Query, siesa-ui-kit, DateTimeOffset
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — NOT applicable for this read-only detail view

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
- frontend/src/modules/crm/clientes/application/useCliente.ts
- frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
- frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
- frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
- frontend/src/routes/_app/clientes.tsx
- frontend/src/routes/_app/clientes.$clienteId.tsx
- frontend/src/routes/_app/clientes.index.tsx
- frontend/src/routeTree.gen.ts
- backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs
- backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
- backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs
- backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
- backend/src/SiesaAgents.API/Endpoints/ClientesEndpoints.cs
- backend/src/SiesaAgents.API/Program.cs
- frontend/src/modules/crm/clientes/application/useCliente.test.ts
- frontend/src/modules/crm/clientes/application/useCliente.edge.test.ts
- frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx
- frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge.test.tsx
- e2e/tests/clientes/cliente-detail.spec.ts
- e2e/tests/clientes/cliente-detail.edge.spec.ts
- backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteDetailEndpointsTests.cs
- backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteDetailEndpointsEdgeTests.cs
