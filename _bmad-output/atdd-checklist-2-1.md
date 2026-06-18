# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-18
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW)

---

## Story Summary

Story 2.1 implements the read-only client list at `/clientes`. A 280px fixed left panel
shows all clients fetched via `GET /api/v1/clientes`, with real-time client-side filtering
by Nombre or NIT/RUC. EmptyState and ErrorPanel components handle edge cases.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I am looking for

---

## Acceptance Criteria

1. **AC-1** — GIVEN clients exist, WHEN user navigates to `/clientes`, THEN left panel (280px) shows scrollable list with Nombre and NIT/RUC per item.
2. **AC-2** — GIVEN list is loaded, WHEN user types in search field, THEN list filters in real time showing only matching clients; results appear in under 1s with up to 500 records (NFR1).
3. **AC-3** — GIVEN no clients exist, WHEN user navigates to `/clientes`, THEN `EmptyState` is displayed with a message guiding the user to create the first client.
4. **AC-4** — GIVEN backend unavailable on page load, WHEN GET `/api/v1/clientes` fails, THEN `ErrorPanel` with "Reintentar" button is displayed; clicking it triggers a refetch.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/clientes/cliente-list-search.spec.ts`

- **Test:** List loads at /clientes with real backend data
  - **Status:** RED — `ClienteListView` not implemented; `[data-testid="clientes-list-panel"]` absent
  - **Verifies:** AC-1 — list panel renders and shows client items (P0, R-202)

- **Test:** Real-time search filter by name in E2E
  - **Status:** RED — search input `[aria-label="Buscar clientes"]` absent; filter logic not implemented
  - **Verifies:** AC-2 — typing in search shows only matching client

- **Test:** EmptyState when backend returns [] (intercepted)
  - **Status:** RED — `[data-testid="empty-state"]` absent
  - **Verifies:** AC-3 — EmptyState displayed with Spanish message

- **Test:** ErrorPanel when backend returns 500 (intercepted)
  - **Status:** RED — `[data-testid="error-panel"]` absent; "Reintentar" button absent
  - **Verifies:** AC-4 — ErrorPanel shown on network failure

### API Integration Tests (3 tests)

**File:** `e2e/tests/api/cliente-list.api.spec.ts`

- **Test:** GET /api/v1/clientes returns 200 with ClienteDto[]
  - **Status:** RED — endpoint `GET /api/v1/clientes` not implemented; 404 or 500 expected
  - **Verifies:** AC-1 — happy path with items (P0)

- **Test:** GET /api/v1/clientes returns 200 with [] when DB is empty
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC-3 edge case — empty array returned, not null/404 (P0)

- **Test:** Response is a direct array (no wrapper object)
  - **Status:** RED — endpoint not implemented; also validates API contract shape
  - **Verifies:** API contract: `ClienteDto[]` direct array, no `data`/`items` wrapper

### Component Tests (6 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

- **Test:** Renders list of clients with Nombre visible (AC-1, P0)
  - **Status:** RED — `ClienteListView` module does not exist; import fails
  - **Verifies:** AC-1 — all client names appear in the DOM after MSW response

- **Test:** Renders list of clients with NIT/RUC visible (AC-1, P0)
  - **Status:** RED — component not implemented
  - **Verifies:** AC-1 — NIT shown alongside Nombre in each list item

- **Test:** Search filter by Nombre (AC-2, P1)
  - **Status:** RED — search input and filter logic absent
  - **Verifies:** AC-2 — typing "Beta" shows only Beta Ltda

- **Test:** Search filter by NIT/RUC (AC-2, P1)
  - **Status:** RED — search input absent
  - **Verifies:** AC-2 — typing NIT value filters to matching client only

- **Test:** EmptyState when API returns [] (AC-3, P1)
  - **Status:** RED — `EmptyState` component absent; `data-testid="empty-state"` absent
  - **Verifies:** AC-3 — EmptyState with "No hay clientes registrados" message

- **Test:** ErrorPanel on MSW 500 (AC-4, P1, R-209)
  - **Status:** RED — `ErrorPanel` component absent; `data-testid="error-panel"` absent
  - **Verifies:** AC-4 — ErrorPanel with "Reintentar" button renders on fetch failure

- **Test:** Clicking "Reintentar" triggers refetch (AC-4, P1)
  - **Status:** RED — retry mechanism not wired to `refetch` from `useClientes`
  - **Verifies:** AC-4 — second API call made after clicking retry; data recovered

### Unit / Performance Tests (3 tests)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.perf.test.ts`

