# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-07-02
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** E2E (Playwright) with API contract complement

---

## Story Summary

As a commercial team member, I want to see a list of all clients and search them by name or NIT/RUC, so that I can quickly find the client I'm looking for.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — `/clientes` renders a 280px left panel (`data-testid="clientes-list-panel"`) with header "Clientes", search input (`aria-label="Buscar clientes"`, placeholder `"Buscar por nombre o NIT..."`), and one `ClientListItem` per cliente showing Nombre + NIT/RUC.
2. **AC2** — Search filters in real time client-side (case-insensitive, over Nombre OR NIT) — no additional backend calls.
3. **AC3** — When the search filter matches nothing, EmptyState variant `search-empty` is rendered inside the panel.
4. **AC4** — When zero clients exist (backend returns `[]`), EmptyState variant `no-clients` with CTA "Nuevo cliente" and disabled search input is rendered.
5. **AC5** — On backend error, `ErrorPanel` (`data-testid="clientes-error-panel"`, `role="alert"`) with "Reintentar" is rendered; click refetches.
6. **AC6** — During `isLoading`, skeleton (`aria-busy="true"`) is rendered; the search input is disabled.
7. **AC7** — All UI text in Spanish (es-CO); WCAG 2.1 AA (aria-label, touch target ≥ 44px).
8. **AC8** — Backend `GET /api/v1/clientes` returns `200` + `ClienteDto[]` (camelCase, ISO 8601 timestamps, Guid string IDs).
9. **AC9** — Build/lint/tests pass in both frontend and backend workspaces.

---

## Failing Tests Created (RED Phase)

### E2E Tests (17 tests)

**File:** `e2e/tests/clientes/story-2.1-client-list-search.spec.ts`

- **[TC-Story-2.1-Panel]** RED — `clientes-list-panel` testid does not yet exist in `/clientes` route (placeholder still rendered). Verifies AC1 panel, header, search input attrs, item count.
- **[TC-Story-2.1-Panel-Item]** RED — `cliente-list-item` testid missing. Verifies AC1 Nombre + NIT rendering per item.
- **[TC-Story-2.1-Panel-Width]** RED — Tailwind class `lg:w-[280px]` not present on the panel root. Verifies AC1 desktop width.
- **[TC-Story-2.1-Filter-Nombre]** RED — no search input yet. Verifies AC2 filter by Nombre (case-insensitive).
- **[TC-Story-2.1-Filter-NIT]** RED — no search input yet. Verifies AC2 filter by NIT substring.
- **[TC-Story-2.1-Filter-NoExtraFetch]** RED — no filter behavior yet. Verifies AC2 filter is client-side (no extra GETs).
- **[TC-Story-2.1-Search-Empty]** RED — no `empty-state-search-empty` testid. Verifies AC3 no-match empty state.
- **[TC-Story-2.1-Search-Empty-InputVisible]** RED — no search input yet. Verifies AC3 input remains visible with query preserved.
- **[TC-Story-2.1-No-Clients]** RED — no `empty-state-no-clients` testid. Verifies AC4 empty backend state + CTA.
- **[TC-Story-2.1-No-Clients-InputDisabled]** RED — no input yet. Verifies AC4 disabled input.
- **[TC-Story-2.1-No-Clients-AriaLive]** RED — no aria-live on empty state yet. Verifies AC4 a11y.
- **[TC-Story-2.1-Error]** RED — no `clientes-error-panel` yet. Verifies AC5 ErrorPanel appears on 500.
- **[TC-Story-2.1-Error-NoList]** RED — no error handling in view yet. Verifies AC5 mutual exclusivity of states.
- **[TC-Story-2.1-Error-Reintentar]** RED — no refetch wiring yet. Verifies AC5 refetch on click.
- **[TC-Story-2.1-Loading]** RED — no `clientes-list-skeleton` yet. Verifies AC6 skeleton + aria-busy.
- **[TC-Story-2.1-Loading-InputDisabled]** RED — no loading disable behavior yet. Verifies AC6 input disabled during load.
- **[TC-Story-2.1-Spanish-A11y]** RED — none of the Spanish labels exist yet. Verifies AC7 Spanish + aria-label.
- **[TC-Story-2.1-A11y-TouchTarget]** RED — no items yet. Verifies AC7 44px touch target.

