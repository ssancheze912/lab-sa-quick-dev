# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-21
**Author:** SiesaTeam
**Primary Test Level:** Component + API + E2E

---

## Story Summary

Story 2.1 delivers the client list panel (280px fixed-width left column) with real-time search by Nombre or NIT/RUC, plus empty state and error state handling. The list is loaded via `GET /api/v1/clientes` and filtered client-side using `useMemo` — no backend search endpoint required for this story.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC#1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px) shows a scrollable list of all clients with Nombre and NIT/RUC visible per item. (AC-E2.1, FR1)

2. **AC#2** — Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, And results appear in under 1 second with up to 500 records. (AC-E2.2, FR2, NFR1)

3. **AC#3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **AC#4** — Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list.

---

## Failing Tests Created (RED Phase)

### E2E Tests (9 tests)

**File:** `e2e/tests/clientes/2-1-client-list-search.spec.ts`

- **Test:** `[P0][TC-2.1-E-01] Given clients exist, When navigating to /clientes, Then list shows Nombre and NIT/RUC per item`
  - **Status:** RED — `ClienteListView` not yet implemented; `data-testid="clientes-list-panel"` and `data-testid="cliente-list-item"` don't exist
  - **Verifies:** AC#1 — list panel renders existing clients with correct fields

- **Test:** `[P0][TC-2.1-E-01b] Given clients exist, When list renders, Then each item shows NIT/RUC below Nombre`
  - **Status:** RED — same as above; NIT not visible in current placeholder
  - **Verifies:** AC#1 — NIT/RUC visible per item

- **Test:** `[P1][TC-2.1-E-03] Given /clientes loaded, When list panel renders, Then search input is visible with correct placeholder`
  - **Status:** RED — `data-testid="search-input"` missing; placeholder text not set
  - **Verifies:** AC#2 — search input present with Spanish placeholder "Buscar por nombre o NIT/RUC…"

- **Test:** `[P0][TC-2.1-E-04] Given clients loaded, When typing Nombre in search field, Then only matching clients are shown`
  - **Status:** RED — filter logic in `ClienteListView` not implemented
  - **Verifies:** AC#2 — real-time filter by Nombre

- **Test:** `[P0][TC-2.1-E-05] Given clients loaded, When typing NIT in search field, Then only matching clients are shown`
  - **Status:** RED — filter logic not implemented
  - **Verifies:** AC#2 — real-time filter by NIT/RUC

- **Test:** `[P1][TC-2.1-E-06] Given no clients in system, When navigating to /clientes, Then EmptyState is shown with guidance message`
  - **Status:** RED — `EmptyState` component not yet wired to `ClienteListView`
  - **Verifies:** AC#3 — empty state displayed

- **Test:** `[P1][TC-2.1-E-06b] Given no clients, When EmptyState is shown, Then the client list is NOT rendered`
  - **Status:** RED — same as above
  - **Verifies:** AC#3 — no list items when empty

- **Test:** `[P1][TC-2.1-E-07] Given backend unavailable, When page loads, Then ErrorPanel is shown with "Reintentar" button`
  - **Status:** RED — `ErrorPanel` not yet integrated in `ClienteListView`
  - **Verifies:** AC#4 — error state displayed

- **Test:** `[P1][TC-2.1-E-07b] Given backend returns error, When ErrorPanel is shown, Then no stack trace or technical details displayed`
  - **Status:** RED — NFR6 compliance not verifiable without implementation
  - **Verifies:** AC#4 + NFR6 — no technical details in error state

- **Test:** `[P1][TC-2.1-E-08] Given ErrorPanel shown, When user clicks "Reintentar", Then fetch is retried`
  - **Status:** RED — `refetch()` binding on retry button not implemented
  - **Verifies:** AC#4 — retry button triggers refetch

### API Tests (7 tests)

**File:** `e2e/tests/api/2-1-clientes-endpoint.api.spec.ts`

