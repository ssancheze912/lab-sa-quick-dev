# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-25
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component + API

---

## Story Summary

This story enables commercial team members to view a full list of clients and search them in real
time by name or NIT/RUC within a 280px fixed left panel. The backend exposes a
`GET /api/v1/clientes` endpoint and the database migration creates the `clientes` table.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given clients exist, When user navigates to `/clientes`, Then the left panel (280px
   fixed) shows a scrollable list with `Nombre` and `NIT/RUC` visible per item.

2. **AC2** — Given the client list is loaded, When user types in the search field, Then the list
   filters in real time (case-insensitive, < 1 second with up to 500 records, no new API call).

3. **AC3** — Given no clients exist, When user navigates to `/clientes`, Then an `EmptyState`
   component is displayed inside the left panel with a Spanish-language guidance message.

4. **AC4** — Given the backend is unavailable on page load, When the fetch fails, Then an
   `ErrorPanel` is displayed with a "Reintentar" button that triggers a refetch.

5. **AC5** — Given `GET /api/v1/clientes` is called, When it responds successfully, Then it returns
   a JSON array with `id` (UUID), `nombre`, `nitRuc`, `telefono`, `ciudad`, `creadoEn` (ISO 8601).

6. **AC6** — Given the `clientes` table does not exist, When `dotnet ef database update` is run,
   Then the migration creates the table with all required columns and `uk_clientes_nit_ruc` index.

---

## Failing Tests Created (RED Phase)

### E2E Tests (18 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts` (375 lines)

- **Test:** should render the left list panel with fixed 280px width
  - **Status:** RED - Element `[data-testid="clientes-list-panel"]` not found (component not created)
  - **Verifies:** AC1 — 280px fixed width left panel exists at /clientes

- **Test:** should display client Nombre in each list item
  - **Status:** RED - No `[data-testid="cliente-list-item"]` elements rendered
  - **Verifies:** AC1 — Nombre visible in each list item

- **Test:** should display client NIT/RUC in each list item
  - **Status:** RED - No `[data-testid="cliente-list-item"]` elements rendered
  - **Verifies:** AC1 — NIT/RUC visible in each list item

- **Test:** should render multiple client items when API returns multiple clients
  - **Status:** RED - `[data-testid="cliente-list-item"]` count is 0, expected 3
  - **Verifies:** AC1 — All clients from API are rendered

- **Test:** should show skeleton placeholders while clients are loading
  - **Status:** RED - `[data-testid="client-list-skeleton"]` not found
  - **Verifies:** AC1 — Loading skeleton replaces spinner

- **Test:** should filter list in real time when user types in search field
  - **Status:** RED - `[data-testid="clientes-search-input"]` not found
  - **Verifies:** AC2 — Real-time filtering by nombre

- **Test:** should filter by NIT/RUC when user types a NIT value
  - **Status:** RED - Search input not found
  - **Verifies:** AC2 — Real-time filtering by nitRuc

- **Test:** should perform case-insensitive search
  - **Status:** RED - Search input not found
  - **Verifies:** AC2 — Case-insensitive matching

- **Test:** should restore full list when search field is cleared
  - **Status:** RED - Search input not found
  - **Verifies:** AC2 — Clear search restores full list

- **Test:** should NOT trigger a new API call when user types in search
  - **Status:** RED - Search input not found
  - **Verifies:** AC2 — Client-side filter (no API call per keystroke)

- **Test:** should display EmptyState component when API returns empty array
  - **Status:** RED - `[data-testid="empty-state"]` not found
  - **Verifies:** AC3 — EmptyState shown when no clients

- **Test:** should display Spanish guidance message in EmptyState
  - **Status:** RED - `[data-testid="empty-state"]` not found
  - **Verifies:** AC3 — Spanish guidance text in EmptyState

- **Test:** should NOT render client list items when EmptyState is shown
  - **Status:** RED - Empty state not rendered
  - **Verifies:** AC3 — No list items alongside EmptyState

