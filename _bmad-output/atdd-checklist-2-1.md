# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-09
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component + API

---

## Story Summary

A commercial team member can navigate to `/clientes` and see a scrollable list of all clients showing
Nombre and NIT per item, filter them in real time by typing in a search field (client-side, no
additional API calls), and handle edge cases: empty state (no clients), error state (backend
unavailable with a "Reintentar" button), and clearing the search to restore the full list.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC#1** — Given clients exist, when the user navigates to `/clientes`, the left panel (280px wide) renders a scrollable list showing Nombre and NIT/RUC per item.
2. **AC#2** — Given the list is loaded, when the user types in the search field, the list filters in real time showing only matching clients (Nombre or NIT/RUC), results in under 1 second with up to 500 records (NFR1).
3. **AC#3** — Given no clients exist, when the user navigates to `/clientes`, an `EmptyState` component is displayed with a Spanish guidance message.
4. **AC#4** — Given the backend is unavailable, when `GET /api/v1/clientes` fails, an `ErrorPanel` with a "Reintentar" button is displayed; clicking "Reintentar" triggers `refetch()`.
5. **AC#5** — Given the list is loaded, when the user clears the search field, all clients are shown again without a new API call.

---

## Failing Tests Created (RED Phase)

### E2E Tests (14 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

- **Test:** `should render the 280px left panel at /clientes when clients exist`
  - **Status:** RED — `data-testid="clientes-list-panel"` does not exist yet
  - **Verifies:** AC#1 — left panel visible with correct testid

- **Test:** `should display Nombre for each client in the list`
  - **Status:** RED — `data-testid="cliente-list-item"` does not exist yet
  - **Verifies:** AC#1 — Nombre displayed per list item

- **Test:** `should display NIT for each client in the list`
  - **Status:** RED — `data-testid="cliente-list-item"` does not exist yet
  - **Verifies:** AC#1 — NIT/RUC displayed per list item

- **Test:** `should have the list panel with a width of 280px`
  - **Status:** RED — panel not implemented
  - **Verifies:** AC#1 — 280px panel width constraint

- **Test:** `should filter client list by Nombre when user types in the search field`
  - **Status:** RED — `data-testid="clientes-search-input"` does not exist yet
  - **Verifies:** AC#2 — real-time filter by Nombre

- **Test:** `should filter client list by NIT/RUC when user types in the search field`
  - **Status:** RED — `data-testid="clientes-search-input"` does not exist yet
  - **Verifies:** AC#2 — real-time filter by NIT/RUC

- **Test:** `should show search field with Spanish placeholder text`
  - **Status:** RED — search input not implemented
  - **Verifies:** AC#2 — Spanish placeholder text

- **Test:** `should display EmptyState component with Spanish guidance when no clients exist`
  - **Status:** RED — `data-testid="empty-state"` does not exist yet
  - **Verifies:** AC#3 — EmptyState rendered

- **Test:** `should display Spanish guidance message inside the EmptyState component`
  - **Status:** RED — EmptyState component not implemented
  - **Verifies:** AC#3 — Spanish message content

- **Test:** `should display ErrorPanel when GET /api/v1/clientes returns 500`
  - **Status:** RED — `data-testid="error-panel"` does not exist yet
  - **Verifies:** AC#4 — ErrorPanel rendered on failure

- **Test:** `should display "Reintentar" button inside ErrorPanel`
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC#4 — "Reintentar" button present

- **Test:** `should trigger a refetch when user clicks "Reintentar" button`
  - **Status:** RED — refetch functionality not wired
  - **Verifies:** AC#4 — click triggers API refetch

- **Test:** `should show all clients again when search field is cleared`
  - **Status:** RED — search clear behavior not implemented
  - **Verifies:** AC#5 — clear restores full list

### API Tests (11 tests)

**File:** `e2e/tests/api/client-list-search.api.spec.ts`

- **Test:** `should return HTTP 200 when GET /api/v1/clientes is requested`
  - **Status:** RED — endpoint `/api/v1/clientes` not implemented
  - **Verifies:** TC-E2-P2-01 — endpoint returns 200

- **Test:** `should return Content-Type application/json for GET /api/v1/clientes`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** TC-E2-P2-01 — correct Content-Type header

- **Test:** `should return a JSON array (not a wrapped object) from GET /api/v1/clientes`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** TC-E2-P2-01 — direct array response (no wrapper)

