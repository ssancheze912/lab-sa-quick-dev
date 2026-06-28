# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + API Integration (xUnit)

---

## Story Summary

The commercial team needs a left panel (280px) at `/clientes` showing all clients with real-time
client-side search by Nombre or NIT/RUC. The view must handle empty and error states gracefully,
and default to sorting by most recent client first.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients, with each item displaying `Nombre` and `NIT/RUC` visible.

2. **Given** the client list is loaded, **When** the user types any text in the search field, **Then** the list filters in real time (client-side, no API call) showing only clients whose `Nombre` or `NIT/RUC` match the input, and results appear in under 1 second for up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client, and no list items are rendered.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails (any HTTP error or network error), **Then** an `ErrorPanel` component is displayed with a "Reintentar" button instead of the list, and clicking "Reintentar" triggers a new fetch.

5. **Given** the client list is loaded, **When** no search text is entered, **Then** all clients are shown in the default sort order (most recent first, i.e., `createdAt` descending).

---

## Failing Tests Created (RED Phase)

### API Integration Tests (3 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/GetClientesApiTests.cs`

- **Test:** `GetClientes_WhenDatabaseEmpty_Returns200WithEmptyArray`
  - **Status:** RED — `clientes` table does not exist yet; endpoint not implemented
  - **Verifies:** TC-E2-2-1-API-1 (P0) — GET /api/v1/clientes returns 200 + empty JSON array
  - **AC:** #1, #3

- **Test:** `GetClientes_WithSeededCliente_Returns200WithClienteInArray`
  - **Status:** RED — POST /api/v1/clientes endpoint not implemented; ClienteEntity not created
  - **Verifies:** TC-E2-2-1-API-2 (P0) — GET /api/v1/clientes with seeded client returns array with item
  - **AC:** #1, #5

- **Test:** `ClientesTable_WhenMigrationApplied_HasUkClientesNitUniqueIndex`
  - **Status:** RED — `clientes` table migration not created; `uk_clientes_nit` index absent
  - **Verifies:** TC-E2-2-1-API-3 (P3) — `uk_clientes_nit` unique index exists in PostgreSQL
  - **AC:** N/A (data integrity prerequisite for Story 2.3)

### Component Tests (9 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteListView.test.tsx`

- **Test:** `should show only matching items when user types "Acme" in search field`
  - **Status:** RED — `ClienteListView` component does not exist yet
  - **Verifies:** TC-E2-2-1-CMP-1 (P1) — Search "Acme" filters to matching items only
  - **AC:** #2

- **Test:** `should filter by NIT when user searches a partial NIT string`
  - **Status:** RED — `ClienteListView` component does not exist yet
  - **Verifies:** AC #2 — NIT search filtering

- **Test:** `should show all items when search field is cleared`
  - **Status:** RED — `ClienteListView` component does not exist yet
  - **Verifies:** AC #2 — search reset behavior

- **Test:** `should show EmptyState component and no list items when data is empty`
  - **Status:** RED — `EmptyState` component does not exist yet
  - **Verifies:** TC-E2-2-1-CMP-2 (P1) — Empty data shows EmptyState
  - **AC:** #3

- **Test:** `should show ErrorPanel with "Reintentar" button when fetch returns 500`
  - **Status:** RED — `ErrorPanel` component does not exist yet
  - **Verifies:** TC-E2-2-1-CMP-3 (P1) — MSW 500 shows ErrorPanel + Reintentar
  - **AC:** #4

- **Test:** `should show ErrorPanel when network request fails completely`
  - **Status:** RED — `ErrorPanel` component does not exist yet
  - **Verifies:** AC #4 — network failure error state

- **Test:** `should trigger a new GET request when "Reintentar" button is clicked`
  - **Status:** RED — `ErrorPanel.onRetry` not implemented
  - **Verifies:** TC-E2-2-1-CMP-4 (P1) — Click Reintentar triggers new GET
  - **AC:** #4

