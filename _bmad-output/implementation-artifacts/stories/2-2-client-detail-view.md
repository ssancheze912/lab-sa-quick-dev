# Story 2.2: Client Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user navigates directly to `/clientes/:clienteId` (deep link), **When** the page loads, **Then** the correct client details are loaded and displayed without requiring prior list interaction (FR30).

3. **Given** a `clienteId` in the URL does not exist in the system, **When** the page loads, **Then** a not-found message is displayed gracefully in the right panel **And** no unhandled JavaScript error is thrown.

4. **Given** the `/clientes` route is loaded and no client has been selected, **When** the right panel is visible, **Then** a default empty state or placeholder is shown (no blank/broken UI).

## Tasks / Subtasks

- [ ] Task 1 — Add `getById` to `IClienteRepository` and `clienteApiRepository` (AC: 2, 3)
  - [ ] Add `getById(id: string): Promise<Cliente>` method to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [ ] Implement `getById(id)` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` → `GET /api/v1/clientes/:id`
  - [ ] Throw or reject with a typed error (e.g., `{ status: 404 }`) when backend returns 404

- [ ] Task 2 — Implement `useCliente` TanStack Query hook (AC: 2, 3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - [ ] Use `useQuery` with `queryKey: ['clientes', id]` and `enabled: !!id`
  - [ ] Call `clienteApiRepository.getById(id)`
  - [ ] Return `{ data, isLoading, isError, error }` — expose `error` for not-found detection
  - [ ] `staleTime`: 5 minutes (aligned with `queryClient.ts` default)

- [ ] Task 3 — Create `ClienteDetailPanel` presentation component (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
  - [ ] Props: `clienteId: string | undefined`
  - [ ] When `clienteId` is `undefined`: show `EmptyState` with message `"Selecciona un cliente para ver sus detalles"` (AC: 4)
  - [ ] When `isLoading === true`: show `react-loading-skeleton` skeleton placeholders (3–4 rows, skeleton screens not spinners)
  - [ ] When `isError === true` and error is 404: show not-found message `"Cliente no encontrado"` (AC: 3) — use `EmptyState` component with appropriate icon
  - [ ] When `isError === true` and error is non-404: show `ErrorPanel` with `onRetry={refetch}`
  - [ ] When `data` is loaded: display read-only fields — Nombre, NIT/RUC, Teléfono, Ciudad — using Tailwind + siesa-ui-kit tokens
  - [ ] All user-facing text in Spanish
  - [ ] WCAG 2.1 AA: use semantic elements (`<dl>/<dt>/<dd>` or labeled sections); `aria-label` on the panel region

- [ ] Task 4 — Create the `/clientes/:clienteId` route (AC: 1, 2, 3)
  - [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` (TanStack Router dynamic segment)
  - [ ] Extract `clienteId` from route params using TanStack Router `useParams()`
  - [ ] Render `<ClienteDetailPanel clienteId={clienteId} />`
  - [ ] This file serves as the right panel outlet for the deep-link URL `/clientes/:clienteId`

- [ ] Task 5 — Wire `ClienteListPanel` to navigate on item click (AC: 1)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [ ] Import TanStack Router `useNavigate`
  - [ ] On `ClientListItem` click: call `navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })`
  - [ ] Pass `isActive={selectedClienteId === cliente.id}` to each `ClientListItem` — derive `selectedClienteId` from TanStack Router `useParams()` (read URL as source of truth)
  - [ ] No additional local state for selected client — URL is the single source of truth (per architecture.md)

