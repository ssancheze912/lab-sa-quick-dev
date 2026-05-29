# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-29
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW)

---

## Story Summary

Story 2.1 implements the left-panel list view of the split-panel client management section. Users can navigate to `/clientes` to see all clients in a 280px-wide scrollable panel, search in real time by Nombre or NIT/RUC, and receive appropriate feedback when the backend is unavailable or no clients exist.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1:** Given clients exist, When user navigates to `/clientes`, Then the left panel (280px) shows a scrollable list with Nombre and NIT/RUC visible per item.

2. **AC2:** Given the client list is loaded, When the user types in the search field, Then the list filters in real time (case-insensitive) showing only clients whose Nombre or NIT/RUC match, And results appear in under 1 second with up to 500 records (NFR1).

3. **AC3:** Given no clients exist, When user navigates to `/clientes`, Then an `EmptyState` component is displayed with a Spanish guidance message, And no empty list element is rendered.

4. **AC4:** Given backend is unavailable on page load, When fetch fails, Then an `ErrorPanel` with "Reintentar" button is displayed, And clicking "Reintentar" calls the query `refetch` function.

5. **AC5:** Given desktop viewport (>= 1024px), When user views the page, Then the left panel has fixed width of 280px (`w-[280px]`).

---

## Failing Tests Created (RED Phase)

### E2E Tests (12 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

- **Test:** debe mostrar la lista de clientes con Nombre y NIT/RUC visibles
  - **Status:** RED — `ClienteListView` component not implemented; `data-testid="clientes-list-panel"` does not exist
  - **Verifies:** AC1 — list panel renders after clients are loaded

- **Test:** debe mostrar el nombre del primer cliente en la lista
  - **Status:** RED — `data-testid="cliente-list-item"` not implemented
  - **Verifies:** AC1 — Nombre is visible per list item

- **Test:** debe mostrar el NIT/RUC del cliente en cada item de la lista
  - **Status:** RED — `ClientListItem` component not implemented
  - **Verifies:** AC1 — NIT is visible per list item

- **Test:** debe mostrar la lista desplazable con múltiples clientes
  - **Status:** RED — list rendering not implemented
  - **Verifies:** AC1 — all clients are rendered

- **Test:** debe filtrar la lista por nombre en tiempo real
  - **Status:** RED — search input `data-testid="clientes-search-input"` not implemented
  - **Verifies:** AC2 — search filters by nombre

- **Test:** debe filtrar la lista por NIT/RUC en tiempo real
  - **Status:** RED — client-side filter (useMemo) not implemented
  - **Verifies:** AC2 — search filters by NIT

- **Test:** debe realizar búsqueda sin distinción de mayúsculas
  - **Status:** RED — case-insensitive filter not implemented
  - **Verifies:** AC2 — case-insensitive matching

- **Test:** debe tener campo de búsqueda con placeholder en español
  - **Status:** RED — search input with Spanish placeholder not implemented
  - **Verifies:** AC2 — Spanish placeholder "Buscar por nombre o NIT/RUC..."

- **Test:** debe mostrar EmptyState cuando el sistema no tiene clientes
  - **Status:** RED — `EmptyState` component not wired
  - **Verifies:** AC3 — EmptyState shown for empty response

- **Test:** no debe renderizar lista vacía cuando no hay clientes
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — no empty list element rendered

- **Test:** debe mostrar ErrorPanel cuando el backend no está disponible
  - **Status:** RED — `ErrorPanel` component not wired
  - **Verifies:** AC4 — ErrorPanel on 500 error

- **Test:** debe llamar refetch al hacer clic en "Reintentar"
  - **Status:** RED — ErrorPanel with Reintentar not implemented
  - **Verifies:** AC4 — Reintentar triggers refetch

- **Test:** el panel izquierdo debe tener clase CSS w-[280px] en viewport de escritorio
  - **Status:** RED — `w-[280px]` class not applied
  - **Verifies:** AC5 — fixed 280px width class

### API Tests (9 tests)

