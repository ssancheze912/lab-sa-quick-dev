# Story 2.2: Client Detail View

Status: draft

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed **When** the user clicks on a client item **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view **When** the user accesses the URL `/clientes/:clienteId` directly **Then** the correct client details are loaded and displayed (FR30).

3. **Given** a clienteId in the URL does not exist **When** the page loads **Then** a not-found message is displayed gracefully in the right panel. No JS exception is thrown. The left panel list still renders normally.

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1 — Application layer: Query + Handler for GET /api/v1/clientes/{id} (AC: #1, #2, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`: record with `Guid Id` property.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`: inject `IClienteRepository`, call `GetByIdAsync(query.Id, ct)`, return `ClienteDto?` (null if not found).
  - [ ] Reuse existing `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — no changes needed (already has all required fields from Story 2.1).

- [ ] Task 2 — Minimal API endpoint: GET /api/v1/clientes/{id} (AC: #1, #2, #3)
  - [ ] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add to the existing `MapClienteEndpoints` group: `MapGet("/{id:guid}", ...)` → dispatch `GetClienteByIdQuery` → return `200 OK` with `ClienteDto` when found, `404 Not Found` with Problem Details when null.
  - [ ] Register `GetClienteByIdQueryHandler` in DI in `Program.cs` (add `builder.Services.AddScoped<GetClienteByIdQueryHandler>()`).
  - [ ] Ensure `IClienteRepository.GetByIdAsync` is already implemented (it was added in Story 2.1 — verify it exists in `ClienteRepository.cs`).

- [ ] Task 3 — Backend unit tests (AC: #1, #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`:
    - Test: `Handle_WithExistingId_ReturnsClienteDto` — mock `IClienteRepository` returning a `ClienteEntity`, assert handler returns mapped `ClienteDto` with all fields.
    - Test: `Handle_WithNonExistentId_ReturnsNull` — mock `IClienteRepository` returning `null`, assert handler returns `null`.

- [ ] Task 4 — Backend integration tests for GET /api/v1/clientes/{id} (AC: #1, #2, #3)
  - [ ] In `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`, add:
    - Test: `GetClienteById_WithSeededClient_Returns200AndClienteDto` (TC-E2-P2-02) — seed 1 client, GET `/api/v1/clientes/{id}`, assert 200, JSON object has `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`.
    - Test: `GetClienteById_WithNonExistentId_Returns404WithProblemDetails` (TC-E2-P2-03) — GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`, assert 404, body is Problem Details RFC 7807, no stack trace.

### Frontend Tasks

- [ ] Task 5 — Application layer: `useCliente` TanStack Query hook (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`. Uses `queryKey: ['clientes', id]`, calls `clienteApiRepository.getById(id)`, `staleTime: 30_000`. Returns `{ data, isLoading, isError }`. When `id` is `undefined` or `null`, the query is disabled (`enabled: !!id`).

- [ ] Task 6 — Infrastructure layer: `getById` method in Axios repository (AC: #1, #2)
  - [ ] In `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`, add method `getById(id: string): Promise<Cliente>` — GET `/api/v1/clientes/${id}`, returns the client object directly. On 404 the Axios interceptor will throw; let the caller handle it.
  - [ ] In `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`, add `getById(id: string): Promise<Cliente>` to the interface.

- [ ] Task 7 — Presentation layer: `ClienteDetailView` component (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`.
    - Props: `clienteId: string`.
    - Uses `useCliente(clienteId)` hook.
    - Loading state: skeleton (react-loading-skeleton) — no spinner.
    - Error/not-found state: renders a `<div data-testid="cliente-not-found">` with a graceful "Cliente no encontrado" message (Spanish). Detect not-found by checking `isError` — the Axios interceptor will throw on 404.
    - Data state: renders `<div data-testid="cliente-detail-panel">` containing:
      - `<span data-testid="cliente-nombre">{cliente.nombre}</span>`
      - `<span data-testid="cliente-nit">{cliente.nit}</span>`
      - `<span data-testid="cliente-telefono">{cliente.telefono}</span>`
      - `<span data-testid="cliente-ciudad">{cliente.ciudad}</span>`
    - All visible labels must be in Spanish (e.g., "Nombre:", "NIT/RUC:", "Teléfono:", "Ciudad:").

- [ ] Task 8 — Route integration: `/clientes/$clienteId` route (AC: #1, #2, #3)
  - [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`. This file-based route registers `/clientes/:clienteId` in TanStack Router. Import and render `ClientesView` (or a split-panel layout variant) that passes the `clienteId` param to `ClienteDetailView`. Use `useParams()` from TanStack Router to extract `clienteId`.
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClientesView.tsx` to accept an optional `selectedClienteId?: string` prop and render `ClienteDetailView` in the right panel when provided; render a default empty right panel otherwise.
  - [ ] In `frontend/src/routes/_app/clientes.tsx` (base `/clientes` route), ensure the right panel renders an empty/placeholder state when no `clienteId` is in the URL.
  - [ ] Clicking a client item in `ClienteListView` must navigate to `/clientes/{clienteId}` using TanStack Router `useNavigate()`. Update `ClienteListView.tsx` and/or `ClientListItem.tsx` to wire the `onClick` handler to `navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })`.

- [ ] Task 9 — Frontend unit tests (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useCliente.test.ts`:
    - Test: `useCliente_WithValidId_ReturnsMappedCliente` — MSW returns single client, assert hook data has all 4 fields.
    - Test: `useCliente_WithNonExistentId_ReturnsError` — MSW returns 404, assert `isError === true`.
    - Test: `useCliente_WhenIdIsUndefined_DoesNotFetch` — assert no network call when `id` is falsy.

- [ ] Task 10 — Frontend component tests with MSW (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`:
    - Test (TC-E2-P1-06): Clicking a list item shows correct client details in right panel and URL updates to `/clientes/{id}`.
    - Test (TC-E2-P2-02): `ClienteDetailView` renders Nombre, NIT/RUC, Teléfono, Ciudad when MSW returns client data.
    - Test (AC2): Direct render of `ClienteDetailView` with a known `clienteId` loads and displays the client (simulates deep link).
    - Test (TC-E2-P2-03 / AC3): When MSW returns 404 for `GET /api/v1/clientes/:id`, renders `data-testid="cliente-not-found"` gracefully.
    - Test (AC3): Loading skeleton is visible while fetch is in progress (`isLoading === true`).

## Dev Notes

### Architecture Alignment

This story adds the detail endpoint and the right-panel detail view to the split-panel layout established in Story 2.1.

**Data flow for client detail (click from list):**
```
User clicks ClientListItem
  → onClick → navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
  → TanStack Router updates URL to /clientes/:clienteId
  → clientes.$clienteId.tsx route renders ClientesView with clienteId param
  → ClienteDetailView receives clienteId prop
  → useCliente(clienteId) [TanStack Query, queryKey: ['clientes', id]]
  → clienteApiRepository.getById(id)
  → GET /api/v1/clientes/{id}
  → ClienteDto → right panel displays Nombre, NIT/RUC, Teléfono, Ciudad
```

**Data flow for deep link (direct URL access):**
```
Browser navigates to /clientes/:clienteId
  → TanStack Router resolves clientes.$clienteId.tsx route
  → useParams() extracts clienteId
  → useCliente(clienteId) fetches from API on mount
  → Right panel renders detail on success, not-found on 404
```

### Backend Implementation Details

**GetClienteByIdQuery pattern:**
```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs
public record GetClienteByIdQuery(Guid Id);
```

**GetClienteByIdQueryHandler:**
```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
public class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct = default)
    {
        var entity = await repository.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;

        return new ClienteDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            Nit = entity.Nit,
            Telefono = entity.Telefono,
            Ciudad = entity.Ciudad,
            CreatedAt = entity.CreatedAt
        };
    }
}
```

**Minimal API endpoint addition (in existing ClienteEndpoints.cs):**
```csharp
group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
{
    var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
    return result is not null
        ? Results.Ok(result)
        : Results.Problem(
            title: "Not Found",
            detail: "El cliente no fue encontrado",
            statusCode: StatusCodes.Status404NotFound);
});
```

**DI registration in Program.cs (add alongside existing registrations):**
```csharp
builder.Services.AddScoped<GetClienteByIdQueryHandler>();
```

**API response contract (GET /api/v1/clientes/{id}):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Empresa ABC",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-04T10:30:00Z"
}
```
Direct object response — no wrapper. [Source: architecture.md#Format Patterns]

**404 response contract (Problem Details RFC 7807):**
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "El cliente no fue encontrado"
}
```
No stack trace. [Source: architecture.md#Authentication & Security]

**`IClienteRepository.GetByIdAsync` — already exists from Story 2.1:**
```csharp
// Already declared in IClienteRepository.cs:
Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);

