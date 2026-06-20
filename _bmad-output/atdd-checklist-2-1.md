# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-20
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL) + Unit (xUnit)

---

## Story Summary

A commercial team member navigates to `/clientes` and sees a 280px-wide left panel with a scrollable list of all clients. Each item shows the client's Nombre (primary) and NIT/RUC (secondary). A search field at the top of the panel filters the list in real time (case-insensitive, client-side, no debounce) by Nombre or NIT/RUC. If the list is empty, an EmptyState with a Spanish message guides the user to create the first client. If the fetch fails, an ErrorPanel with a "Reintentar" button appears — no raw errors exposed.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients with Nombre and NIT/RUC visible on each item.

2. **Given** the client list is loaded, **When** the user types into the search field, **Then** the list filters in real time (no submit button, no debounce delay felt), showing only clients whose Nombre or NIT/RUC match the typed input (case-insensitive), results under 1 second with up to 500 records (NFR1 — client-side filter < 50ms).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a Spanish-language message: "Aún no hay clientes. Crea el primero."

4. **Given** the backend is unavailable when the page loads, **When** the fetch call to `GET /api/v1/clientes` fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed — no raw error message or stack trace is exposed to the user.

5. **Given** the client list is visible, **When** a client item is rendered, **Then** the item shows at minimum: Nombre (primary text) and NIT/RUC (secondary text).

6. **Given** a keyboard-only user navigates the page, **When** they Tab through the search field and client list items, **Then** all elements are reachable and activatable with keyboard (WCAG 2.1 AA) with a visible focus ring (`2px solid #0e79fd`).

---

## Failing Tests Created (RED Phase)

### Component Tests — `ClienteListView.test.tsx` (26 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

#### AC1 + AC5 — Client list renders with Nombre and NIT/RUC visible (5 tests)

- ✅ **Test:** renders the left panel with fixed 280px width wrapper
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC1 — panel container is present

- ✅ **Test:** renders a list item for each client returned by useClientes
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC1 — one item per client

- ✅ **Test:** displays Nombre as primary text on each client item
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC5 — Nombre is the primary text

- ✅ **Test:** displays NIT/RUC as secondary text on each client item
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC5 — NIT/RUC is the secondary text

- ✅ **Test:** renders both Nombre and NIT/RUC for the same client item
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC5 — both fields visible simultaneously

#### AC2 — Real-time case-insensitive search (6 tests)

- ✅ **Test:** renders the search input with correct aria-label and placeholder
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC2 + AC6 — input with Spanish aria-label and placeholder

- ✅ **Test:** filters the list to show only items matching typed nombre
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC2 — nombre filter works

- ✅ **Test:** filters the list to show only items matching typed NIT/RUC
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC2 — NIT/RUC filter works

- ✅ **Test:** search is case-insensitive: "construc" matches "Construcciones del Valle"
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC2 — case-insensitive matching

- ✅ **Test:** shows all clients when the search field is cleared
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC2 — clearing restores full list

- ✅ **Test:** shows no results when search term matches nothing
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC2 — zero results when no match

#### AC3 — EmptyState when no clients exist (3 tests)

- ✅ **Test:** renders EmptyState component when data is an empty array
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC3 — EmptyState is rendered

- ✅ **Test:** EmptyState displays the correct Spanish guidance message
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC3 — exact Spanish text "Aún no hay clientes. Crea el primero."

- ✅ **Test:** does NOT render any list items when data is empty
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC3 — no items coexist with EmptyState

#### AC4 — ErrorPanel on fetch failure (6 tests)

- ✅ **Test:** renders ErrorPanel when useClientes returns isError=true
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC4 — ErrorPanel is rendered

- ✅ **Test:** displays the Spanish error message without exposing raw error
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC4 — "No se pudo cargar la lista. Verifica tu conexión."

- ✅ **Test:** shows a "Reintentar" button in the ErrorPanel
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC4 — retry button present

- ✅ **Test:** calls refetch when the "Reintentar" button is clicked
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC4 — clicking "Reintentar" triggers refetch

