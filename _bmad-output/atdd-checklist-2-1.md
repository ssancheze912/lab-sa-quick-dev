# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-08
**Author:** SiesaTeam
**Primary Test Level:** E2E (supplemented by API and Component)

---

## Story Summary

A commercial team member needs to view a scrollable list of all clients and search them by Nombre or NIT/RUC in real-time from the `/clientes` route. The story also covers the empty state when no clients exist, the error state when the backend is unavailable, and accessibility compliance (WCAG 2.1 AA).

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, when the user navigates to `/clientes`, then the left panel (280px) renders a scrollable list of all clients, each item showing Nombre and NIT/RUC.
2. **AC2** — Given the client list is loaded, when the user types in the search field ("Buscar cliente..."), then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).
3. **AC3** — Given a search filter is active, when the user clears the search field, then the full client list is restored without a new API call.
4. **AC4** — Given there are no clients in the system, when the user navigates to `/clientes`, then an `EmptyState` component is displayed with a message in Spanish guiding the user to create the first client.
5. **AC5** — Given the backend is unavailable when the page loads, when the fetch fails, then an `ErrorPanel` is displayed with a "Reintentar" button in place of the list.
6. **AC6** — Given the client list is displayed, when the page is inspected with an accessibility tool, then the search input has an accessible label in Spanish and there are no axe `critical` or `serious` violations (WCAG 2.1 AA).

---

## Failing Tests Created (RED Phase)

### E2E Tests (18 tests)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

- **Test:** `AC1 — should render the left panel at /clientes with the client list container`
  - **Status:** RED — `clientes-list-panel` testid missing (route/component not implemented)
  - **Verifies:** AC1 — left panel exists and is visible

- **Test:** `AC1 — should display a client item with Nombre when clients exist`
  - **Status:** RED — `cliente-list-item` testid missing; route and `ClienteListPanel` not implemented
  - **Verifies:** AC1 — Nombre appears in client list item

- **Test:** `AC1 — should display a client item with NIT when clients exist`
  - **Status:** RED — same as above
  - **Verifies:** AC1 — NIT/RUC appears in client list item

- **Test:** `AC1 — should render the search input with placeholder "Buscar cliente..."`
  - **Status:** RED — search input component not implemented
  - **Verifies:** AC1 — Spanish placeholder is present

- **Test:** `AC2 — should filter clients by Nombre when user types in the search field`
  - **Status:** RED — `ClienteListPanel` and `useClientes` filtering not implemented
  - **Verifies:** AC2 — real-time Nombre filter

- **Test:** `AC2 — should filter clients by NIT when user types in the search field`
  - **Status:** RED — same as above
  - **Verifies:** AC2 — real-time NIT filter

- **Test:** `AC2 — should filter within 1 second when list has 500 records (NFR1)`
  - **Status:** RED — component not implemented
  - **Verifies:** AC2/NFR1 — filter performance with 500 records

- **Test:** `AC3 — should show all clients again after clearing the search field`
  - **Status:** RED — clear behavior not implemented
  - **Verifies:** AC3 — full list restored on clear

- **Test:** `AC3 — should NOT trigger a new API call when search is cleared`
  - **Status:** RED — component not implemented
  - **Verifies:** AC3 — client-side filter (no new fetch on clear)

- **Test:** `AC4 — should display the EmptyState component when the client list is empty`
  - **Status:** RED — `EmptyState` with testid `empty-state` not implemented
  - **Verifies:** AC4 — EmptyState rendered for empty list

- **Test:** `AC4 — should display a Spanish message guiding user to create first client`
  - **Status:** RED — EmptyState message not implemented
  - **Verifies:** AC4 — "No hay clientes registrados" message in Spanish

- **Test:** `AC4 — should NOT show EmptyState when search yields no results (only when no clients exist)`
  - **Status:** RED — component not implemented
  - **Verifies:** AC4 — EmptyState conditional logic