- **Test:** `should filter 500 records in ≤150ms when user types in search field`
  - **Status:** RED — `ClienteListView` useMemo filter not implemented
  - **Verifies:** TC-E2-2-1-CMP-5 (P2) — NFR1: ≤150ms for 500 records
  - **AC:** #2 (NFR1)

- **Test:** `should display clientes ordered by createdAt descending by default`
  - **Status:** RED — `ClienteListView` default sort not implemented
  - **Verifies:** AC #5 — most recent first default sort

### Unit Tests (7 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts`

- **Test:** `should sort clientes A→Z by nombre when option is nombre-asc`
  - **Status:** RED — `sortClientes` utility does not exist at `frontend/src/shared/lib/sortClientes.ts`
  - **Verifies:** TC-E2-2-1-UNIT-1 (P2) — nombre-asc sort

- **Test:** `should sort clientes Z→A by nombre when option is nombre-desc`
  - **Status:** RED — `sortClientes` utility not implemented
  - **Verifies:** TC-E2-2-1-UNIT-2 (P2) — nombre-desc sort

- **Test:** `should sort clientes newest first when option is fecha-desc`
  - **Status:** RED — `sortClientes` utility not implemented
  - **Verifies:** TC-E2-2-1-UNIT-3 (P2) — fecha-desc sort

- **Test:** `should sort clientes oldest first when option is fecha-asc`
  - **Status:** RED — `sortClientes` utility not implemented
  - **Verifies:** TC-E2-2-1-UNIT-4 (P2) — fecha-asc sort

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteSchema.test.ts`

- **Test:** `should reject a payload with empty NIT`
  - **Status:** RED — `clienteSchema` does not exist at `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
  - **Verifies:** TC-E2-2-1-UNIT-5 (P2) — clienteSchema rejects empty NIT

- **Test:** `should reject a payload with empty Nombre`
  - **Status:** RED — `clienteSchema` not implemented
  - **Verifies:** TC-E2-2-1-UNIT-6 (P2) — clienteSchema rejects empty Nombre

- **Test:** `should accept a valid NIT format "900123456-1"`
  - **Status:** RED — `clienteSchema` not implemented
  - **Verifies:** TC-E2-2-1-UNIT-7 (P2) — clienteSchema accepts valid NIT

### E2E Tests (6 tests)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

- **Test:** `should render left panel with client list when navigating to /clientes`
  - **Status:** RED — `/clientes` route renders `ClientesPlaceholder`, not `ClienteListView`
  - **Verifies:** TC-E2-2-1-E2E-1 (P0) — Left panel with client list visible
  - **AC:** #1

- **Test:** `should display Nombre and NIT/RUC for each client item`
  - **Status:** RED — `ClienteListItem` not implemented, `data-testid="cliente-list-item"` absent
  - **Verifies:** AC #1 — item content

- **Test:** `should filter client list in real time (NFR1 ≤1s)`
  - **Status:** RED — `ClienteListView` search not implemented
  - **Verifies:** TC-E2-2-1-E2E-2 (P1) — Real-time search ≤1s
  - **AC:** #2

- **Test:** `should show EmptyState when there are no clients in the system`
  - **Status:** RED — `EmptyState` not implemented
  - **Verifies:** TC-E2-2-1-E2E-3 (P1) — Empty state message
  - **AC:** #3

- **Test:** `should show ErrorPanel with "Reintentar" button when backend returns 500`
  - **Status:** RED — `ErrorPanel` not implemented
  - **Verifies:** TC-E2-2-1-E2E-4 (P1) — Error panel visible
  - **AC:** #4

- **Test:** `should trigger a new fetch when "Reintentar" is clicked after an error`
  - **Status:** RED — retry handler not wired
  - **Verifies:** AC #4 — retry behavior

- **Test:** `should display all clients in default sort order (most recent first)`
  - **Status:** RED — default sort not implemented
  - **Verifies:** AC #5 — fecha-desc default

---

## Data Factories Created

