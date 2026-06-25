# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component (Vitest RTL)

---

## Story Summary

Commercial team members need to view and search the full client list to quickly locate specific clients. The feature adds a 280px split-panel layout at `/clientes`: the left panel shows a scrollable, searchable client list; the right panel stays in placeholder state until a client is selected.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for.

---

## Acceptance Criteria

1. **AC1** — Given clients exist, when user navigates to `/clientes`, the left panel (280px) renders a scrollable list showing every client with Nombre and NIT/RUC per item.
2. **AC2** — Given the list is loaded, when user types in the search field, the list filters in real time showing only matching clients (case-insensitive, < 1 second with 500 records).
3. **AC3** — Given no clients exist (empty API response), when user navigates to `/clientes`, an `EmptyState` component is shown with a Spanish guidance message; search field and list container are still rendered.
4. **AC4** — Given the backend is unavailable (network error or 5xx), when fetch fails, an `ErrorPanel` with a "Reintentar" button is displayed; clicking triggers TanStack Query `refetch`.
5. **AC5** — Given the route `/clientes` is accessed, when no client is selected, the right panel remains in placeholder state and URL stays at `/clientes` without a client ID segment.

---

## Failing Tests Created (RED Phase)

### E2E Tests (15 tests)

**File:** `e2e/story-2-1/client-list-search.spec.ts`

**AC1 — Lista de clientes en panel izquierdo (5 tests)**

- RED **Test:** `should render the left list panel with fixed 280px width when clients exist`
  - **Status:** RED — `data-testid="clientes-list-panel"` element does not exist (component not implemented)
  - **Verifies:** AC1 — Left panel renders on navigation to /clientes

- RED **Test:** `should display client Nombre in each list item`
  - **Status:** RED — `data-testid="cliente-list-item"` not rendered
  - **Verifies:** AC1 — Nombre visible per list item

- RED **Test:** `should display client NIT/RUC in each list item`
  - **Status:** RED — `data-testid="cliente-list-item"` not rendered
  - **Verifies:** AC1 — NIT/RUC visible per list item

- RED **Test:** `should render a scrollable list container`
  - **Status:** RED — `data-testid="clientes-list-container"` not present
  - **Verifies:** AC1 — Scrollable container exists

- RED **Test:** `should render the search input field`
  - **Status:** RED — `data-testid="clientes-search-input"` not rendered
  - **Verifies:** AC1 — Search field is present and accessible

**AC2 — Filtrado en tiempo real (5 tests)**

- RED **Test:** `should filter list by nombre when user types in search field`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Nombre-based filtering narrows list

- RED **Test:** `should filter list by NIT when user types in search field`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — NIT-based filtering narrows list

- RED **Test:** `should perform case-insensitive filtering by nombre`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Case-insensitive matching

- RED **Test:** `should show all clients when search field is cleared`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Clearing search restores full list

- RED **Test:** `should show empty result set when search text matches no client`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Zero items shown when no match

**AC3 — Estado vacío (3 tests)**

- RED **Test:** `should display EmptyState component when API returns empty array`
  - **Status:** RED — EmptyState component does not exist
  - **Verifies:** AC3 — EmptyState rendered on empty list

- RED **Test:** `should display a Spanish guidance message in the EmptyState`
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — Spanish guidance text present

- RED **Test:** `should still render search field and list container when empty`
  - **Status:** RED — Component not implemented
  - **Verifies:** AC3 — Search field present even when empty

**AC4 — ErrorPanel y Reintentar (4 tests)**

- RED **Test:** `should display ErrorPanel when API returns 500`
  - **Status:** RED — ErrorPanel component does not exist
  - **Verifies:** AC4 — Error UI shown on 5xx

- RED **Test:** `should display ErrorPanel when API call fails with network error`
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — Error UI shown on network failure

- RED **Test:** `should display a "Reintentar" button inside ErrorPanel`
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — Retry button present

- RED **Test:** `should trigger a new fetch when "Reintentar" button is clicked`
  - **Status:** RED — ErrorPanel + refetch not wired
  - **Verifies:** AC4 — Clicking Reintentar triggers new fetch

**AC5 — Right panel placeholder (3 tests)**

- RED **Test:** `should show right panel placeholder when no client is selected`
  - **Status:** RED — `data-testid="cliente-detail-panel"` not implemented
  - **Verifies:** AC5 — Right panel exists in placeholder state

- RED **Test:** `should not render client detail content when no client is selected`
  - **Status:** RED — Detail content testid not implemented
  - **Verifies:** AC5 — No detail rendered without selection