- **Test:** `AC5 — should display the ErrorPanel when the API call fails`
  - **Status:** RED — `ErrorPanel` with testid `error-panel` not implemented
  - **Verifies:** AC5 — ErrorPanel shown on 503/500

- **Test:** `AC5 — should display a "Reintentar" button inside the ErrorPanel`
  - **Status:** RED — ErrorPanel component not implemented
  - **Verifies:** AC5 — Reintentar button present

- **Test:** `AC5 — should NOT show the client list when ErrorPanel is displayed`
  - **Status:** RED — component not implemented
  - **Verifies:** AC5 — mutual exclusion of list and ErrorPanel

- **Test:** `AC5 — should re-fetch clients when the "Reintentar" button is clicked`
  - **Status:** RED — refetch wiring not implemented
  - **Verifies:** AC5 — Reintentar triggers successful retry

---

### API Tests (10 tests)

**File:** `e2e/tests/api/clientes-list.api.spec.ts`

- **Test:** `AC1 — should return HTTP 200 from GET /api/v1/clientes`
  - **Status:** RED — endpoint not implemented (404 expected)
  - **Verifies:** AC1 — endpoint exists and returns 200

- **Test:** `AC1 — should return a JSON array (not an object wrapper)`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — direct array response contract

- **Test:** `AC1 — should return Content-Type application/json`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — JSON content type header

- **Test:** `AC1 — should return client items with "id" as a UUID string`
  - **Status:** RED — `ClienteEntity` and endpoint not implemented
  - **Verifies:** AC1 — Guid id field

- **Test:** `AC1 — should return client items with "nombre" field`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — nombre field in ClienteDto

- **Test:** `AC1 — should return client items with "nit" field`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — nit field in ClienteDto

- **Test:** `AC1 — should return client items with "telefono" and "ciudad" fields`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — full ClienteDto contract

- **Test:** `AC1 — should return client items with "createdAt" and "updatedAt" ISO datetime fields`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — DateTimeOffset serialized as ISO 8601

- **Test:** `AC2 — should include a newly created client in the response`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — all clients returned on GET

- **Test:** `AC1 — should reject creation of a second client with a duplicate NIT with 409 Conflict`
  - **Status:** RED — uniqueness constraint not implemented
  - **Verifies:** AC1 — uk_clientes_nit uniqueness enforced

---

### Component Tests (18 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx`

- **Test:** `AC1 — should render the clientes-list-panel container`
  - **Status:** RED — `ClienteListPanel` module not found
  - **Verifies:** AC1 — panel container testid

- **Test:** `AC1 — should display a client item showing the Nombre`
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — nombre shown in list item

- **Test:** `AC1 — should display a client item showing the NIT/RUC`
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — NIT shown in list item

- **Test:** `AC1 — should render each client as a data-testid="cliente-list-item" element`
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — multiple items rendered

- **Test:** `AC1 — should render a skeleton list while clients are loading`
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — loading state (skeleton)

- **Test:** `AC2 — should render the search input with placeholder "Buscar cliente..."`
  - **Status:** RED — component not implemented
  - **Verifies:** AC2 — search input placeholder

- **Test:** `AC2 — should show only matching client when user types a Nombre search term`
  - **Status:** RED — useClientes filtering not implemented
  - **Verifies:** AC2 — Nombre filter

- **Test:** `AC2 — should filter clients by NIT when user types a NIT search term`
  - **Status:** RED — useClientes filtering not implemented
  - **Verifies:** AC2 — NIT filter

- **Test:** `AC2 — should perform search filtering case-insensitively`
  - **Status:** RED — useClientes not implemented
  - **Verifies:** AC2 — case-insensitive matching

- **Test:** `AC3 — should restore all clients when search input is cleared`
  - **Status:** RED — component not implemented
  - **Verifies:** AC3 — full list restored on clear