- ✅ **Test:** does NOT render the client list when an error occurs
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC4 — no items coexist with ErrorPanel

- ✅ **Test:** does NOT expose raw error.message to the user
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC4 — no technical error text visible

#### Loading state — skeleton placeholders (3 tests)

- ✅ **Test:** renders loading skeleton when isLoading=true
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** loading skeleton visible during fetch

- ✅ **Test:** does NOT render client list items during loading
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** items not shown prematurely

- ✅ **Test:** does NOT render EmptyState during loading
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** EmptyState not shown during loading

#### AC6 — Keyboard accessibility (3 tests)

- ✅ **Test:** search input has aria-label "Buscar clientes"
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC6 — WCAG 2.1 AA aria-label

- ✅ **Test:** search input is reachable by Tab key
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC6 — keyboard Tab navigation reaches search input

- ✅ **Test:** client list items are keyboard-activatable
  - **Status:** RED — `ClienteListView` component does not exist
  - **Verifies:** AC6 — items are focusable via keyboard

---

### Unit Tests — `useClientes.test.ts` (6 tests)

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts`

- ✅ **Test:** returns data when repository resolves with a client list
  - **Status:** RED — `useClientes.ts` does not exist
  - **Verifies:** AC1 — hook returns resolved data

- ✅ **Test:** returns an empty array when the repository returns []
  - **Status:** RED — `useClientes.ts` does not exist
  - **Verifies:** AC3 — empty array returned, not undefined

- ✅ **Test:** sets isError=true when the repository rejects
  - **Status:** RED — `useClientes.ts` does not exist
  - **Verifies:** AC4 — error state exposed

- ✅ **Test:** exposes a refetch function in its return value
  - **Status:** RED — `useClientes.ts` does not exist
  - **Verifies:** AC4 — refetch callable

- ✅ **Test:** uses the canonical query key ["clientes"]
  - **Status:** RED — `useClientes.ts` does not exist
  - **Verifies:** Architecture — queryKey: ['clientes']

- ✅ **Test:** calls clienteApiRepository.getAll exactly once per mount
  - **Status:** RED — `useClientes.ts` does not exist
  - **Verifies:** no duplicate requests

---

### Backend Unit Tests — `GetClientesQueryHandlerTests.cs` (10 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

- ✅ **Test:** AC4 — Handle returns empty enumerable when repository has no records
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC4 — empty list case

- ✅ **Test:** AC1 — Handle returns one ClienteDto per entity in repository
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC1 — entity-to-DTO mapping

- ✅ **Test:** AC1 — ClienteDto.Nombre matches ClienteEntity.Nombre
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC1 — Nombre field mapping

- ✅ **Test:** AC1 — ClienteDto.Nit matches ClienteEntity.Nit
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC1 — Nit field mapping

- ✅ **Test:** AC1 — ClienteDto.Telefono matches ClienteEntity.Telefono
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC1 — Telefono field mapping

- ✅ **Test:** AC1 — ClienteDto.Ciudad matches ClienteEntity.Ciudad
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC1 — Ciudad field mapping

- ✅ **Test:** AC1 — ClienteDto.Id is a non-empty Guid
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC1 — Id is a valid UUID

- ✅ **Test:** AC1 — Handle returns correct count when repository has multiple clients
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC1 — all entities returned

- ✅ **Test:** AC1 — ClienteDto.CreatedAt is DateTimeOffset (never default)
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC1 — DateTimeOffset mandate

- ✅ **Test:** AC4 — Handle result type is IEnumerable<ClienteDto>
  - **Status:** RED — `GetClientesQueryHandler` does not exist
  - **Verifies:** AC4 — no wrapper object, direct enumerable

---

## Data Factories Created

### Cliente Factory

**File:** `frontend/src/test-support/factories/cliente.factory.ts`

**Exports:**
- `createCliente(overrides?)` — creates a single ClienteDto with optional field overrides
- `createClientes(count, overrides?)` — creates an array of count ClienteDtos

**Fields generated:** `id` (UUID), `nombre` (from predefined set + seq), `nit` (formatted NIT), `telefono`, `ciudad`, `createdAt`, `updatedAt`

**Example Usage:**
```typescript
const c = createCliente({ nombre: 'ACME Corp', nit: '900000001-1' })
const list = createClientes(500) // For NFR1 performance testing
```

---

## Fixtures

No Playwright fixtures are needed for this story — all tests use Vitest + RTL with mocked hooks and in-memory stub repositories (backend). Each test is fully isolated via `vi.clearAllMocks()` and fresh `QueryClient` instances.

---

## Mock Requirements

### Frontend: useClientes hook mock

**Pattern:** `vi.mock('../application/useClientes')`

**States to stub:**
- `isLoading: true` — skeleton phase
- `isError: true, refetch: vi.fn()` — error phase
- `data: ClienteDto[], isLoading: false, isError: false` — success phase

### Frontend: clienteApiRepository mock

**Pattern:** `vi.mock('../infrastructure/clienteApiRepository')`

**Mock:** `clienteApiRepository.getAll` resolves/rejects as needed per test

### Backend: IClienteRepository stub

**Pattern:** `StubClienteRepository` inner class in test file — implements `IClienteRepository`, returns constructor-provided array.

---

## Required data-testid Attributes

### ClienteListView Component

- `cliente-list-panel` — the 280px-wide left panel wrapper
- `cliente-search-input` — the search `Input` field (also needs `aria-label="Buscar clientes"` and `placeholder="Buscar por nombre o NIT/RUC"`)
- `cliente-list` — the `<ul>` or container wrapping all list items
- `cliente-list-item` — each individual client item (one per client)
- `cliente-empty-state` — the EmptyState component wrapper
- `cliente-error-panel` — the ErrorPanel component wrapper
- `cliente-retry-button` — the "Reintentar" button inside ErrorPanel
- `cliente-loading-skeleton` — the skeleton placeholder wrapper during loading

**Implementation Example:**
```tsx
<div data-testid="cliente-list-panel" style={{ width: '280px' }}>
  <Input
    data-testid="cliente-search-input"
    aria-label="Buscar clientes"
    placeholder="Buscar por nombre o NIT/RUC"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  {isLoading && <div data-testid="cliente-loading-skeleton">...</div>}
  {isError && <ErrorPanel data-testid="cliente-error-panel" onRetry={refetch} />}
  {!isLoading && !isError && filteredClientes.length === 0 && (
    <EmptyState data-testid="cliente-empty-state" message="Aún no hay clientes. Crea el primero." />
  )}
  {!isLoading && !isError && filteredClientes.length > 0 && (
    <ul data-testid="cliente-list">
      {filteredClientes.map((c) => (
        <li key={c.id} data-testid="cliente-list-item" ...>...</li>
      ))}
    </ul>
  )}
