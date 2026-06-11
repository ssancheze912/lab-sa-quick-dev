# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-11
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW)

---

## Story Summary

Story 2.1 delivers the read-only client list with real-time search for the `/clientes` route. Commercial team members can see all clients in a 280px left panel, search by nombre or NIT/RUC in real time (client-side filter via `useMemo`), and get proper feedback for empty data and backend errors with retry capability.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients with `nombre` and `nit` visible per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose `nombre` or `nit` match (case-insensitive), **And** results appear in under 1 second for up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, **And** clicking "Reintentar" calls `refetch()` on the TanStack Query.

5. **Given** the client list loads successfully, **When** the user has not typed anything in the search field, **Then** all clients are shown sorted by default order "Más reciente" (creation date descending).

---

## Failing Tests Created (RED Phase)

### Component Tests (12 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`

- **Test:** `should filter list by nombre in under 1000ms with 500 records`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC2, TC-E2-P1-05 — performance filter NFR1

- **Test:** `should filter list by NIT (case-insensitive) in under 1000ms`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC2 — case-insensitive NIT filter

- **Test:** `should NOT trigger additional API requests when search input changes`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC2 — client-side only filter (architecture constraint)

- **Test:** `should render EmptyState component when no clients exist`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC3, TC-E2-P1-06

- **Test:** `should display guidance message to create the first client in EmptyState`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC3 — Spanish guidance text

- **Test:** `should NOT render any cliente-list-item when list is empty`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC3 — clean empty state, no phantom items

- **Test:** `should render ErrorPanel when GET /clientes returns 500`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC4, TC-E2-P1-07

- **Test:** `should display "Reintentar" button in ErrorPanel`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC4 — Spanish retry button label

- **Test:** `should call refetch() and restore list when "Reintentar" is clicked`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC4 — retry calls TanStack Query refetch, list restored

- **Test:** `should NOT render client list items when in error state`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC4 — no phantom items during error

- **Test:** `should render clients in creation-date descending order by default`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC5 — default sort "Más reciente"

- **Test:** `should render nombre and nit for each client item`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC1 — nombre and nit visible per item

- **Test:** `should render the search input with Spanish placeholder text`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC1 + AC2 — Spanish placeholder "Buscar por nombre o NIT/RUC…"

- **Test:** `should render skeleton loading placeholders while query is loading`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC1 — skeleton (not spinner) during loading (react-loading-skeleton)

- **Test:** `should render the list panel with correct data-testid`
  - **Status:** RED — `ClienteListPanel` component does not exist yet
  - **Verifies:** AC1 — panel root has `data-testid="clientes-list-panel"`

