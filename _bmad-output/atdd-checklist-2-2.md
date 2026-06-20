# ATDD Checklist — Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-20
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL) + Unit (Vitest renderHook) + Unit (xUnit)

---

## Story Summary

A commercial team member clicks on a client in the left panel to see its full details (Nombre, NIT/RUC, Teléfono, Ciudad) in the right panel. The URL updates to `/clientes/:clienteId` to support deep linking (FR30). If no client is selected, the right panel shows a neutral Spanish placeholder. If the client does not exist (404), a Spanish not-found message is shown. If the backend is unreachable, an ErrorPanel with "Reintentar" appears.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad. **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (deep link), **Then** the correct client details are loaded and displayed from `GET /api/v1/clientes/:id`.

3. **Given** a `clienteId` in the URL does not exist in the backend, **When** the page loads, **Then** a not-found message is displayed in Spanish ("No se encontró este cliente.") without exposing stack traces or raw error messages.

4. **Given** the backend is unavailable when fetching a single client, **When** the `GET /api/v1/clientes/:id` call fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed in the right panel.

5. **Given** the user navigates to `/clientes` (root, no client selected), **When** no client item has been clicked, **Then** the right panel displays a neutral placeholder state with a Spanish instruction ("Selecciona un cliente para ver sus detalles.").

6. **Given** the client detail is visible, **When** the user presses Tab to navigate, **Then** all interactive elements meet WCAG 2.1 AA keyboard accessibility with a visible focus ring (`2px solid #0e79fd`).

---

## Failing Tests Created (RED Phase)

### Component Tests — `ClienteDetailView.test.tsx` (27 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

#### AC5 — Placeholder state when no client is selected (4 tests)

- **Test:** renders the placeholder when clienteId is null
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC5 — placeholder visible when clienteId=null

- **Test:** displays the Spanish placeholder instruction text
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC5 — exact Spanish text "Selecciona un cliente para ver sus detalles."

- **Test:** does NOT call useCliente when clienteId is null
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC5 — query disabled when no clienteId; no loading/error shown

- **Test:** placeholder has role="status" for accessibility
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC6 — placeholder ARIA role

#### Loading state (4 tests)

- **Test:** renders loading skeleton when isLoading=true
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** skeleton visible during API fetch

- **Test:** does NOT render client detail fields during loading
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** no premature field rendering

- **Test:** does NOT render ErrorPanel during loading
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** ErrorPanel not shown during loading

- **Test:** does NOT render placeholder during loading
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** placeholder not shown when clienteId is present

#### AC1 + AC2 — Client detail displays complete client information (8 tests)

- **Test:** renders the detail panel when client data is loaded
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 + AC2 — detail panel container present

- **Test:** displays the client Nombre in the detail view
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 — Nombre field displayed

- **Test:** displays the client NIT/RUC in the detail view
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 — NIT/RUC field displayed

- **Test:** displays the client Telefono in the detail view
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 — Telefono field displayed

- **Test:** displays the client Ciudad in the detail view
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 — Ciudad field displayed

- **Test:** renders all four required fields simultaneously for a loaded client
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 — all fields coexist

- **Test:** does NOT render placeholder when a client is loaded
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 — placeholder not shown with data

- **Test:** renders field label "Nombre" in the detail view
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 — Spanish field label present

- **Test:** renders field label "NIT/RUC" in the detail view
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC1 — Spanish field label present

#### AC3 — Not-found state for non-existent clienteId (4 tests)

- **Test:** renders the not-found message when the API returns 404
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC3 — not-found element visible

- **Test:** displays the exact Spanish not-found text for 404 errors
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC3 — exact text "No se encontró este cliente."

- **Test:** does NOT show the generic ErrorPanel for a 404 response
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC3 — 404 and generic error are handled separately

- **Test:** does NOT expose raw error message or stack trace to the user on 404
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC3 — no technical text visible

#### AC4 — ErrorPanel on backend unavailable (5 tests)

- **Test:** renders ErrorPanel when useCliente returns isError=true (non-404)
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC4 — ErrorPanel rendered for non-404 errors

- **Test:** shows a "Reintentar" button when the fetch fails
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC4 — retry button present

- **Test:** calls refetch when the "Reintentar" button is clicked
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC4 — refetch is triggered on retry

