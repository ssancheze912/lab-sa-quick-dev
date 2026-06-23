# Story 2.2: Client Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **AC1 (Detail panel on client selection):** Given the client list is displayed in the left panel, when the user clicks on a client item, then the right panel renders the complete client detail showing: Nombre, NIT/RUC, Teléfono, Ciudad, and the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **AC2 (Direct URL access — deep linking):** Given the user accesses `/clientes/:clienteId` directly (e.g., via bookmark or shared link), when the page loads, then the correct client details are fetched from `GET /api/v1/clientes/{id}` and displayed in the right panel, and the matching item in the left list is highlighted (FR30).

3. **AC3 (Not-found handling):** Given a `clienteId` in the URL does not correspond to any existing client, when `GET /api/v1/clientes/{id}` returns 404, then the right panel displays a graceful not-found message ("Cliente no encontrado.") instead of crashing or showing raw error data.

4. **AC4 (Loading skeleton on detail fetch):** Given the right panel is fetching a client by ID, when the request is in flight, then skeleton placeholders (via `react-loading-skeleton`) are displayed in the right panel — no spinner.

5. **AC5 (Error panel on fetch failure):** Given the backend is unavailable when the detail fetch runs, when the `GET /api/v1/clientes/{id}` request fails (non-404 error), then an `ErrorPanel` with a "Reintentar" button is displayed in the right panel, and clicking it re-triggers the query.

6. **AC6 (Default empty state — no client selected):** Given the user is on `/clientes` without a `clienteId` in the URL, when the page loads, then the right panel shows the default placeholder ("Selecciona un cliente de la lista") — the same state established in Story 2.1.

7. **AC7 (Backend endpoint GET /api/v1/clientes/{id}):** Given the frontend calls `GET /api/v1/clientes/{id}`, when the client exists, then the endpoint returns a JSON object `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }` with HTTP 200. When the client does not exist, it returns Problem Details RFC 7807 with HTTP 404.

8. **AC8 (Selected item highlighted in list):** Given a `clienteId` is active in the URL, when the left panel renders the client list, then the corresponding `ClientListItem` displays in the highlighted/active visual state (Siesa Blue accent `#0e79fd`).

9. **AC9 (Accessibility):** Given the detail panel is rendered, when the page is inspected, then the panel heading has an appropriate ARIA heading level and all fields have visible labels that screen readers can associate with their values.

## Tasks / Subtasks

- [ ] Task 1 — Backend: GetClienteById query (AC: 7)
  - [ ] 1.1 Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with property `Guid Id`.
  - [ ] 1.2 Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — inject `IClienteRepository`, call `GetByIdAsync(query.Id, ct)`. Return `ClienteDto` if found, `null` if not found.
  - [ ] 1.3 Verify `IClienteRepository` already declares `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` (established in Story 2.1 Task 1.2). If missing, add it.
  - [ ] 1.4 Verify `ClienteRepository.GetByIdAsync` implementation exists (established in Story 2.1 Task 2.4). If missing, implement: `_context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)` projected to `ClienteDto`. Return `null` if not found.
  - [ ] 1.5 Register `GetClienteByIdQueryHandler` as scoped in `Program.cs`.

- [ ] Task 2 — Backend: API endpoint GET /api/v1/clientes/{id} (AC: 7)
  - [ ] 2.1 Add `GET /{id}` route to `ClienteEndpoints.cs` inside `MapClienteEndpoints`. Inject `GetClienteByIdQueryHandler`. Call `handler.HandleAsync(new GetClienteByIdQuery(id), ct)`. Return `Results.Ok(cliente)` if found, `Results.NotFound(new { title = "Cliente no encontrado.", status = 404 })` if handler returns null.
  - [ ] 2.2 The not-found response must conform to Problem Details RFC 7807 shape: `{ type, title, status, detail }`. Leverage `ExceptionHandlingMiddleware` if applicable, or return inline Problem Details.