### Cliente Factory

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts`

**Exports:**

- `buildCliente(overrides?)` — Build a single Cliente object with optional field overrides
- `buildClientes(count, overridesFn?)` — Build an array of N clients
- `resetClienteCounter()` — Reset internal counter for deterministic IDs in beforeEach

**Usage:**

```typescript
import { buildCliente, buildClientes, resetClienteCounter } from './clienteFactory';

beforeEach(() => resetClienteCounter());

const c = buildCliente({ nombre: 'Acme S.A.' });
const list = buildClientes(500);
```

---

## Fixtures Created

The E2E tests use `ApiHelper` (already present at `e2e/helpers/api.helper.ts`) for data setup/teardown.
Component tests use isolated `QueryClient` instances per test (no shared state).

**No new fixture files needed** — existing `e2e/fixtures/base.fixture.ts` and `ApiHelper` are sufficient.

---

## Mock Requirements

### GET /api/v1/clientes

**Endpoint:** `GET http://localhost:5000/api/v1/clientes`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "nombre": "Acme S.A.",
    "nit": "900123456-1",
    "telefono": "3001234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-06-01T00:00:00Z",
    "updatedAt": "2026-06-01T00:00:00Z"
  }
]
```

**Empty Response (200):**
```json
[]
```

**Error Response (500):**
```json
{ "type": "...", "title": "Internal Server Error", "status": 500 }
```

**Notes:**
- MSW 2.x `http.get` handler registered via `setupServer()` (Node)
- Handlers reset between tests via `server.resetHandlers()` in `afterEach`
- Network-first pattern: MSW handler registered BEFORE component render

---

## Required data-testid Attributes

### ClienteListView (frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx)

- `clientes-list-panel` — Outer left panel container (280px)
- `cliente-list-item` — Each client row in the list (multiple)

### ClienteListItem (frontend/src/shared/components/ClienteListItem.tsx)

- `cliente-list-item` — The clickable row item

### EmptyState (frontend/src/shared/components/EmptyState.tsx)

- `empty-state` — The empty state container

### ErrorPanel (frontend/src/shared/components/ErrorPanel.tsx)

- `error-panel` — The error container
- Button `name=/reintentar/i` — Retry button (matched by ARIA role + name)

**Implementation Example:**

```tsx
// ClienteListView.tsx
<div data-testid="clientes-list-panel" className="w-[280px] overflow-y-auto">
  <h1>Clientes</h1>
  <input placeholder="Buscar por nombre o NIT/RUC..." />
  {filteredClientes.map(c => (
    <ClienteListItem key={c.id} cliente={c} />
  ))}
</div>

// ClienteListItem.tsx
<div data-testid="cliente-list-item" role="button" tabIndex={0}>
  <span className="font-bold">{cliente.nombre}</span>
  <span className="text-muted-foreground">{cliente.nit}</span>
</div>

// EmptyState.tsx
<div data-testid="empty-state">...</div>

// ErrorPanel.tsx
<div data-testid="error-panel">
  <button onClick={onRetry}>Reintentar</button>
</div>
```

---

## Implementation Checklist

### Test: GetClientes_WhenDatabaseEmpty_Returns200WithEmptyArray (API-1, P0)

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/GetClientesApiTests.cs`

**Tasks to make this test pass:**

- [ ] Create `ClienteEntity` at `src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Create `IClienteRepository` at `src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `ClienteConfiguration` at `src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs` (keep `ApplySnakeCaseNaming()` LAST)
- [ ] Create `ClienteRepository` at `src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Create `ClienteDto` at `src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `ClienteEndpoints` at `src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with `GET /api/v1/clientes`
- [ ] Register `ClienteEndpoints` and `ClienteRepository` in `Program.cs`
- [ ] Run EF Core migration: `dotnet ef migrations add AddClienteEntity ...`
- [ ] Run test: `dotnet test --filter "GetClientes_WhenDatabaseEmpty_Returns200WithEmptyArray"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: GetClientes_WithSeededCliente_Returns200WithClienteInArray (API-2, P0)

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/GetClientesApiTests.cs`

**Tasks to make this test pass:**

- [ ] All tasks from API-1 above (prerequisite)
- [ ] Implement `POST /api/v1/clientes` endpoint (needed for seeding in this test)
- [ ] Run test: `dotnet test --filter "GetClientes_WithSeededCliente_Returns200WithClienteInArray"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (after API-1)