- RED **Test:** `should keep URL at /clientes without a client ID segment when none is selected`
  - **Status:** RED — Route not implemented
  - **Verifies:** AC5 — URL stays at /clientes

### API Tests (7 tests)

**File:** `e2e/story-2-1/clientes-api.api.spec.ts`

- RED **Test:** `should return HTTP 200 OK`
  - **Status:** RED — Endpoint not registered
  - **Verifies:** AC1 — GET /api/v1/clientes returns 200

- RED **Test:** `should return Content-Type application/json`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — Correct content type

- RED **Test:** `should return a JSON array (not an object wrapper)`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — Direct array response, no wrapper

- RED **Test:** `should return items with camelCase id field`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — camelCase id (UUID)

- RED **Test:** `should return items with camelCase nombre field`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — camelCase nombre

- RED **Test:** `should return items with camelCase nit field`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — camelCase nit

- RED **Test:** `should return items with camelCase createdAt and updatedAt fields`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC1 — camelCase timestamps (DateTimeOffset)

### Component Tests (Vitest RTL — 22 tests)

**useClientes hook** — `frontend/src/modules/crm/clientes/application/useClientes.test.ts` (6 tests)

- RED `should use queryKey ["clientes"]`
- RED `should return data array with client objects on success`
- RED `should expose isLoading true before data arrives`
- RED `should expose isError true and error object when API fails`
- RED `should expose a refetch function on error state`
- RED `should return empty array when API returns empty array`

**ClienteListPanel** — `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx` (13 tests)

- RED `should render list panel container` (AC1)
- RED `should render client nombre in list item` (AC1)
- RED `should render client NIT in list item` (AC1)
- RED `should render the search input with accessible label` (AC1)
- RED `should filter list items by nombre substring` (AC2)
- RED `should filter list items by NIT substring` (AC2)
- RED `should perform case-insensitive filtering` (AC2)
- RED `should show zero items when search matches nothing` (AC2)
- RED `should display EmptyState when API returns empty array` (AC3)
- RED `should not show client list items when data is empty` (AC3)
- RED `should still render search input when data is empty` (AC3)
- RED `should display ErrorPanel when API returns 500` (AC4)
- RED `should display "Reintentar" button inside ErrorPanel` (AC4)
- RED `should call refetch when "Reintentar" button is clicked` (AC4)

**EmptyState** — `frontend/src/shared/components/EmptyState.test.tsx` (3 tests)

- RED `should render the empty state container`
- RED `should display the provided message text`
- RED `should render an icon element`

**ErrorPanel** — `frontend/src/shared/components/ErrorPanel.test.tsx` (5 tests)

- RED `should render the error panel container`
- RED `should display an error message in Spanish`
- RED `should render a "Reintentar" button`
- RED `should call onRetry when "Reintentar" button is clicked`
- RED `should display the "Reintentar" label on the button`

---

## Data Factories Created

### Cliente Factory

**File:** `e2e/support/factories/cliente.factory.ts`

**Exports:**

- `buildClientePayload(overrides?)` — Create a POST body for /api/v1/clientes
- `buildClienteResponse(overrides?)` — Simulate a full API response object
- `buildClienteResponses(count, overrides?)` — Bulk creation for performance tests

**In-test helpers** (inline in spec files, no external dependency):

- `buildClienteStub(overrides?)` — Returns a ClienteResponse-shaped object with a fixed UUID, used directly in Playwright `route.fulfill()` bodies

---

## Fixtures Created

### base.fixture.ts (existing — extended)

**File:** `e2e/fixtures/base.fixture.ts` (already exists from Story 1.x)

**Available fixtures:**

- `clientesPage` — Navigates to `/clientes` before test and provides auto-cleanup context
- `contactosPage` — Navigates to `/contactos`

No new fixtures required for Story 2.1. The E2E tests for this story use `page.route()` (network-first) instead of real API calls, making data-seeding fixtures unnecessary at this level.

---

## Mock Requirements

### GET /api/v1/clientes

**Endpoint:** `GET http://localhost:5000/api/v1/clientes`

**Success Response (200):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Empresa Ejemplo S.A.",
    "nit": "900123456-7",
    "telefono": "6011234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

**Empty Response (200):**

```json
[]
```

**Server Error Response (500):**

```json
{
  "status": 500,
  "title": "Internal Server Error"
}
```

**Notes:** All E2E tests use Playwright `page.route()` to intercept before navigation. No real backend calls are made in the E2E suite for this story. API tests (`clientes-api.api.spec.ts`) hit the real backend.

