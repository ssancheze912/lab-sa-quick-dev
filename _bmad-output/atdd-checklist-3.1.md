# ATDD Checklist - Epic 3, Story 3.1: Contact List & Search

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) — client-side list/search/empty/error states, mirrors Story 2.1's pattern per test-design-epic-3.md

---

## Story Summary

As a commercial team member, I want to see a list of all contacts and search them by name or email, so that I can quickly find any contact regardless of their client association.

**As a** commercial team member
**I want** to see a list of all contacts and search them by name or email
**So that** I can quickly find any contact regardless of their client association

---

## Acceptance Criteria

1. **Given** there are contacts in the system, **When** the user navigates to `/contactos`, **Then** a list of all contacts is displayed showing `Nombre`, `Cargo`, and `Email` per item (FR10, AC-E3.1/AC-E3.2, TC-E3-P2-05).
2. **Given** the contact list is loaded, **When** the user types in the search field, **Then** the list filters in real time (client-side, in-memory) showing only contacts whose `Nombre` OR `Email` match the input (case-insensitive substring, both fields checked independently — R6). Results appear in under 1 second with up to 1,000 records (NFR1, NFR10, FR11, FR12, TC-E3-P1-01, TC-E3-P1-02).
3. **Given** there are no contacts in the system, **When** the user navigates to `/contactos`, **Then** an `EmptyState` (`no-contacts` variant) is displayed, structurally distinct from the "zero search results" case (TC-E3-P1-03).
4. **Given** the contact list is loaded and the search matches none of the contacts, **When** the filter is applied, **Then** a `search-empty` `EmptyState` variant is shown (NOT `no-contacts`), and the search input retains its typed value (TC-E3-P1-04).
5. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with "Reintentar" is displayed; clicking it re-triggers the fetch and renders the list on success (TC-E3-P1-05).

---

## Epic-Specific Constraint (Critical — Do Not Violate)

Unlike Epic 2's Story 2.1 (which created `ClienteEntity` from scratch), the `contactos` table, `ContactoEntity`, and `ContactoConfiguration` (with `fk_contactos_clientes`, `ON DELETE SET NULL`) **already exist** from Story 2.5 — introduced there solely to prove FK-orphaning behavior. This story builds `IContactoRepository`, the query/DTO/endpoint layer, and the frontend module **on top of** that existing entity/table.

- Do NOT generate a new EF Core migration for `contactos`.
- Do NOT modify `ContactoConfiguration.cs`'s FK definition.
- `Database_HasNoPendingModelChanges` (existing generic test in `AppDbContextConfigurationTests.cs`) already acts as the TC-E3-P0-01 mechanism — it will fail if the new repository/query layer introduces any model drift.
- `ContactoRepositoryTests.DeleteCliente_WithContactosCreatedThroughContactoRepositoryPath_StillOrphansThemViaFkSetNull` is this story's TC-E3-P0-02 regression gate, proving the new read path sits correctly on top of the unchanged FK.

---

## Test Framework Note

This project uses **Vitest + React Testing Library + MSW** for component-level coverage (primary level per `test-design-epic-3.md` §3) and **xUnit + WebApplicationFactory<Program>** for backend integration coverage. Story 3.1 is a read-only path (`GetAllAsync` only) on both sides — no mutation tests are in scope here (those belong to Stories 3.3/3.4/3.5).

**Test infrastructure created in this ATDD pass** (did not exist before):

- `frontend/src/test/factories/contacto.factory.ts` — faker-based `createContacto`/`createContactos(count)` factory, mirrors `cliente.factory.ts`
- `frontend/src/test/msw/handlers.ts` — extended with `CONTACTOS_ENDPOINT` constant and default `GET /api/v1/contactos` handler (5 seeded contacts), individual tests override via `server.use(...)`
- `frontend/src/modules/crm/contactos/domain/entities/Contacto.ts` — TypeScript interface (contract only, no logic) so tests compile
- `frontend/src/modules/crm/contactos/domain/repositories/IContactoRepository.ts` — interface (contract only) so tests compile
- `backend/tests/SiesaAgents.IntegrationTests/Repositories/ContactoRepositoryTests.cs` — new file
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ContactoEndpointsTests.cs` — new file

No changes were made to `ContactoEntity.cs`, `ContactoConfiguration.cs`, `AppDbContext.cs`, or the existing migration — all reused as-is per the epic constraint above.

---

## Failing Tests Created (RED Phase)

### Backend — API Integration Tests (15 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Repositories/ContactoRepositoryTests.cs` (10 tests)

