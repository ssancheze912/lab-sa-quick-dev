# Story 2.2: Client Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed **When** the user clicks on a client item **Then** the right panel renders the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking) — no full page reload.

2. **Given** the user accesses the URL `/clientes/:clienteId` directly (deep link) **When** the page loads **Then** the correct client details are loaded via `GET /api/v1/clientes/{id}` and displayed in the right panel **And** the client list on the left is also loaded (FR30).

3. **Given** a `clienteId` in the URL does not exist in the system **When** the page loads **Then** a not-found message is displayed gracefully in the right panel **And** no JavaScript error is thrown **And** the navigation shell remains visible.

4. **Given** the user is on the detail view at `/clientes/:clienteId` **When** the backend returns a network error for `GET /api/v1/clientes/{id}` **Then** an error state message with a retry option is shown in the right panel (not a blank screen).

5. **Given** a client is selected **When** its details are loading **Then** skeleton placeholders are shown in the right panel (not a spinner) using `react-loading-skeleton`.

## Tasks / Subtasks

### Backend

- [ ] Task 1 — Create `GetClienteByIdQuery` + Handler in Application layer (AC: #1, #2, #3) 
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` (record with `Guid Id`)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  - [ ] Handler calls `IClienteRepository.GetByIdAsync(query.Id, ct)`
  - [ ] If result is `null`, return `null` (caller endpoint handles 404)
  - [ ] Map entity to `ClienteDto` and return
  - [ ] Return type: `ClienteDto?`

- [ ] Task 2 — Add `GetByIdAsync` to `IClienteRepository` if not already present (AC: #2)
  - [ ] Open `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Verify `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` exists — add if missing (it was defined in Story 2.1 Task 2 but may not yet be implemented on the repository)
  - [ ] Open `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
  - [ ] Verify `GetByIdAsync` implementation: `return await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)` — add if missing

- [ ] Task 3 — Register `GetClienteByIdQueryHandler` and add `GET /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [ ] Register `GetClienteByIdQueryHandler` (scoped) in `backend/src/SiesaAgents.API/Program.cs`
  - [ ] Open `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Add: `app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) => { var result = await handler.Handle(new GetClienteByIdQuery(id), ct); return result is null ? Results.NotFound() : Results.Ok(result); })`
  - [ ] 404 response body: `Results.Problem(statusCode: 404, title: "Cliente no encontrado", detail: $"No existe un cliente con ID {id}.")` — Problem Details RFC 7807 format
  - [ ] Response on found: direct object, no wrapper — `ClienteDto` serialized to camelCase JSON

- [ ] Task 4 — Backend unit test: `GetClienteByIdQueryHandler` (AC: #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
  - [ ] Test: repository returns entity → handler returns `ClienteDto` with correct field mapping
  - [ ] Test: repository returns `null` → handler returns `null`
  - [ ] Use NSubstitute/Moq for `IClienteRepository`
  - [ ] Structure: Arrange / Act / Assert

- [ ] Task 5 — Backend integration test: `GET /api/v1/clientes/{id}` (AC: #2, #3) — TC-E2-P1-02, TC-E2-P1-03
  - [ ] Open `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs`
  - [ ] TC-E2-P1-02: Seed client with known UUID → `GET /api/v1/clientes/{id}` → 200 + exact `id`, `nombre`, `nit`, `telefono`, `ciudad` fields match
  - [ ] TC-E2-P1-03: `GET /api/v1/clientes/00000000-0000-0000-0000-000000000001` (valid UUID not seeded) → 404 + `Content-Type: application/problem+json` + body has `status: 404`, `title`, `detail`
  - [ ] Use `WebApplicationFactory<Program>` consistent with existing test class structure

### Frontend

- [ ] Task 6 — Create `useCliente` hook (single client by ID) in Application layer (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - [ ] Use `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`
  - [ ] Export: `{ data, isLoading, isError, refetch }`
  - [ ] `id` parameter type: `string | undefined`
  - [ ] When `id` is `undefined` or empty string, query is disabled (`enabled: !!id`)

- [ ] Task 7 — Add `getById` method to `clienteApiRepository` (AC: #2)
  - [ ] Open `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Add method: `getById(id: string): Promise<Cliente>` — calls `GET /api/v1/clientes/{id}` via `apiClient`
  - [ ] If server returns 404, Axios throws — the hook's `isError` flag handles the UI state
  - [ ] Also update `IClienteRepository` interface in `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` to include `getById(id: string): Promise<Cliente>`