- **Test:** `[P2][TC-2.1-A-01] GET /api/v1/clientes returns 200`
  - **Status:** RED — endpoint `GET /api/v1/clientes` not yet implemented
  - **Verifies:** AC#1 — endpoint exists and responds

- **Test:** `[P2][TC-2.1-A-02] Response items include id, nombre, nit, telefono, ciudad, createdAt, updatedAt`
  - **Status:** RED — `ClienteDto` and `GetClientesQueryHandler` not yet created
  - **Verifies:** AC#1 — correct response shape

- **Test:** `[P2][TC-2.1-A-03] Response is a direct array (no wrapper object)`
  - **Status:** RED — endpoint returns no data yet
  - **Verifies:** Architecture constraint — direct array, no wrapper

- **Test:** `[P1][TC-2.1-A-04] createdAt and updatedAt include timezone offset (ISO 8601 with +hh:mm or Z)`
  - **Status:** RED — `ClienteEntity` uses `DateTime` by default; requires `DateTimeOffset` (R-007)
  - **Verifies:** AC#1 + R-007 — DateTimeOffset not DateTime

- **Test:** `[P0][TC-2.1-A-05] Response time < 1000ms`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#2 NFR1 — < 1 second response

- **Test:** `[P1][TC-2.1-A-06] Returns 200 with empty array when no clients`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC#3 contract — empty array never 404

- **Test:** `[P2][TC-2.1-A-07] id field is a valid UUID`
  - **Status:** RED — `ClienteEntity.Id` is `Guid` — valid once implemented
  - **Verifies:** AC#1 — id is UUID format

### Component Tests (12 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

- **Test:** `[P0][TC-2.1-C-01] API returns clients → items show Nombre and NIT/RUC`
  - **Status:** RED — `ClienteListView` component does not exist; import fails
  - **Verifies:** AC#1 — list renders with correct field display

- **Test:** `[P1][TC-2.1-C-02] Loading state shows skeleton rows (not spinner)`
  - **Status:** RED — skeleton rows (`data-testid="skeleton-row"`) not implemented
  - **Verifies:** AC#1 + company-standards — react-loading-skeleton used

- **Test:** `[P1][TC-2.1-C-03] Search input has aria-label`
  - **Status:** RED — search input not implemented
  - **Verifies:** WCAG 2.1 AA — aria-label on search input

- **Test:** `[P0][TC-2.1-C-04] Typing Nombre filters list (case-insensitive)`
  - **Status:** RED — filter logic not implemented
  - **Verifies:** AC#2 — real-time filter by nombre

- **Test:** `[P0][TC-2.1-C-05] Typing NIT filters list (case-insensitive)`
  - **Status:** RED — filter logic not implemented
  - **Verifies:** AC#2 — real-time filter by NIT

- **Test:** `[P2][TC-2.1-C-06] List updates on each keystroke without debounce`
  - **Status:** RED — no implementation
  - **Verifies:** AC#2 — no debounce, immediate filter

- **Test:** `[P0][TC-2.1-P0-01] Filter over 500-item cache < 200ms (R-003)`
  - **Status:** RED — `useMemo` filter not implemented
  - **Verifies:** AC#2 NFR1 + R-003 — performance threshold

- **Test:** `[P1][TC-2.1-C-07] API returns [] → EmptyState rendered`
  - **Status:** RED — EmptyState not wired into component
  - **Verifies:** AC#3 — empty state displayed

- **Test:** `[P1][TC-2.1-C-08] EmptyState contains guidance message`
  - **Status:** RED — EmptyState content not defined
  - **Verifies:** AC#3 — guidance message for creating first client

- **Test:** `[P1][TC-2.1-C-07b] EmptyState shown → no list items rendered`
  - **Status:** RED — component not implemented
  - **Verifies:** AC#3 — mutual exclusion of empty state and list

