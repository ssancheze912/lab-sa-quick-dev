# Story 2.1: Client List & Search

Status: ready-for-dev

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

- [ ] Task 1 — `ClienteEntity` domain model + `clientes` table migration (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`: private constructor + `public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)` factory (validates non-empty args, throws `ArgumentException` otherwise — defense-in-depth, full FluentValidation/Zod validation belongs to Story 2.3). Properties: `Guid Id` (init via `Guid.NewGuid()`), `Nombre`, `Nit`, `Telefono`, `Ciudad` (all `string`), `CreatedAt`/`UpdatedAt` (`DateTimeOffset`, never `DateTime`)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken)` — only the read method this story needs; do NOT add `CreateAsync`/`UpdateAsync`/`DeleteAsync`/`GetByIdAsync` yet (Stories 2.2–2.5 extend this interface)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` (`IEntityTypeConfiguration<ClienteEntity>`): `HasKey(c => c.Id)`; `Property(c => c.Nombre)`/`Nit`/`Telefono`/`Ciudad` required, reasonable `HasMaxLength`; **`HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`** — set the database name explicitly; `ApplySnakeCaseNaming()` only converts casing, it does NOT add the `uk_` prefix required by company DB conventions
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext` and apply `ClienteConfiguration` in `OnModelCreating` (before the existing `ApplySnakeCaseNaming()` call, which must remain last)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository.GetAllAsync` via `AppDbContext.Clientes.AsNoTracking().ToListAsync(...)`
  - [ ] Register `IClienteRepository` → `ClienteRepository` as `AddScoped` in `Program.cs`
  - [ ] From `backend/src/SiesaAgents.API`: `dotnet ef migrations add CreateClientesTable --project ../SiesaAgents.Infrastructure --startup-project .` — verify the generated migration creates the `clientes` table with columns `id (uuid PK)`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at` and the `uk_clientes_nit` unique index (all snake_case); run `dotnet ef database update`