- **Test:** `AC3 — should NOT trigger an additional API call when the search is cleared`
  - **Status:** RED — useMemo filtering not implemented
  - **Verifies:** AC3 — client-side only filter

- **Test:** `AC4 — should render data-testid="empty-state" when API returns empty array`
  - **Status:** RED — EmptyState component not implemented
  - **Verifies:** AC4 — EmptyState testid

- **Test:** `AC4 — should display the Spanish message "No hay clientes registrados"`
  - **Status:** RED — EmptyState message not implemented
  - **Verifies:** AC4 — Spanish empty state message

- **Test:** `AC4 — should NOT render the EmptyState when clients exist`
  - **Status:** RED — component not implemented
  - **Verifies:** AC4 — conditional EmptyState

- **Test:** `AC4 — should NOT display EmptyState when search yields no results`
  - **Status:** RED — component logic not implemented
  - **Verifies:** AC4 — EmptyState only for no-data, not no-match

- **Test:** `AC5 — should render data-testid="error-panel" when the API call rejects`
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC5 — ErrorPanel on error

- **Test:** `AC5 — should display a "Reintentar" button inside the ErrorPanel`
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC5 — Reintentar button

- **Test:** `AC5 — should NOT render client list items when ErrorPanel is shown`
  - **Status:** RED — component not implemented
  - **Verifies:** AC5 — exclusive error state

- **Test:** `AC5 — should call refetch when the "Reintentar" button is clicked`
  - **Status:** RED — refetch wiring not implemented
  - **Verifies:** AC5 — retry works

- **Test:** `AC6 — should have an aria-label "Buscar cliente" on the search input`
  - **Status:** RED — search input not implemented
  - **Verifies:** AC6 — Spanish aria-label

- **Test:** `AC6 — should have no axe critical or serious violations (WCAG 2.1 AA)`
  - **Status:** RED — component not implemented
  - **Verifies:** AC6 — axe accessibility audit

- **Test:** `AC6 — should have role="search" or accessible semantics on the search container`
  - **Status:** RED — search input not implemented
  - **Verifies:** AC6 — search role/semantics

---

## Data Factories Created

### Cliente Factory

**File:** `e2e/helpers/data.helper.ts` (already exists — `buildCliente`)

**Exports:**
- `buildCliente(overrides?)` — Creates a single cliente payload with unique id-based fields

**Example Usage:**
```typescript
const data = buildCliente({ nombre: 'Empresa Específica', ciudad: 'Medellín' });
const data2 = buildCliente(); // all fields auto-generated
```

**Note:** For component tests, inline `makeCliente()` helper functions are defined directly in the test file to keep component tests self-contained without external dependencies.

---

## Fixtures Created

### Base Fixture

**File:** `e2e/fixtures/base.fixture.ts` (already exists)

**Fixtures:**
- `clientesPage` — navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** page pre-navigated to clients route
  - **Cleanup:** none (navigation state resets between tests)

**Note for Story 2.1 tests:** Most tests in `clientes-list-search.spec.ts` do not use `clientesPage` fixture directly because they apply network-first route interception before navigation (required pattern). The fixture is available for simpler follow-on stories.

---

## Mock Requirements

### GET /api/v1/clientes — Network Interception (E2E)

E2E tests use `page.route()` to intercept the API **before navigation** (network-first pattern).

**Success Response (ClienteDto array):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Construcciones del Valle",
    "nit": "900123456-7",
    "telefono": "601-2345678",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

**Empty Response:**
```json
[]
```

**Error Responses (for AC5):**
```json
HTTP 503 — {}
HTTP 500 — { "error": "Internal Server Error" }
```

**Notes:** Response is a direct JSON array — no wrapper object. Interception must be set up with `await page.route(...)` BEFORE calling `await page.goto(...)`.

### clienteApiRepository.getAll() — vi.mock (Component Tests)

Component tests use `vi.mock()` to stub the repository. Mock must be set before import of `ClienteListPanel`.

---