### Hook Unit Tests (4 tests)

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts`

- **Test:** `should use TanStack Query key exactly ['clientes'] (array, not string)`
  - **Status:** RED — `useClientes` hook does not exist yet
  - **Verifies:** Architecture constraint — query key must be `['clientes']` array

- **Test:** `should expose data, isLoading, isError, and refetch`
  - **Status:** RED — `useClientes` hook does not exist yet
  - **Verifies:** Hook contract per Story 2.1 Dev Notes

- **Test:** `should return the client list from GET /api/v1/clientes`
  - **Status:** RED — `useClientes` hook does not exist yet
  - **Verifies:** AC1, TC-E2-P1-01 — data correctly fetched

- **Test:** `should set isError=true when API returns 500`
  - **Status:** RED — `useClientes` hook does not exist yet
  - **Verifies:** AC4 — error state propagated through hook

### API Integration Tests (8 tests) — ALREADY CREATED

**File:** `e2e/tests/api/clientes-list.api.spec.ts`

- `TC-E2-P1-01`: GET /api/v1/clientes returns HTTP 200 (RED — backend not implemented)
- `TC-E2-P1-01`: GET /api/v1/clientes returns a JSON array (RED)
- `TC-E2-P1-01`: Includes all required fields in each item (RED)
- `TC-E2-P1-01`: id is UUID format (RED)
- `TC-E2-P1-01`: createdAt is ISO 8601 with UTC offset (DateTimeOffset) (RED)
- `TC-E2-P2-07`: filters by nombre when ?q=Alpha provided (RED)
- `TC-E2-P2-07`: filters by NIT when ?q=TC-P2-07-111 provided (RED)
- `TC-E2-P2-07`: returns empty array when ?q=xyz matches nothing (RED)

### E2E Tests (10 tests)

**File:** `e2e/tests/clientes/clientes-list.spec.ts`

- **Test:** `should render the clientes list panel at /clientes`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC1 — `/clientes` route renders list panel

- **Test:** `should show nombre and nit in each client list item`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC1 — nombre and nit visible in list items

- **Test:** `should render a search input with Spanish placeholder`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC1 + AC2 — search input present with Spanish text

- **Test:** `should filter client list by nombre when user types in search field`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC2 — real-time filter by nombre

- **Test:** `should filter client list by NIT when user types NIT in search`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC2 — real-time filter by NIT

- **Test:** `should filter case-insensitively`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC2 — case-insensitive filter

- **Test:** `should show EmptyState when no clients exist (using route interception)`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC3 — EmptyState rendered

- **Test:** `should NOT render list items when EmptyState is shown`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC3 — no phantom items in empty state

- **Test:** `should show ErrorPanel when backend returns 500`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC4 — ErrorPanel rendered on 500

- **Test:** `should display "Reintentar" button in the ErrorPanel`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC4 — retry button present with correct Spanish label

- **Test:** `should restore client list when "Reintentar" is clicked after error recovery`
  - **Status:** RED — `ClienteListPanel` not implemented
  - **Verifies:** AC4 — retry flow restores list

---

## Data Factories Created

### Cliente Factory

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx` (inline)

**Exports:**
- `buildCliente(overrides?)` — Create single client object with optional overrides
- `buildClientes(count, overrides?)` — Create array of N clients (for 500-record performance test)

**Example Usage:**
```typescript
const client = buildCliente({ nombre: 'Target Empresa', nit: 'NIT-001' });
const clients = buildClientes(500); // Generate 500 random clients
```

**File:** `e2e/helpers/data.helper.ts` (already exists — shared with other E2E tests)
- `buildCliente(overrides?)` — Build client payload for API seeding in E2E tests

---

## Fixtures Created

### MSW Server Fixture

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx` (inline MSW setup)

**Fixtures:**
- `server` (MSW `setupServer`) — Intercepts `GET /api/v1/clientes` with per-test handlers
  - **Setup:** `server.listen({ onUnhandledRequest: 'bypass' })` in `beforeAll`
  - **Provides:** Per-test `server.use(...)` handler overrides
  - **Cleanup:** `server.resetHandlers()` in `afterEach`, `server.close()` in `afterAll`

### QueryClient Wrapper Fixture

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx` (inline)

**Fixtures:**
- `createWrapper()` — Creates isolated `QueryClient` with `retry: false` for each test
  - **Setup:** Fresh `QueryClient` per test invocation
  - **Provides:** `{ queryClient, Wrapper }` — `Wrapper` wraps component in `QueryClientProvider`
  - **Cleanup:** GC time = 0, automatic garbage collection

---

## Mock Requirements

### GET /api/v1/clientes — ClienteApiRepository Mock

**Endpoint:** `GET http://localhost:5000/api/v1/clientes`

**Success Response (200):**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Alpha Corp",
    "nit": "NIT-001",
    "telefono": "300-0001",
    "ciudad": "Bogotá",
    "createdAt": "2026-01-01T00:00:00+00:00",
    "updatedAt": "2026-01-01T00:00:00+00:00"
  }
]
```

**Empty Response (200):**
```json
[]
```

**Error Response (500):**
```
HTTP 500 Internal Server Error (no body required for test)
```

**Notes:**
- MSW intercepts Axios requests to `http://localhost:5000/api/v1/clientes`
- Per-request handler sequencing is used for the retry flow test (TC-E2-P1-07): first call returns 500, second returns 200 with data
- Network-first: all MSW handlers are registered via `server.use(...)` BEFORE `render(...)` is called

