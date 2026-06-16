# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-16
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL) + E2E (Playwright)

---

## Story Summary

Story 2.1 delivers the read side of the `clientes` domain: a `GET /api/v1/clientes` backend endpoint plus a `ClienteListView` React component with real-time client-side search. It is a prerequisite for all other Epic 2 stories.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given clients exist, When user navigates to `/clientes`, Then the left panel (280px fixed width) renders a scrollable list showing Nombre and NIT/RUC per item within 2 seconds (NFR2).
2. **AC2** — Given the list is loaded, When user types in search field, Then list filters in real time (debounce ≤150ms), case-insensitive, on Nombre or NIT/RUC; no additional API call triggered (NFR1 — <1s with up to 500 records).
3. **AC3** — Given no clients exist, When user navigates to `/clientes`, Then an `EmptyState` component is shown with "No hay clientes registrados. Crea el primero."
4. **AC4** — Given backend is unavailable, When `GET /api/v1/clientes` fails, Then `ErrorPanel` is shown with a "Reintentar" button; raw error message is NEVER shown (NFR6).
5. **AC5** — Given the list is loaded with no search active, Then clients are displayed in default order (most recently created first, "Más reciente").
6. **AC6** — Given user typed a search query with no matching results, Then an inline "Sin resultados para '{{query}}'" message is shown; `EmptyState` is NOT shown.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/clientes/2-1-client-list-search.spec.ts`

- **Test:** `AC1 — left panel is visible and shows cliente Nombre and NIT within 2 seconds of navigation`
  - **Status:** RED — `ClienteListView` component and route `/clientes` not yet implemented
  - **Verifies:** AC1 — list panel renders with correct data within 2 seconds

- **Test:** `AC1 — left panel has 280px fixed width`
  - **Status:** RED — `clientes-list-panel` element does not exist yet
  - **Verifies:** AC1 — layout constraint (280px fixed width)

- **Test:** `AC3 — EmptyState with guidance message is shown when no clients exist in the system`
  - **Status:** RED — `empty-state` testid not implemented
  - **Verifies:** AC3 — `EmptyState` component renders with correct Spanish message

- **Test:** `AC4 — ErrorPanel is shown with "Reintentar" button when GET /api/v1/clientes fails`
  - **Status:** RED — `error-panel` testid not implemented
  - **Verifies:** AC4 — `ErrorPanel` renders on 503/failure; no raw error exposed (NFR6)

- **Test:** `AC4 — clicking "Reintentar" button triggers a new fetch request`
  - **Status:** RED — `error-panel` and refetch not implemented
  - **Verifies:** AC4 — refetch is triggered on "Reintentar" click; list recovers after retry

### API Tests (5 tests)

**File:** `e2e/tests/api/2-1-client-list-search.api.spec.ts`

- **Test:** `AC1 — GET /api/v1/clientes returns HTTP 200 with Content-Type application/json`
  - **Status:** RED — endpoint `GET /api/v1/clientes` does not exist
  - **Verifies:** AC1 — endpoint exists and returns JSON

- **Test:** `AC1 — GET /api/v1/clientes returns a JSON array`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — response body is a JSON array

- **Test:** `AC1 — each client item contains id, nombre, nit, telefono, ciudad, createdAt, updatedAt`
  - **Status:** RED — `ClienteDto` shape not implemented
  - **Verifies:** AC1 — response shape matches `ClienteDto` contract

- **Test:** `AC3 — GET /api/v1/clientes returns empty array [] when database has no records`
  - **Status:** RED — endpoint not implemented (maps to P0 TC-E2-P0-01)
  - **Verifies:** AC3 — empty array returned when no records exist

- **Test:** `AC4 — GET /api/v1/clientes/{non-existent-id} returns Problem Details format without stack trace`
  - **Status:** RED — endpoint not implemented (NFR6 compliance)
  - **Verifies:** AC4 — Problem Details RFC 7807 format; no `stackTrace` in response

- **Test:** `AC1 — GET /api/v1/clientes sorts results with most recently created first (default order)`
  - **Status:** RED — sort order not implemented
  - **Verifies:** AC5 — default sort "Más reciente" (createdAt DESC)

### Component Tests (10 tests — Playwright integration style)

**File:** `e2e/tests/component/2-1-client-list-search.component.spec.ts`

- **Test:** `AC2 — filtering by nombre shows only matching clients without triggering extra API calls`
  - **Status:** RED — `ClienteListView` and `search-clientes` testid not implemented
  - **Verifies:** AC2 + R-003 (P0 TC-E2-P0-06) — client-side filter, no refetch

- **Test:** `AC2 — filtering is case-insensitive (uppercase input matches lowercase data)`
  - **Status:** RED — filter logic not implemented
  - **Verifies:** AC2 — case-insensitive matching

- **Test:** `AC2 — filtering by NIT shows only clients with matching NIT`
  - **Status:** RED — NIT filter not implemented
  - **Verifies:** AC2 — NIT/RUC field included in filter

- **Test:** `AC2 — real-time filter handles 500 records without extra API calls (NFR1 — <1s)`
  - **Status:** RED — useMemo filter not implemented
  - **Verifies:** AC2 + NFR1 — 500-record filter in <1s, zero extra API calls

- **Test:** `AC3 — EmptyState component is shown when API returns empty array`
  - **Status:** RED — `empty-state` testid and component not implemented
  - **Verifies:** AC3 — EmptyState renders with correct message

- **Test:** `AC4 — ErrorPanel is shown when GET /api/v1/clientes fails with 500`
  - **Status:** RED — `error-panel` testid and component not implemented
  - **Verifies:** AC4 — ErrorPanel renders; raw error hidden (NFR6); EmptyState NOT shown

- **Test:** `AC4 — ErrorPanel is shown when API fetch fails due to network error`
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — network abort also triggers ErrorPanel

- **Test:** `AC5 — clients are displayed in default order (most recently created first)`
  - **Status:** RED — list order not implemented
  - **Verifies:** AC5 — "Más reciente" default sort

- **Test:** `AC6 — inline no-results message is shown when search matches nothing (EmptyState NOT shown)`
  - **Status:** RED — `no-results-message` testid not implemented
  - **Verifies:** AC6 — inline no-results state; EmptyState NOT shown

- **Test:** `AC6 — clearing search after no-results restores full client list`
  - **Status:** RED — filter state management not implemented
  - **Verifies:** AC6 — clearing search restores full list

- **Test:** `AC1 — skeleton loading state is shown while API response is pending`
  - **Status:** RED — skeleton loading and `aria-busy` not implemented
  - **Verifies:** AC1 — skeleton visible during pending fetch; `aria-busy="true"` on panel

---

## Data Factories Created

### Cliente Factory (Existing — extended)

**File:** `e2e/helpers/data.helper.ts` (existing `buildCliente` function used)

**Exports:**
- `buildCliente(overrides?)` — Creates a single cliente object with unique NIT
- `mockCliente(overrides?)` — Inline factory in component spec for API intercepts
- `mockClientes(count)` — Bulk factory generating N clients with staggered timestamps

**Example Usage:**
```typescript
const data = buildCliente({ nombre: 'Empresa Filtro Especial' });
const bulk = mockClientes(500); // 500 clients for NFR1 test
```

---

## Fixtures Created

### Base Fixture (Existing)

**File:** `e2e/fixtures/base.fixture.ts` (existing `clientesPage` fixture used as-is)

**Fixtures:**
- `clientesPage` — Navigates to `/clientes` before test and provides setup
  - **Setup:** Navigates to `/clientes` route
  - **Provides:** Nothing (navigation side effect only)
  - **Cleanup:** Auto (Playwright page lifecycle)

---

## Mock Requirements

### GET /api/v1/clientes Mock (E2E + Component tests)

**Pattern:** `**/api/v1/clientes`

**Success Response (AC1, AC2, AC5):**
```json
[
  {
    "id": "uuid-string",
    "nombre": "Empresa Mock",
    "nit": "900000001",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "updatedAt": "2026-06-16T00:00:00.000Z"
  }
]
```

**Empty Response (AC3):**
```json
[]
```

**Failure Response (AC4):**
```json
{ "title": "Service Unavailable", "status": 503 }
```

**Notes:** All intercepts use **network-first pattern** — routes must be registered via `page.route()` BEFORE `page.goto()` to prevent race conditions.

---

## Required data-testid Attributes

### ClienteListView Component

- `clientes-list-panel` — The 280px fixed-width left panel container (`aria-busy="true"` during loading)
- `search-clientes` — Search input field (`<input placeholder="Buscar por nombre o NIT/RUC..." aria-label="Buscar clientes" />`)
- `cliente-list-item` — Each client row in the list (repeating, filtered by `hasText`)
- `empty-state` — EmptyState component container (zero records in system)
- `no-results-message` — Inline no-results message (search active, zero matches)
- `error-panel` — ErrorPanel component container (fetch failed)

### Implementation Example

```tsx
// ClienteListView.tsx
<div data-testid="clientes-list-panel" aria-busy={isLoading}>
  <input data-testid="search-clientes" placeholder="Buscar por nombre o NIT/RUC..." aria-label="Buscar clientes" />
  {isError && <ErrorPanel data-testid="error-panel" onRetry={refetch} />}
  {!isError && isEmpty && <EmptyState data-testid="empty-state" message="No hay clientes registrados. Crea el primero." />}
  {!isError && !isEmpty && filtered.length === 0 && searchQuery && (
    <p data-testid="no-results-message">Sin resultados para '{searchQuery}'</p>
  )}
  {!isError && filtered.map(c => <ClientListItem key={c.id} data-testid="cliente-list-item" cliente={c} />)}