// Already implemented in ClienteRepository.cs:
public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    => await context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
```
No additional backend repository changes needed.

### Frontend Implementation Details

**`useCliente` hook:**
```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
```

**`clienteApiRepository.getById` addition:**
```typescript
// Add to existing clienteApiRepository.ts
async getById(id: string): Promise<Cliente> {
  const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
  return response.data;
}
```

**TanStack Router route file:**
```typescript
// frontend/src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ClientesView } from '../../modules/crm/clientes/presentation/ClientesView';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteIdPage,
});

function ClienteIdPage() {
  const { clienteId } = Route.useParams();
  return <ClientesView selectedClienteId={clienteId} />;
}
```

**`ClientesView` update — accept `selectedClienteId` prop:**
```typescript
// Updated ClientesView.tsx
interface ClientesViewProps {
  selectedClienteId?: string;
}

export function ClientesView({ selectedClienteId }: ClientesViewProps) {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListView selectedClienteId={selectedClienteId} />
      <div className="flex-1">
        {selectedClienteId
          ? <ClienteDetailView clienteId={selectedClienteId} />
          : <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Selecciona un cliente para ver sus detalles
            </div>
        }
      </div>
    </div>
  );
}
```

**`ClienteListView` — wiring click to navigate:**
```typescript
// In ClienteListView.tsx, import and use navigate:
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();