- **Test:** `[P1][TC-2.1-C-09] API 500 → ErrorPanel rendered`
  - **Status:** RED — ErrorPanel not integrated
  - **Verifies:** AC#4 — error state displayed on failure

- **Test:** `[P1][TC-2.1-C-10] "Reintentar" button visible and calls refetch`
  - **Status:** RED — retry button not wired
  - **Verifies:** AC#4 — refetch on retry

- **Test:** `[P1][TC-2.1-C-11] No technical error details visible (NFR6)`
  - **Status:** RED — error handling not implemented
  - **Verifies:** AC#4 + NFR6 — friendly error messages only

### Unit Tests (9 tests)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/filterClientes.test.ts`

- **Test:** `[P0][TC-2.1-U-01] Filter matches Nombre (case-insensitive)`
  - **Status:** RED — `filterClientes` pure function not yet extracted
  - **Verifies:** AC#2 — nombre matching

- **Test:** `[P0][TC-2.1-U-01b] Uppercase query matches mixed-case nombre`
  - **Status:** RED — same as above
  - **Verifies:** AC#2 — case-insensitive matching

- **Test:** `[P0][TC-2.1-U-02] Filter matches NIT`
  - **Status:** RED — `filterClientes` not implemented
  - **Verifies:** AC#2 — NIT/RUC matching

- **Test:** `[P0][TC-2.1-U-02b] Full NIT match`
  - **Status:** RED — same as above
  - **Verifies:** AC#2 — exact NIT match

- **Test:** `[P0][TC-2.1-U-03] Empty query returns all clients`
  - **Status:** RED — same as above
  - **Verifies:** AC#2 — empty query shows full list

- **Test:** `[P0][TC-2.1-U-03b] Whitespace-only query treated as empty`
  - **Status:** RED — trim behavior not implemented
  - **Verifies:** AC#2 — trim behavior

- **Test:** `[P1][TC-2.1-U-04] No match returns empty array`
  - **Status:** RED — function not implemented
  - **Verifies:** AC#2 — no-match behavior

- **Test:** `[P2][TC-2.1-U-05] Filter handles hyphens in NIT`
  - **Status:** RED — special character handling not tested
  - **Verifies:** AC#2 edge case — hyphen in NIT does not throw

- **Test:** `[P2][TC-2.1-U-05b] Filter handles slashes in NIT`
  - **Status:** RED — same as above
  - **Verifies:** AC#2 edge case — slash in RUC does not throw

- **Test:** `[P0][TC-2.1-P0-02] 500-item filter completes < 200ms (R-003)`
  - **Status:** RED — function not implemented
  - **Verifies:** AC#2 NFR1 + R-003 — performance threshold

---

## Data Factories Created

### Cliente Factory (E2E)

**File:** `e2e/helpers/data.helper.ts` (existing — no changes needed)

**Exports:**
- `buildCliente(overrides?)` — creates a valid client record for E2E API seeding

### Cliente DTO Factory (Component/Unit Tests)

**Defined inline in test files** (no shared factory file needed for unit scope)

