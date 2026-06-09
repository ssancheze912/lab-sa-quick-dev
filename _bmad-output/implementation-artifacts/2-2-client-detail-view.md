# Story 2.2: Client Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly, **Then** the correct client details are loaded and displayed (FR30).

3. **Given** a clienteId in the URL does not exist, **When** the page loads, **Then** a not-found message is displayed gracefully in the right panel and the client list remains visible.

## Tasks / Subtasks

- [ ] Task 1 — Backend: `GET /api/v1/clientes/{id}` endpoint (AC: #1, #2, #3)
  - [ ] Add `GetClienteByIdQuery.cs` and `GetClienteByIdQueryHandler.cs` under `backend/src/SiesaAgents.Application/Clientes/Queries/`.
    - `GetClienteByIdQuery` carries `Guid Id`.
    - `GetClienteByIdQueryHandler` calls `IClienteRepository.GetByIdAsync(id)`. If null → throw `ClienteNotFoundException(id)` (new domain exception: `backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNotFoundException.cs`).
    - Returns `ClienteDto` (already defined in Story 2.1).
  - [ ] Add `GetByIdAsync(Guid id): Task<ClienteEntity?>` to `IClienteRepository.cs` if not already present (Story 2.1 defined the interface — verify).
  - [ ] Implement `GetByIdAsync` in `ClienteRepository.cs` using EF Core: `await _context.Clientes.FindAsync(id)`.
  - [ ] Register `GET /api/v1/clientes/{id}` in `ClienteEndpoints.cs`:
    ```csharp
    group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
    {
        var dto = await handler.HandleAsync(new GetClienteByIdQuery(id));
        return Results.Ok(dto);
    });
    ```
  - [ ] Add `ClienteNotFoundException` mapping in `ExceptionHandlingMiddleware.cs` (Story 1.3): status 404, `Content-Type: application/problem+json`, `detail: "Cliente no encontrado."`. Do NOT reformat the existing middleware — only add the new exception case.

- [ ] Task 2 — Backend: xUnit integration test for GET by ID (AC: #2, #3)
  - [ ] `TC-E2-P2-02`: GET `/api/v1/clientes/{id}` with a seeded client → assert 200, `ClienteDto` shape (id UUID, nombre, nit, telefono, ciudad, createdAt ISO 8601 with timezone).
  - [ ] GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000` (no such record) → assert 404, `Content-Type: application/problem+json`, body has `"status": 404`.
  - [ ] Use `WebApplicationFactory<Program>` + TestContainers (Postgres).
  - [ ] Test class: `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (extend existing file if present).

- [ ] Task 3 — Frontend: `useCliente(id)` hook (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`.
  - [ ] Uses `useQuery` from TanStack Query: `queryKey: ['clientes', id]`, `queryFn: () => clienteApiRepository.getById(id)`.
  - [ ] Exports `{ data, isLoading, isError, error }`.
  - [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts` and implement in `clienteApiRepository.ts`: `GET /api/v1/clientes/${id}` — returns `Cliente`.

- [ ] Task 4 — Frontend: `ClienteDetailView` component (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`.
  - [ ] Receives `clienteId: string` as prop (passed from the route).
  - [ ] Uses `useCliente(clienteId)` hook.
  - [ ] Loading state: use `react-loading-skeleton` (`<Skeleton count={4} height={24} />`) — skeleton screen, NOT spinner.
  - [ ] Loaded state: renders a detail panel with labeled fields (Spanish labels):
    - `Nombre:` — value from `data.nombre`
    - `NIT/RUC:` — value from `data.nit`
    - `Teléfono:` — value from `data.telefono`
    - `Ciudad:` — value from `data.ciudad`
  - [ ] Not-found state: when `isError` and HTTP status is 404 → render a not-found message in Spanish (e.g., "Cliente no encontrado."). Check siesa-ui-kit for a NotFound or Alert component before building custom. Do NOT show raw `error.message`.
  - [ ] Error state (non-404): render `<ErrorPanel onRetry={refetch} />` (shared component from Story 2.1).
  - [ ] All user-facing text MUST be in Spanish.
  - [ ] WCAG 2.1 AA compliance: label/value pairs must be accessible (use `<dl>/<dt>/<dd>` or `aria-label` as appropriate).

- [ ] Task 5 — Frontend: Route integration — `clientes.$clienteId.tsx` (AC: #1, #2)
  - [ ] Verify `frontend/src/routes/_app/clientes.$clienteId.tsx` exists (defined in architecture.md as the deep-link route).
  - [ ] If it does NOT exist: create it. Route must export a TanStack Router `Route` component for path `/clientes/$clienteId`. The route reads `clienteId` from path params and renders `ClienteDetailView` in the right panel alongside `ClienteListView` in the left panel.
  - [ ] If it DOES exist: verify it renders `ClienteDetailView` with the correct `clienteId` prop wired from `useParams()` / TanStack Router params.
  - [ ] Ensure the route is registered in the router tree (check `routeTree.gen.ts` or the router configuration from Story 1.2).
  - [ ] URL on client item click: the `ClienteListView` left panel must navigate to `/clientes/${clienteId}` on item click using TanStack Router's `navigate()` or `<Link>` — verify or add this interaction.

- [ ] Task 6 — Frontend: Vitest + RTL component tests (AC: #1, #2, #3)
  - [ ] `TC-E2-P1-06`: Render the clientes split-panel view. Pre-populate `['clientes']` cache with 1 client `{ id: "uuid-1", nombre: "Acme", nit: "900-1", telefono: "3001111111", ciudad: "Bogotá" }`. Click list item → assert right panel shows all 4 fields with correct values. Assert URL updates to `/clientes/uuid-1` (use `router.state.location.pathname`).
  - [ ] `TC-E2-P1-08`: Render `ClienteDetailView` with `clienteId="id-que-no-existe"`. MSW returns 404 for `GET /api/v1/clientes/id-que-no-existe`. Assert not-found message is visible in the DOM. Assert left panel (client list) is still rendered.
  - [ ] `TC-E2-P2-02-fe` (optional but recommended): Render `ClienteDetailView` with valid `clienteId`. MSW returns full `ClienteDto`. Assert skeleton shown during loading, then all 4 fields visible after data loads.
  - [ ] Co-locate tests: `ClienteDetailView.test.tsx` alongside `ClienteDetailView.tsx`, `useCliente.test.ts` alongside `useCliente.ts`.
  - [ ] All test assertions on user-facing text MUST use Spanish strings.

## Dev Notes

### Architecture Patterns

This story implements the read side of the `clientes` detail view. It builds directly on Story 2.1 (list) and establishes the foundation for Stories 2.3 (create) and 2.4 (edit) which will reuse `ClienteDetailView` and the `useCliente` hook.

**Clean Architecture layers touched:**

| Layer | Frontend | Backend |
|-------|---------|---------|
| Domain | `IClienteRepository.ts` (add `getById`) | `ClienteNotFoundException.cs`, `IClienteRepository.cs` (add `GetByIdAsync`) |
| Application | `useCliente.ts` | `GetClienteByIdQuery.cs`, `GetClienteByIdQueryHandler.cs` |
| Infrastructure | `clienteApiRepository.ts` (add `getById`) | `ClienteRepository.cs` (add `GetByIdAsync`), `ExceptionHandlingMiddleware.cs` (add 404 case) |
| Presentation | `ClienteDetailView.tsx`, `clientes.$clienteId.tsx` | `ClienteEndpoints.cs` (add `GET /{id}`) |

**TanStack Query key for single client:** `['clientes', id]` — MUST use this exact array shape (canonical per architecture.md). This enables targeted invalidation from Stories 2.4 (edit) and 2.5 (delete).

**URL / routing:** TanStack Router file-based routing. Route file `_app/clientes.$clienteId.tsx` maps to URL `/clientes/:clienteId`. The `$` prefix on the filename segment means a dynamic route parameter named `clienteId`.

**Split panel layout:** Per architecture.md Component Boundaries:
```
Route Layer (_app/clientes.$clienteId.tsx)
  └── ClienteListView [280px, panel izquierdo]
  └── ClienteDetailView [flex, panel derecho]
```
Both panels must coexist on the same route. The `clientes.$clienteId.tsx` route should render both. Alternatively, check if `_app/clientes.tsx` uses a nested outlet pattern — if yes, `ClienteDetailView` is rendered in the outlet when a `clienteId` param is present.

### Backend — Entity and Exception

`ClienteNotFoundException` (new file in Story 2.2):
```csharp
// backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNotFoundException.cs
public class ClienteNotFoundException : Exception
{
    public ClienteNotFoundException(Guid id)
        : base($"Cliente con id '{id}' no encontrado.") { }
}
```

`ExceptionHandlingMiddleware` addition (Story 1.3 base):
```csharp
ClienteNotFoundException => Results.Problem(
    statusCode: StatusCodes.Status404NotFound,
    title: "Cliente no encontrado.",
    detail: ex.Message
)
// Content-Type: application/problem+json is set by the existing middleware pattern
```

### Backend — API Contract

```
GET /api/v1/clientes/{id}
  → 200 OK
  → Content-Type: application/json
  → Body: ClienteDto (single object, no wrapper)

GET /api/v1/clientes/{id}  (not found)
  → 404 Not Found
  → Content-Type: application/problem+json
  → Body: Problem Details RFC 7807
    {
      "status": 404,
      "title": "Cliente no encontrado.",
      "detail": "Cliente con id '...' no encontrado."
    }

ClienteDto shape (unchanged from Story 2.1):
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Acme Corp",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z"
}
```

### Frontend — Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id),
    enabled: Boolean(id),
  });
}
```

### Frontend — Repository Extension

```typescript
// Addition to frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
getById: async (id: string): Promise<Cliente> => {
  const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
  return data;
},
```

### Frontend — Not-Found Detection

```typescript
// Inside ClienteDetailView.tsx
import { isAxiosError } from 'axios';

const isNotFound = isError && isAxiosError(error) && error.response?.status === 404;

if (isNotFound) {
  return <p>Cliente no encontrado.</p>; // or siesa-ui-kit Alert/NotFound component
}
if (isError) {
  return <ErrorPanel onRetry={refetch} />;
}
```

### Frontend — Loading Skeleton

```typescript
import Skeleton from 'react-loading-skeleton';
// When isLoading === true:
// <Skeleton count={4} height={24} /> — skeleton screen, not spinner
```

### UI Components Checklist

- **siesa-ui-kit first**: Check siesa-ui-kit for a `DetailPanel`, `DataItem`, `NotFound`, or `Alert` component before building custom label/value pairs.
- **shadcn/ui fallback**: If siesa-ui-kit lacks the component, check shadcn/ui via the shadcn MCP.
- **Custom last resort**: Build custom only if neither kit has an equivalent.
- `ErrorPanel` from Story 2.1 is already in `frontend/src/shared/components/ErrorPanel.tsx` — reuse it.
- `react-loading-skeleton` is already installed (Story 2.1) — reuse it.
- **MasterCrud does NOT apply**: This is a read-only detail panel in a split layout, not a full CRUD data-grid screen.

### Project Structure Notes

New/modified files in this story (relative to repo root):

**Backend:**
```
backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNotFoundException.cs  (NEW)
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs     (NEW)
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs (NEW)
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs        (MODIFY — add GetByIdAsync)
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs        (MODIFY — add GetByIdAsync if not present)
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                       (MODIFY — add GET /{id})
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs            (MODIFY — add ClienteNotFoundException → 404)
```

**Frontend:**
```
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts                  (MODIFY — add getById)
frontend/src/modules/crm/clientes/application/useCliente.ts                     (NEW)
frontend/src/modules/crm/clientes/application/useCliente.test.ts                (NEW)
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts        (MODIFY — add getById)
frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx            (NEW)
frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx       (NEW)
frontend/src/routes/_app/clientes.$clienteId.tsx                                (NEW or VERIFY)
```

**Alignment with architecture.md:**
- `clientes.$clienteId.tsx` is in the official project directory structure (architecture.md lines 459–460).
- `useCliente.ts` is in the official structure (architecture.md line 469).
- `ClienteDetailView.tsx` is in the official structure (architecture.md line 479).
- Route `_app` prefix = pathless layout (shared navigation shell from Story 1.2 — no new layout needed).
- `$clienteId` = TanStack Router dynamic segment (company standard prefix `$`).

### Testing Notes from test-design-epic-2.md

Test cases scoped to Story 2.2 (must pass before story can be marked Done):

**P1 — Required:**
- TC-E2-P1-06: Client detail panel shows all 4 fields on item click + URL updates to `/clientes/uuid-1`
- TC-E2-P1-07: Deep link — direct URL `/clientes/:clienteId` loads correct client (Playwright E2E — requires both servers running)
- TC-E2-P1-08: Not-found message for invalid clienteId

**P2 — Required before epic closes:**
- TC-E2-P2-02: Backend GET `/api/v1/clientes/:id` returns 404 Problem Details for unknown ID

**Risk R7 (deep-link URL handling):** verified by TC-E2-P1-07 (Playwright E2E). Ensure TanStack Router route is registered and hydrates correctly on direct navigation.

**Testing tooling:** Vitest + RTL + MSW (frontend component tests), Playwright (E2E deep-link test), xUnit + WebApplicationFactory + TestContainers Postgres (backend integration tests).

### Previous Story Learnings (from Story 2.1)

- `UseSnakeCaseNamingConvention()` is on `DbContextOptionsBuilder` in `Program.cs` — not `modelBuilder.ApplySnakeCaseNaming()`.
- `ExceptionHandlingMiddleware` (Story 1.3) already handles unhandled exceptions → Problem Details. Add `ClienteNotFoundException` as a new case — do NOT restructure the existing middleware.
- `WriteAsJsonAsync` overrides `Content-Type`. For Problem Details responses use explicit `Content-Type: application/problem+json` header as the existing middleware already does.
- TanStack Query `queryKey` MUST be array — `['clientes', id]` not `'clientes-' + id`.
- `isLoading` vs `isPending`: in TanStack Query v5, use `isLoading` for initial load only when `enabled` is true (with `enabled: Boolean(id)` to avoid firing when `id` is undefined).
- `react-loading-skeleton` is already in `package.json` from Story 2.1 — import directly, no new install needed.
- Frontend test `data-testid` conventions from Story 2.1 debug log: use descriptive hyphenated IDs (`clientes-detail-panel`, `cliente-detail-nombre`, etc.) — keep consistent.
- `queryClient.ts` already has `retry: false` set from Story 2.1 fix — error states show immediately in tests without extra waiting.

### Non-Functional Requirements Coverage

| NFR | Strategy in this story |
|-----|------------------------|
| NFR1 — Search < 1s | Not applicable to detail view (no search here) |
| NFR2 — CRUD < 2s UI update | `useCliente` query with `staleTime` default → detail loads in < 2s |
| NFR6 — No stack traces | `ClienteNotFoundException` → 404 Problem Details via `ExceptionHandlingMiddleware` |
| NFR11 — No hardcoded limits | UUID primary keys; no hardcoded IDs in implementation |

### Enforcement Anti-Patterns to Avoid

```
❌ DateTime in entities/DTOs         → DateTimeOffset always
❌ Swagger/OpenAPI registration      → Scalar only (app.MapScalarApiReference())
❌ String queryKey ['clientes-id']   → array ['clientes', id]
❌ English UI text / error messages  → Spanish mandatory
❌ Showing raw error.message in UI   → use <ErrorPanel> or not-found message
❌ Custom component before kit check → check siesa-ui-kit first, then shadcn, then custom
❌ Spinner for loading               → react-loading-skeleton skeleton screens only
❌ MasterCrud for detail panel       → NOT applicable; MasterCrud is for CRUD data-grid screens
❌ Navigate to different section     → detail view stays in /clientes section (split panel)
❌ Hardcoding clienteId in tests     → use generated UUIDs (crypto.randomUUID() or Guid.NewGuid())
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story-2.2`
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — sections: Frontend Architecture, Component Boundaries, TanStack Query keys, API & Communication Patterns, Structure Patterns, Enforcement Guidelines
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — Story 2.2 test cases (TC-E2-P1-06, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P2-02)
- Previous story (context source): `_bmad-output/implementation-artifacts/2-1-client-list-search.md`
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md`
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — NOTE: MasterCrud is NOT used in this story. Story 2.2 is a read-only detail panel in a split layout, not a full CRUD data-grid screen.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
