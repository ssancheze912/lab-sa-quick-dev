# Story 2.1: Client List & Search

Status: review

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients with `nombre` and `nit` visible per item.

2. **Given** the client list is loaded, **When** the user types in the search input field, **Then** the list filters in real time showing only clients whose `nombre` or `nit` match the input (case-insensitive), **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed inside the left panel with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the GET `/api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed inside the left panel instead of the list.

5. **Given** the `/clientes` route renders, **When** no client is selected, **Then** the right panel displays a neutral empty/default state (no detail content).

6. **Given** the client list is fetched successfully, **When** `useClientes` returns data, **Then** the `['clientes']` TanStack Query cache is populated and subsequent navigations within the session do not trigger redundant network requests (staleTime > 0).

## Tasks / Subtasks

- [x] Task 1 — Define `Cliente` domain entity and repository interface (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string; }`
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>` and `getById(id: string): Promise<Cliente>`

- [x] Task 2 — Implement `clienteApiRepository` in infrastructure layer (AC: #4)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` implementing `IClienteRepository`
  - [x] `getAll()` calls `GET /api/v1/clientes` via the shared `apiClient` (Axios singleton at `frontend/src/shared/lib/apiClient.ts`)
  - [x] `getById(id)` calls `GET /api/v1/clientes/{id}`
  - [x] Export a singleton `clienteApiRepository` instance