- [ ] Task 3 — Frontend: Domain layer — useCliente hook (AC: 1, 2, 4, 5)
  - [ ] 3.1 Create `frontend/src/modules/crm/clientes/application/useCliente.ts` — TanStack Query hook: `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`. Expose `data`, `isLoading`, `isError`, `error`, `refetch`.
  - [ ] 3.2 Add `getById(id: string): Promise<Cliente>` method to `IClienteRepository` interface at `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`.
  - [ ] 3.3 Implement `getById(id: string)` in `clienteApiRepository.ts`: `GET /api/v1/clientes/{id}` via Axios. Throw on non-2xx (Axios does this by default). If backend returns 404, the caught error should allow the component to distinguish not-found from other errors — check `error.response?.status === 404`.

- [ ] Task 4 — Frontend: Presentation layer — ClienteDetailPanel component (AC: 1, 2, 3, 4, 5, 6, 8, 9)
  - [ ] 4.1 Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`. Props: `clienteId: string | undefined`. When `clienteId` is undefined, render the placeholder (`<DefaultDetailPlaceholder />`). Otherwise render the full detail flow.
  - [ ] 4.2 Internally call `useCliente(clienteId)` (enabled only when `clienteId` is defined).
  - [ ] 4.3 Loading state: when `isLoading === true`, render `<Skeleton count={4} height={28} />` from `react-loading-skeleton` inside the panel — no spinner.
  - [ ] 4.4 Error state (non-404): when `isError === true` and `error.response?.status !== 404`, render `<ErrorPanel message="No se pudo cargar el detalle del cliente." onRetry={refetch} />`.
  - [ ] 4.5 Not-found state (404): when `isError === true` and `error.response?.status === 404`, render a not-found message: "Cliente no encontrado." with a link or button to navigate back to `/clientes`.
  - [ ] 4.6 Detail state (success): when `data` is available, render the detail view with labeled fields: Nombre, NIT/RUC, Teléfono (display "—" when null), Ciudad (display "—" when null). Use `<dl>`, `<dt>`, `<dd>` for semantic definition list — this satisfies AC9 accessibility.
  - [ ] 4.7 Apply Tailwind CSS v4 styling: panel background `white`, text `slate-900` for values, `slate-500` for labels, border-left `border-l border-slate-200` separating from the list panel, `p-6` padding.
  - [ ] 4.8 Heading: `<h2>` with the client's Nombre as the heading text. Font: Inter Bold 700. Ensures ARIA heading level for AC9.

- [ ] Task 5 — Frontend: Shared component — DefaultDetailPlaceholder (AC: 6)
  - [ ] 5.1 Create or reuse `frontend/src/shared/components/DefaultDetailPlaceholder.tsx` — renders the centered message "Selecciona un cliente de la lista" with a subtle icon (Heroicons `UserIcon` or similar). Used in Story 2.1's right panel when no client is selected and in this story when `clienteId` is undefined.

- [ ] Task 6 — Frontend: Route integration and URL state (AC: 1, 2, 6, 8)
  - [ ] 6.1 Update `frontend/src/routes/_app/clientes.$clienteId.tsx` (TanStack Router dynamic segment `$clienteId`). This route file corresponds to `/clientes/:clienteId`. Import `ClienteDetailPanel`. Render the split-panel layout: left panel (`<ClienteListPanel selectedId={clienteId} onSelect={handleSelect} />`) + right panel (`<ClienteDetailPanel clienteId={clienteId} />`).
  - [ ] 6.2 The `handleSelect` function in `clientes.$clienteId.tsx`: navigate to `/clientes/${id}` using TanStack Router's `useNavigate()`.
  - [ ] 6.3 Update `frontend/src/routes/_app/clientes.tsx` (the `/clientes` base route from Story 2.1): the `onSelect` handler should navigate to `/clientes/${id}` so that clicking a client in the list transitions to `clientes.$clienteId.tsx` and updates the URL. The right panel on this base route renders `<DefaultDetailPlaceholder />`.
  - [ ] 6.4 Verify the `ClienteListPanel` highlights the active `selectedId` by comparing each item's `id` to the `selectedId` prop and applying the active class (Siesa Blue `#0e79fd` border-left or background accent).
  - [ ] 6.5 Confirm `_app.tsx` shell layout still provides `h-full` context for the split panel. No changes expected.

