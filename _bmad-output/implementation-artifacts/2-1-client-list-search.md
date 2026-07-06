# Story 2.1: Client List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px, `data-testid="clientes-list-panel"`) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item (`data-testid="cliente-list-item"`) (FR2).

2. **Given** the client list is loaded, **When** the user types in the search field (`aria-label="Buscar clientes"`, placeholder "Buscar cliente..."), **Then** the list filters in real time (no submit button, no network request) showing only clients whose Nombre or NIT/RUC match the input (case-insensitive, substring match) (FR3, FR4), **And** results render in under 1 second with up to 500 records in the dataset (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component (`data-testid="empty-state"`, variant `no-clients`: title "No hay clientes registrados" / subtitle "Crea el primer cliente del sistema") is displayed instead of the list, **And** it announces itself via `aria-live="polite"`.

4. **Given** the backend is unavailable when the page loads, **When** the initial `GET /api/v1/clientes` fetch fails, **Then** an `ErrorPanel` (`data-testid="error-panel"`, message "No se pudo cargar") with a "Reintentar" button is displayed instead of the list, **And** clicking "Reintentar" re-triggers the query, **And** the raw error/exception message is never rendered to the user (NFR6).

## Tasks / Subtasks

- [x] Task 1 — `ClienteEntity` domain model + `clientes` table migration (AC: #1)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`: private constructor + `public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)` factory (validates non-empty args, throws `ArgumentException` otherwise — defense-in-depth, full FluentValidation/Zod validation belongs to Story 2.3). Properties: `Guid Id` (init via `Guid.NewGuid()`), `Nombre`, `Nit`, `Telefono`, `Ciudad` (all `string`), `CreatedAt`/`UpdatedAt` (`DateTimeOffset`, never `DateTime`)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken)` — only the read method this story needs; do NOT add `CreateAsync`/`UpdateAsync`/`DeleteAsync`/`GetByIdAsync` yet (Stories 2.2–2.5 extend this interface)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` (`IEntityTypeConfiguration<ClienteEntity>`): `HasKey(c => c.Id)`; `Property(c => c.Nombre)`/`Nit`/`Telefono`/`Ciudad` required, reasonable `HasMaxLength`; **`HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`** — set the database name explicitly; `ApplySnakeCaseNaming()` only converts casing, it does NOT add the `uk_` prefix required by company DB conventions
  - [x] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext` and apply `ClienteConfiguration` in `OnModelCreating` (before the existing `ApplySnakeCaseNaming()` call, which must remain last)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository.GetAllAsync` via `AppDbContext.Clientes.AsNoTracking().ToListAsync(...)`
  - [x] Register `IClienteRepository` → `ClienteRepository` as `AddScoped` in `Program.cs`
  - [x] From `backend/src/SiesaAgents.API`: `dotnet ef migrations add CreateClientesTable --project ../SiesaAgents.Infrastructure --startup-project .` — verify the generated migration creates the `clientes` table with columns `id (uuid PK)`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at` and the `uk_clientes_nit` unique index (all snake_case); run `dotnet ef database update`

- [x] Task 2 — `GetClientesQuery` + DTO + `GET /api/v1/clientes` endpoint (AC: #1, #4)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`: `Id (Guid)`, `Nombre`, `Nit`, `Telefono`, `Ciudad` (string), `CreatedAt (DateTimeOffset)`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (empty marker record — **no search parameter**, see Dev Notes on Search Strategy) + `GetClientesQueryHandler.cs` calling `IClienteRepository.GetAllAsync` and mapping to `List<ClienteDto>`
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with a `MapClienteEndpoints(this IEndpointRouteBuilder app)` extension: `app.MapGroup("/api/v1/clientes")` then `.MapGet("/", ...)` → 200 OK + `ClienteDto[]` (direct array, no wrapper, per architecture's API response-shape convention). Do NOT add POST/PUT/DELETE routes in this story (Stories 2.3–2.5 scope)
  - [x] Call `app.MapClienteEndpoints();` in `Program.cs`
  - [x] No new error-handling code needed — the existing global `ExceptionHandlingMiddleware` (Story 1.3) already converts any unhandled exception from this endpoint into a Problem Details response; verify by inspection, do not duplicate

- [x] Task 3 — Frontend `clientes` module: domain + data layer (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`: `export interface Cliente { id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string }`
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: `export interface IClienteRepository { getAll(): Promise<Cliente[]> }`
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: Axios implementation using the shared `apiClient` (`frontend/src/shared/lib/apiClient.ts`) — `GET /api/v1/clientes`, returns `response.data`
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`: TanStack Query hook, **`queryKey: ['clientes']`** (array form, never a string), `queryFn: () => clienteApiRepository.getAll()`

- [x] Task 4 — `ClienteListView` with real-time search (AC: #1, #2)
  - [x] Create `frontend/src/shared/components/ClientListItem.tsx`: displays Nombre (primary) + NIT/RUC (secondary), `data-testid="cliente-list-item"`
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`: 280px left panel, `data-testid="clientes-list-panel"`; search field using siesa-ui-kit `Input` (`placeholder="Buscar cliente..."`, `aria-label="Buscar clientes"`, wrapped in a container with `role="search"`); local `useState<string>` for the search term (per architecture: client-side filter state is local React state, NOT Zustand); `useMemo` filtering `useClientes()`'s cached array by `nombre`/`nit` (case-insensitive substring match) on every keystroke — no debounce, no additional fetch (NFR1: <1s at 500 records via in-memory filter)
  - [x] Wire `ClienteListView` into `frontend/src/routes/_app/clientes.tsx`, replacing the Story 1.2 placeholder (heading + plain paragraph). Render `ClienteListView` (left) plus a minimal placeholder right panel (`data-testid="cliente-detail-panel"`, e.g. "Selecciona un cliente para ver su detalle") — the real `ClienteDetailView` is Story 2.2 scope, do not build it here

- [x] Task 5 — `EmptyState` and `ErrorPanel` shared components (AC: #3, #4)
  - [x] Create `frontend/src/shared/components/EmptyState.tsx`: reusable component, props `{ title: string; subtitle?: string; icon?: ReactNode; testId?: string }`; render with `data-testid="empty-state"` and `aria-live="polite"` (per `ux-design-specification.md`). No `EmptyState` exists in the installed `siesa-ui-kit@1.0.256` public API (confirmed in Story 1.2 — the package's internal `EmptyState` is unexported/private to `MasterPatternView`) — this is a genuine custom component per `architecture.md`'s directory tree, not a siesa-ui-kit wrapper
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx`: props `{ message: string; onRetry: () => void }`; render `data-testid="error-panel"`, message text, and a `Button` (siesa-ui-kit) labeled "Reintentar" calling `onRetry`. Never render `error.message`/raw exception text (NFR6) — only the fixed, safe `message` string
  - [x] In `ClienteListView`, branch on `useClientes()`'s query state: `isError` → `<ErrorPanel message="No se pudo cargar" onRetry={refetch} />`; `isSuccess && filteredClientes.length === 0 && searchTerm === ''` → `<EmptyState title="No hay clientes registrados" subtitle="Crea el primer cliente del sistema" />` (the "no-clients" variant, distinct from the future "search-empty" no-results variant which is not part of this story's AC); otherwise render the list

- [x] Task 6 — Tests (AC: #1, #2, #3, #4)
  - [x] Component tests (Vitest + RTL + MSW), co-located as `ClienteListView.test.tsx`: renders list items with Nombre + NIT/RUC when data loads (AC1); typing in the search field filters by Nombre and independently by NIT in real time, no extra network call fires per keystroke (AC2); renders `EmptyState` when the mocked response is `[]` (AC3, TC-E2-P1-06); renders `ErrorPanel` when the mocked request rejects/500s, and clicking "Reintentar" re-invokes the query function (AC4, TC-E2-P2-03)
  - [x] Component perf test (co-located or dedicated `*.test.ts`): seed a 500-record fixture into the mocked `['clientes']` cache, type a search term, assert filtered render completes well under 1s via `performance.now()` (NFR1, TC-E2-P1-04)
  - [x] Backend unit test `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`: `Create()` sets all properties, generates a new `Guid`, rejects empty/whitespace `nombre`/`nit`/`telefono`/`ciudad`
  - [x] Backend integration test `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`: `GET /api/v1/clientes` returns `200` + `[]` when the table is empty; returns `200` + the seeded records (with correct field names/casing) when data exists — **seed directly via `AppDbContext`/EF Core in the test fixture, not via a POST call**, since the create endpoint is out of scope until Story 2.3 (see Dev Notes — Known Cross-Story Test Dependency)
  - [x] Do NOT attempt to make the pre-existing `e2e/tests/clientes/clientes-crud.spec.ts` (`FR1`, `FR2 — nombre`, `FR2 — NIT`) pass end-to-end in this story — see Dev Notes below; verify their assertions/locators (`clientes-list-panel`, `cliente-list-item`, `buscar cliente` placeholder) match what you build in Task 4, since Story 2.3 will make them runnable

## Dev Notes

### Architecture patterns and constraints

- **Search Strategy (Critical Decision, architecture.md)**: TanStack Query loads ALL clients on mount (`queryKey: ['clientes']`); filtering is 100% client-side (`useMemo` over the cached array), not a backend query parameter. The REST endpoint table elsewhere in `architecture.md` shows `GET /api/v1/clientes (search?q= optional)` — that optional query param is **not** part of this story's chosen implementation; do not add backend search filtering logic. This keeps `GetClientesQuery` parameterless.
- **Clean Architecture layering**: `SiesaAgents.Domain` (entity + repository interface, zero dependencies) → `SiesaAgents.Application` (query/handler/DTO, references only Domain) → `SiesaAgents.Infrastructure` (EF configuration + repository implementation) → `SiesaAgents.API` (minimal API endpoint). Mirrors the frontend's `domain/application/infrastructure/presentation` module split.
- **State boundaries (architecture.md §State Boundaries)**: server state via TanStack Query (`['clientes']`); the search input value is local component `useState`, explicitly **not** Zustand — no Zustand store is needed for this story.
- **Naming conventions**: C# `ClienteEntity`/`Nombre`/`Nit`/`Telefono`/`Ciudad` (PascalCase) → EF Core `ApplySnakeCaseNaming()` auto-converts to `clientes`/`nombre`/`nit`/`telefono`/`ciudad`/`created_at`/`updated_at`; the unique index name (`uk_clientes_nit`) must be set explicitly (see Task 1) since the naming extension only lowercases/underscores, it doesn't infer the `uk_`/`ix_` prefix convention.
- **API response shape**: `GET` list returns a direct JSON array, never `{ data: [...] }` — matches `architecture.md`'s Format Patterns and the existing `ApiHelper.getClientes()` in the E2E helpers, which already does `response.json()` expecting an array.
- **Error handling (frontend)**: never render `error.message` — always a fixed, safe copy string via `ErrorPanel` (mirrors `architecture.md`'s documented `<ErrorPanel onRetry={refetch} />` pattern, reused verbatim by Stories 2.2+ for their own load failures).

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, v1.0.256 — see Story 1.1/1.2)
- **Search input**: use siesa-ui-kit `Input` (`frontend/node_modules/siesa-ui-kit/dist/components/Input`) — it spreads native `React.InputHTMLAttributes`, so `placeholder`, `aria-label`, `onChange` all work directly; do not build a custom text input
- **Retry button**: use siesa-ui-kit `Button` inside `ErrorPanel`
- **No exported `EmptyState`** exists in the installed siesa-ui-kit's public API (`index.d.ts`) — confirmed in Story 1.2's Dev Notes/Completion Notes. `EmptyState` and `ClientListItem` are genuine custom components under `frontend/src/shared/components/`, exactly as documented in `architecture.md`'s directory tree — this is not a violation of the "check siesa-ui-kit first" rule, it's the already-verified exception.
- **Icons**: Heroicons only if `EmptyState` needs one (`@heroicons/react`); `lucide-react` remains prohibited (Story 1.1 code-review decision).
- Do not use `MasterCrud`/`MasterPatternView` for this view — `architecture.md` explicitly designs `/clientes` as a custom split-panel (`ClienteListView` 280px + detail panel), not a paginated data-grid CRUD screen. `MasterCrud` is reserved for scenarios matching its own contract (paginated table + form orchestration); this story's UX (instant client-side search, list of clickable items, no pagination) does not match that shape.

### Known Cross-Story Test Dependency

The pre-existing `e2e/tests/clientes/clientes-crud.spec.ts` (written ahead of implementation, per project convention) has tests tagged `FR1` and `FR2` that use `ApiHelper.createCliente()` to seed data — that helper calls `POST /api/v1/clientes`, which is **Story 2.3**'s scope, not this story's. This is a known, accepted gap documented in `test-design-epic-2.md` §10 (Assumptions/Dependencies: "backend Clientes vertical slice... does not exist yet at design time"). Do not implement `POST` in this story to make that spec pass early — it would duplicate Story 2.3's validation/uniqueness/toast AC. Instead:
- Verify your `data-testid`s/placeholder text match the page object (`e2e/pages/clientes.page.ts`: `clientes-list-panel`, `cliente-list-item`, `cliente-detail-panel`, `empty-state`, placeholder `/buscar cliente/i`) so the spec becomes runnable the moment Story 2.3 lands, with zero rework here.
- Cover this story's own ACs with component tests (MSW-mocked `GET`) and a backend integration test that seeds via `AppDbContext` directly (bypassing HTTP).

### Project Structure Notes

- New backend files: `SiesaAgents.Domain/Clientes/{Entities,Interfaces}/`, `SiesaAgents.Application/Clientes/{DTOs,Queries}/`, `SiesaAgents.Infrastructure/{Data/Configurations,Repositories}/`, `SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — exactly the paths in `architecture.md`'s Complete Project Directory Structure.
- New frontend files: `frontend/src/modules/crm/clientes/{domain,application,infrastructure,presentation}/`, `frontend/src/shared/components/{EmptyState,ErrorPanel,ClientListItem}.tsx` — also matches the documented tree, except `ErrorPanel.tsx` (not explicitly listed in the tree diagram but required by the same section's prose and by this story's AC4; place it alongside `EmptyState.tsx`).
- Modified: `frontend/src/routes/_app/clientes.tsx` (replace Story 1.2's placeholder), `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (add `DbSet<ClienteEntity>` + apply configuration before `ApplySnakeCaseNaming()`), `backend/src/SiesaAgents.API/Program.cs` (register repository DI + `MapClienteEndpoints()`).
- No changes needed to `ContactoEntity`/contacts code — fully out of scope (Epic 3).

### Testing Standards Summary

- Frontend: Vitest + React Testing Library + MSW, co-located `*.test.tsx`/`*.test.ts` files (per `architecture.md`'s "Tests co-located" convention, e.g. `useClientes.test.ts` beside `useClientes.ts`).
- Backend: xUnit; unit tests in `SiesaAgents.UnitTests/Domain/`, integration tests (`WebApplicationFactory<Program>`) in `SiesaAgents.IntegrationTests/`.
- Relevant test-design cases (`test-design-epic-2.md`): TC-E2-P0-01 (list renders — E2E, blocked until Story 2.3 per above), TC-E2-P1-04 (search perf @ 500 records — component), TC-E2-P1-05 (search by NIT — E2E, same blocker), TC-E2-P1-06 (EmptyState — component), TC-E2-P2-03 (ErrorPanel + retry — component).
- All UI copy in Spanish; ARIA per `ux-design-specification.md`: search container `role="search"`, input `aria-label="Buscar clientes"`, empty/error states `aria-live="polite"` where they dynamically replace list content.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1: Client List & Search]
- Functional requirements: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management] (FR2 list, FR3 search by name, FR4 search by NIT/RUC)
- Non-functional requirements: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Performance] (NFR1), [#Security] (NFR6)
- Architecture — data model, API contract, search strategy, directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture], [#API & Communication Patterns], [#Complete Project Directory Structure], [#Implementation Patterns & Consistency Rules]
- UX specification — EmptyState variants, search/error copy, ARIA: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EmptyState], [#Search & Filtering Patterns], [#Accessibility]
- Epic-level test plan: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Cases by Priority] and [#10. Assumptions and Dependencies]
- Pre-existing E2E assets to align with: [Source: e2e/pages/clientes.page.ts], [Source: e2e/tests/clientes/clientes-crud.spec.ts], [Source: e2e/helpers/api.helper.ts]
- Previous story state (`AppDbContext`, `ApplySnakeCaseNaming()`, `ExceptionHandlingMiddleware`, DI/CORS wiring): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#Dev Notes] and [#File List]
- Previous story state (route tree, `AppShell`, placeholder `/clientes` view, siesa-ui-kit `EmptyState` non-availability finding): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md#Completion Notes List] and [#File List]
- Company stack/DB/UI standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (sa-create-story sub-agent for story creation; sa-dev-story sub-agent for implementation)

### Debug Log References

- `dotnet build SiesaAgents.sln` — clean, 0 warnings/errors after adding the Clientes vertical slice.
- `dotnet ef migrations add CreateClientesTable --project ../SiesaAgents.Infrastructure --startup-project .` (from `backend/src/SiesaAgents.API`) — generated migration creates `clientes` (id uuid PK, nombre/nit/telefono/ciudad varchar, created_at/updated_at timestamptz) + `uk_clientes_nit` unique index, all snake_case, matching Task 1 exactly.
- `dotnet ef database update` — applied successfully against the local reachable PostgreSQL instance (`localhost:5432`).
- `dotnet test SiesaAgents.sln` — 56/56 passing (27 `SiesaAgents.UnitTests` incl. the pre-existing ATDD `ClienteEntityTests`; 29 `SiesaAgents.IntegrationTests` incl. the pre-existing ATDD `ClienteEndpointsTests`, all `[RequiresPostgresFact]` tests executed for real, none skipped, since PostgreSQL was reachable).
- `pnpm test` (Vitest, jsdom) — 29/29 passing across 6 files, including the pre-existing ATDD `ClienteListView.test.tsx` (14 tests) and `ClienteListView.perf.test.tsx` (1 test, NFR1 <1000ms budget met).
- `npx tsc -b --noEmit` — clean, no errors.
- `pnpm run lint` (oxlint) — 0 errors; only the 3 pre-existing `react(only-export-components)` warnings on route files (same accepted pattern as Story 1.2) plus the same warning now also appearing on `clientes.tsx` (required by TanStack Router's file-based routing convention, not a regression).
- `npx vite build` — route tree regenerates correctly (`/_app/clientes`, `/_app/contactos` present in `routeTree.gen.ts`); the build itself still fails at the `vite:css-post`/lightningcss minification step on a pre-existing `bg-[#0e79fd]` literal shipped inside `siesa-ui-kit`'s own `styles.css` — the same pre-existing, unrelated issue already documented in Story 1.2's Debug Log, not caused by this story's code.

### Completion Notes List

- Implemented the full Story 2.1 vertical slice exactly per Dev Notes: `ClienteEntity` (private ctor + `Create()` factory, defense-in-depth validation) → `IClienteRepository`/`ClienteRepository` (`GetAllAsync` only) → `ClienteConfiguration` (explicit `uk_clientes_nit` unique index name) → `AppDbContext.Clientes` → `GetClientesQuery`/`GetClientesQueryHandler` (parameterless, no MediatR in this codebase — handler registered as a scoped DI service and invoked directly from the minimal API endpoint) → `GET /api/v1/clientes` returning a direct `ClienteDto[]` array.
- Frontend: `Cliente`/`IClienteRepository` domain types → `clienteApiRepository` (Axios via shared `apiClient`) → `useClientes` (`queryKey: ['clientes']`) → `ClienteListView` (280px panel, `role="search"` + siesa-ui-kit `Input`, local `useState` search term, `useMemo` case-insensitive substring filter over Nombre/Nit, no debounce/no extra fetch) → `ClientListItem`/`EmptyState`/`ErrorPanel` (all genuine custom components; no `EmptyState` exists in siesa-ui-kit's public API, confirmed again against `index.d.ts`). Wired into `frontend/src/routes/_app/clientes.tsx` alongside a minimal `cliente-detail-panel` placeholder (Story 2.2 scope).
- All pre-existing ATDD RED-phase test files (`ClienteEntityTests.cs`, `ClienteEndpointsTests.cs`, `ClienteListView.test.tsx`, `ClienteListView.perf.test.tsx`, `cliente.factory.ts`) went GREEN with zero modifications to the tests themselves — the implementation was built to match their exact expected contracts (data-testids, aria-label, placeholder text, `queryKey`, response shape).
- **Two pre-existing test regressions found and fixed** (both expected consequences of this story being the first to add a real domain table/route dependency, not defects introduced without cause):
  1. `backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs` — `Database_ContainsOnlyMigrationsHistoryTable_NoDomainTables` asserted zero domain tables, which was only true prior to Epic 2. Renamed to `Database_ContainsOnlyExpectedTables_NoUnrelatedDomainTables` and updated the assertion to expect `["__ef_migrations_history", "clientes"]` — still guards against unrelated/unexpected tables (e.g. a premature `contactos`).
  2. `frontend/src/app/routing.test.tsx` and `routing.edge-cases.test.tsx` — both pre-existing Story 1.2 tests render the full route tree via `RouterProvider` with no `QueryClientProvider`. Since `/clientes` now mounts `ClienteListView` (which calls `useClientes()`), rendering crashed with "No QueryClient set". Fixed by wrapping `renderAppAt`'s render in a local `QueryClientProvider` in both files, mirroring the real app shell's `main.tsx` composition (`QueryProvider` wraps `RouterProvider`). No assertions/intent changed.
- Restored the `<h1>Clientes</h1>` page title (`text-4xl font-bold tracking-tight`, per `ux-design-specification.md`'s Page Titles convention) in `clientes.tsx` above the split-panel layout — the Story 1.2 placeholder had one and two of its pre-existing routing tests assert `getByRole('heading', { name: /clientes/i })`; the split-panel list/detail UI sits below it.
- Verified `e2e/pages/clientes.page.ts` / `e2e/tests/clientes/clientes-crud.spec.ts` locators (`clientes-list-panel`, `cliente-list-item`, `cliente-detail-panel`, `empty-state`, placeholder `/buscar cliente/i`) all match this story's implementation exactly, per Task 6's alignment requirement — did not attempt to make the CRUD E2E spec pass (blocked on Story 2.3's POST endpoint, as documented).
- No FluentValidation/Zod validation added (explicitly out of scope, Story 2.3). No Zustand store added (search term is local component state per architecture). No MediatR dependency introduced — this codebase's CQRS handlers are plain DI-scoped classes invoked directly from minimal API endpoints, consistent with the existing `SiesaAgents.Application` project having no MediatR package reference.

### File List

**Created (backend):**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260706062518_CreateClientesTable.cs` (+ `.Designer.cs`, updated `AppDbContextModelSnapshot.cs`)

**Modified (backend):**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (added `DbSet<ClienteEntity> Clientes`, applied `ClienteConfiguration`)
- `backend/src/SiesaAgents.API/Program.cs` (registered `IClienteRepository`/`GetClientesQueryHandler` DI, called `MapClienteEndpoints()`)
- `backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs` (updated stale "no domain tables" assertion — see Completion Notes)

**Created (frontend):**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`

**Modified (frontend):**
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (pre-existing empty file target of ATDD tests — implemented)
- `frontend/src/routes/_app/clientes.tsx` (replaced Story 1.2 placeholder with `<h1>` + `ClienteListView` + detail panel placeholder)
- `frontend/src/app/routing.test.tsx` (added `QueryClientProvider` wrapper — see Completion Notes)
- `frontend/src/app/routing.edge-cases.test.tsx` (added `QueryClientProvider` wrapper — see Completion Notes)

**Pre-existing, unmodified this story (from prior ATDD sub-agent run):**
- `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx`
- `frontend/src/test/factories/cliente.factory.ts`
- `e2e/pages/clientes.page.ts`, `e2e/tests/clientes/clientes-crud.spec.ts` (verified alignment only, not modified)

**Auto-generated (gitignored, not committed):**
- `frontend/src/routeTree.gen.ts` (regenerated to reflect no structural change — `/_app/clientes` route id unchanged)