- [ ] Task 8 — Create `ClienteDetailView` presentation component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [ ] Props: none (reads `clienteId` from TanStack Router URL param via `useParams()`)
  - [ ] Import `useCliente` and call with the `clienteId` from URL params
  - [ ] **Loading state** (`isLoading`): render skeleton using `react-loading-skeleton` — NOT a spinner (company standard)
    - [ ] Skeleton structure: title skeleton (h2-sized), 4 field-value skeletons
  - [ ] **Error state** (`isError`): detect if 404 (client not found) vs. network error
    - [ ] 404 detection: check `error.response?.status === 404` (Axios error) — render not-found message: `"Cliente no encontrado"` paragraph + navigation hint
    - [ ] Network error (non-404): render retry panel with "Reintentar" button calling `refetch()`
  - [ ] **Success state** (`data`): render detail fields
    - [ ] Display: Nombre (heading), NIT/RUC, Teléfono, Ciudad — all labeled in Spanish
    - [ ] Layout: right panel, flex column, padding `p-6`, `overflow-y-auto`
    - [ ] Field label style: `text-sm font-medium text-slate-500`
    - [ ] Field value style: `text-base text-slate-900`
  - [ ] **Empty state** (no `clienteId` in URL, i.e., user is at `/clientes`): render placeholder: `"Selecciona un cliente para ver su detalle"` centered text in `slate-400`
  - [ ] WCAG 2.1 AA: all semantic HTML (`<dl>`, `<dt>`, `<dd>` pattern for field/value pairs), `aria-label` on retry button

- [ ] Task 9 — Update route `_app/clientes.$clienteId.tsx` to render `ClienteDetailView` (AC: #1, #2, #3)
  - [ ] Open `frontend/src/routes/_app/clientes.$clienteId.tsx` (created as placeholder in Story 2.1)
  - [ ] Replace placeholder content with `<ClienteDetailView />`
  - [ ] TanStack Router automatically provides `$clienteId` via `useParams()` — no additional props needed
  - [ ] Ensure route file exports a `Route` object created with `createFileRoute('/clientes/$clienteId')`

- [ ] Task 10 — Update `ClienteListView` to navigate on item click (AC: #1)
  - [ ] Open `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [ ] In each `<ClientListItem>` `onClick` handler: call TanStack Router `navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })`
  - [ ] Use `useNavigate` from `@tanstack/react-router`
  - [ ] `isSelected` prop on `<ClientListItem>`: compare `c.id` with the current URL `clienteId` param (use `useParams()` — returns `undefined` when at `/clientes`)
  - [ ] Selected item gets visual highlight: `bg-blue-50 border-l-2 border-primary` (Siesa blue `#0e79fd`)