- [ ] Task 6 — Update `/clientes` route layout for split-panel with outlet (AC: 1, 4)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx`
  - [ ] Left panel: `ClienteListPanel` at fixed `w-[280px]`
  - [ ] Right panel: `<Outlet />` — renders `clientes.$clienteId.tsx` when a client is selected, or a default placeholder when at `/clientes` exactly
  - [ ] Default right panel placeholder: `EmptyState` with `"Selecciona un cliente para ver sus detalles"`
  - [ ] Layout uses `flex flex-row` at `lg:` breakpoint; stacks vertically on mobile (per UX spec)

- [ ] Task 7 — Backend: verify `GET /api/v1/clientes/:id` endpoint exists and returns 404 properly (AC: 2, 3)
  - [ ] Confirm `GetClienteByIdQuery`, `GetClienteByIdQueryHandler` exist in `backend/src/SiesaAgents.Application/Clientes/Queries/`
  - [ ] If missing: create `GetClienteByIdQuery.cs` (record with `Guid Id`) and `GetClienteByIdQueryHandler.cs` — calls `IClienteRepository.GetByIdAsync(id, ct)`, returns `ClienteDto` or `null`
  - [ ] Confirm `IClienteRepository` has `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` — add if missing
  - [ ] Confirm `ClienteRepository.GetByIdAsync` exists — add if missing: `return await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);`
  - [ ] Confirm `ClienteEndpoints.cs` has `MapGet("/{id}", ...)` — add if missing:
    - Handler returns `null` → `Results.NotFound(ProblemDetails { Status = 404, Title = "Cliente no encontrado" })`
    - Handler returns `ClienteDto` → `Results.Ok(dto)`
  - [ ] Confirm endpoint is registered in `Program.cs`

- [ ] Task 8 — Write frontend unit tests (AC: 1, 2, 3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useCliente.test.ts`
    - UNIT-D-FE-01: `useCliente` returns `ClienteDto` data when `clienteApiRepository.getById()` resolves
    - UNIT-D-FE-02: `useCliente` exposes `isError = true` when `getById` rejects with 404
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailPanel.test.tsx`
    - UNIT-D-FE-03: Renders skeleton placeholders when `isLoading === true`
    - UNIT-D-FE-04: Renders Nombre, NIT, Teléfono, Ciudad fields when data is loaded
    - UNIT-D-FE-05: Renders "Cliente no encontrado" message when error is 404
    - UNIT-D-FE-06: Renders `EmptyState` with selection prompt when `clienteId` is undefined

- [ ] Task 9 — Write backend unit tests (AC: 2, 3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Handlers/GetClienteByIdQueryHandlerTests.cs`
    - UNIT-D-B-01: Handler returns `ClienteDto` when repository returns a matching entity
    - UNIT-D-B-02: Handler returns `null` when repository returns no match for the given ID

## Dev Notes

### Architecture Context

This story builds directly on Story 2.1. The left panel `ClienteListPanel` (280px) already exists and loads all clients via `useClientes` (`queryKey: ['clientes']`). This story adds:
- The `useCliente(id)` hook for fetching a single client (`queryKey: ['clientes', id]`)
- The `ClienteDetailPanel` right-panel component (read-only detail display)
- The `/clientes/:clienteId` TanStack Router route (deep linking via `$clienteId` dynamic segment)
- Navigation from list item click to URL update

**Depends on:**
- Story 2.1 — `ClienteEntity`, `ClienteListPanel`, `useClientes`, `GET /api/v1/clientes`, shared components (`EmptyState`, `ErrorPanel`, `ClientListItem`) all exist
- Story 1.2 — `_app/clientes.tsx` route and split-panel layout shell

**Provides for:** Story 2.3 will add a "Nuevo cliente" button and form. Story 2.4 will add an "Editar" button inside `ClienteDetailPanel`. The `clienteId` from the URL will be used directly by these stories.

**URL as source of truth (architecture.md mandate):**
> "selectedClienteId: string | null — sincronizado con URL param"
> "Sin store Zustand necesario en MVP (URL es la fuente de verdad)"

Never store selected client ID in Zustand or component state. Always read it from TanStack Router's `useParams()`.

### TanStack Router: Dynamic Route File Naming

Per company standards and architecture.md:
```
frontend/src/routes/_app/clientes.$clienteId.tsx  ← the $ prefix creates the :clienteId param
```
TanStack Router maps `$clienteId` → `params.clienteId` (string). Use the generated `Route.useParams()` for type safety.

### `useCliente` Hook Pattern

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

**Key rule:** `enabled: !!id` prevents the query from firing when `id` is `undefined` (e.g., when at `/clientes` with no selection).

### Navigation from List Item Click

```typescript
// Inside ClienteListPanel.tsx
import { useNavigate, useParams } from '@tanstack/react-router'

const navigate = useNavigate()
const { clienteId: selectedClienteId } = useParams({ strict: false })

// On item click:
navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })

// Active state:
<ClientListItem
  key={c.id}
  nombre={c.nombre}
  nit={c.nit}
  isActive={selectedClienteId === c.id}
  onClick={() => navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })}
/>
```

**Note:** `useParams({ strict: false })` allows reading params from a parent or sibling route. The `clienteId` param is only defined on the `clientes.$clienteId.tsx` route, so the parent `clientes.tsx` must use `strict: false`.

### `ClienteDetailPanel` Not-Found Pattern