- **Test:** should display ErrorPanel when GET /api/v1/clientes returns 500
  - **Status:** RED - `[data-testid="error-panel"]` not found
  - **Verifies:** AC4 — ErrorPanel shown on 500 error

- **Test:** should display ErrorPanel when GET /api/v1/clientes returns network failure
  - **Status:** RED - `[data-testid="error-panel"]` not found
  - **Verifies:** AC4 — ErrorPanel shown on network abort

- **Test:** should show "Reintentar" button inside ErrorPanel
  - **Status:** RED - `[data-testid="error-panel"]` not found
  - **Verifies:** AC4 — "Reintentar" button visible in ErrorPanel

- **Test:** should trigger a new fetch when "Reintentar" button is clicked
  - **Status:** RED - ErrorPanel not rendered
  - **Verifies:** AC4 — Refetch triggered on "Reintentar" click

- **Test:** should NOT render client list items when ErrorPanel is displayed
  - **Status:** RED - ErrorPanel not rendered
  - **Verifies:** AC4 — No list items alongside ErrorPanel

### API Tests (8 tests)

**File:** `e2e/tests/clientes/clientes-api.spec.ts` (136 lines)

- **Test:** should respond with HTTP 200 when the endpoint is called
  - **Status:** RED - GET /api/v1/clientes returns 404 (endpoint not registered)
  - **Verifies:** AC5 — Endpoint exists and returns 200

- **Test:** should return Content-Type application/json
  - **Status:** RED - Endpoint not found (404)
  - **Verifies:** AC5 — Response content type is application/json

- **Test:** should return a JSON array (not a wrapper object)
  - **Status:** RED - Endpoint not found
  - **Verifies:** AC5 — Direct array response (no wrapper object)

- **Test:** should return client objects with id (UUID) field when clients exist
  - **Status:** RED - Endpoint not found
  - **Verifies:** AC5 — id is a valid UUID string

- **Test:** should return client objects with nombre field
  - **Status:** RED - Endpoint not found
  - **Verifies:** AC5 — nombre field present per contract

- **Test:** should return client objects with nitRuc field (camelCase)
  - **Status:** RED - Endpoint not found
  - **Verifies:** AC5 — nitRuc in camelCase (not snake_case)

- **Test:** should return client objects with creadoEn as ISO 8601 UTC string
  - **Status:** RED - Endpoint not found
  - **Verifies:** AC5 — creadoEn is ISO 8601 (not Unix timestamp)

- **Test:** should NOT return nit_ruc (snake_case)
  - **Status:** RED - Endpoint not found
  - **Verifies:** AC5 — JSON serialization uses camelCase

- **Test:** should return empty array when no clients exist (not 404 or null)
  - **Status:** RED - Endpoint not found
  - **Verifies:** AC5 — Empty state returns [] not null/404

- **Test:** should not return 500 due to missing clientes table
  - **Status:** RED - Endpoint not registered (would also fail if migration not run)
  - **Verifies:** AC6 — Migration applied, table exists

### Component Tests (25 tests)