- **Test:** `each ClienteDto must have an "id" field that is a UUID string`
  - **Status:** RED — ClienteEntity/ClienteDto not implemented
  - **Verifies:** TC-E2-P2-01 — id field shape

- **Test:** `each ClienteDto must have a "nombre" field (non-empty string)`
  - **Status:** RED — ClienteDto not implemented
  - **Verifies:** TC-E2-P2-01 — nombre field shape

- **Test:** `each ClienteDto must have a "nit" field (non-empty string)`
  - **Status:** RED — ClienteDto not implemented
  - **Verifies:** TC-E2-P2-01 — nit field shape

- **Test:** `each ClienteDto must have a "telefono" field (string)`
  - **Status:** RED — ClienteDto not implemented
  - **Verifies:** TC-E2-P2-01 — telefono field shape

- **Test:** `each ClienteDto must have a "ciudad" field (string)`
  - **Status:** RED — ClienteDto not implemented
  - **Verifies:** TC-E2-P2-01 — ciudad field shape

- **Test:** `each ClienteDto must have a "createdAt" field in ISO 8601 format with timezone`
  - **Status:** RED — DateTimeOffset serialization not implemented
  - **Verifies:** TC-E2-P2-01 — createdAt ISO 8601 with timezone (DateTimeOffset)

- **Test:** `ClienteDto must NOT include stack traces or internal error fields`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** NFR6 — no stack traces in response

- **Test:** `should return clients ordered by createdAt descending (newest first)`
  - **Status:** RED — repository ordering not implemented
  - **Verifies:** TC-E2-P2-01 — default sort order

### Component Tests (18 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- **Test:** `should render 3 client items when API returns 3 clients` — **Status:** RED — ClienteListView does not exist
- **Test:** `should display Nombre for each client in the list` — **Status:** RED — ClienteListView does not exist
- **Test:** `should display NIT for each client in the list` — **Status:** RED — ClienteListView does not exist
- **Test:** `should render loading skeleton while data is being fetched` — **Status:** RED — loading skeleton not implemented
- **Test:** `should filter list to show only matching clients when user types in search field` — **Status:** RED
- **Test:** `should NOT trigger a new API call when user types in the search field` — **Status:** RED
- **Test:** `search is case-insensitive for Nombre matching` — **Status:** RED
- **Test:** `should filter list to show only client matching partial NIT input` — **Status:** RED
- **Test:** `search is case-insensitive for NIT matching` — **Status:** RED
- **Test:** `should display EmptyState component when API returns an empty array` — **Status:** RED
- **Test:** `should display Spanish guidance message in the EmptyState component` — **Status:** RED
- **Test:** `should NOT display any client list items when EmptyState is shown` — **Status:** RED
- **Test:** `should display ErrorPanel component when the API returns 500` — **Status:** RED
- **Test:** `should display a "Reintentar" button inside the ErrorPanel` — **Status:** RED
- **Test:** `should trigger a refetch when user clicks the "Reintentar" button` — **Status:** RED
- **Test:** `should NOT display raw error.message to the user inside the ErrorPanel` — **Status:** RED
- **Test:** `should show all clients again when search field is cleared` — **Status:** RED
- **Test:** `should filter 500 clients within 150ms using useMemo client-side filter` — **Status:** RED (TC-E2-P2-06)
- **Test:** `should have the Spanish placeholder "Buscar por nombre o NIT/RUC..."` — **Status:** RED

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts`

- **Test:** `should return data as an array of Cliente objects when API succeeds` — **Status:** RED (TC-E2-P3-04)
- **Test:** `each Cliente in data must have an "id" field (string)` — **Status:** RED
- **Test:** `each Cliente in data must have a "nombre" field (string)` — **Status:** RED
- **Test:** `each Cliente in data must have a "nit" field (string)` — **Status:** RED
- **Test:** `each Cliente in data must have a "createdAt" field (string)` — **Status:** RED
- **Test:** `should expose isLoading: true while data is being fetched` — **Status:** RED
- **Test:** `should expose isError: true when the API call fails` — **Status:** RED
- **Test:** `should expose a refetch function for manual retry` — **Status:** RED
- **Test:** `should use queryKey ["clientes"] for TanStack Query cache` — **Status:** RED

---

## Data Factories

### Cliente Factory (E2E / API tests)

**File:** `e2e/helpers/data.helper.ts` (already exists)

**Exports:**
- `buildCliente(overrides?)` — Creates a unique cliente payload with deterministic unique NIT using timestamp counter

**File:** `e2e/helpers/api.helper.ts` (already exists)

**Exports:**
- `ApiHelper.createCliente(data)` — POST `/api/v1/clientes` with auto-cleanup support
- `ApiHelper.deleteCliente(id)` — DELETE `/api/v1/clientes/:id`

### Mock Cliente Builder (Component tests)

Inline `buildMockCliente(overrides?)` helper inside `ClienteListView.test.tsx` for MSW-based component tests.
Uses Math.random() prefix for unique IDs — no faker dependency needed at this scope.

---

## Fixtures

### Base Playwright Fixture

**File:** `e2e/fixtures/base.fixture.ts` (already exists — used by clientes-crud.spec.ts)

The `client-list-search.spec.ts` uses Playwright's built-in `test` with `{ page, request }` fixtures
(no custom fixture extension needed for this story — API setup/teardown is handled inline via `ApiHelper`).

---

## Mock Requirements

### GET /api/v1/clientes — Network Interception (E2E)

Used in AC#3 (empty state), AC#4 (error state), AC#5 (clear search) tests via `page.route()`:

**Empty state mock:**
```json
Status: 200
Body: []
```

**Error state mock:**
```json
Status: 500
Body: { "detail": "Internal Server Error" }
```

**List mock (AC#5):**
```json
Status: 200
Body: [
  { "id": "...", "nombre": "Empresa Alfa SAS", "nit": "800100200-1", "telefono": "...", "ciudad": "Bogotá", "createdAt": "..." },
  { "id": "...", "nombre": "Empresa Beta Ltda", "nit": "900200300-2", "telefono": "...", "ciudad": "Medellín", "createdAt": "..." }
]
```

### MSW Handlers (Component tests)

Component tests use MSW `http.get('*/api/v1/clientes', ...)` handlers per test scenario.
The wildcard `*` prefix handles both `http://localhost:5000` and relative URLs.