- [ ] Task 11 — Frontend component tests: `ClienteDetailView` (AC: #1–#5) — TC-E2-P1-11, TC-E2-P1-12
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
  - [ ] TC-E2-P1-11 (list click → detail + URL update): Render split-panel layout at `/clientes` with 2 clients; click first client → assert detail panel renders `nombre`, `nit`, `telefono`, `ciudad`; assert URL is `/clientes/{clienteId}`
  - [ ] TC-E2-P1-12 (not-found on invalid deep link): Render router at `/clientes/non-existent-id`; MSW returns 404 for `GET /api/v1/clientes/non-existent-id`; assert not-found message renders; assert no JS error
  - [ ] Test: loading state → skeleton placeholders present in DOM
  - [ ] Test: network error (non-404) → retry button renders; click → `refetch()` called
  - [ ] Test: no `clienteId` in URL (at `/clientes`) → placeholder "Selecciona un cliente" text visible
  - [ ] Wrap in `QueryClientProvider` + TanStack Router test utilities
  - [ ] MSW handlers: add `GET /api/v1/clientes/:id` handler to `frontend/src/__mocks__/handlers/clientes.ts`

- [ ] Task 12 — Frontend unit test: `useCliente` hook (AC: #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
  - [ ] Test: `enabled: false` when `id` is `undefined` — no API call made
  - [ ] Test: `id` provided → query enabled → MSW returns client → `data` populated
  - [ ] Test: MSW returns 404 → `isError: true`
  - [ ] Use `renderHook` from `@testing-library/react` wrapped in `QueryClientProvider`

## Dev Notes

### Architecture Context

Story 2.2 is **frontend-focused** with minimal backend additions. It completes the split-panel experience started in Story 2.1 by:
- Implementing `GET /api/v1/clientes/{id}` endpoint (backend, may only need handler registration — repo method exists from Story 2.1)
- Implementing `ClienteDetailView` component (right panel, full height flex)
- Wiring `ClienteListView` item clicks to TanStack Router navigation
- Deep linking: accessing `/clientes/:clienteId` directly loads the client from backend

**Story scope boundary:** Detail view is read-only. Edit and Delete actions (Editar / Eliminar buttons) belong to Stories 2.4 and 2.5 respectively. The ContactManager integration in the detail panel belongs to Epic 4. For this story, the detail panel shows only: Nombre, NIT/RUC, Teléfono, Ciudad + correct not-found + loading states.

### Backend — `GetClienteByIdQueryHandler` Pattern (MANDATORY)

```csharp
// GetClienteByIdQuery.cs
public record GetClienteByIdQuery(Guid Id);

// GetClienteByIdQueryHandler.cs
public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<ClienteDto?> Handle(GetClienteByIdQuery query, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;

        return new ClienteDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            NIT = entity.NIT,
            Telefono = entity.Telefono,
            Ciudad = entity.Ciudad,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
    }
}
```

### Backend — `GET /api/v1/clientes/{id}` Endpoint Pattern (MANDATORY)

```csharp
// ClienteEndpoints.cs — add inside MapClienteEndpoints()
app.MapGet("/api/v1/clientes/{id:guid}", async (
    Guid id,
    GetClienteByIdQueryHandler handler,
    CancellationToken ct) =>
{
    var result = await handler.Handle(new GetClienteByIdQuery(id), ct);
    return result is null
        ? Results.Problem(
            statusCode: 404,
            title: "Cliente no encontrado",
            detail: $"No existe un cliente con ID {id}.")
        : Results.Ok(result);
});
// Response on 200: direct ClienteDto object (camelCase JSON auto-serialized by .NET)
// Response on 404: application/problem+json with status, title, detail (NFR6 — no stack trace)
```

### Frontend — `useCliente` Hook Pattern

```typescript
// useCliente.ts
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

### Frontend — `clienteApiRepository.getById` Pattern

```typescript
// clienteApiRepository.ts — add to existing implementation
async getById(id: string): Promise<Cliente> {
  const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
  return response.data
}
// Axios throws on 404 — the error bubbles to useQuery's isError state
// DO NOT catch 404 here; let the component distinguish by inspecting error.response?.status
```

### Frontend — `ClienteDetailView` Component Pattern

```tsx
// ClienteDetailView.tsx
import { useParams } from '@tanstack/react-router'
import { useCliente } from '../application/useCliente'
import Skeleton from 'react-loading-skeleton'

export function ClienteDetailView() {
  const { clienteId } = useParams({ strict: false })
  const { data: cliente, isLoading, isError, error, refetch } = useCliente(clienteId)

  // No clienteId in URL — at /clientes root
  if (!clienteId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>Selecciona un cliente para ver su detalle</p>
      </div>
    )
  }

  // Loading — skeletons, NOT spinner (company standard)
  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4" aria-busy="true">
        <Skeleton height={28} width="60%" />
        <Skeleton count={4} height={20} />
      </div>
    )
  }

  // Error — distinguish 404 from network errors
  if (isError) {
    const is404 = (error as any)?.response?.status === 404
    if (is404) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-500">
          <p className="text-base font-medium">Cliente no encontrado</p>
          <p className="text-sm">El cliente solicitado no existe o fue eliminado.</p>
        </div>
      )
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-slate-500">No se pudo cargar el cliente.</p>
        <button
          onClick={() => refetch()}
          aria-label="Reintentar carga del cliente"
          className="text-sm text-blue-600 underline hover:text-blue-800"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Success — render detail fields
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-6">{cliente!.nombre}</h2>
      <dl className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-slate-500">NIT/RUC</dt>
          <dd className="text-base text-slate-900">{cliente!.nit}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Teléfono</dt>
          <dd className="text-base text-slate-900">{cliente!.telefono}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Ciudad</dt>
          <dd className="text-base text-slate-900">{cliente!.ciudad}</dd>
        </div>
      </dl>
    </div>
  )
}
```

### Frontend — `ClienteListView` Navigation Update Pattern

```tsx
// ClienteListView.tsx — update onClick handler and isSelected
import { useNavigate, useParams } from '@tanstack/react-router'