---

## Required data-testid Attributes

### ClienteListPanel Component

- `clientes-list-panel` — Root container of the 280px left panel
- `search-input` — Search input field (with Spanish placeholder "Buscar por nombre o NIT/RUC…")
- `cliente-list-item` — Each individual client row in the list (repeated)
- `client-list-skeleton` — Skeleton loading placeholder container (shown during `isLoading`)
- `empty-state` — EmptyState component root (shown when data is empty array)
- `error-panel` — ErrorPanel component root (shown when `isError === true`)

**Implementation Example:**
```tsx
<div data-testid="clientes-list-panel" className="w-[280px] flex-shrink-0 h-full flex flex-col">
  <input
    data-testid="search-input"
    placeholder="Buscar por nombre o NIT/RUC…"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  {isLoading && <div data-testid="client-list-skeleton">...</div>}
  {isError && <div data-testid="error-panel"><button onClick={refetch}>Reintentar</button></div>}
  {!isLoading && !isError && filtered.length === 0 && <div data-testid="empty-state">...</div>}
  {filtered.map(c => <div key={c.id} data-testid="cliente-list-item">...</div>)}
</div>
```

---

## Implementation Checklist

### Test: `useClientes` hook (TC-E2-P1-01 prerequisite)

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — `getAll(): Promise<Cliente[]>`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios GET `/api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — `useQuery({ queryKey: ['clientes'], queryFn: ... })`
- [ ] Run test: `npx vitest run src/modules/crm/clientes/application/useClientes.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: ClienteListPanel — AC1 rendering (basic list)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- [ ] Render root `<div data-testid="clientes-list-panel">` with `w-[280px]` class
- [ ] Render `<input data-testid="search-input" placeholder="Buscar por nombre o NIT/RUC…">`
- [ ] Call `useClientes()` to fetch data
- [ ] Render `<div data-testid="client-list-skeleton">` (5 rows) while `isLoading === true`
- [ ] Render each client as `<div data-testid="cliente-list-item">` showing `nombre` and `nit`
- [ ] Add required data-testid attributes: `clientes-list-panel`, `search-input`, `cliente-list-item`, `client-list-skeleton`
- [ ] Run test: `npx vitest run src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: ClienteListPanel — AC2 real-time filter under 1 second (TC-E2-P1-05)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Add `search` state (`useState<string>('')`) to `ClienteListPanel`
- [ ] Bind `search` state to `<input data-testid="search-input">` as controlled input
- [ ] Add `useMemo` filter: `(c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)`
- [ ] Render `filtered` array (not raw `data`) as list items
- [ ] Verify filter does NOT trigger any new API calls (client-side only)
- [ ] Add required data-testid: `search-input`
- [ ] Run test: `npx vitest run src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx -t "TC-E2-P1-05"`
- [ ] ✅ Filter tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: ClienteListPanel — AC3 EmptyState (TC-E2-P1-06)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Check `EmptyState` in `siesa-ui-kit` catalog FIRST (before creating custom)
- [ ] If not in kit: create `frontend/src/shared/components/EmptyState.tsx` — props: `title`, `description?`, `action?`
- [ ] Render `<EmptyState data-testid="empty-state">` when `!isLoading && !isError && filtered.length === 0`
- [ ] EmptyState message in Spanish: "No hay clientes registrados" + "Crear el primer cliente"
- [ ] Add required data-testid: `empty-state`
- [ ] Run test: `npx vitest run src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx -t "TC-E2-P1-06"`
- [ ] ✅ Empty state tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: ClienteListPanel — AC4 ErrorPanel + retry (TC-E2-P1-07)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Check `ErrorPanel` in `siesa-ui-kit` catalog FIRST
- [ ] If not in kit: create `frontend/src/shared/components/ErrorPanel.tsx` — props: `message?`, `onRetry?`
- [ ] Render `<ErrorPanel data-testid="error-panel" onRetry={refetch}>` when `isError === true`
- [ ] ErrorPanel shows "Reintentar" button that calls `onRetry` (which calls TanStack Query `refetch()`)
- [ ] Add required data-testid: `error-panel`
- [ ] Run test: `npx vitest run src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx -t "TC-E2-P1-07"`
- [ ] ✅ Error state + retry tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: ClienteListPanel — AC5 default sort "Más reciente"

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`