---

## Required data-testid Attributes

### /clientes Route — ClienteListView

- `clientes-list-panel` — The 280px-wide left panel container (scrollable)
- `cliente-list-item` — Each individual client row in the list (repeated per client)
- `clientes-search-input` — The search `<input>` element
- `clientes-loading-skeleton` — Loading skeleton wrapper (shown while `isLoading` is true)

### Shared Components

- `empty-state` — EmptyState component root element (shown when data is `[]` and `isLoading` is false)
- `error-panel` — ErrorPanel component root element (shown when `isError` is true)

**Implementation Example:**

```tsx
// ClienteListView.tsx
<div data-testid="clientes-list-panel" style={{ width: '280px', overflowY: 'auto' }}>
  <input
    data-testid="clientes-search-input"
    placeholder="Buscar por nombre o NIT/RUC..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  {isLoading && <div data-testid="clientes-loading-skeleton"><Skeleton count={5} height={56} /></div>}
  {isError && <ErrorPanel data-testid="error-panel" onRetry={refetch} />}
  {!isLoading && !isError && filteredClientes.length === 0 && <EmptyState data-testid="empty-state" message="..." />}
  {filteredClientes.map((c) => (
    <div key={c.id} data-testid="cliente-list-item">
      <span>{c.nombre}</span>
      <span>{c.nit}</span>
    </div>
  ))}
</div>

// EmptyState.tsx
<div data-testid="empty-state">
  {message}
</div>

// ErrorPanel.tsx
<div data-testid="error-panel">
  <p>Ocurrió un error al cargar los clientes.</p>
  <button onClick={onRetry}>Reintentar</button>
</div>
```

---

## Implementation Checklist