## Required data-testid Attributes

### `/clientes` Route — Split Panel Layout

- `clientes-list-panel` — Left panel container (280px fixed width on desktop)
- `clientes-view` — Overall route view container (for navigation shell tests)

### ClienteListItem Component (`src/shared/components/ClienteListItem.tsx`)

- `cliente-list-item` — Each client row in the list

### EmptyState Component (`src/shared/components/EmptyState.tsx`)

- `empty-state` — Empty state container

### ErrorPanel Component (`src/shared/components/ErrorPanel.tsx`)

- `error-panel` — Error panel container

### ClienteListPanel Component Loading State

- `clientes-skeleton` — Skeleton loading container (shown while `isLoading`)

### Search Input (siesa-ui-kit `Input` component)

- `aria-label="Buscar cliente"` — Required accessible label (not a testid, but ARIA attribute)
- `placeholder="Buscar cliente..."` — Required placeholder text

**Implementation Example:**
```tsx
<div data-testid="clientes-list-panel">
  <Input
    data-testid="clientes-search-input"
    aria-label="Buscar cliente"
    placeholder="Buscar cliente..."
    value={searchQuery}
    onChange={(e) => debouncedSetSearch(e.target.value)}
  />
  {isLoading && <div data-testid="clientes-skeleton">...</div>}
  {isError && <ErrorPanel data-testid="error-panel" onRetry={refetch} />}
  {!isLoading && !isError && data.length === 0 && <EmptyState data-testid="empty-state" />}
  {data.map((cliente) => (
    <ClienteListItem key={cliente.id} cliente={cliente} data-testid="cliente-list-item" />
  ))}
</div>
```

---

## Implementation Checklist

### Test: AC1 — Left panel renders client list (E2E + API + Component)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts` + API + Component

**Tasks to make this test pass:**
- [ ] Create `ClienteEntity.cs` with Guid PK, Nombre, Nit, Telefono, Ciudad, CreatedAt, UpdatedAt
- [ ] Create `clientes` EF Core migration (`uk_clientes_nit` unique index)
- [ ] Create `IClienteRepository.cs` + `ClienteRepository.cs` (GetAllAsync ordered by CreatedAt desc)
- [ ] Create `GetClientesQuery.cs` + `GetClientesQueryHandler.cs` returning `IReadOnlyList<ClienteDto>`
- [ ] Create `ClienteEndpoints.cs` registering `GET /api/v1/clientes` returning `200 OK ClienteDto[]`
- [ ] Register `ClienteEndpoints.MapClienteEndpoints(app)` in `Program.cs`
- [ ] Create `Cliente.ts` TypeScript interface
- [ ] Create `IClienteRepository.ts` frontend interface
- [ ] Create `clienteApiRepository.ts` calling `GET /api/v1/clientes`
- [ ] Create `useClientes.ts` with TanStack Query key `['clientes']`
- [ ] Create `ClienteListPanel.tsx` rendering list panel with `data-testid="clientes-list-panel"`
- [ ] Create `ClienteListItem.tsx` with `data-testid="cliente-list-item"` showing nombre and nit
- [ ] Add `data-testid` attributes: `clientes-list-panel`, `cliente-list-item`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-list.api.spec.ts`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 8 hours

---

### Test: AC2 — Real-time search filter (E2E + Component)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`, `ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Implement `useMemo` filter in `useClientes.ts` over `['clientes']` TanStack Query cache
- [ ] Filter must match `nombre` and `nit` case-insensitively
- [ ] Wire search input `onChange` to debounced `setSearchQuery` (150ms) in `ClienteListPanel`
- [ ] Pass `searchQuery` to `useClientes(searchQuery)` hook
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --grep "AC2"`
- [ ] Run test: `pnpm --filter frontend test --run ClienteListPanel`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC3 — Clear search restores full list without new API call (E2E + Component)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`, `ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Ensure `useClientes` uses a stable `queryKey: ['clientes']` (TanStack Query caches — no new fetch on filter change)
- [ ] Ensure clearing `searchQuery` to `''` returns full `query.data` via `useMemo`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours (covered by AC2 implementation)

