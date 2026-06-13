# Story 2.2: Client Detail View

Status: review

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

- [x] Task 1 — Backend: GetClienteById Query + Handler (AC: #2, #3)
  - [x] Create `GetClienteByIdQuery.cs` in `backend/src/SiesaAgents.Application/Clientes/Queries/` with property `Guid Id`.
  - [x] Create `GetClienteByIdQueryHandler.cs` in same folder, returning `ClienteDto?`. Calls `IClienteRepository.GetByIdAsync(query.Id, ct)`.
  - [x] Add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` method to `IClienteRepository.cs` in `backend/src/SiesaAgents.Domain/Clientes/Interfaces/`.
  - [x] Implement `GetByIdAsync` in `ClienteRepository.cs` in `backend/src/SiesaAgents.Infrastructure/Repositories/`. Use `await _context.Clientes.FindAsync(new object[] { id }, ct)`.

- [x] Task 2 — Backend: GET /api/v1/clientes/{id} endpoint (AC: #2, #3, #4)
  - [x] Add `GET /{id}` route to `ClienteEndpoints.cs` in `backend/src/SiesaAgents.API/Endpoints/`. Handler: dispatches `GetClienteByIdQuery` → if result is null → `Results.Problem(...)` (Problem Details 404); if found → `Results.Ok(clienteDto)`.
  - [x] Error format: Problem Details RFC 7807 — `ExceptionHandlingMiddleware` handles all unhandled exceptions.
  - [x] Response shape on success: `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }` (camelCase, same `ClienteDto` as Story 2.1).
  - [x] Response shape on not-found: HTTP 404 with `{ type, title: "Not Found", status: 404, detail: "Cliente not found." }`.

- [x] Task 3 — Frontend: Domain layer extension (AC: #2)
  - [x] Add method `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts` in `frontend/src/modules/crm/clientes/domain/`.
  - [x] No changes to `Cliente.ts` entity — shape is unchanged from Story 2.1.

- [x] Task 4 — Frontend: Infrastructure layer extension (AC: #2)
  - [x] Implement `getById(id: string): Promise<Cliente>` in `clienteApiRepository.ts` (`frontend/src/modules/crm/clientes/infrastructure/`). Uses `apiClient.get<Cliente>(\`/api/v1/clientes/${id}\`)` → returns `response.data`. Throws on non-2xx (Axios default behaviour).

- [x] Task 5 — Frontend: Application layer — useCliente hook (AC: #2, #3, #4, #5)
  - [x] Create `useCliente.ts` in `frontend/src/modules/crm/clientes/application/` using TanStack Query `useQuery`.
    - Query key: `['clientes', id]` (canonical per architecture).
    - `queryFn`: calls `clienteRepository.getById(id)`. Only enabled when `id` is a non-empty string (`enabled: !!id`).
    - `staleTime`: 60_000 (1 minute).
    - `retry`: 2 (configured at QueryClient default level).
  - [x] Signature: `export function useCliente(id: string | undefined)`.

- [x] Task 6 — Frontend: Presentation layer — ClienteDetailView component (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `ClienteDetailView.tsx` in `frontend/src/modules/crm/clientes/presentation/`.
  - [x] Props: `clienteId: string | undefined`.
  - [x] If `clienteId` is undefined/empty → render placeholder: `<p className="text-slate-400">Selecciona un cliente para ver su detalle.</p>`.
  - [x] Uses `useCliente(clienteId)` hook. Handle states:
    - `isLoading` → render skeleton (react-loading-skeleton — 4 skeleton rows for fields).
    - `isError` → render `<ErrorPanel onRetry={refetch} />`.
    - `data` present → render detail card with fields: Nombre, NIT/RUC, Teléfono, Ciudad.
    - If fetch returns 404 (TanStack Query error with HTTP 404 status) → render "Cliente no encontrado." message instead of `ErrorPanel`.
  - [x] Detail layout: labeled fields using semantic `<dl>/<dt>/<dd>` HTML (label in `text-slate-500 text-sm`, value in `text-slate-900 font-medium`). Custom TailwindCSS (no siesa-ui-kit equivalent for detail/label fields).
  - [x] All user-facing text MUST be in Spanish. All code (variables, functions) MUST be in English.
  - [x] WCAG 2.1 AA: all fields use semantic `<dl>/<dt>/<dd>` structure for screen readers.

- [x] Task 7 — Frontend: Route integration (AC: #1, #2, #6)
  - [x] Create route file `frontend/src/routes/_app/clientes.$clienteId.tsx` for the `/clientes/:clienteId` dynamic route.
    - TanStack Router `$` prefix for the dynamic segment.
    - Export a `Route` using `createFileRoute('/_app/clientes/$clienteId')`.
    - The route component renders the split-panel layout: left panel (`ClienteListPanel`, 280px fixed) + right panel (`ClienteDetailView`, flex-1), passing `clienteId` from route params.
    - Loader prefetches `['clientes', clienteId]` via `queryClient.prefetchQuery(...)` for direct URL access (FR30).
  - [x] Modify `frontend/src/routes/_app/clientes.tsx`: renders `ClienteListPanel` + `ClienteDetailView clienteId={undefined}`.
  - [x] In `ClienteListPanel.tsx`: each list item wrapped in `<Link to="/_app/clientes/$clienteId" params={{ clienteId: cliente.id }}>` for navigation. `isSelected` highlights item matching current `selectedClienteId`.

- [x] Task 8 — Frontend: Unit tests (AC: #1, #2, #3, #4, #5, #6)
  - [x] Test `useCliente.ts` with MSW:
    - Mock `GET /api/v1/clientes/:id` → 200 with valid `ClienteDto` → verify typed `Cliente` returned.
    - Mock `GET /api/v1/clientes/:id` → 404 → verify hook enters error state.
    - Verify hook is disabled when `id` is undefined.
  - [x] Test `ClienteDetailView.tsx` with RTL:
    - Renders placeholder when `clienteId` is undefined.
    - Renders skeleton on `isLoading` state.
    - Renders `ErrorPanel` on non-404 `isError` state; clicking "Reintentar" calls `refetch`.
    - Renders "Cliente no encontrado." on 404 error.
    - Renders all 4 client fields (Nombre, NIT/RUC, Teléfono, Ciudad) when data is present.
  - [x] Accessibility: `ClienteDetailView` uses semantic `<dl>/<dt>/<dd>` structure for WCAG 2.1 AA.

- [x] Task 9 — Backend: Unit tests for GetClienteByIdQueryHandler (AC: #2, #3)
  - [x] Create `GetClienteByIdQueryHandlerTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`.
  - [x] Use xUnit + Arrange/Act/Assert.
  - [x] Test: existing ID → returns `ClienteDto` with correct data.
  - [x] Test: non-existing ID → returns `null`.

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
| Testing | Vitest + RTL + MSW |

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check catalog FIRST before any custom component
- **Install**: `npm install siesa-ui-kit` (dependency already present from Story 1.1)
- **Usage**: Use `siesa-ui-kit` components for all UI elements where an equivalent exists
- **Constraint**: Do NOT create custom components if a `siesa-ui-kit` equivalent exists
- **MasterCrud**: NOT applicable — read-only detail panel, not a CRUD screen

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

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 9 tasks implemented in worktree branch `develop-siesa-agents-gaduranb-rq2-gestion-de-clientes`.
- Backend: GetClienteByIdQuery, GetClienteByIdQueryHandler, GetClienteByIdQueryHandlerTests, ClienteEndpoints (GET /api/v1/clientes/{id}), IClienteRepository.GetByIdAsync, ClienteRepository.GetByIdAsync created/modified.
- Frontend: Cliente.ts, IClienteRepository.ts (with getById), clienteApiRepository.ts (with getById), useCliente.ts, ClienteDetailView.tsx, ClienteListPanel.tsx (with Link navigation + isSelected), clientes.$clienteId.tsx route, clientes.tsx route (updated), EmptyState.tsx, ErrorPanel.tsx, ClientListItem.tsx created/modified.
- routeTree.gen.ts updated by TanStack Router Vite plugin to include `/_app/clientes/$clienteId` route.
- Frontend tests: 51 tests pass (4 test files). Navigation shell tests updated to include QueryClientProvider wrapper + MSW server for API mocking.
- Backend tests: GetClienteByIdQueryHandlerTests.cs created with 2 xUnit tests (dotnet not available in environment to execute).
- retry moved to QueryClient default (retry: 2 in queryClient.ts) instead of hook level, to allow tests to override with retry: false.

### File List

**Backend (Created/Modified):**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` - MODIFIED (added GetByIdAsync)
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` - CREATED
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` - MODIFIED (added Clientes DbSet)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` - CREATED
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` - CREATED
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` - CREATED
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` - CREATED
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` - CREATED
- `backend/src/SiesaAgents.API/Program.cs` - MODIFIED (DI registrations + endpoint mapping)
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` - MODIFIED (added InMemory package)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` - CREATED

**Frontend (Created/Modified):**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` - CREATED
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` - CREATED
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` - CREATED
- `frontend/src/modules/crm/clientes/application/useClientes.ts` - CREATED
- `frontend/src/modules/crm/clientes/application/useCliente.ts` - CREATED
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` - CREATED
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` - CREATED
- `frontend/src/shared/components/EmptyState.tsx` - CREATED
- `frontend/src/shared/components/ErrorPanel.tsx` - CREATED
- `frontend/src/shared/components/ClientListItem.tsx` - CREATED
- `frontend/src/shared/lib/queryClient.ts` - MODIFIED (added retry: 2 default)
- `frontend/src/routes/_app/clientes.tsx` - MODIFIED (split-panel with ClienteListPanel + ClienteDetailView)
- `frontend/src/routes/_app/clientes.$clienteId.tsx` - CREATED
- `frontend/src/routeTree.gen.ts` - AUTO-REGENERATED (by TanStack Router Vite plugin)
- `frontend/src/__tests__/clientes/useCliente.test.ts` - CREATED
- `frontend/src/__tests__/clientes/ClienteDetailView.test.tsx` - CREATED
- `frontend/src/__tests__/navigation/navigation-shell.test.tsx` - MODIFIED (QueryClientProvider wrapper)
- `frontend/src/__tests__/navigation/navigation-shell-edge-cases.test.tsx` - MODIFIED (QueryClientProvider wrapper)