**File:** `e2e/tests/api/clientes-list.api.spec.ts`

- **Test:** debe responder con HTTP 200
  - **Status:** RED — `GET /api/v1/clientes` endpoint not implemented
  - **Verifies:** AC1 — endpoint exists and returns 200

- **Test:** debe retornar Content-Type application/json
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — JSON content type

- **Test:** debe retornar un arreglo JSON
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC1 — direct array response (no wrapper)

- **Test:** cada cliente debe tener el campo "nombre"
  - **Status:** RED — `ClienteDto` not serialized
  - **Verifies:** AC1 — nombre field in response

- **Test:** cada cliente debe tener el campo "nit"
  - **Status:** RED — `ClienteDto` not serialized
  - **Verifies:** AC1 — nit field in response

- **Test:** cada cliente debe tener los campos del contrato completo
  - **Status:** RED — contract shape not verified
  - **Verifies:** AC1 — full contract: id, nombre, nit, telefono, ciudad, createdAt, updatedAt

- **Test:** createdAt y updatedAt deben ser ISO 8601 con timezone
  - **Status:** RED — `DateTimeOffset` serialization not verified
  - **Verifies:** AC1 — ISO 8601 with timezone (DateTimeOffset)

- **Test:** debe responder en menos de 2 segundos
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — performance support for NFR1

- **Test:** el response no debe estar envuelto en un objeto con propiedad "data"
  - **Status:** RED — response shape not verified
  - **Verifies:** AC1 — direct array contract

### Component Tests (21 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`
**File:** `frontend/src/modules/crm/clientes/application/hooks/useClientes.test.ts`

#### ClienteListView.test.tsx (14 tests)

- **TC-E2-P3-01 — AC1:** debe renderizar el panel de lista de clientes
  - **Status:** RED — `ClienteListView` does not exist
  - **Verifies:** AC1 — panel container renders

- **TC-E2-P3-01 — AC1:** debe mostrar el nombre de cada cliente
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — nombre rendered per item

- **TC-E2-P3-01 — AC1:** debe mostrar el NIT/RUC de cada cliente
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — NIT rendered per item

- **TC-E2-P1-01 — AC2:** debe filtrar por nombre en tiempo real
  - **Status:** RED — search state and useMemo filter not implemented
  - **Verifies:** AC2 — real-time name filter

- **TC-E2-P1-01 — AC2:** debe filtrar por NIT/RUC en tiempo real
  - **Status:** RED — useMemo filter not implemented
  - **Verifies:** AC2 — real-time NIT filter

- **TC-E2-P1-01 — AC2:** búsqueda insensible a mayúsculas
  - **Status:** RED — toLowerCase() filter not implemented
  - **Verifies:** AC2 — case-insensitive search

- **TC-E2-P1-02 — AC2:** debe filtrar 500 registros en < 1 segundo
  - **Status:** RED — component not implemented
  - **Verifies:** AC2 + NFR1 — performance

- **TC-E2-P1-03 — AC3:** debe mostrar EmptyState cuando API retorna []
  - **Status:** RED — EmptyState component not rendered
  - **Verifies:** AC3 — EmptyState for empty list

- **TC-E2-P1-03 — AC3:** no debe renderizar lista vacía
  - **Status:** RED — empty list element not suppressed
  - **Verifies:** AC3 — no empty list element

- **TC-E2-P1-03 — AC3:** EmptyState visible cuando filtro no tiene coincidencias
  - **Status:** RED — filtered empty state not handled
  - **Verifies:** AC3 — EmptyState for zero filtered results

- **TC-E2-P1-04 — AC4:** debe mostrar ErrorPanel cuando fetch falla con 500
  - **Status:** RED — ErrorPanel not rendered on error
  - **Verifies:** AC4 — ErrorPanel on fetch failure

- **TC-E2-P1-04 — AC4:** ErrorPanel debe mostrar botón "Reintentar"
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — Reintentar button present

