# Story 2.2: Client Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, **And** the URL updates to `/clientes/:clienteId` via TanStack Router client-side navigation without a full page reload (FR30).

2. **Given** the user accesses the URL `/clientes/:clienteId` directly, **When** the page loads, **Then** the correct client details are fetched from `GET /api/v1/clientes/{id}` and displayed in the right panel.

3. **Given** a clienteId in the URL does not exist (backend returns 404), **When** the page loads, **Then** a not-found message is displayed gracefully in the right panel (e.g., "Cliente no encontrado.") — **no** unhandled error, **no** stack trace.

4. **Given** the backend is unavailable when fetching the client detail, **When** the fetch fails (network error or non-2xx non-404 response), **Then** an `ErrorPanel` component with a "Reintentar" button is displayed in the right panel, **And** clicking "Reintentar" triggers a new fetch attempt.

5. **Given** the client detail is loading, **When** the fetch is in-flight, **Then** a skeleton loader (via `react-loading-skeleton`) is rendered in the right panel — no spinner.

6. **Given** no client is selected (user navigates to `/clientes` without a clienteId), **When** the page renders, **Then** the right panel shows a neutral empty/placeholder state (e.g., "Selecciona un cliente para ver sus detalles.").

7. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the corresponding `ClientListItem` shows the active/selected visual state (`bg-primary-50 text-primary-700`).

## Tasks / Subtasks

- [ ] Task 1 — Extend domain repository contract for single-client fetch (AC: #2)
  - [ ] Add `getById(id: string): Promise<Cliente>` method to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`

- [ ] Task 2 — Implement `getById` in infrastructure API repository (AC: #2)
  - [ ] Add `getById(id: string)` implementation to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Use `apiClient.get<Cliente>(`/api/v1/clientes/${id}`)` — throw on non-2xx responses (Axios does this automatically)

- [ ] Task 3 — Create `useCliente(id)` application-layer hook (AC: #2, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - [ ] Use `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })` — canonical query key from architecture
  - [ ] Export `{ data, isLoading, isError, error, refetch }`

- [ ] Task 4 — Create `ClienteDetailView` presentation component (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [ ] Accept prop `clienteId: string` (received from route params)
  - [ ] Call `useCliente(clienteId)` hook
  - [ ] Render skeleton (`react-loading-skeleton`, 4 rows matching fields) while `isLoading === true`
  - [ ] Render `<ErrorPanel onRetry={refetch} />` when `isError === true` and error is NOT a 404
  - [ ] Render "Cliente no encontrado." message when error is a 404 (Axios `error.response?.status === 404`)
  - [ ] Render complete client details when data is available: Nombre, NIT/RUC, Teléfono, Ciudad
  - [ ] All field labels in Spanish: "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
  - [ ] Wrap in `<section aria-label="Detalle del cliente">` for WCAG 2.1 AA compliance
  - [ ] Add `data-testid="cliente-detail-view"` to root element
  - [ ] Add `data-testid="cliente-detail-nombre"`, `data-testid="cliente-detail-nit"`, `data-testid="cliente-detail-telefono"`, `data-testid="cliente-detail-ciudad"` to individual field values

- [ ] Task 5 — Create `ClienteDetailPlaceholder` component for empty right panel state (AC: #6)
  - [ ] Create `frontend/src/shared/components/ClienteDetailPlaceholder.tsx` (or inline in route)
  - [ ] Render neutral message "Selecciona un cliente para ver sus detalles." with descriptive icon
  - [ ] Add `data-testid="cliente-detail-placeholder"`

- [ ] Task 6 — Wire `ClienteDetailView` into the `/clientes` route (AC: #1, #6, #7)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — the right panel `<div>` placeholder (from Story 2.1) must now render `<ClienteDetailView>` or `<ClienteDetailPlaceholder>` based on whether a `clienteId` is in the URL
  - [ ] Use TanStack Router `useParams` or nested route outlet to access `clienteId` from URL
  - [ ] Pass `clienteId` to `<ClientListItem isSelected={clienteId === cliente.id}>` for active state highlighting (AC: #7)

- [ ] Task 7 — Implement the `clientes.$clienteId.tsx` route component (AC: #2)
  - [ ] Update `frontend/src/routes/_app/clientes.$clienteId.tsx` (currently a stub from Story 2.1)
  - [ ] Use `createFileRoute('/_app/clientes/$clienteId')` with `useParams` to extract `clienteId`
  - [ ] Render `<ClienteDetailView clienteId={clienteId} />` within the right panel
  - [ ] Ensure the route file uses TanStack Router's nested/layout pattern so the left panel (`ClienteListView`) remains visible

- [ ] Task 8 — Backend: Create `GetClienteByIdQuery` and handler (AC: #2, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`: `public record GetClienteByIdQuery(Guid Id);`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
    - Inject `IClienteRepository` (or `AppDbContext` directly)
    - Use `AsNoTracking()` for the read-only query
    - Return `ClienteDto` mapped from `ClienteEntity`
    - Throw `NotFoundException` (already exists from Story 1.3) when client is not found — middleware converts to 404 Problem Details