- **Test:** does NOT render client detail fields when an error occurs
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC4 — no fields shown alongside ErrorPanel

- **Test:** does NOT expose raw error.message to the user on fetch failure
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC4 — no technical error text visible

#### AC6 — Keyboard accessibility (4 tests)

- **Test:** placeholder has an accessible role attribute
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC6 — placeholder WCAG ARIA

- **Test:** not-found message has an accessible role for screen readers
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC6 — not-found message ARIA

- **Test:** "Reintentar" button is reachable by Tab key when ErrorPanel is shown
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC6 — ErrorPanel retry button focusable

- **Test:** detail panel is rendered inside a semantically appropriate container
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC6 — accessible container present

---

### Unit Tests — `useCliente.test.ts` (8 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

- **Test:** returns client data when repository resolves with a valid clienteId
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** AC2 — hook returns resolved data

- **Test:** sets isError=true when the repository rejects with a network error
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** AC4 — error state exposed for network failures

- **Test:** sets isError=true when the repository rejects with a 404 error
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** AC3 — 404 exposed as isError (with error.response.status)

- **Test:** exposes a refetch function in its return value
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** AC4 — refetch callable

- **Test:** is DISABLED when id is null
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** AC5 — query disabled when no clienteId

- **Test:** is DISABLED when id is undefined
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** AC5 — query disabled when no clienteId

- **Test:** uses the canonical query key ["clientes", id]
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** Architecture — queryKey: ['clientes', id]

- **Test:** calls clienteApiRepository.getById exactly once per mount with the correct id
  - **Status:** RED — `useCliente.ts` does not exist
  - **Verifies:** AC2 — no duplicate requests; correct id passed

---

### Backend Unit Tests — `GetClienteByIdQueryHandlerTests.cs` (11 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

- **Test:** AC2 — Handle returns ClienteDto when client with given Id exists
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC2 — handler returns ClienteDto for existing client

- **Test:** AC2 — ClienteDto.Id matches the requested Id
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC2 — Id field mapping correct

- **Test:** AC2 — ClienteDto.Nombre matches ClienteEntity.Nombre
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC2 — Nombre field mapping

- **Test:** AC2 — ClienteDto.Nit matches ClienteEntity.Nit
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC2 — Nit field mapping

- **Test:** AC2 — ClienteDto.Telefono matches ClienteEntity.Telefono
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC2 — Telefono field mapping

- **Test:** AC2 — ClienteDto.Ciudad matches ClienteEntity.Ciudad
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC2 — Ciudad field mapping

- **Test:** AC2 — ClienteDto.CreatedAt is DateTimeOffset (never default)
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC2 — DateTimeOffset mandate

- **Test:** AC3 — Handle throws NotFoundException when Id does not exist in repository
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC3 — NotFoundException thrown for missing client

- **Test:** AC3 — NotFoundException message mentions the non-existent clienteId
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC3 — useful error message for Problem Details

- **Test:** AC3 — Handle does NOT return null when client is not found (throws instead)
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC3 — null return bypasses 404 mapping; must throw

- **Test:** AC2 — Handler respects CancellationToken (non-cancelled token does not throw)
  - **Status:** RED — `GetClienteByIdQueryHandler` does not exist
  - **Verifies:** AC2 — async cancellation support

---

## Data Factories Used

### Cliente Factory (reused from Story 2.1)

**File:** `frontend/src/test-support/factories/cliente.factory.ts`

**Used exports:**
- `createCliente(overrides?)` — creates a single ClienteDto with optional field overrides
- `createClientes(count, overrides?)` — creates an array of ClienteDtos (not used in Story 2.2 tests)

No new factory needed — Story 2.2 detail tests use `createCliente()` with specific field overrides.

---

## Fixtures

No Playwright fixtures needed for this story. All tests use Vitest + RTL with mocked hooks (frontend) and in-memory stub repositories (backend). Each test is isolated via `vi.clearAllMocks()` and fresh `QueryClient` instances.

---

## Mock Requirements

### Frontend: useCliente hook mock

**Pattern:** `vi.mock('../application/useCliente')`

