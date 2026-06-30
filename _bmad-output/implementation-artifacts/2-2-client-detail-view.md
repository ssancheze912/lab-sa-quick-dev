# Story 2.2: Client Detail View

Status: ready-for-dev

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly, **Then** the correct client details are loaded and displayed (FR30).

3. **Given** a clienteId in the URL does not exist, **When** the page loads, **Then** a not-found message is displayed gracefully.

## Tasks / Subtasks

- [ ] Task 1 — Add `useCliente(id)` TanStack Query hook (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - [ ] Use `useQuery` with `queryKey: ['clientes', id]`, `queryFn: () => clienteApiRepository.getById(id)`, `enabled: !!id`
  - [ ] Set `staleTime: 30_000` (consistent with `useClientes`)
  - [ ] Return `{ data, isLoading, isError }` — no retry needed for 404 scenario (see task notes)

- [ ] Task 2 — Create `ClienteDetailView` presentation component (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [ ] Props: `{ clienteId: string }`
  - [ ] Consume `useCliente(clienteId)` hook
  - [ ] Loading state: skeleton rows for each field (react-loading-skeleton, NOT spinners)
  - [ ] Not-found state: when API returns 404 (isError + no data), display a not-found message: "No se encontró el cliente solicitado."
  - [ ] Success state: display all four fields in a detail panel with labeled rows: Nombre, NIT/RUC, Teléfono, Ciudad
  - [ ] Add `data-testid="cliente-detail-content"` to the success state container
  - [ ] All labels in Spanish; field values from the `Cliente` domain interface

- [ ] Task 3 — Create `$clienteId` TanStack Router dynamic route (AC: #1, #2, #3)
  - [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` (TanStack Router file-based — `$` prefix = dynamic param)
  - [ ] Export `Route = createFileRoute('/_app/clientes/$clienteId')({...})`
  - [ ] Access param via `Route.useParams()` — typed, NOT `useParams({ strict: false })` cast
  - [ ] Render two-panel layout: left = `<ClienteListView />` (reuse existing, 280px), right = `<ClienteDetailView clienteId={clienteId} />`
  - [ ] Regenerate route tree: `pnpm --filter frontend exec tsr generate` (or `pnpm --filter frontend build` triggers it)

- [ ] Task 4 — Update `clientes.tsx` parent route to render outlet for nested detail (AC: #1, #5)
  - [ ] Verify `frontend/src/routes/_app/clientes.tsx` renders `<Outlet />` (or equivalent) in the right panel when a child route (`$clienteId`) is active
  - [ ] The right panel default state "Selecciona un cliente para ver sus detalles" (data-testid="cliente-detail-panel") must remain when no `$clienteId` is active (Story 2.1 AC5 preserved)

- [ ] Task 5 — Backend: Add `GetClienteByIdQuery` + Handler + Endpoint (AC: #2, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with `Guid Id`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
    - [ ] `Handle(query, ct)` calls `_repository.GetByIdAsync(query.Id, ct)`
    - [ ] Returns `ClienteDto?` — nullable (caller maps null to 404)
  - [ ] Register handler in `Program.cs`: `builder.Services.AddScoped<GetClienteByIdQueryHandler>()`
  - [ ] Add `GET /api/v1/clientes/{id}` endpoint in `ClienteEndpoints.cs`:
    - [ ] Route: `app.MapGet("/api/v1/clientes/{id:guid}", ...)`
    - [ ] Returns `Results.Ok(dto)` when found, `Results.NotFound()` when null
    - [ ] Decorate with `.WithName("GetClienteById")`, `.WithTags("Clientes")`, `.Produces<ClienteDto>()`, `.ProducesProblem(404)`, `.ProducesProblem(500)`, `.WithOpenApi()`

- [ ] Task 6 — Tests: Backend unit tests for `GetClienteByIdQueryHandler` (AC: #2, #3)
  - [ ] Add tests to existing `backend/tests/SiesaAgents.UnitTests/Application/Clientes/` or create `GetClienteByIdQueryHandlerTests.cs`
  - [ ] 3 tests: found → returns ClienteDto with correct field mapping; not found → returns null; Guid.Empty → returns null
  - [ ] Run: `dotnet test tests/SiesaAgents.UnitTests`

- [ ] Task 7 — Tests: Frontend unit tests for `useCliente` and `ClienteDetailView` (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
    - [ ] 3 tests: loading state; success returns cliente data; `isError=true` when API returns 404
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
    - [ ] 5 tests: renders skeleton while loading; renders Nombre, NIT, Teléfono, Ciudad on success; renders not-found message on 404; `data-testid="cliente-detail-content"` present on success; absent when not found
  - [ ] Use `vi.mock('../application/useCliente')` for component tests (isolate from network)
  - [ ] Run: `pnpm --filter frontend test`

## Dev Notes

### Architecture Context

**Clean Architecture layer responsibilities (this story):**
- `domain/`: No changes — `Cliente.ts` and `IClienteRepository.ts` already exist with `getById(id)` (Story 2.1)
- `application/`: New `useCliente.ts` hook — depends on domain interface only
- `infrastructure/`: No changes — `clienteApiRepository.getById(id)` already implemented (Story 2.1)
- `presentation/`: New `ClienteDetailView.tsx` + new `clientes.$clienteId.tsx` route

**Existing files to reuse (do NOT recreate):**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` — `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — `getById(id: string): Promise<Cliente>`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — `getById(id)` → `GET /api/v1/clientes/{id}`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — existing 280px left panel; must be rendered in the new route
- `frontend/src/routes/_app/clientes.tsx` — existing `/clientes` parent route; needs `<Outlet />` in right panel
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — `GetByIdAsync(Guid id, CancellationToken ct)` already declared
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — `GetByIdAsync` already implemented
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — existing record, no changes needed

### Critical: TanStack Router — Route Nesting and `$clienteId`

**File naming conventions (mandatory):**
- `clientes.$clienteId.tsx` creates the flat route `/_app/clientes/$clienteId` (dot = flat nested)
- `$` prefix = dynamic param; TanStack Router reads `clienteId` from URL
- Access typed param: `const { clienteId } = Route.useParams()` — NOT `useParams({ strict: false })` (that pattern is a known tech debt from Story 2.1, per review feedback)

**Parent route must render `<Outlet />`:**
The current `frontend/src/routes/_app/clientes.tsx` renders a hardcoded default right panel. To support the `$clienteId` child route, the right panel must conditionally render `<Outlet />` when a child route is active. Use `useMatchRoute()` or render the Outlet directly — TanStack Router automatically renders the child component in place of `<Outlet />`.

**Route tree regeneration:**
After creating `clientes.$clienteId.tsx`, run `pnpm --filter frontend exec tsr generate` to update `frontend/src/routeTree.gen.ts`. The route tree must include `/_app/clientes/$clienteId` or navigation to `/clientes/$clienteId` will fail (this was the CRITICAL unresolved issue from Story 2.1 code review).

### Critical: Story 2.1 Review — Unresolved Issues This Story Must Fix

The Story 2.1 code review flagged:
> [AI-Review][CRITICAL] **Missing `$clienteId` dynamic route**: `ClienteListView` navigates to `/clientes/$clienteId` but `frontend/src/routes/_app/clientes.$clienteId.tsx` does NOT exist. At runtime TanStack Router cannot resolve the destination.

**This story directly resolves that CRITICAL issue** by creating `clientes.$clienteId.tsx` and regenerating the route tree. After this story, `ClienteListView`'s existing navigation call `navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })` will work correctly.

### UI Implementation Requirements

- **siesa-ui-kit first**: Check catalog before creating any custom component. The detail panel is a custom layout (no applicable siesa-ui-kit component)
- **Loading skeleton**: `react-loading-skeleton` (already installed, used in `ClienteListView`) — skeleton rows, NOT spinner
- **Icons**: Heroicons (primary) — use `UserIcon` or `BuildingOfficeIcon` for detail panel header if needed
- **Brand colors**: `#0e79fd` (Siesa Blue) for any highlighted values; Tailwind `slate-*` for neutrals
- **Typography**: `text-sm font-medium text-slate-900` for labels; `text-sm text-slate-700` for values
- **Not-found message**: Must be visually distinct but non-alarming. Example:

```tsx
<div data-testid="cliente-not-found" className="flex flex-1 flex-col items-center justify-center text-slate-500">
  <p className="text-sm">No se encontró el cliente solicitado.</p>
</div>
```

### Backend: `GET /api/v1/clientes/{id}` Response Contract

Per architecture.md:
- Found: `200 OK` + `ClienteDto` (direct object, no wrapper)
- Not found: `404 Not Found` (Problem Details RFC 7807 format via ExceptionHandlingMiddleware)
- Route constraint: `{id:guid}` — rejects non-GUID values at the routing level

**ClienteDto shape** (existing, no changes):
```json
{ "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "..." }
```

### State Management Decisions

- `useCliente(id)` — TanStack Query `['clientes', id]` key (canonical, per architecture.md)
- No Zustand store needed — detail view is fully server-state driven
- Selected client is determined by URL param (TanStack Router), not local state
- `staleTime: 30_000` — consistent with `useClientes`

### Testing Standards Summary

**Frontend (Vitest + RTL + MSW):**
- Co-locate tests: `useCliente.test.ts` alongside `useCliente.ts`; `ClienteDetailView.test.tsx` alongside `ClienteDetailView.tsx`
- Use `vi.mock('../application/useCliente')` in component tests to isolate from network
- Use MSW handler for `GET /api/v1/clientes/:id` returning 200 (found) and 404 (not found) in hook tests
- Coverage target: >80% for new files introduced in this story
- Run: `pnpm --filter frontend test`

**Backend (xUnit):**
- Manual fake repository (no NSubstitute/Moq in project — confirmed in Story 2.1 learnings)
- Test location: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
- Arrange/Act/Assert — explicit and readable
- Run: `dotnet test tests/SiesaAgents.UnitTests` (from `backend/` directory; solution file is `SiesaAgents.slnx`)

### Previous Story Learnings (from Story 2.1)

- Solution file: `SiesaAgents.slnx` (XML format, .NET 10) — use `dotnet build SiesaAgents.slnx` and `dotnet test tests/SiesaAgents.UnitTests`
- `AppDbContext` uses `UseSnakeCaseNamingConvention()` — already configured, no changes needed
- `ExceptionHandlingMiddleware` already registered in `Program.cs` — will handle 404 Problem Details automatically if middleware converts `KeyNotFoundException` or equivalent; alternatively `Results.NotFound()` returns 404 directly from Minimal API without middleware
- `useParams({ strict: false })` with manual cast is a known code smell — this story introduces the properly-typed alternative via `Route.useParams()` in `$clienteId` route
- `xUnit` tests require explicit `using Xunit;` (not in global usings)
- `@heroicons/react` is already installed (used in `EmptyState` and `ErrorPanel` from Story 2.1)

### Git Commit Pattern

Follow existing convention: `feat(story-2.2):` prefix for commits in this story.

### Project Structure Notes

**New files to create:**
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

**Files to modify:**
- `frontend/src/routes/_app/clientes.tsx` — add `<Outlet />` to right panel for child route
- `frontend/src/routes/routeTree.gen.ts` — regenerated automatically by TanStack Router CLI
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add `GET /api/v1/clientes/{id:guid}` endpoint
- `backend/src/SiesaAgents.API/Program.cs` — register `GetClienteByIdQueryHandler` in DI

### References

- Routing and query key decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- API contract (GET by ID): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- TanStack Router file prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Story 2.1 critical review (missing `$clienteId` route): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Review Follow-ups (AI)]
- Test design risk R-008 (deep link non-existent ID): [Source: _bmad-output/test-design-epic-2.md#Medium-Priority Risks]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