### API Tests (4 tests)

**File:** `e2e/tests/api/story-2.1-clientes-list.api.spec.ts`

- **[TC-Story-2.1-API-200]** RED — endpoint `GET /api/v1/clientes` not yet registered (Tasks 1-4 pending). Verifies AC8 200 status + JSON array.
- **[TC-Story-2.1-API-DtoShape]** RED — `ClienteDto` and endpoint not yet created. Verifies AC8 DTO shape (camelCase, Guid, ISO 8601).
- **[TC-Story-2.1-API-Empty]** RED — endpoint missing → 404. Verifies AC8 empty-array response.
- **[TC-Story-2.1-API-NFR6]** RED — routing/exception middleware needs Story 2.1 endpoint to exist. Verifies AC5/NFR6 no stack trace leaks.

### Component Tests (deferred to DEV)

Per Task 14 of the story, comprehensive Vitest + RTL component tests live in the DEV agent's scope:

- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClientListItem.test.tsx`
- `frontend/src/shared/components/EmptyState/EmptyState.test.tsx`
- `frontend/src/shared/components/ErrorPanel/ErrorPanel.test.tsx`
- `frontend/src/modules/crm/clientes/application/useClientes.test.tsx`

These will be authored during implementation (green phase) — the ATDD E2E/API tests define the acceptance contract they must respect.

---

## Data Factories Created

### Inline `seedClientes` factory

**File:** `e2e/tests/clientes/story-2.1-client-list-search.spec.ts`

Fixed `ClienteDto[]` seed used across all E2E scenarios. Kept inline (three deterministic entries: Acme Corp / Beta Distribuciones / Gamma Industrial) to avoid dependencies on backend seed data and keep the specs hermetic.

**Existing shared factory:** `e2e/helpers/data.helper.ts` (`buildCliente`) is used by the pre-existing `clientes-crud.spec.ts`. The Story 2.1 ATDD suite does not depend on it because all requests are intercepted via `page.route`.

---

## Fixtures Created

No new Playwright fixtures required. The existing `e2e/fixtures/base.fixture.ts` is not needed for Story 2.1 because navigation happens explicitly inside each `test`, and all network calls are intercepted network-first with `page.route()` before `page.goto('/clientes')`.

---

## Mock Requirements

All required mocks are inline in the ATDD spec via `page.route('**/api/v1/clientes', ...)`. No external mock service required.

### GET /api/v1/clientes — three variants used by tests

- **Success (populated):** 200 + `seedClientes` (3 clientes).
- **Success (empty):** 200 + `[]`.
- **Error:** 500 + `application/problem+json` body (RFC 7807, no stack trace).
- **Delayed success:** 200 + `seedClientes` after 1500ms (for loading state).
- **First-fail-then-success:** first GET → 500, subsequent → 200 (for Reintentar refetch).

---

## Required data-testid Attributes

### `/clientes` route + `ClienteListView`

- `clientes-list-panel` — root `<aside>` of the 280px left panel
- `clientes-search-input` — search Input inside the panel
- `clientes-list-skeleton` — loading skeleton container (with `aria-busy="true"`)
- `clientes-error-panel` — ErrorPanel component root (with `role="alert"`)
- `cliente-list-item` — each `ClientListItem` root
- `empty-state-no-clients` — EmptyState variant when backend returns `[]` (with `aria-live="polite"`)
- `empty-state-search-empty` — EmptyState variant when filter returns nothing

### Implementation examples

```tsx
<aside data-testid="clientes-list-panel" className="flex flex-col w-full lg:w-[280px] lg:shrink-0 ...">
  <h2>Clientes</h2>
  <Input
    data-testid="clientes-search-input"
    aria-label="Buscar clientes"
    placeholder="Buscar por nombre o NIT..."
    disabled={isLoading || isError || (clientes.length === 0 && !searchQuery)}
  />
  {isLoading && (
    <div data-testid="clientes-list-skeleton" aria-busy="true">...</div>
  )}
  {isError && (
    <ErrorPanel data-testid="clientes-error-panel" role="alert" onRetry={() => refetch()} />
  )}
  {/* ... */}
  <ul>
    {filteredClientes.map(c => (
      <li key={c.id}>
        <ClientListItem data-testid="cliente-list-item" cliente={c} />
      </li>
    ))}
  </ul>