- [ ] Task 7 — Tests (AC: 1, 2, 3, 4, 5, 7)
  - [ ] 7.1 Create `frontend/src/modules/crm/clientes/application/useCliente.test.ts` — Vitest + MSW. Tests: on success returns `Cliente` object; on 404 `isError` is true and error status is 404; on network error `isError` is true with non-404 status; query is disabled when `id` is undefined.
  - [ ] 7.2 Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx` — RTL + MSW. Tests: renders `DefaultDetailPlaceholder` when `clienteId` is undefined; renders skeleton when loading; renders `ErrorPanel` on non-404 error; renders not-found message on 404; renders detail fields (Nombre, NIT, Teléfono, Ciudad) on success; renders "—" for null optional fields; `ErrorPanel` retry button re-triggers the query.
  - [ ] 7.3 Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — xUnit. Tests: returns `ClienteDto` when client exists; returns `null` when client does not exist. Use mock `IClienteRepository`. Arrange / Act / Assert.
  - [ ] 7.4 Add to `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (extend existing file from Story 2.1): `GET /api/v1/clientes/{id}` returns 200 with correct client object when client exists; returns 404 Problem Details when client not found.

## Dev Notes

### Architecture Context

This story extends the split-panel layout established in Story 2.1. The left panel (`ClienteListPanel`, 280px) is unchanged — the `selectedId` prop is now driven by the TanStack Router dynamic route param `$clienteId` instead of a URL search param. The right panel (`ClienteDetailPanel`, `flex-1`) renders the detail view when a `clienteId` is present in the URL.

**Routing Decision (CRITICAL):** Story 2.1 established `selectedClienteId` as a URL search param (`?clienteId=xxx`). Story 2.2 must transition to a **path-based dynamic segment** `/clientes/:clienteId` using TanStack Router's `$clienteId` file convention. This is the architecture.md canonical route for the detail view:
- `/clientes` → `_app/clientes.tsx` — list only, right panel shows `DefaultDetailPlaceholder`
- `/clientes/:clienteId` → `_app/clientes.$clienteId.tsx` — list + detail, right panel shows `ClienteDetailPanel`

Both routes render the full split panel (left list + right panel) to maintain layout continuity. No full-page navigation occurs — the left panel stays mounted.

**TanStack Query key:** `['clientes', id]` — matches the canonical key defined in architecture.md#Frontend Architecture.

**State management:** `clienteId` comes directly from the route param (`useParams()` or route loader) — no Zustand, no `useState`. URL is the single source of truth per company standards.

