# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px, `.panel-list` per UX spec) shows a scrollable list of all clients with `Nombre` and `NIT/RUC` visible per item (AC-E2.2, Story 2.1 AC).

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time (client-side, in-memory) showing only clients whose `Nombre` or `NIT/RUC` match the input (case-insensitive substring match). **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system (empty dataset, not a failed search), **When** the user navigates to `/clientes`, **Then** an `EmptyState` component (`no-clients` variant) is displayed with a message guiding the user to create the first client. This state MUST be visually/structurally distinct from the "zero search results" case (AC #4).

4. **Given** the client list is loaded with clients and the user types a search query that matches none of them, **When** the filter is applied, **Then** a "no results for this search" indicator is shown (`EmptyState` `search-empty` variant, NOT the `no-clients` variant), and the search input retains its typed value.

5. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list. Clicking "Reintentar" re-triggers the fetch; on success, the list renders normally.

## Tasks / Subtasks

- [ ] Task 1 — Backend: `clientes` domain foundation (AC: #1, #2)
  - [ ] Create `ClienteEntity` in `backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs` — UUID `Id` (Guid, `Guid.NewGuid()` default per company standard), `Nombre` (string, required), `Nit` (string, required), `Telefono` (string, required), `Ciudad` (string, required), `CreatedAt`/`UpdatedAt` (`DateTimeOffset`, NEVER `DateTime`). Private constructor + static `Create(...)` factory method (company standard entity pattern). No domain events needed for this read-only story, but keep the factory pattern for consistency with future Epic 2 stories (2.3/2.4/2.5 will add mutation behavior to this same entity).
  - [ ] Create `IClienteRepository` interface in `backend/src/SiesaAgents.Domain/Repositories/IClienteRepository.cs` (or `Domain/Interfaces/` if that's the established pattern) with at minimum `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? searchTerm, CancellationToken ct)` — this story only needs the list/search read path; do NOT add `Create`/`Update`/`Delete` methods yet (those belong to Stories 2.3/2.4/2.5, keep scope tight).
  - [ ] Create `ClienteConfiguration.cs` (`IEntityTypeConfiguration<ClienteEntity>`) in `backend/src/SiesaAgents.Infrastructure/Data/Configurations/` — configure `Id` as PK, `Nit` with a unique index (`HasIndex(c => c.Nit).IsUnique()` → generates `uk_clientes_nit` per naming convention `uk_{table}_{columns}`), required fields as `IsRequired()`. Do NOT use `[Table]`/`[Column]` attributes — naming is handled by the existing `ApplySnakeCaseNaming()` extension (Story 1.3) which runs LAST in `OnModelCreating`.
  - [ ] Register `DbSet<ClienteEntity> Clientes` in `AppDbContext` (`backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`) and confirm `ApplyConfigurationsFromAssembly(...)` (already scaffolded in Story 1.3) picks up `ClienteConfiguration` automatically.
  - [ ] Create `ClienteRepository : IClienteRepository` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — `GetAllAsync` implements case-insensitive filter on `Nombre` OR `Nit` when `searchTerm` is provided (`EF.Functions.ILike` for PostgreSQL, or `.Contains()` with `ToLower()` — prefer `ILike` per Postgres-native case-insensitive matching), ordered by `CreatedAt` descending by default (matches Story 2.6's future "Más reciente" default, but sort itself is out of scope here — just don't return unordered).
  - [ ] Generate EF Core migration: from `backend/src/SiesaAgents.Infrastructure`, run `dotnet ef migrations add AddClienteEntity --startup-project ../SiesaAgents.API --output-dir Data/Migrations`. Verify the migration creates the `clientes` table (snake_case columns: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`) and the `uk_clientes_nit` unique index. Apply via `dotnet ef database update --startup-project ../SiesaAgents.API`.

- [ ] Task 2 — Backend: Query handler + DTO + endpoint (AC: #1, #2)
  - [ ] Create `ClienteDto.cs` in `backend/src/SiesaAgents.Application/DTOs/` — `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` (map from `ClienteEntity`).
  - [ ] Create `GetClientesQuery.cs` + `GetClientesQueryHandler.cs` in `backend/src/SiesaAgents.Application/Queries/Clientes/` — CQRS query pattern (company standard), takes optional `string? SearchTerm`, calls `IClienteRepository.GetAllAsync`, maps to `IReadOnlyList<ClienteDto>`.
  - [ ] Create `ClienteEndpoints.cs` in `backend/src/SiesaAgents.API/Endpoints/` — Minimal API (NO controllers): `app.MapGet("/api/v1/clientes", ...)` accepting optional `string? q` query param, dispatches `GetClientesQuery`, returns `200 OK` with the DTO list. Register endpoint group in `Program.cs` (`app.MapClienteEndpoints()` or equivalent extension method pattern, matching however `Program.cs` currently registers endpoint groups from Story 1.1/1.3).
  - [ ] Ensure the endpoint is documented via Scalar (`app.MapScalarApiReference()` already configured — no per-endpoint action needed beyond standard Minimal API metadata like `.WithName()`/`.WithTags("Clientes")`).
  - [ ] This backend search endpoint (`GET /api/v1/clientes?q=`) is a fallback/independent path per architecture (§ Search Strategy) — the PRIMARY filtering strategy for AC #2 is client-side (see Task 4). Both paths must work independently (TC-E2-P2-08 tests the backend path in isolation).

- [ ] Task 3 — Frontend: `clientes` module scaffolding + domain/application/infrastructure layers (AC: #1, #2, #3, #5)
  - [ ] Create Clean Architecture module skeleton at `frontend/src/modules/crm/clientes/` (first story to scaffold this module — no `modules/` folder exists yet per Story 1.2's explicit scope boundary):
    - `domain/entities/Cliente.ts` — TypeScript interface: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string` (ISO string from API).
    - `domain/repositories/IClienteRepository.ts` — interface: `getAll(searchTerm?: string): Promise<Cliente[]>`.
    - `infrastructure/repositories/clienteApiRepository.ts` — Axios implementation of `IClienteRepository`, calls `GET /api/v1/clientes` (optionally with `?q=` — used only if a story later needs server-side search; this story's primary UX path filters client-side per architecture).
    - `application/hooks/useClientes.ts` — TanStack Query hook, `queryKey: ['clientes']` (canonical key per architecture — do NOT use a string key), `queryFn` calls `clienteApiRepository.getAll()` (no search param — fetch ALL records once, filter client-side), staleTime per project convention.
  - [ ] Create `presentation/components/ClienteListView.tsx` — the `/clientes` route's list panel (280px, `.panel-list` per UX spec `flex-shrink: 0`). Renders:
    - A search `Input` (siesa-ui-kit) bound to local `useState<string>` (NOT Zustand — architecture mandates local React state for `searchQuery`).
    - The filtered list via `useMemo` over the `useClientes()` cache data, matching `nombre` OR `nit` case-insensitively against the search term (client-side filter — the < 1s/500-records NFR1 path).
    - Each row rendered via `ClientListItem` (custom component, siesa-ui-kit has no direct equivalent per architecture's Component Strategy) showing `Nombre` and `NIT/RUC`.
  - [ ] Create `ClientListItem.tsx` in `frontend/src/shared/components/` (shared/reusable, not module-specific, matching Story 1.2's precedent of putting cross-cutting presentational components in `shared/components/`) — displays `nombre` and `nit`, accepts `onClick`/`selected` props for future Story 2.2 wiring (detail selection is out of this story's scope — do not implement `onClick` navigation yet, just accept the prop for forward compatibility).
  - [ ] Reuse/create `EmptyState.tsx` in `frontend/src/shared/components/` (per architecture directory tree, `EmptyState.tsx` is the reusable empty-state component) with a variant prop supporting at least `'no-clients'` and `'search-empty'` (per UX spec §Component Strategy: `EmptyState` variants `search-empty` · `no-contacts` · `no-clients`). `no-clients`: message guiding the user to create the first client. `search-empty`: message indicating no results for the current search term, distinct copy from `no-clients` (AC #3 vs #4 must render structurally/visually distinct states — do not conflate them per Test Design R10/item 7).
  - [ ] Create `ErrorPanel.tsx` in `frontend/src/shared/components/` (if not already present) — accepts `onRetry: () => void`, renders a "Reintentar" button (siesa-ui-kit `Button`) that calls `onRetry`. Per architecture's error-handling rule: never render `error.message` directly.

- [ ] Task 4 — Frontend: wire `/clientes` route to the real list view (AC: #1, #2, #3, #4, #5)
  - [ ] Replace the Story 1.2 placeholder in `frontend/src/routes/_app/clientes.tsx` with `<ClienteListView />` (the real list panel). Do NOT implement the detail panel or split-panel layout composition itself in this story if that belongs structurally to Story 2.2 — however, since `ClienteListView` needs a host layout, render it standalone at `/clientes` for now; Story 2.2 will add the adjacent detail panel without needing to restructure this route file (compose, don't rewrite).
  - [ ] Wire `useClientes()` loading/error/success states in `ClienteListView`:
    - `isLoading` → skeleton loading state using `react-loading-skeleton` (company standard: skeleton screens, not spinners).
    - `isError` → render `<ErrorPanel onRetry={refetch} />` instead of the list (AC #5).
    - `isSuccess` + `data.length === 0` → render `<EmptyState variant="no-clients" />` (AC #3).
    - `isSuccess` + `data.length > 0` + filtered result is empty → render `<EmptyState variant="search-empty" />` while keeping the search input visible and populated (AC #4).
    - `isSuccess` + filtered result non-empty → render the list of `ClientListItem`s (AC #1, #2).
  - [ ] Confirm no additional `useQuery`/refetch call is triggered on every keystroke — the search `Input`'s `onChange` only updates local `searchQuery` state; filtering happens via `useMemo` over already-fetched cache data (architecture's Search Strategy: "Client-side filtering sobre ≤ 500 registros garantiza NFR1 sin backend search complexity"). This is the exact pattern Story 2.6 (Sort) will later share.

- [ ] Task 5 — Tests (AC: all)
  - [ ] Backend xUnit: `ClienteRepositoryTests` (or integration test) — verify `GetAllAsync` returns correctly filtered results by `Nombre`/`Nit` substring, case-insensitive (supports TC-E2-P2-08 backend-path coverage).
  - [ ] Backend xUnit integration: `ClienteEndpointsTests` — `GET /api/v1/clientes` returns `200` with all clients; `GET /api/v1/clientes?q=<term>` returns filtered results independent of frontend logic.
  - [ ] Frontend Vitest + RTL: `ClienteListView.test.tsx` — covers TC-E2-P1-01 (real-time search filters by Nombre/NIT), TC-E2-P1-03 (EmptyState when zero clients via MSW returning `[]`), TC-E2-P1-04 (zero search results shows distinct "no results" state, search input retains value), TC-E2-P1-05 (ErrorPanel + Reintentar re-triggers fetch on failure→success), TC-E2-P2-04 (each list row shows Nombre + NIT).
  - [ ] Frontend Vitest: performance-oriented test seeding 500 mock clients, asserting the filter's render/update completes in <1000ms (TC-E2-P1-02) — use `performance.now()` around the filter operation or an RTL interaction timing assertion.
  - [ ] MSW handlers for `GET /api/v1/clientes`: success (list), success (empty array), 500/network failure — added to the project's shared MSW handler file per architecture's testing tooling requirements.

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the client list + search read path. It does **not** implement:
- Client detail view / selection navigation (Story 2.2 — `ClientListItem`'s `onClick` prop is accepted here but not wired to navigation)
- Create/Edit/Delete mutations (Stories 2.3/2.4/2.5) — `IClienteRepository` and the API surface stay read-only (`GetAllAsync` only) in this story
- Sort controls (Story 2.6) — default ordering is `CreatedAt` descending server-side, but no `SortControl` UI or client-side re-sort logic belongs here

`ClienteEntity` and its EF configuration ARE created in this story (first story to touch the `clientes` domain) — subsequent Epic 2 stories will extend the entity's behavior (e.g., add `Update`/mutation methods) but must not redefine the table/migration from scratch.

### Previous Story Intelligence (Stories 1.1, 1.2, 1.3)

- Backend Clean Architecture skeleton exists: `SiesaAgents.Domain/Entities/`, `Repositories/`, `Application/{Commands,Queries,DTOs,Validators,Interfaces}/`, `Infrastructure/Data/{Configurations,Migrations}/`, `Infrastructure/Repositories/`, `API/Endpoints/` — all currently empty except scaffolding. This story is the FIRST to populate `Domain/Entities`, `Data/Configurations`, `Infrastructure/Repositories`, and `API/Endpoints` with real files.
- `AppDbContext` exists with **zero `DbSet`s** (Story 1.3 explicit scope boundary) — this story adds the first one (`DbSet<ClienteEntity> Clientes`).
- `ApplySnakeCaseNaming()` custom extension (in `ModelBuilderExtensions.cs`) MUST remain the LAST call in `OnModelCreating` — add `ClienteConfiguration` via `ApplyConfigurationsFromAssembly` BEFORE that last call (already scaffolded per Story 1.3; just confirm ordering is unchanged).
- `SnakeCaseNpgsqlHistoryRepository` (Story 1.3) already ensures `__ef_migrations_history` uses snake_case — no action needed here, just don't break it when adding the new migration.
- `ExceptionHandlingMiddleware` (Story 1.3, hardened) already returns Problem Details RFC 7807 for unhandled exceptions with structured `ILogger` logging and no stack-trace leakage — no changes needed for this story (no error paths beyond a plain `200`/list response are introduced here; 409/validation error paths arrive in Story 2.3).
- Frontend: `frontend/src/modules/` does **not exist yet** — Story 1.2 explicitly deferred `modules/crm/clientes` scaffolding to this story. This is the first story to create it.
- `frontend/src/shared/components/` currently has `AppShell.tsx`, `NotFoundView.tsx`, and a `ui/` folder (likely shadcn primitives) — `EmptyState.tsx`, `ErrorPanel.tsx`, `ClientListItem.tsx` are new additions in this story.
- `frontend/src/routes/_app/clientes.tsx` currently renders a placeholder (`<div>Clientes</div>` or equivalent per Story 1.2) — this story replaces it with the real `ClienteListView`.
- `siesa-ui-kit` is already installed (`^1.0.250`) and `@heroicons/react` was added in Story 1.2 — reuse both, no reinstall.
- Story 1.2's code review found and fixed an issue by verifying claims with `find`/`ls` before listing files — apply the same discipline: confirm every created file actually exists on disk before recording it in File List.
- `pnpm` is the package manager — use `pnpm add` for any new dependency (none anticipated for this story: `react-loading-skeleton` should already be a company-standard dependency; verify presence before adding).

### Architecture References

- REST endpoint: `GET /api/v1/clientes` (search via optional `?q=`) — [Source: _bmad-output/planning-artifacts/architecture.md#API Design / REST Endpoints]
- Data model: `clientes` table — `id (uuid PK)`, `nombre`, `nit (unique)`, `telefono`, `ciudad`, `created_at`, `updated_at`; index `uk_clientes_nit` — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- `ClienteEntity`: `ID (Guid)`, `Nombre`, `NIT`, `Telefono`, `Ciudad`, `CreatedAt`/`UpdatedAt` (`DateTimeOffset`) — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Search Strategy: TanStack Query loads all records on mount (`queryKey: ['clientes']`); filtering is client-side in the component (<50ms @ 500 records) — [Source: _bmad-output/planning-artifacts/architecture.md#Search Strategy]
- Query key convention: `['clientes']` (list), `['clientes', id]` (single) — array form mandatory, NOT string keys — [Source: _bmad-output/planning-artifacts/architecture.md#State Management]
- `searchQuery` is local React `useState`, NOT Zustand — [Source: _bmad-output/planning-artifacts/architecture.md#State Management]
- Frontend directory structure: `modules/crm/clientes/{domain,application,infrastructure,presentation}` — file names `Cliente.ts`, `IClienteRepository.ts`, `useClientes.ts`, `clienteApiRepository.ts`, `ClienteListView.tsx` — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- `EmptyState.tsx` lives in `shared/components/` as a reusable component — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Error handling: never render `error.message` directly; use `<ErrorPanel onRetry={refetch} />` for load failures — [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling]
- Layout: client list panel is 280px, `.panel-list { width: 280px; flex-shrink: 0; }` — [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design, Layout Grid]
- `ClientListItem` component spec — [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy, ClientListItem]
- `EmptyState` variants: `search-empty` · `no-contacts` · `no-clients` — [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy, EmptyState]
- NFR1 (search <1s @ 500 records): client-side filtering for small dataset — [Source: _bmad-output/planning-artifacts/architecture.md#NFR Table]
- Company stack standards (UUID PKs, `DateTimeOffset`, `ApplySnakeCaseNaming()`, no `[Column]`/`[Table]` attributes, CQRS, Minimal API, Scalar, TanStack Query/Router, Zustand only for client state, `pnpm`, skeleton loading states, Heroicons): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (backend scaffold state, AppDbContext zero-DbSet boundary, snake-case pipeline, frontend module non-existence): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md], [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements (search `Input`, `Button` for "Reintentar", any layout primitives) before building custom components.
- **Constraint**: Do not create custom components (`ClientListItem`, `EmptyState`, `ErrorPanel`) if a `siesa-ui-kit` equivalent exists — per architecture's Component Strategy, these three ARE custom by explicit architectural decision (no direct siesa-ui-kit equivalents), so building them custom in `shared/components/` is correct and required, not a violation.
- Icons: Heroicons primary (already installed) for any empty-state/error-state iconography.
- All user-facing text (search placeholder, EmptyState/ErrorPanel copy, "Reintentar" label) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests; repository test can use EF Core InMemory OR a real Postgres connection (InMemory is acceptable here since no FK/cascade behavior is being tested — that constraint only applies to Story 2.5's delete-orphaning test per Test Design R2).
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards.
- Test Design references (Epic 2 test plan): TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-04, TC-E2-P1-05, TC-E2-P2-04, TC-E2-P2-08 — [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Cases by Priority]
- Non-negotiable constraint from Test Design §10, item 7: `EmptyState` (zero clients) and "no search results" states must be visually/structurally distinct — do not conflate them.
- Non-negotiable constraint from Test Design §10, item 5 (forward-looking, applies once Story 2.6 lands): sorting/searching must operate purely over the `['clientes']` TanStack Query cache with no additional fetch — this story establishes that cache/query-key foundation correctly now to avoid rework.

### Project Structure Notes

- First story to create `frontend/src/modules/crm/clientes/` — establishes the Clean Architecture module pattern (`domain/application/infrastructure/presentation`) that Stories 2.2–2.6 and Epic 3's `contactos` module will replicate.
- First story to populate backend `Domain/Entities`, `Infrastructure/Data/Configurations`, `Infrastructure/Repositories`, `Application/{Queries,DTOs}`, `API/Endpoints` with real (non-scaffold) files.
- No variance from the unified project structure anticipated — directly follows the architecture's documented directory tree.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