- [x] Task 3 — Implement `useClientes` TanStack Query hook (AC: #1, #4, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - [x] Use `useQuery` with `queryKey: ['clientes']` and `queryFn: () => clienteApiRepository.getAll()`
  - [x] Set `staleTime: 30_000` (30 seconds) to avoid redundant re-fetches
  - [x] Return `{ data, isLoading, isError, refetch }` — hook must expose `refetch` for the `ErrorPanel` retry handler

- [x] Task 4 — Create `ClienteListItem` shared component (AC: #1)
  - [x] Create `frontend/src/shared/components/ClienteListItem.tsx`
  - [x] Props: `{ cliente: Cliente; isSelected: boolean; onClick: () => void }`
  - [x] Display: `nombre` as primary text (bold, `text-sm`), `nit` as secondary text (`text-xs text-slate-500`)
  - [x] Apply `bg-blue-50 border-l-4 border-[#0e79fd]` styles when `isSelected === true`
  - [x] All user-facing text labels in Spanish (aria-label, title attributes)
  - [x] Keyboard accessible: `role="button"`, `tabIndex={0}`, handles `Enter`/`Space` keydown

- [x] Task 5 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [x] Render a 280px fixed-width left panel with search input, scrollable list, EmptyState, ErrorPanel, skeleton loading
  - [x] Client-side filtering with `useMemo` over `data ?? []`
  - [x] `searchQuery` state: `useState<string>('')` — local component state only
  - [x] Navigate to `/clientes/${cliente.id}` on click via TanStack Router `useNavigate`
  - [x] Highlight selected item using current route param

- [x] Task 6 — Create `ClientesPage` route file for `/clientes` (AC: #1, #5)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` (TanStack Router file-based route)
  - [x] Render two-panel layout: left = `<ClienteListView />` (280px), right = flex-1 with default empty state

- [x] Task 7 — Backend: Define `ClienteEntity` and `IClienteRepository` in Domain layer (AC: #1)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`

- [x] Task 8 — Backend: EF Core configuration and migration for `clientes` table (AC: #1)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
  - [x] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
  - [x] Apply `ApplyConfigurationsFromAssembly` in `OnModelCreating`
  - [x] Create EF Core migration: `AddClientesTable`

- [x] Task 9 — Backend: `ClienteRepository` implementation (AC: #1)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
  - [x] Register in `Program.cs`: `builder.Services.AddScoped<IClienteRepository, ClienteRepository>()`

- [x] Task 10 — Backend: `GetClientesQuery` + Handler + DTO (AC: #1)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
  - [x] Register handler in DI

- [x] Task 11 — Backend: `GET /api/v1/clientes` Minimal API endpoint (AC: #1, #4)
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [x] Register `ClienteEndpoints` in `Program.cs`

- [x] Task 12 — Tests: Backend unit tests for query handler (AC: #1)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
  - [x] 3 tests: correct list, empty repository, property mapping — all passing

- [x] Task 13 — Tests: Frontend unit tests (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts` — 3 tests passing
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — 6 tests passing

## Dev Notes

### Architecture Context

This story spans both **frontend** and **backend** layers. The frontend is the primary deliverable (user-visible feature); the backend provides the `GET /api/v1/clientes` endpoint consumed by `useClientes`.

**Clean Architecture layer responsibilities:**
- `domain/`: `Cliente.ts` (interface), `IClienteRepository.ts` — zero external dependencies
- `application/`: `useClientes.ts` (TanStack Query hook) — depends on domain interface only
- `infrastructure/`: `clienteApiRepository.ts` — depends on domain interface + Axios
- `presentation/`: `ClienteListView.tsx`, `ClientesPage` route — depends on application hooks

**State management decisions (from architecture.md):**
- `searchQuery`: `useState<string>('')` — local component state, NOT Zustand, NOT URL search param
- `selectedClienteId`: synchronized with URL param via TanStack Router (handled by the route, not this story)
- No Zustand store required for this story

### UI Implementation Requirements (MANDATORY)

This story involves UI components. The following siesa-ui-kit rules apply:

- **siesa-ui-kit** is the P0 mandatory UI library — check its catalog before creating any custom component
- **MasterCrud** from siesa-ui-kit is NOT applicable here: the client list uses a custom 280px split-panel layout (not a data grid with CRUD orchestration). The architecture explicitly defines `ClienteListView` as a custom component
- For the `EmptyState` and `ErrorPanel` components: siesa-ui-kit does NOT have these — custom implementations created in `frontend/src/shared/components/`
- Heroicons (primary icon source) for search icon, error icon
- Brand color `#0e79fd` (Siesa Blue) for selected-item indicator (`border-[#0e79fd]`)
- Loading skeleton: `react-loading-skeleton` — skeleton screens, NOT spinners

### Previous Story Learnings (from Story 1.3)

- Solution file is `SiesaAgents.slnx` (XML format, .NET 10) — use `dotnet build SiesaAgents.slnx`
- `AppDbContext` uses `UseSnakeCaseNamingConvention()` at `DbContextOptions` level (EFCore.NamingConventions v10.0.1)
- `ApplyConfigurationsFromAssembly` must be called BEFORE snake_case naming in `OnModelCreating`

### Git Context

Recent commits follow pattern: `feat(story-X.Y):`, `docs(story-X.Y):`, `fix(story-X.Y):`, `review(story-X.Y):`. Use `feat(story-2.1):` prefix for commits in this story.

### Testing Standards Summary

**Frontend (Vitest + RTL + MSW):**
- Co-locate tests: `useClientes.test.ts` alongside `useClientes.ts`
- MSW server intercepts network calls — no real HTTP requests in tests
- Coverage target: >80% for files introduced in this story

**Backend (xUnit):**
- Unit tests: manual fake repository (no NSubstitute/Moq in project)
- Test file location: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`
- Arrange/Act/Assert structure — explicit and readable
- Run with: `dotnet test tests/SiesaAgents.UnitTests`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- EF `UseSnakeCaseNamingConvention` must be applied on `DbContextOptionsBuilder` in Program.cs, not on `ModelBuilder` in `OnModelCreating`
- Backend project had no source files — all projects rebuilt from scratch using compiled obj/bin artifacts for reference
- `Microsoft.AspNetCore.OpenApi` package required explicitly in API csproj for `AddOpenApi()`/`MapOpenApi()`
- xUnit requires explicit `using Xunit;` (not in global usings)
- Frontend had node_modules but no src — full project skeleton created

### Completion Notes List

- All 13 tasks completed successfully
- Backend: 3 unit tests passing (GetClientesQueryHandlerTests)
- Frontend: 9 unit tests passing (useClientes: 3, ClienteListView: 6)
- EF Core migration `AddClientesTable` generated successfully
- siesa-ui-kit checked: no EmptyState or ErrorPanel equivalents found → custom components created in shared/components per guidelines
- axe accessibility not tested (axe-core not installed in project)

### File List

**Created:**
- `backend/SiesaAgents.slnx`
- `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj`
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260630052917_AddClientesTable.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/src/SiesaAgents.API/appsettings.json`
- `backend/src/SiesaAgents.API/appsettings.Development.json`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `frontend/package.json`
- `frontend/index.html`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/vite.config.ts`
- `frontend/vitest.config.ts`
- `frontend/.env.development`
- `frontend/src/index.css`
- `frontend/src/main.tsx`
- `frontend/src/routeTree.gen.ts`
- `frontend/src/test/setup.ts`
- `frontend/src/test/msw-server.ts`
- `frontend/src/app/providers/QueryProvider.tsx`
- `frontend/src/shared/lib/apiClient.ts`
- `frontend/src/shared/lib/queryClient.ts`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClienteListItem.tsx`
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/routes/__root.tsx`
- `frontend/src/routes/_app.tsx`
- `frontend/src/routes/_app/clientes.tsx`
