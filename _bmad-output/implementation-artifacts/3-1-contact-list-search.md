# Story 3.1: Contact List & Search

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all contacts and search them by name or email,
so that I can quickly find any contact regardless of their client association.

## Acceptance Criteria

1. **Given** there are contacts in the system, **When** the user navigates to `/contactos`, **Then** a list of all contacts is displayed showing `Nombre`, `Cargo`, and `Email` per item (FR10, AC-E3.1/AC-E3.2, TC-E3-P2-05).

2. **Given** the contact list is loaded, **When** the user types in the search field, **Then** the list filters in real time (client-side, in-memory) showing only contacts whose `Nombre` OR `Email` match the input (case-insensitive substring match — both fields must be checked independently, a Nombre-only filter silently fails this AC per Test Design R6). **And** results appear in under 1 second with up to 1,000 records (NFR1, NFR10, FR11, FR12, TC-E3-P1-01, TC-E3-P1-02).

3. **Given** there are no contacts in the system (empty dataset, not a failed search), **When** the user navigates to `/contactos`, **Then** an `EmptyState` component (`no-contacts` variant) is displayed guiding the user to create the first contact. This state MUST be visually/structurally distinct from the "zero search results" case (AC #4) (TC-E3-P1-03).

4. **Given** the contact list is loaded with contacts and the user types a search query that matches none of them, **When** the filter is applied, **Then** a "no results for this search" indicator is shown (`EmptyState` `search-empty` variant, NOT the `no-contacts` variant), and the search input retains its typed value (TC-E3-P1-04).

5. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list. Clicking "Reintentar" re-triggers the fetch; on success, the list renders normally (TC-E3-P1-05).

## Tasks / Subtasks

- [x] Task 1 — Backend: `IContactoRepository` + EF repository on top of the EXISTING `contactos` schema (AC: #1, #2)
  - [x] **Do NOT create a new migration and do NOT modify `ContactoConfiguration.cs`'s FK definition.** `ContactoEntity` (`backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs`), `ContactoConfiguration.cs` (`backend/src/SiesaAgents.Infrastructure/Data/Configurations/`), the `Contactos` DbSet on `AppDbContext`, and migration `20260701084227_AddContactoEntity` already exist (Story 2.5) with `Id`, `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (`Guid?`), `CreatedAt`/`UpdatedAt` (`DateTimeOffset`), FK `fk_contactos_clientes` `ON DELETE SET NULL`. This story is purely additive on top of that (TC-E3-P0-01 gate — Epic constraint). Verified untouched.
  - [x] Create `IContactoRepository` interface in `backend/src/SiesaAgents.Domain/Repositories/IContactoRepository.cs`, mirroring `IClienteRepository`'s exact shape/style — this story only needs the read path: `Task<IReadOnlyList<ContactoEntity>> GetAllAsync(string? searchTerm, CancellationToken ct)`. Do NOT add `Create`/`Update`/`Delete`/`GetById` methods yet (those belong to Stories 3.2/3.3/3.4/3.5 — keep scope tight, same discipline as Story 2.1).
  - [x] Create `ContactoRepository : IContactoRepository` in `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — `GetAllAsync` implements a case-insensitive filter that matches `searchTerm` against `Nombre` **OR** `Email` (both fields, per AC #2/R6 — a single-field check on `Nombre` alone fails this story) using `EF.Functions.ILike` (Postgres-native case-insensitive matching, same pattern as `ClienteRepository.GetAllAsync`), ordered by `CreatedAt` descending by default.

- [x] Task 2 — Backend: Query handler + DTO + endpoint (AC: #1, #2)
  - [x] Create `ContactoDto.cs` in `backend/src/SiesaAgents.Application/DTOs/` — `Id`, `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (nullable), `CreatedAt` (map from `ContactoEntity`).
  - [x] Create `GetContactosQuery.cs` + `GetContactosQueryHandler.cs` in `backend/src/SiesaAgents.Application/Queries/Contactos/` (flat `Application/{Kind}/{Domain}/` — actual on-disk convention confirmed across Epic 2, NOT the architecture doc's illustrative `Application/Contactos/Queries/` path) — CQRS query pattern, takes optional `string? SearchTerm`, calls `IContactoRepository.GetAllAsync`, maps to `IReadOnlyList<ContactoDto>`.
  - [x] Create `ContactoEndpoints.cs` in `backend/src/SiesaAgents.API/Endpoints/` — Minimal API (NO controllers): `app.MapGet("/api/v1/contactos", ...)` accepting optional `string? q` query param, dispatches `GetContactosQuery`, returns `200 OK` with the DTO list. Register the endpoint group in `Program.cs` (`app.MapContactoEndpoints()`, matching the exact pattern `app.MapClienteEndpoints()` already uses). Tag `.WithTags("Contactos")`, name `"GetContactos"` (documented via Scalar automatically — no extra action needed).
  - [x] Register `GetContactosQueryHandler` in DI (`Program.cs`), alongside the existing Cliente query/command handler registrations.
  - [x] This backend search endpoint (`GET /api/v1/contactos?q=`) is a fallback/independent path per architecture — the PRIMARY filtering strategy for AC #2 is client-side (see Task 4). Both paths must filter on Nombre AND Email independently (TC-E3-P2-07 tests the backend path in isolation).

- [x] Task 3 — Backend: schema-reuse regression test (AC: cross-cutting, mandatory gate)
  - [x] Add an xUnit integration test asserting no pending EF Core model changes exist for the `contactos` table after adding `ContactoRepository`/`GetContactosQuery`/`ContactoEndpoints` (e.g., assert `AppDbContextModelSnapshot.cs` reflects no diff, or use `dotnet ef migrations has-pending-model-changes` equivalent check) — TC-E3-P0-01, non-negotiable per Test Design. Implemented as `ContactoSchemaReuseTests.cs`.
  - [x] Add (or confirm still green) an xUnit integration test against real/TestContainers PostgreSQL that creates a client, creates contacts via the **new** `POST`-less seeding (direct `AppDbContext` insert is fine here since `POST /api/v1/contactos` doesn't exist until Story 3.3) with `ClienteId` set, deletes the client, and asserts the contacts still exist with `ClienteId == null` — TC-E3-P0-02 regression gate proving this story's new repository/endpoint layer sits correctly on top of the unchanged FK behavior (`fk_contactos_clientes`, `ON DELETE SET NULL` from Story 2.5). Do NOT use EF Core InMemory for this specific test (FK behavior is not enforced by InMemory). Already present in `ContactoRepositoryTests.cs` (ATDD) — confirmed green.

- [x] Task 4 — Frontend: `contactos` module scaffolding + domain/application/infrastructure layers (AC: #1, #2, #3, #5)
  - [x] Create Clean Architecture module skeleton at `frontend/src/modules/crm/contactos/`, mirroring `frontend/src/modules/crm/clientes/` structure exactly:
    - `domain/entities/Contacto.ts` — TypeScript interface: `id: string`, `nombre: string`, `cargo: string`, `telefono: string`, `email: string`, `clienteId: string | null`, `createdAt: string` (ISO string from API). Already existed (ATDD scaffolding), confirmed matching shape.
    - `domain/repositories/IContactoRepository.ts` — interface: `getAll(searchTerm?: string): Promise<Contacto[]>`. Already existed (ATDD scaffolding), confirmed matching shape.
    - `infrastructure/repositories/contactoApiRepository.ts` — Axios implementation of `IContactoRepository`, calls `GET /api/v1/contactos` (optionally with `?q=`, used only for the independent backend-search fallback path; this story's primary UX path filters client-side).
    - `application/hooks/useContactos.ts` — TanStack Query hook, `queryKey: ['contactos']` (canonical key per architecture — do NOT use a string key; this key must be reused consistently by Stories 3.2–3.5's create/update/delete hooks for `invalidateQueries` to work, per Test Design R4/Note #7), `queryFn` calls `contactoApiRepository.getAll()` (no search param — fetch ALL records once, filter client-side), staleTime per project convention (mirror `useClientes.ts`).
  - [x] Create `presentation/components/ContactoListView.tsx` — the `/contactos` view's list panel. Renders:
    - A search `Input` (siesa-ui-kit) bound to local `useState<string>` (NOT Zustand — architecture mandates local React state for `searchQuery`, same as `ClienteListView`).
    - The filtered list via `useMemo` over the `useContactos()` cache data, matching `nombre` OR `email` case-insensitively against the search term (client-side filter — the <1s/1,000-records NFR1/NFR10 path, double Epic 2's 500-record benchmark).
    - Each row showing `Nombre`, `Cargo`, and `Email` (AC #1/TC-E3-P2-05) — reuse the `ClientListItem` pattern conceptually but create a `ContactListItem.tsx` (contact fields differ from client fields; do not force-fit `ClientListItem`).
  - [x] Create `ContactListItem.tsx` in `frontend/src/shared/components/` (shared/reusable, matching the precedent set by `ClientListItem.tsx`) — displays `nombre`, `cargo`, `email`; accepts `onClick`/`selected` props for forward compatibility with Story 3.2's detail navigation (do NOT implement `onClick` navigation yet — out of this story's scope).
  - [x] Reuse the EXISTING `EmptyState.tsx` in `frontend/src/shared/components/` (already supports a variant prop per Story 2.1/architecture's Component Strategy: `search-empty` · `no-contacts` · `no-clients`) — add/confirm the `'no-contacts'` variant renders distinct copy guiding the user to create the first contact. Do NOT create a new EmptyState component. Confirmed already present and correct.
  - [x] Reuse the EXISTING `ErrorPanel.tsx` in `frontend/src/shared/components/` (already implements `onRetry: () => void` + "Reintentar" button per Story 2.1) — no changes needed, just import and wire it (AC #5).

- [x] Task 5 — Frontend: wire `/contactos` route to the real list view (AC: #1, #2, #3, #4, #5)
  - [x] Replace the current placeholder in `frontend/src/routes/_app/contactos.tsx` (`<div data-testid="contactos-view">Contactos</div>`) with `<ContactoListView />`. Do NOT implement the detail panel or split-panel layout composition in this story (Story 3.2 scope) — render `ContactoListView` standalone at `/contactos` for now, matching Story 2.1's exact precedent for `/clientes`.
  - [x] Wire `useContactos()` loading/error/success states in `ContactoListView`:
    - `isLoading` → skeleton loading state using `react-loading-skeleton` (company standard: skeleton screens, not spinners).
    - `isError` → render `<ErrorPanel onRetry={refetch} />` instead of the list (AC #5).
    - `isSuccess` + `data.length === 0` → render `<EmptyState variant="no-contacts" />` (AC #3).
    - `isSuccess` + `data.length > 0` + filtered result is empty → render `<EmptyState variant="search-empty" />` while keeping the search input visible and populated (AC #4).
    - `isSuccess` + filtered result non-empty → render the list of `ContactListItem`s (AC #1, #2).
  - [x] Confirm no additional `useQuery`/refetch call is triggered on every keystroke — the search `Input`'s `onChange` only updates local `searchQuery` state; filtering happens via `useMemo` over already-fetched cache data (same pattern Story 2.1/2.6 established for `clientes`). Verified via `ContactoListView.test.tsx`'s `requestCount` spy test (TC-E3-P1-01).

- [x] Task 6 — Tests (AC: all)
  - [x] Backend xUnit: `ContactoRepositoryTests` — verify `GetAllAsync` returns correctly filtered results by `Nombre` OR `Email` substring, case-insensitive, independently for each field (TC-E3-P2-07 backend-path coverage, R6). Pre-existing ATDD suite, now green.
  - [x] Backend xUnit integration: `ContactoEndpointsTests` — `GET /api/v1/contactos` returns `200` with all contacts; `GET /api/v1/contactos?q=<term>` returns filtered results independent of frontend logic. Pre-existing ATDD suite, now green.
  - [x] Backend xUnit integration: TC-E3-P0-01 (no pending model changes / no new migration for `contactos`) and TC-E3-P0-02 (client delete still orphans contacts, real Postgres) — see Task 3.
  - [x] Frontend Vitest + RTL: `ContactoListView.test.tsx` — covers TC-E3-P1-01 (real-time search filters by Nombre AND Email, tested independently per R6), TC-E3-P1-03 (EmptyState `no-contacts` when zero contacts via MSW returning `[]`), TC-E3-P1-04 (zero search results shows distinct `search-empty` state, search input retains value), TC-E3-P1-05 (ErrorPanel + Reintentar re-triggers fetch on failure→success), TC-E3-P2-05 (each list row shows Nombre + Cargo + Email). Pre-existing ATDD suite, now green.
  - [x] Frontend Vitest: performance-oriented test seeding 1,000 mock contacts (double Epic 2's 500-record benchmark — NFR10 ceiling for contacts), asserting the filter's render/update completes in <1000ms (TC-E3-P1-02) — use `performance.now()` around the filter operation, mirroring `ClienteListView.performance.test.tsx`'s approach. Pre-existing ATDD suite, now green.
  - [x] MSW handlers for `GET /api/v1/contactos`: success (list), success (empty array), 500/network failure — added to the existing shared MSW handler file (`frontend/src/test/msw/handlers.ts`). Already present from ATDD setup.
  - [x] Add/extend a `contactoFactory` (faker-based, mirrors `cliente.factory.ts`) in `frontend/src/test/factories/` for generating mock contact records (nombre, cargo, telefono, email, optional clienteId override). Already present from ATDD setup.

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the contact list + search read path. It does **not** implement:
- Contact detail view / selection navigation (Story 3.2 — `ContactListItem`'s `onClick` prop is accepted here but not wired to navigation)
- Create/Edit/Delete mutations (Stories 3.3/3.4/3.5) — `IContactoRepository` and the API surface stay read-only (`GetAllAsync` only) in this story
- Client↔Contact association UI (Epic 4 — FR17-FR26)

**Unique to this epic — do NOT re-create the schema.** Unlike Epic 2's Story 2.1 (which created `ClienteEntity` from scratch), the `contactos` table, `ContactoEntity`, and `ContactoConfiguration` (with its `fk_contactos_clientes` FK, `ON DELETE SET NULL`) already exist from Story 2.5 — introduced there solely to prove FK-orphaning behavior. This story builds `IContactoRepository`, the query/DTO/endpoint layer, and the frontend module ON TOP of that existing entity/table. Generating a new migration for `contactos` or modifying `ContactoConfiguration.cs`'s FK definition is a critical regression (Test Design R1, gated by TC-E3-P0-01/TC-E3-P0-02).

### Previous Story Intelligence (Stories 2.1, 2.5, 1.1-1.3)

- `ContactoEntity` (`backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs`) already has: `Id` (Guid, private set, `Guid.NewGuid()` default), `Nombre`, `Cargo`, `Telefono`, `Email` (all `string`, private set), `ClienteId` (`Guid?`, private set), `CreatedAt`/`UpdatedAt` (`DateTimeOffset`, private set). Private constructor + static `Create(nombre, cargo, telefono, email, clienteId)` factory with `ArgumentException` guards on the four required string fields (`ClienteId` is nullable, not guarded). Do NOT modify this file's shape in this story — read-only consumption only.
- `ContactoConfiguration.cs` already configures table `contactos`, PK `id`, and the FK `.HasOne<ClienteEntity>().WithMany().HasForeignKey(c => c.ClienteId).OnDelete(DeleteBehavior.SetNull)` → `fk_contactos_clientes`, index `ix_contactos_cliente_id`. Registered in `AppDbContext.OnModelCreating` alongside `ClienteConfiguration`. Do NOT touch this file.
- `AppDbContext` already has `DbSet<ContactoEntity> Contactos` (added in Story 2.5) — reuse it, do not re-declare.
- Migration `20260701084227_AddContactoEntity` already applied to `siesa_agents_db` — the `contactos` table with `fk_contactos_clientes` (`ON DELETE SET NULL`) and `ix_contactos_cliente_id` already exists physically. Do NOT run `dotnet ef migrations add` for this story.
- `IClienteRepository`/`ClienteRepository`/`GetClientesQuery`/`ClienteEndpoints` (Story 2.1) is the exact structural template to replicate for Contacto's read path — same CQRS pattern, same `EF.Functions.ILike` search approach, same Minimal API endpoint-group registration style in `Program.cs`.
- Frontend: `frontend/src/modules/crm/clientes/` (Story 2.1) established the Clean Architecture module pattern (`domain/application/infrastructure/presentation`) — this story replicates it verbatim under `frontend/src/modules/crm/contactos/`.
- `frontend/src/shared/components/EmptyState.tsx` and `ErrorPanel.tsx` already exist (Story 2.1) and already support the variant/retry contracts this story needs — reuse them as-is, do not duplicate.
- `frontend/src/routes/_app/contactos.tsx` currently renders a placeholder (`<div data-testid="contactos-view">Contactos</div>`) — this story replaces it with the real `ContactoListView`, same as Story 2.1 did for `/clientes`.
- `siesa-ui-kit` (`^1.0.250`), `@heroicons/react`, `react-loading-skeleton`, TanStack Query/Router, `pnpm` — all already installed/configured; no new dependencies anticipated for this story.
- Epic 3's NFR1 bar is DOUBLE Epic 2's: 1,000 contacts vs. 500 clients (NFR10 ceiling for contacts). Do not reuse Epic 2's 500-record performance fixture unchanged — seed 1,000 records for TC-E3-P1-02 (Test Design R3 explicitly flags this as an easy-to-miss regression if the fixture size isn't bumped).
- Search MUST match both `Nombre` and `Email` independently (AC #2, R6) — Epic 2's Cliente search matched `Nombre`/`Nit`; do not copy-paste that pattern and forget to swap the second field to `Email`.

### Architecture References

- REST endpoint: `GET /api/v1/contactos` (search via optional `?q=`) — [Source: _bmad-output/planning-artifacts/architecture.md#API Design / REST Endpoints, line 256]
- Data model: `contactos` table (already exists) — `id (uuid PK)`, `nombre`, `cargo`, `telefono`, `email`, `cliente_id (uuid nullable FK → clientes.id ON DELETE SET NULL)`, `created_at`, `updated_at`; indexes `ix_contactos_cliente_id`, `ix_contactos_email` — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, lines 222-230]
- `ContactoEntity`: `ID (Guid)`, `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteID? (Guid nullable)`, `CreatedAt`/`UpdatedAt` (`DateTimeOffset`) — already implemented (Story 2.5) — [Source: _bmad-output/planning-artifacts/architecture.md#Domain Model, line 222]
- Query key convention: `['contactos']` (list), `['contactos', id]` (single), `['contactos', { clienteId }]` (Epic 4 scope) — array form mandatory, NOT string keys — [Source: _bmad-output/planning-artifacts/architecture.md#State Management, lines 280-282, 403-405]
- `searchQuery` is local React `useState`, NOT Zustand — [Source: _bmad-output/planning-artifacts/architecture.md#State Management]
- Frontend directory structure: `modules/crm/contactos/{domain,application,infrastructure,presentation}` — file names `Contacto.ts`, `IContactoRepository.ts`, `useContactos.ts`, `contactoApiRepository.ts`, `ContactoListView.tsx` — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure, lines 482-498]
- Backend directory structure: `Application/Queries/Contactos/GetContactosQuery.cs`/`GetContactosQueryHandler.cs`, `API/Endpoints/ContactoEndpoints.cs` — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure, lines 540-556] (actual on-disk convention is flat `Application/{Kind}/{Domain}/`, confirmed across Epic 2 — not the doc's illustrative `Application/Contactos/Queries/` nesting)
- `EmptyState.tsx`/`ErrorPanel.tsx` live in `shared/components/` as reusable components, already exist — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- NFR1/NFR10 (search <1s @ up to 1,000 contacts): client-side filtering, double Epic 2's dataset ceiling — [Source: _bmad-output/planning-artifacts/architecture.md#NFR Table]
- Company stack standards (UUID PKs, `DateTimeOffset`, `ApplySnakeCaseNaming()`, no `[Column]`/`[Table]` attributes, CQRS, Minimal API, Scalar, TanStack Query/Router, Zustand only for client state, `pnpm`, skeleton loading states, Heroicons): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Epic 3 Test Design (schema-reuse constraints, risk R1/R3/R6, notes for implementation agents #1, #3, #5, #7, #8): [Source: _bmad-output/implementation-artifacts/test-design-epic-3.md]
- Previous story learnings (Cliente read-path structural template, ContactoEntity/schema already-exists boundary): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md], [Source: _bmad-output/implementation-artifacts/2-5-delete-client.md]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements (search `Input`, `Button` for "Reintentar") before building custom components.
- **Constraint**: This is a standalone list+search view (no CRUD grid/form composition in this story), NOT a `MasterCrud`-orchestrated screen — do not introduce `MasterCrud` here, consistent with Epic 2's Story 2.1 precedent. `ContactListItem`, and the reused `EmptyState`/`ErrorPanel`, remain custom components per architecture's Component Strategy (no direct siesa-ui-kit equivalents).
- Icons: Heroicons primary (already installed) for any empty-state/error-state iconography.
- All user-facing text (search placeholder, EmptyState/ErrorPanel copy, "Reintentar" label) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests; the schema-reuse regression tests (TC-E3-P0-01, TC-E3-P0-02) MUST run against real/TestContainers PostgreSQL, not EF Core InMemory (FK behavior is not enforced by InMemory).
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards.
- Test Design references (Epic 3 test plan): TC-E3-P0-01, TC-E3-P0-02, TC-E3-P1-01, TC-E3-P1-02, TC-E3-P1-03, TC-E3-P1-04, TC-E3-P1-05, TC-E3-P2-05, TC-E3-P2-07 — [Source: _bmad-output/implementation-artifacts/test-design-epic-3.md#4. Test Cases by Priority]
- Non-negotiable constraint (Test Design §10, item 3): do not modify `ContactoConfiguration.cs`'s FK definition while adding repository/query logic.
- Non-negotiable constraint (Test Design §10, item 5): search must filter on BOTH `Nombre` and `Email` — a single-field check silently fails this AC.
- Non-negotiable constraint (Test Design, R3): NFR1/NFR10 performance test must use a 1,000-record fixture, not Epic 2's 500-record one.

### Project Structure Notes

- First story to create `frontend/src/modules/crm/contactos/` — replicates the Clean Architecture module pattern already established by `frontend/src/modules/crm/clientes/` (Story 2.1).
- First story to populate backend `Application/Queries/Contactos`, `API/Endpoints/ContactoEndpoints.cs`, and `Domain/Repositories/IContactoRepository.cs`/`Infrastructure/Repositories/ContactoRepository.cs` for the Contacto domain — but the underlying `ContactoEntity`/table/migration/FK config already exist (Story 2.5) and must be reused unmodified.
- No variance from the unified project structure anticipated beyond the already-confirmed flat `Application/{Kind}/{Domain}/` convention (vs. the architecture doc's illustrative nested tree), consistent with Epic 2.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `dotnet build` (backend): succeeded, 0 errors.
- `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~Contacto`: 24/24 passed.
- `dotnet test tests/SiesaAgents.IntegrationTests` (full suite): 131/131 passed.
- `dotnet test tests/SiesaAgents.UnitTests` (full suite): 54/54 passed.
- `npx vitest run src/modules/crm/contactos`: 16/16 passed (functional + performance).
- `npx vitest run` (full frontend suite): 245/245 passed.

### Completion Notes List

- Confirmed `ContactoEntity`/`ContactoConfiguration`/`Contactos` DbSet/migration `20260701084227_AddContactoEntity` (Story 2.5) untouched — no new migration generated, verified via `ContactoSchemaReuseTests.Database_HasNoPendingModelChanges_AfterAddingContactoRepositoryAndEndpoints` and `AppliedMigrations_DoNotContainANewContactoMigration_BeyondAddContactoEntity` (TC-E3-P0-01 gate).
- Backend read path (`IContactoRepository`/`ContactoRepository`/`GetContactosQuery(Handler)`/`ContactoDto`/`ContactoEndpoints`) built mirroring the Cliente structural template exactly (CQRS, `EF.Functions.ILike`, Minimal API endpoint-group registration in `Program.cs`). Search filters `Nombre` OR `Email` independently per AC #2/R6.
- Pre-existing ATDD tests (`ContactoRepositoryTests.cs`, `ContactoEndpointsTests.cs`, `ContactoListView.test.tsx`, `ContactoListView.performance.test.tsx`) all flipped from RED to GREEN with no modifications to the test files themselves.
- Frontend `domain/entities/Contacto.ts` and `domain/repositories/IContactoRepository.ts` already existed from ATDD scaffolding with the exact expected shape — reused as-is (no changes needed).
- Built `contactoApiRepository.ts`, `useContactos.ts` (`queryKey: ['contactos']`), `ContactListItem.tsx` (shared), and `ContactoListView.tsx` mirroring the `clientes` module precedent (loading skeleton, ErrorPanel+Reintentar, EmptyState `no-contacts`/`search-empty` variants, client-side `useMemo` filter — zero extra network calls per keystroke).
- Wired `/contactos` route (`frontend/src/routes/_app/contactos.tsx`) to render `ContactoListView` standalone, replacing the Story 1.x placeholder.
- Updated a pre-existing, out-of-story test (`frontend/src/routes/-navigation-shell.routing.test.tsx`) that asserted on the now-removed placeholder `data-testid="contactos-view"` — changed the assertion to `contactos-list-panel` (the real view's root testid) to keep the AC3 deep-linking coverage accurate; no behavior/scope change.
- No new dependencies added; no migrations generated; `ContactoConfiguration.cs`'s FK definition left untouched, per the story's non-negotiable constraints.

### File List

**Backend (new):**
- `backend/src/SiesaAgents.Domain/Repositories/IContactoRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
- `backend/src/SiesaAgents.Application/DTOs/ContactoDto.cs`
- `backend/src/SiesaAgents.Application/Queries/Contactos/GetContactosQuery.cs`
- `backend/src/SiesaAgents.Application/Queries/Contactos/GetContactosQueryHandler.cs`
- `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Data/ContactoSchemaReuseTests.cs`

**Backend (modified):**
- `backend/src/SiesaAgents.API/Program.cs` (DI registration + `app.MapContactoEndpoints()`)

**Frontend (new):**
- `frontend/src/modules/crm/contactos/infrastructure/repositories/contactoApiRepository.ts`
- `frontend/src/modules/crm/contactos/application/hooks/useContactos.ts`
- `frontend/src/modules/crm/contactos/presentation/components/ContactoListView.tsx`
- `frontend/src/shared/components/ContactListItem.tsx`

**Frontend (modified):**
- `frontend/src/routes/_app/contactos.tsx` (wired to `ContactoListView`)
- `frontend/src/routes/-navigation-shell.routing.test.tsx` (updated obsolete placeholder testid assertion)

**Pre-existing, unmodified (confirmed reused as-is):**
- `frontend/src/modules/crm/contactos/domain/entities/Contacto.ts`
- `frontend/src/modules/crm/contactos/domain/repositories/IContactoRepository.ts`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/test/factories/contacto.factory.ts`
- `frontend/src/test/msw/handlers.ts`

## Code Review

**Verdict**: PASS
**Reviewer**: SiesaTeam (AI Agent, Adversarial Senior Developer persona)
**Date**: 2026-07-01
**Full report**: `_bmad-output/review-3-1-contact-list-search.md`

- Critical/High: 0
- Medium: 1 — File List does not include files added post-dev by `testarch-automate` (`ContactoRepositoryEdgeCasesTests.cs`, `ContactoListView.edge-cases.test.tsx`, `ContactoListView.resilience.edge-cases.test.tsx`); process artifact of pipeline ordering, non-blocking.
- Low: 2 — no dedicated test for `contactoApiRepository`'s unused `?q=` branch (by design, not wired to UI this story); two `Task.Delay` calls in backend tests lack an explanatory comment (already flagged by TEA test-review, 96/100).
- All 5 ACs independently re-verified against code and passing tests (backend 32/32 Contacto tests, frontend 33/33 Contacto tests, full frontend suite 262/262, backend build 0 errors). Schema-reuse non-negotiable constraint (no new migration, `ContactoConfiguration.cs` FK untouched) independently confirmed via git diff and `HasPendingModelChanges()`.