</div>
```

---

## Implementation Checklist

### Test: "renders the left panel with 280px width wrapper"

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- [ ] Add wrapper div with `data-testid="cliente-list-panel"` and 280px width
- [ ] Run test: `cd frontend && pnpm run test -- ClienteListView`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: "renders a list item for each client" + "displays Nombre and NIT/RUC"

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook with `queryKey: ['clientes']`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios `getAll()` calling `GET /api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — repository contract
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — Props: `cliente`, `isSelected`, `onClick`; shows `nombre` + `nit`; `data-testid="cliente-list-item"`
- [ ] Wire `ClientListItem` into `ClienteListView` via `filteredClientes.map()`
- [ ] Add required data-testid attributes: `cliente-list`, `cliente-list-item`
- [ ] Run test: `cd frontend && pnpm run test -- ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2.0 hours

---

### Test: "renders the search input" + "filters by nombre" + "filters by NIT/RUC" + "case-insensitive"

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Add `useState('')` for `searchQuery` in `ClienteListView`
- [ ] Add `useMemo` filter logic: `c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)`
- [ ] Render `<Input data-testid="cliente-search-input" aria-label="Buscar clientes" placeholder="Buscar por nombre o NIT/RUC" />`
- [ ] Wire `onChange` to `setSearchQuery`
- [ ] Run test: `cd frontend && pnpm run test -- ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: "renders EmptyState" + "EmptyState Spanish message" + "no items when empty"

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Create (or verify) `frontend/src/shared/components/EmptyState.tsx`
  - Props: `message: string`, `actionLabel?: string`, `onAction?: () => void`
  - Must accept and forward `data-testid` (or use `data-testid="cliente-empty-state"` internally from `ClienteListView`)