**States to stub:**
- `{ data: undefined, isLoading: true, isError: false, error: null, refetch: vi.fn() }` — skeleton phase
- `{ data: undefined, isLoading: false, isError: true, error: { response: { status: 404 } }, refetch: vi.fn() }` — 404 not-found phase
- `{ data: undefined, isLoading: false, isError: true, error: new Error('Network Error'), refetch: vi.fn() }` — generic error phase
- `{ data: ClienteDto, isLoading: false, isError: false, error: null, refetch: vi.fn() }` — success phase

### Frontend: clienteApiRepository.getById mock

**Pattern:** `vi.mock('../infrastructure/clienteApiRepository')` — mocks `getById` method

**Mock scenarios:** resolves with ClienteDto, rejects with Error, rejects with 404 AxiosError

### Backend: IClienteRepository stub (GetByIdAsync)

**Pattern:** `StubClienteRepository` inner class — `GetByIdAsync` returns entity if Id matches, null otherwise
**Note:** The stub reuses the same base stub from `GetClientesQueryHandlerTests.cs` with `GetByIdAsync` implemented

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-panel` — the right panel wrapper when client data is loaded
- `cliente-detail-nombre` — element showing the client's Nombre value
- `cliente-detail-nit` — element showing the client's NIT/RUC value
- `cliente-detail-telefono` — element showing the client's Teléfono value
- `cliente-detail-ciudad` — element showing the client's Ciudad value
- `cliente-detail-loading-skeleton` — skeleton placeholder wrapper during loading
- `cliente-detail-error-panel` — the ErrorPanel component wrapper (non-404 errors)
- `cliente-detail-retry-button` — the "Reintentar" button inside ErrorPanel
- `cliente-detail-not-found` — the not-found message element (404 errors only)
- `cliente-detail-placeholder` — the neutral placeholder when no clienteId is provided

**Implementation Example:**
```tsx
// ClienteDetailView.tsx

// Case 1: No clienteId (placeholder)
if (!clienteId) {
  return (
    <div data-testid="cliente-detail-placeholder" role="status">
      Selecciona un cliente para ver sus detalles.
    </div>
  )
}

// Case 2: Loading
if (isLoading) {
  return <div data-testid="cliente-detail-loading-skeleton">...</div>
}

// Case 3: 404 not found
if (is404) {
  return (
    <p data-testid="cliente-detail-not-found" role="status">
      No se encontró este cliente.
    </p>
  )
}

// Case 4: Generic error
if (isError) {
  return <ErrorPanel data-testid="cliente-detail-error-panel" onRetry={refetch} />
}

// Case 5: Data loaded
return (
  <div data-testid="cliente-detail-panel">
    <div data-testid="cliente-detail-nombre">{data.nombre}</div>
    <div data-testid="cliente-detail-nit">{data.nit}</div>
    <div data-testid="cliente-detail-telefono">{data.telefono}</div>
    <div data-testid="cliente-detail-ciudad">{data.ciudad}</div>
  </div>
)
```

---

## Implementation Checklist

### Test group: Placeholder state (AC5)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - Accepts `clienteId: string | null` prop
  - When `clienteId` is null/undefined: render `<div data-testid="cliente-detail-placeholder" role="status">Selecciona un cliente para ver sus detalles.</div>`
- [ ] Create `frontend/src/shared/components/ClienteDetailPlaceholder.tsx` (can be inline in `ClienteDetailView` initially)
- [ ] Run test: `cd frontend && pnpm run test -- ClienteDetailView`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: Loading skeleton

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - Uses `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id!), enabled: !!id })`
  - Returns `{ data, isLoading, isError, error, refetch }`
- [ ] In `ClienteDetailView`: when `isLoading` render `<div data-testid="cliente-detail-loading-skeleton">...</div>`
- [ ] Import `Skeleton from 'react-loading-skeleton'` for skeleton content
- [ ] Run test: `cd frontend && pnpm run test -- ClienteDetailView`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: Client detail data (AC1, AC2)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Add `getById(id: string): Promise<Cliente>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Implement `getById` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - Calls `GET /api/v1/clientes/:id` via `apiClient`, returns `Promise<Cliente>`
- [ ] In `ClienteDetailView`: render fields inside `<div data-testid="cliente-detail-panel">`
  - `<div data-testid="cliente-detail-nombre">{data.nombre}</div>`
  - `<div data-testid="cliente-detail-nit">{data.nit}</div>`
  - `<div data-testid="cliente-detail-telefono">{data.telefono}</div>`
  - `<div data-testid="cliente-detail-ciudad">{data.ciudad}</div>`
  - Spanish labels: "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