</aside>
```

---

## Implementation Checklist

### Test suite: E2E `story-2.1-client-list-search.spec.ts`

**Tasks to reach GREEN phase (mapped to story Tasks):**

- [ ] **Task 6-10 (Frontend module + presentation)** — Create `ClienteListView` with the 280px `<aside>` and `data-testid="clientes-list-panel"`. Wire header, search input, and list rendering.
- [ ] **Task 6** — Create `Cliente.ts` domain type and `IClienteRepository.ts` in `modules/crm/clientes/domain/`.
- [ ] **Task 7** — Implement `clienteApiRepository` calling `apiClient.get('/api/v1/clientes')`.
- [ ] **Task 8** — Implement `useClientes` TanStack Query hook with `queryKey: ['clientes']` and `signal` support.
- [ ] **Task 9** — Implement `ClientListItem`, `EmptyState` (with variants `search-empty` and `no-clients`), and `ErrorPanel` (`role="alert"`, "Reintentar" button that invokes `onRetry`).
- [ ] **Task 10** — Wire `ClienteListView`:
  - useMemo filter over Nombre + NIT (case-insensitive)
  - conditional rendering (loading → error → empty → search-empty → list)
  - `data-testid="clientes-search-input"` with `aria-label` and placeholder in Spanish
  - `data-testid="cliente-list-item"` on each item
- [ ] **Task 11** — Skeleton loader inside `data-testid="clientes-list-skeleton"` with `aria-busy="true"`.
- [ ] **Task 12** — Replace `frontend/src/routes/clientes.tsx` placeholder with `<ClienteListView />`.
- [ ] Add required `data-testid` attributes (see list above).
- [ ] Run E2E: `pnpm test:e2e -- story-2.1-client-list-search`
- [ ] All 18 E2E tests pass (green phase).

### Test suite: API `story-2.1-clientes-list.api.spec.ts`

**Tasks to reach GREEN phase:**

- [ ] **Task 1** — Create `ClienteEntity` in `SiesaAgents.Domain/Clientes/Entities/` and `IClienteRepository` interface.
- [ ] **Task 2** — Add `ClienteConfiguration` (EF Core) + `DbSet<ClienteEntity> Clientes` in `AppDbContext` + `ClienteRepository` impl + EF migration `AddClientesTable`.
- [ ] **Task 3** — Create `ClienteDto` (record) + `GetClientesQuery` + `GetClientesQueryHandler` in `SiesaAgents.Application/Clientes/`.
- [ ] **Task 4** — Create `ClienteEndpoints.MapGet("/api/v1/clientes")` returning `Results.Ok(ClienteDto[])`. Register in `Program.cs`. Ensure JSON serialization uses camelCase (default in Minimal API).
- [ ] Verify `ExceptionHandlingMiddleware` returns RFC 7807 Problem Details with no stack traces (NFR6).
- [ ] Run API tests: `pnpm test:e2e -- story-2.1-clientes-list.api`
- [ ] All 4 API tests pass (green phase).

### Backend unit + integration (Task 5)

Not covered by the ATDD spec directly, but required by AC9 (all tests green):

- [ ] `ClienteEntityTests` (unit) — `Create` valid + invalid input cases.
- [ ] `GetClientesQueryHandlerTests` (unit) — handler projects entity → DTO correctly.
- [ ] `ClienteEndpointsTests` (integration, `WebApplicationFactory<Program>`) — 200/empty + shape.

---

## Running Tests

```bash
# Run only Story 2.1 E2E acceptance tests
pnpm exec playwright test e2e/tests/clientes/story-2.1-client-list-search.spec.ts