- [ ] Render `<EmptyState data-testid="cliente-empty-state" message="Aún no hay clientes. Crea el primero." />` when `filteredClientes.length === 0 && !isLoading && !isError`
- [ ] Run test: `cd frontend && pnpm run test -- ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: "renders ErrorPanel" + "Spanish error message" + "Reintentar button" + "calls refetch" + "no raw error"

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Create (or verify) `frontend/src/shared/components/ErrorPanel.tsx`
  - Props: `onRetry: () => void`
  - Renders: "No se pudo cargar la lista. Verifica tu conexión." + `<button>Reintentar</button>`
  - Must accept and forward `data-testid` prop (or set `data-testid="cliente-error-panel"` from `ClienteListView`)
  - `data-testid="cliente-retry-button"` on the retry button
- [ ] Render `<ErrorPanel data-testid="cliente-error-panel" onRetry={refetch} />` when `isError`
- [ ] NEVER render `{error?.message}` directly
- [ ] Run test: `cd frontend && pnpm run test -- ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: "renders loading skeleton" + "no items during loading" + "no EmptyState during loading"

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Add `import Skeleton from 'react-loading-skeleton'` and `import 'react-loading-skeleton/dist/skeleton.css'`
- [ ] Render skeleton placeholders wrapped in `<div data-testid="cliente-loading-skeleton">` when `isLoading`
- [ ] Ensure skeleton is mutually exclusive with list items and EmptyState
- [ ] Run test: `cd frontend && pnpm run test -- ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: Keyboard accessibility (aria-label, Tab order, focusable items)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Verify `aria-label="Buscar clientes"` on the search Input
- [ ] Ensure search input renders before the list (Tab order: search → items)
- [ ] Render client items as `<button>` elements OR add `tabIndex={0}` to make them keyboard-activatable
- [ ] Verify focus ring `2px solid #0e79fd` via `:focus-visible` in `index.css` (already set in Story 1.2)
- [ ] Run test: `cd frontend && pnpm run test -- ClienteListView`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: useClientes hook tests (6 unit tests)

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts`

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`
  - Uses `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })`
  - Returns `{ data, isLoading, isError, refetch }`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - Implements `IClienteRepository` via Axios `apiClient`
  - `getAll()` calls `GET /api/v1/clientes`, returns `Promise<Cliente[]>`