- [ ] Run test: `cd frontend && pnpm run test -- ClienteDetailView`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test group: Not-found state (AC3)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] In `ClienteDetailView`: detect 404 via `(error as AxiosError)?.response?.status === 404`
- [ ] Render `<p data-testid="cliente-detail-not-found" role="status">No se encontró este cliente.</p>` for 404
- [ ] NEVER render `{error?.message}` directly
- [ ] Run test: `cd frontend && pnpm run test -- ClienteDetailView`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test group: ErrorPanel (AC4)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] In `ClienteDetailView`: render `<ErrorPanel data-testid="cliente-detail-error-panel" onRetry={refetch} />` for non-404 errors
- [ ] Verify `ErrorPanel` at `frontend/src/shared/components/ErrorPanel.tsx` passes `data-testid` prop and renders "Reintentar" button
- [ ] Run test: `cd frontend && pnpm run test -- ClienteDetailView`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test group: Keyboard accessibility (AC6)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**
- [ ] Add `role="status"` to placeholder div
- [ ] Add `role="status"` or `role="alert"` to not-found message element
- [ ] Verify focus ring `2px solid #0e79fd` via `:focus-visible` is in `index.css`
- [ ] Ensure "Reintentar" button is the first focusable element in ErrorPanel
- [ ] Run test: `cd frontend && pnpm run test -- ClienteDetailView`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test group: useCliente hook (unit tests)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - `export function useCliente(id: string | null | undefined)`
  - Uses `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id!), enabled: !!id })`
  - Returns `{ data, isLoading, isError, error, refetch }`
- [ ] Implement `getById(id: string): Promise<Cliente>` in `clienteApiRepository.ts`
- [ ] Run test: `cd frontend && pnpm run test -- useCliente`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test group: GetClienteByIdQueryHandler backend unit tests

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

**Tasks to make these tests pass:**
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
  - `public record GetClienteByIdQuery(Guid Id);`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  - Constructor: `(IClienteRepository repository)`
  - `Handle(GetClienteByIdQuery, CancellationToken)` → `GetByIdAsync(query.Id)` → maps to `ClienteDto` or throws `NotFoundException`
- [ ] Create `backend/src/SiesaAgents.Application/Common/Exceptions/NotFoundException.cs` (if not already present)
  - `public class NotFoundException : Exception { public NotFoundException(string message) : base(message) {} }`
- [ ] Add `GetByIdAsync(Guid id, CancellationToken ct = default)` to `IClienteRepository.cs` in Domain layer (if not already present from stub in Story 2.1)
- [ ] Implement `GetByIdAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Register `GET /api/v1/clientes/{id:guid}` endpoint in `ClienteEndpoints.cs`
- [ ] Verify `ExceptionHandlingMiddleware.cs` maps `NotFoundException` → 404 Problem Details
- [ ] Run test: `cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "GetClienteByIdQueryHandlerTests"`
- [ ] Test passes (green phase)

**Estimated Effort:** 2.0 hours

---

## Running Tests

```bash
# Run all failing frontend tests for Story 2.2
cd frontend && pnpm run test -- --reporter=verbose

# Run ClienteDetailView component tests only
cd frontend && pnpm run test -- ClienteDetailView.test.tsx

# Run useCliente hook unit tests only
cd frontend && pnpm run test -- useCliente.test.ts

# Run in watch mode (development)
cd frontend && pnpm run test:watch

# Run backend unit tests for Story 2.2
cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "Clientes" --verbosity normal

# Run backend tests — GetClienteByIdQueryHandler only
cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "GetClienteByIdQueryHandlerTests"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**
- All 46 tests written and failing
- Data factory reused (no new factory needed)
- Hook mock pattern consistent with Story 2.1 style
- Backend stub repository extended with GetByIdAsync
- Mock requirements documented
- Required data-testid attributes listed
- Implementation checklist created

**Verification:**
- Frontend tests fail because `ClienteDetailView.tsx`, `useCliente.ts`, and `clienteApiRepository.getById` do not yet exist
- Backend tests fail because `GetClienteByIdQueryHandler.cs`, `GetClienteByIdQuery.cs`, and `NotFoundException.cs` do not yet exist