- `GetAllAsync_WithoutSearchTerm_ReturnsAllContactos` — RED: `ContactoRepository` does not exist (CS0246)
- `GetAllAsync_FiltersByNombreSubstring_CaseInsensitive` — RED: `ContactoRepository` does not exist
- `GetAllAsync_FiltersByEmailSubstring_IndependentlyOfNombre_R6` (R6) — RED: `ContactoRepository` does not exist
- `GetAllAsync_WithSearchTermMatchingOnlyEmail_DoesNotReturnUnrelatedContacts` — RED: `ContactoRepository` does not exist
- `GetAllAsync_WithNonMatchingSearchTerm_ReturnsEmpty` — RED: `ContactoRepository` does not exist
- `GetAllAsync_OrdersByCreatedAtDescending` — RED: `ContactoRepository` does not exist
- `GetAllAsync_WithWhitespaceOnlySearchTerm_ReturnsAllContactos` (theory, 2 cases) — RED: `ContactoRepository` does not exist
- `DeleteCliente_WithContactosCreatedThroughContactoRepositoryPath_StillOrphansThemViaFkSetNull` (TC-E3-P0-02) — RED: `ContactoRepository` does not exist

**File:** `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ContactoEndpointsTests.cs` (7 tests)

- `GetContactos_ReturnsOk` — RED: `ContactoDto` does not exist / `GET /api/v1/contactos` route does not exist
- `GetContactos_ReturnsAllSeededContactos` — RED: `ContactoDto` does not exist
- `GetContactos_WithSearchTermMatchingNombre_ReturnsOnlyMatchingContactos` — RED: `ContactoDto` does not exist
- `GetContactos_WithSearchTermMatchingOnlyEmail_ReturnsTheMatchingContacto_R6` (TC-E3-P2-07, R6) — RED: `ContactoDto` does not exist
- `GetContactos_WithNonMatchingSearchTerm_ReturnsEmptyArrayNot404` — RED: `ContactoDto` does not exist
- `GetContactos_ResponseUsesCamelCaseJsonPropertyNames` — RED: `ContactoDto` does not exist
- `GetContactos_WithContactoNotAssociatedToAnyCliente_ReturnsNullClienteId` — RED: `ContactoDto` does not exist

**Verified RED:** `dotnet build tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` fails with 14 `CS0246` compile errors (`ContactoRepository`/`ContactoDto` not found) — confirms these tests fail because the implementation does not exist yet, not due to test bugs.

### Frontend — Component Tests (18 tests)

**File:** `frontend/src/modules/crm/contactos/presentation/components/ContactoListView.test.tsx` (17 tests)

- **AC #1 — list shows Nombre, Cargo, Email per item**
  - `should render one list item per contact returned by the API` — RED: module not found (`ContactoListView.tsx`)
  - `should display Nombre, Cargo and Email for each list item (TC-E3-P2-05)` — RED: module not found
- **AC #2 — real-time client-side search by Nombre OR Email (R6)**
  - `should filter the list to only contacts whose nombre matches the typed search term` — RED: module not found
  - `should filter the list to only contacts whose EMAIL matches the typed search term, independent of nombre (R6)` (TC-E3-P1-01) — RED: module not found
  - `should match case-insensitively` — RED: module not found
  - `should not trigger a new network request while filtering (client-side only, TC-E3-P1-01)` — RED: module not found
- **AC #3 — no-contacts EmptyState**
  - `should render the no-contacts EmptyState when the API returns an empty array` (TC-E3-P1-03) — RED: module not found
  - `should NOT render any list item rows when the dataset is empty` — RED: module not found
- **AC #4 — zero search results shows search-empty state**
  - `should show the search-empty state (not no-contacts) when the search matches nothing` (TC-E3-P1-04) — RED: module not found
  - `should retain the typed search value when zero results are found` — RED: module not found
  - `should keep the search input visible while the search-empty state is shown` — RED: module not found
