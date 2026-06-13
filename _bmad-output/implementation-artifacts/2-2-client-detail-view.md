# Story 2.2: Client Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel (flex-1) shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, and the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user accesses the URL `/clientes/:clienteId` directly, **When** the page loads, **Then** the correct client details are loaded and displayed from `GET /api/v1/clientes/{id}` (FR30).

3. **Given** a `clienteId` in the URL does not exist, **When** `GET /api/v1/clientes/{id}` returns 404, **Then** the right panel displays a graceful not-found message (e.g., "Cliente no encontrado.") — no crash, no unhandled error.

4. **Given** the backend is unavailable when fetching the client detail, **When** the `GET /api/v1/clientes/{id}` fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed in the right panel, and clicking "Reintentar" triggers a new fetch.

5. **Given** the client detail is loading, **When** the fetch is in-flight, **Then** skeleton placeholders are shown in the right panel (react-loading-skeleton — NOT a spinner).

6. **Given** no client is selected (user is at `/clientes` with no `clienteId`), **When** the right panel renders, **Then** an empty or placeholder state is displayed (e.g., "Selecciona un cliente para ver su detalle.").

## Tasks / Subtasks

- [ ] Task 1 — Backend: GetClienteById Query + Handler (AC: #2, #3)
  - [ ] Create `GetClienteByIdQuery.cs` in `backend/src/SiesaAgents.Application/Clientes/Queries/` with property `Guid Id`.
  - [ ] Create `GetClienteByIdQueryHandler.cs` in same folder, returning `ClienteDto?`. Calls `IClienteRepository.GetByIdAsync(query.Id, ct)`.
  - [ ] Add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` method to `IClienteRepository.cs` in `backend/src/SiesaAgents.Domain/Clientes/Interfaces/`.
  - [ ] Implement `GetByIdAsync` in `ClienteRepository.cs` in `backend/src/SiesaAgents.Infrastructure/Repositories/`. Use `await _context.Clientes.FindAsync(new object[] { id }, ct)`.

- [ ] Task 2 — Backend: GET /api/v1/clientes/{id} endpoint (AC: #2, #3, #4)
  - [ ] Add `GET /{id}` route to `ClienteEndpoints.cs` in `backend/src/SiesaAgents.API/Endpoints/`. Handler: dispatches `GetClienteByIdQuery` → if result is null → `Results.NotFound()` (Problem Details 404); if found → `Results.Ok(clienteDto)`.
  - [ ] Error format: Problem Details RFC 7807 — `ExceptionHandlingMiddleware` handles all unhandled exceptions.
  - [ ] Response shape on success: `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }` (camelCase, same `ClienteDto` as Story 2.1).
  - [ ] Response shape on not-found: HTTP 404 with `{ type, title: "Not Found", status: 404, detail: "Cliente not found." }`.

- [ ] Task 3 — Frontend: Domain layer extension (AC: #2)
  - [ ] Add method `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts` in `frontend/src/modules/crm/clientes/domain/`.
  - [ ] No changes to `Cliente.ts` entity — shape is unchanged from Story 2.1.

- [ ] Task 4 — Frontend: Infrastructure layer extension (AC: #2)
  - [ ] Implement `getById(id: string): Promise<Cliente>` in `clienteApiRepository.ts` (`frontend/src/modules/crm/clientes/infrastructure/`). Uses `apiClient.get<Cliente>(\`/api/v1/clientes/${id}\`)` → returns `response.data`. Throws on non-2xx (Axios default behaviour).

- [ ] Task 5 — Frontend: Application layer — useCliente hook (AC: #2, #3, #4, #5)
  - [ ] Create `useCliente.ts` in `frontend/src/modules/crm/clientes/application/` using TanStack Query `useQuery`.
    - Query key: `['clientes', id]` (canonical per architecture).
    - `queryFn`: calls `clienteRepository.getById(id)`. Only enabled when `id` is a non-empty string (`enabled: !!id`).
    - `staleTime`: 60_000 (1 minute).
    - `retry`: 2.
  - [ ] Signature: `export function useCliente(id: string | undefined)`.

- [ ] Task 6 — Frontend: Presentation layer — ClienteDetailView component (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `ClienteDetailView.tsx` in `frontend/src/modules/crm/clientes/presentation/`.
  - [ ] Props: `clienteId: string | undefined`.
  - [ ] If `clienteId` is undefined/empty → render placeholder: `<p className="text-slate-400">Selecciona un cliente para ver su detalle.</p>`.
  - [ ] Uses `useCliente(clienteId)` hook. Handle states:
    - `isLoading` → render skeleton (react-loading-skeleton — 4 skeleton rows for fields).
    - `isError` → render `<ErrorPanel onRetry={refetch} />`.
    - `data` present → render detail card with fields: Nombre, NIT/RUC, Teléfono, Ciudad.
    - If fetch returns 404 (TanStack Query error with HTTP 404 status) → render "Cliente no encontrado." message instead of `ErrorPanel`.
  - [ ] Detail layout: labeled fields (label in `text-slate-500 text-sm`, value in `text-slate-900 font-medium`). Use siesa-ui-kit components if equivalent detail/label components exist; otherwise use TailwindCSS.
  - [ ] All user-facing text MUST be in Spanish. All code (variables, functions) MUST be in English.
  - [ ] WCAG 2.1 AA: all fields must be readable by screen readers (use semantic HTML `<dl>/<dt>/<dd>` or equivalent ARIA-labeled structure).

- [ ] Task 7 — Frontend: Route integration (AC: #1, #2, #6)
  - [ ] Create route file `frontend/src/routes/_app/clientes.$clienteId.tsx` for the `/clientes/:clienteId` dynamic route.
    - Use TanStack Router `$` prefix for the dynamic segment.
    - Export a `Route` using `createFileRoute('/clientes/$clienteId')`.
    - The route component renders the split-panel layout: left panel (`ClienteListPanel`, 280px fixed) + right panel (`ClienteDetailView`, flex-1), passing `clienteId` from route params.
    - Add a loader to prefetch `['clientes', clienteId]` via `queryClient.prefetchQuery(...)` so direct URL access (FR30) works without flash.
  - [ ] Modify `frontend/src/routes/_app/clientes.tsx` (Story 2.1 route): the right panel `<div className="flex-1">` placeholder must now render `<ClienteDetailView clienteId={undefined} />` to show the "Selecciona un cliente" state.
  - [ ] In `ClienteListPanel.tsx` (Story 2.1): each `ClientListItem` must navigate to `/clientes/${cliente.id}` on click. Use TanStack Router `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>` or the router's `navigate` function.
    - `ClientListItem` should highlight (`isSelected`) when the current URL's `clienteId` matches `cliente.id`.

- [ ] Task 8 — Frontend: Unit tests (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Test `useCliente.ts` with MSW:
    - Mock `GET /api/v1/clientes/:id` → 200 with valid `ClienteDto` → verify typed `Cliente` returned.
    - Mock `GET /api/v1/clientes/:id` → 404 → verify hook enters error state.
    - Verify hook is disabled when `id` is undefined.
  - [ ] Test `ClienteDetailView.tsx` with RTL:
    - Renders placeholder when `clienteId` is undefined.
    - Renders skeleton on `isLoading` state.
    - Renders `ErrorPanel` on non-404 `isError` state; clicking "Reintentar" calls `refetch`.
    - Renders "Cliente no encontrado." on 404 error.
    - Renders all 4 client fields (Nombre, NIT/RUC, Teléfono, Ciudad) when data is present.
  - [ ] Accessibility: run `axe` check on `ClienteDetailView` — must pass WCAG 2.1 AA.

- [ ] Task 9 — Backend: Unit tests for GetClienteByIdQueryHandler (AC: #2, #3)
  - [ ] Create `GetClienteByIdQueryHandlerTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`.
  - [ ] Use xUnit + Arrange/Act/Assert.
  - [ ] Test: existing ID → returns `ClienteDto` with correct data.
  - [ ] Test: non-existing ID → returns `null`.

## Dev Notes

### Architecture Context

Story 2.2 implements the **right panel (flex-1)** of the `/clientes` split-panel view. It is **read-only** — no creation, editing, or deletion in this story. The left panel (280px) was implemented in Story 2.1.

**Scope boundary (CRITICAL):**
- Do NOT implement client editing or deletion (Stories 2.4, 2.5).
- Do NOT render the `ContactManager` from siesa-ui-kit — that belongs to a later story (Epic 4).
- The right panel shows ONLY: Nombre, NIT/RUC, Teléfono, Ciudad — the 4 core client fields.
- This story adds clicking behaviour to `ClientListItem` and navigation between `/clientes` and `/clientes/:clienteId`.

**MasterCrud assessment:** NOT applicable for this story. Story 2.2 is a read-only detail panel within a split-panel layout. MasterCrud is a full-screen CRUD orchestrator; this story needs a lightweight detail card in the right panel slot. No CRUD operations are performed in this story.

**404 handling pattern:** When the backend returns 404 for `GET /api/v1/clientes/{id}`, TanStack Query will enter error state. Distinguish 404 from other errors by checking `error.response?.status === 404` (AxiosError) in the component. Render "Cliente no encontrado." for 404, and `<ErrorPanel>` for all other errors.

### Backend Stack

| Component | Value |
|-----------|-------|
| Framework | .NET 10 |
| ORM | EF Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`) |
| Database | PostgreSQL 18+ — `siesa_agents_db` |
| Naming | `UseSnakeCaseNamingConvention()` already applied in `Program.cs` — NO manual `[Column]`/`[Table]` attributes |
| API docs | Scalar (`Scalar.AspNetCore`) — NEVER Swagger |
| Error format | Problem Details RFC 7807 |
| PK type | `Guid` (UUID) — mandatory |
| Timestamps | `DateTimeOffset` — NEVER `DateTime` |
| Testing | xUnit, Arrange/Act/Assert |

### Frontend Stack

| Component | Value |
|-----------|-------|
| Bundler | Vite 7+ |
| Framework | React 18+ (functional components + hooks) |
| Language | TypeScript 5+ strict mode — NO `any` |
| Routing | TanStack Router file-based (`_app/clientes.$clienteId.tsx`) |
| Server state | TanStack Query 5+ (`queryKey: ['clientes', id]`) |
| Client state | `useState` / URL params — NO Zustand needed |
| HTTP client | Axios (`src/shared/lib/apiClient.ts` singleton, established in Story 1.1) |
| Styling | TailwindCSS v4 + siesa-ui-kit tokens |
| Loading states | `react-loading-skeleton` — skeleton screens, NOT spinners |
| Testing | Vitest + RTL + MSW + axe |

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check catalog FIRST before any custom component
- **Install**: `npm install siesa-ui-kit` (dependency already present from Story 1.1)
- **Usage**: Use `siesa-ui-kit` components for all UI elements where an equivalent exists
- **Constraint**: Do NOT create custom components if a `siesa-ui-kit` equivalent exists
- **MasterCrud**: NOT applicable — read-only detail panel, not a CRUD screen

### GetClienteById Backend Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

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
            UpdatedAt = entity.UpdatedAt
        };
    }
}
```

### GET /api/v1/clientes/{id} Endpoint Pattern

```csharp
// Addition to ClienteEndpoints.cs
group.MapGet("/{id:guid}", async (
    Guid id,
    GetClienteByIdQueryHandler handler,
    CancellationToken ct) =>
{
    var result = await handler.HandleAsync(new GetClienteByIdQuery { Id = id }, ct);
    return result is null
        ? Results.Problem(
            title: "Not Found",
            detail: "Cliente not found.",
            statusCode: 404)
        : Results.Ok(result);
});
```

### useCliente Hook Pattern (Frontend)

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query';
import { clienteRepository } from '../infrastructure/clienteApiRepository';
import type { Cliente } from '../domain/Cliente';

export function useCliente(id: string | undefined) {
  return useQuery<Cliente>({
    queryKey: ['clientes', id],
    queryFn: () => clienteRepository.getById(id!),
    enabled: !!id,
    staleTime: 60_000,
    retry: 2,
  });
}
```

### 404 Detection Pattern (Frontend)

```typescript
// Inside ClienteDetailView.tsx — distinguish 404 from other errors
import type { AxiosError } from 'axios';

const is404 = isError && (error as AxiosError)?.response?.status === 404;

if (is404) {
  return <p className="text-slate-500">Cliente no encontrado.</p>;
}
if (isError) {
  return <ErrorPanel onRetry={refetch} />;
}
```

### TanStack Router Dynamic Route Pattern

```typescript
// frontend/src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ClienteListPanel } from '../../modules/crm/clientes/presentation/ClienteListPanel';
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  loader: ({ context: { queryClient }, params: { clienteId } }) =>
    queryClient.prefetchQuery({
      queryKey: ['clientes', clienteId],
      queryFn: () => clienteRepository.getById(clienteId),
    }).catch(() => undefined),
  component: ClienteDetailPage,
});

function ClienteDetailPage() {
  const { clienteId } = Route.useParams();
  return (
    <div className="flex flex-row h-full">
      <div className="w-[280px] shrink-0">
        <ClienteListPanel selectedClienteId={clienteId} />
      </div>
      <div className="flex-1">
        <ClienteDetailView clienteId={clienteId} />
      </div>
    </div>
  );
}
```

### ClientListItem Navigation Pattern

```typescript
// In ClienteListPanel.tsx — update list items to navigate on click
import { Link, useParams } from '@tanstack/react-router';

// Inside the map rendering clients:
<Link
  key={cliente.id}
  to="/_app/clientes/$clienteId"
  params={{ clienteId: cliente.id }}
>
  <ClientListItem
    nombre={cliente.nombre}
    nit={cliente.nit}
    isSelected={selectedClienteId === cliente.id}
  />
</Link>
```

### API Response Shape

```
GET /api/v1/clientes/{id}
→ 200 OK + JSON object: { id, nombre, nit, telefono, ciudad, createdAt, updatedAt }
→ 404 Problem Details: { type, title: "Not Found", status: 404, detail: "Cliente not found." }
→ 500 Problem Details on unhandled exception
```

### File Structure

Files to create or modify in this story:

```
backend/
  src/
    SiesaAgents.Domain/
      Clientes/
        Interfaces/
          IClienteRepository.cs             ← MODIFY: add GetByIdAsync method
    SiesaAgents.Application/
      Clientes/
        Queries/
          GetClienteByIdQuery.cs            ← CREATE NEW
          GetClienteByIdQueryHandler.cs     ← CREATE NEW
    SiesaAgents.Infrastructure/
      Repositories/
        ClienteRepository.cs               ← MODIFY: implement GetByIdAsync
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs               ← MODIFY: add GET /{id} route
  tests/
    SiesaAgents.UnitTests/
      Application/
        Clientes/
          GetClienteByIdQueryHandlerTests.cs ← CREATE NEW

frontend/
  src/
    modules/
      crm/
        clientes/
          domain/
            IClienteRepository.ts          ← MODIFY: add getById method
          application/
            useCliente.ts                  ← CREATE NEW
          infrastructure/
            clienteApiRepository.ts        ← MODIFY: implement getById
          presentation/
            ClienteDetailView.tsx          ← CREATE NEW
            ClienteListPanel.tsx           ← MODIFY: add navigation onClick + isSelected
    routes/
      _app/
        clientes.$clienteId.tsx            ← CREATE NEW (dynamic route)
        clientes.tsx                       ← MODIFY: render ClienteDetailView with undefined clienteId
```

### Project Structure Notes

- `clientes.$clienteId.tsx` uses TanStack Router `$` prefix for the dynamic `:clienteId` URL segment. File name maps to route `/clientes/:clienteId` per TanStack Router file-based routing conventions.
- `ClienteDetailView.tsx` is named per architecture doc — it matches `ClienteDetailView.tsx` in the architecture's project structure.
- `clienteRepository` singleton is already exported from `clienteApiRepository.ts` (Story 2.1) — extend it, do NOT re-create.
- `EmptyState.tsx` and `ErrorPanel.tsx` already exist from Story 2.1 (`frontend/src/shared/components/`).
- `ClientListItem.tsx` already exists from Story 2.1 (`frontend/src/shared/components/`). Its `onClick` and `isSelected` props were already defined — verify and use them.
- `apiClient.ts` singleton exists at `frontend/src/shared/lib/apiClient.ts` (Story 1.1).
- `queryClient.ts` exists at `frontend/src/shared/lib/queryClient.ts` (Story 2.1 modification) — use `queryClient.prefetchQuery` in the route loader for SSR-like direct URL access.

### Previous Story Context (Story 2.1)

Story 2.1 established:
- `ClienteEntity`, `IClienteRepository` (backend) — only `GetAllAsync` was implemented.
- `ClienteDto` — all fields present, same shape needed for `GetById`.
- `ClienteEndpoints.cs` — only `GET /` (list) was added. `GET /{id}` is Story 2.2.
- `ClienteListPanel.tsx` — renders list items. In Story 2.1, the `onClick` on `ClientListItem` was stubbed (right panel was placeholder). Story 2.2 activates navigation.
- Route `clientes.tsx` — renders left panel + empty right panel `<div className="flex-1">`. Story 2.2 creates a sibling route `clientes.$clienteId.tsx` that also renders left panel + detail right panel.
- `retry: false` on the shared `queryClient.ts` (or `retryOnMount: false` on `useClientes`) was set for tests — for `useCliente`, use `retry: 2` at the hook level; tests should create their own QueryClient with `retry: false`.

### Testing Standards

**Backend (xUnit):**
- Pattern: Arrange / Act / Assert
- Coverage target: > 80% for new code
- `GetClienteByIdQueryHandlerTests.cs`: use mock `IClienteRepository` (Moq or NSubstitute) OR EF Core InMemory
- Test: existing ID → returns correct `ClienteDto`
- Test: non-existing ID → returns `null`

**Frontend (Vitest + RTL + MSW):**
- MSW intercepts `GET /api/v1/clientes/:id` — test 200 success, 404 not found, 500 error
- RTL: test placeholder state, loading skeleton, 404 message, error panel retry, populated detail
- Axe accessibility check on `ClienteDetailView` — must pass WCAG 2.1 AA

### Design System Constraints

- Brand primary color: `#0e79fd` (Siesa Blue) — use for interactive elements and selected state highlight
- Neutrals: Tailwind `slate-*` scale (labels: `slate-500`, values: `slate-900`)
- Font: Inter (Light 300, Regular 400, Bold 700)
- Dark mode: class-based (`dark:` prefix)
- Loading: `react-loading-skeleton` — skeleton screens, NOT spinners
- Icons: Heroicons (primary), Font Awesome 6.5+ (secondary)
- All user-facing text in **Spanish**

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story-2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-Boundaries]
- [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev-Notes]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend-Stack]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend-Stack]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database-Conventions]
- [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