---

## Required data-testid Attributes

### ClienteListPanel (`/clientes` route)

- `clientes-list-panel` — Left panel wrapper (280px fixed width)
- `clientes-list-container` — Scrollable list container (`overflow-y-auto`)
- `clientes-search-input` — Search `<input type="search" />` with Spanish aria-label
- `cliente-list-item` — Each client row in the list (repeating)

### EmptyState component

- `empty-state` — Outer wrapper of empty state
- `empty-state-icon` — Icon element (InboxIcon or equivalent)

### ErrorPanel component

- `error-panel` — Outer wrapper of error panel
- `error-panel-retry-button` — "Reintentar" `<button>`

### Route layout (`/clientes`)

- `cliente-detail-panel` — Right panel wrapper
- `cliente-detail-content` — Content area inside right panel (absent when no client selected)

**Implementation Example:**

```tsx
<div data-testid="clientes-list-panel">
  <input data-testid="clientes-search-input" type="search" aria-label="Buscar por nombre o NIT/RUC..." />
  <div data-testid="clientes-list-container">
    {filtered.map((c) => (
      <div key={c.id} data-testid="cliente-list-item">{c.nombre} — {c.nit}</div>
    ))}
  </div>
</div>
<div data-testid="cliente-detail-panel">
  {/* placeholder when no client selected */}
</div>
```

```tsx
<div data-testid="empty-state">
  <span data-testid="empty-state-icon"><InboxIcon /></span>
  <p>{message}</p>
</div>
```

```tsx
<div data-testid="error-panel">
  <p>Ocurrió un error al cargar los datos.</p>
  <button data-testid="error-panel-retry-button" onClick={onRetry}>Reintentar</button>
</div>
```

---

## Implementation Checklist

### Test: AC1 — Left panel renders client list (E2E)

**File:** `e2e/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` (queryKey: `['clientes']`)
- [ ] Create `frontend/src/shared/components/EmptyState.tsx`
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
- [ ] Create `frontend/src/routes/_app/clientes.tsx` (split-panel layout)
- [ ] Add data-testid attributes: `clientes-list-panel`, `clientes-list-container`, `clientes-search-input`, `cliente-list-item`
- [ ] Run test: `npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC1"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC2 — Real-time search filtering (E2E + Component)

**File:** `e2e/story-2-1/client-list-search.spec.ts` + `ClienteListPanel.test.tsx`

**Tasks to make these tests pass:**

- [ ] Implement `searchQuery` state with `useState('')` in `ClienteListPanel`
- [ ] Implement `useMemo` filter: case-insensitive match on `nombre` and `nit`
- [ ] Wire search `<input>` `onChange` to update `searchQuery`
- [ ] Ensure filter resolves in < 50ms for 500 records (client-side, no API call)
- [ ] Run test: `npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC2"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — EmptyState (E2E + Component)

**File:** `e2e/story-2-1/client-list-search.spec.ts` + `EmptyState.test.tsx`

**Tasks to make these tests pass:**

- [ ] Implement `EmptyState` component with `message` prop
- [ ] Add `data-testid="empty-state"` and `data-testid="empty-state-icon"`
- [ ] Add Spanish placeholder message in `ClienteListPanel` when data is empty
- [ ] Keep search input and list container visible even in empty state
- [ ] Run test: `npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC3"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC4 — ErrorPanel and Reintentar (E2E + Component)

**File:** `e2e/story-2-1/client-list-search.spec.ts` + `ErrorPanel.test.tsx`

**Tasks to make these tests pass:**

- [ ] Implement `ErrorPanel` component with `onRetry` prop
- [ ] Add `data-testid="error-panel"` and `data-testid="error-panel-retry-button"`
- [ ] Button label must be exactly "Reintentar"
- [ ] Wire `onRetry` to TanStack Query `refetch` in `ClienteListPanel`
- [ ] Handle both 5xx responses and `AxiosError` network failures as error state
- [ ] Run test: `npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC4"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — Right panel placeholder (E2E)

**File:** `e2e/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Implement route `/clientes` with split-panel layout
- [ ] Right panel (`data-testid="cliente-detail-panel"`) shows placeholder text when no client selected
- [ ] `data-testid="cliente-detail-content"` must NOT be present until a client is selected
- [ ] Route must stay at `/clientes` (no `$clienteId` segment added on default visit)
- [ ] Run test: `npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC5"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: GET /api/v1/clientes API contract