# Run only Story 2.1 API contract tests
pnpm exec playwright test e2e/tests/api/story-2.1-clientes-list.api.spec.ts

# Run both Story 2.1 test files
pnpm exec playwright test story-2.1

# Debug a specific test
pnpm exec playwright test e2e/tests/clientes/story-2.1-client-list-search.spec.ts --debug

# Headed mode (see the browser)
pnpm exec playwright test story-2.1 --headed

# Full frontend + backend verification (AC9)
pnpm --filter frontend build
pnpm --filter frontend lint
pnpm --filter frontend test
dotnet build backend/SiesaAgents.sln
dotnet test  backend/SiesaAgents.sln
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 22 acceptance tests written and failing (18 E2E + 4 API).
- Each failure is due to missing implementation (missing `data-testid`, missing endpoint, missing component) — not test bugs.
- Network-first pattern applied on every E2E test (`page.route` before `page.goto`).
- Selectors use `data-testid` exclusively (no CSS classes, no XPath, no positional selectors).
- Given-When-Then structure with a single conceptual assertion per test.

### GREEN Phase (DEV Team — next)

1. Pick the API endpoint first (Tasks 1-4 of the story) so the frontend has something real to call.
2. Wire the frontend module Tasks 6-12 in order (Domain → Infrastructure → Application → Presentation → Route).
3. After each task, run the matching subset of ATDD tests and check them off.
4. Aim to keep tests green as you add tasks — do not batch-implement everything before running tests.

### REFACTOR Phase (DEV Team — after green)

1. All 22 ATDD tests pass.
2. Extract reusable pieces (e.g., `EmptyState` variants shared with future stories).
3. Improve performance (memoize search, list virtualization if bench exceeds 900ms per R-003).
4. Confirm tests still green after each refactor.

---

## Next Steps

1. **DEV agent** reads this checklist together with `_bmad-output/implementation-artifacts/2-1-client-list-search.md`.
2. Run the RED tests first to confirm they fail:
   ```bash
   pnpm exec playwright test story-2.1
   ```
3. Implement backend first (Tasks 1-5). Re-run `story-2.1-clientes-list.api.spec.ts` — the four API tests should turn green.
4. Implement frontend Tasks 6-12. Re-run `story-2.1-client-list-search.spec.ts` — E2E tests should turn green in sections as testids and behavior land.
5. Implement Task 14 component tests (Vitest + RTL) as documented in the story.
6. Run the full AC9 verification suite (build/lint/test/backend build/backend test).
7. Handoff to QA / code review.

---

## Notes

- **Reused pre-existing fixtures/helpers:** No changes to `e2e/fixtures/base.fixture.ts`, `e2e/helpers/api.helper.ts`, or `e2e/helpers/data.helper.ts`. The Story 2.1 ATDD spec is fully hermetic (network-intercepted).
- **`clientes-crud.spec.ts` coexistence:** the pre-existing CRUD suite tests different acceptance criteria (Story 2.3, 2.4, 2.5) and uses real backend calls. The new Story 2.1 file is scoped only to list & search — no overlap.
- **Placeholder route regression:** the current `frontend/src/routes/clientes.tsx` renders a paragraph "La gestión de clientes se habilitará en la Épica 2." — Task 12 replaces it with `<ClienteListView />`. That change also flips these tests to GREEN.
- **Story 1.2 regression safety:** the existing E2E `navigation-shell.spec.ts` [TC-E1-P1-02] asserts `getByRole('heading', { level: 1 })` matches `/Clientes/i`. Story 2.1 Task 12 preserves an `<h1>Clientes</h1>` inside the panel — this ATDD spec asserts `getByRole('heading', { name: /clientes/i })` inside the panel, which is compatible.
- **Selector philosophy:** exclusively `data-testid`. If DEV needs to change layout, they can freely swap Tailwind classes without breaking these tests as long as the testids remain.