### Test group: AC#1 — Client list panel renders with Nombre + NIT

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` interface: `{ id, nombre, nit, telefono, ciudad, createdAt }`
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` interface with `getAll(): Promise<Cliente[]>`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` using Axios `apiClient` singleton
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` with TanStack Query `queryKey: ['clientes']`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` with 280px panel, `data-testid="clientes-list-panel"`
- [ ] Render `<div data-testid="cliente-list-item">` per client showing `nombre` and `nit`
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` with `data-testid="empty-state"` and `message` prop
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with `data-testid="error-panel"`, `onRetry` prop, "Reintentar" button
- [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `ClienteListView`
- [ ] Run tests: `pnpm --filter frontend test ClienteListView`
- [ ] Run E2E: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test group: AC#2 — Real-time search by Nombre and NIT/RUC

**Tasks to make these tests pass:**

- [ ] Add `useState('')` for `searchQuery` inside `ClienteListView`
- [ ] Implement `useMemo` filter: `data.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
- [ ] Add `<input data-testid="clientes-search-input" placeholder="Buscar por nombre o NIT/RUC..." />`
- [ ] Confirm: no API call triggered when `searchQuery` changes (pure client-side filter via `useMemo`)
- [ ] Run tests: `pnpm --filter frontend test ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: AC#3 — EmptyState component

**Tasks to make these tests pass:**

- [ ] Check siesa-ui-kit for EmptyState equivalent before building custom
- [ ] If not found: create `frontend/src/shared/components/EmptyState.tsx` accepting `message: string`
- [ ] Wire `EmptyState` into `ClienteListView`: render when `!isLoading && !isError && data?.length === 0`
- [ ] Spanish message: `"Aún no hay clientes. Crea el primero para comenzar."`
- [ ] Run tests: `pnpm --filter frontend test ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: AC#4 — ErrorPanel + Reintentar

**Tasks to make these tests pass:**

- [ ] Check siesa-ui-kit for error/retry panel equivalent before building custom
- [ ] If not found: create `frontend/src/shared/components/ErrorPanel.tsx` accepting `onRetry: () => void`
- [ ] Wire `ErrorPanel` into `ClienteListView`: render when `isError === true`
- [ ] Pass `refetch` from `useClientes()` as `onRetry` prop to `<ErrorPanel>`
- [ ] "Reintentar" button text must be Spanish (WCAG accessible button label)
- [ ] Run tests: `pnpm --filter frontend test ClienteListView`
- [ ] Run E2E error tests: `pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC#4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: AC#5 — Clear search restores full list

**Tasks to make these tests pass:**

- [ ] Ensure clearing the `searchQuery` state (setting to `''`) shows all clients (covered by `useMemo` returning full `data`)
- [ ] Confirm no API call is triggered on clear (implemented automatically via client-side filter)
- [ ] Run tests: `pnpm --filter frontend test ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours (covered by AC#2 implementation)

---

### Test group: TC-E2-P2-01 — Backend GET /api/v1/clientes

**Tasks to make these tests pass:**

- [ ] Create `ClienteEntity` with `Guid Id`, `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
- [ ] Create `IClienteRepository` with `GetAllAsync(): Task<List<ClienteEntity>>`
- [ ] Create `ClienteConfiguration.cs` with `HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Run `dotnet ef migrations add AddClientesTable`
- [ ] Run `dotnet ef database update`
- [ ] Create `GetClientesQuery.cs` + `GetClientesQueryHandler.cs`
- [ ] Create `ClienteDto.cs` with camelCase JSON fields (auto-serialized by .NET)
- [ ] Create `ClienteRepository.cs` implementing `GetAllAsync()` with `OrderByDescending(c => c.CreatedAt)`
- [ ] Register `IClienteRepository → ClienteRepository` as scoped in `Program.cs`
- [ ] Create `ClienteEndpoints.cs` mapping `GET /api/v1/clientes` → returns `ClienteDto[]` (direct array)
- [ ] Register endpoint group via `app.MapGroup("/api/v1")`
- [ ] Run API tests: `pnpm exec playwright test e2e/tests/api/client-list-search.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test group: TC-E2-P3-04 — useClientes hook type safety

**Tasks to make these tests pass (covered by AC#1 frontend tasks above):**

- [ ] `useClientes.ts` must use `useQuery<Cliente[]>` generic typing
- [ ] `queryKey: ['clientes']` (array, not string)
- [ ] Ensure TanStack Query cache deduplication works (single API call for multiple hook instances)
- [ ] Run tests: `pnpm --filter frontend test useClientes`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** included in AC#1 tasks above

---

## Running Tests

```bash
# Run all component tests (Vitest)
pnpm --filter frontend test

# Run ClienteListView component tests
pnpm --filter frontend test ClienteListView

# Run useClientes hook tests
pnpm --filter frontend test useClientes

# Run E2E client list tests
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run E2E in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --headed

# Run API integration tests
pnpm exec playwright test e2e/tests/api/client-list-search.api.spec.ts

# Run all story 2.1 tests at once
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts e2e/tests/api/client-list-search.api.spec.ts

# Debug a failing test
pnpm exec playwright test e2e/tests/clientes/client-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- ✅ E2E tests written and failing (`e2e/tests/clientes/client-list-search.spec.ts` — 14 tests)
- ✅ API integration tests written and failing (`e2e/tests/api/client-list-search.api.spec.ts` — 11 tests)
- ✅ Component tests written and failing (`frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — 19 tests)
- ✅ Hook unit tests written and failing (`frontend/src/modules/crm/clientes/application/useClientes.test.ts` — 9 tests)
- ✅ Data helpers already in place (`e2e/helpers/data.helper.ts`, `e2e/helpers/api.helper.ts`)
- ✅ Mock requirements documented (MSW + page.route() patterns)
- ✅ Required data-testid attributes listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- E2E failures: elements/routes not found (`clientes-list-panel`, `cliente-list-item`, etc.)
- API failures: 404 on `/api/v1/clientes` (endpoint not implemented)
- Component failures: import errors (`ClienteListView` module does not exist)
- Hook failures: import errors (`useClientes` module does not exist)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with backend: `TC-E2-P2-01`)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order:**
1. Backend: `ClienteEntity` + `IClienteRepository` + EF migration
2. Backend: `GetClientesQueryHandler` + `ClienteRepository` + endpoint
3. Frontend: `Cliente.ts` + `IClienteRepository.ts` + `clienteApiRepository.ts`
4. Frontend: `useClientes.ts` hook
5. Frontend: `EmptyState.tsx` + `ErrorPanel.tsx` shared components
6. Frontend: `ClienteListView.tsx` with full search/filter/loading/error behavior
7. Route: Update `/clientes` route to render `ClienteListView`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Extract duplications in `ClienteListView` if any
3. Ensure `useMemo` is used correctly (dependencies: `[data, searchQuery]`)
4. Check WCAG 2.1 AA on `EmptyState` and `ErrorPanel` components (run axe)
5. Ensure tests still pass after refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/clientes/`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red to green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception with `page.route()` and `page.waitForResponse()` applied BEFORE `page.goto()` in all E2E tests
- **data-factories.md** — `buildCliente(overrides?)` factory pattern with timestamp-based unique IDs and override support
- **fixture-architecture.md** — Inline try/finally cleanup pattern in E2E tests (teardown via `apiHelper.deleteCliente`)
- **test-quality.md** — Given-When-Then structure, atomic assertions (one per test), deterministic data
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class selectors
- **timing-debugging.md** — `waitForResponse()` and `waitFor()` used for explicit waiting; no hard waits

---

## Test Execution Evidence

**Note:** These tests are in RED phase by design. The following failure messages are expected
until the implementation is complete.

**E2E expected failures:**
```
Error: page.getByTestId('clientes-list-panel') - element not found
Error: page.getByTestId('cliente-list-item') - element not found
Error: page.getByTestId('clientes-search-input') - element not found
Error: page.getByTestId('empty-state') - element not found
Error: page.getByTestId('error-panel') - element not found
```

**API expected failures:**
```
Error: expect(response.status()).toBe(200) → received 404
(GET /api/v1/clientes endpoint not yet registered)
```

**Component test expected failures:**
```
Error: Cannot find module './ClienteListView' (file does not exist)
```

**Hook test expected failures:**
```
Error: Cannot find module './useClientes' (file does not exist)
```

**Summary:**
- Total tests: 53 (14 E2E + 11 API + 19 Component + 9 Hook)
- Passing: 0 (expected)
- Failing: 53 (expected)
- Status: RED phase — ready for DEV implementation

---

## Notes

- **MasterCrud NOT applicable**: Story 2.1 implements a custom `ClienteListView` split panel (280px), NOT a MasterCrud grid. MasterCrud applies to full CRUD grid screens only.
- **DateTimeOffset mandatory**: Use `DateTimeOffset` (never `DateTime`) in `ClienteEntity` for `CreatedAt` and `UpdatedAt`.
- **Loading state**: Use `react-loading-skeleton` with `<Skeleton count={5} height={56} />` — not a spinner.
- **Search implementation**: Client-side `useMemo` filter only. No `?q=` query parameter to backend in this story.
- **Language**: All UI text must be Spanish (placeholder, empty state message, error text, button labels).
- **API call count tests**: AC#2, AC#5, and component tests verify no extra API calls on search. The TanStack Query cache ensures this naturally when `queryKey: ['clientes']` is used.

---

**Generated by BMad TEA Agent** — 2026-06-09