- **TC-E2-P1-04 — AC4:** clic en "Reintentar" debe llamar refetch
  - **Status:** RED — refetch not wired to button
  - **Verifies:** AC4 — Reintentar triggers query refetch

- **TC-E2-P3-02 — AC5:** panel debe tener clase w-[280px]
  - **Status:** RED — w-[280px] class not applied
  - **Verifies:** AC5 — 280px fixed width CSS class

#### useClientes.test.ts (7 tests)

- **Test:** debe retornar lista de clientes cuando fetch tiene éxito
  - **Status:** RED — `useClientes` hook does not exist
  - **Verifies:** hook returns data from GET /api/v1/clientes

- **Test:** debe retornar data con campos del contrato Cliente
  - **Status:** RED — hook not implemented
  - **Verifies:** hook returns typed Cliente objects

- **Test:** debe exponer isLoading como true durante el fetch
  - **Status:** RED — hook not implemented
  - **Verifies:** hook exposes isLoading state

- **Test:** debe exponer isError cuando backend retorna 500
  - **Status:** RED — hook not implemented
  - **Verifies:** hook exposes isError state

- **Test:** debe exponer la función refetch
  - **Status:** RED — hook not implemented
  - **Verifies:** hook exposes refetch function

- **Test:** llamar refetch debe volver a ejecutar la consulta
  - **Status:** RED — refetch not callable
  - **Verifies:** refetch triggers new API call

- **Test:** debe almacenar datos con queryKey ["clientes"]
  - **Status:** RED — canonical queryKey not used
  - **Verifies:** TanStack Query canonical key ['clientes']

---

## Data Factories Created

### Cliente Factory (Frontend)

**File:** `frontend/src/test/factories/cliente.factory.ts`

**Exports:**
- `createCliente(overrides?)` — creates a single Client with optional overrides
- `createClientes(count, overrides?)` — creates an array of n Clients
- `createKnownCliente(nombre, nit)` — creates a Client with known predictable values for search tests

**Example Usage:**
```typescript
const cliente = createCliente({ nombre: 'Empresa Filtro Especial', nit: '900123456' });
const clientes = createClientes(500); // 500 records for perf test (TC-E2-P1-02)
```

### Cliente Factory (E2E)

**File:** `tests/support/factories/cliente.factory.ts` (pre-existing, reused)

---

## Fixtures Created

### Base E2E Fixture

**File:** `e2e/fixtures/base.fixture.ts` (pre-existing, reused)

**Fixtures:**
- `clientesPage` — navigates to `/clientes` before the test starts
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** page ready at /clientes
  - **Cleanup:** none (no data mutation)

---

## Mock Requirements

### GET /api/v1/clientes — Client List API

**Endpoint:** `GET /api/v1/clientes`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "nombre": "Empresa Alpha SAS",
    "nit": "900111222",
    "telefono": "+57 300 1234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
```

**Empty Success Response (200):**
```json
[]
```

**Failure Response (500):**
```json
{ "error": "Internal Server Error" }
```

**Notes:**
- Response is a direct array — NO wrapper object (`{ data: [...] }` is incorrect)
- Field names are camelCase (NIT → `nit`, not `NIT`)
- `createdAt` / `updatedAt` must include timezone (`DateTimeOffset` serialized as ISO 8601)
- Component tests use MSW 2+ (`http.get`, `HttpResponse.json`)
- E2E tests use `page.route('**/api/v1/clientes', ...)` (network-first, intercept BEFORE `goto`)

---

## Required data-testid Attributes

### ClienteListView Component (`/clientes` route)

- `clientes-list-panel` — outer container div of the 280px left panel
- `clientes-search-input` — search input field (placeholder: "Buscar por nombre o NIT/RUC...")
- `cliente-list-item` — individual client row in the list (used for querying count and content)
- `clientes-loading-skeleton` — loading skeleton shown during fetch (react-loading-skeleton)
- `empty-state` — EmptyState component container (shown when list is empty)
- `error-panel` — ErrorPanel component container (shown on fetch failure)

**Implementation Example:**
```tsx
<div data-testid="clientes-list-panel" className="w-[280px] overflow-y-auto h-full">
  <input data-testid="clientes-search-input" placeholder="Buscar por nombre o NIT/RUC..." />
  {isLoading && <div data-testid="clientes-loading-skeleton">...</div>}
  {isError && <div data-testid="error-panel"><button>Reintentar</button></div>}
  {!isError && filtered.length === 0 && <div data-testid="empty-state">...</div>}
  {filtered.map(c => <div data-testid="cliente-list-item" key={c.id}>...</div>)}