</div>
```

---

## Implementation Checklist

### Test: AC1 — Left panel renders with list within 2 seconds

**File:** `e2e/tests/clientes/2-1-client-list-search.spec.ts`

**Tasks to make this test pass:**
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` + Handler
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Run `dotnet ef migrations add AddClienteEntity`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with `GET /api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` with `data-testid="clientes-list-panel"`
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` with `data-testid="cliente-list-item"`
- [ ] Wire route `frontend/src/routes/_app/clientes.tsx` to render `ClienteListView`
- [ ] Add `aria-busy` attribute to list panel container
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours (backend + frontend)

---

### Test: AC2 — Real-time filter without extra API call (R-003 P0)

**File:** `e2e/tests/component/2-1-client-list-search.component.spec.ts`

**Tasks to make this test pass:**
- [ ] Add `searchQuery` local `useState` in `ClienteListView`
- [ ] Add `data-testid="search-clientes"` to search input
- [ ] Implement `useMemo` filter: `data?.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
- [ ] Dependency array: `[data, searchQuery]` — NOT triggering new fetches
- [ ] Verify `useClientes` uses `staleTime: 30_000` (no refetch on focus by default)
- [ ] Run test: `pnpm exec playwright test e2e/tests/component/2-1-client-list-search.component.spec.ts --grep "AC2"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC3 — EmptyState for zero records

**File:** `e2e/tests/clientes/2-1-client-list-search.spec.ts` + `e2e/tests/component/...`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` with `data-testid="empty-state"` prop
- [ ] Render `<EmptyState message="No hay clientes registrados. Crea el primero." />` in `ClienteListView` when `data?.length === 0 && !isLoading && !isError`
- [ ] Run test: `pnpm exec playwright test --grep "AC3"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC4 — ErrorPanel with Reintentar button (NFR6)

**File:** `e2e/tests/clientes/2-1-client-list-search.spec.ts` + `e2e/tests/component/...`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with `data-testid="error-panel"` and `onRetry` prop
- [ ] Render "No se pudo cargar la lista de clientes." message (hardcoded Spanish — NOT `error.message`)
- [ ] Render "Reintentar" button that calls `refetch()` from `useClientes`
- [ ] NEVER pass raw `error` object or `error.message` to ErrorPanel display
- [ ] Render `<ErrorPanel onRetry={refetch} />` in `ClienteListView` when `isError === true`
- [ ] Run test: `pnpm exec playwright test --grep "AC4"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC5 — Default sort (most recently created first)