```typescript
// Detect 404 vs other errors in ClienteDetailPanel
import { isAxiosError } from 'axios'

const is404 = isError && isAxiosError(error) && error.response?.status === 404

if (is404) {
  return <EmptyState title="Cliente no encontrado" description="El cliente solicitado no existe o fue eliminado." />
}
if (isError) {
  return <ErrorPanel onRetry={refetch} />
}
```

### Backend: `GET /api/v1/clientes/:id` Endpoint

The GET by ID endpoint was partially scaffolded in Story 2.1 (Task 12 registered `ClienteEndpoints.cs`). Verify and complete as needed:

```csharp
// In ClienteEndpoints.cs — add inside MapClienteEndpoints():
group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
{
    var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
    return result is null
        ? Results.Problem(statusCode: 404, title: "Cliente no encontrado", detail: $"No existe cliente con id '{id}'.")
        : Results.Ok(result);
})
.WithName("GetClienteById")
.Produces<ClienteDto>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status404NotFound);
```

**Response contracts:**
```
GET /api/v1/clientes/{valid-uuid}     → 200 OK + ClienteDto (direct object, no wrapper)
GET /api/v1/clientes/{nonexistent}    → 404 + Problem Details RFC 7807 (no stack trace)
```

### `GetClienteByIdQueryHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;
    public GetClienteByIdQueryHandler(IClienteRepository repository) => _repository = repository;

    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(query.Id, ct);
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

### `ClienteRepository.GetByIdAsync` Pattern

```csharp
// Add to backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    => await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
```

### Frontend File Locations

```
frontend/src/
  routes/_app/
    clientes.tsx                              # MODIFY — add Outlet for right panel
    clientes.$clienteId.tsx                   # CREATE — renders ClienteDetailPanel
  modules/crm/clientes/
    domain/
      IClienteRepository.ts                   # MODIFY — add getById method
    application/
      useCliente.ts                           # CREATE
      __tests__/useCliente.test.ts            # CREATE
    infrastructure/
      clienteApiRepository.ts                 # MODIFY — implement getById
    presentation/
      ClienteListPanel.tsx                    # MODIFY — add navigate on click + isActive
      ClienteDetailPanel.tsx                  # CREATE
      __tests__/ClienteDetailPanel.test.tsx   # CREATE
```

### Backend File Locations

```
backend/src/
  SiesaAgents.Domain/Clientes/Interfaces/
    IClienteRepository.cs                     # MODIFY — add GetByIdAsync
  SiesaAgents.Application/Clientes/
    Queries/
      GetClienteByIdQuery.cs                  # CREATE (verify/create)
      GetClienteByIdQueryHandler.cs           # CREATE (verify/create)
  SiesaAgents.Infrastructure/Repositories/
    ClienteRepository.cs                      # MODIFY — add GetByIdAsync
  SiesaAgents.API/Endpoints/
    ClienteEndpoints.cs                       # MODIFY — add GET /{id} endpoint
backend/tests/
  SiesaAgents.UnitTests/Handlers/
    GetClienteByIdQueryHandlerTests.cs        # CREATE
```

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check component catalog before building anything custom
- **Usage**: All UI elements (panels, inputs, empty states) must prefer `siesa-ui-kit` equivalents
- **Constraint**: Do not create custom components if a kit equivalent exists
- **Loading**: `react-loading-skeleton` for placeholders — skeleton screens, NOT spinners (company standard)
- **Icons**: Heroicons primary; Font Awesome 6.5+ secondary
- **Colors**: Siesa Blue `#0e79fd` for active/selected states; `slate-*` for neutrals
- **Spanish**: All user-facing text must be in Spanish (labels, placeholders, ARIA labels, empty state messages)

### Layout: Split-Panel Responsive

Per UX spec (Direction F) and architecture.md:
```
lg:flex-row  →  ClienteListPanel (w-[280px] flex-shrink-0) + right panel (flex-1)
base (mobile) →  flex-col, full width, panels stack vertically
```
`clientes.tsx` should use: `<div className="flex flex-col lg:flex-row h-full">`.

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/clientes/clientes-detail.spec.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-C-07 | P0 | AC1, AC-E2.3 | Clicking a client in the list shows full detail (Nombre, NIT, Teléfono, Ciudad) in right panel |
| E2E-C-08 | P1 | AC1 | URL updates to `/clientes/:clienteId` after clicking a client item (FR30) |
| E2E-C-09 | P1 | AC2 | Direct navigation to `/clientes/:clienteId` loads correct client detail without prior list interaction |
| E2E-C-10 | P1 | AC3 | Direct navigation to `/clientes/00000000-0000-0000-0000-000000000000` shows not-found message gracefully |