- [ ] Task 9 — Backend: Add `GET /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [ ] Update `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Register `GET /api/v1/clientes/{id}` endpoint
  - [ ] Handler dispatches `GetClienteByIdQuery` and returns `Results.Ok(clienteDto)` or propagates `NotFoundException` to middleware
  - [ ] Status codes: 200 (found), 404 (not found — via middleware), 500 (unhandled — via middleware)

- [ ] Task 10 — Backend: Add `GetById` to IClienteRepository and ClienteRepository (AC: #2)
  - [ ] Add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository` interface (domain/application layer)
  - [ ] Implement in `ClienteRepository.cs` using EF Core: `await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)`

- [ ] Task 11 — Frontend unit tests (AC: #1–#7)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
    - Test: returns client data on successful fetch (MSW handler)
    - Test: `isLoading` is true while fetching
    - Test: `isError` is true on API failure
    - Test: query is disabled when id is undefined/empty
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
    - Test: renders skeleton while loading
    - Test: renders `ErrorPanel` on non-404 API failure (e.g., 500)
    - Test: renders "Cliente no encontrado." message on 404 error
    - Test: renders all client fields (Nombre, NIT/RUC, Teléfono, Ciudad) on success
    - Test: all field labels are in Spanish
    - Test: `<section aria-label="Detalle del cliente">` present (WCAG 2.1 AA)
    - Test: `data-testid` attributes present for each field
  - [ ] All tests: Vitest + RTL + MSW; Arrange/Act/Assert; coverage target > 80%

- [ ] Task 12 — Backend unit and integration tests (AC: #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
    - Test: returns `ClienteDto` when client exists
    - Test: throws `NotFoundException` when client does not exist
    - Test: uses `AsNoTracking` (verify via `ChangeTracker.Entries()`)
  - [ ] Update `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs`
    - Test: `GET /api/v1/clientes/{id}` returns 200 + client JSON when client exists
    - Test: `GET /api/v1/clientes/{id}` returns 404 Problem Details when client does not exist
    - Test: response fields match `ClienteDto` contract (camelCase)
  - [ ] All tests: xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL (integration)

## Dev Notes

### Architecture Context

This story is **full-stack** — both frontend and backend changes are required. Story 2.2 fills the right panel of the split layout established in Story 2.1. The left panel (`ClienteListView`, 280px) is already implemented and navigates to `/clientes/:clienteId` on item click.

**Critical dependency from Story 2.1:**
- `frontend/src/routes/_app/clientes.tsx` — split panel layout already exists; right panel is a `<div>` placeholder. This story replaces that placeholder.
- `frontend/src/routes/_app/clientes.$clienteId.tsx` — stub route created in Story 2.1 for deep-linking. This story makes it functional.
- `ClienteListItem` shared component already has `isSelected` prop and active state logic — wire it to the active `clienteId`.
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` — entity interface already exists (reuse as-is).
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — extend with `getById` method (singleton already exported).
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — already exists from Story 2.1 (reuse).
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` — already exists from Story 1.3 (reuse).
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add the new `GET /{id}` endpoint here (extend, do NOT recreate).

**Backend IClienteRepository location:** In Story 2.1 completion notes, the interface was placed in `Application/Clientes/Interfaces/IClienteRepository.cs` (not `Domain/Clientes/Interfaces/`) to preserve Clean Architecture. Follow the same path.

### MasterCrud Assessment

Story 2.2 is a **read-only detail panel** — NOT a CRUD grid or form. `MasterCrud` is NOT applicable here. The right panel renders static field/value pairs for a single selected client. `MasterCrud` will be evaluated for Stories 2.3–2.5 (create/edit/delete forms).

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check siesa-ui-kit catalog FIRST before creating any custom component. If no equivalent detail-panel component exists, create a custom `ClienteDetailView`.
- **Loading states**: Use `react-loading-skeleton` — skeleton screens, NOT spinners. Match skeleton rows to the 4 visible fields (Nombre, NIT/RUC, Teléfono, Ciudad).
- **Icons**: Heroicons (primary), Font Awesome 6.5+ (secondary).
- **Brand Colors**: Primary `#0e79fd` (Siesa Blue) — use Tailwind `primary-*` tokens.
- **All user-facing text in Spanish** — field labels, empty states, error messages, ARIA labels.
- **WCAG 2.1 AA**: `<section aria-label="Detalle del cliente">` wrapper; all labels and interactive elements accessible via keyboard.