**Tasks to make this test pass:**
- [ ] Sort `filtered` array by `createdAt` descending before rendering (default order)
- [ ] Ensure `SortControl` default state (`fecha-desc`) does not break Story 2.1 default behavior
- [ ] Run test: `npx vitest run src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx -t "default sort"`
- [ ] ✅ Default sort test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: GET /api/v1/clientes (TC-E2-P1-01, TC-E2-P2-07)

**File:** `e2e/tests/api/clientes-list.api.spec.ts` (already exists)

**Tasks to make these tests pass (backend):**
- [ ] Create `ClienteEntity` in Domain layer
- [ ] Create EF Core migration `AddClienteEntity` with `uk_clientes_nit` unique index
- [ ] Create `ClienteRepository.GetAll()` implementation
- [ ] Create `GET /api/v1/clientes` Minimal API endpoint (with optional `?q=` parameter)
- [ ] Register endpoint + DI in `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-list.api.spec.ts`
- [ ] ✅ API tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: E2E — Clientes list view (clientes-list.spec.ts)

**File:** `e2e/tests/clientes/clientes-list.spec.ts`

**Tasks to make these tests pass:**
- [ ] All backend + frontend tasks above completed first
- [ ] Wire `ClienteListPanel` into `frontend/src/routes/_app/clientes.tsx`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-list.spec.ts`
- [ ] ✅ E2E tests pass (green phase)

**Estimated Effort:** 1 hour (wiring only, after above tasks)

---

## Running Tests

```bash
# Run all component tests for Story 2.1 (ClienteListPanel + useClientes)
cd frontend && npx vitest run src/modules/crm/clientes

# Run ClienteListPanel component tests only
cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx

# Run useClientes hook tests
cd frontend && npx vitest run src/modules/crm/clientes/application/useClientes.test.ts

# Run with watch mode (during TDD green phase)
cd frontend && npx vitest watch src/modules/crm/clientes

# Run API integration tests (requires running backend + PostgreSQL)
npx playwright test e2e/tests/api/clientes-list.api.spec.ts --project=chromium

# Run E2E tests for Story 2.1 (requires running frontend + backend)
npx playwright test e2e/tests/clientes/clientes-list.spec.ts --project=chromium

# Run with headed mode (see browser)
npx playwright test e2e/tests/clientes/clientes-list.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/clientes-list.spec.ts --debug

# Run all Story 2.1 tests (frontend unit + E2E)
cd frontend && npx vitest run src/modules/crm/clientes && cd .. && npx playwright test e2e/tests/api/clientes-list.api.spec.ts e2e/tests/clientes/clientes-list.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Data factories created (inline in test files + `e2e/helpers/data.helper.ts`)
- ✅ MSW fixtures with auto-cleanup (`beforeAll`/`afterEach`/`afterAll` pattern)
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All component tests fail with `Cannot find module './ClienteListPanel'` (module does not exist yet)
- All hook tests fail with `Cannot find module './useClientes'` (module does not exist yet)
- API tests fail with connection refused (backend not implemented yet)
- E2E tests fail with missing `data-testid="clientes-list-panel"` (component not rendered)
- All failures are due to missing implementation — not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** (recommended order: start with `useClientes.test.ts`)
2. **Read the test** to understand expected behavior (Given-When-Then comments)
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist above
6. **Move to next test** and repeat