const handleClienteClick = (clienteId: string) => {
  navigate({ to: '/clientes/$clienteId', params: { clienteId } });
};

// Pass to ClientListItem:
<ClientListItem
  key={cliente.id}
  cliente={cliente}
  isSelected={selectedClienteId === cliente.id}
  onClick={() => handleClienteClick(cliente.id)}
/>
```

**`ClienteDetailView` loading state — skeleton (NOT spinner):**
```typescript
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

if (isLoading) {
  return (
    <div className="p-6 flex flex-col gap-3" data-testid="cliente-detail-loading">
      <Skeleton height={24} width="60%" />
      <Skeleton height={20} width="40%" />
      <Skeleton height={20} width="50%" />
      <Skeleton height={20} width="35%" />
    </div>
  );
}
```

**`ClienteDetailView` not-found state:**
```typescript
if (isError) {
  return (
    <div
      data-testid="cliente-not-found"
      className="flex h-full items-center justify-center text-slate-500 text-sm"
      role="status"
    >
      Cliente no encontrado
    </div>
  );
}
```

**`ClienteDetailView` data state:**
```tsx
return (
  <div data-testid="cliente-detail-panel" className="p-6 flex flex-col gap-4">
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">Nombre</p>
      <span data-testid="cliente-nombre" className="text-base font-medium text-slate-900">
        {data.nombre}
      </span>
    </div>
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">NIT/RUC</p>
      <span data-testid="cliente-nit" className="text-base text-slate-700">
        {data.nit}
      </span>
    </div>
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">Teléfono</p>
      <span data-testid="cliente-telefono" className="text-base text-slate-700">
        {data.telefono}
      </span>
    </div>
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">Ciudad</p>
      <span data-testid="cliente-ciudad" className="text-base text-slate-700">
        {data.ciudad}
      </span>
    </div>
  </div>
);
```

**URL state management — Router as source of truth:**
```
selectedClienteId: string | null — syncronizado con URL param (:clienteId)
NO Zustand store — URL es la fuente de verdad para la selección
```
[Source: architecture.md#State Boundaries]

**All user-facing text in Spanish** (company standard P0): "Selecciona un cliente para ver sus detalles", "Cliente no encontrado", "Nombre:", "NIT/RUC:", "Teléfono:", "Ciudad:". Code variables, functions, and files remain in English. [Source: company-standards.md#Frontend Key Rules]

**TanStack Router route file naming:**
- `clientes.$clienteId.tsx` — flat routing with `$` dynamic param prefix
- Registered path: `/_app/clientes/$clienteId` → URL: `/clientes/:clienteId`
- File-based routing auto-discovered by `@tanstack/router-plugin` — no manual registration needed.
[Source: company-standards.md#TanStack Router Prefixes]

**Axios singleton (from Story 1.2):**
The `apiClient` at `frontend/src/shared/lib/apiClient.ts` has error interceptors configured. A 404 response will cause Axios to throw, which TanStack Query catches and sets `isError = true`. Do NOT swallow 404 errors in the repository layer.

### Testing Details

**Frontend test tooling:**
- Vitest 2+ + RTL + MSW 2+ (all installed from Story 1.2)
- TanStack Router test wrapper may be needed for route-dependent tests
- MSW server setup shared from Story 2.1 test utilities

**Backend test tooling:**
- xUnit + EF Core InMemory (unit) + WebApplicationFactory (integration)
- TestContainers Postgres for integration tests verifying real 404 responses

**Test case cross-references (from test-design-epic-2.md):**
- TC-E2-P1-06: Click client → right panel shows details + URL updates
- TC-E2-P1-07: E2E deep link to `/clientes/:knownId` (Playwright)
- TC-E2-P1-08: E2E deep link to invalid UUID → not-found graceful (Playwright)
- TC-E2-P2-02: GET /api/v1/clientes/:id integration test
- TC-E2-P2-03: GET /api/v1/clientes/:id non-existent → 404 Problem Details

**data-testid attributes required:**

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `cliente-detail-panel` | Root div of `ClienteDetailView` (data state) | Test: detail visible |
| `cliente-nombre` | Nombre span | Test: correct nombre displayed |
| `cliente-nit` | NIT/RUC span | Test: correct nit displayed |
| `cliente-telefono` | Teléfono span | Test: correct telefono displayed |
| `cliente-ciudad` | Ciudad span | Test: correct ciudad displayed |
| `cliente-not-found` | Not-found container | Test: graceful not-found (AC3) |
| `cliente-detail-loading` | Loading skeleton container | Test: skeleton visible during fetch |

**Testing — Arrange/Act/Assert pattern (company standard):**
```typescript
// Example: TC-E2-P1-06
it('clicking client item shows details in right panel and updates URL', async () => {
  // Arrange
  const cliente = createCliente({ nombre: 'Empresa Beta', nit: '900999-1' });
  server.use(
    http.get('/api/v1/clientes', () => HttpResponse.json([cliente])),
    http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
  );
  render(<ClientesView />, { wrapper: RouterWrapper });

  // Act
  const listItem = await screen.findByText('Empresa Beta');
  await userEvent.click(listItem);

  // Assert
  expect(await screen.findByTestId('cliente-detail-panel')).toBeInTheDocument();
  expect(screen.getByTestId('cliente-nombre')).toHaveTextContent('Empresa Beta');
  expect(screen.getByTestId('cliente-nit')).toHaveTextContent('900999-1');
});
```

**Accessibility (WCAG 2.1 AA):**
- Not-found container must have `role="status"` for screen reader announcement.
- Detail fields must have meaningful accessible labels (readable text labels above values).
- Loading skeleton does not need additional ARIA — `react-loading-skeleton` uses `aria-busy` internally.

### Project Structure Notes

**Files to create in this story:**

Backend:
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

Frontend:
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`
- `frontend/src/modules/crm/clientes/application/__tests__/useCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Files to modify in this story:**

Backend:
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (add `GET /{id:guid}` endpoint)
- `backend/src/SiesaAgents.API/Program.cs` (add `GetClienteByIdQueryHandler` DI registration)
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (add TC-E2-P2-02 and TC-E2-P2-03)

Frontend:
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` (add `getById`)
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` (add `getById` signature)
- `frontend/src/modules/crm/clientes/presentation/ClientesView.tsx` (accept `selectedClienteId` prop, render `ClienteDetailView`)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (wire `onClick` → `navigate`, pass `selectedClienteId`)

**Scope constraints (DO NOT create in this story):**
- `ClienteForm.tsx` — deferred to Story 2.3
- `useCreateCliente.ts`, `useUpdateCliente.ts`, `useDeleteCliente.ts` — deferred to Stories 2.3–2.5
- Edit / Delete buttons in detail panel — deferred to Stories 2.4 and 2.5
- `SortControl` component — deferred to Story 2.6
- `ContactManager` wiring — deferred to Epic 4
- Any backend endpoint other than `GET /api/v1/clientes/{id}` — deferred to subsequent stories

### References

- Clean Architecture layers and file structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- API endpoints and response contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- TanStack Query canonical keys: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- State management boundaries (URL as source of truth for selectedClienteId): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- FR5 (view client detail), FR30 (deep linking): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Entity pattern (private ctor + static Create()): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- DateTimeOffset (never DateTime): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- TanStack Router file naming and dynamic params (`$`): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Loading states via react-loading-skeleton (not spinners): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Loading States]
- All user text in Spanish: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Test cases TC-E2-P1-06, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P2-02, TC-E2-P2-03: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Story 2.1 implementation (existing domain, repository, and infrastructure files): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- CORS policy (inherited from Story 1.1 — no action needed): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_To be filled by dev agent during implementation._

### Completion Notes List

_To be filled by dev agent during implementation._

### File List

_To be filled by dev agent during implementation._