- **Test:** 500-item filter completes in < 50ms (AC-2, NFR1, P0, R-205)
  - **Status:** RED — `filterClientes` function does not exist; import fails
  - **Verifies:** NFR1 — filter latency well under 1s budget for 500 records

- **Test:** Empty query returns all 500 items
  - **Status:** RED — function not implemented
  - **Verifies:** empty search = no filtering applied

- **Test:** Non-matching query returns empty array
  - **Status:** RED — function not implemented
  - **Verifies:** filter returns `[]` for zero-match queries

---

## Data Factories Created

### Cliente Factory

**File:** `frontend/src/test/factories/cliente.factory.ts`

**Exports:**
- `clienteFactory(overrides?)` — Create a single `ClienteDto` with optional field overrides; auto-increments all IDs for uniqueness
- `clienteListFactory(count)` — Create array of `count` `ClienteDto` objects; used for NFR1 performance test with `count=500`

**Example Usage:**

```typescript
const cliente = clienteFactory({ nombre: 'Acme Corp', nit: '900111222' });
const bigList = clienteListFactory(500);
```

---

## Fixtures / MSW Handlers Created

### Clientes MSW Handlers

**File:** `frontend/src/test/mocks/handlers/clientes.handlers.ts`

**Handlers:**
- `getClientesSuccess` — Default handler returning 2 clients (happy path)
- `getClientesEmpty` — Returns `[]` (EmptyState scenario)
- `getClientesError` — Returns HTTP 500 (ErrorPanel scenario)
- `getClientesList500` — Returns 500 items (NFR1 performance scenario)

### MSW Node Server

**File:** `frontend/src/test/mocks/server.ts`

**Setup:**
```typescript
import { server } from '../../../test/mocks/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Auto-cleanup:** `server.resetHandlers()` in `afterEach` restores default handlers after each test.

---

## Mock Requirements

### GET /api/v1/clientes

**Endpoint:** `GET /api/v1/clientes`

**Success Response:**
```json
[
  {
    "id": "uuid",
    "nombre": "string",
    "nit": "string",
    "telefono": "string",
    "ciudad": "string",
    "createdAt": "2026-03-12T10:30:00Z"
  }
]
```

**Error Response:**
```json
{ "title": "Internal Server Error", "status": 500 }
```

**Notes:** Response MUST be a direct array — no wrapper object. The MSW handler fulfills the
Axios-based `apiClient.get<Cliente[]>('/api/v1/clientes')` call used in `clienteApiRepository.ts`.

---

## Required data-testid Attributes

### ClienteListView (left panel)

- `clientes-list-panel` — the 280px scrollable left panel container
- `cliente-list-item` — each individual client row in the list
- `empty-state` — EmptyState component root element
- `error-panel` — ErrorPanel component root element

### Search Input

- ARIA label `"Buscar clientes"` on the `<input>` (WCAG 2.1 AA) — used in tests as `getByRole('searchbox', { name: /buscar clientes/i })`

### ErrorPanel

- `error-panel` — root wrapper
- Button with accessible name `"Reintentar"` — triggers `onRetry` prop

**Implementation Example:**

```tsx
<div data-testid="clientes-list-panel" className="w-[280px] overflow-y-auto">
  <input
    type="search"
    aria-label="Buscar clientes"
    placeholder="Buscar por nombre o NIT/RUC..."
    data-testid="search-input"
  />
  {filtered.map(c => (
    <div key={c.id} data-testid="cliente-list-item">
      <span>{c.nombre}</span>
      <span>{c.nit}</span>
    </div>
  ))}
</div>

<div data-testid="empty-state">
  <p>No hay clientes registrados. Crea el primero.</p>
</div>

<div data-testid="error-panel">
  <p>No se pudo cargar la lista. Intenta de nuevo.</p>
  <button onClick={onRetry}>Reintentar</button>
</div>
```

---

## Exported Functions Expected by Tests

The unit/performance tests import a `filterClientes` pure function. This must be exported from:

**File:** `frontend/src/modules/crm/clientes/application/filterClientes.ts`

```typescript
import type { Cliente } from '../domain/Cliente';