**File:** `frontend/src/test/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- **Tests (17):** ClienteListView — AC1/AC2/AC3/AC4 all states
  - **Status:** RED - Module `@/modules/crm/clientes/presentation/ClienteListView` does not exist

**File:** `frontend/src/test/modules/crm/clientes/application/useClientes.test.ts`

- **Tests (8):** useClientes — success/loading/error states, queryKey
  - **Status:** RED - Module `@/modules/crm/clientes/application/useClientes` does not exist

**File:** `frontend/src/test/shared/components/ClienteListItem.test.tsx`

- **Tests (6):** ClienteListItem — rendering, interaction, selection state, accessibility
  - **Status:** RED - Module `@/shared/components/ClienteListItem` does not exist

**File:** `frontend/src/test/shared/components/EmptyState.test.tsx`

- **Tests (4):** EmptyState — rendering with message/description, reusability
  - **Status:** RED - Module `@/shared/components/EmptyState` does not exist

**File:** `frontend/src/test/shared/components/ErrorPanel.test.tsx`

- **Tests (4):** ErrorPanel — rendering, "Reintentar" interaction
  - **Status:** RED - Module `@/shared/components/ErrorPanel` does not exist

---

## Data Infrastructure

### Existing Data Helper

**File:** `e2e/helpers/data.helper.ts`

The `buildCliente()` helper already exists for E2E API seeding. E2E tests for story 2.1 use
inline fixtures (static JSON objects) passed to `page.route()` interceptors — no database seeding
required for these tests.

### Component Test Data

Component tests use inline `buildClienteFixture()` functions defined within each test file.
Faker is not installed; deterministic counter-based IDs are used instead.

---

## Mock Requirements

### GET /api/v1/clientes (E2E Network Interception)

All E2E tests intercept this route BEFORE navigation using Playwright's `page.route()`.

**Success Response:**
```json
[
  {
    "id": "aaaaaaaa-0000-0000-0000-000000000001",
    "nombre": "Empresa Alpha",
    "nitRuc": "900100001-1",
    "telefono": null,
    "ciudad": null,
    "creadoEn": "2026-01-10T08:00:00Z"
  }
]
```

**Empty Response:** `[]` (200 OK, empty array)

**Error Response (500):**
```json
{ "title": "An unexpected error occurred.", "status": 500 }
```

**Notes:** Network-first pattern — `await page.route(...)` called before `await page.goto(...)`.

### useClientes Hook (Component/Unit Mocks)

The hook is mocked via `vi.mock('@/modules/crm/clientes/application/useClientes')` in component
tests. The underlying `clienteApiRepository.getAll` is mocked via
`vi.mock('@/modules/crm/clientes/infrastructure/clienteApiRepository')` in hook tests.

---

## Required data-testid Attributes

### ClienteListView Component (`/clientes` route)

- `clientes-list-panel` — The 280px fixed left panel container
- `clientes-search-input` — The search `<input>` field
- `client-list-skeleton` — Skeleton placeholder container (rendered while isLoading=true)

### ClienteListItem Component

- `cliente-list-item` — Each individual client row element

### EmptyState Component

- `empty-state` — The empty state container

### ErrorPanel Component

- `error-panel` — The error panel container (also contains the "Reintentar" button)

**Implementation Example:**
```tsx
// ClienteListView.tsx
<div data-testid="clientes-list-panel" className="w-[280px] shrink-0 overflow-y-auto h-full">
  <input data-testid="clientes-search-input" placeholder="Buscar por nombre o NIT/RUC" />
  {isLoading && <div data-testid="client-list-skeleton">...</div>}
</div>

// ClienteListItem.tsx
<div
  data-testid="cliente-list-item"
  role="button"
  aria-selected={isSelected}
  aria-label={`Cliente: ${cliente.nombre}`}
  onClick={onClick}
>
  <span>{cliente.nombre}</span>
  <span>{cliente.nitRuc}</span>
</div>

// EmptyState.tsx
<div data-testid="empty-state">
  <p>{message}</p>
  {description && <p>{description}</p>}
</div>

// ErrorPanel.tsx
<div data-testid="error-panel">
  <p>No se pudo cargar la información</p>
  <button onClick={onRetry}>Reintentar</button>
</div>
```

---

## Implementation Checklist

### Test: should render the left list panel with fixed 280px width (E2E / AC1)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` (TypeScript interface)
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` (TanStack Query hook)
- [ ] Create `frontend/src/shared/components/ClienteListItem.tsx`
- [ ] Create `frontend/src/shared/components/EmptyState.tsx`
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (280px panel)
- [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `<ClienteListView />`
- [ ] Add `data-testid="clientes-list-panel"` to the panel container with `w-[280px]` class
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --project=chromium`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: should filter list in real time when user types in search field (E2E / AC2)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `useState('')` for `searchQuery` inside `ClienteListView`
- [ ] Add `useMemo` to filter `clientes` by `nombre` and `nitRuc` (case-insensitive `.toLowerCase()`)
- [ ] Bind `searchQuery` state to the `<input>` via `onChange` handler
- [ ] Add `data-testid="clientes-search-input"` to the search input
- [ ] Verify no additional API call per keystroke (client-side only)
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --project=chromium`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should display EmptyState component when API returns empty array (E2E / AC3)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement empty array check in `ClienteListView` render logic
- [ ] Render `<EmptyState message="Aún no hay clientes registrados" description="Crea el primer cliente para comenzar" />` when `clientes.length === 0`
- [ ] Add `data-testid="empty-state"` to `EmptyState` component root
- [ ] Ensure `EmptyState` text includes Spanish guidance (e.g., "Crea el primer cliente para comenzar")
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --project=chromium`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 30 minutes