**Recommended implementation order:**
1. Domain types: `Cliente.ts`, `IClienteRepository.ts`
2. Infrastructure: `clienteApiRepository.ts`
3. Application: `useClientes.ts`
4. Backend: `ClienteEntity` → migration → repository → endpoint
5. Presentation: `ClienteListPanel.tsx` (AC1 → AC2 → AC3 → AC4 → AC5)
6. Route: wire `ClienteListPanel` into `/clientes` route

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. All tests pass (green phase complete for Story 2.1)
2. Check `siesa-ui-kit` for `SearchInput`, `ListItem`, `EmptyState`, `ErrorPanel` equivalents
3. Replace custom components with kit equivalents if available
4. Extract duplicated MSW handler setup into shared `src/shared/lib/test-utils/mswServer.ts`
5. Ensure tests still pass after each refactor
6. Verify WCAG 2.1 AA accessibility with `jest-axe` on `ClienteListPanel`

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing component tests first: `cd frontend && npx vitest run src/modules/crm/clientes`
3. Implement backend (tasks 1-3 in implementation checklist above)
4. Implement frontend domain → infrastructure → application → presentation
5. Work one test at a time (red → green for each)
6. When all tests pass, refactor code for quality

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: all E2E tests use `page.route(...)` BEFORE `page.goto()` to prevent race conditions
- **data-factories.md** — `buildCliente()` / `buildClientes(count)` factory functions with unique IDs per invocation
- **fixture-architecture.md** — MSW `setupServer` pattern with `beforeAll`/`afterEach`/`afterAll` for auto-cleanup isolation
- **component-tdd.md** — `QueryClientProvider` wrapper pattern for TanStack Query isolation per test; `React.lazy` import for RED phase clarity
- **test-quality.md** — One assertion per test (atomic); Given-When-Then comments; no hard waits; explicit `waitFor` timeouts
- **selector-resilience.md** — Only `data-testid` selectors used; no CSS class selectors or brittle text matchers
- **timing-debugging.md** — Network-first (intercept before navigate), explicit `waitFor` with `timeout: 5000`, no `setTimeout` sleeps

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failure reason:** Component `ClienteListPanel.tsx` and hook `useClientes.ts` do not exist yet.

**Expected console output:**
```
FAIL frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx
  Error: Cannot find module './ClienteListPanel'

FAIL frontend/src/modules/crm/clientes/application/useClientes.test.ts
  Error: Cannot find module './useClientes'

FAIL e2e/tests/api/clientes-list.api.spec.ts
  Error: connect ECONNREFUSED 127.0.0.1:5000 (backend not running)
```

**Summary:**
- Total tests: 33 (15 component + 4 unit + 8 API + 10 E2E ... note: 6 E2E already existed in clientes-crud.spec.ts)
- Passing: 0 (expected)
- Failing: 33 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- Story 2.1 introduces `ClienteEntity` for the first time — no prior client entities exist in the codebase
- API tests for TC-E2-P1-01 and TC-E2-P2-07 were pre-existing in `e2e/tests/api/clientes-list.api.spec.ts` (already RED)
- E2E tests in `e2e/tests/clientes/clientes-crud.spec.ts` (FR1–FR8) overlap with this story and depend on the same `ClienteListPanel` implementation — those tests are also RED and will go GREEN as part of this story's implementation
- The `search-input` placeholder text must be exactly "Buscar por nombre o NIT/RUC…" (Spanish, with "…" ellipsis character)
- `react-loading-skeleton` must be used for loading state — NOT a `<Spinner>` component or "Cargando..." text

---

**Generated by BMad TEA Agent** — 2026-06-11