**Implementation notes (from test-design-epic-2.md):**
- E2E-C-08: After `clientesPage.seleccionarCliente(nombre)`, assert `page.url()` matches `/clientes/{uuid}` pattern.
- E2E-C-09: Use `page.goto('/clientes/' + cliente.id)` directly. Assert detail panel renders Nombre field without clicking list item.
- E2E-C-10: Assert the not-found component is visible and no unhandled JS error is thrown — use `page.on('pageerror', fn)` listener before navigation. Assert no pageerror fires.

**API Integration Tests — `e2e/tests/clientes/clientes-api.spec.ts`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| API-C-08 | P1 | GET `/api/v1/clientes/:id` with valid ID returns 200 and full `ClienteDto` (id, nombre, nit, telefono, ciudad, createdAt, updatedAt) |
| API-C-09 | P1 | GET `/api/v1/clientes/:id` with non-existent ID returns 404 and Problem Details (no `stackTrace` key — NFR6) |

**Frontend Unit Tests (Vitest + RTL):**

| Test ID | Priority | File | Description |
|---------|----------|------|-------------|
| UNIT-D-FE-01 | P1 | `useCliente.test.ts` | Returns `ClienteDto` data when `getById` resolves |
| UNIT-D-FE-02 | P1 | `useCliente.test.ts` | Exposes `isError = true` when `getById` rejects with 404 |
| UNIT-D-FE-03 | P1 | `ClienteDetailPanel.test.tsx` | Renders skeleton placeholders when `isLoading === true` |
| UNIT-D-FE-04 | P1 | `ClienteDetailPanel.test.tsx` | Renders Nombre, NIT, Teléfono, Ciudad when data is loaded |
| UNIT-D-FE-05 | P1 | `ClienteDetailPanel.test.tsx` | Renders "Cliente no encontrado" when error status is 404 |
| UNIT-D-FE-06 | P1 | `ClienteDetailPanel.test.tsx` | Renders selection prompt `EmptyState` when `clienteId` is undefined |

**Backend Unit Tests (xUnit):**

| Test ID | Priority | File | Description |
|---------|----------|------|-------------|
| UNIT-D-B-01 | P1 | `GetClienteByIdQueryHandlerTests.cs` | Handler returns `ClienteDto` with all fields when repository returns matching entity |
| UNIT-D-B-02 | P1 | `GetClienteByIdQueryHandlerTests.cs` | Handler returns `null` when repository returns no match |

### Key Anti-Patterns to Avoid

```
❌ selectedClienteId in Zustand/useState  → URL is source of truth; read from useParams()
❌ useParams({ strict: true }) in parent  → use strict: false in clientes.tsx to read child params
❌ fetch on every render                  → useQuery with queryKey: ['clientes', id] handles caching
❌ showing blank/white area on no selection → always show EmptyState placeholder (AC4)
❌ English user-facing text               → all labels and messages in Spanish
❌ spinner for loading state              → react-loading-skeleton skeleton screens only
❌ exposing error.message to user         → use "Cliente no encontrado" / ErrorPanel with generic message
❌ DateTime in backend                    → DateTimeOffset mandatory (already in ClienteEntity)
❌ app.UseSwagger()                       → already using Scalar, no change needed
❌ hardcoded test UUIDs                   → use apiHelper.createCliente() for test data
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.2 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Frontend Architecture" (routing, `clientes.$clienteId.tsx`), "State Boundaries" (URL as source of truth, `['clientes', id]` query key), "API & Communication Patterns" (`GET /api/v1/clientes/{id}`), "Implementation Patterns & Consistency Rules"
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — E2E-C-07 to E2E-C-10, API-C-08, API-C-09, risk R6 (deep link 404), risk R12 (URL update on click)
- UX spec: `_bmad-output/planning-artifacts/ux-design-specification.md` — Direction F (split panel 280px left, flex-1 right), Phase 3 (client detail header), Core Interaction Design
- Predecessor story: `_bmad-output/implementation-artifacts/stories/2-1-client-list-and-search.md` — `ClienteListPanel`, `useClientes`, `ClienteEntity`, `EmptyState`, `ErrorPanel`, `GET /api/v1/clientes` all delivered
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack (TanStack Router `$` prefix), Backend Stack, Backend Critical Rules

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