</div>
```

---

## Implementation Checklist

### Test: useClientes hook

**File:** `frontend/src/modules/crm/clientes/application/hooks/useClientes.test.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/domain/entities/Cliente.ts` — TypeScript interface with all 7 fields
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/repositories/clienteApiRepository.ts` — Axios `GET /api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/application/hooks/useClientes.ts` — `useQuery({ queryKey: ['clientes'], ... })`
- [ ] Export `{ data, isLoading, isError, refetch }` from the hook
- [ ] Set `staleTime: 0` and `retry: 1`
- [ ] Run test: `pnpm run test -- useClientes.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: ClienteListView — renders panel and list items (TC-E2-P3-01)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.tsx`
- [ ] Render outer div with `data-testid="clientes-list-panel"` and class `w-[280px]`
- [ ] Call `useClientes()` hook inside the component
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — renders `nombre` (bold) and `nit`
- [ ] Render list of `ClientListItem` with `data-testid="cliente-list-item"` per item
- [ ] Add `data-testid`: `clientes-list-panel`, `cliente-list-item`
- [ ] Run test: `pnpm run test -- ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: Real-time search filter (TC-E2-P1-01, TC-E2-P1-02)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `useState<string>('')` for `searchQuery` in `ClienteListView`
- [ ] Add search `<input>` with `data-testid="clientes-search-input"` and Spanish placeholder
- [ ] Implement `useMemo` filter: `clients.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`
- [ ] Replace raw `clients` with `filtered` in list render
- [ ] Add `data-testid`: `clientes-search-input`
- [ ] Run test: `pnpm run test -- ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: EmptyState on empty list (TC-E2-P1-03)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create/verify `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string` prop
- [ ] Show `EmptyState` when `filtered.length === 0` AND `!isLoading` AND `!isError`
- [ ] Do NOT render an empty `<ul>` — render EmptyState instead
- [ ] Add `data-testid="empty-state"` to EmptyState container
- [ ] Spanish guidance message must contain "cliente"
- [ ] Run test: `pnpm run test -- ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: ErrorPanel on fetch failure + Reintentar (TC-E2-P1-04)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create/verify `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void` prop
- [ ] Show `ErrorPanel` when `isError === true`
- [ ] Pass `refetch` from `useClientes()` as `onRetry` prop
- [ ] Add `data-testid="error-panel"` to ErrorPanel container
- [ ] Render "Reintentar" button inside ErrorPanel
- [ ] Spanish error message: "No se pudo cargar la información"
- [ ] Run test: `pnpm run test -- ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Loading skeleton during fetch

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Import `Skeleton` from `react-loading-skeleton`
- [ ] Show `<div data-testid="clientes-loading-skeleton">` with Skeleton when `isLoading === true`
- [ ] Add `data-testid`: `clientes-loading-skeleton`
- [ ] Run test: `pnpm run test -- ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: 280px panel width class (TC-E2-P3-02)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Apply `className="w-[280px] h-full overflow-y-auto"` to `clientes-list-panel` div
- [ ] Run test: `pnpm run test -- ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: GET /api/v1/clientes API contract