---

### Test: ClientesTable_WhenMigrationApplied_HasUkClientesNitUniqueIndex (API-3, P3)

**Tasks to make this test pass:**

- [ ] Confirm `ClienteConfiguration.cs` has `HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`
- [ ] Re-run migration if needed
- [ ] Run test: `dotnet test --filter "ClientesTable_WhenMigrationApplied_HasUkClientesNitUniqueIndex"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: ClienteListView component tests (CMP-1 through CMP-5, P1/P2)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteListView.test.tsx`

**Tasks to make ALL component tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` (TypeScript interface)
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` (TanStack Query hook, queryKey: `['clientes']`)
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` (add `data-testid="empty-state"`)
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` (add `data-testid="error-panel"`, button "Reintentar")
- [ ] Create `frontend/src/shared/components/ClienteListItem.tsx` (add `data-testid="cliente-list-item"`)
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
  - `data-testid="clientes-list-panel"` on outer container
  - `w-[280px]` fixed width, `overflow-y-auto` scroll
  - `useState<string>` for `searchQuery`
  - `useMemo` filter over `data` by nombre and nit (case-insensitive)
  - Default sort `fecha-desc` (most recent first)
  - Search placeholder: `"Buscar por nombre o NIT/RUC..."`
  - Heading: `"Clientes"` (Spanish)
  - `isLoading` → skeleton (react-loading-skeleton, 5 items)
  - `isError` → `<ErrorPanel onRetry={refetch} />`
  - `data.length === 0 && !isLoading && !isError` → `<EmptyState />`
- [ ] Configure vitest in `frontend/vite.config.ts` with `test: { environment: 'jsdom', setupFiles: ['./src/setupTests.ts'] }`
- [ ] Create `frontend/src/setupTests.ts` with `import '@testing-library/jest-dom'`
- [ ] Run tests: `cd frontend && pnpm vitest run src/modules/crm/clientes/__tests__/ClienteListView.test.tsx`
- [ ] ✅ All component tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Tests: sortClientes unit tests (UNIT-1 to UNIT-4, P2)

**File:** `frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/lib/sortClientes.ts` with `SortOption` type and `sortClientes` function
- [ ] Run tests: `cd frontend && pnpm vitest run src/modules/crm/clientes/__tests__/sortClientes.test.ts`
- [ ] ✅ All 4 sort unit tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: clienteSchema unit tests (UNIT-5 to UNIT-7, P2)

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteSchema.test.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` with Zod schema
- [ ] Run tests: `cd frontend && pnpm vitest run src/modules/crm/clientes/__tests__/clienteSchema.test.ts`
- [ ] ✅ All 3 schema unit tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### E2E Tests: clientes-list-search.spec.ts (E2E-1 to E2E-4 + extras)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

**Tasks to make E2E tests pass:**

- [ ] All backend tasks above (API endpoint + migration)
- [ ] All frontend tasks above (ClienteListView + shared components)
- [ ] Update `frontend/src/routes/_app/clientes.tsx` to render `<ClienteListView />` instead of `<ClientesPlaceholder />`
- [ ] Ensure `data-testid="clientes-list-panel"`, `data-testid="cliente-list-item"`, `data-testid="empty-state"`, `data-testid="error-panel"` are in place
- [ ] Run E2E tests: `pnpm playwright test e2e/tests/clientes/clientes-list-search.spec.ts`
- [ ] ✅ All E2E tests pass (green phase)

**Estimated Effort:** 1 hour (after all component + API tasks)

---

## Running Tests

```bash
# Run API integration tests (backend)
cd /home/user/lab-sa-quick-dev
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~Clientes"

# Run unit tests only (frontend)
cd frontend && pnpm vitest run src/modules/crm/clientes/__tests__/sortClientes.test.ts
cd frontend && pnpm vitest run src/modules/crm/clientes/__tests__/clienteSchema.test.ts