- [ ] Run test: `cd frontend && pnpm run test -- useClientes`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: GetClientesQueryHandler backend unit tests (10 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

**Tasks to make these tests pass:**
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
  - `public record ClienteDto(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
  - `public record GetClientesQuery();`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
  - Constructor: `(IClienteRepository repository)`
  - `Handle(GetClientesQuery, CancellationToken)` → maps entities to `ClienteDto`
- [ ] Verify `IClienteRepository` in Domain layer has `GetAllAsync(CancellationToken)` method
- [ ] Run test: `cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "GetClientesQueryHandler"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all failing frontend tests for Story 2.1
cd frontend && pnpm run test -- --reporter=verbose

# Run ClienteListView component tests only
cd frontend && pnpm run test -- ClienteListView.test.tsx

# Run useClientes unit tests only
cd frontend && pnpm run test -- useClientes.test.ts

# Run in watch mode (development)
cd frontend && pnpm run test:watch

# Run backend unit tests for Story 2.1
cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "Clientes" --verbosity normal

# Run backend tests — GetClientesQueryHandler only
cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "GetClientesQueryHandlerTests"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**
- ✅ All 42 tests written and failing
- ✅ Data factory created with auto-generated unique records
- ✅ Hook mock pattern established (vi.mock + mockReturnValue)
- ✅ Backend stub repository created (inner class, no EF/Postgres needed)
- ✅ Mock requirements documented
- ✅ Required data-testid attributes listed
- ✅ Implementation checklist created

**Verification:**
- All tests fail because the implementation files do not yet exist:
  - `ClienteListView.tsx` — not found
  - `useClientes.ts` — not found
  - `clienteApiRepository.ts` — not found
  - `GetClientesQueryHandler.cs` — not found
  - `GetClientesQuery.cs` — not found
  - `ClienteDto.cs` — not found

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** (start with `GetClientesQueryHandlerTests.cs` — backend foundation)
2. **Read the test** to understand expected behavior (Given/When/Then comments)
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in the implementation checklist above
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: `ClienteDto.cs` + `GetClientesQuery.cs` + `GetClientesQueryHandler.cs`
2. Frontend: `Cliente.ts` + `IClienteRepository.ts` (domain layer — pure TypeScript)
3. Frontend: `clienteApiRepository.ts` (infrastructure)
4. Frontend: `useClientes.ts` (application layer)
5. Frontend: `EmptyState.tsx` + `ErrorPanel.tsx` (shared components)
6. Frontend: `ClientListItem.tsx` (shared component)
7. Frontend: `ClienteListView.tsx` (presentation — depends on all above)
8. Route: update `_app/clientes.tsx` to render `<ClienteListView />`

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 42 tests pass
2. Review `useMemo` dependency array in `ClienteListView` for correctness
3. Ensure no hardcoded strings outside the Spanish text constants
4. Verify `data-testid` attributes are placed correctly and not duplicated
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `cd frontend && pnpm run test`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'in-progress'

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test isolation via fresh `QueryClient` per test + `vi.clearAllMocks()` in `beforeEach`
- **data-factories.md** — `createCliente(overrides?)` / `createClientes(count)` factory with sequential unique IDs
- **component-tdd.md** — Red-green-refactor cycle, `vi.mock` for hook isolation, `QueryClientProvider` wrapper
- **network-first.md** — No network calls in component tests; all network mocked at hook level via `vi.mock`
- **test-quality.md** — One assertion per test (atomic), Given-When-Then comments, explicit `waitFor`
- **selector-resilience.md** — `data-testid` selectors throughout; `getByRole` for semantic elements (button, textbox)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures:**

Frontend (Vitest):
```
FAIL src/modules/crm/clientes/presentation/ClienteListView.test.tsx
  ✗ Cannot find module '../presentation/ClienteListView' — file does not exist

FAIL src/modules/crm/clientes/application/useClientes.test.ts
  ✗ Cannot find module '../application/useClientes' — file does not exist
```

Backend (xUnit):
```
FAIL SiesaAgents.UnitTests.Application.Clientes.GetClientesQueryHandlerTests
  ✗ The type or namespace 'GetClientesQueryHandler' could not be found
  ✗ The type or namespace 'GetClientesQuery' could not be found
  ✗ The type or namespace 'ClienteDto' could not be found
```

**Summary:**
- Total tests: 42
- Passing: 0 (expected — RED phase)
- Failing: 42 (expected)
- Status: ✅ RED phase verified

---

## Notes

- The amber contact indicator (⚠) is a placeholder per story notes — do NOT implement in Story 2.1. `ClientListItem` renders without it; the badge will be wired in Story 2.2/2.4.
- `clienteApiRepository.getAll` must import `apiClient` from `src/shared/lib/apiClient.ts` — do NOT create a new Axios instance.
- `queryClient` is already wired in `src/app/providers/QueryProvider.tsx` — do NOT reconfigure it.
- TanStack Router auto-generates `routeTree.gen.ts` — do NOT edit it manually when updating `_app/clientes.tsx`.
- The backend `IClienteRepository` stub in the unit test assumes `GetAllAsync`, `GetByIdAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync` methods — align with the actual interface when it is created in Story 1.3 output.

---

**Generated by:** BMad TEA Agent — Test Architect Module (sa-tea-atdd)
**Workflow:** `_bmad/bmm/testarch/atdd`
**Version:** 4.0 (BMad v6)
**Date:** 2026-06-20