**Pattern:**
```typescript
function buildClienteDto(overrides = {}) {
  const id = _idCounter++;
  return {
    id: `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`,
    nombre: `Empresa Test ${id}`,
    nit: `9${String(id).padStart(8, '0')}-1`,
    telefono: `300${String(id).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
```

---

## Fixtures Created

No new fixture files were created. Existing `e2e/fixtures/base.fixture.ts` is sufficient for E2E tests. The `ApiHelper` from `e2e/helpers/api.helper.ts` is reused for API data setup/teardown.

**Auto-cleanup pattern used in E2E tests:**
```typescript
const created = await api.createCliente(data);
try {
  // test body
} finally {
  await api.deleteCliente(created.id).catch(() => null);
}
```

---

## Mock Requirements

### GET /api/v1/clientes — MSW Handler

**Used in:** Component and unit tests

**Success response (with clients):**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Empresa Test",
    "nit": "900000001-1",
    "telefono": "3000000001",
    "ciudad": "Bogotá",
    "createdAt": "2026-06-21T00:00:00.000Z",
    "updatedAt": "2026-06-21T00:00:00.000Z"
  }
]
```

**Empty response (AC#3 test):**
```json
[]
```

**Error response (AC#4 test):**
```json
{ "error": "Internal Server Error" }
```
Status: `500`

**Notes:**
- MSW v2 syntax: `http.get(url, () => HttpResponse.json(body))`
- Server set to `onUnhandledRequest: 'error'` — all requests must be explicitly handled
- API base URL: `import.meta.env.VITE_API_URL ?? 'http://localhost:5000'`

---

## Required data-testid Attributes

### ClienteListView Component (`frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`)

- `clientes-list-panel` — The 280px fixed-width left panel container
- `search-input` — The search input field (`aria-label` required for WCAG)
- `cliente-list-item` — Each client row in the scrollable list
- `skeleton-row` — Each skeleton row during loading state
- `empty-state` — The EmptyState component container
- `error-panel` — The ErrorPanel component container

### Implementation Example

```tsx
<div data-testid="clientes-list-panel" className="w-[280px] overflow-y-auto">
  <input
    data-testid="search-input"
    aria-label="Buscar por nombre o NIT/RUC"
    placeholder="Buscar por nombre o NIT/RUC…"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  {isLoading && (
    <>
      <div data-testid="skeleton-row"><Skeleton /></div>
      <div data-testid="skeleton-row"><Skeleton /></div>
      <div data-testid="skeleton-row"><Skeleton /></div>
    </>
  )}
  {!isLoading && !isError && filteredClientes.length === 0 && (
    <div data-testid="empty-state">
      <EmptyState message="No hay clientes aún. Crea el primer cliente." />
    </div>
  )}
  {!isLoading && isError && (
    <div data-testid="error-panel">
      <ErrorPanel onRetry={refetch} />
    </div>
  )}
  {!isLoading && !isError && filteredClientes.length > 0 && (
    <ul role="list">
      {filteredClientes.map((c) => (
        <li key={c.id} data-testid="cliente-list-item">
          <ClientListItem nombre={c.nombre} nit={c.nit} />
        </li>
      ))}
    </ul>
  )}
</div>
```

---

## Required New Files (Implementation)

The following files must be created for tests to go GREEN (Task references from story):

| File | Task | Required For |
|------|------|-------------|
| `frontend/src/modules/crm/clientes/domain/Cliente.ts` | Task 3 | All component/unit tests |
| `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` | Task 3 | All component/unit tests |
| `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` | Task 4 | Component tests, MSW mocking |
| `frontend/src/modules/crm/clientes/application/useClientes.ts` | Task 5 | Component tests |
| `frontend/src/modules/crm/clientes/application/filterClientes.ts` | Task 6 (extract) | Unit tests (filterClientes.test.ts) |
| `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` | Task 6 | All component/E2E tests |
| `frontend/src/shared/components/ClientListItem.tsx` | Task 7 | Component tests (nested render) |
| `frontend/src/shared/components/EmptyState.tsx` | Task 7 | AC#3 tests |
| `SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` | Task 2 | API tests |
| `SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` | Task 1 | API tests |
| `SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` | Task 1 | API tests |
| `SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` | Task 1 | API tests |
| `SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` | Task 1 | API tests |
| `SiesaAgents.API/Endpoints/ClienteEndpoints.cs` | Task 1 | API tests |

---

## Implementation Checklist

### Test: TC-2.1-A-01 to TC-2.1-A-07 (API endpoint)

**File:** `e2e/tests/api/2-1-clientes-endpoint.api.spec.ts`

**Tasks:**
- [ ] Create `ClienteEntity.cs` with `DateTimeOffset` timestamps (Task 2)
- [ ] Create `ClienteConfiguration.cs` with `uk_clientes_nit` unique index (Task 2)
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext` (Task 2)
- [ ] Run EF Core migration `AddClientesTable` (Task 2)
- [ ] Create `ClienteDto.cs` with all fields: `Id, Nombre, Nit, Telefono, Ciudad, CreatedAt, UpdatedAt` (Task 1)
- [ ] Create `GetClientesQuery.cs` + `GetClientesQueryHandler.cs` (Task 1)
- [ ] Implement `IClienteRepository.GetAllAsync()` in `ClienteRepository.cs` (Task 1)
- [ ] Register `GET /api/v1/clientes` in `ClienteEndpoints.cs` — returns direct array `200 OK` (Task 1)
- [ ] Verify `ApplySnakeCaseNaming()` is last in `AppDbContext.OnModelCreating` (Task 1)
- [ ] Add `data-testid` attributes: N/A (backend tests)
- [ ] Run tests: `npx playwright test e2e/tests/api/2-1-clientes-endpoint.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: TC-2.1-U-01 to TC-2.1-P0-02 (filter function)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/filterClientes.test.ts`

**Tasks:**
- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface (Task 3)
- [ ] Extract `filterClientes(clientes: Cliente[], query: string): Cliente[]` as a pure function to `frontend/src/modules/crm/clientes/application/filterClientes.ts`
- [ ] Implement: `if (!query.trim()) return clientes; const q = query.toLowerCase(); return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q));`
- [ ] Run tests: `cd frontend && npx vitest run src/modules/crm/clientes/application/__tests__/filterClientes.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-2.1-C-01 to TC-2.1-C-11 (ClienteListView component)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks:**
- [ ] Create `IClienteRepository.ts` with `getAll(): Promise<Cliente[]>` (Task 3)
- [ ] Create `clienteApiRepository.ts` — Axios implementation calling `GET /api/v1/clientes` (Task 4)
- [ ] Create `useClientes.ts` — TanStack Query hook with `queryKey: ['clientes']` (Task 5)
- [ ] Create `EmptyState.tsx` in `src/shared/components/` (Task 7)
- [ ] Create `ClientListItem.tsx` in `src/shared/components/` (Task 7)
- [ ] Create `ClienteListView.tsx` with: search input (`data-testid="search-input"`, `aria-label`), `useMemo` filter, skeleton loading rows (`data-testid="skeleton-row"`), `EmptyState` (`data-testid="empty-state"`), `ErrorPanel` (`data-testid="error-panel"`), list items (`data-testid="cliente-list-item"`) (Task 6)
- [ ] Add `data-testid="clientes-list-panel"` to the outer wrapper with `w-[280px]` (Task 6)
- [ ] Wire `refetch` to the "Reintentar" button in `ErrorPanel` (Task 6)
- [ ] Ensure no stack trace / raw error message is rendered in `ErrorPanel` (Task 6)
- [ ] Run tests: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: TC-2.1-E-01 to TC-2.1-E-08 (E2E acceptance)

**File:** `e2e/tests/clientes/2-1-client-list-search.spec.ts`

**Tasks:**
- [ ] Complete all tasks above (API + component prerequisites)
- [ ] Wire `ClienteListView` into `/clientes` route — replace `ClientesPlaceholder` (Task 8)
- [ ] Run E2E tests: `npx playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour (mostly verification after implementation complete)

---

## Running Tests

```bash
# Run all ATDD tests for Story 2.1
npx playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts
npx playwright test e2e/tests/api/2-1-clientes-endpoint.api.spec.ts
cd frontend && npx vitest run src/modules/crm/clientes

# Run E2E tests only
npx playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts

# Run API contract tests only
npx playwright test e2e/tests/api/2-1-clientes-endpoint.api.spec.ts

# Run component + unit tests only
cd frontend && npx vitest run src/modules/crm/clientes

# Run E2E in headed mode (see browser)
npx playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts --headed

# Run E2E with specific browser
npx playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts --project=chromium

# Debug specific E2E test
npx playwright test e2e/tests/clientes/2-1-client-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (37 total across 4 files)
- ✅ Factories and fixtures documented; auto-cleanup pattern used
- ✅ Mock requirements documented (MSW handlers, route interceptions)
- ✅ data-testid requirements listed (6 attributes)
- ✅ Implementation checklist created with story task mapping

**Verification:**
- Tests fail because `ClienteListView` does not exist (import error in component tests)
- Tests fail because `filterClientes` does not exist (import error in unit tests)
- Tests fail because `GET /api/v1/clientes` endpoint does not exist (connection refused in API tests)
- Tests fail for the right reason: **missing implementation**, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with unit tests** — fastest to go green; implement `filterClientes.ts` pure function
2. **Run unit tests** to confirm `filterClientes.test.ts` → green
3. **Implement backend** (Tasks 1-2): `ClienteEntity`, migration, `GetClientesQuery`, `ClienteEndpoints`
4. **Run API tests** to confirm `2-1-clientes-endpoint.api.spec.ts` → green
5. **Implement frontend** (Tasks 3-8): domain → infrastructure → application → presentation
6. **Run component tests** to confirm `ClienteListView.test.tsx` → green
7. **Run E2E tests** last (require full stack running)
8. **All tests green** → Story 2.1 implementation complete

**Key Principles:**
- One test at a time (start lowest level: unit → component → API → E2E)
- `filterClientes.ts` must be a pure exported function (not inlined in component)
- `data-testid` attributes are mandatory — tests will fail without them
- Use `DateTimeOffset` not `DateTime` for all timestamps (R-007)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify `useMemo` on `filteredClientes` is applied (prevents re-computation)
2. Ensure `ClienteListView` component does not exceed 100 lines (extract sub-components if needed)
3. Verify skeleton count matches visible list item count estimate
4. Confirm all Spanish text is correct: "Buscar por nombre o NIT/RUC…", "No hay clientes aún. Crea el primer cliente.", "Reintentar"

---

## Next Steps

1. **Share this checklist** with the dev workflow
2. **Run failing tests** to confirm RED phase: `cd frontend && npx vitest run src/modules/crm/clientes`
3. **Begin with unit tests** (fastest to implement and verify): `filterClientes.ts`
4. **Work one layer at a time** (unit → component → API → E2E)
5. **When all tests pass**, update story status in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception pattern applied in all E2E tests: `await page.route(...)` before `await page.goto(...)`
- **data-factories.md** — Counter-based factories for deterministic test data; override pattern for specific scenarios
- **component-tdd.md** — MSW v2 server setup with `beforeAll/afterAll/afterEach` lifecycle; `QueryClientProvider` wrapper
- **test-quality.md** — One assertion per test (atomic), explicit `waitFor` instead of hard waits, Given-When-Then structure
- **selector-resilience.md** — `data-testid` selectors for stability; `getByRole` for semantic elements (buttons by name)
- **fixture-architecture.md** — Auto-cleanup with `try/finally` pattern in E2E tests; MSW `server.resetHandlers()` in `afterEach`

---

## Test Execution Evidence

**Expected failures at RED phase:**

1. Component tests fail: `Cannot find module '../ClienteListView'` — file does not exist yet
2. Unit tests fail: `Cannot find module '../filterClientes'` — file does not exist yet
3. API tests fail: connection to `http://localhost:5000/api/v1/clientes` refused (endpoint not implemented)
4. E2E tests fail: `data-testid="clientes-list-panel"` not found (component not wired to route)

**Summary:**
- Total tests: 37
- Passing: 0 (expected in RED phase)
- Failing: 37 (expected)
- Status: ✅ RED phase

---

**Generated by BMad TEA Agent** — 2026-06-21