- [ ] Task 2 — `GetClientesQuery` + DTO + `GET /api/v1/clientes` endpoint (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`: `Id (Guid)`, `Nombre`, `Nit`, `Telefono`, `Ciudad` (string), `CreatedAt (DateTimeOffset)`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (empty marker record — **no search parameter**, see Dev Notes on Search Strategy) + `GetClientesQueryHandler.cs` calling `IClienteRepository.GetAllAsync` and mapping to `List<ClienteDto>`
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with a `MapClienteEndpoints(this IEndpointRouteBuilder app)` extension: `app.MapGroup("/api/v1/clientes")` then `.MapGet("/", ...)` → 200 OK + `ClienteDto[]` (direct array, no wrapper, per architecture's API response-shape convention). Do NOT add POST/PUT/DELETE routes in this story (Stories 2.3–2.5 scope)
  - [ ] Call `app.MapClienteEndpoints();` in `Program.cs`
  - [ ] No new error-handling code needed — the existing global `ExceptionHandlingMiddleware` (Story 1.3) already converts any unhandled exception from this endpoint into a Problem Details response; verify by inspection, do not duplicate

- [ ] Task 3 — Frontend `clientes` module: domain + data layer (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`: `export interface Cliente { id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string }`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: `export interface IClienteRepository { getAll(): Promise<Cliente[]> }`
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: Axios implementation using the shared `apiClient` (`frontend/src/shared/lib/apiClient.ts`) — `GET /api/v1/clientes`, returns `response.data`
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`: TanStack Query hook, **`queryKey: ['clientes']`** (array form, never a string), `queryFn: () => clienteApiRepository.getAll()`

- [ ] Task 4 — `ClienteListView` with real-time search (AC: #1, #2)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`: displays Nombre (primary) + NIT/RUC (secondary), `data-testid="cliente-list-item"`
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`: 280px left panel, `data-testid="clientes-list-panel"`; search field using siesa-ui-kit `Input` (`placeholder="Buscar cliente..."`, `aria-label="Buscar clientes"`, wrapped in a container with `role="search"`); local `useState<string>` for the search term (per architecture: client-side filter state is local React state, NOT Zustand); `useMemo` filtering `useClientes()`'s cached array by `nombre`/`nit` (case-insensitive substring match) on every keystroke — no debounce, no additional fetch (NFR1: <1s at 500 records via in-memory filter)
  - [ ] Wire `ClienteListView` into `frontend/src/routes/_app/clientes.tsx`, replacing the Story 1.2 placeholder (heading + plain paragraph). Render `ClienteListView` (left) plus a minimal placeholder right panel (`data-testid="cliente-detail-panel"`, e.g. "Selecciona un cliente para ver su detalle") — the real `ClienteDetailView` is Story 2.2 scope, do not build it here

- [ ] Task 5 — `EmptyState` and `ErrorPanel` shared components (AC: #3, #4)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`: reusable component, props `{ title: string; subtitle?: string; icon?: ReactNode; testId?: string }`; render with `data-testid="empty-state"` and `aria-live="polite"` (per `ux-design-specification.md`). No `EmptyState` exists in the installed `siesa-ui-kit@1.0.256` public API (confirmed in Story 1.2 — the package's internal `EmptyState` is unexported/private to `MasterPatternView`) — this is a genuine custom component per `architecture.md`'s directory tree, not a siesa-ui-kit wrapper
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`: props `{ message: string; onRetry: () => void }`; render `data-testid="error-panel"`, message text, and a `Button` (siesa-ui-kit) labeled "Reintentar" calling `onRetry`. Never render `error.message`/raw exception text (NFR6) — only the fixed, safe `message` string
  - [ ] In `ClienteListView`, branch on `useClientes()`'s query state: `isError` → `<ErrorPanel message="No se pudo cargar" onRetry={refetch} />`; `isSuccess && filteredClientes.length === 0 && searchTerm === ''` → `<EmptyState title="No hay clientes registrados" subtitle="Crea el primer cliente del sistema" />` (the "no-clients" variant, distinct from the future "search-empty" no-results variant which is not part of this story's AC); otherwise render the list

- [ ] Task 6 — Tests (AC: #1, #2, #3, #4)
  - [ ] Component tests (Vitest + RTL + MSW), co-located as `ClienteListView.test.tsx`: renders list items with Nombre + NIT/RUC when data loads (AC1); typing in the search field filters by Nombre and independently by NIT in real time, no extra network call fires per keystroke (AC2); renders `EmptyState` when the mocked response is `[]` (AC3, TC-E2-P1-06); renders `ErrorPanel` when the mocked request rejects/500s, and clicking "Reintentar" re-invokes the query function (AC4, TC-E2-P2-03)
  - [ ] Component perf test (co-located or dedicated `*.test.ts`): seed a 500-record fixture into the mocked `['clientes']` cache, type a search term, assert filtered render completes well under 1s via `performance.now()` (NFR1, TC-E2-P1-04)
  - [ ] Backend unit test `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`: `Create()` sets all properties, generates a new `Guid`, rejects empty/whitespace `nombre`/`nit`/`telefono`/`ciudad`
  - [ ] Backend integration test `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`: `GET /api/v1/clientes` returns `200` + `[]` when the table is empty; returns `200` + the seeded records (with correct field names/casing) when data exists — **seed directly via `AppDbContext`/EF Core in the test fixture, not via a POST call**, since the create endpoint is out of scope until Story 2.3 (see Dev Notes — Known Cross-Story Test Dependency)
  - [ ] Do NOT attempt to make the pre-existing `e2e/tests/clientes/clientes-crud.spec.ts` (`FR1`, `FR2 — nombre`, `FR2 — NIT`) pass end-to-end in this story — see Dev Notes below; verify their assertions/locators (`clientes-list-panel`, `cliente-list-item`, `buscar cliente` placeholder) match what you build in Task 4, since Story 2.3 will make them runnable

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

Claude Sonnet 5 (sa-create-story sub-agent)

### Debug Log References

### Completion Notes List

### File List