---

### GREEN Phase (DEV Team — Next Steps)

**Recommended implementation order:**

1. Backend: `NotFoundException.cs` (if not present) + `GetClienteByIdQuery.cs` + `GetClienteByIdQueryHandler.cs`
2. Backend: Add `GetByIdAsync` to `IClienteRepository` + `ClienteRepository`
3. Backend: Register `GET /api/v1/clientes/{id:guid}` endpoint
4. Backend: Verify `ExceptionHandlingMiddleware` handles `NotFoundException → 404`
5. Frontend domain: Add `getById` to `IClienteRepository.ts`
6. Frontend infrastructure: Implement `getById` in `clienteApiRepository.ts`
7. Frontend application: Create `useCliente.ts` hook
8. Frontend presentation: Create `ClienteDetailView.tsx` with all states
9. Frontend route: Create/verify `clientes.$clienteId.tsx` route file
10. Frontend route: Update `clientes.tsx` for click → navigate and Outlet

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 46 tests pass
2. Check 404 vs generic error discrimination is clean (no magic numbers inline)
3. Extract Spanish text constants if needed (no hardcoded strings in multiple places)
4. Verify `data-testid` attributes are correctly placed and not duplicated
5. Confirm `useCliente` disabled state does not cause hydration flicker

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

- **component-tdd.md** — Red-green-refactor cycle; `vi.mock` for hook isolation; `QueryClientProvider` wrapper
- **network-first.md** — No network calls in component tests; all network mocked at hook level via `vi.mock`
- **test-quality.md** — One assertion per test (atomic); Given-When-Then comments; explicit `waitFor`
- **selector-resilience.md** — `data-testid` selectors throughout; `getByRole` for semantic elements (button)
- **data-factories.md** — Reuse existing `createCliente(overrides?)` factory from Story 2.1
- **fixture-architecture.md** — Test isolation via fresh `QueryClient` per test + `vi.clearAllMocks()` in `beforeEach`

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures:**

Frontend (Vitest):
```
FAIL src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx
  Cannot find module '../presentation/ClienteDetailView' — file does not exist

FAIL src/modules/crm/clientes/application/useCliente.test.ts
  Cannot find module '../application/useCliente' — file does not exist
```

Backend (xUnit):
```
FAIL SiesaAgents.UnitTests.Application.Clientes.GetClienteByIdQueryHandlerTests
  The type or namespace 'GetClienteByIdQueryHandler' could not be found
  The type or namespace 'GetClienteByIdQuery' could not be found
  SiesaAgents.Application.Common.Exceptions.NotFoundException could not be found
```

**Summary:**
- Total tests: 46
- Passing: 0 (expected — RED phase)
- Failing: 46 (expected)
- Status: RED phase verified

---

## Notes

- `clienteApiRepository.getById` must import `apiClient` from `src/shared/lib/apiClient.ts` — do NOT create a new Axios instance
- The `IClienteRepository` stub in `GetClientesQueryHandlerTests.cs` already declares `GetByIdAsync` — no stub conflict
- TanStack Router auto-generates `routeTree.gen.ts` — creating `clientes.$clienteId.tsx` will auto-register the route
- The 404 detection in `ClienteDetailView` uses `(error as AxiosError)?.response?.status === 404` — import `AxiosError` from `'axios'`
- `ErrorPanel` at `frontend/src/shared/components/ErrorPanel.tsx` already exists from Story 2.1 — reuse it; do NOT duplicate
- `react-loading-skeleton` is already installed — reuse the same skeleton pattern from `ClienteListView.tsx`
- `ClienteDetailPlaceholder` can be either a separate shared component or inlined in `ClienteDetailView`; the tests only check for `data-testid="cliente-detail-placeholder"` and `role="status"`
- Backend: `GetByIdAsync` in the `IClienteRepository` stub was already declared in Story 2.1's stub — verify it is also declared in the real `IClienteRepository` interface

---

**Generated by:** BMad TEA Agent — Test Architect Module (sa-tea-atdd)
**Workflow:** `_bmad/bmm/testarch/atdd`
**Version:** 4.0 (BMad v6)
**Date:** 2026-06-20