# Run component tests (frontend)
cd frontend && pnpm vitest run src/modules/crm/clientes/__tests__/ClienteListView.test.tsx

# Run all frontend tests for this story
cd frontend && pnpm vitest run src/modules/crm/clientes/__tests__/

# Run E2E tests for this story
pnpm playwright test e2e/tests/clientes/clientes-list-search.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm playwright test e2e/tests/clientes/clientes-list-search.spec.ts --headed

# Debug specific E2E test
pnpm playwright test e2e/tests/clientes/clientes-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- `clienteFactory.ts` created with `buildCliente`, `buildClientes`, `resetClienteCounter`
- MSW server setup in component tests (network-first pattern)
- E2E route intercepts registered BEFORE navigation
- `data-testid` requirements documented
- Implementation checklist created

**Expected Failure Messages (RED Phase):**

| Test File | Expected Error |
|-----------|---------------|
| `GetClientesApiTests.cs` | `System.Net.Http.HttpRequestException` — endpoint 404 |
| `ClienteListView.test.tsx` | `Cannot find module '../presentation/ClienteListView'` |
| `sortClientes.test.ts` | `Cannot find module '../../../../shared/lib/sortClientes'` |
| `clienteSchema.test.ts` | `Cannot find module '../application/clienteSchema'` |
| `clientes-list-search.spec.ts` | `data-testid="clientes-list-panel"` not found |

---

### GREEN Phase (DEV Team - Next Steps)

1. **Pick first test:** Start with `GetClientes_WhenDatabaseEmpty_Returns200WithEmptyArray` (P0)
2. **Implement minimal code:** Follow implementation checklist above
3. **Run test:** `dotnet test --filter "GetClientes_WhenDatabaseEmpty_Returns200WithEmptyArray"`
4. **Verify GREEN**
5. **Move to next test:** `ClienteListView.test.tsx` component tests
6. **Repeat** until all 25 tests pass

**Priority Order:**

1. API-1, API-2 (P0) — backend endpoint + migration
2. CMP-2, CMP-3, CMP-4 (P1) — EmptyState + ErrorPanel + retry
3. CMP-1 (P1) — search filter
4. E2E-1 through E2E-4 (P0/P1) — end-to-end journeys
5. UNIT-1 through UNIT-7 (P2) — sortClientes + clienteSchema
6. CMP-5 (P2) — performance NFR1
7. API-3 (P3) — UK constraint

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

- Extract reusable test utils to `e2e/helpers/`
- Consider extracting MSW handlers to `frontend/src/__tests__/msw/handlers.ts`
- Verify `useMemo` wraps filter (not inline JSX computation)
- Confirm `react-loading-skeleton` for loading state (not spinner)
- Confirm all UI text is in Spanish

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: see commands above
3. Begin implementation starting with P0 tasks (API endpoint + migration)
4. Work one test at a time (red → green for each)
5. Mark story as IN PROGRESS in sprint-status when starting

---

## Knowledge Base References Applied

- **network-first.md** — Route interception registered BEFORE navigation/render
- **data-factories.md** — `buildCliente` / `buildClientes` factory with override support
- **component-tdd.md** — Isolated QueryClient per test, MSW server setup/teardown
- **test-quality.md** — Given-When-Then structure, one assertion per test, auto-cleanup
- **selector-resilience.md** — `data-testid` selectors over CSS/text selectors
- **test-levels-framework.md** — P0 API tests + P1 component tests + P2 unit tests

---

## Test Execution Evidence

**Status:** All tests are in RED phase (not yet executed — implementation does not exist).

**Summary:**

- Total tests: 25
- Passing: 0 (expected — RED phase)
- Failing: 25 (expected — RED phase)
- Status: RED phase confirmed by missing implementation files

**Files that DO NOT EXIST yet (will cause import failures):**

- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClienteListItem.tsx`
- `frontend/src/shared/lib/sortClientes.ts`
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`

---

**Generated by BMad TEA Agent — 2026-06-28**