- **AC #5 — ErrorPanel with Reintentar**
  - `should render ErrorPanel instead of the list when the initial fetch fails` (TC-E3-P1-05) — RED: module not found
  - `should show a "Reintentar" button inside the ErrorPanel` — RED: module not found
  - `should re-trigger the fetch and render the list when Reintentar succeeds` — RED: module not found
  - `should never render the raw error message text (no technical detail leak)` — RED: module not found

**File:** `frontend/src/modules/crm/contactos/presentation/components/ContactoListView.performance.test.tsx` (1 test)

- `should render the filtered list in under 1000ms with 1,000 seeded contacts` (TC-E3-P1-02, NFR1/NFR10 — double Epic 2's 500-record benchmark per R3) — RED: module not found

**Verified RED:** `npx vitest run src/modules/crm/contactos` fails both suites with `Failed to resolve import "./ContactoListView"` — confirms these tests fail because the implementation does not exist yet, not due to test bugs.

---

## Data Factories Created

### Contacto Factory

**File:** `frontend/src/test/factories/contacto.factory.ts`

**Exports:**

- `createContacto(overrides?)` — creates a single `Contacto` with faker-based defaults (`nombre`, `cargo`, `telefono`, `email`), `clienteId` defaults to `null`, supports overrides
- `createContactos(count, overrides?)` — bulk helper, used by the 1,000-record NFR1/NFR10 performance fixture (TC-E3-P1-02)

**Example Usage:**

```typescript
const contacto = createContacto({ nombre: 'Laura Gómez', email: 'laura@example.com' })
const contactos = createContactos(1000) // NFR10 ceiling fixture
```

---

## Fixtures / MSW Handlers Created

### Contactos MSW Handlers

**File:** `frontend/src/test/msw/handlers.ts` (extended)

- `CONTACTOS_ENDPOINT` — `'*/api/v1/contactos'`, exported for per-test `server.use(...)` overrides (network-first.md pattern)
- Default handler: `GET /api/v1/contactos` → 200 with 5 seeded contacts (`defaultContactosList`)

Individual tests override this handler for empty-list (AC #3), search-empty (AC #4), 500/network-failure and retry-success (AC #5) scenarios — registered BEFORE `renderWithRouter` triggers the fetch, per network-first.md.

No new Playwright/component fixture files were needed beyond the existing `renderWithRouter` helper (`withQueryClient: true` option, already built for Story 2.1, reused as-is).

---

## Mock Requirements

### GET /api/v1/contactos Mock (frontend MSW)

**Endpoint:** `GET */api/v1/contactos`

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "nombre": "Laura Gómez",
    "cargo": "Gerente Comercial",
    "telefono": "3001234567",
    "email": "laura.gomez@example.com",
    "clienteId": null,
    "createdAt": "2026-07-01T00:00:00.000Z"
  }
]
```

**Empty Response (200):** `[]` — triggers `EmptyState` `no-contacts` variant (AC #3).

**Failure Response (500):**

```json
{ "error": "unavailable" }
```

Triggers `ErrorPanel` (AC #5). The raw body must never be rendered verbatim (NFR6) — tests assert `Npgsql`/`PostgresException`-style strings never leak to the DOM.

**Notes:** No request/response schema changes are needed beyond what `ContactoDto` (backend) and `Contacto` (frontend interface) already define in this ATDD pass.

---

## Required data-testid Attributes

### `/contactos` List View

- `contacto-search-input` — the search `Input` (siesa-ui-kit) bound to local `searchQuery` state
- `contacto-list-item` — one per rendered `ContactListItem` row (mirrors `cliente-list-item`)
- `empty-state-no-contacts` — `EmptyState` rendered when the dataset is empty (AC #3) — variant already supported by the existing `EmptyState.tsx` (Story 2.1), no changes needed
- `empty-state-search-empty` — `EmptyState` rendered when search yields zero results (AC #4) — variant already exists, shared with `clientes`
- `error-panel` — `ErrorPanel` rendered on fetch failure (AC #5) — reused as-is from `shared/components/ErrorPanel.tsx`, no changes needed

**Implementation Example:**

```tsx
<Input data-testid="contacto-search-input" placeholder="Buscar contacto por nombre o email" ... />
<li data-testid="contacto-list-item">...</li>
<EmptyState variant="no-contacts" />   {/* renders data-testid="empty-state-no-contacts" */}
<EmptyState variant="search-empty" />  {/* renders data-testid="empty-state-search-empty" */}
<ErrorPanel onRetry={() => refetch()} /> {/* renders data-testid="error-panel" */}
```

---

## Implementation Checklist

### Backend

**Files:** `ContactoRepositoryTests.cs`, `ContactoEndpointsTests.cs`

- [ ] Create `IContactoRepository` (`backend/src/SiesaAgents.Domain/Repositories/IContactoRepository.cs`) — `GetAllAsync(string? searchTerm, CancellationToken ct)` only (read-only scope)
- [ ] Create `ContactoRepository : IContactoRepository` (`backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`) — `EF.Functions.ILike` on **both** `Nombre` and `Email` (OR), ordered by `CreatedAt` descending
- [ ] Create `ContactoDto` (`backend/src/SiesaAgents.Application/DTOs/ContactoDto.cs`) — `Id`, `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (nullable), `CreatedAt`
- [ ] Create `GetContactosQuery`/`GetContactosQueryHandler` (`backend/src/SiesaAgents.Application/Queries/Contactos/`)
- [ ] Create `ContactoEndpoints.cs` (`backend/src/SiesaAgents.API/Endpoints/`) — `GET /api/v1/contactos` with optional `?q=`, register `app.MapContactoEndpoints()` in `Program.cs`
- [ ] Register `IContactoRepository`/`GetContactosQueryHandler` in DI (`Program.cs`)
- [ ] Do NOT modify `ContactoConfiguration.cs`, `ContactoEntity.cs`, or generate a new migration
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~Contacto"`
- [ ] ✅ All 15 backend tests pass (green phase)
- [ ] ✅ `Database_HasNoPendingModelChanges` (existing test) still passes — confirms no schema drift (TC-E3-P0-01)