### Frontend: TanStack Router — Split Panel Navigation Pattern

The `/clientes` route layout must keep `ClienteListView` always visible while swapping the right panel based on route. There are two valid approaches — use whichever was established in Story 2.1:

**Option A — Outlet pattern (nested routes):**
```typescript
// frontend/src/routes/_app/clientes.tsx — layout route
export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
})

function ClientesLayout() {
  return (
    <div className="flex flex-row h-full" data-testid="clientes-view">
      <ClienteListView />
      <div className="flex-1">
        <Outlet /> {/* renders clientes.$clienteId.tsx or index */}
      </div>
    </div>
  )
}
```

```typescript
// frontend/src/routes/_app/clientes.$clienteId.tsx
export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
})

function ClienteDetailPage() {
  const { clienteId } = Route.useParams()
  return <ClienteDetailView clienteId={clienteId} />
}
```

**Option B — Param reading in parent (if Story 2.1 used flat routing):**
```typescript
// Read clienteId from router search/params in clientes.tsx and conditionally render
const { clienteId } = useParams({ strict: false }) // optional param
```

Verify the pattern used in Story 2.1's `clientes.tsx` before implementing and remain consistent.

### Frontend: `useCliente` Hook

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

Canonical query key `['clientes', id]` is defined in `architecture.md` — use it exactly.

### Frontend: 404 vs Generic Error Differentiation

```typescript
// In ClienteDetailView.tsx
import type { AxiosError } from 'axios'

const isNotFound = isError && (error as AxiosError)?.response?.status === 404

if (isNotFound) {
  return <p data-testid="cliente-not-found">Cliente no encontrado.</p>
}
if (isError) {
  return <ErrorPanel onRetry={refetch} />
}
```

### Frontend: Module File Structure