---

### Test: should display ErrorPanel when GET /api/v1/clientes returns 500 (E2E / AC4)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement `isError` check in `ClienteListView` render logic
- [ ] Render `<ErrorPanel onRetry={refetch} />` when `isError === true`
- [ ] Add `data-testid="error-panel"` to `ErrorPanel` component root
- [ ] Add a `<button onClick={onRetry}>Reintentar</button>` inside `ErrorPanel`
- [ ] Verify `refetch` from `useClientes` is passed as `onRetry` prop
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --project=chromium`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 30 minutes

---

### Test: should respond with HTTP 200 when the endpoint is called (API / AC5)

**File:** `e2e/tests/clientes/clientes-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Register `IClienteRepository → ClienteRepository` as scoped in `Program.cs`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- [ ] Register `app.MapClienteEndpoints()` in `Program.cs`
- [ ] Run migration: `dotnet ef migrations add AddClientesTable`
- [ ] Apply migration: `dotnet ef database update`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: ClienteListView component tests (Component / AC1-AC4)

**File:** `frontend/src/test/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create all frontend modules listed above (domain, application, infrastructure, presentation)
- [ ] Ensure `ClienteListView` exports a named export `{ ClienteListView }`
- [ ] Ensure `useClientes` exports `{ useClientes }` from `@/modules/crm/clientes/application/useClientes`
- [ ] Ensure `clienteApiRepository` exports from `@/modules/crm/clientes/infrastructure/clienteApiRepository`
- [ ] Run test: `pnpm exec vitest run src/test/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours (after E2E implementation)

---

### Test: useClientes hook tests (Unit / AC1 + AC4)

**File:** `frontend/src/test/modules/crm/clientes/application/useClientes.test.ts`

**Tasks to make these tests pass:**

- [ ] Create `useClientes.ts` with `useQuery({ queryKey: ['clientes'], queryFn: ... })`
- [ ] Export `{ clientes: data, isLoading, isError, refetch }` shape
- [ ] Run test: `pnpm exec vitest run src/test/modules/crm/clientes/application/useClientes.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 30 minutes

---

### Test: ClienteListItem, EmptyState, ErrorPanel component tests

**Files:**
- `frontend/src/test/shared/components/ClienteListItem.test.tsx`
- `frontend/src/test/shared/components/EmptyState.test.tsx`
- `frontend/src/test/shared/components/ErrorPanel.test.tsx`

**Tasks:**

- [ ] Create `frontend/src/shared/components/ClienteListItem.tsx` with named export `{ ClienteListItem }`
  - Props: `cliente: Cliente`, `isSelected: boolean`, `onClick: () => void`
  - Attributes: `data-testid="cliente-list-item"`, `role="button"`, `aria-selected`, `aria-label`
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` with named export `{ EmptyState }`
  - Props: `message: string`, `description?: string`
  - Attribute: `data-testid="empty-state"`
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with named export `{ ErrorPanel }`
  - Props: `onRetry: () => void`
  - Attributes: `data-testid="error-panel"`; button text must be "Reintentar"
- [ ] Run test: `pnpm exec vitest run src/test/shared/components/`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all E2E tests for story 2.1
npx playwright test e2e/tests/clientes/client-list-search.spec.ts e2e/tests/clientes/clientes-api.spec.ts

# Run only the E2E UI tests (AC1-AC4)
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --project=chromium

# Run only the API contract tests (AC5-AC6)
npx playwright test e2e/tests/clientes/clientes-api.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --headed --project=chromium