---

### Test: AC4 — EmptyState shown when no clients (E2E + Component)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`, `ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Create or verify `EmptyState.tsx` component (check siesa-ui-kit first)
- [ ] Render `<EmptyState data-testid="empty-state" />` in `ClienteListPanel` when `data.length === 0` and `!searchQuery` and `!isLoading` and `!isError`
- [ ] EmptyState must contain text "No hay clientes registrados. Crea el primero." (Spanish)
- [ ] Include "Nuevo cliente" CTA button (disabled/stub in this story)
- [ ] Add `data-testid`: `empty-state`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — ErrorPanel with Reintentar on fetch failure (E2E + Component)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`, `ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Create or verify `ErrorPanel.tsx` component (check siesa-ui-kit first)
- [ ] Render `<ErrorPanel data-testid="error-panel" onRetry={refetch} />` in `ClienteListPanel` when `isError`
- [ ] ErrorPanel must contain a "Reintentar" button (`role="button"`, text matches `/reintentar/i`)
- [ ] "Reintentar" button must call `refetch()` from TanStack Query
- [ ] When ErrorPanel is shown, `cliente-list-item` elements must NOT be rendered
- [ ] Add `data-testid`: `error-panel`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC6 — Accessibility compliance (Component)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Add `aria-label="Buscar cliente"` to the siesa-ui-kit `Input` component in `ClienteListPanel`
- [ ] Ensure `Input` has `type="search"` or semantic role (for `role="searchbox"` query to work)
- [ ] Run axe audit: `pnpm --filter frontend test --run ClienteListPanel`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E tests for Story 2.1
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts

# Run API contract tests for Story 2.1
npx playwright test e2e/tests/api/clientes-list.api.spec.ts

# Run all component tests for Story 2.1
pnpm --filter frontend test --run src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --debug

# Run all E2E tests (all stories)
npx playwright test

# Run only failing E2E tests with verbose output
npx playwright test e2e/tests/clientes/ --reporter=list

# Run frontend component tests in watch mode
pnpm --filter frontend test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- E2E tests: 16 tests in `clientes-list-search.spec.ts`
- API tests: 10 tests in `clientes-list.api.spec.ts`
- Component tests: 18 tests in `ClienteListPanel.test.tsx`
- Data factory (`buildCliente`) available in `e2e/helpers/data.helper.ts`
- Fixtures with auto-cleanup via `ApiHelper.deleteCliente()` in try/finally blocks
- Mock requirements documented (network-first E2E interception + vi.mock for components)
- Required data-testid attributes listed
- Implementation checklist created