```
frontend/src/modules/crm/clientes/
├── domain/
│   └── IClienteRepository.ts       ← MODIFY: add getById signature
├── application/
│   ├── useClientes.ts               ← unchanged
│   └── useCliente.ts                ← CREATE
├── infrastructure/
│   └── clienteApiRepository.ts      ← MODIFY: add getById implementation
└── presentation/
    ├── ClienteListView.tsx           ← unchanged
    └── ClienteDetailView.tsx         ← CREATE

frontend/src/shared/components/
└── ClienteDetailPlaceholder.tsx     ← CREATE (or inline in route)

frontend/src/routes/_app/
├── clientes.tsx                     ← MODIFY: wire detail view / outlet
└── clientes.$clienteId.tsx          ← MODIFY: replace stub with ClienteDetailView
```

### Backend: `GetClienteByIdQueryHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
    {
        var cliente = await _repository.GetByIdAsync(query.Id, ct);

        if (cliente is null)
            throw new NotFoundException($"Cliente with id '{query.Id}' was not found.");

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt,
            cliente.UpdatedAt
        );
    }
}
```

### Backend: `GET /api/v1/clientes/{id}` Endpoint Pattern

```csharp
// In ClienteEndpoints.cs — add alongside existing GET /api/v1/clientes
app.MapGet("/api/v1/clientes/{id:guid}", async (
    Guid id,
    GetClienteByIdQueryHandler handler,
    CancellationToken ct) =>
{
    var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
    return Results.Ok(result);
})
.WithName("GetClienteById")
.WithSummary("Get client by ID");
// Note: NotFoundException is caught by ExceptionHandlingMiddleware → 404 Problem Details
```

Register `GetClienteByIdQueryHandler` in `Program.cs` DI alongside existing handler registrations.

### API Response Shape (from architecture.md)

```
GET /api/v1/clientes/{id}
  → 200 OK: { "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "...", "updatedAt": "..." }
  → 404 Not Found: Problem Details RFC 7807 { "status": 404, "title": "Not Found", "detail": "Cliente with id '...' was not found." }
  → 500 Internal Server Error: Problem Details RFC 7807
```

### Testing Standards Summary

**Frontend:** Vitest + React Testing Library + MSW. Use MSW handlers for `GET /api/v1/clientes/:id` returning both success and error responses (404, 500). Tests co-located alongside source files. Coverage target > 80%.

**Backend:** xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL (integration). All tests: Arrange / Act / Assert. Coverage target > 80%.

### Project Structure Notes

- `frontend/src/shared/lib/apiClient.ts` — Axios singleton (Story 1.1). Import `apiClient` from this path.
- `frontend/src/shared/components/ErrorPanel.tsx` — already exists (Story 2.1). Reuse as-is.
- `frontend/src/shared/components/ClientListItem.tsx` — already exists (Story 2.1); has `isSelected` prop. Pass `isSelected={clienteId === cliente.id}` from the route.
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — note: per Story 2.1 completion notes, the interface lives in `Application/Clientes/Interfaces/`, NOT in `Domain/`. Do NOT recreate it in Domain.
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` — exists from Story 1.3. Use it in `GetClienteByIdQueryHandler`.
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already maps `NotFoundException` → 404 Problem Details (Story 1.3). No changes needed.
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — has `DbSet<ClienteEntity> Clientes` from Story 2.1. No changes needed.

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Epic objectives and FR3 (Ver detalle cliente): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Epic 2]
- FR30 deep linking: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#AC-E2.3]
- Frontend module structure: [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- TanStack Query keys canonical (['clientes', id]): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- REST endpoints contract (GET /api/v1/clientes/{id}): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- API response shapes (direct object, Problem Details): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Entity pattern (private ctor + factory, NotFoundException): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- DateTimeOffset, UUID PKs: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- EF Core AsNoTracking for read queries: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- MasterCrud reference (not applicable for read-only panel): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Story 2.1 dev notes (pre-existing components, IClienteRepository path): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 1.3 dev notes (NotFoundException, ExceptionHandlingMiddleware): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- NFR2 CRUD < 2s (TanStack Query invalidation): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR6 no stack traces: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- Enforcement guidelines (anti-patterns): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