export function ClienteListView() {
  const navigate = useNavigate()
  const { clienteId: selectedId } = useParams({ strict: false })
  // ... existing hooks ...

  return (
    // ... existing layout ...
    <div className="flex-1 overflow-y-auto">
      {filtered.map((c) => (
        <ClientListItem
          key={c.id}
          cliente={c}
          isSelected={c.id === selectedId}
          onClick={() =>
            navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })
          }
        />
      ))}
    </div>
  )
}
```

### Frontend — Route File Pattern (`clientes.$clienteId.tsx`)

```tsx
// frontend/src/routes/_app/clientes.$clienteId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailView,
})
```

### TanStack Router — URL Param Deep Linking

The route `_app/clientes.$clienteId.tsx` uses `$clienteId` (dollar prefix = dynamic param). When navigating to `/clientes/some-uuid`, TanStack Router renders the `_app/clientes.tsx` layout (containing `ClienteListView` + `<Outlet />`) AND `_app/clientes.$clienteId.tsx` (containing `ClienteDetailView`) inside the outlet. This split-panel layout works automatically because `clientes.tsx` renders `<Outlet />` for the right panel.

Direct URL access (`/clientes/:id`) triggers a full data load — `ClienteListView` fetches the list AND `ClienteDetailView` fetches the single client independently via their respective TanStack Query hooks.

### UI Implementation Requirements (MANDATORY)

- **UI Library**: `siesa-ui-kit` — check catalog for any `DetailPanel`, `DefinitionList`, or `NotFound` equivalent before creating custom components
- **Fallback**: `shadcn/ui` (via MCP) → custom (last resort)
- **Loading**: `react-loading-skeleton` (skeleton screens, NOT spinners per company standard)
- **Icons**: Heroicons — if a "not found" or "empty" icon is needed, use `UserIcon` or `InformationCircleIcon` in `slate-300`
- All user-facing text MUST be in Spanish: labels, messages, ARIA attributes, button text
- Code (variables, functions, TypeScript types) MUST be in English

### State Management for This Story

- `clienteId`: comes from URL via `useParams()` — NOT stored in Zustand or React state
- Single-client server data: `useQuery({ queryKey: ['clientes', id] })` — TanStack Query manages cache
- No local `useState` additions needed in this story beyond what Story 2.1 introduced

### Error Type Discrimination (404 vs. network)

In `ClienteDetailView`, the error returned by TanStack Query is an Axios error when the backend returns 4xx/5xx:

```typescript
import axios from 'axios'

const is404 = axios.isAxiosError(error) && error.response?.status === 404
```

Use `axios.isAxiosError()` guard — do NOT cast to `any` (TypeScript strict mode, no `any` allowed per company standard).

### Testing Strategy for This Story

Tests specifically required for Story 2.2:

| Test ID | Level | Focus | Phase |
|---------|-------|-------|-------|
| TC-E2-P1-02 | API Integration | GET /clientes/{id} → 200 + correct data | Phase 2 |
| TC-E2-P1-03 | API Integration | GET /clientes/{non-existent-id} → 404 Problem Details | Phase 2 |
| TC-E2-P1-11 | Component | List click → detail panel renders + URL updates | Phase 4 |
| TC-E2-P1-12 | Component | Not-found message on invalid deep link | Phase 4 |
| TC-E2-P2-02 | E2E | Deep link `/clientes/:id` → detail renders (Playwright) | Phase 6 |

### Project Structure Notes

Files to create/modify:

```
frontend/src/
  modules/crm/clientes/
    domain/
      IClienteRepository.ts              ← MODIFY (add getById method signature)
    application/
      useCliente.ts                      ← CREATE
      useCliente.test.ts                 ← CREATE
    infrastructure/
      clienteApiRepository.ts            ← MODIFY (add getById method)
    presentation/
      ClienteDetailView.tsx              ← CREATE
      ClienteDetailView.test.tsx         ← CREATE
      ClienteListView.tsx                ← MODIFY (add navigation onClick + isSelected logic)
  routes/_app/
    clientes.$clienteId.tsx             ← MODIFY (replace placeholder with ClienteDetailView)
  __mocks__/handlers/
    clientes.ts                         ← MODIFY (add GET /api/v1/clientes/:id MSW handler)