export function filterClientes(clients: Cliente[], query: string): Cliente[] {
  if (!query) return clients;
  const q = query.toLowerCase();
  return clients.filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.nit.toLowerCase().includes(q),
  );
}
```

---

## Implementation Checklist

### Test: ClienteListView renders list (C-01, P0)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — interface `{ id, nombre, nit, telefono, ciudad, createdAt }`
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — `{ getAll(): Promise<Cliente[]> }`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — calls `apiClient.get<Cliente[]>('/api/v1/clientes')`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook, queryKey `['clientes']`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — renders 280px left panel
- [ ] Add `data-testid="clientes-list-panel"` to panel wrapper
- [ ] Add `data-testid="cliente-list-item"` to each list item
- [ ] Run test: `pnpm --filter frontend test`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: Search filter (C-02, P1)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Add `searchQuery` state with `useState<string>('')` in `ClienteListView`
- [ ] Render `<input type="search" aria-label="Buscar clientes" />` at top of panel
- [ ] Export `filterClientes` pure function to `application/filterClientes.ts`
- [ ] Apply filter with `useMemo` in `ClienteListView`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: EmptyState (C-03, P1)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` — check `siesa-ui-kit` first for equivalent
- [ ] Add `data-testid="empty-state"` to EmptyState root
- [ ] Display text: "No hay clientes registrados. Crea el primero."
- [ ] Wire `EmptyState` in `ClienteListView` when `data.length === 0`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: ErrorPanel + retry (C-04, P1, R-209)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — check `siesa-ui-kit` first for equivalent
- [ ] Add `data-testid="error-panel"` to ErrorPanel root
- [ ] Display text: "No se pudo cargar la lista. Intenta de nuevo."
- [ ] Add button with text "Reintentar" that calls `onRetry` prop
- [ ] Wire `ErrorPanel` in `ClienteListView` when `isError === true`; pass `refetch` as `onRetry`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: filterClientes performance < 50ms (U-01, P0, NFR1)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.perf.test.ts`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/filterClientes.ts` — pure function exported as `filterClientes(clients, query)`
- [ ] Implement filter: `clients.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
- [ ] Run test: `pnpm --filter frontend test`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: GET /api/v1/clientes API tests (API-01, API-02, P0)

**File:** `e2e/tests/api/cliente-list.api.spec.ts`

**Tasks to make these tests pass:**
- [ ] Create `ClienteEntity.cs` in `SiesaAgents.Domain/Clientes/Entities/`
- [ ] Create `IClienteRepository.cs` in `SiesaAgents.Domain/Clientes/Interfaces/`
- [ ] Create `ClienteDto.cs` in `SiesaAgents.Application/Clientes/DTOs/`
- [ ] Create `GetClientesQueryHandler.cs` in `SiesaAgents.Application/Clientes/Queries/`
- [ ] Create `ClienteRepository.cs` in `SiesaAgents.Infrastructure/Repositories/`
- [ ] Create `ClienteConfiguration.cs` with `uk_clientes_nit` unique index
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Create EF Core migration `AddClientesTable`
- [ ] Map `GET /api/v1/clientes` in `ClienteEndpoints.cs` — returns `ClienteDto[]` direct array
- [ ] Register DI in `Program.cs`
- [ ] Run API tests: `npx playwright test e2e/tests/api/cliente-list.api.spec.ts`
- [ ] Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: E2E list loads at /clientes (E-01, P0)

**File:** `e2e/tests/clientes/cliente-list-search.spec.ts`

**Tasks to make this test pass:**
- [ ] All backend tasks above complete (API endpoint running)
- [ ] All frontend tasks above complete (ClienteListView rendering)
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — TanStack Router file-based route
- [ ] Confirm `_app.tsx` layout route wraps child routes
- [ ] Run E2E: `npx playwright test e2e/tests/clientes/cliente-list-search.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours (setup), balance from above

---

## Running Tests