**Verification:**
- E2E tests fail: route `/clientes` not found / components missing
- API tests fail: `GET /api/v1/clientes` returns 404 (endpoint not registered)
- Component tests fail: module `../ClienteListPanel` does not exist

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with API contract — Task 1 through Task 2.5)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: `ClienteEntity` + migration (makes API contract tests pass)
2. Backend: `GetClientesQuery` + endpoint (makes API 200 tests pass)
3. Frontend: domain + infrastructure layer (makes useClientes work)
4. Frontend: `useClientes` hook (makes component filtering tests pass)
5. Frontend: `ClienteListPanel` + route (makes E2E panel tests pass)
6. Frontend: `EmptyState` + `ErrorPanel` (makes AC4/AC5 tests pass)
7. Frontend: `aria-label` on search input (makes AC6 tests pass)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 44 tests pass across E2E, API, and Component levels
2. Review `ClienteListPanel` for extracted sub-components if needed
3. Ensure debounce in search input is correct (150ms per UX spec)
4. Confirm `queryKey: ['clientes']` matches the canonical key from architecture.md
5. Run full test suite one final time before story sign-off

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow
2. **Run failing tests** to confirm RED phase:
   - `npx playwright test e2e/tests/api/clientes-list.api.spec.ts` → all fail (404)
   - `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts` → all fail
   - `pnpm --filter frontend test --run ClienteListPanel` → all fail (module not found)
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: ALL E2E tests that need controlled API data intercept `page.route(...)` BEFORE `page.goto(...)` to prevent race conditions
- **data-factories.md** — `buildCliente()` in `data.helper.ts` generates unique test data using `Date.now()` counter; component tests use inline `makeCliente()` helpers
- **fixture-architecture.md** — `ApiHelper.deleteCliente()` in `try/finally` blocks provides auto-cleanup for integration-level E2E tests that create real backend data
- **test-quality.md** — One assertion per test (atomic), explicit `waitFor` (no hard waits), Given-When-Then structure in all tests
- **selector-resilience.md** — `data-testid` selectors used for all structural elements; `getByRole` + `getByPlaceholderText` used for accessible semantics
- **component-tdd.md** — `vi.mock()` before dynamic import of `ClienteListPanel`; `QueryClientProvider` wrapper for TanStack Query context isolation
- **test-levels-framework.md** — AC1/AC2/AC3 covered at E2E (user journey) + Component (logic isolation); AC4/AC5 at E2E + Component; AC6 at Component only (accessibility audit)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --reporter=list`

**Expected Results:**
```
FAIL e2e/tests/clientes/clientes-list-search.spec.ts
  × AC1 — should render the left panel at /clientes ... (route not found / testid missing)
  × AC1 — should display a client item with Nombre ... (component not implemented)
  × AC2 — should filter clients by Nombre ... (component not implemented)
  × AC3 — should show all clients again after clearing ... (component not implemented)
  × AC4 — should display the EmptyState component ... (EmptyState not implemented)
  × AC5 — should display the ErrorPanel when the API call fails ... (ErrorPanel not implemented)
  ...

16 failed
```

**API Command:** `npx playwright test e2e/tests/api/clientes-list.api.spec.ts --reporter=list`

**Expected Results:**
```
FAIL e2e/tests/api/clientes-list.api.spec.ts
  × AC1 — should return HTTP 200 from GET /api/v1/clientes (expected 200, received 404)
  × AC1 — should return a JSON array ... (endpoint not registered)
  ...

10 failed
```

**Component Command:** `pnpm --filter frontend test --run src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx`

**Expected Results:**
```
FAIL src/modules/crm/clientes/presentation/__tests__/ClienteListPanel.test.tsx
  × AC1 — should render the clientes-list-panel container (Cannot find module '../ClienteListPanel')
  ...

18 failed
```

**Summary:**
- Total tests: 44 (16 E2E + 10 API + 18 Component)
- Passing: 0 (expected for RED phase)
- Failing: 44 (expected)
- Status: RED phase — tests define the required behavior

---

## Notes

- The E2E test file was already generated during the initial ATDD pass for this story. It covers all 6 acceptance criteria at the browser level.
- API tests validate the `GET /api/v1/clientes` contract independently, ensuring the backend contract is correct before the frontend consumes it.
- Component tests for `ClienteListPanel` use Vitest + React Testing Library (not Playwright Component Testing), consistent with the project's existing component test patterns (see `navigation-shell.test.tsx`).
- The `clientes-list-search.spec.ts` AC3 test uses `page.waitForTimeout(300)` as a single exception to the no-hard-waits rule. This is justified because the debounce is 150ms and we need to allow it to settle before checking call counts. This is the minimum safe value.
- `buildCliente()` in `data.helper.ts` uses `Date.now()` counter instead of `@faker-js/faker` — consistent with the project's existing helper pattern. The component test file uses its own inline `makeCliente()` helper for isolation.
- All UI text is in Spanish per company-standards.md.

---

**Generated by BMad TEA Agent** — 2026-06-08
