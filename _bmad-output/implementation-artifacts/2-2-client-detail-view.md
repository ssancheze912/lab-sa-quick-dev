# Story 2.2: Client Detail View

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (deep link), **Then** the correct client details are loaded and displayed without requiring prior navigation (FR30).

3. **Given** a clienteId in the URL does not exist (non-existent UUID), **When** the page loads or the detail panel renders, **Then** a not-found message is displayed gracefully with no unhandled JS error.

## Tasks / Subtasks

- [x] Task 1 — Add `getById` to backend: Query + Endpoint (AC: #1, #2, #3)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record class query with `Guid Id` property
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — calls `IClienteRepository.GetByIdAsync(id)`, maps to `ClienteDto`; returns `null` if not found
  - [x] Verify `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` has `GetByIdAsync(Guid id): Task<ClienteEntity?>` — already existed from Story 2.1
  - [x] Verify `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implements `GetByIdAsync` using `AppDbContext.Clientes.FindAsync(id)` — already existed from Story 2.1
  - [x] Add `GET /api/v1/clientes/{id}` to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    - Handler calls `GetClienteByIdQueryHandler.HandleAsync(new GetClienteByIdQuery(id))`
    - Returns `Results.Ok(clienteDto)` on success (HTTP 200)
    - Returns `Results.NotFound(ProblemDetails { Status=404, Title="Cliente no encontrado", Detail="No existe un cliente con el ID especificado." })` when result is `null`

- [x] Task 2 — Extend frontend `IClienteRepository` and `clienteApiRepository` (AC: #2)
  - [x] Verify `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` has `getById(id: string): Promise<Cliente>` — already existed from Story 2.1
  - [x] Verify `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` implements `getById` calling `GET /api/v1/clientes/${id}` via `apiClient` — already existed from Story 2.1

- [x] Task 3 — Create `useCliente` TanStack Query hook (AC: #2)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    - `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`
    - Returns `{ data, isLoading, isError, error }`
    - Query key MUST be `['clientes', id]` (canonical from architecture)

- [x] Task 4 — Create `ClienteDetailView` presentation component (AC: #1, #2, #3)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Accepts `clienteId: string` prop
    - Calls `useCliente(clienteId)` internally
    - Loading state: skeleton placeholders using `react-loading-skeleton` (NOT a spinner)
    - Error state (fetch failed): `<ErrorPanel onRetry={refetch} />` (reuse existing shared component)
    - Not-found state (404 from API): renders a not-found message — "No se encontró el cliente solicitado." with a back affordance
    - Success state: displays all 4 fields in a structured panel:
      - **Nombre**: shown prominently (heading or large text)
      - **NIT/RUC**: labeled "NIT/RUC"
      - **Teléfono**: labeled "Teléfono"
      - **Ciudad**: labeled "Ciudad"
    - siesa-ui-kit checked — no `DetailPanel`/`Card`/`DescriptionList` available; used custom TailwindCSS with `<dl>` semantic markup
    - All UI text in Spanish (labels, loading text, error messages)
    - WCAG 2.1 AA: `aria-label="Detalle del cliente"` on section, `<dl>` + `<dt>`/`<dd>` semantic markup, dark mode classes

- [x] Task 5 — Create/update route `clientes.$clienteId.tsx` (AC: #1, #2)
  - [x] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`:
    - TanStack Router dynamic route for `/clientes/:clienteId`
    - Uses `Route.useParams()` to extract `clienteId`
    - Renders `<ClienteDetailView clienteId={clienteId} />` in the right panel area
    - No TanStack Router loader — data fetching delegated to `useCliente` hook
  - [x] Update `frontend/src/routes/_app/clientes.tsx`:
    - Replaced placeholder `<div>` with `<Outlet />` for nested route rendering
    - Left panel (`ClienteListView`) remains mounted in `<aside>` while right panel shows detail

- [x] Task 6 — Update `ClienteListView` to use TanStack Router Link (AC: #1)
  - [x] Update `frontend/src/shared/components/ClientListItem.tsx`:
    - Replaced `<a href>` with `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>`
    - Added `activeProps` with `bg-blue-50 border-l-2 border-[#0e79fd]` active styling
    - WCAG: `aria-current="page"` added via `activeProps`

- [x] Task 7 — Write tests for Story 2.2 (AC: #1, #2, #3)
  - [x] **Backend — API Integration (xUnit):**
    - `TC-E2-P1-07` (backend): Seed 1 client → GET `/api/v1/clientes/{id}` → assert HTTP 200 with correct fields
    - `TC-E2-P2-08`: GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000` → assert HTTP 404 with `Content-Type: application/problem+json` and `status: 404`
    - File: `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (extended)
  - [x] **Frontend — Component (Vitest + RTL + MSW):**
    - `TC-E2-P1-07` (frontend): MSW returns full client → Nombre, NIT/RUC, Teléfono, Ciudad all visible
    - `TC-E2-P1-09`: MSW returns 404 → not-found message visible, no JS error
    - Skeleton loading test: content renders after response
    - File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
  - [x] Test structure: Arrange / Act / Assert

## Dev Notes

### Architecture Layer Mapping

```
Story 2.2 touches BOTH frontend and backend:

Frontend (Clean Architecture):
  domain/          → IClienteRepository.ts (extend getById — may already exist)
  application/     → useCliente.ts (new)
  infrastructure/  → clienteApiRepository.ts (extend getById — may already exist)
  presentation/    → ClienteDetailView.tsx (new)
                   → ClienteListView.tsx (update Link)
                   → ClientListItem.tsx (update Link)
  routes/          → _app/clientes.$clienteId.tsx (new dynamic route)
                   → _app/clientes.tsx (add <Outlet />, update split-panel)

Backend (Clean Architecture):
  Application/     → GetClienteByIdQuery.cs (new), GetClienteByIdQueryHandler.cs (new)
  Domain/          → IClienteRepository.cs (verify/add GetByIdAsync)
  Infrastructure/  → ClienteRepository.cs (verify/add GetByIdAsync implementation)
  API/             → ClienteEndpoints.cs (add GET /api/v1/clientes/{id})
```

### Backend — GetClienteByIdQueryHandler Pattern (MANDATORY)

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
        var cliente = await _repository.GetByIdAsync(query.Id);
        if (cliente is null) return null;

        return new ClienteDto
        {
            Id = cliente.Id,
            Nombre = cliente.Nombre,
            NitRuc = cliente.Nit,
            Telefono = cliente.Telefono,
            Ciudad = cliente.Ciudad,
            CreatedAt = cliente.CreatedAt
        };
    }
}
```

### Backend — GET /api/v1/clientes/{id} Endpoint Pattern (MANDATORY)

```csharp
// Add to backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
{
    var result = await handler.HandleAsync(new GetClienteByIdQuery(id));
    if (result is null)
    {
        return Results.Problem(
            statusCode: 404,
            title: "Cliente no encontrado",
            detail: "No existe un cliente con el ID especificado."
        );
    }
    return Results.Ok(result);
});
```

### Backend — IClienteRepository Extension (verify/add)

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
Task<ClienteEntity?> GetByIdAsync(Guid id);
```