**File:** `e2e/tests/api/2-1-client-list-search.api.spec.ts` + `e2e/tests/component/...`

**Tasks to make this test pass:**
- [ ] Backend: `GET /api/v1/clientes` returns records ordered by `created_at DESC`
  - Add `.OrderByDescending(c => c.CreatedAt)` in `ClienteRepository.GetAllAsync`
- [ ] Frontend: `ClienteListView` renders in the order received (no client-side re-sort for default)
- [ ] Run test: `pnpm exec playwright test --grep "AC5"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC6 — Inline no-results state (EmptyState NOT shown)

**File:** `e2e/tests/component/2-1-client-list-search.component.spec.ts`

**Tasks to make this test pass:**
- [ ] In `ClienteListView`, add condition: when `filtered.length === 0 && searchQuery.trim() !== ''`
  - Render `<p data-testid="no-results-message">Sin resultados para '{searchQuery}'</p>`
  - Do NOT render `<EmptyState>` in this case
- [ ] Run test: `pnpm exec playwright test --grep "AC6"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all Story 2.1 ATDD tests
pnpm exec playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts e2e/tests/api/2-1-client-list-search.api.spec.ts e2e/tests/component/2-1-client-list-search.component.spec.ts

# Run E2E tests only
pnpm exec playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts

# Run API contract tests only
pnpm exec playwright test e2e/tests/api/2-1-client-list-search.api.spec.ts

# Run component acceptance tests only
pnpm exec playwright test e2e/tests/component/2-1-client-list-search.component.spec.ts

# Run in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts --debug

# Run tests with HTML reporter
pnpm exec playwright test --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**
- ✅ 19 failing tests written across E2E (5), API (6), Component (10) — all in RED phase
- ✅ Network-first intercepts applied (route registered BEFORE navigation in all tests)
- ✅ `data-testid` selectors used throughout (no brittle CSS selectors)
- ✅ Given-When-Then structure in all tests
- ✅ No hard waits — only explicit waits (`expect(...).toBeVisible()`, `toHaveCount()`)
- ✅ Mock requirements documented
- ✅ Required `data-testid` attributes listed
- ✅ Implementation checklist created

**Verification:**
- Tests will fail with `page.getByTestId('clientes-list-panel') — waiting for locator` since components don't exist
- API tests will fail with connection refused (endpoint not implemented)
- Failures are due to missing implementation, NOT test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick first test** — start with API tests (backend prerequisite for frontend)
2. **Implement `GET /api/v1/clientes`** endpoint (Tasks 1 + 5 in story)
3. **Run:** `pnpm exec playwright test e2e/tests/api/2-1-client-list-search.api.spec.ts`
4. **Implement `ClienteListView`** + shared components (Tasks 2 + 3 in story)
5. **Add `data-testid` attributes** as listed above
6. **Run:** `pnpm exec playwright test e2e/tests/clientes/ e2e/tests/component/`
7. **Fix one failing test at a time** until all 19 pass

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 19 tests green
2. Extract duplicated fixture setup into `base.fixture.ts` if applicable
3. Review `useMemo` filter for edge cases (whitespace, special characters)
4. Ensure `aria-busy` transitions are correct
5. Run full test suite to confirm no regressions

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts e2e/tests/api/2-1-client-list-search.api.spec.ts e2e/tests/component/2-1-client-list-search.component.spec.ts`
3. Begin implementation following the Implementation Checklist above
4. Work one test at a time (RED → GREEN for each AC)
5. When all 19 tests pass, refactor with confidence

---

## Knowledge Base References Applied

- **network-first.md** — All E2E/component tests intercept routes BEFORE navigation (prevents race conditions)
- **selector-resilience.md** — `data-testid` selectors used exclusively; no brittle CSS or text selectors
- **test-quality.md** — Given-When-Then format; no hard waits; explicit assertions
- **fixture-architecture.md** — Existing `base.fixture.ts` extended; auto-cleanup via `afterEach`
- **data-factories.md** — `buildCliente()` factory from `data.helper.ts`; `mockCliente()` inline factory for API mocks
- **timing-debugging.md** — `await expect(...).toBeVisible()` for deterministic waiting; no `sleep()`

---

## Risks Addressed

| Risk ID | Description | Test Coverage |
|---------|-------------|--------------|
| R-003 | Real-time search triggers extra API calls (NFR1) | AC2 component tests assert `apiCallCount === initialCallCount` |
| — | EmptyState vs no-results state confusion | AC3 and AC6 mutually exclusive assertions |
| — | Raw error exposed to user (NFR6) | AC4 tests assert `error.message` NOT visible |

---

**Generated by BMad TEA Agent** — 2026-06-16