backend/src/
  SiesaAgents.Application/Clientes/
    Queries/
      GetClienteByIdQuery.cs             ← CREATE
      GetClienteByIdQueryHandler.cs      ← CREATE
  SiesaAgents.Infrastructure/
    Repositories/
      ClienteRepository.cs              ← VERIFY GetByIdAsync exists (may already be done in Story 2.1)
  SiesaAgents.API/
    Endpoints/ClienteEndpoints.cs       ← MODIFY (add GET /api/v1/clientes/{id:guid} endpoint)
    Program.cs                          ← MODIFY (register GetClienteByIdQueryHandler)

backend/tests/
  SiesaAgents.UnitTests/Application/Clientes/
    GetClienteByIdQueryHandlerTests.cs   ← CREATE
  SiesaAgents.IntegrationTests/Clientes/
    ClienteEndpointsTests.cs            ← MODIFY (add TC-E2-P1-02 and TC-E2-P1-03)
```

No other existing files should be modified.

### Previous Story Learnings (from Story 2.1)

- Package manager is `pnpm` — NOT npm. All install commands: `pnpm add` / `pnpm add -D`
- `siesa-ui-kit/styles.css` must be imported in `main.tsx` (done in Story 1.1/1.2) — do NOT re-import
- `AppDbContext` has `ApplySnakeCaseNaming()` as last call in `OnModelCreating` — do NOT add it again
- `ExceptionHandlingMiddleware` is registered first in the pipeline (Story 1.3) — all unhandled exceptions already return Problem Details RFC 7807
- Backend root: `backend/`, frontend root: `frontend/` — all paths relative to their roots
- TanStack Router auto-generates `routeTree.gen.ts` — do NOT manually edit it
- TypeScript strict mode — no `any` types. Use `axios.isAxiosError()` guard for error type checking
- TailwindCSS v4 — use `@import "tailwindcss"` in CSS, NOT `tailwind.config.js`
- `IClienteRepository.GetByIdAsync` was defined in Story 2.1 (Task 2) — verify implementation exists in `ClienteRepository.cs` before recreating

### Git History Context

Recent commits show:
- `fix(tests-2.1)`: test review corrections applied to E2E and integration tests
- `fix(story-2.1)`: code review corrections applied (DI registration, route placeholder, ClienteListView fixes)
- Story 2.1 is `done` — backend infrastructure (entity, repo, endpoint) and frontend (list view, hooks, MSW handlers) are in place

### References

- Story 2.2 AC from epic: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2`]
- `GET /api/v1/clientes/{id}` endpoint in API contract: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- `['clientes', id]` TanStack Query key: [Source: `_bmad-output/planning-artifacts/architecture.md#TanStack Query keys (canonical)`]
- `ClienteDetailView` named in directory structure: [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- `useCliente` hook named in directory structure: [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- `clientes.$clienteId.tsx` route file defined: [Source: `_bmad-output/planning-artifacts/architecture.md#Routing (TanStack Router file-based)`]
- Problem Details RFC 7807 for 404: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- `react-loading-skeleton` for loading (not spinners): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Loading States`]
- `axios.isAxiosError()` guard for error type: TypeScript strict + Axios patterns
- Test cases TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-11, TC-E2-P1-12, TC-E2-P2-02: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md`]
- FR30 deep linking requirement: [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- `<dl>/<dt>/<dd>` semantic HTML for field/value pairs: WCAG 2.1 AA compliance + architecture.md WCAG note

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