**File:** `e2e/story-2-1/clientes-api.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Register `IClienteRepository` → `ClienteRepository` in `Program.cs`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- [ ] Map `GET /api/v1/clientes` returning direct JSON array (200)
- [ ] Run EF Core migration for `clientes` table
- [ ] Run test: `npx playwright test e2e/story-2-1/clientes-api.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: useClientes hook (Vitest)

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts`

**Tasks to make these tests pass:**

- [ ] Create `useClientes.ts` using `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll, staleTime: 30_000 })`
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/application/useClientes.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 30 minutes

---

## Running Tests

```bash
# Run all E2E failing tests for this story
npx playwright test e2e/story-2-1/

# Run E2E tests by AC group
npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC1"
npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC2"
npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC3"
npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC4"
npx playwright test e2e/story-2-1/client-list-search.spec.ts --grep "AC5"

# Run API contract tests
npx playwright test e2e/story-2-1/clientes-api.api.spec.ts

# Run component tests (Vitest)
pnpm --filter frontend test src/modules/crm/clientes/
pnpm --filter frontend test src/shared/components/EmptyState.test.tsx
pnpm --filter frontend test src/shared/components/ErrorPanel.test.tsx

# Run in headed mode (see browser)
npx playwright test e2e/story-2-1/ --headed

# Debug specific test
npx playwright test e2e/story-2-1/client-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented (Playwright route interception + MSW for Vitest)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected (missing components/endpoints)
- Failure messages are clear: element not found / module not found
- Tests fail due to missing implementation, not test logic errors

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Start with backend: implement `GET /api/v1/clientes` (makes API tests green)
2. Then frontend domain + infrastructure layers
3. Then `useClientes` hook (makes hook tests green)
4. Then `EmptyState` and `ErrorPanel` components (makes component tests green)
5. Then `ClienteListPanel` with search (makes panel tests green)
6. Finally wire route at `/clientes` (makes E2E tests green)

**Key Principles:**

- One test at a time — don't try to fix all at once
- Minimal implementation — don't over-engineer
- Run tests frequently — immediate feedback
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 44 tests pass (green phase complete)
2. Review ClienteListPanel for DRY violations
3. Optimize `useMemo` filter if performance profiling shows issues
4. Ensure WCAG 2.1 AA on all components (axe-core audit)
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev-story workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/story-2-1/`
3. Begin backend implementation first (AC1 API contract)
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor for quality
6. Update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation (`page.route()` before `page.goto()`)
- **data-factories.md** — Counter-based factory pattern in `cliente.factory.ts`
- **fixture-architecture.md** — Extended `base.fixture.ts` with `test.extend()`
- **component-tdd.md** — Vitest RTL component tests with `QueryClientProvider` wrapper
- **test-quality.md** — Given-When-Then, one assertion per test, MSW for determinism
- **selector-resilience.md** — All selectors use `data-testid` (no CSS/text selectors)
- **test-levels-framework.md** — E2E for user journeys + Component for UI logic + API for contracts

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/story-2-1/`

**Expected Summary:**

```
Total tests: 22 E2E + 7 API = 29 Playwright tests (RED)
Component tests: 22 Vitest tests (RED)
Grand total: 44 failing tests

Passing: 0 (expected)
Failing: 44 (expected)
Status: RED phase verified
```

**Expected Failure Messages:**

- E2E tests: `Error: Timed out 5000ms waiting for expect(locator).toBeVisible() — Locator: getByTestId('clientes-list-panel')`
- API tests: `Error: connect ECONNREFUSED 127.0.0.1:5000` (backend not running) or `expect(received).toBe(expected) — Expected: 200, Received: 404`
- Vitest component tests: `Error: Cannot find module './ClienteListPanel'`, `Cannot find module './EmptyState'`, `Cannot find module './ErrorPanel'`, `Cannot find module './useClientes'`

---

## Notes

- Search is **client-side only** for MVP — the API always returns the full list; no `?q=` parameter is sent to backend. This is an architecture decision documented in the story.
- The `useClientes` hook uses `staleTime: 30_000` to avoid unnecessary refetches while maintaining responsiveness.
- `DateTimeOffset` (not `DateTime`) is mandatory for `createdAt`/`updatedAt` on backend.
- `EmptyState` and `ErrorPanel` should be checked in `siesa-ui-kit` before creating custom implementations.
- All user-facing text must be in Spanish; code (variables, functions, types) in English.

---

**Generated by BMad TEA Agent** — 2026-06-25