```bash
# Run all component + unit tests for this story
pnpm --filter frontend test

# Run component tests only (watch mode)
pnpm --filter frontend test:watch

# Run specific component test file
pnpm --filter frontend test frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx

# Run performance unit test
pnpm --filter frontend test frontend/src/modules/crm/clientes/application/__tests__/useClientes.perf.test.ts

# Run API integration tests (requires backend running at localhost:5000)
npx playwright test e2e/tests/api/cliente-list.api.spec.ts

# Run E2E tests (requires full stack: frontend at :5173, backend at :5000)
npx playwright test e2e/tests/clientes/cliente-list-search.spec.ts

# Run E2E in headed mode
npx playwright test e2e/tests/clientes/cliente-list-search.spec.ts --headed

# Debug E2E
npx playwright test e2e/tests/clientes/cliente-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**
- All tests written and failing (import errors = RED for component/unit)
- Factories and MSW handlers created with auto-cleanup
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**
- Component/unit tests: fail with `Cannot find module '../ClienteListView'` and `Cannot find module '../filterClientes'`
- API tests: fail with connection refused (backend not implemented)
- E2E tests: fail — list panel absent from DOM

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from checklist (start with `filterClientes.ts` — fastest win)
2. Read the test to understand expected behavior
3. Implement minimal code to make that test pass
4. Run test to verify green
5. Move to next test — recommended order:
   - `filterClientes.ts` → unit test green
   - `clienteApiRepository.ts` + `useClientes.ts` → hook available
   - `EmptyState.tsx` + `ErrorPanel.tsx` → shared components
   - `ClienteListView.tsx` → component tests green
   - Backend endpoint → API tests green
   - Route wiring → E2E tests green

**Key Principles:**
- One test at a time
- Minimal implementation
- Run tests frequently

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass
2. Review component for readability
3. Extract any duplicated JSX
4. Ensure `useMemo` is correctly memoized
5. Run tests after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm --filter frontend test`
3. Begin implementation using checklist above as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to `in-progress` → `done`

---

## Knowledge Base References Applied

- **network-first.md** — All E2E route intercepts set up BEFORE `page.goto()` (prevents race conditions)
- **data-factories.md** — `clienteFactory()` / `clienteListFactory(n)` pattern with auto-incrementing IDs
- **component-tdd.md** — Component tests use `QueryClientProvider` wrapper; `retry: false` for deterministic behavior
- **test-quality.md** — One assertion per test; explicit `waitFor`; no arbitrary sleeps
- **selector-resilience.md** — `data-testid` selectors used throughout; ARIA role selectors for interactive elements
- **test-levels-framework.md** — E2E for critical journey; API for contract; Component for UI edge cases; Unit for pure logic

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification — Expected Failures)

**Command:** `pnpm --filter frontend test`

**Expected failure messages:**

- `ClienteListView.test.tsx` → `Cannot find module '../ClienteListView'` (module not yet created)
- `useClientes.perf.test.ts` → `Cannot find module '../filterClientes'` (function not yet created)

**Command:** `npx playwright test e2e/tests/api/cliente-list.api.spec.ts`

**Expected failure:** `Error: connect ECONNREFUSED 127.0.0.1:5000` (backend not implemented)

**Command:** `npx playwright test e2e/tests/clientes/cliente-list-search.spec.ts`

**Expected failure:** `Error: Timeout waiting for [data-testid="clientes-list-panel"]` (component not rendered)

**Summary:**
- Total tests: 16 (4 E2E + 3 API + 6 Component + 3 Unit)
- Passing: 0 (expected in RED phase)
- Failing: 16 (expected)
- Status: RED phase — all failures due to missing implementation, not test bugs

---

## Notes

- The `filterClientes` pure function is extracted from `ClienteListView` to enable isolated unit/performance testing without React rendering overhead. The component test also indirectly validates this function through the rendered output.
- MSW v2 syntax used (`http.get`, `HttpResponse.json`) — ensure `msw@^2.x` is installed (confirmed in `package.json`: `"msw": "^2.14.6"`).
- `@testing-library/user-event` v14 is used for `userEvent.type()` — it automatically handles `await`; no manual flush needed.
- The `searchbox` role is available on `<input type="search">` — the `aria-label="Buscar clientes"` attribute must be present on the input for `getByRole('searchbox', { name: /buscar clientes/i })` to work.
- Backend note from Story 1.1 dev notes: environment runs .NET 8 (not .NET 10) — use .NET 8-compatible NuGet packages.

---

**Generated by BMad TEA Agent** — 2026-06-18