**Estimated Effort:** 4 hours

---

### Frontend

**Files:** `ContactoListView.test.tsx`, `ContactoListView.performance.test.tsx`

- [ ] Create `frontend/src/modules/crm/contactos/infrastructure/repositories/contactoApiRepository.ts` — Axios `GET /api/v1/contactos`
- [ ] Create `frontend/src/modules/crm/contactos/application/hooks/useContactos.ts` — TanStack Query, `queryKey: ['contactos']` (canonical, reused by Stories 3.2-3.5)
- [ ] Create `frontend/src/shared/components/ContactListItem.tsx` — displays `nombre`, `cargo`, `email`; accepts `onClick`/`selected` (not wired yet)
- [ ] Create `frontend/src/modules/crm/contactos/presentation/components/ContactoListView.tsx` — search input + `useMemo` client-side filter (Nombre OR Email) + loading/error/empty/search-empty/list states, mirrors `ClienteListView.tsx`
- [ ] Wire `/contactos` route (`frontend/src/routes/_app/contactos.tsx`) to render `<ContactoListView />` instead of the placeholder
- [ ] Confirm `EmptyState.tsx`/`ErrorPanel.tsx` are reused as-is (already support `no-contacts` variant and `onRetry`, no changes needed)
- [ ] Add required data-testid attributes: `contacto-search-input`, `contacto-list-item`, `empty-state-no-contacts`, `empty-state-search-empty`, `error-panel`
- [ ] Run: `npx vitest run src/modules/crm/contactos`
- [ ] ✅ All 18 frontend tests pass (green phase)

**Estimated Effort:** 5 hours

---

## Running Tests