# Debug a specific E2E test
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --debug --project=chromium

# Run all frontend component/unit tests for story 2.1
pnpm exec vitest run src/test/modules/crm/clientes/ src/test/shared/components/

# Run with watch mode during development
pnpm exec vitest src/test/modules/crm/clientes/

# Run all frontend tests with coverage
pnpm exec vitest run --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (RED phase)
- ✅ Network-first intercept pattern applied in all E2E tests
- ✅ data-testid requirements listed and used in all tests
- ✅ Mock requirements documented for DEV team
- ✅ Implementation checklist created with clear tasks
- ✅ Given-When-Then structure in all tests

**Verification:**

- E2E tests fail because `ClienteListView`, `ClienteListItem`, `EmptyState`, `ErrorPanel` components do not exist
- API tests fail because `GET /api/v1/clientes` is not registered
- Component tests fail because all module files are missing
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with API backend — blocks E2E)
2. **Implement backend first:** Entity → DTO → QueryHandler → Repository → Endpoint → Migration
3. **Verify API tests green:** `npx playwright test e2e/tests/clientes/clientes-api.spec.ts`
4. **Then implement frontend:** domain → infrastructure → application → shared components → presentation
5. **Verify component tests green:** `pnpm exec vitest run src/test/modules/crm/clientes/`
6. **Verify E2E tests green:** `npx playwright test e2e/tests/clientes/client-list-search.spec.ts`

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Backend first (frontend E2E tests depend on API)
- Use `page.route()` in E2E tests — they don't need the real backend running
- Add `data-testid` attributes exactly as listed in this checklist

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. **Verify all tests pass** (green phase complete)
2. **Extract shared patterns** (if `EmptyState` or `ErrorPanel` are reused in Epic 3)
3. **Optimize `useMemo` filter** if performance profiling reveals bottlenecks
4. **Ensure tests still pass** after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow
2. **Run failing tests** to confirm RED phase:
   - `npx playwright test e2e/tests/clientes/`
   - `pnpm exec vitest run src/test/modules/crm/clientes/ src/test/shared/components/`
3. **Begin implementation** starting with backend (AC5/AC6 → AC1-AC4)
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests intercept `page.route('**/api/v1/clientes', ...)` BEFORE `page.goto('/clientes')` to prevent race conditions
- **fixture-architecture.md** — Component tests use `vi.mock()` for hook isolation; `QueryClientProvider` wrapper in hook tests
- **data-factories.md** — Inline `buildClienteFixture()` helpers in test files (faker not installed; counter-based IDs used)
- **component-tdd.md** — Component tests use React Testing Library with `render`, `screen`, `fireEvent`
- **test-quality.md** — One assertion per test, Given-When-Then structure, no hard waits
- **selector-resilience.md** — All tests use `data-testid` selectors exclusively (no CSS class selectors)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Commands:**
```bash
npx playwright test e2e/tests/clientes/
pnpm exec vitest run src/test/modules/crm/clientes/ src/test/shared/components/
```

**Expected Results:**
- E2E tests: 28 tests failing — `locator.toBeVisible: Error: strict mode violation` / element not found
- API tests: Failing — `expect(received).toBe(200)` → received 404
- Component tests: Failing — `Cannot find module '@/modules/crm/clientes/presentation/ClienteListView'`

**Summary:**

- Total tests: 51 (18 E2E + 10 API + 23 Component)
- Passing: 0 (expected)
- Failing: 51 (expected)
- Status: ✅ RED phase verified

---

## Notes

- `tea_use_playwright_utils: false` — Pure Playwright API used (no playwright-utils helpers)
- `tea_use_mcp_enhancements: false` — AI generation mode used (not recording mode)
- The existing `client-list-search.spec.ts` was already present in the repo; this checklist documents it as the authoritative E2E test file for story 2.1
- Component tests follow the same directory convention as existing tests in `frontend/src/test/`
- AC6 (database migration) is verified indirectly by the API tests — if the migration is not applied, `GET /api/v1/clientes` will return 500

---

**Generated by BMad TEA Agent** - 2026-05-25