**File:** `e2e/tests/api/clientes-list.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (verify from Story 1.3)
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` + `GetClientesQueryHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` with `GetAllAsync()`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — register `GET /api/v1/clientes`
- [ ] Ensure response is a direct `ClienteDto[]` array (no wrapper)
- [ ] Ensure field names serialize as camelCase JSON
- [ ] Ensure `DateTimeOffset` fields serialize with timezone
- [ ] Run test: `pnpm run test:e2e -- clientes-list.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: E2E — full user journey on /clientes

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] All component and API tasks above complete
- [ ] Wire `ClienteListView` into `frontend/src/routes/_app/clientes.tsx`
- [ ] Add `data-testid` attributes to all components as listed above
- [ ] Verify split-panel layout: left panel 280px + right panel `<Outlet />`
- [ ] Run test: `pnpm run test:e2e -- client-list-search.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all component + unit tests for Story 2.1
cd frontend && pnpm run test -- --reporter=verbose

# Run specific component test file
cd frontend && pnpm run test -- ClienteListView.test.tsx

# Run useClientes hook tests
cd frontend && pnpm run test -- useClientes.test.ts

# Run E2E tests for client list (requires both servers running)
pnpm run test:e2e -- client-list-search.spec.ts

# Run API-level tests only
pnpm run test:e2e -- clientes-list.api.spec.ts

# Run with headed browser (E2E only)
pnpm run test:e2e -- client-list-search.spec.ts --headed

# Run all Story 2.1 tests
cd frontend && pnpm run test && pnpm run test:e2e -- client-list-search.spec.ts clientes-list.api.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (42 total: 12 E2E + 9 API + 21 Component/Unit)
- ✅ Data factories created: `frontend/src/test/factories/cliente.factory.ts`
- ✅ Mock requirements documented (MSW + Playwright route intercept)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**
- All tests fail due to missing implementation (`ClienteListView`, `useClientes` hook, `GET /api/v1/clientes` endpoint)
- Failures are NOT due to test configuration errors
- Expected failure: `Cannot find module './ClienteListView'` and similar import errors

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with `useClientes` hook** (unblocks all component tests)
2. **Implement `ClienteListView`** basic render with list panel
3. **Add search state + useMemo filter** (unblocks TC-E2-P1-01, TC-E2-P1-02)
4. **Wire EmptyState** (unblocks TC-E2-P1-03)
5. **Wire ErrorPanel + Reintentar** (unblocks TC-E2-P1-04)
6. **Implement backend `GET /api/v1/clientes`** (unblocks API tests + E2E)
7. **Wire `ClienteListView` into route** (unblocks E2E tests)

**Key Principles:**

- One test at a time — run after each implementation step
- Anti-patterns to AVOID (from story Dev Notes):
  - Do NOT use `window.location.reload()` — use `refetch`
  - Do NOT assert English text — all visible text must be Spanish
  - Do NOT use `retry: true` in tests — fail fast

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green)
2. Check if `siesa-ui-kit` provides `EmptyState`, `ErrorPanel`, or `SearchInput` equivalents
3. Replace custom implementations with kit components if available (non-breaking API swap)
4. Run tests after each swap
5. Optimize `useMemo` if needed for > 500 client edge case

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `cd frontend && pnpm run test`
3. Begin implementation with `useClientes` hook (highest-value unblock)
4. Work one test at a time (red → green for each)
5. Check `siesa-ui-kit` BEFORE creating custom components (`EmptyState`, `ErrorPanel`, `SearchInput`)
6. When all tests pass, refactor code for quality
7. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception pattern: `page.route()` BEFORE `page.goto()` (all E2E tests)
- **fixture-architecture.md** — Playwright test.extend() for base.fixture.ts (clientesPage fixture)
- **data-factories.md** — Factory with overrides support and bulk generation (`createClientes(500)`)
- **component-tdd.md** — Vitest + RTL red-green-refactor, MSW 2+ for network mocking
- **test-quality.md** — One assertion per test, atomic design, Spanish text assertions, no hardcoded waits
- **selector-resilience.md** — `data-testid` selectors over CSS/text selectors throughout
- **timing-debugging.md** — `waitFor` and explicit waits over `sleep`; MSW `setupServer` lifecycle

---

**Generated by BMad TEA Agent** — 2026-05-29