```bash
# Backend — all Contacto tests for this story
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~Contacto"

# Backend — schema-reuse regression gate (generic, pre-existing)
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~AppDbContextConfigurationTests"

# Frontend — all Story 3.1 tests
cd frontend && npx vitest run src/modules/crm/contactos

# Frontend — functional suite only
cd frontend && npx vitest run src/modules/crm/contactos/presentation/components/ContactoListView.test.tsx

# Frontend — performance suite only (TC-E3-P1-02)
cd frontend && npx vitest run src/modules/crm/contactos/presentation/components/ContactoListView.performance.test.tsx

# Frontend — watch mode
cd frontend && npx vitest src/modules/crm/contactos
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 15 backend xUnit tests written (`ContactoRepositoryTests.cs`, `ContactoEndpointsTests.cs`) — verified RED via `dotnet build` (CS0246: `ContactoRepository`/`ContactoDto` not found)
- ✅ 18 frontend Vitest tests written (`ContactoListView.test.tsx`, `ContactoListView.performance.test.tsx`) — verified RED via `vitest run` (module not found: `./ContactoListView`)
- ✅ `contactoFactory` created with auto-generated (faker) data, no hardcoded values
- ✅ MSW handlers extended for `/api/v1/contactos` (success, empty, error)
- ✅ Mock requirements and data-testid requirements documented
- ✅ Implementation checklist created

**Verification:**

- Backend: `dotnet build` fails with exactly the expected `CS0246` errors (missing types), not test-logic errors.
- Frontend: `vitest run` fails both suites with "Failed to resolve import" (missing component), not assertion errors.

---

### GREEN Phase (DEV Team — Next Steps)

1. Implement the backend layer first (repository → query/DTO → endpoint → DI registration) — run `dotnet test --filter Contacto` after each layer.
2. Implement the frontend layer (domain → infrastructure → application hook → presentation component → route wiring) — run `vitest run src/modules/crm/contactos` after each layer.
3. One test at a time; do not over-engineer beyond this story's read-only scope (no create/update/delete here — Stories 3.3/3.4/3.5).

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

- Verify all 33 new tests pass (15 backend + 18 frontend) plus the full existing suite (no regressions to Epic 2's Cliente tests or the generic `Database_HasNoPendingModelChanges` check).
- Confirm `dotnet test` and `pnpm vitest run` (or `npx vitest run`) pass with zero failures project-wide.

---

## Next Steps

1. Share this checklist and the failing tests with the dev workflow (manual handoff).
2. Implement backend read path first (Task 1-3 of the story), then frontend (Task 4-5).
3. Work one test at a time (red → green).
4. When all tests pass, run the full test suite to confirm no regressions (especially the Epic 2 FK-orphaning regression, TC-E3-P0-02, and the generic no-pending-model-changes check, TC-E3-P0-01).
5. Update story status to 'ready-for-review' once green, per sprint-status.yaml convention.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — reused `renderWithRouter`'s existing `withQueryClient` fixture pattern (Provider isolation, fresh `QueryClient` per test)
- **data-factories.md** — `contactoFactory` uses `@faker-js/faker`, supports overrides, bulk helper for the 1,000-record performance fixture
- **network-first.md** — all MSW `server.use(...)` overrides registered BEFORE `renderWithRouter` triggers the fetch
- **test-quality.md** — one concern per test (performance isolated in its own file), Given-When-Then structure, atomic assertions
- **selector-resilience.md** — all selectors use `data-testid` (`contacto-search-input`, `contacto-list-item`, `empty-state-*`, `error-panel`), no CSS/text-fragile selectors
- **test-levels-framework.md** — Component (Vitest+RTL) chosen as primary level for list/search/empty/error UI behavior; API Integration (xUnit) for the backend read path and schema-reuse regression gate; no E2E needed for this story (reserved for cross-cutting journeys in later stories per test-design-epic-3.md §3)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Notes

- This story is purely additive on top of the existing `contactos` schema (Story 2.5) — no migration, no `ContactoConfiguration.cs` changes. The generic `Database_HasNoPendingModelChanges` test already in the suite is the enforcement mechanism for TC-E3-P0-01; it was not duplicated.
- TC-E3-P0-02 (cross-cutting FK regression) is covered here at the repository level (`ContactoRepositoryTests`) rather than duplicated at the endpoint level, since Story 3.1 only exposes `GET` (no `POST /api/v1/contactos` exists yet to seed contacts through the API, per the story's Dev Notes) — the endpoint-level TC-E3-P0-02 variant described in the epic test-design (seeding via `POST /api/v1/contactos`) will be completed once Story 3.3 adds that endpoint.
- R6 (search must check Nombre AND Email independently) is covered at three levels in this pass: backend repository, backend endpoint, and frontend component — the highest-risk area flagged by Test Design for this story.
- Out of scope for this story (per Dev Notes/Test Design): contact detail navigation, create/edit/delete mutations, client↔contact association UI. `ContactListItem`'s `onClick` prop is accepted but not wired to navigation.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/testarch` workflow documentation
- Consult `test-design-epic-3.md` for full risk/test-case rationale

---

**Generated by BMad TEA Agent** - 2026-07-01