[Source: architecture.md#Frontend Architecture, architecture.md#State Boundaries]

### UI Implementation Requirements (MANDATORY)

- **Primary library**: `siesa-ui-kit` — check its catalog first for any applicable component before building custom. `ClienteDetailPanel` is likely a custom layout component (no direct siesa-ui-kit equivalent for a detail read-only panel).
- **Skeleton loading**: Use `react-loading-skeleton` — skeleton screens, NOT spinners.
- **All user-facing text in Spanish**: labels ("Nombre", "NIT/RUC", "Teléfono", "Ciudad"), messages ("Cliente no encontrado.", "Selecciona un cliente de la lista", "No se pudo cargar el detalle del cliente.", "Reintentar").
- **Siesa Blue**: `#0e79fd` for active/highlighted client item in the list.
- **Neutrals**: `slate-*` Tailwind scale for labels, borders, backgrounds.
- **Dark mode**: class-based (`dark:` Tailwind prefix).
- **Accessibility**: WCAG 2.1 AA — `<dl>/<dt>/<dd>` semantic structure for key-value fields, `<h2>` heading, `aria-label` for any ambiguous interactive elements.

[Source: company-standards.md#UX Design System, company-standards.md#Frontend Key Rules]

### Backend Pattern — GetClienteByIdQueryHandler

```csharp
// backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;

        return new ClienteDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            NIT = entity.NIT,
            Telefono = entity.Telefono,
            Ciudad = entity.Ciudad,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
```

[Source: architecture.md#Implementation Patterns, company-standards.md#Backend — CQRS Pattern]

### Backend Pattern — GET /api/v1/clientes/{id} Endpoint

```csharp
// Inside ClienteEndpoints.MapClienteEndpoints — add after the GET "/" route
group.MapGet("/{id:guid}", async (
    Guid id,
    GetClienteByIdQueryHandler handler,
    CancellationToken ct) =>
{
    var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
    return cliente is null
        ? Results.Problem(
            title: "Cliente no encontrado.",
            statusCode: StatusCodes.Status404NotFound,
            detail: $"No existe un cliente con id '{id}'.")
        : Results.Ok(cliente);
});
```

Response 200: `{ "id": "uuid", "nombre": "...", "nit": "...", "telefono": null, "ciudad": null, "createdAt": "...", "updatedAt": "..." }`
Response 404: Problem Details RFC 7807 `{ "type": "...", "title": "Cliente no encontrado.", "status": 404, "detail": "..." }`

[Source: architecture.md#API & Communication Patterns, architecture.md#Format Patterns]

### Frontend Hook Pattern

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
    retry: (failureCount, error) => {
      // Do not retry on 404 — client does not exist
      if ((error as any)?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}
```

```typescript
// Addition to frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
async getById(id: string): Promise<Cliente> {
  const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
  return response.data;
}
```

[Source: architecture.md#Frontend Architecture — TanStack Query keys]

### ClienteDetailPanel Structure

```
ClienteDetailPanel [flex-1 p-6 overflow-y-auto]
├── IF clienteId is undefined → <DefaultDetailPlaceholder />
├── IF isLoading → <Skeleton count={4} height={28} />
├── IF isError && status 404 → not-found message + back link
├── IF isError && other → <ErrorPanel message="..." onRetry={refetch} />
└── IF data → 
    ├── <h2>{data.nombre}</h2>
    └── <dl class="mt-4 space-y-3">
        ├── <dt>NIT/RUC</dt> <dd>{data.nit}</dd>
        ├── <dt>Teléfono</dt> <dd>{data.telefono ?? '—'}</dd>
        └── <dt>Ciudad</dt> <dd>{data.ciudad ?? '—'}</dd>
```

[Source: architecture.md#Component Boundaries (Frontend)]

### Route File Structure

```
frontend/src/routes/_app/
├── clientes.tsx              ← Existing (Story 2.1). Right panel: <DefaultDetailPlaceholder />.
│                               onSelect: navigate('/clientes/${id}')
└── clientes.$clienteId.tsx   ← NEW (this story). Uses useParams() for clienteId.
                                Left: <ClienteListPanel selectedId={clienteId} onSelect={navigate} />
                                Right: <ClienteDetailPanel clienteId={clienteId} />
```

TanStack Router file naming convention: `$` prefix creates a dynamic segment. The generated route path is `/clientes/:clienteId`. Use `useParams({ from: '/_app/clientes/$clienteId' })` to retrieve the param type-safely.

[Source: company-standards.md#TanStack Router Prefixes, architecture.md#Frontend Architecture — Routing]

### Project Structure Notes

**New files to create (frontend):**
```
frontend/src/modules/crm/clientes/application/useCliente.ts
frontend/src/modules/crm/clientes/application/useCliente.test.ts
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx
frontend/src/shared/components/DefaultDetailPlaceholder.tsx  (if not already created)
frontend/src/routes/_app/clientes.$clienteId.tsx              (NEW dynamic route)
```

**Files to modify (frontend):**
```
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts      ← Add getById()
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts ← Add getById()
frontend/src/routes/_app/clientes.tsx                               ← onSelect navigates to /clientes/${id}
```

**New files to create (backend):**
```
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs
```

**Files to modify (backend):**
```
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs   ← Add GET /{id:guid} route
backend/src/SiesaAgents.API/Program.cs                      ← Register GetClienteByIdQueryHandler
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs ← Extend with new GET /{id} tests
```

**Note:** `IClienteRepository.GetByIdAsync` and `ClienteRepository.GetByIdAsync` were specified in Story 2.1 (Task 1.2 and 2.4). Verify they exist before re-implementing.

### Previous Story Learnings

From Story 2.1 (Client List & Search):
- Split-panel layout is established: 280px left `ClienteListPanel` + `flex-1` right panel.
- `ClientListItem.tsx`, `EmptyState.tsx`, `ErrorPanel.tsx` are already in `frontend/src/shared/components/`.
- `useClientes()` hook at `frontend/src/modules/crm/clientes/application/useClientes.ts` uses queryKey `['clientes']`.
- `ClienteEntity`, `IClienteRepository`, `ClienteRepository`, `ClienteDto`, `GetClientesQuery/Handler`, `ClienteEndpoints` are all established.
- `selectedClienteId` was handled as a URL search param in Story 2.1 — Story 2.2 transitions this to a path-based dynamic segment (`/clientes/:clienteId`). Update `clientes.tsx` accordingly.
- Backend root: `backend/`, frontend root: `frontend/`.
- All `dotnet ef` commands need explicit `--project` and `--startup-project` flags.
- `useSnakeCaseNamingConvention()` must remain the last call in `OnModelCreating`.

From Story 1.2 (Frontend Shell):
- `frontend/src/shared/lib/apiClient.ts` (Axios singleton) exists — import from it.
- TanStack Router is configured with file-based routing under `frontend/src/routes/`.

### Anti-Patterns to Avoid

| Anti-pattern | Correct approach |
|---|---|
| `spinner` / `<CircularProgress>` on loading | `react-loading-skeleton` skeleton screens |
| English UI text ("Client not found.") | Spanish: "Cliente no encontrado." |
| Exposing `error.message` or stack trace to user | `<ErrorPanel>` with generic message |
| `useQuery({ enabled: true })` when no id | `enabled: !!id` prevents orphan queries |
| Retry on 404 | Set `retry` to return `false` when `status === 404` |
| `DateTime` in backend | `DateTimeOffset` |
| `app.UseSwagger()` | `app.MapScalarApiReference()` |
| `Results.NotFound(string)` | `Results.Problem(...)` — Problem Details RFC 7807 |
| `useState` for clienteId | TanStack Router path param — URL is source of truth |
| New HTTP fetch on list render | `useClientes()` result already cached; `useCliente(id)` adds per-item fetch only when needed |

[Source: architecture.md#Enforcement Guidelines — Anti-patterns, company-standards.md#Backend Critical Rules]

### References

- [Source: epic-02-gestion-de-clientes.md#Story 2.2] — User story, acceptance criteria, deep linking requirement (FR30)
- [Source: story-2-1-client-list-search.md] — Established split-panel layout, ClienteListPanel, shared components, backend foundation
- [Source: architecture.md#Frontend Architecture — Routing] — `/clientes/:id` → `clientes.$clienteId.tsx`, TanStack Router file convention
- [Source: architecture.md#Frontend Architecture — TanStack Query keys] — `['clientes', id]` for single client
- [Source: architecture.md#State Boundaries] — URL path param as source of truth for selectedClienteId
- [Source: architecture.md#API & Communication Patterns] — `GET /api/v1/clientes/{id}` endpoint
- [Source: architecture.md#Format Patterns] — 200 direct object, 404 Problem Details RFC 7807
- [Source: architecture.md#Component Boundaries (Frontend)] — ClienteDetailPanel = right flex-1 panel
- [Source: architecture.md#Implementation Patterns & Consistency Rules] — Naming, error handling, anti-patterns
- [Source: company-standards.md#Frontend Stack] — React 18+, TanStack Router, TanStack Query 5+, TypeScript strict
- [Source: company-standards.md#Backend Stack] — .NET 10, C# Minimal API, CQRS pattern
- [Source: company-standards.md#Loading States] — react-loading-skeleton, no spinners
- [Source: company-standards.md#UX Design System] — Siesa Blue #0e79fd, slate-* neutrals, Inter font
- [Source: company-standards.md#Testing Standards] — Vitest + RTL + MSW (frontend), xUnit (backend)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