```csharp
// backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
public async Task<ClienteEntity?> GetByIdAsync(Guid id)
{
    return await _context.Clientes.FindAsync(id);
}
```

### Frontend — `useCliente` Hook Pattern (MANDATORY)

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export const useCliente = (id: string) => {
  return useQuery({
    queryKey: ['clientes', id],   // CANONICAL — must match exactly for cache sharing with mutations
    queryFn: () => clienteApiRepository.getById(id),
    enabled: !!id,
    retry: (failureCount, error: any) => {
      // Do not retry on 404
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
};
```

### Frontend — Not-Found Detection Pattern

The `clienteApiRepository.getById` must throw (or let Axios throw) on 404 so `useCliente` enters error state. In `ClienteDetailView`, detect 404 specifically:

```typescript
// Inside ClienteDetailView.tsx
const { data, isLoading, isError, error, refetch } = useCliente(clienteId);

const isNotFound = isError && (error as any)?.response?.status === 404;

if (isLoading) return <ClienteDetailSkeleton />;
if (isNotFound) return <NotFoundMessage />;
if (isError) return <ErrorPanel onRetry={refetch} />;
```

### Frontend — TanStack Router Dynamic Route (MANDATORY)

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

### Frontend — Clientes Route Update (split-panel with Outlet)

```typescript
// frontend/src/routes/_app/clientes.tsx — update to include <Outlet />
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
});

function ClientesLayout() {
  return (
    <div className="flex h-full">
      {/* Left panel — 280px fixed */}
      <aside className="w-[280px] shrink-0 border-r border-slate-200 overflow-y-auto">
        <ClienteListView />
      </aside>
      {/* Right panel — flex remainder */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />  {/* Renders ClienteDetailView when /clientes/:clienteId is active */}
      </main>
    </div>
  );
}
```

### Frontend — `ClientListItem` Link Update (MANDATORY)

```typescript
// Replace <a href> with TanStack Router <Link> in ClientListItem.tsx
import { Link } from '@tanstack/react-router';

// Inside render:
<Link
  to="/clientes/$clienteId"
  params={{ clienteId: cliente.id }}
  activeProps={{ className: 'bg-blue-50 border-l-2 border-[#0e79fd]' }}
  aria-current="page"  // added by activeProps handler or conditionally
  className="flex flex-col px-4 py-3 hover:bg-slate-50 cursor-pointer"
>
  <span className="font-medium text-slate-900 truncate">{cliente.nombre}</span>
  <span className="text-sm text-slate-500 truncate">{cliente.nitRuc}</span>
</Link>
```

### Frontend — `ClienteDetailView` UI Structure (MANDATORY)

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx (structure)
// Check siesa-ui-kit for DetailPanel/Card first; if unavailable, use this pattern:
<section aria-label="Detalle del cliente" className="max-w-xl">
  <h2 className="text-xl font-bold text-slate-900 mb-4">{data.nombre}</h2>
  <dl className="space-y-3">
    <div>
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
      <dd className="text-sm text-slate-800 mt-0.5">{data.nitRuc}</dd>
    </div>
    <div>
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Teléfono</dt>
      <dd className="text-sm text-slate-800 mt-0.5">{data.telefono}</dd>
    </div>
    <div>
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ciudad</dt>
      <dd className="text-sm text-slate-800 mt-0.5">{data.ciudad}</dd>
    </div>
  </dl>
</section>
```

### MasterCrud Applicability Note

MasterCrud is NOT applicable to this story. Story 2.2 is a read-only detail view within a split-panel layout — it does not involve a data grid, bulk CRUD orchestration, or form-based creation/editing. The `ClienteDetailView` is a custom presentation component using `useCliente` (TanStack Query) and `<dl>` semantic markup. MasterCrud will be evaluated for stories 2.3–2.4 (create/edit form flows).

### UI Implementation Requirements (MANDATORY)

- **Primary UI source**: check `siesa-ui-kit` catalog FIRST for `Card`, `DetailPanel`, `DescriptionList`, or equivalent read-only detail components — use if available
- **Secondary**: shadcn/ui (install via MCP tool — do NOT use npm directly)
- **Tertiary**: custom TailwindCSS components (use `<dl>` + `<dt>`/`<dd>` for field-value pairs)
- **Styling**: TailwindCSS v4 — use `slate-*` scale for neutrals; primary color `#0e79fd` (Siesa Blue)
- **Icons**: Heroicons (primary); Font Awesome 6.5+ (secondary)
- **Loading skeletons**: `react-loading-skeleton` — skeleton screens, NOT spinners
- **Spanish UI text** (MANDATORY): all labels ("NIT/RUC", "Teléfono", "Ciudad"), error messages ("No se encontró el cliente solicitado."), aria-labels ("Detalle del cliente")
- **Dark mode**: class-based `dark:` TailwindCSS classes on all elements
- **WCAG 2.1 AA**: `aria-label="Detalle del cliente"` on the section, `<dl>` semantic markup, keyboard-accessible link highlighting in `ClientListItem`

### TanStack Query Keys — Canonical Reference (CRITICAL)

```typescript
['clientes']           // list — used by useClientes (Story 2.1) and invalidated by all mutations
['clientes', id]       // single — used by useCliente (this story)
```

Both keys are derived from architecture.md. Mutations in Stories 2.3–2.5 MUST invalidate `['clientes']`; the single-item key `['clientes', id]` will be automatically invalidated when the list key is invalidated via TanStack Query's hierarchical invalidation.

### API Response Shape for GET /api/v1/clientes/{id}

```json
// HTTP 200 — success
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Ejemplo S.A.S.",
  "nitRuc": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-17T14:30:00Z"
}

// HTTP 404 — not found (Problem Details RFC 7807)
{
  "status": 404,
  "title": "Cliente no encontrado",
  "detail": "No existe un cliente con el ID especificado.",
  "type": "https://tools.ietf.org/html/rfc7807"
}
```

### Default State When No Client Selected

When the user is at `/clientes` (no clienteId in URL), the right panel renders via `<Outlet />`. TanStack Router renders nothing in the outlet when no child route is active. The right panel `<main>` will show empty space. If a visual placeholder is needed, add an index route at `/clientes` (index.tsx) that renders an `<EmptyDetailPanel />` component with text "Selecciona un cliente para ver sus detalles." — this is optional but recommended for UX clarity.

### Previous Story Learnings (from Story 2.1)

- `apiClient.ts` Axios singleton at `frontend/src/shared/lib/apiClient.ts` already exists — import from there, do NOT create a new instance.
- `EmptyState` and `ErrorPanel` shared components already created in Story 2.1 at `frontend/src/shared/components/`.
- `ClientListItem.tsx` already exists — this story updates it to use TanStack Router `<Link>` instead of `<a href>`.
- dotnet CLI (`dotnet ef`) may not be available in the environment — plan accordingly if migrations are needed (none required for this story, which only reads data).
- `TreatWarningsAsErrors = true` in all `.csproj` files — zero compiler warnings allowed.
- `Nullable` is enabled — use nullable reference type annotations (`ClienteEntity?`, `ClienteDto?`).
- EF Core `FindAsync` is preferred over `FirstOrDefaultAsync` when looking up by primary key — it uses the EF Core identity map/cache.
- Commit convention: `feat(story-2-2): <description>` (lowercase, hyphenated story reference).

### Git History Context

Recent commits (reference for naming convention):
- `feat(story-2-1): implement client list view with real-time search`
- `docs(epic-2): add test design for Client Management (33 test cases, P0-P3)`
- `docs(epic-1): add final report and mark epic-1 done in sprint-status`
- `fix(story-1.3): apply test review corrections`

Use convention: `feat(story-2-2): <description>` for implementation commits.

### Test Cases for This Story

From `test-design-epic-2.md`, the following test cases are scoped to Story 2.2:

| Test ID | Level | Description | Priority |
|---------|-------|-------------|----------|
| TC-E2-P1-07 | Component + API Integration | Click client → right panel shows all 4 fields; URL updates to /clientes/:id | P1 |
| TC-E2-P1-08 | E2E (Playwright) | Direct navigation to /clientes/:clienteId loads correct client details | P1 |
| TC-E2-P1-09 | Component | Non-existent clienteId shows not-found message, no JS error | P1 |
| TC-E2-P2-08 | API Integration | GET /api/v1/clientes/:id with non-existent UUID → HTTP 404 Problem Details | P2 |

### Critical Anti-Patterns to Avoid

```
❌ DateTime in backend entities/DTOs     → Use DateTimeOffset
❌ Swagger registration                  → Use Scalar (already configured)
❌ String queryKey                       → Array ['clientes', id] (mandatory)
❌ English UI text                       → Spanish (mandatory)
❌ Stack traces exposed via 404          → Problem Details RFC 7807 only
❌ <a href> for client list items        → TanStack Router <Link> (required for Story 2.2)
❌ Spinner for loading state             → react-loading-skeleton skeleton screens
❌ Custom UI before siesa-ui-kit check  → Check siesa-ui-kit catalog first
❌ throw on 404 without catching         → Detect error.response.status === 404 explicitly
❌ TanStack Router loader for data fetch → Component-level useCliente hook (simpler, no loader needed)
❌ Manual [Column]/[Table] attributes    → ApplySnakeCaseNaming() handles all naming
❌ retry on 404 errors                   → Disable retry for 404 in useCliente (avoid infinite retries)
```

### Project Structure Notes

- This story extends the `clientes` module created in Story 2.1.
- Story 2.1 used `<a href>` as a placeholder for list item navigation — this story replaces it with the real TanStack Router `<Link>`.
- The split-panel layout (`clientes.tsx`) must be updated to include `<Outlet />` so nested routes render in the right panel.
- Story 2.3 (Create Client) will add a "Nuevo cliente" button to the `ClienteDetailView` or the header area — leave room for it in the layout.
- Story 2.4 (Edit Client) will add an "Editar" button to `ClienteDetailView` — it is expected to live within this component.
- Story 2.5 (Delete Client) will add an "Eliminar" button to `ClienteDetailView` — plan the component structure for these future buttons.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Architecture — Routing: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — TanStack Query keys: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Architecture — API endpoints: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Complete project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Naming patterns: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Story 2.1 learnings: [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- Company standards — Frontend stack: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- Company standards — Backend stack: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- Company standards — TanStack Router prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Test cases for Story 2.2: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09, TC-E2-P2-08]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- siesa-ui-kit catalog checked: only `FormCacheSelector` component exists; no `DetailPanel`, `Card`, or `DescriptionList` — proceeded with custom TailwindCSS + `<dl>` semantic markup per story spec.
- `IClienteRepository.cs` and `ClienteRepository.cs` both already had `GetByIdAsync` from Story 2.1 — verified, no changes needed.
- `IClienteRepository.ts` and `clienteApiRepository.ts` both already had `getById` from Story 2.1 — verified, no changes needed.
- `ClienteListView.test.tsx` (Story 2.1) required router wrapper update after `ClientListItem` was updated to use TanStack Router `<Link>` — added `RouterProvider` with `createMemoryHistory` to existing test.
- dotnet CLI not available in environment — backend tests authored but cannot be executed locally; integration test patterns verified against Story 2.1 `ClienteEndpointsTests.cs` structure.

### Completion Notes List

- All 7 tasks completed successfully.
- 105/105 frontend tests pass (9 test files).
- TypeScript: zero new errors in Story 2.2 files; 2 pre-existing unused import warnings in Story 2.1 test file unchanged.
- Backend: `GetClienteByIdQuery.cs`, `GetClienteByIdQueryHandler.cs` created; `ClienteEndpoints.cs` extended with GET by ID route; `Program.cs` updated with DI registration for `GetClienteByIdQueryHandler`.
- Frontend: `useCliente.ts`, `ClienteDetailView.tsx`, `clientes.$clienteId.tsx` created; `clientes.tsx` and `ClientListItem.tsx` updated; `ClienteDetailView.test.tsx` created with 6 tests.
- siesa-ui-kit compliance: checked catalog first, used custom TailwindCSS as fallback (no equivalent component found).
- WCAG 2.1 AA: `aria-label="Detalle del cliente"` on section, `<dl>/<dt>/<dd>` markup, `aria-current="page"` in active link.

### File List

**Created (Backend):**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`

**Modified (Backend):**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added GET `/api/v1/clientes/{id:guid}` endpoint
- `backend/src/SiesaAgents.API/Program.cs` — registered `GetClienteByIdQueryHandler` in DI
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` — added TC-E2-P1-07 and TC-E2-P2-08

**Created (Frontend):**
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`

**Modified (Frontend):**
- `frontend/src/routes/_app/clientes.tsx` — replaced placeholder div with `<Outlet />`, split-panel layout
- `frontend/src/shared/components/ClientListItem.tsx` — replaced `<a href>` with TanStack Router `<Link>`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — added router wrapper for TanStack Router `<Link>` compatibility
